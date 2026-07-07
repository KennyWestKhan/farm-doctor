#!/usr/bin/env python3
"""
Build the Farm Doctor vendor directory from Complete Farmer's vendor database.

Pipeline:
  scripts/source/vendor-database.xlsx
      -> parse 10 category sheets (per-sheet column maps)
      -> merge duplicate vendors across sheets (one entity, many category tags)
      -> parse phone/email lists, classify WhatsApp-capable (mobile) numbers
      -> geocode addresses via OSM/Nominatim at build time (cached, region derived)
      -> emit:
           frontend/src/data/vendors.seed.json   (bundled offline baseline)
           supabase/vendors.sql                   (table + RLS + seed upserts)

Zero third-party deps: stdlib only (zipfile + xml + urllib). Geocode results are
cached in scripts/geocode-cache.json so re-runs don't re-hit Nominatim.

Run:  python3 scripts/build-vendors.py
"""

import json
import os
import re
import time
import zipfile
import urllib.parse
import urllib.request
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "scripts", "source", "vendor-database.xlsx")
CACHE = os.path.join(ROOT, "scripts", "geocode-cache.json")
OUT_JSON = os.path.join(ROOT, "frontend", "src", "data", "vendors.seed.json")
OUT_SQL = os.path.join(ROOT, "supabase", "vendors.sql")

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
UA = "farm-doctor-ghana/1.0 (crop-disease PWA; vendor geocode)"

# --- per-sheet column maps (0-based). Data starts at row index 4 on every sheet.
# key -> (category slug, {field: col}). Fields: name, contact, phone, email,
# location, and optionally crop / variety / services.
SHEETS = {
    "sheet1.xml":  ("agrochemicals", {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet2.xml":  ("fertilizer",    {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet3.xml":  ("seeds",         {"crop": 0, "name": 1, "variety": 2, "contact": 3, "phone": 4, "email": 5, "location": 6}),
    "sheet4.xml":  ("labour",        {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet5.xml":  ("tools",         {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet6.xml":  ("motor_vehicle", {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet7.xml":  ("mechanization", {"name": 0, "services": 1, "contact": 2, "phone": 3, "email": 4, "location": 5}),
    "sheet8.xml":  ("irrigation",    {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet9.xml":  ("drone_spraying",{"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
    "sheet10.xml": ("logistics",     {"name": 0, "contact": 1, "phone": 2, "email": 3, "location": 4}),
}

# Tools sheet has in-sheet section headers (a name cell, rest blank) that group
# the rows below them. We tag those as subcategories rather than treating them as vendors.
TOOLS_SECTIONS = {"tools", "protective equipment", "machinery & implements", "machinery and implements"}

# Propagation crop labels -> app crop ids (only where the app has the crop).
CROP_IDS = {
    "chilli pepper": "chilli", "chilli": "chilli", "ginger": "ginger",
    "sweet potato": "sweet_potato", "groundnut": "groundnut",
    "maize": "maize", "soybean": "soybean",
}

# Coarse area-keyword -> region fallback when Nominatim can't resolve a region.
AREA_REGION = {
    "kumasi": "ashanti", "kwadaso": "ashanti", "kajetia": "ashanti", "mampong": "ashanti", "ejisu": "ashanti",
    "tamale": "northern",
    "tema": "greater_accra", "accra": "greater_accra", "spintex": "greater_accra", "madina": "greater_accra",
    "legon": "greater_accra", "dzorwulu": "greater_accra", "achimota": "greater_accra", "cantonment": "greater_accra",
    "cantoment": "greater_accra", "labone": "greater_accra", "airport": "greater_accra", "ridge": "greater_accra",
    "haatso": "greater_accra", "dome": "greater_accra", "ashaiman": "greater_accra", "dansoman": "greater_accra",
    "abelenkpe": "greater_accra", "roman ridge": "greater_accra", "west legon": "greater_accra",
    "east legon": "greater_accra", "la": "greater_accra", "circle": "greater_accra", "afram plains": "eastern",
    "asutsuare": "greater_accra", "asustaure": "greater_accra", "techiman": "bono_east",
    "mampong ashanti": "ashanti", "agbogba": "greater_accra", "ashonman": "greater_accra",
    "ashongman": "greater_accra", "industrial area": "greater_accra", "nyaho": "greater_accra",
    "abodu": "greater_accra", "north industrial": "greater_accra", "haatso": "greater_accra",
}


# ---------------------------------------------------------------- xlsx parsing
def col_index(ref):
    letters = "".join(ch for ch in ref if ch.isalpha())
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def load_shared_strings(z):
    ss = []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in root.findall(f"{NS}si"):
        ss.append("".join(t.text or "" for t in si.iter(f"{NS}t")))
    return ss


def read_sheet(z, path, ss):
    root = ET.fromstring(z.read(path))
    rows = []
    for row in root.iter(f"{NS}row"):
        cells, maxc = {}, -1
        for c in row.findall(f"{NS}c"):
            ci = col_index(c.get("r"))
            maxc = max(maxc, ci)
            t = c.get("t")
            v = c.find(f"{NS}v")
            isc = c.find(f"{NS}is")
            val = ""
            if t == "s" and v is not None:
                val = ss[int(v.text)]
            elif isc is not None:
                val = "".join(x.text or "" for x in isc.iter(f"{NS}t"))
            elif v is not None:
                val = v.text or ""
            cells[ci] = val
        rows.append([cells.get(i, "") for i in range(maxc + 1)])
    return rows


# ------------------------------------------------------------- field cleaners
def clean(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s


def norm_key(name):
    return re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()


def parse_phones(raw):
    """Return (all_phones, whatsapp) as +233XXXXXXXXX. Mobile (national number
    starting 2 or 5) is WhatsApp-capable; landline (starting 3) is call-only."""
    phones, wa = [], []
    for tok in re.split(r"\s+", raw or ""):
        digits = re.sub(r"\D", "", tok)
        if not digits:
            continue
        if digits.startswith("233"):
            national = digits[3:]
        elif digits.startswith("0"):
            national = digits[1:]
        else:
            national = digits
        if len(national) == 10 and national.startswith("0"):
            national = national[1:]
        if len(national) != 9:
            continue
        num = "+233" + national
        if num not in phones:
            phones.append(num)
            if national[0] in ("2", "5"):
                wa.append(num)
    return phones, wa


def parse_emails(raw):
    return [e.lower() for e in re.split(r"\s+", raw or "") if "@" in e]


# ---------------------------------------------------------------- geocoding
def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE, "w") as f:
        json.dump(cache, f, indent=2, sort_keys=True)


def norm_region(state):
    if not state:
        return None
    s = state.lower().replace(" region", "").strip()
    return re.sub(r"\s+", "_", s)


def region_from_area(text):
    low = (text or "").lower()
    for kw, region in AREA_REGION.items():
        if kw in low:
            return region
    return None


def geocode(query, cache):
    """Return {'lat','lng','region'} for an address string, cached."""
    if query in cache:
        return cache[query]
    params = urllib.parse.urlencode({
        "q": query, "format": "json", "limit": 1,
        "addressdetails": 1, "countrycodes": "gh",
    })
    url = f"{NOMINATIM}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    result = None
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.load(resp)
        if data:
            top = data[0]
            result = {
                "lat": round(float(top["lat"]), 5),
                "lng": round(float(top["lon"]), 5),
                "region": norm_region((top.get("address") or {}).get("state")),
            }
    except Exception as e:
        print(f"    ! geocode failed for {query!r}: {e}")
    cache[query] = result
    save_cache(cache)
    time.sleep(1.1)  # Nominatim usage policy: max ~1 req/sec
    return result


# ---------------------------------------------------------------- main build
def build():
    z = zipfile.ZipFile(XLSX)
    ss = load_shared_strings(z)
    vendors = {}   # key -> record
    order = []

    def get(record_row, cols, field):
        idx = cols.get(field)
        if idx is None or idx >= len(record_row):
            return ""
        return clean(record_row[idx])

    for sheet, (category, cols) in SHEETS.items():
        rows = read_sheet(z, f"xl/worksheets/{sheet}", ss)[4:]
        current_crop = ""
        current_subcat = ""
        last_key = None
        for row in rows:
            if not any(str(c).strip() for c in row):
                continue
            name = get(row, cols, "name")

            # Tools sheet section headers (name set, everything else blank)
            if category == "tools" and name and name.lower() in TOOLS_SECTIONS \
               and not get(row, cols, "phone") and not get(row, cols, "location"):
                current_subcat = name.lower()
                continue

            if "crop" in cols:
                crop_cell = get(row, cols, "crop")
                if crop_cell:
                    current_crop = crop_cell

            phones, wa = parse_phones(get(row, cols, "phone"))
            emails = parse_emails(get(row, cols, "email"))
            contact = get(row, cols, "contact")

            # Continuation row (no vendor name but has a contact/phone): attach
            # the extra contact/phone to the previous vendor.
            if not name:
                if last_key and (phones or contact):
                    rec = vendors[last_key]
                    for p in phones:
                        if p not in rec["phones"]:
                            rec["phones"].append(p)
                    for p in wa:
                        if p not in rec["whatsapp"]:
                            rec["whatsapp"].append(p)
                    if contact and not rec["contactPerson"]:
                        rec["contactPerson"] = contact
                continue

            key = norm_key(name)
            last_key = key
            if key not in vendors:
                vendors[key] = {
                    "id": slugify(name),
                    "name": name,
                    "contactPerson": contact or None,
                    "phones": list(phones),
                    "whatsapp": list(wa),
                    "emails": list(emails),
                    "categories": [],
                    "subcategories": [],
                    "crops": [],
                    "services": [],
                    "addressText": get(row, cols, "location") or None,
                    "area": None,
                    "region": None,
                    "lat": None,
                    "lng": None,
                    "source": "complete-farmer-db",
                }
                order.append(key)
            rec = vendors[key]

            if category not in rec["categories"]:
                rec["categories"].append(category)
            if category == "tools" and current_subcat and current_subcat not in rec["subcategories"]:
                rec["subcategories"].append(current_subcat)

            # merge contacts
            if not rec["contactPerson"] and contact:
                rec["contactPerson"] = contact
            for p in phones:
                if p not in rec["phones"]:
                    rec["phones"].append(p)
            for p in wa:
                if p not in rec["whatsapp"]:
                    rec["whatsapp"].append(p)
            for e in emails:
                if e not in rec["emails"]:
                    rec["emails"].append(e)
            if not rec["addressText"] and get(row, cols, "location"):
                rec["addressText"] = get(row, cols, "location")

            # seeds -> crop tag
            if category == "seeds" and current_crop:
                cid = CROP_IDS.get(current_crop.lower())
                tag = cid or slugify(current_crop)
                if tag not in rec["crops"]:
                    rec["crops"].append(tag)

            # mechanization -> services list
            if "services" in cols:
                svc = get(row, cols, "services")
                for s in [x.strip() for x in svc.split(",") if x.strip()]:
                    if s not in rec["services"]:
                        rec["services"].append(s)

    # ---- geocode + region
    cache = load_cache()
    records = [vendors[k] for k in order]
    print(f"Parsed {len(records)} unique vendors. Geocoding addresses...")
    for i, rec in enumerate(records, 1):
        addr = rec["addressText"]
        geo = None
        if addr:
            geo = geocode(f"{addr}, Ghana", cache)
            if not geo:  # fall back to a known area keyword within the address
                area_kw = next((kw for kw in AREA_REGION if kw in addr.lower()), None)
                if area_kw:
                    geo = geocode(f"{area_kw}, Ghana", cache)
        if geo:
            rec["lat"], rec["lng"] = geo["lat"], geo["lng"]
            rec["region"] = geo["region"] or region_from_area(addr)
        else:
            rec["region"] = region_from_area(addr)
        rec["area"] = next((kw for kw in AREA_REGION if addr and kw in addr.lower()), None)
        print(f"  [{i}/{len(records)}] {rec['name'][:40]:40}  region={rec['region']}  ({rec['lat']},{rec['lng']})")

    # ---- emit JSON (REDACTED — committed + bundled into the public app)
    # The bundled seed drops the most personal fields (contact person + emails);
    # those live only in the Supabase table (from the gitignored SQL) and reach
    # the app at runtime. The offline baseline still has business name, phones,
    # categories and location so Shops works fully offline on first load.
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    reduced = []
    for r in records:
        x = dict(r)
        x["contactPerson"] = None
        x["emails"] = []
        reduced.append(x)
    with open(OUT_JSON, "w") as f:
        json.dump(reduced, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {OUT_JSON} ({len(reduced)} vendors, redacted: no contactPerson/emails)")

    # ---- emit SQL (FULL — gitignored; run against Supabase)
    write_sql(records)
    print(f"Wrote {OUT_SQL} (full records incl. contactPerson + emails)")

    # ---- coverage summary
    summarize(records)


def sql_str(s):
    if s is None:
        return "null"
    return "'" + s.replace("'", "''") + "'"


def sql_arr(a):
    if not a:
        return "'{}'"
    inner = ",".join('"' + x.replace('"', '\\"').replace("'", "''") + '"' for x in a)
    return "'{" + inner + "}'"


def sql_num(n):
    return "null" if n is None else str(n)


def write_sql(records):
    os.makedirs(os.path.dirname(OUT_SQL), exist_ok=True)
    lines = [
        "-- Farm Doctor vendor directory — generated by scripts/build-vendors.py",
        "-- Source: Complete Farmer Ltd vendor database. Do not edit by hand; re-run the script.",
        "",
        "create table if not exists public.vendors (",
        "  id             text primary key,",
        "  name           text not null,",
        "  contact_person text,",
        "  phones         text[] not null default '{}',",
        "  whatsapp       text[] not null default '{}',",
        "  emails         text[] not null default '{}',",
        "  categories     text[] not null default '{}',",
        "  subcategories  text[] not null default '{}',",
        "  crops          text[] not null default '{}',",
        "  services       text[] not null default '{}',",
        "  address_text   text,",
        "  area           text,",
        "  region         text,",
        "  lat            double precision,",
        "  lng            double precision,",
        "  source         text not null default 'complete-farmer-db',",
        "  updated_at     timestamptz not null default now()",
        ");",
        "",
        "alter table public.vendors enable row level security;",
        "drop policy if exists \"public read vendors\" on public.vendors;",
        "create policy \"public read vendors\" on public.vendors for select using (true);",
        "",
        "insert into public.vendors",
        "  (id, name, contact_person, phones, whatsapp, emails, categories, subcategories, crops, services, address_text, area, region, lat, lng)",
        "values",
    ]
    rowsql = []
    for r in records:
        rowsql.append(
            "  (" + ", ".join([
                sql_str(r["id"]), sql_str(r["name"]), sql_str(r["contactPerson"]),
                sql_arr(r["phones"]), sql_arr(r["whatsapp"]), sql_arr(r["emails"]),
                sql_arr(r["categories"]), sql_arr(r["subcategories"]), sql_arr(r["crops"]),
                sql_arr(r["services"]), sql_str(r["addressText"]), sql_str(r["area"]),
                sql_str(r["region"]), sql_num(r["lat"]), sql_num(r["lng"]),
            ]) + ")"
        )
    lines.append(",\n".join(rowsql))
    lines.append("on conflict (id) do update set")
    for col in ["name", "contact_person", "phones", "whatsapp", "emails", "categories",
                "subcategories", "crops", "services", "address_text", "area", "region", "lat", "lng"]:
        lines.append(f"  {col} = excluded.{col},")
    lines.append("  updated_at = now();")
    with open(OUT_SQL, "w") as f:
        f.write("\n".join(lines) + "\n")


def summarize(records):
    from collections import Counter
    cats = Counter(c for r in records for c in r["categories"])
    regs = Counter(r["region"] or "UNKNOWN" for r in records)
    no_geo = [r["name"] for r in records if r["lat"] is None]
    print("\n--- coverage ---")
    print("by category:", dict(cats))
    print("by region:  ", dict(regs))
    print(f"no coordinates: {len(no_geo)}", no_geo if no_geo else "")


if __name__ == "__main__":
    build()

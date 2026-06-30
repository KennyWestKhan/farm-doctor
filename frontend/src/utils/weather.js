/**
 * Spray-timing advice via Open-Meteo — free, no API key, no account.
 * https://open-meteo.com/en/docs
 *
 * One representative coordinate per region is enough: spray timing only
 * needs "is it raining soon / is it hot right now", not farm-precise weather.
 */
const REGION_COORDS = {
  ashanti: { lat: 6.6885, lon: -1.6244 }, // Kumasi
  greater_accra: { lat: 5.6037, lon: -0.187 }, // Accra
  western: { lat: 4.9047, lon: -1.7956 }, // Sekondi-Takoradi
  western_north: { lat: 6.2065, lon: -2.4855 }, // Sefwi Wiawso
  central: { lat: 5.1053, lon: -1.2466 }, // Cape Coast
  eastern: { lat: 6.0941, lon: -0.2591 }, // Koforidua
  volta: { lat: 6.6017, lon: 0.4714 }, // Ho
  oti: { lat: 8.0667, lon: 0.1833 }, // Dambai
  northern: { lat: 9.4035, lon: -0.8393 }, // Tamale
  north_east: { lat: 10.5167, lon: -0.3667 }, // Nalerigu
  savannah: { lat: 9.0833, lon: -1.8167 }, // Damongo
  upper_east: { lat: 10.7856, lon: -0.8514 }, // Bolgatanga
  upper_west: { lat: 10.0601, lon: -2.5099 }, // Wa
  bono: { lat: 7.3349, lon: -2.3123 }, // Sunyani
  bono_east: { lat: 7.5833, lon: -1.9333 }, // Techiman
  ahafo: { lat: 6.8024, lon: -2.517 }, // Goaso
};

const HOT_THRESHOLD_C = 32;
const RAIN_PROB_THRESHOLD = 50;

/** Fetches the next ~24h of hourly forecast for a region. Throws on network/API failure. */
async function fetchHourlyForecast(region) {
  const coords = REGION_COORDS[region];
  if (!coords) return null;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,precipitation_probability&forecast_days=2&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

/**
 * Boils the raw forecast down to the few facts the UI needs: is it hot right
 * now, and is rain likely in the next 6 hours. Returns null if data unusable.
 */
function summarizeForecast(data) {
  const times = data?.hourly?.time;
  const temps = data?.hourly?.temperature_2m;
  const rainProbs = data?.hourly?.precipitation_probability;
  if (!times?.length) return null;

  const now = Date.now();
  const nowIdx = times.findIndex((t) => new Date(t).getTime() >= now);
  const idx = nowIdx === -1 ? 0 : nowIdx;

  const currentTemp = temps?.[idx];
  const next6h = rainProbs?.slice(idx, idx + 6) ?? [];
  const rainSoon = next6h.some((p) => p >= RAIN_PROB_THRESHOLD);
  const hotNow = typeof currentTemp === 'number' && currentTemp >= HOT_THRESHOLD_C;
  const hour = new Date(times[idx]).getHours();
  const coolWindow = hour < 9 || hour >= 16;

  return { rainSoon, hotNow, coolWindow };
}

/**
 * Returns a spray-timing verdict for the region: one of
 * 'rain_soon' | 'hot_now' | 'good_now' | 'ok_later', or null if the
 * forecast couldn't be fetched (caller should fall back to static advice).
 */
export async function getSprayAdvice(region) {
  if (!navigator.onLine) return null;
  try {
    const data = await fetchHourlyForecast(region);
    const summary = summarizeForecast(data);
    if (!summary) return null;

    if (summary.rainSoon) return 'rain_soon';
    if (summary.hotNow) return 'hot_now';
    if (summary.coolWindow) return 'good_now';
    return 'ok_later';
  } catch {
    return null;
  }
}

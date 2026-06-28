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
  volta: { lat: 6.6017, lon: 0.4714 }, // Ho
  northern: { lat: 9.4035, lon: -0.8393 }, // Tamale
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

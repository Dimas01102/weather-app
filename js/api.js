const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REQUEST_TIMEOUT_MS = 9000;
const MAX_RETRIES = 2;

class ApiError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'ApiError';
    this.type = type; // 'network' | 'timeout' | 'server' | 'not_found' | 'rate_limit'
  }
}

function buildQuery(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function requestJSON(url, { retries = MAX_RETRIES } = {}) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

      if (res.status === 429) {
        throw new ApiError('Too many requests', 'rate_limit');
      }
      if (res.status === 404) {
        throw new ApiError('Not found', 'not_found');
      }
      if (!res.ok) {
        throw new ApiError(`Server responded ${res.status}`, 'server');
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      const isAbort = err.name === 'AbortError';
      const isRetryable = isAbort || err.type === 'server' || err.name === 'TypeError';
      if (!isRetryable || attempt === retries) break;
      // simple backoff before retrying
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      attempt += 1;
      continue;
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new ApiError('Request timed out', 'timeout');
  }
  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError('Network request failed', 'network');
}

export const api = {
  ApiError,

  /**
   * Fetch current + hourly + daily weather for a coordinate.
   */
  async getWeather(lat, lon, { tempUnit = 'C', windUnit = 'kmh' } = {}) {
    const query = buildQuery({
      latitude: lat,
      longitude: lon,
      timezone: 'auto',
      temperature_unit: tempUnit === 'F' ? 'fahrenheit' : 'celsius',
      wind_speed_unit: windUnit === 'mph' ? 'mph' : 'kmh',
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'is_day', 'precipitation', 'weather_code', 'pressure_msl',
        'wind_speed_10m', 'wind_direction_10m',
      ].join(','),
      hourly: [
        'temperature_2m', 'precipitation_probability', 'weather_code',
        'visibility', 'uv_index', 'is_day',
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'precipitation_probability_max', 'sunrise', 'sunset', 'uv_index_max',
      ].join(','),
      forecast_days: 8,
      past_days: 0,
    });

    return requestJSON(`${FORECAST_URL}?${query}`);
  },

  /**
   * Search cities/regions/countries by free-text name.
   */
  async searchLocations(name, { count = 8 } = {}) {
    const query = buildQuery({ name, count, language: 'en', format: 'json' });
    const data = await requestJSON(`${GEOCODE_URL}?${query}`, { retries: 1 });
    return data.results || [];
  },

  /**
   * Reverse-ish helper: Open-Meteo geocoding has no reverse endpoint, so for
   * geolocation we label the point using the nearest search-by-name result
   * when possible, and otherwise fall back to raw coordinates in weather.js.
   */
};
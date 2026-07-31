const WMO_TABLE = {
  0:  { label: 'Clear',            group: 'clear',    day: 'clear-day',           night: 'clear-night' },
  1:  { label: 'Mostly Clear',     group: 'clear',    day: 'clear-day',           night: 'clear-night' },
  2:  { label: 'Partly Cloudy',    group: 'cloudy',   day: 'partly-cloudy-day',   night: 'partly-cloudy-night' },
  3:  { label: 'Overcast',         group: 'overcast', day: 'overcast',            night: 'overcast' },
  45: { label: 'Fog',              group: 'fog',       day: 'fog',                 night: 'fog' },
  48: { label: 'Rime Fog',         group: 'fog',       day: 'fog',                 night: 'fog' },
  51: { label: 'Light Drizzle',    group: 'rain',      day: 'drizzle',             night: 'drizzle' },
  53: { label: 'Drizzle',          group: 'rain',      day: 'drizzle',             night: 'drizzle' },
  55: { label: 'Dense Drizzle',    group: 'rain',      day: 'drizzle',             night: 'drizzle' },
  56: { label: 'Freezing Drizzle', group: 'rain',      day: 'drizzle',             night: 'drizzle' },
  57: { label: 'Freezing Drizzle', group: 'rain',      day: 'drizzle',             night: 'drizzle' },
  61: { label: 'Light Rain',       group: 'rain',      day: 'rain',                night: 'rain' },
  63: { label: 'Rain',             group: 'rain',      day: 'rain',                night: 'rain' },
  65: { label: 'Heavy Rain',       group: 'rain',      day: 'heavy-rain',          night: 'heavy-rain' },
  66: { label: 'Freezing Rain',    group: 'rain',      day: 'heavy-rain',          night: 'heavy-rain' },
  67: { label: 'Freezing Rain',    group: 'rain',      day: 'heavy-rain',          night: 'heavy-rain' },
  71: { label: 'Light Snow',       group: 'snow',      day: 'snow',                night: 'snow' },
  73: { label: 'Snow',             group: 'snow',      day: 'snow',                night: 'snow' },
  75: { label: 'Heavy Snow',       group: 'snow',      day: 'snow',                night: 'snow' },
  77: { label: 'Snow Grains',      group: 'snow',      day: 'snow',                night: 'snow' },
  80: { label: 'Light Showers',    group: 'rain',      day: 'rain',                night: 'rain' },
  81: { label: 'Showers',          group: 'rain',      day: 'rain',                night: 'rain' },
  82: { label: 'Heavy Showers',    group: 'rain',      day: 'heavy-rain',          night: 'heavy-rain' },
  85: { label: 'Snow Showers',     group: 'snow',      day: 'snow',                night: 'snow' },
  86: { label: 'Heavy Snow Showers', group: 'snow',    day: 'snow',                night: 'snow' },
  95: { label: 'Thunderstorm',     group: 'storm',     day: 'thunderstorm',        night: 'thunderstorm' },
  96: { label: 'Thunderstorm w/ Hail', group: 'storm', day: 'thunderstorm',        night: 'thunderstorm' },
  99: { label: 'Severe Thunderstorm', group: 'storm',  day: 'thunderstorm',        night: 'thunderstorm' },
};

const WIND_UNIT_LABEL = { kmh: 'km/h', mph: 'mph' };

function lookupCondition(code) {
  return WMO_TABLE[code] || WMO_TABLE[3];
}

function windDirectionLabel(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx];
}

function uvBand(uv) {
  if (uv == null) return '';
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

function formatHour(isoString, timezone) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatClock(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDayLabel(isoDate, index) {
  if (index === 0) return 'Today';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export const weather = {
  lookupCondition,
  uvBand,

  /**
   * Build the current-conditions view model.
   */
  buildCurrent(raw, { windUnit }) {
    const c = raw.current;
    const daily = raw.daily;
    const cond = lookupCondition(c.weather_code);
    const isDay = c.is_day === 1;

    // visibility & uv come from hourly at the closest matching hour
    const hourIdx = weather._closestHourIndex(raw);
    const visibilityMeters = raw.hourly?.visibility?.[hourIdx];
    const uv = raw.hourly?.uv_index?.[hourIdx];
    const pop = raw.hourly?.precipitation_probability?.[hourIdx];

    return {
      tempRounded: Math.round(c.temperature_2m),
      feelsLikeRounded: Math.round(c.apparent_temperature),
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      conditionLabel: cond.label,
      conditionGroup: cond.group,
      iconKey: isDay ? cond.day : cond.night,
      isDay,
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      windUnitLabel: WIND_UNIT_LABEL[windUnit] || 'km/h',
      windDirection: windDirectionLabel(c.wind_direction_10m),
      pressure: Math.round(c.pressure_msl),
      visibilityKm: visibilityMeters != null ? Math.round(visibilityMeters / 1000) : null,
      uv: uv != null ? Math.round(uv * 10) / 10 : null,
      uvBand: uvBand(uv),
      precipitationProbability: pop != null ? Math.round(pop) : Math.round(c.precipitation > 0 ? 100 : 0),
      sunrise: daily.sunrise[0],
      sunset: daily.sunset[0],
    };
  },

  _closestHourIndex(raw) {
    const now = new Date(raw.current.time).getTime();
    const times = raw.hourly.time;
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - now);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    return best;
  },

  /**
   * Build the next N hours (default 24) starting from the current hour.
   */
  buildHourly(raw, count = 24) {
    const startIdx = weather._closestHourIndex(raw);
    const { time, temperature_2m, precipitation_probability, weather_code, is_day } = raw.hourly;
    const out = [];
    for (let i = startIdx; i < Math.min(startIdx + count, time.length); i++) {
      const cond = lookupCondition(weather_code[i]);
      out.push({
        label: i === startIdx ? 'Now' : formatHour(time[i]),
        temp: Math.round(temperature_2m[i]),
        pop: Math.round(precipitation_probability[i] ?? 0),
        iconKey: is_day[i] === 1 ? cond.day : cond.night,
      });
    }
    return out;
  },

  /**
   * Build the daily forecast (defaults to 7 days).
   */
  buildDaily(raw, count = 7) {
    const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = raw.daily;
    const out = [];
    for (let i = 0; i < Math.min(count, time.length); i++) {
      const cond = lookupCondition(weather_code[i]);
      out.push({
        dayLabel: formatDayLabel(time[i], i),
        iconKey: cond.day,
        conditionLabel: cond.label,
        high: Math.round(temperature_2m_max[i]),
        low: Math.round(temperature_2m_min[i]),
        pop: Math.round(precipitation_probability_max[i] ?? 0),
      });
    }
    return out;
  },

  /**
   * Sunrise/sunset arc progress. Returns fraction [0,1] of daylight elapsed,
   * clamped, plus whether "now" currently falls between sunrise and sunset.
   */
  buildSunProgress(sunriseIso, sunsetIso) {
    const now = Date.now();
    const sunrise = new Date(sunriseIso).getTime();
    const sunset = new Date(sunsetIso).getTime();
    const span = sunset - sunrise;
    const elapsed = now - sunrise;
    const fraction = span > 0 ? Math.min(1, Math.max(0, elapsed / span)) : 0;
    return {
      fraction,
      isDaytime: now >= sunrise && now <= sunset,
      sunriseLabel: formatClock(sunriseIso),
      sunsetLabel: formatClock(sunsetIso),
    };
  },

  formatUpdatedTime(isoString) {
    return new Date(isoString).getTime();
  },
};
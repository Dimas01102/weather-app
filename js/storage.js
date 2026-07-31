const KEYS = {
  tempUnit: 'skyline:tempUnit',
  windUnit: 'skyline:windUnit',
  theme: 'skyline:theme',
  favorites: 'skyline:favorites',
  recent: 'skyline:recent',
  lastLocation: 'skyline:lastLocation',
  lastWeather: 'skyline:lastWeather',
};

const MAX_RECENT = 6;

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeGetJSON(key, fallback) {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const storage = {
  // Units 
  getTempUnit() {
    return safeGet(KEYS.tempUnit) || 'C';
  },
  setTempUnit(unit) {
    safeSet(KEYS.tempUnit, unit);
  },
  getWindUnit() {
    return safeGet(KEYS.windUnit) || 'kmh';
  },
  setWindUnit(unit) {
    safeSet(KEYS.windUnit, unit);
  },

  // Theme 
  getTheme() {
    return safeGet(KEYS.theme) || 'system';
  },
  setTheme(theme) {
    safeSet(KEYS.theme, theme);
  },

  // Favorites 
  getFavorites() {
    return safeGetJSON(KEYS.favorites, []);
  },
  setFavorites(list) {
    safeSet(KEYS.favorites, JSON.stringify(list));
  },
  addFavorite(place) {
    const list = storage.getFavorites();
    if (list.some((p) => p.id === place.id)) return list;
    const next = [...list, place].slice(0, 12);
    storage.setFavorites(next);
    return next;
  },
  removeFavorite(id) {
    const next = storage.getFavorites().filter((p) => p.id !== id);
    storage.setFavorites(next);
    return next;
  },
  isFavorite(id) {
    return storage.getFavorites().some((p) => p.id === id);
  },

  // Recent searches 
  getRecent() {
    return safeGetJSON(KEYS.recent, []);
  },
  addRecent(place) {
    const list = storage.getRecent().filter((p) => p.id !== place.id);
    list.unshift(place);
    const next = list.slice(0, MAX_RECENT);
    safeSet(KEYS.recent, JSON.stringify(next));
    return next;
  },
  clearRecent() {
    safeSet(KEYS.recent, JSON.stringify([]));
  },

  // Last location / offline cache 
  getLastLocation() {
    return safeGetJSON(KEYS.lastLocation, null);
  },
  setLastLocation(place) {
    safeSet(KEYS.lastLocation, JSON.stringify(place));
  },
  getLastWeather() {
    return safeGetJSON(KEYS.lastWeather, null);
  },
  setLastWeather(placeId, data) {
    safeSet(KEYS.lastWeather, JSON.stringify({ placeId, data, savedAt: Date.now() }));
  },
};
import { api } from './api.js';
import { weather } from './weather.js';
import { location as geo } from './location.js';
import { storage } from './storage.js';
import { ui } from './ui.js';
import { createSearchController } from './search.js';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const RELATIVE_LABEL_TICK_MS = 30 * 1000;

const DEFAULT_PLACE = {
  id: 'default-jakarta',
  name: 'Jakarta',
  admin1: 'Jakarta',
  country: 'Indonesia',
  latitude: -6.2088,
  longitude: 106.8456,
};

const state = {
  place: null,
  lastRaw: null,
  lastFetchedAt: null,
  refreshIntervalId: null,
  relativeTickId: null,
  isFetching: false,
};

// ---------------------------------------------------------------- helpers

function relativeTimeLabel(fromMs) {
  const diffSec = Math.round((Date.now() - fromMs) / 1000);
  if (diffSec < 45) return 'Updated just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `Updated ${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.round(diffMin / 60);
  return `Updated ${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
}

function locationLabel(place, raw) {
  if (place.id.startsWith('geo:') && raw?.timezone?.includes('/')) {
    const city = raw.timezone.split('/').pop().replace(/_/g, ' ');
    return `${city} (Current Location)`;
  }
  const meta = [place.admin1, place.country].filter((p) => p && p !== place.name).join(', ');
  return meta ? `${place.name}, ${meta}` : place.name;
}

function currentUnits() {
  return { tempUnit: storage.getTempUnit(), windUnit: storage.getWindUnit() };
}

function startRelativeTicker() {
  clearInterval(state.relativeTickId);
  state.relativeTickId = setInterval(() => {
    if (state.lastFetchedAt) ui.setUpdatedLabel(relativeTimeLabel(state.lastFetchedAt));
  }, RELATIVE_LABEL_TICK_MS);
}

function startAutoRefresh() {
  clearInterval(state.refreshIntervalId);
  state.refreshIntervalId = setInterval(() => {
    if (document.visibilityState === 'visible' && state.place) {
      loadWeather(state.place, { silent: true });
    }
  }, REFRESH_INTERVAL_MS);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.place && state.lastFetchedAt) {
    const staleMs = Date.now() - state.lastFetchedAt;
    if (staleMs > REFRESH_INTERVAL_MS) loadWeather(state.place, { silent: true });
  }
});

// ---------------------------------------------------------------- core load

async function loadWeather(place, { isManual = false, silent = false } = {}) {
  if (state.isFetching) return;
  state.isFetching = true;
  state.place = place;

  if (isManual) ui.setRefreshing(true);
  if (!silent && !isManual) ui.showLoadingState();
  ui.hideStatus();

  try {
    const raw = await api.getWeather(place.latitude, place.longitude, currentUnits());
    state.lastRaw = raw;
    state.lastFetchedAt = Date.now();

    renderAll(place, raw);
    storage.setLastLocation(place);
    storage.setLastWeather(place.id, raw);
    startAutoRefresh();
  } catch (err) {
    handleLoadError(place, err);
  } finally {
    state.isFetching = false;
    ui.setRefreshing(false);
  }
}

function renderAll(place, raw) {
  const currentVm = weather.buildCurrent(raw, currentUnits());
  const hourlyVm = weather.buildHourly(raw);
  const dailyVm = weather.buildDaily(raw);
  const sunVm = weather.buildSunProgress(currentVm.sunrise, currentVm.sunset);

  ui.hideLoadingState();
  ui.renderCurrent(currentVm, locationLabel(place, raw));
  ui.renderHourly(hourlyVm);
  ui.renderDaily(dailyVm);
  ui.renderSun(sunVm);
  ui.setFavoriteState(storage.isFavorite(place.id));
  ui.setUpdatedLabel(relativeTimeLabel(state.lastFetchedAt));
  startRelativeTicker();
  refreshFavoritesStrip();
}

function handleLoadError(place, err) {
  const cached = storage.getLastWeather();
  const type = err?.type || 'network';

  const messages = {
    timeout: ['Request timed out.', 'The weather service took too long to respond.'],
    rate_limit: ['Too many requests.', 'Please wait a moment before trying again.'],
    not_found: ['Location not found.', 'Try searching for a nearby major city instead.'],
    server: ['Weather service unavailable.', 'The provider returned an error. Please try again shortly.'],
    network: ['Unable to load weather data.', 'Please check your connection and try again.'],
  };
  const [title, desc] = messages[type] || messages.network;

  if (cached && cached.placeId === place.id) {
    renderAll(place, cached.data);
    const ago = relativeTimeLabel(cached.savedAt);
    ui.showStatus(
      'Unable to fetch the latest weather.',
      `Showing the last available data. Last available update: ${ago.replace('Updated ', '')}.`
    );
    ui.setUpdatedLabel(ago.replace('Updated', 'Last available'));
  } else {
    ui.hideLoadingState();
    ui.showStatus(title, desc);
  }
}

// favorites / recent

function refreshFavoritesStrip() {
  const favorites = storage.getFavorites();
  ui.renderFavorites(favorites, state.place?.id, {
    onSelect: (place) => loadWeather(place),
    onRemove: (id) => {
      storage.removeFavorite(id);
      refreshFavoritesStrip();
      if (state.place?.id === id) ui.setFavoriteState(false);
    },
  });
}

function refreshRecentList() {
  ui.renderRecent(storage.getRecent(), {
    onSelect: (place) => loadWeather(place),
  });
}

// settings wiring

function initSegmented(root, settingKey, currentValue, onChange) {
  const group = root.querySelector(`.segmented[data-setting="${settingKey}"]`);
  if (!group) return;
  group.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === currentValue);
    btn.addEventListener('click', () => {
      group.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.value);
    });
  });
}

function initSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const btn = document.getElementById('settings-btn');

  initSegmented(panel, 'tempUnit', storage.getTempUnit(), (val) => {
    storage.setTempUnit(val);
    if (state.place) loadWeather(state.place, { silent: true });
  });
  initSegmented(panel, 'windUnit', storage.getWindUnit(), (val) => {
    storage.setWindUnit(val);
    if (state.place) loadWeather(state.place, { silent: true });
  });
  initSegmented(panel, 'theme', storage.getTheme(), (val) => {
    storage.setTheme(val);
    ui.applyTheme(val);
  });

  btn.addEventListener('click', () => {
    const isHidden = panel.hidden;
    panel.hidden = !isHidden;
    btn.setAttribute('aria-expanded', String(isHidden));
  });

  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

// search / locate / favorite buttons

function initSearch() {
  createSearchController({
    inputEl: document.getElementById('search-input'),
    resultsEl: document.getElementById('search-results'),
    clearBtnEl: document.getElementById('clear-search'),
    onSelect: (place) => {
      storage.addRecent(place);
      refreshRecentList();
      loadWeather(place);
    },
  });
}

function initLocateButton() {
  document.getElementById('locate-btn').addEventListener('click', async () => {
    ui.setLocating(true);
    try {
      const coords = await geo.getCurrentPosition();
      const place = {
        id: `geo:${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`,
        name: 'Current Location',
        admin1: '',
        country: '',
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      await loadWeather(place);
    } catch (err) {
      const messages = {
        denied: ['Location permission denied.', 'Search for a city instead, or enable location access in your browser.'],
        unsupported: ['Location not supported.', 'Your browser does not support geolocation. Try searching for a city.'],
        unavailable: ['Location unavailable.', 'We could not determine your position. Try searching for a city.'],
        timeout: ['Location request timed out.', 'Try again, or search for a city instead.'],
      };
      const [title, desc] = messages[err.type] || messages.unavailable;
      ui.showStatus(title, desc);
    } finally {
      ui.setLocating(false);
    }
  });
}

function initRefreshButton() {
  document.getElementById('refresh-btn').addEventListener('click', () => {
    if (state.place) loadWeather(state.place, { isManual: true });
  });
}

function initClearRecentButton() {
  const btn = document.getElementById('clear-recent');
  if (!btn) return;
  btn.addEventListener('click', () => {
    storage.clearRecent();
    refreshRecentList();
  });
}

function initRetryButton() {
  document.getElementById('retry-btn').addEventListener('click', () => {
    if (state.place) loadWeather(state.place);
  });
}

function initFavoriteToggle() {
  document.getElementById('favorite-toggle').addEventListener('click', () => {
    if (!state.place) return;
    const isFav = storage.isFavorite(state.place.id);
    if (isFav) {
      storage.removeFavorite(state.place.id);
      ui.setFavoriteState(false);
    } else {
      storage.addFavorite(state.place);
      ui.setFavoriteState(true);
    }
    refreshFavoritesStrip();
  });
}

// boot

async function resolveInitialPlace() {
  const last = storage.getLastLocation();
  if (last) return last;

  if (geo.isSupported()) {
    try {
      const coords = await geo.getCurrentPosition();
      return {
        id: `geo:${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`,
        name: 'Current Location',
        admin1: '',
        country: '',
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    } catch {
      return DEFAULT_PLACE;
    }
  }
  return DEFAULT_PLACE;
}

async function boot() {
  ui.applyTheme(storage.getTheme());
  initSettingsPanel();
  initSearch();
  initLocateButton();
  initRefreshButton();
  initRetryButton();
  initFavoriteToggle();
  initClearRecentButton();
  refreshRecentList();
  refreshFavoritesStrip();

  ui.showLoadingState();
  const initialPlace = await resolveInitialPlace();
  await loadWeather(initialPlace);
}

boot();
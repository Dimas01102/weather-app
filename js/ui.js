import { getIconMarkup } from './icons.js';

const $ = (id) => document.getElementById(id);

const els = {
  app: $('app'),
  // current weather
  currentSkeleton: $('current-skeleton'),
  currentContent: $('current-content'),
  locationName: $('location-name'),
  updatedAt: $('updated-at'),
  conditionIconMain: $('condition-icon-main'),
  tempValue: $('temp-value'),
  conditionLabel: $('condition-label'),
  feelsLike: $('feels-like'),
  tempHigh: $('temp-high'),
  tempLow: $('temp-low'),
  qsHumidity: $('qs-humidity'),
  qsWind: $('qs-wind'),
  qsPressure: $('qs-pressure'),
  qsVisibility: $('qs-visibility'),
  qsUv: $('qs-uv'),
  qsPrecip: $('qs-precip'),
  favoriteToggle: $('favorite-toggle'),
  // hourly
  hourlySkeleton: $('hourly-skeleton'),
  hourlyList: $('hourly-list'),
  // daily
  dailySkeleton: $('daily-skeleton'),
  dailyList: $('daily-list'),
  // details
  detailsGrid: $('details-grid'),
  detailHumidity: $('detail-humidity'),
  detailWind: $('detail-wind'),
  detailPressure: $('detail-pressure'),
  detailVisibility: $('detail-visibility'),
  detailUv: $('detail-uv'),
  detailPrecip: $('detail-precip'),
  // sun
  sunArcWrap: $('sun-arc-wrap'),
  sunArcProgress: $('sun-arc-progress'),
  sunArcDot: $('sun-arc-dot'),
  sunriseTime: $('sunrise-time'),
  sunsetTime: $('sunset-time'),
  // favorites / recent
  favoritesStrip: $('favorites-strip'),
  recentSection: $('recent-section'),
  recentList: $('recent-list'),
  // status
  statusBanner: $('status-banner'),
  statusTitle: $('status-title'),
  statusDesc: $('status-desc'),
  // header controls
  refreshBtn: $('refresh-btn'),
  locateBtn: $('locate-btn'),
  searchInput: $('search-input'),
};

const ARC_PATH_LENGTH = 292; 

export const ui = {
  els,

  // loading
  showLoadingState() {
    els.currentSkeleton.hidden = false;
    els.currentContent.hidden = true;
    els.hourlySkeleton.hidden = false;
    els.hourlyList.hidden = true;
    els.dailySkeleton.hidden = false;
    els.dailyList.hidden = true;
    els.detailsGrid.hidden = true;
    els.sunArcWrap.hidden = true;
  },

  hideLoadingState() {
    els.currentSkeleton.hidden = true;
    els.currentContent.hidden = false;
    els.hourlySkeleton.hidden = true;
    els.hourlyList.hidden = false;
    els.dailySkeleton.hidden = true;
    els.dailyList.hidden = false;
    els.detailsGrid.hidden = false;
    els.sunArcWrap.hidden = false;
  },

  // current
  renderCurrent(vm, locationLabel) {
    els.locationName.textContent = locationLabel;
    els.conditionIconMain.innerHTML = getIconMarkup(vm.iconKey);
    els.tempValue.textContent = `${vm.tempRounded}°`;
    els.conditionLabel.textContent = vm.conditionLabel;
    els.feelsLike.textContent = `Feels like ${vm.feelsLikeRounded}°`;
    els.tempHigh.textContent = `H: ${vm.high}°`;
    els.tempLow.textContent = `L: ${vm.low}°`;

    els.qsHumidity.textContent = `${vm.humidity}%`;
    els.qsWind.textContent = `${vm.windSpeed} ${vm.windUnitLabel}`;
    els.qsPressure.textContent = `${vm.pressure} hPa`;
    els.qsVisibility.textContent = vm.visibilityKm != null ? `${vm.visibilityKm} km` : '-';
    els.qsUv.textContent = vm.uv != null ? `${vm.uv}` : '-';
    els.qsPrecip.textContent = `${vm.precipitationProbability}%`;

    els.detailHumidity.textContent = `${vm.humidity}%`;
    els.detailWind.textContent = `${vm.windSpeed} ${vm.windUnitLabel} ${vm.windDirection}`;
    els.detailPressure.textContent = `${vm.pressure} hPa`;
    els.detailVisibility.textContent = vm.visibilityKm != null ? `${vm.visibilityKm} km` : '-';
    els.detailUv.textContent = vm.uv != null ? `${vm.uv} · ${vm.uvBand}` : '-';
    els.detailPrecip.textContent = `${vm.precipitationProbability}%`;

    els.app.dataset.condition = vm.conditionGroup;
    els.app.dataset.isDay = vm.isDay ? '1' : '0';
  },

  renderSun(sun) {
    const dashLength = ARC_PATH_LENGTH * sun.fraction;
    els.sunArcProgress.style.strokeDasharray = `${dashLength} ${ARC_PATH_LENGTH}`;
    els.sunriseTime.textContent = sun.sunriseLabel;
    els.sunsetTime.textContent = sun.sunsetLabel;

    const angle = Math.PI * Math.min(1, Math.max(0, sun.fraction));
    const cx = 120, cy = 110, rx = 100, ry = 90;
    const x = cx - rx * Math.cos(angle);
    const y = cy - ry * Math.sin(angle);
    els.sunArcDot.setAttribute('cx', x.toFixed(1));
    els.sunArcDot.setAttribute('cy', y.toFixed(1));
    els.sunArcDot.style.opacity = sun.isDaytime ? '1' : '0.35';
  },

  setFavoriteState(isFav) {
    els.favoriteToggle.setAttribute('aria-pressed', isFav ? 'true' : 'false');
    els.favoriteToggle.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
  },

  setUpdatedLabel(text) {
    els.updatedAt.textContent = text;
  },

  // hourly
  renderHourly(items) {
    els.hourlyList.innerHTML = items
      .map(
        (h) => `
        <li class="hourly-item">
          <span class="hourly-time">${h.label}</span>
          <svg class="hourly-icon" viewBox="0 0 48 48" aria-hidden="true">${getIconMarkup(h.iconKey)}</svg>
          <span class="hourly-temp">${h.temp}°</span>
          <span class="hourly-pop">${h.pop > 0 ? h.pop + '%' : ''}</span>
        </li>`
      )
      .join('');
  },

  // daily
  renderDaily(items) {
    els.dailyList.innerHTML = items
      .map(
        (d) => `
        <li class="daily-item">
          <span class="daily-day">${d.dayLabel}</span>
          <svg class="daily-icon" viewBox="0 0 48 48" aria-hidden="true">${getIconMarkup(d.iconKey)}</svg>
          <span class="daily-pop">${d.pop > 0 ? d.pop + '%' : ''}</span>
          <span class="daily-range"><span class="daily-high">${d.high}°</span><span class="daily-low">${d.low}°</span></span>
        </li>`
      )
      .join('');
  },

  // favorites
  renderFavorites(favorites, activeId, { onSelect, onRemove }) {
    if (favorites.length === 0) {
      els.favoritesStrip.hidden = true;
      els.favoritesStrip.innerHTML = '';
      return;
    }
    els.favoritesStrip.hidden = false;
    els.favoritesStrip.innerHTML = favorites
      .map(
        (f) => `
        <button type="button" class="favorite-chip ${f.id === activeId ? 'active' : ''}" data-id="${f.id}">
          <span>${f.name}</span>
          <svg class="fc-remove" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>`
      )
      .join('');

    els.favoritesStrip.querySelectorAll('.favorite-chip').forEach((chip) => {
      const id = chip.dataset.id;
      const place = favorites.find((f) => f.id === id);
      chip.addEventListener('click', (e) => {
        if (e.target.closest('.fc-remove')) {
          onRemove(id);
        } else {
          onSelect(place);
        }
      });
    });
  },

  // recent
  renderRecent(items, { onSelect }) {
    if (items.length === 0) {
      els.recentSection.hidden = true;
      return;
    }
    els.recentSection.hidden = false;
    els.recentList.innerHTML = items
      .map((p) => `<li><button type="button" class="recent-chip" data-id="${p.id}">${p.name}</button></li>`)
      .join('');
    els.recentList.querySelectorAll('.recent-chip').forEach((btn) => {
      const place = items.find((p) => p.id === btn.dataset.id);
      btn.addEventListener('click', () => onSelect(place));
    });
  },

  // status / errors
  showStatus(title, desc) {
    els.statusTitle.textContent = title;
    els.statusDesc.textContent = desc;
    els.statusBanner.hidden = false;
  },
  hideStatus() {
    els.statusBanner.hidden = true;
  },

  // header state
  setRefreshing(isRefreshing) {
    els.refreshBtn.classList.toggle('spinning', isRefreshing);
    els.refreshBtn.disabled = isRefreshing;
  },
  setLocating(isLocating) {
    els.locateBtn.classList.toggle('spinning', isLocating);
    els.locateBtn.classList.toggle('locating', isLocating);
    els.locateBtn.disabled = isLocating;
  },

  // theme
  applyTheme(theme) {
    els.app.dataset.theme = theme;
  },
};
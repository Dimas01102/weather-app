import { api } from './api.js';

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

function placeMeta(place) {
  return [place.admin1, place.country].filter(Boolean).join(', ');
}

function toPlace(raw) {
  return {
    id: `${raw.id}`,
    name: raw.name,
    admin1: raw.admin1 || '',
    country: raw.country || '',
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
  };
}

export function createSearchController({ inputEl, resultsEl, clearBtnEl, onSelect }) {
  let debounceTimer = null;
  let requestToken = 0;
  let activeIndex = -1;
  let currentItems = [];

  function openResults() {
    resultsEl.hidden = false;
    inputEl.setAttribute('aria-expanded', 'true');
  }

  function closeResults() {
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';
    inputEl.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
    currentItems = [];
  }

  function renderMessage(text, kind = 'search-empty') {
    resultsEl.innerHTML = `<div class="${kind}">${text}</div>`;
    openResults();
  }

  function renderItems(items) {
    currentItems = items;
    activeIndex = -1;
    if (items.length === 0) {
      renderMessage('No matching locations found.');
      return;
    }
    resultsEl.innerHTML = items
      .map(
        (place, i) => `
        <div class="search-result-item" role="option" id="search-opt-${i}" data-index="${i}">
          <span class="search-result-name">${place.name}</span>
          <span class="search-result-meta">${placeMeta(place)}</span>
        </div>`
      )
      .join('');
    openResults();

    resultsEl.querySelectorAll('.search-result-item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const idx = Number(el.dataset.index);
        selectPlace(currentItems[idx]);
      });
    });
  }

  function selectPlace(place) {
    inputEl.value = place.name;
    closeResults();
    clearBtnEl.hidden = false;
    onSelect(place);
  }

  function setActive(idx) {
    const items = resultsEl.querySelectorAll('.search-result-item');
    items.forEach((el) => el.classList.remove('active'));
    if (idx >= 0 && items[idx]) {
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
      inputEl.setAttribute('aria-activedescendant', `search-opt-${idx}`);
    } else {
      inputEl.removeAttribute('aria-activedescendant');
    }
  }

  async function runSearch(query) {
    const token = ++requestToken;
    renderMessage('Searching…', 'search-loading');
    try {
      const raw = await api.searchLocations(query);
      if (token !== requestToken) return; // stale response, ignore
      renderItems(raw.map(toPlace));
    } catch (err) {
      if (token !== requestToken) return;
      renderMessage('Search failed. Check your connection.', 'search-error');
    }
  }

  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();
    clearBtnEl.hidden = query.length === 0;
    clearTimeout(debounceTimer);

    if (query.length < MIN_CHARS) {
      closeResults();
      return;
    }
    debounceTimer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (resultsEl.hidden || currentItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentItems.length - 1);
      setActive(activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      setActive(activeIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectPlace(currentItems[activeIndex]);
    } else if (e.key === 'Escape') {
      closeResults();
    }
  });

  inputEl.addEventListener('blur', () => {
    // slight delay so mousedown-select can fire first
    setTimeout(closeResults, 120);
  });

  clearBtnEl.addEventListener('click', () => {
    inputEl.value = '';
    clearBtnEl.hidden = true;
    closeResults();
    inputEl.focus();
  });

  return {
    setValue(text) {
      inputEl.value = text;
      clearBtnEl.hidden = text.length === 0;
    },
    close: closeResults,
  };
}
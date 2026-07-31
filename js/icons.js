const ICONS = {
  'clear-day': `<circle cx="24" cy="24" r="10"/><g stroke-width="2"><line x1="24" y1="2" x2="24" y2="8"/><line x1="24" y1="40" x2="24" y2="46"/><line x1="2" y1="24" x2="8" y2="24"/><line x1="40" y1="24" x2="46" y2="24"/><line x1="8.6" y1="8.6" x2="12.7" y2="12.7"/><line x1="35.3" y1="35.3" x2="39.4" y2="39.4"/><line x1="8.6" y1="39.4" x2="12.7" y2="35.3"/><line x1="35.3" y1="12.7" x2="39.4" y2="8.6"/></g>`,

  'clear-night': `<path d="M31 6a17 17 0 1 0 11 30 13 13 0 0 1-11-30z"/>`,

  'partly-cloudy-day': `<circle cx="18" cy="18" r="8"/><g stroke-width="2"><line x1="18" y1="2" x2="18" y2="6"/><line x1="4.5" y1="9.5" x2="7.3" y2="12.3"/><line x1="2" y1="22" x2="6" y2="22"/></g><path d="M14 40h20a8 8 0 0 0 1-15.9A11 11 0 0 0 14.6 27.6 7 7 0 0 0 14 40z"/>`,

  'partly-cloudy-night': `<path d="M14 12a9 9 0 1 0 6 15.6 6.5 6.5 0 0 1 5-10.4A9 9 0 0 0 14 12z"/><path d="M17 40h20a8 8 0 0 0 1-15.9A11 11 0 0 0 17.6 27.6 7 7 0 0 0 17 40z"/>`,

  cloudy: `<path d="M11 38h24a8.5 8.5 0 0 0 1-16.9A12 12 0 0 0 12.9 25 7.5 7.5 0 0 0 11 38z"/>`,

  overcast: `<path d="M9 32h27a7.5 7.5 0 0 0 .8-15A11 11 0 0 0 15.7 20 7 7 0 0 0 9 32z"/><path d="M13 40h22" stroke-width="2.4"/>`,

  fog: `<path d="M11 24h26" stroke-width="2.4"/><path d="M7 31h34" stroke-width="2.4"/><path d="M11 38h26" stroke-width="2.4"/><path d="M17 17a9 9 0 0 1 17-3.2 7 7 0 0 1 6.6 9.2H14a6 6 0 0 1 3-6z"/>`,

  drizzle: `<path d="M11 26h24a7.5 7.5 0 0 0 .8-15A11 11 0 0 0 12.9 13 7.5 7.5 0 0 0 11 26z"/><g stroke-width="2.4"><line x1="17" y1="32" x2="15" y2="38"/><line x1="25" y1="32" x2="23" y2="38"/><line x1="33" y1="32" x2="31" y2="38"/></g>`,

  rain: `<path d="M10 24h27a8 8 0 0 0 .9-16A12 12 0 0 0 12 12.4 7.5 7.5 0 0 0 10 24z"/><g stroke-width="2.6"><line x1="15" y1="30" x2="12" y2="39"/><line x1="24" y1="30" x2="21" y2="39"/><line x1="33" y1="30" x2="30" y2="39"/></g>`,

  'heavy-rain': `<path d="M9 22h28a8 8 0 0 0 .9-16A12 12 0 0 0 11 10.4 7.5 7.5 0 0 0 9 22z"/><g stroke-width="2.8"><line x1="13" y1="28" x2="9" y2="40"/><line x1="21" y1="28" x2="17" y2="40"/><line x1="29" y1="28" x2="25" y2="40"/><line x1="37" y1="28" x2="33" y2="40"/></g>`,

  thunderstorm: `<path d="M10 20h27a8 8 0 0 0 .8-15.9A12 12 0 0 0 12 8.4 7.5 7.5 0 0 0 10 20z"/><path d="M25 24l-6 11h6l-4 9 11-14h-6z" fill="currentColor" stroke="none"/>`,

  snow: `<path d="M10 20h27a8 8 0 0 0 .8-15.9A12 12 0 0 0 12 8.4 7.5 7.5 0 0 0 10 20z"/><g stroke-width="2.4"><line x1="15" y1="30" x2="15" y2="40"/><line x1="10.5" y1="32.5" x2="19.5" y2="37.5"/><line x1="19.5" y1="32.5" x2="10.5" y2="37.5"/><line x1="33" y1="30" x2="33" y2="40"/><line x1="28.5" y1="32.5" x2="37.5" y2="37.5"/><line x1="37.5" y1="32.5" x2="28.5" y2="37.5"/></g>`,

  wind: `<g stroke-width="2.4"><path d="M4 16h20a4.5 4.5 0 1 0-4.5-4.5"/><path d="M4 24h27a5 5 0 1 1-5 5"/><path d="M4 32h16a4 4 0 1 1-4 4"/></g>`,
};

export function getIconMarkup(key) {
  return ICONS[key] || ICONS.cloudy;
}

export function renderIcon(svgEl, key) {
  if (!svgEl) return;
  svgEl.innerHTML = getIconMarkup(key);
}
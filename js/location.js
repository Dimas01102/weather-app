export const location = {
  isSupported() {
    return 'geolocation' in navigator;
  },

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!location.isSupported()) {
        reject({ type: 'unsupported' });
        return;
      }

      let settled = false;

      const hardTimeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject({ type: 'timeout' });
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return;
          settled = true;
          clearTimeout(hardTimeout);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(hardTimeout);
          if (err.code === err.PERMISSION_DENIED) reject({ type: 'denied' });
          else if (err.code === err.TIMEOUT) reject({ type: 'timeout' });
          else reject({ type: 'unavailable' });
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    });
  },
};
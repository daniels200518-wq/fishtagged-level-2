import("https://unpkg.com/maplibre-gl@6.0.0/dist/maplibre-gl.mjs")
  .then(module => {
    window.maplibregl = module;
    window.dispatchEvent(new Event("maplibre-ready"));
  })
  .catch(() => {
    window.dispatchEvent(new Event("maplibre-error"));
  });

# Potomac topobathymetry layer

The USGS Potomac River Pilot TBDEM is a 1-meter Cloud Optimized GeoTIFF, not a
browser tile service. The source file is approximately 18.7 GB and covers the
Potomac from above Hancock through tidal Washington.

Source: https://doi.org/10.5066/P13BBWDB

Before enabling this layer, render the COG into PNG or WebP XYZ tiles, upload
the tiles beside the public site or to an approved tile service, then edit
`config.json`:

```json
{
  "ready": true,
  "tileSize": 256,
  "tiles": ["./topobathy/tiles/{z}/{x}/{y}.png"]
}
```

Do not point MapLibre directly at the GeoTIFF. A direct browser download would
be too large and would not render as a normal raster tile source.

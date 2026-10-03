# Nairobi Urban Heat Island Explorer

Interactive web map of land surface temperature (LST) and normalized urban heat island (UHI) intensity for Nairobi, derived from Landsat 8 Collection 2 Level 2 imagery in Google Earth Engine and displayed with Leaflet.

## Data
- `Nairobi_LST_2022.tif`
- `Nairobi_UHI_2022.tif`
- `Nairobi_UTFVI_2022.tif`
- `Nairobi_NDVI_2022.tif`
- `Nairobi_TrueColor_2022.tif`

(All exported in EPSG:4326 at 30 m. If you change the date range, update `YEAR` at the top of the script in `index.html`.) Layers load on demand when selected. Masked pixels are exported as -9999 and shown as transparent.

## Method
Landsat 8 C2 L2 median composite, cloud/shadow masked with QA_PIXEL; LST from the USGS surface temperature band (ST_B10); UHI as the z-score of LST over the study area; UTFVI = (Ts - Tmean) / Ts in Kelvin; NDVI from SR_B5 and SR_B4.

## Credits
Landsat data: U.S. Geological Survey. Basemaps: OpenStreetMap contributors, CARTO, Esri. Libraries: Leaflet, geotiff.js.

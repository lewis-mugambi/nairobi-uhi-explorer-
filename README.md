# Nairobi Urban Heat Island Explorer

An interactive web map showing land surface temperature (LST), urban heat island (UHI) intensity, thermal variance and vegetation cover across Nairobi, Kenya. The analysis is done in Google Earth Engine from Landsat 8 imagery and published as a static Leaflet web map.

**Live demo:**//https://lewis-mugambi.github.io/nairobi-uhi-explorer-/

## Why this project

Nairobi is growing quickly, and built-up areas trap more heat than green spaces and forests. This project maps where the city runs hottest and compares that pattern with vegetation cover, using free satellite data and open-source tools. It is a complete geospatial workflow, from raw imagery to a shareable web application.

## Features

- Five switchable layers: LST, UHI, UTFVI, NDVI and true colour
- Click anywhere on the map to read the values of every loaded layer at that point
- Citywide mean, minimum and maximum shown for the active layer
- Adjustable layer opacity and three basemaps (light, OpenStreetMap, satellite)
- Colour legend that updates with each layer
- Layers load on demand, so the page opens quickly
- Works on desktop and mobile, and is hosted on GitHub Pages with no backend

## Layers

| Layer | Description | Units |
|---|---|---|
| Land Surface Temperature (LST) | Temperature of the ground surface | °C |
| Urban Heat Island (UHI) | LST standardised across the study area (z-score) | standard deviations |
| UTFVI | Urban Thermal Field Variance Index, a measure of thermal comfort | dimensionless |
| NDVI | Normalised Difference Vegetation Index | -1 to 1 |
| True colour | Landsat red, green and blue surface reflectance | reflectance |

## Data and method

**Data:** Landsat 8 OLI/TIRS Collection 2 Level 2 (`LANDSAT/LC08/C02/T1_L2`), 30 m, May to December 2022. Study area: Nairobi administrative boundary.

**Processing (Google Earth Engine):**

1. Filter the image collection by date and boundary.
2. Mask clouds, cloud shadow, cirrus and saturated pixels using `QA_PIXEL` and `QA_RADSAT`.
3. Apply the Collection 2 scale factors to the optical and thermal bands.
4. Build a median composite and clip it to Nairobi.
5. Compute the layers:
   - **LST (°C)** = `ST_B10` (USGS surface temperature product, in Kelvin) − 273.15
   - **UHI** = (LST − mean LST) / standard deviation of LST, over the study area
   - **UTFVI** = (Ts − Tmean) / Ts, with temperatures in Kelvin
   - **NDVI** = (NIR − Red) / (NIR + Red), from `SR_B5` and `SR_B4`
6. Export each layer as a 30 m GeoTIFF (EPSG:4326). Masked pixels are written as `-9999`.

**Web map:** the GeoTIFFs are read in the browser with [geotiff.js](https://geotiffjs.github.io/), painted to a colour-mapped image, and displayed as a [Leaflet](https://leafletjs.com/) image overlay.

### Reading UTFVI

UTFVI is commonly grouped into six ecological evaluation classes:

| UTFVI | Urban heat island phenomenon |
|---|---|
| < 0 | None |
| 0 – 0.005 | Weak |
| 0.005 – 0.010 | Middle |
| 0.010 – 0.015 | Strong |
| 0.015 – 0.020 | Stronger |
| > 0.020 | Strongest |

## Repository structure

```
nairobi-uhi-explorer/
├── index.html          # web map (HTML, CSS and JavaScript)
├── lib/                # Leaflet and geotiff.js
├── data/               # exported GeoTIFFs
├── gee/                # Google Earth Engine script
├── run_local.bat       # start a local server (Windows)
├── run_local.sh        # start a local server (Mac/Linux)
└── README.md
```

## Run locally

The page loads GeoTIFFs with `fetch`, so it must be served over HTTP rather than opened as a file.

```bash
python -m http.server 8000
```

Then open http://localhost:8000. On Windows you can double-click `run_local.bat` instead.

## Reproduce the analysis

1. Open the script in `gee/` in the [Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Point `aoi` at your own boundary asset and adjust `startDate` and `endDate`.
3. Run the script, then start each export from the **Tasks** tab.
4. Download the GeoTIFFs from the `GEE_UHI` folder in Google Drive into `data/`.
5. If you change the year, update `YEAR` at the top of the script in `index.html`.

## Limitations

- The map is a single median composite for May to December 2022. It includes both dry and rainy periods, so it shows a typical pattern rather than a specific day.
- Landsat thermal bands are collected at 100 m and resampled to 30 m, so fine detail is smoother than it looks.
- UHI and UTFVI are relative to the Nairobi study area mean, not to a rural reference.
- LST has not been validated against ground measurements.

## Tech stack

Google Earth Engine (JavaScript API), Landsat 8, Leaflet, geotiff.js, HTML/CSS/JavaScript, GitHub Pages.

## Credits

- Landsat 8 imagery courtesy of the U.S. Geological Survey
- Basemaps: © OpenStreetMap contributors, © CARTO, Tiles © Esri
- Libraries: [Leaflet](https://leafletjs.com/), [geotiff.js](https://geotiffjs.github.io/)

## Author

**LEWIS MUGAMBI**
Geoinformation Technology, Technical University of Kenya
[LinkedIn](https://www.linkedin.com/in/lewis-mugambi-5625b0299) · [GitHub](https://github.com/lewis-mugambi)

## License

Released under the MIT License. Add a `LICENSE` file to the repository to apply it.

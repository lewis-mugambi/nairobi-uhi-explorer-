// *****************************************************************************************
//
// Land Surface Temperature (LST), Urban Heat Island (UHI) and Urban Thermal Field
// Variance Index (UTFVI) for Nairobi using Landsat 8 Collection 2 Level 2 data.
//
// *****************************************************************************************


// INPUTS **********************************************************************************

var aoi = ee.FeatureCollection('projects/flood-mapping-494110/assets/Nairobi_boundary');
var aoiGeom = aoi.geometry();            // reduceRegion / clip / export need a Geometry

var startDate = '2022-05-01';
var endDate = '2023-01-01';              // filterDate() end is exclusive

Map.centerObject(aoi, 10);

// *****************************************************************************************

// Scaling factors for Collection 2 Level 2
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

// Cloud mask for Collection 2 (QA_PIXEL bits):
// 0 fill, 1 dilated cloud, 2 cirrus, 3 cloud, 4 cloud shadow
function maskL8sr(image) {
  var qaMask = image.select('QA_PIXEL').bitwiseAnd(parseInt('11111', 2)).eq(0);
  var saturationMask = image.select('QA_RADSAT').eq(0);
  return image.updateMask(qaMask).updateMask(saturationMask);
}

var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterDate(startDate, endDate)
  .filterBounds(aoi)
  .map(maskL8sr)
  .map(applyScaleFactors);

print('Scenes used', collection.size());

var clippedImage = collection.median().clip(aoiGeom);

var visualization = {bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0.0, max: 0.3};
Map.addLayer(clippedImage, visualization, 'True Color (432)', false);


// NDVI (useful later to compare LST against vegetation)
var ndvi = clippedImage.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI', false);


// LAND SURFACE TEMPERATURE ****************************************************************
// ST_B10 in the Level 2 product is already Land Surface Temperature in Kelvin
// (atmosphere and emissivity corrected by USGS), so only convert to Celsius.

var lst = clippedImage.select('ST_B10').subtract(273.15).rename('LST');

var lst_vis = {
  min: 15,
  max: 45,
  palette: [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003']
};
Map.addLayer(lst, lst_vis, 'LST AOI');


// URBAN HEAT ISLAND ***********************************************************************

var stats = lst.reduceRegion({
  reducer: ee.Reducer.mean().combine({reducer2: ee.Reducer.stdDev(), sharedInputs: true}),
  geometry: aoiGeom,
  scale: 30,
  maxPixels: 1e9
});

var lst_mean = ee.Number(stats.get('LST_mean'));
var lst_std = ee.Number(stats.get('LST_stdDev'));

print('Mean LST in AOI (deg C)', lst_mean);
print('STD LST in AOI (deg C)', lst_std);

// 1. Normalized UHI (z-score of LST)
var uhi = lst.subtract(lst_mean).divide(lst_std).rename('UHI');
var uhi_vis = {
  min: -4,
  max: 4,
  palette: ['313695', '74add1', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'b10026']
};
Map.addLayer(uhi, uhi_vis, 'UHI AOI');

// 2. UTFVI = (Ts - Tmean) / Ts, with temperatures in KELVIN
var lstK = lst.add(273.15);
var utfvi = lstK.subtract(lst_mean.add(273.15)).divide(lstK).rename('UTFVI');
var utfvi_vis = {
  min: -0.03,
  max: 0.03,
  palette: ['313695', '74add1', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'b10026']
};
Map.addLayer(utfvi, utfvi_vis, 'UTFVI AOI');


// EXPORTS (all layers to Google Drive as GeoTIFFs) ****************************************

var exportYear = startDate.slice(0, 4);

var NODATA = -9999;   // masked (cloud / outside AOI) pixels are written as -9999 so the web map can skip them

function exportToDrive(image, name) {
  Export.image.toDrive({
    image: image.unmask(NODATA).toFloat(),
    description: 'Nairobi_' + name + '_' + exportYear,
    fileNamePrefix: 'Nairobi_' + name + '_' + exportYear,
    folder: 'GEE_UHI',
    region: aoiGeom,
    scale: 30,
    crs: 'EPSG:4326',
    maxPixels: 1e9
  });
}

exportToDrive(lst, 'LST');                                             // Celsius
exportToDrive(uhi, 'UHI');                                             // z-score
exportToDrive(utfvi, 'UTFVI');                                         // dimensionless index
exportToDrive(ndvi, 'NDVI');                                           // -1 to 1
exportToDrive(clippedImage.select(['SR_B4', 'SR_B3', 'SR_B2']), 'TrueColor'); // surface reflectance (R, G, B)

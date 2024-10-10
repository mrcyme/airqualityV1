 // Initialize the map, centered on Brussels
 var map = L.map('map').setView([50.8503, 4.3517], 12); 

 // Add the CartoDB Positron (light) tile layer for better contrast
 L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
     subdomains: 'abcd',
     maxZoom: 19
 }).addTo(map);

 // Color scale based on NO2 concentration
 function getColor(no2) {
     return no2 > 50 ? '#000000' : // Black for > 50
            no2 > 40 ? '#FF0000' : // Red for 40-50
            no2 > 35 ? '#FF4500' : // Orange-Red for 35-40
            no2 > 30 ? '#FFA500' : // Orange for 30-35
            no2 > 25 ? '#FFD700' : // Yellow for 25-30
            no2 > 20 ? '#ADFF2F' : // Green-Yellow for 20-25
            no2 > 15 ? '#32CD32' : // Green for 15-20
            no2 > 10 ? '#00CED1' : // Dark Turquoise for 10-15
            no2 > 5  ? '#4682B4' : // Steel Blue for 5-10
                       '#87CEFA';  // Light Blue for 0-5
 }

 // Variables to hold the layers for each GeoJSON dataset
 var currentLayer = null;
 var firstGeojsonLayer, secondGeojsonLayer;

 // Function to style and add popup
 function onEachFeature(feature, layer) {
     if (feature.properties) {
         var no2 = feature.properties.no2 || feature.properties.value; // Adapt for both GeoJSON structures
         var popupContent = 
             "<strong>" + (feature.properties.name || "Location") + "</strong><br>" +
             "NO2: " + no2 + " µg/m³";

         layer.bindPopup(popupContent); // Bind popup to display NO2

         // Set the circle style dynamically based on NO2 concentration
         layer.setStyle({
             fillColor: getColor(no2),
             color: getColor(no2),
             radius: 6, // Adjust circle marker size
             fillOpacity: 0.8
         });
     }
 }

 // Function to create a circle marker
 function pointToLayer(feature, latlng) {
     return L.circleMarker(latlng);
 }

 // Load the first GeoJSON (2021 data)
 function loadFirstGeojson() {
     fetch('no2_anmean_station_brussels.json')
         .then(response => response.json())
         .then(geojsonData => {
             firstGeojsonLayer = L.geoJSON(geojsonData, {
                 pointToLayer: pointToLayer,
                 onEachFeature: onEachFeature
             });
             firstGeojsonLayer.addTo(map);
             currentLayer = firstGeojsonLayer;
         })
         .catch(error => console.error('Error loading the first GeoJSON:', error));
 }

 // Load the second GeoJSON (CurieusenAir data)
 function loadSecondGeojson() {
     fetch('no2_curieusenair.json')
         .then(response => response.json())
         .then(geojsonData => {
             secondGeojsonLayer = L.geoJSON(geojsonData, {
                 pointToLayer: pointToLayer,
                 onEachFeature: onEachFeature
             });
             secondGeojsonLayer.addTo(map);
             currentLayer = secondGeojsonLayer;
         })
         .catch(error => console.error('Error loading the second GeoJSON:', error));
 }

 // Function to switch between the two GeoJSON datasets
 function toggleData() {
     if (currentLayer) {
         map.removeLayer(currentLayer);
     }
     if (document.getElementById('toggleSwitch').checked) {
         loadSecondGeojson();
     } else {
         loadFirstGeojson();
     }
 }

 // Load the first GeoJSON by default
 loadFirstGeojson();

 // Attach the toggle function to the toggle switch
 document.getElementById('toggleSwitch').addEventListener('change', toggleData);

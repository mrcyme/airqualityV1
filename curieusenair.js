 // Initialize map centered on Brussels
 const map = L.map('map').setView([50.85, 4.35], 12);

 // Add OpenStreetMap tiles
 L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
     subdomains: 'abcd',
     maxZoom: 19
 }).addTo(map);

 // Define the getColorNO2 function
function getColorNO2(no2, norm) {
    if (norm === 'world_health') {
        return no2 < 10 ? '#00FF00' : '#FF0000'; // Green if < 10, Red otherwise
    } else if (norm === 'european_current') {
        return no2 < 40 ? '#00FF00' : '#FF0000'; // Green if < 40, Red otherwise
    } else if (norm === 'european_future') {
        return no2 < 20 ? '#00FF00' : '#FF0000'; // Green if < 20, Red otherwise
    } else {
        // Default color scale (no norm)
        return no2 > 40 ? '#990099' :  // Black for > 50
            no2 > 30 ? '#CC0000' :  // Red for 40-50
            no2 > 25 ? '#FF0000' :  // Orange-Red for 35-40
            no2 > 20 ? '#FF6600' :  // Orange for 30-35
            no2 > 15 ? '#FFBB00' :  // Yellow for 25-30
            no2 > 10 ? '#FFFF00' :  // Green-Yellow for 20-25
            no2 > 7 ? '#00FF00' :  // Green for 15-20
            no2 > 5 ? '#009900' :  // Dark Turquoise for 10-15
            no2 > 2  ? '#0099FF' :  // Steel Blue for 5-10
                        '#0000FF';   // Light Blue for 0-5
    
    }
}

function setLegend(norm) {
    // Check if the legend is already added to the map
    if (map.legendControl) {
        map.removeControl(map.legendControl);
    }

    const legend = L.control({ position: 'bottomright' });
    console.log(map);
    console.log(legend);
    if (norm === 'no_norm') {
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, 2, 5, 7, 10, 15, 20, 25, 30, 40];

            // Loop through the intervals and generate a label with a colored square for each interval
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColorNO2(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' µg/m³<br>' : '+ µg/m³');
            }

            return div;
        };
    
    } else if (norm === 'world_health') {
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, 10];
            const labels = ["ok", "not ok"];
            const colors = ['#00FF00', '#FF0000'];
    
            // Loop through the intervals and generate a label with a colored square for each interval
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + colors[i] + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' µg/m³ (' + labels[i] + ')<br>' : '+ µg/m³ (' + labels[i] + ')');
            }
    
            return div;
        };
    }
    else if (norm === 'european_future') {
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 20];
        const labels = ["ok", "not ok"];
        const colors = ['#00FF00', '#FF0000'];

        // Loop through the intervals and generate a label with a colored square for each interval
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' µg/m³ (' + labels[i] + ')<br>' : '+ µg/m³ (' + labels[i] + ')');
        }

        return div;
    }

    } 
    else if (norm === 'european_current') {
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 40];
        const labels = ["ok", "not ok"];
        const colors = ['#00FF00', '#FF0000'];

        // Loop through the intervals and generate a label with a colored square for each interval
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' µg/m³ (' + labels[i] + ')<br>' : '+ µg/m³ (' + labels[i] + ')');
        }

        return div;
    }
    }


    // Add the legend control to the map and store it in the map object
    legend.addTo(map);
    map.legendControl = legend;
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
            fillColor: getColorNO2(no2),
            color: getColorNO2(no2),
            radius: 4, // Adjust circle marker size
            fillOpacity: 0.8
        });
    }
}

// Function to create a circle marker
function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng);
}

// Load the first GeoJSON (2021 data)
function loadIrcelineData(air) {
    let path;
    if (air === 'curieusenair') {
        path = 'data/no2_anmean_station_brussels2021.json';
    } else {
        path = 'data/no2_expair.json';
    }
    return fetch('data/no2_anmean_station_brussels2023.json')
        .then(response => response.json())
        .then(geojsonData => {
            firstGeojsonLayer = L.geoJSON(geojsonData, {
                pointToLayer: pointToLayer,
                onEachFeature: onEachFeature
            });
            return firstGeojsonLayer;
        })
        .catch(error => console.error('Error loading the first GeoJSON:', error));
}

// Load the second GeoJSON (CurieusenAir data)
function loadSecondGeojson(air) {
    let path;
    if (air === 'curieusenair') {
        path = 'data/no2_curieusenair.json';
    } else {
        path = 'data/no2_expair.json';
    }
    return fetch(path)
        .then(response => response.json())
        .then(geojsonData => {
            secondGeojsonLayer = L.geoJSON(geojsonData, {
                pointToLayer: pointToLayer,
                onEachFeature: onEachFeature
            });
            return secondGeojsonLayer;
        })
        .catch(error => console.error('Error loading the second GeoJSON:', error));
}

// Function to update the layer with the selected norm
function updateLayerWithNorm(layer, norm) {
    if (!layer) return;
    
    layer.eachLayer(function(layer) {
        var no2 = layer.feature.properties.no2 || layer.feature.properties.value;
        layer.setStyle({
            fillColor: getColorNO2(no2, norm),
            color: getColorNO2(no2, norm)
        });
    });
}

// Unified function to handle both toggling data and updating the layer with the selected norm
function toggleDataAndNorm(air, norm) {
    // Remove the current layer if it exists
    if (currentLayer) {
        map.removeLayer(currentLayer);
        currentLayer = null;
    }

    // Determine which GeoJSON to load based on the toggle switch
    const loadGeojson = document.getElementById('toggleSwitch').checked ? loadSecondGeojson(air) : loadIrcelineData(air);

    // Load the selected GeoJSON and update the map
    loadGeojson.then(layer => {
        layer.addTo(map);
        currentLayer = layer;
        updateLayerWithNorm(currentLayer, norm);
        setLegend(norm);
    });
}

// Function to handle checkbox selection




 // Initialize map centered on Brussels
 const map = L.map('map').setView([50.85, 4.35], 12);

 // Add OpenStreetMap tiles
 L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
     subdomains: 'abcd',
     maxZoom: 19
 }).addTo(map);

 // Store the markers for both PM10 and PM2.5
let markers = [];
let currentType = 'P2';  // Default to PM2.5
let currentDataSource = 'sensorCommunity';  // Default data source


// Function to determine color based on sensor value using the provided scale
function getColor(value, currentType) {
    if (currentType === 'P2') {
    return value > 75 ? '#990099' :  // Black for > 50
           value > 60 ? '#CC0000' :  // Red for 40-50
           value > 50 ? '#FF0000' :  // Orange-Red for 35-40
           value > 35 ? '#FF6600' :  // Orange for 30-35
           value > 20 ? '#FFBB00' :  // Yellow for 25-30
           value > 15 ? '#FFFF00' :  // Green-Yellow for 20-25
           value > 10 ? '#00FF00' :  // Green for 15-20
           value > 7.5 ? '#009900' :  // Dark Turquoise for 10-15
           value > 3.5  ? '#0099FF' :  // Steel Blue for 5-10
                        '#0000FF';   // Light Blue for 0-5

}
else {
    return value > 140 ? '#990099' :  // Black for > 50
           value > 110 ? '#CC0000' :  // Red for 40-50
           value > 95 ? '#FF0000' :  // Orange-Red for 35-40
           value > 80 ? '#FF6600' :  // Orange for 30-35
           value > 60 ? '#FFBB00' :  // Yellow for 25-30
           value > 45 ? '#FFFF00' :  // Green-Yellow for 20-25
           value > 35 ? '#00FF00' :  // Green for 15-20
           value > 20 ? '#009900' :  // Dark Turquoise for 10-15
           value > 10  ? '#0099FF' :  // Steel Blue for 5-10
                        '#0000FF';   // Light Blue for 0-5
}
}


function setLegend(currentType) {
    if (map.legendControl) {
        map.removeControl(map.legendControl);
    }
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
    
    const div = L.DomUtil.create('div', 'info legend');
    if (currentType === 'P2') {
    const grades = [0, 3.5, 7.5, 10, 15, 20, 35, 50, 60, 75];
    let labels = [];

        // Loop through the intervals and generate a label with a colored square for each interval
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1, currentType) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' µg/m³<br>' : '+ µg/m³');
        }

        return div;
        }
    else {
        const grades = [0, 10, 20, 35, 40, 65, 80, 95, 110, 140];
        let labels = [];
    
            // Loop through the intervals and generate a label with a colored square for each interval
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i] + 1, currentType) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' µg/m³<br>' : '+ µg/m³');
            }
    
            return div;
            }
    };
        
    legend.addTo(map);
    map.legendControl = legend;
}

        

function fetchSensorCommunityData() {
    fetch('https://maps.sensor.community/data/v2/data.dust.min.json')
        .then(response => response.json())
        .then(data => {
            markers = data.map(sensor => {
                
                const lat = parseFloat(sensor.location.latitude);
                const lon = parseFloat(sensor.location.longitude);
                const country = sensor.location.country;

                // Filter for sensors in Brussels (rough coordinates)
                if (country === 'BE' && lat > 50.80 && lat < 50.90 && lon > 4.25 && lon < 4.45) {
                    const P1 = sensor.sensordatavalues.find(val => val.value_type === "P1")?.value || 'N/A';
                    const P2 = sensor.sensordatavalues.find(val => val.value_type === "P2")?.value || 'N/A';
                    
                    // Return a marker with both PM10 and PM2.5 data
                    return {
                        lat,
                        lon,
                        P1: parseFloat(P1),
                        P2: parseFloat(P2),
                        marker: null
                    };
                }
            }).filter(Boolean);  // Remove undefined entries

            // Initially display PM2.5 markers
            updateMarkers('P2');
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

function fetchIrcelineData() {
    const pm25Url = 'https://geo.irceline.be/sos/api/v1/timeseries/?service=1&phenomenon=6001&expanded=true&force_latest_values=true&status_intervals=true&rendering_hints=true&locale=en';
    const pm10Url = 'https://geo.irceline.be/sos/api/v1/timeseries/?service=1&phenomenon=5&expanded=true&force_latest_values=true&status_intervals=true&rendering_hints=true&locale=en';

    Promise.all([fetch(pm25Url), fetch(pm10Url)])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(([pm25Data, pm10Data]) => {
            markers = [...pm25Data, ...pm10Data].map(sensor => {
                const lat = sensor.station.geometry.coordinates[1];
                const lon = sensor.station.geometry.coordinates[0];
                const value = sensor.lastValue.value;
                const type = sensor.parameters.phenomenon.label.includes('10') ? 'P1' : 'P2';

                // Filter for sensors in Brussels (rough coordinates)
                if (lat > 50.80 && lat < 50.90 && lon > 4.25 && lon < 4.45) {
                    return {
                        lat,
                        lon,
                        [type]: value,
                        marker: null
                    };
                }
            }).filter(Boolean);  // Remove undefined entries
            // Initially display PM2.5 markers
            updateMarkers('P2');
        })
        .catch(error => console.error('Error fetching Irceline data:', error));
}

// Initially fetch data from the default data source
fetchSensorCommunityData();



 // Function to update markers based on the selected type (PM10 or PM2.5)
 function updateMarkers(type) {
     // Remove any existing markers
     markers.forEach(sensor => {
         if (sensor.marker) {
             map.removeLayer(sensor.marker);
         }
     });

     // Create new markers based on the selected type
     markers.forEach(sensor => {
         let value = sensor[type];
         if (isNaN(value)) return;  // Skip markers without valid data
        let color = getColor(value, currentType);

         if (sensor.lat === 50.845813) {
             // Create a star-shaped marker
             let starIcon = L.divIcon({
                 className: 'custom-star-icon',
                 html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                           <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                        </svg>`,
                 iconSize: [24, 24],
                 iconAnchor: [12, 12]
             });

             sensor.marker = L.marker([sensor.lat, sensor.lon], { icon: starIcon }).addTo(map)
                 .bindPopup(`<strong>Sensor Location: ${sensor.lat}</strong><br>
                             <strong>${type === 'P2' ? 'PM2.5' : 'PM10'} Value:</strong> ${value}`);
         } else {
             // Create a circle marker
             let circleMarker = L.circleMarker([sensor.lat, sensor.lon], {
                 radius: 4,
                 fillColor: color,
                 color: color,
                 weight: 1,
                 opacity: 1,
                 fillOpacity: 0.8
             }).addTo(map)
               .bindPopup(`<strong>Sensor Location: ${sensor.lat}</strong><br>
                           <strong>${type === 'P2' ? 'PM2.5' : 'PM10'} Value:</strong> ${value}`);

             sensor.marker = circleMarker;
         }
     });
 }

function togglePM(type) {
    if (type === 'P2') {
        document.getElementById('pm10Checkbox').checked = false;
    } else {
        document.getElementById('pm25Checkbox').checked = false;
    }
    currentType = type;
    updateMarkers(currentType);
    setLegend(currentType);
}
function toggleDataSource() {
    // Clear existing markers
    markers.forEach(sensor => {
        if (sensor.marker) {
            map.removeLayer(sensor.marker);
        }
    });

    if (currentDataSource === 'sensorCommunity') {
        currentDataSource = 'irceline';
        fetchIrcelineData();
    } else {
        currentDataSource = 'sensorCommunity';
        fetchSensorCommunityData();
    }
}

setLegend(currentType);

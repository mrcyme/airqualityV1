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

 // Function to determine color based on sensor value using the provided scale
 function getColor(value) {
     return value > 50 ? '#000000' :  // Black for > 50
            value > 40 ? '#FF0000' :  // Red for 40-50
            value > 35 ? '#FF4500' :  // Orange-Red for 35-40
            value > 30 ? '#FFA500' :  // Orange for 30-35
            value > 25 ? '#FFD700' :  // Yellow for 25-30
            value > 20 ? '#ADFF2F' :  // Green-Yellow for 20-25
            value > 15 ? '#32CD32' :  // Green for 15-20
            value > 10 ? '#00CED1' :  // Dark Turquoise for 10-15
            value > 5  ? '#4682B4' :  // Steel Blue for 5-10
                         '#87CEFA';   // Light Blue for 0-5
 }

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

         let color = getColor(value);
         let circleMarker = L.circleMarker([sensor.lat, sensor.lon], {
             radius: 8,
             fillColor: color,
             color: "#000",
             weight: 1,
             opacity: 1,
             fillOpacity: 0.8
         }).addTo(map)
           .bindPopup(`<strong>Sensor Location:</strong><br>
                       <strong>${type === 'P2' ? 'PM2.5' : 'PM10'} Value:</strong> ${value}`);

         sensor.marker = circleMarker;
     });
 }

 // Function to toggle between PM10 and PM2.5
 function togglePM(type) {
     currentType = type;
     updateMarkers(type);
 }
function toggleDataSource() {
    if (currentDataSource === 'sensorCommunity') {
        currentDataSource = 'irceline';
        fetchIrcelineData();
    } else {
        currentDataSource = 'sensorCommunity';
        fetchSensorCommunityData();
    }
}

import json
from geojson import Feature, FeatureCollection
from shapely.geometry import Point
from shapely.geometry import Polygon
import math

# Load the GeoJSON input file
input_file = 'no2_curieusenair.json'
output_file = 'no2_curieusenair_mapbox.json'
radius = 10
def create_hexagon(center, radius):
    """Create a hexagonal polygon geometry centered at the given point."""
    angle_offset = math.pi / 6  # Offset to start the hexagon from the top
    hexagon_points = []

    for i in range(6):
        angle = angle_offset + (i * math.pi / 3)  # 60 degrees in radians
        x = center[0] + (radius / 11132) * math.cos(angle)  # Convert meters to degrees
        y = center[1] + (radius / 11132) * math.sin(angle)  # Convert meters to degrees
        hexagon_points.append((x, y))

    return Polygon(hexagon_points)

def process_geojson(input_file, output_file, radius):
    with open(input_file) as f:
        data = json.load(f)

    # Prepare an empty list for processed features
    processed_features = []

    # Loop through each feature in the input GeoJSON
    for feature in data['features']:
        # Extract geometry and properties
        geom = feature['geometry']
        properties = feature['properties']

        # Replace Point geometry with a Hexagon (radius = 1 meter)
        if geom['type'] == 'Point':
            coordinates = geom['coordinates']
            # Create a hexagon geometry with a 20m radius
            hexagon_geom = create_hexagon(coordinates, radius=radius)
            # Add the new hexagonal feature to the processed list
            processed_features.append(Feature(geometry=hexagon_geom.__geo_interface__, properties=properties))

    # Create a new FeatureCollection from the processed features
    output_data = FeatureCollection(processed_features)

    # Write the output GeoJSON to a file
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)

# Process the GeoJSON and generate the output file
process_geojson(input_file, output_file, radius=radius)

print(f"Processed GeoJSON saved to {output_file}")

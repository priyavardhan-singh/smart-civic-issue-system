import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapController({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView(
        [location.latitude, location.longitude],
        15
      );
    }
  }, [location, map]);

  return null;
}

function LocationMap({ location ,onLocationChange }) {
  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={13}
      className="h-80 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController location={location} />

      <Marker
  position={location
      ? [location.latitude, location.longitude]
      : [28.6139, 77.2090]}
  draggable={true}
  eventHandlers={{
    dragend: (event) => {
      console.log("MARKER DRAGGED");

      const marker = event.target;
      const position = marker.getLatLng();

      console.log("New Latitude:", position.lat);
      console.log("New Longitude:", position.lng);
      onLocationChange(position.lat, position.lng);
    },
  }}
/>
    </MapContainer>
  );
}

export default LocationMap;
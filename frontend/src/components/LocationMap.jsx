import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
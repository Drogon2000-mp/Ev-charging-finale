// src/RoutingMachine.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

const RoutingMachine = ({ from, to }) => {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    // Remove old route if exists
    if (map._routingControl) {
      map.removeControl(map._routingControl);
    }

    // Create new route
    const routingControl = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: {
        styles: [{ color: "#007bff", weight: 5, opacity: 0.8 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: () => null,
    }).addTo(map);

    map._routingControl = routingControl;

    // Hide default instructions panel
    const container = routingControl.getContainer();
    if (container) container.style.display = "none";

    return () => {
      if (map._routingControl) {
        map.removeControl(map._routingControl);
        map._routingControl = null;
      }
    };
  }, [from, to, map]);

  return null;
};

export default RoutingMachine;

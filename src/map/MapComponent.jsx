// src/map/MapComponent.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { DEFAULT_COORDINATES } from "./constants";
import RoutingMachine from "./RoutingMachine";

/* ======================================================
   🔹 ICONS SETUP
====================================================== */

// 🧍 User icon
const userLocationIcon = new L.DivIcon({
  html: `<div style="width: 14px; height: 14px; background: #007bff; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: "",
});

// ⚡ Station icons
const stationIcons = {
  available: L.icon({
    iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png", // green marker
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  full: L.icon({
    iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png", // red marker
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
};

// 🎯 Destination icon
const destinationIcon = L.icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

/* ======================================================
   🔹 Location click marker (for user destination)
====================================================== */
function LocationClickMarker({ onClick, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || null);

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  const handleDragEnd = (e) => {
    const latlng = e.target.getLatLng();
    setPosition(latlng);
    onClick({ lat: latlng.lat, lng: latlng.lng });
  };

  return position ? (
    <Marker
      position={position}
      icon={destinationIcon}
      draggable={true}
      eventHandlers={{ dragend: handleDragEnd }}
    >
      <Popup>
        📍 Destination<br />
        {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
      </Popup>
    </Marker>
  ) : null;
}

/* ======================================================
   🔹 Main Map Component
====================================================== */
export default function MapComponent({
  stations = [],
  destination,
  routeTarget,
  onDestinationSelect,
  onMapClick,
  clickedLocation,
  selectedStationId,
}) {
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const [heading, setHeading] = useState(0);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ======================================================
     🔹 Listen to real-time broadcast updates
  ====================================================== */
  useEffect(() => {
    try {
      const bc = new BroadcastChannel("stations_channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "stations_updated") {
          setRefreshKey((prev) => prev + 1);
        }
      };
      return () => bc.close();
    } catch (err) {
      console.warn("BroadcastChannel not supported:", err);
    }
  }, []);

  /* ======================================================
     🔹 Orientation and geolocation
  ====================================================== */
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.alpha !== null) setHeading(event.alpha);
    };
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          if (trackingEnabled && mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], mapRef.current.getZoom(), {
              animate: true,
              duration: 1.2,
            });
          }
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [trackingEnabled]);

  /* ======================================================
     🔹 Map centering + selection focus
  ====================================================== */
  const center = useMemo(
    () =>
      userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [DEFAULT_COORDINATES.latitude, DEFAULT_COORDINATES.longitude],
    [userLocation]
  );

  useEffect(() => {
    if (!selectedStationId || !mapRef.current) return;
    const s = stations.find((st) => st._id === selectedStationId);
    if (s) mapRef.current.flyTo([s.lat, s.lng], 15, { animate: true, duration: 1.2 });
  }, [selectedStationId, stations]);

  useEffect(() => {
    if (routeTarget && mapRef.current) {
      mapRef.current.flyTo([routeTarget.lat, routeTarget.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [routeTarget]);

  const handleCenterClick = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo(
        [userLocation.latitude, userLocation.longitude],
        mapRef.current.getZoom(),
        { animate: true, duration: 1.2 }
      );
      setTrackingEnabled(true);
    }
  };

  /* ======================================================
     🔹 Render Map
  ====================================================== */
  return (
    <div style={{ height: "100%", width: "100%", minHeight: "500px" }} key={refreshKey}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        <LocateControl onClick={handleCenterClick} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* 🧍 User marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationIcon}
          >
            <Popup>
              <strong>📍 You are here</strong>
              <br />
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              <br />
              Heading: {Math.round(heading)}°
            </Popup>
          </Marker>
        )}

        {/* ⚡ Stations */}
        {(stations || []).map((station) => {
          const available = station.availableChargers ?? 0;
          const total = station.totalChargers ?? 0;
          const icon = available > 0 ? stationIcons.available : stationIcons.full;

          return (
            <Marker key={station._id} position={[station.lat, station.lng]} icon={icon}>
              <Popup>
                <div style={{ lineHeight: "1.5" }}>
                  <strong style={{ textTransform: "capitalize" }}>
                    {station.name}
                  </strong>
                  <br />
                  {station.address}
                  <br />
                  Rate: Rs {station.rate}/kWh
                  <br />
                  Speed: {station.speed} kW
                  <br />
                  Car Type: {station.carType || "All"}
                  <br />
                  <b>
                    Chargers:{" "}
                    <span
                      style={{
                        color: available > 0 ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {available}
                    </span>{" "}
                    / {total}
                  </b>
                  <br />
                  <button
                    style={{
                      marginTop: "6px",
                      padding: "5px 10px",
                      border: "none",
                      background: "#007bff",
                      color: "white",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                    onClick={() => {
                      if (typeof window.handleShowRouteFromMap === "function") {
                        window.handleShowRouteFromMap(station);
                      }
                    }}
                  >
                    Show Route
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 🎯 Destination */}
        <LocationClickMarker
          initialPosition={clickedLocation || destination}
          onClick={(loc) => {
            onDestinationSelect && onDestinationSelect(loc);
            onMapClick && onMapClick(loc);
          }}
        />

        {/* 🛣️ Route */}
        {routeTarget && userLocation ? (
          <RoutingMachine
            from={[userLocation.latitude, userLocation.longitude]}
            to={[routeTarget.lat, routeTarget.lng]}
          />
        ) : routeTarget ? (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              background: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              fontSize: "13px",
            }}
          >
            Waiting for your location to calculate route...
          </div>
        ) : null}
      </MapContainer>
    </div>
  );
}

/* ======================================================
   🔹 Custom “Center on My Location” Button
====================================================== */
function LocateControl({ onClick }) {
  const map = useMap();
  useEffect(() => {
    const controlDiv = L.DomUtil.create(
      "div",
      "leaflet-bar leaflet-control leaflet-control-custom"
    );
    controlDiv.style.width = "36px";
    controlDiv.style.height = "36px";
    controlDiv.style.backgroundColor = "white";
    controlDiv.style.border = "1px solid #ccc";
    controlDiv.style.borderRadius = "6px";
    controlDiv.style.display = "flex";
    controlDiv.style.alignItems = "center";
    controlDiv.style.justifyContent = "center";
    controlDiv.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
    controlDiv.style.cursor = "pointer";
    controlDiv.title = "Center on My Location";
    controlDiv.innerHTML = "🧭";

    const wrapper = L.DomUtil.create("div");
    wrapper.style.padding = "5px";
    wrapper.appendChild(controlDiv);

    controlDiv.onclick = (e) => {
      e.stopPropagation();
      onClick();
    };

    const CustomControl = L.Control.extend({
      onAdd: () => wrapper,
      onRemove: () => {},
    });

    const instance = new CustomControl({ position: "topright" });
    map.addControl(instance);

    return () => map.removeControl(instance);
  }, [map, onClick]);

  return null;
}

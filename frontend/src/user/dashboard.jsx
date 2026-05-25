import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./dashboard.css";
import MapComponent from "../map/MapComponent";
import "leaflet/dist/leaflet.css";
import { api } from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicleData, setVehicleData] = useState({
    carType: "",
    battery: "",
    speed: "",
    mileage: "",
  });

  const [stations, setStations] = useState([]);
  const [destination, setDestination] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [recommendationMode, setRecommendationMode] = useState("route");
  const [recommendation, setRecommendation] = useState(null);
  const [routeTarget, setRouteTarget] = useState(null);
  const [myReservations, setMyReservations] = useState([]);
  const [isReserving, setIsReserving] = useState(false);

  /* ============================
        FETCH ALL STATIONS
     ============================ */
  const fetchStations = async () => {
    try {
      const res = await api.get("/api/stations");
      setStations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch stations failed:", err);
      toast.error("Failed to load stations");
    }
  };

  useEffect(() => {
    fetchStations();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => {
          console.error(err);
          toast.error("Unable to get your location");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  /* ===============================
      BROADCAST UPDATE HANDLING
     =============================== */
  useEffect(() => {
    const handleUpdate = () => fetchStations();

    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel("stations_channel");
      bc.onmessage = (e) => {
        if (e.data.type === "stations_updated") handleUpdate();
      };
      return () => bc.close();
    } else {
      window.addEventListener("storage", handleUpdate);
      return () => window.removeEventListener("storage", handleUpdate);
    }
  }, []);

  /* ============================
       FETCH USER RESERVATIONS
     ============================ */
  const fetchReservations = async () => {
    try {
      const res = await api.get("/api/reservations/me");
      setMyReservations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMyReservations([]);
    }
  };

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ============================
      ROUTE TARGET RESTORE
     ============================ */
  useEffect(() => {
    const target =
      location.state?.routeTarget ||
      JSON.parse(localStorage.getItem("routeTarget") || "null");

    if (target && target.lat && target.lng) {
      setRouteTarget(target);
      setSelectedStationId(target._id);
    }
  }, [location.state]);

  /* ============================
          UTILITY FUNCTIONS
     ============================ */
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const getMaxTravelKm = () =>
    (Number(vehicleData.battery) / 100) * Number(vehicleData.mileage) ||
    Infinity;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const handleChange = (e) =>
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });

  const handleDestinationSelect = (coords) => {
    setDestination({ lat: coords.lat, lng: coords.lng });
    toast.info("Destination set! Now click 'Recommend Station'");
  };

  /* =====================================================
      ⭐ RECOMMENDATION UPDATED: FILTER BY CAR TYPE FIRST
     ===================================================== */
  const filterByCarType = (list) => {
    const type = vehicleData.carType?.toLowerCase();
    return list.filter(
      (station) =>
        station.carType &&
        station.carType.toLowerCase() === type
    );
  };

  const handleRecommend = (e) => {
    e.preventDefault();

    if (
      !vehicleData.carType ||
      vehicleData.battery === "" ||
      vehicleData.speed === "" ||
      vehicleData.mileage === ""
    ) {
      toast.error("Please fill in all vehicle fields.");
      return;
    }
    if (!userLocation) {
      toast.error("Need your location for recommendation.");
      return;
    }
    if (!destination) {
      toast.error("Please click map to set your destination first.");
      return;
    }

    if (recommendationMode === "route") handleRouteBasedRecommendation();
    else handleSmartScoringRecommendation();
  };

  /* -------------------------
      UPDATED ROUTE BASED MODE
     ------------------------- */
  const handleRouteBasedRecommendation = () => {
    const maxTravelKm = getMaxTravelKm();

    // distance from user to destination
    const distToDest = calcDistance(
      userLocation.lat,
      userLocation.lng,
      destination.lat,
      destination.lng
    );

    // stations that are reachable and on the way and have at least one available charger
    let reachable = stations.filter((s) => {
      if (s.lat == null || s.lng == null) return false;

      const distFromUser = calcDistance(
        userLocation.lat,
        userLocation.lng,
        s.lat,
        s.lng
      );

      // reachable by battery
      if (distFromUser > maxTravelKm) return false;

      // must be on the way (not farther than destination distance)
      if (distFromUser > distToDest) return false;

      // must have available chargers
      if (Number(s.availableChargers) <= 0) return false;

      return true;
    });

    // filter by car type
    reachable = filterByCarType(reachable);

    if (!reachable.length) {
      toast.error(`No stations found for ${vehicleData.carType} along route.`);
      return;
    }

    // choose nearest reachable
    const best = reachable.sort(
      (a, b) =>
        calcDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        calcDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
    )[0];

    setSelectedStationId(best._id);
    setRecommendation(best);
    setDestination({ lat: best.lat, lng: best.lng });

    toast.success(`Found recommended station: ${best.name}`);
  };

  /* -------------------------
      UPDATED SMART MODE (scoring)
     ------------------------- */
  const handleSmartScoringRecommendation = () => {
    // base filtering: must have at least one available charger and matching car type
    let candidates = stations.filter((s) => Number(s.availableChargers) > 0);
    candidates = filterByCarType(candidates);

    if (!candidates.length) {
      toast.error(`No available stations for ${vehicleData.carType}`);
      return;
    }

    // define user preferences
    const userSpeed = Number(vehicleData.speed) || 0;
    const maxDist = getMaxTravelKm();

    // Weights - tune as needed
    const weights = {
      chargersCount: 0.30, // prefer stations with more available chargers
      speedMatch: 0.25, // prefer stations matching requested speed
      distance: 0.20, // prefer closer
      price: 0.15, // prefer cheaper
      availRatio: 0.10, // ratio available/total
    };

    // compute score for each candidate
    const scored = candidates.map((s) => {
      const dist = calcDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);

      // chargers count score: normalized by an arbitrary cap (e.g., 10)
      const chargersCountScore = Math.min(Number(s.availableChargers) / 10, 1);

      // speed match: closer to requested speed gets higher score
      // e.g., if requested 50 and station is 50 => score 1. if station 11 and requested 50 => lower.
      const denomSpeed = Math.max(userSpeed, 50); // avoid divide by zero
      const speedDiff = Math.abs((Number(s.speed) || 0) - userSpeed);
      const speedMatchScore = Math.max(0, 1 - speedDiff / denomSpeed);

      // distance score: 1 if at 0 km, 0 if at >= maxDist
      const distanceScore = 1 - Math.min(dist / Math.max(maxDist, 1), 1);

      // price score: lower rate better; assume 200 Rs cap
      const priceScore = 1 - Math.min((Number(s.rate) || 0) / 200, 1);

      // availability ratio
      const availRatio = (Number(s.availableChargers) || 0) / Math.max(Number(s.totalChargers) || 1, 1);
      const availRatioScore = Math.min(availRatio, 1);

      const totalScore =
        chargersCountScore * weights.chargersCount +
        speedMatchScore * weights.speedMatch +
        distanceScore * weights.distance +
        priceScore * weights.price +
        availRatioScore * weights.availRatio;

      return { station: s, totalScore, dist };
    });

    // pick highest score; in tie, prefer more available chargers then closer
    scored.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if ((b.station.availableChargers || 0) !== (a.station.availableChargers || 0))
        return (b.station.availableChargers || 0) - (a.station.availableChargers || 0);
      return a.dist - b.dist;
    });

    const best = scored[0].station;

    setSelectedStationId(best._id);
    setRecommendation(best);
    setDestination({ lat: best.lat, lng: best.lng });

    toast.success(`Smart recommendation: ${best.name}`);
  };

  /* -------------------------
           RESERVATION
     ------------------------- */
  const handleReserve = async (stationId) => {
    if (isReserving) return;

    setIsReserving(true);
    try {
      await api.post("/api/reservations", {
        stationId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        vehicle: vehicleData.carType,
        note: "Reserved via dashboard",
      });

      toast.success("🎉 Reservation created!");
      fetchReservations();
      fetchStations();

      setTimeout(() => setRecommendation(null), 2000);
    } catch (err) {
      console.error("Reservation error:", err);
      toast.error(err?.response?.data?.message || "Failed to reserve station");
    } finally {
      setIsReserving(false);
    }
  };

  const handleShowRoute = (s) => {
    if (!s?.lat || !s?.lng) {
      toast.error("Station location missing");
      return;
    }
    setRouteTarget({ lat: s.lat, lng: s.lng });
    setSelectedStationId(s._id || s.id);
    toast.info(`📍 Route to ${s.name} displayed`);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo">EV Charging</div>
        <div className="nav-links">
          <Link to="/profile">Profile</Link>
          <Link to="/myreservation">My Reservation</Link>
          <span onClick={handleLogout}>Logout</span>
        </div>
      </header>

      <div className="main-grid">
        <aside className="left-panel">
          <h2>Your Vehicle & Destination</h2>
          <form onSubmit={handleRecommend}>
            <label>
              Car Type:
              <select name="carType" value={vehicleData.carType} onChange={handleChange}>
                <option value="">Select</option>
                <option value="hatchback">Hatchback</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
              </select>
            </label>

            <label>
              Battery %:
              <input
                type="number"
                name="battery"
                value={vehicleData.battery}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </label>

            <label>
              Charging Speed:
              <select name="speed" value={vehicleData.speed} onChange={handleChange}>
                <option value="">Select</option>
                <option value="11">11 kW</option>
                <option value="22">22 kW</option>
                <option value="50">50 kW</option>
              </select>
            </label>

            <label>
              Mileage (km):
              <input
                type="number"
                name="mileage"
                value={vehicleData.mileage}
                onChange={handleChange}
                min="0"
              />
            </label>

            <label>
              Recommendation Mode:
              <select
                value={recommendationMode}
                onChange={(e) => setRecommendationMode(e.target.value)}
              >
                <option value="route">Route Based</option>
                <option value="smart">Smart Scoring</option>
              </select>
            </label>

            <p className="hint">Click map to set destination</p>

            <button type="submit" className="primary-btn">
              Recommend Station
            </button>
          </form>
        </aside>

        <main className="map-panel">
          <MapComponent
            stations={stations}
            destination={destination}
            recommendation={recommendation}
            routeTarget={routeTarget}
            onDestinationSelect={handleDestinationSelect}
            selectedStationId={selectedStationId}
          />

          {recommendation && (
            <div className="station-details">
              <h3>Recommended Station</h3>

              <p><strong>{recommendation.name}</strong></p>
              <p>{recommendation.address}</p>

              {/* ⭐ NEW: SHOW CAR TYPE FROM DATABASE */}
              <p>Car Type: {recommendation.carType}</p>

              <p>Rate: Rs {recommendation.rate}/kWh</p>
              <p>Speed: {recommendation.speed} kW</p>
              <p>
                Available:{" "}
                {recommendation.availableChargers > 0
                  ? recommendation.availableChargers
                  : "Not Available"}
              </p>
              <p>Total: {recommendation.totalChargers}</p>

              <button
                className="reserve-btn"
                disabled={recommendation.availableChargers <= 0 || isReserving}
                onClick={() => handleReserve(recommendation._id)}
              >
                {isReserving
                  ? "Reserving..."
                  : recommendation.availableChargers <= 0
                  ? "No Chargers Available"
                  : "Reserve This Station"}
              </button>

              <button
                className="route-btn"
                onClick={() => handleShowRoute(recommendation)}
                style={{ marginLeft: 8 }}
              >
                Show Route
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

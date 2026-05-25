// src/pages/StationUserDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./stationdashboard.css";
import MapComponent from "../map/MapComponent";
import { api } from "../api"; // centralized axios instance

export default function StationUserDashboard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    speed: "",
    rate: "",
    carType: "",
    totalChargers: "",
    availableChargers: "",
    lat: "",
    lng: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [stations, setStations] = useState([]);

  // 🔹 Fetch all stations (for map + reference)
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data } = await api.get("/api/stations");
        setStations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("fetch stations error:", err);
        toast.error("Failed to load stations");
      }
    };

    fetchStations();
    const id = setInterval(fetchStations, 5000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lat || !formData.lng) {
      toast.error("Please click on the map to set your station location.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/stations", {
        ...formData,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      });

      toast.success("Station created successfully!");
      setFormData({
        name: "",
        address: "",
        speed: "",
        rate: "",
        carType: "",
        totalChargers: "",
        availableChargers: "",
        lat: "",
        lng: "",
      });

      // Broadcast update to other dashboards
      const bc = new BroadcastChannel("stations_channel");
      bc.postMessage({ type: "stations_updated" });
      bc.close();

      navigate("/stationmaster", { replace: true });
    } catch (err) {
      console.error("Error creating station:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          "Failed to create station";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleMapClick = (location) => {
    setFormData((prev) => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
    }));
    toast.info("Location selected! Now fill in the station details.");
  };

  return (
    <div className="station-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <i className="fas fa-bolt"></i>
            <span>Station Dashboard</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <i className="fas fa-user-circle"></i>
            <span>{localStorage.getItem("userEmail")}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div className="setup-container">
        <div className="setup-header">
          <h2>Setup Your Charging Station</h2>
          <p>Add your station details to make it available for users</p>
        </div>

        <div className="map-form-container">
          <div className="map-section">
            <h3>Select Location</h3>
            <p>Click on the map to set your station location.</p>

            <div style={{ height: "400px", width: "100%" }}>
              <MapComponent
                stations={stations}
                onMapClick={handleMapClick}
                clickedLocation={
                  formData.lat && formData.lng
                    ? { lat: Number(formData.lat), lng: Number(formData.lng) }
                    : null
                }
              />
            </div>

            {formData.lat && formData.lng && (
              <div className="selected-location">
                <span>Lat: {Number(formData.lat).toFixed(5)}</span>
                <span>Lng: {Number(formData.lng).toFixed(5)}</span>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Station Details</h3>
            <form onSubmit={handleSubmit} className="station-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Station Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Charging Speed (kW)</label>
                  <select
                    value={formData.speed}
                    onChange={(e) =>
                      setFormData({ ...formData, speed: e.target.value })
                    }
                    required
                  >
                    <option value="">Select speed</option>
                    <option value="11">11 kW</option>
                    <option value="22">22 kW</option>
                    <option value="50">50 kW</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Car Type</label>
                  <select
                    value={formData.carType}
                    onChange={(e) =>
                      setFormData({ ...formData, carType: e.target.value })
                    }
                    required
                  >
                    <option value="">Select type</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Rate (Rs/kWh)</label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Chargers</label>
                  <input
                    type="number"
                    value={formData.totalChargers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalChargers: e.target.value,
                      })
                    }
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div> Creating Station...
                    </>
                  ) : (
                    "Create Station"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
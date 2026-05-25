// src/pages/StationMaster.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./stationmaster.css";
import MapComponent from "../map/MapComponent";
import { api } from "../api"; // centralized axios instance

function StationMaster() {
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingStatusUpdate, setLoadingStatusUpdate] = useState({});

  // 🔹 Fetch logged-in user's station
  useEffect(() => {
    const fetchMyStation = async () => {
      try {
        const { data } = await api.get("/api/stations/mystation");
        setStation(data);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching my station:", error);
        if (error?.response?.status === 404) {
          toast.error("No station found. Please create one.");
          navigate("/stationuserdashboard", { replace: true });
        }
      }
    };
    fetchMyStation();
  }, [navigate]);

  // 🔹 Fetch reservations periodically
  useEffect(() => {
    let intervalId = null;

    if (activeTab === "reservation") {
      const fetchReservations = async () => {
        try {
          const { data } = await api.get("/api/reservations/station");
          setReservations(data);
        } catch (err) {
          console.error("Failed to fetch reservations:", err);
          toast.error("Failed to fetch reservations");
        }
      };

      fetchReservations();
      intervalId = setInterval(fetchReservations, 5000);
    }

    return () => clearInterval(intervalId);
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // 🔹 Save Station Updates
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/api/stations/${station._id}`, {
        ...formData,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      });

      setStation(data);
      setIsEditing(false);
      toast.success("Station updated successfully!");

      const bc = new BroadcastChannel("stations_channel");
      bc.postMessage({ type: "stations_updated" });
      bc.close();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update station");
    }
  };

  // 🔹 Handle Reservation Status Change
  const handleUpdateStatus = async (id, status) => {
    try {
      setLoadingStatusUpdate((prev) => ({ ...prev, [id]: true }));

      const { data: updatedReservation } = await api.patch(
        `/api/reservations/${id}/status`,
        { status }
      );

      setReservations((prev) =>
        prev.map((r) => (r._id === id ? updatedReservation : r))
      );

      const { data: refreshedStation } = await api.get("/api/stations/mystation");
      setStation(refreshedStation);

      const bc = new BroadcastChannel("stations_channel");
      bc.postMessage({ type: "stations_updated" });
      bc.close();

      toast.success(`Reservation marked as "${status}" successfully!`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update reservation status.");
    } finally {
      setLoadingStatusUpdate((prev) => ({ ...prev, [id]: false }));
    }
  };

  const stations = station ? [station] : [];
  const center =
    station && station.lat && station.lng
      ? [Number(station.lat), Number(station.lng)]
      : [27.7172, 85.324]; // Kathmandu default

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo"></h2>
        <nav>
          <ul>
            <li
              className={activeTab === "dashboard" ? "active" : ""}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={activeTab === "details" ? "active" : ""}
              onClick={() => setActiveTab("details")}
            >
              Station Details
            </li>
            <li
              className={activeTab === "reservation" ? "active" : ""}
              onClick={() => setActiveTab("reservation")}
            >
              Reservations
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="header">
          <span>Ev Charging Station</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="map-container" style={{ width: "80%", height: "80%" }}>
            <MapComponent
              stations={stations}
              selectedStationId={station?._id}
              destination={null}
              routeTarget={null}
            />
          </div>
        )}

        {/* Station Details */}
        {activeTab === "details" && station && (
          <div className="details-page">
            {!isEditing ? (
              <>
                <h2>{station.name}</h2>
                <p><b>Address:</b> {station.address}</p>
                <p><b>Speed:</b> {station.speed} kW</p>
                <p><b>Rate:</b> Rs {station.rate}/kWh</p>
                <p>
                  <b>Chargers:</b> {station.availableChargers}/{station.totalChargers}
                </p>
                <p><b>User:</b> {localStorage.getItem("userEmail")}</p>

                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
              </>
            ) : (
              <form onSubmit={handleSave} className="edit-form">
                <label>Station Name</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <label>Address</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />

                <label>Speed (kW)</label>
                <input
                  type="number"
                  value={formData.speed ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, speed: e.target.value })
                  }
                  required
                />

                <label>Rate (Rs/kWh)</label>
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  required
                />

                <label>Total Chargers</label>
                <input
                  type="number"
                  value={formData.totalChargers}
                  onChange={(e) =>
                    setFormData({ ...formData, totalChargers: e.target.value })
                  }
                  required
                />

                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reservation Tab */}
        {activeTab === "reservation" && (
          <div className="reservation-page">
            <h2>Reservations</h2>
            {reservations.length === 0 ? (
              <p>No reservations yet.</p>
            ) : (
              <ul>
                {reservations.map((r) => (
                  <li key={r._id} className="reservation-item">
                    <p><b>User:</b> {r.userId?.name} ({r.userId?.email})</p>
                    <p><b>Vehicle:</b> {r.vehicle || "N/A"}</p>
                    <p>
                      <b>Time:</b>{" "}
                      {new Date(r.startTime).toLocaleString()} →{" "}
                      {new Date(r.endTime).toLocaleString()}
                    </p>
                    <p><b>Status:</b> {r.status}</p>

                    {r.status === "pending" && (
                      <div>
                        <button
                          onClick={() => handleUpdateStatus(r._id, "accepted")}
                          className="accept-btn"
                          disabled={loadingStatusUpdate[r._id]}
                        >
                          {loadingStatusUpdate[r._id] ? "Processing..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r._id, "declined")}
                          className="decline-btn"
                          disabled={loadingStatusUpdate[r._id]}
                        >
                          {loadingStatusUpdate[r._id] ? "Processing..." : "Decline"}
                        </button>
                      </div>
                    )}

                    {r.status === "accepted" && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, "charging")}
                        className="start-btn"
                        disabled={loadingStatusUpdate[r._id]}
                      >
                        {loadingStatusUpdate[r._id] ? "Processing..." : "Start Charging"}
                      </button>
                    )}

                    {r.status === "charging" && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, "completed")}
                        className="complete-btn"
                        disabled={loadingStatusUpdate[r._id]}
                      >
                        {loadingStatusUpdate[r._id] ? "Processing..." : "Complete Charging"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StationMaster;
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./reservations.css";
import { api } from "../api";

function MyReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [stations, setStations] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, data: null });
  const [cancelConfirm, setCancelConfirm] = useState({ show: false, data: null });
  const [loadingAction, setLoadingAction] = useState(null);

  const fetchReservations = async () => {
    try {
      const res = await api.get("/api/reservations/me");
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchReservations error:", err);
      setReservations([]);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await api.get("/api/stations");
      setStations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchStations error:", err);
      setStations([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return navigate("/login");
    fetchReservations();
    fetchStations();
    const id = setInterval(fetchReservations, 5000);
    return () => clearInterval(id);
  }, [navigate]);

  const broadcastReservationUpdate = (type, id) => {
    try {
      const bc = new BroadcastChannel("reservations_channel");
      bc.postMessage({ type, id });
      bc.close();
    } catch (err) {
      console.warn("Broadcast error:", err);
    }
  };

  const resolveStation = async (r) => {
    if (r && typeof r.stationId === "object" && r.stationId !== null)
      return r.stationId;

    const id = r.stationId;
    const found = stations.find(
      (s) => s && (String(s._id) === String(id) || String(s.id) === String(id))
    );
    if (found) return found;

    if (id) {
      try {
        const res = await api.get(`/api/stations/${id}`);
        return res.data;
      } catch (err) {
        console.error("fetch station by id failed:", err);
      }
    }
    return null;
  };

  const handleShowRouteClick = async (r) => {
    try {
      const station = await resolveStation(r);
      if (!station) {
        toast.error("Station details not found.");
        return;
      }

      const lat = station.lat ?? station.latitude ?? station.location?.lat ?? station.coordinates?.lat;
      const lng = station.lng ?? station.longitude ?? station.location?.lng ?? station.coordinates?.lng;

      if (!lat || !lng) {
        toast.error("Station coordinates missing.");
        return;
      }

      const target = {
        _id: station._id || r.stationId,
        lat: Number(lat),
        lng: Number(lng),
        name: station.name || "Unnamed Station",
      };

      navigate("/dashboard", { state: { routeTarget: target } });
      localStorage.setItem("routeTarget", JSON.stringify(target));
      toast.info(`📍 Navigating to ${target.name}`);
    } catch (err) {
      console.error("ShowRouteClick error:", err);
      toast.error("Unable to show route.");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.data) return;
    
    const { id, stationName } = deleteConfirm.data;
    setLoadingAction(`delete-${id}`);
    
    try {
      await api.delete(`/api/reservations/${id}`);
      toast.success("🗑️ Reservation deleted successfully!");
      broadcastReservationUpdate("reservation_deleted", id);
      setReservations((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(`❌ ${err?.response?.data?.message || "Failed to delete reservation."}`);
    } finally {
      setLoadingAction(null);
      setDeleteConfirm({ show: false, data: null });
    }
  };

  const handleCancel = async () => {
    if (!cancelConfirm.data) return;
    
    const { id, stationName } = cancelConfirm.data;
    setLoadingAction(`cancel-${id}`);
    
    try {
      await api.patch(`/api/reservations/${id}/status`, { status: "cancelled" });
      toast.success("❌ Reservation cancelled successfully!");
      broadcastReservationUpdate("reservation_cancelled", id);
      fetchReservations();
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error("❌ Failed to cancel reservation.");
    } finally {
      setLoadingAction(null);
      setCancelConfirm({ show: false, data: null });
    }
  };

  const showDeleteConfirm = (id, stationName) => {
    setDeleteConfirm({
      show: true,
      data: { id, stationName }
    });
  };

  const showCancelConfirm = (id, stationName) => {
    setCancelConfirm({
      show: true,
      data: { id, stationName }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  return (
    <div className="myreservations-container">
      {/* Confirmation Modals */}
      {deleteConfirm.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to permanently delete this reservation for "{deleteConfirm.data.stationName}"?</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteConfirm({ show: false, data: null })}
                disabled={loadingAction}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={loadingAction}
              >
                {loadingAction === `delete-${deleteConfirm.data.id}` ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirm.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Cancellation</h3>
            <p>Are you sure you want to cancel your reservation for "{cancelConfirm.data.stationName}"?</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setCancelConfirm({ show: false, data: null })}
                disabled={loadingAction}
              >
                Keep Reservation
              </button>
              <button 
                className="confirm-cancel-btn"
                onClick={handleCancel}
                disabled={loadingAction}
              >
                {loadingAction === `cancel-${cancelConfirm.data.id}` ? "Cancelling..." : "Cancel Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="logo">EV Charging</div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            Logout
          </span>
        </div>
      </header>

      <h2>My Reservations</h2>

      {reservations.length === 0 ? (
        <p className="no-reservations">No reservations yet.</p>
      ) : (
        <div className="reservation-grid">
          {reservations.map((r) => {
            const station = typeof r.stationId === "object"
              ? r.stationId
              : stations.find((s) => s && (String(s._id) === String(r.stationId) || String(s.id) === String(r.stationId)));

            const statusLower = String(r.status || "").toLowerCase();
            const stationName = station?.name || "Unknown Station";
            const isActionLoading = loadingAction === `delete-${r._id}` || loadingAction === `cancel-${r._id}`;

            return (
              <div key={r._id} className={`reservation-card ${statusLower}`}>
                <div className="reservation-info">
                  <h4>{stationName}</h4>
                  <p>
                    {new Date(r.startTime).toLocaleString()} →{" "}
                    {new Date(r.endTime).toLocaleString()}
                  </p>
                  <p>
                    <b>Status:</b>{" "}
                    <span className={`status-tag ${statusLower}`}>
                      {r.status}
                    </span>
                  </p>
                </div>

                <div className="reservation-actions">
                  {(statusLower === "accepted" || statusLower === "pending") && (
                    <>
                      <button
                        className="route-btn"
                        onClick={() => handleShowRouteClick(r)}
                        disabled={isActionLoading}
                      >
                        Show Route
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => showCancelConfirm(r._id, stationName)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? "Processing..." : "Cancel"}
                      </button>
                    </>
                  )}

                  {(statusLower === "cancelled" || statusLower === "declined") && (
                    <button
                      className="delete-btn"
                      onClick={() => showDeleteConfirm(r._id, stationName)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? "Processing..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyReservations;
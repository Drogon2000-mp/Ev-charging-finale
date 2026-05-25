// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Admin.css";
import MapComponent from "../map/MapComponent";
import { api } from "../api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [stationUsers, setStationUsers] = useState([]);
  const [activeMenu, setActiveMenu] = useState("map");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, data: null });


  const fetchAllData = async () => {
    try {
      const [u, su, st] = await Promise.all([
        api.get("/api/users/role/user").then((r) => r.data),
        api.get("/api/users/role/stationUser").then((r) => r.data),
        api.get("/api/stations").then((r) => r.data),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setStationUsers(Array.isArray(su) ? su : []);
      setStations(Array.isArray(st) ? st : []);
    } catch (err) {
      console.error("❌ fetchAllData error:", err);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ======================================================
     🔹 Broadcast updates from other dashboards
  ====================================================== */
  useEffect(() => {
    const bc = new BroadcastChannel("stations_channel");
    bc.onmessage = (e) => {
      if (e.data?.type === "stations_updated") fetchAllData();
    };
    return () => bc.close();
  }, []);

  /* ======================================================
     🔹 Logout
  ====================================================== */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ======================================================
     🔹 Broadcast updates manually
  ====================================================== */
  const broadcastStationsUpdate = () => {
    const bc = new BroadcastChannel("stations_channel");
    bc.postMessage({ type: "stations_updated" });
    bc.close();
  };

  /* ======================================================
     🔹 Show delete confirmation modal
  ====================================================== */
  const showDeleteConfirm = (url, id, setList, label, name) => {
    setDeleteConfirm({
      show: true,
      data: { url, id, setList, label, name }
    });
  };

  /* ======================================================
     🔹 Delete any entity (User / Station User / Station)
  ====================================================== */
  const deleteEntity = async () => {
    if (!deleteConfirm.data) return;
    
    const { url, id, setList, label, name } = deleteConfirm.data;
    
    try {
      await api.delete(`${url}/${id}`);
      toast.success(`${label} "${name}" deleted successfully!`);
      setList((prev) => prev.filter((i) => i._id !== id));
      broadcastStationsUpdate();
    } catch (err) {
      console.error(`❌ Delete ${label} error:`, err);
      toast.error(err.response?.data?.message || `Failed to delete ${label}`);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setDeleteConfirm({ show: false, data: null });
    }
  };

  /* ======================================================
     🔹 Render UI
  ====================================================== */
  return (
    <div className="admin-dashboard">
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {deleteConfirm.data.label.toLowerCase()} "{deleteConfirm.data.name}"?</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteConfirm({ show: false, data: null })}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={deleteEntity}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="admin-header">
        <div className="header-left">
          <div className="logo">
            <i className="fas fa-bolt"></i>
            <span>EV Charging Admin</span>
          </div>
        </div>
        <div className="header-right">
          <div className="admin-info">
            <i className="fas fa-user-circle"></i>
            <span>Admin</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      {/* GRID LAYOUT */}
      <div className="admin-grid">
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <ul className="sidebar-menu">
            <li
              className={activeMenu === "map" ? "active" : ""}
              onClick={() => setActiveMenu("map")}
            >
              <i className="fas fa-map-marked-alt"></i>
              <span>Map View</span>
            </li>
            <li
              className={activeMenu === "users" ? "active" : ""}
              onClick={() => setActiveMenu("users")}
            >
              <i className="fas fa-users"></i>
              <span>Users</span>
              <span className="menu-badge">{users.length}</span>
            </li>
            <li
              className={activeMenu === "stations" ? "active" : ""}
              onClick={() => setActiveMenu("stations")}
            >
              <i className="fas fa-charging-station"></i>
              <span>Stations</span>
              <span className="menu-badge">{stations.length}</span>
            </li>
            <li
              className={activeMenu === "stationUsers" ? "active" : ""}
              onClick={() => setActiveMenu("stationUsers")}
            >
              <i className="fas fa-user-tie"></i>
              <span>Station Users</span>
              <span className="menu-badge">{stationUsers.length}</span>
            </li>
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <main className="admin-main">
          {/* USERS */}
          {activeMenu === "users" && (
            <div className="panel-content">
              <h2>User Management</h2>
              <div className="data-table">
                {users.map((u) => (
                  <div key={u._id} className="table-row">
                    <span>{u.name}</span>
                    <span>{u.email}</span>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        showDeleteConfirm("/api/users", u._id, setUsers, "User", u.name)
                      }
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATIONS */}
          {activeMenu === "stations" && (
            <div className="panel-content">
              <h2>Station Management</h2>
              <div className="cards-grid">
                {stations.map((s) => (
                  <div key={s._id} className="station-card">
                    <h3>{s.name}</h3>
                    <p>{s.address}</p>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        showDeleteConfirm("/api/stations", s._id, setStations, "Station", s.name)
                      }
                    >
                      <i className="fas fa-trash"></i> Delete Station
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATION USERS */}
          {activeMenu === "stationUsers" && (
            <div className="panel-content">
              <h2>Station Users</h2>
              <div className="data-table">
                {stationUsers.map((su) => (
                  <div key={su._id} className="table-row">
                    <span>{su.name}</span>
                    <span>{su.email}</span>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        showDeleteConfirm("/api/users", su._id, setStationUsers, "Station User", su.name)
                      }
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAP */}
          {activeMenu === "map" && (
            <div className="panel-content">
              <h2>Station Map View</h2>
              <div className="map-wrapper">
                <MapComponent stations={stations} key="admin-map" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
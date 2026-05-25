import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./login/login";
import SignUp from "./login/signup";
import Dashboard from "./user/dashboard";
import ProtectedRoute from "./login/protectedroute";
import AdminDashboard from "./admin/AdminDashboard";
import StationUserDashboard from "./stationuser/stationuserdashboard";
import Profile from "./user/profile";
import StationMaster from "./stationuser/stationmaster";
import MyReservations from "./user/MyReservation";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/myreservation" element={<MyReservations />} />

          {/* User Dashboard (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Station Dashboard (Map + Form) */}
          <Route
            path="/stationmaster"
            element={
              <ProtectedRoute allowedRole="stationuser">
                <StationMaster />
              </ProtectedRoute>
            }
          />

          {/* Station User Dashboard (summary page, if needed) */}
          <Route
            path="/stationuserdashboard"
            element={
              <ProtectedRoute allowedRole="stationuser">
                <StationUserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Profile (Protected, for any logged-in user) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRole="user">
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard (Protected) */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global Toast Container - This enables toasts across the entire app */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
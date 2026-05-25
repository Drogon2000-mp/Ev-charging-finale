import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./profile.css";
import { api } from "../api";

function Profile() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await api.get("/api/users/me");
        const data = response.data;
        
        if (data?.email) {
          setEmail(data.email);
          localStorage.setItem("userEmail", data.email);
        }
      } catch (err) {
        console.error("❌ Failed to fetch user info:", err);
        toast.error("Session expired. Please log in again.");
        navigate("/login", { replace: true });
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields!");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch("/api/users/change-password", { 
        newPassword 
      });

      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("❌ Password change failed:", err);
      const errorMessage = err.response?.data?.message || "An error occurred while changing your password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-page">
      <header className="header">
        <div
          className="logo"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          EV Charging
        </div>

        <div className="nav-links">
          <span
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer", marginRight: "20px" }}
          >
            Dashboard
          </span>
          <span onClick={handleLogout} style={{ cursor: "pointer" }}>
            Logout
          </span>
        </div>
      </header>

      <div className="profile-container">
        <h2>User Profile</h2>
        <form onSubmit={handlePasswordChange} className="profile-form">
          <div className="form-group">
            <label>
              Email:
              <input 
                type="email" 
                value={email} 
                readOnly 
                className="readonly-input"
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              New Password:
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                required
                minLength="8"
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Confirm Password:
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength="8"
              />
            </label>
          </div>

          <button 
            type="submit" 
            className="primary-btn" 
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Changing Password...
              </>
            ) : (
              "Change Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
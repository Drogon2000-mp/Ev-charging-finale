// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Login.css";
import { api } from "../api"; // centralized axios instance

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);

      try {
        const { data } = await api.post("/api/login", formData);


        localStorage.setItem("authToken", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userEmail", data.email);
        if (data.userId) localStorage.setItem("userId", data.userId);

        // ✅ Show success toast first
        toast.success("Login successful!");

        // ✅ Wait for toast to be visible, then navigate
        setTimeout(() => {
          if (data.role === "admin") {
            navigate("/admin-dashboard", { replace: true });
          } else if (data.role === "stationUser") {
            navigate("/stationmaster", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 1500); 

      } catch (err) {
        console.error("Login error:", err);
        const message = err.response?.data?.message || "Login failed. Please try again.";
        
        // Check for specific error messages
        if (message.toLowerCase().includes("password") || message.toLowerCase().includes("invalid credentials")) {
          toast.error("Password didn't match. Please try again.");
        } else if (message.toLowerCase().includes("user not found") || message.toLowerCase().includes("email")) {
          toast.error("User not found. Please check your email.");
        } else {
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <i className="fas fa-bolt"></i>
            <span>EV Charge</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={errors.email ? "error" : ""}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={errors.password ? "error" : ""}
              />
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign up</span>
          </p>
        </div>
      </div>

      <div className="login-background">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
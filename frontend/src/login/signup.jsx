// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Signup.css";
import { api } from "../api"; // centralized axios instance

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
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
        console.log("Sending signup data:", formData);
        
        const { data } = await api.post("/api/signup", formData);
        
        console.log("Signup response:", data);

        // ✅ Save login info
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        localStorage.setItem("role", formData.role);
        localStorage.setItem("userEmail", formData.email);
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
        }

        toast.success("Account created successfully!");

        // ✅ Wait for toast to be visible, then redirect
        setTimeout(() => {
          if (formData.role === "stationUser") {
            navigate("/stationuserdashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 1500); // 1.5 second delay to see the toast

      } catch (err) {
        console.error("Signup error details:", err);
        
        // Enhanced error handling
        if (err.response) {
          // Server responded with error status
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
          console.error("Response headers:", err.response.headers);
          
          const errorMessage = err.response.data?.error || 
                              err.response.data?.message || 
                              `Signup failed (${err.response.status})`;
          
          // Check for specific error messages
          if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("already exists")) {
            toast.error("Email already exists. Please use a different email.");
          } else if (errorMessage.toLowerCase().includes("password")) {
            toast.error("Password requirements not met.");
          } else {
            toast.error(errorMessage);
          }
          
          // Handle specific error cases
          if (err.response.status === 400) {
            // Bad request - show specific field errors if available
            if (err.response.data.errors) {
              setErrors(err.response.data.errors);
            } else if (err.response.data.error?.includes("email")) {
              setErrors({ email: "Email already exists or is invalid" });
            }
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error("No response received:", err.request);
          toast.error("Network error. Please check your connection.");
        } else {
          // Something else happened
          console.error("Error:", err.message);
          toast.error("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <div className="logo">
            <i className="fas fa-bolt"></i>
            <span>EV Charge</span>
          </div>
          <h1>Create Your Account</h1>
          <p>Join the EV community today</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <i className="fas fa-user"></i>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "error" : ""}
              />
            </div>
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <i className="fas fa-envelope"></i>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
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
                placeholder="Choose a password (min. 8 characters)"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={errors.password ? "error" : ""}
              />
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <div className="input-with-icon">
              <i className="fas fa-user-tag"></i>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
              >
                <option value="user">Regular User</option>
                <option value="stationUser">Station Owner</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className={`signup-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/")}>Sign in</span>
          </p>
        </div>
      </div>

      <div className="signup-background">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
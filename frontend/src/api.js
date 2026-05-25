// src/api.js
import axios from "axios";

export const API_BASE =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
  "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// automatically attach auth token (if present)
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("authToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
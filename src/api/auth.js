import { api, setToken } from "./client";

export async function login(email, password) {
  const data = await api.post("/auth/login", { email, password });
  setToken(data.token);
  return data;
}

export async function register(name, email, password) {
  const data = await api.post("/auth/register", { name, email, password });
  setToken(data.token);
  return data;
}

export async function registerOnly(name, email, password) {
  const data = await api.post("/auth/register", { name, email, password });
  return data;
}

export async function getProfile() {
  return api.get("/auth/me");
}

export async function updateProfile(data) {
  return api.put("/auth/me", data);
}

export async function logout() {
  setToken(null);
}

export async function forgotPassword(email) {
  return api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token, password) {
  return api.put(`/auth/reset-password/${token}`, { password });
}

export async function changePassword(currentPassword, newPassword) {
  return api.put("/auth/change-password", { currentPassword, newPassword });
}

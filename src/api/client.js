const API_BASE = process.env.REACT_APP_API_URL || "/api";
const BACKEND_FALLBACK = "http://localhost:5000/api";

let authToken = localStorage.getItem("mv_auth_token") || null;

export function setToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem("mv_auth_token", token);
  } else {
    localStorage.removeItem("mv_auth_token");
  }
}

export function getToken() {
  return authToken;
}

async function doFetch(url, config) {
  try {
    return await fetch(url, config);
  } catch (err) {
    if (url.startsWith("/api") && BACKEND_FALLBACK) {
      const fallbackUrl = url.replace("/api", BACKEND_FALLBACK);
      try {
        return await fetch(fallbackUrl, config);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

async function request(endpoint, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (authToken) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await doFetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new Error("Unable to connect to server. Please ensure the backend server is running.");
  }

  if (res.status === 401 && !endpoint.startsWith("/auth/login")) {
    setToken(null);
    localStorage.removeItem("mv_auth");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  let data = {};
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    data = { error: text || `Server error (${res.status})` };
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// Raw request for vault operations that should not trigger session redirect on 401
async function vaultRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (authToken) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await doFetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new Error("Unable to connect to server.");
  }

  let data = {};
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const config = {
    method: "POST",
    headers: {},
  };

  if (authToken) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }

  let res;
  try {
    res = await doFetch(`${API_BASE}/upload`, { ...config, body: formData });
  } catch {
    throw new Error("Unable to connect to server for file upload.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }

  return res.json();
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  delete: (endpoint, body) => request(endpoint, { method: "DELETE", body }),
  vaultGet: (endpoint) => vaultRequest(endpoint),
  vaultPost: (endpoint, body) => vaultRequest(endpoint, { method: "POST", body }),
};

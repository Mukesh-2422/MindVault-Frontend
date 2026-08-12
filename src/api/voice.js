import { api } from "./client";

export async function uploadVoiceMemory(formData) {
  const token = localStorage.getItem("mv_auth_token");
    const response = await fetch(`${process.env.REACT_APP_API_URL || ""}/api/voice`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload voice memory");
  }

  return response.json();
}

export async function getVoiceMemories() {
  return api.get("/voice");
}

export async function getVoiceMemory(id) {
  return api.get(`/voice/${id}`);
}

export async function deleteVoiceMemory(id) {
  return api.delete(`/voice/${id}`);
}

/**
 * Get the authenticated media URL with auth token appended as query param.
 * This is needed for <img>/<audio>/<video> elements that cannot set custom headers.
 */
export function getMediaUrl(mediaUrl) {
  if (!mediaUrl) return null;
  // If it's already an absolute URL pointing to the media API, add the token
  if (mediaUrl.startsWith("/api/media/")) {
    const token = localStorage.getItem("mv_auth_token");
    if (token) {
      return `${mediaUrl}?token=${encodeURIComponent(token)}`;
    }
  }
  return mediaUrl;
}
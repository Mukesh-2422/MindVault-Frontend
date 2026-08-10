import { api, uploadFile } from "./client";

export async function getMemories() {
  return api.get("/memories");
}

export async function getMemory(id) {
  return api.get(`/memories/${id}`);
}

export async function createMemory(data) {
  return api.post("/memories", data);
}

export async function saveVoiceMemory({ audioBlob, duration, title, content = "", metadata = {} }) {
  if (!audioBlob) {
    throw new Error("No audio recorded");
  }

  const file = new File([audioBlob], `voice_${Date.now()}.webm`, {
    type: audioBlob.type || "audio/webm",
  });

  const uploaded = await uploadFile(file);

  return createMemory({
    title: title || `Voice note - ${new Date().toLocaleDateString()}`,
    content: content || "",
    type: "voice",
    mediaUrl: uploaded.url,
    mediaName: uploaded.name,
    mediaType: uploaded.mimetype,
    mediaSize: uploaded.size,
    duration,
    ...metadata,
  });
}

export async function updateMemory(id, data) {
  return api.put(`/memories/${id}`, data);
}

export async function deleteMemory(id) {
  return api.delete(`/memories/${id}`);
}

export async function restoreMemory(id) {
  return api.post(`/memories/${id}/restore`);
}

export async function permanentDeleteMemory(id) {
  return api.delete(`/memories/${id}/permanent`);
}

export async function togglePinMemory(id) {
  return api.post(`/memories/${id}/toggle-pin`);
}

export async function moveMemoryToVault(id) {
  return api.post(`/memories/${id}/move-to-vault`);
}

/**
 * Securely retrieve a single memory for use as chat context.
 * The backend verifies ownership (memoryId + authenticated userId).
 */
export async function selectMemory(memoryId) {
  return api.post("/memories/select", { memoryId });
}

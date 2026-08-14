import { api } from "./client";

export async function sendMessage(content, selectedMemoryId = null, conversation = null) {
  return api.post("/chat", { content, selectedMemoryId, conversation });
}

/**
 * When the user clicks a source/memory card in the chat, call this
 * to have the backend retrieve the memory (with ownership check)
 * and generate a response based solely on that memory.
 */
export async function selectMemoryContext(memoryId, userQuery = "") {
  return api.post("/chat/select-memory", { memoryId, userQuery });
}

export async function updateMemoryFromChat(memoryId, data) {
  return api.put(`/chat/memory/${memoryId}`, data);
}


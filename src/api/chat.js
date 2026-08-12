import { api } from "./client";

export async function getChatHistory() {
  return api.get("/chat");
}

export async function getConversation(conversationId) {
  return api.get(`/chat/conversations/${conversationId}`);
}

export async function sendMessage(content, selectedMemoryId = null, conversationId = null, requestId = null) {
  return api.post("/chat", { content, selectedMemoryId, conversationId, requestId });
}

/**
 * When the user clicks a source/memory card in the chat, call this
 * to have the backend retrieve the memory (with ownership check)
 * and generate a response based solely on that memory.
 */
export async function selectMemoryContext(memoryId, conversationId = null) {
  return api.post("/chat/select-memory", { memoryId, conversationId });
}

export async function updateMemoryFromChat(memoryId, data) {
  return api.put(`/chat/memory/${memoryId}`, data);
}

export async function clearChatHistory() {
  return api.delete("/chat");
}

export async function deleteConversation(conversationId) {
  return api.delete(`/chat/conversation/${conversationId}`);
}

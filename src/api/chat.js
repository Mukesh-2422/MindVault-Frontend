import { api } from "./client";

export async function getChatHistory() {
  return api.get("/chat");
}

export async function getConversation(conversationId, messageIds = null) {
  let url = `/chat/conversations/${conversationId}`;
  if (messageIds && messageIds.length > 0) {
    const qs = messageIds.map((id) => `messageIds=${encodeURIComponent(id)}`).join("&");
    url += `?${qs}`;
  }
  return api.get(url);
}

export async function sendMessage(content, selectedMemoryId = null) {
  return api.post("/chat", { content, selectedMemoryId });
}

/**
 * When the user clicks a source/memory card in the chat, call this
 * to have the backend retrieve the memory (with ownership check)
 * and generate a response based solely on that memory.
 */
export async function selectMemoryContext(memoryId) {
  return api.post("/chat/select-memory", { memoryId });
}

export async function updateMemoryFromChat(memoryId, data) {
  return api.put(`/chat/memory/${memoryId}`, data);
}

export async function clearChatHistory() {
  return api.delete("/chat");
}

export async function deleteConversation(conversationId, messageIds) {
  return api.delete(`/chat/conversation/${conversationId}`, { messageIds });
}

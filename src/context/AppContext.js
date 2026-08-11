import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import * as authApi from "../api/auth";
import * as memoriesApi from "../api/memories";
import * as peopleApi from "../api/people";
import * as chatApi from "../api/chat";
import * as vaultApi from "../api/vault";
import { getToken } from "../api/client";

const AppContext = createContext();

const initialState = {
  memories: [],
  people: [],
  chatHistory: [],
  currentChat: [], // Active chat session on Home page
  activeConversationId: null, // ID of conversation being viewed in chat history
  memorySearchResults: [],
  theme: "light",
  language: "en",
  user: null,
  vaultLocked: true,
  vaultPasswordSet: false,
  isAuthenticated: false,
  searchQuery: "",
  loading: false,
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case "LOGOUT":
      return {
        ...initialState,
        theme: state.theme,
        language: state.language,
      };
    case "SET_DATA":
      return {
        ...state,
        memories: action.payload.memories,
        people: action.payload.people,
        chatHistory: action.payload.chatHistory,
      };
    case "SET_MEMORIES":
      return { ...state, memories: action.payload };
    case "ADD_MEMORY":
      return { ...state, memories: [action.payload, ...state.memories] };
    case "UPDATE_MEMORY":
      return {
        ...state,
        memories: state.memories.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
    case "DELETE_MEMORY":
      return {
        ...state,
        memories: state.memories.map((m) =>
          m.id === action.payload
            ? { ...m, deleted: true, deletedAt: new Date().toISOString() }
            : m
        ),
      };
    case "RESTORE_MEMORY":
      return {
        ...state,
        memories: state.memories.map((m) =>
          m.id === action.payload
            ? { ...m, deleted: false, deletedAt: null }
            : m
        ),
      };
    case "PERMANENT_DELETE":
      return {
        ...state,
        memories: state.memories.filter((m) => m.id !== action.payload),
      };
    case "TOGGLE_PIN":
      return {
        ...state,
        memories: state.memories.map((m) =>
          m.id === action.payload ? { ...m, pinned: !m.pinned } : m
        ),
      };
    case "ADD_CHAT":
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case "SET_CHAT_HISTORY":
      return { ...state, chatHistory: action.payload };
    case "SET_CURRENT_CHAT":
      return { ...state, currentChat: action.payload };
    case "ADD_CURRENT_CHAT_MESSAGE":
      return { ...state, currentChat: [...state.currentChat, action.payload] };
    case "REPLACE_CURRENT_CHAT_MESSAGE":
      return {
        ...state,
        currentChat: state.currentChat.map((msg) =>
          msg.id === action.payload.localId ? action.payload.message : msg
        ),
      };
    case "CLEAR_CURRENT_CHAT":
      return { ...state, currentChat: [], activeConversationId: null };
    case "SET_ACTIVE_CONVERSATION_ID":
      return { ...state, activeConversationId: action.payload };
    case "SET_PEOPLE":
      return { ...state, people: action.payload };
    case "ADD_PERSON":
      return { ...state, people: [...state.people, action.payload] };
    case "UPDATE_PERSON":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "UNLOCK_VAULT":
      return { ...state, vaultLocked: false };
    case "LOCK_VAULT":
      return { ...state, vaultLocked: true };
    case "SET_VAULT_STATUS":
      return {
        ...state,
        vaultLocked: action.payload.locked,
        vaultPasswordSet: action.payload.passwordSet,
      };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "ADD_CHAT_SESSION":
      return {
        ...state,
        chatHistory: [action.payload, ...state.chatHistory],
      };
    case "TOGGLE_PIN_CHAT":
      return {
        ...state,
        chatHistory: state.chatHistory.map((chat) =>
          chat.id === action.payload ? { ...chat, pinned: !chat.pinned } : chat
        ),
      };
    case "LOAD_CHAT_SESSION":
      return {
        ...state,
        activeChatId: action.payload,
      };
    case "SET_MEMORY_SEARCH_RESULTS":
      return {
        ...state,
        memorySearchResults: action.payload,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => {
    const savedTheme = localStorage.getItem("mv_theme");
    const savedToken = getToken();
    return {
      ...init,
      theme: savedTheme || "light",
      isAuthenticated: !!savedToken,
    };
  });

  const applyTheme = useCallback((themeValue) => {
    const resolved = themeValue === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : themeValue;
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  useEffect(() => {
    localStorage.setItem("mv_theme", state.theme);
    applyTheme(state.theme);
  }, [state.theme, applyTheme]);

  // Listen for OS theme changes when in "system" mode
  useEffect(() => {
    if (state.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.theme, applyTheme]);

  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [memories, people] = await Promise.all([
        memoriesApi.getMemories(),
        peopleApi.getPeople(),
      ]);
      dispatch({ type: "SET_DATA", payload: { memories, people, chatHistory: [] } });

      try {
        const profile = await authApi.getProfile();
        dispatch({ type: "UPDATE_USER", payload: profile });
      } catch {}


    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    if (state.isAuthenticated && getToken()) {
      loadData();
    }
  }, [state.isAuthenticated, loadData]);

  const loadChatHistory = useCallback(async () => {
    try {
      const chatHistory = await chatApi.getChatHistory();
      dispatch({ type: "SET_CHAT_HISTORY", payload: chatHistory });
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  }, [dispatch]);

  const deleteConversation = useCallback(async (conversationId, messageIds = []) => {
    try {
      await chatApi.deleteConversation(conversationId, messageIds);
      // Reload chat history after deletion
      const chatHistory = await chatApi.getChatHistory();
      dispatch({ type: "SET_CHAT_HISTORY", payload: chatHistory });
      return { success: true };
    } catch (err) {
      console.error("Error deleting conversation:", err);
      return { error: err.message || "Failed to delete conversation" };
    }
  }, [dispatch]);

  const processChat = useCallback(async (userMessage, selectedMemoryId = null) => {
    try {
      const result = await chatApi.sendMessage(userMessage, selectedMemoryId);
      // Add to persistent chat history
      if (result.user) dispatch({ type: "ADD_CHAT", payload: result.user });
      if (result.assistant) dispatch({ type: "ADD_CHAT", payload: result.assistant });
      // Refresh memories to pick up any new relations
      const memories = await memoriesApi.getMemories();
      dispatch({ type: "SET_MEMORIES", payload: memories });
      return result;
    } catch (err) {
      console.error("Chat error:", err);
      return { error: err.message || "Something went wrong. Please try again." };
    }
  }, []);

  const selectMemoryContext = useCallback(async (memoryId) => {
    try {
      const result = await chatApi.selectMemoryContext(memoryId);
      // Add to persistent chat history
      if (result.assistant) dispatch({ type: "ADD_CHAT", payload: result.assistant });
      return result;
    } catch (err) {
      console.error("Memory selection error:", err);
      return { error: err.message || "Something went wrong." };
    }
  }, [dispatch]);

  const handleLogin = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    dispatch({ type: "AUTH_SUCCESS", payload: { user: data.user } });
    return data.user;
  }, []);

  const handleRegister = useCallback(async (name, email, password) => {
    await authApi.registerOnly(name, email, password);
  }, []);

  const handleLogout = useCallback(async () => {
    // Do NOT clear chat history from backend - just clear local state
    authApi.logout();
    dispatch({ type: "LOGOUT" });
  }, [dispatch]);

  const loadConversation = useCallback(async (conversationId, messageIds = null) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const conversation = await chatApi.getConversation(conversationId, messageIds);
      dispatch({ type: "SET_CURRENT_CHAT", payload: conversation.messages || [] });
      dispatch({ type: "SET_ACTIVE_CONVERSATION_ID", payload: conversationId });
    } catch (err) {
      console.error("Error loading conversation:", err);
      dispatch({ type: "SET_ERROR", payload: err.message || "Failed to load conversation" });
      dispatch({ type: "SET_CURRENT_CHAT", payload: [] });
      dispatch({ type: "SET_ACTIVE_CONVERSATION_ID", payload: null });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [dispatch]);

  const value = {
    state,
    dispatch,
    processChat,
    selectMemoryContext,
    loadData,
    loadChatHistory,
    loadConversation,
    deleteConversation,
    handleLogin,
    handleRegister,
    handleLogout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

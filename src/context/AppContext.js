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
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("mv_theme") || "light";
    const savedLanguage = localStorage.getItem("mv_language") || "en";
    dispatch({ type: "SET_THEME", payload: savedTheme });
    dispatch({ type: "SET_LANGUAGE", payload: savedLanguage });
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Update theme attribute when state changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
    localStorage.setItem("mv_theme", state.theme);
  }, [state.theme]);

  // Update language in localStorage
  useEffect(() => {
    localStorage.setItem("mv_language", state.language);
  }, [state.language]);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const user = await authApi.getProfile();
        dispatch({ type: "AUTH_SUCCESS", payload: { user } });
      } catch (err) {
        console.error("Auth check failed:", err);
        authApi.logout();
        dispatch({ type: "LOGOUT" });
      }
    };
    checkAuth();
  }, []);

  // Check vault status
  useEffect(() => {
    if (state.isAuthenticated && getToken()) {
      const checkVault = async () => {
        try {
          const status = await vaultApi.getVaultStatus();
          dispatch({
            type: "SET_VAULT_STATUS",
            payload: {
              locked: status.locked !== false,
              passwordSet: status.passwordSet || false,
            },
          });
        } catch {
          // Vault endpoints might not be available or user not logged in
        }
      };
      checkVault();
    }
  }, [state.isAuthenticated]);

  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [memories, people] = await Promise.all([
        memoriesApi.getMemories(),
        peopleApi.getPeople(),
      ]);
      dispatch({ type: "SET_DATA", payload: { memories, people } });

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

  const processChat = useCallback(async (userMessage, selectedMemoryId = null, conversation = null) => {
    try {
      const result = await chatApi.sendMessage(userMessage, selectedMemoryId, conversation);
      // Refresh memories in background in case new links were formed
      memoriesApi.getMemories().then((memories) => {
        dispatch({ type: "SET_MEMORIES", payload: memories });
      }).catch(() => {});
      return result;
    } catch (err) {
      console.error("Chat error:", err);
      return { error: err.message || "Something went wrong. Please try again." };
    }
  }, []);

  const selectMemoryContext = useCallback(async (memoryId, userQuery = "") => {
    try {
      return await chatApi.selectMemoryContext(memoryId, userQuery);
    } catch (err) {
      console.error("Memory selection error:", err);
      return { error: err.message || "Something went wrong." };
    }
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    dispatch({ type: "AUTH_SUCCESS", payload: { user: data.user } });
    return data.user;
  }, []);

  const handleRegister = useCallback(async (name, email, password) => {
    await authApi.registerOnly(name, email, password);
  }, []);

  const handleLogout = useCallback(async () => {
    authApi.logout();
    try {
      localStorage.removeItem("mv_active_conversation");
    } catch {}
    dispatch({ type: "LOGOUT" });
  }, []);

  const value = {
    state,
    dispatch,
    processChat,
    selectMemoryContext,
    loadData,
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

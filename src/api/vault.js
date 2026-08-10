import { api } from "./client";

export async function getVaultStatus() {
  return api.vaultGet("/vault/status");
}

export async function createVault(password) {
  return api.vaultPost("/vault/create", { password });
}

export async function unlockVault(password) {
  return api.vaultPost("/vault/unlock", { password });
}

export async function lockVault() {
  return api.vaultPost("/vault/lock");
}

export async function getVaultMemories() {
  return api.vaultGet("/vault/memories");
}

export async function changeVaultPassword(currentPassword, newPassword) {
  return api.vaultPost("/vault/change-password", { currentPassword, newPassword });
}

export async function resetVault() {
  return api.post("/vault/reset");
}

export async function forgotVaultPassword(email) {
  return api.post("/vault/forgot-password", { email });
}

export async function resetVaultPassword(token, password) {
  return api.post(`/vault/reset-password/${token}`, { password });
}

import { api } from "./client";

export async function getPeople() {
  return api.get("/people");
}

export async function getPerson(id) {
  return api.get(`/people/${id}`);
}

export async function createPerson(data) {
  return api.post("/people", data);
}

export async function updatePerson(id, data) {
  return api.put(`/people/${id}`, data);
}

import api from "./api";

export const usersService = {
  getAll: async () => (await api.get("users/manage/")).data,
  create: async (data) => (await api.post("users/manage/", data)).data,
  update: async (id, data) => (await api.put(`users/manage/${id}/`, data)).data,
  resetPassword: async (id, password) => (await api.post(`users/manage/${id}/reset-password/`, { password })).data,
};

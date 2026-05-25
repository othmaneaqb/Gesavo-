import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('users/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getProfile: async () => {
    const response = await api.get('users/profile/');
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('users/password-reset/', { email });
    return response.data;
  },

  confirmPasswordReset: async ({ uid, token, password, passwordConfirm }) => {
    const response = await api.post('users/password-reset/confirm/', {
      uid,
      token,
      password,
      password_confirm: passwordConfirm,
    });
    return response.data;
  }
};

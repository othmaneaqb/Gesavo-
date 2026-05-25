import api from './api';

const toFrontendClient = (client) => ({
  id: client.id,
  name: [client.first_name, client.last_name].filter(Boolean).join(' ').trim(),
  nationalId: client.national_id || '',
  phone: client.phone || '',
  email: client.email || '',
  address: client.address || '',
  notes: client.notes || '',
  activeCases: 0,
  totalFees: 0,
  paidFees: 0,
  lastActivity: client.updated_at || client.created_at,
  status: 'active',
});

const toBackendClient = (client) => {
  const [firstName = '', ...rest] = client.name.trim().split(/\s+/);

  return {
    first_name: firstName,
    last_name: rest.join(' '),
    national_id: client.nationalId || null,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null,
    notes: client.notes || null,
  };
};

export const clientsService = {
  getAll: async () => {
    const response = await api.get('clients/');
    return response.data.map(toFrontendClient);
  },
  
  getById: async (id) => {
    const response = await api.get(`clients/${id}/`);
    return toFrontendClient(response.data);
  },

  create: async (data) => {
    const response = await api.post('clients/', toBackendClient(data));
    return toFrontendClient(response.data);
  },

  update: async (id, data) => {
    const response = await api.put(`clients/${id}/`, toBackendClient(data));
    return toFrontendClient(response.data);
  },

  delete: async (id) => {
    const response = await api.delete(`clients/${id}/`);
    return response.data;
  }
};

import fastAxiosInstance from '@/axiosConfig/axiosfig';

export const adminAnalyticsApi = {
    get: () => fastAxiosInstance.get('/api/admin/analytics'),
};

export const startupContactsApi = {
    list: () => fastAxiosInstance.get('/api/admin/startup-contacts'),
    create: (data: Record<string, unknown>) => fastAxiosInstance.post('/api/admin/startup-contacts', data),
    update: (id: string, data: Record<string, unknown>) => fastAxiosInstance.put(`/api/admin/startup-contacts/${id}`, data),
    delete: (id: string) => fastAxiosInstance.delete(`/api/admin/startup-contacts/${id}`),
};

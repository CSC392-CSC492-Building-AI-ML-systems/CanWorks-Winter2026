import fastAxiosInstance from '@/axiosConfig/axiosfig';

export const outreachApi = {
    // Resume
    uploadResume: (formData: FormData) =>
        fastAxiosInstance.post('/api/student/resume', formData),
    getResume: () =>
        fastAxiosInstance.get('/api/student/resume'),

    // Startup contacts (public)
    listContacts: () =>
        fastAxiosInstance.get('/api/startup-contacts'),

    // Drafts
    generateDrafts: (data: { startup_contact_ids: string[]; role_interest: string }) =>
        fastAxiosInstance.post('/api/outreach/generate', data, { timeout: 120000 }),
    listDrafts: () =>
        fastAxiosInstance.get('/api/outreach/drafts'),
    updateDraft: (id: string, data: { subject?: string; body?: string }) =>
        fastAxiosInstance.put(`/api/outreach/drafts/${id}`, data),
    approveDraft: (id: string) =>
        fastAxiosInstance.post(`/api/outreach/drafts/${id}/approve`),
    approveAllDrafts: () =>
        fastAxiosInstance.post('/api/outreach/drafts/approve-all'),
    deleteDraft: (id: string) =>
        fastAxiosInstance.delete(`/api/outreach/drafts/${id}`),

    // Gmail
    getGmailAuthUrl: () =>
        fastAxiosInstance.get('/api/gmail/auth-url'),
    getGmailStatus: () =>
        fastAxiosInstance.get('/api/gmail/status'),
};

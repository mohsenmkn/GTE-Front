import api from '@/api/axios.js'

export default {
    // ═══════════════════════════════════════════════
    // زیرمجموعه‌های قابل طراحی
    // ═══════════════════════════════════════════════
    getDesignableSubordinates: () => api.get('/assessment/proposals/designable').then(r => r.data),

    // ═══════════════════════════════════════════════
    // لیست پیشنهادات
    // ═══════════════════════════════════════════════
    getProposals: (params = {}) => api.get('/assessment/proposals', { params }).then(r => r.data),
    getStats: () => api.get('/assessment/proposals/stats').then(r => r.data),
    getProposalsForPost: (postId) => api.get(`/assessment/proposals/post/${postId}`).then(r => r.data),

    // ═══════════════════════════════════════════════
    // CRUD پیشنهادات
    // ═══════════════════════════════════════════════
    createProposal: (p) => api.post('/assessment/proposals', p).then(r => r.data),
    deleteProposal: (id) => api.delete(`/assessment/proposals/${id}`).then(r => r.data),

    // ═══════════════════════════════════════════════
    // اکشن‌های بررسی (HR Admin)
    // ═══════════════════════════════════════════════
    approveProposal: (id) => api.post(`/assessment/proposals/${id}/approve`).then(r => r.data),
    rejectProposal: (id, reason) => api.post(`/assessment/proposals/${id}/reject`, { reason }).then(r => r.data),

    // ═══════════════════════════════════════════════
    // Bulk Actions (HR Admin)
    // ═══════════════════════════════════════════════
    bulkApprove: (ids) => api.post('/assessment/proposals/bulk-approve', { proposal_ids: ids }).then(r => r.data),
    bulkReject: (ids, reason) => api.post('/assessment/proposals/bulk-reject', { proposal_ids: ids, reason }).then(r => r.data),
}
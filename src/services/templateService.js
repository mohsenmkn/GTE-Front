import api from '@/api/axios.js'

export default {
    // ═══════════════════════════════════════════════
    // تمپلیت‌ها (Templates)
    // ═══════════════════════════════════════════════
    getTemplates: (params = {}) => api.get('/assessment/templates', { params }).then(r => r.data),
    getTemplate: (id) => api.get(`/assessment/templates/${id}`).then(r => r.data),
    createTemplate: (p) => api.post('/assessment/templates', p).then(r => r.data),
    updateTemplate: (id, p) => api.put(`/assessment/templates/${id}`, p).then(r => r.data),
    deleteTemplate: (id) => api.delete(`/assessment/templates/${id}`).then(r => r.data),
    getLatestApproved: (grade) => api.get('/assessment/templates/latest-approved', { params: { grade } }).then(r => r.data),

    // ═══════════════════════════════════════════════
    // اکشن‌های تمپلیت
    // ═══════════════════════════════════════════════
    approveTemplate: (id) => api.post(`/assessment/templates/${id}/approve`).then(r => r.data),
    incrementVersion: (id) => api.post(`/assessment/templates/${id}/increment-version`).then(r => r.data),

    // ═══════════════════════════════════════════════
    // سوالات تمپلیت
    // ═══════════════════════════════════════════════
    addQuestion: (templateId, p) => api.post(`/assessment/templates/${templateId}/questions`, p).then(r => r.data),
    updateQuestion: (id, p) => api.put(`/assessment/templates/questions/${id}`, p).then(r => r.data),
    deleteQuestion: (id) => api.delete(`/assessment/templates/questions/${id}`).then(r => r.data),
    reorderQuestions: (templateId, orders) => api.put(`/assessment/templates/${templateId}/questions/reorder`, { orders }).then(r => r.data),

    // ═══════════════════════════════════════════════
    // Import / Sync
    // ═══════════════════════════════════════════════
    importToPost: (templateId, postId) => api.post(`/assessment/templates/${templateId}/import-to-post`, { post_id: postId }).then(r => r.data),
    syncPostWithTemplate: (postId) => api.post(`/assessment/posts/${postId}/sync-template`).then(r => r.data),
}
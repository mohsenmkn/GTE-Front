import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import templateService from '@/services/templateService'
import assessmentService from '@/services/assessmentService'

export const useTemplateStore = defineStore('template', () => {
    // ═══════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════
    const templates = ref([])
    const currentTemplate = ref(null)
    const latestApproved = ref(null)
    const categories = ref([])
    const loading = ref(false)
    const error = ref(null)

    // ═══════════════════════════════════════════════
    // Getters
    // ═══════════════════════════════════════════════
    const activeTemplates = computed(() => templates.value.filter(t => t.is_active))
    const approvedTemplates = computed(() => templates.value.filter(t => t.approved_at))

    // ═══════════════════════════════════════════════
    // Actions: Templates
    // ═══════════════════════════════════════════════
    async function fetchTemplates(params = {}) {
        loading.value = true
        try {
            const data = await templateService.getTemplates(params)
            templates.value = data.templates || []
            return templates.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت تمپلیت‌ها'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchTemplate(id) {
        loading.value = true
        try {
            const data = await templateService.getTemplate(id)
            currentTemplate.value = data.template
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت تمپلیت'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function createTemplate(payload) {
        loading.value = true
        try {
            const data = await templateService.createTemplate(payload)
            await fetchTemplates()
            return data.template
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در ایجاد تمپلیت'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateTemplate(id, payload) {
        loading.value = true
        try {
            const data = await templateService.updateTemplate(id, payload)
            await fetchTemplates()
            return data.template
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در به‌روزرسانی تمپلیت'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function deleteTemplate(id) {
        loading.value = true
        try {
            const data = await templateService.deleteTemplate(id)
            await fetchTemplates()
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در حذف تمپلیت'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function approveTemplate(id) {
        try {
            const data = await templateService.approveTemplate(id)
            await fetchTemplates()
            return data.template
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در تایید تمپلیت'
            throw e
        }
    }

    async function incrementVersion(id) {
        loading.value = true
        try {
            const data = await templateService.incrementVersion(id)
            await fetchTemplates()
            return data.template
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در ایجاد نسخه جدید'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchLatestApproved(grade) {
        try {
            const data = await templateService.getLatestApproved(grade)
            latestApproved.value = data.template
            return data.template
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت آخرین نسخه تایید شده'
            throw e
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: Template Questions
    // ═══════════════════════════════════════════════
    async function addQuestion(templateId, payload) {
        try {
            const data = await templateService.addQuestion(templateId, payload)
            return data.question
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در افزودن سوال'
            throw e
        }
    }

    async function updateQuestion(id, payload) {
        try {
            const data = await templateService.updateQuestion(id, payload)
            return data.question
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در ویرایش سوال'
            throw e
        }
    }

    async function deleteQuestion(id) {
        try {
            return await templateService.deleteQuestion(id)
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در حذف سوال'
            throw e
        }
    }

    async function reorderQuestions(templateId, orders) {
        try {
            return await templateService.reorderQuestions(templateId, orders)
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در تغییر ترتیب'
            throw e
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: Import / Sync
    // ═══════════════════════════════════════════════
    async function importToPost(templateId, postId) {
        loading.value = true
        try {
            return await templateService.importToPost(templateId, postId)
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در import به شناسنامه'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function syncPostWithTemplate(postId) {
        loading.value = true
        try {
            return await templateService.syncPostWithTemplate(postId)
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در sync شناسنامه'
            throw e
        } finally {
            loading.value = false
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: Categories (برای dropdown)
    // ═══════════════════════════════════════════════
    async function fetchCategories() {
        try {
            const data = await assessmentService.getCategories()
            categories.value = data.categories || []
            return categories.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت دسته‌بندی‌ها'
            throw e
        }
    }

    // ═══════════════════════════════════════════════
    // Utility
    // ═══════════════════════════════════════════════
    function clearError() {
        error.value = null
    }

    function $reset() {
        templates.value = []
        currentTemplate.value = null
        latestApproved.value = null
        categories.value = []
        loading.value = false
        error.value = null
    }

    return {
        // State
        templates, currentTemplate, latestApproved, categories, loading, error,
        // Getters
        activeTemplates, approvedTemplates,
        // Actions: Templates
        fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate,
        approveTemplate, incrementVersion, fetchLatestApproved,
        // Actions: Questions
        addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
        // Actions: Import/Sync
        importToPost, syncPostWithTemplate,
        // Actions: Categories
        fetchCategories,
        // Utility
        clearError, $reset,
    }
})
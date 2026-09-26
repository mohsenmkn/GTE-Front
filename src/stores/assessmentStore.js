import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import assessmentService from '@/services/assessmentService'

export const useAssessmentStore = defineStore('assessment', () => {
    // ═══════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════
    const posts = ref([])
    const categories = ref([])
    const methods = ref([])
    const cycles = ref([])
    const periods = ref([])
    const assessments = ref([])
    const currentAssessment = ref(null)
    const currentPost = ref(null)
    const currentPostQuestions = ref(null)
    const dashboardStats = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // ═══════════════════════════════════════════════
    // Getters
    // ═══════════════════════════════════════════════
    const activeCycles = computed(() => cycles.value.filter(c => c.status === 'active'))
    const activePosts = computed(() => posts.value.filter(p => p.is_active))
    const activeMethods = computed(() => methods.value.filter(m => m.is_active))

    // ═══════════════════════════════════════════════
    // Actions: Posts
    // ═══════════════════════════════════════════════
    async function fetchPosts(params = {}) {
        loading.value = true
        try {
            const data = await assessmentService.getPosts(params)
            posts.value = data.posts || []
            return posts.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت شناسنامه‌ها'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchPost(id) {
        loading.value = true
        try {
            const data = await assessmentService.getPost(id)
            currentPost.value = data.post
            return currentPost.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت شناسنامه'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchPostQuestions(id) {
        loading.value = true
        try {
            const data = await assessmentService.getPostQuestions(id)
            currentPostQuestions.value = data
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت سوالات'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function createPost(payload) {
        const data = await assessmentService.createPost(payload)
        await fetchPosts()
        return data.post
    }

    async function updatePost(id, payload) {
        const data = await assessmentService.updatePost(id, payload)
        await fetchPosts()
        return data.post
    }

    async function deletePost(id) {
        const data = await assessmentService.deletePost(id)
        await fetchPosts()
        return data
    }

    // ═══════════════════════════════════════════════
    // Actions: Categories
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

    async function createCategory(payload) {
        const data = await assessmentService.createCategory(payload)
        await fetchCategories()
        return data.category
    }

    // ══════════════════════════════════════════════
    // Actions: Methods
    // ═══════════════════════════════════════════════
    async function fetchMethods(all = false) {
        try {
            const data = await assessmentService.getMethods(all)
            methods.value = data.methods || []
            return methods.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت روش‌ها'
            throw e
        }
    }

    async function createMethod(payload) {
        const data = await assessmentService.createMethod(payload)
        await fetchMethods(true)
        return data.method
    }

    async function updateMethod(id, payload) {
        const data = await assessmentService.updateMethod(id, payload)
        await fetchMethods(true)
        return data.method
    }

    async function deleteMethod(id) {
        const data = await assessmentService.deleteMethod(id)
        await fetchMethods(true)
        return data
    }

    // ═══════════════════════════════════════════════
    // Actions: Cycles
    // ═══════════════════════════════════════════════
    async function fetchCycles() {
        try {
            const data = await assessmentService.getCycles()
            cycles.value = data.cycles || []
            return cycles.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت چرخه‌ها'
            throw e
        }
    }

    async function createCycle(payload) {
        const data = await assessmentService.createCycle(payload)
        await fetchCycles()
        return data.cycle
    }

    // ═══════════════════════════════════════════════
    // Actions: Assessments
    // ═══════════════════════════════════════════════
    async function fetchAssessments(params = {}) {
        loading.value = true
        try {
            const data = await assessmentService.getAssessments(params)
            assessments.value = data.assessments || []
            return assessments.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت ارزیابی‌ها'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchAssessment(id) {
        loading.value = true
        try {
            const data = await assessmentService.getAssessment(id)
            currentAssessment.value = data.assessment
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت ارزیابی'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function submitAssessment(id, scores) {
        const data = await assessmentService.submitAnswers(id, scores)
        await fetchAssessment(id)
        return data.assessment
    }

    async function approveAssessment(id) {
        const data = await assessmentService.approve(id)
        await fetchAssessments()
        return data.assessment
    }

    async function rejectAssessment(id, notes) {
        const data = await assessmentService.reject(id, notes)
        await fetchAssessments()
        return data.assessment
    }

    // ═══════════════════════════════════════════════
    // Actions: Dashboard
    // ═══════════════════════════════════════════════
    async function fetchDashboardStats() {
        try {
            const data = await assessmentService.getDashboardStats()
            dashboardStats.value = data.stats
            return data.stats
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت آمار'
            throw e
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: Import
    // ═══════════════════════════════════════════════
    async function importExcel(file) {
        loading.value = true
        try {
            const data = await assessmentService.importExcel(file)
            await fetchPosts()
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در import فایل'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function importPreview(file) {
        return await assessmentService.importPreview(file)
    }

    // ═══════════════════════════════════════════════
    // Actions: Utility
    // ══════════════════════════════════════════════
    function clearError() {
        error.value = null
    }

    function $reset() {
        posts.value = []
        categories.value = []
        methods.value = []
        cycles.value = []
        periods.value = []
        assessments.value = []
        currentAssessment.value = null
        currentPost.value = null
        currentPostQuestions.value = null
        dashboardStats.value = null
        loading.value = false
        error.value = null
    }

    return {
        // State
        posts, categories, methods, cycles, periods,
        assessments, currentAssessment, currentPost, currentPostQuestions,
        dashboardStats, loading, error,

        // Getters
        activeCycles, activePosts, activeMethods,

        // Actions: Posts
        fetchPosts, fetchPost, fetchPostQuestions,
        createPost, updatePost, deletePost,

        // Actions: Categories
        fetchCategories, createCategory,

        // Actions: Methods
        fetchMethods, createMethod, updateMethod, deleteMethod,

        // Actions: Cycles
        fetchCycles, createCycle,

        // Actions: Assessments
        fetchAssessments, fetchAssessment,
        submitAssessment, approveAssessment, rejectAssessment,

        // Actions: Dashboard
        fetchDashboardStats,

        // Actions: Import
        importExcel, importPreview,

        // Utility
        clearError, $reset,
    }
})
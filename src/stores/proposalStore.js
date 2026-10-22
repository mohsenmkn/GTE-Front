import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import proposalService from '@/services/proposalService'

export const useProposalStore = defineStore('proposal', () => {
    // ═══════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════
    const proposals = ref([])
    const designableSubordinates = ref([])
    const stats = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // ═══════════════════════════════════════════════
    // Getters
    // ═══════════════════════════════════════════════
    const pendingProposals = computed(() => proposals.value.filter(p => p.status === 'pending'))
    const approvedProposals = computed(() => proposals.value.filter(p => p.status === 'approved'))
    const rejectedProposals = computed(() => proposals.value.filter(p => p.status === 'rejected'))

    // ═══════════════════════════════════════════════
    // Actions: Designable Subordinates
    // ═══════════════════════════════════════════════
    async function fetchDesignableSubordinates() {
        loading.value = true
        try {
            const data = await proposalService.getDesignableSubordinates()
            designableSubordinates.value = data.subordinates || []
            return designableSubordinates.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت زیرمجموعه‌ها'
            throw e
        } finally {
            loading.value = false
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: Proposals List
    // ═══════════════════════════════════════════════
    async function fetchProposals(params = {}) {
        loading.value = true
        try {
            const data = await proposalService.getProposals(params)
            proposals.value = data.proposals || []
            return proposals.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت پیشنهادات'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function fetchStats() {
        try {
            const data = await proposalService.getStats()
            stats.value = data.stats
            return data.stats
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت آمار'
            throw e
        }
    }

    async function fetchProposalsForPost(postId) {
        loading.value = true
        try {
            const data = await proposalService.getProposalsForPost(postId)
            proposals.value = data.proposals || []
            return proposals.value
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در دریافت پیشنهادات شناسنامه'
            throw e
        } finally {
            loading.value = false
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: CRUD
    // ═══════════════════════════════════════════════
    async function createProposal(payload) {
        loading.value = true
        try {
            const data = await proposalService.createProposal(payload)
            await fetchProposals()
            return data.proposal
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در ایجاد پیشنهاد'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function deleteProposal(id) {
        loading.value = true
        try {
            const data = await proposalService.deleteProposal(id)
            await fetchProposals()
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در حذف پیشنهاد'
            throw e
        } finally {
            loading.value = false
        }
    }

    // ═══════════════════════════════════════════════
    // Actions: Review (HR Admin)
    // ═══════════════════════════════════════════════
    async function approveProposal(id) {
        loading.value = true
        try {
            const data = await proposalService.approveProposal(id)
            await fetchProposals()
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در تایید پیشنهاد'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function rejectProposal(id, reason) {
        loading.value = true
        try {
            const data = await proposalService.rejectProposal(id, reason)
            await fetchProposals()
            return data.proposal
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در رد پیشنهاد'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function bulkApprove(ids) {
        loading.value = true
        try {
            const data = await proposalService.bulkApprove(ids)
            await fetchProposals()
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در تایید گروهی'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function bulkReject(ids, reason) {
        loading.value = true
        try {
            const data = await proposalService.bulkReject(ids, reason)
            await fetchProposals()
            return data
        } catch (e) {
            error.value = e.response?.data?.message || 'خطا در رد گروهی'
            throw e
        } finally {
            loading.value = false
        }
    }

    // ═══════════════════════════════════════════════
    // Utility
    // ═══════════════════════════════════════════════
    function clearError() {
        error.value = null
    }

    function $reset() {
        proposals.value = []
        designableSubordinates.value = []
        stats.value = null
        loading.value = false
        error.value = null
    }

    return {
        // State
        proposals, designableSubordinates, stats, loading, error,
        // Getters
        pendingProposals, approvedProposals, rejectedProposals,
        // Actions: Designable
        fetchDesignableSubordinates,
        // Actions: List
        fetchProposals, fetchStats, fetchProposalsForPost,
        // Actions: CRUD
        createProposal, deleteProposal,
        // Actions: Review
        approveProposal, rejectProposal, bulkApprove, bulkReject,
        // Utility
        clearError, $reset,
    }
})
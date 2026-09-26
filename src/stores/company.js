import { defineStore } from 'pinia'
import companyService from '@/services/companyService'

export const useCompanyStore = defineStore('company', {
    state: () => ({
        companies: [],
        pagination: {
            currentPage: 1,
            lastPage: 1,
            perPage: 15,
            total: 0,
        },
        loading: false,
        error: null,
    }),

    actions: {
        async fetchCompanies(params = {}) {
            this.loading = true
            this.error = null
            try {
                const { data } = await companyService.getCompanies(params)
                this.companies = data.data
                this.pagination = {
                    currentPage: data.meta.current_page,
                    lastPage: data.meta.last_page,
                    perPage: data.meta.per_page,
                    total: data.meta.total,
                }
            } catch (e) {
                this.error = e?.response?.data?.message || 'خطا در دریافت اطلاعات'
            } finally {
                this.loading = false
            }
        },

        async createCompany(payload) {
            const { data } = await companyService.createCompany(payload)
            await this.fetchCompanies({ page: this.pagination.currentPage })
            return data
        },

        async updateCompany(id, payload) {
            const { data } = await companyService.updateCompany(id, payload)
            await this.fetchCompanies({ page: this.pagination.currentPage })
            return data
        },

        async deleteCompany(id) {
            await companyService.deleteCompany(id)
            // اگر صفحه فعلی خالی شد، برو صفحه قبل
            const remainingItems = this.companies.length - 1
            const page =
                remainingItems === 0 && this.pagination.currentPage > 1
                    ? this.pagination.currentPage - 1
                    : this.pagination.currentPage
            await this.fetchCompanies({ page })
        },
    },
})

// src/stores/tripExpenseStore.js

import { defineStore } from 'pinia'
import tripExpenseService from '@/services/tripExpenseService'

export const useTripExpenseStore = defineStore('tripExpense', {
    state: () => ({
        expenses: [],
        loading: false,
        budget: null,
        pagination: {
            current_page: 1,
            per_page: 15,
            total: 0,
            last_page: 1,
        },
    }),

    actions: {

        async fetchExpenses(tripId, params = {}) {
            this.loading = true

            try {
                const response = await tripExpenseService.getTripExpenses(tripId, {
                    ...params,
                    page: this.pagination.current_page,
                    per_page: this.pagination.per_page,
                })

                // پشتیبانی از پاسخ آرایه‌ای و پاسخ صفحه‌بندی‌شده Laravel
                if (Array.isArray(response)) {
                    this.expenses = response
                } else if (Array.isArray(response?.data)) {
                    this.expenses = response.data
                } else if (Array.isArray(response?.expenses)) {
                    this.expenses = response.expenses
                } else {
                    console.error(
                        'ساختار پاسخ هزینه‌های سفر نامعتبر است:',
                        response
                    )
                    this.expenses = []
                }

                this._updatePagination(response)
            } catch (error) {
                console.error('Error fetching expenses:', error)
                this.expenses = []
                throw error
            } finally {
                this.loading = false
            }
        },

        async createExpense(tripId, formData) {
            const response = await tripExpenseService.createExpense(tripId, formData)
            return response
        },

        async deleteExpense(id) {
            await tripExpenseService.deleteExpense(id)
            this.expenses = this.expenses.filter(e => e.id !== id)
        },

        async approveExpense(id) {
            const response = await tripExpenseService.approveExpense(id)
            const idx = this.expenses.findIndex(e => e.id === id)
            if (idx !== -1) this.expenses[idx] = response.data
            return response.data
        },

        async rejectExpense(id, reason) {
            const response = await tripExpenseService.rejectExpense(id, reason)
            const idx = this.expenses.findIndex(e => e.id === id)
            if (idx !== -1) this.expenses[idx] = response.data
            return response.data
        },

        async fetchBudget(tripId, categoryId = null) {
            const response = await tripExpenseService.getRemainingBudget(tripId, categoryId)
            this.budget = response.data
            return this.budget
        },

        _updatePagination(response) {
            if (response.meta) {
                this.pagination.current_page = response.meta.current_page
                this.pagination.per_page = response.meta.per_page
                this.pagination.total = response.meta.total
                this.pagination.last_page = response.meta.last_page
            }
        },
    },
})
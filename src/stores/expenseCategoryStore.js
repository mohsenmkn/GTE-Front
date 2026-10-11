// src/stores/expenseCategoryStore.js

import { defineStore } from 'pinia'
import tripExpenseService from '@/services/tripExpenseService'

export const useExpenseCategoryStore = defineStore('expenseCategory', {
    state: () => ({
        categories: [],
        options: [],
        loading: false,
    }),

    actions: {
        async fetchCategories(params = {}) {
            this.loading = true
            try {
                const response = await tripExpenseService.getCategories(params)

                // ✅ اصلاح: بررسی ساختار پاسخ
                console.log('Categories response:', response)

                // اگر response.data وجود دارد (pagination)
                if (response.data && Array.isArray(response.data)) {
                    this.categories = response.data
                }
                // اگر response خودش آرایه است
                else if (Array.isArray(response)) {
                    this.categories = response
                }
                // در غیر این صورت
                else {
                    this.categories = []
                }

            } catch (error) {
                console.error('Error fetching categories:', error)
                this.categories = []
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchOptions() {
            try {
                const response = await tripExpenseService.getCategoryOptions()

                // ✅ اصلاح: بررسی ساختار پاسخ
                console.log('Options response:', response)

                if (response.data && Array.isArray(response.data)) {
                    this.options = response.data
                } else if (Array.isArray(response)) {
                    this.options = response
                } else {
                    this.options = []
                }

            } catch (error) {
                console.error('Error fetching category options:', error)
                this.options = []
            }
        },

        async createCategory(payload) {
            const response = await tripExpenseService.createCategory(payload)
            const newCategory = response.data || response
            this.categories.push(newCategory)
            return newCategory
        },

        async updateCategory(id, payload) {
            const response = await tripExpenseService.updateCategory(id, payload)
            const updatedCategory = response.data || response
            const index = this.categories.findIndex(c => c.id === id)
            if (index !== -1) {
                this.categories[index] = updatedCategory
            }
            return updatedCategory
        },

        async deleteCategory(id) {
            await tripExpenseService.deleteCategory(id)
            this.categories = this.categories.filter(c => c.id !== id)
        },
    },
})
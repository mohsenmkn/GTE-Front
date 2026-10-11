// src/stores/truckStore.js

import { defineStore } from 'pinia'
import tripExpenseService from '@/services/tripExpenseService'

export const useTruckStore = defineStore('truck', {
    state: () => ({
        trucks: [],
        loading: false,
        pagination: {
            current_page: 1,
            per_page: 15,
            total: 0,
            last_page: 1,
        },
    }),

    actions: {
        async fetchTrucks(params = {}) {
            this.loading = true
            try {
                const response = await tripExpenseService.getTrucks(params)

                // ✅ اصلاح: بررسی ساختار پاسخ
                console.log('Trucks response:', response)

                // اگر response.data وجود دارد (pagination)
                if (response.data && Array.isArray(response.data)) {
                    this.trucks = response.data
                    if (response.meta) {
                        this.pagination.current_page = response.meta.current_page
                        this.pagination.per_page = response.meta.per_page
                        this.pagination.total = response.meta.total
                        this.pagination.last_page = response.meta.last_page
                    }
                }
                // اگر response خودش آرایه است
                else if (Array.isArray(response)) {
                    this.trucks = response
                    this.pagination.total = response.length
                }
                // در غیر این صورت
                else {
                    this.trucks = []
                    this.pagination.total = 0
                }

            } catch (error) {
                console.error('Error fetching trucks:', error)
                this.trucks = []
                throw error
            } finally {
                this.loading = false
            }
        },

        async createTruck(payload) {
            const response = await tripExpenseService.createTruck(payload)
            const newTruck = response.data || response
            this.trucks.push(newTruck)
            return newTruck
        },

        async updateTruck(id, payload) {
            const response = await tripExpenseService.updateTruck(id, payload)
            const updatedTruck = response.data || response
            const index = this.trucks.findIndex(t => t.id === id)
            if (index !== -1) {
                this.trucks[index] = updatedTruck
            }
            return updatedTruck
        },

        async deleteTruck(id) {
            await tripExpenseService.deleteTruck(id)
            this.trucks = this.trucks.filter(t => t.id !== id)
        },
    },
})
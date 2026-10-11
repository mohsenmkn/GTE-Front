// src/stores/tripStore.js

import { defineStore } from 'pinia'
import tripExpenseService from '@/services/tripExpenseService'

export const useTripStore = defineStore('trip', {
    state: () => ({
        trips: [],
        currentTrip: null,
        loading: false,
        pagination: {
            current_page: 1,
            per_page: 15,
            total: 0,
            last_page: 1,
        },
    }),

    actions: {
        async fetchMyTrips(params = {}) {
            this.loading = true
            try {
                const response = await tripExpenseService.getMyTrips({
                    ...params,
                    page: this.pagination.current_page,
                    per_page: this.pagination.per_page,
                })

                // ✅ اصلاح: بررسی ساختار پاسخ
                console.log('My Trips response:', response)

                if (response.data && Array.isArray(response.data)) {
                    this.trips = response.data
                    if (response.meta) {
                        this.pagination.current_page = response.meta.current_page
                        this.pagination.per_page = response.meta.per_page
                        this.pagination.total = response.meta.total
                        this.pagination.last_page = response.meta.last_page
                    }
                } else if (Array.isArray(response)) {
                    this.trips = response
                    this.pagination.total = response.length
                } else {
                    this.trips = []
                    this.pagination.total = 0
                }

            } catch (error) {
                console.error('Error fetching trips:', error)
                this.trips = []
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchAllTrips(params = {}) {
            this.loading = true
            try {
                const response = await tripExpenseService.getAllTrips({
                    ...params,
                    page: this.pagination.current_page,
                    per_page: this.pagination.per_page,
                })

                // ✅ اصلاح: بررسی ساختار پاسخ
                console.log('All Trips response:', response)

                if (response.data && Array.isArray(response.data)) {
                    this.trips = response.data
                    if (response.meta) {
                        this.pagination.current_page = response.meta.current_page
                        this.pagination.per_page = response.meta.per_page
                        this.pagination.total = response.meta.total
                        this.pagination.last_page = response.meta.last_page
                    }
                } else if (Array.isArray(response)) {
                    this.trips = response
                    this.pagination.total = response.length
                } else {
                    this.trips = []
                    this.pagination.total = 0
                }

            } catch (error) {
                console.error('Error fetching all trips:', error)
                this.trips = []
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchTrip(id) {
            this.loading = true
            try {
                const response = await tripExpenseService.getTrip(id)
                this.currentTrip = response.data || response
                return this.currentTrip
            } catch (error) {
                console.error('Error fetching trip:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        async createTrip(payload) {
            const response = await tripExpenseService.createTrip(payload)
            const newTrip = response.data || response
            this.trips.unshift(newTrip)
            return newTrip
        },

        async finishTrip(id) {
            const response = await tripExpenseService.finishTrip(id)
            const updatedTrip = response.data || response
            const index = this.trips.findIndex(t => t.id === id)
            if (index !== -1) {
                this.trips[index] = updatedTrip
            }
            return updatedTrip
        },
    },
})
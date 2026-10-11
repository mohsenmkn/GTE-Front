
import { defineStore } from 'pinia'
import tripExpenseService from '@/services/tripExpenseService'

export const useDriverAssignmentStore = defineStore('driverAssignment', {
    state: () => ({
        assignments: [],
        loading: false,
        availableDrivers: [],
        availableTrucks: [],
        pagination: {
            current_page: 1,
            per_page: 15,
            total: 0,
            last_page: 1,
        },
    }),

    actions: {
        async fetchAssignments(params = {}) {
            this.loading = true
            try {
                const response = await tripExpenseService.getDriverAssignments({
                    ...params,
                    page: this.pagination.current_page,
                    per_page: this.pagination.per_page,
                })

                if (response.data && Array.isArray(response.data)) {
                    this.assignments = response.data
                    if (response.meta) {
                        this.pagination.current_page = response.meta.current_page
                        this.pagination.per_page = response.meta.per_page
                        this.pagination.total = response.meta.total
                        this.pagination.last_page = response.meta.last_page
                    }
                } else if (Array.isArray(response)) {
                    this.assignments = response
                    this.pagination.total = response.length
                } else {
                    this.assignments = []
                }
            } catch (error) {
                console.error('Error fetching assignments:', error)
                this.assignments = []
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchAvailableDrivers() {
            try {
                const response = await tripExpenseService.getAvailableDrivers()
                this.availableDrivers = response.data || []
            } catch (error) {
                console.error('Error fetching available drivers:', error)
                this.availableDrivers = []
            }
        },

        async fetchAvailableTrucks() {
            try {
                const response = await tripExpenseService.getAvailableTrucks()
                this.availableTrucks = response.data || []
            } catch (error) {
                console.error('Error fetching available trucks:', error)
                this.availableTrucks = []
            }
        },

        async createAssignment(payload) {
            const response = await tripExpenseService.createDriverAssignment(payload)
            return response.data
        },

        async updateAssignment(id, payload) {
            const response = await tripExpenseService.updateDriverAssignment(id, payload)
            return response.data
        },

        async deleteAssignment(id) {
            await tripExpenseService.deleteDriverAssignment(id)
            this.assignments = this.assignments.filter(a => a.id !== id)
        },

        async endAssignment(id, endDate) {
            const response = await tripExpenseService.endDriverAssignment(id, endDate)
            const idx = this.assignments.findIndex(a => a.id === id)
            if (idx !== -1) {
                this.assignments[idx] = response.data
            }
            return response.data
        },
    },
})
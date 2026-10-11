import api from "@/api/axios.js";

export default {
    // ═══════════════════════════════════════
    // سفرها (Trips)
    // ═══════════════════════════════════════
    getMyTrips: (params = {}) => api.get('trip-expense/my-trips', { params }).then(r => r.data),
    getAllTrips: (params = {}) => api.get('trip-expense/trips', { params }).then(r => r.data),
    getTrip: (id) => api.get(`trip-expense/trips/${id}`).then(r => r.data),
    createTrip: (payload) => api.post('trip-expense/trips', payload).then(r => r.data),
    finishTrip: (id) => api.patch(`trip-expense/trips/${id}/finish`).then(r => r.data),
    getRemainingBudget: (tripId, categoryId = null) =>
        api.get(`trip-expense/trips/${tripId}/remaining-budget`, { params: { category_id: categoryId } }).then(r => r.data),

    // ═══════════════════════════════════════
    // هزینه‌ها (Expenses)
    // ═══════════════════════════════════════
    getTripExpenses: (tripId, params = {}) =>
        api.get(`trip-expense/trips/${tripId}/expenses`, { params }).then(r => r.data),
    createExpense: (tripId, formData) =>
        api.post(`trip-expense/trips/${tripId}/expenses`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data),
    deleteExpense: (id) => api.delete(`trip-expense/expenses/${id}`).then(r => r.data),
    getReceipt: (id) => api.get(`trip-expense/expenses/${id}/receipt`, { responseType: 'blob' }),
    approveExpense: (id) => api.post(`trip-expense/expenses/${id}/approve`).then(r => r.data),
    rejectExpense: (id, reason) => api.post(`trip-expense/expenses/${id}/reject`, { rejection_reason: reason }).then(r => r.data),

    // ═══════════════════════════════════════
    // کامیون‌ها (Trucks)
    // ═══════════════════════════════════════
    getTrucks: (params = {}) => api.get('trip-expense/trucks', { params }).then(r => r.data),
    getTruck: (id) => api.get(`trip-expense/trucks/${id}`).then(r => r.data),
    createTruck: (payload) => api.post('trip-expense/trucks', payload).then(r => r.data),
    updateTruck: (id, payload) => api.put(`trip-expense/trucks/${id}`, payload).then(r => r.data),
    deleteTruck: (id) => api.delete(`trip-expense/trucks/${id}`).then(r => r.data),

    // ═══════════════════════════════════════
    // دسته‌بندی‌ها (Categories)
    // ═══════════════════════════════════════
    getCategories: (params = {}) => api.get('trip-expense/expense-categories', { params }).then(r => r.data),
    getCategoryOptions: () => api.get('trip-expense/expense-categories/options').then(r => r.data),
    createCategory: (payload) => api.post('trip-expense/expense-categories', payload).then(r => r.data),
    updateCategory: (id, payload) => api.put(`trip-expense/expense-categories/${id}`, payload).then(r => r.data),
    deleteCategory: (id) => api.delete(`trip-expense/expense-categories/${id}`).then(r => r.data),

    // ═══════════════════════════════════════
    // سقف هزینه‌ها (Limits)
    // ═══════════════════════════════════════
    getLimits: (params = {}) => api.get('trip-expense/expense-limits', { params }).then(r => r.data),
    getLimit: (id) => api.get(`trip-expense/expense-limits/${id}`).then(r => r.data),
    createLimit: (payload) => api.post('trip-expense/expense-limits', payload).then(r => r.data),
    updateLimit: (id, payload) => api.put(`trip-expense/expense-limits/${id}`, payload).then(r => r.data),
    deleteLimit: (id) => api.delete(`trip-expense/expense-limits/${id}`).then(r => r.data),

    getAllExpenses: (params = {}) =>
        api.get('trip-expense/expenses', { params }).then(r => r.data),


    getMyCurrentTruck: () =>
        api.get('trip-expense/my-current-truck').then(r => r.data),

    // ═══════════════════════════════════════
    // اختصاص راننده به کامیون (Driver Assignments)
    // ═══════════════════════════════════════
    getDriverAssignments: (params = {}) =>
        api.get('trip-expense/driver-assignments', { params }).then(r => r.data),

    getDriverAssignment: (id) =>
        api.get(`trip-expense/driver-assignments/${id}`).then(r => r.data),

    createDriverAssignment: (payload) =>
        api.post('trip-expense/driver-assignments', payload).then(r => r.data),

    updateDriverAssignment: (id, payload) =>
        api.put(`trip-expense/driver-assignments/${id}`, payload).then(r => r.data),

    deleteDriverAssignment: (id) =>
        api.delete(`trip-expense/driver-assignments/${id}`).then(r => r.data),

    endDriverAssignment: (id, endDate) =>
        api.post(`trip-expense/driver-assignments/${id}/end`, { end_date: endDate }).then(r => r.data),

    getAvailableDrivers: () =>
        api.get('trip-expense/driver-assignments/available-drivers').then(r => r.data),

    getAvailableTrucks: () =>
        api.get('trip-expense/driver-assignments/available-trucks').then(r => r.data),

    getDriverHistory: (driverId, params = {}) =>
        api.get(`trip-expense/driver-assignments/driver/${driverId}/history`, { params }).then(r => r.data),

    getTruckHistory: (truckId, params = {}) =>
        api.get(`trip-expense/driver-assignments/truck/${truckId}/history`, { params }).then(r => r.data),


    // ═══════════════════════════════════════
    // گزارش‌ها (Reports)
    // ═══════════════════════════════════════
    getReportSummary: (params = {}) =>
        api.get('trip-expense/reports/summary', { params }).then(r => r.data),

    getReportByDriver: (params = {}) =>
        api.get('trip-expense/reports/by-driver', { params }).then(r => r.data),

    getReportByCategory: (params = {}) =>
        api.get('trip-expense/reports/by-category', { params }).then(r => r.data),

    getReportByTruck: (params = {}) =>
        api.get('trip-expense/reports/by-truck', { params }).then(r => r.data),

    getReportByRoute: (params = {}) =>
        api.get('trip-expense/reports/by-route', { params }).then(r => r.data),

    getReportByMonth: (params = {}) =>
        api.get('trip-expense/reports/by-month', { params }).then(r => r.data),

    getReportByStatus: (params = {}) =>
        api.get('trip-expense/reports/by-status', { params }).then(r => r.data),


    getReportExpenseDetails: (params = {}) =>
        api.get('trip-expense/reports/expense-details', { params }).then(r => r.data),

    // دریافت کامیون فعلی یک راننده خاص
    getDriverCurrentTruck: (userId) =>
        api.get(`trip-expense/trucks/driver/${userId}/current`).then(r => r.data),


}
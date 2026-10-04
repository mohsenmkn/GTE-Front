import { defineStore } from 'pinia'
import api from '@/api/axios'
import { showToast } from '@/plugins/toast'

export const usePreWarehouseStore = defineStore('preWarehouse', {
    state: () => ({
        // Purchases
        purchases: [],
        currentPurchase: null,
        pagination: {
            total: 0,
            per_page: 15,
            current_page: 1,
            last_page: 1,
        },

        // Items (کالاها)
        items: [],
        itemsPagination: {
            total: 0,
            per_page: 15,
            current_page: 1,
            last_page: 1,
        },

        // Warehouses (انبارها)
        warehouses: [],
        warehousesPagination: {
            total: 0,
            per_page: 15,
            current_page: 1,
            last_page: 1,
        },

        // Warehouse Locations
        warehouseLocations: [],

        // Loading
        loading: false,

        custodians: [],

        userUnitId: null,
        canViewAll: false,

        isCustodian: false,          // ✅ جدید
        userUnitTitle: null,         // ✅ جدید
    }),

    getters: {
        getStatusColor: () => (status) => {
            const colors = {
                registered: 'bg-blue-100 text-blue-800',
                allocated: 'bg-purple-100 text-purple-800',
                partially_received: 'bg-yellow-100 text-yellow-800',
                fully_received: 'bg-green-100 text-green-800',
                custodian_approved: 'bg-emerald-100 text-emerald-800',
                location_assigned: 'bg-teal-100 text-teal-800',
                finalized: 'bg-gray-100 text-gray-800',
                rejected_by_warehouse: 'bg-red-100 text-red-800',
                rejected_by_custodian: 'bg-red-100 text-red-800',
            }
            return colors[status] || 'bg-gray-100 text-gray-800'
        },
    },

    actions: {
        // ═══════════════════════════════════════
        // Purchases
        // ═══════════════════════════════════════
        async fetchPurchases(params = {}) {
            this.loading = true
            try {
                const response = await api.get('/pre-warehouse/purchases', { params })
                this.purchases = response.data.data.data
                this.pagination = response.data.data.meta

                // ✅ ذخیره اطلاعات نقش کاربر
                this.isCustodian = response.data.meta?.is_custodian || false
                this.userUnitId = response.data.meta?.user_unit_id || null
                this.userUnitTitle = response.data.meta?.user_unit_title || null
                this.canViewAll = response.data.meta?.can_view_all || false
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت لیست',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchPurchase(id) {
            this.loading = true
            try {
                const response = await api.get(`/pre-warehouse/purchases/${id}`)
                this.currentPurchase = response.data.data
                return this.currentPurchase
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت جزئیات',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        async createPurchase(data) {
            try {
                const response = await api.post('/pre-warehouse/purchases', data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت خرید',
                })
                throw error
            }
        },

        async updatePurchase(id, data) {
            try {
                const response = await api.put(`/pre-warehouse/purchases/${id}`, data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ویرایش',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Items (کالاها)
        // ═══════════════════════════════════════
        async fetchItems(params = {}) {
            this.loading = true
            try {
                const response = await api.get('/pre-warehouse/items', { params })

                // ✅ ساختار واقعی: { data: [...], meta: {...} }
                this.items = response.data.data || []
                this.itemsPagination = response.data.meta || {
                    total: 0,
                    per_page: 15,
                    current_page: 1,
                    last_page: 1,
                }
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت کالاها',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchItem(id) {
            try {
                const response = await api.get(`/pre-warehouse/items/${id}`)
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت کالا',
                })
                throw error
            }
        },

        async fetchAllItems(search = '') {
            try {
                const response = await api.get('/pre-warehouse/items/all', {
                    params: { search },
                })
                return response.data.data || []
            } catch (error) {
                console.error('Error fetching items:', error)
                return []
            }
        },

        async createItem(data) {
            try {
                const response = await api.post('/pre-warehouse/items', data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت کالا',
                })
                throw error
            }
        },

        async updateItem(id, data) {
            try {
                const response = await api.put(`/pre-warehouse/items/${id}`, data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ویرایش کالا',
                })
                throw error
            }
        },

        async deleteItem(id) {
            try {
                const response = await api.delete(`/pre-warehouse/items/${id}`)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در حذف کالا',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Warehouses (انبارها)
        // ═══════════════════════════════════════
        async fetchWarehouses(params = {}) {
            this.loading = true
            try {
                const response = await api.get('/pre-warehouse/warehouses', { params })

                // ✅ ساختار واقعی: { data: [...], meta: {...} }
                this.warehouses = response.data.data || []
                this.warehousesPagination = response.data.meta || {
                    total: 0,
                    per_page: 15,
                    current_page: 1,
                    last_page: 1,
                }
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت انبارها',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchWarehouse(id) {
            try {
                const response = await api.get(`/pre-warehouse/warehouses/${id}`)
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت انبار',
                })
                throw error
            }
        },

        async fetchAllWarehouses(search = '') {
            try {
                const response = await api.get('/pre-warehouse/warehouses/all', {
                    params: { search },
                })
                return response.data.data || []
            } catch (error) {
                console.error('Error fetching warehouses:', error)
                return []
            }
        },

        async createWarehouse(data) {
            try {
                const response = await api.post('/pre-warehouse/warehouses', data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت انبار',
                })
                throw error
            }
        },

        async updateWarehouse(id, data) {
            try {
                const response = await api.put(`/pre-warehouse/warehouses/${id}`, data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ویرایش انبار',
                })
                throw error
            }
        },

        async deleteWarehouse(id) {
            try {
                const response = await api.delete(`/pre-warehouse/warehouses/${id}`)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در حذف انبار',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Warehouse Locations (محل‌های انبار)
        // ═══════════════════════════════════════
        async fetchWarehouseLocations(warehouseId) {
            try {
                const response = await api.get(
                    `/pre-warehouse/warehouses/${warehouseId}/locations`
                )
                this.warehouseLocations = response.data.data || []
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت محل‌ها',
                })
                throw error
            }
        },

        async createLocation(warehouseId, data) {
            try {
                const response = await api.post(
                    `/pre-warehouse/warehouses/${warehouseId}/locations`,
                    data
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت محل',
                })
                throw error
            }
        },

        async updateLocation(warehouseId, id, data) {
            try {
                const response = await api.put(
                    `/pre-warehouse/warehouses/${warehouseId}/locations/${id}`,
                    data
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ویرایش محل',
                })
                throw error
            }
        },

        async deleteLocation(warehouseId, id) {
            try {
                const response = await api.delete(
                    `/pre-warehouse/warehouses/${warehouseId}/locations/${id}`
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در حذف محل',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Allocation
        // ═══════════════════════════════════════
        async allocateWarehouses(id, allocations) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/allocate`, {
                    allocations,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در تخصیص',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Receive / Reject
        // ═══════════════════════════════════════
        async receiveAllocation(allocationId, qty, notes) {
            try {
                const response = await api.post(
                    `/pre-warehouse/allocations/${allocationId}/receive`,
                    { qty, notes }
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت دریافت',
                })
                throw error
            }
        },

        async rejectAllocation(allocationId, reason) {
            try {
                const response = await api.post(
                    `/pre-warehouse/allocations/${allocationId}/reject`,
                    { reason }
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در رد کردن',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Location
        // ═══════════════════════════════════════
        async assignLocation(allocationId, data) {
            try {
                const response = await api.post(
                    `/pre-warehouse/allocations/${allocationId}/location`,
                    data
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در تعیین محل',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Finalize
        // ═══════════════════════════════════════
        async finalizePurchase(id, voucherNumber) {
            console.log('🚀 [Store] finalizePurchase called with:', { id, voucherNumber });

            // اطمینان از اینکه مقدار رشته‌ای و Trim شده است
            const payload = {
                voucher_number: String(voucherNumber).trim()
            };

            console.log('📦 [Store] Payload object being sent:', payload);

            try {
                const response = await api.post(
                    `/pre-warehouse/purchases/${id}/finalize`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json', // ✅ اجبار به ارسال به عنوان JSON
                            'Accept': 'application/json'
                        }
                    }
                );

                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                });
                return response.data;
            } catch (error) {
                console.error('❌ [Store] Finalize API Error:', error.response?.data);
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در نهایی‌سازی',
                });
                throw error;
            }
        },

        // ═══════════════════════════════════════
        // History
        // ══════════════════════════════════════
        async fetchHistory(purchaseId) {
            try {
                const response = await api.get(`/pre-warehouse/purchases/${purchaseId}/history`)
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت تاریخچه',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Warehouse Approval (تایید/رد انبار کلی)
        // ═══════════════════════════════════════
        async approveByWarehouse(id, notes) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/approve-warehouse`, {
                    notes,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در تایید',
                })
                throw error
            }
        },

        async rejectByWarehouse(id, reason) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/reject-warehouse`, {
                    reason,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در رد کردن',
                })
                throw error
            }
        },


        // ═══════════════════════════════════════
        // Destination Rejection (رد انبار مقصد)
        // ═══════════════════════════════════════
        async rejectByDestination(allocationId, reason) {
            try {
                const response = await api.post(
                    `/pre-warehouse/allocations/${allocationId}/reject-destination`,
                    { reason }
                )
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در رد کردن',
                })
                throw error
            }
        },

        // ═══════════════════════════════════════
        // Custodian Mappings (مدیریت متولیان)
        // ═══════════════════════════════════════
        async fetchCustodians() {
            try {
                const response = await api.get('/pre-warehouse/custodians')
                this.custodians = response.data.data || []
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در دریافت متولیان',
                })
                throw error
            }
        },

        async createCustodian(data) {
            try {
                const response = await api.post('/pre-warehouse/custodians', data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت متولی',
                })
                throw error
            }
        },

        async updateCustodian(id, data) {
            try {
                const response = await api.put(`/pre-warehouse/custodians/${id}`, data)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ویرایش متولی',
                })
                throw error
            }
        },

        async deleteCustodian(id) {
            try {
                const response = await api.delete(`/pre-warehouse/custodians/${id}`)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در حذف متولی',
                })
                throw error
            }
        },

// ══════════════════════════════════════
// Custodian Final Approval (تایید نهایی متولی)
// ═══════════════════════════════════════
        async finalApproveByCustodian(id, notes) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/final-approve-custodian`, {
                    notes,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در تایید',
                })
                throw error
            }
        },



// ═══════════════════════════════════════
// Custodian Approval (تایید/رد متولی)
// ═══════════════════════════════════════
        async approveByCustodian(id, notes, temporaryExits = []) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/approve-custodian`, {
                    notes,
                    temporary_exits: temporaryExits,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در تایید',
                })
                throw error
            }
        },

        async rejectByCustodian(id, reason) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/reject-custodian`, {
                    reason,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در رد کردن',
                })
                throw error
            }
        },

// ═══════════════════════════════════════
// Commercial Voucher (ورود حواله بازرگانی)
// ═══════════════════════════════════════
        async enterVoucher(id, voucherNumber) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/enter-voucher`, {
                    voucher_number: voucherNumber,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت حواله',
                })
                throw error
            }
        },

// ═══════════════════════════════════════
// Warehouse Receipt (ورود رسید انبار)
// ═══════════════════════════════════════
        async enterWarehouseReceipt(id, receiptNumber) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/enter-receipt`, {
                    receipt_number: receiptNumber,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت رسید',
                })
                throw error
            }
        },

// ═══════════════════════════════════════════
// عدم انطباق - ثبت تاریخ تحویل به بازرگانی
// ═══════════════════════════════════════════
        async scheduleNonconformityHandover(id, handoverDate) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/nonconformity/handover-date`, {
                    handover_date: handoverDate,
                })
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در ثبت تاریخ تحویل',
                })
                throw error
            }
        },

// ══════════════════════════════════════════
// عدم انطباق - تایید تحویل توسط بازرگانی
// ═══════════════════════════════════════════
        async confirmNonconformityPickup(id) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/nonconformity/confirm-pickup`)
                showToast({
                    severity: 'success',
                    summary: 'موفق',
                    detail: response.data.message,
                })
                return response.data
            } catch (error) {
                showToast({
                    severity: 'error',
                    summary: 'خطا',
                    detail: error.response?.data?.message || 'خطا در تایید تحویل',
                })
                throw error
            }
        },

// ═══════════════════════════════════════════
// عدم انطباق - ثبت تاریخ تحویل به بازرگانی (توسط انبار)
// ═══════════════════════════════════════════
        async scheduleWarehouseReturn(id, handoverDate, notes) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/schedule-warehouse-return`, {
                    scheduled_at: handoverDate,
                    notes: notes,
                })
                showToast({ severity: 'success', summary: 'موفق', detail: response.data.message })
                return response.data
            } catch (error) {
                showToast({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا در ثبت تاریخ' })
                throw error
            }
        },

// ═══════════════════════════════════════════
// عدم انطباق - تایید تحویل گرفتن توسط بازرگانی
// ═══════════════════════════════════════════
        async confirmCommercialReceived(id) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/confirm-commercial-received`)
                showToast({ severity: 'success', summary: 'موفق', detail: response.data.message })
                return response.data
            } catch (error) {
                showToast({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا در تایید تحویل' })
                throw error
            }
        },

// ═══════════════════════════════════════════
// عدم انطباق - ثبت برگشت به تأمین‌کننده
// ═══════════════════════════════════════════
        async confirmSupplierReturned(id) {
            try {
                const response = await api.post(`/pre-warehouse/purchases/${id}/confirm-supplier-returned`)
                showToast({ severity: 'success', summary: 'موفق', detail: response.data.message })
                return response.data
            } catch (error) {
                showToast({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا در ثبت برگشت' })
                throw error
            }
        },



    },
})
export const purchaseStatusColors = {
    'registered': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: 'pi pi-file',
        label: 'ثبت شده'
    },

    'pending_warehouse_approval': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: 'pi pi-clock',
        label: 'در انتظار تایید انبار'
    },

    'approved_by_warehouse': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: 'pi pi-check-circle',
        label: 'تایید شده توسط انبار'
    },

    'pending_custodian_approval': {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: 'pi pi-clock',
        label: 'در انتظار تایید متولی'
    },

    'approved_by_custodian': {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        icon: 'pi pi-check-circle',
        label: 'تایید شده توسط متولی'
    },

    'pending_allocation': {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: 'pi pi-share-alt',
        label: 'در انتظار تخصیص'
    },

    'allocated': {
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        icon: 'pi pi-box',
        label: 'تخصیص داده شده'
    },

    'pending_location_assignment': {
        bg: 'bg-cyan-100',
        text: 'text-cyan-800',
        icon: 'pi pi-map-marker',
        label: 'در انتظار تعیین محل'
    },

    'location_assigned': {
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        icon: 'pi pi-map-marker',
        label: 'محل تعیین شده'
    },

    'finalized': {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: 'pi pi-flag',
        label: 'نهایی شده'
    },

    'rejected_by_warehouse': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: 'pi pi-times-circle',
        label: 'رد شده توسط انبار'
    },

    'rejected_by_custodian': {
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        icon: 'pi pi-times-circle',
        label: 'رد شده توسط متولی'
    },

    'rejected_by_destination': {
        bg: 'bg-pink-100',
        text: 'text-pink-800',
        icon: 'pi pi-times-circle',
        label: 'رد شده توسط مقصد'
    },

    'pending_reallocation': {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: 'pi pi-refresh',
        label: 'در انتظار تخصیص مجدد'
    },

    // =====================================================
    // فرآیند برگشت کالا پس از رد توسط متولی
    // =====================================================

    'pending_warehouse_return': {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: 'pi pi-calendar',
        label: 'در انتظار تعیین تاریخ تحویل به بازرگانی'
    },

    'warehouse_return_scheduled': {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: 'pi pi-calendar-plus',
        label: 'تاریخ تحویل به بازرگانی تعیین شد'
    },

    'commercial_received': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: 'pi pi-inbox',
        label: 'تحویل گرفته شده توسط بازرگانی'
    },

    'supplier_returned': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: 'pi pi-check-circle',
        label: 'برگشت داده شده به تأمین‌کننده'
    },
}

export function getStatusColor(status, type = 'purchase') {
    return purchaseStatusColors[status] || {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: 'pi pi-circle',
        label: status
    }
}
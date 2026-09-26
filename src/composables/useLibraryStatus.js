// resources/js/Modules/Library/Composables/useLibraryStatus.js

/**
 * Composable برای نمایش یکپارچه وضعیت‌ها در کل ماژول
 */
export function useLibraryStatus() {
    // وضعیت رزرو
    const reservationStatusMap = {
        pending: { label: 'در انتظار تایید', severity: 'warning', icon: 'pi pi-clock' },
        approved: { label: 'تایید شده', severity: 'info', icon: 'pi pi-check-circle' },
        picked_up: { label: 'تحویل داده شده', severity: 'success', icon: 'pi pi-book' },
        returned: { label: 'بازگشت داده شده', severity: 'secondary', icon: 'pi pi-undo' },
        cancelled: { label: 'لغو شده', severity: 'danger', icon: 'pi pi-times-circle' },
        expired: { label: 'منقضی شده', severity: 'danger', icon: 'pi pi-hourglass' },
    };

    // وضعیت نسخه کتاب
    const copyStatusMap = {
        available: { label: 'موجود', severity: 'success' },
        reserved: { label: 'رزرو شده', severity: 'warning' },
        lent: { label: 'امانت داده شده', severity: 'danger' },
        maintenance: { label: 'در تعمیر', severity: 'secondary' },
    };

    const getReservationStatus = (status) =>
        reservationStatusMap[status] || { label: status, severity: 'secondary', icon: '' };

    const getCopyStatus = (status) =>
        copyStatusMap[status] || { label: status, severity: 'secondary' };

    // آیا رزرو فعال است؟ (قابل لغو)
    const isActiveReservation = (status) =>
        ['pending', 'approved', 'picked_up'].includes(status);

    // آیا رزرو قابل لغو توسط کاربر است؟
    const isCancellable = (status) => ['pending', 'approved'].includes(status);

    return {
        reservationStatusMap,
        copyStatusMap,
        getReservationStatus,
        getCopyStatus,
        isActiveReservation,
        isCancellable,
    };
}
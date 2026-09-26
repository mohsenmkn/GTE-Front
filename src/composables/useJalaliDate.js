import { ref, computed } from 'vue'

export function useJalaliDate() {
    /**
     * تبدیل تاریخ میلادی به شمسی
     * @param {string|Date} date - تاریخ میلادی
     * @param {string} format - فرمت خروجی
     * @returns {string} تاریخ شمسی
     */
    const toJalali = (date, format = 'YYYY/MM/DD HH:mm:ss') => {
        if (!date) return '-'

        try {
            const d = new Date(date)
            if (isNaN(d.getTime())) return '-'

            // استفاده از Intl برای تبدیل به شمسی
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                calendar: 'persian'
            }

            return new Intl.DateTimeFormat('fa-IR', options).format(d)
        } catch (error) {
            console.error('Date conversion error:', error)
            return '-'
        }
    }

    /**
     * تبدیل تاریخ میلادی به شمسی (فقط تاریخ)
     */
    const toJalaliDate = (date) => {
        return toJalali(date, 'YYYY/MM/DD')
    }

    /**
     * تبدیل تاریخ میلادی به شمسی (فقط زمان)
     */
    const toJalaliTime = (date) => {
        if (!date) return '-'
        try {
            const d = new Date(date)
            return new Intl.DateTimeFormat('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(d)
        } catch (error) {
            return '-'
        }
    }

    /**
     * تبدیل تاریخ به فرمت انسانی
     */
    const toHumanDate = (date) => {
        if (!date) return '-'
        try {
            const d = new Date(date)
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                calendar: 'persian'
            }).format(d)
        } catch (error) {
            return '-'
        }
    }

    /**
     * تبدیل تاریخ به "چند وقت پیش"
     */
    const timeAgo = (date) => {
        if (!date) return '-'
        try {
            const d = new Date(date)
            const now = new Date()
            const seconds = Math.floor((now - d) / 1000)

            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60
            }

            for (const [unit, secondsInUnit] of Object.entries(intervals)) {
                const interval = Math.floor(seconds / secondsInUnit)
                if (interval >= 1) {
                    const unitNames = {
                        year: 'سال',
                        month: 'ماه',
                        week: 'هفته',
                        day: 'روز',
                        hour: 'ساعت',
                        minute: 'دقیقه'
                    }
                    return `${interval} ${unitNames[unit]} پیش`
                }
            }
            return 'همین الان'
        } catch (error) {
            return '-'
        }
    }

    return {
        toJalali,
        toJalaliDate,
        toJalaliTime,
        toHumanDate,
        timeAgo
    }
}
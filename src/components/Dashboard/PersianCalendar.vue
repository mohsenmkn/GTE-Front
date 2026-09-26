<template>
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <!-- هدر تقویم -->
    <div class="bg-gradient-to-l from-indigo-600 to-purple-600 p-5 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold">{{ currentMonthName }} {{ currentYear }}</h3>
          <p class="text-indigo-100 text-sm mt-1">{{ currentDayName }}، {{ currentDay }} {{ currentMonthName }}</p>
        </div>
        <div class="flex gap-2">
          <button
              @click="changeMonth(-1)"
              class="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <i class="pi pi-chevron-right text-sm"></i>
          </button>
          <button
              @click="changeMonth(1)"
              class="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <i class="pi pi-chevron-left text-sm"></i>
          </button>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 text-xs text-indigo-100">
        <i class="pi pi-clock"></i>
        <span>{{ currentTime }}</span>
      </div>
    </div>

    <!-- روزهای هفته -->
    <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
      <div
          v-for="day in weekDays"
          :key="day"
          class="py-3 text-center text-xs font-semibold text-gray-500"
          :class="{ 'text-red-500': day === 'ج' }"
      >
        {{ day }}
      </div>
    </div>

    <!-- روزهای ماه -->
    <div class="p-3">
      <div class="grid grid-cols-7 gap-1">
        <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="aspect-square flex items-center justify-center rounded-lg text-sm transition-all"
            :class="getDayClasses(day)"
        >
          <span v-if="day" :class="{ 'font-bold': day.isToday }">
            {{ day.day }}
          </span>
        </div>
      </div>
    </div>

    <!-- مناسبت‌ها / رویدادهای امروز -->
    <div class="border-t border-gray-100 p-4 bg-gray-50">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <i class="pi pi-calendar text-indigo-500"></i>
        <span>امروز: <strong class="text-gray-800">{{ todayFullDate }}</strong></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
//import jalaali from 'jalaali-js'

const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const monthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]
const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']

const now = ref(new Date())
const viewYear = ref(null)
const viewMonth = ref(null)

// مقداردهی اولیه
const init = () => {
  const j = jalaali.toJalaali(now.value)
  viewYear.value = j.jy
  viewMonth.value = j.jm
}

const currentYear = computed(() => viewYear.value)
const currentMonth = computed(() => viewMonth.value)
const currentMonthName = computed(() => monthNames[viewMonth.value - 1])

// روز جاری
const currentDay = computed(() => {
  const j = jalaali.toJalaali(now.value)
  if (j.jy === viewYear.value && j.jm === viewMonth.value) {
    return j.jd
  }
  return null
})

// نام روز جاری
const currentDayName = computed(() => {
  const j = jalaali.toJalaali(now.value)
  const dayOfWeek = jalaali.jalaaliMonthLength(j.jy, j.jm) // placeholder
  // محاسبه روز هفته
  const d = new Date(now.value)
  const dayIndex = d.getDay() // 0=Sunday
  const persianDayIndex = (dayIndex + 1) % 7 // 0=Saturday
  return dayNames[persianDayIndex]
})

// زمان جاری
const currentTime = computed(() => {
  return now.value.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

// تاریخ کامل امروز
const todayFullDate = computed(() => {
  const j = jalaali.toJalaali(now.value)
  return `${j.jd} ${monthNames[j.jm - 1]} ${j.jy}`
})

// تغییر ماه
const changeMonth = (delta) => {
  let newMonth = viewMonth.value + delta
  let newYear = viewYear.value
  if (newMonth > 12) {
    newMonth = 1
    newYear++
  } else if (newMonth < 1) {
    newMonth = 12
    newYear--
  }
  viewMonth.value = newMonth
  viewYear.value = newYear
}

// تولید روزهای تقویم
const calendarDays = computed(() => {
  const days = []
  const monthLength = jalaali.jalaaliMonthLength(viewYear.value, viewMonth.value)

  // پیدا کردن روز هفته اول ماه
  const firstDayGregorian = jalaali.toGregorian(viewYear.value, viewMonth.value, 1)
  const firstDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd)
  const firstDayOfWeek = (firstDate.getDay() + 1) % 7 // 0=Saturday

  // خانه‌های خالی قبل از شروع ماه
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }

  // روزهای ماه
  const todayJ = jalaali.toJalaali(now.value)
  for (let d = 1; d <= monthLength; d++) {
    const isToday = (
        todayJ.jy === viewYear.value &&
        todayJ.jm === viewMonth.value &&
        todayJ.jd === d
    )
    // روز هفته این روز
    const thisDate = new Date(
        jalaali.toGregorian(viewYear.value, viewMonth.value, d)
    )
    const dayOfWeek = (thisDate.getDay() + 1) % 7
    const isFriday = dayOfWeek === 6

    days.push({
      day: d,
      isToday,
      isFriday
    })
  }

  // پر کردن خانه‌های باقیمانده
  const remaining = 42 - days.length
  for (let i = 0; i < remaining; i++) {
    days.push(null)
  }

  return days
})

const getDayClasses = (day) => {
  if (!day) return 'bg-transparent'

  let classes = 'text-gray-700 hover:bg-indigo-50 cursor-pointer'

  if (day.isFriday) {
    classes = 'text-red-500 hover:bg-red-50'
  }

  if (day.isToday) {
    classes = 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200 font-bold'
  }

  return classes
}

// آپدیت ساعت هر ثانیه
let timer = null
onMounted(() => {
  init()
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
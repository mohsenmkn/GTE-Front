<template>
  <DashboardCard
      title="اعلانات"
      subtitle="پیام‌ها و اطلاعیه‌های سیستم"
      icon="pi pi-bell"
      icon-class="bg-amber-50 border-amber-100 text-amber-600"
  >

    <template #actions>
      <span
          v-if="unreadCount"
          class="px-2.5 py-1 rounded-full
               bg-red-50 border border-red-100
               text-[10px] font-bold text-red-600"
      >
        {{ unreadCount }} جدید
      </span>
    </template>

    <!-- Loading -->
    <div
        v-if="loading"
        class="space-y-3"
    >
      <div
          v-for="i in 3"
          :key="i"
          class="h-16 rounded-xl bg-slate-100 animate-pulse"
      ></div>
    </div>

    <!-- Empty -->
    <div
        v-else-if="announcements.length === 0"
        class="text-center py-8"
    >
      <div class="empty-icon">
        <i class="pi pi-inbox"></i>
      </div>

      <p class="text-xs text-slate-400 mt-3">
        اعلانی وجود ندارد
      </p>
    </div>

    <!-- List -->
    <div
        v-else
        class="space-y-2 max-h-[430px] overflow-y-auto custom-scrollbar"
    >

      <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement"
          :class="{
          'announcement-unread': !announcement.is_read
        }"
          @click="handleClick(announcement)"
      >

        <div
            class="announcement-icon"
            :class="getTypeIconClass(announcement.type)"
        >
          <i
              :class="getTypeIcon(announcement.type)"
          ></i>
        </div>

        <div class="flex-1 min-w-0">

          <div class="flex items-start gap-2">

            <h4
                class="text-xs text-slate-800 line-clamp-2 flex-1"
                :class="announcement.is_read
                ? 'font-medium'
                : 'font-bold'"
            >
              {{ announcement.title }}
            </h4>

            <span
                v-if="!announcement.is_global"
                class="text-[9px] px-1.5 py-0.5
                     rounded-md bg-blue-50
                     text-blue-600 border border-blue-100"
            >
              اختصاصی
            </span>

          </div>

          <p
              class="text-[11px] text-slate-500
                   line-clamp-2 mt-1.5"
              v-html="announcement.description"
          ></p>

          <div
              class="flex items-center gap-1.5
                   text-[10px] text-slate-400 mt-2"
          >
            <i class="pi pi-calendar"></i>

            <span>
              {{ formatDate(announcement.published_at) }}
            </span>

            <span
                v-if="!announcement.is_read"
                class="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-auto"
            ></span>
          </div>

        </div>

      </div>

    </div>

  </DashboardCard>
</template>

<script setup>
import { computed } from 'vue'
import moment from 'moment-jalaali'
import DashboardCard from '@/views/Dashboard/DashboardCard.vue'

const props = defineProps({
  announcements: {
    type: Array,
    default: () => []
  },

  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['mark-read'])

const unreadCount = computed(() =>
    props.announcements.filter(
        a => !a.is_read
    ).length
)

const handleClick = announcement => {
  if (!announcement.is_read) {
    emit('mark-read', announcement.id)
  }
}

const getTypeIcon = type => {
  const icons = {
    virtual_secretariat: 'pi pi-envelope',
    system: 'pi pi-cog',
    info: 'pi pi-info-circle',
    warning: 'pi pi-exclamation-triangle',
    success: 'pi pi-check-circle'
  }

  return icons[type] || 'pi pi-bell'
}

const getTypeIconClass = type => {
  const classes = {
    virtual_secretariat:
        'bg-purple-50 border-purple-100 text-purple-600',

    system:
        'bg-slate-100 border-slate-200 text-slate-600',

    info:
        'bg-blue-50 border-blue-100 text-blue-600',

    warning:
        'bg-amber-50 border-amber-100 text-amber-600',

    success:
        'bg-emerald-50 border-emerald-100 text-emerald-600'
  }

  return classes[type] ||
      'bg-indigo-50 border-indigo-100 text-indigo-600'
}

const formatDate = date => {
  if (!date) return '-'

  try {
    return moment(date).format('jYYYY/jMM/jDD HH:mm')
  } catch {
    return date
  }
}
</script>

<style scoped>
.announcement {
  @apply flex items-start gap-3
  p-3 rounded-xl
  border border-transparent
  cursor-pointer
  transition-all duration-200;
}

.announcement:hover {
  @apply bg-slate-50 border-slate-100;
}

.announcement-unread {
  @apply bg-indigo-50/40 border-indigo-50;
}

.announcement-unread:hover {
  @apply bg-indigo-50/70 border-indigo-100;
}

.announcement-icon {
  @apply w-9 h-9 rounded-xl border
  flex items-center justify-center
  flex-shrink-0;
}

.announcement-icon i {
  @apply text-sm;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-icon {
  @apply w-12 h-12 mx-auto rounded-xl
  bg-slate-50 border border-slate-100
  flex items-center justify-center
  text-slate-300 text-xl;
}
</style>
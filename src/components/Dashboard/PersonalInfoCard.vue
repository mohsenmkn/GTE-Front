
<template>
  <DashboardCard
      title="اطلاعات پرسنلی"
      subtitle="اطلاعات حساب کاربری"
      icon="pi pi-user"
      icon-class="bg-indigo-50 border-indigo-100 text-indigo-600"
  >

    <!-- Profile -->
    <div class="flex items-center gap-4 mb-5">

      <div
          class="w-16 h-16 rounded-2xl
               bg-gradient-to-br from-indigo-500 to-violet-600
               text-white flex items-center justify-center
               text-2xl font-bold shadow-sm flex-shrink-0"
      >
        {{ userInitial }}
      </div>

      <div class="min-w-0">
        <h3 class="font-bold text-slate-800 text-base truncate">
          {{ profile?.name || 'کاربر' }}
        </h3>

        <p
            v-if="profile?.post?.title"
            class="text-xs text-slate-500 mt-1 truncate"
        >
          {{ profile.post.title }}
        </p>

        <div class="flex items-center gap-1.5 mt-2">
          <span class="status-dot"></span>

          <span class="text-[11px] text-slate-400">
            حساب فعال
          </span>
        </div>
      </div>

    </div>

    <!-- Primary information -->
    <div class="space-y-0">

      <InfoItem
          icon="pi pi-id-card"
          label="کد پرسنلی"
          :value="profile?.personnel_code"

      />

      <InfoItem
          icon="pi pi-building"
          label="واحد سازمانی"
          :value="profile?.unit?.title"
      />

      <InfoItem
          icon="pi pi-briefcase"
          label="پست سازمانی"
          :value="profile?.post?.title"
      />

    </div>

    <!-- Footer -->
    <div
        class="mt-4 pt-4 border-t border-slate-100
             flex items-center justify-between"
    >
      <span class="text-[11px] text-slate-400">
        {{ syncStatusText || 'اطلاعات همگام است' }}
      </span>

      <button
          type="button"
          class="text-xs font-medium text-indigo-600
           hover:text-indigo-700 transition-colors"
          @click="goToProfile"
      >
        مشاهده پروفایل
        <i class="pi pi-arrow-left text-[10px] mr-1"></i>
      </button>
    </div>

  </DashboardCard>
</template>

<script setup>
import { computed } from 'vue'
import DashboardCard from '@/views/Dashboard/DashboardCard.vue'
import InfoItem from "@/views/Dashboard/InfoItem.vue";
import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps({
  profile: {
    type: Object,
    default: null
  },

  syncedAt: {
    type: String,
    default: null
  },

  syncFailed: {
    type: Boolean,
    default: false
  }
})

const userInitial = computed(() => {
  return props.profile?.name?.charAt(0) || 'ک'
})


const goToProfile = () => {
  router.push({ name: 'profile' })
}


const syncStatusText = computed(() => {
  if (props.syncFailed) {
    return 'خطا در به‌روزرسانی'
  }

  if (props.syncedAt) {
    return `به‌روزرسانی ${new Date(
        props.syncedAt
    ).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  }

  return ''
})
</script>

<style scoped>
.status-dot {
  @apply w-1.5 h-1.5 rounded-full bg-emerald-500;
  box-shadow: 0 0 0 3px rgb(16 185 129 / 10%);
}
</style>
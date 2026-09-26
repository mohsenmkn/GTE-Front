<template>
  <DashboardCard
      title="دسترسی سریع"
      subtitle="ماژول‌های در دسترس شما"
      icon="pi pi-bolt"
      icon-class="bg-violet-50 border-violet-100 text-violet-600"
  >

    <div
        v-if="allModules.length"
        class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >

      <router-link
          v-for="module in allModules"
          :key="module.key"
          :to="module.route"
          class="quick-action"
      >

        <div
            class="quick-action-icon"
            :class="module.bgLight"
        >
          <i
              :class="[module.icon, module.textColor]"
              class="text-lg"
          ></i>
        </div>

        <span>
          {{ module.name }}
        </span>

        <i
            class="pi pi-arrow-left quick-arrow"
        ></i>

      </router-link>

    </div>

    <div
        v-else
        class="text-center py-8"
    >
      <div class="empty-icon">
        <i class="pi pi-lock"></i>
      </div>

      <p class="text-xs text-slate-400 mt-3">
        ماژولی در دسترس نیست
      </p>
    </div>

  </DashboardCard>
</template>

<script setup>
import { computed } from 'vue'
import DashboardCard from '@/views/Dashboard/DashboardCard.vue'

const props = defineProps({
  modules: {
    type: Array,
    default: () => []
  }
})

const publicLibraryModule = {
  key: 'library',
  name: 'کتابخانه',
  route: '/library',
  icon: 'pi pi-book',
  bgLight: 'bg-emerald-50',
  textColor: 'text-emerald-600'
}

const allModules = computed(() => {
  const modules = [...props.modules]

  const exists = modules.some(
      m =>
          m?.key === 'library' ||
          m?.name === 'کتابخانه' ||
          m?.route === '/library'
  )

  if (!exists) {
    modules.push(publicLibraryModule)
  }

  return modules
})
</script>

<style scoped>
.quick-action {
  @apply relative flex flex-col items-center
  justify-center gap-2
  p-4 rounded-xl
  border border-slate-100
  bg-slate-50/50
  transition-all duration-300;
}

.quick-action:hover {
  @apply bg-white border-indigo-200 shadow-sm;
  transform: translateY(-2px);
}

.quick-action-icon {
  @apply w-11 h-11 rounded-xl
  flex items-center justify-center
  transition-transform duration-300;
}

.quick-action:hover .quick-action-icon {
  transform: scale(1.08);
}

.quick-action span {
  @apply text-xs font-semibold text-slate-700;
}

.quick-action:hover span {
  @apply text-indigo-700;
}

.quick-arrow {
  @apply absolute top-2 left-2
  text-[9px] text-slate-300
  opacity-0 transition-all;
}

.quick-action:hover .quick-arrow {
  @apply opacity-100 text-indigo-400;
}
</style>
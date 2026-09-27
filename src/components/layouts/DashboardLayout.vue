<template>
  <div class="dashboard-layout" dir="rtl">
    <SidebarMenu :open="sidebarOpen" @close="closeSidebar" />

    <div class="dashboard-layout__main">
      <TopBar @open-sidebar="openSidebar" />

      <main class="dashboard-layout__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import SidebarMenu from './SidebarMenu.vue'
import TopBar from './TopBar.vue'

const sidebarOpen = ref(false)
const route = useRoute()

const openSidebar = () => (sidebarOpen.value = true)
const closeSidebar = () => (sidebarOpen.value = false)

// بستن خودکار در موبایل هنگام تغییر route
watch(
    () => route.fullPath,
    () => {
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches) {
        sidebarOpen.value = false
      }
    }
)

// بستن با ESC
const onKeydown = (e) => {
  if (e.key === 'Escape') closeSidebar()
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #f8fafc;
}

/* ستون اصلی (کنار سایدبار) */
.dashboard-layout__main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-right: 292px;

  box-sizing: border-box;
}

.dashboard-layout__content {
  flex: 1;
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 20px clamp(16px, 2vw, 32px) 32px;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .dashboard-layout__main {
    padding-right: 0;
  }
}



</style>

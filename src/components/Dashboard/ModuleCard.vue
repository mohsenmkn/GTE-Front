<template>
  <router-link
      :to="module.route"
      class="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
  >
    <!-- گرادیان پس‌زمینه -->
    <div
        class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        :class="module.color"
    ></div>

    <div class="relative p-5">
      <!-- آیکون -->
      <div
          class="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
          :class="module.bgLight"
      >
        <!-- ✅ اصلاح شده: ادغام تمام کلاس‌ها در یک :class -->
        <i :class="[module.icon, 'text-2xl', module.textColor]"></i>
      </div>

      <!-- عنوان -->
      <h3 class="font-bold text-gray-800 mb-1 group-hover:text-white transition-colors">
        {{ module.name }}
      </h3>

      <!-- توضیحات -->
      <p class="text-xs text-gray-500 group-hover:text-white/80 transition-colors line-clamp-2">
        {{ module.description }}
      </p>

      <!-- فلش -->
      <div class="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <i class="pi pi-arrow-left text-white text-sm"></i>
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  module: {
    type: Object,
    required: true
  }
})
</script>
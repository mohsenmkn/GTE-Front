<template>
  <div
      class="bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md"
      :class="[
      highlight ? 'border-red-300 bg-red-50' : 'border-gray-100',
      `hover:border-${color}-300`
    ]"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm text-gray-600">{{ title }}</span>
      <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="`bg-${color}-100 text-${color}-600`"
      >
        <i :class="icon"></i>
      </div>
    </div>
    <div
        class="text-2xl font-bold"
        :class="highlight ? 'text-red-600' : 'text-gray-800'"
    >
      {{ value }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    default: 'pi pi-chart-bar'
  },
  color: {
    type: String,
    default: 'blue'
  },
  highlight: {
    type: Boolean,
    default: false
  }
})
</script>
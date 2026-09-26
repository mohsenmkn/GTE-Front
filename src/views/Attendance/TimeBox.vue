<!-- resources/js/Modules/Attendance/Components/TimeBox.vue -->
<template>
  <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
    <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="bgClass">
      <i :class="icon" class="text-white"></i>
    </div>
    <div class="flex-1">
      <div class="text-xs text-gray-600">{{ label }}</div>
      <div class="font-bold font-mono text-lg" :class="textClass">{{ value }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: String,
  label: String,
  value: String,
  color: { type: String, default: 'gray' },
});

const colorMap = {
  green: { bg: 'bg-green-600', text: 'text-green-700' },
  red: { bg: 'bg-red-600', text: 'text-red-700' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-700' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-700' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-700' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-700' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-700' },
};

const bgClass = computed(() => colorMap[props.color]?.bg || 'bg-gray-600');
const textClass = computed(() => colorMap[props.color]?.text || 'text-gray-700');
</script>
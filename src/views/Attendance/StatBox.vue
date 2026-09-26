<!-- resources/js/Modules/Attendance/Components/StatBox.vue -->
<template>
  <div class="bg-gray-50 rounded-lg p-3 text-center border-r-4" :class="borderClass">
    <i  class="text-2xl mb-1" :class="iconClass"></i>
    <div class="text-2xl font-bold" :class="textClass">{{ value }}</div>
    <div class="text-xs text-gray-600">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: String,
  label: String,
  value: [Number, String],
  color: { type: String, default: 'gray' },
});

const colorClasses = {
  green: { border: 'border-green-500', text: 'text-green-700', icon: 'text-green-600' },
  red: { border: 'border-red-500', text: 'text-red-700', icon: 'text-red-600' },
  orange: { border: 'border-orange-500', text: 'text-orange-700', icon: 'text-orange-600' },
  blue: { border: 'border-blue-500', text: 'text-blue-700', icon: 'text-blue-600' },
  purple: { border: 'border-purple-500', text: 'text-purple-700', icon: 'text-purple-600' },
  yellow: { border: 'border-yellow-500', text: 'text-yellow-700', icon: 'text-yellow-600' },
  indigo: { border: 'border-indigo-500', text: 'text-indigo-700', icon: 'text-indigo-600' },
};

const borderClass = computed(() => colorClasses[props.color]?.border || 'border-gray-500');
const textClass = computed(() => colorClasses[props.color]?.text || 'text-gray-700');
const iconClass = computed(() => colorClasses[props.color]?.icon || 'text-gray-600');
</script>
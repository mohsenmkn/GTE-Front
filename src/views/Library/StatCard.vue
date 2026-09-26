<!-- resources/js/Modules/Library/Components/StatCard.vue -->
<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="bgClass">
        <i  class="text-xl" :class="textClass"></i>
      </div>
      <div>
        <div class="text-2xl font-bold text-gray-800">{{ value }}</div>
        <div class="text-sm text-gray-500">{{ label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: String,
  label: String,
  value: [Number, String],
  color: { type: String, default: 'blue' },
});

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
};

const bgClass = computed(() => colorMap[props.color]?.bg || 'bg-blue-100');
const textClass = computed(() => colorMap[props.color]?.text || 'text-blue-600');
</script>
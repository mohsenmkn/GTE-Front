<!-- resources/js/Modules/Library/Components/DistributionBar.vue -->
<template>
  <div>
    <div class="flex justify-between text-sm mb-1">
      <span class="text-gray-600">{{ label }}</span>
      <span class="font-bold text-gray-800">{{ value }} از {{ total }}</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-3">
      <div
          class="h-3 rounded-full transition-all"
          :class="color"
          :style="{ width: percentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: String,
  value: Number,
  total: Number,
  color: String,
});

const percentage = computed(() => {
  if (!props.total) return 0;
  return Math.round((props.value / props.total) * 100);
});
</script>
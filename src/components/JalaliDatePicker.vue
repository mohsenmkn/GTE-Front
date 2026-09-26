<template>
  <DatePicker
      :modelValue="internalDate"
      format="YYYY-MM-DD"
      display-format="jYYYY/jMM/jDD"
      type="date"
      :placeholder="placeholder"
      :editable="true"
      :clearable="true"
      :inputClass="'w-full'"
      @update:modelValue="onDateChange"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import DatePicker from 'vue3-persian-datetime-picker'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'انتخاب تاریخ'
  }
})

const emit = defineEmits(['update:modelValue'])

// مقدار داخلی DatePicker
const internalDate = ref(props.modelValue || null)

// وقتی مقدار بیرونی تغییر کند (مثلاً resetFilters)، مقدار داخلی را به‌روز کن
watch(() => props.modelValue, (newVal) => {
  internalDate.value = newVal || null
})

// وقتی کاربر تاریخی را انتخاب یا پاک کند
const onDateChange = (value) => {
  internalDate.value = value || null
  // خروجی همیشه string شمسی با فرمت YYYY-MM-DD یا رشته خالی است
  emit('update:modelValue', value || '')
}
</script>
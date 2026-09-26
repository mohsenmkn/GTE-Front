<template>
  <div class="persian-date-picker-wrapper" :class="{ 'is-focused': isFocused, 'is-disabled': disabled }">
    <div class="pdp-input-container">
      <vue3-persian-datetime-picker
          ref="picker"
          :model-value="modelValue"
          :type="type"
          :format="format"
          :placeholder="placeholder"
          :disabled="disabled"
          :input-class="'pdp-input'"
          :calendar="calendar"
          :locale="locale"
          :highlight-today="true"
          :auto-submit="autoSubmit"
          @update:model-value="onUpdate"
          @focus="isFocused = true"
          @blur="isFocused = false"
      >
        <template #default>
          <div class="pdp-trigger">
            <i class="pi pi-calendar"></i>
          </div>
        </template>
      </vue3-persian-datetime-picker>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import vue3PersianDatetimePicker from 'vue3-persian-datetime-picker';

const props = defineProps({
  modelValue: {
    type: [String, Date, Number],
    default: null,
  },
  type: {
    type: String,
    default: 'date', // date, datetime, time, year, month
  },
  format: {
    type: String,
    default: 'YYYY-MM-DD',
  },
  placeholder: {
    type: String,
    default: 'انتخاب تاریخ',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  calendar: {
    type: String,
    default: 'persian',
  },
  locale: {
    type: String,
    default: 'fa',
  },
  autoSubmit: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const isFocused = ref(false);
const picker = ref(null);

const onUpdate = (value) => {
  emit('update:modelValue', value);
};
</script>

<style scoped>
.persian-date-picker-wrapper {
  position: relative;
  width: 100%;
  font-family: 'Vazirmatn', sans-serif;
}

.pdp-input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  transition: all 0.2s ease;
  overflow: hidden;
}

.persian-date-picker-wrapper:hover .pdp-input-container {
  border-color: #9ca3af;
}

.persian-date-picker-wrapper.is-focused .pdp-input-container {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.persian-date-picker-wrapper.is-disabled .pdp-input-container {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

/* مخفی کردن input پیش‌فرض پکیج */
.pdp-input {
  width: 100% !important;
  border: none !important;
  outline: none !important;
  padding: 10px 40px 10px 14px !important;
  font-size: 14px !important;
  font-family: 'Vazirmatn', sans-serif !important;
  background: transparent !important;
  color: #1f2937 !important;
  cursor: pointer !important;
  text-align: right !important;
}

.pdp-input::placeholder {
  color: #9ca3af !important;
}

.pdp-input:disabled {
  cursor: not-allowed !important;
}

/* آیکون تقویم */
.pdp-trigger {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
  pointer-events: none;
}

.pdp-trigger i {
  font-size: 16px;
}

.persian-date-picker-wrapper:hover .pdp-trigger {
  background: #2563eb;
}

/* استایل پاپ‌آپ تقویم */
:deep(.vdp-overlay) {
  z-index: 1000;
}

:deep(.vdp-datepicker) {
  font-family: 'Vazirmatn', sans-serif !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e5e7eb !important;
}

:deep(.vdp-datepicker__header) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: white !important;
  border-radius: 8px 8px 0 0 !important;
  padding: 12px !important;
}

:deep(.vdp-datepicker__calendar__cell--highlight) {
  background: #3b82f6 !important;
  color: white !important;
  border-radius: 50% !important;
}

:deep(.vdp-datepicker__calendar__cell--selected) {
  background: #10b981 !important;
  color: white !important;
  border-radius: 50% !important;
}

:deep(.vdp-datepicker__calendar__cell:hover:not(.vdp-datepicker__calendar__cell--disabled)) {
  background: #e0e7ff !important;
  border-radius: 50% !important;
}
</style>
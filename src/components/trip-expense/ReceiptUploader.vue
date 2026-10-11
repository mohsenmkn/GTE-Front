<!-- src/components/trip-expense/ReceiptUploader.vue -->

<template>
  <div class="space-y-3">
    <label class="block text-xs font-semibold text-slate-600">
      تصویر رسید <span class="text-rose-500">*</span>
    </label>

    <!-- ناحیه آپلود -->
    <div
        class="relative border-2 border-dashed rounded-2xl p-5 transition-all duration-200"
        :class="[
                preview
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/50 hover:border-violet-300 hover:bg-violet-50/30'
            ]"
    >
      <!-- پیش‌نمایش -->
      <div v-if="preview" class="space-y-3">
        <div class="relative inline-block">
          <img
              v-if="isImage"
              :src="preview"
              class="max-h-40 rounded-xl border border-slate-200 shadow-sm"
              alt="پیش‌نمایش رسید"
          />
          <div v-else class="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200">
            <i class="pi pi-file-pdf text-rose-500"></i>
            <span class="text-xs text-slate-600">{{ fileName }}</span>
          </div>
          <button
              type="button"
              @click="removeFile"
              class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
          >
            <i class="pi pi-times text-[10px]"></i>
          </button>
        </div>
      </div>

      <!-- حالت خالی -->
      <div v-else class="text-center space-y-2">
        <div class="w-12 h-12 mx-auto rounded-xl bg-violet-100 flex items-center justify-center">
          <i class="pi pi-camera text-violet-600 text-lg"></i>
        </div>
        <p class="text-xs text-slate-600 font-medium">تصویر رسید را انتخاب یا اسکن کنید</p>
        <p class="text-[10px] text-slate-400">فرمت: JPG, PNG, PDF | حداکثر 2MB</p>
      </div>
    </div>

    <!-- دکمه‌های آپلود -->
    <div class="flex flex-wrap gap-2">
      <label
          class="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                     bg-violet-50 border border-violet-200 text-violet-700
                     hover:bg-violet-100 cursor-pointer transition-all text-xs font-medium"
      >
        <i class="pi pi-upload text-sm"></i>
        <span>انتخاب از گالری</span>
        <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            class="hidden"
            @change="handleFileSelect"
        />
      </label>

      <label
          class="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                     bg-emerald-50 border border-emerald-200 text-emerald-700
                     hover:bg-emerald-100 cursor-pointer transition-all text-xs font-medium"
      >
        <i class="pi pi-camera text-sm"></i>
        <span>اسکن با دوربین</span>
        <input
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="handleFileSelect"
        />
      </label>
    </div>

    <!-- پیام خطا -->
    <p v-if="errorMessage" class="text-xs text-rose-600 flex items-center gap-1">
      <i class="pi pi-exclamation-circle"></i>
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: File, default: null },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'error'])

const fileInput = ref(null)
const preview = ref(null)
const fileName = ref('')
const errorMessage = ref('')

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

const isImage = computed(() => {
  if (!preview.value) return false
  return preview.value.startsWith('data:image')
})

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  errorMessage.value = ''

  // بررسی فرمت
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!validTypes.includes(file.type)) {
    errorMessage.value = 'فرمت فایل باید JPG، PNG یا PDF باشد'
    emit('error', errorMessage.value)
    return
  }

  // بررسی حجم
  if (file.size > MAX_SIZE) {
    errorMessage.value = 'حجم فایل نباید بیشتر از 2 مگابایت باشد'
    emit('error', errorMessage.value)
    return
  }

  fileName.value = file.name
  emit('update:modelValue', file)

  // پیش‌نمایش
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const removeFile = () => {
  preview.value = null
  fileName.value = ''
  errorMessage.value = ''
  emit('update:modelValue', null)
  if (fileInput.value) fileInput.value.value = ''
}

// ریست کردن در صورت تغییر modelValue از بیرون
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    removeFile()
  }
})
</script>
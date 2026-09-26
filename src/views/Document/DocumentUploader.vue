<!-- resources/js/components/DocumentUploader.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      header="آپلود سند جدید"
      modal
      :style="{ width: '600px' }"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="upload-form">
      <!-- عنوان -->
      <div class="form-field">
        <label for="title" class="required">عنوان سند</label>
        <InputText
            id="title"
            v-model="form.title"
            placeholder="عنوان سند را وارد کنید"
            :invalid="!!errors.title"
            @input="clearFieldError('title')"
            class="w-full"
        />
        <small v-if="errors.title" class="error-text">{{ errors.title[0] }}</small>
      </div>

      <!-- نوع سند -->
      <div class="form-field">
        <label for="type" class="required">نوع سند</label>
        <Select
            id="type"
            v-model="form.type"
            :options="documentTypes"
            option-label="label"
            option-value="value"
            placeholder="انتخاب نوع سند"
            :invalid="!!errors.type"
            @change="clearFieldError('type')"
            class="w-full"
        />
        <small v-if="errors.type" class="error-text">{{ errors.type[0] }}</small>
      </div>

      <!-- توضیحات -->
      <div class="form-field">
        <label for="description">توضیحات</label>
        <Textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="توضیحات تکمیلی..."
            :invalid="!!errors.description"
            @input="clearFieldError('description')"
            class="w-full"
            auto-resize
        />
        <small v-if="errors.description" class="error-text">{{ errors.description[0] }}</small>
      </div>

      <!-- آپلود فایل -->
      <div class="form-field">
        <label class="required">انتخاب فایل</label>
        <div
            class="drop-zone"
            :class="{ 'dragover': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
        >
          <div v-if="!form.file" class="drop-content">
            <i class="pi pi-upload text-4xl text-muted-color" />
            <p>فایل را اینجا بکشید و رها کنید</p>
            <p class="text-muted-color text-sm">یا</p>
            <Button label="انتخاب فایل" severity="secondary" @click="$refs.fileInput.click()" type="button" />
          </div>
          <div v-else class="file-info">
            <i class="pi pi-file text-2xl" />
            <div class="file-details">
              <span class="file-name">{{ form.file.name }}</span>
              <span class="file-size">{{ formatFileSize(form.file.size) }}</span>
            </div>
            <Button
                icon="pi pi-times"
                text
                rounded
                severity="danger"
                @click="removeFile"
                type="button"
            />
          </div>
          <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleFileSelect"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
          />
        </div>
        <small v-if="errors.file" class="error-text">{{ errors.file[0] }}</small>
        <small class="helper-text">حداکثر حجم: 20MB | فرمت‌های مجاز: PDF, DOC, XLS, JPG, PNG, ZIP</small>
      </div>

      <!-- دکمه‌ها -->
      <div class="form-actions">
        <Button
            label="انصراف"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="cancel"
            type="button"
            :disabled="loading"
        />
        <Button
            label="آپلود"
            :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'"
            type="submit"
            :loading="loading"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { documentService } from '@/services/documentService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: [Number, String],
    required: true
  },
  documentableType: {
    type: String,
    required: true,
    validator: (value) => ['project', 'wbs_item', 'contract', 'petty_cash_transaction'].includes(value)
  },
  documentableId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const isDragging = ref(false)

const documentTypes = [
  { label: 'نقشه', value: 'drawing' },
  { label: 'فاکتور', value: 'invoice' },
  { label: 'قرارداد', value: 'contract' },
  { label: 'گزارش', value: 'report' },
  { label: 'تصویر', value: 'photo' },
  { label: 'سایر', value: 'other' }
]

const defaultForm = () => ({
  title: '',
  type: 'other',
  description: '',
  file: null
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.file = file
    clearFieldError('file')
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    form.file = file
    clearFieldError('file')
  }
}

const removeFile = () => {
  form.file = null
  if (document.querySelector('input[type="file"]')) {
    document.querySelector('input[type="file"]').value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  loading.value = true

  try {
    if (!form.file) {
      errors.value.file = ['لطفاً یک فایل انتخاب کنید']
      return
    }

    const payload = {
      company_id: props.companyId,
      documentable_type: props.documentableType,
      documentable_id: props.documentableId,
      title: form.title,
      type: form.type,
      description: form.description || null,
      file: form.file
    }

    console.log('📤 Uploading document:', payload)

    await documentService.upload(payload)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'سند با موفقیت آپلود شد',
      life: 3000
    })

    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1000)
  } catch (error) {
    console.error('❌ Upload error:', error)

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = error.response.data.message || 'لطفاً خطاهای فرم را بررسی کنید'
    } else {
      serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
    }
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  Object.assign(form, defaultForm())
  errors.value = {}
  serverError.value = ''
  localVisible.value = false
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
  if (serverError.value) {
    serverError.value = ''
  }
}

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal) {
    errors.value = {}
    serverError.value = ''
    Object.assign(form, defaultForm())
    removeFile()
  }
})
</script>

<style scoped>
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

label.required::after {
  content: ' *';
  color: var(--red-500);
}

.error-text {
  color: var(--red-500);
  font-size: 0.85rem;
  display: block;
  margin-top: 0.25rem;
}

.helper-text {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
}

.drop-zone {
  border: 2px dashed var(--surface-border);
  border-radius: 6px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.drop-zone.dragover {
  border-color: var(--primary-color);
  background: var(--surface-active);
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.5rem 1rem;
  background: var(--surface-hover);
  border-radius: 6px;
}

.file-details {
  flex: 1;
  text-align: right;
}

.file-name {
  display: block;
  font-weight: 500;
  color: var(--text-color);
}

.file-size {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.hidden {
  display: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
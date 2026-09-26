<!-- resources/js/views/inventory/CategoryForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="categoryId ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'"
      modal
      :style="{ width: '500px' }"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <div class="form-field">
        <label for="name" class="required">نام دسته‌بندی</label>
        <InputText
            id="name"
            v-model="form.name"
            placeholder="نام دسته‌بندی"
            :invalid="!!errors.name"
            @input="clearFieldError('name')"
            class="w-full"
        />
        <small v-if="errors.name" class="error-text">{{ errors.name[0] }}</small>
      </div>

      <div class="form-field">
        <label for="code">کد دسته‌بندی</label>
        <InputText
            id="code"
            v-model="form.code"
            placeholder="کد اختصاصی (اختیاری)"
            :invalid="!!errors.code"
            @input="clearFieldError('code')"
            class="w-full"
        />
        <small v-if="errors.code" class="error-text">{{ errors.code[0] }}</small>
      </div>

      <div class="form-field" v-if="!categoryId">
        <label for="parent_id">دسته‌بندی والد</label>
        <Select
            id="parent_id"
            v-model="form.parent_id"
            :options="parentCategories"
            option-label="name"
            option-value="id"
            placeholder="بدون والد (ریشه)"
            class="w-full"
            filter
            show-clear
        />
        <small v-if="errors.parent_id" class="error-text">{{ errors.parent_id[0] }}</small>
      </div>

      <div class="form-field">
        <label for="status">وضعیت</label>
        <Select
            id="status"
            v-model="form.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="انتخاب وضعیت"
            class="w-full"
        />
        <small v-if="errors.status" class="error-text">{{ errors.status[0] }}</small>
      </div>

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
            :label="categoryId ? 'بروزرسانی' : 'ثبت'"
            :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
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
import { inventoryService } from '@/services/inventoryService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  categoryId: {
    type: [Number, String],
    default: null
  },
  parentId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const allCategories = ref([])

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' }
]

const defaultForm = () => ({
  name: '',
  code: '',
  parent_id: props.parentId || null,
  status: 'active',
  description: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const parentCategories = computed(() => {
  // حذف خودش از لیست والدها (برای ویرایش)
  return allCategories.value.filter(c => c.id !== props.categoryId)
})

// Methods
const loadCategories = async () => {
  try {
    const response = await inventoryService.getCategories({ per_page: 100 })
    allCategories.value = response.data.data || []
    //console.log("Categories===>>",allCategories.value)
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadCategory = async () => {
  if (!props.categoryId) return

  try {
    loading.value = true
    const response = await inventoryService.getCategory(props.categoryId)
    const data = response.data.data

    Object.assign(form, {
      name: data.name || '',
      code: data.code || '',
      parent_id: data.parent_id || null,
      status: data.status || 'active',
      description: data.description || ''
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات دسته‌بندی با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  loading.value = true

  try {
    const payload = {
      name: form.name,
      code: form.code || null,
      parent_id: form.parent_id || null,
      status: form.status,
      description: form.description || null
    }

    if (props.categoryId) {
      await inventoryService.updateCategory(props.categoryId, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'دسته‌بندی با موفقیت بروزرسانی شد',
        life: 3000
      })
    } else {
      await inventoryService.createCategory(payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'دسته‌بندی با موفقیت ایجاد شد',
        life: 3000
      })
    }

    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1000)
  } catch (error) {
    console.error('Error:', error)
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'
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
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    errors.value = {}
    serverError.value = ''
    await loadCategories()

    if (props.categoryId) {
      await loadCategory()
    } else {
      Object.assign(form, defaultForm())
      form.parent_id = props.parentId || null
    }
  }
})
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
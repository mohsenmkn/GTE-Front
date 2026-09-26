<!-- resources/js/views/inventory/MaterialForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="materialId ? 'ویرایش کالا' : 'کالا جدید'"
      modal
      :style="{ width: '600px' }"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <div class="form-row">
        <div class="form-field">
          <label for="code" class="required">کد کالا</label>
          <InputText
              id="code"
              v-model="form.code"
              placeholder="کد اختصاصی"
              :invalid="!!errors.code"
              @input="clearFieldError('code')"
              class="w-full"
          />
          <small v-if="errors.code" class="error-text">{{ errors.code[0] }}</small>
        </div>

        <div class="form-field">
          <label for="name" class="required">نام کالا</label>
          <InputText
              id="name"
              v-model="form.name"
              placeholder="نام کالا"
              :invalid="!!errors.name"
              @input="clearFieldError('name')"
              class="w-full"
          />
          <small v-if="errors.name" class="error-text">{{ errors.name[0] }}</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="category_id">دسته‌بندی</label>
          <Select
              id="category_id"
              v-model="form.category_id"
              :options="categories"
              option-label="name"
              option-value="id"
              placeholder="انتخاب دسته‌بندی"
              :invalid="!!errors.category_id"
              @change="clearFieldError('category_id')"
              class="w-full"
              filter
              show-clear
          />
          <small v-if="errors.category_id" class="error-text">{{ errors.category_id[0] }}</small>
        </div>

        <div class="form-field">
          <label for="unit">واحد</label>
          <InputText
              id="unit"
              v-model="form.unit"
              placeholder="مثلاً: عدد، کیلوگرم، متر"
              :invalid="!!errors.unit"
              @input="clearFieldError('unit')"
              class="w-full"
          />
          <small v-if="errors.unit" class="error-text">{{ errors.unit[0] }}</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="unit_price">قیمت واحد (ریال)</label>
          <InputNumber
              id="unit_price"
              v-model="form.unit_price"
              placeholder="0"
              :min="0"
              :invalid="!!errors.unit_price"
              @input="clearFieldError('unit_price')"
              class="w-full"
              :use-grouping="true"
              mode="currency"
              currency="IRR"
              locale="en-US"
          />
          <small v-if="errors.unit_price" class="error-text">{{ errors.unit_price[0] }}</small>
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
              :invalid="!!errors.status"
              @change="clearFieldError('status')"
              class="w-full"
          />
          <small v-if="errors.status" class="error-text">{{ errors.status[0] }}</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="current_stock">موجودی فعلی</label>
          <InputNumber
              id="current_stock"
              v-model="form.current_stock"
              placeholder="0"
              :min="0"
              :invalid="!!errors.current_stock"
              @input="clearFieldError('current_stock')"
              class="w-full"
          />
          <small v-if="errors.current_stock" class="error-text">{{ errors.current_stock[0] }}</small>
        </div>

        <div class="form-field">
          <label for="min_stock">حداقل موجودی</label>
          <InputNumber
              id="min_stock"
              v-model="form.min_stock"
              placeholder="0"
              :min="0"
              :invalid="!!errors.min_stock"
              @input="clearFieldError('min_stock')"
              class="w-full"
          />
          <small v-if="errors.min_stock" class="error-text">{{ errors.min_stock[0] }}</small>
        </div>
      </div>

      <div class="form-field">
        <label for="max_stock">حداکثر موجودی</label>
        <InputNumber
            id="max_stock"
            v-model="form.max_stock"
            placeholder="0"
            :min="0"
            :invalid="!!errors.max_stock"
            @input="clearFieldError('max_stock')"
            class="w-full"
        />
        <small v-if="errors.max_stock" class="error-text">{{ errors.max_stock[0] }}</small>
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
            :label="materialId ? 'بروزرسانی' : 'ثبت کالا'"
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
  materialId: {
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
const categories = ref([])

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' }
]

const defaultForm = () => ({
  code: '',
  name: '',
  category_id: null,
  unit: '',
  unit_price: null,
  current_stock: 0,
  min_stock: 0,
  max_stock: 0,
  description: '',
  status: 'active'
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const loadCategories = async () => {
  try {
    const response = await inventoryService.getCategories({ per_page: 100 })
    categories.value = response.data.data || []
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadMaterial = async () => {
  if (!props.materialId) return

  try {
    loading.value = true
    const response = await inventoryService.getMaterial(props.materialId)
    const data = response.data.data

    Object.assign(form, {
      code: data.code || '',
      name: data.name || '',
      category_id: data.category_id || null,
      unit: data.unit || '',
      unit_price: data.unit_price || null,
      current_stock: data.current_stock || 0,
      min_stock: data.min_stock || 0,
      max_stock: data.max_stock || 0,
      description: data.description || '',
      status: data.status || 'active'
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات کالا با خطا مواجه شد',
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
    const payload = { ...form }

    if (props.materialId) {
      await inventoryService.updateMaterial(props.materialId, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'کالا با موفقیت بروزرسانی شد',
        life: 3000
      })
    } else {
      await inventoryService.createMaterial(payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'کالا با موفقیت ایجاد شد',
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

    if (props.materialId) {
      await loadMaterial()
    } else {
      Object.assign(form, defaultForm())
      // تولید کد خودکار
      const timestamp = String(Date.now()).slice(-6)
      form.code = `MAT-${timestamp}`
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
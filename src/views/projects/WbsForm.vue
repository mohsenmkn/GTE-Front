<!-- resources/js/views/projects/WbsForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="wbsId ? 'ویرایش آیتم WBS' : 'آیتم WBS جدید'"
      modal
      :style="{ width: '600px' }"
      class="wbs-form-dialog"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="wbs-form">
      <!-- کد و نام -->
      <div class="form-row">
        <div class="form-field">
          <label for="code" class="required">کد</label>
          <InputText
              id="code"
              v-model="form.code"
              placeholder="مثال: WBS-001"
              :invalid="!!errors.code"
              @input="clearFieldError('code')"
              class="w-full"
          />
          <small v-if="errors.code" class="error-text">{{ errors.code[0] }}</small>
        </div>

        <div class="form-field">
          <label for="name" class="required">نام</label>
          <InputText
              id="name"
              v-model="form.name"
              placeholder="نام آیتم WBS"
              :invalid="!!errors.name"
              @input="clearFieldError('name')"
              class="w-full"
          />
          <small v-if="errors.name" class="error-text">{{ errors.name[0] }}</small>
        </div>
      </div>

      <!-- دسته‌بندی و وضعیت -->
      <div class="form-row">
        <div class="form-field">
          <label for="category" class="required">دسته‌بندی</label>
          <Select
              id="category"
              v-model="form.category"
              :options="categoryOptions"
              option-label="label"
              option-value="value"
              placeholder="انتخاب دسته‌بندی"
              :invalid="!!errors.category"
              @change="clearFieldError('category')"
              class="w-full"
          />
          <small v-if="errors.category" class="error-text">{{ errors.category[0] }}</small>
        </div>

        <div class="form-field">
          <label for="status" class="required">وضعیت</label>
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

      <!-- هزینه‌ها -->
      <div class="form-row">
        <div class="form-field">
          <label for="quantity">تعداد</label>
          <InputNumber
              id="quantity"
              v-model="form.quantity"
              placeholder="0"
              :min="0"
              :invalid="!!errors.quantity"
              @input="clearFieldError('quantity')"
              class="w-full"
          />
          <small v-if="errors.quantity" class="error-text">{{ errors.quantity[0] }}</small>
        </div>

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
          />
          <small v-if="errors.unit_price" class="error-text">{{ errors.unit_price[0] }}</small>
        </div>
      </div>

      <!-- وزن و واحد -->
      <div class="form-row">
        <div class="form-field">
          <label for="weight">وزن (درصد)</label>
          <InputNumber
              id="weight"
              v-model="form.weight"
              placeholder="0"
              :min="0"
              :max="100"
              :invalid="!!errors.weight"
              @input="clearFieldError('weight')"
              class="w-full"
          />
          <small v-if="errors.weight" class="error-text">{{ errors.weight[0] }}</small>
          <small class="helper-text">وزن در محاسبه پیشرفت کلی پروژه</small>
        </div>

        <div class="form-field">
          <label for="unit">واحد</label>
          <InputText
              id="unit"
              v-model="form.unit"
              placeholder="متر، کیلوگرم، ..."
              :invalid="!!errors.unit"
              @input="clearFieldError('unit')"
              class="w-full"
          />
          <small v-if="errors.unit" class="error-text">{{ errors.unit[0] }}</small>
        </div>
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
            :label="wbsId ? 'بروزرسانی' : 'ثبت'"
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
import { wbsService } from '@/services/wbsService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: [Number, String],
    required: true
  },
  wbsId: {
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

const categoryOptions = [
  { label: 'عمرانی', value: 'civil' },
  { label: 'برقی', value: 'electrical' },
  { label: 'مکانیکی', value: 'mechanical' }
]



const statusOptions = [
  { label: 'در انتظار', value: 'pending' },        // ✅ به جای not_started
  { label: 'در حال انجام', value: 'in_progress' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'متوقف', value: 'on_hold' }
]

const defaultForm = () => ({
  code: '',
  name: '',
  category: null,
  unit: '',
  quantity: null,
  unit_price: null,
  weight: 0,
  status: 'pending',
  description: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})


// const loadWbsItem = async () => {
//   if (!props.wbsId) {
//     // ✅ اگر ویرایش نیست، فرم رو ریست کن
//     Object.assign(form, defaultForm())
//     return
//   }
//
//   try {
//     loading.value = true
//     const response = await wbsService.get(props.wbsId)
//     const data = response.data.data
//     Object.assign(form, {
//       code: data.code || '',
//       name: data.name || '',
//       category: data.category || null,
//       unit: data.unit || '',
//       quantity: data.quantity || null,
//       unit_price: data.unit_price || null,
//       weight: data.weight || 0,
//       status: data.status || 'pending',
//       description: data.description || ''
//     })
//   } catch (error) {
//     toast.add({
//       severity: 'error',
//       summary: 'خطا',
//       detail: 'بارگذاری اطلاعات با خطا مواجه شد',
//       life: 3000
//     })
//     console.log(error.message)
//   } finally {
//     loading.value = false
//   }
// }

const loadWbsItem = async () => {
  if (!props.wbsId) {
    Object.assign(form, defaultForm())
    return
  }

  try {
    loading.value = true
    serverError.value = ''

    console.log('📥 Loading WBS item:', props.wbsId) // دیباگ

    const response = await wbsService.get(props.wbsId)

    // ✅ بررسی ساختار پاسخ
    if (!response || !response.data) {
      throw new Error('پاسخی از سرور دریافت نشد')
    }

    // ✅ اگر پاسخ به صورت { data: { data: {...} } } هست
    let data = response.data
    if (data.data) {
      data = data.data
    }

    console.log('📥 Received data:', data) // دیباگ

    // ✅ بررسی وجود داده
    if (!data || typeof data !== 'object') {
      throw new Error('داده‌های دریافتی نامعتبر است')
    }

    Object.assign(form, {
      code: data.code || '',
      name: data.name || '',
      category: data.category || null,
      unit: data.unit || '',
      quantity: data.quantity ?? null,
      unit_price: data.unit_price ?? null,
      weight: data.weight ?? 0,
      status: data.status || 'pending',
      description: data.description || ''
    })

  } catch (error) {
    console.error('❌ Error loading WBS item:', error)

    // ✅ مدیریت خطاهای مختلف
    if (error.response?.status === 404) {
      serverError.value = 'آیتم WBS مورد نظر یافت نشد'
    } else if (error.response?.status === 500) {
      serverError.value = 'خطای سرور. لطفاً با پشتیبانی تماس بگیرید'
    } else {
      serverError.value = error.response?.data?.message ||
          error.message ||
          'خطا در بارگذاری اطلاعات'
    }

    // ✅ در صورت خطا، فرم رو ریست کن
    Object.assign(form, defaultForm())

    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: serverError.value,
      life: 5000
    })

  } finally {
    loading.value = false
  }
}


// const submit = async () => {
//   errors.value = {}
//   serverError.value = ''
//   loading.value = true
//
//   try {
//     // ✅ اصلاح: parent_id رو به درستی مدیریت کنید
//     let parentId = props.parentId;
//
//     // اگر parentId برابر با null یا undefined یا رشته خالی بود، null ارسال کن
//     if (parentId === null || parentId === undefined || parentId === '' || parentId === 'null') {
//       parentId = null;
//     }
//
//     const payload = {
//       project_id: props.projectId,
//       parent_id: parentId, // ✅ فقط یک بار ارسال بشه
//       code: form.code,
//       name: form.name,
//       category: form.category,
//       unit: form.unit || null,
//       quantity: form.quantity || 0,
//       unit_price: form.unit_price || 0,
//       weight: form.weight || 0,
//       status: form.status,
//       description: form.description || null
//     }
//
//     // حذف کلیدهایی که مقدار null دارند (اختیاری)
//     Object.keys(payload).forEach(key => {
//       if (payload[key] === null || payload[key] === undefined) {
//         delete payload[key];
//       }
//     });
//
//     if (props.wbsId) {
//       await wbsService.update(props.wbsId, payload)
//       toast.add({
//         severity: 'success',
//         summary: 'موفق',
//         detail: 'آیتم WBS با موفقیت بروزرسانی شد',
//         life: 3000
//       })
//     } else {
//       await wbsService.create(payload)
//       toast.add({
//         severity: 'success',
//         summary: 'موفق',
//         detail: 'آیتم WBS با موفقیت ایجاد شد',
//         life: 3000
//       })
//     }
//
//     setTimeout(() => {
//       emit('saved')
//       localVisible.value = false
//     }, 1000)
//   } catch (error) {
//     console.error('Error:', error)
//     if (error.response?.status === 422) {
//       errors.value = error.response.data.errors || {}
//       serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'
//     } else {
//       serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
//     }
//   } finally {
//     loading.value = false
//   }
// }

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  loading.value = true

  try {
    // ✅ ساخت payload پایه
    const payload = {
      code: form.code,
      name: form.name,
      category: form.category,
      unit: form.unit || null,
      quantity: form.quantity || 0,
      unit_price: form.unit_price || 0,
      weight: form.weight || 0,
      status: form.status,
      description: form.description || null
    }

    // ✅ در حالت ویرایش، فقط فیلدهای قابل ویرایش رو ارسال کن
    if (props.wbsId) {
      // ✅ برای ویرایش، parent_id رو ارسال نکن (یا اگر نیاز هست، با مقدار فعلی)
      // بعضی از فیلدها ممکنه در ویرایش نیاز نباشن

      console.log('📤 Updating WBS item:', props.wbsId, payload)

      const response = await wbsService.update(props.wbsId, payload)
      console.log('✅ Update response:', response)

      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'آیتم WBS با موفقیت بروزرسانی شد',
        life: 3000
      })

    } else {
      // ✅ در حالت ایجاد، parent_id رو اضافه کن
      let parentId = props.parentId
      if (parentId === null || parentId === undefined || parentId === '' || parentId === 'null') {
        parentId = null
      }

      payload.parent_id = parentId
      payload.project_id = props.projectId

      console.log('📤 Creating WBS item:', payload)

      const response = await wbsService.create(payload)
      console.log('✅ Create response:', response)

      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'آیتم WBS با موفقیت ایجاد شد',
        life: 3000
      })
    }

    // ✅ بعد از موفقیت، دیالوگ رو ببند
    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1000)

  } catch (error) {
    console.error('❌ Submit error:', error)

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'

      // ✅ نمایش خطاهای validation
      const errorMessages = Object.values(errors.value).flat().join('\n')
      toast.add({
        severity: 'error',
        summary: 'خطای اعتبارسنجی',
        detail: errorMessages || 'لطفاً فیلدهای فرم را بررسی کنید',
        life: 5000
      })

    } else if (error.response?.status === 404) {
      serverError.value = 'آیتم مورد نظر یافت نشد'
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'آیتم WBS مورد نظر یافت نشد',
        life: 3000
      })

    } else {
      serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: serverError.value,
        life: 5000
      })
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

    if (props.wbsId) {
      // ✅ حالت ویرایش
      loadWbsItem()
    } else {
      // ✅ حالت ایجاد جدید
      Object.assign(form, defaultForm())
      // تولید کد خودکار
      const timestamp = String(Date.now()).slice(-6)
      form.code = `WBS-${timestamp}`

      // اگر parentId وجود داره، یعنی زیرمجموعه هست
      if (props.parentId) {
        // می‌تونید پیام یا تنظیمات خاصی انجام بدید
        console.log('Creating child item under parent:', props.parentId)
      }
    }
  } else {
    // ✅ وقتی دیالوگ بسته میشه، فرم رو ریست کن
    Object.assign(form, defaultForm())
  }
})
</script>

<style scoped>
.wbs-form-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.wbs-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.helper-text {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
  line-height: 1.4;
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
}
</style>
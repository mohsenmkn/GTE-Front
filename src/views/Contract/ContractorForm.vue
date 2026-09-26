<!-- resources/js/views/contracts/ContractorForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="contractorId ? 'ویرایش پیمانکار' : 'پیمانکار جدید'"
      modal
      :style="{ width: '700px' }"
      class="contractor-form"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <!-- اطلاعات پایه -->
      <div class="form-section">
        <h4>اطلاعات پایه</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="name" class="required">نام پیمانکار</label>
            <InputText
                id="name"
                v-model="form.name"
                placeholder="نام کامل پیمانکار"
                :invalid="!!errors.name"
                @input="clearFieldError('name')"
                class="w-full"
            />
            <small v-if="errors.name" class="error-text">{{ errors.name[0] }}</small>
          </div>

          <div class="form-field">
            <label for="code">کد پیمانکار</label>
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
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="type" class="required">نوع پیمانکار</label>
            <Select
                id="type"
                v-model="form.type"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                placeholder="انتخاب نوع"
                :invalid="!!errors.type"
                @change="clearFieldError('type')"
                class="w-full"
            />
            <small v-if="errors.type" class="error-text">{{ errors.type[0] }}</small>
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
      </div>

      <!-- اطلاعات ثبت و شناسه‌ها -->
      <div class="form-section">
        <h4>اطلاعات ثبت و شناسه‌ها</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="registration_number">شماره ثبت</label>
            <InputText
                id="registration_number"
                v-model="form.registration_number"
                placeholder="شماره ثبت شرکت"
                :invalid="!!errors.registration_number"
                @input="clearFieldError('registration_number')"
                class="w-full"
            />
            <small v-if="errors.registration_number" class="error-text">{{ errors.registration_number[0] }}</small>
          </div>

          <div class="form-field">
            <label for="economic_code">کد اقتصادی</label>
            <InputText
                id="economic_code"
                v-model="form.economic_code"
                placeholder="کد اقتصادی"
                :invalid="!!errors.economic_code"
                @input="clearFieldError('economic_code')"
                class="w-full"
            />
            <small v-if="errors.economic_code" class="error-text">{{ errors.economic_code[0] }}</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="national_id">شناسه ملی</label>
            <InputText
                id="national_id"
                v-model="form.national_id"
                placeholder="شناسه ملی"
                :invalid="!!errors.national_id"
                @input="clearFieldError('national_id')"
                class="w-full"
            />
            <small v-if="errors.national_id" class="error-text">{{ errors.national_id[0] }}</small>
          </div>

          <div class="form-field">
            <label for="website">وبسایت</label>
            <InputText
                id="website"
                v-model="form.website"
                placeholder="https://example.com"
                :invalid="!!errors.website"
                @input="clearFieldError('website')"
                class="w-full"
            />
            <small v-if="errors.website" class="error-text">{{ errors.website[0] }}</small>
          </div>
        </div>
      </div>

      <!-- اطلاعات تماس -->
      <div class="form-section">
        <h4>اطلاعات تماس</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="phone">تلفن</label>
            <InputText
                id="phone"
                v-model="form.phone"
                placeholder="تلفن ثابت"
                :invalid="!!errors.phone"
                @input="clearFieldError('phone')"
                class="w-full"
            />
            <small v-if="errors.phone" class="error-text">{{ errors.phone[0] }}</small>
          </div>

          <div class="form-field">
            <label for="mobile">موبایل</label>
            <InputText
                id="mobile"
                v-model="form.mobile"
                placeholder="شماره موبایل"
                :invalid="!!errors.mobile"
                @input="clearFieldError('mobile')"
                class="w-full"
            />
            <small v-if="errors.mobile" class="error-text">{{ errors.mobile[0] }}</small>
          </div>
        </div>

        <div class="form-field">
          <label for="email">ایمیل</label>
          <InputText
              id="email"
              v-model="form.email"
              placeholder="example@domain.com"
              :invalid="!!errors.email"
              @input="clearFieldError('email')"
              class="w-full"
          />
          <small v-if="errors.email" class="error-text">{{ errors.email[0] }}</small>
        </div>
      </div>

      <!-- آدرس -->
      <div class="form-section">
        <h4>آدرس</h4>
        <div class="form-field">
          <label for="address">آدرس</label>
          <Textarea
              id="address"
              v-model="form.address"
              rows="2"
              placeholder="آدرس کامل"
              :invalid="!!errors.address"
              @input="clearFieldError('address')"
              class="w-full"
              auto-resize
          />
          <small v-if="errors.address" class="error-text">{{ errors.address[0] }}</small>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="province">استان</label>
            <InputText
                id="province"
                v-model="form.province"
                placeholder="استان"
                :invalid="!!errors.province"
                @input="clearFieldError('province')"
                class="w-full"
            />
            <small v-if="errors.province" class="error-text">{{ errors.province[0] }}</small>
          </div>

          <div class="form-field">
            <label for="city">شهر</label>
            <InputText
                id="city"
                v-model="form.city"
                placeholder="شهر"
                :invalid="!!errors.city"
                @input="clearFieldError('city')"
                class="w-full"
            />
            <small v-if="errors.city" class="error-text">{{ errors.city[0] }}</small>
          </div>
        </div>

        <div class="form-field">
          <label for="postal_code">کد پستی</label>
          <InputText
              id="postal_code"
              v-model="form.postal_code"
              placeholder="کد پستی"
              :invalid="!!errors.postal_code"
              @input="clearFieldError('postal_code')"
              class="w-full"
          />
          <small v-if="errors.postal_code" class="error-text">{{ errors.postal_code[0] }}</small>
        </div>
      </div>

      <!-- اطلاعات بانکی -->
      <div class="form-section">
        <h4>اطلاعات بانکی</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="bank_name">نام بانک</label>
            <InputText
                id="bank_name"
                v-model="form.bank_name"
                placeholder="نام بانک"
                :invalid="!!errors.bank_name"
                @input="clearFieldError('bank_name')"
                class="w-full"
            />
            <small v-if="errors.bank_name" class="error-text">{{ errors.bank_name[0] }}</small>
          </div>

          <div class="form-field">
            <label for="bank_account_number">شماره حساب</label>
            <InputText
                id="bank_account_number"
                v-model="form.bank_account_number"
                placeholder="شماره حساب"
                :invalid="!!errors.bank_account_number"
                @input="clearFieldError('bank_account_number')"
                class="w-full"
            />
            <small v-if="errors.bank_account_number" class="error-text">{{ errors.bank_account_number[0] }}</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="bank_card_number">شماره کارت</label>
            <InputText
                id="bank_card_number"
                v-model="form.bank_card_number"
                placeholder="شماره کارت"
                :invalid="!!errors.bank_card_number"
                @input="clearFieldError('bank_card_number')"
                class="w-full"
            />
            <small v-if="errors.bank_card_number" class="error-text">{{ errors.bank_card_number[0] }}</small>
          </div>

          <div class="form-field">
            <label for="shaba_number">شماره شبا</label>
            <InputText
                id="shaba_number"
                v-model="form.shaba_number"
                placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
                :invalid="!!errors.shaba_number"
                @input="clearFieldError('shaba_number')"
                class="w-full"
            />
            <small v-if="errors.shaba_number" class="error-text">{{ errors.shaba_number[0] }}</small>
          </div>
        </div>
      </div>

      <!-- تخصص و گواهینامه‌ها -->
      <div class="form-section">
        <h4>تخصص و گواهینامه‌ها</h4>
        <div class="form-field">
          <label for="expertise">زمینه تخصصی</label>
          <Select
              id="expertise"
              v-model="form.expertise"
              :options="expertiseOptions"
              option-label="label"
              option-value="value"
              placeholder="انتخاب زمینه تخصصی"
              class="w-full"
              multiple
              filter
          />
          <small class="helper-text">می‌توانید چند مورد را انتخاب کنید</small>
        </div>

        <div class="form-field">
          <label for="certificates">گواهینامه‌ها</label>
          <Select
              id="certificates"
              v-model="form.certificates"
              :options="certificateOptions"
              option-label="label"
              option-value="value"
              placeholder="انتخاب گواهینامه‌ها"
              class="w-full"
              multiple
              filter
          />
          <small class="helper-text">گواهینامه‌های معتبر پیمانکار</small>
        </div>
      </div>

      <!-- توضیحات -->
      <div class="form-section">
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
            :label="contractorId ? 'بروزرسانی' : 'ثبت پیمانکار'"
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
import { contractService } from '@/services/ContractService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  contractorId: {
    type: [Number, String],
    default: null
  },
  companyId: {
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

const typeOptions = [
  { label: 'حقوقی', value: 'legal' },
  { label: 'حقیقی', value: 'real' }
]

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' },
  { label: 'تعلیق', value: 'suspended' }
]

const expertiseOptions = [
  { label: 'ساختمانی', value: 'construction' },
  { label: 'برقی', value: 'electrical' },
  { label: 'مکانیکی', value: 'mechanical' },
  { label: 'تاسیسات', value: 'facilities' },
  { label: 'نرم‌افزاری', value: 'software' },
  { label: 'مشاوره', value: 'consulting' },
  { label: 'آموزش', value: 'training' },
  { label: 'تامین کالا', value: 'supply' }
]

const certificateOptions = [
  { label: 'گواهینامه ISO 9001', value: 'iso_9001' },
  { label: 'گواهینامه ISO 14001', value: 'iso_14001' },
  { label: 'گواهینامه OHSAS 18001', value: 'ohsas_18001' },
  { label: 'گواهینامه صلاحیت پیمانکاری', value: 'qualification' },
  { label: 'گواهینامه مدیریت پروژه', value: 'project_management' },
  { label: 'گواهینامه ایمنی', value: 'safety' }
]

const defaultForm = () => ({
  name: '',
  code: '',
  type: 'legal',
  status: 'active',
  registration_number: '',
  economic_code: '',
  national_id: '',
  phone: '',
  mobile: '',
  email: '',
  website: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  bank_name: '',
  bank_account_number: '',
  bank_card_number: '',
  shaba_number: '',
  expertise: [],
  certificates: [],
  description: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const loadContractor = async () => {
  if (!props.contractorId) return

  try {
    loading.value = true
    const response = await contractService.getContractor(props.contractorId)
    const data = response.data.data

    Object.assign(form, {
      name: data.name || '',
      code: data.code || '',
      type: data.type || 'legal',
      status: data.status || 'active',
      registration_number: data.registration_number || '',
      economic_code: data.economic_code || '',
      national_id: data.national_id || '',
      phone: data.phone || '',
      mobile: data.mobile || '',
      email: data.email || '',
      website: data.website || '',
      address: data.address || '',
      city: data.city || '',
      province: data.province || '',
      postal_code: data.postal_code || '',
      bank_name: data.bank_name || '',
      bank_account_number: data.bank_account_number || '',
      bank_card_number: data.bank_card_number || '',
      shaba_number: data.shaba_number || '',
      expertise: data.expertise || [],
      certificates: data.certificates || [],
      description: data.description || ''
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات پیمانکار با خطا مواجه شد',
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
      company_id: props.companyId,
      ...form,
      expertise: form.expertise || [],
      certificates: form.certificates || []
    }

    if (props.contractorId) {
      await contractService.updateContractor(props.contractorId, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'پیمانکار با موفقیت بروزرسانی شد',
        life: 3000
      })
    } else {
      await contractService.createContractor(payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'پیمانکار با موفقیت ایجاد شد',
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

    if (props.contractorId) {
      await loadContractor()
    } else {
      Object.assign(form, defaultForm())
      // تولید کد خودکار
      const timestamp = String(Date.now()).slice(-6)
      form.code = `C-${timestamp}`
    }
  }
})
</script>

<style scoped>
.contractor-form :deep(.p-dialog-content) {
  padding: 1.5rem;
  max-height: 80vh;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
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
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 768px) {
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
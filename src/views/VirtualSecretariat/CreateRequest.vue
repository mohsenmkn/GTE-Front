<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">

    <!-- هدر صفحه -->
    <div class="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <Button
          icon="pi pi-arrow-right"
          rounded
          text
          severity="secondary"
          @click="$router.back()"
          v-tooltip="'بازگشت به لیست درخواست‌ها'"
      />
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">ثبت درخواست نامه</h1>
        <p class="text-gray-600 text-sm mt-1">فرم زیر را تکمیل و درخواست خود را ثبت نمایید</p>
      </div>
    </div>

    <Card class="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
      <template #content>
        <form @submit.prevent="submitRequest" class="flex flex-col gap-6 p-2">

          <!-- بخش 1: انتخاب نوع نامه -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <div class="flex items-center gap-2 mb-3">
              <i class="pi pi-bookmark text-blue-600 text-xl"></i>
              <h3 class="text-lg font-bold text-gray-800">اطلاعات پایه</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="field">
                <label for="template" class="block mb-2 font-semibold text-gray-700">
                  نوع نامه <span class="text-red-500">*</span>
                </label>
                <Select
                    id="template"
                    v-model="form.template_id"
                    :options="templates"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="نوع نامه را انتخاب کنید"
                    class="w-full"
                    :class="{ 'p-invalid': errors.template_id }"
                />
                <small v-if="errors.template_id" class="p-error">{{ errors.template_id }}</small>
              </div>

              <div class="field">
                <label for="subject" class="block mb-2 font-semibold text-gray-700">
                  موضوع نامه <span class="text-red-500">*</span>
                </label>
                <InputText
                    id="subject"
                    v-model="form.subject"
                    placeholder="موضوع نامه (اختیاری - در صورت خالی بودن خودکار تولید می‌شود)"
                    class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- بخش 2: اطلاعات گیرنده -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
            <div class="flex items-center gap-2 mb-3">
              <i class="pi pi-users text-purple-600 text-xl"></i>
              <h3 class="text-lg font-bold text-gray-800">اطلاعات گیرنده</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="field">
                <label for="receiver_org" class="block mb-2 font-semibold text-gray-700">
                  سازمان / مقام گیرنده <span class="text-red-500">*</span>
                </label>
                <InputText
                    id="receiver_org"
                    v-model="form.receiver_org"
                    placeholder="مثال: رئیس بانک ملی"
                    class="w-full"
                    :class="{ 'p-invalid': errors.receiver_org }"
                />
                <small v-if="errors.receiver_org" class="p-error">{{ errors.receiver_org }}</small>
              </div>

              <div class="field">
                <label for="receiver_name" class="block mb-2 font-semibold text-gray-700">
                  به (شخص گیرنده) <span class="text-red-500">*</span>
                </label>
                <InputText
                    id="receiver_name"
                    v-model="form.receiver_name"
                    placeholder="مثال: جناب مهندس احدی"
                    class="w-full"
                    :class="{ 'p-invalid': errors.receiver_name }"
                />
                <small v-if="errors.receiver_name" class="p-error">{{ errors.receiver_name }}</small>
              </div>
            </div>
          </div>

          <!-- بخش 3: متن نامه -->
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <i class="pi pi-file-edit text-emerald-600 text-xl"></i>
                <h3 class="text-lg font-bold text-gray-800">متن نامه</h3>
              </div>
            </div>

            <div class="field mb-4">
              <label class="block mb-2 font-semibold text-gray-700">
                متن نامه <span class="text-red-500">*</span>
              </label>

              <!-- دکمه‌های متن پیش‌فرض -->
              <div class="flex flex-wrap gap-2 mb-3">
                <Button
                    label=" اشتغال به کار"
                    icon="pi pi-briefcase"
                    severity="info"
                    outlined
                    size="small"
                    @click="useDefaultText('employment')"
                    type="button"
                    class="mb-2"
                />
                <Button
                    label="💰 ضمانت وام"
                    icon="pi pi-money-bill"
                    severity="success"
                    outlined
                    size="small"
                    @click="useDefaultText('loan_guarantee')"
                    type="button"
                    class="mb-2"
                />
                <Button
                    label="🏦 معرفی به بانک"
                    icon="pi pi-building"
                    severity="warning"
                    outlined
                    size="small"
                    @click="useDefaultText('bank_introduction')"
                    type="button"
                    class="mb-2"
                />
              </div>

              <Editor
                  v-model="form.body"
                  editorStyle="height: 350px; text-align: right;"
                  class="quill-rtl bg-white rounded-lg"
                  :class="{ 'p-invalid': errors.body }"
              />
              <small v-if="errors.body" class="p-error">{{ errors.body }}</small>
            </div>
          </div>

          <!-- دکمه‌های عملیات -->
          <div class="flex flex-col md:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
                label="انصراف"
                severity="secondary"
                icon="pi pi-times"
                @click="$router.back()"
                outlined
            />
            <Button
                label="ثبت و ارسال درخواست"
                icon="pi pi-send"
                type="submit"
                :loading="submitting"
                severity="success"
                class="md:w-auto w-full"
            />
          </div>

        </form>
      </template>
    </Card>

    <!-- Dialog تأیید نهایی -->
    <Dialog
        v-model:visible="showConfirmDialog"
        header="تأیید نهایی ارسال درخواست"
        :modal="true"
        :closable="true"
        :style="{ width: '600px' }"
        class="confirm-dialog"
    >
      <div class="flex flex-col gap-4">

        <!-- پیام هشدار -->
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-amber-600 text-2xl mt-1"></i>
            <div>
              <h4 class="font-bold text-amber-800 mb-1">آیا از ارسال این درخواست اطمینان دارید؟</h4>
              <p class="text-sm text-amber-700">
                پس از تأیید، درخواست شما به دبیرخانه ارسال شده و در سیستم اتوماسیون ثبت خواهد شد.
              </p>
            </div>
          </div>
        </div>

        <!-- خلاصه اطلاعات -->
        <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-clipboard text-blue-600"></i>
            خلاصه درخواست:
          </h4>
          <div class="grid grid-cols-1 gap-3 text-sm">
            <div class="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
              <span class="text-gray-600">نوع نامه:</span>
              <span class="font-semibold text-gray-800">{{ selectedTemplateName }}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
              <span class="text-gray-600">موضوع:</span>
              <span class="font-semibold text-gray-800">{{ finalSubject }}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
              <span class="text-gray-600">گیرنده:</span>
              <span class="font-semibold text-gray-800">{{ form.receiver_org }}</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
              <span class="text-gray-600">به:</span>
              <span class="font-semibold text-gray-800">{{ form.receiver_name }}</span>
            </div>
          </div>
        </div>

        <!-- پیش‌نمایش متن -->
        <div class="p-4 bg-white rounded-xl border border-gray-200">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <i class="pi pi-file text-emerald-600"></i>
            پیش‌نمایش متن نامه:
          </h4>
          <div
              class="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm leading-relaxed max-h-48 overflow-y-auto"
              v-html="form.body"
          ></div>
        </div>

      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button
              label="ویرایش"
              severity="secondary"
              icon="pi pi-pencil"
              @click="showConfirmDialog = false"
              outlined
          />
          <Button
              label="تأیید و ارسال نهایی"
              icon="pi pi-check"
              @click="confirmSubmit"
              :loading="submitting"
              severity="success"
          />
        </div>
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authold.js'
import api from '@/api/axios'
import { Card, InputText, Select, Button, Dialog } from 'primevue'
import { showToast } from '@/plugins/toast'

const router = useRouter()
const authStore = useAuthStore()
const templates = ref([])
const submitting = ref(false)
const showConfirmDialog = ref(false)
const errors = ref({})

const currentUser = computed(() => ({
  name: authStore.user?.name || authStore.user?.full_name || 'نامشخص',
  personnel_code: authStore.user?.personnel_code || authStore.user?.employee_code || '-',
  department: authStore.user?.department_name || authStore.user?.department || '-',
  start_date: authStore.user?.start_date || '-',
}))

const form = ref({
  template_id: null,
  subject: '',
  receiver_org: '',
  receiver_name: '',
  body: '',
})

const selectedTemplateName = computed(() => {
  const template = templates.value.find(t => t.id === form.value.template_id)
  return template?.name || '-'
})

const finalSubject = computed(() => {
  if (form.value.subject) return form.value.subject
  const templateName = selectedTemplateName.value
  return `درخواست ${templateName} آقای/خانم ${currentUser.value.name}`
})

const fetchTemplates = async () => {
  try {
    const { data } = await api.get('/virtual-secretariat/templates')
    templates.value = data.data.filter(t => t.is_active)
  } catch (error) {
    console.error('خطا در دریافت قالب‌ها:', error)
    showToast({
      severity: 'error',
      summary: 'خطا در دریافت اطلاعات',
      detail: 'امکان بارگذاری لیست قالب‌ها وجود ندارد'
    })
  }
}

// ✅ 3 متن پیش‌فرض مختلف
const useDefaultText = (type) => {
  const user = currentUser.value
  const receiverOrg = form.value.receiver_org || '[نام سازمان]'
  const receiverName = form.value.receiver_name || '[نام شخص]'

  const texts = {
    // 1️⃣ متن پیش‌فرض اشتغال به کار
    employment: `
<div dir="rtl" style="text-align: right; font-family: Tahoma, Arial; line-height: 1.8;">
  <p style="margin-bottom: 15px;"><strong>با سلام و احترام</strong></p>

  <p style="margin-bottom: 15px;">
    بدینوسیله گواهی می‌شود آقای/خانم <strong>${user.name}</strong>
    به کد پرسنلی <strong>${user.personnel_code}</strong>
    از تاریخ <strong>${user.start_date}</strong>
    در واحد <strong>${user.department}</strong>
    این شرکت مشغول به کار می‌باشند.
  </p>

  <p style="margin-bottom: 15px;">
    این گواهی جهت ارائه به <strong>${receiverOrg}</strong>
    (${receiverName}) صادر گردیده و فاقد ارزش قانونی دیگری می‌باشد.
  </p>

  <p style="margin-top: 30px;"><strong>با تشکر</strong></p>
</div>`.trim(),

    // 2️⃣ متن پیش‌فرض ضمانت وام
    loan_guarantee: `
<div dir="rtl" style="text-align: right; font-family: Tahoma, Arial; line-height: 1.8;">
  <p style="margin-bottom: 15px;"><strong>با سلام و احترام</strong></p>

  <p style="margin-bottom: 15px;">
    اینجانب <strong>${user.name}</strong>
    به کد پرسنلی <strong>${user.personnel_code}</strong>
    شاغل در واحد <strong>${user.department}</strong>،
  </p>

  <p style="margin-bottom: 15px;">
    بدینوسیله اعلام می‌دارم که ضامن آقای/خانم
    <strong>........................................</strong>
    جهت دریافت وام به مبلغ
    <strong>........................................</strong> ریال
    از <strong>${receiverOrg}</strong> می‌باشم.
  </p>

  <p style="margin-bottom: 15px;">
    این گواهی بنا به درخواست نامبرده و جهت ارائه به
    <strong>${receiverName}</strong> صادر گردیده است.
  </p>

  <p style="margin-top: 30px;"><strong>با تشکر</strong></p>
</div>`.trim(),

    // 3️⃣ متن پیش‌فرض معرفی به بانک
    bank_introduction: `
<div dir="rtl" style="text-align: right; font-family: Tahoma, Arial; line-height: 1.8;">
  <p style="margin-bottom: 15px;"><strong>با سلام و احترام</strong></p>

  <p style="margin-bottom: 15px;">
    بدینوسیله آقای/خانم <strong>${user.name}</strong>
    به کد پرسنلی <strong>${user.personnel_code}</strong>
    شاغل در واحد <strong>${user.department}</strong>
    این شرکت،
  </p>

  <p style="margin-bottom: 15px;">
    جهت انجام امور بانکی مربوط به
    <strong>........................................</strong>
    به <strong>${receiverOrg}</strong> معرفی می‌گردند.
  </p>

  <p style="margin-bottom: 15px;">
    خواهشمند است همکاری لازم را با نامبرده مبذول فرمایید.
  </p>

  <p style="margin-bottom: 15px;">
    این معرفی‌نامه جهت ارائه به <strong>${receiverName}</strong> صادر شده است.
  </p>

  <p style="margin-top: 30px;"><strong>با تشکر</strong></p>
</div>`.trim(),
  }

  form.value.body = texts[type] || texts.employment
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.template_id) {
    errors.value.template_id = 'انتخاب نوع نامه الزامی است'
    isValid = false
  }

  if (!form.value.receiver_org || !form.value.receiver_org.trim()) {
    errors.value.receiver_org = 'وارد کردن نام سازمان گیرنده الزامی است'
    isValid = false
  }

  if (!form.value.receiver_name || !form.value.receiver_name.trim()) {
    errors.value.receiver_name = 'وارد کردن نام شخص گیرنده الزامی است'
    isValid = false
  }

  if (!form.value.body || !form.value.body.trim()) {
    errors.value.body = 'وارد کردن متن نامه الزامی است'
    isValid = false
  }

  return isValid
}

const submitRequest = () => {
  if (!validateForm()) {
    showToast({
      severity: 'warn',
      summary: 'خطای اعتبارسنجی',
      detail: 'لطفاً تمام فیلدهای الزامی را تکمیل کنید',
      life: 4000
    })
    return
  }

  // نمایش Dialog تأیید
  showConfirmDialog.value = true
}

const confirmSubmit = async () => {
  submitting.value = true

  try {
    const payload = {
      ...form.value,
      subject: finalSubject.value
    }

    await api.post('/virtual-secretariat/requests', payload)

    showToast({
      severity: 'success',
      summary: 'درخواست با موفقیت ثبت شد',
      detail: 'درخواست شما در سیستم ثبت و به دبیرخانه ارسال گردید',
      life: 5000
    })

    showConfirmDialog.value = false
    router.push({ name: 'vs.my-requests' })

  } catch (error) {
    showToast({
      severity: 'error',
      summary: 'خطا در ثبت درخواست',
      detail: error.response?.data?.message || 'خطایی رخ داد. لطفاً مجدداً تلاش کنید',
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}

onMounted(fetchTemplates)
</script>

<style scoped>
/* استایل‌های Editor */
:deep(.quill-rtl .ql-editor) {
  direction: rtl !important;
  text-align: right !important;
  font-family: 'Tahoma', 'Arial', sans-serif;
  font-size: 14px;
  line-height: 1.8;
}

:deep(.quill-rtl .ql-editor.ql-blank::before) {
  right: 0 !important;
  left: auto !important;
  text-align: right !important;
  font-style: normal;
  color: #9ca3af;
}

:deep(.quill-rtl .ql-toolbar) {
  direction: rtl;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 0.5rem 0.5rem 0 0;
}

:deep(.quill-rtl .ql-container) {
  border: 1px solid #e5e7eb;
  border-radius: 0 0 0.5rem 0.5rem;
}

/* استایل‌های Dialog */
:deep(.confirm-dialog .p-dialog-header) {
  background: linear-gradient(to left, #f0f9ff, #e0f2fe);
  border-bottom: 2px solid #bae6fd;
}

:deep(.confirm-dialog .p-dialog-header .p-dialog-title) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0369a1;
}

/* انیمیشن‌ها */
.field {
  transition: all 0.3s ease;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .p-4 {
    padding: 1rem;
  }

  .text-2xl {
    font-size: 1.5rem;
  }
}
</style>
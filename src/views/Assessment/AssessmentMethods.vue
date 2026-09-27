<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">روش‌های رفع خلا شایستگی</h1>
        <p class="text-sm text-gray-500 mt-1">
          مدیریت روش‌های توسعه و ارتقای شایستگی کارکنان
        </p>
      </div>
      <Button
          icon="pi pi-plus"
          label="روش جدید"
          @click="openCreateDialog"
      />
    </div>

    <!-- ═══════════════════════════════════════════
         Stats
    ═══════════════════════════════════════════ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div class="text-blue-600 text-sm font-medium">کل روش‌ها</div>
        <div class="text-2xl font-bold text-blue-800 mt-1">
          {{ methods.length }}
        </div>
      </div>
      <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
        <div class="text-emerald-600 text-sm font-medium">فعال</div>
        <div class="text-2xl font-bold text-emerald-800 mt-1">
          {{ methods.filter(m => m.is_active).length }}
        </div>
      </div>
      <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <div class="text-amber-600 text-sm font-medium">غیرفعال</div>
        <div class="text-2xl font-bold text-amber-800 mt-1">
          {{ methods.filter(m => !m.is_active).length }}
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Methods Grid
    ═══════════════════════════════════════════ -->
    <div v-if="methods.length === 0" class="text-center p-10 text-gray-500">
      <i class="pi pi-inbox text-4xl mb-3"></i>
      <p>هنوز روشی ثبت نشده است</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
          v-for="method in methods"
          :key="method.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i class="pi pi-wrench"></i>
            </span>
            <h3 class="font-bold text-gray-800">{{ method.title }}</h3>
          </div>
          <Tag
              :value="method.is_active ? 'فعال' : 'غیرفعال'"
              :severity="method.is_active ? 'success' : 'secondary'"
              style="font-size: 10px"
          />
        </div>

        <!-- ✅ نمایش توضیحات -->
        <div v-if="method.description" class="bg-gray-50 rounded-lg p-3 mb-3">
          <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <i class="pi pi-info-circle"></i>
            توضیحات:
          </div>
          <p class="text-sm text-gray-700 leading-relaxed">
            {{ method.description }}
          </p>
        </div>
        <div v-else class="bg-gray-50 rounded-lg p-3 mb-3">
          <p class="text-xs text-gray-400 italic">
            توضیحاتی ثبت نشده است
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-2 border-t border-gray-100">
          <Button
              icon="pi pi-pencil"
              label="ویرایش"
              severity="info"
              size="small"
              outlined
              class="flex-1"
              @click="openEditDialog(method)"
          />
          <Button
              icon="pi pi-trash"
              severity="danger"
              size="small"
              outlined
              @click="confirmDelete(method)"
          />
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Create/Edit Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showDialog"
        :header="editingMethod ? 'ویرایش روش' : 'روش جدید'"
        :style="{ width: '600px' }"
        modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان روش <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="form.title"
              class="w-full"
              placeholder="مثال: شرکت در وبینار تخصصی"
          />
        </div>

        <!-- ✅ فیلد توضیحات -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            توضیحات
          </label>
          <Textarea
              v-model="form.description"
              class="w-full"
              rows="4"
              placeholder="توضیحات تکمیلی درباره این روش (اختیاری)&#10;مثال: وبینارهای آنلاین با مدت زمان حداقل ۲ ساعت که توسط مؤسسات معتبر برگزار می‌شوند."
          />
          <small class="text-gray-500 mt-1 block">
            حداکثر ۱۰۰۰ کاراکتر
          </small>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
              v-model="form.is_active"
              :binary="true"
              inputId="is_active"
          />
          <label for="is_active" class="text-sm text-gray-700">
            فعال
          </label>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showDialog = false"
        />
        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="saving"
            @click="saveMethod"
        />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios.js'

const toast = useToast()
const confirm = useConfirm()

const methods = ref([])
const showDialog = ref(false)
const saving = ref(false)
const editingMethod = ref(null)

const form = ref({
  title: '',
  description: '',  // ✅ اضافه شد
  is_active: true,
})

onMounted(async () => {
  await loadMethods()
})

async function loadMethods() {
  try {
    const { data } = await api.get('/assessment/methods', {
      params: { all: true }
    })
    methods.value = data.methods || []
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت روش‌ها',
      life: 3000,
    })
  }
}

function openCreateDialog() {
  editingMethod.value = null
  form.value = {
    title: '',
    description: '',
    is_active: true,
  }
  showDialog.value = true
}

function openEditDialog(method) {
  editingMethod.value = method
  form.value = {
    title: method.title,
    description: method.description || '',
    is_active: method.is_active,
  }
  showDialog.value = true
}

async function saveMethod() {
  if (!form.value.title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان روش الزامی است',
      life: 3000,
    })
    return
  }

  saving.value = true
  try {
    if (editingMethod.value) {
      await api.put(`/assessment/methods/${editingMethod.value.id}`, form.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'روش با موفقیت ویرایش شد',
        life: 3000,
      })
    } else {
      await api.post('/assessment/methods', form.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'روش با موفقیت ایجاد شد',
        life: 3000,
      })
    }
    showDialog.value = false
    await loadMethods()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ذخیره',
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(method) {
  confirm.require({
    message: `آیا از حذف روش "${method.title}" اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await api.delete(`/assessment/methods/${method.id}`)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'روش حذف شد',
          life: 3000,
        })
        await loadMethods()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در حذف',
          life: 3000,
        })
      }
    },
  })
}
</script>
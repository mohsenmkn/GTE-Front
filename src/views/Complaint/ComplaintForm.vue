<template>
  <div class="p-6">
    <Card>
      <template #title>
        {{ isEdit ? 'ویرایش شکایت' : 'ثبت شکایت جدید' }}
      </template>
      <template #content>
        <form @submit.prevent="submitForm" class="space-y-6">
          <!-- انتخاب حوزه -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="field">
              <label class="block mb-2 font-medium">حوزه</label>
              <Select
                  v-model="selectedDomainId"
                  :options="categories"
                  optionLabel="title"
                  optionValue="id"
                  placeholder="انتخاب حوزه"
                  class="w-full"
                  @change="onDomainChange"
              />
            </div>
            <div class="field">
              <label class="block mb-2 font-medium">زیرمجموعه</label>
              <Select
                  v-model="selectedSubcategoryId"
                  :options="subcategories"
                  optionLabel="title"
                  optionValue="id"
                  placeholder="انتخاب زیرمجموعه"
                  class="w-full"
                  :disabled="!selectedDomainId"
                  @change="onSubcategoryChange"
              />
            </div>
            <div class="field">
              <label class="block mb-2 font-medium">موضوع شکایت</label>
              <Select
                  v-model="selectedItemId"
                  :options="items"
                  optionLabel="title"
                  optionValue="id"
                  placeholder="انتخاب موضوع"
                  class="w-full"
                  :disabled="!selectedSubcategoryId"
              />
            </div>
          </div>

          <!-- ✅ معاونت مقصد -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              معاونت مقصد <span class="text-red-500">*</span>
            </label>
            <TreeSelect
                v-model="form.organizational_unit_id"
                :options="organizationalUnits"
                optionLabel="title"
                optionValue="id"
                placeholder="انتخاب معاونت"
                class="w-full"
                :loading="unitsLoading"
                :class="{ 'p-invalid': errors.organizational_unit_id }"
                @node-select="onUnitSelect"
                @node-unselect="onUnitUnselect"
            />
            <small v-if="errors.organizational_unit_id" class="p-error">
              {{ errors.organizational_unit_id[0] }}
            </small>
          </div>

          <!-- ✅ نمایش مسئول پیگیری -->
          <div
              v-if="selectedUnitManager"
              class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3"
          >
            <div class="bg-blue-100 rounded-full p-2">
              <i class="pi pi-user text-blue-600"></i>
            </div>
            <div>
              <div class="text-sm text-gray-500">مسئول پیگیری این معاونت</div>
              <div class="font-bold text-blue-800">{{ selectedUnitManager.name }}</div>
            </div>
          </div>

          <!-- ✅ هشدار: معاونت بدون مسئول -->
          <div
              v-if="form.organizational_unit_id && !selectedUnitManager && !unitsLoading"
              class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3"
          >
            <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
            <div class="text-sm text-yellow-800">
              برای این معاونت هنوز مسئول پیگیری تعیین نشده است.
              شکایت شما ثبت می‌شود اما تا زمان تعیین مسئول، در حالت انتظار باقی می‌ماند.
            </div>
          </div>

          <!-- عنوان -->
          <div class="field">
            <label class="block mb-2 font-medium">عنوان شکایت *</label>
            <InputText
                v-model="form.subject"
                class="w-full"
                placeholder="عنوان شکایت را وارد کنید"
                :class="{ 'p-invalid': errors.subject }"
            />
            <small v-if="errors.subject" class="p-error">{{ errors.subject[0] }}</small>
          </div>

          <!-- شرح -->
          <div class="field">
            <label class="block mb-2 font-medium">شرح شکایت *</label>
            <Textarea
                v-model="form.description"
                class="w-full"
                rows="6"
                placeholder="شرح کامل شکایت را وارد کنید..."
                :class="{ 'p-invalid': errors.description }"
            />
            <small v-if="errors.description" class="p-error">{{ errors.description[0] }}</small>
          </div>

          <!-- اولویت -->
          <div class="field">
            <label class="block mb-2 font-medium">اولویت</label>
            <SelectButton
                v-model="form.priority"
                :options="priorityOptions"
                optionLabel="label"
                optionValue="value"
            />
          </div>

          <!-- پیوست‌ها -->
          <div class="field">
            <label class="block mb-2 font-medium">پیوست‌ها</label>
            <FileUpload
                mode="basic"
                multiple
                :customUpload="true"
                :auto="false"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                :maxFileSize="10 * 1024 * 1024"
                @select="onFileSelect"
                chooseLabel="انتخاب فایل"
            />
            <div v-if="files.length" class="mt-3 space-y-2">
              <div
                  v-for="(file, index) in files"
                  :key="index"
                  class="flex items-center justify-between bg-gray-50 border rounded px-3 py-2"
              >
                <span class="text-sm text-gray-700">{{ file.name }}</span>
                <Button
                    icon="pi pi-times"
                    class="p-button-rounded p-button-text p-button-danger"
                    @click="removeFile(index)"
                />
              </div>
            </div>
          </div>

          <!-- دکمه‌ها -->
          <div class="flex items-center gap-3 pt-4 border-t">
            <Button
                type="submit"
                :label="isEdit ? 'به‌روزرسانی شکایت' : 'ثبت شکایت'"
                icon="pi pi-check"
                :loading="submitting"
            />
            <Button
                type="button"
                label="انصراف"
                icon="pi pi-times"
                class="p-button-secondary"
                @click="router.push({ name: 'complaints.my' })"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => route.name === 'complaints.edit')
const complaintId = computed(() => route.params.id)

const categories = ref([])
const selectedDomainId = ref(null)
const selectedSubcategoryId = ref(null)
const selectedItemId = ref(null)

const files = ref([])
const submitting = ref(false)
const unitsLoading = ref(false)
const organizationalUnits = ref([])
const selectedUnitManager = ref(null)


const form = reactive({
  subject: '',
  organizational_unit_id: null,
  description: '',
  priority: 'medium',
})

const errors = reactive({
  organizational_unit_id: null,
  subject: null,
  description: null,
})

const priorityOptions = [
  { label: 'کم', value: 'low' },
  { label: 'متوسط', value: 'medium' },
  { label: 'زیاد', value: 'high' },
  { label: 'بحرانی', value: 'critical' },
]

const subcategories = computed(() => {
  const domain = categories.value.find(item => item.id === selectedDomainId.value)
  return domain?.children || []
})

const items = computed(() => {
  const subcategory = subcategories.value.find(item => item.id === selectedSubcategoryId.value)
  return subcategory?.children || []
})

const fetchCategories = async () => {
  try {
    const { data } = await ComplaintService.getCategories()
    categories.value = data.data || []
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت دسته‌بندی‌ها با خطا مواجه شد.',
      life: 3000,
    })
  }
}

const fetchOrganizationalUnits = async () => {
  unitsLoading.value = true
  try {
    const { data } = await ComplaintService.getOrganizationalUnits()
    organizationalUnits.value = data.data || []
  } catch (error) {
    console.error('Error fetching organizational units:', error)
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت لیست معاونت‌ها با خطا مواجه شد.',
      life: 3000,
    })
  } finally {
    unitsLoading.value = false
  }
}

const onUnitSelect = async (event) => {
  const unitId = event.node?.id || event.value
  if (!unitId) return

  selectedUnitManager.value = null
  try {
    const { data } = await ComplaintService.getUnitManager(unitId)
    selectedUnitManager.value = data.data
  } catch (error) {
    selectedUnitManager.value = null
  }
}

const onUnitUnselect = () => {
  selectedUnitManager.value = null
}

const fetchComplaintForEdit = async () => {
  if (!isEdit.value) return

  try {
    const { data } = await ComplaintService.getComplaint(complaintId.value)
    const complaint = data.data

    form.subject = complaint.subject
    form.description = complaint.description
    form.priority = complaint.priority
    form.organizational_unit_id = complaint.organizational_unit?.id || null

    setSelectedCategoryPath(complaint.category?.id)

    // بارگذاری مسئول پیگیری اگر معاونت انتخاب شده
    if (form.organizational_unit_id) {
      try {
        const { data: managerData } = await ComplaintService.getUnitManager(form.organizational_unit_id)
        selectedUnitManager.value = managerData.data
      } catch (error) {
        selectedUnitManager.value = null
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت اطلاعات شکایت با خطا مواجه شد.',
      life: 3000,
    })
    router.push({ name: 'complaints.my' })
  }
}

const setSelectedCategoryPath = (itemId) => {
  if (!itemId) return

  for (const domain of categories.value) {
    for (const subcategory of domain.children || []) {
      for (const item of subcategory.children || []) {
        if (item.id === itemId) {
          selectedDomainId.value = domain.id
          selectedSubcategoryId.value = subcategory.id
          selectedItemId.value = item.id
          return
        }
      }
    }
  }
}

const onDomainChange = () => {
  selectedSubcategoryId.value = null
  selectedItemId.value = null
}

const onSubcategoryChange = () => {
  selectedItemId.value = null
}

const onFileSelect = (event) => {
  for (const file of event.files) {
    files.value.push(file)
  }
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const clearErrors = () => {
  Object.keys(errors).forEach(key => (errors[key] = null))
}

const submitForm = async () => {
  clearErrors()

  if (!selectedItemId.value) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'لطفاً حوزه، زیرمجموعه و موضوع شکایت را انتخاب کنید.',
      life: 3000,
    })
    return
  }

  if (!form.organizational_unit_id) {
    errors.organizational_unit_id = ['لطفاً معاونت مقصد را انتخاب کنید.']
    return
  }

  if (!form.subject || !form.description) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'عنوان و شرح شکایت الزامی است.',
      life: 3000,
    })
    return
  }

  submitting.value = true

  try {
    if (isEdit.value) {
      await ComplaintService.updateComplaint(complaintId.value, {
        complaint_category_id: selectedItemId.value,
        organizational_unit_id: form.organizational_unit_id,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
      })

      if (files.value.length > 0) {
        const attachmentFormData = new FormData()
        files.value.forEach(file => {
          attachmentFormData.append('attachments[]', file)
        })
        await ComplaintService.uploadAttachments(complaintId.value, attachmentFormData)
      }

      toast.add({
        severity: 'success',
        summary: 'به‌روزرسانی شد',
        detail: 'شکایت با موفقیت ویرایش شد.',
        life: 3000,
      })
    } else {
      const formData = new FormData()
      const selectedUnitKey = Object.keys(form.organizational_unit_id || {})[0]
      form.organizational_unit_id= selectedUnitKey ? Number(selectedUnitKey) : null
      formData.append('complaint_category_id', selectedItemId.value)
      formData.append('organizational_unit_id', form.organizational_unit_id)  // ✅ این خط را اضافه کنید
      formData.append('subject', form.subject)
      formData.append('description', form.description)
      formData.append('priority', form.priority)

      files.value.forEach(file => {
        formData.append('attachments[]', file)
      })

      const { data } = await ComplaintService.createComplaint(formData)

      toast.add({
        severity: 'success',
        summary: 'ثبت شد',
        detail: `شکایت شما با کد پیگیری ${data.data.tracking_code} ثبت شد.`,
        life: 5000,
      })
    }

    router.push({ name: 'complaints.my' })
  } catch (error) {
    if (error.response?.status === 422) {
      const serverErrors = error.response.data.errors || {}
      Object.keys(serverErrors).forEach(key => {
        if (errors.hasOwnProperty(key)) {
          errors[key] = serverErrors[key]
        }
      })
    } else {
      const message = error.response?.data?.message || 'خطا در ذخیره شکایت'
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: message,
        life: 4000,
      })
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchOrganizationalUnits()
  if (isEdit.value) {
    await fetchComplaintForEdit()
  }
})
</script>
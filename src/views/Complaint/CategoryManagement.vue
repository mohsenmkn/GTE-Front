<template>
  <div class="p-6 space-y-6">

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        دسته‌بندی شکایات
      </h1>

      <Button
          label="افزودن حوزه اصلی"
          icon="pi pi-plus"
          @click="openCreate(null)"
      />
    </div>

    <Card>
      <template #content>

        <TreeTable
            :value="treeData"
            :loading="loading"
            v-model:expandedKeys="expandedKeys"
            stripedRows
            responsiveLayout="scroll"
        >

          <Column field="title" header="عنوان" expander style="min-width: 350px">
            <template #body="slotProps">
              <div class="flex flex-wrap items-center gap-2 py-1">

                <Tag
                    v-if="slotProps.node.data.level === 1"
                    severity="info"
                    value="حوزه"
                />

                <Tag
                    v-else-if="slotProps.node.data.level === 2"
                    severity="secondary"
                    value="زیرمجموعه"
                />

                <Tag
                    v-else
                    severity="success"
                    value="آیتم"
                />

                <span class="font-medium">
                                    {{ slotProps.node.data.title }}
                                </span>

                <Tag
                    v-if="!slotProps.node.data.is_active"
                    severity="danger"
                    value="غیرفعال"
                />

              </div>
            </template>
          </Column>

          <Column header="ترتیب" style="width: 100px">
            <template #body="slotProps">
              {{ slotProps.node.data.sort_order }}
            </template>
          </Column>

          <Column header="عملیات" style="width: 220px">
            <template #body="slotProps">
              <div class="flex gap-2">

                <Button
                    v-if="slotProps.node.data.level < 3"
                    icon="pi pi-plus"
                    class="p-button-rounded p-button-text"
                    @click="openCreate(slotProps.node.data)"
                />

                <Button
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-text p-button-warning"
                    @click="openEdit(slotProps.node.data)"
                />

                <Button
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-text p-button-danger"
                    @click="confirmDelete(slotProps.node.data)"
                />

              </div>
            </template>
          </Column>

        </TreeTable>

      </template>
    </Card>

    <!-- فرم ایجاد/ویرایش -->
    <Dialog
        v-model:visible="formDialog.visible"
        :header="dialogHeader"
        modal
        style="width: 520px"
    >
      <div class="space-y-5">

        <div v-if="formDialog.parentTitle" class="text-sm text-gray-600">
          زیرمجموعه برای:
          <span class="font-bold">
                        {{ formDialog.parentTitle }}
                    </span>
        </div>

        <div class="field">
          <label class="block mb-2 font-medium">عنوان *</label>
          <InputText
              v-model="formDialog.data.title"
              class="w-full"
              placeholder="عنوان را وارد کنید"
          />
        </div>

        <div class="field">
          <label class="block mb-2 font-medium">ترتیب نمایش</label>
          <InputNumber
              v-model="formDialog.data.sort_order"
              class="w-full"
              :min="0"
          />
        </div>

        <div class="field flex items-center gap-2">
          <Checkbox
              v-model="formDialog.data.is_active"
              :binary="true"
              inputId="is_active"
          />
          <label for="is_active">
            فعال باشد
          </label>
        </div>

      </div>

      <template #footer>
        <Button
            label="انصراف"
            class="p-button-text"
            @click="formDialog.visible = false"
        />

        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="saving"
            @click="saveCategory"
        />
      </template>
    </Dialog>

    <ConfirmDialog />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const expandedKeys = ref({})

const formDialog = reactive({
  visible: false,
  editingId: null,
  parent_id: null,
  parentTitle: '',
  data: {
    title: '',
    sort_order: 0,
    is_active: true
  }
})

const treeData = computed(() => {
  return categories.value.map(category => toTreeNode(category))
})

const dialogHeader = computed(() => {
  if (formDialog.editingId) {
    return 'ویرایش دسته‌بندی'
  }

  return formDialog.parent_id
      ? 'افزودن زیرمجموعه'
      : 'افزودن حوزه اصلی'
})

const toTreeNode = (category) => {
  return {
    key: String(category.id),
    data: category,
    children: (category.children || []).map(child => toTreeNode(child))
  }
}

const expandAll = (nodes) => {
  nodes.forEach(node => {
    expandedKeys.value[node.key] = true

    if (node.children?.length) {
      expandAll(node.children)
    }
  })
}

const fetchCategories = async () => {
  loading.value = true

  try {
    const { data } = await ComplaintService.getAdminCategories()
    categories.value = data.data || []

    expandedKeys.value = {}
    expandAll(treeData.value)

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت دسته‌بندی‌ها با خطا مواجه شد.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openCreate = (parent = null) => {
  formDialog.editingId = null
  formDialog.parent_id = parent?.id ?? null
  formDialog.parentTitle = parent?.title ?? ''
  formDialog.data = {
    title: '',
    sort_order: 0,
    is_active: true
  }

  formDialog.visible = true
}

const openEdit = (category) => {
  formDialog.editingId = category.id
  formDialog.parent_id = category.parent_id
  formDialog.parentTitle = ''
  formDialog.data = {
    title: category.title,
    sort_order: category.sort_order ?? 0,
    is_active: !!category.is_active
  }

  formDialog.visible = true
}

const saveCategory = async () => {
  if (!formDialog.data.title.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'عنوان دسته‌بندی الزامی است.',
      life: 3000
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      title: formDialog.data.title,
      sort_order: formDialog.data.sort_order,
      is_active: formDialog.data.is_active,
      parent_id: formDialog.parent_id
    }

    if (formDialog.editingId) {
      await ComplaintService.updateCategory(formDialog.editingId, payload)

      toast.add({
        severity: 'success',
        summary: 'به‌روزرسانی شد',
        detail: 'دسته‌بندی با موفقیت ویرایش شد.',
        life: 3000
      })
    } else {
      await ComplaintService.createCategory(payload)

      toast.add({
        severity: 'success',
        summary: 'ثبت شد',
        detail: 'دسته‌بندی با موفقیت ایجاد شد.',
        life: 3000
      })
    }

    formDialog.visible = false

    await fetchCategories()

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'ذخیره دسته‌بندی با خطا مواجه شد.',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (category) => {
  confirm.require({
    message: `آیا از حذف «${category.title}» مطمئن هستید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'حذف',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await ComplaintService.deleteCategory(category.id)

        toast.add({
          severity: 'success',
          summary: 'حذف شد',
          detail: 'دسته‌بندی با موفقیت حذف شد.',
          life: 3000
        })

        await fetchCategories()

      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'امکان حذف این دسته‌بندی وجود ندارد.',
          life: 4000
        })
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
})
</script>
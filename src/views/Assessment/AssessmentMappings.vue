<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت نگاشت‌های ارزیابی</h1>
        <p class="text-sm text-gray-500 mt-1">
          مدیریت شناسنامه‌ها و ارزیاب‌های دستی
        </p>
      </div>
      <div class="flex gap-2">
        <Select
            v-model="selectedCycleId"
            :options="cycles"
            optionLabel="title"
            optionValue="id"
            placeholder="انتخاب چرخه..."
            class="w-56"
            @change="onCycleChange"
        />
        <Button
            icon="pi pi-plus"
            label="نگاشت جدید"
            @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         TabView
    ═══════════════════════════════════════════ -->
    <TabView>
      <!-- ═══ تب ۱: بدون شناسنامه ═══ -->
      <TabPanel header="بدون شناسنامه">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div class="text-amber-600 text-sm font-medium">پست‌های بدون شناسنامه</div>
            <div class="text-2xl font-bold text-amber-800 mt-1">
              {{ unmappedPositions.length }}
            </div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <div class="text-green-600 text-sm font-medium">شناسنامه‌های موجود</div>
            <div class="text-2xl font-bold text-green-800 mt-1">
              {{ availablePosts.length }}
            </div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div class="text-blue-600 text-sm font-medium">نگاشت‌های فعال</div>
            <div class="text-2xl font-bold text-blue-800 mt-1">
              {{ mappings.filter(m => m.is_active).length }}
            </div>
          </div>
        </div>
        <Card>
          <template #content>
            <DataTable
                :value="unmappedPositions"
                :loading="loading"
                stripedRows
                paginator
                :rows="10"
                emptyMessage="همه پست‌ها شناسنامه دارند ✅"
            >
              <Column field="post_title" header="عنوان پست" />
              <Column field="unit" header="واحد سازمانی" />
              <Column field="count" header="تعداد پرسنل" />
              <Column header="عملیات" style="width: 150px">
                <template #body="{ data }">
                  <Button
                      icon="pi pi-link"
                      label="اتصال دستی"
                      severity="info"
                      size="small"
                      @click="quickMap(data)"
                  />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>

      <!-- ═══ تب ۲: بدون ارزیاب ═══ -->
      <TabPanel header="بدون ارزیاب">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            <span class="text-sm text-blue-800">
              پرسنلی که شناسنامه دارند اما ارزیاب خودکار برای آن‌ها یافت نشده است.
              می‌توانید به صورت دستی ارزیاب تعیین کنید.
            </span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div class="text-orange-600 text-sm font-medium">بدون ارزیاب</div>
            <div class="text-2xl font-bold text-orange-800 mt-1">
              {{ noEvaluatorSummary.total || 0 }}
            </div>
          </div>
          <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div class="text-emerald-600 text-sm font-medium">تعیین شده</div>
            <div class="text-2xl font-bold text-emerald-800 mt-1">
              {{ assignedCount }}
            </div>
          </div>
        </div>
        <Card>
          <template #content>
            <DataTable
                :value="noEvaluatorPositions"
                :loading="loadingEvaluators"
                stripedRows
                paginator
                :rows="10"
                emptyMessage="همه پرسنل ارزیاب دارند ✅"
            >
              <Column field="name" header="نام پرسنل" />
              <Column field="post_title" header="سمت سازمانی" />
              <Column field="unit" header="واحد" />
              <Column field="family" header="خانواده شغلی">
                <template #body="{ data }">
                  <Tag :value="data.family" severity="info" style="font-size: 10px" />
                </template>
              </Column>
              <Column header="ارزیاب پیشنهادی" style="width: 300px">
                <template #body="{ data }">
                  <Select
                      v-model="selectedEvaluators[data.user_id]"
                      :options="data.suggested_evaluators"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="انتخاب ارزیاب..."
                      class="w-full"
                  >
                    <template #option="slotProps">
                      <div>
                        <div class="font-medium">{{ slotProps.option.name }}</div>
                        <div class="text-xs text-gray-500">{{ slotProps.option.post_title }}</div>
                      </div>
                    </template>
                    <template #value="slotProps">
                      <div v-if="slotProps.value" class="flex items-center gap-2">
                        <i class="pi pi-user text-green-600"></i>
                        <span>{{ getEvaluatorName(data, slotProps.value) }}</span>
                      </div>
                      <span v-else class="text-gray-400">انتخاب کنید...</span>
                    </template>
                  </Select>
                </template>
              </Column>
              <Column header="عملیات" style="width: 150px">
                <template #body="{ data }">
                  <Button
                      icon="pi pi-check"
                      label="تعیین"
                      severity="success"
                      size="small"
                      :disabled="!selectedEvaluators[data.user_id]"
                      :loading="assigning[data.user_id]"
                      @click="assignEvaluator(data)"
                  />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>

      <!-- ═══ تب ۳: همه نگاشت‌ها ═══ -->
      <TabPanel header="همه نگاشت‌ها">
        <Card>
          <template #content>
            <DataTable
                :value="mappings"
                :loading="loading"
                stripedRows
                paginator
                :rows="10"
                emptyMessage="نگاشتی ثبت نشده است"
            >
              <Column header="نوع">
                <template #body="{ data }">
                  <Tag
                      :value="data.mapping_type === 'title_pattern' ? 'الگوی عنوان' : 'واحد سازمانی'"
                      :severity="data.mapping_type === 'title_pattern' ? 'info' : 'success'"
                  />
                </template>
              </Column>
              <Column header="مبدا">
                <template #body="{ data }">
                  <div class="text-sm">
                    <div v-if="data.mapping_type === 'title_pattern'" class="font-medium">
                      {{ data.post_title_pattern }}
                    </div>
                    <div v-else class="font-medium">
                      {{ data.unit?.title || '—' }}
                    </div>
                  </div>
                </template>
              </Column>
              <Column header="شناسنامه مقصد">
                <template #body="{ data }">
                  <div class="text-sm">
                    <div class="font-medium text-gray-800">{{ data.assessment_post?.title }}</div>
                    <div class="text-xs text-gray-500">
                      {{ data.assessment_post?.grade }} - {{ data.assessment_post?.unit }}
                    </div>
                  </div>
                </template>
              </Column>
              <Column field="description" header="توضیحات">
                <template #body="{ data }">
                  <span class="text-sm text-gray-600">{{ data.description || '—' }}</span>
                </template>
              </Column>
              <Column header="وضعیت">
                <template #body="{ data }">
                  <Tag
                      :value="data.is_active ? 'فعال' : 'غیرفعال'"
                      :severity="data.is_active ? 'success' : 'secondary'"
                  />
                </template>
              </Column>
              <Column header="عملیات" style="width: 150px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button
                        :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check'"
                        :severity="data.is_active ? 'warn' : 'success'"
                        size="small"
                        text
                        @click="toggleMapping(data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        text
                        @click="confirmDelete(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>
    </TabView>

    <!-- ═══════════════════════════════════════════
         دیالوگ ایجاد نگاشت
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showCreateDialog"
        :header="editingPosition ? 'اتصال سریع' : 'نگاشت جدید'"
        :style="{ width: '600px' }"
        modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            نوع نگاشت <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.mapping_type"
              :options="mappingTypes"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @change="onMappingTypeChange"
          />
        </div>
        <div v-if="form.mapping_type === 'title_pattern'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            الگوی عنوان پست <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="form.post_title_pattern"
              class="w-full"
              placeholder="مثال: دامپتراک یا راننده ماشین آلات سنگین"
          />
        </div>
        <div v-else>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            واحد سازمانی <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.organizational_unit_id"
              :options="units"
              optionLabel="title"
              optionValue="id"
              placeholder="انتخاب واحد"
              class="w-full"
          />
        </div>

        <!-- ✅ بخش اصلاح شده: اضافه شدن قابلیت جستجو (filter) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            شناسنامه شایستگی مقصد <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.assessment_post_id"
              :options="availablePosts"
              optionLabel="title"
              optionValue="id"
              placeholder="انتخاب شناسنامه"
              filter
              filterPlaceholder="جستجو در عنوان شناسنامه..."
              class="w-full"
          >
            <template #option="slotProps">
              <div>
                <div class="font-medium">{{ slotProps.option.title }}</div>
                <div class="text-xs text-gray-500">
                  {{ slotProps.option.grade }} - {{ slotProps.option.unit }}
                </div>
              </div>
            </template>
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            توضیحات
          </label>
          <Textarea
              v-model="form.description"
              class="w-full"
              rows="2"
              placeholder="اختیاری"
          />
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="closeCreateDialog"
        />
        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="saving"
            @click="saveMapping"
        />
      </template>
    </Dialog>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios.js'

const toast = useToast()
const confirm = useConfirm()

const loading = ref(false)
const loadingEvaluators = ref(false)
const saving = ref(false)
const assigning = ref({})
const mappings = ref([])
const unmappedPositions = ref([])
const availablePosts = ref([])
const units = ref([])
const cycles = ref([])
const selectedCycleId = ref(null)
const noEvaluatorPositions = ref([])
const noEvaluatorSummary = ref({ total: 0 })
const selectedEvaluators = ref({})
const showCreateDialog = ref(false)
const editingPosition = ref(null)

const form = ref({
  mapping_type: 'title_pattern',
  post_title_pattern: '',
  organizational_unit_id: null,
  assessment_post_id: null,
  description: '',
})

const mappingTypes = [
  { label: 'الگوی عنوان پست', value: 'title_pattern' },
  { label: 'واحد سازمانی', value: 'unit' },
]

const assignedCount = computed(() => {
  return noEvaluatorPositions.value.filter(p => selectedEvaluators.value[p.user_id]).length
})

onMounted(async () => {
  await loadCycles()
  await loadData()
  await loadUnits()
})

async function loadCycles() {
  try {
    const { data } = await api.get('/assessment/cycles')
    cycles.value = data.cycles || []
    if (!selectedCycleId.value && cycles.value.length) {
      selectedCycleId.value = cycles.value.find(c => c.status === 'active')?.id || cycles.value[0].id
    }
  } catch (e) {
    console.error('Load cycles error:', e)
  }
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/assessment/mappings')
    mappings.value = data.mappings || []
    unmappedPositions.value = data.unmapped_positions || []
    availablePosts.value = data.available_posts || []
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت داده‌ها',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

async function loadNoEvaluator() {
  if (!selectedCycleId.value) return

  loadingEvaluators.value = true
  try {
    const { data } = await api.get('/assessment/mappings/no-evaluator', {
      params: { cycle_id: selectedCycleId.value }
    })

    noEvaluatorPositions.value = data.positions || []
    noEvaluatorSummary.value = data.summary || { total: 0 }
    selectedEvaluators.value = {}
  } catch (e) {
    console.error('Load no evaluator error:', e)
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت لیست بدون ارزیاب',
      life: 3000,
    })
  } finally {
    loadingEvaluators.value = false
  }
}

async function loadUnits() {
  try {
    const { data } = await api.get('/hr/org-chart/units')
    units.value = data.units || []
  } catch (e) {
    console.error('Load units error:', e)
  }
}

function onCycleChange() {
  loadNoEvaluator()
}

function onMappingTypeChange() {
  form.value.post_title_pattern = ''
  form.value.organizational_unit_id = null
}

function quickMap(position) {
  editingPosition.value = position
  form.value = {
    mapping_type: 'title_pattern',
    post_title_pattern: position.post_title,
    organizational_unit_id: position.unit_id,
    assessment_post_id: null,
    description: `نگاشت سریع برای ${position.post_title}`,
  }
  showCreateDialog.value = true
}

async function saveMapping() {
  if (!form.value.assessment_post_id) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'انتخاب شناسنامه مقصد الزامی است',
      life: 3000,
    })
    return
  }

  if (form.value.mapping_type === 'title_pattern' && !form.value.post_title_pattern) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'الگوی عنوان الزامی است',
      life: 3000,
    })
    return
  }

  if (form.value.mapping_type === 'unit' && !form.value.organizational_unit_id) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'انتخاب واحد سازمانی الزامی است',
      life: 3000,
    })
    return
  }

  saving.value = true
  try {
    await api.post('/assessment/mappings', form.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'نگاشت با موفقیت ایجاد شد',
      life: 3000,
    })
    closeCreateDialog()
    await loadData()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ذخیره نگاشت',
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

async function assignEvaluator(position) {
  if (!selectedEvaluators.value[position.user_id]) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'لطفاً ارزیاب را انتخاب کنید',
      life: 3000,
    })
    return
  }

  if (!selectedCycleId.value) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'لطفاً چرخه ارزیابی را انتخاب کنید',
      life: 3000,
    })
    return
  }

  assigning.value[position.user_id] = true
  try {
    await api.post('/assessment/mappings/assign-evaluator', {
      cycle_id: selectedCycleId.value,
      user_id: position.user_id,
      evaluator_id: selectedEvaluators.value[position.user_id],
    })
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: `ارزیاب برای ${position.name} تعیین شد`,
      life: 3000,
    })
    await loadNoEvaluator()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در تعیین ارزیاب',
      life: 5000,
    })
  } finally {
    assigning.value[position.user_id] = false
  }
}

async function toggleMapping(mapping) {
  try {
    await api.put(`/assessment/mappings/${mapping.id}/toggle`)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: mapping.is_active ? 'نگاشت غیرفعال شد' : 'نگاشت فعال شد',
      life: 3000,
    })
    await loadData()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در تغییر وضعیت',
      life: 3000,
    })
  }
}

function confirmDelete(mapping) {
  confirm.require({
    message: `آیا از حذف این نگاشت اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await api.delete(`/assessment/mappings/${mapping.id}`)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'نگاشت حذف شد',
          life: 3000,
        })
        await loadData()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در حذف',
          life: 3000,
        })
      }
    },
  })
}

function getEvaluatorName(data, evaluatorId) {
  const evaluator = data.suggested_evaluators?.find(e => e.id === evaluatorId)
  return evaluator?.name || '—'
}

function closeCreateDialog() {
  showCreateDialog.value = false
  editingPosition.value = null
  form.value = {
    mapping_type: 'title_pattern',
    post_title_pattern: '',
    organizational_unit_id: null,
    assessment_post_id: null,
    description: '',
  }
}
</script>
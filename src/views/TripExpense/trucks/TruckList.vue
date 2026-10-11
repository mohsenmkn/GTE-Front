<!-- src/views/TripExpense/trucks/TruckList.vue -->

<template>
  <div class="truck-list-page">
    <!-- Hero -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="hero-status"></span>
            <span class="text-xs text-slate-500 font-medium">مدیریت ناوگان حمل و نقل</span>
          </div>
          <h1 class="hero-title">مدیریت کامیون‌ها 🚛</h1>
          <p class="hero-subtitle">ثبت و مدیریت اطلاعات کامیون‌های شرکت</p>
        </div>
        <div class="flex justify-start md:justify-end">
          <button
              type="button"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-violet-600 hover:bg-violet-700 text-white
                             shadow-lg shadow-violet-500/20
                             transition-all duration-300 transform hover:-translate-y-0.5
                             font-medium text-sm"
              @click="openCreateDialog"
          >
            <i class="pi pi-plus text-base"></i>
            <span>ثبت کامیون جدید</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Skeleton -->
    <div v-if="store.loading" class="dashboard-card p-5 space-y-4">
      <div class="skeleton w-48 h-6"></div>
      <div v-for="i in 5" :key="i" class="skeleton w-full h-12 rounded-lg"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-5">
      <!-- Filters -->
      <div class="dashboard-card p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">جستجو</label>
            <div class="relative">
              <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                  v-model="filters.search"
                  type="text"
                  placeholder="جستجو در کد، پلاک، برند..."
                  class="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  @input="debounceSearch"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">وضعیت</label>
            <Select
                v-model="filters.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="همه وضعیت‌ها"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
                @change="loadData"
            />
          </div>
          <div class="space-y-2 flex items-end">
            <button
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-xs font-medium"
                @click="resetFilters"
            >
              <i class="pi pi-refresh text-sm"></i>
              <span>پاک کردن فیلترها</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="dashboard-card overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <i class="pi pi-truck text-blue-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">لیست کامیون‌ها</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">مدیریت ناوگان حمل و نقل</p>
            </div>
          </div>
          <span class="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
                        {{ store.pagination.total }} رکورد
                    </span>
        </div>

        <DataTable
            :value="store.trucks"
            :loading="store.loading"
            paginator
            :rows="store.pagination.per_page"
            :total-records="store.pagination.total"
            @page="onPage"
            striped-rows
            class="w-full [&_th]:bg-slate-50/80 [&_th]:text-slate-600 [&_th]:font-semibold [&_th]:text-xs [&_th]:py-3.5 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:py-3.5 hover:[&_tr]:bg-violet-50/30 transition-colors"
        >
          <Column field="id" header="#" style="width: 60px" class="text-center text-slate-400 font-mono text-xs" />
          <Column field="code" header="کد کامیون">
            <template #body="{ data }">
              <span class="font-bold text-slate-800 text-xs">{{ data.code }}</span>
            </template>
          </Column>
          <Column field="plate_number" header="پلاک">
            <template #body="{ data }">
              <span class="text-xs text-slate-700 dir-ltr font-mono">{{ data.plate_number }}</span>
            </template>
          </Column>
          <Column field="brand" header="برند">
            <template #body="{ data }">
              <span class="text-xs text-slate-600">{{ data.brand || '-' }}</span>
            </template>
          </Column>
          <Column field="model" header="مدل">
            <template #body="{ data }">
              <span class="text-xs text-slate-600">{{ data.model || '-' }}</span>
            </template>
          </Column>
          <Column header="وضعیت">
            <template #body="{ data }">
                            <span
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                                :class="getStatusClasses(data.status)"
                            >
                                <i :class="getStatusConfig(data.status).icon"></i>
                                {{ getStatusConfig(data.status).label }}
                            </span>
            </template>
          </Column>
          <Column header="عملیات" style="width: 140px">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <button
                    @click="openEditDialog(data)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="ویرایش"
                >
                  <i class="pi pi-pencil text-xs"></i>
                </button>
                <button
                    @click="deleteTruck(data.id)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="حذف"
                >
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog -->
    <Dialog v-model:visible="dialog.visible" :header="dialog.isEdit ? 'ویرایش کامیون' : 'ثبت کامیون جدید'" modal :style="{ width: '500px' }">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">کد کامیون <span class="text-rose-500">*</span></label>
            <input
                v-model="dialog.form.code"
                type="text"
                placeholder="مثلاً: 120"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p v-if="dialog.errors.code" class="text-xs text-rose-600">{{ dialog.errors.code }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">پلاک <span class="text-rose-500">*</span></label>
            <input
                v-model="dialog.form.plate_number"
                type="text"
                placeholder="مثلاً: 12ب456-78"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p v-if="dialog.errors.plate_number" class="text-xs text-rose-600">{{ dialog.errors.plate_number }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">برند</label>
            <input
                v-model="dialog.form.brand"
                type="text"
                placeholder="مثلاً: ولوو"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">مدل</label>
            <input
                v-model="dialog.form.model"
                type="text"
                placeholder="مثلاً: FH16"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">وضعیت</label>
            <Select
                v-model="dialog.form.status"
                :options="statusOptions.filter(s => s.value !== null)"
                option-label="label"
                option-value="value"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">توضیحات</label>
            <textarea
                v-model="dialog.form.description"
                rows="2"
                placeholder="توضیحات اختیاری..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" @click="dialog.visible = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">انصراف</button>
          <button type="submit" :disabled="dialog.submitting" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm disabled:opacity-50">
            <i v-if="dialog.submitting" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-check"></i>
            <span>{{ dialog.submitting ? 'در حال ذخیره...' : 'ذخیره' }}</span>
          </button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useTruckStore } from '@/stores/truckStore'

const store = useTruckStore()

const STATUS_CONFIG = {
  active: { label: 'فعال', icon: 'pi pi-check-circle', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  inactive: { label: 'غیرفعال', icon: 'pi pi-times-circle', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  maintenance: { label: 'در حال تعمیر', icon: 'pi pi-wrench', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
}

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: null },
  ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({ label: config.label, value })),
]

const getStatusConfig = (status) => STATUS_CONFIG[status] || { label: status, icon: 'pi pi-question', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
const getStatusClasses = (status) => {
  const c = getStatusConfig(status)
  return `${c.bg} ${c.text} ${c.border}`
}

const filters = ref({ search: '', status: null })
let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.pagination.current_page = 1
    loadData()
  }, 500)
}

const resetFilters = () => {
  filters.value = { search: '', status: null }
  store.pagination.current_page = 1
  loadData()
}

const loadData = async () => {
  const params = {
    per_page: store.pagination.per_page,
    page: store.pagination.current_page,
  }
  if (filters.value.search) params.search = filters.value.search
  if (filters.value.status) params.status = filters.value.status
  await store.fetchTrucks(params)
}

const onPage = (event) => {
  store.pagination.current_page = event.page + 1
  loadData()
}

const dialog = reactive({
  visible: false,
  isEdit: false,
  editId: null,
  submitting: false,
  form: { code: '', plate_number: '', brand: '', model: '', status: 'active', description: '' },
  errors: {},
})

const openCreateDialog = () => {
  dialog.isEdit = false
  dialog.editId = null
  dialog.form = { code: '', plate_number: '', brand: '', model: '', status: 'active', description: '' }
  dialog.errors = {}
  dialog.visible = true
}

const openEditDialog = (truck) => {
  dialog.isEdit = true
  dialog.editId = truck.id
  dialog.form = { ...truck }
  dialog.errors = {}
  dialog.visible = true
}

const validate = () => {
  dialog.errors = {}
  let valid = true
  if (!dialog.form.code.trim()) { dialog.errors.code = 'کد کامیون الزامی است'; valid = false }
  if (!dialog.form.plate_number.trim()) { dialog.errors.plate_number = 'پلاک الزامی است'; valid = false }
  return valid
}

const submitForm = async () => {
  if (!validate()) return
  dialog.submitting = true
  try {
    if (dialog.isEdit) {
      await store.updateTruck(dialog.editId, dialog.form)
      alert('کامیون با موفقیت ویرایش شد')
    } else {
      await store.createTruck(dialog.form)
      alert('کامیون با موفقیت ایجاد شد')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    console.error(error)
    alert('خطا در ذخیره کامیون')
  } finally {
    dialog.submitting = false
  }
}

const deleteTruck = async (id) => {
  if (!confirm('آیا از حذف این کامیون اطمینان دارید؟')) return
  try {
    await store.deleteTruck(id)
    alert('کامیون با موفقیت حذف شد')
    loadData()
  } catch (error) {
    console.error(error)
    alert('خطا در حذف کامیون')
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.truck-list-page { @apply space-y-5; animation: dashboard-enter 0.45s ease-out; }
.dir-ltr { direction: ltr; }
.skeleton { @apply relative overflow-hidden rounded-lg bg-slate-200/70; }
.skeleton::after {
  content: ''; @apply absolute inset-0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent);
  animation: skeleton-shimmer 1.5s infinite;
}
@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }

.dashboard-hero {
  @apply relative overflow-hidden rounded-3xl border border-indigo-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(238 242 255), rgb(248 250 252) 55%, rgb(245 243 255));
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}
.hero-decoration { @apply absolute rounded-full pointer-events-none; filter: blur(50px); }
.hero-decoration-one { width: 220px; height: 220px; background: rgb(129 140 248 / 12%); top: -100px; left: -60px; }
.hero-decoration-two { width: 180px; height: 180px; background: rgb(167 139 250 / 12%); bottom: -100px; right: -50px; }
.hero-title { @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight; }
.hero-subtitle { @apply text-sm md:text-base text-slate-500 mt-1; }
.hero-status { @apply w-2 h-2 rounded-full bg-emerald-500; box-shadow: 0 0 0 4px rgb(16 185 129 / 10%); }

.dashboard-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

@keyframes dashboard-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
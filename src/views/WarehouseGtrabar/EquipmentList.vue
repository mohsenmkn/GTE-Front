<template>
  <div class="warehouse-page">
    <!-- ═══════ Header ═══════ -->
    <section class="warehouse-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Truck class="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h1 class="hero-title">تجهیزات</h1>
            <p class="hero-subtitle">مدیریت کامیون، لودر و سایر تجهیزات</p>
          </div>
        </div>
        <button
            v-if="canManage"
            @click="$router.push({ name: 'wg.equipment.create' })"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-md hover:bg-emerald-700 transition-all"
        >
          <Plus class="w-4 h-4" />
          تجهیز جدید
        </button>
      </div>
    </section>

    <!-- ═══════ Filters ═══════ -->
    <section class="warehouse-card p-5">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-search text-slate-400 ml-1"></i>
            جستجو
          </label>
          <input
              v-model="filters.search"
              @input="debounceSearch"
              type="text"
              placeholder="کد یا نام تجهیز..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-filter text-slate-400 ml-1"></i>
            نوع تجهیز
          </label>
          <select
              v-model="filters.type"
              @change="fetchEquipment"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
          >
            <option value="">همه</option>
            <option v-for="(label, value) in types" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-list text-slate-400 ml-1"></i>
            تعداد در صفحه
          </label>
          <select
              v-model="filters.per_page"
              @change="fetchEquipment"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ═══════ Stats ═══════ -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="warehouse-card p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
          <Truck class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-800">{{ pagination.total.toLocaleString('fa-IR') }}</div>
          <div class="text-xs text-slate-500">کل تجهیزات</div>
        </div>
      </div>
      <div class="warehouse-card p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 class="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <div class="text-2xl font-bold text-emerald-700">{{ activeCount.toLocaleString('fa-IR') }}</div>
          <div class="text-xs text-slate-500">فعال</div>
        </div>
      </div>
      <div class="warehouse-card p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
          <Wrench class="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <div class="text-2xl font-bold text-amber-700">{{ repairCount.toLocaleString('fa-IR') }}</div>
          <div class="text-xs text-slate-500">در تعمیر</div>
        </div>
      </div>
      <div class="warehouse-card p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
          <XCircle class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <div class="text-2xl font-bold text-red-700">{{ inactiveCount.toLocaleString('fa-IR') }}</div>
          <div class="text-xs text-slate-500">غیرفعال</div>
        </div>
      </div>
    </div>

    <!-- ═══════ Table ═══════ -->
    <section class="warehouse-card overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <div class="skeleton w-24 h-4"></div>
          <div class="skeleton w-32 h-4"></div>
          <div class="skeleton w-40 h-4"></div>
          <div class="skeleton w-20 h-4"></div>
        </div>
      </div>

      <div v-else-if="equipment.length === 0" class="p-12 text-center">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Truck class="w-10 h-10 text-slate-400" />
        </div>
        <h3 class="text-lg font-bold text-slate-700 mb-2">تجهیزی یافت نشد</h3>
        <p class="text-sm text-slate-500">
          {{ canManage ? 'برای شروع، یک تجهیز جدید ایجاد کنید' : 'با مدیر سیستم تماس بگیرید' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">#</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">کد</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">نام</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">نوع</th>
            <th class="px-5 py-4 text-center text-xs font-bold text-slate-600">وضعیت</th>
            <th class="px-5 py-4 text-center text-xs font-bold text-slate-600">قطعات نصب</th>
            <th class="px-5 py-4 text-center text-xs font-bold text-slate-600">عملیات</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="(item, index) in equipment"
              :key="item.id"
              class="border-b border-slate-100 hover:bg-emerald-50/30 transition-colors"
          >
            <td class="px-5 py-4 text-sm text-slate-500">
              {{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}
            </td>
            <td class="px-5 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-mono font-bold">
                  {{ item.code }}
                </span>
            </td>
            <td class="px-5 py-4">
              <div class="text-sm font-medium text-slate-800">{{ item.title }}</div>
              <div v-if="item.title_en" class="text-xs text-slate-500 mt-0.5">{{ item.title_en }}</div>
            </td>
            <td class="px-5 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                  {{ item.type_label }}
                </span>
            </td>
            <td class="px-5 py-4 text-center">
                <span
                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
                    :class="stateClass(item.state)"
                >
                  {{ item.state_label }}
                </span>
            </td>
            <td class="px-5 py-4 text-center">
                <span class="text-sm font-bold text-slate-700">
                  {{ (item.installations_count || 0).toLocaleString('fa-IR') }}
                </span>
            </td>
            <td class="px-5 py-4">
              <div class="flex items-center justify-center gap-1">
                <button
                    @click="$router.push({ name: 'wg.equipment.edit', params: { id: item.id } })"
                    v-if="canManage"
                    class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex items-center justify-center"
                    title="ویرایش"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                    @click="$router.push({ name: 'wg.part-trace.install', query: { equipment_id: item.id } })"
                    class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center justify-center"
                    title="نصب قطعه"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > 0" class="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          نمایش <span class="font-bold text-slate-800">{{ equipment.length }}</span> از
          <span class="font-bold text-slate-800">{{ pagination.total.toLocaleString('fa-IR') }}</span> رکورد
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Truck, Plus, Edit, CheckCircle2, Wrench, XCircle } from 'lucide-vue-next'
import api from '@/api/axios.js'
import { useAuthStore } from '@/stores/authold.js'

const auth = useAuthStore()
const loading = ref(true)
const equipment = ref([])
const types = ref({})
const pagination = ref({ current_page: 1, last_page: 1, per_page: 20, total: 0 })

const filters = ref({ search: '', type: '', per_page: 20 })

const canManage = computed(() => auth.can('warehouse_gtrabar.equipment_manage'))

const activeCount = computed(() => equipment.value.filter(e => e.state === 1).length)
const repairCount = computed(() => equipment.value.filter(e => e.state === 3).length)
const inactiveCount = computed(() => equipment.value.filter(e => e.state === 2).length)

let searchTimer = null

const stateClass = (state) => {
  const map = {
    1: 'bg-emerald-50 text-emerald-700',
    2: 'bg-red-50 text-red-700',
    3: 'bg-amber-50 text-amber-700',
  }
  return map[state] || 'bg-slate-100 text-slate-700'
}

const fetchEquipment = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/warehouse-gtrabar/equipment', {
      params: {
        search: filters.value.search,
        type: filters.value.type || undefined,
        per_page: filters.value.per_page,
      },
    })
    equipment.value = data.data || []
    pagination.value = data.pagination || {}
    types.value = data.types || {}
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchEquipment(), 500)
}

onMounted(fetchEquipment)
</script>

<style scoped>
.warehouse-page { @apply space-y-5; animation: dashboard-enter 0.45s ease-out; }
.warehouse-hero {
  @apply relative overflow-hidden rounded-3xl border border-emerald-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(236 253 245), rgb(248 250 252) 55%, rgb(240 253 250));
  box-shadow: 0 8px 30px rgb(16 185 129 / 5%);
}
.hero-decoration { @apply absolute rounded-full pointer-events-none; filter: blur(50px); }
.hero-decoration-one { width: 220px; height: 220px; background: rgb(52 211 153 / 12%); top: -100px; left: -60px; }
.hero-decoration-two { width: 180px; height: 180px; background: rgb(94 234 212 / 12%); bottom: -100px; right: -50px; }
.hero-title { @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight; }
.hero-subtitle { @apply text-sm md:text-base text-slate-500 mt-1; }
.warehouse-card { @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden; box-shadow: 0 1px 3px rgb(15 23 42 / 4%); }
.skeleton { @apply relative overflow-hidden rounded-lg bg-slate-200/70; }
.skeleton::after { content: ''; @apply absolute inset-0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent); animation: skeleton-shimmer 1.5s infinite; }
.skeleton-row { @apply flex items-center gap-4; }
@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
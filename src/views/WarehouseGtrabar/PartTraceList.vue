<template>
  <div class="warehouse-page">
    <!-- ═══════ Header ═══════ -->
    <section class="warehouse-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <GitBranch class="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 class="hero-title">ردیابی قطعات</h1>
            <p class="hero-subtitle">تاریخچه نصب و خروج قطعات روی تجهیزات</p>
          </div>
        </div>
        <button
            v-if="canManage"
            @click="$router.push({ name: 'wg.part-trace.install' })"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm shadow-md hover:bg-violet-700 transition-all"
        >
          <Plus class="w-4 h-4" />
          نصب قطعه جدید
        </button>
      </div>
    </section>

    <!-- ═══════ Filters ═══════ -->
    <section class="warehouse-card p-5">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-truck text-slate-400 ml-1"></i>
            تجهیز
          </label>
          <select
              v-model="filters.equipment_id"
              @change="fetchTraces"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
          >
            <option value="">همه تجهیزات</option>
            <option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
              {{ eq.code }} - {{ eq.title }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-search text-slate-400 ml-1"></i>
            کد قطعه
          </label>
          <input
              v-model="filters.part_code"
              @input="debounceSearch"
              type="text"
              placeholder="جستجوی کد قطعه..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-filter text-slate-400 ml-1"></i>
            وضعیت
          </label>
          <select
              v-model="filters.active_only"
              @change="fetchTraces"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
          >
            <option :value="false">همه</option>
            <option :value="true">فقط نصب شده</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-list text-slate-400 ml-1"></i>
            تعداد
          </label>
          <select
              v-model="filters.per_page"
              @change="fetchTraces"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ══════ Table ═══════ -->
    <section class="warehouse-card overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <div class="skeleton w-24 h-4"></div>
          <div class="skeleton w-32 h-4"></div>
          <div class="skeleton w-40 h-4"></div>
          <div class="skeleton w-20 h-4"></div>
        </div>
      </div>

      <div v-else-if="traces.length === 0" class="p-12 text-center">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <GitBranch class="w-10 h-10 text-slate-400" />
        </div>
        <h3 class="text-lg font-bold text-slate-700 mb-2">رکوردی یافت نشد</h3>
        <p class="text-sm text-slate-500">
          {{ canManage ? 'برای شروع، یک قطعه جدید نصب کنید' : 'با مدیر سیستم تماس بگیرید' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">#</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">کد قطعه</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">نام قطعه</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">تجهیز</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">محل نصب</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">تاریخ نصب</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">تاریخ خروج</th>
            <th class="px-5 py-4 text-center text-xs font-bold text-slate-600">وضعیت</th>
            <th class="px-5 py-4 text-center text-xs font-bold text-slate-600">عملیات</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="(item, index) in traces"
              :key="item.id"
              class="border-b border-slate-100 hover:bg-violet-50/30 transition-colors"
          >
            <td class="px-5 py-4 text-sm text-slate-500">
              {{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}
            </td>
            <td class="px-5 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-mono font-bold">
                  {{ item.part_code }}
                </span>
            </td>
            <td class="px-5 py-4 text-sm font-medium text-slate-800">{{ item.part_name }}</td>
            <td class="px-5 py-4">
              <div class="text-sm text-slate-700">{{ item.equipment?.title || '-' }}</div>
              <div class="text-xs text-slate-500 font-mono">{{ item.equipment?.code || '' }}</div>
            </td>
            <td class="px-5 py-4 text-sm text-slate-600">{{ item.installation_location || '-' }}</td>
            <td class="px-5 py-4 text-sm text-slate-600">{{ item.installed_at }}</td>
            <td class="px-5 py-4 text-sm text-slate-600">{{ item.removed_at || '-' }}</td>
            <td class="px-5 py-4 text-center">
                <span
                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
                    :class="item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ item.is_active ? 'نصب شده' : 'خارج شده' }}
                </span>
            </td>
            <td class="px-5 py-4">
              <div class="flex items-center justify-center gap-1">
                <button
                    v-if="item.is_active && canManage"
                    @click="removePart(item.id)"
                    class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
                    title="خارج کردن قطعه"
                >
                  <LogOut class="w-4 h-4" />
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
          نمایش <span class="font-bold text-slate-800">{{ traces.length }}</span> از
          <span class="font-bold text-slate-800">{{ pagination.total.toLocaleString('fa-IR') }}</span> رکورد
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { GitBranch, Plus, LogOut } from 'lucide-vue-next'
import api from '@/api/axios.js'
import { useAuthStore } from '@/stores/authold.js'

const auth = useAuthStore()
const loading = ref(true)
const traces = ref([])
const equipmentList = ref([])
const pagination = ref({ current_page: 1, last_page: 1, per_page: 20, total: 0 })

const filters = ref({
  equipment_id: '',
  part_code: '',
  active_only: false,
  per_page: 20,
})

const canManage = computed(() => auth.can('warehouse_gtrabar.part_trace_manage'))

let searchTimer = null

const fetchEquipment = async () => {
  try {
    const { data } = await api.get('/warehouse-gtrabar/equipment', { params: { per_page: 1000 } })
    equipmentList.value = data.data || []
  } catch (error) {
    console.error('Error:', error)
  }
}

const fetchTraces = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/warehouse-gtrabar/part-trace', {
      params: {
        equipment_id: filters.value.equipment_id || undefined,
        part_code: filters.value.part_code || undefined,
        active_only: filters.value.active_only || undefined,
        per_page: filters.value.per_page,
      },
    })
    traces.value = data.data || []
    pagination.value = data.pagination || {}
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchTraces(), 500)
}

const removePart = async (id) => {
  if (!confirm('آیا از خارج کردن این قطعه اطمینان دارید؟')) return
  try {
    await api.post(`/warehouse-gtrabar/part-trace/${id}/remove`)
    await fetchTraces()
  } catch (error) {
    alert(error.response?.data?.message || 'خطا در خارج کردن قطعه')
  }
}

onMounted(async () => {
  await fetchEquipment()
  await fetchTraces()
})
</script>

<style scoped>
.warehouse-page { @apply space-y-5; animation: dashboard-enter 0.45s ease-out; }
.warehouse-hero {
  @apply relative overflow-hidden rounded-3xl border border-violet-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(245 243 255), rgb(248 250 252) 55%, rgb(237 233 254));
  box-shadow: 0 8px 30px rgb(139 92 246 / 5%);
}
.hero-decoration { @apply absolute rounded-full pointer-events-none; filter: blur(50px); }
.hero-decoration-one { width: 220px; height: 220px; background: rgb(167 139 250 / 12%); top: -100px; left: -60px; }
.hero-decoration-two { width: 180px; height: 180px; background: rgb(196 181 253 / 12%); bottom: -100px; right: -50px; }
.hero-title { @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight; }
.hero-subtitle { @apply text-sm md:text-base text-slate-500 mt-1; }
.warehouse-card { @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden; box-shadow: 0 1px 3px rgb(15 23 42 / 4%); }
.skeleton { @apply relative overflow-hidden rounded-lg bg-slate-200/70; }
.skeleton::after { content: ''; @apply absolute inset-0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent); animation: skeleton-shimmer 1.5s infinite; }
.skeleton-row { @apply flex items-center gap-4; }
@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
<template>
  <div class="warehouse-page">
    <!-- ═══════ Header ═══════ -->
    <section class="warehouse-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Package class="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <h1 class="hero-title">موجودی انبار</h1>
          <p class="hero-subtitle">مشاهده موجودی قطعات از سیستم همکاران</p>
        </div>
      </div>
    </section>

    <!-- ═══════ Filters ═══════ -->
    <section class="warehouse-card p-5">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- انتخاب انبار -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-building text-slate-400 ml-1"></i>
            انبار
          </label>
          <select
              v-model="filters.store_id"
              @change="fetchStock"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
          >
            <option value="">انتخاب انبار...</option>
            <option v-for="store in stores" :key="store.StoreID" :value="store.StoreID">
              {{ store.Code }} - {{ store.Name }}
            </option>
          </select>
        </div>

        <!-- جستجو -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-search text-slate-400 ml-1"></i>
            جستجو
          </label>
          <input
              v-model="filters.search"
              @input="debounceSearch"
              type="text"
              placeholder="کد یا نام قطعه..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
          />
        </div>

        <!-- تعداد در صفحه -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            <i class="pi pi-list text-slate-400 ml-1"></i>
            تعداد در صفحه
          </label>
          <select
              v-model="filters.per_page"
              @change="fetchStock"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ═══════ Table ═══════ -->
    <section class="warehouse-card overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <div class="skeleton w-24 h-4"></div>
          <div class="skeleton w-32 h-4"></div>
          <div class="skeleton w-40 h-4"></div>
          <div class="skeleton w-20 h-4"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="stock.length === 0" class="p-12 text-center">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Package class="w-10 h-10 text-slate-400" />
        </div>
        <h3 class="text-lg font-bold text-slate-700 mb-2">
          {{ filters.store_id ? 'موجودی یافت نشد' : 'انبار را انتخاب کنید' }}
        </h3>
        <p class="text-sm text-slate-500">
          {{ filters.store_id ? 'هیچ قطعه‌ای با موجودی در این انبار یافت نشد' : 'برای مشاهده موجودی، ابتدا یک انبار انتخاب کنید' }}
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">#</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">کد قطعه</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">نام قطعه</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">نام لاتین</th>
            <th class="px-5 py-4 text-right text-xs font-bold text-slate-600">مشخصات فنی</th>
            <th class="px-5 py-4 text-center text-xs font-bold text-slate-600">موجودی</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="(item, index) in stock"
              :key="item.part_ref"
              class="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors"
          >
            <td class="px-5 py-4 text-sm text-slate-500">
              {{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}
            </td>
            <td class="px-5 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-mono font-bold">
                  {{ item.part_code }}
                </span>
            </td>
            <td class="px-5 py-4 text-sm font-medium text-slate-800">
              {{ item.part_name }}
            </td>
            <td class="px-5 py-4 text-sm text-slate-600">
              {{ item.latin_name || '-' }}
            </td>
            <td class="px-5 py-4 text-sm text-slate-600 max-w-xs truncate" :title="item.technical_specification">
              {{ item.technical_specification || '-' }}
            </td>
            <td class="px-5 py-4 text-center">
                <span
                    class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
                    :class="item.current_stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                >
                  {{ item.current_stock.toLocaleString('fa-IR') }}
                </span>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > 0" class="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          نمایش <span class="font-bold text-slate-800">{{ stock.length }}</span> از
          <span class="font-bold text-slate-800">{{ pagination.total.toLocaleString('fa-IR') }}</span> رکورد
        </div>
        <div class="flex items-center gap-2">
          <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              class="w-9 h-9 rounded-lg text-sm font-medium transition-all"
              :class="page === pagination.current_page
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50'"
          >
            {{ page.toLocaleString('fa-IR') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Package } from 'lucide-vue-next'
import api from '@/api/axios.js'

const loading = ref(true)
const stores = ref([])
const stock = ref([])
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
})

const filters = ref({
  store_id: '',
  search: '',
  per_page: 20,
})

let searchTimer = null

const visiblePages = computed(() => {
  const pages = []
  const total = pagination.value.last_page
  const current = pagination.value.current_page
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const fetchStores = async () => {
  try {
    const { data } = await api.get('/warehouse-gtrabar/stores')
    stores.value = data.data || []
  } catch (error) {
    console.error('Error fetching stores:', error)
  }
}

const fetchStock = async () => {
  if (!filters.value.store_id) {
    stock.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await api.get('/warehouse-gtrabar/stock', {
      params: {
        store_id: filters.value.store_id,
        search: filters.value.search,
        per_page: filters.value.per_page,
      },
    })
    stock.value = data.data || []
    pagination.value = data.pagination || {}
  } catch (error) {
    console.error('Error fetching stock:', error)
  } finally {
    loading.value = false
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchStock(), 500)
}

const goToPage = (page) => {
  filters.value.page = page
  fetchStock()
}

onMounted(() => {
  fetchStores()
})
</script>

<style scoped>
.warehouse-page {
  @apply space-y-5;
  animation: dashboard-enter 0.45s ease-out;
}

.warehouse-hero {
  @apply relative overflow-hidden rounded-3xl border border-indigo-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(238 242 255), rgb(248 250 252) 55%, rgb(245 243 255));
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}

.hero-decoration {
  @apply absolute rounded-full pointer-events-none;
  filter: blur(50px);
}

.hero-decoration-one {
  width: 220px;
  height: 220px;
  background: rgb(129 140 248 / 12%);
  top: -100px;
  left: -60px;
}

.hero-decoration-two {
  width: 180px;
  height: 180px;
  background: rgb(167 139 250 / 12%);
  bottom: -100px;
  right: -50px;
}

.hero-title {
  @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight;
}

.hero-subtitle {
  @apply text-sm md:text-base text-slate-500 mt-1;
}

.warehouse-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

.skeleton {
  @apply relative overflow-hidden rounded-lg bg-slate-200/70;
}

.skeleton::after {
  content: '';
  @apply absolute inset-0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent);
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-row {
  @apply flex items-center gap-4;
}

@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

@keyframes dashboard-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
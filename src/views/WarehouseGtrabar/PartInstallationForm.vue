<template>
  <div class="warehouse-page">
    <!-- ═══════ Header ═══════ -->
    <section class="warehouse-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
          <Wrench class="w-7 h-7 text-violet-600" />
        </div>
        <div>
          <h1 class="hero-title">نصب قطعه جدید</h1>
          <p class="hero-subtitle">ثبت نصب قطعه روی تجهیز</p>
        </div>
      </div>
    </section>

    <!-- ═══════ Form ═══════ -->
    <section class="warehouse-card p-6">
      <form @submit.prevent="submitForm" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- تجهیز -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              تجهیز <span class="text-red-500">*</span>
            </label>
            <select
                v-model="form.equipment_id"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
            >
              <option value="">انتخاب تجهیز...</option>
              <option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
                {{ eq.code }} - {{ eq.title }}
              </option>
            </select>
            <p v-if="errors.equipment_id" class="text-xs text-red-600 mt-1">{{ errors.equipment_id }}</p>
          </div>

          <!-- تاریخ نصب -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              تاریخ نصب <span class="text-red-500">*</span>
            </label>
            <vue3-persian-datetime-picker
                v-model="form.installed_at"
                input-class-name="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
                format="YYYY-MM-DD HH:mm:ss"
                type="datetime"
                placeholder="انتخاب تاریخ..."
            />
            <p v-if="errors.installed_at" class="text-xs text-red-600 mt-1">{{ errors.installed_at }}</p>
          </div>

          <!-- کد قطعه -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              کد قطعه <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                  v-model="form.part_code"
                  @input="searchParts"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
                  placeholder="کد قطعه را وارد یا جستجو کنید..."
              />
              <!-- Part Suggestions -->
              <div v-if="partSuggestions.length > 0 && form.part_code" class="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                <div
                    v-for="part in partSuggestions"
                    :key="part.PartID"
                    @click="selectPart(part)"
                    class="px-4 py-2.5 hover:bg-violet-50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono font-bold text-violet-700">{{ part.Code }}</span>
                    <span class="text-xs text-slate-500">{{ part.PartID }}</span>
                  </div>
                  <div class="text-sm text-slate-800 mt-0.5">{{ part.Name }}</div>
                  <div v-if="part.LatinName" class="text-xs text-slate-500" dir="ltr">{{ part.LatinName }}</div>
                </div>
              </div>
            </div>
            <p v-if="errors.part_code" class="text-xs text-red-600 mt-1">{{ errors.part_code }}</p>
          </div>

          <!-- نام قطعه -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              نام قطعه <span class="text-red-500">*</span>
            </label>
            <input
                v-model="form.part_name"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
                placeholder="نام قطعه..."
            />
            <p v-if="errors.part_name" class="text-xs text-red-600 mt-1">{{ errors.part_name }}</p>
          </div>

          <!-- محل نصب -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">محل نصب</label>
            <input
                v-model="form.installation_location"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
                placeholder="مثال: موتور، گیربکس، چرخ جلو..."
            />
          </div>

          <!-- شماره سریال -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">شماره سریال</label>
            <input
                v-model="form.serial_number"
                type="text"
                dir="ltr"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all text-left"
                placeholder="Serial Number..."
            />
          </div>
        </div>

        <!-- توضیحات -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">توضیحات</label>
          <textarea
              v-model="form.notes"
              rows="4"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all resize-none"
              placeholder="توضیحات اضافی..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
              type="button"
              @click="$router.back()"
              class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-all"
          >
            انصراف
          </button>
          <button
              type="submit"
              :disabled="submitting"
              class="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm shadow-md hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            {{ submitting ? 'در حال ثبت...' : 'ثبت نصب' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Wrench, Save } from 'lucide-vue-next'
import api from '@/api/axios.js'
import Vue3PersianDatetimePicker from 'vue3-persian-datetime-picker'

const route = useRoute()
const router = useRouter()

const submitting = ref(false)
const equipmentList = ref([])
const partSuggestions = ref([])
const errors = ref({})

const form = ref({
  equipment_id: route.query.equipment_id || '',
  part_code: '',
  part_name: '',
  part_sql_server_id: null,
  installed_at: '',
  installation_location: '',
  serial_number: '',
  notes: '',
})

let searchTimer = null

const fetchEquipment = async () => {
  try {
    const { data } = await api.get('/warehouse-gtrabar/equipment', { params: { per_page: 1000 } })
    equipmentList.value = data.data || []
  } catch (error) {
    console.error('Error:', error)
  }
}

const searchParts = () => {
  clearTimeout(searchTimer)
  if (form.value.part_code.length < 2) {
    partSuggestions.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/warehouse-gtrabar/parts/search', {
        params: { q: form.value.part_code },
      })
      partSuggestions.value = data.data || []
    } catch (error) {
      console.error('Error:', error)
    }
  }, 400)
}

const selectPart = (part) => {
  form.value.part_code = part.Code
  form.value.part_name = part.Name
  form.value.part_sql_server_id = part.PartID
  partSuggestions.value = []
}

const submitForm = async () => {
  submitting.value = true
  errors.value = {}
  try {
    await api.post('/warehouse-gtrabar/part-trace', form.value)
    router.push({ name: 'wg.part-trace' })
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    submitting.value = false
  }
}

onMounted(fetchEquipment)
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
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
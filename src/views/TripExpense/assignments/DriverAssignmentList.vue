<!-- src/views/TripExpense/assignments/DriverAssignmentList.vue -->

<template>
  <div class="driver-assignment-page" dir="rtl">
    <!-- Hero -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="hero-content">
        <div class="hero-icon">
          <i class="pi pi-users"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="hero-title">مدیریت اختصاص راننده به کامیون</h1>
            <span class="hero-badge">
                            <i class="pi pi-link"></i>
                            مدیریت ناوگان
                        </span>
          </div>
          <p class="hero-subtitle">
            اختصاص رانندگان به کامیون‌ها و مدیریت تاریخچه فعالیت‌ها
          </p>
        </div>
        <button
            v-if="canManage"
            type="button"
            class="primary-button"
            @click="openCreateDialog"
        >
          <i class="pi pi-plus"></i>
          <span>اختصاص جدید</span>
        </button>
      </div>
      <div class="hero-footer">
        <div class="hero-stat">
                    <span class="hero-stat-icon">
                        <i class="pi pi-list"></i>
                    </span>
          <div>
            <span class="hero-stat-label">کل اختصاص‌ها</span>
            <strong>{{ formatNumber(pagination.total) }}</strong>
          </div>
        </div>
        <div class="hero-stat">
                    <span class="hero-stat-icon active-icon">
                        <i class="pi pi-check-circle"></i>
                    </span>
          <div>
            <span class="hero-stat-label">اختصاص‌های فعال</span>
            <strong>{{ formatNumber(activeCount) }}</strong>
          </div>
        </div>
        <div class="hero-stat">
                    <span class="hero-stat-icon ended-icon">
                        <i class="pi pi-times-circle"></i>
                    </span>
          <div>
            <span class="hero-stat-label">پایان یافته</span>
            <strong>{{ formatNumber(pagination.total - activeCount) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="dashboard-card">
      <div class="section-heading">
        <div class="section-heading-main">
                    <span class="section-icon filter-icon">
                        <i class="pi pi-filter"></i>
                    </span>
          <div>
            <h2 class="section-title">فیلتر اختصاص‌ها</h2>
            <p>برای پیدا کردن اختصاص موردنظر، فیلترها را تنظیم کنید.</p>
          </div>
        </div>
        <button type="button" class="reset-button" @click="resetFilters">
          <i class="pi pi-refresh"></i>
          <span>حذف فیلترها</span>
        </button>
      </div>
      <div class="filters-grid">
        <div class="filter-field">
          <label>وضعیت</label>
          <Select
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="همه وضعیت‌ها"
              class="w-full"
              @change="applyFilters"
          />
        </div>
        <div class="filter-field">
          <label>جستجو</label>
          <input
              v-model="filters.search"
              type="text"
              placeholder="نام راننده، کد پرسنلی، کد کامیون..."
              class="filter-input"
              @input="debounceSearch"
          />
        </div>
        <div class="filter-field filter-action-field">
          <label class="invisible">اعمال فیلتر</label>
          <button type="button" class="apply-button" @click="applyFilters">
            <i class="pi pi-search"></i>
            <span>نمایش نتایج</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Table -->
    <section class="dashboard-card table-card">
      <div class="section-heading table-heading">
        <div class="section-heading-main">
                    <span class="section-icon table-icon">
                        <i class="pi pi-table"></i>
                    </span>
          <div>
            <h2 class="section-title">لیست اختصاص‌ها</h2>
            <p>{{ formatNumber(pagination.total) }} رکورد</p>
          </div>
        </div>
      </div>

      <DataTable
          :value="store.assignments"
          :loading="store.loading"
          lazy
          paginator
          dataKey="id"
          :first="(pagination.current_page - 1) * pagination.per_page"
          :rows="pagination.per_page"
          :totalRecords="pagination.total"
          @page="onPage"
          striped-rows
          class="assignment-table"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox empty-icon"></i>
            <h3>اختصاصی یافت نشد</h3>
            <p>با تغییر فیلترها یا ایجاد اختصاص جدید شروع کنید.</p>
          </div>
        </template>

        <Column header="#" style="width: 70px">
          <template #body="{ data }">
            <span class="table-id">#{{ data.id }}</span>
          </template>
        </Column>

        <Column header="راننده" style="min-width: 180px">
          <template #body="{ data }">
            <div class="person-cell">
                            <span class="person-avatar driver-avatar">
                                <i class="pi pi-user"></i>
                            </span>
              <div>
                <strong>{{ data.driver?.name || '—' }}</strong>
                <small>کد: {{ data.driver?.personnel_code || '—' }}</small>
              </div>
            </div>
          </template>
        </Column>

        <Column header="کامیون" style="min-width: 160px">
          <template #body="{ data }">
            <div class="person-cell">
                            <span class="person-avatar truck-avatar">
                                <i class="pi pi-truck"></i>
                            </span>
              <div>
                <strong>کد {{ data.truck?.code || '—' }}</strong>
                <small class="ltr-text">{{ data.truck?.plate_number || '—' }}</small>
              </div>
            </div>
          </template>
        </Column>

        <Column header="تاریخ شروع">
          <template #body="{ data }">
            <span class="ltr-text table-date">{{ toJalali(data.start_date) || '—' }}</span>
          </template>
        </Column>

        <Column header="تاریخ پایان">
          <template #body="{ data }">
            <span class="ltr-text table-date">{{ toJalali(data.end_date) || 'تاکنون' }}</span>
          </template>
        </Column>

        <Column header="مدت (روز)">
          <template #body="{ data }">
            <span class="duration-badge">{{ data.duration_days || '—' }}</span>
          </template>
        </Column>

        <Column header="وضعیت">
          <template #body="{ data }">
                        <span
                            class="status-pill"
                            :class="data.is_active ? 'status-active' : 'status-ended'"
                        >
                            <i :class="data.is_active ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                            {{ data.status_label }}
                        </span>
          </template>
        </Column>

        <Column header="عملیات" style="width: 180px">
          <template #body="{ data }">
            <div class="action-buttons">
              <button
                  v-if="canManage && data.is_active"
                  type="button"
                  class="icon-action action-end"
                  title="پایان دادن به اختصاص"
                  @click="openEndDialog(data)"
              >
                <i class="pi pi-stop-circle"></i>
              </button>
              <button
                  v-if="canManage"
                  type="button"
                  class="icon-action action-edit"
                  title="ویرایش"
                  @click="openEditDialog(data)"
              >
                <i class="pi pi-pencil"></i>
              </button>
              <button
                  v-if="canManage"
                  type="button"
                  class="icon-action action-delete"
                  title="حذف"
                  @click="deleteAssignment(data.id)"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- Create/Edit Dialog -->
    <Dialog
        v-model:visible="formDialog.visible"
        modal
        :header="formDialog.isEdit ? 'ویرایش اختصاص' : 'اختصاص جدید راننده به کامیون'"
        :style="{ width: 'min(550px, calc(100vw - 32px))' }"
        :closable="!formDialog.submitting"
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="form-field">
          <label>راننده <span class="required">*</span></label>
          <Select
              v-model="formDialog.form.user_id"
              :options="store.availableDrivers"
              option-label="name"
              option-value="id"
              placeholder="انتخاب راننده"
              filter
              class="w-full"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-violet-500"></i>
                <span>{{ option.name }}</span>
                <span class="text-xs text-slate-400">(کد: {{ option.personnel_code }})</span>
              </div>
            </template>
          </Select>
          <p v-if="formDialog.errors.user_id" class="error-text">{{ formDialog.errors.user_id }}</p>
        </div>

        <div class="form-field">
          <label>کامیون <span class="required">*</span></label>
          <Select
              v-model="formDialog.form.truck_id"
              :options="store.availableTrucks"
              option-label="display"
              option-value="id"
              placeholder="انتخاب کامیون"
              filter
              class="w-full"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <i class="pi pi-truck text-blue-500"></i>
                <span>{{ option.display }}</span>
              </div>
            </template>
          </Select>
          <p v-if="formDialog.errors.truck_id" class="error-text">{{ formDialog.errors.truck_id }}</p>
        </div>

        <div class="form-grid-2">
          <div class="form-field">
            <label>تاریخ شروع <span class="required">*</span></label>
            <DatePicker
                v-model="formDialog.form.start_date"
                date-format="yy/mm/dd"
                placeholder="انتخاب تاریخ"
                class="w-full"
            />
            <p v-if="formDialog.errors.start_date" class="error-text">{{ formDialog.errors.start_date }}</p>
          </div>
          <div class="form-field">
            <label>تاریخ پایان</label>
            <DatePicker
                v-model="formDialog.form.end_date"
                date-format="yy/mm/dd"
                placeholder="اختیاری"
                class="w-full"
            />
          </div>
        </div>

        <div class="form-field">
          <label>توضیحات</label>
          <textarea
              v-model="formDialog.form.note"
              rows="3"
              placeholder="توضیحات اختیاری..."
              class="form-textarea"
          ></textarea>
        </div>

        <div class="dialog-actions">
          <button type="button" class="cancel-button" @click="formDialog.visible = false">انصراف</button>
          <button type="submit" class="submit-button" :disabled="formDialog.submitting">
            <i :class="formDialog.submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
            {{ formDialog.submitting ? 'در حال ذخیره...' : 'ذخیره' }}
          </button>
        </div>
      </form>
    </Dialog>

    <!-- End Assignment Dialog -->
    <Dialog
        v-model:visible="endDialog.visible"
        modal
        header="پایان دادن به اختصاص"
        :style="{ width: 'min(450px, calc(100vw - 32px))' }"
        :closable="!endDialog.submitting"
    >
      <div class="space-y-4">
        <div class="notice-box warning">
          <i class="pi pi-exclamation-triangle"></i>
          <span>
                        آیا مطمئن هستید که می‌خواهید اختصاص راننده
                        <strong>{{ endDialog.assignment?.driver?.name }}</strong>
                        به کامیون
                        <strong>کد {{ endDialog.assignment?.truck?.code }}</strong>
                        را پایان دهید؟
                    </span>
        </div>

        <div class="form-field">
          <label>تاریخ پایان <span class="required">*</span></label>
          <DatePicker
              v-model="endDialog.endDate"
              date-format="yy/mm/dd"
              placeholder="انتخاب تاریخ پایان"
              class="w-full"
          />
        </div>

        <div class="dialog-actions">
          <button type="button" class="cancel-button" @click="endDialog.visible = false">انصراف</button>
          <button type="button" class="submit-button danger" :disabled="endDialog.submitting" @click="confirmEnd">
            <i :class="endDialog.submitting ? 'pi pi-spin pi-spinner' : 'pi pi-stop-circle'"></i>
            {{ endDialog.submitting ? 'در حال پایان...' : 'پایان دادن' }}
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authold'
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()
import { useDriverAssignmentStore } from '@/stores/driverAssignmentStore'
import {useJalaliDate} from "@/composables/useJalaliDate.js";

const authStore = useAuthStore()
const store = useDriverAssignmentStore()

const canManage = computed(() => authStore.can('trip_expense.manage_assignments_trucks'))

const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0,
})

const filters = reactive({
  status: null,
  search: '',
})

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: null },
  { label: 'فعال', value: 'active' },
  { label: 'پایان یافته', value: 'ended' },
]

const activeCount = computed(() => {
  return store.assignments.filter(a => a.is_active).length
})

const formDialog = reactive({
  visible: false,
  isEdit: false,
  editId: null,
  submitting: false,
  form: {
    user_id: null,
    truck_id: null,
    start_date: null,
    end_date: null,
    note: '',
  },
  errors: {},
})

const endDialog = reactive({
  visible: false,
  assignment: null,
  endDate: null,
  submitting: false,
})

let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

const applyFilters = () => {
  pagination.current_page = 1
  loadData()
}

const resetFilters = () => {
  filters.status = null
  filters.search = ''
  pagination.current_page = 1
  loadData()
}

const loadData = async () => {
  const params = {
    page: pagination.current_page,
    per_page: pagination.per_page,
  }
  if (filters.status) params.status = filters.status
  if (filters.search) params.search = filters.search

  await store.fetchAssignments(params)

  if (store.pagination) {
    pagination.current_page = store.pagination.current_page
    pagination.per_page = store.pagination.per_page
    pagination.total = store.pagination.total
  }
}

const onPage = (event) => {
  pagination.current_page = event.page + 1
  loadData()
}

const openCreateDialog = async () => {
  formDialog.isEdit = false
  formDialog.editId = null
  formDialog.form = {
    user_id: null,
    truck_id: null,
    start_date: null,
    end_date: null,
    note: '',
  }
  formDialog.errors = {}
  formDialog.visible = true

  await Promise.all([
    store.fetchAvailableDrivers(),
    store.fetchAvailableTrucks(),
  ])
}

const openEditDialog = async (assignment) => {
  formDialog.isEdit = true
  formDialog.editId = assignment.id
  formDialog.form = {
    user_id: assignment.user_id,
    truck_id: assignment.truck_id,
    start_date: assignment.start_date,
    end_date: assignment.end_date,
    note: assignment.note || '',
  }
  formDialog.errors = {}
  formDialog.visible = true

  await Promise.all([
    store.fetchAvailableDrivers(),
    store.fetchAvailableTrucks(),
  ])
}

const formatDate = (date) => {
  if (!date) return null
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return date
}

const submitForm = async () => {
  formDialog.errors = {}
  let valid = true

  if (!formDialog.form.user_id) {
    formDialog.errors.user_id = 'انتخاب راننده الزامی است'
    valid = false
  }
  if (!formDialog.form.truck_id) {
    formDialog.errors.truck_id = 'انتخاب کامیون الزامی است'
    valid = false
  }
  if (!formDialog.form.start_date) {
    formDialog.errors.start_date = 'تاریخ شروع الزامی است'
    valid = false
  }

  if (!valid) return

  formDialog.submitting = true
  try {
    const payload = {
      user_id: formDialog.form.user_id,
      truck_id: formDialog.form.truck_id,
      start_date: formatDate(formDialog.form.start_date),
      end_date: formatDate(formDialog.form.end_date),
      note: formDialog.form.note,
    }

    if (formDialog.isEdit) {
      await store.updateAssignment(formDialog.editId, payload)
      alert('اختصاص با موفقیت ویرایش شد')
    } else {
      await store.createAssignment(payload)
      alert('راننده با موفقیت به کامیون اختصاص داده شد')
    }

    formDialog.visible = false
    loadData()
  } catch (error) {
    console.error(error)
    alert(error?.response?.data?.message || 'خطا در ذخیره اختصاص')
  } finally {
    formDialog.submitting = false
  }
}

const openEndDialog = (assignment) => {
  endDialog.assignment = assignment
  endDialog.endDate = null
  endDialog.visible = true
}

const confirmEnd = async () => {
  if (!endDialog.endDate) {
    alert('لطفاً تاریخ پایان را انتخاب کنید')
    return
  }

  endDialog.submitting = true
  try {
    await store.endAssignment(endDialog.assignment.id, formatDate(endDialog.endDate))
    alert('اختصاص با موفقیت پایان یافت')
    endDialog.visible = false
    loadData()
  } catch (error) {
    console.error(error)
    alert(error?.response?.data?.message || 'خطا در پایان دادن به اختصاص')
  } finally {
    endDialog.submitting = false
  }
}

const deleteAssignment = async (id) => {
  if (!confirm('آیا از حذف این اختصاص اطمینان دارید؟')) return
  try {
    await store.deleteAssignment(id)
    alert('اختصاص با موفقیت حذف شد')
    loadData()
  } catch (error) {
    console.error(error)
    alert('خطا در حذف اختصاص')
  }
}

const formatNumber = (value) => Number(value || 0).toLocaleString('fa-IR')

onMounted(() => loadData())
</script>

<style scoped>
.driver-assignment-page {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: page-enter 0.35s ease-out;
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid #e1e6ff;
  border-radius: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(115deg, #f0f2ff 0%, #fafbff 52%, #f5f0ff 100%);
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}

.hero-decoration {
  position: absolute;
  pointer-events: none;
  border-radius: 9999px;
  filter: blur(48px);
}

.hero-decoration-one {
  width: 230px;
  height: 230px;
  top: -130px;
  left: -50px;
  background: rgb(129 140 248 / 19%);
}

.hero-decoration-two {
  width: 190px;
  height: 190px;
  right: -70px;
  bottom: -125px;
  background: rgb(167 139 250 / 17%);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-icon {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  place-items: center;
  border: 1px solid #d9ddff;
  border-radius: 17px;
  background: rgb(255 255  255 / 85%);
  color: var(--primary-dark);
  font-size: 1.35rem;
}

.hero-title {
  margin: 0;
  color: #202746;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 800;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid #dcdfff;
  border-radius: 999px;
  background: #fff;
  color: #5556b9;
  font-size: 0.7rem;
  font-weight: 600;
}

.hero-subtitle {
  margin: 0.55rem 0 0;
  color: #737b92;
  font-size: 0.85rem;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border: 0;
  border-radius: 0.85rem;
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.hero-footer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgb(210 215 246 / 75%);
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hero-stat-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid #e0e5ff;
  border-radius: 13px;
  background: #fff;
  color: var(--primary);
}

.active-icon {
  color: #16845e;
  background: #edfbf4;
  border-color: #c4e6d4;
}

.ended-icon {
  color: #858ba0;
  background: #f5f6f8;
  border-color: #e3e6ec;
}

.hero-stat-label {
  display: block;
  color: #7c8498;
  font-size: 0.72rem;
}

.hero-stat strong {
  display: block;
  color: #303752;
  font-size: 1rem;
  font-weight: 800;
}

.dashboard-card {
  overflow: hidden;
  border: 1px solid #e8eaf2;
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 2px 8px rgb(15 23 42 / 2.5%);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.4rem;
  border-bottom: 1px solid #eff0f5;
}

.section-heading-main {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.section-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid;
  border-radius: 13px;
  font-size: 1rem;
}

.filter-icon {
  color: var(--primary);
  background: #f0f2ff;
  border-color: #e0e5ff;
}

.table-icon {
  color: #0f9a8a;
  background: #eafaf6;
  border-color: #d2f3e9;
}

.section-title {
  margin: 0;
  color: #30364d;
  font-size: 0.94rem;
  font-weight: 800;
}

.section-heading p {
  margin: 0.3rem 0 0;
  color: #8b91a3;
  font-size: 0.75rem;
}

.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid #e6e8f0;
  border-radius: 0.75rem;
  background: #fff;
  color: #687087;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.35rem 1.4rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.filter-field label {
  color: #60677b;
  font-size: 0.76rem;
  font-weight: 700;
}

.filter-input {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e4e7ef;
  border-radius: 0.8rem;
  background: #fbfcfe;
  font-size: 0.78rem;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: var(--primary);
}

.filter-action-field {
  justify-content: flex-end;
}

.apply-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--primary);
  border-radius: 0.8rem;
  background: var(--primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.table-card {
  min-width: 0;
}

.table-heading {
  border-bottom-color: #eceef5;
}

.assignment-table :deep(.p-datatable-thead > tr > th) {
  padding: 1rem 0.85rem;
  border-color: #edf0f5;
  background: #f8f9fc;
  color: #646c81;
  font-size: 0.73rem;
  font-weight: 800;
}

.assignment-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.85rem;
  border-color: #f0f1f6;
  color: #4e566c;
  font-size: 0.78rem;
}

.table-id {
  color: #8b93a4;
  font-variant-numeric: tabular-nums;
}

.person-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.person-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid;
  border-radius: 12px;
  font-size: 0.9rem;
}

.driver-avatar {
  color: #6366f1;
  background: #f0f0ff;
  border-color: #e2e3ff;
}

.truck-avatar {
  color: #2563eb;
  background: #eff6ff;
  border-color: #dbeafe;
}

.person-cell div {
  display: grid;
  gap: 0.22rem;
}

.person-cell strong {
  color: #293247;
  font-size: 0.78rem;
  font-weight: 750;
}

.person-cell small {
  color: #8a92a2;
  font-size: 0.68rem;
}

.ltr-text {
  direction: ltr;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.table-date {
  color: #6f7889;
  font-size: 0.76rem;
}

.duration-badge {
  display: inline-flex;
  padding: 0.3rem 0.6rem;
  border: 1px solid #e7e9f2;
  border-radius: 0.55rem;
  background: #f8f9fc;
  color: #737b91;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.6rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 750;
}

.status-active {
  color: #087f5b;
  background: #eafaf3;
  border-color: #c9f0df;
}

.status-ended {
  color: #626b7c;
  background: #f5f6f8;
  border-color: #e3e6ec;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.icon-action {
  display: inline-grid;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 0.7rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.action-end {
  color: #b77913;
}

.action-end:hover {
  background: #fff7e6;
  border-color: #f9e4b2;
}

.action-edit {
  color: #2563eb;
}

.action-edit:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.action-delete {
  color: #dc2626;
}

.action-delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  color: #999ce0;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  color: #434a60;
  font-size: 0.9rem;
  font-weight: 800;
}

.empty-state p {
  margin: 0;
  color: #8e94a6;
  font-size: 0.78rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  color: #52596d;
  font-size: 0.78rem;
  font-weight: 700;
}

.required {
  color: #e14d68;
}

.error-text {
  color: #dc2626;
  font-size: 0.72rem;
  margin-top: 0.25rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-textarea {
  width: 100%;
  resize: vertical;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e0e3ed;
  border-radius: 0.8rem;
  font-size: 0.8rem;
  outline: none;
}

.form-textarea:focus {
  border-color: var(--primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eff0f5;
}

.cancel-button {
  padding: 0.7rem 1rem;
  border: 1px solid #e5e7ef;
  border-radius: 0.75rem;
  background: #f8f9fc;
  color: #626a7e;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--primary);
  border-radius: 0.75rem;
  background: var(--primary);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.submit-button.danger {
  border-color: #dc2626;
  background: #dc2626;
}

.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.8rem;
  border: 1px solid;
  border-radius: 0.8rem;
  font-size: 0.75rem;
  line-height: 1.9;
}

.notice-box.warning {
  border-color: #f5e6bf;
  background: #fffbef;
  color: #8a6415;
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(7px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero-content {
    flex-wrap: wrap;
  }

  .hero-footer {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
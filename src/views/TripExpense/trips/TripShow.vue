<!-- src/views/TripExpense/trips/TripShow.vue -->
<template>
  <main class="trip-detail-page" dir="rtl">
    <!-- Loading state -->
    <section v-if="store.loading" class="loading-layout" aria-label="در حال بارگذاری اطلاعات سفر">
      <div class="dashboard-card loading-hero">
        <div class="skeleton skeleton-heading"></div>
        <div class="skeleton skeleton-subheading"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
      <div class="loading-summary">
        <div v-for="item in 3" :key="item" class="dashboard-card loading-summary-card">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>
      <div class="dashboard-card loading-list">
        <div class="skeleton skeleton-heading"></div>
        <div v-for="item in 3" :key="item" class="skeleton-expense">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>
    </section>

    <template v-else-if="trip">
      <!-- Trip header -->
      <section class="dashboard-hero">
        <div class="hero-decoration hero-decoration-one" aria-hidden="true"></div>
        <div class="hero-decoration hero-decoration-two" aria-hidden="true"></div>

        <div class="hero-content">
          <button type="button" class="back-button" @click="goBack">
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
            <span>بازگشت به فهرست سفرها</span>
          </button>

          <div class="hero-main">
            <div class="hero-copy">
              <div class="hero-kicker">
                <span class="hero-kicker-dot" aria-hidden="true"></span>
                جزئیات سفر
              </div>
              <div class="hero-title-row">
                <h1>سفر <span class="trip-id">#{{ trip.id }}</span></h1>
                <span class="status-pill" :class="getStatusClasses(trip.status)">
                  <i :class="getStatusConfig(trip.status).icon" aria-hidden="true"></i>
                  {{ getStatusConfig(trip.status).label }}
                </span>
              </div>
              <div class="hero-route">
                <span>{{ trip.origin || 'مبدأ نامشخص' }}</span>
                <i class="pi pi-arrow-left" aria-hidden="true"></i>
                <span>{{ trip.destination || 'مقصد نامشخص' }}</span>
              </div>
            </div>

            <button
                v-if="canCreateExpense && trip.status === 'in_progress'"
                type="button"
                class="primary-button hero-action"
                @click="router.push({ name: 'trip-expense.expenses.create', params: { tripId: trip.id } })"
            >
              <i class="pi pi-plus" aria-hidden="true"></i>
              ثبت هزینه جدید
            </button>
          </div>
        </div>
      </section>

      <!-- Trip summary -->
      <section class="summary-grid" aria-label="خلاصه اطلاعات سفر">
        <article class="dashboard-card summary-card">
          <div class="summary-icon driver-icon"><i class="pi pi-user" aria-hidden="true"></i></div>
          <div class="summary-copy">
            <span class="summary-label">راننده</span>
            <strong>{{ trip.driver?.name || '—' }}</strong>
            <small>کد پرسنلی: {{ trip.driver?.personnel_code || '—' }}</small>
          </div>
        </article>

        <article class="dashboard-card summary-card">
          <div class="summary-icon truck-icon"><i class="pi pi-truck" aria-hidden="true"></i></div>
          <div class="summary-copy">
            <span class="summary-label">کامیون</span>
            <strong>کد {{ trip.truck?.code || '—' }}</strong>
            <small class="ltr-text">{{ trip.truck?.plate_number || '—' }}</small>
          </div>
        </article>

        <article class="dashboard-card summary-card cost-summary-card">
          <div class="summary-icon expense-icon"><i class="pi pi-wallet" aria-hidden="true"></i></div>
          <div class="summary-copy">
            <span class="summary-label">مجموع هزینه‌ها</span>
            <strong>{{ formatMoney(trip.total_expenses) }}</strong>
            <small>تأییدشده: {{ formatMoney(trip.approved_expenses) }}</small>
          </div>
        </article>
      </section>

      <!-- Budget overview -->
      <section v-if="budget && Object.keys(budget).length" class="dashboard-card budget-section">
        <div class="section-heading">
          <div class="section-icon budget-icon"><i class="pi pi-chart-bar" aria-hidden="true"></i></div>
          <div>
            <h2>وضعیت سقف هزینه‌ها</h2>
            <p>مقایسه هزینه‌های سفر با سقف‌های تعریف‌شده</p>
          </div>
        </div>

        <div class="budget-grid">
          <template v-for="(info, code) in budget" :key="code">
            <div v-if="info.per_trip" class="budget-item">
              <BudgetProgressBar :title="`${getCategoryName(code)} - سقف سفری`" :limit-info="info.per_trip" />
            </div>
            <div v-if="info.monthly" class="budget-item">
              <BudgetProgressBar :title="`${getCategoryName(code)} - سقف ماهانه`" :limit-info="info.monthly" />
            </div>
          </template>
        </div>
      </section>

      <!-- Expenses -->
      <!-- Expenses Table -->
      <div class="dashboard-card overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <i class="pi pi-list text-emerald-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">لیست هزینه‌های سفر</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ expenseStore.pagination.total }} هزینه ثبت شده</p>
            </div>
          </div>
        </div>

        <DataTable
            :value="expenseStore.expenses"
            :loading="expenseStore.loading"
            paginator
            :rows="expenseStore.pagination.per_page"
            :total-records="expenseStore.pagination.total"
            @page="onExpensePage"
            striped-rows
            class="w-full [&_th]:bg-slate-50/80 [&_th]:text-slate-600 [&_th]:font-semibold [&_th]:text-xs [&_th]:py-3.5 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:py-3.5 hover:[&_tr]:bg-violet-50/30 transition-colors"
        >
          <Column field="id" header="#" style="width: 60px" class="text-center text-slate-400 font-mono text-xs" />

          <Column header="دسته‌بندی">
            <template #body="{ data }">
              <span class="text-xs font-medium text-slate-700">{{ data.category?.name || '-' }}</span>
            </template>
          </Column>

          <Column header="مبلغ">
            <template #body="{ data }">
              <span class="font-bold text-slate-800 text-xs">{{ formatMoney(data.amount) }}</span>
            </template>
          </Column>

          <Column header="تاریخ">
            <template #body="{ data }">
              <span class="text-xs text-slate-500 dir-ltr font-mono">{{ toJalali(data.expense_date) }}</span>
            </template>
          </Column>

          <Column header="رسید">
            <template #body="{ data }">
              <button
                  v-if="data.receipt_url"
                  @click="viewReceipt(data)"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 transition-colors text-[11px]"
              >
                <i class="pi pi-image text-[10px]"></i>
                <span>مشاهده</span>
              </button>
              <span v-else class="text-[11px] text-slate-400">—</span>
            </template>
          </Column>

          <Column header="وضعیت">
            <template #body="{ data }">
              <ExpenseStatusBadge :status="data.status" :exceeded="data.exceeded_limit" />
            </template>
          </Column>

          <!-- ✅ ستون جدید: دلیل رد -->
          <Column header="دلیل رد / توضیحات" style="min-width: 200px">
            <template #body="{ data }">
              <!-- حالت رد شده -->
              <div v-if="data.status === 'rejected'" class="flex items-start gap-2">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <i class="pi pi-times-circle text-rose-500 text-[10px]"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-rose-700 leading-relaxed line-clamp-2" :title="data.rejection_reason">
                    {{ data.rejection_reason || 'دلیل رد ثبت نشده است' }}
                  </p>
                  <p v-if="data.approved_at" class="text-[10px] text-slate-400 mt-1 dir-ltr font-mono">
                    {{ data.approved_at }}
                  </p>
                  <button
                      v-if="data.rejection_reason && data.rejection_reason.length > 60"
                      @click="showRejectionDetail(data)"
                      class="text-[10px] text-violet-600 hover:text-violet-700 mt-1 font-medium"
                  >
                    مشاهده کامل...
                  </button>
                </div>
              </div>

              <!-- حالت تایید شده -->
              <div v-else-if="data.status === 'approved'" class="flex items-center gap-2">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <i class="pi pi-check-circle text-emerald-500 text-[10px]"></i>
                </div>
                <span class="text-[11px] text-emerald-600">تایید شده</span>
              </div>

              <!-- حالت در انتظار -->
              <div v-else-if="data.status === 'pending'" class="flex items-start gap-2">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <i class="pi pi-clock text-amber-500 text-[10px]"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-[11px] text-amber-600">در انتظار تایید</span>
                  <!-- ✅ نمایش توضیحات راننده اگر وجود داشته باشد -->
                  <p v-if="data.description" class="text-[10px] text-slate-500 mt-1 line-clamp-1" :title="data.description">
                    توضیح: {{ data.description }}
                  </p>
                  <!-- ✅ نمایش پیام هشدار تجاوز از سقف -->
                  <p v-if="data.exceeded_limit && data.warning_message" class="text-[10px] text-orange-600 mt-1 line-clamp-1" :title="data.warning_message">
                    ⚠️ {{ data.warning_message }}
                  </p>
                </div>
              </div>

              <span v-else class="text-[11px] text-slate-400">—</span>
            </template>
          </Column>

          <Column header="عملیات" style="width: 100px">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <!-- دکمه مشاهده جزئیات -->
                <button
                    @click="showExpenseDetail(data)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-violet-500 hover:bg-violet-50 transition-colors"
                    title="جزئیات کامل"
                >
                  <i class="pi pi-info-circle text-xs"></i>
                </button>
                <button
                    v-if="canDeleteExpense && data.status === 'pending'"
                    @click="deleteExpense(data.id)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                    title="حذف"
                >
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
      <!-- Dialog: جزئیات دلیل رد -->
      <Dialog
          v-model:visible="rejectionDialog.visible"
          modal
          header="دلیل رد هزینه"
          :style="{ width: 'min(500px, calc(100vw - 32px))' }"
          class="rejection-dialog"
      >
        <div v-if="rejectionDialog.expense" class="space-y-4">
          <!-- اطلاعات هزینه -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-slate-500">شناسه:</span>
                <span class="font-mono font-bold text-slate-800 mr-1">#{{ rejectionDialog.expense.id }}</span>
              </div>
              <div>
                <span class="text-slate-500">دسته‌بندی:</span>
                <span class="font-medium text-slate-800 mr-1">{{ rejectionDialog.expense.category?.name }}</span>
              </div>
              <div>
                <span class="text-slate-500">مبلغ:</span>
                <span class="font-bold text-slate-800 mr-1">{{ formatMoney(rejectionDialog.expense.amount) }}</span>
              </div>
              <div>
                <span class="text-slate-500">تاریخ:</span>
                <span class="font-mono text-slate-800 mr-1 dir-ltr">{{ toJalali(rejectionDialog.expense.expense_date) }}</span>
              </div>
            </div>
          </div>

          <!-- باکس دلیل رد -->
          <div class="p-4 rounded-xl bg-rose-50 border border-rose-100">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-exclamation-circle text-rose-600"></i>
              <span class="font-bold text-sm text-rose-800">دلیل رد</span>
            </div>
            <p class="text-sm text-rose-700 leading-relaxed whitespace-pre-line">
              {{ rejectionDialog.expense.rejection_reason || 'دلیل رد ثبت نشده است' }}
            </p>
            <div v-if="rejectionDialog.expense.approved_at" class="mt-3 pt-3 border-t border-rose-100">
                <span class="text-[11px] text-rose-500">
                    رد شده در: <span class="font-mono dir-ltr">{{ rejectionDialog.expense.approved_at }}</span>
                </span>
            </div>
          </div>

          <!-- توضیحات راننده (در صورت وجود) -->
          <div v-if="rejectionDialog.expense.description" class="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-comment text-slate-500"></i>
              <span class="font-bold text-sm text-slate-700">توضیحات راننده</span>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {{ rejectionDialog.expense.description }}
            </p>
          </div>

          <!-- هشدار سقف (در صورت وجود) -->
          <div v-if="rejectionDialog.expense.exceeded_limit && rejectionDialog.expense.warning_message"
               class="p-4 rounded-xl bg-orange-50 border border-orange-100">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-exclamation-triangle text-orange-600"></i>
              <span class="font-bold text-sm text-orange-800">هشدار سقف هزینه</span>
            </div>
            <p class="text-sm text-orange-700 leading-relaxed">
              {{ rejectionDialog.expense.warning_message }}
            </p>
          </div>
        </div>

        <template #footer>
          <button
              type="button"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              @click="rejectionDialog.visible = false"
          >
            بستن
          </button>
        </template>
      </Dialog>

      <!-- Dialog: جزئیات کامل هزینه -->
      <Dialog
          v-model:visible="detailDialog.visible"
          modal
          header="جزئیات کامل هزینه"
          :style="{ width: 'min(550px, calc(100vw - 32px))' }"
      >
        <div v-if="detailDialog.expense" class="space-y-4">
          <!-- اطلاعات اصلی -->
          <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
            <div>
              <span class="block text-[10px] text-slate-500 mb-0.5">شناسه</span>
              <span class="font-mono font-bold text-slate-800">#{{ detailDialog.expense.id }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 mb-0.5">دسته‌بندی</span>
              <span class="font-medium text-slate-800">{{ detailDialog.expense.category?.name }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 mb-0.5">مبلغ</span>
              <span class="font-bold text-violet-700 text-sm">{{ formatMoney(detailDialog.expense.amount) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 mb-0.5">تاریخ هزینه</span>
              <span class="font-mono text-slate-800 dir-ltr text-sm">{{ toJalali(detailDialog.expense.expense_date) }}</span>
            </div>
            <div class="col-span-2">
              <span class="block text-[10px] text-slate-500 mb-0.5">وضعیت</span>
              <ExpenseStatusBadge :status="detailDialog.expense.status" :exceeded="detailDialog.expense.exceeded_limit" />
            </div>
          </div>

          <!-- توضیحات راننده -->
          <div v-if="detailDialog.expense.description" class="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-comment text-slate-500"></i>
              <span class="font-bold text-sm text-slate-700">توضیحات راننده</span>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {{ detailDialog.expense.description }}
            </p>
          </div>

          <!-- دلیل رد -->
          <div v-if="detailDialog.expense.status === 'rejected'" class="p-4 rounded-xl bg-rose-50 border border-rose-100">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-times-circle text-rose-600"></i>
              <span class="font-bold text-sm text-rose-800">دلیل رد</span>
            </div>
            <p class="text-sm text-rose-700 leading-relaxed whitespace-pre-line">
              {{ detailDialog.expense.rejection_reason || 'دلیل رد ثبت نشده است' }}
            </p>
            <div v-if="detailDialog.expense.approved_at" class="mt-3 pt-3 border-t border-rose-100 text-[11px] text-rose-500">
              رد شده در: <span class="font-mono dir-ltr">{{ detailDialog.expense.approved_at }}</span>
            </div>
          </div>

          <!-- هشدار سقف -->
          <div v-if="detailDialog.expense.exceeded_limit && detailDialog.expense.warning_message"
               class="p-4 rounded-xl bg-orange-50 border border-orange-100">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-exclamation-triangle text-orange-600"></i>
              <span class="font-bold text-sm text-orange-800">هشدار سقف هزینه</span>
            </div>
            <p class="text-sm text-orange-700 leading-relaxed">
              {{ detailDialog.expense.warning_message }}
            </p>
          </div>

          <!-- رسید -->
          <div v-if="detailDialog.expense.receipt_url" class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-image text-emerald-600"></i>
                <span class="font-bold text-sm text-emerald-800">رسید هزینه</span>
              </div>
              <button
                  @click="viewReceipt(detailDialog.expense)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium transition-colors"
              >
                مشاهده رسید
              </button>
            </div>
          </div>

          <!-- اطلاعات تایید -->
          <div v-if="detailDialog.expense.status === 'approved'" class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-check-circle text-emerald-600"></i>
              <span class="font-bold text-sm text-emerald-800">تایید شده</span>
            </div>
            <p class="text-[11px] text-emerald-600">
              تایید شده در: <span class="font-mono dir-ltr">{{ detailDialog.expense.approved_at }}</span>
            </p>
          </div>
        </div>

        <template #footer>
          <button
              type="button"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              @click="detailDialog.visible = false"
          >
            بستن
          </button>
        </template>
      </Dialog>
    </template>

    <section v-else class="dashboard-card not-found-state">
      <span class="empty-state-icon"><i class="pi pi-map" aria-hidden="true"></i></span>
      <h2>اطلاعات سفر در دسترس نیست</h2>
      <p>ممکن است سفر حذف شده باشد یا دسترسی مشاهده آن را نداشته باشید.</p>
      <button type="button" class="primary-button" @click="goBack">
        <i class="pi pi-arrow-right" aria-hidden="true"></i>
        بازگشت
      </button>
    </section>

    <!-- تأیید حذف هزینه -->
    <Dialog
        v-model:visible="showDeleteDialog"
        modal
        dir="rtl"
        :closable="!deletingExpense"
        :close-on-escape="!deletingExpense"
        :dismissable-mask="!deletingExpense"
        :style="{ width: 'min(92vw, 440px)' }"
        class="expense-confirm-dialog"
    >
      <template #header>
        <div class="dialog-heading">
          <span class="dialog-icon dialog-icon-danger">
            <i class="pi pi-trash" aria-hidden="true"></i>
          </span>
          <div>
            <h3>حذف هزینه</h3>
            <p>تأیید عملیات حذف</p>
          </div>
        </div>
      </template>

      <div class="dialog-content">
        <h4>آیا از حذف این هزینه اطمینان دارید؟</h4>
        <p>پس از تأیید، این هزینه از فهرست هزینه‌های سفر حذف خواهد شد. در صورت نیاز، قبل از ادامه اطلاعات آن را بررسی کنید.</p>
        <div class="dialog-notice dialog-notice-danger">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <span>این عملیات را فقط در صورت اطمینان انجام دهید.</span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button
              label="انصراف"
              icon="pi pi-times"
              severity="secondary"
              outlined
              :disabled="deletingExpense"
              @click="cancelDeleteExpense"
          />
          <Button
              label="بله، حذف شود"
              icon="pi pi-trash"
              severity="danger"
              :loading="deletingExpense"
              @click="confirmDeleteExpense"
          />
        </div>
      </template>
    </Dialog>

    <!-- پیام‌های عملیات -->
    <Dialog
        v-model:visible="showFeedbackDialog"
        modal
        dir="rtl"
        :style="{ width: 'min(92vw, 410px)' }"
        :closable="!feedbackBusy"
        :close-on-escape="!feedbackBusy"
        :dismissable-mask="!feedbackBusy"
        class="expense-feedback-dialog"
    >
      <div class="feedback-content">
        <span class="feedback-icon" :class="feedbackType === 'success' ? 'feedback-icon-success' : 'feedback-icon-error'">
          <i :class="feedbackType === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'" aria-hidden="true"></i>
        </span>
        <h3>{{ feedbackTitle }}</h3>
        <p>{{ feedbackMessage }}</p>
        <Button
            label="متوجه شدم"
            :severity="feedbackType === 'success' ? 'success' : 'secondary'"
            class="feedback-close-button"
            @click="showFeedbackDialog = false"
        />
      </div>
    </Dialog>
  </main>
</template>

<script setup>
import {computed, ref, onMounted, watch, reactive} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/authold'
import { useTripStore } from '@/stores/tripStore'
import { useTripExpenseStore } from '@/stores/tripExpenseStore'
import ExpenseStatusBadge from '@/components/trip-expense/ExpenseStatusBadge.vue'
import BudgetProgressBar from '@/components/trip-expense/BudgetProgressBar.vue'
import tripExpenseService from '@/services/tripExpenseService'
import {useJalaliDate} from "@/composables/useJalaliDate.js";
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useTripStore()
const expenseStore = useTripExpenseStore()

const trip = computed(() => store.currentTrip)
const budget = ref(null)

const canCreateExpense = computed(() => authStore.can('trip_expense.create_expense'))
const canDeleteExpense = computed(() =>
    authStore.can('trip_expense.create_expense') || authStore.can('trip_expense.manage')
)


// ═══════ Dialogs ═══════
const rejectionDialog = reactive({
  visible: false,
  expense: null,
})

const detailDialog = reactive({
  visible: false,
  expense: null,
})

const showRejectionDetail = (expense) => {
  rejectionDialog.expense = expense
  rejectionDialog.visible = true
}

const showExpenseDetail = (expense) => {
  detailDialog.expense = expense
  detailDialog.visible = true
}


const STATUS_CONFIG = {
  pending: { label: 'در انتظار شروع', icon: 'pi pi-clock', className: 'status-pending' },
  in_progress: { label: 'در حال انجام', icon: 'pi pi-sync', className: 'status-progress' },
  completed: { label: 'پایان یافته', icon: 'pi pi-check-circle', className: 'status-completed' },
  cancelled: { label: 'لغو شده', icon: 'pi pi-times-circle', className: 'status-cancelled' }
}
const getStatusConfig = (status) => STATUS_CONFIG[status] || {
  label: status || 'نامشخص',
  icon: 'pi pi-question-circle',
  className: 'status-unknown'
}
const getStatusClasses = (status) => getStatusConfig(status).className

const totalExpensePages = computed(() => {
  const perPage = Number(expenseStore.pagination.per_page) || 1
  return Math.max(1, Math.ceil((Number(expenseStore.pagination.total) || 0) / perPage))
})

const loadData = async () => {
  const id = route.params.id
  if (!id) return

  await store.fetchTrip(id)
  await expenseStore.fetchExpenses(id)

  try {
    budget.value = await expenseStore.fetchBudget(id)
  } catch (error) {
    budget.value = null
  }
}

const onExpensePage = (event) => {
  expenseStore.pagination.current_page = event.page + 1
  expenseStore.fetchExpenses(route.params.id)
}

const changeExpensePage = (page) => {
  if (page < 1 || page > totalExpensePages.value) return
  expenseStore.pagination.current_page = page
  expenseStore.fetchExpenses(route.params.id)
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'trip-expense.trips.index' })
}

const getCategoryName = (code) => {
  const names = {
    water: 'آب معدنی', lunch: 'ناهار', dinner: 'شام', breakfast: 'صبحانه',
    fuel: 'سوخت', toll: 'عوارض', parking: 'پارکینگ', repair: 'تعمیرات', other: 'سایر'
  }
  return names[code] || code
}

const showDeleteDialog = ref(false)
const deletingExpenseId = ref(null)
const deletingExpense = ref(false)

const showFeedbackDialog = ref(false)
const feedbackTitle = ref('')
const feedbackMessage = ref('')
const feedbackType = ref('error')
const feedbackBusy = ref(false)

const openFeedback = (title, message, type = 'error') => {
  feedbackTitle.value = title
  feedbackMessage.value = message
  feedbackType.value = type
  showFeedbackDialog.value = true
}

const deleteExpense = (id) => {
  deletingExpenseId.value = id
  showDeleteDialog.value = true
}

const cancelDeleteExpense = () => {
  if (deletingExpense.value) return
  showDeleteDialog.value = false
  deletingExpenseId.value = null
}

const confirmDeleteExpense = async () => {
  if (deletingExpenseId.value === null || deletingExpense.value) return

  deletingExpense.value = true
  try {
    await expenseStore.deleteExpense(deletingExpenseId.value)
    showDeleteDialog.value = false
    deletingExpenseId.value = null
    await loadData()
    openFeedback('حذف با موفقیت انجام شد', 'هزینه موردنظر با موفقیت حذف شد.', 'success')
  } catch (error) {
    console.error('خطا در حذف هزینه:', error)
    showDeleteDialog.value = false
    openFeedback('حذف هزینه انجام نشد', 'هنگام حذف هزینه خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  } finally {
    deletingExpense.value = false
  }
}

const viewReceipt = async (expense) => {
  // پنجره باید قبل از درخواست async باز شود تا مرورگر آن را مسدود نکند.
  const receiptWindow = window.open('about:blank', '_blank')
  if (!receiptWindow) {
    openFeedback(
        'بازشدن رسید مسدود شد',
        'مرورگر بازشدن پنجره رسید را مسدود کرده است. اجازه بازشدن پنجره‌های جدید را فعال کنید و دوباره تلاش کنید.'
    )
    return
  }

  try {
    receiptWindow.document.title = 'در حال دریافت رسید...'
    const response = await tripExpenseService.getReceipt(expense.id)
    const blob = new Blob([response.data], {
      type: response.headers?.['content-type'] || 'application/octet-stream'
    })
    const url = window.URL.createObjectURL(blob)
    receiptWindow.location.href = url

    // آدرس موقت پس از بازشدن فایل آزاد می‌شود.
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    console.error('خطا در دریافت رسید:', error)
    receiptWindow.close()
    openFeedback('دریافت رسید ناموفق بود', 'در دریافت فایل رسید خطایی رخ داد. لطفاً اتصال را بررسی کرده و دوباره تلاش کنید.')
  }
}

const formatNumber = (value) => Number(value || 0).toLocaleString('fa-IR')
const formatMoney = (value) => `${formatNumber(value)} تومان`

onMounted(loadData)
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    expenseStore.pagination.current_page = 1
    loadData()
  }
})
</script>

<style scoped>


/* ═══════ Dialog Styles ═══════ */
.rejection-dialog :deep(.p-dialog-header) {
  border-bottom: 1px solid #fecaca;
  background: #fef2f2;
}

.rejection-dialog :deep(.p-dialog-title) {
  color: #991b1b;
  font-weight: 800;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}


.trip-detail-page {
  --trip-primary: #5b4be8;
  --trip-primary-dark: #4636cd;
  --trip-ink: #202940;
  --trip-muted: #737d8f;
  --trip-border: #e7eaf1;
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  color: var(--trip-ink);
  animation: dashboard-enter .28s ease-out both;
}
.trip-detail-page, .trip-detail-page * { box-sizing: border-box; }

.dashboard-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--trip-border);
  border-radius: 1.1rem;
  background: #fff;
  box-shadow: 0 2px 8px rgb(15 23 42 / 3%);
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(1.15rem, 3vw, 2rem);
  border: 1px solid #e4e5ff;
  border-radius: 1.3rem;
  background:
      radial-gradient(circle at 8% 0%, rgb(129 140 248 / 17%), transparent 34%),
      radial-gradient(circle at 92% 100%, rgb(167 139 250 / 14%), transparent 30%),
      linear-gradient(125deg, #f5f6ff 0%, #fbfcff 54%, #f7f4ff 100%);
  box-shadow: 0 8px 28px rgb(49 46 129 / 5%);
}
.hero-decoration { position: absolute; pointer-events: none; border-radius: 50%; filter: blur(45px); }
.hero-decoration-one { top: -95px; left: -55px; width: 210px; height: 210px; background: rgb(129 140 248 / 15%); }
.hero-decoration-two { right: -55px; bottom: -110px; width: 190px; height: 190px; background: rgb(167 139 250 / 15%); }
.hero-content { position: relative; z-index: 1; }
.back-button {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  min-height: 2.25rem;
  margin-bottom: 1rem;
  padding: .4rem .65rem;
  border: 1px solid #e3e5f4;
  border-radius: .7rem;
  color: #606b80;
  background: rgb(255 255 255 / 75%);
  font: inherit;
  font-size: .76rem;
  font-weight: 700;
  cursor: pointer;
  transition: color .15s ease, background .15s ease;
}
.back-button:hover { color: var(--trip-primary); background: #fff; }
.hero-main { display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; }
.hero-copy { min-width: 0; }
.hero-kicker { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; color: #777f93; font-size: .75rem; font-weight: 700; }
.hero-kicker-dot { width: .45rem; height: .45rem; border-radius: 50%; background: #7565e8; box-shadow: 0 0 0 4px rgb(117 101 232 / 12%); }
.hero-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: .7rem; }
.hero-title-row h1 { margin: 0; color: #1b2340; font-size: clamp(1.3rem, 2.5vw, 1.8rem); line-height: 1.55; font-weight: 850; letter-spacing: -.03em; }
.trip-id { font-variant-numeric: tabular-nums; }
.hero-route { display: flex; align-items: center; flex-wrap: wrap; gap: .6rem; margin-top: .4rem; color: #667085; font-size: .9rem; line-height: 1.8; }
.hero-route i { color: #8779e8; font-size: .75rem; }
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  min-height: 2.8rem;
  padding: .7rem 1rem;
  border: 0;
  border-radius: .8rem;
  color: #fff;
  background: linear-gradient(135deg, var(--trip-primary), #7667f4);
  box-shadow: 0 7px 16px rgb(91 75 232 / 20%);
  font: inherit;
  font-size: .82rem;
  font-weight: 750;
  white-space: nowrap;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
}
.primary-button:hover { background: var(--trip-primary-dark); box-shadow: 0 9px 20px rgb(91 75 232 / 24%); }
.primary-button:active { transform: translateY(1px); }

.status-pill { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 1.8rem; padding: .35rem .65rem; border: 1px solid transparent; border-radius: 999px; font-size: .7rem; font-weight: 750; white-space: nowrap; }
.status-pill i { font-size: .72rem; }
.status-pending { color: #596273; background: #f3f5f8; border-color: #e2e6ed; }
.status-progress { color: #2456b3; background: #edf5ff; border-color: #d2e5ff; }
.status-progress i { animation: soft-pulse 1.8s ease-in-out infinite; }
.status-completed { color: #087f5b; background: #eafaf3; border-color: #c9f0df; }
.status-cancelled { color: #b42338; background: #fff0f1; border-color: #ffd7dc; }
.status-unknown { color: #626b7c; background: #f5f6f8; border-color: #e3e6ec; }

.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
.summary-card { display: flex; align-items: center; gap: .8rem; padding: 1rem; }
.summary-icon, .section-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 2.7rem;
  height: 2.7rem;
  border: 1px solid transparent;
  border-radius: .85rem;
  font-size: 1rem;
}
.driver-icon { color: #6454d8; background: #f1efff; border-color: #e5e0ff; }
.truck-icon { color: #2865bd; background: #edf5ff; border-color: #dceaff; }
.expense-icon { color: #07835e; background: #eafaf3; border-color: #d1f2e3; }
.summary-copy { display: grid; gap: .2rem; min-width: 0; }
.summary-label, .meta-label { color: #8991a1; font-size: .69rem; font-weight: 650; }
.summary-copy strong { color: #293247; font-size: .84rem; font-weight: 800; line-height: 1.65; overflow-wrap: anywhere; }
.summary-copy small { color: #8991a1; font-size: .68rem; line-height: 1.65; overflow-wrap: anywhere; }

.budget-section { padding: 1.15rem; }
.section-heading { display: flex; align-items: center; gap: .75rem; min-width: 0; }
.section-heading h2 { margin: 0; color: #202940; font-size: .95rem; font-weight: 850; }
.section-heading p { margin: .2rem 0 0; color: var(--trip-muted); font-size: .74rem; line-height: 1.7; }
.budget-icon { color: #6555d8; background: #f2efff; border-color: #e7e1ff; }
.budget-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin-top: 1rem; }
.budget-item { min-width: 0; padding: .9rem; border: 1px solid #edf0f5; border-radius: .85rem; background: #fafbfe; }

.expenses-section { padding: 0; }
.expenses-heading { padding: 1.1rem 1.2rem; border-bottom: 1px solid #edf0f5; background: linear-gradient(110deg, #fff, #fbfbff); }
.expenses-icon { color: #07835e; background: #eafaf3; border-color: #d1f2e3; }
.section-heading-copy { min-width: 0; }
.expense-count { margin-right: auto; padding: .4rem .65rem; border: 1px solid #e8eaf1; border-radius: 999px; color: #626b7c; background: #f7f8fb; font-size: .72rem; font-weight: 750; white-space: nowrap; }

.mobile-expense-list { display: none; }
.desktop-expense-table { min-width: 0; }
:deep(.expense-data-table .p-datatable-table-container) { overflow-x: auto; }
:deep(.expense-data-table .p-datatable-thead > tr > th) { padding: .9rem .85rem; border-color: #edf0f5; color: #586174; background: #f8f9fc; font-size: .75rem; font-weight: 800; text-align: right; white-space: nowrap; }
:deep(.expense-data-table .p-datatable-tbody > tr > td) { padding: .85rem; border-color: #f0f2f6; color: #364152; font-size: .8rem; vertical-align: middle; }
:deep(.expense-data-table .p-datatable-tbody > tr:hover) { background: #faf9ff; }
:deep(.expense-data-table .p-paginator) { justify-content: center; gap: .35rem; padding: .8rem; border-top: 1px solid #edf0f5; }
:deep(.expense-data-table .p-paginator .p-paginator-page),
:deep(.expense-data-table .p-paginator .p-paginator-prev),
:deep(.expense-data-table .p-paginator .p-paginator-next),
:deep(.expense-data-table .p-paginator .p-paginator-first),
:deep(.expense-data-table .p-paginator .p-paginator-last) { min-width: 2.25rem; height: 2.25rem; border-radius: .65rem; }
:deep(.expense-data-table .p-paginator .p-paginator-page.p-highlight) { color: #fff; background: var(--trip-primary); }
.table-id { color: #8991a1; font-variant-numeric: tabular-nums; }
.table-category { color: #364152; font-size: .78rem; font-weight: 700; }
.table-amount { color: #293247; font-size: .78rem; white-space: nowrap; }
.table-date { color: #6f7889; font-size: .75rem; white-space: nowrap; }
.ltr-text { direction: ltr; text-align: right; font-variant-numeric: tabular-nums; }
.secondary-action { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 2.15rem; padding: .4rem .65rem; border: 1px solid #e4e0ff; border-radius: .65rem; color: #5849cf; background: #f7f6ff; font: inherit; font-size: .72rem; font-weight: 750; cursor: pointer; transition: background .15s ease; }
.secondary-action:hover { background: #eeebff; }
.table-receipt { min-height: 1.9rem; }
.muted-dash { color: #a0a7b4; }
.delete-icon-button, .delete-action { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-width: 2.25rem; min-height: 2.25rem; padding: .45rem; border: 1px solid #ffe0e4; border-radius: .7rem; color: #c2344b; background: #fff5f6; font: inherit; font-size: .75rem; font-weight: 750; cursor: pointer; transition: background .15s ease; }
.delete-icon-button:hover, .delete-action:hover { background: #ffe9ec; }

.empty-state, .not-found-state { display: flex; flex-direction: column; align-items: center; padding: 2.75rem 1.25rem; text-align: center; }
.empty-state-icon { display: grid; place-items: center; width: 3.8rem; height: 3.8rem; border-radius: 1.2rem; color: #7162df; background: #f3f1ff; font-size: 1.4rem; }
.empty-state h3, .not-found-state h2 { margin: .95rem 0 .3rem; color: #293247; font-size: .98rem; font-weight: 850; }
.empty-state p, .not-found-state p { max-width: 28rem; margin: 0; color: #7b8494; font-size: .8rem; line-height: 1.9; }
.empty-create { margin-top: 1rem; }
.not-found-state { gap: .35rem; }
.not-found-state .primary-button { margin-top: .75rem; }

.mobile-pagination { display: none; }
.loading-layout { display: grid; gap: 1rem; }
.loading-hero, .loading-list { padding: 1.25rem; }
.loading-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
.loading-summary-card { display: grid; gap: .75rem; padding: 1rem; }
.skeleton { position: relative; overflow: hidden; border-radius: .6rem; background: #edf0f5; }
.skeleton::after { position: absolute; inset: 0; content: ''; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(255 255 255 / 75%), transparent); animation: shimmer 1.4s infinite; }
.skeleton-heading { width: 10rem; height: 1.25rem; margin-bottom: .9rem; }
.skeleton-subheading { width: 55%; height: .9rem; }
.skeleton-button { width: 8rem; height: 2.7rem; margin-top: 1rem; }
.skeleton-avatar { width: 2.5rem; height: 2.5rem; flex: 0 0 auto; border-radius: .8rem; }
.skeleton-line { width: 38%; height: .85rem; }
.skeleton-line.short { width: 22%; }
.skeleton-expense { display: flex; align-items: center; gap: .85rem; padding: .9rem 0; border-top: 1px solid #f0f2f6; }
.expenses-loading { padding: 0 1.2rem; }

button:focus-visible, :deep(button:focus-visible) { outline: 3px solid rgb(99 102 241 / 35%); outline-offset: 2px; }
@keyframes shimmer { to { transform: translateX(100%); } }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes soft-pulse { 50% { opacity: .55; } }

@media (max-width: 900px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cost-summary-card { grid-column: 1 / -1; }
  .budget-grid { grid-template-columns: minmax(0, 1fr); }
  :deep(.expense-data-table .p-datatable-table) { min-width: 760px; }
}

@media (max-width: 640px) {
  .trip-detail-page { gap: .8rem; }
  .dashboard-hero { padding: 1rem; border-radius: 1.05rem; }
  .back-button { min-height: 2.4rem; margin-bottom: .85rem; font-size: .72rem; }
  .hero-main { align-items: stretch; flex-direction: column; gap: .95rem; }
  .hero-title-row { gap: .5rem; }
  .hero-title-row h1 { font-size: 1.3rem; }
  .hero-route { align-items: flex-start; gap: .45rem; font-size: .82rem; }
  .hero-route span { overflow-wrap: anywhere; }
  .hero-action { width: 100%; min-height: 2.85rem; }
  .summary-grid { grid-template-columns: minmax(0, 1fr); gap: .65rem; }
  .summary-card { padding: .85rem; border-radius: .9rem; }
  .summary-icon { width: 2.45rem; height: 2.45rem; border-radius: .75rem; }
  .cost-summary-card { grid-column: auto; }
  .summary-copy strong { font-size: .82rem; }
  .budget-section { padding: 1rem; border-radius: 1rem; }
  .section-heading { gap: .65rem; }
  .section-icon { width: 2.35rem; height: 2.35rem; border-radius: .75rem; }
  .section-heading h2 { font-size: .88rem; }
  .section-heading p { font-size: .7rem; }
  .budget-grid { gap: .65rem; margin-top: .85rem; }
  .budget-item { padding: .75rem; }
  .expenses-section { border-radius: 1rem; }
  .expenses-heading { padding: .95rem; gap: .6rem; }
  .expenses-icon { width: 2.3rem; height: 2.3rem; }
  .expense-count { padding: .35rem .5rem; font-size: .67rem; }
  .desktop-expense-table { display: none; }
  .mobile-expense-list { display: grid; gap: .7rem; padding: .75rem; }
  .expense-card { min-width: 0; padding: .85rem; border: 1px solid #e8ebf2; border-radius: .9rem; background: #fff; box-shadow: 0 2px 6px rgb(15 23 42 / 2%); }
  .expense-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .65rem; }
  .expense-category { display: flex; align-items: center; gap: .55rem; min-width: 0; }
  .expense-category-icon { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; flex: 0 0 auto; border-radius: .7rem; color: #07835e; background: #eafaf3; font-size: .85rem; }
  .expense-category > div { display: grid; gap: .2rem; min-width: 0; }
  .expense-category strong { color: #293247; font-size: .8rem; font-weight: 800; line-height: 1.6; overflow-wrap: anywhere; }
  .expense-category small { color: #8a92a2; font-size: .65rem; }
  .expense-amount { max-width: 48%; color: #293247; font-size: .78rem; font-weight: 850; line-height: 1.8; text-align: left; overflow-wrap: anywhere; }
  .expense-meta-row { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-top: .85rem; padding-top: .75rem; border-top: 1px solid #f0f2f6; }
  .expense-meta { display: grid; gap: .3rem; min-width: 0; color: #596477; font-size: .73rem; }
  .expense-status-meta { justify-items: start; }
  .expense-meta .ltr-text { font-size: .72rem; }
  .expense-actions { display: flex; align-items: center; justify-content: space-between; gap: .5rem; min-height: 2.35rem; margin-top: .75rem; }
  .receipt-action { min-height: 2.35rem; }
  .no-receipt { display: inline-flex; align-items: center; gap: .4rem; color: #9aa1ae; font-size: .7rem; }
  .delete-action { min-height: 2.35rem; padding: .45rem .7rem; }
  .mobile-pagination { display: flex; align-items: center; justify-content: space-between; gap: .4rem; padding: .8rem; border-top: 1px solid #edf0f5; color: #687184; font-size: .7rem; }
  .page-button { display: inline-flex; align-items: center; justify-content: center; gap: .35rem; min-height: 2.4rem; padding: .45rem .6rem; border: 1px solid #e3e6ef; border-radius: .7rem; color: #5142c8; background: #fff; font: inherit; font-weight: 750; cursor: pointer; }
  .page-button:disabled { color: #a6adba; background: #f8f9fb; cursor: not-allowed; }
  .empty-state, .not-found-state { padding: 2.3rem 1rem; }
  .empty-state p, .not-found-state p { font-size: .76rem; }
  .loading-summary { grid-template-columns: minmax(0, 1fr); gap: .65rem; }
  .loading-summary-card { grid-template-columns: auto 1fr; align-items: center; }
  .loading-summary-card .skeleton-line.short { grid-column: 2; }
}

@media (prefers-reduced-motion: reduce) {
  .trip-detail-page, .skeleton::after, .status-progress i { animation: none !important; }
  *, *::before, *::after { transition-duration: .01ms !important; }
}

/* Dialogهای حذف هزینه و پیام نتیجه */
.dialog-heading { display: flex; align-items: center; gap: 12px; }
.dialog-icon { display: grid; place-items: center; width: 46px; height: 46px; flex-shrink: 0; border-radius: 14px; font-size: 1.15rem; }
.dialog-icon-danger { color: #c24141; background: #fff0f0; }
.dialog-heading h3 { margin: 0; color: #202940; font-size: 1rem; font-weight: 800; }
.dialog-heading p { margin: 4px 0 0; color: #8991a1; font-size: .75rem; }
.dialog-content h4 { margin: 0 0 10px; color: #293247; font-size: .95rem; font-weight: 800; line-height: 1.8; }
.dialog-content > p { margin: 0; color: #697386; font-size: .82rem; line-height: 2; }
.dialog-notice { display: flex; align-items: flex-start; gap: 8px; margin-top: 18px; padding: 12px; border: 1px solid; border-radius: 12px; font-size: .75rem; line-height: 1.9; }
.dialog-notice-danger { border-color: #f4d2d2; color: #a33b3b; background: #fff7f7; }
.dialog-notice i { margin-top: 4px; flex-shrink: 0; }
.dialog-actions { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
.dialog-actions :deep(.p-button) { flex: 1; justify-content: center; min-height: 44px; border-radius: 10px; font-family: inherit; font-size: .8rem; font-weight: 700; }
.feedback-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: .5rem .25rem .1rem; }
.feedback-icon { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 1rem; border-radius: 18px; font-size: 1.65rem; }
.feedback-icon-success { color: #16845b; background: #e9f8f1; }
.feedback-icon-error { color: #c24141; background: #fff0f0; }
.feedback-content h3 { margin: 0 0 .5rem; color: #202940; font-size: 1rem; font-weight: 800; }
.feedback-content p { margin: 0 0 1.25rem; color: #697386; font-size: .83rem; line-height: 2; }
.feedback-close-button { min-width: 130px; min-height: 42px; border-radius: 10px; font-family: inherit; font-weight: 700; }
@media (max-width: 480px) {
  .dialog-actions { flex-direction: column-reverse; }
  .dialog-actions :deep(.p-button) { width: 100%; }
}

</style>

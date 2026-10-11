<!-- src/views/TripExpense/reports/ReportDashboard.vue -->

<template>
  <div class="report-page" dir="rtl">
    <!-- ═════════════════════════════════════════════
    HERO SECTION
    ═════════════════════════════════════════════ -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="hero-content">
        <div class="hero-icon">
          <i class="pi pi-chart-bar"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="hero-title">داشبورد گزارش‌گیری</h1>
            <span class="hero-badge">
                            <i class="pi pi-chart-line"></i>
                            تحلیل هزینه‌های سفر
                        </span>
          </div>
          <p class="hero-subtitle">
            تحلیل جامع هزینه‌های سفر رانندگان بر اساس معیارهای مختلف
          </p>
        </div>
        <button
            type="button"
            class="hero-refresh"
            :disabled="loading"
            @click="refreshAll"
        >
          <i class="pi pi-refresh" :class="{ 'animate-spin': loading }"></i>
          <span>بروزرسانی</span>
        </button>
      </div>
    </section>

    <!-- ═════════════════════════════════════════════
    FILTERS
    ═════════════════════════════════════════════ -->
    <section class="dashboard-card">
      <div class="section-heading">
        <div class="section-heading-main">
                    <span class="section-icon filter-section-icon">
                        <i class="pi pi-filter"></i>
                    </span>
          <div>
            <h2 class="section-title">فیلتر گزارش</h2>
            <p>بازه زمانی و معیارهای موردنظر را انتخاب کنید.</p>
          </div>
        </div>
        <button type="button" class="reset-button" @click="resetFilters">
          <i class="pi pi-refresh"></i>
          <span>بازنشانی</span>
        </button>
      </div>
      <div class="filter-grid">
        <div class="filter-field">
          <label>از تاریخ</label>
          <DatePicker
              v-model="filters.from_date"
              date-format="yy/mm/dd"
              placeholder="انتخاب تاریخ"
              class="w-full"
              @date-select="applyFilters"
          />
        </div>
        <div class="filter-field">
          <label>تا تاریخ</label>
          <DatePicker
              v-model="filters.to_date"
              date-format="yy/mm/dd"
              placeholder="انتخاب تاریخ"
              class="w-full"
              @date-select="applyFilters"
          />
        </div>
        <div class="filter-field">
          <label>راننده</label>
          <Select
              v-model="filters.driver_id"
              :options="drivers"
              option-label="name"
              option-value="id"
              placeholder="همه رانندگان"
              show-clear
              filter
              class="w-full"
              @change="applyFilters"
          />
        </div>
        <div class="filter-field">
          <label>کامیون</label>
          <Select
              v-model="filters.truck_id"
              :options="trucks"
              option-label="display"
              option-value="id"
              placeholder="همه کامیون‌ها"
              show-clear
              filter
              class="w-full"
              @change="applyFilters"
          />
        </div>
        <div class="filter-field">
          <label>دسته‌بندی</label>
          <Select
              v-model="filters.category_id"
              :options="categories"
              option-label="name"
              option-value="id"
              placeholder="همه دسته‌ها"
              show-clear
              filter
              class="w-full"
              @change="applyFilters"
          />
        </div>
        <div class="filter-field filter-action-field">
          <label class="invisible">اعمال فیلتر</label>
          <button type="button" class="apply-button" @click="applyFilters">
            <i class="pi pi-search"></i>
            <span>اعمال فیلتر</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ═════════════════════════════════════════════
    KPI CARDS
    ═════════════════════════════════════════════ -->
    <section class="kpi-grid">
      <div class="kpi-card kpi-primary">
        <div class="kpi-icon">
          <i class="pi pi-wallet"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">مجموع هزینه‌ها</span>
          <strong class="kpi-value">{{ formatMoney(summary.total_expenses) }}</strong>
          <span class="kpi-meta">{{ formatNumber(summary.total_count) }} هزینه ثبت شده</span>
        </div>
      </div>

      <div class="kpi-card kpi-success">
        <div class="kpi-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">تایید شده</span>
          <strong class="kpi-value">{{ formatMoney(summary.total_approved) }}</strong>
          <span class="kpi-meta">
                        {{ summary.total_expenses > 0 ? Math.round((summary.total_approved / summary.total_expenses) * 100) : 0 }}% از کل
                    </span>
        </div>
      </div>

      <div class="kpi-card kpi-warning">
        <div class="kpi-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">در انتظار تایید</span>
          <strong class="kpi-value">{{ formatMoney(summary.total_pending) }}</strong>
          <span class="kpi-meta">نیاز به بررسی</span>
        </div>
      </div>

      <div class="kpi-card kpi-danger">
        <div class="kpi-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">تجاوز از سقف</span>
          <strong class="kpi-value">{{ formatNumber(summary.exceeded_count) }}</strong>
          <span class="kpi-meta">مورد نیاز به پیگیری</span>
        </div>
      </div>

      <div class="kpi-card kpi-info">
        <div class="kpi-icon">
          <i class="pi pi-map"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">تعداد سفرها</span>
          <strong class="kpi-value">{{ formatNumber(summary.total_trips) }}</strong>
          <span class="kpi-meta">سفر در بازه انتخابی</span>
        </div>
      </div>

      <div class="kpi-card kpi-purple">
        <div class="kpi-icon">
          <i class="pi pi-calculator"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">میانگین هر سفر</span>
          <strong class="kpi-value">{{ formatMoney(summary.avg_per_trip) }}</strong>
          <span class="kpi-meta">میانگین هزینه هر سفر</span>
        </div>
      </div>
    </section>

    <!-- ═════════════════════════════════════════════
    TABS
    ═════════════════════════════════════════════ -->
    <section class="dashboard-card">
      <div class="tabs-header">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="tab-button"
            :class="{ 'tab-active': activeTab === tab.key }"
            @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div class="tabs-content">
        <!-- ═══════ تب ماهانه ═══════ -->
        <div v-if="activeTab === 'monthly'" class="tab-panel">
          <div class="chart-container">
            <h3 class="chart-title">
              <i class="pi pi-chart-line"></i>
              روند هزینه‌ها در طول زمان
            </h3>
            <div class="chart-wrapper">
              <canvas ref="monthlyChartRef"></canvas>
            </div>
          </div>
        </div>

        <!-- ═══════ تب رانندگان ═══════ -->
        <div v-if="activeTab === 'drivers'" class="tab-panel">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="chart-container">
              <h3 class="chart-title">
                <i class="pi pi-chart-bar"></i>
                هزینه‌ها بر اساس راننده
              </h3>
              <div class="chart-wrapper">
                <canvas ref="driverChartRef"></canvas>
              </div>
            </div>
            <div class="report-table-container">
              <h3 class="chart-title">
                <i class="pi pi-table"></i>
                جدول جزئیات رانندگان
              </h3>
              <DataTable :value="driverReport" striped-rows class="report-table">
                <Column field="driver_name" header="راننده">
                  <template #body="{ data }">
                    <div class="person-cell">
                      <span class="person-avatar"><i class="pi pi-user"></i></span>
                      <div>
                        <strong>{{ data.driver_name }}</strong>
                        <small>کد: {{ data.personnel_code }}</small>
                      </div>
                    </div>
                  </template>
                </Column>
                <Column header="مبلغ کل">
                  <template #body="{ data }">
                    <strong>{{ formatMoney(data.total_amount) }}</strong>
                  </template>
                </Column>
                <Column field="total_count" header="تعداد">
                  <template #body="{ data }">
                    <span class="count-badge">{{ data.total_count }}</span>
                  </template>
                </Column>
                <Column header="تجاوز">
                  <template #body="{ data }">
                                        <span :class="data.exceeded_count > 0 ? 'exceeded-badge' : 'normal-badge'">
                                            {{ data.exceeded_count }}
                                        </span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>

        <!-- ═══════ تب دسته‌بندی ═══════ -->
        <div v-if="activeTab === 'categories'" class="tab-panel">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="chart-container">
              <h3 class="chart-title">
                <i class="pi pi-chart-pie"></i>
                سهم هر دسته‌بندی
              </h3>
              <div class="chart-wrapper chart-wrapper-sm">
                <canvas ref="categoryChartRef"></canvas>
              </div>
            </div>
            <div class="report-table-container">
              <h3 class="chart-title">
                <i class="pi pi-table"></i>
                جدول جزئیات دسته‌بندی‌ها
              </h3>
              <DataTable :value="categoryReport" striped-rows class="report-table">
                <Column field="category_name" header="دسته‌بندی">
                  <template #body="{ data }">
                    <span class="category-badge">{{ data.category_name }}</span>
                  </template>
                </Column>
                <Column header="مبلغ کل">
                  <template #body="{ data }">
                    <strong>{{ formatMoney(data.total_amount) }}</strong>
                  </template>
                </Column>
                <Column field="total_count" header="تعداد">
                  <template #body="{ data }">
                    <span class="count-badge">{{ data.total_count }}</span>
                  </template>
                </Column>
                <Column header="میانگین">
                  <template #body="{ data }">
                    <span class="avg-text">{{ formatMoney(data.avg_amount) }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>

        <!-- ═══════ تب کامیون‌ها ═══════ -->
        <div v-if="activeTab === 'trucks'" class="tab-panel">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="chart-container">
              <h3 class="chart-title">
                <i class="pi pi-chart-bar"></i>
                هزینه‌ها بر اساس کامیون
              </h3>
              <div class="chart-wrapper">
                <canvas ref="truckChartRef"></canvas>
              </div>
            </div>
            <div class="report-table-container">
              <h3 class="chart-title">
                <i class="pi pi-table"></i>
                جدول جزئیات کامیون‌ها
              </h3>
              <DataTable :value="truckReport" striped-rows class="report-table">
                <Column header="کامیون">
                  <template #body="{ data }">
                    <div class="person-cell">
                      <span class="person-avatar truck-avatar"><i class="pi pi-truck"></i></span>
                      <div>
                        <strong>کد {{ data.truck_code }}</strong>
                        <small class="ltr-text">{{ data.plate_number }}</small>
                      </div>
                    </div>
                  </template>
                </Column>
                <Column header="مبلغ کل">
                  <template #body="{ data }">
                    <strong>{{ formatMoney(data.total_amount) }}</strong>
                  </template>
                </Column>
                <Column field="total_trips" header="تعداد سفر">
                  <template #body="{ data }">
                    <span class="count-badge">{{ data.total_trips }}</span>
                  </template>
                </Column>
                <Column field="total_count" header="تعداد هزینه">
                  <template #body="{ data }">
                    <span class="count-badge">{{ data.total_count }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>

        <!-- ═══════ تب مسیرها ═══════ -->
        <div v-if="activeTab === 'routes'" class="tab-panel">
          <div class="report-table-container full-width">
            <h3 class="chart-title">
              <i class="pi pi-map"></i>
              گزارش هزینه‌ها بر اساس مسیر
            </h3>
            <DataTable :value="routeReport" striped-rows class="report-table">
              <Column field="route_name" header="مسیر">
                <template #body="{ data }">
                  <div class="route-cell">
                    <span class="route-origin">{{ data.origin }}</span>
                    <i class="pi pi-arrow-left"></i>
                    <span class="route-destination">{{ data.destination }}</span>
                  </div>
                </template>
              </Column>
              <Column header="مبلغ کل">
                <template #body="{ data }">
                  <strong>{{ formatMoney(data.total_amount) }}</strong>
                </template>
              </Column>
              <Column field="total_trips" header="تعداد سفر">
                <template #body="{ data }">
                  <span class="count-badge">{{ data.total_trips }}</span>
                </template>
              </Column>
              <Column field="total_count" header="تعداد هزینه">
                <template #body="{ data }">
                  <span class="count-badge">{{ data.total_count }}</span>
                </template>
              </Column>
              <Column header="میانگین هر سفر">
                <template #body="{ data }">
                                    <span class="avg-text">
                                        {{ formatMoney(data.total_trips > 0 ? data.total_amount / data.total_trips : 0) }}
                                    </span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- ═══════ تب وضعیت تایید ═══════ -->
        <div v-if="activeTab === 'status'" class="tab-panel">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="chart-container">
              <h3 class="chart-title">
                <i class="pi pi-chart-pie"></i>
                توزیع وضعیت تایید
              </h3>
              <div class="chart-wrapper chart-wrapper-sm">
                <canvas ref="statusChartRef"></canvas>
              </div>
            </div>
            <div class="report-table-container">
              <h3 class="chart-title">
                <i class="pi pi-table"></i>
                جدول وضعیت‌ها
              </h3>
              <DataTable :value="statusReport" striped-rows class="report-table">
                <Column header="وضعیت">
                  <template #body="{ data }">
                                        <span class="status-pill" :class="`status-${data.status}`">
                                            <i :class="getStatusIcon(data.status)"></i>
                                            {{ getStatusLabel(data.status) }}
                                        </span>
                  </template>
                </Column>
                <Column header="مبلغ">
                  <template #body="{ data }">
                    <strong>{{ formatMoney(data.total_amount) }}</strong>
                  </template>
                </Column>
                <Column field="total_count" header="تعداد">
                  <template #body="{ data }">
                    <span class="count-badge">{{ data.total_count }}</span>
                  </template>
                </Column>
                <Column header="درصد">
                  <template #body="{ data }">
                                        <span class="percent-text">
                                            {{ summary.total_count > 0 ? Math.round((data.total_count / summary.total_count) * 100) : 0 }}%
                                        </span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>

        <!-- ═══════ تب ریز جزئیات ═══════ -->
        <div v-if="activeTab === 'details'" class="tab-panel">
          <div class="report-table-container full-width">
            <div class="flex items-center justify-between mb-4">
              <h3 class="chart-title">
                <i class="pi pi-list"></i>
                ریز جزئیات هزینه‌ها
              </h3>
              <button
                  v-if="canExport"
                  type="button"
                  class="export-button"
                  @click="exportToExcel"
                  :disabled="exporting"
              >
                <i :class="exporting ? 'pi pi-spin pi-spinner' : 'pi pi-file-excel'"></i>
                <span>{{ exporting ? 'در حال خروجی...' : 'خروجی Excel' }}</span>
              </button>
            </div>

            <!-- فیلترهای پیشرفته -->
            <div class="details-filters">
              <div class="filter-row">
                <div class="filter-field">
                  <label>راننده</label>
                  <Select
                      v-model="detailsFilters.driver_id"
                      :options="drivers"
                      option-label="name"
                      option-value="id"
                      placeholder="همه رانندگان"
                      show-clear
                      filter
                      class="w-full"
                      @change="loadDetailsReport"
                  />
                </div>
                <div class="filter-field">
                  <label>کامیون</label>
                  <Select
                      v-model="detailsFilters.truck_id"
                      :options="trucks"
                      option-label="display"
                      option-value="id"
                      placeholder="همه کامیون‌ها"
                      show-clear
                      filter
                      class="w-full"
                      @change="loadDetailsReport"
                  />
                </div>
                <div class="filter-field">
                  <label>دسته‌بندی</label>
                  <Select
                      v-model="detailsFilters.category_id"
                      :options="categories"
                      option-label="name"
                      option-value="id"
                      placeholder="همه دسته‌ها"
                      show-clear
                      filter
                      class="w-full"
                      @change="loadDetailsReport"
                  />
                </div>
                <div class="filter-field">
                  <label>وضعیت</label>
                  <Select
                      v-model="detailsFilters.status"
                      :options="statusOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="همه وضعیت‌ها"
                      show-clear
                      class="w-full"
                      @change="loadDetailsReport"
                  />
                </div>
              </div>
              <div class="filter-row">
                <div class="filter-field">
                  <label>تجاوز از سقف</label>
                  <Select
                      v-model="detailsFilters.exceeded_only"
                      :options="exceededOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="همه"
                      class="w-full"
                      @change="loadDetailsReport"
                  />
                </div>
                <div class="filter-field flex-2">
                  <label>جستجو در توضیحات</label>
                  <input
                      v-model="detailsFilters.search"
                      type="text"
                      placeholder="جستجو در توضیحات، دلیل رد..."
                      class="details-search-input"
                      @input="debounceSearchDetails"
                  />
                </div>
                <div class="filter-field filter-action">
                  <label class="invisible">اعمال</label>
                  <button type="button" class="reset-details-button" @click="resetDetailsFilters">
                    <i class="pi pi-refresh"></i>
                    <span>بازنشانی</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- جدول جزئیات -->
            <DataTable
                :value="detailsReport"
                :loading="detailsLoading"
                lazy
                paginator
                dataKey="id"
                :first="(detailsPagination.current_page - 1) * detailsPagination.per_page"
                :rows="detailsPagination.per_page"
                :totalRecords="detailsPagination.total"
                :rowsPerPageOptions="[25, 50, 100]"
                @page="onDetailsPage"
                striped-rows
                class="details-table"
                scrollable
                scrollHeight="600px"
            >
              <template #empty>
                <div class="empty-state">
                  <i class="pi pi-inbox empty-icon"></i>
                  <h3>هزینه‌ای یافت نشد</h3>
                  <p>فیلترها را تغییر دهید یا بازه زمانی را گسترش دهید.</p>
                </div>
              </template>

              <Column field="id" header="#" style="width: 70px" frozen>
                <template #body="{ data }">
                  <span class="table-id">#{{ data.id }}</span>
                </template>
              </Column>

              <Column header="راننده" style="min-width: 160px">
                <template #body="{ data }">
                  <div class="person-cell">
                    <span class="person-avatar"><i class="pi pi-user"></i></span>
                    <div>
                      <strong>{{ data.driver?.name || '—' }}</strong>
                      <small>کد: {{ data.driver?.personnel_code || '—' }}</small>
                    </div>
                  </div>
                </template>
              </Column>

              <Column header="کامیون" style="min-width: 140px">
                <template #body="{ data }">
                  <div class="person-cell">
                    <span class="person-avatar truck-avatar"><i class="pi pi-truck"></i></span>
                    <div>
                      <strong>کد {{ data.truck?.code || '—' }}</strong>
                      <small class="ltr-text">{{ data.truck?.plate_number || '—' }}</small>
                    </div>
                  </div>
                </template>
              </Column>

              <Column header="مسیر" style="min-width: 180px">
                <template #body="{ data }">
                  <div class="route-cell">
                    <span class="route-origin">{{ data.trip?.origin || '—' }}</span>
                    <i class="pi pi-arrow-left"></i>
                    <span class="route-destination">{{ data.trip?.destination || '—' }}</span>
                  </div>
                </template>
              </Column>

              <Column header="دسته‌بندی" style="min-width: 120px">
                <template #body="{ data }">
                  <span class="category-badge">{{ data.category?.name || '—' }}</span>
                </template>
              </Column>

              <Column header="مبلغ" style="min-width: 130px">
                <template #body="{ data }">
                  <strong class="money-text">{{ formatMoney(data.amount) }}</strong>
                </template>
              </Column>

              <Column header="تاریخ هزینه" style="min-width: 110px">
                <template #body="{ data }">
                  <span class="ltr-text table-date">{{ toJalali(data.expense_date) || '—' }}</span>
                </template>
              </Column>

              <Column header="وضعیت" style="min-width: 120px">
                <template #body="{ data }">
                    <span class="status-pill" :class="`status-${data.status}`">
                        <i :class="getStatusIcon(data.status)"></i>
                        {{ data.status_label }}
                    </span>
                </template>
              </Column>

              <Column header="تجاوز از سقف" style="min-width: 100px">
                <template #body="{ data }">
                    <span v-if="data.exceeded_limit" class="exceeded-badge">
                        <i class="pi pi-exclamation-triangle"></i>
                        بله
                    </span>
                  <span v-else class="normal-text">خیر</span>
                </template>
              </Column>

              <Column header="رسید" style="min-width: 90px">
                <template #body="{ data }">
                  <button
                      v-if="data.receipt_url"
                      type="button"
                      class="receipt-button"
                      @click="viewReceipt(data)"
                  >
                    <i class="pi pi-image"></i>
                    مشاهده
                  </button>
                  <span v-else class="muted-text">—</span>
                </template>
              </Column>

              <Column header="عملیات" style="width: 80px" frozen alignFrozen="right">
                <template #body="{ data }">
                  <button
                      type="button"
                      class="icon-action action-view"
                      title="جزئیات کامل"
                      @click="showExpenseDetail(data)"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                </template>
              </Column>
            </DataTable>

            <!-- Dialog جزئیات کامل -->
            <Dialog
                v-model:visible="detailDialog.visible"
                modal
                header="جزئیات کامل هزینه"
                :style="{ width: 'min(600px, calc(100vw - 32px))' }"
            >
              <div v-if="detailDialog.expense" class="expense-detail-content">
                <!-- اطلاعات اصلی -->
                <div class="detail-section">
                  <h4><i class="pi pi-info-circle"></i> اطلاعات اصلی</h4>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">شناسه:</span>
                      <span class="detail-value">#{{ detailDialog.expense.id }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">مبلغ:</span>
                      <span class="detail-value money-text">{{ formatMoney(detailDialog.expense.amount) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">تاریخ هزینه:</span>
                      <span class="detail-value ltr-text">{{ toJalali(detailDialog.expense.expense_date) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">وضعیت:</span>
                      <span class="status-pill" :class="`status-${detailDialog.expense.status}`">
                                {{ detailDialog.expense.status_label }}
                            </span>
                    </div>
                  </div>
                </div>

                <!-- اطلاعات سفر -->
                <div class="detail-section">
                  <h4><i class="pi pi-map"></i> اطلاعات سفر</h4>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">مبدأ:</span>
                      <span class="detail-value">{{ detailDialog.expense.trip?.origin }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">مقصد:</span>
                      <span class="detail-value">{{ detailDialog.expense.trip?.destination }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">تاریخ شروع سفر:</span>
                      <span class="detail-value ltr-text">{{ toJalali(detailDialog.expense.trip?.start_date) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">تاریخ پایان سفر:</span>
                      <span class="detail-value ltr-text">{{ toJalali(detailDialog.expense.trip?.end_date) || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- اطلاعات راننده و کامیون -->
                <div class="detail-section">
                  <h4><i class="pi pi-users"></i> راننده و کامیون</h4>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">راننده:</span>
                      <span class="detail-value">{{ detailDialog.expense.driver?.name }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">کد پرسنلی:</span>
                      <span class="detail-value ltr-text">{{ detailDialog.expense.driver?.personnel_code }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">کامیون:</span>
                      <span class="detail-value">کد {{ detailDialog.expense.truck?.code }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">پلاک:</span>
                      <span class="detail-value ltr-text">{{ detailDialog.expense.truck?.plate_number }}</span>
                    </div>
                  </div>
                </div>

                <!-- دسته‌بندی -->
                <div class="detail-section">
                  <h4><i class="pi pi-tag"></i> دسته‌بندی</h4>
                  <div class="detail-item">
                    <span class="detail-label">دسته:</span>
                    <span class="detail-value">{{ detailDialog.expense.category?.name }}</span>
                  </div>
                </div>

                <!-- توضیحات -->
                <div v-if="detailDialog.expense.description" class="detail-section">
                  <h4><i class="pi pi-comment"></i> توضیحات راننده</h4>
                  <p class="detail-text">{{ detailDialog.expense.description }}</p>
                </div>

                <!-- هشدار سقف -->
                <div v-if="detailDialog.expense.exceeded_limit && detailDialog.expense.warning_message" class="detail-section warning-section">
                  <h4><i class="pi pi-exclamation-triangle"></i> هشدار سقف هزینه</h4>
                  <p class="detail-text">{{ detailDialog.expense.warning_message }}</p>
                </div>

                <!-- دلیل رد -->
                <div v-if="detailDialog.expense.status === 'rejected' && detailDialog.expense.rejection_reason" class="detail-section rejected-section">
                  <h4><i class="pi pi-times-circle"></i> دلیل رد</h4>
                  <p class="detail-text">{{ detailDialog.expense.rejection_reason }}</p>
                  <div v-if="detailDialog.expense.approved_at" class="detail-meta">
                    رد شده در: <span class="ltr-text">{{ detailDialog.expense.approved_at }}</span>
                  </div>
                </div>

                <!-- تاییدکننده -->
                <div v-if="detailDialog.expense.approver" class="detail-section">
                  <h4><i class="pi pi-check-circle"></i> تاییدکننده</h4>
                  <div class="detail-item">
                    <span class="detail-label">نام:</span>
                    <span class="detail-value">{{ detailDialog.expense.approver.name }}</span>
                  </div>
                  <div v-if="detailDialog.expense.approved_at" class="detail-meta">
                    تایید شده در: <span class="ltr-text">{{ detailDialog.expense.approved_at }}</span>
                  </div>
                </div>

                <!-- رسید -->
                <div v-if="detailDialog.expense.receipt_url" class="detail-section">
                  <h4><i class="pi pi-image"></i> رسید هزینه</h4>
                  <button
                      type="button"
                      class="view-receipt-button"
                      @click="viewReceipt(detailDialog.expense)"
                  >
                    <i class="pi pi-eye"></i>
                    مشاهده رسید
                  </button>
                </div>
              </div>

              <template #footer>
                <button
                    type="button"
                    class="cancel-button"
                    @click="detailDialog.visible = false"
                >
                  بستن
                </button>
              </template>
            </Dialog>
          </div>
        </div>
      </div>
    </section>


    <!-- پنجره نمایش تصویر رسید -->
    <Dialog
        v-model:visible="receiptDialog.visible"
        modal
        header="مشاهده رسید هزینه"
        :style="{ width: 'min(900px, calc(100vw - 24px))' }"
        :breakpoints="{ '640px': '95vw' }"
        @hide="clearReceiptImage"
    >
      <div class="receipt-preview">
        <div v-if="receiptDialog.loading" class="receipt-message">
          <i class="pi pi-spin pi-spinner"></i>
          در حال دریافت تصویر رسید...
        </div>

        <div v-else-if="receiptDialog.error" class="receipt-message receipt-error">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ receiptDialog.error }}</span>
          <button type="button" @click="retryReceipt">
            تلاش مجدد
          </button>
        </div>

        <img
            v-else-if="receiptDialog.imageUrl"
            :src="receiptDialog.imageUrl"
            alt="تصویر رسید هزینه سفر"
            class="receipt-preview-image"
        />
      </div>
    </Dialog>
  </div>

</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import tripExpenseService from '@/services/tripExpenseService'
import { useExpenseCategoryStore } from '@/stores/expenseCategoryStore'
import { useTruckStore } from '@/stores/truckStore'
import api from '@/api/axios.js'

Chart.register(...registerables)

const categoryStore = useExpenseCategoryStore()
const truckStore = useTruckStore()
import {useJalaliDate} from "@/composables/useJalaliDate.js";
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()

// ═══════ State ═══════
const loading = ref(false)
const activeTab = ref('monthly')
const drivers = ref([])
const categories = ref([])
const trucks = ref([])

const summary = reactive({
  total_expenses: 0,
  total_approved: 0,
  total_pending: 0,
  total_rejected: 0,
  exceeded_count: 0,
  total_count: 0,
  total_trips: 0,
  avg_per_trip: 0,
})

const driverReport = ref([])
const categoryReport = ref([])
const truckReport = ref([])
const routeReport = ref([])
const monthlyReport = ref([])
const statusReport = ref([])

// Chart refs
const monthlyChartRef = ref(null)
const driverChartRef = ref(null)
const categoryChartRef = ref(null)
const truckChartRef = ref(null)
const statusChartRef = ref(null)

// Chart instances
let monthlyChart = null
let driverChart = null
let categoryChart = null
let truckChart = null
let statusChart = null



// ═══════ State برای تب جزئیات ═══════
const detailsReport = ref([])
const detailsLoading = ref(false)
const exporting = ref(false)
const detailsPagination = reactive({
  current_page: 1,
  per_page: 25,
  total: 0,
})

const detailsFilters = reactive({
  driver_id: null,
  truck_id: null,
  category_id: null,
  status: null,
  exceeded_only: false,
  search: '',
})

const detailDialog = reactive({
  visible: false,
  expense: null,
})

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: null },
  { label: 'در انتظار تایید', value: 'pending' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'رد شده', value: 'rejected' },
]

const exceededOptions = [
  { label: 'همه', value: false },
  { label: 'فقط تجاوز از سقف', value: true },
]

// ═══════ Methods برای تب جزئیات ═══════
const loadDetailsReport = async () => {
  detailsLoading.value = true
  try {
    const params = {
      ...buildParams(),
      page: detailsPagination.current_page,
      per_page: detailsPagination.per_page,
    }

    if (detailsFilters.driver_id) params.driver_id = detailsFilters.driver_id
    if (detailsFilters.truck_id) params.truck_id = detailsFilters.truck_id
    if (detailsFilters.category_id) params.category_id = detailsFilters.category_id
    if (detailsFilters.status) params.status = detailsFilters.status
    if (detailsFilters.exceeded_only) params.exceeded_limit = 1
    if (detailsFilters.search) params.search = detailsFilters.search

    const response = await tripExpenseService.getReportExpenseDetails(params)

    if (response.data && Array.isArray(response.data)) {
      detailsReport.value = response.data
      if (response.meta) {
        detailsPagination.current_page = response.meta.current_page
        detailsPagination.per_page = response.meta.per_page
        detailsPagination.total = response.meta.total
      }
    } else {
      detailsReport.value = []
      detailsPagination.total = 0
    }
  } catch (error) {
    console.error('Error loading details report:', error)
    detailsReport.value = []
  } finally {
    detailsLoading.value = false
  }
}

const onDetailsPage = (event) => {
  detailsPagination.current_page = event.page + 1
  detailsPagination.per_page = event.rows
  loadDetailsReport()
}

const resetDetailsFilters = () => {
  detailsFilters.driver_id = null
  detailsFilters.truck_id = null
  detailsFilters.category_id = null
  detailsFilters.status = null
  detailsFilters.exceeded_only = false
  detailsFilters.search = ''
  detailsPagination.current_page = 1
  loadDetailsReport()
}

let searchTimeout
const debounceSearchDetails = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    detailsPagination.current_page = 1
    loadDetailsReport()
  }, 500)
}

const showExpenseDetail = (expense) => {
  detailDialog.expense = expense
  detailDialog.visible = true
}



const exportToExcel = async () => {
  exporting.value = true
  try {
    // TODO: پیاده‌سازی export به Excel
    alert('قابلیت خروجی Excel به زودی اضافه می‌شود')
  } catch (error) {
    console.error('Error exporting:', error)
    alert('خطا در خروجی گرفتن')
  } finally {
    exporting.value = false
  }
}

const getStatusIcon = (status) => {
  const icons = {
    pending: 'pi pi-clock',
    approved: 'pi pi-check-circle',
    rejected: 'pi pi-times-circle',
  }
  return icons[status] || 'pi pi-question'
}

// ═══════ Watch برای تغییر تب ═══════
watch(activeTab, async (newTab) => {
  await nextTick()
  switch (newTab) {
    case 'monthly': renderMonthlyChart(); break
    case 'drivers': renderDriverChart(); break
    case 'categories': renderCategoryChart(); break
    case 'trucks': renderTruckChart(); break
    case 'status': renderStatusChart(); break
    case 'details': loadDetailsReport(); break  // ✅ جدید
  }
})




const receiptDialog = reactive({
  visible: false,
  loading: false,
  error: '',
  imageUrl: '',
  expenseId: null,
})

let receiptRequestId = 0

const clearReceiptImage = () => {
  // درخواست قبلی را نامعتبر می‌کنیم تا نتیجه دیررس
  // تصویر رسید دیگری را جایگزین نکند.
  receiptRequestId++

  if (receiptDialog.imageUrl) {
    URL.revokeObjectURL(receiptDialog.imageUrl)
  }

  receiptDialog.imageUrl = ''
  receiptDialog.loading = false
  receiptDialog.error = ''
  receiptDialog.expenseId = null
}

const viewReceipt = async (expense) => {
  const rawUrl = expense?.receipt_url

  if (!rawUrl) {
    alert('آدرس رسید برای این هزینه ثبت نشده است.')
    return
  }

  const requestId = ++receiptRequestId

  // آزادسازی تصویر قبلی
  if (receiptDialog.imageUrl) {
    URL.revokeObjectURL(receiptDialog.imageUrl)
  }

  receiptDialog.imageUrl = ''
  receiptDialog.error = ''
  receiptDialog.loading = true
  receiptDialog.expenseId = expense.id
  receiptDialog.visible = true

  try {
    // آدرس مطلق یا نسبی را به URL معتبر تبدیل می‌کنیم.
    const receiptUrl = new URL(
        rawUrl,
        api.defaults.baseURL || window.location.origin
    ).href

    console.log('Url is:',receiptUrl)

    // دریافت تصویر با Axios و هدرهای احراز هویت موجود
    const response = await api.get(receiptUrl, {
      responseType: 'blob',
    })
    if (requestId !== receiptRequestId) return

    if (!response.data || response.data.size === 0) {
      throw new Error('فایل رسید خالی است.')
    }

    const contentType =
        response.headers['content-type'] ||
        response.data.type ||
        ''

    if (!contentType.startsWith('image/')) {
      throw new Error(
          'پاسخ سرور تصویر نیست. نوع فایل دریافتی: ' +
          (contentType || 'نامشخص')
      )
    }

    receiptDialog.imageUrl = URL.createObjectURL(response.data)
  } catch (error) {
    if (requestId !== receiptRequestId) return

    console.error('Error loading receipt:', {
      expenseId: expense.id,
      receiptUrl: rawUrl,
      status: error.response?.status,
      message: error.message,
    })

    if (error.response?.status === 401 ||
        error.response?.status === 403) {
      receiptDialog.error =
          'اجازه دسترسی به رسید وجود ندارد یا نشست کاربری منقضی شده است.'
    } else if (error.response?.status === 404) {
      receiptDialog.error =
          'فایل رسید در مسیر مشخص‌شده پیدا نشد.'
    } else if (error.response) {
      receiptDialog.error =
          `خطا در دریافت رسید (HTTP ${error.response.status}).`
    } else {
      receiptDialog.error =
          error.message || 'دریافت تصویر رسید ناموفق بود.'
    }
  } finally {
    if (requestId === receiptRequestId) {
      receiptDialog.loading = false
    }
  }
}

const retryReceipt = () => {
  if (!receiptDialog.expenseId) return

  // از اطلاعات همان هزینه برای تلاش مجدد استفاده می‌کنیم.
  const expense = detailsReport.value.find(
      item => item.id === receiptDialog.expenseId
  )

  if (expense) {
    viewReceipt(expense)
  } else if (detailDialog.expense?.id === receiptDialog.expenseId) {
    viewReceipt(detailDialog.expense)
  }
}


const filters = reactive({
  from_date: null,
  to_date: null,
  driver_id: null,
  truck_id: null,
  category_id: null,
})

const tabs = [
  { key: 'monthly', label: 'روند ماهانه', icon: 'pi pi-chart-line' },
  { key: 'drivers', label: 'رانندگان', icon: 'pi pi-users' },
  { key: 'categories', label: 'دسته‌بندی', icon: 'pi pi-tags' },
  { key: 'trucks', label: 'کامیون‌ها', icon: 'pi pi-truck' },
  { key: 'routes', label: 'مسیرها', icon: 'pi pi-map' },
  { key: 'status', label: 'وضعیت تایید', icon: 'pi pi-check-circle' },
  { key: 'details', label: 'جزئیات سفر', icon: 'pi pi-check-circle' },

]

// ═══════ Helpers ═══════
const formatNumber = (value) => Number(value || 0).toLocaleString('fa-IR')
const formatMoney = (value) => `${formatNumber(value)} تومان`

const formatDate = (date) => {
  if (!date) return null
  if (date instanceof Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return date
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
  }
  return labels[status] || status
}



// ═══════ Chart Colors ═══════
const chartColors = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
]

// ═══════ Data Loading ═══════
const buildParams = () => {
  const params = {}
  if (filters.from_date) params.from_date = formatDate(filters.from_date)
  if (filters.to_date) params.to_date = formatDate(filters.to_date)
  if (filters.driver_id) params.driver_id = filters.driver_id
  if (filters.truck_id) params.truck_id = filters.truck_id
  if (filters.category_id) params.category_id = filters.category_id
  return params
}

const loadSummary = async () => {
  try {
    const response = await tripExpenseService.getReportSummary(buildParams())
    Object.assign(summary, response.data || {})
  } catch (error) {
    console.error('Error loading summary:', error)
  }
}

const loadDriverReport = async () => {
  try {
    const response = await tripExpenseService.getReportByDriver(buildParams())
    driverReport.value = response.data || []
    await nextTick()
    renderDriverChart()
  } catch (error) {
    console.error('Error loading driver report:', error)
  }
}

const loadCategoryReport = async () => {
  try {
    const response = await tripExpenseService.getReportByCategory(buildParams())
    categoryReport.value = response.data || []
    await nextTick()
    renderCategoryChart()
  } catch (error) {
    console.error('Error loading category report:', error)
  }
}

const loadTruckReport = async () => {
  try {
    const response = await tripExpenseService.getReportByTruck(buildParams())
    truckReport.value = response.data || []
    await nextTick()
    renderTruckChart()
  } catch (error) {
    console.error('Error loading truck report:', error)
  }
}

const loadRouteReport = async () => {
  try {
    const response = await tripExpenseService.getReportByRoute(buildParams())
    routeReport.value = response.data || []
  } catch (error) {
    console.error('Error loading route report:', error)
  }
}

const loadMonthlyReport = async () => {
  try {
    const response = await tripExpenseService.getReportByMonth(buildParams())
    monthlyReport.value = response.data || []
    await nextTick()
    renderMonthlyChart()
  } catch (error) {
    console.error('Error loading monthly report:', error)
  }
}

const loadStatusReport = async () => {
  try {
    const response = await tripExpenseService.getReportByStatus(buildParams())
    statusReport.value = response.data || []
    await nextTick()
    renderStatusChart()
  } catch (error) {
    console.error('Error loading status report:', error)
  }
}

const loadAllReports = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadSummary(),
      loadDriverReport(),
      loadCategoryReport(),
      loadTruckReport(),
      loadRouteReport(),
      loadMonthlyReport(),
      loadStatusReport(),
    ])
  } finally {
    loading.value = false
  }
}

const refreshAll = () => loadAllReports()

const applyFilters = () => loadAllReports()

const resetFilters = () => {
  filters.from_date = null
  filters.to_date = null
  filters.driver_id = null
  filters.truck_id = null
  filters.category_id = null
  loadAllReports()
}

// ═══════ Chart Rendering ═══════
const renderMonthlyChart = () => {
  if (!monthlyChartRef.value) return
  if (monthlyChart) monthlyChart.destroy()

  const labels = monthlyReport.value.map(r => {
    const [year, month] = r.month.split('-')
    return `${year}/${month}`
  })

  monthlyChart = new Chart(monthlyChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'مجموع هزینه‌ها',
          data: monthlyReport.value.map(r => r.total_amount),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'تایید شده',
          data: monthlyReport.value.map(r => r.approved_amount),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', rtl: true },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('fa-IR')} تومان`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => Number(value).toLocaleString('fa-IR'),
          },
        },
      },
    },
  })
}

const renderDriverChart = () => {
  if (!driverChartRef.value) return
  if (driverChart) driverChart.destroy()

  const top10 = driverReport.value.slice(0, 10)

  driverChart = new Chart(driverChartRef.value, {
    type: 'bar',
    data: {
      labels: top10.map(r => r.driver_name),
      datasets: [{
        label: 'مجموع هزینه',
        data: top10.map(r => r.total_amount),
        backgroundColor: chartColors.slice(0, top10.length),
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${Number(ctx.parsed.x).toLocaleString('fa-IR')} تومان`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (value) => Number(value).toLocaleString('fa-IR'),
          },
        },
      },
    },
  })
}

const renderCategoryChart = () => {
  if (!categoryChartRef.value) return
  if (categoryChart) categoryChart.destroy()

  categoryChart = new Chart(categoryChartRef.value, {
    type: 'doughnut',
    data: {
      labels: categoryReport.value.map(r => r.category_name),
      datasets: [{
        data: categoryReport.value.map(r => r.total_amount),
        backgroundColor: chartColors,
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', rtl: true },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
              const percent = Math.round((ctx.parsed / total) * 100)
              return `${ctx.label}: ${Number(ctx.parsed).toLocaleString('fa-IR')} تومان (${percent}%)`
            },
          },
        },
      },
    },
  })
}

const renderTruckChart = () => {
  if (!truckChartRef.value) return
  if (truckChart) truckChart.destroy()

  const top10 = truckReport.value.slice(0, 10)

  truckChart = new Chart(truckChartRef.value, {
    type: 'bar',
    data: {
      labels: top10.map(r => `کد ${r.truck_code}`),
      datasets: [{
        label: 'مجموع هزینه',
        data: top10.map(r => r.total_amount),
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${Number(ctx.parsed.y).toLocaleString('fa-IR')} تومان`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => Number(value).toLocaleString('fa-IR'),
          },
        },
      },
    },
  })
}

// ادامه بخش renderStatusChart در <script setup>

const renderStatusChart = () => {
  if (!statusChartRef.value) return
  if (statusChart) statusChart.destroy()

  const statusColors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  }

  const statusLabels = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
  }

  statusChart = new Chart(statusChartRef.value, {
    type: 'pie',
    data: {
      labels: statusReport.value.map(r => statusLabels[r.status] || r.status),
      datasets: [{
        data: statusReport.value.map(r => r.total_amount),
        backgroundColor: statusReport.value.map(r => statusColors[r.status] || '#6b7280'),
        borderWidth: 3,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', rtl: true },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
              const percent = Math.round((ctx.parsed / total) * 100)
              return `${ctx.label}: ${Number(ctx.parsed).toLocaleString('fa-IR')} تومان (${percent}%)`
            },
          },
        },
      },
    },
  })
}

// ═══════ Watch برای تغییر تب ═══════
watch(activeTab, async (newTab) => {
  await nextTick()
  switch (newTab) {
    case 'monthly': renderMonthlyChart(); break
    case 'drivers': renderDriverChart(); break
    case 'categories': renderCategoryChart(); break
    case 'trucks': renderTruckChart(); break
    case 'status': renderStatusChart(); break
  }
})

// ═══════ Cleanup ═══════
onBeforeUnmount(() => {
  ;[monthlyChart, driverChart, categoryChart, truckChart, statusChart].forEach(chart => {
    if (chart) chart.destroy()
  })
})

// ═══════ Lifecycle ═══════
onMounted(async () => {
  // مقداردهی پیش‌فرض: از اول ماه جاری تا امروز
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  filters.from_date = firstDay
  filters.to_date = now

  // دریافت لیست‌های فیلتر
  try {
    const [driversRes, trucksRes] = await Promise.all([
      api.get('auth/users', { params: { role: 'driver' } }),
      tripExpenseService.getTrucks({ per_page: 1000 }),
    ])

    drivers.value = driversRes.data.data || driversRes.data || []

    if (Array.isArray(trucksRes)) {
      trucks.value = trucksRes.map(t => ({ ...t, display: `کد ${t.code} - ${t.plate_number}` }))
    } else if (trucksRes.data && Array.isArray(trucksRes.data)) {
      trucks.value = trucksRes.data.map(t => ({ ...t, display: `کد ${t.code} - ${t.plate_number}` }))
    }

    await categoryStore.fetchOptions()
    categories.value = categoryStore.options || []
  } catch (error) {
    console.error('Error loading filter options:', error)
  }

  await loadAllReports()
})
</script>
<style scoped>

/* ═══════ Details Tab Styles ═══════ */
.details-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fc;
  border: 1px solid #eff0f5;
  border-radius: 0.8rem;
  margin-bottom: 1rem;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.filter-row .filter-field.flex-2 {
  grid-column: span 2;
}

.filter-row .filter-field.filter-action {
  display: flex;
  align-items: flex-end;
}

.details-search-input {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid #e4e7ef;
  border-radius: 0.8rem;
  background: #fbfcfe;
  font-size: 0.78rem;
  outline: none;
  transition: border-color 0.2s;
}

.details-search-input:focus {
  border-color: var(--report-primary);
}

.reset-details-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  border: 1px solid #e6e8f0;
  border-radius: 0.75rem;
  background: #fff;
  color: #687087;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
  width: 100%;
}

.reset-details-button:hover {
  border-color: #c7cbfa;
  background: #f7f7ff;
  color: #5558c9;
}

.details-table :deep(.p-datatable-table) {
  min-width: 1400px;
}

.details-table :deep(.p-datatable-thead > tr > th) {
  padding: 0.85rem 0.75rem;
  border-color: #edf0f5;
  background: #f8f9fc;
  color: #646c81;
  font-size: 0.73rem;
  font-weight: 800;
  white-space: nowrap;
}

.details-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.85rem 0.75rem;
  border-color: #f0f1f6;
  color: #4e566c;
  font-size: 0.78rem;
}

.details-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f8ff;
}

.money-text {
  color: #293247;
  font-size: 0.77rem;
  font-weight: 800;
  white-space: nowrap;
}

.normal-text {
  color: #9ca3af;
  font-size: 0.75rem;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid #10b981;
  border-radius: 0.7rem;
  background: #ecfdf5;
  color: #059669;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.export-button:hover:not(:disabled) {
  background: #d1fae5;
  border-color: #059669;
}

.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ═══════ Expense Detail Dialog ═══════ */
.expense-detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-section {
  padding: 1rem;
  border: 1px solid #eff0f5;
  border-radius: 0.8rem;
  background: #fff;
}

.detail-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  color: #30364d;
  font-size: 0.85rem;
  font-weight: 800;
}

.detail-section h4 i {
  color: var(--report-primary);
  font-size: 0.9rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  color: #8b91a3;
  font-size: 0.72rem;
  font-weight: 600;
}

.detail-value {
  color: #293247;
  font-size: 0.82rem;
  font-weight: 700;
}

.detail-text {
  margin: 0;
  color: #4e566c;
  font-size: 0.8rem;
  line-height: 1.8;
  white-space: pre-line;
}

.detail-meta {
  margin-top: 0.5rem;
  color: #8b91a3;
  font-size: 0.72rem;
}

.warning-section {
  background: #fffbeb;
  border-color: #fef3c7;
}

.warning-section h4 {
  color: #92400e;
}

.warning-section h4 i {
  color: #d97706;
}

.rejected-section {
  background: #fef2f2;
  border-color: #fee2e2;
}

.rejected-section h4 {
  color: #991b1b;
}

.rejected-section h4 i {
  color: #dc2626;
}

.view-receipt-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid #10b981;
  border-radius: 0.7rem;
  background: #ecfdf5;
  color: #059669;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.view-receipt-button:hover {
  background: #d1fae5;
  border-color: #059669;
}

@media (max-width: 1024px) {
  .filter-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-row .filter-field.flex-2 {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .filter-row {
    grid-template-columns: 1fr;
  }

  .filter-row .filter-field.flex-2 {
    grid-column: span 1;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}



.report-page {
  --report-primary: #6366f1;
  --report-primary-dark: #4f46e5;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: report-enter 0.35s ease-out;
}

/* ═══════ Hero ═══════ */
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
  background: rgb(255 255 255 / 85%);
  color: var(--report-primary-dark);
  font-size: 1.35rem;
  box-shadow: 0 4px 12px rgb(79 70 229 / 7%);
}

.hero-title {
  margin: 0;
  color: #202746;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.04em;
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
  line-height: 1.9;
}

.hero-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.7rem 0.9rem;
  border: 1px solid #dfe2f5;
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 90%);
  color: #5055a5;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.hero-refresh:hover:not(:disabled) {
  border-color: #b9bfff;
  background: #fff;
  transform: translateY(-1px);
}

.hero-refresh:disabled,
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* ═══════ Dashboard Card ═══════ */
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
  min-width: 0;
}

.section-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid;
  border-radius: 13px;
  font-size: 1rem;
}

.filter-section-icon {
  color: #6366f1;
  background: #f0f2ff;
  border-color: #e0e5ff;
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
  transition: 0.2s ease;
}

.reset-button:hover:not(:disabled) {
  border-color: #c7cbfa;
  background: #f7f7ff;
  color: #5558c9;
}

/* ═══════ Filters ═══════ */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.35rem 1.4rem;
}

.filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.55rem;
}

.filter-field label {
  color: #60677b;
  font-size: 0.76rem;
  font-weight: 700;
}

.filter-action-field {
  justify-content: flex-end;
}

.apply-button {
  display: inline-flex;
  min-height: 43px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--report-primary);
  border-radius: 0.8rem;
  background: var(--report-primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.apply-button:hover:not(:disabled) {
  background: var(--report-primary-dark);
  transform: translateY(-1px);
}

.filter-grid :deep(.p-select),
.filter-grid :deep(.p-datepicker) {
  min-height: 43px;
  border-color: #e4e7ef;
  border-radius: 0.8rem;
  background: #fbfcfe;
}

.filter-grid :deep(.p-select:hover),
.filter-grid :deep(.p-datepicker:hover) {
  border-color: #bfc4f9;
}

/* ═══════ KPI Cards ═══════ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1rem;
}

.kpi-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.1rem;
  border: 1px solid;
  border-radius: 1.15rem;
  background: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgb(15 23 42 / 6%);
}

.kpi-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  border-radius: 13px;
  font-size: 1.15rem;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.2rem;
}

.kpi-label {
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 600;
}

.kpi-value {
  color: #1f2937;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-meta {
  color: #9ca3af;
  font-size: 0.68rem;
  font-weight: 500;
}

.kpi-primary { border-color: #e0e7ff; background: linear-gradient(135deg, #f5f7ff, #fff); }
.kpi-primary .kpi-icon { background: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; }

.kpi-success { border-color: #d1fae5; background: linear-gradient(135deg, #f0fdf4, #fff); }
.kpi-success .kpi-icon { background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }

.kpi-warning { border-color: #fef3c7; background: linear-gradient(135deg, #fffbeb, #fff); }
.kpi-warning .kpi-icon { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

.kpi-danger { border-color: #fee2e2; background: linear-gradient(135deg, #fef2f2, #fff); }
.kpi-danger .kpi-icon { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

.kpi-info { border-color: #dbeafe; background: linear-gradient(135deg, #eff6ff, #fff); }
.kpi-info .kpi-icon { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }

.kpi-purple { border-color: #ede9fe; background: linear-gradient(135deg, #faf5ff, #fff); }
.kpi-purple .kpi-icon { background: #faf5ff; color: #7c3aed; border: 1px solid #ede9fe; }

/* ═══════ Tabs ═══════ */
.tabs-header {
  display: flex;
  gap: 0.35rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eff0f5;
  background: #fafbff;
  overflow-x: auto;
}

.tab-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.7rem;
  background: transparent;
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s ease;
}

.tab-button:hover {
  background: #fff;
  color: #4f46e5;
  border-color: #e5e7ff;
}

.tab-button.tab-active {
  background: #fff;
  color: #4f46e5;
  border-color: #c7d2fe;
  box-shadow: 0 2px 6px rgb(79 70 229 / 8%);
}

.tabs-content {
  padding: 1.5rem;
}

.tab-panel {
  animation: tab-fade 0.3s ease-out;
}

@keyframes tab-fade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ═══════ Charts ═══════ */
.chart-container {
  padding: 1.25rem;
  border: 1px solid #eff0f5;
  border-radius: 1rem;
  background: #fff;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: #30364d;
  font-size: 0.9rem;
  font-weight: 800;
}

.chart-title i {
  color: var(--report-primary);
  font-size: 1rem;
}

.chart-wrapper {
  position: relative;
  height: 320px;
}

.chart-wrapper-sm {
  height: 300px;
}

/* ═══════ Report Tables ═══════ */
.report-table-container {
  padding: 1.25rem;
  border: 1px solid #eff0f5;
  border-radius: 1rem;
  background: #fff;
}

.report-table-container.full-width {
  grid-column: 1 / -1;
}

.report-table :deep(.p-datatable-thead > tr > th) {
  padding: 0.85rem 0.75rem;
  border-color: #edf0f5;
  background: #f8f9fc;
  color: #646c81;
  font-size: 0.73rem;
  font-weight: 800;
  white-space: nowrap;
}

.report-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.85rem 0.75rem;
  border-color: #f0f1f6;
  color: #4e566c;
  font-size: 0.78rem;
}

.report-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f8ff;
}

.person-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.person-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid #e2e3ff;
  border-radius: 11px;
  background: #f0f0ff;
  color: #6366f1;
  font-size: 0.85rem;
}

.truck-avatar {
  background: #eff6ff;
  border-color: #dbeafe;
  color: #2563eb;
}

.person-cell div {
  display: grid;
  gap: 0.15rem;
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

.count-badge {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border: 1px solid #e7e9f2;
  border-radius: 0.55rem;
  background: #f8f9fc;
  color: #737b91;
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid #e0e7ff;
  border-radius: 0.6rem;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.74rem;
  font-weight: 700;
}

.avg-text {
  color: #6b7280;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.exceeded-badge {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border: 1px solid #f6e2bc;
  border-radius: 0.55rem;
  background: #fff8e9;
  color: #ad7419;
  font-size: 0.75rem;
  font-weight: 700;
}

.normal-badge {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border: 1px solid #e7e9f2;
  border-radius: 0.55rem;
  background: #f8f9fc;
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 700;
}

.route-cell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}

.route-origin {
  color: #087f5b;
  font-weight: 700;
}

.route-destination {
  color: #4f46e5;
  font-weight: 700;
}

.route-cell i {
  color: #9ca3af;
  font-size: 0.65rem;
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
  white-space: nowrap;
}

.status-pending { color: #d97706; background: #fffbeb; border-color: #fef3c7; }
.status-approved { color: #059669; background: #ecfdf5; border-color: #d1fae5; }
.status-rejected { color: #dc2626; background: #fef2f2; border-color: #fee2e2; }

.percent-text {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ═══════ Animation ═══════ */
@keyframes report-enter {
  from { opacity: 0; transform: translateY(7px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ═══════ Responsive ═══════ */
@media (max-width: 1280px) {
  .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 1024px) {
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .dashboard-hero { padding: 1.1rem; border-radius: 1.15rem; }
  .hero-content { flex-wrap: wrap; gap: 0.75rem; }
  .hero-icon { width: 44px; height: 44px; flex-basis: 44px; border-radius: 13px; }
  .hero-title { font-size: 1.2rem; }
  .hero-subtitle { font-size: 0.76rem; }
  .hero-refresh { width: 100%; }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
  .kpi-card { padding: 0.85rem; }
  .kpi-icon { width: 38px; height: 38px; flex-basis: 38px; font-size: 1rem; }
  .kpi-value { font-size: 0.85rem; }
  .filter-grid { grid-template-columns: 1fr; padding: 1rem; }
  .tabs-content { padding: 1rem; }
  .chart-wrapper, .chart-wrapper-sm { height: 260px; }
}

@media (prefers-reduced-motion: reduce) {
  .report-page, .tab-panel { animation: none; }
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
.receipt-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
  max-height: 75vh;
  overflow: auto;
  padding: 0.5rem;
  background: #f8f9fc;
  border: 1px solid #e8eaf2;
  border-radius: 0.75rem;
}

.receipt-preview-image {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
}

.receipt-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1rem;
  color: #6366f1;
  text-align: center;
  font-size: 0.9rem;
}

.receipt-error {
  color: #dc2626;
}

.receipt-error button {
  padding: 0.6rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 0.6rem;
  background: #fff;
  color: #dc2626;
  cursor: pointer;
}
</style>
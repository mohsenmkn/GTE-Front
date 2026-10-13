<template>
  <div class="org-page">
    <!-- ═════════════════════════════════════════════
          HERO SECTION (هم‌سبک Dashboard)
    ═════════════════════════════════════════════ -->
    <section v-if="loading" class="org-hero">
      <div class="flex items-center gap-4">
        <div class="skeleton skeleton-circle w-14 h-14"></div>
        <div class="space-y-2 flex-1">
          <div class="skeleton w-44 h-6"></div>
          <div class="skeleton w-64 h-4"></div>
        </div>
      </div>
    </section>

    <section v-else class="org-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>

      <div class="relative z-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="hero-status"></span>
              <span class="text-xs text-slate-500">ساختار سازمانی فعال است</span>
            </div>
            <h1 class="hero-title">
              ساختار سازمانی
              <span class="inline-flex items-center gap-2 mr-2">
                <i class="pi pi-sitemap text-indigo-500"></i>
              </span>
            </h1>
            <p class="hero-subtitle">
              مدیریت سلسله‌مراتب واحدها، سمت‌ها و پرسنل سازمان
            </p>
            <div class="flex items-center flex-wrap gap-3 mt-4">
              <div class="hero-meta">
                <i class="pi pi-building"></i>
                <span>{{ statistics.units }} واحد</span>
              </div>
              <span class="text-slate-300">•</span>
              <div class="hero-meta">
                <i class="pi pi-briefcase"></i>
                <span>{{ statistics.positions }} سمت</span>
              </div>
              <span class="text-slate-300">•</span>
              <div class="hero-meta">
                <i class="pi pi-users"></i>
                <span>{{ statistics.employees }} پرسنل</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 md:justify-end">
            <Button
                label="سمت جدید"
                icon="pi pi-plus"
                @click="openCreate()"
            />
            <Button
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                rounded
                :loading="loading"
                @click="loadTree"
                v-tooltip.bottom="'تازه‌سازی ساختار'"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═════════════════════════════════════════════
          MESSAGES
    ═════════════════════════════════════════════ -->
    <Transition name="fade">
      <Message v-if="errorMessage" severity="error" closable class="mb-4" @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>
    </Transition>
    <Transition name="fade">
      <Message v-if="successMessage" severity="success" closable class="mb-4" @close="successMessage = ''">
        {{ successMessage }}
      </Message>
    </Transition>

    <!-- ═════════════════════════════════════════════
          STATS GRID (هم‌سبک DashboardStats)
    ═════════════════════════════════════════════ -->
    <div class="stats-grid">
      <div v-for="stat in statsCards" :key="stat.key" class="stat-card">
        <div class="stat-icon" :class="stat.color">
          <i :class="stat.icon"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ stat.label }}</span>
          <strong class="stat-value">
            <template v-if="loading">
              <span class="skeleton w-12 h-5 inline-block"></span>
            </template>
            <template v-else>{{ stat.value }}</template>
          </strong>
        </div>
        <div v-if="stat.trend" class="stat-trend" :class="stat.trendDir">
          <i :class="stat.trendDir === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
          {{ stat.trend }}
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════
          MAIN CARD (Toolbar + Breadcrumb + Content)
    ═════════════════════════════════════════════ -->
    <div class="dashboard-card">
      <!-- Toolbar -->
      <div class="org-toolbar">
        <div class="toolbar-right">
          <div class="toolbar-icon">
            <i class="pi pi-sitemap"></i>
          </div>
          <div>
            <strong>چارت سازمانی</strong>
            <small>برای جابه‌جایی، آیتم را بکشید و روی مقصد رها کنید</small>
          </div>
        </div>

        <div class="toolbar-left">
          <!-- View Switcher -->
          <div class="view-switcher">
            <button
                v-for="view in views"
                :key="view.key"
                class="view-btn"
                :class="{ active: currentView === view.key }"
                @click="currentView = view.key"
                v-tooltip.bottom="view.label"
            >
              <i :class="view.icon"></i>
            </button>
          </div>

          <!-- Smart Search -->
          <div class="smart-search">
            <span class="search-icon">
              <i class="pi pi-search"></i>
            </span>
            <InputText
                v-model="searchText"
                placeholder="جستجوی واحد، سمت یا پرسنل..."
                class="search-input"
            />
            <span v-if="searchText" class="search-clear" @click="searchText = ''">
              <i class="pi pi-times"></i>
            </span>
          </div>

          <!-- Expand/Collapse -->
          <div class="expand-controls">
            <Button
                icon="pi pi-chevron-down"
                severity="secondary"
                text
                rounded
                size="small"
                v-tooltip.bottom="'باز کردن همه'"
                @click="expandAll"
            />
            <Button
                icon="pi pi-chevron-up"
                severity="secondary"
                text
                rounded
                size="small"
                v-tooltip.bottom="'بستن همه'"
                @click="collapseAll"
            />
          </div>
        </div>
      </div>

      <!-- Breadcrumb -->
      <div v-if="focusedNode" class="org-breadcrumb">
        <button class="crumb" @click="clearFocus">
          <i class="pi pi-sitemap"></i>
          <span>ریشه سازمان</span>
        </button>
        <i class="pi pi-chevron-left crumb-sep"></i>
        <template v-for="(ancestor, idx) in focusedNode.ancestors" :key="ancestor.id">
          <button class="crumb" @click="focusNode(ancestor)">
            {{ ancestor.title }}
          </button>
          <i v-if="idx < focusedNode.ancestors.length - 1" class="pi pi-chevron-left crumb-sep"></i>
        </template>
        <i v-if="focusedNode.ancestors.length" class="pi pi-chevron-left crumb-sep"></i>
        <span class="crumb current">
          <i :class="focusedNode.type === 'unit' ? 'pi pi-building' : 'pi pi-briefcase'"></i>
          {{ focusedNode.title }}
        </span>
      </div>

      <!-- Focus Stats (وقتی روی یک نود کلیک شده) -->
      <div v-if="focusedNode" class="focus-stats">
        <div class="focus-stat">
          <i class="pi pi-briefcase"></i>
          <div>
            <strong>{{ focusedNode.positionsCount }}</strong>
            <span>سمت</span>
          </div>
        </div>
        <div class="focus-stat">
          <i class="pi pi-users"></i>
          <div>
            <strong>{{ focusedNode.employeesCount }}</strong>
            <span>پرسنل</span>
          </div>
        </div>
        <div class="focus-stat">
          <i class="pi pi-layer-group"></i>
          <div>
            <strong>{{ focusedNode.depth }}</strong>
            <span>سطح</span>
          </div>
        </div>
        <button class="focus-clear" @click="clearFocus">
          <i class="pi pi-times"></i>
          خروج از تمرکز
        </button>
      </div>

      <!-- Content: Tree View -->
      <div v-show="currentView === 'tree'" class="tree-container">
        <div v-if="!loading && filteredNodes.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-sitemap"></i>
          </div>
          <h3>ساختاری پیدا نشد</h3>
          <p>موردی مطابق جستجوی شما وجود ندارد.</p>
        </div>

        <Tree
            v-else
            v-model:selectionKeys="selectedNode"
            v-model:expandedKeys="expandedKeys"
            :value="filteredNodes"
            :loading="loading"
            selectionMode="single"
            draggableNodes
            droppableNodes
            class="org-tree"
            @node-drop="onNodeDrop"
            @node-select="onNodeSelect"
        >
          <template #default="{ node }">
            <!-- ═══════ UNIT CARD ═══════ -->
            <div
                v-if="node.data.type === 'unit'"
                class="unit-card"
                @contextmenu.prevent="openContextMenu($event, node)"
            >
              <div class="unit-accent"></div>
              <div class="unit-body">
                <div class="unit-drag" v-tooltip.top="'جابه‌جایی'">
                  <i class="pi pi-grip-vertical"></i>
                </div>
                <div class="unit-avatar">
                  <i class="pi pi-building"></i>
                </div>
                <div class="unit-info">
                  <span class="unit-name">{{ node.data.title }}</span>
                  <div class="unit-meta">
                    <span v-if="node.data.code" class="meta-tag">
                      <i class="pi pi-hashtag"></i>
                      {{ node.data.code }}
                    </span>
                    <span class="meta-tag">
                      <i class="pi pi-layer-group"></i>
                      سطح {{ node.data.level }}
                    </span>
                    <span class="meta-count">
                      <i class="pi pi-briefcase"></i>
                      {{ node.data.positionsCount || 0 }} سمت
                    </span>
                    <span class="meta-count">
                      <i class="pi pi-users"></i>
                      {{ node.data.employeesCount || 0 }} نفر
                    </span>
                  </div>
                  <div v-if="node.data.parent_position_title" class="parent-badge">
                    <i class="pi pi-briefcase"></i>
                    زیرمجموعه: {{ node.data.parent_position_title }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ═══════ POSITION CARD (با Avatar Stack) ═══════ -->
            <div
                v-else-if="node.data.type === 'position'"
                class="position-card"
                :class="`pos-level-${getPositionLevelClass(node.data.positionLevel)}`"
                @contextmenu.prevent="openContextMenu($event, node)"
            >
              <div class="pos-drag" v-tooltip.top="'جابه‌جایی'">
                <i class="pi pi-grip-vertical"></i>
              </div>
              <div class="pos-dot"></div>

              <div class="pos-info">
                <div class="pos-header">
                  <span class="pos-name">{{ node.data.post_title || 'بدون عنوان' }}</span>
                  <span class="pos-level-badge">سطح {{ node.data.positionLevel }}</span>
                </div>

                <div class="pos-details">
                  <span v-if="node.data.post_code">
                    <i class="pi pi-hashtag"></i> {{ node.data.post_code }}
                  </span>
                  <span v-if="node.data.job_title">
                    <i class="pi pi-id-card"></i> {{ node.data.job_title }}
                  </span>
                </div>

                <!-- Avatar Stack (LOD) -->
                <div v-if="node.data.employees?.length" class="pos-people-stack">
                  <div class="avatar-stack">
                    <div
                        v-for="emp in node.data.employees.slice(0, 3)"
                        :key="emp.id"
                        class="stack-avatar"
                        :style="{ background: getAvatarColor(emp.id) }"
                        v-tooltip.top="emp.name"
                        @click.stop="navigateToEmployee(emp.user_id)"
                    >
                      {{ getInitials(emp.name) }}
                    </div>
                    <button
                        v-if="node.data.employees.length > 3"
                        class="stack-avatar stack-more"
                        @click.stop="openPeopleDialog(node)"
                    >
                      +{{ node.data.employees.length - 3 }}
                    </button>
                  </div>
                  <span class="people-count">
                    {{ node.data.employees.length }}
                    {{ node.data.employees.length === 1 ? 'نفر' : 'نفر' }}
                  </span>
                </div>
                <div v-else class="pos-empty">
                  <i class="pi pi-user-minus"></i>
                  بدون پرسنل
                </div>
              </div>
            </div>
          </template>
        </Tree>
      </div>

      <!-- Content: Table View -->
      <div v-show="currentView === 'table'" class="table-container">
        <DataTable
            :value="flatList"
            :filters="tableFilters"
            :loading="loading"
            stripedRows
            paginator
            :rows="20"
            :rowsPerPageOptions="[10, 20, 50]"
            class="org-table"
            emptyMessage="موردی یافت نشد"
        >
          <Column field="type" header="نوع" :sortable="true" style="width: 100px">
            <template #body="{ data }">
              <span class="type-badge" :class="data.type">
                <i :class="data.type === 'unit' ? 'pi pi-building' : 'pi pi-briefcase'"></i>
                {{ data.type === 'unit' ? 'واحد' : 'سمت' }}
              </span>
            </template>
          </Column>
          <Column field="title" header="عنوان" :sortable="true">
            <template #body="{ data }">
              <div class="table-title">
                <span>{{ data.title }}</span>
                <small class="table-path">{{ data.path }}</small>
              </div>
            </template>
          </Column>
          <Column field="code" header="کد" :sortable="true" style="width: 120px">
            <template #body="{ data }">
              <span class="table-code">{{ data.code || '—' }}</span>
            </template>
          </Column>
          <Column field="level" header="سطح" :sortable="true" style="width: 90px">
            <template #body="{ data }">
              <span class="level-pill">{{ data.level }}</span>
            </template>
          </Column>
          <Column field="employeesCount" header="پرسنل" :sortable="true" style="width: 100px">
            <template #body="{ data }">
              <span class="count-pill">
                <i class="pi pi-users"></i>
                {{ data.employeesCount || 0 }}
              </span>
            </template>
          </Column>
          <Column header="عملیات" style="width: 120px">
            <template #body="{ data }">
              <div class="table-actions">
                <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    @click="data.type === 'unit' ? openEditUnit(data) : openEditByData(data)"
                />
                <Button
                    v-if="data.type === 'position'"
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    @click="deletePositionById(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Footer -->
      <div class="tree-footer">
        <div class="footer-hint">
          <i class="pi pi-info-circle"></i>
          <span>کلیک راست برای منوی زمینه • کلیک روی نود برای تمرکز</span>
        </div>
        <div class="footer-stats">
          <span>{{ statistics.positions }} سمت</span>
          <span class="sep">•</span>
          <span>{{ statistics.employees }} پرسنل</span>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════
          CONTEXT MENU
    ═════════════════════════════════════════════ -->
    <ContextMenu ref="contextMenu" :model="contextMenuItems" />

    <!-- ═════════════════════════════════════════════
          PEOPLE DIALOG (لیست کامل پرسنل یک سمت)
    ═════════════════════════════════════════════ -->
    <Dialog
        v-model:visible="peopleDialogVisible"
        modal
        :header="`پرسنل سمت «${peopleDialogNode?.data?.post_title}»`"
        :style="{ width: '560px' }"
        class="people-dialog"
    >
      <div class="people-list">
        <div
            v-for="emp in peopleDialogNode?.data?.employees"
            :key="emp.id"
            class="person-row"
            @click="navigateToEmployee(emp.user_id)"
        >
          <div class="person-avatar-lg" :style="{ background: getAvatarColor(emp.id) }">
            {{ getInitials(emp.name) }}
          </div>
          <div class="person-info">
            <strong>{{ emp.name }}</strong>
            <div class="person-meta">
              <span v-if="emp.mobile">
                <i class="pi pi-mobile"></i>
                <span dir="ltr">{{ emp.mobile }}</span>
              </span>
              <span v-if="emp.personnel_code">
                <i class="pi pi-id-card"></i>
                {{ emp.personnel_code }}
              </span>
            </div>
          </div>
          <i class="pi pi-chevron-left person-nav"></i>
        </div>
      </div>
      <template #footer>
        <Button label="بستن" severity="secondary" text @click="peopleDialogVisible = false" />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════════
          POSITION DIALOG
    ═════════════════════════════════════════════ -->
    <Dialog
        v-model:visible="dialogVisible"
        modal
        :header="dialogMode === 'create' ? 'ایجاد سمت جدید' : 'ویرایش سمت'"
        :style="{ width: '620px' }"
        class="position-dialog"
    >
      <div class="dialog-intro">
        <div class="dialog-icon">
          <i class="pi pi-briefcase"></i>
        </div>
        <div>
          <strong>{{ dialogMode === 'create' ? 'تعریف سمت سازمانی' : 'ویرایش اطلاعات سمت' }}</strong>
          <small>اطلاعات سمت را وارد یا اصلاح کنید.</small>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field full">
          <label>واحد سازمانی <span>*</span></label>
          <Select
              v-model="form.organizational_unit_id"
              :options="units"
              optionLabel="title"
              optionValue="id"
              placeholder="یک واحد سازمانی انتخاب کنید"
              class="w-full"
              :filter="true"
              filterPlaceholder="جستجو در واحدها..."
              :showClear="true"
              :invalid="!form.organizational_unit_id && dialogVisible"
          />
        </div>

        <div class="form-field full">
          <label>پرسنل مسئول (اختیاری)</label>
          <div class="user-select-wrapper">
            <AutoComplete
                v-model="selectedUser"
                :suggestions="userSuggestions"
                @complete="searchUsers"
                optionLabel="name"
                placeholder="جستجو بر اساس نام، موبایل یا کد پرسنلی..."
                class="flex-grow-1"
                :loading="searchingUser"
                dropdown
                :forceSelection="false"
                allow-empty
            >
              <template #option="slotProps">
                <div class="user-option-item">
                  <div class="user-avatar-sm">{{ getInitials(slotProps.option.name) }}</div>
                  <div class="user-info-sm">
                    <span class="user-name-sm">{{ slotProps.option.name }}</span>
                    <span class="user-detail-sm">
                      <i class="pi pi-mobile"></i> {{ slotProps.option.mobile }}
                      <span v-if="slotProps.option.personnel_code" class="ml-2">
                        <i class="pi pi-id-card"></i> {{ slotProps.option.personnel_code }}
                      </span>
                    </span>
                  </div>
                </div>
              </template>
              <template #chip="{ value }">
                <div class="flex align-items-center gap-2">
                  <div class="user-avatar-xs">{{ getInitials(value.name) }}</div>
                  <span>{{ value.name }}</span>
                </div>
              </template>
              <template #empty>
                <div class="p-3 text-center text-gray-500">
                  کاربری یافت نشد. برای جستجو تایپ کنید...
                </div>
              </template>
            </AutoComplete>
            <Button
                icon="pi pi-user-plus"
                label="جدید"
                severity="help"
                text
                size="small"
                @click="newUserDialogVisible = true"
                v-tooltip.bottom="'ایجاد پرسنل جدید'"
            />
          </div>
        </div>

        <div class="form-field full">
          <label>عنوان سمت <span>*</span></label>
          <InputText v-model="form.post_title" class="w-full" placeholder="مثلاً سرپرست توسعه نرم‌افزار" />
        </div>

        <div class="form-field">
          <label>کد سمت</label>
          <InputText v-model="form.post_code" class="w-full" placeholder="کد سمت" />
        </div>
        <div class="form-field">
          <label>کد شغل</label>
          <InputText v-model="form.job_code" class="w-full" placeholder="کد شغل" />
        </div>

        <div class="form-field full">
          <label>عنوان شغل</label>
          <InputText v-model="form.job_title" class="w-full" placeholder="عنوان شغل" />
        </div>

        <div class="form-field">
          <label>ترتیب نمایش</label>
          <InputNumber v-model="form.sort_order" :min="0" class="w-full" />
        </div>

        <div class="form-field status-field">
          <label>وضعیت</label>
          <div class="status-control">
            <ToggleSwitch v-model="form.is_active" />
            <span>{{ form.is_active ? 'فعال' : 'غیرفعال' }}</span>
          </div>
        </div>

        <div class="form-field full">
          <label>توضیحات</label>
          <Textarea v-model="form.description" rows="4" class="w-full" placeholder="توضیحات مربوط به این سمت..." />
        </div>
      </div>

      <template #footer>
        <Button label="انصراف" severity="secondary" text @click="dialogVisible = false" />
        <Button
            :label="dialogMode === 'create' ? 'ایجاد سمت' : 'ذخیره تغییرات'"
            icon="pi pi-check"
            :loading="saving"
            @click="savePosition"
        />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════════
          UNIT DIALOG
    ═════════════════════════════════════════════ -->
    <Dialog
        v-model:visible="unitDialogVisible"
        modal
        header="ویرایش واحد سازمانی"
        :style="{ width: '500px' }"
        class="unit-dialog"
    >
      <div class="dialog-intro">
        <div class="dialog-icon" style="background: #eff6ff; color: #2563eb;">
          <i class="pi pi-building"></i>
        </div>
        <div>
          <strong>ویرایش واحد سازمانی</strong>
          <small>واحد را به والد جدید منتقل کنید.</small>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field full">
          <label>نام واحد</label>
          <InputText :value="unitForm.title" disabled class="w-full" />
        </div>

        <div class="form-field full">
          <label>والد واحد (واحد سازمانی)</label>
          <Select
              v-model="unitForm.parent_id"
              :options="availableParentUnits"
              optionLabel="title"
              optionValue="id"
              placeholder="واحد والد را انتخاب کنید"
              class="w-full"
              :filter="true"
              filterPlaceholder="جستجو..."
              :showClear="true"
              @change="onUnitParentChange"
          />
        </div>

        <div class="form-field full">
          <label>یا والد سمت (سمت سازمانی)</label>
          <Select
              v-model="unitForm.parent_position_id"
              :options="availableParentPositions"
              optionLabel="label"
              optionValue="id"
              placeholder="سمت والد را انتخاب کنید"
              class="w-full"
              :filter="true"
              filterPlaceholder="جستجو..."
              :showClear="true"
              @change="onUnitPositionParentChange"
          />
          <small class="field-hint">
            <i class="pi pi-info-circle"></i>
            در صورت انتخاب سمت، واحد زیرمجموعه آن سمت قرار می‌گیرد.
          </small>
        </div>
      </div>

      <template #footer>
        <Button label="انصراف" severity="secondary" text @click="unitDialogVisible = false" />
        <Button label="ذخیره تغییرات" icon="pi pi-check" :loading="savingUnit" @click="saveUnit" />
      </template>
    </Dialog>

    <!-- ═════════════════════════════════════════════
          NEW USER DIALOG
    ═════════════════════════════════════════════ -->
    <Dialog
        v-model:visible="newUserDialogVisible"
        modal
        header="ایجاد پرسنل جدید"
        :style="{ width: '500px' }"
        class="new-user-dialog"
    >
      <div class="form-grid">
        <div class="form-field full">
          <label>نام و نام خانوادگی <span>*</span></label>
          <InputText v-model="newUserForm.name" class="w-full" placeholder="مثلاً علی محمدی" />
        </div>
        <div class="form-field">
          <label>شماره موبایل <span>*</span></label>
          <InputText v-model="newUserForm.mobile" class="w-full" placeholder="09123456789" dir="ltr" />
        </div>
        <div class="form-field">
          <label>کد پرسنلی</label>
          <InputText v-model="newUserForm.personnel_code" class="w-full" placeholder="اختیاری" dir="ltr" />
        </div>
        <div class="form-field full">
          <label>کد ملی</label>
          <InputText v-model="newUserForm.national_code" class="w-full" placeholder="10 رقم" dir="ltr" />
        </div>
        <div class="form-field full">
          <label>رمز عبور پیش‌فرض</label>
          <InputText v-model="newUserForm.password" class="w-full" type="text" dir="ltr" />
          <small class="text-gray-500">کاربر می‌تواند پس از اولین ورود آن را تغییر دهد.</small>
        </div>
      </div>

      <template #footer>
        <Button label="انصراف" severity="secondary" text @click="newUserDialogVisible = false" />
        <Button label="ایجاد و انتخاب" icon="pi pi-check" :loading="savingNewUser" @click="saveNewUser" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'

import Tree from 'primevue/tree'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import AutoComplete from 'primevue/autocomplete'
import Select from 'primevue/select'
import ContextMenu from 'primevue/contextmenu'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const router = useRouter()

/* ═══════════════════════════════════════════
STATE
═══════════════════════════════════════════ */
const nodes = ref([])
const loading = ref(false)
const selectedNode = ref(null)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const errorMessage = ref('')
const successMessage = ref('')
const searchText = ref('')
const saving = ref(false)
const expandedKeys = ref({})
const statistics = ref({ units: 0, positions: 0, employees: 0 })

const unitDialogVisible = ref(false)
const savingUnit = ref(false)
const unitForm = ref({
  id: null,
  title: '',
  parent_id: null,
  parent_position_id: null,
})
const allPositions = ref([])

// View switcher
const currentView = ref('tree')
const views = [
  { key: 'tree', icon: 'pi pi-sitemap', label: 'نمای درختی' },
  { key: 'table', icon: 'pi pi-table', label: 'نمای جدولی' },
]
const tableFilters = ref({})

// Focus / Breadcrumb
const focusedNode = ref(null)

// Context menu
const contextMenu = ref(null)
const contextMenuItems = ref([])

// People dialog
const peopleDialogVisible = ref(false)
const peopleDialogNode = ref(null)

/* ═══════════════════════════════════════════
STATS CARDS
═══════════════════════════════════════════ */
const statsCards = computed(() => [
  {
    key: 'units',
    label: 'واحدهای سازمانی',
    value: statistics.value.units,
    icon: 'pi pi-building',
    color: 'blue',
  },
  {
    key: 'positions',
    label: 'سمت‌های سازمانی',
    value: statistics.value.positions,
    icon: 'pi pi-briefcase',
    color: 'violet',
  },
  {
    key: 'employees',
    label: 'پرسنل',
    value: statistics.value.employees,
    icon: 'pi pi-users',
    color: 'emerald',
  },
  {
    key: 'sync',
    label: 'وضعیت ساختار',
    value: 'همگام',
    icon: 'pi pi-check-circle',
    color: 'amber',
  },
])

/* ═══════════════════════════════════════════
FLAT LIST (برای Table View)
═══════════════════════════════════════════ */
const flatList = computed(() => {
  const list = []
  function walk(items, path = '', depth = 0) {
    for (const node of items || []) {
      const title = node.data.title || node.data.post_title || ''
      const currentPath = path ? `${path} / ${title}` : title
      list.push({
        id: node.data.id,
        type: node.data.type,
        title,
        code: node.data.code || node.data.post_code,
        level: node.data.level || node.data.positionLevel || depth,
        employeesCount: node.data.employees?.length || 0,
        path: currentPath,
        nodeData: node.data,
      })
      if (node.children?.length) walk(node.children, currentPath, depth + 1)
    }
  }
  walk(nodes.value)
  return list
})

/* ═══════════════════════════════════════════
UTILITIES
═══════════════════════════════════════════ */
function getInitials(name) {
  if (!name) return '؟'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 1)
  return parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)
}

// رنگ پایدار بر اساس id برای avatar
function getAvatarColor(id) {
  const colors = [
    '#7c3aed', '#2563eb', '#059669', '#dc2626',
    '#ea580c', '#ca8a04', '#0891b2', '#db2777',
  ]
  const numId = typeof id === 'number' ? id : String(id).charCodeAt(0)
  return colors[numId % colors.length]
}

function calculateStatistics(tree) {
  let units = 0, positions = 0, employees = 0
  function walk(items) {
    for (const node of items || []) {
      if (node.data.type === 'unit') units++
      if (node.data.type === 'position') {
        positions++
        employees += node.data.employees?.length ?? 0
      }
      walk(node.children)
    }
  }
  walk(tree)
  statistics.value = { units, positions, employees }
}

function assignPositionLevels(tree, parentUnitLevel = 0, positionDepth = 0) {
  for (const node of tree || []) {
    if (node.data.type === 'unit') {
      node.data.positionLevel = 0
      assignPositionLevels(node.children, node.data.level || 0, 0)
    } else if (node.data.type === 'position') {
      node.data.positionLevel = parentUnitLevel + positionDepth + 1
      assignPositionLevels(node.children, parentUnitLevel, positionDepth + 1)
    }
  }
}

// محاسبه counts برای هر نود
function enrichNodesWithCounts(tree) {
  function walk(items) {
    for (const node of items || []) {
      let posCount = 0
      let empCount = 0
      if (node.data.type === 'position') {
        posCount = 1
        empCount = node.data.employees?.length || 0
      }
      if (node.children?.length) {
        const childStats = walk(node.children)
        posCount += childStats.positions
        empCount += childStats.employees
      }
      node.data.positionsCount = posCount
      node.data.employeesCount = empCount
    }
    return { positions: posCount || 0, employees: empCount || 0 }
  }
  // اصلاح: بازگشت صحیح
  function compute(items) {
    let totalPos = 0, totalEmp = 0
    for (const node of items || []) {
      let pos = node.data.type === 'position' ? 1 : 0
      let emp = node.data.employees?.length || 0
      if (node.children?.length) {
        const sub = compute(node.children)
        pos += sub.positions
        emp += sub.employees
      }
      node.data.positionsCount = pos
      node.data.employeesCount = emp
      totalPos += pos
      totalEmp += emp
    }
    return { positions: totalPos, employees: totalEmp }
  }
  compute(tree)
}

function getPositionLevelClass(level) {
  if (!level || level < 1) return 1
  return ((level - 1) % 4) + 1
}

/* ═══════════════════════════════════════════
FILTER
═══════════════════════════════════════════ */
const filteredNodes = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  if (!query) return nodes.value

  function filterTree(items) {
    return items
        .map(node => {
          const title = node.data.title ?? node.data.post_title ?? ''
          const employees = node.data.employees ?? []
          const employeeMatch = employees.some(emp => emp.name?.toLowerCase().includes(query))
          const selfMatch = title.toLowerCase().includes(query)
          const children = filterTree(node.children ?? [])
          if (selfMatch || employeeMatch || children.length) {
            return { ...node, children }
          }
          return null
        })
        .filter(Boolean)
  }
  return filterTree(nodes.value)
})

/* ═══════════════════════════════════════════
FOCUS / BREADCRUMB
═══════════════════════════════════════════ */
function findNodeById(tree, id) {
  for (const node of tree || []) {
    if (node.data.id === id) return node
    const found = findNodeById(node.children, id)
    if (found) return found
  }
  return null
}

function findAncestors(tree, targetId, path = []) {
  for (const node of tree || []) {
    if (node.data.id === targetId) return path
    if (node.children?.length) {
      const found = findAncestors(node.children, targetId, [...path, node.data])
      if (found) return found
    }
  }
  return null
}

function onNodeSelect(node) {
  const ancestors = findAncestors(nodes.value, node.data.id) || []
  focusedNode.value = {
    id: node.data.id,
    type: node.data.type,
    title: node.data.title || node.data.post_title,
    ancestors,
    positionsCount: node.data.positionsCount || 0,
    employeesCount: node.data.employeesCount || 0,
    depth: node.data.positionLevel || node.data.level || 0,
  }
}

function focusNode(ancestor) {
  const node = findNodeById(nodes.value, ancestor.id)
  if (node) onNodeSelect(node)
}

function clearFocus() {
  focusedNode.value = null
  selectedNode.value = null
}

/* ═══════════════════════════════════════════
CONTEXT MENU
═══════════════════════════════════════════ */
function openContextMenu(event, node) {
  const items = []

  if (node.data.type === 'unit') {
    items.push({
      label: 'ویرایش واحد',
      icon: 'pi pi-pencil',
      command: () => openEditUnit(node),
    })
    items.push({
      label: 'افزودن سمت زیرمجموعه',
      icon: 'pi pi-plus',
      command: () => openCreate(node),
    })
  } else {
    items.push({
      label: 'ویرایش سمت',
      icon: 'pi pi-pencil',
      command: () => openEdit(node),
    })
    items.push({
      label: 'افزودن سمت زیرمجموعه',
      icon: 'pi pi-plus',
      command: () => openCreate(node),
    })
    if (node.data.employees?.length) {
      items.push({
        label: 'مشاهده پرسنل',
        icon: 'pi pi-users',
        command: () => openPeopleDialog(node),
      })
    }
    items.push({ separator: true })
    items.push({
      label: 'حذف سمت',
      icon: 'pi pi-trash',
      class: 'text-red-600',
      command: () => deletePosition(node),
    })
  }

  contextMenuItems.value = items
  contextMenu.value.show(event)
}

/* ═══════════════════════════════════════════
PEOPLE DIALOG
═══════════════════════════════════════════ */
function openPeopleDialog(node) {
  peopleDialogNode.value = node
  peopleDialogVisible.value = true
}

function navigateToEmployee(userId) {
  router.push(`/hr/employees/${userId}`)
}

/* ═══════════════════════════════════════════
EXPAND / COLLAPSE
═══════════════════════════════════════════ */
function expandAll() {
  const keys = {}
  function walk(items) {
    for (const node of items || []) {
      keys[node.key] = true
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes.value)
  expandedKeys.value = keys
}

function collapseAll() {
  expandedKeys.value = {}
}

/* ═══════════════════════════════════════════
FORMS
═══════════════════════════════════════════ */
const form = ref({
  id: null,
  organizational_unit_id: null,
  parent_id: null,
  post_title: '',
  post_code: '',
  job_title: '',
  job_code: '',
  is_custom: true,
  is_active: true,
  sort_order: 0,
  description: '',
})

const selectedUser = ref(null)
const userSuggestions = ref([])
const searchingUser = ref(false)

const newUserDialogVisible = ref(false)
const savingNewUser = ref(false)
const newUserForm = ref({
  name: '',
  mobile: '',
  national_code: '',
  personnel_code: '',
  password: '123456',
})

async function searchUsers(event) {
  searchingUser.value = true
  try {
    const response = await axios.get('hr/users/search', {
      params: { q: event.query }
    })
    userSuggestions.value = response.data.data ?? []
  } catch (error) {
    console.error('خطا در جستجوی کاربر:', error)
    userSuggestions.value = []
  } finally {
    searchingUser.value = false
  }
}

async function saveNewUser() {
  if (!newUserForm.value.name || !newUserForm.value.mobile) {
    errorMessage.value = 'نام و موبایل الزامی است.'
    return
  }

  savingNewUser.value = true
  errorMessage.value = ''

  try {
    const response = await axios.post('hr/users', newUserForm.value)
    const createdUser = response.data.user

    selectedUser.value = {
      id: createdUser.id,
      name: createdUser.name,
      mobile: createdUser.mobile,
      personnel_code: createdUser.personnel_code
    }

    newUserDialogVisible.value = false
    successMessage.value = `کاربر "${createdUser.name}" با موفقیت ایجاد و انتخاب شد.`

    newUserForm.value = {
      name: '',
      mobile: '',
      national_code: '',
      personnel_code: '',
      password: '123456'
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'خطا در ایجاد کاربر.'
  } finally {
    savingNewUser.value = false
  }
}

function resetForm() {
  form.value = {
    id: null,
    organizational_unit_id: null,
    parent_id: null,
    post_title: '',
    post_code: '',
    job_title: '',
    job_code: '',
    is_custom: true,
    is_active: true,
    sort_order: 0,
    description: '',
  }
  selectedUser.value = null
}

function openCreate(parentNode = null) {
  resetForm()
  dialogMode.value = 'create'
  if (parentNode) {
    if (parentNode.data.type !== 'position') {
      form.value.organizational_unit_id = parentNode.data.id
    } else {
      form.value.organizational_unit_id = parentNode.data.unit_id
      form.value.parent_id = parentNode.data.id
    }
  }
  dialogVisible.value = true
}

function openEdit(node) {
  if (node.data.type !== 'position') return
  dialogMode.value = 'edit'
  form.value = {
    id: node.data.id,
    organizational_unit_id: node.data.unit_id,
    parent_id: node.data.parent_id,
    post_title: node.data.post_title ?? '',
    post_code: node.data.post_code ?? '',
    job_title: node.data.job_title ?? '',
    job_code: node.data.job_code ?? '',
    is_custom: node.data.is_custom ?? false,
    is_active: node.data.is_active ?? true,
    sort_order: node.data.sort_order ?? 0,
    description: node.data.description ?? '',
  }

  if (node.data.employees && node.data.employees.length > 0) {
    const emp = node.data.employees[0]
    selectedUser.value = {
      id: emp.user_id,
      name: emp.name,
      mobile: emp.mobile,
      personnel_code: emp.personnel_code
    }
  } else {
    selectedUser.value = null
  }

  dialogVisible.value = true
}

function openEditByData(data) {
  // برای Table View
  const node = findNodeById(nodes.value, data.id)
  if (node) openEdit(node)
}

function openEditUnit(node) {
  if (node.data.type !== 'unit') return
  unitForm.value = {
    id: node.data.id,
    title: node.data.title,
    parent_id: node.data.parent_id,
    parent_position_id: node.data.parent_position_id,
  }
  unitDialogVisible.value = true
}

async function deletePosition(node) {
  if (node.data.type !== 'position') return
  const confirmed = window.confirm(`آیا از حذف سمت «${node.data.post_title}» اطمینان دارید؟`)
  if (!confirmed) return
  try {
    await axios.delete(`hr/organizational-positions/${node.data.id}`)
    successMessage.value = 'سمت با موفقیت حذف شد.'
    await loadTree()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'امکان حذف سمت وجود ندارد.'
  }
}

function deletePositionById(data) {
  const node = findNodeById(nodes.value, data.id)
  if (node) deletePosition(node)
}

/* ═══════════════════════════════════════════
API
═══════════════════════════════════════════ */
async function loadTree() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await axios.get('hr/organizational-positions/tree')
    nodes.value = response.data.data ?? []
    assignPositionLevels(nodes.value)
    enrichNodesWithCounts(nodes.value)
    calculateStatistics(nodes.value)
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'خطا در دریافت ساختار سازمانی.'
  } finally {
    loading.value = false
  }
}

async function onNodeDrop(event) {
  const dragNode = event.dragNode
  const dropNode = event.dropNode
  const dropPosition = event.dropPosition

  if (!dragNode || !dropNode) {
    await loadTree()
    return
  }

  if (dragNode.data.type === 'unit') {
    if (dragNode.data.id === dropNode.data.id) {
      errorMessage.value = 'یک واحد نمی‌تواند زیرمجموعه خودش قرار بگیرد.'
      await loadTree()
      return
    }

    if (dropNode.data.type === 'unit') {
      let parentId = null
      if (dropPosition === 0) {
        parentId = dropNode.data.id
      } else {
        parentId = dropNode.data.parent_id ?? null
      }
      try {
        await axios.post(
            `hr/organizational-units/${dragNode.data.id}/move`,
            { parent_id: parentId, parent_position_id: null, sort_order: null }
        )
        successMessage.value = 'واحد سازمانی با موفقیت جابه‌جا شد.'
        await loadTree()
      } catch (error) {
        errorMessage.value = error.response?.data?.message ?? 'امکان جابه‌جایی واحد سازمانی وجود ندارد.'
        await loadTree()
      }
      return
    }

    if (dropNode.data.type === 'position') {
      if (dropPosition !== 0) {
        errorMessage.value = 'واحد فقط می‌تواند داخل سمت قرار بگیرد.'
        await loadTree()
        return
      }
      try {
        await axios.post(
            `hr/organizational-units/${dragNode.data.id}/move`,
            { parent_id: null, parent_position_id: dropNode.data.id, sort_order: null }
        )
        successMessage.value = 'واحد سازمانی با موفقیت زیر سمت قرار گرفت.'
        await loadTree()
      } catch (error) {
        errorMessage.value = error.response?.data?.message ?? 'امکان جابه‌جایی واحد سازمانی وجود ندارد.'
        await loadTree()
      }
      return
    }
    await loadTree()
    return
  }

  if (dragNode.data.type === 'position') {
    if (dropNode.data.type !== 'position' && dropNode.data.type !== 'unit') {
      await loadTree()
      return
    }

    let parentId = null
    let organizationalUnitId = null
    let sortOrder = null

    if (dropNode.data.type === 'position') {
      organizationalUnitId = dropNode.data.unit_id
      if (dropPosition === 0) {
        parentId = dropNode.data.id
        sortOrder = 0
      } else {
        parentId = dropNode.data.parent_id ?? null
        if (dropPosition < 0) {
          sortOrder = Math.max(0, (dropNode.data.sort_order ?? 0) - 1)
        } else {
          sortOrder = (dropNode.data.sort_order ?? 0) + 1
        }
      }
    } else if (dropNode.data.type === 'unit') {
      organizationalUnitId = dropNode.data.id
      parentId = null
      sortOrder = 0
    }

    if (parentId !== null && parentId === dragNode.data.id) {
      errorMessage.value = 'یک سمت نمی‌تواند زیرمجموعه خودش قرار بگیرد.'
      await loadTree()
      return
    }

    try {
      await axios.post(
          `hr/organizational-positions/${dragNode.data.id}/move`,
          { parent_id: parentId, organizational_unit_id: organizationalUnitId, sort_order: sortOrder }
      )
      successMessage.value = 'سمت با موفقیت جابه‌جا شد.'
      await loadTree()
    } catch (error) {
      errorMessage.value = error.response?.data?.message ?? 'امکان جابه‌جایی سمت وجود ندارد.'
      await loadTree()
    }
    return
  }

  await loadTree()
}

async function savePosition() {
  if (saving.value) return
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true

  try {
    const payload = { ...form.value, user_id: selectedUser.value?.id ?? null }
    if (dialogMode.value === 'create') {
      await axios.post('hr/organizational-positions', payload)
      successMessage.value = 'سمت با موفقیت ایجاد شد.'
    } else {
      await axios.put(`hr/organizational-positions/${form.value.id}`, payload)
      successMessage.value = 'سمت با موفقیت ویرایش شد.'
    }
    dialogVisible.value = false
    await loadTree()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'خطا در ذخیره اطلاعات سمت.'
  } finally {
    saving.value = false
  }
}

/* ═══════════════════════════════════════════
UNITS
═══════════════════════════════════════════ */
const units = ref([])

const availableParentUnits = computed(() => {
  return units.value.filter(u => u.id !== unitForm.value.id)
})

const availableParentPositions = computed(() => {
  return allPositions.value.map(p => ({
    id: p.id,
    label: `${p.post_title} (${p.unit_title || ''})`,
  }))
})

function onUnitParentChange() {
  if (unitForm.value.parent_id) {
    unitForm.value.parent_position_id = null
  }
}

function onUnitPositionParentChange() {
  if (unitForm.value.parent_position_id) {
    unitForm.value.parent_id = null
  }
}

async function saveUnit() {
  if (savingUnit.value) return
  errorMessage.value = ''
  successMessage.value = ''
  savingUnit.value = true

  try {
    await axios.post(
        `hr/organizational-units/${unitForm.value.id}/move`,
        {
          parent_id: unitForm.value.parent_id,
          parent_position_id: unitForm.value.parent_position_id,
          sort_order: null,
        }
    )
    successMessage.value = 'واحد سازمانی با موفقیت ویرایش شد.'
    unitDialogVisible.value = false
    await loadTree()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'خطا در ویرایش واحد سازمانی.'
  } finally {
    savingUnit.value = false
  }
}

async function loadUnits() {
  try {
    const response = await axios.get('hr/organizational-units')
    units.value = response.data.data ?? []
  } catch (error) {
    console.error('خطا در دریافت لیست واحدها:', error)
  }
}

async function loadAllPositions() {
  try {
    const response = await axios.get('hr/organizational-positions')
    allPositions.value = response.data.data ?? []
  } catch (error) {
    console.error('خطا در دریافت لیست سمت‌ها:', error)
  }
}

/* ═══════════════════════════════════════════
LIFECYCLE
═══════════════════════════════════════════ */
onMounted(() => {
  loadTree()
  loadUnits()
  loadAllPositions()
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
PAGE
═══════════════════════════════════════════ */
.org-page {
  @apply space-y-5;
  animation: dashboard-enter .45s ease-out;
}

/* ═══════════════════════════════════════════
SKELETON (هم‌سبک Dashboard)
═══════════════════════════════════════════ */
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
.skeleton-circle { @apply rounded-full; }
@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

/* ═══════════════════════════════════════════
HERO (هم‌سبک Dashboard Hero)
═══════════════════════════════════════════ */
.org-hero {
  @apply relative overflow-hidden rounded-3xl p-6 md:p-8;
  border: 1px solid rgb(199 210 254 / 70%);
  background: linear-gradient(135deg, rgb(238 242 255), rgb(248 250 252) 55%, rgb(245 243 255));
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}
.hero-decoration {
  @apply absolute rounded-full pointer-events-none;
  filter: blur(50px);
}
.hero-decoration-one {
  width: 220px; height: 220px;
  background: rgb(129 140 248 / 12%);
  top: -100px; left: -60px;
}
.hero-decoration-two {
  width: 180px; height: 180px;
  background: rgb(167 139 250 / 12%);
  bottom: -100px; right: -50px;
}
.hero-title {
  @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight;
}
.hero-subtitle {
  @apply text-sm md:text-base text-slate-500 mt-1;
}
.hero-status {
  @apply w-2 h-2 rounded-full bg-emerald-500;
  box-shadow: 0 0 0 4px rgb(16 185 129 / 10%);
}
.hero-meta {
  @apply flex items-center gap-1.5 text-xs text-slate-500;
}
.hero-meta i { @apply text-slate-400; }

/* ═══════════════════════════════════════════
STATS GRID
═══════════════════════════════════════════ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .75rem;
}
.stat-card {
  @apply bg-white rounded-2xl border border-slate-200/70 p-4;
  display: flex;
  align-items: center;
  gap: .85rem;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
  transition: all .2s ease;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgb(15 23 42 / 6%);
  transform: translateY(-1px);
}
.stat-icon {
  @apply flex items-center justify-center w-11 h-11 rounded-xl text-lg;
}
.stat-icon.blue { background: #eff6ff; color: #2563eb; }
.stat-icon.violet { background: #f5f3ff; color: #7c3aed; }
.stat-icon.emerald { background: #ecfdf5; color: #059669; }
.stat-icon.amber { background: #fffbeb; color: #b45309; }
.stat-content { flex: 1; min-width: 0; }
.stat-label {
  @apply block text-xs text-slate-500;
}
.stat-value {
  @apply block mt-1 text-xl font-bold text-slate-800;
}
.stat-trend {
  @apply flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full;
}
.stat-trend.up { background: #ecfdf5; color: #059669; }
.stat-trend.down { background: #fef2f2; color: #dc2626; }

/* ═══════════════════════════════════════════
DASHBOARD CARD
═══════════════════════════════════════════ */
.dashboard-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

/* ═══════════════════════════════════════════
TOOLBAR
═══════════════════════════════════════════ */
.org-toolbar {
  @apply flex items-center justify-between gap-4 p-4 border-b border-slate-200/70;
  background: linear-gradient(to bottom, #fbfcfe, #ffffff);
}
.toolbar-right {
  @apply flex items-center gap-3 min-w-0;
}
.toolbar-icon {
  @apply grid place-items-center w-10 h-10 rounded-xl;
  background: #eff6ff;
  color: #2563eb;
}
.toolbar-right strong {
  @apply block text-sm font-bold text-slate-800;
}
.toolbar-right small {
  @apply block mt-0.5 text-xs text-slate-500;
}
.toolbar-left {
  @apply flex items-center gap-2;
}

/* View Switcher */
.view-switcher {
  @apply flex items-center gap-1 p-1 rounded-xl bg-slate-100/70;
}
.view-btn {
  @apply grid place-items-center w-9 h-9 rounded-lg text-slate-500 transition-all;
}
.view-btn:hover {
  @apply text-slate-700 bg-white/60;
}
.view-btn.active {
  @apply text-indigo-600 bg-white shadow-sm;
}

/* Smart Search */
.smart-search {
  @apply relative flex items-center;
}
.search-icon {
  @apply absolute right-3 text-slate-400 pointer-events-none;
}
.search-input {
  @apply pr-9 pl-8 py-2 text-sm rounded-xl border border-slate-200 bg-white;
  width: 260px;
  transition: all .2s;
}
.search-input:focus {
  @apply border-indigo-300 ring-2 ring-indigo-100 outline-none;
  width: 300px;
}
.search-clear {
  @apply absolute left-2 w-6 h-6 rounded-full bg-slate-200/70 hover:bg-slate-300/70 cursor-pointer grid place-items-center text-slate-500;
}

.expand-controls {
  @apply flex items-center gap-0.5;
}

/* ═══════════════════════════════════════════
BREADCRUMB
═══════════════════════════════════════════ */
.org-breadcrumb {
  @apply flex items-center gap-2 px-4 py-2.5 border-b border-slate-200/70 bg-slate-50/50 text-xs overflow-x-auto;
}
.crumb {
  @apply flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors whitespace-nowrap;
}
.crumb i { @apply text-[10px]; }
.crumb.current {
  @apply font-semibold text-slate-800 bg-white border border-slate-200/70 px-2.5 py-1;
}
.crumb-sep {
  @apply text-[9px] text-slate-300;
}

/* ═══════════════════════════════════════════
FOCUS STATS
═══════════════════════════════════════════ */
.focus-stats {
  @apply flex items-center gap-3 px-4 py-3 border-b border-slate-200/70 bg-gradient-to-l from-indigo-50/40 to-transparent;
}
.focus-stat {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/70;
}
.focus-stat i {
  @apply text-indigo-500;
}
.focus-stat strong {
  @apply block text-sm font-bold text-slate-800;
}
.focus-stat span {
  @apply block text-[10px] text-slate-500;
}
.focus-clear {
  @apply mr-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors;
}

/* ═══════════════════════════════════════════
TREE CONTAINER
═══════════════════════════════════════════ */
.tree-container {
  @apply p-4;
  min-height: 360px;
  max-height: 72vh;
  overflow: auto;
  background-color: #f8fafc;
  background-image: radial-gradient(#e2e8f0 0.8px, transparent 0.8px);
  background-size: 18px 18px;
}
.org-tree {
  min-width: max-content;
  border: 0 !important;
  background: transparent !important;
}
:deep(.p-tree-root-children) { padding: 0 !important; }
:deep(.p-tree-node) { padding: 0 !important; }
:deep(.p-tree-node-content) {
  @apply flex items-start gap-1 py-1 px-0 border-0 rounded-lg bg-transparent;
}
:deep(.p-tree-node-content:hover) { background: transparent !important; }
:deep(.p-tree-node-toggle-button) {
  @apply rounded-md text-slate-500;
  flex: 0 0 22px;
  width: 22px !important;
  height: 22px !important;
  margin: .38rem .05rem 0 0 !important;
}
:deep(.p-tree-node-toggle-button:hover) {
  color: #1d4ed8 !important;
  background: #e8efff !important;
}
:deep(.p-tree-node-children) {
  margin: .18rem 0 0 0 !important;
  padding: .15rem 0 !important;
  border-right: 1px solid #cbd5e1 !important;
  padding-right: .85rem !important;
  margin-right: .65rem !important;
}
:deep(.p-tree-node-drop-point) {
  height: 4px;
  border-radius: 4px;
  background: #3b82f6;
}

/* ═══════════════════════════════════════════
UNIT CARD
═══════════════════════════════════════════ */
.unit-card {
  @apply relative overflow-hidden rounded-xl border transition-all;
  min-width: 320px;
  max-width: 460px;
  border-color: #bfd5fb;
  background: linear-gradient(110deg, #fff 0%, #f3f7ff 100%);
  box-shadow: 0 2px 5px rgb(29 78 216 / 4%);
}
.unit-card:hover {
  border-color: #7daaf8;
  box-shadow: 0 4px 14px rgb(37 99 235 / 10%);
}
.unit-accent {
  @apply absolute top-0 bottom-0 right-0 w-1;
  background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
}
.unit-body {
  @apply flex items-center gap-2 w-full p-3;
}
.unit-drag, .pos-drag {
  @apply grid place-items-center text-slate-400 cursor-grab text-xs;
  flex: 0 0 18px;
}
.unit-drag:hover, .pos-drag:hover { color: #2563eb; }
.unit-drag:active, .pos-drag:active { cursor: grabbing; }
.unit-avatar {
  @apply grid place-items-center rounded-lg text-white text-sm;
  flex: 0 0 36px;
  height: 36px;
  background: linear-gradient(145deg, #3b82f6, #1d4ed8);
  box-shadow: 0 2px 6px rgb(37 99 235 / 25%);
}
.unit-info, .pos-info {
  @apply flex-1 min-w-0;
}
.unit-name {
  @apply block text-slate-800 text-sm font-bold leading-relaxed;
  overflow-wrap: anywhere;
}
.unit-meta {
  @apply flex items-center flex-wrap gap-1.5 mt-1.5;
}
.meta-tag {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-slate-600 bg-slate-100/80;
}
.meta-tag i { @apply text-[9px] text-slate-400; }
.meta-count {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-indigo-700 bg-indigo-50;
}
.meta-count i { @apply text-[9px]; }
.parent-badge {
  @apply inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold;
  color: #92400e;
  background: #fef3c7;
}
.parent-badge i { @apply text-[9px]; }

/* ═══════════════════════════════════════════
POSITION CARD
═══════════════════════════════════════════ */
.position-card {
  @apply relative flex items-start gap-2 rounded-lg border p-2.5 transition-all;
  min-width: 300px;
  max-width: 460px;
  border-color: #dce4ef;
  background: #fff;
  box-shadow: 0 1px 4px rgb(15 23 42 / 4%);
}
.position-card:hover {
  border-color: #b8c8df;
  box-shadow: 0 3px 10px rgb(15 23 42 / 7%);
}

/* Level Colors */
.pos-level-1 {
  border-right: 3px solid #3b82f6;
  background: linear-gradient(100deg, #fff, #f5f9ff);
}
.pos-level-1 .pos-dot { background: #3b82f6; }
.pos-level-1 .pos-level-badge { color: #1d4ed8; background: #dbeafe; }

.pos-level-2 {
  border-right: 3px solid #10b981;
  background: linear-gradient(100deg, #fff, #f4fcf8);
}
.pos-level-2 .pos-dot { background: #10b981; }
.pos-level-2 .pos-level-badge { color: #047857; background: #d1fae5; }

.pos-level-3 {
  border-right: 3px solid #8b5cf6;
  background: linear-gradient(100deg, #fff, #faf8ff);
}
.pos-level-3 .pos-dot { background: #8b5cf6; }
.pos-level-3 .pos-level-badge { color: #6d28d9; background: #ede9fe; }

.pos-level-4 {
  border-right: 3px solid #f59e0b;
  background: linear-gradient(100deg, #fff, #fffbf5);
}
.pos-level-4 .pos-dot { background: #f59e0b; }
.pos-level-4 .pos-level-badge { color: #92400e; background: #fef3c7; }

.pos-dot {
  @apply rounded-full;
  flex: 0 0 7px;
  width: 7px;
  height: 7px;
  margin-top: .45rem;
}
.pos-info {
  flex: 1;
  min-width: 0;
}
.pos-header {
  @apply flex items-start justify-between gap-2;
}
.pos-name {
  @apply block text-slate-800 text-sm font-bold leading-relaxed;
  overflow-wrap: anywhere;
}
.pos-level-badge {
  @apply px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap flex-shrink-0;
}
.pos-details {
  @apply flex items-center flex-wrap gap-1.5 mt-1 text-[11px] text-slate-500;
}
.pos-details span {
  @apply inline-flex items-center gap-1;
}
.pos-details i {
  @apply text-[9px] text-slate-400;
}

/* Avatar Stack */
.pos-people-stack {
  @apply flex items-center gap-2 mt-2;
}
.avatar-stack {
  @apply flex items-center;
}
.stack-avatar {
  @apply grid place-items-center rounded-full text-white text-[10px] font-bold cursor-pointer border-2 border-white;
  width: 26px;
  height: 26px;
  margin-left: -6px;
  transition: transform .15s;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
}
.stack-avatar:first-child { margin-left: 0; }
.stack-avatar:hover {
  transform: translateY(-2px) scale(1.1);
  z-index: 10;
}
.stack-more {
  @apply bg-slate-500 hover:bg-slate-600;
}
.people-count {
  @apply text-[11px] text-slate-500 font-medium;
}
.pos-empty {
  @apply inline-flex items-center gap-1 mt-1.5 text-[11px] text-slate-400;
}

/* ═══════════════════════════════════════════
TABLE VIEW
═══════════════════════════════════════════ */
.table-container {
  @apply p-4;
  min-height: 360px;
  max-height: 72vh;
  overflow: auto;
}
.org-table {
  @apply text-sm;
}
.type-badge {
  @apply inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold;
}
.type-badge.unit {
  background: #eff6ff;
  color: #1d4ed8;
}
.type-badge.position {
  background: #f5f3ff;
  color: #6d28d9;
}
.type-badge i { @apply text-[9px]; }
.table-title {
  @apply flex flex-col;
}
.table-title span {
  @apply font-semibold text-slate-800;
}
.table-path {
  @apply text-[10px] text-slate-400 mt-0.5;
}
.table-code {
  @apply font-mono text-xs text-slate-600;
}
.level-pill {
  @apply inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700;
}
.count-pill {
  @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700;
}
.count-pill i { @apply text-[9px]; }
.table-actions {
  @apply flex items-center gap-0.5;
}

/* ═══════════════════════════════════════════
FOOTER
═══════════════════════════════════════════ */
.tree-footer {
  @apply flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/70 text-xs text-slate-500;
  background: #fbfcfe;
}
.footer-hint {
  @apply flex items-center gap-1.5;
}
.footer-hint i { @apply text-indigo-500; }
.footer-stats {
  @apply flex items-center gap-2;
}
.sep { @apply text-slate-300; }

/* ═══════════════════════════════════════════
EMPTY STATE
═══════════════════════════════════════════ */
.empty-state {
  @apply flex flex-col items-center justify-center text-slate-400;
  min-height: 280px;
}
.empty-icon {
  @apply grid place-items-center rounded-full text-slate-400;
  width: 56px;
  height: 56px;
  background: #eaf0f7;
  font-size: 1.3rem;
}
.empty-state h3 {
  @apply mt-3 text-slate-600 text-base font-bold;
}
.empty-state p {
  @apply text-sm;
}

/* ═══════════════════════════════════════════
PEOPLE DIALOG
═══════════════════════════════════════════ */
.people-list {
  @apply flex flex-col gap-2;
  max-height: 400px;
  overflow-y: auto;
}
.person-row {
  @apply flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 cursor-pointer transition-all;
}
.person-row:hover {
  @apply border-indigo-200 bg-indigo-50/40;
}
.person-avatar-lg {
  @apply grid place-items-center rounded-full text-white text-sm font-bold flex-shrink-0;
  width: 40px;
  height: 40px;
}
.person-info {
  @apply flex-1 min-w-0;
}
.person-info strong {
  @apply block text-sm font-bold text-slate-800;
}
.person-meta {
  @apply flex items-center flex-wrap gap-2 mt-0.5 text-[11px] text-slate-500;
}
.person-meta span {
  @apply inline-flex items-center gap-1;
}
.person-meta i { @apply text-[9px]; }
.person-nav {
  @apply text-slate-400;
}

/* ═══════════════════════════════════════════
DIALOGS
═══════════════════════════════════════════ */
.dialog-intro {
  @apply flex items-center gap-3 pb-3 mb-3 border-b border-slate-200;
}
.dialog-icon {
  @apply grid place-items-center rounded-lg;
  width: 38px;
  height: 38px;
  color: #2563eb;
  background: #eff6ff;
}
.dialog-intro strong {
  @apply block text-slate-800 text-sm font-bold;
}
.dialog-intro small {
  @apply block mt-0.5 text-slate-400 text-xs;
}
.form-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.form-field {
  @apply flex flex-col gap-1.5 min-w-0;
}
.form-field.full { grid-column: 1 / -1; }
.form-field label {
  @apply text-xs font-semibold text-slate-700;
}
.form-field label span { @apply text-red-500; }
.status-field { justify-content: center; }
.status-control {
  @apply flex items-center gap-2 text-sm;
  min-height: 36px;
}
.field-hint {
  @apply flex items-center gap-1 text-slate-400 text-[11px] mt-1;
}
.user-select-wrapper {
  @apply flex items-start gap-2;
}
.user-select-wrapper :deep(.p-autocomplete) { flex: 1; min-width: 0; }
.user-option-item {
  @apply flex items-center gap-2.5 py-1;
}
.user-avatar-sm {
  @apply grid place-items-center rounded-full text-white text-[11px] font-bold flex-shrink-0;
  width: 30px;
  height: 30px;
  background: #7c3aed;
}
.user-avatar-xs {
  @apply grid place-items-center rounded-full;
  width: 22px;
  height: 22px;
  color: #4338ca;
  background: #e0e7ff;
  font-size: .6rem;
}
.user-info-sm { @apply flex flex-col; }
.user-name-sm {
  @apply text-slate-800 text-xs font-semibold;
}
.user-detail-sm {
  @apply flex items-center gap-1.5 mt-0.5 text-slate-500 text-[10px];
}
.ml-2 { @apply mr-2; }
.flex-grow-1 { flex: 1; }
:deep(.p-select) { width: 100%; }

/* ═══════════════════════════════════════════
ANIMATION
═══════════════════════════════════════════ */
@keyframes dashboard-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ═══════════════════════════════════════════
RESPONSIVE (فقط دسکتاپ)
═══════════════════════════════════════════ */
@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .org-toolbar {
    @apply flex-col items-stretch;
  }
  .toolbar-left {
    @apply flex-wrap;
  }
  .search-input { width: 100%; }
  .search-input:focus { width: 100%; }
  .smart-search { @apply flex-1; }
}
</style>
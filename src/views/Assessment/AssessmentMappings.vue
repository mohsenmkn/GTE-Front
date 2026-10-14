<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت نگاشت‌های ارزیابی</h1>
        <p class="text-sm text-gray-500 mt-1">مدیریت شناسنامه‌ها و ارزیاب‌های دستی</p>
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
        <Button icon="pi pi-plus" label="نگاشت جدید" @click="showCreateDialog = true" />
      </div>
    </div>

    <TabView>
      <!-- تب ۱: بدون شناسنامه -->
      <TabPanel header="بدون شناسنامه">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div class="text-amber-600 text-sm font-medium">پست‌های بدون شناسنامه</div>
            <div class="text-2xl font-bold text-amber-800 mt-1">{{ unmappedPositions.length }}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <div class="text-green-600 text-sm font-medium">شناسنامه‌های موجود</div>
            <div class="text-2xl font-bold text-green-800 mt-1">{{ availablePosts.length }}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div class="text-blue-600 text-sm font-medium">نگاشت‌های فعال</div>
            <div class="text-2xl font-bold text-blue-800 mt-1">{{ mappings.filter(m => m.is_active).length }}</div>
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
                  <Button icon="pi pi-link" label="اتصال دستی" severity="info" size="small" @click="quickMap(data)" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>

      <!-- تب ۲: بدون ارزیاب -->
      <TabPanel header="بدون ارزیاب">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            <span class="text-sm text-blue-800">پرسنلی که شناسنامه دارند اما ارزیاب خودکار برای آن‌ها یافت نشده است.</span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div class="text-orange-600 text-sm font-medium">بدون ارزیاب</div>
            <div class="text-2xl font-bold text-orange-800 mt-1">{{ noEvaluatorSummary.total || 0 }}</div>
          </div>
          <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div class="text-emerald-600 text-sm font-medium">تعیین شده</div>
            <div class="text-2xl font-bold text-emerald-800 mt-1">{{ assignedCount }}</div>
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


      <!-- تب ۳: نگاشت پرسنل به سمت -->
      <TabPanel header="نگاشت پرسنل به سمت">
        <!-- ═══ بخش انتخاب سمت ═══ -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              انتخاب سمت مقصد <span class="text-red-500">*</span>
            </label>
            <Select
                v-model="selectedPosition"
                :options="positions"
                optionLabel="post_title"
                placeholder="جستجو و انتخاب سمت..."
                filter
                filterPlaceholder="جستجو در سمت‌ها..."
                class="w-full"
                @change="onPositionChange"
            >
              <template #option="slotProps">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ slotProps.option.post_title }}</div>
                    <div class="text-xs text-gray-500">{{ slotProps.option.unit?.title }}</div>
                  </div>
                  <Tag
                      v-if="slotProps.option.is_custom"
                      value="دستی"
                      severity="warning"
                      class="text-xs"
                  />
                </div>
              </template>
              <template #value="slotProps">
                <div v-if="slotProps.value">
                  <div class="font-medium">{{ slotProps.value.post_title }}</div>
                  <div class="text-xs text-gray-500">{{ slotProps.value.unit?.title }}</div>
                </div>
                <span v-else class="text-gray-400">انتخاب کنید...</span>
              </template>
            </Select>
          </div>
          <div v-if="selectedPosition" class="bg-green-50 p-4 rounded-lg border border-green-100">
            <div class="text-green-600 text-sm font-medium">پرسنل فعلی این سمت</div>
            <div class="text-2xl font-bold text-green-800 mt-1">{{ positionEmployees.length }}</div>
          </div>
        </div>

        <!-- ═══ بخش اصلی ═══ -->
        <template v-if="selectedPosition">
          <!-- لیست پرسنل سمت -->
          <Card>
            <template #header>
              <div class="flex items-center justify-between px-6 pt-4">
                <h3 class="text-lg font-semibold text-gray-800">
                  پرسنل سمت: {{ selectedPosition.post_title }}
                </h3>
                <div class="flex gap-2">
                  <Button
                      icon="pi pi-file-excel"
                      label="Import از اکسل"
                      severity="info"
                      outlined
                      @click="openExcelImportDialog"
                  />
                  <Button
                      icon="pi pi-plus"
                      label="افزودن پرسنل"
                      @click="openAssignDialog"
                  />
                </div>
              </div>
            </template>
            <template #content>
              <DataTable
                  :value="positionEmployees"
                  :loading="loadingPositionEmployees"
                  stripedRows
                  paginator
                  :rows="10"
                  :rowsPerPageOptions="[10, 25, 50, 100]"
                  emptyMessage="پرسنلی به این سمت تخصیص نیافته است"
              >
                <Column field="personnel_code" header="کد پرسنلی" style="width: 120px" />
                <Column field="name" header="نام و نام خانوادگی" />
                <Column field="mobile" header="موبایل" style="width: 150px" />
                <Column field="post_title" header="سمت فعلی" />
                <Column header="عملیات" style="width: 100px">
                  <template #body="{ data }">
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        text
                        @click="confirmUnassign(data)"
                    />
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>
        </template>

        <!-- پیام راهنما وقتی سمتی انتخاب نشده -->
        <div v-else class="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
          <i class="pi pi-search text-4xl text-gray-300 mb-3 block"></i>
          <p class="text-gray-500">لطفاً یک سمت را انتخاب کنید تا پرسنل آن را مشاهده کنید</p>
        </div>
      </TabPanel>

      <!-- تب ۳: همه نگاشت‌ها -->
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
                  <div v-if="data.mapping_type === 'title_pattern'" class="font-medium">{{ data.post_title_pattern }}</div>
                  <div v-else class="font-medium">{{ data.unit?.title || '—' }}</div>
                </template>
              </Column>
              <Column header="شناسنامه مقصد">
                <template #body="{ data }">
                  <div class="font-medium text-gray-800">{{ data.assessment_post?.title }}</div>
                  <div class="text-xs text-gray-500">{{ data.assessment_post?.grade }} - {{ data.assessment_post?.unit }}</div>
                </template>
              </Column>
              <Column field="description" header="توضیحات">
                <template #body="{ data }">
                  <span class="text-sm text-gray-600">{{ data.description || '—' }}</span>
                </template>
              </Column>
              <Column header="وضعیت">
                <template #body="{ data }">
                  <Tag :value="data.is_active ? 'فعال' : 'غیرفعال'" :severity="data.is_active ? 'success' : 'secondary'" />
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
                    <Button icon="pi pi-trash" severity="danger" size="small" text @click="confirmDelete(data)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>
    </TabView>

    <!-- دیالوگ ایجاد نگاشت -->
    <Dialog
        v-model:visible="showCreateDialog"
        :header="editingPosition ? 'اتصال سریع' : 'نگاشت جدید'"
        :style="{ width: '600px' }"
        modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">نوع نگاشت <span class="text-red-500">*</span></label>
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
          <label class="block text-sm font-medium text-gray-700 mb-1">الگوی عنوان پست <span class="text-red-500">*</span></label>
          <InputText v-model="form.post_title_pattern" class="w-full" placeholder="مثال: %دامپتراک%" />
        </div>
        <div v-else>
          <label class="block text-sm font-medium text-gray-700 mb-1">واحد سازمانی <span class="text-red-500">*</span></label>
          <Select
              v-model="form.organizational_unit_id"
              :options="units"
              optionLabel="title"
              optionValue="id"
              placeholder="انتخاب واحد"
              class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">شناسنامه شایستگی مقصد <span class="text-red-500">*</span></label>
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
                <div class="text-xs text-gray-500">{{ slotProps.option.grade }} - {{ slotProps.option.unit }}</div>
              </div>
            </template>
          </Select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
          <Textarea v-model="form.description" class="w-full" rows="2" placeholder="اختیاری" />
        </div>
      </div>
      <template #footer>
        <Button label="انصراف" severity="secondary" @click="closeCreateDialog" />
        <Button label="ذخیره" icon="pi pi-check" :loading="saving" @click="saveMapping" />
      </template>
    </Dialog>

    <!-- دیالوگ افزودن پرسنل به سمت -->
    <Dialog
        v-model:visible="showAssignDialog"
        header="افزودن پرسنل به سمت"
        :style="{ width: '750px' }"
        modal
    >
      <div v-if="selectedPosition" class="mb-4">
        <div class="bg-blue-50 p-3 rounded-lg mb-4">
      <span class="text-sm text-blue-800">
        سمت مقصد: <strong>{{ selectedPosition.post_title }}</strong>
        <span class="text-gray-500">({{ selectedPosition.unit?.title }})</span>
      </span>
        </div>

        <div class="relative mb-4">
          <i class="pi pi-search absolute right-3 top-3 text-gray-400"></i>
          <InputText
              v-model="employeeSearch"
              placeholder="جستجو بر اساس نام یا کد پرسنلی..."
              class="w-full pr-10"
              @input="debouncedSearchEmployees"
          />
        </div>
      </div>

      <DataTable
          :value="availableEmployees"
          :loading="loadingAvailableEmployees"
          stripedRows
          paginator
          :rows="10"
          selectionMode="multiple"
          v-model:selection="selectedEmployees"
          :metaKeySelection="false"
          emptyMessage="پرسنلی یافت نشد"
          class="text-sm"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem" />
        <Column field="personnel_code" header="کد پرسنلی" style="width: 100px" />
        <Column field="name" header="نام و نام خانوادگی" />
        <Column field="mobile" header="موبایل" style="width: 130px" />
        <Column field="current_post_title" header="سمت فعلی">
          <template #body="{ data }">
            <span class="text-xs text-gray-500">{{ data.current_post_title || '—' }}</span>
          </template>
        </Column>
      </DataTable>

      <div v-if="selectedEmployees.length" class="mt-3 text-sm text-gray-600">
        <i class="pi pi-check-circle text-green-500 ml-1"></i>
        {{ selectedEmployees.length }} نفر انتخاب شده است
      </div>

      <template #footer>
        <Button label="انصراف" severity="secondary" @click="closeAssignDialog" />
        <Button
            label="تخصیص به سمت"
            icon="pi pi-check"
            :disabled="!selectedEmployees.length"
            :loading="assigningEmployees"
            @click="assignEmployeesToPosition"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- دیالوگ Import از فایل اکسل -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showExcelDialog"
        header="Import پرسنل از فایل اکسل"
        :style="{ width: '800px' }"
        modal
        :closable="!confirmingExcelImport"
    >
      <!-- ═══ مرحله ۱: انتخاب فایل ═══ -->
      <div v-if="excelStep === 'upload'" class="space-y-4">
        <!-- اطلاعات سمت مقصد -->
        <div v-if="selectedPosition" class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div class="flex items-center gap-2 text-blue-800">
            <i class="pi pi-info-circle"></i>
            <span class="text-sm">
          سمت مقصد: <strong>{{ selectedPosition.post_title }}</strong>
          <span class="text-gray-500">({{ selectedPosition.unit?.title }})</span>
        </span>
          </div>
        </div>

        <!-- راهنمای فرمت فایل -->
        <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h4 class="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            راهنمای فرمت فایل
          </h4>
          <ul class="text-sm text-amber-700 space-y-1 mr-4">
            <li>• فرمت‌های مجاز: <strong>xlsx, xls, csv</strong></li>
            <li>• فقط ستون اول به عنوان <strong>کد پرسنلی</strong> خوانده می‌شود</li>
            <li>• ردیف اول می‌تواند عنوان باشد (اختیاری)</li>
            <li>• حداکثر <strong>1000 رکورد</strong> مجاز است</li>
            <li>• حداکثر حجم فایل: <strong>10 مگابایت</strong></li>
          </ul>
        </div>

        <!-- نمونه فرمت -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 class="font-medium text-gray-700 mb-2">نمونه فرمت فایل:</h4>
          <div class="bg-white border border-gray-300 rounded overflow-hidden text-sm">
            <table class="w-full">
              <thead>
              <tr class="bg-gray-100">
                <th class="px-4 py-2 text-right border-b border-gray-300">کد پرسنلی</th>
              </tr>
              </thead>
              <tbody>
              <tr><td class="px-4 py-2 border-b border-gray-200">1001</td></tr>
              <tr><td class="px-4 py-2 border-b border-gray-200">1002</td></tr>
              <tr><td class="px-4 py-2">1003</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ناحیه آپلود فایل -->
        <div
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
            :class="excelDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'"
            @click="triggerFileInput"
            @dragover.prevent="excelDragOver = true"
            @dragleave="excelDragOver = false"
            @drop.prevent="handleFileDrop"
        >
          <i class="pi pi-cloud-upload text-5xl text-gray-400 mb-3 block"></i>
          <p class="text-gray-600 mb-2">فایل اکسل را اینجا بکشید یا کلیک کنید</p>
          <p class="text-sm text-gray-400">xlsx, xls, csv - حداکثر 10 مگابایت</p>
          <input
              ref="excelFileInputRef"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="handleFileSelect"
          />
        </div>

        <!-- فایل انتخاب شده -->
        <div v-if="selectedExcelFile" class="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-file-excel text-2xl text-green-600"></i>
            <div>
              <div class="font-medium text-green-800">{{ selectedExcelFile.name }}</div>
              <div class="text-sm text-green-600">{{ formatFileSize(selectedExcelFile.size) }}</div>
            </div>
          </div>
          <Button icon="pi pi-times" severity="danger" text rounded @click="removeSelectedFile" />
        </div>

        <!-- خطای فایل -->
        <div v-if="excelFileError" class="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-red-600"></i>
          <span class="text-sm text-red-700">{{ excelFileError }}</span>
        </div>
      </div>

      <!-- ═══ مرحله ۲: پیش‌نمایش ═══ -->
      <div v-else-if="excelStep === 'preview'">
        <!-- حالت بارگذاری -->
        <div v-if="loadingExcelPreview" class="text-center py-12">
          <i class="pi pi-spin pi-spinner text-5xl text-blue-500 mb-4 block"></i>
          <p class="text-gray-500 text-lg">در حال پردازش فایل اکسل...</p>
        </div>

        <!-- نمایش نتایج پیش‌نمایش -->
        <div v-else-if="excelPreview">
          <!-- خلاصه آماری -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
              <div class="text-blue-600 text-sm font-medium">کل رکوردها</div>
              <div class="text-3xl font-bold text-blue-800 mt-1">{{ excelPreview.summary.total }}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
              <div class="text-green-600 text-sm font-medium">معتبر</div>
              <div class="text-3xl font-bold text-green-800 mt-1">{{ excelPreview.summary.valid }}</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
              <div class="text-red-600 text-sm font-medium">نامعتبر</div>
              <div class="text-3xl font-bold text-red-800 mt-1">{{ excelPreview.summary.invalid }}</div>
            </div>
            <div class="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
              <div class="text-amber-600 text-sm font-medium">تکراری</div>
              <div class="text-3xl font-bold text-amber-800 mt-1">{{ excelPreview.summary.already_assigned }}</div>
            </div>
          </div>

          <!-- هشدار اگر هیچ رکورد معتبری نیست -->
          <div v-if="!excelPreview.summary.valid" class="bg-red-50 p-4 rounded-lg border border-red-200 mb-4 flex items-center gap-3">
            <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
            <div>
              <div class="font-medium text-red-800">هیچ رکورد معتبری یافت نشد</div>
              <div class="text-sm text-red-600">لطفاً فایل را بررسی کنید و دوباره تلاش کنید</div>
            </div>
          </div>

          <!-- جدول پرسنل معتبر -->
          <div v-if="excelPreview.valid.length" class="mb-6">
            <h4 class="font-medium text-green-700 mb-3 flex items-center gap-2">
              <i class="pi pi-check-circle"></i>
              پرسنل معتبر - آماده نگاشت ({{ excelPreview.valid.length }} نفر)
            </h4>
            <DataTable
                :value="excelPreview.valid"
                stripedRows
                paginator
                :rows="10"
                class="text-sm"
                scrollable
                scrollHeight="300px"
            >
              <Column field="personnel_code" header="کد پرسنلی" style="width: 110px" />
              <Column field="name" header="نام و نام خانوادگی" />
              <Column field="current_position" header="سمت فعلی">
                <template #body="{ data }">
                  <span class="text-xs text-gray-600">{{ data.current_position || '—' }}</span>
                </template>
              </Column>
              <Column field="current_unit" header="واحد فعلی">
                <template #body="{ data }">
                  <span class="text-xs text-gray-500">{{ data.current_unit || '—' }}</span>
                </template>
              </Column>
            </DataTable>
          </div>

          <!-- جدول پرسنل نامعتبر -->
          <div v-if="excelPreview.invalid.length" class="mb-6">
            <h4 class="font-medium text-red-700 mb-3 flex items-center gap-2">
              <i class="pi pi-times-circle"></i>
              پرسنل نامعتبر ({{ excelPreview.invalid.length }} نفر)
            </h4>
            <DataTable
                :value="excelPreview.invalid"
                stripedRows
                paginator
                :rows="5"
                class="text-sm"
                scrollable
                scrollHeight="200px"
            >
              <Column field="personnel_code" header="کد پرسنلی" style="width: 110px" />
              <Column field="name" header="نام">
                <template #body="{ data }">
                  <span>{{ data.name || '—' }}</span>
                </template>
              </Column>
              <Column field="reason" header="دلیل">
                <template #body="{ data }">
                  <span class="text-red-600 text-xs">{{ data.reason }}</span>
                </template>
              </Column>
            </DataTable>
          </div>

          <!-- جدول تکراری‌ها -->
          <div v-if="excelPreview.already_assigned.length" class="mb-4">
            <h4 class="font-medium text-amber-700 mb-3 flex items-center gap-2">
              <i class="pi pi-exclamation-circle"></i>
              قبلاً تخصیص یافته ({{ excelPreview.already_assigned.length }} نفر)
            </h4>
            <DataTable
                :value="excelPreview.already_assigned"
                stripedRows
                paginator
                :rows="5"
                class="text-sm"
                scrollable
                scrollHeight="200px"
            >
              <Column field="personnel_code" header="کد پرسنلی" style="width: 110px" />
              <Column field="name" header="نام و نام خانوادگی" />
            </DataTable>
          </div>
        </div>
      </div>

      <!-- ═══ Footer دیالوگ ═══ -->
      <template #footer>
        <!-- مرحله آپلود -->
        <template v-if="excelStep === 'upload'">
          <Button label="انصراف" severity="secondary" @click="closeExcelDialog" />
          <Button
              label="مرحله بعد: پیش‌نمایش"
              icon="pi pi-arrow-left"
              :disabled="!selectedExcelFile"
              @click="goToPreview"
          />
        </template>

        <!-- مرحله پیش‌نمایش -->
        <template v-else-if="excelStep === 'preview'">
          <Button
              label="بازگشت"
              icon="pi pi-arrow-right"
              severity="secondary"
              :disabled="loadingExcelPreview || confirmingExcelImport"
              @click="backToUpload"
          />
          <Button
              label="تایید و نگاشت"
              icon="pi pi-check"
              severity="success"
              :disabled="!excelPreview?.summary?.valid || confirmingExcelImport"
              :loading="confirmingExcelImport"
              @click="confirmExcelImport"
          />
        </template>
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
// ── متغیرهای تب نگاشت پرسنل به سمت ──────────────────
const positions = ref([])
const selectedPosition = ref(null)
const positionEmployees = ref([])
const loadingPositionEmployees = ref(false)
const showAssignDialog = ref(false)
const availableEmployees = ref([])
const loadingAvailableEmployees = ref(false)
const selectedEmployees = ref([])
const assigningEmployees = ref(false)
const employeeSearch = ref('')
let searchTimeout = null
// ── متغیرهای دیالوگ Import اکسل ──────────────────
const showExcelDialog = ref(false)
const excelStep = ref('upload') // 'upload' | 'preview'
const excelFileInputRef = ref(null)
const selectedExcelFile = ref(null)
const excelFileError = ref(null)
const excelDragOver = ref(false)
const excelPreview = ref(null)
const loadingExcelPreview = ref(false)
const confirmingExcelImport = ref(false)

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
  await loadPositions() // ✅ اضافه شد
})


// ── متدهای تب نگاشت پرسنل به سمت ──────────────────

async function loadPositions() {
  try {
    const { data } = await api.get('/hr/organizational-positions')
    positions.value = data.data || []
  } catch (e) {
    console.error('Load positions error:', e)
  }
}

async function onPositionChange() {
  // بستن دیالوگ اکسل اگر باز است
  if (showExcelDialog.value) {
    closeExcelDialog()
  }

  if (!selectedPosition.value) {
    positionEmployees.value = []
    return
  }
  await loadPositionEmployees()
}

async function loadPositionEmployees() {
  if (!selectedPosition.value) return

  loadingPositionEmployees.value = true
  try {
    const { data } = await api.get(
        `/hr/organizational-positions/${selectedPosition.value.id}`
    )
    positionEmployees.value = (data.data?.employees || []).map(emp => ({
      id: emp.id,
      user_id: emp.user_id,
      name: emp.user?.name || 'بدون نام',
      personnel_code: emp.personnel_code,
      mobile: emp.user?.mobile || '—',
      post_title: emp.post_title,
    }))
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت پرسنل سمت',
      life: 3000
    })
  } finally {
    loadingPositionEmployees.value = false
  }
}

function openAssignDialog() {
  showAssignDialog.value = true
  selectedEmployees.value = []
  employeeSearch.value = ''
  loadAvailableEmployees()
}

function closeAssignDialog() {
  showAssignDialog.value = false
  selectedEmployees.value = []
  employeeSearch.value = ''
}

// ── متدهای Import اکسل ──────────────────

// ── متدهای دیالوگ Import اکسل ──────────────────

function openExcelImportDialog() {
  if (!selectedPosition.value) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'لطفاً ابتدا یک سمت انتخاب کنید',
      life: 3000,
    })
    return
  }

  // ریست کردن حالت دیالوگ
  excelStep.value = 'upload'
  selectedExcelFile.value = null
  excelFileError.value = null
  excelPreview.value = null
  excelDragOver.value = false

  showExcelDialog.value = true
}

function closeExcelDialog() {
  showExcelDialog.value = false
  excelStep.value = 'upload'
  selectedExcelFile.value = null
  excelFileError.value = null
  excelPreview.value = null
}

function triggerFileInput() {
  excelFileInputRef.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    validateAndSetFile(file)
  }
  // ریست کردن input برای امکان انتخاب مجدد همان فایل
  event.target.value = ''
}

function handleFileDrop(event) {
  excelDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function validateAndSetFile(file) {
  excelFileError.value = null

  // اعتبارسنجی نوع فایل
  const validExtensions = ['.xlsx', '.xls', '.csv']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

  if (!hasValidExtension) {
    excelFileError.value = 'فرمت فایل نامعتبر است. لطفاً فایل Excel (xlsx, xls) یا CSV انتخاب کنید.'
    selectedExcelFile.value = null
    return
  }

  // اعتبارسنجی حجم فایل (حداکثر 10 مگابایت)
  if (file.size > 10 * 1024 * 1024) {
    excelFileError.value = 'حجم فایل نباید بیشتر از 10 مگابایت باشد.'
    selectedExcelFile.value = null
    return
  }

  // بررسی خالی نبودن فایل
  if (file.size === 0) {
    excelFileError.value = 'فایل انتخابی خالی است.'
    selectedExcelFile.value = null
    return
  }

  selectedExcelFile.value = file
}

function removeSelectedFile() {
  selectedExcelFile.value = null
  excelFileError.value = null
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 بایت'
  const k = 1024
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function goToPreview() {
  if (!selectedExcelFile.value || !selectedPosition.value) return

  excelStep.value = 'preview'
  loadingExcelPreview.value = true
  excelPreview.value = null

  const formData = new FormData()
  formData.append('file', selectedExcelFile.value)

  try {
    const { data } = await api.post(
        `/hr/organizational-positions/${selectedPosition.value.id}/excel/preview`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
    )
    excelPreview.value = data.data

    // اگر هیچ رکورد معتبری نبود، هشدار بده
    if (!excelPreview.value.summary.valid) {
      toast.add({
        severity: 'warn',
        summary: 'هشدار',
        detail: 'هیچ رکورد معتبری در فایل یافت نشد',
        life: 4000,
      })
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در پردازش فایل اکسل',
      life: 5000,
    })
    // بازگشت به مرحله آپلود
    excelStep.value = 'upload'
  } finally {
    loadingExcelPreview.value = false
  }
}

function backToUpload() {
  excelStep.value = 'upload'
  excelPreview.value = null
}

async function confirmExcelImport() {
  if (!excelPreview.value?.valid?.length || !selectedPosition.value) return

  confirmingExcelImport.value = true
  try {
    const userIds = excelPreview.value.valid.map(item => item.user_id)
    const { data } = await api.post(
        `/hr/organizational-positions/${selectedPosition.value.id}/excel/confirm`,
        { user_ids: userIds }
    )

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: data.message || 'پرسنل با موفقیت تخصیص یافتند',
      life: 4000,
    })

    // بستن دیالوگ و ریست کردن
    closeExcelDialog()

    // به‌روزرسانی لیست پرسنل سمت
    await loadPositionEmployees()

  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در تایید نگاشت',
      life: 5000,
    })
  } finally {
    confirmingExcelImport.value = false
  }
}

function cancelExcelImport() {
  showExcelImport.value = false
  excelPreview.value = null
  loadingExcelPreview.value = false
}

function debouncedSearchEmployees() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadAvailableEmployees()
  }, 400)
}

async function loadAvailableEmployees() {
  if (!selectedPosition.value) return

  loadingAvailableEmployees.value = true
  try {
    const { data } = await api.get(
        `/hr/organizational-positions/${selectedPosition.value.id}/available-employees`,
        { params: { search: employeeSearch.value || undefined } }
    )
    availableEmployees.value = data.data || []
  } catch (e) {
    console.error('Load available employees error:', e)
  } finally {
    loadingAvailableEmployees.value = false
  }
}

async function assignEmployeesToPosition() {
  if (!selectedPosition.value || !selectedEmployees.value.length) return

  assigningEmployees.value = true
  try {
    const userIds = selectedEmployees.value.map(emp => emp.id)
    const { data } = await api.post(
        `/hr/organizational-positions/${selectedPosition.value.id}/assign-employees`,
        { user_ids: userIds }
    )

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: data.message || 'پرسنل با موفقیت تخصیص یافتند',
      life: 3000,
    })

    closeAssignDialog()
    await loadPositionEmployees()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در تخصیص پرسنل',
      life: 5000,
    })
  } finally {
    assigningEmployees.value = false
  }
}

function confirmUnassign(employee) {
  confirm.require({
    message: `آیا از حذف «${employee.name}» از این سمت اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await api.post(
            `/hr/organizational-positions/${selectedPosition.value.id}/unassign-employees`,
            { user_ids: [employee.user_id] }
        )
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: `«${employee.name}» از سمت حذف شد`,
          life: 3000
        })
        await loadPositionEmployees()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در حذف پرسنل',
          life: 3000
        })
      }
    },
  })
}
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
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت داده‌ها', life: 3000 })
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
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت لیست بدون ارزیاب', life: 3000 })
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
    const { data } = await api.post('/assessment/mappings', form.value)

    // ✅ نمایش پیام مناسب بر اساس به‌روزرسانی یا ایجاد
    if (data.updated) {
      toast.add({
        severity: 'success',
        summary: 'به‌روزرسانی شد',
        detail: 'نگاشت قبلی با موفقیت به‌روزرسانی شد',
        life: 3000,
      })
    } else {
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'نگاشت با موفقیت ایجاد شد',
        life: 3000,
      })
    }

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
    toast.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً ارزیاب را انتخاب کنید', life: 3000 })
    return
  }
  if (!selectedCycleId.value) {
    toast.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً چرخه ارزیابی را انتخاب کنید', life: 3000 })
    return
  }

  assigning.value[position.user_id] = true
  try {
    await api.post('/assessment/mappings/assign-evaluator', {
      cycle_id: selectedCycleId.value,
      user_id: position.user_id,
      evaluator_id: selectedEvaluators.value[position.user_id],
    })
    toast.add({ severity: 'success', summary: 'موفق', detail: `ارزیاب برای ${position.name} تعیین شد`, life: 3000 })
    await loadNoEvaluator()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: e.response?.data?.message || 'خطا در تعیین ارزیاب', life: 5000 })
  } finally {
    assigning.value[position.user_id] = false
  }
}

async function toggleMapping(mapping) {
  try {
    await api.put(`/assessment/mappings/${mapping.id}/toggle`)
    toast.add({ severity: 'success', summary: 'موفق', detail: mapping.is_active ? 'نگاشت غیرفعال شد' : 'نگاشت فعال شد', life: 3000 })
    await loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در تغییر وضعیت', life: 3000 })
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
        toast.add({ severity: 'success', summary: 'موفق', detail: 'نگاشت حذف شد', life: 3000 })
        await loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در حذف', life: 3000 })
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
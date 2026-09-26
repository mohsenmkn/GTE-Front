<template>
  <div class="p-4">
    <!-- هدر صفحه -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت قالب‌های نامه</h1>
        <p class="text-gray-600 text-sm mt-1">تعریف قالب‌های نامه با نگاشت داینامیک فیلدها</p>
      </div>
      <Button
          label="قالب جدید"
          icon="pi pi-plus"
          @click="openNewTemplateDialog"
          severity="success"
      />
    </div>

    <!-- جدول قالب‌ها -->
    <Card>
      <template #content>
        <DataTable
            :value="templates"
            :loading="loading"
            stripedRows
            paginator
            :rows="15"
            :rowsPerPageOptions="[15, 25, 50]"
            class="p-datatable-sm"
        >
          <Column field="id" header="#" style="width: 60px" />
          <Column field="name" header="نام قالب" style="min-width: 200px" />
          <Column field="slug" header="شناسه" style="min-width: 150px" />
          <Column field="entity_mapping.table_name" header="جدول مقصد" style="min-width: 150px">
            <template #body="{ data }">
              <Tag :value="data.entity_mapping?.table_name || '-'" severity="info" size="small" />
            </template>
          </Column>
          <Column field="entity_type_code" header="ETC" style="min-width: 80px">
            <template #body="{ data }">
              <Tag :value="data.entity_type_code || '-'" severity="secondary" size="small" />
            </template>
          </Column>
          <Column field="virtual_personnel_user_id" header="UserID فرستنده" style="min-width: 120px" />
          <Column field="virtual_personnel_role_id" header="RoleID فرستنده" style="min-width: 120px" />
          <Column field="receiver_role_id" header="RoleID گیرنده" style="min-width: 120px" />
          <Column field="receiver_user_id" header="UserID گیرنده" style="min-width: 120px">
            <template #body="{ data }">
              <Tag :value="data.receiver_user_id || '-'" severity="warning" size="small" />
            </template>
          </Column>
          <Column field="is_active" header="وضعیت" style="min-width: 100px">
            <template #body="{ data }">
              <Tag
                  :value="data.is_active ? 'فعال' : 'غیرفعال'"
                  :severity="data.is_active ? 'success' : 'danger'"
                  size="small"
              />
            </template>
          </Column>
          <Column header="عملیات" style="width: 180px" class="text-center">
            <template #body="{ data }">
              <div class="flex gap-1 justify-center">
                <Button
                    icon="pi pi-eye"
                    severity="info"
                    text
                    size="small"
                    @click="viewTemplate(data)"
                    v-tooltip="'مشاهده جزئیات'"
                />
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    text
                    size="small"
                    @click="editTemplate(data)"
                    v-tooltip="'ویرایش'"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    @click="confirmDelete(data.id)"
                    v-tooltip="'حذف'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog ساخت/ویرایش قالب -->
    <Dialog
        v-model:visible="showDialog"
        :header="isEdit ? 'ویرایش قالب' : 'ایجاد قالب جدید'"
        :style="{ width: '950px', maxWidth: '95vw' }"
        :modal="true"
        :closable="true"
        :maximizable="true"
    >
      <form @submit.prevent="saveTemplate" class="flex flex-col gap-4">

        <!-- ═══════ بخش 1: اطلاعات کلی ═══════ -->
        <div class="field">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            اطلاعات کلی قالب
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 font-medium">نام قالب <span class="text-red-500">*</span></label>
              <InputText
                  v-model="form.name"
                  placeholder="مثال: گواهی اشتغال به کار"
                  class="w-full"
                  :class="{ 'p-invalid': errors.name }"
              />
              <small v-if="errors.name" class="p-error">{{ errors.name[0] }}</small>
            </div>
            <div>
              <label class="block mb-1 font-medium">شناسه یکتا (Slug) <span class="text-red-500">*</span></label>
              <InputText
                  v-model="form.slug"
                  placeholder="مثال: employment_certificate"
                  class="w-full"
                  :class="{ 'p-invalid': errors.slug }"
              />
              <small v-if="errors.slug" class="p-error">{{ errors.slug[0] }}</small>
            </div>
            <div class="md:col-span-2">
              <label class="block mb-1 font-medium">توضیحات</label>
              <Textarea
                  v-model="form.description"
                  placeholder="توضیحات قالب"
                  rows="2"
                  class="w-full"
              />
            </div>
          </div>
        </div>

        <Divider />

        <!-- ══════ بخش 2: تنظیمات اتصال و نگاشت ═══════ -->
        <div class="field">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-database text-green-600"></i>
            تنظیمات اتصال و نگاشت
          </h3>

          <!-- نام جدول -->
          <div class="mb-4">
            <label class="block mb-1 font-medium">نام جدول در SQL Server <span class="text-red-500">*</span></label>
            <InputText
                v-model="form.entity_mapping.table_name"
                placeholder="مثال: Entity_Dakhli"
                class="w-full"
                :class="{ 'p-invalid': errors['entity_mapping.table_name'] }"
            />
            <small class="text-gray-500">نام جدولی که نامه‌ها در آن ذخیره می‌شوند</small>
          </div>

          <!-- نگاشت فیلدها -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label class="block font-medium">نگاشت فیلدها <span class="text-red-500">*</span></label>
              <Button
                  label="افزودن فیلد"
                  icon="pi pi-plus"
                  size="small"
                  severity="info"
                  @click="addFieldMapping"
                  type="button"
              />
            </div>

            <div v-for="(mapping, index) in fieldMappings" :key="index" class="flex gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">نام منطقی فیلد</label>
                <InputText
                    v-model="mapping.logical_name"
                    placeholder="مثال: subject, mozoa, body"
                    class="w-full"
                    @change="updateFieldMappings"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">نام فیزیکی در دیتابیس</label>
                <InputText
                    v-model="mapping.physical_name"
                    placeholder="مثال: DocSubject, Mozoa, VerayeshGar"
                    class="w-full"
                    @change="updateFieldMappings"
                />
              </div>
              <div class="flex items-end">
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    @click="removeFieldMapping(index)"
                    type="button"
                />
              </div>
            </div>

            <div v-if="fieldMappings.length === 0" class="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <i class="pi pi-database text-3xl mb-2"></i>
              <p>هیچ فیلدی تعریف نشده است</p>
            </div>
          </div>

          <!-- مقادیر ثابت -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label class="block font-medium">مقادیر ثابت (Static Values)</label>
              <Button
                  label="افزودن مقدار ثابت"
                  icon="pi pi-plus"
                  size="small"
                  severity="secondary"
                  @click="addStaticValue"
                  type="button"
              />
            </div>

            <div v-for="(value, index) in staticValuesList" :key="index" class="flex gap-2 mb-2 p-3 bg-blue-50 rounded-lg">
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">نام ستون</label>
                <InputText
                    v-model="value.column"
                    placeholder="مثال: IsActive, IsConfirm"
                    class="w-full"
                    @change="updateStaticValues"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-600 mb-1">مقدار</label>
                <InputText
                    v-model="value.value"
                    placeholder="مثال: 1, 0, EntityCode"
                    class="w-full"
                    @change="updateStaticValues"
                />
              </div>
              <div class="flex items-end">
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    @click="removeStaticValue(index)"
                    type="button"
                />
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <!-- ═══════ بخش 3: فرمت شماره نامه ═══════ -->
        <div class="field">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-hashtag text-indigo-600"></i>
            فرمت شماره نامه سفارشی (اختیاری)
          </h3>

          <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-indigo-600"></i>
              <span class="text-sm text-indigo-700">
                شماره نامه با فرمت: <strong>PREFIX/YEAR/SEQUENCE</strong> تولید می‌شود
              </span>
            </div>
            <p class="text-xs text-indigo-600 mt-1">
              مثال: EMP/1405/1001 (گواهی اشتغال به کار / سال 1405 / شماره 1001)
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <!-- فیلد 1: پیشوند -->
            <div>
              <label class="block mb-1 font-medium text-sm">
                پیشوند (حروف انگلیسی)
              </label>
              <InputText
                  v-model="letterFormat.prefix"
                  placeholder="EMP"
                  maxlength="10"
                  class="w-full"
                  :class="{ 'p-invalid': errors['letter_number_format.prefix'] }"
                  @input="letterFormat.prefix = letterFormat.prefix.toUpperCase().replace(/[^A-Z]/g, '')"
              />
              <small v-if="errors['letter_number_format.prefix']" class="p-error">
                {{ errors['letter_number_format.prefix'][0] }}
              </small>
              <small class="text-gray-500 text-xs">مثال: EMP, CER, GUA</small>
            </div>

            <!-- فیلد 2: سال -->
            <div>
              <label class="block mb-1 font-medium text-sm">سال</label>
              <InputText
                  v-model="letterFormat.year"
                  placeholder="1405"
                  class="w-full"
              />
              <small class="text-gray-500 text-xs">سال شمسی</small>
            </div>

            <!-- فیلد 3: شماره شروع -->
            <div>
              <label class="block mb-1 font-medium text-sm">شروع از شماره</label>
              <InputNumber
                  v-model="letterFormat.start_from"
                  placeholder="1000"
                  :min="1"
                  class="w-full"
              />
              <small class="text-gray-500 text-xs">مثال: 1000</small>
            </div>

            <!-- فیلد 4: جداکننده -->
            <div>
              <label class="block mb-1 font-medium text-sm">جداکننده</label>
              <InputText
                  v-model="letterFormat.separator"
                  placeholder="/"
                  maxlength="5"
                  class="w-full"
              />
              <small class="text-gray-500 text-xs">مثال: / یا -</small>
            </div>
          </div>

          <!-- پیش‌نمایش -->
          <div v-if="letterFormat.prefix && letterFormat.year && letterFormat.start_from"
               class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center gap-2">
              <i class="pi pi-check-circle text-green-600"></i>
              <span class="text-sm text-green-700 font-semibold">پیش‌نمایش شماره نامه:</span>
            </div>
            <div class="text-lg font-bold text-green-800 mt-2 text-center">
              {{ letterFormat.prefix }}{{ letterFormat.separator || '/' }}{{ letterFormat.year }}{{ letterFormat.separator || '/' }}{{ String(letterFormat.start_from).padStart(4, '0') }}
            </div>
          </div>

          <!-- دکمه پاک کردن -->
          <div class="mt-3 flex justify-end">
            <Button
                label="پاک کردن فرمت"
                icon="pi pi-trash"
                severity="secondary"
                size="small"
                @click="resetLetterFormat"
                type="button"
            />
          </div>
        </div>

        <Divider />

        <!-- ═══════ بخش 4: تنظیمات کاربران مجازی ═══════ -->
        <div class="field">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-users text-purple-600"></i>
            تنظیمات کاربران (فرستنده و گیرنده)
          </h3>

          <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-purple-600"></i>
              <span class="text-sm text-purple-700">
                <strong>فرستنده:</strong> کاربر مجازی "پرسنل بدون کارتابل" که نامه‌ها با این کاربر ثبت می‌شوند
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <i class="pi pi-info-circle text-purple-600"></i>
              <span class="text-sm text-purple-700">
                <strong>گیرنده:</strong> کاربر/نقش دبیرخانه یا هر شخص دیگری که نامه به او ارسال می‌شود
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- فرستنده -->
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">فرستنده (کاربر مجازی)</h4>
              <div class="flex flex-col gap-2">
                <div>
                  <label class="block mb-1 font-medium text-sm">
                    UserID فرستنده (CreatorID) <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                      v-model="form.virtual_personnel_user_id"
                      placeholder="مثال: 1727"
                      class="w-full"
                      :class="{ 'p-invalid': errors.virtual_personnel_user_id }"
                  />
                  <small v-if="errors.virtual_personnel_user_id" class="p-error">
                    {{ errors.virtual_personnel_user_id[0] }}
                  </small>
                  <small class="text-gray-500 text-xs">UserID کاربر "پرسنل بدون کارتابل"</small>
                </div>
                <div>
                  <label class="block mb-1 font-medium text-sm">
                    RoleID فرستنده (CreatorRoleID) <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                      v-model="form.virtual_personnel_role_id"
                      placeholder="مثال: 1880"
                      class="w-full"
                      :class="{ 'p-invalid': errors.virtual_personnel_role_id }"
                  />
                  <small v-if="errors.virtual_personnel_role_id" class="p-error">
                    {{ errors.virtual_personnel_role_id[0] }}
                  </small>
                  <small class="text-gray-500 text-xs">RoleID کاربر مجازی</small>
                </div>
              </div>
            </div>

            <!-- گیرنده -->
            <div class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 class="font-semibold text-orange-800 mb-2">گیرنده نامه</h4>
              <div class="flex flex-col gap-2">
                <div>
                  <label class="block mb-1 font-medium text-sm">
                    RoleID گیرنده <span class="text-red-500">*</span>
                  </label>
                  <InputNumber
                      v-model="form.receiver_role_id"
                      placeholder="مثال: 1534"
                      class="w-full"
                      :class="{ 'p-invalid': errors.receiver_role_id }"
                  />
                  <small v-if="errors.receiver_role_id" class="p-error">
                    {{ errors.receiver_role_id[0] }}
                  </small>
                  <small class="text-gray-500 text-xs">RoleID دبیرخانه یا گیرنده</small>
                </div>
                <div>
                  <label class="block mb-1 font-medium text-sm">
                    UserID گیرنده (اختیاری)
                  </label>
                  <InputNumber
                      v-model="form.receiver_user_id"
                      placeholder="مثال: 1528 (اختیاری)"
                      class="w-full"
                      :class="{ 'p-invalid': errors.receiver_user_id }"
                  />
                  <small v-if="errors.receiver_user_id" class="p-error">
                    {{ errors.receiver_user_id[0] }}
                  </small>
                  <small class="text-gray-500 text-xs">UserID شخصی که نامه به او ارسال می‌شود</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <!-- ═══════ بخش 5: تنظیمات گردش کار ═══════ -->
        <div class="field">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i class="pi pi-refresh text-orange-600"></i>
            تنظیمات گردش کار
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1 font-medium">
                ActionCode پیش‌فرض <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  v-model="form.target_action_code"
                  placeholder="مثال: 13 (جهت اقدام)"
                  class="w-full"
                  :class="{ 'p-invalid': errors.target_action_code }"
              />
              <small v-if="errors.target_action_code" class="p-error">
                {{ errors.target_action_code[0] }}
              </small>
              <small class="text-gray-500 text-xs">کد اکشن پیش‌فرض برای گردش نامه</small>
            </div>
            <div>
              <label class="block mb-1 font-medium">
                کد نوع نامه (EntityTypeCode/ETC) <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  v-model="form.entity_type_code"
                  placeholder="مثال: 562"
                  class="w-full"
                  :class="{ 'p-invalid': errors.entity_type_code }"
              />
              <small v-if="errors.entity_type_code" class="p-error">
                {{ errors.entity_type_code[0] }}
              </small>
              <small class="text-gray-500 text-xs">کد نوع نامه در اتوماسیون (ETC)</small>
            </div>
            <div>
              <label class="block mb-1 font-medium">جدول ActiveSends</label>
              <InputText
                  v-model="form.workflow_mapping.sends_table"
                  placeholder="ActiveSends"
                  class="w-full"
                  readonly
              />
            </div>
            <div>
              <label class="block mb-1 font-medium">جدول ActiveSend_Receivers</label>
              <InputText
                  v-model="form.workflow_mapping.receivers_table"
                  placeholder="ActiveSend_Receivers"
                  class="w-full"
                  readonly
              />
            </div>
          </div>
        </div>

        <Divider />

        <!-- ═══════ دکمه‌های عملیات ═══════ -->
        <div class="flex gap-2 justify-end pt-2">
          <Button
              label="انصراف"
              severity="secondary"
              @click="showDialog = false"
              type="button"
          />
          <Button
              label="ذخیره قالب"
              icon="pi pi-check"
              type="submit"
              :loading="saving"
              severity="success"
          />
        </div>
      </form>
    </Dialog>

    <!-- Dialog مشاهده جزئیات -->
    <Dialog
        v-model:visible="showViewDialog"
        header="جزئیات قالب"
        :style="{ width: '800px' }"
        :modal="true"
    >
      <div v-if="selectedTemplate" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600">نام قالب</label>
            <div class="font-semibold">{{ selectedTemplate.name }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600">شناسه</label>
            <div class="font-semibold">{{ selectedTemplate.slug }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600">جدول مقصد</label>
            <Tag :value="selectedTemplate.entity_mapping?.table_name" severity="info" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">کد نوع نامه (ETC)</label>
            <Tag :value="selectedTemplate.entity_type_code || '-'" severity="secondary" />
          </div>
          <div>
            <label class="block text-sm text-gray-600">وضعیت</label>
            <Tag
                :value="selectedTemplate.is_active ? 'فعال' : 'غیرفعال'"
                :severity="selectedTemplate.is_active ? 'success' : 'danger'"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600">فرمت شماره نامه</label>
            <div class="font-semibold" v-if="selectedTemplate.letter_number_format">
              {{ selectedTemplate.letter_number_format.prefix }}/{{ selectedTemplate.letter_number_format.year }}/{{ selectedTemplate.letter_number_format.start_from }}
            </div>
            <div v-else class="text-gray-400">پیش‌فرض اتوماسیون</div>
          </div>
        </div>

        <Divider />

        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-blue-50 rounded-lg">
            <h4 class="font-semibold text-blue-800 mb-2">فرستنده</h4>
            <div class="text-sm">
              <div><strong>UserID:</strong> {{ selectedTemplate.virtual_personnel_user_id }}</div>
              <div><strong>RoleID:</strong> {{ selectedTemplate.virtual_personnel_role_id }}</div>
            </div>
          </div>
          <div class="p-3 bg-orange-50 rounded-lg">
            <h4 class="font-semibold text-orange-800 mb-2">گیرنده</h4>
            <div class="text-sm">
              <div><strong>RoleID:</strong> {{ selectedTemplate.receiver_role_id }}</div>
              <div><strong>UserID:</strong> {{ selectedTemplate.receiver_user_id || '-' }}</div>
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <h4 class="font-semibold mb-2">نگاشت فیلدها:</h4>
          <div class="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
            <div v-for="(value, key) in selectedTemplate.entity_mapping?.fields" :key="key" class="flex justify-between py-1 border-b last:border-0">
              <span class="text-sm text-gray-600">{{ key }}:</span>
              <Tag :value="value" severity="info" size="small" />
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold mb-2">مقادیر ثابت:</h4>
          <div class="bg-blue-50 p-3 rounded-lg max-h-60 overflow-y-auto">
            <div v-for="(value, key) in selectedTemplate.entity_mapping?.static_values" :key="key" class="flex justify-between py-1 border-b last:border-0">
              <span class="text-sm text-gray-600">{{ key }}:</span>
              <Tag :value="value" severity="success" size="small" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="بستن" severity="secondary" @click="showViewDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'
import {
  Card, DataTable, Column, Tag, Button, Dialog,
  InputText, Textarea, InputNumber, Divider
} from 'primevue'
import { showToast } from '@/plugins/toast'

const templates = ref([])
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const showViewDialog = ref(false)
const isEdit = ref(false)
const selectedTemplate = ref(null)
const generalError = ref('')
const errors = ref({})

// فرم اصلی
const form = reactive({
  name: '',
  slug: '',
  description: '',
  virtual_personnel_user_id: null,
  virtual_personnel_role_id: null,
  receiver_role_id: null,
  receiver_user_id: null,
  target_action_code: 13,
  entity_type_code: 562,
  entity_mapping: {
    table_name: '',
    fields: {},
    static_values: {}
  },
  workflow_mapping: {
    sends_table: 'ActiveSends',
    receivers_table: 'ActiveSend_Receivers'
  },
  letter_number_format: null
})

// فرمت شماره نامه
const letterFormat = reactive({
  prefix: '',
  year: '1405',
  start_from: 1000,
  separator: '/',
})

// لیست فیلدها برای UI
const fieldMappings = ref([])
const staticValuesList = ref([])

// نگاشت‌های پیش‌فرض
const defaultFieldMappings = [
  { logical_name: 'subject', physical_name: 'DocSubject' },
  { logical_name: 'mozoa', physical_name: 'Mozoa' },
  { logical_name: 'body', physical_name: 'VerayeshGar' },
  { logical_name: 'sender', physical_name: 'Ferestandeh' },
  { logical_name: 'receiver', physical_name: 'Gerandeh' },
  { logical_name: 'date', physical_name: 'Date' },
  { logical_name: 'creator_id', physical_name: 'CreatorID' },
  { logical_name: 'creator_role_id', physical_name: 'CreatorRoleID' },
  { logical_name: 'entity_number', physical_name: 'EntityNumber' },
  { logical_name: 'first_entity_code', physical_name: 'FirstEntityCode' },
]

const defaultStaticValues = [
  { column: 'IsActive', value: '1' },
  { column: 'IsConfirm', value: '1' },
  { column: 'CategoryCode', value: '-1' },
  { column: 'Grade', value: '1' },
  { column: 'IsPreNote', value: '0' },
  { column: 'Locked', value: '0' },
  { column: 'LocalLock', value: '0' },
  { column: 'LocalLockUserCode', value: '-1' },
  { column: 'LocalLockRoleID', value: '-1' },
  { column: 'LockUserCode', value: '-1' },
  { column: 'LockRoleID', value: '-1' },
  { column: 'FieldsStatus', value: '<Fields></Fields>' },
  { column: 'NumberOfCopies', value: '1' },
  { column: 'Version', value: '1.0' },
  { column: 'OriginalVersionCode', value: '-1' },
  { column: 'IsSigned', value: '0' },
  { column: 'SecurityLevelCode', value: '1' },
  { column: 'IsPrivateSearch', value: '1' },
  { column: 'PrivateSearchUserCode', value: 'CreatorID' },
  { column: 'PrivateSearchRoleID', value: 'CreatorRoleID' },
  { column: 'FirstEntityCode', value: 'EntityCode' },
]

// افزودن فیلد جدید
const addFieldMapping = () => {
  fieldMappings.value.push({ logical_name: '', physical_name: '' })
}

// حذف فیلد
const removeFieldMapping = (index) => {
  fieldMappings.value.splice(index, 1)
  updateFieldMappings()
}

// به‌روزرسانی entity_mapping.fields
const updateFieldMappings = () => {
  const fields = {}
  fieldMappings.value.forEach(mapping => {
    if (mapping.logical_name && mapping.physical_name) {
      fields[mapping.logical_name] = mapping.physical_name
    }
  })
  form.entity_mapping.fields = fields
}

// افزودن مقدار ثابت
const addStaticValue = () => {
  staticValuesList.value.push({ column: '', value: '' })
}

// حذف مقدار ثابت
const removeStaticValue = (index) => {
  staticValuesList.value.splice(index, 1)
  updateStaticValues()
}

// به‌روزرسانی entity_mapping.static_values
const updateStaticValues = () => {
  const staticValues = {}
  staticValuesList.value.forEach(item => {
    if (item.column && item.value) {
      staticValues[item.column] = item.value
    }
  })
  form.entity_mapping.static_values = staticValues
}

// باز کردن Dialog جدید
const openNewTemplateDialog = () => {
  selectedTemplate.value = null  // ✅ اضافه شد - برای اطمینان از حالت ایجاد
  resetForm()
  fieldMappings.value = [...defaultFieldMappings]
  staticValuesList.value = [...defaultStaticValues]
  updateFieldMappings()
  updateStaticValues()
  isEdit.value = false
  showDialog.value = true
}

// بازنشانی فرم
const resetForm = () => {
  form.name = ''
  form.slug = ''
  form.description = ''
  form.virtual_personnel_user_id = null
  form.virtual_personnel_role_id = null
  form.receiver_role_id = null
  form.receiver_user_id = null
  form.target_action_code = 13
  form.entity_type_code = 562
  form.letter_number_format = null
  form.entity_mapping = {
    table_name: '',
    fields: {},
    static_values: {}
  }
  form.workflow_mapping = {
    sends_table: 'ActiveSends',
    receivers_table: 'ActiveSend_Receivers'
  }
}

// بازنشانی فرمت شماره نامه
const resetLetterFormat = () => {
  letterFormat.prefix = ''
  letterFormat.year = '1405'
  letterFormat.start_from = 1000
  letterFormat.separator = '/'
  form.letter_number_format = null
}

// دریافت لیست قالب‌ها
const fetchTemplates = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/virtual-secretariat/templates')
    templates.value = data.data
  } catch (error) {
    showToast({
      severity: 'error',
      summary: 'خطا در دریافت قالب‌ها',
      detail: error.response?.data?.message
    })
  } finally {
    loading.value = false
  }
}

// مشاهده قالب
const viewTemplate = (template) => {
  selectedTemplate.value = template
  showViewDialog.value = true
}

// ویرایش قالب
// ویرایش قالب
const editTemplate = (template) => {
  selectedTemplate.value = template  // ✅✅✅ این خط گم شده بود!

  form.name = template.name
  form.slug = template.slug
  form.description = template.description || ''
  form.virtual_personnel_user_id = template.virtual_personnel_user_id
  form.virtual_personnel_role_id = template.virtual_personnel_role_id
  form.receiver_role_id = template.receiver_role_id
  form.receiver_user_id = template.receiver_user_id || null
  form.target_action_code = template.target_action_code
  form.entity_type_code = template.entity_type_code || 562
  form.entity_mapping = JSON.parse(JSON.stringify(template.entity_mapping || { table_name: '', fields: {}, static_values: {} }))
  form.workflow_mapping = JSON.parse(JSON.stringify(template.workflow_mapping || { sends_table: 'ActiveSends', receivers_table: 'ActiveSend_Receivers' }))
  form.letter_number_format = template.letter_number_format || null

  // بارگذاری letterFormat
  if (template.letter_number_format) {
    letterFormat.prefix = template.letter_number_format.prefix || ''
    letterFormat.year = template.letter_number_format.year || '1405'
    letterFormat.start_from = template.letter_number_format.start_from || 1000
    letterFormat.separator = template.letter_number_format.separator || '/'
  } else {
    resetLetterFormat()
  }

  // تبدیل fields به آرایه برای UI
  fieldMappings.value = Object.entries(form.entity_mapping?.fields || {}).map(([logical, physical]) => ({
    logical_name: logical,
    physical_name: physical
  }))

  // تبدیل static_values به آرایه برای UI
  staticValuesList.value = Object.entries(form.entity_mapping?.static_values || {}).map(([column, value]) => ({
    column: column,
    value: String(value)
  }))

  isEdit.value = true
  errors.value = {}
  generalError.value = ''
  showDialog.value = true
}

// ذخیره قالب
// ذخیره قالب
const saveTemplate = async () => {
  saving.value = true
  errors.value = {}
  generalError.value = ''

  try {
    updateFieldMappings()
    updateStaticValues()

    // آماده‌سازی letter_number_format
    if (letterFormat.prefix && letterFormat.year && letterFormat.start_from) {
      form.letter_number_format = {
        prefix: letterFormat.prefix,
        year: letterFormat.year,
        start_from: letterFormat.start_from,
        separator: letterFormat.separator || '/',
      }
    } else {
      form.letter_number_format = null
    }

    const payload = {
      ...form,
      entity_mapping: {
        table_name: form.entity_mapping.table_name,
        fields: form.entity_mapping.fields,
        static_values: form.entity_mapping.static_values
      },
      workflow_mapping: form.workflow_mapping,
      letter_number_format: form.letter_number_format
    }

    // ✅ لاگ برای دیباگ
    console.log('isEdit:', isEdit.value, 'selectedTemplate ID:', selectedTemplate.value?.id)

    if (isEdit.value && selectedTemplate.value?.id) {
      // ✅ ویرایش - PUT
      console.log('Sending PUT to:', `/virtual-secretariat/templates/${selectedTemplate.value.id}`)
      await api.put(`/virtual-secretariat/templates/${selectedTemplate.value.id}`, payload)
      showToast({ severity: 'success', summary: 'قالب با موفقیت به‌روزرسانی شد' })
    } else {
      // ✅ ایجاد جدید - POST
      console.log('Sending POST to: /virtual-secretariat/templates')
      await api.post('/virtual-secretariat/templates', payload)
      showToast({ severity: 'success', summary: 'قالب با موفقیت ایجاد شد' })
    }

    showDialog.value = false
    fetchTemplates()
  } catch (error) {
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      const firstErrorKey = Object.keys(errors.value)[0]
      if (firstErrorKey) {
        showToast({
          severity: 'warn',
          summary: 'خطای اعتبارسنجی',
          detail: errors.value[firstErrorKey][0],
          life: 5000
        })
      }
    } else {
      generalError.value = error.response?.data?.message || 'خطایی رخ داد'
      showToast({
        severity: 'error',
        summary: 'خطا',
        detail: generalError.value
      })
    }
  } finally {
    saving.value = false
  }
}

// تأیید حذف
const confirmDelete = (id) => {
  if (confirm('آیا از حذف این قالب اطمینان دارید؟')) {
    deleteTemplate(id)
  }
}

// حذف قالب
const deleteTemplate = async (id) => {
  try {
    await api.delete(`/virtual-secretariat/templates/${id}`)
    showToast({ severity: 'success', summary: 'قالب با موفقیت حذف شد' })
    fetchTemplates()
  } catch (error) {
    showToast({
      severity: 'error',
      summary: 'خطا در حذف قالب',
      detail: error.response?.data?.message
    })
  }
}

onMounted(fetchTemplates)
</script>

<style scoped>
.field h3 {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.p-error {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

.p-invalid {
  border-color: #ef4444 !important;
}

:deep(.p-dialog .p-dialog-content) {
  padding: 1.5rem;
}

:deep(.p-datatable) {
  border-radius: 0.5rem;
}
</style>
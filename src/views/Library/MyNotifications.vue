<!-- resources/js/Modules/Library/Views/MyNotifications.vue -->
<template>
  <div class="p-4 md:p-6 max-w-3xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i class="pi pi-bell text-blue-600"></i>
          اعلان‌های من
          <Badge v-if="unreadCount > 0" :value="unreadCount" severity="danger" />
        </h1>
        <p class="text-gray-500 mt-1">تاریخچه پیامک‌ها و اعلان‌های کتابخانه</p>
      </div>
      <Button
          v-if="unreadCount > 0"
          label="خواندن همه"
          icon="pi pi-check"
          severity="secondary"
          outlined
          @click="markAllRead"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else-if="notifications.length > 0" class="space-y-3">
      <div
          v-for="notification in notifications"
          :key="notification.id"
          class="bg-white rounded-xl border p-4 flex items-start gap-3 transition-all"
          :class="notification.is_read ? 'border-gray-200 opacity-70' : 'border-blue-200 bg-blue-50/50'"
      >
        <!-- آیکون نوع اعلان -->
        <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="getTypeClass(notification.type)"
        >
          <i :class="getTypeIcon(notification.type)"></i>
        </div>

        <!-- محتوا -->
        <div class="flex-1">
          <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-gray-800 text-sm">
                            {{ getTypeLabel(notification.type) }}
                        </span>
            <span class="text-xs text-gray-500">
                            {{ formatDate(notification.created_at) }}
                        </span>
          </div>
          <p class="text-gray-600 text-sm mt-1 leading-6">{{ notification.message }}</p>

          <div class="mt-2" v-if="!notification.is_read">
            <Button
                label="علامت‌گذاری به عنوان خوانده شده"
                icon="pi pi-check"
                size="small"
                text
                @click="markRead(notification)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- حالت خالی -->
    <div v-else class="text-center py-20">
      <i class="pi pi-bell-slash text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">اعلانی وجود ندارد</p>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { libraryApi } from '@/services/libraryApi.js';

const toast = useToast();

const notifications = ref([]);
const loading = ref(false);
const unreadCount = ref(0);

const loadNotifications = async () => {
  loading.value = true;
  try {
    const response = await libraryApi.getMyNotifications();
    notifications.value = response.data.data || [];
    unreadCount.value = response.data.meta?.unread_count || 0;
  } catch (error) {
    console.error('خطا در دریافت اعلان‌ها:', error);
  } finally {
    loading.value = false;
  }
};

const markRead = async (notification) => {
  try {
    await libraryApi.markAsRead(notification.id);
    notification.is_read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (error) {
    console.error('خطا:', error);
  }
};

const markAllRead = async () => {
  try {
    await libraryApi.markAllAsRead();
    notifications.value.forEach(n => (n.is_read = true));
    unreadCount.value = 0;
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'همه اعلان‌ها خوانده شدند.',
      life: 3000,
    });
  } catch (error) {
    console.error('خطا:', error);
  }
};

const getTypeIcon = (type) => {
  const map = {
    reminder: 'pi pi-clock text-blue-600',
    overdue: 'pi pi-exclamation-triangle text-red-600',
    approval: 'pi pi-check-circle text-green-600',
    ready: 'pi pi-book text-purple-600',
  };
  return map[type] || 'pi pi-bell text-gray-600';
};

const getTypeClass = (type) => {
  const map = {
    reminder: 'bg-blue-100',
    overdue: 'bg-red-100',
    approval: 'bg-green-100',
    ready: 'bg-purple-100',
  };
  return map[type] || 'bg-gray-100';
};

const getTypeLabel = (type) => {
  const map = {
    reminder: 'یادآوری سررسید',
    overdue: 'اخطار تاخیر',
    approval: 'تایید رزرو',
    ready: 'آماده تحویل',
  };
  return map[type] || 'اعلان';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fa-IR') + ' - ' +
      new Date(date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  loadNotifications();
});
</script>
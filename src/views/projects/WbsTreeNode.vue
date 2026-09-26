<!-- resources/js/views/projects/WbsTreeNode.vue -->
<template>
  <div class="tree-node" :style="{ paddingRight: `${level * 2}rem` }">
    <div class="node-content" @click="toggleExpand">
      <div class="node-icon">
        <i :class="hasChildren ? 'pi pi-chevron-down' : 'pi pi-file'"
           :style="{ transform: expanded ? 'rotate(-90deg)' : '' }"
        />
      </div>

      <div class="node-info">
        <div class="node-header">
          <span class="node-code">{{ node.code }}</span>
          <span class="node-name">{{ node.name }}</span>
          <Tag :value="getCategoryLabel(node.category)" :severity="getCategorySeverity(node.category)" size="small" />
        </div>
        <div class="node-details">
          <span class="node-progress">
            <ProgressBar
                :value="node.effective_progress || node.progress_percent || 0"
                :showValue="true"
                style="width: 120px; height: 6px;"
            />
            <small v-if="node.is_auto_progress" class="text-muted text-xs">
              (خودکار)
            </small>
          </span>
          <span class="node-cost">{{ formatMoney(node.total_price) }}</span>
          <span class="node-tasks">
            <i class="pi pi-check-circle" />
            {{ node.tasks_count || 0 }} تسک
          </span>
        </div>
      </div>

      <div class="node-actions">
        <Button
            v-if="canCreatewbs"
            icon="pi pi-plus"
            text
            rounded
            severity="success"
            size="small"
            @click.stop="$emit('add-child', node)"
            v-tooltip.top="'افزودن زیرمجموعه'"
        />
        <Button
            icon="pi pi-list"
            text
            rounded
            severity="info"
            size="small"
            @click.stop="$emit('view-tasks', node)"
            v-tooltip.top="'تسک‌ها'"
        />
        <Button
            v-if="canUpdatewbs"
            icon="pi pi-pencil"
            text
            rounded
            severity="warning"
            size="small"
            @click.stop="$emit('edit', node)"
            v-tooltip.top="'ویرایش'"
        />
        <Button
            v-if="canDeletewbs"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click.stop="$emit('delete', node)"
            v-tooltip.top="'حذف'"
        />
      </div>
    </div>

    <div v-if="hasChildren && expanded" class="node-children">
      <WbsTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @add-child="$emit('add-child', $event)"
          @view-tasks="$emit('view-tasks', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

defineEmits(['edit', 'delete', 'add-child', 'view-tasks'])

const expanded = ref(true)

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdatewbs = computed(() => can('wbs.update'))
const canDeletewbs = computed(() => can('wbs.delete'))
const canCreatewbs = computed(() => can('wbs.create'))

const toggleExpand = () => {
  if (hasChildren.value) {
    expanded.value = !expanded.value
  }
}

const getCategoryLabel = (category) => {
  const labels = {
    civil: 'عمرانی',
    electrical: 'برقی',
    mechanical: 'مکانیکی'
  }
  return labels[category] || category
}

const getCategorySeverity = (category) => {
  const severities = {
    civil: 'info',
    electrical: 'warning',
    mechanical: 'success'
  }
  return severities[category] || 'secondary'
}

const formatMoney = (value) => {
  return new Intl.NumberFormat('fa-IR').format(value || 0) + ' ریال'
}
</script>

<style scoped>
.tree-node {
  border-bottom: 1px solid #f3f4f6;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.node-content:hover {
  background-color: #f9fafb;
}

.node-icon {
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  color: #6b7280;
}

.node-info {
  flex: 1;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.node-code {
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.9rem;
}

.node-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.95rem;
}

.node-details {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.25rem;
}

.node-progress {
  display: flex;
  align-items: center;
}

.node-cost {
  font-size: 0.875rem;
  color: #059669;
  font-weight: 500;
}

.node-tasks {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.node-children {
  margin-right: 0.5rem;
}
</style>
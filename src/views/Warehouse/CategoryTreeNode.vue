<!-- resources/js/views/inventory/CategoryTreeNode.vue -->
<template>
  <div class="tree-node" :style="{ paddingRight: `${level * 2}rem` }">
    <div class="node-content">
      <div class="node-left">
        <div
            class="expand-icon"
            @click="toggleExpand"
            v-if="category.hasChildren"
        >
          <i :class="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-left'" />
        </div>
        <div v-else class="expand-placeholder" />

        <div class="node-icon">
          <i :class="category.hasChildren ? 'pi pi-folder' : 'pi pi-folder-open'" />
        </div>

        <div class="node-info">
          <span class="node-name">{{ category.name }}</span>
          <span class="node-code" v-if="category.code">({{ category.code }})</span>
          <Tag
              :value="category.status === 'active' ? 'فعال' : 'غیرفعال'"
              :severity="category.status === 'active' ? 'success' : 'secondary'"
              size="small"
          />
        </div>
      </div>

      <div class="node-actions">
        <Button
            icon="pi pi-plus"
            text
            rounded
            severity="success"
            size="small"
            @click="$emit('add-child', category)"
            v-tooltip.top="'افزودن زیرمجموعه'"
        />
        <Button
            icon="pi pi-pencil"
            text
            rounded
            severity="warning"
            size="small"
            @click="$emit('edit', category)"
            v-tooltip.top="'ویرایش'"
        />
        <Button
            :icon="category.status === 'active' ? 'pi pi-times' : 'pi pi-check'"
            text
            rounded
            :severity="category.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="$emit('status-toggle', category)"
            v-tooltip.top="category.status === 'active' ? 'غیرفعال کردن' : 'فعال کردن'"
        />
        <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="$emit('delete', category)"
            v-tooltip.top="'حذف'"
        />
      </div>
    </div>

    <div v-if="category.hasChildren && expanded" class="node-children">
      <CategoryTreeNode
          v-for="child in category.children"
          :key="child.id"
          :category="child"
          :level="level + 1"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @add-child="$emit('add-child', $event)"
          @status-toggle="$emit('status-toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

defineEmits(['edit', 'delete', 'add-child', 'status-toggle'])

const expanded = ref(true)

// گوش دادن به رویداد global برای باز/بستن همه
const handleToggleExpand = (event) => {
  expanded.value = event.detail.expand
}

onMounted(() => {
  document.addEventListener('toggle-expand', handleToggleExpand)
})

onUnmounted(() => {
  document.removeEventListener('toggle-expand', handleToggleExpand)
})

const toggleExpand = () => {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.tree-node {
  border-bottom: 1px solid #f3f4f6;
}

.tree-node:last-child {
  border-bottom: none;
}

.node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.5rem;
  transition: background-color 0.2s;
  border-radius: 6px;
}

.node-content:hover {
  background-color: #f8fafc;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.expand-icon {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: #6b7280;
}

.expand-icon:hover {
  background-color: #e5e7eb;
}

.expand-placeholder {
  width: 1.5rem;
  height: 1.5rem;
}

.node-icon {
  color: #f59e0b;
  font-size: 1.1rem;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.node-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.95rem;
}

.node-code {
  font-size: 0.8rem;
  color: #6b7280;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.node-content:hover .node-actions {
  opacity: 1;
}

.node-children {
  margin-right: 1rem;
}

@media (max-width: 768px) {
  .node-content {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .node-actions {
    opacity: 1;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
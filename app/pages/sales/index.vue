<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFetch } from '#app'

const { data, error, refresh, pending } = await useFetch('/api/sales')

const q = ref('')
const perPage = ref(10)
const page = ref(1)

const filtered = computed(() => {
  if (!data.value) return []
  if (!q.value) return data.value
  return data.value.filter((sale: any) =>
      sale.stage?.toLowerCase().includes(q.value.toLowerCase()) ||
      String(sale.id).includes(q.value)
  )
})

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))

const paginated = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">Sales Dashboard</h1>
      <UButton color="primary" icon="i-heroicons-arrow-path" :loading="pending" @click="refresh">
        Refresh
      </UButton>
    </div>

    <UInput
        v-model="q"
        placeholder="Search by stage or id"
        icon="i-heroicons-magnifying-glass"
        class="max-w-md"
    />

    <UTable :rows="paginated" :columns="[
      { key: 'id', label: 'ID' },
      { key: 'stage', label: 'Stage' },
      { key: 'isActive', label: 'Active' },
      { key: 'createdAt', label: 'Created' },
      { key: 'updatedAt', label: 'Updated' }
    ]">
      <template #isActive-data="{ row }">
        <UBadge :color="row.isActive ? 'green' : 'red'">
          {{ row.isActive ? 'Yes' : 'No' }}
        </UBadge>
      </template>

      <template #createdAt-data="{ row }">
        {{ new Date(row.createdAt).toLocaleString() }}
      </template>

      <template #updatedAt-data="{ row }">
        {{ new Date(row.updatedAt).toLocaleString() }}
      </template>

      <template #actions-data="{ row }">
        <UButton size="xs" color="gray" @click="console.log(row)">View</UButton>
      </template>
    </UTable>

    <div class="flex justify-between items-center">
      <div class="text-sm text-gray-600">Total: {{ filtered.length }}</div>
      <UPagination v-model="page" :page-count="perPage" :total="filtered.length" />
      <USelect
          v-model="perPage"
          :options="[{label:'5',value:5},{label:'10',value:10},{label:'25',value:25}]"
          class="w-20"
      />
    </div>

    <UAlert v-if="error" color="red" title="Error" :description="error.message" />
  </UContainer>
</template>

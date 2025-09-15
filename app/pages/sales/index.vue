<script setup lang="ts">
import { useFetch } from '#app'


type Sale = {
  id: number
  stage: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const { data, error, pending, refresh } = await useFetch('/api/sales', {
  key: 'sales',
})
const togglingId = ref<number | null>(null)

async function toggleSale(sale: { id: number; isActive: boolean }, newVal: boolean) {
  const prev = sale.isActive
  sale.isActive = newVal                     // оптимистичное обновление
  togglingId.value = sale.id
  try {
    await $fetch(`/api/sales/${sale.id}`, {
      method: 'PATCH',
      body: { isActive: newVal },
    })
    // опционально: await refresh()
  } catch (e) {
    console.error(e)
    sale.isActive = prev                     // откат при ошибке
  } finally {
    togglingId.value = null
  }
}
</script>

<template>
  <UContainer class="py-10 max-w-md mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Sales</h1>
      <UButton color="primary" icon="i-heroicons-arrow-path"
               :loading="pending" @click="refresh">
        Обновить
      </UButton>
    </div>

    <div v-if="pending" class="text-gray-500 text-center">
      Загрузка...
    </div>

    <UAlert v-else-if="error" color="red" title="Ошибка"
            :description="error.message" />

    <div v-else class="gap-x-40 grid grid-cols-5">
      <div v-for="sale in data" :key="sale.id" class="p-4 gap-x-2 flex hover:cursor-pointer">
        <ULink :to="{ name: 'sales-id', params: { id: sale.id } }" class="hover:underline">
          {{ sale.stage }}
        </ULink>

        <UCheckbox
            :model-value="sale.isActive"
            :disabled="togglingId === sale.id"
            @update:model-value="(val) => toggleSale(sale, val)"
            class="hover:cursor-pointer"
        />
      </div>
    </div>
  </UContainer>
</template>

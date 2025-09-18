<script setup lang="ts">
import { useFetch } from '#app'
import { computed, ref } from 'vue'

type Sale = {
  id: number
  stage: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const { data, error, pending, refresh } = await useFetch<Sale[]>('/api/sales', { key: 'sales' })
const showControls = ref(false)
const selectedStage = ref<number | null>(null)   // теперь тут id
const togglingId = ref<number | null>(null)

const stageOptions = computed(() =>
    (data.value || []).map(s => ({ label: s.stage, value: s.id }))
)

async function toggleSale(id: number) {
  const sale = data.value?.find(s => s.id === id)
  if (!sale) return
  const prev = sale.isActive
  sale.isActive = !sale.isActive
  togglingId.value = id
  try {
    await $fetch(`/api/sales/${id}`, {
      method: 'PATCH',
      body: { isActive: sale.isActive },
    })
  } catch (e) {
    console.error(e)
    sale.isActive = prev
  } finally {
    togglingId.value = null
  }
}

watch(selectedStage.value, () => {
  console.log(selectedStage)
})

</script>

<template>
  <UContainer class="py-8 max-w-5xl mx-auto space-y-6">
    <div class="flex justify-between gap-4">
      <h1 class="text-2xl font-semibold">Sales</h1>
      <UButton
          color="primary"
          icon="i-heroicons-arrow-path"
          :loading="pending"
          @click="refresh"
      >
        Обновить
      </UButton>
    </div>

    <div v-if="pending" class="text-gray-500 text-center">Загрузка...</div>
    <UAlert v-else-if="error" color="red" :description="error.message" />

    <!-- Сетка карточек -->
    <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <ULink
          v-for="sale in data"
          :key="sale.id"
          :to="{ name: 'sales-id', params: { id: sale.id } }"
          class="flex items-center justify-between px-3 py-2 rounded-md
               bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
               transition cursor-pointer"
      >
        <span class="font-medium">{{ sale.stage }}</span>
        <UBadge
            :color="sale.isActive ? 'primary' : 'neutral'"
            variant="subtle"
            class="transition-colors duration-400"
        >
          {{ sale.isActive ? 'On' : 'Off' }}
        </UBadge>
      </ULink>
    </div>

    <!-- Селект + кнопка -->
    <UCheckbox
        v-model="showControls"
        label="Показать управление активностью"
        class="mb-2"
    />

    <!-- Селект + кнопка -->
    <div
        v-if="showControls"
        class="flex gap-4 items-center"
    >
      <USelect
          class="w-64"
          v-model="selectedStage"
          :items="stageOptions"
          placeholder="Выберите стейдж"
      />

      <UButton
          color="neutral"
          :disabled="!selectedStage"
          :loading="togglingId === selectedStage"
          @click="toggleSale(selectedStage!)"
      >
        {{
          data?.find(s => s.id === selectedStage)?.isActive
              ? 'Деактивировать'
              : 'Активировать'
        }}
      </UButton>
    </div>

  </UContainer>
</template>

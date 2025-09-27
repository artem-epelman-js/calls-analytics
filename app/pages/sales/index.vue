<script setup lang="ts">
import { useFetch } from '#app'
import { computed, ref } from 'vue'
import {UButton} from "#components";
import {saleValidator} from "~~/validators/sale.validator";

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


const form = reactive({
  stage: '',
  isActive: false     // или null, если нужно «не выбрано»
})
const togglingId = ref<number | null>(null)

const showCreate = ref(false)
const stageInput = ref<HTMLInputElement | null>(null)

function toggleCreate() {
  showCreate.value = !showCreate.value
  if (showCreate.value) {
    nextTick(() => stageInput.value?.focus())
  }
}


async function submit () {
  const payload = { stage: form.stage, isActive: form.isActive }
  await $fetch('/api/sales', { method: 'POST', body: payload })
  await refresh() // один раз — подтянули свежие данные
}


async function toggleSale(stageId: number) {
  try {
    togglingId.value = stageId
    const sale = data.value.find(s => s.id === stageId)
    if (!sale) return

    const newStatus = !sale.isActive

    // ⚡ PATCH-запрос с новым значением
    await $fetch(`/api/sales/${stageId}`, {
      method: 'PATCH',
      body: { isActive: newStatus }
    })

    // оптимистично меняем локально
    sale.isActive = newStatus
  } finally {
    togglingId.value = null
  }
}

const stageOptions = computed(() =>
    (data.value || []).map(s => ({ label: s.stage, value: s.id })))

watch(selectedStage.value, () => {
  console.log(selectedStage)
})






</script>

<template>
  <UContainer class="py-8 max-w-5xl mx-auto space-y-6">
    <div class="flex justify-between gap-4">
      <h1 class="text-2xl font-semibold">Sales</h1>
      <div class="flex flex-col gap-3 w-full max-w-xl">

        <div class="flex gap-4">
          <UButton
              color="primary"
              icon="i-heroicons-arrow-path"
              :loading="pending"
              @click="refresh"
          >
            Обновить
          </UButton>

          <UButton
              :icon="showCreate ? 'i-lucide-minus' : 'i-lucide-plus'"
              @click="toggleCreate"
          >
            {{ showCreate ? 'Скрыть форму' : 'Добавить сейла' }}
          </UButton>
        </div>

        <!-- Форма появляется НИЖЕ кнопки -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
        >
          <UForm
              v-if="showCreate"
              :shema="saleValidator"
              :state="form"
              @submit.prevent="submit"
              class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl"
          >
            <UFormField label="Стейдж" name="stage">
              <UInput v-model="form.stage" type="text" ref="stageInput" />
            </UFormField>

            <UFormField label="Активность" name="isActive">
              <USelect
                  v-model="form.isActive"
                  :items="[
              { label: 'True', value: true },
              { label: 'False', value: false }
            ]"
                  placeholder="Выберите значение"
              />
            </UFormField>

            <div class="md:col-span-2 flex justify-end gap-2">
              <UButton variant="subtle" @click="showCreate = false">Отмена</UButton>
              <UButton type="submit" size="lg" class="rounded-xl px-6">Сохранить</UButton>
            </div>
          </UForm>
        </Transition>

      </div>
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
          v-model="selectedStage"
          :items="stageOptions"
          placeholder="Выберите стейдж"
          class="w-40"
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

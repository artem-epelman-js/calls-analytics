<script setup lang="ts">
import { computed, ref, reactive, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useAgentStore } from '~~/stores/agent.store'
import { agentValidator } from '~~/validators/agent.validator'

type Agent = {
  id: number
  stage: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// один инстанс стора
const agentStore = useAgentStore()
const { data, loading, error } = storeToRefs(agentStore)
const { create, getAll } = agentStore

const showControls = ref(false)
const selectedStage = ref<number | null>(null)

const form = reactive({
  stage: '',
  isActive: false
})

const togglingId = ref<number | null>(null)
const showCreate = ref(false)
const stageInput = ref<HTMLInputElement | null>(null)

function toggleCreate() {
  showCreate.value = !showCreate.value
}

async function toggleAgent(stageId: number) {
  try {
    togglingId.value = stageId
    const agent = data.value.find(s => s.id === stageId)
    if (!agent) return

    const newStatus = !agent.isActive
    await $fetch(`/api/agents/${stageId}`, {
      method: 'PATCH',
      body: { isActive: newStatus }
    })
    agent.isActive = newStatus // оптимистично
  } finally {
    togglingId.value = null
  }
}

const stageOptions = computed(() =>
    (data.value ?? []).map(s => ({ label: s.stage, value: s.id }))
)

onMounted(() => { getAll() })
</script>


<template>
  <UContainer class="py-8 max-w-5xl mx-auto space-y-6">
    <div class="flex justify-between gap-4">
      <div class="flex flex-col gap-3 w-full max-w-xl">
        <div class="flex gap-4">
          <UButton
              color="primary"
              icon="i-heroicons-arrow-path"
              :loading="loading"
              @click="getAll"
          >
            Обновить
          </UButton>
          <UButton
              :icon="showCreate ? 'i-lucide-minus' : 'i-lucide-plus'"
              @click="toggleCreate"
          >
            {{ showCreate ? 'Скрыть форму' : 'Добавить агента' }}
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
              :schema="agentValidator"
              :state="form"
              @submit.prevent=create(form)
              class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl"
          >
          <UFormField label="Стейдж" name="stage">
            <UInput v-model="form.stage" type="text" ref="stageInput" />
          </UFormField>

          <UFormField label="Активность" name="isActive">
            <USelect
                v-model="form.isActive"
                :items="[{ label: 'True', value: true }, { label: 'False', value: false }]"
                placeholder="Выберите значение"
            />
          </UFormField>

          <div class="md:col-span-2 flex justify-end gap-2">
            <UButton variant="subtle transition-23" @click="showCreate = false">Отмена</UButton>
            <UButton type="submit" size="lg" @click="showCreate = false" class="rounded-xl px-6">Сохранить</UButton>
          </div>
          </UForm>

        </Transition>
      </div>
    </div>


    <div v-if="loading" class="text-gray-500 text-center">Загрузка...</div>
    <UAlert v-else-if="error" color="error" :description="error?.message" />

    <!-- Сетка карточек -->
    <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <ULink
          v-for="agent in data"

          :key="agent.id"
          :to="{ name: 'agents-id', params: { id: agent.id } }"
          class="flex items-center justify-between px-3 py-2 rounded-md
               bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
               transition cursor-pointer"
      >
        <span class="font-medium">{{ agent.stage }}</span>
        <UBadge
            :color="agent.isActive ? 'primary' : 'neutral'"
            variant="subtle"
            class="transition-colors duration-400"
        >
          {{ agent.isActive ? 'On' : 'Off' }}
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
          @click="toggleAgent(selectedStage!)"
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

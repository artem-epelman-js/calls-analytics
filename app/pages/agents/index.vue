<script setup lang="ts">
import {computed, ref, reactive, onMounted, nextTick} from 'vue'
import {storeToRefs} from 'pinia'
import {useAgentStore} from '~~/stores/agent.store'
import {agentValidator} from '~~/validators/agent.validator'
import {onBeforeLeave} from "~/helpers/animation_helper";

type Agent = {
  id: number
  stage: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// один инстанс стора
const agentStore = useAgentStore()
const {data, count, loading, error} = storeToRefs(agentStore)
const {create, getAll} = agentStore

const showControls = ref(false)
const selectedStage = ref<number | null>(null)

const form = reactive({
  stage: '',
  isActive: true
})

const togglingId = ref<number | null>(null)
const showCreate = ref<boolean>(false)
const stageInput = ref<HTMLInputElement | null>(null)



async function toggleAgent(stageId: number) {
  try {
    togglingId.value = stageId
    const agent = data.value.find(s => s.id === stageId)
    if (!agent) return

    const newStatus = !agent.isActive
    await $fetch(`/api/agents/${stageId}`, {
      method: 'PATCH',
      body: {isActive: newStatus}
    })
    agent.isActive = newStatus // оптимистично
  } finally {
    togglingId.value = null
  }
}

function resetForm() {
  form.isActive = true
  form.stage = ''
}

async function handleSubmit() {
  try {
    await create({ ...form })
    resetForm()
    showCreate.value = false
  } catch (e) {
    console.error('Create agent failed:', e)
  }
}


const agentsList = computed(() =>
    (data.value ?? []).map(s => ({
      label: s.stage,
      value: s.id,
      class: s.isActive ? 'text-green-700' : 'text-red-700',
    }))
)

const activeAgents = computed(() =>
    (data.value ?? []).filter(a => a.isActive)
)

const inActive = computed(() =>
    (data.value ?? []).filter(a => !a.isActive)
)




onMounted(() => {
  getAll()
})
</script>


<template>
  <UContainer class="py-8 max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col gap-4">
      <div class="flex gap-4 items-center">
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
            @click="showCreate = !showCreate"
        >
          {{ showCreate ? 'Скрыть форму' : 'Добавить агента' }}
        </UButton>
        <div class='ml-auto'>
          <h3>Активные агенты: <span class="text-xl">{{ activeAgents.length }}</span></h3>
          <h3>Неактивные агенты: <span class="text-xl">{{ inActive.length }}</span></h3>
          <USeparator class="mt-5"/>
        </div>
      </div>
      <!-- Форма появляется НИЖЕ кнопки -->
      <UForm
          v-if="showCreate"
          :schema="agentValidator"
          :state="form"
          @submit.prevent=handleSubmit
          class="flex justify-start align-middle gap-4"
      >
        <UFormField label="Стейдж" name="stage">
          <UInput v-model="form.stage" type="text" ref="stageInput"/>
        </UFormField>



        <div class="flex justify-end items-end">
          <UButton color="error"
                   variant="ghost"
                   @click="showCreate = false; resetForm()"
                   class="rounded-xl">
            Отмена
          </UButton>
          <UButton
              color="success"
              type="submit"
              variant="ghost"
              class="rounded-xl"
          >
            Сохранить
          </UButton>
        </div>
      </UForm>
    </div>

    <div v-if="loading" class="text-gray-500 text-center">Загрузка...</div>
    <UAlert v-else-if="error"
            color="error"
            :description="error?.message"
    />

    <!-- Сетка карточек -->
    <TransitionGroup
        name="cards"
        tag="div"
        class="grid gap-3 grid-cols-5 relative"
        appear
        @before-leave="onBeforeLeave"
    >
      <ULink
          v-for="agent in activeAgents"
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
          class="transition-colors duration-800"
      >
        {{ agent.isActive ? 'Активен' : 'Неактивен' }}
      </UBadge>
      </ULink>
    </TransitionGroup>


    <!-- Селект + кнопка -->
    <UCheckbox
        v-model="showControls"
        :label="showControls ? 'Скрыть форму активации агентов' : 'Показать форму активации агентов'"
        class="mb-2"
    />

    <!-- Селект + кнопка -->
    <div
        v-if="showControls"
        class="flex gap-4 items-center"
    >
      <USelect
          v-model="selectedStage"
          :items="agentsList"
          placeholder="Выберите агента"
          class="w-43"
      />


      <UButton
          v-if="selectedStage"
          :color="data?.find(s => s.id === selectedStage)?.isActive ? 'error' : 'success'"
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

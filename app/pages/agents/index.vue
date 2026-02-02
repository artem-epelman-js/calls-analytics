<script setup lang="ts">
import {computed, ref, reactive, onMounted} from 'vue'
import {storeToRefs} from 'pinia'
import {watch} from "vue";
import {agentValidator} from "../../../validators/agent.validator";
import {useAgentStore} from "../../../stores/agent.store";

// stores
const agentStore = useAgentStore()
const {data, agentsList, loading, params} = storeToRefs(agentStore)
const {create, getAll, update} = agentStore

// hooks


// reactivity variables
const showControls = ref(false)
const showFilters = ref(false)
const selectedStage = ref<number | null>(null)
const agentId = ref<number | null>(null)
const showCreate = ref<boolean>(false)
const form = reactive({
  stage: '',
  isActive: true
})

// base const
const filterActivityTags = [
  {label: 'Все агенты', value: undefined},
  {label: 'Активные', value: true},
  {label: 'Неветивные', value: false}
]

// async functions
async function handleSubmit() {
  try {
    await create({...form})
    resetForm()
    showCreate.value = false
  } catch (e) {
    console.error('Create agent failed:', e)
  }
}
async function handleUpdate() {
  if (selectedStage.value == null) return
  const id = selectedStage.value

  await update(id) // PATCH + getAll() внутри стора (как мы починили ранее)

  // если по текущему фильтру агент исчез — сбросим выбор
}

// base functions
function resetForm() {
  form.isActive = true
  form.stage = ''
}

// computeds

const selectedAgent = computed(() => data.value.find(s => s.id === (selectedStage.value ?? -1)) ?? null)
const agentsListPainter = computed(() => selectedAgent.value ? (selectedAgent.value.isActive ? 'error' : 'success') : 'neutral')
const defineAgentStatus = computed(() => selectedAgent.value ? (selectedAgent.value.isActive ? 'Деактивировать' : 'Активировать') : 'Выберите агента')

// watchers
watch(params, () => {
  getAll()
}, {deep: true})

// lifeCycles
onMounted(() => {
  getAll()
})
</script>


<template>
  <UContainer class="py-8 space-y-8">
    <div class="flex flex-col gap-4">
      <div class="flex gap-x-4 items-center">
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
      </div>
      <UForm
          v-if="showCreate"
          :schema="agentValidator"
          :state="form"
          @submit.prevent=handleSubmit
          class="flex justify-start"
      >
        <UFormField label="Стейдж" name="stage">
          <UInput v-model="form.stage" type="text"/>
        </UFormField>
        <div class="flex justify-end items-end">
          <UButton
              color="error"
              variant="ghost"
              @click="showCreate = false; resetForm()"
              class="rounded-xl"
          >
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
    <div v-if="loading">Загрузка...</div>
    <TransitionGroup
        name="cards"
        tag="div"
        class="grid gap-3 grid-cols-6"
        appear
        @before-leave="onBeforeLeave"
    >
      <ULink
          v-for="agent in data"
          :key="agent.id"
          :to="{ name: 'agents-id', params: { id: agent.id } }"
          class="flex items-center justify-between px-3 py-2 rounded-md
           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
           transition cursor-pointer"
      >
        <span>{{ agent.stage }}</span>
        <UBadge
            :color="agent.isActive ? 'primary' : 'neutral'"
            variant="subtle"
            class="transition-colors duration-800"
        >
          {{ agent.isActive ? 'Активен' : 'Неактивен' }}
        </UBadge>
      </ULink>
    </TransitionGroup>
    <UCheckbox
        v-model="showControls"
        :label="showControls ?
         'Скрыть форму активации агентов' :
          'Показать форму активации агентов'"
    />
    <div v-if="showControls" class="space-x-2">
      <USelect
          v-model="selectedStage"
          :items="agentsList"
          placeholder="Выберите агента"
          class="w-43"
      />
      <UButton
          v-if="selectedStage != null"
          :color="agentsListPainter"
          :label="defineAgentStatus"
          :disabled="selectedStage == null"
          :loading="agentId === selectedStage"
          @click="handleUpdate"
      />
    </div>
    <UCheckbox
        @click="showFilters=!showFilters"
        label="Фильтры"
    />
    <div v-if="showFilters" class="flex flex-col gap-4">
      <UFormField name="filterParams">
        <USelect
            v-model="params.isActive"
            :items="filterActivityTags"
            placeholder="Все агенты"
        />
      </UFormField>

      <UFormField>
        <UInput
            v-model="params.search"
            placeholder="Поиск..."
        />
      </UFormField>
    </div>
  </UContainer>
</template>

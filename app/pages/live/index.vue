<script setup> import {format} from "date-fns";
import {UDropdownMenu} from "#components";
import {UButton} from "#components";
import {computed, ref} from "vue";
import {LiveValidator} from "~~/validators/live.validator.js";


const { data: live, refresh: refreshLive } = await useFetch('/api/live', { key: 'live' })
const {data: agents} = await useFetch('/api/agents')
const items = ref([])
const liveData = ref([])
const geoArr = ref(['KZ', 'KG', 'BY', 'UZ'])
const form = reactive({agentId: null, date: '', count: null, geo: ''})

const columns = [
  {
    id: 'action',
    header: 'Действие',
    cell: ({ row }) =>
        h(
            UDropdownMenu,
            { content: { align: 'end' }, items: actionsItems(row) },
            () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              variant: 'subtle',
              size: 'xl',
              class: 'cursor-pointer'
            })
        )
  },
  { id: 'id', header: 'ID', accessorKey: 'id' },
  {
    id: 'agentStage',
    header: 'Стейдж',
    accessorFn: (row) => row?.agent?.stage ?? '', // ⬅️ вместо 'agent.stage'
    sortingFn: 'alphanumeric',
  },
  { id: 'count', header: 'Колл-во', accessorKey: 'count' },
  {
    id: 'date',
    header: 'Дата выдачи',
    accessorFn: (row) => row?.date,
    cell: ({ row }) => format(new Date(row.original.date), 'dd-MM'),
  },
  { id: 'geo', header: 'Гео', accessorKey: 'geo' },
]
const selectedStage = ref(null)

async function submit () {
  const payload = { ...form, date: form.date ? new Date(form.date).toISOString() : null }
  await $fetch('/api/live', { method: 'POST', body: payload })
  await refreshLive()
}
const stageOptions = computed(() => [...agents.value]
    .map(s => ({ label: s.stage, value: s.id })))

async function deleteRecord() {
  await $fetch(`/api/live/1}`, { method: 'DELETE' })
  await refreshLive()
  console.log('')
}

function actionsItems(row) {
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        console.log('select fired for id:', row.original?.id)
        try {
          await $fetch(`/api/live/${row.original.id}`, { method: 'DELETE' })
          await refreshLive()
        } catch (e) {
          console.error(e)
        }
      }
    }
  ]]
}




const rows = computed(() => (Array.isArray(live.value) ? live.value : live.value?.data ?? [])
    .slice()
    .sort((a,b) => new Date(b.date) - new Date(a.date)))

onMounted(() => {
  if (agents.value?.length > 0) {
    items.value = agents.value.map((item) => {
      return {label: item?.stage, value: item?.id}
    })
  }

  if( live.value?.length > 0) {
    liveData.value = live.value.map((l) => {
      return {label: l?.geo, value: l?.id}
    })
  }

  form.agentId = items.value[0]?.value || null
  form.geo = geoArr.value[0] || null
})



</script>


<template>
  <UContainer>
    <div class="mb-6 rounded-2xl p-6 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      <h2 class="text-2xl font-semibold">Форма заполнения выданного лайва за день</h2>
      <p class="text-white/70 mt-1">Заполни поля ниже и нажми «Сохранить»</p>
    </div>

    <UCard class="rounded-2xl shadow-sm">
      <UForm
          :schema="LiveValidator"
          :state="form"
          @submit="submit"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <UFormField label="Выберите агента" name="agentId">
          <USelect
              v-model="form.agentId"
              :items="items"
              option-attribute="label"
              value-attribute="value"
              placeholder="Выбери из списка"
              class="w-40"
          />
        </UFormField>

        <UFormField label="Дата" name="date">
          <UInput v-model="form.date" type="date" />
        </UFormField>

        <UFormField label="Колл-во" name="count">
          <UInput v-model.number="form.count"
                  type="number"
                  min="0" />
        </UFormField>

        <UFormField label="Гео" name="geo">
          <USelect
              v-model="form.geo"
              :items="geoArr"
              option-attribute="label"
              value-attribute="value"
              placeholder="Выбери гео"
          />
        </UFormField>

        <div class="md:col-span-2 flex justify-end">
          <UButton type="submit"
                   size="lg"
                   class="rounded-xl px-6">
            Сохранить
          </UButton>
        </div>
      </UForm>
    </UCard>

    <UCard class="rounded-2xl shadow-sm mt-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium">История внесений</h3>
        <span class="text-sm text-gray-500">Всего: {{ live.length }}</span>
      </div>
      <UTable
          :data="live.live"
          :columns="columns"
      />
    </UCard>
  </UContainer>

</template>
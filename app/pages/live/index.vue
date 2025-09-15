<script setup> import {format} from "date-fns";
import {UDropdownMenu} from "#components";
import {UButton} from "#components";

const { data: live } = await useFetch('/api/live')
const {data: sales} = await useFetch('/api/sales')
const items = ref([])
const liveData = ref([])
const geoArr = ref(['KZ', 'KG', 'BY', 'UZ'])
const form = reactive({agentId: null, date: '', count: null, geo: ''})

function actionsItems(row) {
  return [{
    label: 'Удалить', icon: 'solar:close-square-bold', color: 'error', onSelect() {
      $fetch(`/api/live/${row.original.id}`, {method: 'DELETE',}
      )
    }
  },]
}






const columns = [
  {
    id: 'action', // ✅ обязательно, т.к. header = JSX/VNode
    header: '#',
    cell: ({ row }) =>
        h(UDropdownMenu, {
              content: { align: 'end' },
              items: actionsItems(row)
            }, () =>
                h(UButton, {
                  icon: 'i-lucide-ellipsis-vertical',
                  variant: 'subtle',
                  size: 'xl',
                  class: 'cursor-pointer'
                })
        )
  },
  { accessorKey: 'id', id: 'id', header: 'ID' },
  { accessorKey: 'agent.stage', id: 'agentStage', header: 'Stage' },
  { accessorKey: 'count', id: 'count', header: 'Count' },
  { accessorKey: 'date', id: 'date', header: 'Date' },
  { accessorKey: 'geo', id: 'geo', header: 'Geo' }
]






onMounted(() => {
  if (sales.value?.length > 0) {
    items.value = sales.value.map((item) => {
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

async function submit() {
  try {
    form.date = new Date(form.date)
    const res = await $fetch('/api/live', {method: 'POST', body: form})
    console.log('Успешно:', res)
  } catch (err) {
    console.error('Ошибка:', err)
  }
}

</script>


<template>
  <UContainer class="max-w-4xl mx-auto py-8">
    <div class="mb-6 rounded-2xl p-6 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      <h2 class="text-2xl font-semibold">Форма заполнения выданного лайва за день</h2>
      <p class="text-white/70 mt-1">Заполни поля ниже и нажми «Сохранить»</p>
    </div>

    <UCard class="rounded-2xl shadow-sm">
      <UForm
          :schema="schema"
          :state="form"
          @submit="submit"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <UFormField label="Выберите сейла" name="agentId">
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

        <UFormField label="Количество" name="count">
          <UInput v-model.number="form.count" type="number" min="0" />
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
          <UButton type="submit" size="lg" class="rounded-xl px-6">
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
      <UTable :data="liveData" />
    </UCard>
  </UContainer>
</template>
<script setup> import {format} from "date-fns";
import {UDropdownMenu} from "#components";
import {UButton} from "#components";


const { data: messanger, refresh: refreshLive } = await useFetch('/api/messanger', { key: 'messanger' })
const {data: sales} = await useFetch('/api/sales')
const items = ref([])
const liveData = ref([])
const messangerType = ref(['Whatsapp', 'Telegram'])
const form = reactive({agentId: null, date: '', count: null, messanger: ''})
const columns = [
  {
    id: 'action',
    header: 'Действие',
    cell: ({ row }) =>
        h(
            UDropdownMenu,
            { content: { align: 'end' }, items: actionsItems(row) },
            {
              // ⬅️ важно: слоты передаём объектом
              default: () => h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                variant: 'subtle',
                size: 'xl',
                class: 'cursor-pointer'
              })
            }
        )
  },
  { id: 'id', header: 'ID', accessorKey: 'id' },
  {
    id: 'agentStage',
    header: 'Стейдж',
    accessorFn: (r) => r?.agent?.stage ?? '',
    sortingFn: 'alphanumeric',
  },
  { id: 'count', header: 'Кол-во', accessorKey: 'count' },
  {
    id: 'date',
    header: 'Дата выдачи',
    accessorFn: (r) => r?.date,
    cell: ({ row }) => format(new Date(row.original.date), 'dd-MM'),
  },
  { id: 'messanger', header: 'Мессенджер', accessorKey: 'messanger' },
]


async function submit () {
  const payload = { ...form, date: form.date ? new Date(form.date).toISOString() : null }
  await $fetch('/api/messanger', { method: 'POST', body: payload })
  await refreshLive()
}


async function deleteRecord () {
  await $fetch(`/api/messanger/1`, { method: 'DELETE' }) // если вдруг нужен для теста
  await refreshLive()
}

function actionsItems(row) {
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        console.log('select fired for id:', row.original?.id)
        try {
          await $fetch(`/api/messanger/${row.original.id}`, { method: 'DELETE' })
          await refreshLive()
        } catch (e) {
          console.error(e)
        }
      }
    }
  ]]
}





const rows = computed(() =>
    (Array.isArray(messanger.value) ? messanger.value : messanger.value?.data ?? [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
)


onMounted(() => {
  if (sales.value?.length > 0) {
    items.value = sales.value.map((item) => {
      return {label: item?.stage, value: item?.id}
    })
  }




  form.agentId = items.value[0]?.value || null
  form.messanger = messangerType.value[0] || null
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

        <UFormField label="Колл-во" name="count">
          <UInput v-model.number="form.count" type="number" min="0" />
        </UFormField>

        <UFormField label="Мессенджер" name="messanger">
          <USelect
              v-model="form.messanger"
              :items="messangerType"
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
        <span class="text-sm text-gray-500">Всего: {{ rows.length }}</span>
      </div>

      <UTable
          :data="rows"
          :columns="columns"
      />
    </UCard>
  </UContainer>

</template>
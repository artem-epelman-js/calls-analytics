<script setup lang="ts">
import { format } from 'date-fns'
import { computed, ref, reactive, onMounted, h } from 'vue'
import { UDropdownMenu, UButton, UTable, UForm, UFormField, UInput, USelect, UCard, UContainer, UCheckbox } from '#components'
import {messangerValidator} from "~~/validators/messanger.validator";


const { data: messanger, refresh: refreshMessanger } = await useFetch('/api/messanger', { key: 'messanger' })
const { data: sales } = await useFetch('/api/sales')


const items = ref<{ label: string; value: number }[]>([])
const messangerData = ref<{ label: string; value: number }[]>([])


const typeArr = ref(['TELEGRAM', 'WHATSAPP']) // ← синхронизируй с Prisma enum

const form = reactive({
  agentId: null,
  date: '',
  count: null,
  type: null,
  isRecovery: null
})


const columns = [
  {
    id: 'action',
    header: 'Действие',
    cell: ({ row }: any) =>
        h(
            UDropdownMenu,
            { content: { align: 'end' }, items: actionsItems(row) },
            () =>
                h(UButton, {
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
    accessorFn: (row: any) => row?.agent?.stage ?? '', // agent должен приходить из API с include
    sortingFn: 'alphanumeric'
  },
  { id: 'count', header: 'Колл-во', accessorKey: 'count' },
  {
    id: 'date',
    header: 'Дата выдачи',
    accessorFn: (row: any) => row?.date,
    cell: ({ row }: any) => format(new Date(row.original.date), 'dd-MM')
  },
  { id: 'type', header: 'Тип', accessorKey: 'type' },
  { id: 'isRecovery', header: 'Рекавери', accessorKey: 'isRecovery' },
]


async function submit () {
  const payload = {
    agentId: form.agentId,
    date: form.date ? new Date(form.date).toISOString() : null,
    count: form.count,
    type: form.type,
    isRecovery: form.isRecovery
  }
  await $fetch('/api/messanger', { method: 'POST', body: payload })
  await refreshMessanger()
}


function actionsItems(row: any) {
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        try {
          await $fetch(`/api/messanger/${row.original.id}`, { method: 'DELETE' })
          await refreshMessanger()
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
        .sort((a: any, b: any) => +new Date(b.date) - +new Date(a.date))
)


onMounted(() => {
  if (Array.isArray(sales.value) && sales.value.length > 0) {
    items.value = sales.value.map((s: any) => ({ label: s?.stage, value: s?.id }))
  }

  if (Array.isArray(messanger.value) && messanger.value.length > 0) {
    messangerData.value = messanger.value.map((m: any) => ({ label: m?.type, value: m?.id }))
  }

  form.agentId = items.value[0]?.value ?? null
  form.type = typeArr.value[0] ?? null
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
          @submit="submit"
          :state="form"
          :schema="messangerValidator"
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

        <UFormField label="Рекавери" name="isRecovery">
          <USelect
              v-model="form.isRecovery"
              :items="[
              { label: 'True', value: true },
              { label: 'False', value: false }
            ]"
              placeholder='False'
          />
        </UFormField>

        <UFormField label="Колл-во" name="count">
          <UInput v-model.number="form.count" type="number" min="0" />
        </UFormField>

        <UFormField label="Тип" name="type">
          <!-- массив строк — просто :items="typeArr", без option/value-attribute -->
          <USelect
              v-model="form.type"
              :items="typeArr"
              placeholder="Выбери тип"
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
       <UTable :data="messanger.messanger" :columns="columns" />
    </UCard>
  </UContainer>
</template>

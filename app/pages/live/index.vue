<script setup> import {format} from "date-fns";
import {UDropdownMenu} from "#components";
import {UButton} from "#components";

const {data: live} = await useFetch('/api/live')
const {data: sales} = await useFetch('/api/sales')
const items = ref([])
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

const columns = [{
  accessorKey: 'action',
  header: '#',
  cell: ({row}) => h(UDropdownMenu, {
    content: {align: 'end'},
    items: actionsItems(row)
  }, () => h(UButton, {icon: 'i-lucide-ellipsis-vertical', variant: 'subtle', size: 'xl', class: 'cursor-pointer',}))
}, {accessorKey: 'id',}, {accessorKey: 'agent.stage'}, {accessorKey: 'count',}, {accessorKey: 'date',}, {accessorKey: 'geo',}]
onMounted(() => {
  if (sales.value?.length > 0) {
    items.value = sales.value.map((item) => {
      return {label: item?.stage, value: item?.id}
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
} </script>
<template>


  <div><h2>Форма заполнения выданого лайва за день</h2>
    <UForm :state="form" @submit="submit">
      <UFormField label="Выберите сейла: " name="agentId">
        <USelect v-model="form.agentId" :items="items" type="number"/>
      </UFormField>
      <UFormField label="Дата" name="date">
        <UInput type="date"/>
      </UFormField>
      <UFormField label="Количество" name="count">
        <UInput v-model="form.count" type="number"/>
      </UFormField>
      <UFormField label="Гео" name="geo">
        <USelect v-model="form.geo" :items="geoArr" type="text"/>
      </UFormField>
      <UButton style="margin-top: 20px" type="submit">Сохранить</UButton>
    </UForm>
    <UTable :data="live" :columns="columns"/>
  </div>
</template>
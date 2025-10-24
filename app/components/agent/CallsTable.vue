<script setup lang="ts">
import {useCallStore} from "~~/stores/call.store";
import {storeToRefs} from "pinia";
import type {TableColumn} from "#ui/components/Table.vue";
import type {Calls} from "@prisma/client";
import {h} from "vue";
import {renderSortableHeader} from "~/app_helpers/sort-helper";

// components
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

defineProps<{
  agentId:number
}>()

// store
const store = useCallStore()
const {data, count, params} = storeToRefs(store)

// table
function callActions(row: any) {
  const callId = row.original?.id
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        try {
          await store.remove(callId)
        } catch (e) {
          console.error(e)
        }
      }
    }
  ]]
}
const callsColumns: TableColumn<Calls>[] = [
  {
    id: 'action',
    header: 'Действие',
    cell: ({row}) =>
        h(
            UDropdownMenu,
            {content: {align: 'end'}, items: callActions(row)},
            () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              variant: 'subtle',
              size: 'xl',
              class: 'cursor-pointer'
            })
        )
  },
  {
    accessorKey: 'date',
    header: renderSortableHeader('date', 'Дата', params),

    cell: ({row}) => {

      return new Date(row.getValue('date')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'phone',
    header: 'Номер',

  },
  {
    accessorKey: 'duration',
    header: renderSortableHeader('duration', 'Длительность', params),
    cell: ({row}) => {
      const sec = Number(row.getValue('duration') ?? 0)
      return new Date(sec * 1000).toISOString().slice(11, 19)
    }
  },
  {
    accessorKey: 'price',
    header: renderSortableHeader('price', 'Цена', params),
  },
  {
    accessorKey: 'status',
    header: renderSortableHeader('status', 'Статус', params),

    cell: ({row}) => {
      const color = {
        'Вызов завершен': 'success' as const,
        'Занято': 'success' as const,
        'Временно недоступен': 'secondary' as const,
        'Сервис недоступен': 'secondary' as const,
        'Таймаут запроса': 'secondary' as const,
        'Отклонить': 'warning' as const,
        'Отменено': 'warning' as const,
        'Disconnected': 'error' as const,
        'Forbidden': 'error' as const,
        'Internal Server Error': 'error' as const,
        'No Rates Found for Account 23': 'error' as const,
        'Неверный набор или несуществующий номер': 'error' as const,
        'Temporarily unavailable': 'neutral' as const,
      }[row.getValue('status') as string]

      return h(UBadge, {class: 'capitalize', variant: 'subtle', color}, () => // todo дописать в конец color
          row.getValue('status')
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Изменен',
    cell: ({row}) => {
      return new Date(row.getValue('createdAt')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'updatedAt',
    header: 'Загружен',
    cell: ({row}) => {
      return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
]

// watcher
watch(params, () => {
  store.getAll()
}, {deep: true})

onMounted(() => {

})

</script>

<template>
  <div class="">
    <UCard class="mt-10">
      <UFormField>
        <UInput
            v-model="params.search"
            placeholder="Поиск по номеру..."
        />
      </UFormField>
      <Transition name="fade-slide" mode="out-in">
        <UTable
            :data="data || []"
            :columns="callsColumns"
        />
      </Transition>
    </UCard>
    <UPagination
        class="flex justify-center mt-4"
        size="xl"
        v-model:page="params.page"
        :total="count"
        :items-per-page="params.limit"

    />
  </div>
</template>

<style scoped>

</style>
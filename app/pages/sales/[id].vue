<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { format } from "date-fns";
import { useRouter } from 'vue-router'
import { useFetch } from '#app';
import {callValidator} from "~~/validators/call.validator";

const route = useRoute()
const router = useRouter()
const agentId = route.params.id as string

const items = ref(null)
const live = ref([])
const messanger = ref([])
const sales = ref([])
const page = ref(1);
const totalLeaveByAgentId = ref(0)
const totalMessangerByAgentId = ref(0)
const file = ref<File | null>(null)
const activeToggle = ref(null)
const isLoading = ref(false)
const selectedStage = ref(null)
const arr = ref([10, 20, 30, 40])
const state = reactive({
  skip: 0,
  take: 5,
  orderBy: 'id',
  sortOrder: 'desc',
  status: undefined as string | undefined,
  startDate: undefined,
  endDate: undefined,
});


async function getLive(id?: number | string) {
  const currentId = Number(id ?? selectedStage.value ?? agentId)
  live.value = await $fetch(`/api/live`, { params: { saleId: currentId } })
}

async function getMessanger(id?: number|string) {
  const currentId = Number(id??selectedStage.value ?? agentId)
  messanger.value = await $fetch('/api/messanger', { params: { saleId: currentId } })
}

async function getTotalLeaveByAgentId() {
  totalLeaveByAgentId.value =  await $fetch(`/api/live/${agentId}`)
}

async function getTotalMessangerByAgentId() {
  totalMessangerByAgentId.value =  await $fetch(`/api/messanger/${agentId}`)
  console.log(totalMessangerByAgentId.value)
}


async function getData() {
  const skip = (page.value - 1) * state.take;
  items.value = await $fetch(`/api/sales/${agentId}`, {params: {...state, skip}})
  selectedStage.value = items.value.sale?.id
}




async function getSales() {
  sales.value = await $fetch('/api/sales')
}
async function sendDate() {
  await useFetch(`/api/sales/${saleId}`, {
    params: {
      startDate: state.startDate,
      endDate: state.endDate,
    }
  })
  await getData()
}
async function upload() {
  if (!file.value) {
    alert('Пожалуйста, выберите файл.');
    return;
  }

  isLoading.value = true;

  const formitems = new FormData();
  formitems.append('file', file.value)
  formitems.append('saleId', saleId);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formitems,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Server responded with an error:', responseData);
      throw new Error(responseData.statusMessage || 'Ошибка при загрузке файла.');
    }

    alert('Файл успешно загружен!');
    await getData();
    file.value = null
  } catch (error: any) {
    console.error('Ошибка при загрузке:', error);
    alert(error.message);
  } finally {
    isLoading.value = false;
  }
}


function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    file.value = target.files[0]
  } else {
    file.value = null
  }
}
function statusToggle(event: Event) {
  // Проверяем, что все объекты в цепочке существуют
  if (items && items.value && items.value.sale) {
    // Инвертируем значение isActive напрямую
    items.value.sale.isActive = !items.value.sale.isActive;

    // Выводим обновлённое значение в консоль
    console.log(items.value.sale.isActive);
  } else {
    // Опционально: выводим ошибку, если объект не найден
    console.error('Не удалось найти sale или isActive');
  }
}

const stageOptions = computed(() => [...sales.value]
    .map(s => ({ label: s.stage, value: s.id })))
const fetchParams = computed(() => ({
  ...state,
  skip: (page.value - 1) * state.take,
}));
const result = computed(() => {
  if (!items.value) return
  return new Intl.NumberFormat('ru-RU', {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((items?.value?.callAgregation?._sum?.duration / 60) * 0.25)
})
const totalDuration = computed(() => {
  if (!items?.value?.callAgregation?._sum?.duration) return
  const totalDurationSec = items?.value.callAgregation?._sum?.duration;
  const duration = new Date(0, 0, 0, 0, 0, totalDurationSec);
  return format(duration, 'HH:mm:ss');
})

watch([
  page,
  () => state.take,
  () => state.status,
  () => state.startDate,
  () => state.endDate
], () => {getData()})


watch(selectedStage,()=>{
  router.push({ path: `/sales/${selectedStage.value}` })
})
onMounted(async () => {
  await getData()
  await getLive()
  await getSales()
  await getMessanger()
  await getTotalLeaveByAgentId()
  await getTotalMessangerByAgentId()
})

</script>

<template>
  <UContainer class="flex flex-col gap-6">
    <div class="mb-6 rounded-2xl p-6 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      <h2 class="text-2xl font-semibold">Форма выгрузки звонков в базу</h2>
    </div>
    <UCard>
      <div class="flex items-center justify-between gap-4 border-b pb-4">
        <div class="flex items-center gap-2">
          <h1 class="text-3xl font-bold text-gray-700 dark:text-gray-300">
            <USelect
                class="w-50"
                v-model="selectedStage"
                :items="stageOptions"
                size="xl"
            >
            </USelect>
          </h1>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6 pt-4">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер</p>
            {{items?.sale?.id}}
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</p>
          <div class="flex items-center gap-2 mt-2">
            <UBadge :color="items?.sale?.isActive ? 'primary' : 'error'" variant="subtle">
              {{ items?.sale?.isActive ? 'Активен' : 'Неактивен' }}
            </UBadge>

          </div>
        </div>

        <div v-if="items?.sale?.createdAt">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Добавлен</p>
          <p class="mt-2 text-base font-medium">
            {{ format(new Date(items?.sale?.createdAt || ''), 'dd.MM.yy') }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="grid grid-cols-2 gap-4">
        <div class="grid grid-cols-2 gap-2">

          <p>Кол-во лайва:</p><p>{{ totalLeaveByAgentId.totalLeads }}</p>
          <p>Кол-во выданых месс-в:</p><p>{{ totalMessangerByAgentId.totalMessanger }}</p>
          <p>Кол-во звонков:</p><p>{{ items?.callAgregation?._count }}</p>
          <p>Кол-во сек. в звонке:</p><p> {{ items?.callAgregation?._sum?.duration }}</p>
          <p>Расход по телефонии:</p><p> {{ result }}</p>
          <p>Всего на линии:</p><p> {{ totalDuration }}</p>
        </div>

        <div class="flex flex-col justify-end">
          <UFileUpload
              v-model="file"
              label="Загрузить файл"
              class="w-100 flex self-end"
          />

          <UButton
              @click="upload"
              :loading="isLoading"
              :disabled="!file"
              class="w-30 flex self-end mt-4"
          >
            Отправить файл
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <UForm
            @submit.prevent="sendDate"
              :shema="callValidator"
               :state="state"
               class="flex flex-col lg:flex-row gap-4 flex-1">

          <div class="flex-1">
            <UFormField label="Начальная дата">
              <USeparator class="py-5 w-40"/>
              <UInput
                  size="xl"
                  type="date"
                  v-model="state.startDate" />
            </UFormField>
          </div>
          <div class="flex-1">
            <UFormField label="Конечная дата">
              <USeparator class="py-5 w-40"/>
              <UInput
                  size="xl"
                  type="date"
                  v-model="state.endDate"
              />
            </UFormField>
          </div>
        </UForm>

        <div class="w-40">
          <USelect
              v-model.number="state.take"
              :items="arr"
              size="xl"
          >
            Показать {{state.take}} записей
          </USelect>
        </div>
      </div>
    </UCard>

    <UCard>
      <UTable :data="items?.call" />

      <div v-if="items?.callAgregation?._count > state.take" class="mt-6 flex justify-center">
        <UPagination
            v-model:page="page"
            :total="items?.callAgregation?._count || 0"
            :items-per-page=20
        />
      </div>
    </UCard>
  </UContainer>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { format } from "date-fns";
import { useRouter } from 'vue-router'
import { useFetch } from '#app';

const route = useRoute()
const router = useRouter()
const saleId = route.params.id as string

const items = ref(null)
const live = ref([])

const sales = ref([])
const selectedStage = ref(null)
const arr = [10, 20, 30, 40]
console.log(selectedStage)


const page = ref(1);

const state = reactive({
  skip: 0,
  take: 5,
  orderBy: 'id',
  sortOrder: 'desc',
  status: undefined as string | undefined,
  startDate: undefined,
  endDate: undefined,
});



const fetchParams = computed(() => ({
  ...state,
  skip: (page.value - 1) * state.take,
}));

async function getLive() {
  live.value = await $fetch(`/api/live`)
}









async function getData() {
  const skip = (page.value - 1) * state.take;
  items.value = await $fetch(`/api/sales/${saleId}`, {params: {...state, skip}})
}

async function getSales() {
  sales.value = await $fetch('/api/sales')
}


const stageOptions = computed(() =>
    [...sales.value]
        .sort((a, b) => a.stage.localeCompare(b.stage)) // сортируем по алфавиту
        .map(s => ({ label: s.stage, value: s.id }))
)

watch([page, () => state.take, () => state.status], () => {
  getData()
}, { deep: true })






onMounted(async () => {
  await getSales()
  await getData()
  await getLive()
})





function onSelectChange() {
  if (!selectedStage.value) return
  router.push({ path: `/sales/${selectedStage.value}` })
}

const file = ref<File | null>(null)
const isLoading = ref(false)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    file.value = target.files[0]
  } else {
    file.value = null
  }
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
</script>

<template>
  <div class="flex flex-col gap-6">

    <UCard>
      <div class="flex items-center justify-between gap-4 border-b pb-4">
        <div class="flex items-center gap-2">
          <h1 class="text-3xl font-bold text-gray-700 dark:text-gray-300">
            {{items?.sale?.stage}}
            <USelect
                class="w-100"
                variant="ghost"
                v-model="selectedStage"
                :items="stageOptions"
                @change="onSelectChange"
            />
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
            <UBadge :color="items?.sale?.isActive ? 'green' : 'red'" variant="subtle">
              {{ items?.sale?.isActive ? 'Активен' : 'Неактивен' }}
            </UBadge>
            <UCheckbox
                class="flex justify-end"
                :model-value="items?.sale?.isActive"
                disabled
            />
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
        <div class="flex flex-col gap-2">
          <p>Количество звонков - {{ items?.callAgregation?._count }}</p>
          <p>Количество секунд в наборе/диалоге - {{ items?.callAgregation?._sum?.duration }}</p>
          <p>Расход по телефонии - {{ result }}</p>
          <p>Всего времени на линии - {{ totalDuration }}</p>
        </div>

        <div class="flex flex-col justify-end">
          <UFileUpload
              v-model="file"
              label="Загрузить файл"
              class="w-full"
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
        <UForm @submit.prevent="sendDate" :state="state" class="flex flex-col lg:flex-row gap-4 flex-1">
          <div class="flex-1">
            <UFormField label="Начальная дата">
              <UInput type="date" v-model="state.startDate" />
            </UFormField>
          </div>
          <div class="flex-1">
            <UFormField label="Конечная дата">
              <UInput type="date" v-model="state.endDate" />
            </UFormField>
          </div>
          <UButton type="submit" class="self-end">Применить</UButton>
        </UForm>

        <div class="w-24">
          <USelect
              v-model="state.take"
              :items="arr"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <UTable :data="items?.call" />

      <div v-if="items?.callAgregation?._count > state.take" class="mt-6 flex justify-center">
        <UPagination
            v-model:page="page"
            :page-count="state.take"
            :total="items?.callAgregation?._count"
        />
      </div>
    </UCard>
  </div>
</template>
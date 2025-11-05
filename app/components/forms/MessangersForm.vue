<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import { useToast } from '#imports'
import { messangerValidator as MessangerValidator } from '~~/validators/messanger.validator'
import { useMessangerStore, type Messanger, type CreateMessangerPayload } from '~~/stores/messanger.store'

type MessangerType = 'TELEGRAM' | 'WHATSAPP'

/** Внешнее управление только видимостью */
const open = defineModel<boolean>('open', { default: false })

/** Проп со справочником типов (опционально) */
const props = defineProps<{ typeItems?: Array<{ label: string; value: MessangerType }> }>()

/** Дефолтный справочник, если typeItems не передан */
const fallbackTypeItems: Array<{ label: string; value: MessangerType }> = [
  { label: 'Telegram', value: 'TELEGRAM' },
  { label: 'WhatsApp', value: 'WHATSAPP' }
]
const typeItems = computed(() => (props.typeItems?.length ? props.typeItems : fallbackTypeItems))

/** Контекст */
const route = useRoute()
const agentId = Number(route.params.id ?? NaN)
const t = useToast()
const { create, update, getAll } = useMessangerStore()

/** Режим формы */
type Mode = 'create' | 'edit'
const mode = ref<Mode>('create')
const editingId = ref<number | null>(null)

/** Форма */
const today = format(new Date(), 'yyyy-MM-dd')
const form = reactive<CreateMessangerPayload>({
  agentId: Number.isFinite(agentId) ? agentId : (undefined as unknown as number),
  date: today,
  type: '' as unknown as MessangerType,
  count: null as unknown as number | null,
  price: 10 as number | null,       // по умолчанию 10, можно оставить null если хочешь не отправлять
  isRecovery: false
})

/** Валидность */
const isValid = computed(() =>
    Number.isFinite(form.agentId) && form.agentId! > 0 &&
    !!form.date && !!form.type &&
    (form.count == null || form.count >= 0) &&
    (form.price == null || form.price >= 0)
)

/** Сброс */
function resetForm(keepAgent = true) {
  form.agentId = keepAgent && Number.isFinite(agentId) ? agentId : (undefined as unknown as number)
  form.date = today
  form.type = '' as unknown as MessangerType
  form.count = null
  form.price = 10
  form.isRecovery = false
  editingId.value = null
  mode.value = 'create'
}

/** Открыть форму для редактирования записи */
function edit(rec: Messanger) {
  mode.value = 'edit'
  editingId.value = rec.id
  form.agentId = rec.agentId

  // input[type=date] хочет yyyy-MM-dd
  const iso = typeof rec.date === 'string' ? rec.date : new Date(rec.date).toISOString()
  form.date = iso.slice(0, 10)

  form.type = rec.type as MessangerType
  form.count = (rec.count ?? null) as any
  form.price = (rec.price ?? 10) as any
  form.isRecovery = !!rec.isRecovery

  open.value = true
}

/** Сабмит */
const isSubmitting = ref(false)
async function onSubmit() {
  if (!isValid.value) {
    t.add({ title: 'Форма неполная', description: 'Заполни обязательные поля', color: 'warning' })
    return
  }
  isSubmitting.value = true
  try {
    if (mode.value === 'create') {
      // Создание
      // Отправляем только необходимые поля; price необязателен на бэке
      const payload: CreateMessangerPayload = {
        agentId: form.agentId!,
        date: form.date,
        type: form.type,
        count: form.count ?? 0,
        isRecovery: !!form.isRecovery,
        // если хочешь не отправлять price при null, можно условно добавить
        ...(form.price != null ? { price: form.price } : {})
      }
      await create(payload)
      resetForm(true)
      // open.value = false // если надо закрывать после создания
    } else {
      // Редактирование
      if (!editingId.value) return
      const payload: { type?: MessangerType; isRecovery?: boolean; count?: number; date?: string; price?: number } = {}
      if (form.type) payload.type = form.type
      if (form.count != null) payload.count = form.count
      if (form.date) payload.date = form.date
      if (form.price != null) payload.price = form.price
      payload.isRecovery = !!form.isRecovery

      await update(editingId.value, payload)
      open.value = false
      resetForm(true)
    }
  } catch (e: any) {
    const message = e?.data?.statusMessage || e?.message || 'Ошибка'
    t.add({ title: 'Не удалось сохранить', description: message, color: 'error' })
  } finally {
    await getAll()
    isSubmitting.value = false
  }
}

function onCancel() {
  open.value = false
}

/** expose для родителя */
defineExpose({ edit })

onMounted(() => {
  if (!Number.isFinite(agentId)) {
    t.add({ title: 'Внимание', description: 'agentId из маршрута не определён', color: 'warning' })
  }
})
</script>

<template>
  <UCard v-if="open" class="rounded-2xl shadow-sm">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-lg font-semibold">
        {{ mode === 'create' ? 'Добавить Messanger' : `Редактировать запись #${editingId}` }}
      </h3>
      <UButton variant="ghost" color="error" size="sm" @click="onCancel">
        Закрыть
      </UButton>
    </div>

    <UForm :state="form" :schema="MessangerValidator" @submit.prevent="onSubmit">
      <div class="flex flex-wrap items-end gap-4">
        <UFormField label="Дата" name="date">
          <UInput v-model="form.date" type="date" />
        </UFormField>

        <UFormField label="Кол-во" name="count">
          <UInput v-model.number="form.count" type="number" min="0" />
        </UFormField>

        <UFormField label="Цена" name="price" hint="Если пусто — на бэке возьмётся дефолт 10">
          <UInput v-model.number="form.price" type="number" min="0" />
        </UFormField>

        <UFormField label="Тип" name="type">
          <USelect
              v-model="form.type"
              :items="typeItems"
              option-attribute="label"
              value-attribute="value"
              placeholder="Выбери тип"
          />
        </UFormField>

        <UFormField label="Recovery" name="isRecovery">
          <div class="h-10 flex items-center">
            <USwitch v-model="form.isRecovery" />
          </div>
        </UFormField>

        <div class="flex gap-2">
          <UButton
              type="submit"
              variant="ghost"
              size="lg"
              class="rounded-xl px-6"
              :loading="isSubmitting"
              :disabled="!isValid"
          >
            {{ mode === 'create' ? 'Сохранить' : 'Обновить' }}
          </UButton>

          <UButton
              v-if="mode === 'create'"
              type="button"
              variant="ghost"
              size="lg"
              class="rounded-xl px-6"
              @click="resetForm()"
              :disabled="isSubmitting"
          >
            Очистить
          </UButton>
        </div>
      </div>
    </UForm>
  </UCard>
</template>

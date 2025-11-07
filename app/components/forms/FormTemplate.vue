<script setup lang="ts">
import {reactive, ref} from "vue";
import {type CreateLivePayload, useLiveStore} from "~~/stores/live.store.ts";
import {useRoute} from "#vue-router";

const route = useRoute()
const agentId = Number(route.params.id as string)

let formUpdateAction:any

const formUpdateData = reactive<any>({})
const formCreateData = reactive<any>({})

const options = <any[]>[]
const labels = <any[]>[{
  label: String,
  value: String,
}]

defineProps({
  isShowCreateForm:Boolean,
  isShowUpdateForm:Boolean,
  formData: FormData,
  formUpdateAction:Function,
  options: Array,
  labels: Array,
})



const isShowCreateForm = ref<boolean>(false)
const isShowUpdateForm = ref<boolean>(false)


async function handleCreate() {
  try {
    await formUpdateAction({...formCreateData})
    isShowCreateForm.value = false
  } catch (e) {
    console.error('Create failed:', e)
  }
}

</script>

<template>
  <UForm :v-if="isShowCreateForm"
         :state="formCreateData"
         @submit.prevent="handleCreate"
  >
    <div class="flex justify-start gap-4">
      <UFormField :label="formCreateData?.label" name="date">
        <UInput v-model="formCreateData?.label" type="date"/>
      </UFormField>

      <UFormField label="Колл-во" :name="formCreateData.label">
        <UInput v-model.number="formCreateData?.value"
                type="number"
                min="0"/>
      </UFormField>

      <UFormField label="Гео" :name="formUpdateData.label">
        <USelect
            v-model="formUpdateData?.value"
            :items="options"
            option-attribute="label"
            value-attribute="value"
            placeholder="Выбери гео"
        />
      </UFormField>
      <UButton type="submit"
               variant="ghost"
               size="lg"
               class="rounded-xl px-6">
        Сохранить
      </UButton>
    </div>


  </UForm>
</template>

<style scoped>

</style>
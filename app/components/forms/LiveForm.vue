<script setup lang="ts">
import {storeToRefs} from "pinia";
import {type CreateLivePayload, type UpdateLivePayload, useLiveStore} from "~~/stores/live.store";
import {reactive} from "vue";
import {useRoute} from "#vue-router";

const showCreateLiveForm = ref<boolean>(false)
const showUpdateLiveForm = ref<boolean>(false)

const {create, update, getAll} = useLiveStore()

const {data, params} = storeToRefs(useLiveStore())

const route = useRoute()
const agentId = Number(route.params.id as string)

const emit = defineEmits([
    'createLive',
    'updateLive'
])


const liveCreateForm = reactive<CreateLivePayload>({
  agentId: agentId,
  geo: '',
  count: null,
  date: '',
})

const liveUpdateForm = reactive<UpdateLivePayload>({
  id: null,
  geo: '',
  count: null,
  date: '',
})


const liveGeo = [
  {
    label: 'KZ',
    value: 'KZ',
  },
  {
    label: 'KG',
    value: 'KG',
  },
  {
    label: 'BY',
    value: 'BY',
  },
  {
    label: 'UZ',
    value: 'UZ',
  },
]

const handleCreate = async () => {
  try {
    await create({...liveCreateForm})
  } catch (e) {
    console.log(e)
  }
  finally {
    showCreateLiveForm.value = false
  }
}

async function handleUpdate() {
  if (!liveUpdateForm.id) return
  try {
    await update(liveUpdateForm.id, {
      count: liveUpdateForm.count ?? undefined,
      geo: liveUpdateForm.geo,
      date: liveUpdateForm.date,
    })
  } catch (e) {
    console.log(e)
  } finally {
    showCreateLiveForm.value = false
  }
}

</script>


<template>

</template>
<script setup lang="ts">

import {LiveValidator} from "~~/validators/live.validator";
import {messangerValidator} from "~~/validators/messanger.validator";
import {UButton} from "#components";
import {ref} from "vue";

const startDate = ref<string | undefined>(undefined)
const endDate = ref<string | undefined>(undefined)
const activeTab = ref<'calls' | 'live' | 'messengers' | 'analytics'>('calls')
const tabs = [
  {
    label: 'Звонки',
    icon: 'icon-park-outline:phone-telephone',
    slot: 'calls',
    value: 'calls'
  },
  {
    label: 'Лайв',
    icon: 'icon-park-outline:peoples',
    slot: 'live',
    value: 'live'
  },
  {
    label: 'Мессенджеры',
    icon: 'icon-park-outline:message-sent',
    slot: 'messanger',
    value: 'messanger'

  },
  {
    label: 'Аналитика',
    icon: 'icon-park-outline:chart-histogram',
    slot: 'analytics',
    value: 'analytics'

  }
]

</script>

<template>
  <UCard>
    <div class="grid grid-cols-1 gap-6">
      <div class="flex justify-between w-150">
        <div>
          <UFormField label="Начальная дата">
            <UInput
                size="xl"
                type="date" v-model="startDate"/>
          </UFormField>
        </div>
        <div class="flex">
          <UFormField label="Конечная дата">
            <UInput size="xl" type="date" v-model="endDate"/>
          </UFormField>

        </div>
      </div>
      <UTabs v-model="activeTab" :items="tabs" class="w-full">
        <template #calls>

        </template>

        <template #live>
          <UCard class="rounded-2xl shadow-sm">
            <div class="flex justify-end">
              <UButton
                  :label="showCreateLiveForm ? 'Скрыть форму' : 'Добавить лайв'"
                  :icon="showCreateLiveForm ? 'i-lucide-minus' : 'i-lucide-plus'"
                  @click="showCreateLiveForm = !showCreateLiveForm"
              />
            </div>

            <UForm v-if="showCreateLiveForm"
                   :state="liveCreateForm"
                   @submit.prevent=handleLiveCreate
            >
              <div class="flex justify-start gap-4">
                <UFormField label="Дата" name="date">
                  <UInput v-model="liveCreateForm.date" type="date"/>
                </UFormField>

                <UFormField label="Колл-во" name="count">
                  <UInput v-model.number="liveCreateForm.count"
                          type="number"
                          min="0"/>
                </UFormField>

                <UFormField label="Гео" name="geo">
                  <USelect
                      v-model="liveCreateForm.geo"
                      :items="liveGeo"
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
            <UForm v-if="showUpdateLiveForm"
                   :shema="LiveValidator"
                   :state="liveUpdateForm"
                   @submit="handleLiveUpdate"
            >
              <div class="flex justify-start gap-4">
                <UFormField label="Дата" name="date">
                  <UInput v-model="liveUpdateForm.date" type="date"/>
                </UFormField>

                <UFormField label="Колл-во" name="count">
                  <UInput v-model.number="liveUpdateForm.count"
                          type="number"
                          min="0"/>
                </UFormField>

                <UFormField label="Гео" name="geo">
                  <USelect
                      v-model="liveUpdateForm.geo"
                      :items="liveGeo"
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
                <UButton type="button"
                         variant="ghost"
                         size="lg"
                         @click="showUpdateLiveForm = false"
                         color="error"
                         class="rounded-xl px-6">
                  Отмена
                </UButton>
              </div>


            </UForm>
          </UCard>

          <UCard class="rounded-2xl shadow-sm mt-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium">История внесений</h3>
              <span class="text-sm text-gray-500">Всего: {{ live.length }}</span>
            </div>
            <UTable
                :data="live"
                :columns="liveColumns"
            />
          </UCard>

          <UPagination
              class="flex justify-center mt-4"
              size="xl"
              v-model:page="liveParams.page"
              :items-per-page="liveParams.limit"
              :total="liveCount"/>
        </template>

        <template #messanger>
          <UCard class="rounded-2xl shadow-sm">
            <div class="flex justify-end">
              <UButton
                  :label="showCreateMessangerForm ? 'Скрыть форму' : 'Добавить мессенджер'"
                  :icon="showCreateMessangerForm ? 'i-lucide-minus' : 'i-lucide-plus'"
                  @click="showCreateMessangerForm = !showCreateMessangerForm"
              />
            </div>

            <UForm v-if="showCreateMessangerForm"
                   :state="messangerCreateForm"
                   @submit.prevent=handleMessangerCreate
            >
              <div class="flex justify-start gap-4">
                <UFormField label="Дата" name="date">
                  <UInput v-model="messangerCreateForm.date" type="date"/>
                </UFormField>

                <UFormField label="Колл-во" name="count">
                  <UInput v-model.number="messangerCreateForm.count"
                          type="number"
                          min="0"/>
                </UFormField>

                <UFormField label="Тип" name="type">
                  <USelect
                      v-model="messangerCreateForm.type"
                      :items="messangerTypes"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Выбери тип"
                  />
                </UFormField>
                <UFormField label="Рекавери" name="isRecovery">
                  <USelect
                      v-model="messangerCreateForm.isRecovery"
                      :items="isRecovery"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Рекавери"
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
            <UForm v-if="showUpdateMessangerForm"
                   :shema="messangerValidator"
                   :state="messangerUpdateForm"
                   @submit="handleMessangerUpdate"
            >
              <div class="flex justify-start gap-4">
                <UFormField label="Дата" name="date">
                  <UInput v-model="messangerUpdateForm.date" type="date"/>
                </UFormField>

                <UFormField label="Колл-во" name="count">
                  <UInput v-model.number="messangerUpdateForm.count"
                          type="number"
                          min="0"/>
                </UFormField>

                <UFormField label="Тип" name="geo">
                  <USelect
                      v-model="messangerUpdateForm.type"
                      :items="messangerTypes"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Выбери тип"
                  />
                </UFormField>

                <UButton type="submit"
                         variant="ghost"
                         size="lg"
                         class="rounded-xl px-6">
                  Сохранить
                </UButton>
                <UButton type="button"
                         variant="ghost"
                         size="lg"
                         @click="showUpdateMessangerForm = false"
                         color="error"
                         class="rounded-xl px-6">
                  Отмена
                </UButton>
              </div>


            </UForm>
          </UCard>

          <UCard class="rounded-2xl shadow-sm mt-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium">История внесений</h3>
            </div>
            <UTable
                :data="messangers"
                :columns="messangerColumns"
            />
          </UCard>

          <UPagination
              class="flex justify-center mt-4"
              size="xl"
              v-model:page="messengersParams.page"
              :items-per-page="messengersParams.limit"
              :total="messengersCount"/>

        </template>

        <template #analytics>
          <UCard>
            <div class="grid grid-cols-2 gap-4">
              <div class="grid grid-cols-3">
                <div class="grid grid-cols-2 w-200">
                  <div class="items-center grid grid-cols-2 w-80">
                    <!--                      <p>Кол-во лайва:</p>-->
                    <!--                      <p>{{ totalLeaveByAgentId?.totalLeads ?? 0 }}</p>-->
                    <!--                      <p>Кол-во вц:</p>-->
                    <!--                      <p>{{ totalMessangerByAgentId?.totalMessanger ?? 0 }}</p>-->
                    <!--                      <p>Кол-во звонков:</p>-->
                    <!--                      <p>{{ calls?.callAgregation?._count ?? 0 }}</p>-->
                    <!--                      <p>Сек в звонках:</p>-->
                    <!--                      <p>{{ calls?.callAgregation?._sum?.duration ?? 0 }}</p>-->
                    <!--                      <p>Время на линии:</p>-->
                    <!--                      <p>{{ totalDuration }}</p>-->
                  </div>
                  <div class="items-center grid grid-cols-2 w-80">
                    <!--                      <p>Расход по лайву:</p>-->
                    <!--                      <p>{{ expensesByLive }}</p>-->
                    <!--                      <p>Расход по вц:</p>-->
                    <!--                      <p>{{ expensesByMessanger }}</p>-->
                    <!--                      <p>Расход по тел-и:</p>-->
                    <!--                      <p>{{ expensesByVoip }}</p>-->
                    <!--                      <p>Общий расход:</p>-->
                    <!--                      <p>{{ totalExpenses }}</p>-->
                  </div>
                  <div class="mt-20 grid grid-cols-3 w-80">
                  </div>
                </div>
              </div>
              <div class="flex flex-col justify-end">
                <UFileUpload v-model="file" label="Загрузить файл" class="w-100 self-end"/>
                <UButton @click="uploadCalls" class="w-30 self-end mt-4">
                  Отправить выгрузку
                </UButton>
              </div>
            </div>
          </UCard>
        </template>
      </UTabs>
    </div>
  </UCard>
</template>

<style scoped>

</style>
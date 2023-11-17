<template>
  <q-page class="q-pa-md q-gutter-y-lg">
    <div class="row justify-center">
      <q-img src="/images/framework_overview.svg" fit="cover" height="300px" class="mood-img">
        <span class="absolute-bottom-right text-h6 text-grey-4 q-pr-sm">
          v{{ version }}
        </span>
      </q-img>
    </div>

    <div class="text-center">
      <p v-t="{ path: 'greeting', args: { productName } }" class="text-h4" />
      <p>{{ t('appDescription') }}</p>
    </div>

    <div class="row justify-center q-col-gutter-md">
      <div class="col-lg-4 col-sm-6 col-12">
        <q-card class="fit text-center cursor-pointer q-hoverable" @click="routeTo('organisations')">
          <span class="q-focus-helper" />
          <q-card-section class="row justify-center items-center">
            <q-icon name="build" size="md" />
            <div class="q-ml-sm text-h6">
              {{ t('home_.createModels.header') }}
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            {{ t('home_.createModels.content') }}
          </q-card-section>
        </q-card>
      </div>

      <div class="col-lg-4 col-sm-6 col-12">
        <q-card v-ripple class="fit text-center cursor-pointer q-hoverable" @click="routeTo('queryBuilder')">
          <span class="q-focus-helper" />
          <q-card-section class="row justify-center items-center">
            <q-icon name="person_search" size="lg" />
            <div class="q-ml-sm text-h6">
              {{ t('home_.runQuery.header') }}
            </div>
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            {{ t('home_.runQuery.content') }}
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="text-center">
      <q-card-section class="q-pb-none">
        <div class="text-h6">
          {{ t('home_.content.header') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pb-lg">
        <div class="row">
          <div class="col-sm-3 col-6">
            <q-avatar icon="groups" size="8rem" />
            <div class="text-h6">
              {{ t('organisation', 2) }}
              <q-badge v-if="statistic" :label="statistic.organisations" />
            </div>
          </div>
          <div class="col-sm-3 col-6">
            <q-avatar icon="tab" size="8rem" />
            <div class="text-h6">
              {{ t('repository', 2) }}
              <q-badge v-if="statistic" :label="statistic.repositories" />
            </div>
          </div>
          <div class="col-sm-3 col-6">
            <q-avatar icon="category" size="8rem" />
            <div class="text-h6">
              {{ t('phenotype', 2) }}
              <q-badge v-if="statistic" :label="statistic.phenotypes" />
            </div>
          </div>
          <div class="col-sm-3 col-6">
            <q-avatar icon="article" size="8rem" />
            <div class="text-h6">
              {{ t('document', 2) }}
              <q-badge v-if="statistic" :label="statistic.documents" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { Statistic } from '@onto-med/top-api'
import { DefaultApiKey } from 'src/boot/axios'
import { inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import packageInfo from '../../package.json'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const defaultApi = inject(DefaultApiKey)
const statistic = ref(undefined as Statistic|undefined)
const productName = packageInfo.productName
const version = packageInfo.version

onMounted(() => defaultApi?.getStatistics().then(r => statistic.value = r.data))

function routeTo(name: string) {
  void router.push({ name })
}
</script>

<style lang="sass" scope>
.mood-img
  max-width: 1900px
  align-self: center
</style>

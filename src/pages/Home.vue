<template>
  <q-page class="q-pa-md q-gutter-y-lg">
    <div class="row justify-center">
      <q-img src="/images/framework_overview.svg" fit="cover" height="300px" class="mood-img" />
    </div>

    <div class="text-center">
      <p class="text-h4">{{ t('greeting', { productName }) }}</p>
      <p>{{ t('appDescription') }}</p>
    </div>

    <div class="row justify-center q-col-gutter-md">
      <div class="col-lg-4 col-sm-6 col-12">
        <q-card
          class="fit text-center cursor-pointer q-hoverable"
          @click="routeTo('organisations')"
        >
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
        <q-card
          v-ripple
          class="fit text-center cursor-pointer q-hoverable"
          @click="routeTo('queryBuilder')"
        >
          <span class="q-focus-helper" />
          <q-card-section class="row justify-center items-center">
            <q-icon name="manage_search" size="lg" />
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
          <div
            v-for="entry in overviewContent"
            :key="entry.key"
            class="col-6"
            :class="{ 'col-sm-4': !env.DOCUMENTS_ENABLED, 'col-sm-3': env.DOCUMENTS_ENABLED }"
          >
            <q-avatar :icon="entry.icon" size="8rem" />
            <div class="text-h6">
              {{ entry.label }}
              <q-badge v-if="statistic" :label="formatCountLabel(entry.key)" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import {DocumentCounts, Statistic} from '@onto-med/top-api'
import { DefaultApiKey } from 'src/boot/axios'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import packageInfo from '../../package.json'
import { useRouter } from 'vue-router'
import { env } from 'src/config'
import useNotify from 'src/mixins/useNotify'

const { t } = useI18n()
const router = useRouter()
const { renderError } = useNotify()
const defaultApi = inject(DefaultApiKey)
const statistic = ref<Statistic>()
const productName = packageInfo.productName

type statisticKey = keyof Statistic

const overviewContent = computed(() => {
  const entries = [
    { key: 'organisations', label: t('organisation', 2), icon: 'groups' },
    { key: 'repositories', label: t('repository', 2), icon: 'tab' },
    { key: 'phenotypes', label: t('phenotype', 2), icon: 'category' },
  ]
  if (env.DOCUMENTS_ENABLED)
    entries.push({ key: 'documents', label: t('document', 2), icon: 'article' })
  return entries
})

onMounted(() => {
  defaultApi
    ?.getStatistics()
    .then((r) => (statistic.value = r.data))
    .catch(() => renderError({ message: t('errorLoadingData') } as Error))
})

function formatCountLabel(key: string): string {
  if (statistic.value === undefined) return "0"
  const countLabel = statistic.value[key as statisticKey]
  if (countLabel === undefined) return "0"
  if (key === 'documents') {
    return (countLabel as DocumentCounts).graphDB + "/" + (countLabel as DocumentCounts).documentServer
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return countLabel.toString()
}

function routeTo(name: string) {
  void router.push({ name })
}
</script>

<style lang="scss" scoped>
.mood-img {
  max-width: 1900px;
  align-self: center;
}
</style>

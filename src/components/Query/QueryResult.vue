<template>
  <q-card>
    <q-expansion-item :model-value="expanded && !running" expand-icon-toggle switch-toggle-side>
      <template #header>
        <q-item-section avatar>
          <q-spinner v-show="running" :title="t('running')" class="q-mr-sm" />
          <q-icon v-show="done" :title="t('finished')" name="done" color="positive" class="q-mr-sm" />
          <q-icon v-show="failed" :title="t('failed')" name="bolt" color="negative" class="q-mr-sm" />
        </q-item-section>

        <q-item-section>
          {{ title || t('unnamedQuery') }}
        </q-item-section>

        <q-item-section side>
          <div class="row items-center">
            <small class="col-auto text-grey" :title="t('elapsedTime')">
              {{ elapsedTime }}
            </small>
            <q-btn-group flat class="q-ml-sm">
              <q-btn
                icon="file_upload"
                :title="t('loadThing', { thing: t('query') })"
                @click.stop="$emit('prefill')"
              />
              <q-btn
                icon="clear"
                :title="t('removeThing', { thing: t('queryResult') })"
                @click.stop="$emit('remove')"
              />
            </q-btn-group>
          </div>
        </q-item-section>
      </template>

      <q-separator />

      <q-card>
        <q-card-section v-if="result && !running">
          <div v-if="done">
            <p>
              {{ t('dataSetCount', { count: result.count }) }}
            </p>
            <q-btn
              v-if="done"
              no-caps
              icon="save"
              color="primary"
              :label="t('downloadDataSet')"
              @click="download"
            />
          </div>
          <div v-else>
            <p>{{ t('queryFailedDescription') }}</p>
            <pre>{{ result.message }}</pre>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-card>
</template>

<script lang="ts">
import { Query, QueryResult, QueryState } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import { exportFile } from 'quasar'
import { QueryApiKey } from 'src/boot/axios'
import { useEntity } from 'src/pinia/entity'
import { computed, defineComponent, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    query: Object as () => Query,
    result: Object as () => QueryResult,
    showTimer: {
      type: Boolean,
      default: false
    },
    title: {
      type: String
    }
  },
  emits: ['remove', 'prefill'],
  setup(props) {
    const { t } = useI18n()
    const queryApi = inject(QueryApiKey)
    const timer = ref(undefined as undefined|number)
    const elapsedTime = ref(undefined as undefined|string)
    const running = computed(() => !props.result?.finishedAt)
    const { organisationId, repositoryId } = storeToRefs(useEntity())

    const setElapsedTime = (result: QueryResult) => {
      const finishedAt = result.finishedAt
        ? new Date(result.finishedAt).getTime()
        : new Date().getTime()
      elapsedTime.value = new Date(finishedAt - new Date(result.createdAt).getTime())
        .toISOString().slice(11, 19)
    }

    onMounted(() => {
      if (!props.showTimer) return
      timer.value = window.setInterval(() => {
        if (!props.result?.createdAt) return
        setElapsedTime(props.result)
      }, 10)
    })

    watch(
      () => props.result,
      (newVal) => {
        if (!newVal?.finishedAt) return
        clearInterval(timer.value)
        setElapsedTime(newVal)
      }
    )

    return {
      t,
      elapsedTime,
      running,
      expanded: !props.result?.finishedAt,
      done: computed(() => !running.value && props.result?.state === QueryState.Finished),
      failed: computed(() => !running.value && props.result?.state === QueryState.Failed),

      async download () {
        if (!queryApi || !props.result || !organisationId.value || !repositoryId.value) return
        const queryId = props.result.id
        await queryApi.downloadQueryResult(organisationId.value, repositoryId.value, queryId, { responseType: 'blob' })
          .then(r => exportFile(queryId + '.zip', r.data as Blob))
      }
    }
  }
})
</script>

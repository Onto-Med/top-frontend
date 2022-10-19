<template>
  <q-card>
    <q-expansion-item expand-icon-toggle switch-toggle-side>
      <template #header>
        <q-item-section avatar>
          <q-spinner v-show="running" :title="t('running')" class="q-mr-sm" />
          <q-icon v-show="done" name="done" color="positive" class="q-mr-sm" />
          <q-icon v-show="failed" name="bolt" color="negative" class="q-mr-sm" />
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
        <q-card-section>
          <pre v-show="!running" class="q-ma-none">{{ result }}</pre>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-card>
</template>

<script lang="ts">
import { Query, QueryResult, QueryState } from '@onto-med/top-api'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
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
    const timer = ref(undefined as undefined|number)
    const elapsedTime = ref(undefined as undefined|string)
    const running = computed(() => !props.result?.finishedAt)

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
      done: computed(() => !running.value && props.result?.state === QueryState.Finished),
      failed: computed(() => !running.value && props.result?.state === QueryState.Failed)
    }
  }
})
</script>

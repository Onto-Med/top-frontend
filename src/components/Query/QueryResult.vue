<template>
  <q-card>
    <q-card-section>
      <div class="row items-center no-wrap">
        <div class="text-h6 col row items-center">
          <q-spinner v-show="running" :title="t('running')" class="q-mr-sm" />
          <q-icon v-show="done" name="done" color="positive" class="q-mr-sm" />
          <q-icon v-show="failed" name="bolt" color="negative" class="q-mr-sm" />
          {{ title || t('unnamedQuery') }}
        </div>
        <small class="col-auto text-grey" :title="t('elapsedTime')">
          {{ elapsedTime }}
        </small>
        <q-btn-group flat class="q-ml-sm">
          <q-btn
            icon="file_upload"
            :title="t('loadThing', { thing: t('query') })"
            @click="$emit('prefill')"
          />
          <q-btn
            icon="clear"
            :title="t('removeThing', { thing: t('queryResult') })"
            @click="$emit('remove')"
          />
        </q-btn-group>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <pre v-show="!running">{{ result }}</pre>
      </transition>
    </q-card-section>
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

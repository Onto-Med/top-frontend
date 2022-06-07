<template>
  <q-card>
    <q-card-section>
      <div class="row items-center no-wrap">
        <div class="text-h6 col">
          {{ label || t('queryResult') }}: {{ title || t('unnamedQuery') }}
        </div>
        <small class="col-auto text-grey" :title="t('elapsedTime')">
          {{ elapsedTime }}
        </small>
        <q-btn
          flat
          round
          icon="clear"
          :title="t('removeThing', { thing: t('queryResult') })"
          @click="$emit('removeClicked')"
        />
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div v-show="result">
          {{ result }}
        </div>
      </transition>
    </q-card-section>
    <q-inner-loading :showing="running" :label="t('thingIsRunning', { thing: t('query') }) + '...'" />
  </q-card>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    result: {
      type: Object
    },
    running: {
      type: Boolean,
      default: false
    },
    showTimer: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date,
      default: () => new Date()
    },
    label: {
      type: String
    },
    title: {
      type: String
    }
  },
  emits: ['removeClicked'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const timer = ref(undefined as undefined|number)
    const elapsedTime = ref(undefined as undefined|string)

    onMounted(() => {
      if (!props.showTimer) return
      timer.value = window.setInterval(() => {
        if (!props.startTime) return
        elapsedTime.value = new Date(new Date().getTime() - props.startTime.getTime())
          .toISOString().slice(11, 19)
      }, 10)
    })

    watch(
      () => props.running,
      (newVal) => {
        if (newVal) return
        clearInterval(timer.value)
      }
    )

    return {
      t,
      elapsedTime
    }
  }
})
</script>
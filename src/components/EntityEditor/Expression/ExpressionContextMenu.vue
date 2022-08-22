<template>
  <q-menu>
    <q-list dense class="scroll" :class="{ 'row': grid }">
      <q-item
        v-for="fun in functions"
        :key="fun.id"
        v-close-popup
        clickable
        :class="{ 'col-6': grid }"
        @click="$emit('select', fun.id)"
      >
        <q-item-section>{{ te(fun.title) ? t(fun.title) : fun.title }}</q-item-section>
      </q-item>
    </q-list>
    <q-separator />
    <q-list dense>
      <q-item v-if="enclosable" v-close-popup clickable @click="$emit('enclose')">
        <q-item-section v-t="'encloseWithExpression'" />
      </q-item>
      <q-item
        v-if="removable"
        v-close-popup
        clickable
        @click="$emit('remove', undefined)"
      >
        <q-item-section v-t="'remove'" />
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExpressionFunction } from '@onto-med/top-api'

export default defineComponent({
  name: 'ExpressionContextMenu',
  props: {
    enclosable: {
      type: Boolean,
      default: true
    },
    removable: {
      type: Boolean,
      default: true
    },
    functions: {
      type: Array as () => ExpressionFunction[],
      required: true
    }
  },
  emits: ['enclose', 'remove', 'select'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n()

    return {
      t,
      te,
      grid: computed(() => props.functions.length > 5)
    };
  },
})
</script>

<style lang="sass" scoped>
.scroll
  max-height: 300px
.q-list.row
  max-width: 300px
</style>

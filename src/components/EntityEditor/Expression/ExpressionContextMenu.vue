<template>
  <q-menu>
    <q-list dense>
      <q-item
        v-for="fun in functions"
        :key="fun.id"
        v-close-popup
        clickable
        @click="$emit('select', fun.id)"
      >
        <q-item-section>{{ te(fun.title) ? t(fun.title) : fun.title }}</q-item-section>
      </q-item>
      <q-separator />
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
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExpressionFunction } from '@onto-med/top-api';

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
  setup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n();

    return { t, te };
  },
});
</script>

<template>
  <q-menu>
    <div class="scroll">
      <q-item dense>
        <q-select
          v-model="filter"
          :options="functionTypes"
          :label="t('filter')"
          clearable
          dense
          emit-value
          use-chips
          multiple
          class="col"
        />
      </q-item>
      <q-separator spaced />
      <q-item v-for="functionType in filteredFunctionTypes" :key="functionType.value" dense>
        <q-item-section>
          <q-item-label class="text-bold">
            {{ functionType.label }}
          </q-item-label>
          <q-separator />
          <q-list dense class="row">
            <q-item
              v-for="fun in functionGroups?.get(functionType.value)"
              :key="fun.id"
              v-close-popup
              clickable
              class="col-4"
              @click="$emit('select', fun)"
            >
              <q-item-section :title="te('functionDescriptions.' + fun.id) ? t('functionDescriptions.' + fun.id) : undefined">
                {{ te('functions.' + fun.id) ? t('functions.' + fun.id) : fun.title }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-item-section>
      </q-item>
    </div>
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
import { ExpressionFunction } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
  },
  emits: ['enclose', 'remove', 'select'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n()
    const entityStore = useEntity()
    const { renderError } = useNotify()
    const { functions } = storeToRefs(entityStore)
    const filter = ref<string[]|undefined>(undefined)
    const functionTypes = computed(() => {
      return functions.value?.map(f => f.type)
        .filter((t, index, self) => self.indexOf(t) === index)
        .map(type => {
          const x = type || 'none'
          return {
            label: te('functionType.' + x) ? t('functionType.' + x) : x,
            value: x
          }
        })
    })

    onMounted(() => {
      if (!functions.value)
        entityStore.reloadFunctions()
          .catch((e: Error) => renderError(e))
    })

    return {
      t,
      te,
      filter,
      functionTypes,

      filteredFunctionTypes: computed(() =>
        (!filter.value || filter.value.length === 0)
          ? functionTypes.value
          : functionTypes.value?.filter(t => filter.value?.includes(t.value))
      ),

      functionGroups: computed(() => {
        return functions.value?.reduce((map, f) => {
          const t = f.type || 'none'
          var entry = map.get(t)
          if (entry) entry.push(f)
          else map.set(t, [ f ])
          return map
        }, new Map() as Map<string, ExpressionFunction[]>) || new Map()
      })
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

<template>
  <q-menu ref="menu" anchor="top left" self="bottom left" @hide="onHide">
    <div v-if="changing || !value" class="scroll">
      <q-item dense>
        <q-select
          v-model="filter"
          :options="functionTypes"
          :label="t('filter')"
          clearable
          dense
          emit-value
          map-options
          class="col"
        />
      </q-item>
      <q-separator spaced />
      <q-item v-for="functionType in filteredFunctionTypes" :key="functionType.value" dense>
        <q-item-section>
          <q-item-label class="text-bold">
            {{ functionType.label }}
            <q-btn
              v-if="baseDocUrl && !noDocFunctionTypes.includes(functionType.value)"
              dense
              flat
              round
              class="col-auto text-grey"
              size="xs"
              icon="info"
              target="_blank"
              :href="toPackageDocUrl(functionType.value)"
              :title="t('showThing', { thing: t('documentation') })"
              @click.stop
            />
          </q-item-label>
          <q-separator />
          <q-list dense class="row">
            <q-item
              v-for="fun in functionGroups?.get(functionType.value)"
              :key="fun.id"
              clickable
              class="col-4 q-pa-none"
              @click="onSelect(fun)"
            >
              <q-item-section
                v-if="baseDocUrl && !noDocFunctionTypes.includes(fun.type)"
                :title="t('rightClickShowDoc')"
                @click.right="showFunctionDoc(fun)"
              >
                {{ te('functions.' + fun.id) ? t('functions.' + fun.id) : fun.title }}
              </q-item-section>
              <q-item-section v-else>
                {{ te('functions.' + fun.id) ? t('functions.' + fun.id) : fun.title }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-item-section>
      </q-item>
    </div>
    <q-separator />
    <q-list dense>
      <q-item v-if="value" clickable target="_blank" :href="toFunctionDocUrl(value)">
        <q-item-section>
          {{ t('showThing', { thing: t('documentation') }) }}
        </q-item-section>
      </q-item>
      <q-separator v-if="value" />
      <q-item v-if="enclosable" clickable @click="onEnclose">
        <q-item-section>{{ t('encloseWithExpression') }}</q-item-section>
      </q-item>
      <q-item v-if="value && !changing" clickable @click="showChangeOptions()">
        <q-item-section>{{ t('change') }}</q-item-section>
      </q-item>
      <q-item v-if="removable" clickable @click="onRemove">
        <q-item-section>{{ t('remove') }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import { ExpressionFunction } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import { QMenu } from 'quasar'
import { env, noDocFunctionTypes } from 'src/config'
import useNotify from 'src/mixins/useNotify'
import { useEntityStore } from 'src/stores/entity-store'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  value: Object as () => ExpressionFunction,
  enclosable: {
    type: Boolean,
    default: true,
  },
  removable: {
    type: Boolean,
    default: true,
  },
  includeFunctionTypes: Array as () => string[],
  excludeFunctionTypes: Array as () => string[],
  excludeFunctions: Array as () => string[],
})
const emit = defineEmits(['enclose', 'remove', 'select'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const entityStore = useEntityStore()
const { renderError } = useNotify()
const { functions } = storeToRefs(entityStore)
const menu = ref<QMenu>()
const filter = ref<string[] | undefined>(undefined)
const functionTypes = computed(() => {
  return functions.value
    ?.map((f) => f.type)
    .filter((t, index, self) => self.indexOf(t) === index)
    .filter((t) => !props.includeFunctionTypes || (!!t && props.includeFunctionTypes.includes(t)))
    .filter((t) => !props.excludeFunctionTypes || (!!t && !props.excludeFunctionTypes.includes(t)))
    .map((type) => {
      const x = type || 'none'
      return {
        label: te('functionType.' + x) ? t('functionType.' + x) : x,
        value: x,
      }
    })
})

onMounted(() => {
  if (!functions.value) entityStore.reloadFunctions().catch((e: Error) => renderError(e))
})

const filteredFunctionTypes = computed(() =>
  !filter.value || filter.value.length === 0
    ? functionTypes.value
    : functionTypes.value?.filter((t) => filter.value?.includes(t.value)),
)

const functionGroups = computed(
  () =>
    functions.value
      ?.filter((f) => !props.excludeFunctions || (!!f && !props.excludeFunctions.includes(f.id)))
      .reduce(
        (map, f) => {
          const t = f.type || 'none'
          const entry = map.get(t)
          if (entry) entry.push(f)
          else map.set(t, [f])
          return map
        },
        new Map() as Map<string, ExpressionFunction[]>,
      ) || new Map(),
)

const changing = ref(false)

const baseDocUrl = computed(() => {
  const baseUrl = env.TOP_PHENOTYPIC_QUERY_DOC_BASE_URL
  return !baseUrl ? undefined : `${baseUrl}/functions`
})

function toPackageDocUrl(name: string) {
  return !baseDocUrl.value || noDocFunctionTypes.includes(name)
    ? undefined
    : `${baseDocUrl.value}/${name}/package-summary.html`
}

function toFunctionDocUrl(fun: ExpressionFunction) {
  return !baseDocUrl.value || !fun.type || noDocFunctionTypes.includes(fun.type)
    ? undefined
    : `${baseDocUrl.value}/${fun.type || ''}/${fun.id}.html`
}

function showChangeOptions() {
  changing.value = true
  void nextTick(() => menu.value?.updatePosition())
}

function showFunctionDoc(fun: ExpressionFunction) {
  if (baseDocUrl.value && fun.type && !noDocFunctionTypes.includes(fun.type))
    window.open(toFunctionDocUrl(fun), '_blank')
}

function onEnclose() {
  emit('enclose')
  void nextTick(() => menu.value?.updatePosition())
}

function onHide() {
  if (props.value) changing.value = false
}

function onRemove() {
  menu.value?.hide()
  emit('remove')
}

function onSelect(fun: ExpressionFunction) {
  menu.value?.hide()
  emit('select', fun)
}
</script>

<style lang="scss" scoped>
.scroll {
  max-height: 300px;
}
.q-list.row {
  max-width: 300px;
}
</style>

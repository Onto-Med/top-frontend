<template>
  <q-page v-if="organisation && repository" class="q-pa-md q-gutter-md">
    <h5 class="row">
      <b>{{ t('buildQueryFor') }}:</b>
      <q-breadcrumbs class="q-ml-sm">
        <q-breadcrumbs-el :label="organisation.name" :to="{ name: 'showOrganisation', params: { organisationId: organisation.id } }" />
        <q-breadcrumbs-el :label="repository.name" :to="{ name: 'editor', params: { organisationId: organisation.id, repositoryId: repository.id } }" />
      </q-breadcrumbs>
    </h5>

    <q-stepper
      ref="stepper"
      v-model="step"
      color="primary"
      done-color="positive"
      animated
      header-nav
      keep-alive
    >
      <q-step
        :name="1"
        icon="settings"
        :title="t('configureThing', { thing: t('source', 2) })"
        :done="step > 1"
      >
        Select data source and other configurations...
      </q-step>

      <q-step
        :name="2"
        icon="rule"
        :title="t('selectThing', { thing: t('phenotype', 2) })"
        :done="step > 2"
        class="phenotype-step"
      >
        <q-splitter v-model="splitterModel" style="height: 50vh">
          <template #before>
            <div class="column fit">
              <entity-tree
                :nodes="entities"
                :loading="treeLoading"
                class="col column"
                @refresh-clicked="reloadEntities"
                @update:selected="addCriterion"
              />
            </div>
          </template>

          <template #after>
            <q-card class="q-ma-lg">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-h6">
                    {{ t('eligibilityCriterion', 2) }}
                  </q-item-label>
                  <q-item-label v-t="'eligibilityCriterionSelection'" caption />
                </q-item-section>
              </q-item>

              <q-separator />

              <q-card-section>
                <div v-show="!query.criteria.length">
                  {{ t('nothingSelectedYet') }}
                </div>
                <q-list v-show="query.criteria.length" dense separator>
                  <q-item v-for="(criterion, index) in query.criteria" :key="index">
                    <q-item-section avatar>
                      <q-toggle v-model="criterion.exclusion" :icon="criterion.exclusion ? 'block' : 'check'" color="red" :title="criterion.exclusion ? t('exclusion') : t('inclusion')" />
                    </q-item-section>
                    <q-item-section :title="getSynonyms(criterion.subject)">
                      <div class="row items-center fit">
                        <q-icon size="1.3rem" class="q-mr-sm" :class="{ restriction: isRestricted(criterion.subject) }" :name="getIcon(criterion.subject)" />
                        {{ getTitle(criterion.subject) }}
                      </div>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn-group flat>
                        <!-- <q-btn icon="settings" :title="t('setting', 2)" /> -->
                        <q-btn icon="remove" :title="t('removeThing', { thing: t('criterion') })" @click="query.criteria.splice(index, 1)" />
                      </q-btn-group>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </template>
        </q-splitter>
      </q-step>

      <q-step
        :name="3"
        icon="checklist"
        :title="t('defineThing', { thing: t('resultSet') })"
        :done="step > 3"
        class="projection-step"
      >
        <q-splitter v-model="splitterModel" style="height: 50vh">
          <template #before>
            <div class="column fit">
              <entity-tree
                :nodes="projectionEntities"
                :loading="treeLoading"
                class="col column"
                @refresh-clicked="reloadEntities"
                @update:selected="addSelection"
              />
            </div>
          </template>

          <template #after>
            <q-card class="q-ma-lg">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-h6">
                    {{ t('projection') }}
                  </q-item-label>
                  <q-item-label v-t="'projectionSelection'" caption />
                </q-item-section>
              </q-item>

              <q-separator />

              <q-card-section>
                <q-list v-if="query.projection && query.projection.requestedData.length" dense separator>
                  <q-item v-for="(requestedData, index) in query.projection.requestedData" :key="index">
                    <q-item-section avatar>
                      <q-btn-group flat class="column">
                        <q-btn :disable="index == 0" icon="keyboard_arrow_up" size="sm" @click="moveRequestedData(index, index - 1)" />
                        <q-btn :disable="index == query.projection.requestedData.length - 1" icon="keyboard_arrow_down" size="sm" @click="moveRequestedData(index, index + 1)" />
                      </q-btn-group>
                    </q-item-section>
                    <q-item-section :title="getSynonyms(requestedData.subject)">
                      <div class="row items-center fit">
                        <q-icon size="1.3rem" class="q-mr-sm" :name="getIcon(requestedData.subject)" />
                        {{ getTitle(requestedData.subject) }}
                      </div>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn-group flat>
                        <q-btn
                          :icon="requestedData.sort === Sort.DESC ? 'arrow_downward' : 'arrow_upward'"
                          :label="t(requestedData.sort)"
                          :title="t('sorting')"
                          @click="requestedData.sort = requestedData.sort === Sort.ASC ? Sort.DESC : Sort.ASC"
                        />
                        <q-btn icon="remove" :title="t('removeThing', { thing: t('selection') })" @click="query.projection.requestedData.splice(index, 1)" />
                      </q-btn-group>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else>
                  {{ t('nothingSelectedYet') }}
                </div>
              </q-card-section>
            </q-card>
          </template>
        </q-splitter>
      </q-step>

      <template #navigation>
        <q-separator class="q-mb-md" />
        <q-stepper-navigation>
          <q-btn color="primary" :label="step === 3 ? t('execute') : t('continue')" @click="$refs.stepper.next()" />
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            :label="t('back')"
            class="q-ml-sm"
            @click="$refs.stepper.previous()"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>

    <q-card v-if="result">
      ...
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { EntityType, Phenotype } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import { defineComponent, onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Query {
  criteria: QueryCriterion[]
  projection?: Projection
}

interface QueryCriterion {
  exclusion: boolean,
  subject: Phenotype
}

interface Projection {
  requestedData: RequestedData[]
}

interface RequestedData {
  subject: Phenotype,
  sort: Sort
}

enum Sort {
  ASC = 'asc',
  DESC = 'desc'
}

export default defineComponent({
  components: { EntityTree },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { getTitle, getSynonyms, getIcon, isPhenotype, isRestricted } = useEntityFormatter()
    const entityStore = useEntity()
    const { entities, repository, organisation } = storeToRefs(entityStore)
    const query = ref({ criteria: [] } as Query)
    const treeLoading = ref(false)

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities()
        .then(() => query.value.criteria = query.value.criteria.filter(c => entities.value.findIndex(e => e.id === c.subject.id) !== -1))
        .catch((e: Error) => alert(e.message))
        .finally(() => treeLoading.value = false)
    }

    onMounted(() => reloadEntities())

    return {
      t,
      getTitle,
      getSynonyms,
      getIcon,
      isRestricted,
      step: ref(1),
      query,
      organisation,
      repository,
      entities,
      result: ref(undefined),
      splitterModel: ref(25),
      reloadEntities,
      treeLoading,
      Sort,

      projectionEntities: computed(() => entities.value.filter(e => [EntityType.Category, EntityType.SinglePhenotype].includes(e.entityType))),

      addCriterion: (subject: Phenotype) => {
        if (!subject || (!isPhenotype(subject) && !isRestricted(subject))) return
        query.value.criteria.push({ exclusion: false, subject: subject })
      },

      addSelection: (subject: Phenotype) => {
        if (!query.value.projection) query.value.projection = { requestedData: [] }
        if (
          !subject
          || EntityType.SinglePhenotype !== subject.entityType
          || query.value.projection.requestedData.findIndex(r => r.subject.id === subject.id) !== -1
        ) return
        query.value.projection.requestedData.push({ subject: subject, sort: Sort.ASC })
      },

      moveRequestedData: (oldIndex: number, newIndex: number) => {
        if (!query.value.projection || newIndex < 0 || newIndex >= query.value.projection.requestedData.length) return
        query.value.projection.requestedData.splice(newIndex, 0, query.value.projection.requestedData.splice(oldIndex, 1)[0])
      },
    }
  }
})
</script>

<style lang="sass">
.phenotype-step, .projection-step
  min-height: 200px
  .q-stepper__step-inner
    padding: 0 !important
</style>
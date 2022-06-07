<template>
  <q-page class="q-pa-md q-gutter-md">
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
      animated
      header-nav
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
      >
        <q-card>
          <q-card-section>
            <q-list dense>
              <q-item v-for="(Criterion, index) in criteria" :key="index">
                <q-item-section avatar>
                  <q-toggle v-model="Criterion.exclusion" icon="block" color="red" />
                </q-item-section>
                <q-item-section>
                  {{ getTitle(Criterion.phenotype) }}
                </q-item-section>
                <q-item-section side>
                  <q-btn-group flat>
                    <q-btn icon="settings" :title="t('setting', 2)" />
                    <q-btn icon="remove" :title="t('removeThing', { thing: t('criterion') })" @click="criteria.splice(index, 1)" />
                  </q-btn-group>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <entity-search-input
              dense
              :entity-types="entityTypes"
              :organisation-id="organisation.id"
              :repository-id="repository.id"
              @entity-selected="criteria.push({ exclusion: false, phenotype: $event })"
            />
          </q-card-actions>
        </q-card>

        <ul>
          <li>List of phenotypes</li>
          <li>Option to add more phenotypes</li>
          <li>Time ranges</li>
          <li>Exclusions</li>
        </ul>
      </q-step>

      <q-step
        :name="3"
        icon="checklist"
        :title="t('defineThing', { thing: t('resultSet') })"
        :done="step > 3"
      >
        <ul>
          <li>Projections</li>
          <li>Aggregations</li>
        </ul>
      </q-step>

      <template #navigation>
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
import { Phenotype } from '@onto-med/top-api'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Criterion {
  exclusion: boolean,
  phenotype: Phenotype
}

export default defineComponent({
  components: { EntitySearchInput },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { getTitle } = useEntityFormatter()
    const entityStore = useEntity()
    const entityFormatter = useEntityFormatter()
    const criteria = ref([] as Criterion[])

    return {
      t,
      entityTypes: entityFormatter.phenotypeEntityTypes(),
      getTitle,
      step: ref(1),
      criteria,
      organisation: entityStore.organisation,
      repository: entityStore.repository,
      result: ref(undefined)
    }
  }
})
</script>

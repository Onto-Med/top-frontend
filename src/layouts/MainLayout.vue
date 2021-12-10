<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          TOP Framework
        </q-toolbar-title>

        <entity-search-input
          :label="t('searchThing', { thing: t('entity') }) + '...'"
          icon="search"
          clear-on-select
          dark
          class="q-mr-sm"
          @entitySelected="routeToEntity"
        />

        <language-switch />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import EssentialLink from 'components/EssentialLink.vue'
import LanguageSwitch from 'src/components/LanguageSwitch.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'

import { defineComponent, ref, computed } from 'vue'
import { Entity } from '@onto-med/top-api'

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink,
    LanguageSwitch,
    EntitySearchInput
  },

  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const router = useRouter()
    const leftDrawerOpen = ref(false)

    const linksList = computed(() => [
      {
        title: t('repository', 2),
        icon: 'folder',
        caption: t('developPhenotype', 2)
      },
      {
        title: t('organisation', 2),
        icon: 'groups',
        caption: t('collaborativeWork')
      }
    ])

    return {
      t,
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      routeToEntity (entity: Entity) {
        void router.push({ name: 'editor', params: { organisationName: 'example_organisation', repositoryName: 'example_repository', entityId: entity.id } })
      }
    }
  }
})
</script>

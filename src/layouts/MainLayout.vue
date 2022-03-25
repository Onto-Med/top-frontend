<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <q-header elevated class="bg-white text-grey-8 q-py-xs" height-hint="58">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-icon name="hub" class="q-ml-sm" color="primary" size="28px" />
        <q-toolbar-title shrink class="text-weight-bold">
          {{ productName }}
        </q-toolbar-title>

        <q-space />

        <div class="toolbar-input-container row no-wrap">
          <entity-search-input
            :label="t('searchThing', { thing: t('entity') }) + '...'"
            outlined
            dense
            square
            clear-on-select
            show-details
            class="q-mr-sm fit"
            @entity-selected="routeToEntity"
          >
            <template #append>
              <q-btn dense flat icon="search" :title="t('search')" />
            </template>
          </entity-search-input>
        </div>

        <q-space />

        <language-switch />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-2"
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label v-t="'navigation'" header />

          <NavbarLink
            v-for="link in links"
            :key="link.title"
            v-bind="link"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import NavbarLink from 'src/components/NavbarLink.vue'
import LanguageSwitch from 'src/components/LanguageSwitch.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import packageInfo from '../../package.json'
import { defineComponent, ref, computed } from 'vue'
import { Entity } from '@onto-med/top-api'

export default defineComponent({
  name: 'MainLayout',

  components: {
    NavbarLink,
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
        title: t('home'),
        icon: 'house'
      },
      {
        title: t('organisation', 2),
        icon: 'groups',
        caption: t('collaborativeWork'),
        routeName: 'organisations'
      },
      {
        title: t('repository', 2),
        icon: 'folder',
        caption: t('developPhenotype', 2),
        routeName: 'repositories'
      }
    ])

    return {
      t,
      productName: packageInfo.productName,
      links: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      routeToEntity (entity: Entity) {
        if (!entity.repository || !entity.repository.organisation) return
        void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.toolbar-input-container
  min-width: 100px
  width: 55%
</style>
<template>
  <q-layout view="hHh lpR fFf" :class="{ 'bg-grey-1': !isDarkModeActive }">
    <q-header elevated :class="{ 'bg-white text-grey-8': !isDarkModeActive, 'bg-dark text-grey-2': isDarkModeActive }" class="q-py-xs" height-hint="58">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-avatar>
          <img src="images/logo.svg">
        </q-avatar>
        <q-toolbar-title to="/" shrink class="text-weight-bold">
          <router-link class="brand-link" to="/">
            {{ productName }}
          </router-link>
        </q-toolbar-title>

        <q-space />

        <div class="toolbar-input-container row no-wrap">
          <entity-search-input
            :label="t('searchThing', { thing: t('entity') }) + '...'"
            :repository-id="repositoryId"
            outlined
            dense
            square
            clear-on-select
            show-details
            fork
            repository-filter
            class="q-mr-sm fit"
            @entity-selected="routeToEntity"
            @fork-clicked="forkEntity"
          >
            <template #append>
              <q-btn dense flat icon="search" :title="t('search')" />
            </template>
          </entity-search-input>
        </div>

        <q-space />

        <q-btn
          flat
          dense
          round
          :title="t('toggleDarkMode')"
          :icon="isDarkModeActive ? 'light_mode' : 'dark_mode'"
          class="q-mr-sm"
          @click="toggleDarkMode()"
        />

        <language-switch />
      </q-toolbar>
    </q-header>

    <q-drawer
      :mini="!leftDrawerOpen"
      show-if-above
      bordered
      :class="{ 'bg-grey-2': !isDarkModeActive }"
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <NavbarLink
            v-for="link in links"
            :key="link.title"
            v-bind="link"
          />

          <q-separator v-show="leftDrawerOpen" class="q-mt-md q-mb-lg" />

          <div v-show="leftDrawerOpen" class="q-px-md text-grey">
            <div class="row items-center q-gutter-x-sm q-gutter-y-xs">
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                :icon="fabGithub"
                :href="repositoryUrl"
                target="_blank"
                :label="t('sourceCode')"
              />
            </div>
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view :key="repositoryId" />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import NavbarLink from 'src/components/NavbarLink.vue'
import LanguageSwitch from 'src/components/LanguageSwitch.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import packageInfo from '../../package.json'
import { defineComponent, ref, computed } from 'vue'
import { Entity } from '@onto-med/top-api'
import { useQuasar } from 'quasar'
import { fabGithub } from '@quasar/extras/fontawesome-v5'
import useAlert from 'src/mixins/useAlert'

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
    const entityStore = useEntity()
    const leftDrawerOpen = ref(true)
    const $q = useQuasar()
    const { alert } = useAlert()

    const linksList = computed(() => [
      {
        title: t('home'),
        icon: 'house',
        routeName: 'home'
      },
      {
        title: t('organisation', 2),
        icon: 'groups',
        caption: t('collaborativeWork'),
        routeName: 'organisations'
      },
      {
        title: t('repository', 2),
        icon: 'tab',
        caption: t('developPhenotype', 2),
        routeName: 'repositories'
      }
    ])

    return {
      t,
      productName: packageInfo.productName,
      repositoryUrl: packageInfo.repository ? (packageInfo.repository as Record<string, unknown>).url as string : undefined,
      links: linksList,
      leftDrawerOpen,
      fabGithub,

      repositoryId: computed(() => {
        const route = router.currentRoute.value
        if (!route || route.name !== 'editor') return undefined
        return route.params.repositoryId
      }),

      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },

      routeToEntity (entity: Entity) {
        if (!entity.repository || !entity.repository.organisation) return
        void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
      },

      forkEntity (entity: Entity) {
        entityStore.forkEntity(entity)
          .then(() => alert(t('thingCreated', { thing: t('fork') }), 'positive'))
          .catch((e: Error) => alert(t(e.message)))
      },

      toggleDarkMode: $q.dark.toggle,

      isDarkModeActive: computed(() => $q.dark.isActive)
    }
  }
})
</script>

<style lang="sass" scoped>
.toolbar-input-container
  min-width: 100px
  width: 55%
.brand-link
  text-decoration: none
  color: inherit
</style>
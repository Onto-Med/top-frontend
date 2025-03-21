import { RouteRecordRaw } from 'vue-router'
import { env } from 'src/config'

const routes: RouteRecordRaw[] = [
  {
    name: 'root',
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'home',
        path: '/',
        component: () => import('pages/Home.vue'),
        meta: {
          allowAnonymous: true,
        },
      },
      {
        name: 'queryBuilder',
        path: '/query/:organisationId?/:repositoryId?/:queryId?',
        component: () => import('pages/QueryBuilder.vue'),
        props: ({ params, query }) => {
          return {
            organisationId: params.organisationId,
            repositoryId: params.repositoryId,
            queryId: params.queryId,
            dataSourceId: query.dataSourceId,
          }
        },
      },
      {
        name: 'editor',
        path: '/:organisationId/:repositoryId/:entityId?',
        props: (route) => {
          const version = Number.parseInt(route.query.version as string, 10)
          return { entityId: route.params.entityId, version: version }
        },
        component: () => import('pages/Editor.vue'),
        meta: {
          allowAnonymous: true,
        },
      },
      {
        name: 'organisations',
        path: '/organisation',
        component: () => import('pages/OrganisationOverview.vue'),
        meta: {
          allowAnonymous: true,
        },
      },
      {
        name: 'showOrganisation',
        path: '/:organisationId',
        component: () => import('pages/Organisation.vue'),
        meta: {
          allowAnonymous: true,
        },
      },
      {
        name: 'documentSearchByQuery',
        path: '/document/query/:organisationId/:repositoryId/:queryId',
        component: () => import('pages/DocumentSearch.vue'),
        meta: {
          disabled: !env.DOCUMENTS_ENABLED,
        },
        props: ({ params }) => {
          return {
            organisationId: params.organisationId,
            repositoryId: params.repositoryId,
            queryId: params.queryId,
          }
        },
      },
      {
        name: 'documentSearch',
        path: '/document',
        component: () => import('pages/DocumentSearch.vue'),
        meta: {
          disabled: !env.DOCUMENTS_ENABLED,
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
    meta: {
      allowAnonymous: true,
    },
  },
]

export default routes

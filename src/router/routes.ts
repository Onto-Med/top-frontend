import { RouteRecordRaw } from 'vue-router';

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
          allowAnonymous: true
        }
      },
      {
        name: 'queryBuilder',
        path: '/:organisationId/:repositoryId/query',
        component: () => import('pages/QueryBuilder.vue')
      },
      {
        name: 'editor',
        path: '/:organisationId/:repositoryId/:entityId?',
        props: route => {
          const version = Number.parseInt(route.query.version as string, 10)
          return { entityId: route.params.entityId, version: version }
        },
        component: () => import('pages/Editor.vue')
      },
      { name: 'organisations', path: '/organisation', component: () => import('pages/OrganisationOverview.vue') },
      { name: 'showOrganisation', path: '/:organisationId', component: () => import('pages/Organisation.vue') },
      { name: 'documentSearch', path: '/document', component: () => import('pages/DocumentSearch.vue') }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
    meta: {
      allowAnonymous: true
    }
  },
];

export default routes;

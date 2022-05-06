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
        name: 'editor',
        path: '/:organisationId/:repositoryId/editor/:entityId?',
        props: route => {
          const version = Number.parseInt(route.query.version as string, 10)
          return { entityId: route.params.entityId, version: version }
        },
        component: () => import('pages/Editor.vue')
      },
      { name: 'organisations', path: '/organisation', component: () => import('pages/OrganisationOverview.vue') },
      { name: 'repositories', path: '/repository', component: () => import('pages/RepositoryOverview.vue') },
      { name: 'showOrganisation', path: '/:organisationId', props: true, component: () => import('pages/Organisation.vue') }
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

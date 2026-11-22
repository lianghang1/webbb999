import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:landmark',
      order: 1,
      title: $t('cemetery.title'),
    },
    name: 'Cemetery',
    path: '/cemetery',
    children: [
      {
        name: 'CemeteryPlotMap',
        path: 'plot-map',
        component: () => import('#/views/cemetery/plot-map/index.vue'),
        meta: {
          icon: 'lucide:map',
          title: $t('cemetery.plotMap'),
        },
      },
      {
        name: 'CemeteryParkView',
        path: 'park-view',
        component: () => import('#/views/cemetery/park-view/index.vue'),
        meta: {
          icon: 'lucide:box',
          title: $t('cemetery.parkView'),
        },
      },
      {
        name: 'CemeteryParks',
        path: 'parks',
        component: () => import('#/views/cemetery/parks/index.vue'),
        meta: {
          icon: 'lucide:building-2',
          title: $t('cemetery.parks'),
        },
      },
      {
        name: 'CemeterySections',
        path: 'sections',
        component: () => import('#/views/cemetery/sections/index.vue'),
        meta: {
          icon: 'lucide:grid-3x3',
          title: $t('cemetery.sections'),
        },
      },
      {
        name: 'CemeteryPlotTypes',
        path: 'plot-types',
        component: () => import('#/views/cemetery/plot-types/index.vue'),
        meta: {
          icon: 'lucide:tags',
          title: $t('cemetery.plotTypes'),
        },
      },
      {
        name: 'CemeteryPrices',
        path: 'prices',
        component: () => import('#/views/cemetery/prices/index.vue'),
        meta: {
          icon: 'lucide:banknote',
          title: $t('cemetery.prices'),
        },
      },
      {
        name: 'CemeteryCustomers',
        path: 'customers',
        component: () => import('#/views/cemetery/customers/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('cemetery.customers'),
        },
      },
      {
        name: 'CemeterySales',
        path: 'sales',
        component: () => import('#/views/cemetery/sales/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('cemetery.sales'),
        },
      },
      {
        name: 'CemeteryDeceased',
        path: 'deceased',
        component: () => import('#/views/cemetery/deceased/index.vue'),
        meta: {
          icon: 'lucide:user-round',
          title: $t('cemetery.deceased'),
        },
      },
      {
        name: 'CemeteryBurials',
        path: 'burials',
        component: () => import('#/views/cemetery/burials/index.vue'),
        meta: {
          icon: 'lucide:flower-2',
          title: $t('cemetery.burials'),
        },
      },
    ],
  },
];

export default routes;

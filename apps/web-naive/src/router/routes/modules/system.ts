import type { RouteRecordRaw } from 'vue-router';

/** 系统管理模块：对齐后端 IAM/审计/字典/配置/文件接口 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 100,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemTenant',
        path: 'tenant',
        component: () => import('#/views/system/tenant/index.vue'),
        meta: { icon: 'lucide:building', title: '租户管理' },
      },
      {
        name: 'SystemPackage',
        path: 'package',
        component: () => import('#/views/system/package/index.vue'),
        meta: { icon: 'lucide:package', title: '套餐管理' },
      },
      {
        name: 'SystemUser',
        path: 'user',
        component: () => import('#/views/system/user/index.vue'),
        meta: { icon: 'lucide:users', title: '用户管理' },
      },
      {
        name: 'SystemDept',
        path: 'dept',
        component: () => import('#/views/system/dept/index.vue'),
        meta: { icon: 'lucide:network', title: '部门管理' },
      },
      {
        name: 'SystemRole',
        path: 'role',
        component: () => import('#/views/system/role/index.vue'),
        meta: { icon: 'lucide:shield', title: '角色管理' },
      },
      {
        name: 'SystemMenu',
        path: 'menu',
        component: () => import('#/views/system/menu/index.vue'),
        meta: { icon: 'lucide:menu', title: '菜单管理' },
      },
      {
        name: 'SystemDict',
        path: 'dict',
        component: () => import('#/views/system/dict/index.vue'),
        meta: { icon: 'lucide:list', title: '字典管理' },
      },
      {
        name: 'SystemConfig',
        path: 'config',
        component: () => import('#/views/system/config/index.vue'),
        meta: { icon: 'lucide:sliders-horizontal', title: '参数配置' },
      },
      {
        name: 'SystemFile',
        path: 'file',
        component: () => import('#/views/system/file/index.vue'),
        meta: { icon: 'lucide:file', title: '文件管理' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:scroll-text',
      order: 110,
      title: '审计日志',
    },
    name: 'Audit',
    path: '/audit',
    children: [
      {
        name: 'AuditIndex',
        path: '',
        component: () => import('#/views/system/audit/index.vue'),
        meta: { icon: 'lucide:scroll-text', title: '审计日志' },
      },
    ],
  },
];

export default routes;

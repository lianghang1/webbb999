import type { RouteRecordStringComponent } from '@vben/types';

import type { SysMenu } from '../system/types';

import { requestClient } from '#/api/request';

/** GET 统一入口：把业务参数塞进 axios 的 params */
function get<T>(url: string, params?: Record<string, any>) {
  return requestClient.get<T>(url, { params });
}

/** 当前登录用户可见菜单树（后端按权限/租户过滤） */
export async function getMyMenusApi() {
  return get<SysMenu[]>('/iam/menu/my');
}

/** 全量菜单树（菜单管理页用） */
export async function getMenuTreeApi(params?: {
  scope?: string;
  tenantId?: string;
}) {
  return get<SysMenu[]>('/iam/menu/tree', params);
}

/**
 * 把后端 SysMenu 树转成 vben 后端路由格式。
 * 种子菜单为权限点（type=C，无 path/component），默认不生成路由；
 * 仅当有 path+component 时才作为可访问路由，保证切到 backend 模式也能工作。
 */
function toRoute(menu: SysMenu): null | RouteRecordStringComponent {
  if (!menu.path && !menu.component) {
    return null;
  }
  const route: RouteRecordStringComponent = {
    component: menu.component || 'BasicLayout',
    meta: {
      icon: menu.icon,
      title: menu.menuName,
    },
    name: menu.permission || `menu_${menu.id}`,
    path: menu.path || `/menu-${menu.id}`,
  };
  const children = (menu.children ?? [])
    .map((child) => toRoute(child))
    .filter((item): item is RouteRecordStringComponent => item !== null);
  if (children.length > 0) {
    route.children = children;
  }
  return route;
}

/**
 * 获取用户所有菜单（vben 路由模式入口）。
 * 当前项目为 frontend 静态路由模式，本方法仅在切换为 backend 模式时生效。
 */
export async function getAllMenusApi() {
  const menus = await getMyMenusApi();
  return menus
    .map((menuItem) => toRoute(menuItem))
    .filter((item): item is RouteRecordStringComponent => item !== null);
}

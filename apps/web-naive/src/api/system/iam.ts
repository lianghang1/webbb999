import type {
  Id,
  IdRequest,
  PageResult,
  SysDept,
  SysMenu,
  SysRole,
  SysTenant,
  SysTenantPackage,
  SysUser,
  SysUserTenant,
} from './types';

import { requestClient } from '#/api/request';

/** GET 统一入口：把业务参数塞进 axios 的 params */
function get<T>(url: string, params?: Record<string, any>) {
  return requestClient.get<T>(url, { params });
}

/** 泛型 CRUD 工厂：对齐 BaseCrudController 的 list/get/save/delete 契约 */
function crudApi<T extends { id: Id }>(base: string) {
  return {
    /** 分页列表：参数用 X 前缀过滤（EQ_status=1）或 pageNum/pageSize */
    list(params?: Record<string, any>) {
      return get<PageResult<T>>(`${base}/list`, params);
    },
    /** 详情：查不到返回 null */
    get(id: Id) {
      return get<null | T>(`${base}/get`, { id });
    },
    save(data: Partial<T>) {
      return requestClient.post<T>(`${base}/save`, data);
    },
    delete(id: Id) {
      return requestClient.post<null>(`${base}/delete`, {
        id,
      } satisfies IdRequest);
    },
  };
}

/** 租户管理 */
export const tenantApi = {
  ...crudApi<SysTenant>('/iam/tenant'),
  platformTenantId() {
    return get<string>('/iam/tenant/platform-tenant-id');
  },
};

/** 套餐管理 */
export const packageApi = {
  ...crudApi<SysTenantPackage>('/iam/package'),
  assignMenus(data: {
    menuIds: Id[];
    packageId?: Id;
    roleId?: Id;
    tenantId?: string;
  }) {
    return requestClient.post<null>('/iam/package/assign-menus', data);
  },
};

/** 用户管理 */
export const userApi = {
  ...crudApi<SysUser>('/iam/user'),
  assignTenant(data: {
    deptId?: Id;
    status?: number;
    tenantId: string;
    userId: Id;
  }) {
    return requestClient.post<SysUserTenant>('/iam/user/assign-tenant', data);
  },
  tenants(userId: Id) {
    return get<SysUserTenant[]>('/iam/user/tenants', { userId });
  },
  assignRoles(data: { roleIds: Id[]; tenantId: string; userId: Id }) {
    return requestClient.post<null>('/iam/user/assign-roles', data);
  },
  roles(userId: Id, tenantId: string) {
    return get<string[]>('/iam/user/roles', { tenantId, userId });
  },
  permissions(userId: Id, tenantId: string) {
    return get<string[]>('/iam/user/permissions', { tenantId, userId });
  },
};

/** 部门管理 */
export const deptApi = crudApi<SysDept>('/iam/dept');

/** 角色管理 */
export const roleApi = {
  ...crudApi<SysRole>('/iam/role'),
  assignMenus(data: {
    menuIds: Id[];
    packageId?: Id;
    roleId?: Id;
    tenantId?: string;
  }) {
    return requestClient.post<null>('/iam/role/assign-menus', data);
  },
};

/** 菜单管理（后端菜单树 + CRUD） */
export const menuApi = {
  ...crudApi<SysMenu>('/iam/menu'),
  tree(params?: { scope?: string; tenantId?: string }) {
    return get<SysMenu[]>('/iam/menu/tree', params);
  },
  my(params?: { tenantId?: string }) {
    return get<SysMenu[]>('/iam/menu/my', params);
  },
};

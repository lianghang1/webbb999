import type {
  DeptTreeNode,
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
  UserDetail,
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
  /** 关键表 join 视图（菜单数 + 租户数） */
  listByPlan(params?: Record<string, any>) {
    return get<PageResult<SysTenantPackage>>(
      '/iam/package/list/PackageListPlan',
      params,
    );
  },
  menus(packageId: Id) {
    return get<Id[]>('/iam/package/menus', { packageId });
  },
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
  /**
   * 用户列表走 QueryPlan 通路：/iam/user/list/UserListPlan
   * 关联 sys_user_profile(昵称)/sys_dept(部门名)/角色聚合；服务端按当前登录租户隔离。
   */
  list(params?: Record<string, any>) {
    return get<PageResult<SysUser>>('/iam/user/list/UserListPlan', params);
  },
  /** 用户详情回显：账号 + 资料 + 归属部门 + 角色 ID（编辑抽屉用） */
  detail(id: Id, tenantId?: string) {
    return get<UserDetail>('/iam/user/detail', { id, tenantId });
  },
  /** 重置用户密码（管理员动作） */
  resetPassword(data: { userId: Id; password: string }) {
    return requestClient.post<null>('/iam/user/reset-password', data);
  },
  /** 批量删除（逻辑删除） */
  deleteBatch(ids: Id[]) {
    return requestClient.post<null>('/iam/user/delete-batch', { ids });
  },
  /** 批量改状态：1启用 0停用 */
  changeStatus(ids: Id[], status: number) {
    return requestClient.post<null>('/iam/user/change-status', { ids, status });
  },
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
export const deptApi = {
  ...crudApi<SysDept>('/iam/dept'),
  /** 部门树（芋道式左侧树）：不传 tenantId 时用当前登录租户 */
  tree(tenantId?: string) {
    return get<DeptTreeNode[]>('/iam/dept/tree', { tenantId });
  },
};

/** 角色管理 */
export const roleApi = {
  ...crudApi<SysRole>('/iam/role'),
  /** 关键表 join 视图（租户名 + 用户数 + 菜单数） */
  listByPlan(params?: Record<string, any>) {
    return get<PageResult<SysRole>>('/iam/role/list/RoleListPlan', params);
  },
  menus(roleId: Id, tenantId: string) {
    return get<Id[]>('/iam/role/menus', { roleId, tenantId });
  },
  assignMenus(data: {
    menuIds: Id[];
    packageId?: Id;
    roleId?: Id;
    tenantId?: string;
  }) {
    return requestClient.post<null>('/iam/role/assign-menus', data);
  },
  changeStatus(data: { ids: Id[]; status: number }) {
    return requestClient.post<null>('/iam/role/change-status', data);
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

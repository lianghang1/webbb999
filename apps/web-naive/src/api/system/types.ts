/** 系统管理模块公共类型：对齐后端实体与统一分页契约 */

/** 后端统一分页结果（PageResult） */
export interface PageResult<T> {
  list: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 后端统一响应包装（R） */
export interface R<T> {
  code: number;
  data: T;
  message: string;
}

/** 仅 id 的请求体 */
export interface IdRequest {
  id: string;
}

/** 主键统一为字符串（雪花 id 精度安全） */
export type Id = string;

export interface SysTenant {
  createTime?: string;
  expireTime?: string;
  id: Id;
  packageId?: Id;
  remark?: string;
  status?: number;
  tenantCode: string;
  tenantName: string;
}

export interface SysTenantPackage {
  createTime?: string;
  id: Id;
  /** 已分配菜单数（plan 聚合） */
  menuCount?: number;
  packageCode: string;
  packageName: string;
  remark?: string;
  status?: number;
  /** 已开通该套餐的租户数（plan 聚合） */
  tenantCount?: number;
}

export interface SysUser {
  accountType?: string;
  /** 归属租户（plan 查询返回） */
  tenantId?: string;
  /** 该租户下部门 ID（plan 查询返回） */
  deptId?: Id;
  /** 部门名（plan 关联 sys_dept 返回） */
  deptName?: string;
  /** 角色名，逗号分隔（plan 子查询聚合返回） */
  roleNames?: string;
  /** 角色 ID，前后补逗号（如 ,1,5,），供列表角色筛选（UserDetail.roleIds 为 Id[]，故用此名区分） */
  roleIdList?: string;
  /** 租户名称（plan 关联 sys_tenant 返回，平台超管看全部时用于区分） */
  tenantName?: string;
  /** 创建时间 */
  createTime?: string;
  /** 最后登录时间（最近一次成功登录） */
  lastLoginTime?: string;
  email?: string;
  id: Id;
  maxSessions?: number;
  mobile?: string;
  /** 昵称存于 SysUserProfile，用户列表走 UserListPlan 关联查询返回 */
  nickname?: string;
  password?: string;
  /** 性别 0未知 1男 2女 */
  sex?: number;
  remark?: string;
  status?: number;
  username: string;
}

/** 用户详情回显（编辑抽屉用） */
export interface UserDetail extends SysUser {
  roleIds?: Id[];
}

/** 部门树节点 */
export interface DeptTreeNode {
  id: Id;
  deptName: string;
  parentId?: Id;
  sortNo?: number;
  leaderId?: Id;
  status?: number;
  /** 该部门直属用户数（后端 tree 接口聚合） */
  userCount?: number;
  children?: DeptTreeNode[];
}

export interface SysUserTenant {
  deptId?: Id;
  id: Id;
  status?: number;
  tenantId: Id;
  userId: Id;
}

export interface SysDept {
  deptName: string;
  id: Id;
  leaderId?: Id;
  parentId?: Id;
  sortNo?: number;
  status?: number;
  tenantId?: Id;
}

export interface SysRole {
  /** 是否内置角色（内置不可编辑/删除） */
  builtIn?: boolean;
  createTime?: string;
  dataScope?: string;
  dataScopeDeptIds?: string;
  id: Id;
  /** 已分配菜单数（plan 聚合） */
  menuCount?: number;
  remark?: string;
  roleCode: string;
  roleName: string;
  /** 角色类型：PLATFORM_ADMIN / TENANT_ADMIN / NORMAL */
  roleType?: string;
  sortNo?: number;
  status?: number;
  tenantId?: Id;
  /** 租户名（plan 关联，平台超管看全部时展示） */
  tenantName?: string;
  /** 已分配用户数（plan 聚合） */
  userCount?: number;
}

export interface SysMenu {
  apiPattern?: string;
  children?: SysMenu[];
  component?: string;
  icon?: string;
  id: Id;
  menuName: string;
  menuScope?: string;
  menuType: string;
  parentId?: Id;
  path?: string;
  permission?: string;
  sortNo?: number;
  visible?: boolean;
}

/** 审计日志 */
export interface SysLoginLog {
  authType?: string;
  browser?: string;
  costMs?: number;
  deviceId?: string;
  id: Id;
  ip?: string;
  loginLocation?: string;
  loginTime?: string;
  os?: string;
  params?: string;
  reason?: string;
  reasonCode?: string;
  source?: string;
  success?: boolean;
  tenantCode?: string;
  traceId?: string;
  userAgent?: string;
  userId?: Id;
  username?: string;
}

export interface SysOperateLog {
  errorMsg?: string;
  id: Id;
  ip?: string;
  method?: string;
  module?: string;
  operation?: string;
  operTime?: string;
  operUserId?: Id;
  operUserName?: string;
  params?: string;
  success?: boolean;
  tenantId?: Id;
  uri?: string;
}

/** 字典 & 参数 */
export interface SysDict {
  createTime?: string;
  dictCode: string;
  dictName: string;
  id: Id;
  remark?: string;
  status?: number;
}

export interface SysDictOption {
  dictId?: Id;
  id: Id;
  optionCode: string;
  optionLabel: string;
  sortNo?: number;
  status?: number;
  tenantId?: Id;
}

export interface DictOptionValue {
  code: string;
  label: string;
  sortNo?: number;
}

/** 敏感参数密文出口（后端 SecretCipher） */
export interface SecretCipher {
  cipher: string;
  encrypted: boolean;
}

export interface SysConfig {
  configGroup?: string;
  configKey: string;
  /** 后端 ConfigVO：敏感值以密文对象返回，非敏感值为明文 */
  configValue?: SecretCipher | string;
  createBy?: string;
  createTime?: string;
  id: Id;
  needEncrypt?: boolean;
  remark?: string;
  tenantId?: Id;
  updateBy?: string;
  updateTime?: string;
  valueType?: string;
}

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
  expireTime?: string;
  id: Id;
  packageId?: Id;
  remark?: string;
  status?: number;
  tenantCode: string;
  tenantName: string;
}

export interface SysTenantPackage {
  id: Id;
  packageCode: string;
  packageName: string;
  remark?: string;
  status?: number;
}

export interface SysUser {
  accountType?: string;
  email?: string;
  id: Id;
  maxSessions?: number;
  mobile?: string;
  nickname: string;
  password?: string;
  status?: number;
  username: string;
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
  dataScope?: string;
  dataScopeDeptIds?: string;
  id: Id;
  remark?: string;
  roleCode: string;
  roleName: string;
  sortNo?: number;
  status?: number;
  tenantId?: Id;
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
  label: string;
  value: string;
}

export interface SysConfig {
  configGroup?: string;
  configKey: string;
  configName?: string;
  configValue?: string;
  id: Id;
  remark?: string;
  needEncrypt?: boolean;
  valueType?: string;
}

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数（对齐后端 LoginRequest） */
  export interface LoginParams {
    authType?: string;
    captchaCode?: string;
    captchaId?: string;
    code?: string;
    password?: string;
    provider?: string;
    tenantCode?: string;
    username?: string;
  }

  /** 租户简要信息（登录第一步返回） */
  export interface TenantBrief {
    tenantCode: string;
    tenantId: string;
    tenantName: string;
  }

  /** 登录结果：needSelectTenant=true 时为租户列表，否则为 token 装配 */
  export interface LoginResult {
    accountId?: string;
    accountType?: string;
    needSelectTenant: boolean;
    permissions?: string[];
    roles?: string[];
    tenantId?: string;
    tenants?: TenantBrief[];
    token?: string;
  }

  /** 当前登录身份（对齐后端 LoginUser） */
  export interface LoginUser {
    accountId: string;
    accountNo: string;
    accountType: string;
    attributes?: Record<string, string>;
    deviceId?: string;
    displayName: string;
    permissions: string[];
    roles: string[];
    source?: string;
    tenantId: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 会话信息（对齐后端 SessionInfo） */
  export interface SessionInfo {
    accountId: string;
    accountNo: string;
    accountType: string;
    attributes?: Record<string, string>;
    deviceId?: string;
    displayName: string;
    loginTime: number;
    permissions?: string[];
    roles?: string[];
    source?: string;
    tenantId: string;
  }

  /** 全量在线会话：{token, session} */
  export interface OnlineSession {
    session: SessionInfo;
    token: string;
  }
}

/** 生成登录验证码（captchaId + imageBase64） */
export async function getCaptchaApi() {
  return requestClient.post<{ captchaId: string; imageBase64: string }>(
    '/auth/captcha',
  );
}

/**
 * 登录：对齐后端两步流程。
 * tenantCode 为空时返回租户列表；带 tenantCode 时签发 token。
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', {
    authType: 'PASSWORD',
    ...data,
  });
}

/** 切换租户（返回新 token 装配） */
export async function switchTenantApi(data: { tenantCode: string }) {
  return requestClient.post<AuthApi.LoginResult>('/auth/switch-tenant', data);
}

/** 平台超管进入业务租户 */
export async function enterTenantApi(data: { tenantCode: string }) {
  return requestClient.post<AuthApi.LoginResult>('/auth/enter-tenant', data);
}

/** 当前登录身份（用户信息的真实来源） */
export async function getCurrentUserApi() {
  return requestClient.post<AuthApi.LoginUser>('/auth/me');
}

/** 刷新 accessToken（后端无独立刷新端点，保留兼容签名） */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/auth/refresh',
    undefined,
    { withCredentials: true },
  );
}

/** 退出登录 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

/** 获取用户权限码：从当前登录身份取 permissions */
export async function getAccessCodesApi() {
  const me = await getCurrentUserApi();
  return me.permissions ?? [];
}

/** 在线会话（当前账号） */
export async function onlineSessionsApi() {
  return requestClient.get<AuthApi.SessionInfo[]>('/auth/online-sessions');
}

/** 在线会话（全部，需管理权限） */
export async function onlineAllApi() {
  return requestClient.get<AuthApi.OnlineSession[]>('/auth/online-all');
}

/** 踢下线 */
export async function kickOutApi(data: { accountId: string }) {
  return requestClient.post('/auth/kick-out', data);
}

/** 修改密码 */
export async function changePasswordApi(data: {
  newPassword: string;
  oldPassword: string;
}) {
  return requestClient.post('/auth/change-password', data);
}

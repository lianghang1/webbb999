import type { UserInfo } from '@vben/types';

import { getCurrentUserApi } from './auth';

/**
 * 获取用户信息：后端登录身份来自 /api/auth/me（LoginUser），
 * 这里映射成 vben 的 UserInfo 契约。
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const me = await getCurrentUserApi();
  return {
    avatar: '',
    desc: me.accountType,
    homePath: '/dashboard/analytics',
    realName: me.displayName || me.accountNo,
    roles: me.roles ?? [],
    token: '',
    userId: me.accountId,
    username: me.accountNo,
    // 透传后端字段，页面可按需取用
    accountType: me.accountType,
    permissions: me.permissions ?? [],
    tenantId: me.tenantId,
  };
}

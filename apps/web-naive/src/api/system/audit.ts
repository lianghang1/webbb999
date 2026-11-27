import type { PageResult, SysLoginLog, SysOperateLog } from './types';

import { requestClient } from '#/api/request';

/** GET 统一入口：把业务参数塞进 axios 的 params */
function get<T>(url: string, params?: Record<string, any>) {
  return requestClient.get<T>(url, { params });
}

/** 审计日志查询（只读，列表参数支持 X 前缀过滤 + pageNum/pageSize） */
export const auditApi = {
  loginLogs(params?: Record<string, any>) {
    return get<PageResult<SysLoginLog>>('/audit/login-logs', params);
  },
  operateLogs(params?: Record<string, any>) {
    return get<PageResult<SysOperateLog>>('/audit/operate-logs', params);
  },
};

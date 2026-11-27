import type {
  DictOptionValue,
  Id,
  IdRequest,
  PageResult,
  SysConfig,
  SysDict,
  SysDictOption,
} from './types';

import { requestClient } from '#/api/request';

/** GET 统一入口：把业务参数塞进 axios 的 params */
function get<T>(url: string, params?: Record<string, any>) {
  return requestClient.get<T>(url, { params });
}

/** 字典管理 */
export const dictApi = {
  list(params?: Record<string, any>) {
    return get<PageResult<SysDict>>('/dict/list', params);
  },
  get(id: Id) {
    return get<null | SysDict>('/dict/get', { id });
  },
  save(data: Partial<SysDict>) {
    return requestClient.post<SysDict>('/dict/save', data);
  },
  delete(id: Id) {
    return requestClient.post<null>('/dict/delete', { id } satisfies IdRequest);
  },
  /** 字典项 */
  option: {
    list(params?: Record<string, any>) {
      return get<PageResult<SysDictOption>>('/dict/option/list', params);
    },
    get(id: Id) {
      return get<null | SysDictOption>('/dict/option/get', { id });
    },
    save(data: Partial<SysDictOption>) {
      return requestClient.post<SysDictOption>('/dict/option/save', data);
    },
    delete(id: Id) {
      return requestClient.post<null>('/dict/option/delete', {
        id,
      } satisfies IdRequest);
    },
    values(dictCode: string) {
      return get<DictOptionValue[]>('/dict/option/values', { dictCode });
    },
    valuesBatch(dictCodes: string[]) {
      return get<Record<string, DictOptionValue[]>>(
        '/dict/option/values/batch',
        { dictCodes: dictCodes.join(',') },
      );
    },
  },
};

/** 参数配置 */
export const configApi = {
  list(params?: Record<string, any>) {
    return get<PageResult<SysConfig>>('/config/list', params);
  },
  get(id: Id) {
    return get<null | SysConfig>('/config/get', { id });
  },
  save(data: Partial<SysConfig>) {
    return requestClient.post<SysConfig>('/config/save', data);
  },
  create(data: Partial<SysConfig>) {
    return requestClient.post<SysConfig>('/config/create', data);
  },
  update(data: Partial<SysConfig>) {
    return requestClient.post<SysConfig>('/config/update', data);
  },
  setSecret(data: { id: Id; secretValue: string }) {
    return requestClient.post<SysConfig>('/config/secret', data);
  },
  getSecretPlain(id: Id) {
    return get<string>('/config/secret', { id });
  },
  delete(id: Id) {
    return requestClient.post<null>('/config/delete', {
      id,
    } satisfies IdRequest);
  },
  value(configKey: string, defaultValue?: string) {
    return get<any>('/config/value', { configKey, defaultValue });
  },
  values(group?: string) {
    return get<SysConfig[]>('/config/values', { group });
  },
};

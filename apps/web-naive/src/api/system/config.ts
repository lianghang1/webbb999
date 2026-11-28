import type {
  DictOptionValue,
  Id,
  IdRequest,
  PageResult,
  SecretCipher,
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
  /** 新增：对齐 ConfigCreateRequest */
  create(data: {
    configGroup?: string;
    configKey: string;
    configValue: string;
    needEncrypt?: boolean;
    remark?: string;
    tenantId?: Id;
    valueType?: string;
  }) {
    return requestClient.post<SysConfig>('/config/create', data);
  },
  /** 修改基础信息（不触碰敏感值/加密标志） */
  update(data: {
    configValue?: string;
    id: Id;
    remark?: string;
    valueType?: string;
  }) {
    return requestClient.post<SysConfig>('/config/update', data);
  },
  /** 敏感参数唯一写入口：字段名必须与 ConfigSecretRequest 一致 */
  setSecret(data: { configValue?: string; id: Id; needEncrypt?: boolean }) {
    return requestClient.post<SysConfig>('/config/secret', data);
  },
  /** 敏感参数明文读取（独立权限 + 审计） */
  getSecretPlain(id: Id) {
    return get<string>('/config/secret', { id });
  },
  delete(id: Id) {
    return requestClient.post<null>('/config/delete', {
      id,
    } satisfies IdRequest);
  },
  /** 单值取值；敏感值返回密文对象 */
  value(configKey: string, group?: string) {
    return get<null | SecretCipher | string>('/config/value', {
      configKey,
      group,
    });
  },
  values(group?: string) {
    return get<SysConfig[]>('/config/values', { group });
  },
};

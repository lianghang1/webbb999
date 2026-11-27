import type { Id, IdRequest, PageResult } from './types';

import { requestClient } from '#/api/request';

/** GET 统一入口：把业务参数塞进 axios 的 params */
function get<T>(url: string, params?: Record<string, any>) {
  return requestClient.get<T>(url, { params });
}

/** 文件 DTO（对齐后端 FileDTO） */
export interface FileDTO {
  configId?: Id;
  id: Id;
  name?: string;
  objectId?: string;
  objectType?: string;
  originalFilename?: string;
  size?: number;
  thumbnailUrl?: string;
  url?: string;
}

export interface FileUploadForm {
  channelCode?: string;
  configId?: string;
  module?: string;
  objectId?: string;
  objectType?: string;
  thumbHeight?: number;
  thumbWidth?: number;
}

/** 文件管理 */
export const fileApi = {
  /** 上传（file 必填，thumbnail 可选，其余进表单） */
  upload(file: File, form: FileUploadForm = {}, thumbnail?: File) {
    const data = new FormData();
    data.append('file', file);
    if (thumbnail) {
      data.append('thumbnail', thumbnail);
    }
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });
    return requestClient.post<FileDTO>('/file/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get(id: Id) {
    return get<FileDTO>('/file/get', { id });
  },
  objects(objectType: string, objectId: string) {
    return get<FileDTO[]>('/file/objects', { objectId, objectType });
  },
  list(params?: Record<string, any>) {
    return get<PageResult<FileDTO>>('/file/list', params);
  },
  multipartSupport(configId?: string, channelCode?: string) {
    return get<{ supported: boolean }>('/file/multipart-support', {
      channelCode,
      configId,
    });
  },
  initiate(data: Record<string, any>) {
    return requestClient.post('/file/initiate', data);
  },
  uploadPart(file: File, part: Record<string, any>) {
    const data = new FormData();
    data.append('file', file);
    Object.entries(part).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        data.append(key, String(value));
      }
    });
    return requestClient.post('/file/upload-part', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  complete(id: Id) {
    return requestClient.post<null>('/file/complete', {
      id,
    } satisfies IdRequest);
  },
  abort(id: Id) {
    return requestClient.post<null>('/file/abort', { id } satisfies IdRequest);
  },
  parts(fileId: Id) {
    return get<any[]>('/file/parts', { fileId });
  },
};

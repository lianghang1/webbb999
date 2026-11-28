import type { Id, IdRequest, PageResult } from './types';

import { requestClient } from '#/api/request';

/** GET 统一入口：把业务参数塞进 axios 的 params */
function get<T>(url: string, params?: Record<string, any>) {
  return requestClient.get<T>(url, { params });
}

/** 文件 DTO（对齐后端 FileDTO 实际字段） */
export interface FileDTO {
  contentType?: string;
  fileSize?: number;
  fileType?: string;
  filename?: string;
  id: Id;
  md5?: string;
  objectId?: string;
  objectType?: string;
  originalFilename?: string;
  rawThumbUrl?: string;
  rawUrl?: string;
  thumbUrl?: string;
  url?: string;
}

/** 分片会话初始化结果（后端 MultipartInitResult） */
export interface MultipartInitResult {
  fileId: Id;
  uploadId: string;
}

/** 分片记录（后端 SysFilePart） */
export interface SysFilePart {
  eTag?: string;
  id: Id;
  partNumber: number;
  partSize?: number;
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
    // 不手动设置 Content-Type：浏览器需自动生成带 boundary 的 multipart 头
    return requestClient.post<FileDTO>('/file/upload', data);
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
  initiate(data: {
    channelCode?: string;
    configId?: string;
    fileSize: number;
    metadata?: Record<string, string>;
    module?: string;
    objectId?: string;
    objectType?: string;
    originalFilename: string;
  }) {
    return requestClient.post<MultipartInitResult>('/file/initiate', data);
  },
  uploadPart(file: File, part: { fileId: Id; partNumber: number }) {
    const data = new FormData();
    data.append('file', file);
    data.append('fileId', part.fileId);
    data.append('partNumber', String(part.partNumber));
    // 不手动设置 Content-Type：浏览器需自动生成带 boundary 的 multipart 头
    return requestClient.post<SysFilePart>('/file/upload-part', data);
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
    return get<SysFilePart[]>('/file/parts', { fileId });
  },
};

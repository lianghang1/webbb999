import { eventHandler, getRouterParam, readBody } from 'h3';
import { findSectionById, updateSection } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) {
    return useResponseError('参数缺失');
  }
  const current = findSectionById(id);
  if (!current) {
    return useResponseError('墓区不存在');
  }
  // 不允许把墓区移动到自己的子孙节点下（简校验：不能挂到自己）
  if (body.parentId && String(body.parentId) === id) {
    return useResponseError('上级墓区不能是自身');
  }
  const section = updateSection(id, {
    name: body.name === undefined ? undefined : String(body.name),
    code: body.code === undefined ? undefined : String(body.code),
    sort: body.sort === undefined ? undefined : Number(body.sort),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!section) {
    return useResponseError('墓区不存在');
  }
  return useResponseSuccess(section);
});

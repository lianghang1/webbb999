import { eventHandler, readBody } from 'h3';
import { createSection, findSectionById } from '~/utils/cemetery-store';
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
  const body = await readBody(event);
  if (!body?.parkId || !body?.name || !body?.code) {
    return useResponseError('所属园区、墓区名称与编码不能为空');
  }
  if (body.parentId) {
    const parent = findSectionById(String(body.parentId));
    if (!parent) {
      return useResponseError('上级墓区不存在');
    }
    if (parent.parkId !== String(body.parkId)) {
      return useResponseError('上级墓区与所属园区不一致');
    }
  }
  const section = createSection({
    parkId: String(body.parkId),
    parentId: body.parentId ? String(body.parentId) : null,
    name: String(body.name),
    code: String(body.code),
    sort: Number.parseInt(`${body.sort ?? 1}`, 10) || 1,
    remark: body.remark ? String(body.remark) : undefined,
  });
  return useResponseSuccess(section);
});

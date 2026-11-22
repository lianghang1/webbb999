import { eventHandler, getRouterParam, readBody } from 'h3';
import { updateAfterSale } from '~/utils/cemetery-biz-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  const id = getRouterParam(event, 'id');
  if (!id) {
    return useResponseError('参数缺失');
  }
  const body = await readBody(event);
  const item = updateAfterSale(id, {
    description: body?.description ? String(body.description) : undefined,
    handler: body?.handler ? String(body.handler) : undefined,
    status: body?.status,
    type: body?.type,
  });
  if (!item) {
    return useResponseError('工单不存在');
  }
  return useResponseSuccess(item);
});

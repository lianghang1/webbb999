import { eventHandler, getRouterParam, readBody } from 'h3';
import { completeAfterSale } from '~/utils/cemetery-biz-store';
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
  const body = await readBody(event).catch(() => undefined);
  const item = completeAfterSale(
    id,
    body?.handler ? String(body.handler) : undefined,
  );
  if (!item) {
    return useResponseError('工单不存在');
  }
  return useResponseSuccess(item);
});

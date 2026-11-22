import { eventHandler, readBody } from 'h3';
import { createAfterSale, ensureBizData } from '~/utils/cemetery-biz-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const body = await readBody(event);
  if (!body?.plotId || !body?.type || !body?.description) {
    return useResponseError('缺少必填项：格位 / 类型 / 描述');
  }
  const item = createAfterSale({
    parkId: String(body.parkId ?? ''),
    plotId: String(body.plotId),
    type: body.type,
    description: String(body.description),
    handler: body.handler ? String(body.handler) : undefined,
  });
  return useResponseSuccess(item);
});

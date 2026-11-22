import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, updatePrice } from '~/utils/cemetery-biz-store';
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
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) return useResponseError('参数缺失');
  const item = updatePrice(id, {
    price: body.price === undefined ? undefined : Number(body.price),
    managementCycleYears:
      body.managementCycleYears === undefined
        ? undefined
        : Number(body.managementCycleYears),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!item) return useResponseError('价目不存在');
  return useResponseSuccess(item);
});

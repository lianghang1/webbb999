import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, updateCustomer } from '~/utils/cemetery-biz-store';
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
  const item = updateCustomer(id, {
    name: body.name === undefined ? undefined : String(body.name),
    gender:
      body.gender === undefined ? undefined : Number(body.gender) === 2 ? 2 : 1,
    phone: body.phone === undefined ? undefined : String(body.phone),
    idCard: body.idCard === undefined ? undefined : String(body.idCard),
    address: body.address === undefined ? undefined : String(body.address),
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!item) return useResponseError('客户不存在');
  return useResponseSuccess(item);
});

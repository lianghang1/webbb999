import { eventHandler, getRouterParam, readBody } from 'h3';
import { addPayment, ensureBizData } from '~/utils/cemetery-biz-store';
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
  if (!id || !body?.amount || !body?.method) {
    return useResponseError('收款金额与方式不能为空');
  }
  const payment = addPayment(id, {
    amount: Number(body.amount),
    method: String(body.method),
  });
  if (!payment) return useResponseError('销售单不存在');
  return useResponseSuccess(payment);
});

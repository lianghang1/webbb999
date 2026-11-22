import { eventHandler, getRouterParam, readBody } from 'h3';
import { ensureBizData, signSale } from '~/utils/cemetery-biz-store';
import { updatePlotSaleStatus } from '~/utils/cemetery-store';
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
  if (!id || !body?.contractNo || !body?.totalAmount) {
    return useResponseError('合同编号与总金额不能为空');
  }
  const order = signSale(id, String(body.contractNo), Number(body.totalAmount));
  if (!order) return useResponseError('销售单不存在');
  // 状态联动：已预订 → 已售未安葬
  updatePlotSaleStatus(order.plotId, 'sold');
  return useResponseSuccess(order);
});

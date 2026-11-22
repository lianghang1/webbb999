import { eventHandler, getRouterParam } from 'h3';
import { ensureBizData, refundSale } from '~/utils/cemetery-biz-store';
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
  if (!id) return useResponseError('参数缺失');
  const order = refundSale(id);
  if (!order) return useResponseError('销售单不存在');
  // 状态联动：退购 → 可售
  updatePlotSaleStatus(order.plotId, 'idle');
  return useResponseSuccess(order);
});

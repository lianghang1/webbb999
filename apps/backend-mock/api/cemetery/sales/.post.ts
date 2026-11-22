import { eventHandler, readBody } from 'h3';
import { createSale, ensureBizData } from '~/utils/cemetery-biz-store';
import { findPlotById, updatePlotSaleStatus } from '~/utils/cemetery-store';
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
  if (!body?.plotId || !body?.customerId) {
    return useResponseError('格位与客户不能为空');
  }
  const plot = findPlotById(String(body.plotId));
  if (!plot) return useResponseError('格位不存在');
  if (plot.buildStatus !== 'built') {
    return useResponseError('该格位尚未建成，不可销售');
  }
  if (plot.saleStatus !== 'idle') {
    return useResponseError('该格位当前状态不可预订');
  }
  const order = createSale({
    parkId: plot.parkId,
    plotId: plot.id,
    customerId: String(body.customerId),
    deposit: Number(body.deposit ?? 0),
    remark: body.remark ? String(body.remark) : undefined,
  });
  // 状态联动：可售 → 已预订
  updatePlotSaleStatus(plot.id, 'reserved');
  return useResponseSuccess(order);
});

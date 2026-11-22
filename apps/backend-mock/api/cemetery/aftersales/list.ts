import { eventHandler, getQuery } from 'h3';
import { ensureBizData, getAfterSales } from '~/utils/cemetery-biz-store';
import { getPlots } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const status = firstQueryString(query.status);
  const parkId = firstQueryString(query.parkId);
  const keyword = (firstQueryString(query.keyword) ?? '').trim();

  const plotCodeMap = new Map(getPlots().map((p) => [p.id, p.code]));
  let list = getAfterSales().map((item) => ({
    ...item,
    plotCode: plotCodeMap.get(item.plotId) ?? '-',
  }));
  if (status) {
    list = list.filter((item) => item.status === status);
  }
  if (parkId) {
    list = list.filter((item) => item.parkId === parkId);
  }
  if (keyword) {
    list = list.filter(
      (item) =>
        item.orderNo.includes(keyword) ||
        item.plotCode.includes(keyword) ||
        item.description.includes(keyword),
    );
  }
  return useResponseSuccess(list);
});

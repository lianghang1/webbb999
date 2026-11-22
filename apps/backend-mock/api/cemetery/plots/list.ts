import { eventHandler, getQuery } from 'h3';
import { findPlots } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const query = getQuery(event);
  const list = findPlots({
    parkId: firstQueryString(query.parkId) || undefined,
    sectionId: firstQueryString(query.sectionId) || undefined,
    buildStatus: firstQueryString(query.buildStatus) || undefined,
    saleStatus: firstQueryString(query.saleStatus) || undefined,
  });
  // 格位需要整表渲染地图，返回全量（单墓区规模在几百级别）
  return useResponseSuccess(list);
});

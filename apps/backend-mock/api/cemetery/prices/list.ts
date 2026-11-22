import { eventHandler, getQuery } from 'h3';
import { ensureBizData, getPrices } from '~/utils/cemetery-biz-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  const list = parkId
    ? getPrices().filter((item) => item.parkId === parkId)
    : getPrices();
  return useResponseSuccess(list);
});

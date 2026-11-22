import { eventHandler, getQuery } from 'h3';
import { getParkStats } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  if (!parkId) {
    return useResponseError('缺少 parkId 参数');
  }
  return useResponseSuccess(getParkStats(parkId));
});

import { eventHandler, getQuery } from 'h3';
import { getCameras } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  const list = parkId
    ? getCameras().filter((item) => item.parkId === parkId)
    : getCameras();
  return useResponseSuccess(list);
});

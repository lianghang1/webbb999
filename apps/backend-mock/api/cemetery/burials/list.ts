import { eventHandler, getQuery } from 'h3';
import {
  ensureBizData,
  findCustomerById,
  findDeceasedById,
  getBurials,
} from '~/utils/cemetery-biz-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const parkId = firstQueryString(query.parkId);
  let list = parkId
    ? getBurials().filter((item) => item.parkId === parkId)
    : getBurials();
  list = list.map((item) => {
    const deceased = findDeceasedById(item.deceasedId);
    const customer = findCustomerById(item.customerId);
    return {
      ...item,
      deceasedName: deceased?.name ?? '-',
      customerName: customer?.name ?? '-',
    };
  });
  return useResponseSuccess(list);
});

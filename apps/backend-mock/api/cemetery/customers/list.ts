import { eventHandler, getQuery } from 'h3';
import { ensureBizData, getCustomers } from '~/utils/cemetery-biz-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { firstQueryString } from '~/utils/query';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);
  ensureBizData();
  const query = getQuery(event);
  const keyword = firstQueryString(query.keyword);
  const list = keyword
    ? getCustomers().filter(
        (item) => item.name.includes(keyword) || item.phone.includes(keyword),
      )
    : getCustomers();
  return useResponseSuccess(list);
});

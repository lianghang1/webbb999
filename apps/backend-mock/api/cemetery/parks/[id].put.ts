import { eventHandler, getRouterParam, readBody } from 'h3';
import { updatePark } from '~/utils/cemetery-store';
import { verifyAccessToken } from '~/utils/jwt-utils';
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
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  if (!id || !body) {
    return useResponseError('参数缺失');
  }
  const park = updatePark(id, {
    name: body.name === undefined ? undefined : String(body.name),
    code: body.code === undefined ? undefined : String(body.code),
    address: body.address === undefined ? undefined : String(body.address),
    contact: body.contact === undefined ? undefined : String(body.contact),
    phone: body.phone === undefined ? undefined : String(body.phone),
    status: body.status === undefined ? undefined : body.status === 0 ? 0 : 1,
    remark: body.remark === undefined ? undefined : String(body.remark ?? ''),
  });
  if (!park) {
    return useResponseError('园区不存在');
  }
  return useResponseSuccess(park);
});

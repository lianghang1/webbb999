import { eventHandler, readBody } from 'h3';
import { createPark } from '~/utils/cemetery-store';
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
  const body = await readBody(event);
  if (!body?.name || !body?.code) {
    return useResponseError('园区名称与编码不能为空');
  }
  const park = createPark({
    name: String(body.name),
    code: String(body.code),
    address: String(body.address ?? ''),
    contact: String(body.contact ?? ''),
    phone: String(body.phone ?? ''),
    status: body.status === 0 ? 0 : 1,
    remark: body.remark ? String(body.remark) : undefined,
  });
  return useResponseSuccess(park);
});

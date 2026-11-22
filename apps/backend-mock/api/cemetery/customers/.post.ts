import { eventHandler, readBody } from 'h3';
import { createCustomer, ensureBizData } from '~/utils/cemetery-biz-store';
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
  if (!body?.name || !body?.phone) {
    return useResponseError('客户姓名与电话不能为空');
  }
  return useResponseSuccess(
    createCustomer({
      name: String(body.name),
      gender: Number(body.gender ?? 1) === 2 ? 2 : 1,
      phone: String(body.phone),
      idCard: body.idCard ? String(body.idCard) : '',
      address: body.address ? String(body.address) : '',
      remark: body.remark ? String(body.remark) : undefined,
    }),
  );
});

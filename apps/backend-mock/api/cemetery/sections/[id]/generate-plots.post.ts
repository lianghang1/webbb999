import { eventHandler, getRouterParam, readBody } from 'h3';
import {
  generatePlots,
  plotSectionHasPlots,
  sectionHasChildren,
} from '~/utils/cemetery-store';
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
  const rows = Number.parseInt(`${body.rows}`, 10);
  const cols = Number.parseInt(`${body.cols}`, 10);
  if (!rows || !cols || rows < 1 || cols < 1 || rows > 50 || cols > 50) {
    return useResponseError('排数与列数须在 1~50 之间');
  }
  if (!body.typeId) {
    return useResponseError('请选择规划墓型');
  }
  if (sectionHasChildren(id)) {
    return useResponseError('该墓区存在下级墓区，只能在最末级墓区规划格位');
  }
  if (plotSectionHasPlots(id)) {
    return useResponseError('该墓区已规划过格位，不可重复规划');
  }
  const created = generatePlots({
    parkId: String(body.parkId),
    sectionId: id,
    rows,
    cols,
    typeId: String(body.typeId),
    area:
      body.area === undefined || body.area === null
        ? undefined
        : Number(body.area),
    price:
      body.price === undefined || body.price === null
        ? undefined
        : Number(body.price),
  });
  if (!created) {
    return useResponseError('墓区不存在');
  }
  return useResponseSuccess({ count: created.length });
});

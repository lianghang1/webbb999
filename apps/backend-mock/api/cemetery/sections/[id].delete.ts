import { eventHandler, getRouterParam } from 'h3';
import {
  deleteSection,
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
  if (!id) {
    return useResponseError('参数缺失');
  }
  if (sectionHasChildren(id)) {
    return useResponseError('该墓区存在下级墓区，请先删除下级');
  }
  if (plotSectionHasPlots(id)) {
    return useResponseError('该墓区下已规划格位，无法删除');
  }
  const removed = deleteSection(id);
  if (!removed) {
    return useResponseError('墓区不存在');
  }
  return useResponseSuccess(null);
});

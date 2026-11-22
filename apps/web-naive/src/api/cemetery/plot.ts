import type { CemeteryParkStats, CemeteryPlot, PlotBuildStatus } from './types';

import { requestClient } from '#/api/request';

export interface PlotListParams {
  buildStatus?: PlotBuildStatus;
  parkId?: string;
  saleStatus?: string;
  sectionId?: string;
}

export async function getPlotListApi(params: PlotListParams) {
  return requestClient.get<CemeteryPlot[]>('/cemetery/plots/list', {
    params,
  });
}

export async function getPlotDetailApi(id: string) {
  return requestClient.get<CemeteryPlot>(`/cemetery/plots/${id}`);
}

/** 建造状态切换：未建 → 在建 → 已建成 */
export async function updatePlotBuildStatusApi(
  id: string,
  buildStatus: PlotBuildStatus,
) {
  return requestClient.post<CemeteryPlot>(
    `/cemetery/plots/${id}/build-status`,
    { buildStatus },
  );
}

export async function getParkStatsApi(parkId: string) {
  return requestClient.get<CemeteryParkStats>('/cemetery/stats', {
    params: { parkId },
  });
}

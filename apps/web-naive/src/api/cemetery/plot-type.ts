import type { CemeteryPlotType, PlotTypeCategory } from './types';

import { requestClient } from '#/api/request';

export namespace PlotTypeApi {
  export interface AddParams {
    category: PlotTypeCategory;
    name: string;
    remark?: string;
  }

  export interface UpdateParams extends Partial<AddParams> {}
}

export async function getPlotTypeListApi() {
  return requestClient.get<CemeteryPlotType[]>('/cemetery/plot-types/list');
}

export async function createPlotTypeApi(data: PlotTypeApi.AddParams) {
  return requestClient.post<CemeteryPlotType>('/cemetery/plot-types', data);
}

export async function updatePlotTypeApi(
  id: string,
  data: PlotTypeApi.UpdateParams,
) {
  return requestClient.put<CemeteryPlotType>(
    `/cemetery/plot-types/${id}`,
    data,
  );
}

export async function deletePlotTypeApi(id: string) {
  return requestClient.delete(`/cemetery/plot-types/${id}`);
}

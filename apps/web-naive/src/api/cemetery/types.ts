export type PlotBuildStatus = 'building' | 'built' | 'unbuilt';

export type PlotSaleStatus =
  | 'idle'
  | 'maintenance'
  | 'none'
  | 'occupied'
  | 'reserved'
  | 'sold';

export type PlotTypeCategory =
  | 'art'
  | 'flower'
  | 'lawn'
  | 'niche'
  | 'tomb'
  | 'tree'
  | 'wall';

export interface CemeteryPark {
  address: string;
  code: string;
  contact: string;
  createTime: string;
  id: string;
  name: string;
  phone: string;
  remark?: string;
  status: 0 | 1;
}

export interface CemeterySection {
  code: string;
  createTime: string;
  id: string;
  name: string;
  parentId: null | string;
  parkId: string;
  remark?: string;
  sort: number;
}

export interface CemeteryPlotType {
  category: PlotTypeCategory;
  createTime: string;
  id: string;
  name: string;
  remark?: string;
}

export interface CemeteryPlot {
  area?: number;
  buildStatus: PlotBuildStatus;
  code: string;
  col: number;
  createTime: string;
  cryptCount: number;
  id: string;
  parkId: string;
  price?: number;
  row: number;
  /** 不规则布局坐标：相对墓区中心的局部 X（米），有值时按坐标渲染 */
  posX?: number;
  /** 不规则布局坐标：相对墓区中心的局部 Y（米） */
  posY?: number;
  /** 朝向角度（度），0 = 朝正方向 */
  rotation?: number;
  saleStatus: PlotSaleStatus;
  sectionId: string;
  typeId: string;
}

export interface CemeteryCamera {
  createTime: string;
  feature: string;
  id: string;
  name: string;
  /** null = 园区公共区域 */
  sectionId: null | string;
  offsetX: number;
  offsetZ: number;
  parkId: string;
  status: 'offline' | 'online';
}

export interface CemeteryParkStats {
  building: number;
  built: number;
  idle: number;
  maintenance: number;
  occupied: number;
  parkId: string;
  reserved: number;
  sold: number;
  totalSlots: number;
  unbuilt: number;
}

export interface GeneratePlotsParams {
  area?: number;
  cols: number;
  cryptCount?: number;
  parkId: string;
  price?: number;
  rows: number;
  typeId: string;
}

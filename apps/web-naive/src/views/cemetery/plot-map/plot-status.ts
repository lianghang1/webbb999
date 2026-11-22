import type { CemeteryPlot } from '#/api/cemetery/types';

/** 格位「建造×流转」组合的展示色与文案（2D/3D/图例共用） */
export interface CellColor {
  bg: string;
  border: string;
  label: string;
  text: string;
}

export const BUILD_CELL: Record<string, CellColor> = {
  unbuilt: { bg: '#f5f5f5', border: '#d9d9d9', label: '未建', text: '#8c8c8c' },
  building: {
    bg: '#fadb14',
    border: '#fadb14',
    label: '在建',
    text: '#613400',
  },
};

export const SALE_CELL: Record<string, CellColor> = {
  idle: { bg: '#52c41a', border: '#52c41a', label: '可售', text: '#fff' },
  maintenance: {
    bg: '#f5222d',
    border: '#f5222d',
    label: '维护中',
    text: '#fff',
  },
  occupied: { bg: '#722ed1', border: '#722ed1', label: '已安葬', text: '#fff' },
  reserved: { bg: '#fa8c16', border: '#fa8c16', label: '已预订', text: '#fff' },
  sold: { bg: '#1677ff', border: '#1677ff', label: '已售未安葬', text: '#fff' },
};

export const LEGEND_KEYS = [
  'unbuilt',
  'building',
  'idle',
  'reserved',
  'sold',
  'occupied',
  'maintenance',
] as const;

/** 建造×流转 组合出的展示键 */
export function cellKey(plot: CemeteryPlot): string {
  if (plot.buildStatus === 'unbuilt') {
    return 'unbuilt';
  }
  if (plot.buildStatus === 'building') {
    return 'building';
  }
  return plot.saleStatus === 'none' ? 'idle' : plot.saleStatus;
}

export function cellColor(plot: CemeteryPlot): CellColor {
  const key = cellKey(plot);
  return (
    BUILD_CELL[key] ??
    SALE_CELL[key] ?? {
      bg: '#f5f5f5',
      border: '#d9d9d9',
      label: key,
      text: '#8c8c8c',
    }
  );
}

const STATUS_TAG_TYPE: Record<
  string,
  'default' | 'error' | 'info' | 'success' | 'warning'
> = {
  building: 'warning',
  idle: 'success',
  maintenance: 'error',
  occupied: 'error',
  reserved: 'warning',
  sold: 'info',
  unbuilt: 'default',
};

export function statusTagType(plot: CemeteryPlot) {
  return STATUS_TAG_TYPE[cellKey(plot)] ?? 'default';
}

export function statusLabelOf(plot: CemeteryPlot): string {
  return cellColor(plot).label;
}

// ---------------------------------------------------------------- 价格展示

/** 价格 → 万元缩写：56800 → 5.68万；9800 → ¥9800 */
export function priceWan(price?: number): null | string {
  if (price === undefined || price === null) {
    return null;
  }
  if (price >= 100_000_000) {
    return `${(price / 100_000_000).toFixed(2).replace(/\.?0+$/, '')}亿`;
  }
  if (price >= 10_000) {
    const wan = price / 10_000;
    const text =
      wan >= 100
        ? Math.round(wan).toString()
        : wan.toFixed(2).replace(/\.?0+$/, '');
    return `${text}万`;
  }
  return `¥${price}`;
}

export type PriceTier = 'high' | 'low' | 'mid';

/** 价格档位（角标用）：金 ≥8万 / 银 4~8万 / 铜 <4万 */
export const PRICE_TIER: Record<PriceTier, { color: string; label: string }> = {
  high: { color: '#ffd54a', label: '金档 ≥8万' },
  low: { color: '#e8a15d', label: '铜档 <4万' },
  mid: { color: '#c9d3de', label: '银档 4~8万' },
};

export function priceTier(price?: number): null | PriceTier {
  if (price === undefined || price === null) {
    return null;
  }
  if (price >= 80_000) {
    return 'high';
  }
  if (price >= 40_000) {
    return 'mid';
  }
  return 'low';
}

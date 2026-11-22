import { faker } from '@faker-js/faker';

/**
 * 智慧陵园 Phase 1 内存数据层（服务器重启即重置）。
 *
 * 域模型口径：
 * - 墓区 Section 多级树（parentId，null 为根，可表达 陵园→期数→墓区→子区/排组）；
 * - 格位 Plot 是唯一记录（规划单元），含两条独立状态轴：
 *   - buildStatus 建造状态：未建/在建/已建成（"墓位" = 已建成的格位）；
 *   - saleStatus 流转状态：仅已建成格位有意义（none 表示尚未进入流转）。
 * - 价目/客户/销售/逝者/安葬为 Phase 2 范围，此处仅在格位上留 area/price 占位。
 */

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

export interface MockPark {
  id: string;
  name: string;
  code: string;
  address: string;
  contact: string;
  phone: string;
  status: 0 | 1;
  remark?: string;
  createTime: string;
}

export interface MockSection {
  id: string;
  parkId: string;
  parentId: null | string;
  name: string;
  code: string;
  sort: number;
  remark?: string;
  createTime: string;
}

export interface MockPlotType {
  id: string;
  name: string;
  category: PlotTypeCategory;
  remark?: string;
  createTime: string;
}

export interface MockPlot {
  id: string;
  parkId: string;
  sectionId: string;
  row: number;
  col: number;
  code: string;
  typeId: string;
  /** 穴数：1 单穴 / 2 双穴（合葬）/ 4 多穴（家族墓） */
  cryptCount: number;
  buildStatus: PlotBuildStatus;
  saleStatus: PlotSaleStatus;
  area?: number;
  price?: number;
  /**
   * 不规则布局坐标（可选）：相对所属墓区中心的局部平面坐标（米）。
   * 有坐标 → 2D/3D 按坐标渲染（支持弧形/错落等不规则排布）；
   * 无坐标 → 回退 row/col 均匀网格。
   */
  posX?: number;
  posY?: number;
  /** 朝向角度（度）：0 = 朝正方向，顺时针旋转 */
  rotation?: number;
  createTime: string;
}

const formatterCN = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function now() {
  return formatterCN.format(new Date());
}

function createId() {
  return faker.string.uuid();
}

// ---------------------------------------------------------------- 园区

const parks: MockPark[] = [
  {
    id: createId(),
    name: '青松陵园',
    code: 'QS',
    address: '江州市青云区青松路 88 号',
    contact: '钱卫民',
    phone: '13800001111',
    status: 1,
    remark: '经营性公墓，一期已运营',
    createTime: now(),
  },
  {
    id: createId(),
    name: '湖畔陵园',
    code: 'HP',
    address: '江州市湖西区滨湖大道 12 号',
    contact: '赵春梅',
    phone: '13800002222',
    status: 1,
    remark: '经营性公墓，筹建期',
    createTime: now(),
  },
];

export function getParks() {
  return parks;
}

export function findParkById(id: string) {
  return parks.find((item) => item.id === id);
}

export function createPark(
  data: Omit<MockPark, 'createTime' | 'id'>,
): MockPark {
  const item: MockPark = { ...data, id: createId(), createTime: now() };
  parks.unshift(item);
  return item;
}

export function updatePark(
  id: string,
  data: Partial<Omit<MockPark, 'createTime' | 'id'>>,
) {
  const index = parks.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  parks[index] = { ...parks[index]!, ...data };
  return parks[index];
}

export function deletePark(id: string) {
  const index = parks.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  parks.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------- 墓区（多级树）

const sections: MockSection[] = [];

function seedSection(data: Omit<MockSection, 'createTime' | 'id'>) {
  const item: MockSection = { ...data, id: createId(), createTime: now() };
  sections.push(item);
  return item;
}

export function getSections() {
  return sections;
}

export function findSectionById(id: string) {
  return sections.find((item) => item.id === id);
}

export function sectionHasChildren(id: string) {
  return sections.some((item) => item.parentId === id);
}

export function createSection(
  data: Omit<MockSection, 'createTime' | 'id'>,
): MockSection {
  const item: MockSection = { ...data, id: createId(), createTime: now() };
  sections.push(item);
  return item;
}

export function updateSection(
  id: string,
  data: Partial<Omit<MockSection, 'createTime' | 'id'>>,
) {
  const index = sections.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  sections[index] = { ...sections[index]!, ...data };
  return sections[index];
}

export function deleteSection(id: string) {
  const index = sections.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  sections.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------- 墓型

const plotTypes: MockPlotType[] = [
  {
    id: createId(),
    name: '标准立碑墓',
    category: 'tomb',
    remark: '传统双穴立碑墓',
    createTime: now(),
  },
  {
    id: createId(),
    name: '艺术墓',
    category: 'art',
    remark: '个性化设计墓型',
    createTime: now(),
  },
  {
    id: createId(),
    name: '草坪葬',
    category: 'lawn',
    remark: '节地生态葬，不立碑',
    createTime: now(),
  },
  {
    id: createId(),
    name: '树葬',
    category: 'tree',
    remark: '节地生态葬，可降解骨灰坛',
    createTime: now(),
  },
  {
    id: createId(),
    name: '壁葬格位',
    category: 'wall',
    remark: '骨灰墙立体安放',
    createTime: now(),
  },
];

export function getPlotTypes() {
  return plotTypes;
}

export function findPlotTypeById(id: string) {
  return plotTypes.find((item) => item.id === id);
}

export function createPlotType(
  data: Omit<MockPlotType, 'createTime' | 'id'>,
): MockPlotType {
  const item: MockPlotType = { ...data, id: createId(), createTime: now() };
  plotTypes.unshift(item);
  return item;
}

export function updatePlotType(
  id: string,
  data: Partial<Omit<MockPlotType, 'createTime' | 'id'>>,
) {
  const index = plotTypes.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  plotTypes[index] = { ...plotTypes[index]!, ...data };
  return plotTypes[index];
}

export function deletePlotType(id: string) {
  const index = plotTypes.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  plotTypes.splice(index, 1);
  return true;
}

// ---------------------------------------------------------------- 格位（墓位）

const plots: MockPlot[] = [];

function seedPlots(options: {
  parkId: string;
  section: MockSection;
  rows: number;
  cols: number;
  typeId: string;
  cryptCount?: number;
  area?: number;
  price?: number;
  /** 按 (row, col) 决定初始状态，缺省为未建 */
  resolveState?: (
    row: number,
    col: number,
  ) => {
    buildStatus: PlotBuildStatus;
    saleStatus: PlotSaleStatus;
  };
}) {
  const { parkId, section, rows, cols, typeId, area, price, resolveState } =
    options;
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const state = resolveState?.(row, col) ?? {
        buildStatus: 'unbuilt' as PlotBuildStatus,
        saleStatus: 'none' as PlotSaleStatus,
      };
      plots.push({
        id: createId(),
        parkId,
        sectionId: section.id,
        row,
        col,
        code: `${section.code}-${String(row).padStart(2, '0')}-${String(col).padStart(2, '0')}`,
        typeId,
        cryptCount: options.cryptCount ?? 1,
        buildStatus: state.buildStatus,
        saleStatus: state.buildStatus === 'built' ? state.saleStatus : 'none',
        area,
        price: state.buildStatus === 'built' ? price : undefined,
        createTime: now(),
      });
    }
  }
}

// 种子：青松陵园 A-1 区「规划 100 座、建成 50 座」示例
export function seedCemeteryData() {
  const qingsong = parks[0]!;
  const hupan = parks[1]!;

  // 一期（根）
  const phase1 = seedSection({
    parkId: qingsong.id,
    parentId: null,
    name: '一期',
    code: 'QS1',
    sort: 1,
    remark: '已运营',
  });
  // 一期 → A区 → A-1 / A-2
  const zoneA = seedSection({
    parkId: qingsong.id,
    parentId: phase1.id,
    name: 'A区',
    code: 'A',
    sort: 1,
  });
  const a1 = seedSection({
    parkId: qingsong.id,
    parentId: zoneA.id,
    name: 'A-1区',
    code: 'A-1',
    sort: 1,
    remark: '标准立碑墓示范区',
  });
  const a2 = seedSection({
    parkId: qingsong.id,
    parentId: zoneA.id,
    name: 'A-2区',
    code: 'A-2',
    sort: 2,
  });
  // 一期 → B区 → B-1
  const zoneB = seedSection({
    parkId: qingsong.id,
    parentId: phase1.id,
    name: 'B区',
    code: 'B',
    sort: 2,
  });
  const b1 = seedSection({
    parkId: qingsong.id,
    parentId: zoneB.id,
    name: 'B-1区',
    code: 'B-1',
    sort: 1,
  });
  // 二期（根）→ 生态区
  const phase2 = seedSection({
    parkId: qingsong.id,
    parentId: null,
    name: '二期',
    code: 'QS2',
    sort: 2,
    remark: '节地生态葬规划区',
  });
  const eco = seedSection({
    parkId: qingsong.id,
    parentId: phase2.id,
    name: '生态区',
    code: 'ST',
    sort: 1,
  });
  // 湖畔陵园 → 一期 → 东区
  const hpPhase1 = seedSection({
    parkId: hupan.id,
    parentId: null,
    name: '一期',
    code: 'HP1',
    sort: 1,
  });
  const hpEast = seedSection({
    parkId: hupan.id,
    parentId: hpPhase1.id,
    name: '东区',
    code: 'HP-D',
    sort: 1,
  });

  const standardId = plotTypes[0]!.id;
  const artId = plotTypes[1]!.id;
  const lawnId = plotTypes[2]!.id;
  const treeId = plotTypes[3]!.id;

  // A-1 区 10×10 = 100：建成 60（状态自然混布）、在建散布 14、未建 26
  seedPlots({
    parkId: qingsong.id,
    section: a1,
    rows: 10,
    cols: 10,
    typeId: standardId,
    area: 1.2,
    price: 56_800,
    resolveState: (row, col) => {
      // 确定性哈希：同一格位每次生成的状态一致，且各状态自然交错
      const h = (row * 31 + col * 17) % 100;
      if (row <= 6) {
        // 已建成区：各流转状态混布
        if (h < 7) {
          return { buildStatus: 'built', saleStatus: 'maintenance' };
        }
        if (h < 19) {
          return { buildStatus: 'built', saleStatus: 'occupied' };
        }
        if (h < 34) {
          return { buildStatus: 'built', saleStatus: 'sold' };
        }
        if (h < 48) {
          return { buildStatus: 'built', saleStatus: 'reserved' };
        }
        return { buildStatus: 'built', saleStatus: 'idle' };
      }
      if (row <= 8) {
        // 在建区：工地分段推进，在建与未建交错
        if (h < 60) {
          return { buildStatus: 'building', saleStatus: 'none' };
        }
        return { buildStatus: 'unbuilt', saleStatus: 'none' };
      }
      return { buildStatus: 'unbuilt', saleStatus: 'none' };
    },
  });
  // A-1 区部分建成格位改用艺术墓型 + 双穴（第 4、5 排）
  for (const plot of plots) {
    if (plot.sectionId === a1.id && plot.row >= 4 && plot.row <= 5) {
      plot.typeId = artId;
      plot.cryptCount = 2;
      plot.area = 1.8;
      plot.price = 88_800;
    }
  }

  // A-2 区 5×10 = 50：建成 30（状态混布）、在建散布、未建
  seedPlots({
    parkId: qingsong.id,
    section: a2,
    rows: 5,
    cols: 10,
    typeId: standardId,
    area: 1.2,
    price: 46_800,
    resolveState: (row, col) => {
      const h = (row * 23 + col * 41) % 100;
      if (row <= 3) {
        if (h < 6) {
          return { buildStatus: 'built', saleStatus: 'maintenance' };
        }
        if (h < 18) {
          return { buildStatus: 'built', saleStatus: 'occupied' };
        }
        if (h < 34) {
          return { buildStatus: 'built', saleStatus: 'sold' };
        }
        if (h < 48) {
          return { buildStatus: 'built', saleStatus: 'reserved' };
        }
        return { buildStatus: 'built', saleStatus: 'idle' };
      }
      if (row === 4) {
        return { buildStatus: 'building', saleStatus: 'none' };
      }
      return { buildStatus: 'unbuilt', saleStatus: 'none' };
    },
  });
  // A-2 区第 2 排建成格位改为多穴（家族墓）
  for (const plot of plots) {
    if (plot.sectionId === a2.id && plot.row === 2) {
      plot.cryptCount = 4;
      plot.area = 2.4;
      plot.price = 96_800;
    }
  }

  // B-1 区 6×10 = 60：全部未建（仅规划）
  seedPlots({
    parkId: qingsong.id,
    section: b1,
    rows: 6,
    cols: 10,
    typeId: standardId,
    area: 1,
    price: 36_800,
  });

  // 生态区 4×5 = 20：全部建成可售（树葬/草坪葬），弧形生态葬排布（坐标模式示范）
  seedPlots({
    parkId: qingsong.id,
    section: eco,
    rows: 4,
    cols: 5,
    typeId: treeId,
    area: 0.7,
    price: 12_800,
    resolveState: () => ({
      buildStatus: 'built',
      saleStatus: 'idle',
    }),
  });
  // 生态区改为弧形排布（不规则布局示范）：沿弧线摆位，碑朝向弧外；流转状态自然混布
  {
    const ecoPlots = plots.filter((item) => item.sectionId === eco.id);
    const radius = 13;
    ecoPlots.forEach((item, i) => {
      const angle =
        Math.PI * (0.12 + (i / Math.max(1, ecoPlots.length - 1)) * 0.76);
      item.posX = Number((Math.cos(angle) * radius).toFixed(2));
      item.posY = Number((Math.sin(angle) * radius * 0.72).toFixed(2));
      // 碑身朝向弧外（切向法线）
      item.rotation = Math.round((angle * 180) / Math.PI - 90);
      const h = (i * 37) % 100;
      if (h < 8) {
        item.saleStatus = 'maintenance';
      } else if (h < 22) {
        item.saleStatus = 'sold';
      } else if (h < 38) {
        item.saleStatus = 'reserved';
      } else {
        item.saleStatus = 'idle';
      }
    });
  }
  // 生态区第 3、4 排改为草坪葬
  for (const plot of plots) {
    if (plot.sectionId === eco.id && plot.row >= 3) {
      plot.typeId = lawnId;
    }
  }

  // 湖畔陵园东区 5×8 = 40：全部未建（筹建期仅规划）
  seedPlots({
    parkId: hupan.id,
    section: hpEast,
    rows: 5,
    cols: 8,
    typeId: standardId,
    area: 1.2,
    price: 42_800,
  });

  // 摄像头点位（AI 监控）：offset 相对所属墓区中心（sectionId 为空则相对园区中心）
  seedCamera({
    parkId: qingsong.id,
    sectionId: null,
    name: '园区大门·人车识别',
    offsetX: 0,
    offsetZ: -70,
    status: 'online',
    feature: '人脸识别 / 车牌抓拍',
  });
  seedCamera({
    parkId: qingsong.id,
    sectionId: a1.id,
    name: 'A-1区·AI 全景枪机',
    offsetX: -16,
    offsetZ: -10,
    status: 'online',
    feature: '烟火识别 / 人群密度',
  });
  seedCamera({
    parkId: qingsong.id,
    sectionId: a1.id,
    name: 'A-1区·东南球机',
    offsetX: 14,
    offsetZ: 12,
    status: 'online',
    feature: '行为分析 / 异物检测',
  });
  seedCamera({
    parkId: qingsong.id,
    sectionId: a2.id,
    name: 'A-2区·周界枪机',
    offsetX: 0,
    offsetZ: 0,
    status: 'offline',
    feature: '周界入侵',
  });
  seedCamera({
    parkId: qingsong.id,
    sectionId: eco.id,
    name: '生态区·生态监测球机',
    offsetX: 0,
    offsetZ: -8,
    status: 'online',
    feature: '烟火识别 / 野生动物',
  });
  seedCamera({
    parkId: hupan.id,
    sectionId: hpEast.id,
    name: '东区·施工监控',
    offsetX: 0,
    offsetZ: 0,
    status: 'online',
    feature: '施工安全 / 区域入侵',
  });
}

export function getPlots() {
  return plots;
}

export interface PlotFilter {
  parkId?: string;
  sectionId?: string;
  buildStatus?: string;
  saleStatus?: string;
}

export function findPlots(filter: PlotFilter) {
  return plots.filter((item) => {
    if (filter.parkId && item.parkId !== filter.parkId) {
      return false;
    }
    if (filter.sectionId && item.sectionId !== filter.sectionId) {
      return false;
    }
    if (filter.buildStatus && item.buildStatus !== filter.buildStatus) {
      return false;
    }
    if (filter.saleStatus && item.saleStatus !== filter.saleStatus) {
      return false;
    }
    return true;
  });
}

export function findPlotById(id: string) {
  return plots.find((item) => item.id === id);
}

export function plotSectionHasPlots(sectionId: string) {
  return plots.some((item) => item.sectionId === sectionId);
}

export function countPlotsBySection(sectionId: string) {
  let total = 0;
  let built = 0;
  for (const item of plots) {
    if (item.sectionId === sectionId) {
      total += 1;
      if (item.buildStatus === 'built') {
        built += 1;
      }
    }
  }
  return { total, built };
}

export interface GeneratePlotsOptions {
  parkId: string;
  sectionId: string;
  rows: number;
  cols: number;
  typeId: string;
  cryptCount?: number;
  area?: number;
  price?: number;
}

export function generatePlots(options: GeneratePlotsOptions) {
  const section = findSectionById(options.sectionId);
  if (!section) {
    return null;
  }
  const created: MockPlot[] = [];
  for (let row = 1; row <= options.rows; row++) {
    for (let col = 1; col <= options.cols; col++) {
      const item: MockPlot = {
        id: createId(),
        parkId: options.parkId,
        sectionId: options.sectionId,
        row,
        col,
        code: `${section.code}-${String(row).padStart(2, '0')}-${String(col).padStart(2, '0')}`,
        typeId: options.typeId,
        cryptCount: options.cryptCount ?? 1,
        buildStatus: 'unbuilt',
        saleStatus: 'none',
        area: options.area,
        createTime: now(),
      };
      plots.push(item);
      created.push(item);
    }
  }
  return created;
}

export function updatePlotSaleStatus(id: string, saleStatus: PlotSaleStatus) {
  const index = plots.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  plots[index] = { ...plots[index]!, saleStatus };
  return plots[index];
}

export function updatePlotBuildStatus(
  id: string,
  buildStatus: PlotBuildStatus,
) {
  const index = plots.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  const current = plots[index]!;
  const saleStatus: PlotSaleStatus = buildStatus === 'built' ? 'idle' : 'none';
  plots[index] = { ...current, buildStatus, saleStatus };
  return plots[index];
}

// ---------------------------------------------------------------- 摄像头（AI 监控点位）

export interface MockCamera {
  id: string;
  parkId: string;
  /** null = 园区公共区域（大门/停车场等） */
  sectionId: null | string;
  name: string;
  /** 相对所属墓区中心（或园区中心）的场景偏移 */
  offsetX: number;
  offsetZ: number;
  status: 'offline' | 'online';
  feature: string;
  createTime: string;
}

const cameras: MockCamera[] = [];

function seedCamera(data: Omit<MockCamera, 'createTime' | 'id'>) {
  const item: MockCamera = { ...data, id: createId(), createTime: now() };
  cameras.push(item);
  return item;
}

export function getCameras() {
  return cameras;
}

export function findCameraById(id: string) {
  return cameras.find((item) => item.id === id);
}

// ---------------------------------------------------------------- 统计

export interface ParkStats {
  parkId: string;
  totalSlots: number; // 格位总数（规划）
  unbuilt: number;
  building: number;
  built: number; // 墓位数（已建成）
  idle: number;
  reserved: number;
  sold: number;
  occupied: number;
  maintenance: number;
}

export function getParkStats(parkId: string): ParkStats {
  const result: ParkStats = {
    parkId,
    totalSlots: 0,
    unbuilt: 0,
    building: 0,
    built: 0,
    idle: 0,
    reserved: 0,
    sold: 0,
    occupied: 0,
    maintenance: 0,
  };
  for (const item of plots) {
    if (item.parkId !== parkId) {
      continue;
    }
    result.totalSlots += 1;
    if (item.buildStatus === 'unbuilt') {
      result.unbuilt += 1;
    } else if (item.buildStatus === 'building') {
      result.building += 1;
    } else if (item.buildStatus === 'built') {
      result.built += 1;
      if (item.saleStatus === 'idle') {
        result.idle += 1;
      } else if (item.saleStatus === 'reserved') {
        result.reserved += 1;
      } else if (item.saleStatus === 'sold') {
        result.sold += 1;
      } else if (item.saleStatus === 'occupied') {
        result.occupied += 1;
      } else if (item.saleStatus === 'maintenance') {
        result.maintenance += 1;
      }
    }
  }
  return result;
}

seedCemeteryData();

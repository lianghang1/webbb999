<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type {
  CemeteryParkStats,
  CemeteryPlot,
  CemeteryPlotType,
  CemeterySection,
} from '#/api/cemetery/types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NProgress,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpin,
  NSwitch,
  NTree,
} from 'naive-ui';

import {
  getParkStatsApi,
  getPlotListApi,
  getPlotTypeListApi,
  getSectionListApi,
} from '#/api';
import { useCemeteryStore } from '#/store';

import PlotDetailDrawer from './plot-detail-drawer.vue';
import PlotMarker from './plot-marker.vue';
import {
  BUILD_CELL,
  cellKey,
  LEGEND_KEYS,
  PRICE_TIER,
  SALE_CELL,
} from './plot-status';

defineOptions({ name: 'CemeteryPlotMap' });

const BAND_SIZE = 4; // 每 4 排之间留一条园区通道

const store = useCemeteryStore();
const router = useRouter();

function goParkView() {
  void router.push('/cemetery/park-view');
}

const loading = ref(false);
const sections = ref<CemeterySection[]>([]);
/** 整园格位缓存（树统计 / 墓区切换免请求） */
const parkPlots = ref<CemeteryPlot[]>([]);
const plots = ref<CemeteryPlot[]>([]);
const plotTypes = ref<CemeteryPlotType[]>([]);
const stats = ref<CemeteryParkStats | null>(null);
const selectedSection = ref<CemeterySection | null>(null);
const statusFilter = ref('');
const scale = ref(1);
/** 展示模式：图标（墓碑）/ 信息（状态）/ 价格 */
const viewMode = ref<'icon' | 'info' | 'price'>('icon');

const viewModeOptions = [
  { label: '图标', value: 'icon' },
  { label: '信息', value: 'info' },
  { label: '价格', value: 'price' },
];

const treeOptions = computed<TreeOption[]>(() => {
  // 每个墓区的直接格位数（用于树节点统计徽章，父节点含子孙合计）
  const ownCounts = new Map<string, number>();
  for (const plot of parkPlots.value) {
    ownCounts.set(plot.sectionId, (ownCounts.get(plot.sectionId) ?? 0) + 1);
  }
  function subtreeCount(sectionId: string): number {
    const own = ownCounts.get(sectionId) ?? 0;
    return sections.value
      .filter((item) => item.parentId === sectionId)
      .reduce((sum, child) => sum + subtreeCount(child.id), own);
  }
  const nodeMap = new Map<string, TreeOption & { section: CemeterySection }>();
  for (const section of sections.value) {
    const count = subtreeCount(section.id);
    nodeMap.set(section.id, {
      key: section.id,
      label: `${section.name}（${section.code}）· ${count}位`,
      section,
    });
  }
  const roots: TreeOption[] = [];
  for (const section of sections.value) {
    const node = nodeMap.get(section.id);
    if (!node) {
      continue;
    }
    const parent = section.parentId ? nodeMap.get(section.parentId) : undefined;
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
});

const plotTypeMap = computed(() => {
  const map = new Map<string, string>();
  for (const item of plotTypes.value) {
    map.set(item.id, item.name);
  }
  return map;
});

// ---- 布局模式：全部格位有坐标 → 坐标布局（不规则排布）；否则行列网格 ----
const coordinateMode = computed(() => {
  const list = plots.value;
  return (
    list.length > 0 &&
    list.every((p) => p.posX !== undefined && p.posY !== undefined)
  );
});

const COORD_SCALE = 42; // 坐标布局：1 米 = 42px

const coordExtent = computed(() => {
  if (!coordinateMode.value) {
    return null;
  }
  const xs = plots.value.map((p) => p.posX ?? 0);
  const ys = plots.value.map((p) => p.posY ?? 0);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    minX,
    minY,
    width: Math.max(...xs) - minX + 1.6,
    height: Math.max(...ys) - minY + 1.6,
  };
});

function coordPositionStyle(plot: CemeteryPlot): Record<string, string> {
  return {
    left: `${((plot.posX ?? 0) - (coordExtent.value?.minX ?? 0)) * COORD_SCALE + 24}px`,
    position: 'absolute',
    top: `${((plot.posY ?? 0) - (coordExtent.value?.minY ?? 0)) * COORD_SCALE + 24}px`,
  };
}

function isDimmedCoord(plot: CemeteryPlot): boolean {
  if (!filteredKeys.value) {
    return false;
  }
  return !filteredKeys.value.has(`${plot.row}-${plot.col}`);
}

const maxRow = computed(() => {
  let max = 0;
  for (const item of plots.value) {
    max = Math.max(max, item.row);
  }
  return max;
});

const maxCol = computed(() => {
  let max = 0;
  for (const item of plots.value) {
    max = Math.max(max, item.col);
  }
  return max;
});

const plotMap = computed(() => {
  const map = new Map<string, CemeteryPlot>();
  for (const item of plots.value) {
    map.set(`${item.row}-${item.col}`, item);
  }
  return map;
});

const filteredKeys = computed(() => {
  const keys = new Set<string>();
  if (!statusFilter.value) {
    return null;
  }
  for (const item of plots.value) {
    if (cellKey(item) === statusFilter.value) {
      keys.add(`${item.row}-${item.col}`);
    }
  }
  return keys;
});

function isDimmed(rowIndex: number, colIndex: number): boolean {
  return (
    !!filteredKeys.value && !filteredKeys.value.has(`${rowIndex}-${colIndex}`)
  );
}

/** 每 4 排分为一组，组间留通道 */
const rowBands = computed<number[][]>(() => {
  const bands: number[][] = [];
  for (let start = 1; start <= maxRow.value; start += BAND_SIZE) {
    const rows: number[] = [];
    for (
      let row = start;
      row < start + BAND_SIZE && row <= maxRow.value;
      row++
    ) {
      rows.push(row);
    }
    bands.push(rows);
  }
  return bands;
});

function getPlot(rowIndex: number, colIndex: number): CemeteryPlot | null {
  return plotMap.value.get(`${rowIndex}-${colIndex}`) ?? null;
}

const statBlocks = computed(() => {
  const statsData = stats.value;
  if (!statsData) {
    return [];
  }
  return [
    { color: '#7aa7ff', label: '规划格位', value: statsData.totalSlots },
    { color: '#8c8c8c', label: '未建', value: statsData.unbuilt },
    { color: '#fadb14', label: '在建', value: statsData.building },
    { color: '#63d463', label: '墓位（建成）', value: statsData.built },
    { color: '#52c41a', label: '可售', value: statsData.idle },
    { color: '#fa8c16', label: '已预订', value: statsData.reserved },
    { color: '#1677ff', label: '已售未安葬', value: statsData.sold },
    { color: '#a377e8', label: '已安葬', value: statsData.occupied },
    { color: '#f5222d', label: '维护中', value: statsData.maintenance },
  ];
});

const showPrice = ref(true);
/** 缩放过小时自动隐藏碑下价格牌，避免密集重叠 */
const showPriceEffective = computed(
  () => showPrice.value && scale.value >= 0.7,
);

const legendCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const item of plots.value) {
    const key = cellKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
});

const buildProgress = computed(() => {
  const statsData = stats.value;
  if (!statsData || statsData.totalSlots === 0) {
    return 0;
  }
  return Math.round((statsData.built / statsData.totalSlots) * 100);
});

const salesProgress = computed(() => {
  const statsData = stats.value;
  if (!statsData || statsData.built === 0) {
    return 0;
  }
  const sold = statsData.reserved + statsData.sold + statsData.occupied;
  return Math.round((sold / statsData.built) * 100);
});

const statusFilterOptions = [
  { label: '全部状态', value: '' },
  ...LEGEND_KEYS.map((key) => ({
    label: BUILD_CELL[key]?.label ?? SALE_CELL[key]?.label ?? key,
    value: key,
  })),
];

function toggleLegendFilter(key: string) {
  statusFilter.value = statusFilter.value === key ? '' : key;
}

function zoomIn() {
  scale.value = Math.min(2, Math.round((scale.value + 0.15) * 100) / 100);
}

function zoomOut() {
  scale.value = Math.max(0.5, Math.round((scale.value - 0.15) * 100) / 100);
}

function resetZoom() {
  scale.value = 1;
}

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: PlotDetailDrawer,
});

function firstLeafOption(options: TreeOption[]): null | TreeOption {
  for (const option of options) {
    if (option.children?.length) {
      const found = firstLeafOption(option.children as TreeOption[]);
      if (found) {
        return found;
      }
    } else {
      return option;
    }
  }
  return null;
}

async function loadAll() {
  loading.value = true;
  try {
    await store.ensureParks();
    const parkId = store.currentParkId;
    const [sectionList, plotList, statsData, typeList] = await Promise.all([
      getSectionListApi(parkId),
      getPlotListApi({ parkId }),
      getParkStatsApi(parkId),
      getPlotTypeListApi(),
    ]);
    sections.value = sectionList;
    parkPlots.value = plotList;
    stats.value = statsData;
    plotTypes.value = typeList;
    // 自动选中第一个叶子墓区
    selectedSection.value = null;
    plots.value = [];
    const leaf = firstLeafOption(treeOptions.value) as
      | null
      | (TreeOption & { section: CemeterySection });
    if (leaf) {
      await selectSection(leaf.section);
    }
  } finally {
    loading.value = false;
  }
}

async function selectSection(section: CemeterySection) {
  selectedSection.value = section;
  // 从整园缓存中过滤当前墓区（避免切换墓区时重复请求）
  plots.value = parkPlots.value.filter((item) => item.sectionId === section.id);
}

function onTreeSelect(keys: (number | string)[]) {
  const key = keys[0];
  if (!key) {
    return;
  }
  const node = sections.value.find((item) => item.id === key);
  if (!node) {
    return;
  }
  const isLeaf = !sections.value.some((item) => item.parentId === node.id);
  if (!isLeaf) {
    return;
  }
  void selectSection(node);
}

function openDetail(plot: CemeteryPlot) {
  detailDrawerApi.setData({
    onSuccess: async () => {
      if (selectedSection.value) {
        await selectSection(selectedSection.value);
      }
      stats.value = await getParkStatsApi(store.currentParkId);
    },
    plot: { ...plot },
    plotTypeName: plotTypeMap.value.get(plot.typeId) ?? plot.typeId,
  });
  detailDrawerApi.open();
}

onMounted(() => {
  void loadAll();
});

watch(
  () => store.currentParkId,
  () => void loadAll(),
);
</script>

<template>
  <Page title="格位总览">
    <div class="flex flex-col gap-3">
      <!-- 园区总览横幅（大屏风） -->
      <NCard class="stats-banner" size="small">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="stat-item">
            <div class="stat-num" style="color: #7aa7ff">
              {{ stats?.totalSlots ?? '-' }}
            </div>
            <div class="stat-label">规划格位</div>
          </div>
          <template v-for="block in statBlocks" :key="block.label">
            <div v-if="block.label !== '规划格位'" class="stat-item">
              <div class="stat-num" :style="{ color: block.color }">
                {{ block.value }}
              </div>
              <div class="stat-label">{{ block.label }}</div>
            </div>
          </template>
          <div class="min-w-[260px] flex-1">
            <div class="mb-1 flex items-center gap-2">
              <span class="w-14 shrink-0 text-xs opacity-60">建设进度</span>
              <NProgress
                class="flex-1"
                :height="7"
                :percentage="buildProgress"
                :show-indicator="false"
                type="line"
              />
              <span class="w-16 shrink-0 text-right text-xs opacity-70">
                {{ stats?.built ?? 0 }}/{{ stats?.totalSlots ?? 0 }} 座
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-14 shrink-0 text-xs opacity-60">销售进度</span>
              <NProgress
                class="flex-1"
                :height="7"
                :percentage="salesProgress"
                :show-indicator="false"
                type="line"
              />
              <span class="w-16 shrink-0 text-right text-xs opacity-70">
                {{
                  (stats?.reserved ?? 0) +
                  (stats?.sold ?? 0) +
                  (stats?.occupied ?? 0)
                }}/{{ stats?.built ?? 0 }} 座
              </span>
            </div>
          </div>
        </div>
      </NCard>

      <div class="flex gap-3">
        <NCard
          content-style="height: 600px; overflow: auto;"
          size="small"
          style="flex-shrink: 0; width: 260px"
          title="墓区"
        >
          <NSpin :show="loading">
            <NTree
              block-line
              :data="treeOptions"
              default-expand-all
              key-field="key"
              label-field="label"
              children-field="children"
              :selected-keys="selectedSection ? [selectedSection.id] : []"
              @update:selected-keys="onTreeSelect"
            />
          </NSpin>
        </NCard>

        <NCard
          content-style="height: 600px; overflow: auto;"
          size="small"
          style="flex: 1 1 0; min-width: 0"
        >
          <template #header>
            {{
              selectedSection
                ? `墓区：${selectedSection.name}（${selectedSection.code}）`
                : '请选择最末级墓区'
            }}
          </template>
          <template #header-extra>
            <div class="flex items-center gap-2">
              <NButton size="small" type="primary" @click="goParkView">
                3D 导览
              </NButton>
              <NRadioGroup v-model:value="viewMode" size="small">
                <NRadioButton
                  v-for="opt in viewModeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </NRadioGroup>
              <NSelect
                v-model:value="statusFilter"
                :options="statusFilterOptions"
                placeholder="状态筛选"
                size="small"
                style="width: 140px"
              />
              <NButtonGroup size="small">
                <NButton :disabled="scale <= 0.5" @click="zoomOut">－</NButton>
                <NButton @click="resetZoom">
                  {{ Math.round(scale * 100) }}%
                </NButton>
                <NButton :disabled="scale >= 2" @click="zoomIn">＋</NButton>
              </NButtonGroup>
            </div>
          </template>

          <!-- 图例（可点击筛选）+ 价格档位 + 价格开关 -->
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <div
              v-for="key in LEGEND_KEYS"
              :key="key"
              class="legend-pill"
              :class="{ active: statusFilter === key }"
              :style="{
                borderColor: `${BUILD_CELL[key]?.bg ?? SALE_CELL[key]?.bg}55`,
                background:
                  statusFilter === key
                    ? `${BUILD_CELL[key]?.bg ?? SALE_CELL[key]?.bg}30`
                    : '#ffffff',
              }"
              @click="toggleLegendFilter(key)"
            >
              <span
                class="inline-block h-2.5 w-2.5 rounded-sm"
                :style="{
                  background: BUILD_CELL[key]?.bg ?? SALE_CELL[key]?.bg,
                }"
              ></span>
              <span class="text-xs">
                {{ BUILD_CELL[key]?.label ?? SALE_CELL[key]?.label }}
              </span>
              <span class="text-[11px] opacity-60">
                {{ legendCounts[key] ?? 0 }}
              </span>
            </div>

            <span class="mx-1 opacity-25">|</span>

            <div
              v-for="(tier, tierKey) in PRICE_TIER"
              :key="tierKey"
              class="legend-pill"
              style="cursor: default"
            >
              <span
                class="inline-block h-2.5 w-2.5 rounded-full"
                :style="{ background: tier.color }"
              ></span>
              <span class="text-xs opacity-75">{{ tier.label }}</span>
            </div>

            <div
              v-if="viewMode === 'icon'"
              class="ml-auto flex items-center gap-1.5"
            >
              <span class="text-xs opacity-60">价格牌</span>
              <NSwitch v-model:value="showPrice" size="small" />
            </div>
          </div>

          <NSpin :show="loading">
            <!-- 坐标布局模式（不规则排布，如弧形生态葬） -->
            <div
              v-if="selectedSection && coordinateMode && coordExtent"
              class="map-viewport"
            >
              <div
                class="map-canvas"
                :style="{
                  transform: `scale(${scale})`,
                  width: `${coordExtent.width * COORD_SCALE + 48}px`,
                  height: `${coordExtent.height * COORD_SCALE + 48}px`,
                }"
              >
                <PlotMarker
                  v-for="plot in plots"
                  :key="plot.id"
                  :dimmed="isDimmedCoord(plot)"
                  :plot="plot"
                  :plot-type-name="plotTypeMap.get(plot.typeId) ?? '-'"
                  :position-style="coordPositionStyle(plot)"
                  :rotate="plot.rotation ?? 0"
                  :show-price="viewMode === 'icon' && showPriceEffective"
                  :view-mode="viewMode"
                  @click="openDetail(plot)"
                />
              </div>
            </div>
            <!-- 行列网格模式 -->
            <div v-else-if="selectedSection && maxRow > 0" class="map-viewport">
              <div class="map-canvas" :style="{ transform: `scale(${scale})` }">
                <!-- 列标尺 -->
                <div class="map-row">
                  <div class="row-ruler"></div>
                  <div
                    v-for="colIndex in maxCol"
                    :key="`col-${colIndex}`"
                    class="col-ruler"
                  >
                    {{ colIndex }}
                  </div>
                </div>
                <!-- 分组行（组间为园区通道） -->
                <div
                  v-for="(band, bandIndex) in rowBands"
                  :key="`band-${bandIndex}`"
                  class="map-band"
                  :class="{ 'map-band--road': bandIndex > 0 }"
                >
                  <div
                    v-for="rowIndex in band"
                    :key="`row-${rowIndex}`"
                    class="map-row"
                  >
                    <div class="row-ruler">{{ rowIndex }} 排</div>
                    <template
                      v-for="colIndex in maxCol"
                      :key="`${rowIndex}-${colIndex}`"
                    >
                      <PlotMarker
                        v-if="getPlot(rowIndex, colIndex)"
                        :dimmed="isDimmed(rowIndex, colIndex)"
                        :plot="getPlot(rowIndex, colIndex) as CemeteryPlot"
                        :plot-type-name="
                          plotTypeMap.get(
                            getPlot(rowIndex, colIndex)?.typeId ?? '',
                          ) ?? '-'
                        "
                        :show-price="viewMode === 'icon' && showPriceEffective"
                        :view-mode="viewMode"
                        @click="
                          openDetail(
                            getPlot(rowIndex, colIndex) as CemeteryPlot,
                          )
                        "
                      />
                      <div v-else class="plot-slot plot-slot--empty"></div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="py-16 text-center opacity-50">
              请在左侧选择最末级墓区查看格位
            </div>
          </NSpin>
        </NCard>
      </div>
    </div>
    <DetailDrawer />
  </Page>
</template>

<style scoped>
.stats-banner {
  background: linear-gradient(120deg, #f0f5ff 0%, #e6f4ff 100%);
  border: 1px solid #d6e4ff;
  border-radius: 12px;
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.stat-label {
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
}

.legend-pill {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 3px 10px;
  cursor: pointer;
  user-select: none;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
  transition: background 0.15s ease;
}

.legend-pill.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.map-viewport {
  max-height: 560px;
  overflow: auto;
  background: #fafafa;
  border-radius: 10px;
}

.map-canvas {
  position: relative;
  display: inline-block;
  min-width: 100%;
  padding: 16px;
  background:
    linear-gradient(rgb(0 0 0 / 2%) 1px, transparent 1px) 0 0 / 100% 22px,
    linear-gradient(90deg, rgb(0 0 0 / 2%) 1px, transparent 1px) 0 0 / 22px 100%,
    #fafbfc;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transform-origin: top left;
}

.map-row {
  display: flex;
  gap: 3px;
  align-items: flex-start;
  margin-bottom: 3px;
}

.map-band--road {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1.5px solid #d9d9d9;
}

.row-ruler {
  flex-shrink: 0;
  width: 34px;
  font-size: 10px;
  line-height: 48px;
  color: #8c8c8c;
  text-align: center;
  user-select: none;
  opacity: 0.45;
}

.col-ruler {
  flex-shrink: 0;
  width: 56px;
  font-size: 10px;
  color: #8c8c8c;
  text-align: center;
  user-select: none;
  opacity: 0.45;
}

.plot-slot {
  position: relative;
  z-index: 0;
  width: 56px;
  height: 48px;
  cursor: pointer;
  border-radius: 5px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.plot-slot:hover {
  z-index: 2;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  transform: translateY(-1px);
}

.plot-slot--dimmed {
  opacity: 0.15;
}

.plot-slot--empty {
  cursor: default;
  background: repeating-conic-gradient(#fafafa 0% 25%, transparent 0% 50%);
  border: 1px dashed #d9d9d9;
}
</style>

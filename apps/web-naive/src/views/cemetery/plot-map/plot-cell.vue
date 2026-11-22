<script lang="ts" setup>
import type { CemeteryPlot } from '#/api/cemetery/types';

import { computed } from 'vue';

import { cellColor, priceWan } from './plot-status';

/**
 * 格位图形组件（原创设计）：
 * - 图标模式：统一几何墓碑（拱顶碑身 + 碑顶圆章 + 刻字条 + 底座），
 *   填充色 = 流转状态，刻字条数量 = 穴数。
 * - 信息模式：状态柔和底块 + 编号 + 状态文案。
 * - 价格模式：状态柔和底块 + 价格（万元）+ 编号。
 */
const props = withDefaults(
  defineProps<{
    plot: CemeteryPlot;
    /** 展示模式：图标（墓碑）/ 信息（状态文字）/ 价格 */
    viewMode?: 'icon' | 'info' | 'price';
  }>(),
  { viewMode: 'icon' },
);

/** 状态 → 碑身填充色（自配色板，中饱和度保证白色刻字条可读） */
const FILL: Record<string, string> = {
  idle: '#51cf66',
  reserved: '#ffa94d',
  sold: '#4dabf7',
  occupied: '#9775fa',
  maintenance: '#ff6b6b',
  building: '#fcc419',
};

const cellKey = computed(() => {
  if (props.plot.buildStatus === 'unbuilt') {
    return 'unbuilt';
  }
  if (props.plot.buildStatus === 'building') {
    return 'building';
  }
  return props.plot.saleStatus === 'none' ? 'idle' : props.plot.saleStatus;
});

const fill = computed(() => FILL[cellKey.value] ?? '#adb5bd');
const isUnbuilt = computed(() => cellKey.value === 'unbuilt');
const statusColor = computed(() => cellColor(props.plot));

/** 刻字条数量 = 穴数（单穴 1 / 双穴 2 / 多穴 3） */
const barCount = computed(() => {
  const n = Number(props.plot.cryptCount ?? 1);
  if (n >= 4) return 3;
  if (n === 2) return 2;
  return 1;
});

/** 刻字条 y 坐标（1/2/3 条三种排布） */
const BAR_Y: Record<number, number[]> = {
  1: [16.5],
  2: [14.5, 18.5],
  3: [13, 16.5, 20],
};

const priceText = computed(() => {
  const wan = priceWan(props.plot.price);
  return wan ?? '未定价';
});
</script>

<template>
  <div
    class="plot-cell"
    :class="[
      { 'plot-cell--unbuilt': isUnbuilt },
      viewMode !== 'icon' ? 'plot-cell--block' : '',
    ]"
    :style="
      viewMode !== 'icon' && !isUnbuilt
        ? {
            background: `${statusColor.bg}1f`,
            borderColor: statusColor.bg,
          }
        : undefined
    "
  >
    <!-- 未建：虚线空地 -->
    <div v-if="isUnbuilt" class="unbuilt-box">
      <span class="unbuilt-text">
        {{ viewMode === 'price' ? '—' : '未建' }}
      </span>
    </div>

    <!-- 图标模式：统一几何墓碑图标 -->
    <template v-else-if="viewMode === 'icon'">
      <svg class="tombstone" viewBox="0 0 28 30">
        <!-- 底座 -->
        <rect
          fill="rgba(0,0,0,0.22)"
          height="3"
          rx="1"
          width="20"
          x="4"
          y="26.5"
        />
        <!-- 碑身（拱顶几何形） -->
        <path
          :fill="fill"
          d="M 7 26.5 L 7 9.5 Q 7 4 14 4 Q 21 4 21 9.5 L 21 26.5 Z"
        />
        <!-- 碑顶圆章（装饰性雕章） -->
        <circle cx="14" cy="9.5" fill="rgba(255,255,255,0.45)" r="1.9" />
        <!-- 刻字条（数量 = 穴数） -->
        <rect
          v-for="(y, i) in BAR_Y[barCount]"
          :key="i"
          fill="rgba(255,255,255,0.55)"
          height="1.8"
          rx="0.9"
          width="10"
          x="9"
          :y="y"
        />
      </svg>
      <span class="plot-code">{{ plot.row }}-{{ plot.col }}</span>
    </template>

    <!-- 信息模式：编号 + 状态文案 -->
    <template v-else-if="viewMode === 'info'">
      <span class="block-code">{{ plot.row }}-{{ plot.col }}</span>
      <span class="block-sub" :style="{ color: statusColor.text }">
        {{ statusColor.label }}
      </span>
    </template>

    <!-- 价格模式：价格 + 编号 -->
    <template v-else>
      <span class="block-code" :style="{ color: '#e8590c' }">
        {{ priceText }}
      </span>
      <span class="block-sub">{{ plot.row }}-{{ plot.col }}</span>
    </template>
  </div>
</template>

<style scoped>
.plot-cell {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 48px;
  overflow: hidden;
  cursor: pointer;
  border-style: solid;
  border-width: 0;
  border-radius: 5px;
}

.plot-cell--block {
  border-width: 1.5px;
}

.plot-cell--unbuilt {
  cursor: default;
  border: 1.5px dashed #ced4da;
}

.tombstone {
  display: block;
  width: 28px;
  height: 30px;
}

.plot-code {
  margin-top: 1px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  color: #495057;
  user-select: none;
}

.block-code {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  user-select: none;
}

.block-sub {
  margin-top: 1px;
  font-size: 10px;
  line-height: 1.2;
  user-select: none;
  opacity: 0.85;
}

.unbuilt-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.unbuilt-text {
  font-size: 10px;
  color: #adb5bd;
  user-select: none;
}
</style>

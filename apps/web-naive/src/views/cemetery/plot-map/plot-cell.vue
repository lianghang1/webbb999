<script lang="ts" setup>
import type { CemeteryPlot } from '#/api/cemetery/types';

import { computed } from 'vue';

/**
 * 格位图形组件（融合版）：
 * - 底块 = 流转状态柔和色（信息主通道，参照专业系统的色块+编号语言）
 * - 碑影 = 统一半透明白色墓碑剪影（小、恒定，不随状态变化）
 * - 编号 = 排-号（底部深色文字）
 * - 建造状态：未建 = 无底色虚线地块（无碑影无编号）；在建 = 底块加工地斜纹；
 *   建成 = 实底
 * 渐变定义在 index.vue 全局 defs（grad-soft-*）。
 */
const props = defineProps<{ plot: CemeteryPlot }>();

/** 底块柔和色（流转状态） */
const SOFT_COLORS: Record<string, [string, string]> = {
  idle: ['#d9f4df', '#a9e2b6'],
  maintenance: ['#ffdcdc', '#ffadad'],
  occupied: ['#e8dcff', '#c3adff'],
  reserved: ['#ffedd4', '#ffc591'],
  sold: ['#dbeeff', '#91c9f5'],
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

const softFill = computed(() => {
  const pair = SOFT_COLORS[cellKey.value];
  return pair ? `url(#grad-soft-${cellKey.value})` : 'transparent';
});

const statusText = computed(() => {
  if (cellKey.value === 'building') {
    return '建';
  }
  if (cellKey.value === 'unbuilt') {
    return '';
  }
  // 已售/已安葬 用「售/葬」区分流转深度
  if (cellKey.value === 'sold') {
    return '售';
  }
  if (cellKey.value === 'occupied') {
    return '葬';
  }
  if (cellKey.value === 'maintenance') {
    return '维';
  }
  if (cellKey.value === 'reserved') {
    return '订';
  }
  return '售';
});
</script>

<template>
  <svg class="plot-svg" viewBox="0 0 56 52">
    <!-- 未建：虚线空地块 -->
    <template v-if="cellKey === 'unbuilt'">
      <rect
        fill="transparent"
        height="44"
        rx="4"
        stroke="#868e96"
        stroke-dasharray="5 4"
        stroke-width="1.2"
        width="48"
        x="4"
        y="4"
      />
      <rect
        fill="#868e96"
        height="3"
        opacity="0.4"
        rx="1.2"
        width="10"
        x="23"
        y="24"
      />
    </template>

    <template v-else>
      <!-- 底块：流转状态柔和色 -->
      <rect
        :fill="softFill"
        height="44"
        rx="5"
        stroke="rgba(0,0,0,0.14)"
        stroke-width="0.8"
        width="48"
        x="4"
        y="4"
      />
      <!-- 在建：工地斜纹叠加 -->
      <rect
        v-if="cellKey === 'building'"
        fill="url(#plot-stripes)"
        height="44"
        opacity="0.55"
        rx="5"
        width="48"
        x="4"
        y="4"
      />
      <!-- 统一碑影（白色半透明剪影，不随状态变化） -->
      <g fill="rgba(255,255,255,0.6)">
        <rect height="3" rx="1" width="16" x="20" y="30" />
        <rect height="2.6" rx="1" width="13" x="21.5" y="27" />
        <path d="M24 27 L24 15.5 Q24 11.5 28 11.5 Q32 11.5 32 15.5 L32 27 Z" />
        <rect height="1.8" rx="0.9" width="6" x="25" y="14.5" />
        <rect height="1.8" rx="0.9" width="6" x="25" y="17.5" />
      </g>
      <!-- 状态字角标（右上，小） -->
      <text
        fill="rgba(0,0,0,0.45)"
        font-size="9"
        font-weight="bold"
        text-anchor="middle"
        x="46"
        y="13"
      >
        {{ statusText }}
      </text>
      <!-- 编号（排-号） -->
      <text
        fill="rgba(20, 30, 50, 0.72)"
        font-size="11"
        font-weight="600"
        text-anchor="middle"
        x="28"
        y="45"
      >
        {{ plot.row }}-{{ plot.col }}
      </text>
    </template>
  </svg>
</template>

<style scoped>
.plot-svg {
  display: block;
  width: 56px;
  height: 52px;
}
</style>

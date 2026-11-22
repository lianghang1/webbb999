<script lang="ts" setup>
import type { CemeteryPlot } from '#/api/cemetery/types';

import { NPopover, NTag } from 'naive-ui';

import { cryptCountLabel } from '#/api';

import PlotCell from './plot-cell.vue';
import { cellColor, priceWan, statusTagType } from './plot-status';

/**
 * 格位标记：石碑图形 + 价格牌（可选）+ hover 信息卡（玻璃拟态）。
 * 网格模式走文档流；坐标模式通过 positionStyle 传 left/top 绝对定位。
 */
defineProps<{
  dimmed?: boolean;
  plot: CemeteryPlot;
  plotTypeName?: string;
  /** 坐标布局模式的附加定位样式 */
  positionStyle?: Record<string, string>;
  /** 是否显示碑下价格牌（缩放过小时由父级自动隐藏） */
  showPrice?: boolean;
  /** 朝向旋转（度） */
  rotate?: number;
}>();

const emit = defineEmits<{ click: [] }>();

const GLASS_STYLE = {
  background: 'rgba(16, 24, 38, 0.88)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(120, 180, 255, 0.28)',
  borderRadius: '10px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
};
</script>

<template>
  <NPopover :content-style="GLASS_STYLE" placement="top" trigger="hover">
    <template #trigger>
      <div
        class="plot-slot"
        :class="{ 'plot-slot--dimmed': dimmed }"
        :style="positionStyle"
        @click="emit('click')"
      >
        <div
          class="plot-marker-inner"
          :style="rotate ? { transform: `rotate(${rotate}deg)` } : undefined"
        >
          <PlotCell :plot="plot" />
        </div>
        <div v-if="showPrice && plot.price" class="price-badge">
          {{ priceWan(plot.price) }}
        </div>
      </div>
    </template>
    <div class="w-56">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm font-semibold">{{ plot.code }}</span>
        <NTag :bordered="false" size="small" :type="statusTagType(plot)">
          {{ cellColor(plot).label }}
        </NTag>
      </div>
      <div class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 opacity-80">
        <span>墓型</span>
        <span>{{ plotTypeName ?? '-' }}</span>
        <span>穴数</span>
        <span>{{ cryptCountLabel(plot.cryptCount) }}</span>
        <span>位置</span>
        <span>第 {{ plot.row }} 排 / 第 {{ plot.col }} 号</span>
        <template v-if="plot.posX !== undefined && plot.posY !== undefined">
          <span>坐标</span>
          <span>X {{ plot.posX }} / Y {{ plot.posY }}</span>
        </template>
        <template v-if="plot.area">
          <span>占地</span>
          <span>{{ plot.area }} ㎡</span>
        </template>
        <template v-if="plot.price">
          <span>参考价</span>
          <span>￥{{ plot.price }}</span>
        </template>
      </div>
      <div
        class="mt-2 pt-1.5 text-right text-[10px] opacity-50"
        style="border-top: 1px solid rgb(128 128 128 / 30%)"
      >
        点击查看详情与操作
      </div>
    </div>
  </NPopover>
</template>

<style scoped>
.plot-slot {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.plot-slot:hover {
  z-index: 2;
  box-shadow: 0 6px 14px rgb(0 0 0 / 35%);
  transform: translateY(-2px) scale(1.08);
}

.plot-slot--dimmed {
  opacity: 0.18;
}

.plot-marker-inner {
  display: block;
}

.price-badge {
  padding: 1px 4px;
  margin-top: 1px;
  font-size: 10px;
  line-height: 1.25;
  color: #ffd54a;
  white-space: nowrap;
  background: rgb(10 18 30 / 72%);
  border: 1px solid rgb(255 213 74 / 32%);
  border-radius: 4px;
}
</style>

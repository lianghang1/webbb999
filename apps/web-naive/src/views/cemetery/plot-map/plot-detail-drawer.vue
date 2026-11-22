<script lang="ts" setup>
import type { CemeteryPlot } from '#/api/cemetery/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NButton, NDescriptions, NDescriptionsItem, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { cryptCountLabel, updatePlotBuildStatusApi } from '#/api';

defineOptions({ name: 'PlotDetailDrawer' });

interface DrawerData {
  onSuccess?: () => Promise<void> | void;
  plot: CemeteryPlot;
  plotTypeName?: string;
}

const BUILD_LABELS: Record<string, string> = {
  built: '已建成',
  building: '在建',
  unbuilt: '未建',
};

const SALE_LABELS: Record<string, string> = {
  idle: '可售',
  maintenance: '维护中',
  none: '—',
  occupied: '已安葬',
  reserved: '已预订',
  sold: '已售未安葬',
};

const plot = ref<CemeteryPlot | null>(null);
const plotTypeName = ref('');
const onSuccessRef = ref<(() => Promise<void> | void) | null>(null);

const [Drawer, drawerApi] = useVbenDrawer<DrawerData>({
  class: 'w-[420px]',
  footer: false,
  title: '格位详情',
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = drawerApi.getData();
    plot.value = data?.plot ?? null;
    plotTypeName.value = data?.plotTypeName ?? '';
    onSuccessRef.value = data?.onSuccess ?? null;
  },
});

async function setBuildStatus(buildStatus: 'building' | 'built') {
  if (!plot.value) {
    return;
  }
  const updated = await updatePlotBuildStatusApi(plot.value.id, buildStatus);
  message.success(
    buildStatus === 'building' ? '已转为在建' : '已竣工验收（转为建成）',
  );
  plot.value = updated;
  drawerApi.close();
  await onSuccessRef.value?.();
}
</script>

<template>
  <Drawer>
    <NDescriptions v-if="plot" bordered :column="1" size="small">
      <NDescriptionsItem label="格位编号">
        {{ plot.code }}
      </NDescriptionsItem>
      <NDescriptionsItem label="位置">
        第 {{ plot.row }} 排 / 第 {{ plot.col }} 号
      </NDescriptionsItem>
      <NDescriptionsItem label="规划墓型">
        {{ plotTypeName || '-' }}
      </NDescriptionsItem>
      <NDescriptionsItem label="穴数">
        {{ cryptCountLabel(plot.cryptCount) }}
      </NDescriptionsItem>
      <NDescriptionsItem v-if="plot.posX !== undefined" label="布局坐标">
        X {{ plot.posX }} / Y {{ plot.posY }}
        <span v-if="plot.rotation" class="opacity-50">
          （朝向 {{ plot.rotation }}°）
        </span>
      </NDescriptionsItem>
      <NDescriptionsItem label="建造状态">
        <NTag
          size="small"
          :type="
            plot.buildStatus === 'built'
              ? 'success'
              : plot.buildStatus === 'building'
                ? 'warning'
                : 'default'
          "
        >
          {{ BUILD_LABELS[plot.buildStatus] ?? plot.buildStatus }}
        </NTag>
      </NDescriptionsItem>
      <NDescriptionsItem label="流转状态">
        <NTag v-if="plot.saleStatus !== 'none'" size="small" type="info">
          {{ SALE_LABELS[plot.saleStatus] ?? plot.saleStatus }}
        </NTag>
        <span v-else class="opacity-50">尚未建成，未进入流转</span>
      </NDescriptionsItem>
      <NDescriptionsItem v-if="plot.area" label="占地面积">
        {{ plot.area }} ㎡
      </NDescriptionsItem>
      <NDescriptionsItem v-if="plot.price" label="参考价">
        ￥{{ plot.price }}
      </NDescriptionsItem>
    </NDescriptions>

    <div class="mt-4 flex gap-2">
      <NButton
        v-if="plot?.buildStatus === 'unbuilt'"
        size="small"
        type="warning"
        @click="setBuildStatus('building')"
      >
        开始施工（转为在建）
      </NButton>
      <NButton
        v-if="plot?.buildStatus === 'building'"
        size="small"
        type="primary"
        @click="setBuildStatus('built')"
      >
        竣工验收（转为建成）
      </NButton>
      <span
        v-if="plot?.buildStatus === 'built'"
        class="self-center text-xs opacity-50"
      >
        已建成，销售/安葬流转将在后续阶段接入
      </span>
    </div>
  </Drawer>
</template>

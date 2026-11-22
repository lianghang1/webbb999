<script lang="ts" setup>
import type { PlotArchive } from '#/api/cemetery/biz';
import type { CemeteryPlot } from '#/api/cemetery/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSpin,
  NTag,
  NTimeline,
  NTimelineItem,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  cryptCountLabel,
  getPlotArchiveApi,
  updatePlotBuildStatusApi,
} from '#/api';

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

const PAY_METHOD: Record<string, string> = {
  alipay: '支付宝',
  bank: '银行转账',
  cash: '现金',
  wechat: '微信支付',
};

const plot = ref<CemeteryPlot | null>(null);
const plotTypeName = ref('');
const archive = ref<null | PlotArchive>(null);
const onSuccessRef = ref<(() => Promise<void> | void) | null>(null);
const loading = ref(false);

const [Drawer, drawerApi] = useVbenDrawer<DrawerData>({
  class: 'w-[480px]',
  footer: false,
  title: '格位档案',
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = drawerApi.getData();
    plot.value = data?.plot ?? null;
    plotTypeName.value = data?.plotTypeName ?? '';
    onSuccessRef.value = data?.onSuccess ?? null;
    if (!plot.value) {
      return;
    }
    loading.value = true;
    try {
      archive.value = await getPlotArchiveApi(plot.value.id);
    } finally {
      loading.value = false;
    }
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
    <NSpin v-if="loading" class="py-10" />
    <template v-else-if="plot">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <NDescriptions bordered :column="2" size="small">
        <NDescriptionsItem :span="2" label="格位编号">
          {{ plot.code }}
        </NDescriptionsItem>
        <NDescriptionsItem label="位置">
          第 {{ plot.row }} 排 / 第 {{ plot.col }} 号
        </NDescriptionsItem>
        <NDescriptionsItem label="穴数">
          {{ cryptCountLabel(plot.cryptCount) }}
        </NDescriptionsItem>
        <NDescriptionsItem label="规划墓型">
          {{ plotTypeName || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="plot.area" label="占地面积">
          {{ plot.area }} ㎡
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
          <NTag
            size="small"
            :type="
              plot.saleStatus === 'idle'
                ? 'success'
                : plot.saleStatus === 'none'
                  ? 'default'
                  : 'info'
            "
          >
            {{ SALE_LABELS[plot.saleStatus] ?? plot.saleStatus }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="plot.price" :span="2" label="参考价">
          ￥{{ plot.price }}
        </NDescriptionsItem>
      </NDescriptions>

      <!-- 购墓订单 -->
      <div class="section-title">购墓订单</div>
      <NDescriptions
        v-if="archive?.sale && archive?.customer"
        bordered
        :column="2"
        size="small"
      >
        <NDescriptionsItem :span="2" label="订单号">
          {{ archive.sale.orderNo }}
          <NTag class="ml-1" size="tiny" type="info">
            {{ archive.sale.status === 'signed' ? '已签约' : '已预订' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="申请人">
          {{ archive.customer.name }}
        </NDescriptionsItem>
        <NDescriptionsItem label="联系电话">
          {{ archive.customer.phone }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="archive.sale.contractNo" label="合同号">
          {{ archive.sale.contractNo }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="archive.sale.signedAt" label="签约时间">
          {{ archive.sale.signedAt }}
        </NDescriptionsItem>
        <NDescriptionsItem label="应收金额">
          ￥{{ archive.sale.totalAmount || archive.sale.deposit }}
        </NDescriptionsItem>
        <NDescriptionsItem label="已收金额">
          ￥{{ archive.sale.paidAmount }}
        </NDescriptionsItem>
      </NDescriptions>
      <div v-else class="archive-empty">
        {{
          plot.saleStatus === 'none' ? '未建格位，尚未进入流转' : '暂无购墓订单'
        }}
      </div>

      <!-- 收款记录 -->
      <template v-if="archive?.payments?.length">
        <div class="section-title">收款记录</div>
        <NTimeline>
          <NTimelineItem
            v-for="pay in archive.payments"
            :key="pay.id"
            :title="`￥${pay.amount} · ${PAY_METHOD[pay.method] ?? pay.method}`"
            :subtitle="`收据 ${pay.receiptNo}`"
            :time="pay.paidAt"
            type="success"
          />
        </NTimeline>
      </template>

      <!-- 使用人档案 -->
      <div class="section-title">使用人（逝者）</div>
      <NDescriptions v-if="archive?.deceased" bordered :column="2" size="small">
        <NDescriptionsItem :span="2" label="姓名">
          {{ archive.deceased.name }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="archive.deceased.birthDate" label="出生">
          {{ archive.deceased.birthDate }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="archive.deceased.deathDate" label="逝世">
          {{ archive.deceased.deathDate }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="archive?.burial" :span="2" label="安葬证号">
          {{ archive.burial.certificateNo }}
          <NTag
            class="ml-1"
            size="tiny"
            :type="
              archive.burial.status === 'completed' ? 'success' : 'warning'
            "
          >
            {{ archive.burial.status === 'completed' ? '已安葬' : '预约中' }}
          </NTag>
        </NDescriptionsItem>
      </NDescriptions>
      <div v-else class="archive-empty">暂无使用人信息</div>

      <!-- 维护费记录 -->
      <div class="section-title">维护费缴纳记录</div>
      <template v-if="archive?.maintenanceFees?.length">
        <NTimeline>
          <NTimelineItem
            v-for="fee in archive.maintenanceFees"
            :key="fee.id"
            :title="`￥${fee.amount} · 管理周期 ${fee.cycleYears} 年`"
            :subtitle="`收据 ${fee.receiptNo}`"
            :time="fee.paidAt"
            type="info"
          />
        </NTimeline>
      </template>
      <div v-else class="archive-empty">暂无缴纳记录</div>

      <!-- 操作 -->
      <div class="mt-4 flex gap-2">
        <NButton
          v-if="plot.buildStatus === 'unbuilt'"
          size="small"
          type="warning"
          @click="setBuildStatus('building')"
        >
          开始施工（转为在建）
        </NButton>
        <NButton
          v-if="plot.buildStatus === 'building'"
          size="small"
          type="primary"
          @click="setBuildStatus('built')"
        >
          竣工验收（转为建成）
        </NButton>
        <span
          v-if="plot.buildStatus === 'built'"
          class="self-center text-xs opacity-50"
        >
          销售/安葬流转请前往对应业务模块办理
        </span>
      </div>
    </template>
    <NEmpty v-else description="未选中格位" />
  </Drawer>
</template>

<style scoped>
.section-title {
  padding-left: 8px;
  margin: 14px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #18a058;
  border-left: 3px solid #18a058;
}

.section-title:first-child {
  margin-top: 0;
}

.archive-empty {
  padding: 10px 0;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  background: #fafafa;
  border-radius: 6px;
}
</style>

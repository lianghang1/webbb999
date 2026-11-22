<script lang="ts" setup>
import type { PlotArchive } from '#/api/cemetery/biz';
import type { CemeteryPlot } from '#/api/cemetery/types';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NButton, NSpin } from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  cryptCountLabel,
  getPlotArchiveApi,
  updatePlotBuildStatusApi,
} from '#/api';

import { cellColor } from './plot-status';

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
  class: 'w-[520px]',
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

const status = computed(() => (plot.value ? cellColor(plot.value) : null));

/** 档案头横幅：状态色低透明渐变，与图例颜色同源 */
const bannerStyle = computed(() => {
  const c = status.value;
  if (!c) return {};
  return {
    background: `linear-gradient(118deg, ${c.bg}24, ${c.bg}0d 62%)`,
    borderColor: `${c.bg}38`,
  };
});

const statusChipStyle = computed(() => ({
  background: status.value?.bg ?? '#8c8c8c',
}));

/** 主状态标签：未建成显示建造状态，已建成显示流转状态 */
const primaryLabel = computed(() => {
  const p = plot.value;
  if (!p) return '';
  if (p.buildStatus !== 'built') {
    return BUILD_LABELS[p.buildStatus] ?? p.buildStatus;
  }
  return SALE_LABELS[p.saleStatus] ?? '可售';
});

const sale = computed(() => archive.value?.sale);
const paidRatio = computed(() => {
  const s = sale.value;
  if (!s || !s.totalAmount) return 0;
  return Math.min(100, Math.round((s.paidAmount / s.totalAmount) * 100));
});
const paidSettled = computed(() => {
  const s = sale.value;
  return !!s && s.totalAmount > 0 && s.paidAmount >= s.totalAmount;
});

function money(n?: number) {
  return n === undefined || n === null ? '—' : `¥${n.toLocaleString('zh-CN')}`;
}

function datePart(s?: string) {
  return s?.split(' ')[0] ?? '';
}

function timePart(s?: string) {
  return s?.split(' ')[1] ?? '';
}

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
    <NSpin :show="loading">
      <template v-if="plot">
        <!-- 档案头：状态色横幅 + 统一墓碑图形 -->
        <div class="head" :style="bannerStyle">
          <svg class="head-tomb" viewBox="0 0 28 30">
            <rect
              fill="rgba(0,0,0,0.22)"
              height="3"
              rx="1"
              width="20"
              x="4"
              y="26.5"
            />
            <path
              :fill="status?.bg"
              d="M 7 26.5 L 7 9.5 Q 7 4 14 4 Q 21 4 21 9.5 L 21 26.5 Z"
            />
            <circle cx="14" cy="9.5" fill="rgba(255,255,255,0.45)" r="1.9" />
            <rect
              fill="rgba(255,255,255,0.55)"
              height="1.8"
              rx="0.9"
              width="10"
              x="9"
              y="14.5"
            />
            <rect
              fill="rgba(255,255,255,0.55)"
              height="1.8"
              rx="0.9"
              width="10"
              x="9"
              y="18.5"
            />
          </svg>
          <div class="head-main">
            <div class="head-code">
              <span class="code">{{ plot.code }}</span>
              <span class="chip" :style="statusChipStyle">
                {{ primaryLabel }}
              </span>
            </div>
            <div class="head-sub">
              第 {{ plot.row }} 排 / 第 {{ plot.col }} 号 ·
              {{ plotTypeName || '未指定墓型' }} ·
              {{ cryptCountLabel(plot.cryptCount) }}
            </div>
            <div v-if="plot.price" class="head-price">
              参考价 <b>{{ money(plot.price) }}</b>
            </div>
          </div>
        </div>

        <!-- 格位属性 -->
        <div class="sec">
          <div class="sec-label">格位属性</div>
          <div class="card">
            <div class="kv-grid">
              <div class="kv">
                <span class="k">建造状态</span>
                <span class="v">{{ BUILD_LABELS[plot.buildStatus] }}</span>
              </div>
              <div class="kv">
                <span class="k">占地面积</span>
                <span class="v">{{ plot.area ? `${plot.area} ㎡` : '—' }}</span>
              </div>
              <div
                v-if="plot.posX !== undefined && plot.posY !== undefined"
                class="kv"
              >
                <span class="k">布局坐标</span>
                <span class="v">
                  X {{ plot.posX }} / Y {{ plot.posY }}
                  <em v-if="plot.rotation" class="dim">
                    朝向 {{ plot.rotation }}°
                  </em>
                </span>
              </div>
              <div class="kv">
                <span class="k">参考单价</span>
                <span class="v">{{
                  plot.price ? money(plot.price) : '—'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 购墓订单 -->
        <div v-if="sale" class="sec">
          <div class="sec-label">购墓订单</div>
          <div class="card">
            <div class="row-between">
              <span class="order-no">{{ sale.orderNo }}</span>
              <span
                class="mini-chip"
                :style="{
                  color: sale.status === 'signed' ? '#18a058' : '#d48806',
                  background:
                    sale.status === 'signed' ? '#18a05814' : '#d4880614',
                }"
              >
                {{ sale.status === 'signed' ? '已签约' : '已预订' }}
              </span>
            </div>
            <div class="kv-grid mt-10">
              <div class="kv">
                <span class="k">申请人</span>
                <span class="v">{{ archive?.customer?.name ?? '—' }}</span>
              </div>
              <div class="kv">
                <span class="k">联系电话</span>
                <span class="v">{{ archive?.customer?.phone ?? '—' }}</span>
              </div>
              <div v-if="sale.contractNo" class="kv">
                <span class="k">合同号</span>
                <span class="v">{{ sale.contractNo }}</span>
              </div>
              <div v-if="sale.signedAt" class="kv">
                <span class="k">签约时间</span>
                <span class="v">{{ datePart(sale.signedAt) }}</span>
              </div>
            </div>
            <div class="pay-block">
              <div class="bar">
                <i :style="{ width: `${paidRatio}%` }"></i>
              </div>
              <div class="row-between pay-text">
                <span>
                  已收 <b class="amount">{{ money(sale.paidAmount) }}</b>
                  <span class="dim">/ 应收 {{ money(sale.totalAmount) }}</span>
                </span>
                <span
                  v-if="paidSettled"
                  class="mini-chip"
                  style=" color: #18a058;background: #18a05814"
                >
                  全款结清
                </span>
                <span v-else class="dim">缴款 {{ paidRatio }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="plot.buildStatus === 'built'" class="sec">
          <div class="sec-label">购墓订单</div>
          <div class="empty-tip">该格位暂未产生购墓订单</div>
        </div>

        <!-- 收款记录 -->
        <div v-if="archive?.payments?.length" class="sec">
          <div class="sec-label">
            收款记录
            <span class="sec-count">{{ archive.payments.length }} 笔</span>
          </div>
          <div class="card card-flush">
            <div v-for="pay in archive.payments" :key="pay.id" class="line-row">
              <span class="dot dot-success"></span>
              <div class="line-main">
                <div class="line-title">
                  {{ PAY_METHOD[pay.method] ?? pay.method }}
                  <b class="amount">{{ money(pay.amount) }}</b>
                </div>
                <div class="line-sub">收据 {{ pay.receiptNo }}</div>
              </div>
              <div class="line-time">
                {{ datePart(pay.paidAt) }}
                <span class="dim">{{ timePart(pay.paidAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用人（逝者） -->
        <div v-if="archive?.deceased" class="sec">
          <div class="sec-label">使用人</div>
          <div class="card">
            <div class="row-between">
              <span class="d-name">{{ archive.deceased.name }}</span>
              <span
                v-if="archive.burial"
                class="mini-chip"
                :style="{
                  color:
                    archive.burial.status === 'completed'
                      ? '#18a058'
                      : '#d48806',
                  background:
                    archive.burial.status === 'completed'
                      ? '#18a05814'
                      : '#d4880614',
                }"
              >
                {{
                  archive.burial.status === 'completed' ? '已安葬' : '预约中'
                }}
              </span>
            </div>
            <div class="d-life">
              {{ archive.deceased.birthDate || '—' }}
              <span class="dim"> 至 </span>
              {{ archive.deceased.deathDate || '—' }}
            </div>
            <div v-if="archive.burial" class="d-cert">
              安葬证 <b>{{ archive.burial.certificateNo }}</b>
              <span class="dim">
                · 安葬日期 {{ archive.burial.burialDate }}
              </span>
            </div>
          </div>
        </div>
        <div v-else-if="plot.buildStatus === 'built'" class="sec">
          <div class="sec-label">使用人</div>
          <div class="empty-tip">暂无使用人档案</div>
        </div>

        <!-- 维护费 -->
        <div v-if="archive?.maintenanceFees?.length" class="sec">
          <div class="sec-label">
            维护费缴纳
            <span class="sec-count">{{ archive.maintenanceFees.length }} 期</span>
          </div>
          <div class="card card-flush">
            <div
              v-for="fee in archive.maintenanceFees"
              :key="fee.id"
              class="line-row"
            >
              <span class="dot dot-info"></span>
              <div class="line-main">
                <div class="line-title">
                  管理周期 {{ fee.cycleYears }} 年
                  <b class="amount">{{ money(fee.amount) }}</b>
                </div>
                <div class="line-sub">收据 {{ fee.receiptNo }}</div>
              </div>
              <div class="line-time">
                {{ datePart(fee.paidAt) }}
                <span class="dim">{{ timePart(fee.paidAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作 -->
        <div class="ops">
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
          <span v-if="plot.buildStatus === 'built'" class="ops-hint">
            销售 / 安葬 / 售后流转请前往对应业务模块办理
          </span>
        </div>
      </template>
    </NSpin>
  </Drawer>
</template>

<style scoped>
/* ---- 档案头 ---- */
.head {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border: 1px solid #ececec;
  border-radius: 12px;
}

.head-tomb {
  flex-shrink: 0;
  width: 52px;
  height: 56px;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 12%));
}

.head-main {
  flex: 1;
  min-width: 0;
}

.head-code {
  display: flex;
  gap: 8px;
  align-items: center;
}

.code {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.chip {
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  border-radius: 999px;
}

.head-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.head-price {
  margin-top: 6px;
  font-size: 12px;
  color: #595959;
}

.head-price b {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

/* ---- 区块骨架 ---- */
.sec {
  margin-top: 14px;
}

.sec-label {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  letter-spacing: 1px;
}

.sec-count {
  margin-left: 4px;
  font-weight: 500;
  color: #bfbfbf;
}

.card {
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
}

.card-flush {
  padding: 0 14px;
}

.empty-tip {
  padding: 14px;
  font-size: 12px;
  color: #bfbfbf;
  text-align: center;
  background: #fafafa;
  border: 1px dashed #e0e0e0;
  border-radius: 10px;
}

/* ---- 键值网格（无框） ---- */
.kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.kv {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}

.k {
  flex-shrink: 0;
  color: #8c8c8c;
}

.v {
  font-weight: 500;
  color: #262626;
}

.mt-10 {
  margin-top: 10px;
}

.dim {
  font-size: 11px;
  font-style: normal;
  color: #bfbfbf;
}

.row-between {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.order-no {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.mini-chip {
  flex-shrink: 0;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
}

/* ---- 缴款进度 ---- */
.pay-block {
  padding-top: 10px;
  margin-top: 12px;
  border-top: 1px dashed #ececec;
}

.bar {
  height: 5px;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 999px;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #36cfc9, #18a058);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.pay-text {
  margin-top: 6px;
  font-size: 12px;
}

.amount {
  font-variant-numeric: tabular-nums;
}

/* ---- 清单行（收款 / 维护费） ---- */
.line-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
}

.line-row + .line-row {
  border-top: 1px solid #f5f5f5;
}

.dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.dot-success {
  background: #18a058;
  box-shadow: 0 0 0 3px #18a0581f;
}

.dot-info {
  background: #2080f0;
  box-shadow: 0 0 0 3px #2080f01f;
}

.line-main {
  flex: 1;
  min-width: 0;
}

.line-title {
  font-size: 13px;
  color: #262626;
}

.line-title .amount {
  margin-left: 4px;
}

.line-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #bfbfbf;
}

.line-time {
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #595959;
  text-align: right;
}

/* ---- 使用人 ---- */
.d-name {
  font-size: 15px;
  font-weight: 600;
}

.d-life {
  margin-top: 6px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #595959;
}

.d-cert {
  padding-top: 8px;
  margin-top: 8px;
  font-size: 12px;
  border-top: 1px dashed #ececec;
}

/* ---- 操作 ---- */
.ops {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
}

.ops-hint {
  font-size: 11px;
  color: #bfbfbf;
}
</style>

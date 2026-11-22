<script lang="ts" setup>
import { onMounted, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSaleListApi, refundSaleApi } from '#/api/cemetery/biz';
import { useCemeteryStore } from '#/store';

import SaleCreateModal from './sale-create-modal.vue';
import SalePaymentModal from './sale-payment-modal.vue';
import SaleSignModal from './sale-sign-modal.vue';

defineOptions({ name: 'CemeterySales' });

const store = useCemeteryStore();

const STATUS_MAP: Record<
  string,
  { label: string; type: 'default' | 'error' | 'info' | 'success' | 'warning' }
> = {
  refunded: { label: '已退购', type: 'default' },
  reserved: { label: '已预订', type: 'warning' },
  signed: { label: '已签约', type: 'success' },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '单号/客户/格位' },
        fieldName: 'keyword',
        label: '搜索',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'orderNo', title: '单号', width: 150 },
      { field: 'plotCode', title: '格位', width: 120 },
      { field: 'customerName', title: '购买人', width: 100 },
      { field: 'customerPhone', title: '电话', width: 130 },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '状态',
        width: 100,
      },
      {
        field: 'deposit',
        formatter: ({ cellValue }: { cellValue: any }) => `¥${cellValue}`,
        title: '定金',
        width: 90,
      },
      {
        field: 'totalAmount',
        formatter: ({ cellValue }: { cellValue: any }) =>
          cellValue ? `¥${cellValue}` : '-',
        title: '总价',
        width: 100,
      },
      {
        field: 'paidAmount',
        formatter: ({ cellValue }: { cellValue: any }) => `¥${cellValue}`,
        title: '已收',
        width: 100,
      },
      { field: 'contractNo', title: '合同号', width: 140 },
      { field: 'createdAt', title: '创建时间', width: 160 },
      {
        field: 'actions',
        fixed: 'right',
        slots: { default: 'actions' },
        title: '操作',
        width: 220,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({
          form,
          page,
        }: {
          form?: Record<string, unknown>;
          page: { currentPage: number; pageSize: number };
        }) => {
          await store.ensureParks();
          const list = await getSaleListApi({ parkId: store.currentParkId });
          const keyword = String(form?.keyword ?? '').trim();
          const filtered = keyword
            ? list.filter(
                (item) =>
                  item.orderNo.includes(keyword) ||
                  (item.customerName ?? '').includes(keyword) ||
                  (item.plotCode ?? '').includes(keyword),
              )
            : list;
          const start = (page.currentPage - 1) * page.pageSize;
          return {
            items: filtered.slice(start, start + page.pageSize),
            total: filtered.length,
          };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [CreateModal, createModalApi] = useVbenModal({
  connectedComponent: SaleCreateModal,
});
const [SignModal, signModalApi] = useVbenModal({
  connectedComponent: SaleSignModal,
});
const [PaymentModal, paymentModalApi] = useVbenModal({
  connectedComponent: SalePaymentModal,
});

function reload() {
  gridApi.query();
}

function openCreate() {
  createModalApi.setData({ onSuccess: reload });
  createModalApi.open();
}

function openSign(row: any) {
  signModalApi.setData({ onSuccess: reload, record: { ...row } });
  signModalApi.open();
}

function openPayment(row: any) {
  paymentModalApi.setData({ onSuccess: reload, record: { ...row } });
  paymentModalApi.open();
}

function onRefund(row: any) {
  dialog.warning({
    content: `确定退购格位「${row.plotCode}」吗？退购后格位恢复为可售。`,
    negativeText: '取消',
    onPositiveClick: async () => {
      await refundSaleApi(row.id);
      message.success('退购成功');
      reload();
    },
    title: '退购确认',
  });
}

onMounted(() => {
  reload();
});

watch(
  () => store.currentParkId,
  () => reload(),
);
</script>

<template>
  <Page auto-content-height title="销售管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新建预订
        </NButton>
      </template>
      <template #status="{ row }">
        <NTag
          :bordered="false"
          size="small"
          :type="STATUS_MAP[row.status]?.type ?? 'default'"
        >
          {{ STATUS_MAP[row.status]?.label ?? row.status }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          v-if="row.status === 'reserved'"
          size="tiny"
          quaternary
          type="primary"
          @click="openSign(row)"
        >
          签约
        </NButton>
        <NButton
          v-if="row.status !== 'refunded'"
          size="tiny"
          quaternary
          type="success"
          @click="openPayment(row)"
        >
          收款
        </NButton>
        <NButton
          v-if="row.status !== 'refunded'"
          size="tiny"
          quaternary
          type="error"
          @click="onRefund(row)"
        >
          退购
        </NButton>
      </template>
    </Grid>
    <CreateModal />
    <SignModal />
    <PaymentModal />
  </Page>
</template>

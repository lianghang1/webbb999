<script lang="ts" setup>
import type { AfterSaleStatus, CemeteryAfterSale } from '#/api/cemetery/biz';

import { onMounted, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NInput, NSelect, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AFTER_SALE_STATUS,
  AFTER_SALE_TYPE,
  completeAfterSaleApi,
  getAfterSaleListApi,
  updateAfterSaleApi,
} from '#/api/cemetery/biz';
import { useCemeteryStore } from '#/store';

import AfterSaleFormModal from './after-sale-form-modal.vue';

defineOptions({ name: 'CemeteryAfterSales' });

const store = useCemeteryStore();

const keyword = ref('');
const statusFilter = ref<'' | AfterSaleStatus>('');
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: AFTER_SALE_STATUS.pending, value: 'pending' },
  { label: AFTER_SALE_STATUS.processing, value: 'processing' },
  { label: AFTER_SALE_STATUS.completed, value: 'completed' },
];

const STATUS_TAG: Record<
  AfterSaleStatus,
  'default' | 'info' | 'success' | 'warning'
> = {
  completed: 'success',
  pending: 'warning',
  processing: 'info',
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'orderNo', title: '工单号', width: 140 },
      { field: 'plotCode', title: '格位', width: 120 },
      {
        field: 'type',
        slots: { default: 'type' },
        title: '服务类型',
        width: 110,
      },
      { field: 'description', minWidth: 220, title: '问题描述' },
      { field: 'handler', title: '处理人', width: 100 },
      { field: 'reportAt', title: '报修时间', width: 160 },
      { field: 'completeAt', title: '完成时间', width: 160 },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '状态',
        width: 90,
      },
      {
        field: 'actions',
        fixed: 'right',
        slots: { default: 'actions' },
        title: '操作',
        width: 150,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getAfterSaleListApi({
            keyword: keyword.value || undefined,
            parkId: store.currentParkId || undefined,
            status: statusFilter.value || undefined,
          });
          return { items: list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AfterSaleFormModal,
});

function reload() {
  gridApi.query();
}

function openCreate() {
  formModalApi.setData({ onSuccess: reload });
  formModalApi.open();
}

async function onStart(row: CemeteryAfterSale) {
  await updateAfterSaleApi(row.id, { status: 'processing' });
  message.success('工单已开始处理');
  reload();
}

async function onComplete(row: CemeteryAfterSale) {
  await completeAfterSaleApi(row.id, row.handler || '物业专员');
  message.success('工单已完成');
  reload();
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
  <Page auto-content-height title="售后管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新建工单
        </NButton>
        <NInput
          v-model:value="keyword"
          clearable
          placeholder="工单号 / 格位 / 描述"
          size="small"
          style="width: 200px"
          @clear="reload"
          @keyup.enter="reload"
        />
        <NSelect
          v-model:value="statusFilter"
          :options="statusOptions"
          size="small"
          style="width: 120px"
          @update:value="reload"
        />
      </template>
      <template #type="{ row }">
        {{
          AFTER_SALE_TYPE[row.type as keyof typeof AFTER_SALE_TYPE] ?? row.type
        }}
      </template>
      <template #status="{ row }">
        <NTag
          :bordered="false"
          size="small"
          :type="STATUS_TAG[row.status as AfterSaleStatus] ?? 'default'"
        >
          {{ AFTER_SALE_STATUS[row.status as AfterSaleStatus] ?? row.status }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          v-if="row.status === 'pending'"
          size="tiny"
          quaternary
          type="primary"
          @click="onStart(row as CemeteryAfterSale)"
        >
          开始处理
        </NButton>
        <NButton
          v-if="row.status === 'processing'"
          size="tiny"
          quaternary
          type="success"
          @click="onComplete(row as CemeteryAfterSale)"
        >
          完成工单
        </NButton>
        <span v-if="row.status === 'completed'" class="text-xs opacity-50">
          已完成
        </span>
      </template>
    </Grid>
    <FormModal />
  </Page>
</template>

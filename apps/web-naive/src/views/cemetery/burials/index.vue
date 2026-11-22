<script lang="ts" setup>
import type { CemeteryBurial } from '#/api/cemetery/biz';

import { onMounted, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { completeBurialApi, getBurialListApi } from '#/api/cemetery/biz';
import { useCemeteryStore } from '#/store';

import BurialCreateModal from './burial-create-modal.vue';

defineOptions({ name: 'CemeteryBurials' });

const store = useCemeteryStore();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'certificateNo', title: '安葬证号', width: 150 },
      { field: 'deceasedName', title: '逝者', width: 100 },
      { field: 'customerName', title: '购买人', width: 100 },
      { field: 'burialDate', title: '安葬日期', width: 120 },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '状态',
        width: 100,
      },
      {
        field: 'actions',
        fixed: 'right',
        slots: { default: 'actions' },
        title: '操作',
        width: 140,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          await store.ensureParks();
          const list = await getBurialListApi(store.currentParkId);
          return { items: list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [CreateModal, createModalApi] = useVbenModal({
  connectedComponent: BurialCreateModal,
});

function reload() {
  gridApi.query();
}

function openCreate() {
  createModalApi.setData({ onSuccess: reload });
  createModalApi.open();
}

async function onComplete(row: CemeteryBurial) {
  await completeBurialApi(row.id);
  message.success('安葬完成，格位状态已更新');
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
  <Page auto-content-height title="安葬管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          登记安葬
        </NButton>
      </template>
      <template #status="{ row }">
        <NTag
          :bordered="false"
          size="small"
          :type="row.status === 'completed' ? 'success' : 'warning'"
        >
          {{ row.status === 'completed' ? '已完成安葬' : '待安葬' }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          v-if="row.status === 'scheduled'"
          size="tiny"
          quaternary
          type="primary"
          @click="onComplete(row as CemeteryBurial)"
        >
          确认安葬
        </NButton>
        <span v-else class="text-xs opacity-50">已安葬</span>
      </template>
    </Grid>
    <CreateModal />
  </Page>
</template>

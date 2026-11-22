<script lang="ts" setup>
import type { CemeteryPark } from '#/api/cemetery/types';

import { onMounted, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteParkApi, getParkListApi } from '#/api';
import { useCemeteryStore } from '#/store';

import ParkFormModal from './park-form-modal.vue';

defineOptions({ name: 'CemeteryParks' });

interface GridQueryParams {
  form?: Record<string, unknown>;
  page: { currentPage: number; pageSize: number };
}

const store = useCemeteryStore();

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '请输入名称或编码' },
        fieldName: 'keyword',
        label: '关键词',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'name', title: '园区名称', minWidth: 140 },
      { field: 'code', title: '编码', width: 100 },
      { field: 'address', title: '地址', minWidth: 180 },
      { field: 'contact', title: '联系人', width: 100 },
      { field: 'phone', title: '电话', width: 130 },
      {
        field: 'status',
        title: '状态',
        width: 90,
        slots: { default: 'status' },
      },
      { field: 'remark', title: '备注', minWidth: 120 },
      { field: 'createTime', title: '创建时间', width: 160 },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 160,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form, page }: GridQueryParams) => {
          await store.ensureParks();
          const list = await getParkListApi();
          const keyword = String(form?.keyword ?? '').trim();
          const filtered = keyword
            ? list.filter(
                (item) =>
                  item.name.includes(keyword) || item.code.includes(keyword),
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

const [ParkModal, parkModalApi] = useVbenModal({
  connectedComponent: ParkFormModal,
});

function openCreate() {
  parkModalApi.setData({
    onSuccess: () => gridApi.query(),
  });
  parkModalApi.open();
}

function openEdit(row: CemeteryPark) {
  parkModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  parkModalApi.open();
}

function onDelete(row: CemeteryPark) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除园区「${row.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const result = await deleteParkApi(row.id);
      if (result) {
        message.success('删除成功');
        // 若删除的是当前园区，刷新全局园区列表并回落
        await store.loadParks(true);
        gridApi.query();
      }
    },
  });
}

onMounted(() => {
  gridApi.query();
});

watch(
  () => store.currentParkId,
  () => gridApi.query(),
);
</script>

<template>
  <Page auto-content-height title="园区管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增园区
        </NButton>
      </template>
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'default'" size="small">
          {{ row.status === 1 ? '运营中' : '停用' }}
        </NTag>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="primary"
          quaternary
          @click="openEdit(row as CemeteryPark)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          type="error"
          quaternary
          @click="onDelete(row as CemeteryPark)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <ParkModal />
  </Page>
</template>

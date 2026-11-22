<script lang="ts" setup>
import type { CemeteryCustomer } from '#/api/cemetery/biz';

import { onMounted, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCustomerApi, getCustomerListApi } from '#/api/cemetery/biz';
import { useCemeteryStore } from '#/store';

import CustomerFormModal from './customer-form-modal.vue';

defineOptions({ name: 'CemeteryCustomers' });

const store = useCemeteryStore();

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '姓名或电话' },
        fieldName: 'keyword',
        label: '搜索',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'name', minWidth: 100, title: '姓名' },
      {
        field: 'gender',
        title: '性别',
        width: 70,
        formatter: ({ cellValue }: { cellValue: any }) =>
          cellValue === 2 ? '女' : cellValue === 1 ? '男' : '-',
      },
      { field: 'phone', title: '电话', width: 130 },
      { field: 'idCard', title: '身份证号', minWidth: 170 },
      { field: 'address', minWidth: 160, title: '地址' },
      {
        field: 'actions',
        fixed: 'right',
        slots: { default: 'actions' },
        title: '操作',
        width: 160,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form, page }: GridQueryParams) => {
          await store.ensureParks();
          const keyword = String(form?.keyword ?? '').trim();
          const list = await getCustomerListApi(keyword || undefined);
          const start = (page.currentPage - 1) * page.pageSize;
          return {
            items: list.slice(start, start + page.pageSize),
            total: list.length,
          };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

interface GridQueryParams {
  form?: Record<string, unknown>;
  page: { currentPage: number; pageSize: number };
}

const [CustomerModal, customerModalApi] = useVbenModal({
  connectedComponent: CustomerFormModal,
});

function openCreate() {
  customerModalApi.setData({ onSuccess: () => gridApi.query() });
  customerModalApi.open();
}

function openEdit(row: CemeteryCustomer) {
  customerModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  customerModalApi.open();
}

function onDelete(row: CemeteryCustomer) {
  dialog.warning({
    content: `确定删除客户「${row.name}」吗？`,
    negativeText: '取消',
    onPositiveClick: async () => {
      const ok = await deleteCustomerApi(row.id);
      if (ok) {
        message.success('删除成功');
        gridApi.query();
      }
    },
    title: '删除确认',
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
  <Page auto-content-height title="客户管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增客户
        </NButton>
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          quaternary
          type="primary"
          @click="openEdit(row as CemeteryCustomer)"
        >
          编辑
        </NButton>
        <NButton
          size="tiny"
          quaternary
          type="error"
          @click="onDelete(row as CemeteryCustomer)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <CustomerModal />
  </Page>
</template>

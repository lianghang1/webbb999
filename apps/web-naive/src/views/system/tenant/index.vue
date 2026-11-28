<script lang="ts" setup>
import type { SysTenant } from '#/api/system/types';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NDropdown, NTag } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { packageApi, tenantApi } from '#/api';
import { useAuthStore } from '#/store';

import TenantFormModal from './tenant-form-modal.vue';

defineOptions({ name: 'SystemTenant' });

const authStore = useAuthStore();
const platformTenantId = ref<string>('');
const packageMap = ref<Record<string, string>>({});

onMounted(async () => {
  const [pid, packages] = await Promise.all([
    tenantApi.platformTenantId(),
    packageApi.list({ pageNum: 1, pageSize: -1 }),
  ]);
  platformTenantId.value = pid;
  packageMap.value = Object.fromEntries(
    packages.list.map((p) => [String(p.id), p.packageName]),
  );
});

const isPlatformTenant = (row: SysTenant) =>
  !!platformTenantId.value && String(row.id) === String(platformTenantId.value);

interface GridQueryParams {
  form?: { status?: number; tenantName?: string; tenantCode?: string };
  page: { currentPage: number; pageSize: number };
}

const totalText = ref('共 0 条');

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '租户名称包含…', clearable: true },
        fieldName: 'tenantName',
        label: '租户名称',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '租户编码包含…', clearable: true },
        fieldName: 'tenantCode',
        label: '租户编码',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          options: [
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ],
        },
        fieldName: 'status',
        label: '状态',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'tenantCode', title: '租户编码', width: 130 },
      {
        field: 'tenantName',
        title: '租户名称',
        minWidth: 150,
        slots: { default: 'tenantName' },
      },
      {
        field: 'packageId',
        title: '开通套餐',
        width: 130,
        slots: { default: 'packageId' },
      },
      {
        field: 'expireTime',
        title: '到期日期',
        width: 120,
        slots: { default: 'expireTime' },
      },
      {
        field: 'status',
        title: '状态',
        width: 80,
        slots: { default: 'status' },
      },
      {
        field: 'createTime',
        title: '创建时间',
        width: 155,
        slots: { default: 'createTime' },
      },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 130,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            sort: 'createTime',
            order: 'desc',
          };
          if (form?.tenantName) params.CN_tenantName = form.tenantName;
          if (form?.tenantCode) params.CN_tenantCode = form.tenantCode;
          if (form?.status !== undefined) params.EQ_status = form.status;
          const result = await tenantApi.list(params);
          totalText.value = `共 ${result.total} 条`;
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    stripe: true,
  },
});

const [TenantModal, tenantModalApi] = useVbenModal({
  connectedComponent: TenantFormModal,
});

function openCreate() {
  tenantModalApi.setData({ onSuccess: () => gridApi.query() });
  tenantModalApi.open();
}

function openEdit(row: SysTenant) {
  tenantModalApi.setData({
    record: { ...row },
    onSuccess: () => gridApi.query(),
  });
  tenantModalApi.open();
}

function enterTenant(row: SysTenant) {
  dialog.warning({
    title: '进入租户',
    content: `将以目标租户管理员身份进入「${row.tenantName}」，当前页面会刷新。`,
    positiveText: '进入',
    negativeText: '取消',
    onPositiveClick: () => authStore.switchTenant(row.tenantCode, 'enter'),
  });
}

function onDelete(row: SysTenant) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除租户「${row.tenantName}」吗？该租户下的账号与数据将一并失效。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await tenantApi.delete(row.id);
      message.success('删除成功');
      gridApi.query();
    },
  });
}

const rowActionOptions = [
  { label: '进入租户', key: 'enter' },
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete', danger: true },
];

function onRowAction(key: string, row: SysTenant) {
  if (key === 'enter') enterTenant(row);
  else if (key === 'edit') openEdit(row);
  else if (key === 'delete') onDelete(row);
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
}
</script>

<template>
  <Page auto-content-height title="租户管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreate">
          新增租户
        </NButton>
        <span class="text-xs text-muted-foreground self-center">{{
          totalText
        }}</span>
      </template>
      <template #tenantName="{ row }">
        <span>{{ row.tenantName }}</span>
        <NTag
          v-if="isPlatformTenant(row as SysTenant)"
          size="tiny"
          class="ml-1"
          :bordered="false"
          type="warning"
        >
          平台
        </NTag>
      </template>
      <template #packageId="{ row }">
        <span v-if="packageMap[String(row.packageId)]">{{
          packageMap[String(row.packageId)]
        }}</span>
        <span v-else class="text-muted-foreground">未开通</span>
      </template>
      <template #expireTime="{ row }">
        <span :class="row.expireTime ? '' : 'text-muted-foreground'">{{
          row.expireTime || '不过期'
        }}</span>
      </template>
      <template #status="{ row }">
        <NTag
          :type="row.status === 1 ? 'success' : 'default'"
          size="small"
          :bordered="false"
        >
          {{ row.status === 1 ? '启用' : '停用' }}
        </NTag>
      </template>
      <template #createTime="{ row }">
        {{ formatTime(row.createTime) }}
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          type="success"
          quaternary
          @click="enterTenant(row as SysTenant)"
        >
          进入
        </NButton>
        <NDropdown
          :options="rowActionOptions"
          @select="(key: string) => onRowAction(key, row as SysTenant)"
        >
          <NButton size="tiny" quaternary>更多 ▾</NButton>
        </NDropdown>
      </template>
    </Grid>
    <TenantModal />
  </Page>
</template>

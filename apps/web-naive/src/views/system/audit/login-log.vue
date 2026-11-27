<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { NTag } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { auditApi } from '#/api';

defineOptions({ name: 'AuditLoginLog' });

interface GridQueryParams {
  form?: Record<string, unknown>;
  page: { currentPage: number; pageSize: number };
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '账号/设备/来源' },
        fieldName: 'keyword',
        label: '关键词',
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'loginTime', title: '登录时间', width: 170 },
      { field: 'username', title: '账号', width: 130 },
      { field: 'tenantCode', title: '租户', width: 120 },
      { field: 'source', title: '来源', width: 110 },
      { field: 'authType', title: '认证方式', width: 100 },
      { field: 'ip', title: 'IP', width: 130 },
      { field: 'loginLocation', title: '属地', width: 140 },
      { field: 'deviceId', title: '设备ID', width: 160 },
      { field: 'costMs', title: '耗时(ms)', width: 100 },
      {
        field: 'success',
        title: '结果',
        width: 90,
        slots: { default: 'success' },
      },
      { field: 'reason', title: '原因', minWidth: 140 },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: GridQueryParams) => {
          const result = await auditApi.loginLogs({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
          });
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});
</script>

<template>
  <Page auto-content-height title="登录日志">
    <Grid>
      <template #success="{ row }">
        <NTag :type="row.success ? 'success' : 'error'" size="small">
          {{ row.success ? '成功' : '失败' }}
        </NTag>
      </template>
    </Grid>
  </Page>
</template>

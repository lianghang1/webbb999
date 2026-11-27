<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { NTag } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { auditApi } from '#/api';

defineOptions({ name: 'AuditOperateLog' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'operTime', title: '操作时间', width: 170 },
      { field: 'operUserName', title: '操作人', width: 130 },
      { field: 'module', title: '模块', width: 120 },
      { field: 'operation', title: '操作', width: 140 },
      { field: 'method', title: '方法', width: 160 },
      { field: 'uri', title: 'URI', minWidth: 180 },
      { field: 'ip', title: 'IP', width: 130 },
      {
        field: 'success',
        title: '结果',
        width: 90,
        slots: { default: 'success' },
      },
      { field: 'errorMsg', title: '错误信息', minWidth: 160 },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: GridQueryParams) => {
          const result = await auditApi.operateLogs({
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
  <Page auto-content-height title="操作日志">
    <Grid>
      <template #success="{ row }">
        <NTag :type="row.success ? 'success' : 'error'" size="small">
          {{ row.success ? '成功' : '失败' }}
        </NTag>
      </template>
    </Grid>
  </Page>
</template>

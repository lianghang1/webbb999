<script lang="ts" setup>
import { ref } from 'vue';

import { NTag } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { auditApi } from '#/api';

defineOptions({ name: 'AuditLoginLog' });

const totalText = ref('共 0 条');

interface GridQueryParams {
  form?: { success?: boolean; username?: string };
  page: { currentPage: number; pageSize: number };
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '账号包含…', clearable: true },
        fieldName: 'username',
        label: '账号',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          options: [
            { label: '成功', value: true },
            { label: '失败', value: false },
          ],
        },
        fieldName: 'success',
        label: '结果',
      },
    ],
  },
  gridOptions: {
    columns: [
      {
        field: 'loginTime',
        title: '登录时间',
        width: 170,
        slots: { default: 'loginTime' },
      },
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
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            sort: 'loginTime',
            order: 'desc',
          };
          if (form?.username) params.CN_username = form.username;
          if (form?.success !== undefined) params.EQ_success = form.success;
          const result = await auditApi.loginLogs(params);
          const ok = result.list.filter((item) => item.success).length;
          totalText.value = `共 ${result.total} 条 · 本页成功 ${ok} 失败 ${result.list.length - ok}`;
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    stripe: true,
  },
});

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
}
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <div class="flex shrink-0 justify-end">
      <span class="text-xs text-muted-foreground">{{ totalText }}</span>
    </div>
    <div class="min-h-0 flex-1">
      <Grid>
        <template #loginTime="{ row }">
          {{ formatTime(row.loginTime) }}
        </template>
        <template #success="{ row }">
          <NTag
            :type="row.success ? 'success' : 'error'"
            size="small"
            :bordered="false"
          >
            {{ row.success ? '成功' : '失败' }}
          </NTag>
        </template>
      </Grid>
    </div>
  </div>
</template>

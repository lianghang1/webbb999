<script lang="ts" setup>
import { ref } from 'vue';

import { NTag } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { auditApi } from '#/api';

defineOptions({ name: 'AuditOperateLog' });

const totalText = ref('共 0 条');

interface GridQueryParams {
  form?: { module?: string; operUserName?: string; success?: boolean };
  page: { currentPage: number; pageSize: number };
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '模块包含…', clearable: true },
        fieldName: 'module',
        label: '模块',
      },
      {
        component: 'Input',
        componentProps: { placeholder: '操作人包含…', clearable: true },
        fieldName: 'operUserName',
        label: '操作人',
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
        field: 'operTime',
        title: '操作时间',
        width: 170,
        slots: { default: 'operTime' },
      },
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
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            sort: 'operTime',
            order: 'desc',
          };
          if (form?.module) params.CN_module = form.module;
          if (form?.operUserName) params.CN_operUserName = form.operUserName;
          if (form?.success !== undefined) params.EQ_success = form.success;
          const result = await auditApi.operateLogs(params);
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
        <template #operTime="{ row }">{{ formatTime(row.operTime) }}</template>
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

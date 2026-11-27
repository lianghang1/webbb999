<script lang="ts" setup>
import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NImage, NTag } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fileApi } from '#/api';

import FileUploadModal from './file-upload-modal.vue';

defineOptions({ name: 'SystemFile' });

interface GridQueryParams {
  page: { currentPage: number; pageSize: number };
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '文件名', minWidth: 180 },
      { field: 'originalFilename', title: '原始文件名', minWidth: 180 },
      { field: 'objectType', title: '对象类型', width: 130 },
      { field: 'fileSize', title: '大小', width: 110 },
      {
        field: 'url',
        title: '预览',
        width: 90,
        slots: { default: 'url' },
      },
      { field: 'id', title: 'ID', width: 160 },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: GridQueryParams) => {
          const result = await fileApi.list({
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

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: FileUploadModal,
});

function openUpload() {
  uploadModalApi.setData({ onSuccess: () => gridApi.query() });
  uploadModalApi.open();
}
</script>

<template>
  <Page auto-content-height title="文件管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openUpload">
          上传文件
        </NButton>
      </template>
      <template #url="{ row }">
        <NImage
          v-if="row.thumbnailUrl || row.url"
          :src="row.thumbnailUrl || row.url"
          width="40"
          height="40"
          :preview-src="row.url"
        />
        <NTag v-else size="small" type="default">无</NTag>
      </template>
    </Grid>
    <UploadModal />
  </Page>
</template>

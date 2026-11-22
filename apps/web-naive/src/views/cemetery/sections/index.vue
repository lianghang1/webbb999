<script lang="ts" setup>
import type { CemeteryPlot, CemeterySection } from '#/api/cemetery/types';

import { onMounted, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NTooltip } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSectionApi, getPlotListApi, getSectionListApi } from '#/api';
import { useCemeteryStore } from '#/store';

import GeneratePlotsModal from './generate-plots-modal.vue';
import SectionFormModal from './section-form-modal.vue';

defineOptions({ name: 'CemeterySections' });

const store = useCemeteryStore();

interface SectionRow extends CemeterySection {
  builtCount: number;
  hasChildren: boolean;
  slotCount: number;
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', minWidth: 200, title: '墓区名称', treeNode: true },
      { field: 'code', title: '编码', width: 140 },
      { field: 'sort', title: '排序', width: 80 },
      {
        field: 'slotCount',
        title: '格位数',
        width: 100,
        slots: { default: 'slotCount' },
      },
      {
        field: 'builtCount',
        title: '墓位数',
        width: 100,
        slots: { default: 'builtCount' },
      },
      { field: 'remark', title: '备注', minWidth: 140 },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 280,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async () => {
          await store.ensureParks();
          const parkId = store.currentParkId;
          const [sections, plots] = await Promise.all([
            getSectionListApi(parkId),
            getPlotListApi({ parkId }),
          ]);
          const items: SectionRow[] = sections.map((section) => {
            const own = plots.filter(
              (item: CemeteryPlot) => item.sectionId === section.id,
            );
            return {
              ...section,
              builtCount: own.filter((item) => item.buildStatus === 'built')
                .length,
              hasChildren: sections.some(
                (item) => item.parentId === section.id,
              ),
              slotCount: own.length,
            };
          });
          return { items, total: items.length };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    treeConfig: {
      childrenField: 'children',
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
    },
  },
});

const [SectionModal, sectionModalApi] = useVbenModal({
  connectedComponent: SectionFormModal,
});

const [GenerateModal, generateModalApi] = useVbenModal({
  connectedComponent: GeneratePlotsModal,
});

function reload() {
  gridApi.query();
}

function openCreateRoot() {
  sectionModalApi.setData({ parentId: null, onSuccess: reload });
  sectionModalApi.open();
}

function openCreateChild(row: SectionRow) {
  sectionModalApi.setData({ parentId: row.id, onSuccess: reload });
  sectionModalApi.open();
}

function openEdit(row: SectionRow) {
  sectionModalApi.setData({ record: { ...row }, onSuccess: reload });
  sectionModalApi.open();
}

function openGenerate(row: SectionRow) {
  generateModalApi.setData({
    onSuccess: reload,
    section: { ...row },
  });
  generateModalApi.open();
}

function onDelete(row: SectionRow) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除墓区「${row.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const result = await deleteSectionApi(row.id);
      if (result) {
        message.success('删除成功');
        reload();
      }
    },
  });
}

onMounted(() => {
  gridApi.query();
});

watch(
  () => store.currentParkId,
  () => reload(),
);
</script>

<template>
  <Page auto-content-height title="墓区管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openCreateRoot">
          新增一级墓区
        </NButton>
      </template>
      <template #slotCount="{ row }">
        {{ row.slotCount }}
      </template>
      <template #builtCount="{ row }">
        {{ row.builtCount }}
      </template>
      <template #actions="{ row }">
        <NButton
          size="tiny"
          quaternary
          type="primary"
          @click="openCreateChild(row as SectionRow)"
        >
          新增子墓区
        </NButton>
        <NButton
          size="tiny"
          quaternary
          type="primary"
          @click="openEdit(row as SectionRow)"
        >
          编辑
        </NButton>
        <NTooltip
          :disabled="
            (row as SectionRow).hasChildren || (row as SectionRow).slotCount > 0
          "
        >
          <template #trigger>
            <NButton
              :disabled="
                (row as SectionRow).hasChildren ||
                (row as SectionRow).slotCount > 0
              "
              size="tiny"
              quaternary
              type="warning"
              @click="openGenerate(row as SectionRow)"
            >
              规划格位
            </NButton>
          </template>
          仅可在无下级且未规划过的最末级墓区规划
        </NTooltip>
        <NButton
          size="tiny"
          quaternary
          type="error"
          @click="onDelete(row as SectionRow)"
        >
          删除
        </NButton>
      </template>
    </Grid>
    <SectionModal />
    <GenerateModal />
  </Page>
</template>

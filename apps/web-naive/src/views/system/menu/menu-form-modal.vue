<script lang="ts" setup>
import type { TreeSelectOption } from 'naive-ui';

import type { SysMenu } from '#/api/system/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { menuApi } from '#/api';

defineOptions({ name: 'MenuFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  parentId?: string;
  record?: SysMenu;
}

/** 后端真实枚举：M目录 C菜单 F按钮（与 DDL / 实体注释一致） */
const MENU_TYPE_OPTIONS = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮/权限点', value: 'F' },
];

const MENU_SCOPE_OPTIONS = [
  { label: '平台', value: 'PLATFORM' },
  { label: '租户', value: 'TENANT' },
  { label: '通用', value: 'COMMON' },
];

const parentOptions = ref<TreeSelectOption[]>([]);

function toTreeOptions(
  nodes: SysMenu[],
  excludeId?: string,
): TreeSelectOption[] {
  return (nodes ?? [])
    .filter((n) => String(n.id) !== excludeId)
    .map((n) => ({
      key: String(n.id),
      label: n.menuName,
      children: n.children?.length
        ? toTreeOptions(n.children, excludeId)
        : undefined,
    }));
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (rawValues) => {
    const values = rawValues as Record<string, any>;
    const data = modalApi.getData();
    await menuApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    // ===== 基础信息 =====
    {
      type: 'group',
      name: 'basic',
      title: '基础信息',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: { placeholder: '请输入菜单名称' },
          fieldName: 'menuName',
          label: '菜单名称',
          rules: 'required',
        },
        {
          component: 'Select',
          componentProps: {
            options: MENU_TYPE_OPTIONS,
            placeholder: '请选择类型',
          },
          fieldName: 'menuType',
          label: '菜单类型',
          defaultValue: 'C',
          rules: 'required',
        },
        {
          component: 'TreeSelect',
          componentProps: () => ({
            options: parentOptions.value,
            placeholder: '顶级菜单（不选则为根节点）',
            clearable: true,
            checkable: false,
            filterable: true,
          }),
          fieldName: 'parentId',
          label: '上级菜单',
          help: '目录/菜单可挂上级；按钮通常挂在菜单下',
        },
        {
          component: 'Select',
          componentProps: {
            options: MENU_SCOPE_OPTIONS,
            placeholder: '请选择范围',
          },
          fieldName: 'menuScope',
          label: '菜单范围',
          defaultValue: 'TENANT',
        },
      ],
    },

    // ===== 路由与显示 =====
    {
      type: 'group',
      name: 'route',
      title: '路由与显示',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: { placeholder: '如 /system/user' },
          fieldName: 'path',
          label: '路由路径',
          dependencies: {
            triggerFields: ['menuType'],
            show: (values) => values.menuType !== 'F',
          },
        },
        {
          component: 'Input',
          componentProps: { placeholder: '如 /system/user/index.vue' },
          fieldName: 'component',
          label: '组件路径',
          dependencies: {
            triggerFields: ['menuType'],
            show: (values) => values.menuType === 'C',
          },
        },
        {
          component: 'IconPicker',
          fieldName: 'icon',
          label: '图标',
          dependencies: {
            triggerFields: ['menuType'],
            show: (values) => values.menuType !== 'F',
          },
        },
        {
          component: 'InputNumber',
          componentProps: { min: 0, class: 'w-full' },
          fieldName: 'sortNo',
          label: '排序',
          defaultValue: 0,
        },
        {
          component: 'Switch',
          fieldName: 'visible',
          label: '可见',
          defaultValue: true,
        },
      ],
    },

    // ===== 权限标识 =====
    {
      type: 'group',
      name: 'permission',
      title: '权限标识',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: { placeholder: '如 system:user:list' },
          fieldName: 'permission',
          label: '权限标识',
          help: '按钮/菜单可配；用于后端权限点校验',
        },
        {
          component: 'Input',
          componentProps: {
            placeholder: '如 /api/iam/user/**,多个逗号分隔',
          },
          fieldName: 'apiPattern',
          label: 'URL 权限规则',
          help: 'Ant 风格匹配后端 URL；平台超管 bypass。留空则不守护具体 URL',
        },
      ],
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[640px]',
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmit();
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    const editing = !!data?.record?.id;
    modalApi.setState({ title: editing ? '编辑菜单' : '新增菜单' });

    // 加载完整菜单树供上级选择（编辑时排除自身及子孙，避免自环）
    const tree = await menuApi.tree();
    parentOptions.value = toTreeOptions(
      tree,
      data?.record ? String(data.record.id) : undefined,
    );

    const record = data?.record;
    if (editing && record) {
      formApi.setValues({
        ...record,
        parentId:
          record.parentId === null || record.parentId === undefined
            ? undefined
            : String(record.parentId),
        visible: record.visible !== false,
      });
    } else {
      formApi.resetForm();
      formApi.setValues({
        menuType: 'C',
        menuScope: 'TENANT',
        sortNo: 0,
        visible: true,
        ...(data?.parentId ? { parentId: String(data.parentId) } : {}),
      });
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>

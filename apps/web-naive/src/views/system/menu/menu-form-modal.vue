<script lang="ts" setup>
import type { SysMenu } from '#/api/system/types';

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

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await menuApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
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
        options: [
          { label: '目录', value: 'D' },
          { label: '菜单', value: 'M' },
          { label: '权限点', value: 'C' },
        ],
      },
      defaultValue: 'M',
      fieldName: 'menuType',
      label: '菜单类型',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '上级菜单ID，留空为顶级' },
      fieldName: 'parentId',
      label: '上级菜单',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 /system/user' },
      fieldName: 'path',
      label: '路由路径',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 /system/user/index.vue' },
      fieldName: 'component',
      label: '组件路径',
    },
    {
      component: 'IconPicker',
      fieldName: 'icon',
      label: '图标',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 system:user:list' },
      fieldName: 'permission',
      label: '权限标识',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 /api/iam/user/**' },
      fieldName: 'apiPattern',
      label: 'URL规则',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '平台', value: 'PLATFORM' },
          { label: '租户', value: 'TENANT' },
        ],
      },
      defaultValue: 'TENANT',
      fieldName: 'menuScope',
      label: '菜单范围',
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
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmit();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    modalApi.setState({ title: data?.record?.id ? '编辑菜单' : '新增菜单' });
    if (data?.record) {
      formApi.setValues(data.record);
    } else {
      formApi.resetForm();
      if (data?.parentId) {
        formApi.setValues({ parentId: data.parentId });
      }
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>

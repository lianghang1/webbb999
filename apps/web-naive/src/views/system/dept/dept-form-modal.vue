<script lang="ts" setup>
import type { SysDept } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { deptApi } from '#/api';

defineOptions({ name: 'DeptFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  parentId?: string;
  record?: SysDept;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await deptApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入部门名称' },
      fieldName: 'deptName',
      label: '部门名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '上级部门ID，留空为顶级' },
      fieldName: 'parentId',
      label: '上级部门',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '租户ID' },
      fieldName: 'tenantId',
      label: '租户ID',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '负责人用户ID' },
      fieldName: 'leaderId',
      label: '负责人',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, class: 'w-full' },
      fieldName: 'sortNo',
      label: '排序',
      defaultValue: 0,
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: '状态',
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
    modalApi.setState({ title: data?.record?.id ? '编辑部门' : '新增部门' });
    if (data?.record) {
      formApi.setValues(data.record);
    } else {
      formApi.resetForm();
      if (data?.parentId) {
        formApi.setValues({
          parentId: data.parentId,
          tenantId: data.record?.tenantId,
        });
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

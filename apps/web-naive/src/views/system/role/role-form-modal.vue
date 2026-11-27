<script lang="ts" setup>
import type { SysRole } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { roleApi } from '#/api';

defineOptions({ name: 'RoleFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysRole;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await roleApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        placeholder: '请输入角色编码',
        disabled: !!rootValues?.id,
      }),
      fieldName: 'roleCode',
      label: '角色编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入角色名称' },
      fieldName: 'roleName',
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '租户ID，平台角色可留空' },
      fieldName: 'tenantId',
      label: '租户ID',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部数据', value: 'ALL' },
          { label: '本部门数据', value: 'DEPT' },
          { label: '本部门及子部门', value: 'DEPT_CHILD' },
          { label: '自定义部门', value: 'CUSTOM' },
          { label: '仅本人', value: 'SELF' },
        ],
      },
      defaultValue: 'ALL',
      fieldName: 'dataScope',
      label: '数据范围',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '自定义部门ID，多个逗号分隔' },
      fieldName: 'dataScopeDeptIds',
      label: '指定部门',
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
    {
      component: 'Input',
      componentProps: { placeholder: '备注', type: 'textarea' },
      fieldName: 'remark',
      label: '备注',
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
    modalApi.setState({ title: data?.record?.id ? '编辑角色' : '新增角色' });
    if (data?.record) {
      formApi.setValues(data.record);
    } else {
      formApi.resetForm();
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>

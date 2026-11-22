<script lang="ts" setup>
import type { CemeteryPark } from '#/api/cemetery/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createParkApi, updateParkApi } from '#/api';

defineOptions({ name: 'ParkFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: CemeteryPark;
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    if (data?.record?.id) {
      await updateParkApi(data.record.id, values);
    } else {
      await createParkApi(values as never);
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入园区名称' },
      fieldName: 'name',
      label: '园区名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入园区编码，如 QS' },
      fieldName: 'code',
      label: '园区编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入地址' },
      fieldName: 'address',
      label: '地址',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入联系人' },
      fieldName: 'contact',
      label: '联系人',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入联系电话' },
      fieldName: 'phone',
      label: '联系电话',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '运营中', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '备注' },
      fieldName: 'remark',
      label: '备注',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
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
    modalApi.setState({
      title: data?.record?.id ? '编辑园区' : '新增园区',
    });
    if (data?.record) {
      formApi.setValues(data.record);
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>

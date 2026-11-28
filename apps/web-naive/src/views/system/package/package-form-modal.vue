<script lang="ts" setup>
import type { SysTenantPackage } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { packageApi } from '#/api';

defineOptions({ name: 'PackageFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysTenantPackage;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await packageApi.save({ ...values, id: data?.record?.id });
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      type: 'group',
      name: 'basic',
      title: '套餐信息',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: ({ rootValues }) => ({
            placeholder: '如 standard',
            disabled: !!rootValues?.id,
          }),
          fieldName: 'packageCode',
          label: '套餐编码',
          rules: 'required',
        },
        {
          component: 'Input',
          componentProps: { placeholder: '请输入套餐名称' },
          fieldName: 'packageName',
          label: '套餐名称',
          rules: 'required',
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
          help: '停用后新租户不可再选此套餐',
        },
        {
          component: 'Textarea',
          componentProps: {
            placeholder: '请输入备注',
            autosize: { minRows: 2, maxRows: 4 },
            class: 'w-full',
          },
          fieldName: 'remark',
          label: '备注',
          formItemClass: 'col-span-2',
        },
      ],
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[560px]',
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
    modalApi.setState({ title: data?.record?.id ? '编辑套餐' : '新增套餐' });
    if (data?.record) {
      formApi.setValues(data.record);
    } else {
      formApi.resetForm();
      formApi.setValues({ status: 1 });
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>

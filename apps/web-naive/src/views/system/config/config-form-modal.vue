<script lang="ts" setup>
import type { SysConfig } from '#/api/system/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { configApi } from '#/api';

defineOptions({ name: 'ConfigFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysConfig;
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await (data?.record?.id
      ? configApi.update({
          id: data.record.id,
          configValue: values.configValue,
          valueType: values.valueType,
          remark: values.remark,
        })
      : configApi.create(values));
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        placeholder: '请输入参数键',
        disabled: !!rootValues?.id,
      }),
      fieldName: 'configKey',
      label: '参数键',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入参数名称' },
      fieldName: 'configName',
      label: '参数名称',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 common、system' },
      fieldName: 'configGroup',
      label: '分组',
    },
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        placeholder: rootValues?.sensitive
          ? '敏感参数请在保存后单独设置'
          : '请输入参数值',
        type: rootValues?.sensitive ? 'password' : 'text',
      }),
      fieldName: 'configValue',
      label: '参数值',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '字符串', value: 'STRING' },
          { label: '数字', value: 'NUMBER' },
          { label: '布尔', value: 'BOOLEAN' },
          { label: 'JSON', value: 'JSON' },
        ],
      },
      defaultValue: 'STRING',
      fieldName: 'valueType',
      label: '值类型',
    },
    {
      component: 'Switch',
      fieldName: 'sensitive',
      label: '敏感参数',
      defaultValue: false,
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
    modalApi.setState({ title: data?.record?.id ? '编辑参数' : '新增参数' });
    if (data?.record) {
      // 敏感参数回显时不带明文，configValue 留空
      const { configValue: _v, ...rest } = data.record;
      formApi.setValues(rest);
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

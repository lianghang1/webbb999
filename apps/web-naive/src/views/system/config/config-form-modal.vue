<script lang="ts" setup>
import type { SysConfig } from '#/api/system/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NAlert, NButton, NTag } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { configApi } from '#/api';

defineOptions({ name: 'ConfigFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysConfig;
}

const isJson = ref(false);
const isSecret = ref(false);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    let configValue = values.configValue as string | undefined;

    if (values.valueType === 'JSON' && configValue) {
      try {
        configValue = JSON.stringify(JSON.parse(configValue), null, 2);
      } catch {
        message.error('JSON 格式不正确，请检查后再保存');
        return;
      }
    }

    if (data?.record?.id) {
      const payload: Record<string, unknown> = {
        id: data.record.id,
        remark: values.remark,
        valueType: values.valueType,
      };
      // 敏感参数的值只能通过 /config/secret 修改，基础修改接口不碰敏感值
      if (!data.record.needEncrypt && configValue !== undefined) {
        payload.configValue = configValue;
      }
      await configApi.update(payload as any);
    } else {
      await configApi.create({
        configGroup: values.configGroup || 'DEFAULT',
        configKey: values.configKey,
        configValue: configValue || '',
        needEncrypt: !!values.needEncrypt,
        remark: values.remark,
        valueType: values.valueType,
      });
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        disabled: !!rootValues?.id,
        placeholder: '如 wechat.pay.appId，同一分组内唯一',
      }),
      fieldName: 'configKey',
      label: '参数键',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 common、wechat.pay，留空为 DEFAULT' },
      fieldName: 'configGroup',
      label: '分组',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '字符串 STRING', value: 'STRING' },
          { label: '数字 NUMBER', value: 'NUMBER' },
          { label: '布尔 BOOLEAN', value: 'BOOLEAN' },
          { label: 'JSON 对象', value: 'JSON' },
        ],
      },
      defaultValue: 'STRING',
      dependencies: {
        trigger(values) {
          isJson.value = values.valueType === 'JSON';
        },
        triggerFields: ['valueType'],
      },
      fieldName: 'valueType',
      label: '值类型',
    },
    {
      component: 'Input',
      componentProps: ({ rootValues }) => ({
        autosize:
          rootValues?.valueType === 'JSON'
            ? { minRows: 6, maxRows: 14 }
            : undefined,
        placeholder:
          rootValues?.valueType === 'JSON'
            ? '请输入合法 JSON，例如 {"enabled": true, "timeout": 30}'
            : '请输入参数值',
        type: rootValues?.valueType === 'JSON' ? 'textarea' : 'text',
      }),
      fieldName: 'configValue',
      label: '参数值',
    },
    {
      component: 'Switch',
      componentProps: ({ rootValues }) => ({ disabled: !!rootValues?.id }),
      defaultValue: false,
      fieldName: 'needEncrypt',
      help: '开启后数据库仅保存密文，修改敏感值请使用列表页的「敏感」操作',
      label: '敏感参数',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '参数用途说明', type: 'textarea' },
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
    const editing = !!data?.record?.id;
    isSecret.value = !!data?.record?.needEncrypt;
    isJson.value = data?.record?.valueType === 'JSON';
    modalApi.setState({ title: editing ? '编辑参数' : '新增参数' });
    if (data?.record) {
      // 敏感参数回显时不带明文，configValue 留空
      formApi.setValues({
        ...data.record,
        configValue: data.record.needEncrypt
          ? ''
          : (data.record.configValue as string) || '',
      });
    } else {
      formApi.resetForm();
      formApi.setValues({ needEncrypt: false, valueType: 'STRING' });
    }
  },
});

async function formatJson() {
  const values = await formApi.getValues();
  try {
    const parsed = JSON.parse(String(values.configValue || '{}'));
    formApi.setValues({ configValue: JSON.stringify(parsed, null, 2) });
    message.success('JSON 已格式化');
  } catch {
    message.error('JSON 格式不正确');
  }
}
</script>

<template>
  <Modal>
    <Form />
    <div class="flex items-center justify-between px-6 pb-4">
      <div>
        <NAlert v-if="isSecret" type="warning" :bordered="false">
          <NTag type="error" size="small" :bordered="false">敏感参数</NTag>
          值不会在此处回显，请使用列表页「敏感」操作查看明文或修改。
        </NAlert>
        <span v-else class="text-xs text-muted-foreground">
          {{
            isJson ? 'JSON 类型将自动格式化并校验' : '参数值将按选定类型写入'
          }}
        </span>
      </div>
      <NButton
        v-if="isJson"
        size="small"
        quaternary
        type="primary"
        @click="formatJson"
      >
        格式化 JSON
      </NButton>
    </div>
  </Modal>
</template>

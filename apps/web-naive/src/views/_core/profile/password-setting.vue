<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message } from '#/adapter/naive';
import { changePasswordApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'ProfilePasswordSetting' });

const authStore = useAuthStore();
const submitting = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '旧密码',
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入当前密码',
      },
      rules: z.string().min(1, { message: '请输入当前密码' }),
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '至少 8 位，包含字母与数字',
      },
      rules: z.string().min(8, { message: '新密码至少 8 位' }),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  if (submitting.value) {
    return;
  }
  submitting.value = true;
  try {
    await changePasswordApi({
      newPassword: values.newPassword,
      oldPassword: values.oldPassword,
    });
    message.success('密码修改成功，所有终端已下线，请重新登录');
    await authStore.logout(true);
  } catch {
    // 请求层已统一提示错误
  } finally {
    submitting.value = false;
  }
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>

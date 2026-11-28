<script lang="ts" setup>
import type { SysTenant, SysUser } from '#/api/system/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { NSelect, NSpin } from 'naive-ui';

import { message } from '#/adapter/naive';
import { roleApi, tenantApi, userApi } from '#/api';

defineOptions({ name: 'UserGrantModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysUser;
}

interface RoleOption {
  id: string;
  roleCode: string;
  roleName: string;
}

const userStore = useUserStore();
/** 平台超管可跨租户分配；租户管理员仅限本租户（租户下拉隐藏 + 后端兜底校验） */
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

const tenants = ref<SysTenant[]>([]);
const roles = ref<RoleOption[]>([]);
const selectedTenantId = ref<null | string>(null);
const selectedRoles = ref<string[]>([]);
const loading = ref(false);

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const data = modalApi.getData();
    if (!data?.record?.id) {
      return;
    }
    // 租户管理员使用当前登录租户；平台超管使用选中的租户
    const tenantId = isPlatformAdmin.value
      ? selectedTenantId.value
      : (userStore.userInfo?.tenantId ?? selectedTenantId.value);
    if (!tenantId) {
      message.error('请选择租户');
      return;
    }
    loading.value = true;
    try {
      await userApi.assignTenant({
        userId: data.record.id,
        tenantId,
      });
      await userApi.assignRoles({
        userId: data.record.id,
        tenantId,
        roleIds: selectedRoles.value,
      });
      message.success('授权成功');
      modalApi.close();
      await data?.onSuccess?.();
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    modalApi.setState({ title: `用户授权 - ${data?.record?.nickname ?? ''}` });
    loading.value = true;
    try {
      const [tenantPage, rolePage] = await Promise.all([
        tenantApi.list({ pageNum: 1, pageSize: -1 }),
        roleApi.list({ pageNum: 1, pageSize: -1 }),
      ]);
      tenants.value = tenantPage.list;
      roles.value = rolePage.list as RoleOption[];
      if (isPlatformAdmin.value) {
        // 平台超管：默认选中用户当前所属租户（若有）
        selectedTenantId.value = data?.record?.tenantId
          ? String(data.record.tenantId)
          : null;
      } else {
        // 租户管理员：固定本租户，不展示下拉
        selectedTenantId.value = userStore.userInfo?.tenantId ?? null;
      }
      selectedRoles.value = [];
      if (selectedTenantId.value && data?.record?.id) {
        await loadUserRoles(data.record.id, selectedTenantId.value);
      }
    } finally {
      loading.value = false;
    }
  },
});

async function loadUserRoles(userId: number | string, tenantId: string) {
  const uid = String(userId);
  const codes = await userApi.roles(uid, tenantId);
  const codeSet = new Set(codes);
  selectedRoles.value = roles.value
    .filter((r) => codeSet.has(r.roleCode))
    .map((r) => r.id);
}

async function onTenantChange(tenantId: null | string) {
  selectedTenantId.value = tenantId;
  selectedRoles.value = [];
  const data = modalApi.getData();
  if (!tenantId || !data?.record?.id) {
    return;
  }
  await loadUserRoles(data.record.id, tenantId);
}
</script>

<template>
  <Modal>
    <NSpin :show="loading">
      <div class="flex flex-col gap-4 p-4">
        <!-- 租户下拉仅平台超管可见；租户管理员固定本租户 -->
        <div v-if="isPlatformAdmin">
          <div class="mb-2 font-medium">选择租户</div>
          <NSelect
            v-model:value="selectedTenantId"
            :options="
              tenants.map((t) => ({ label: t.tenantName, value: String(t.id) }))
            "
            placeholder="请选择租户"
            filterable
            clearable
            @update:value="onTenantChange"
          />
        </div>
        <div v-else>
          <div class="mb-2 font-medium">当前租户</div>
          <div
            class="rounded border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
          >
            {{
              tenants.find((t) => String(t.id) === selectedTenantId)
                ?.tenantName ?? '本租户'
            }}
          </div>
        </div>
        <div>
          <div class="mb-2 font-medium">分配角色（可搜索、多选）</div>
          <NSelect
            v-model:value="selectedRoles"
            :options="roles.map((r) => ({ label: r.roleName, value: r.id }))"
            placeholder="请选择角色"
            multiple
            filterable
            clearable
            :max-tag-count="4"
          />
        </div>
      </div>
    </NSpin>
  </Modal>
</template>

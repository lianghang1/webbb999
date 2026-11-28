<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { NButton, NCard, NGi, NGrid, NSpin, NTag } from 'naive-ui';

import { auditApi, fileApi, menuApi, roleApi, tenantApi, userApi } from '#/api';

defineOptions({ name: 'DashboardWorkspace' });

const router = useRouter();
const userStore = useUserStore();

const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);
const userInfoName = computed(
  () => userStore.userInfo?.realName || userStore.userInfo?.username || '用户',
);

/** 系统数据概览：各模块 list 的 total */
const stats = ref<
  { label: string; value: number; icon: string; color: string; route: string }[]
>([]);
const statsLoading = ref(true);

/** 最近登录记录 */
const recentLogins = ref<
  { username: string; success: boolean; loginTime: string; ip: string }[]
>([]);

/** 系统快捷入口（真实路由） */
const shortcuts = computed(() => {
  const base = [
    {
      title: '用户管理',
      desc: '账号与资料、部门归属',
      icon: 'carbon:user-multiple',
      color: '#2080f0',
      route: '/system/user',
    },
    {
      title: '角色管理',
      desc: '角色与数据权限',
      icon: 'carbon:user-role',
      color: '#8a2be2',
      route: '/system/role',
    },
    {
      title: '菜单管理',
      desc: '菜单与 URL 权限',
      icon: 'carbon:menu',
      color: '#18a058',
      route: '/system/menu',
    },
    {
      title: '部门管理',
      desc: '组织架构维护',
      icon: 'carbon:tree-view',
      color: '#f0a020',
      route: '/system/dept',
    },
    {
      title: '字典管理',
      desc: '数据字典维护',
      icon: 'carbon:book',
      color: '#d03050',
      route: '/system/dict',
    },
    {
      title: '参数配置',
      desc: '系统参数与敏感配置',
      icon: 'carbon:settings',
      color: '#4098fc',
      route: '/system/config',
    },
    {
      title: '文件管理',
      desc: '文件上传与访问',
      icon: 'carbon:document',
      color: '#0ca678',
      route: '/system/file',
    },
    {
      title: '审计日志',
      desc: '登录与操作审计',
      icon: 'carbon:activity',
      color: '#7048e8',
      route: '/audit',
    },
  ];
  return isPlatformAdmin.value
    ? [
        {
          title: '租户管理',
          desc: '租户与开通管理',
          icon: 'carbon:enterprise',
          color: '#e8590c',
          route: '/system/tenant',
        },
        {
          title: '套餐管理',
          desc: '套餐与菜单授权',
          icon: 'carbon:package',
          color: '#1098ad',
          route: '/system/package',
        },
        ...base,
      ]
    : base;
});

async function loadData() {
  statsLoading.value = true;
  try {
    // 并行拉取各模块总数（pageSize=1 只为拿 total）
    const [users, roles, menus, files] = await Promise.all([
      userApi.list({ pageNum: 1, pageSize: 1 }),
      roleApi.list({ pageNum: 1, pageSize: 1 }),
      menuApi.list({ pageNum: 1, pageSize: 1 }),
      fileApi.list({ pageNum: 1, pageSize: 1 }),
    ]);
    const items = [
      {
        label: '用户数',
        value: users.total,
        icon: 'carbon:user-multiple',
        color: '#2080f0',
        route: '/system/user',
      },
      {
        label: '角色数',
        value: roles.total,
        icon: 'carbon:user-role',
        color: '#8a2be2',
        route: '/system/role',
      },
      {
        label: '菜单数',
        value: menus.total,
        icon: 'carbon:menu',
        color: '#18a058',
        route: '/system/menu',
      },
      {
        label: '文件数',
        value: files.total,
        icon: 'carbon:document',
        color: '#f0a020',
        route: '/system/file',
      },
    ];
    if (isPlatformAdmin.value) {
      const tenants = await tenantApi.list({ pageNum: 1, pageSize: 1 });
      items.push({
        label: '租户数',
        value: tenants.total,
        icon: 'carbon:enterprise',
        color: '#e8590c',
        route: '/system/tenant',
      });
    }
    stats.value = items;

    // 最近 5 条登录记录
    const logs = await auditApi.loginLogs({ pageNum: 1, pageSize: 5 });
    recentLogins.value = logs.list.map((l) => ({
      username: l.username || '—',
      success: !!l.success,
      loginTime: l.loginTime || '',
      ip: l.ip || '—',
    }));
  } finally {
    statsLoading.value = false;
  }
}

onMounted(loadData);

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '—';
}

function greet() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}
</script>

<template>
  <div class="p-5">
    <!-- 欢迎卡片 -->
    <NCard class="mb-4" :bordered="false">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
            style="background: linear-gradient(135deg, #2080f0, #7048e8)"
          >
            {{ userInfoName.charAt(0) }}
          </div>
          <div>
            <div class="text-xl font-semibold">
              {{ greet() }}，{{ userInfoName }}
            </div>
            <div
              class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            >
              <span>欢迎使用后台管理系统</span>
              <NTag
                size="small"
                :bordered="false"
                :type="isPlatformAdmin ? 'warning' : 'info'"
              >
                {{ isPlatformAdmin ? '平台管理员' : '租户用户' }}
              </NTag>
            </div>
          </div>
        </div>
        <NButton size="small" quaternary @click="router.push('/system/user')">
          前往用户管理 →
        </NButton>
      </div>
    </NCard>

    <!-- 系统数据概览 -->
    <NSpin :show="statsLoading">
      <NGrid
        :cols="4"
        :x-gap="16"
        :y-gap="16"
        responsive="screen"
        item-responsive
      >
        <NGi v-for="s in stats" :key="s.label" span="m:1 s:2">
          <NCard
            :bordered="false"
            class="cursor-pointer transition-shadow hover:shadow-md"
            @click="router.push(s.route)"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-lg text-white"
                :style="{ backgroundColor: s.color }"
              >
                <IconifyIcon :icon="s.icon" width="22" height="22" />
              </div>
              <div>
                <div class="text-2xl font-semibold">{{ s.value }}</div>
                <div class="text-xs text-muted-foreground">{{ s.label }}</div>
              </div>
            </div>
          </NCard>
        </NGi>
      </NGrid>
    </NSpin>

    <!-- 快捷入口 + 最近登录 -->
    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <NCard title="快捷入口" :bordered="false" class="lg:col-span-2">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            v-for="q in shortcuts"
            :key="q.route"
            class="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
            @click="router.push(q.route)"
          >
            <IconifyIcon
              :icon="q.icon"
              width="22"
              height="22"
              :style="{ color: q.color }"
            />
            <div class="min-w-0">
              <div class="text-sm font-medium">{{ q.title }}</div>
              <div class="truncate text-xs text-muted-foreground">
                {{ q.desc }}
              </div>
            </div>
          </button>
        </div>
      </NCard>

      <NCard title="最近登录" :bordered="false">
        <div v-if="recentLogins.length" class="flex flex-col gap-3">
          <div
            v-for="(log, idx) in recentLogins"
            :key="idx"
            class="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium">{{ log.username }}</span>
                <NTag
                  size="tiny"
                  :bordered="false"
                  :type="log.success ? 'success' : 'error'"
                >
                  {{ log.success ? '成功' : '失败' }}
                </NTag>
              </div>
              <div class="mt-0.5 text-xs text-muted-foreground">
                {{ formatTime(log.loginTime) }} · {{ log.ip }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-6 text-center text-sm text-muted-foreground">
          暂无登录记录
        </div>
      </NCard>
    </div>
  </div>
</template>

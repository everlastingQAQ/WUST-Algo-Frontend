<template>
  <BaseLayout>
    <div class="bulletin-page">
      <div class="page-header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-envelope" />
          </span>
          <span class="title-text">消息</span>
        </div>
      </div>

      <div class="bulletin-list" style="position: relative;">
        <LoadingOverlay :show="loading" />
        <div v-if="bulletins.length === 0 && invites.length === 0 && !loading" class="empty-tip">暂无消息</div>
        <div
          v-for="item in bulletins"
          :key="item.id"
          class="bulletin-card"
          :class="{ pinned: item.isPinned, expanded: expandedId === item.id }"
          @click="handleCardClick($event, item.id)"
        >
          <div class="card-header">
            <div class="card-title-row">
              <span v-if="item.isPinned" class="pinned-badge">
                <font-awesome-icon icon="fa-solid fa-thumbtack" />
                置顶
              </span>
              <span class="card-title">{{ item.title }}</span>
            </div>
            <div class="card-meta">
              <span class="meta-author">{{ item.authorName }}</span>
              <span class="meta-divider">|</span>
              <span class="meta-time">{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
          <transition name="expand">
            <div v-if="expandedId === item.id" class="card-content" v-html="item.content"></div>
          </transition>
        </div>
        <div
          v-for="invite in invites"
          :key="`invite-${invite.id}`"
          class="bulletin-card invite-card"
        >
          <div class="card-header invite-header">
            <div class="card-title-row">
              <span class="pinned-badge invite-badge">
                <font-awesome-icon icon="fa-solid fa-user-group" />
                邀请
              </span>
              <span class="card-title">{{ invite.inviterName || '队长' }} 邀请你加入 {{ invite.groupName || `团队 ${invite.groupId}` }}</span>
            </div>
            <div class="card-meta">
              <span class="meta-time">{{ formatTime(invite.createdAt) }}</span>
            </div>
          </div>
          <div class="invite-actions">
            <button class="invite-action primary" @click="respondInvite(invite.id, true)">同意</button>
            <button class="invite-action" @click="respondInvite(invite.id, false)">拒绝</button>
          </div>
        </div>
      </div>

      <div class="pageNavigation" v-if="totalPage > 1">
        <div class="group">
          <div class="pageButtons" v-if="currentPage > 1">
            <button @click="fetchBulletins(currentPage - 1)">上一页</button>
          </div>
          <div class="pageButtons">
            <button
              v-for="value in pages"
              :key="value"
              :class="value === currentPage ? 'active' : ''"
              @click="value === currentPage ? null : fetchBulletins(value)"
            >{{ value }}</button>
          </div>
          <div class="pageButtons" v-if="currentPage < totalPage">
            <button @click="fetchBulletins(currentPage + 1)">下一页</button>
          </div>
        </div>
        <div class="group">
          <div class="pageInput">
            <button @click="fetchBulletins(jumpPage)">跳转</button>
            <input type="number" min="1" :max="totalPage" v-model="jumpPage">
          </div>
          <div class="pageSum">共 {{ totalPage }} 页</div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BaseLayout from '@/components/BaseLayout.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { useUserStore } from '@/stores/user'
import API, { type BulletinInfo, type UserTeamInvite } from '@/utils/api'
import Toast from '@/utils/toast'

const route = useRoute()
const userStore = useUserStore()
const loading = ref(true)
const bulletins = ref<BulletinInfo[]>([])
const invites = ref<UserTeamInvite[]>([])
const currentPage = ref(1)
const totalPage = ref(1)
const total = ref(0)
const jumpPage = ref(1)
const expandedId = ref<number | null>(null)

const pageSize = 10

const pages = computed(() => {
  if (totalPage.value <= 3) return Array.from({ length: totalPage.value }, (_, i) => i + 1)
  if (currentPage.value <= 1) return [1, 2, 3]
  if (currentPage.value >= totalPage.value - 1) return [totalPage.value - 2, totalPage.value - 1, totalPage.value]
  return [currentPage.value - 1, currentPage.value, currentPage.value + 1]
})

const fetchBulletins = async (page: number) => {
  loading.value = true
  const [bulletinResponse, inviteResponse] = await Promise.all([
    API.core.bulletin.list(page, pageSize),
    userStore.isLogin ? API.user.team.invites() : Promise.resolve(null)
  ])
  Toast.stdResponse(bulletinResponse, false)
  if (bulletinResponse.success) {
    bulletins.value = bulletinResponse.data.data
    total.value = bulletinResponse.data.total
    totalPage.value = Math.ceil(bulletinResponse.data.total / pageSize)
    currentPage.value = page
    jumpPage.value = page
  }
  if (inviteResponse?.success) {
    invites.value = inviteResponse.data.list
  } else {
    invites.value = []
  }
  loading.value = false
}

const handleCardClick = (event: MouseEvent, id: number) => {
  // 点击链接时不收起卡片，让浏览器处理导航
  // 使用 composedPath 因为 event.target 可能是 a 标签内的文本节点
  if (event.composedPath().some(el => el instanceof HTMLAnchorElement)) return
  expandedId.value = expandedId.value === id ? null : id
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const respondInvite = async (inviteId: number, accept: boolean) => {
  const response = await API.user.team.respondInvite(inviteId, accept)
  Toast.stdResponse(response)
  if (response.success) {
    await fetchBulletins(currentPage.value)
  }
}

onMounted(() => {
  // Check if we should expand a specific bulletin from query param
  const expandParam = route.query.expand
  if (expandParam) {
    expandedId.value = Number(expandParam)
  }
  fetchBulletins(1)
})
</script>

<style scoped>
@import '@/assets/css/navagation.css';

.bulletin-page {
  padding: 20px;
  color: var(--text-default-color);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  border-radius: 12px;
  background: var(--background-header);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-lg);
  font-weight: 600;
}

.title-icon {
  font-size: var(--text-lg);
}

.title-text {
  color: var(--text-default-color);
}

.bulletin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--text-light-color);
  font-size: var(--text-base);
}

.bulletin-card {
  background-color: var(--background-color-content);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.bulletin-card.expanded {
  cursor: auto;
}

.bulletin-card:hover {
  border-color: var(--neon-cyan);
  transform: translateX(4px);
}

.bulletin-card.pinned {
  border-left: 3px solid var(--neon-cyan);
}

.invite-card {
  cursor: default;
}

.invite-card:hover {
  transform: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pinned-badge {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--neon-cyan);
  color: var(--background-color-1);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-light-color);
}

.invite-header {
  align-items: flex-start;
}

.invite-badge {
  background-color: rgba(0, 255, 255, 0.14);
  color: var(--text-default-color);
}

.invite-actions {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}

.invite-action {
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--text-light-color);
  background-color: var(--background-color-1);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 800;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.invite-action.primary {
  color: var(--text-light-color);
  background-color: var(--background-color-1);
}

.invite-action:hover {
  border-color: var(--neon-cyan);
  color: var(--text-reverse-color);
  background-color: var(--neon-cyan);
}

.meta-divider {
  opacity: 0.5;
}

.card-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
  font-size: var(--text-base);
  line-height: 1.6;
  overflow: hidden;
}

/* expand transition */
.expand-enter-active {
  transition: all 0.3s ease;
}

.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

@media (max-width: 860px) {
  .bulletin-page {
    padding: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

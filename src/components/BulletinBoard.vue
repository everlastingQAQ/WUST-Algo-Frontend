<template>
  <div class="bulletin-board" style="position: relative;">
    <LoadingOverlay :show="loading" />
    <div v-if="bulletins.length === 0 && !loading" class="empty-tip">暂无公告</div>
    <div
      v-for="item in bulletins"
      :key="item.id"
      class="bulletin-item"
      @click="goToBulletin(item.id)"
    >
      <span v-if="item.isPinned" class="pin-icon">
        <font-awesome-icon icon="fa-solid fa-thumbtack" />
      </span>
      <span v-else class="item-icon">
        <font-awesome-icon icon="fa-solid fa-bell" />
      </span>
      <span class="item-title">{{ item.title }}</span>
      <span class="item-time">{{ formatTime(item.createdAt) }}</span>
    </div>
    <div class="board-footer">
      <router-link to="/bulletin" class="view-all">
        查看全部 <font-awesome-icon icon="fa-solid fa-arrow-right" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import API, { type BulletinInfo } from '@/utils/api'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

const router = useRouter()
const loading = ref(true)
const bulletins = ref<BulletinInfo[]>([])

const fetchBulletins = async () => {
  loading.value = true
  const response = await API.core.bulletin.list(1, 5)
  if (response.success) {
    bulletins.value = response.data.data
  }
  loading.value = false
}

const goToBulletin = (id: number) => {
  router.push(`/bulletin?expand=${id}`)
}

const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  }
  return d.toLocaleDateString('sv-SE', { month: '2-digit', day: '2-digit' })
}

onMounted(() => {
  fetchBulletins()
})
</script>

<style scoped>
.bulletin-board {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 60px;
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: var(--text-light-color);
  font-size: var(--text-sm);
}

.bulletin-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--divider-color);
}

.bulletin-item:last-of-type {
  border-bottom: none;
}

.bulletin-item:hover {
  color: var(--neon-cyan);
}

.pin-icon {
  color: var(--neon-cyan);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.item-icon {
  color: var(--text-light-color);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.item-title {
  flex: 1;
  font-size: var(--text-sm);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-time {
  font-size: var(--text-xs);
  color: var(--text-light-color);
  flex-shrink: 0;
}

.board-footer {
  padding-top: 8px;
  text-align: right;
}

.view-all {
  font-size: var(--text-sm);
  color: var(--neon-cyan);
  text-decoration: none;
  transition: opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.view-all:hover {
  opacity: 0.8;
}
</style>

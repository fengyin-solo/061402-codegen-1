<template>
  <Teleport to="body">
    <Transition name="event-modal">
      <div v-if="showEvent" class="night-event-overlay" @click.self="closeEvent">
        <div class="night-event-modal" :class="{ 'urgent': isUrgent }">
          <div class="event-header">
            <span class="event-icon">{{ currentEvent?.icon || '⚠️' }}</span>
            <div class="event-title-section">
              <h3 class="event-title">{{ currentEvent?.name || '夜间事件' }}</h3>
              <span class="event-time">第{{ survivalStore.day }}天 · {{ timePeriodName }}</span>
            </div>
            <el-button class="close-btn" type="text" @click="closeEvent">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          
          <div class="event-body">
            <p class="event-description">{{ currentEvent?.description }}</p>
            
            <div class="event-requirements" v-if="eventRequirements.length > 0">
              <h4>应对条件</h4>
              <div class="requirements-list">
                <div 
                  v-for="req in eventRequirements" 
                  :key="req.label" 
                  class="requirement-item"
                  :class="{ 'met': req.met, 'not-met': !req.met }"
                >
                  <span class="req-icon">{{ req.met ? '✅' : '❌' }}</span>
                  <span class="req-label">{{ req.label }}</span>
                  <span class="req-value">{{ req.current }} / {{ req.required }}</span>
                </div>
              </div>
            </div>
            
            <div class="event-effects" v-if="eventEffects.length > 0">
              <h4>可能影响</h4>
              <div class="effects-list">
                <div 
                  v-for="effect in eventEffects" 
                  :key="effect.resource" 
                  class="effect-item"
                  :class="{ 'positive': effect.amount > 0, 'negative': effect.amount < 0 }"
                >
                  <span class="effect-icon">{{ effect.icon }}</span>
                  <span class="effect-name">{{ effect.name }}</span>
                  <span class="effect-amount">{{ effect.amount > 0 ? '+' : '' }}{{ effect.amount }}</span>
                </div>
              </div>
            </div>
            
            <div class="event-outcome" v-if="eventResult !== null">
              <div class="outcome-card" :class="{ success: eventResult, failure: !eventResult }">
                <span class="outcome-icon">{{ eventResult ? '🎉' : '💔' }}</span>
                <div class="outcome-content">
                  <h4>{{ eventResult ? '应对成功！' : '应对失败...' }}</h4>
                  <p>{{ eventResult ? currentEvent?.successMessage : currentEvent?.failMessage }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="event-footer">
            <el-button 
              v-if="eventResult === null"
              type="primary" 
              size="large"
              @click="resolveEvent"
            >
              面对事件
            </el-button>
            <el-button 
              v-else
              type="primary" 
              size="large"
              @click="closeEvent"
            >
              知道了
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  
  <div class="event-history">
    <div class="history-header">
      <h4>📜 事件记录</h4>
      <el-tag size="small" type="info">共 {{ survivalStore.eventLog.length }} 条</el-tag>
    </div>
    <div class="history-list">
      <div 
        v-for="(log, index) in recentEvents" 
        :key="index" 
        class="history-item"
        :class="{ success: log.success, failure: !log.success }"
      >
        <span class="history-icon">{{ log.icon }}</span>
        <div class="history-info">
          <div class="history-event">{{ log.event }}</div>
          <div class="history-day">第{{ log.day }}天</div>
        </div>
        <el-tag :type="log.success ? 'success' : 'danger'" size="small">
          {{ log.success ? '成功' : '失败' }}
        </el-tag>
      </div>
      <div v-if="recentEvents.length === 0" class="empty-history">
        <el-empty description="暂无夜间事件记录" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useSurvivalStore } from '../store';
import { Close } from '@element-plus/icons-vue';

const survivalStore = useSurvivalStore();

const showEvent = ref(false);
const eventResult = ref(null);
const pendingEvent = ref(null);

const currentEvent = computed(() => {
  return pendingEvent.value || survivalStore.currentNightEvent;
});

const timePeriodName = computed(() => survivalStore.getTimePeriodName());

const isUrgent = computed(() => {
  const event = currentEvent.value;
  if (!event) return false;
  return event.id === 'beast_attack' || event.id === 'storm';
});

const eventRequirements = computed(() => {
  const event = currentEvent.value;
  if (!event) return [];
  
  const reqs = [];
  
  if (event.defenseRequired) {
    reqs.push({
      label: '营地防御',
      current: survivalStore.defense,
      required: event.defenseRequired,
      met: survivalStore.defense >= event.defenseRequired
    });
  }
  
  if (event.shelterRequired) {
    reqs.push({
      label: '庇护所',
      current: survivalStore.buildings.shelter.built ? 1 : 0,
      required: 1,
      met: survivalStore.buildings.shelter.built
    });
  }
  
  if (event.guardRequired) {
    reqs.push({
      label: '守卫人数',
      current: survivalStore.guards.length,
      required: 1,
      met: survivalStore.guards.length > 0
    });
  }
  
  if (event.waterRequired) {
    reqs.push({
      label: '淡水储备',
      current: Math.floor(survivalStore.resources.water),
      required: event.waterRequired,
      met: survivalStore.resources.water >= event.waterRequired
    });
  }
  
  if (event.warmthRequired) {
    reqs.push({
      label: '营地温度',
      current: survivalStore.warmth,
      required: event.warmthRequired,
      met: survivalStore.warmth >= event.warmthRequired
    });
  }
  
  return reqs;
});

const eventEffects = computed(() => {
  const event = currentEvent.value;
  if (!event || !event.effect) return [];
  
  const icons = { food: '🍖', water: '💧', wood: '🪵', stone: '⛏️' };
  const names = { food: '食物', water: '淡水', wood: '木材', stone: '石头' };
  
  return Object.entries(event.effect).map(([resource, amount]) => ({
    resource,
    name: names[resource] || resource,
    icon: icons[resource] || '📦',
    amount
  }));
});

const recentEvents = computed(() => {
  return survivalStore.eventLog
    .filter(log => log.event)
    .slice()
    .reverse()
    .slice(0, 10);
});

watch(() => survivalStore.currentNightEvent, (newEvent) => {
  if (newEvent && !showEvent.value) {
    pendingEvent.value = newEvent;
    showEvent.value = true;
    eventResult.value = null;
  }
});

const resolveEvent = () => {
  const reqs = eventRequirements.value;
  eventResult.value = reqs.length === 0 || reqs.every(r => r.met);
};

const closeEvent = () => {
  showEvent.value = false;
  pendingEvent.value = null;
  eventResult.value = null;
};
</script>

<style scoped>
.night-event-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.night-event-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalIn 0.3s ease;
}

.night-event-modal.urgent {
  border: 3px solid #f56c6c;
  animation: urgentPulse 2s infinite;
}

@keyframes urgentPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
  50% { box-shadow: 0 0 0 20px rgba(245, 108, 108, 0); }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.event-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  position: relative;
}

.urgent .event-header {
  background: linear-gradient(135deg, #f56c6c 0%, #e74c3c 100%);
}

.event-icon {
  font-size: 48px;
}

.event-title-section {
  flex: 1;
}

.event-title {
  margin: 0 0 5px 0;
  font-size: 20px;
}

.event-time {
  font-size: 12px;
  opacity: 0.9;
}

.close-btn {
  color: white !important;
  font-size: 20px;
}

.event-body {
  padding: 25px;
}

.event-description {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.event-requirements,
.event-effects {
  margin-bottom: 20px;
}

.event-requirements h4,
.event-effects h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

.requirements-list,
.effects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-radius: 8px;
  background: #f0f9eb;
  border: 1px solid #67c23a;
}

.requirement-item.not-met {
  background: #fef0f0;
  border-color: #f56c6c;
}

.req-label {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.req-value {
  font-weight: bold;
  font-size: 13px;
  color: #67c23a;
}

.not-met .req-value {
  color: #f56c6c;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-radius: 8px;
  background: #f0f9eb;
  border: 1px solid #67c23a;
}

.effect-item.negative {
  background: #fef0f0;
  border-color: #f56c6c;
}

.effect-icon {
  font-size: 20px;
}

.effect-name {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.effect-amount {
  font-weight: bold;
  font-size: 14px;
  color: #67c23a;
}

.negative .effect-amount {
  color: #f56c6c;
}

.event-outcome {
  margin-top: 20px;
}

.outcome-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border: 2px solid #67c23a;
}

.outcome-card.failure {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #f56c6c;
}

.outcome-icon {
  font-size: 40px;
}

.outcome-content h4 {
  margin: 0 0 5px 0;
  color: #67c23a;
  font-size: 16px;
}

.failure .outcome-content h4 {
  color: #f56c6c;
}

.outcome-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.event-footer {
  padding: 15px 25px 25px;
  display: flex;
  justify-content: center;
}

.event-footer .el-button {
  width: 100%;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
}

.event-modal-enter-active,
.event-modal-leave-active {
  transition: all 0.3s ease;
}

.event-modal-enter-from,
.event-modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.event-history {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.history-header h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.history-item:hover {
  transform: translateX(5px);
  background: #eef1f6;
}

.history-icon {
  font-size: 24px;
}

.history-info {
  flex: 1;
}

.history-event {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.history-day {
  font-size: 11px;
  color: #999;
}

.empty-history {
  padding: 20px;
}

@media (max-width: 768px) {
  .night-event-modal {
    width: 95%;
    margin: 10px;
  }
  
  .event-header {
    padding: 15px 20px;
  }
  
  .event-body {
    padding: 20px;
  }
}
</style>

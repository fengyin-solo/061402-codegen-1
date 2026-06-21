<template>
  <div class="survival-calendar" :class="{ 'night-mode': isNight, 'day-mode': isDay }">
    <div class="calendar-header">
      <div class="time-display">
        <span class="time-icon">{{ timeIcon }}</span>
        <span class="time-text">{{ formattedTime }}</span>
        <span class="period-badge" :class="timePeriod">{{ timePeriodName }}</span>
      </div>
      <div class="day-display">
        <span class="day-label">第</span>
        <span class="day-number">{{ survivalStore.day }}</span>
        <span class="day-label">天</span>
      </div>
    </div>
    
    <div class="calendar-body">
      <div class="info-row">
        <div class="info-item">
          <span class="info-icon">{{ seasonIcon }}</span>
          <span class="info-label">季节</span>
          <span class="info-value">{{ survivalStore.getSeasonName() }}</span>
        </div>
        <div class="info-item">
          <span class="info-icon">{{ weatherIcon }}</span>
          <span class="info-label">天气</span>
          <span class="info-value">{{ survivalStore.getWeatherName() }}</span>
        </div>
      </div>
      
      <div class="time-controls">
        <el-button 
          size="small" 
          :icon="isPaused ? 'VideoPlay' : 'VideoPause'"
          @click="survivalStore.togglePause()"
          :type="isPaused ? 'success' : 'warning'"
        >
          {{ isPaused ? '继续' : '暂停' }}
        </el-button>
        <el-button 
          size="small" 
          icon="FastForward" 
          @click="skipTime"
          :disabled="isPaused"
        >
          快进1小时
        </el-button>
        <el-button 
          size="small" 
          icon="Sunny" 
          @click="skipToDay"
          :disabled="isPaused"
        >
          等到白天
        </el-button>
      </div>
      
      <div class="status-bars">
        <div class="status-bar">
          <div class="status-label">
            <span>🛡️ 防御</span>
            <span class="status-value">{{ survivalStore.defense }}</span>
          </div>
          <el-progress :percentage="Math.min(100, survivalStore.defense)" :color="getDefenseColor" :stroke-width="8" />
        </div>
        <div class="status-bar">
          <div class="status-label">
            <span>🌡️ 温度</span>
            <span class="status-value">{{ survivalStore.warmth }}</span>
          </div>
          <el-progress :percentage="Math.min(100, survivalStore.warmth)" color="#f56c6c" :stroke-width="8" />
        </div>
        <div class="status-bar">
          <div class="status-label">
            <span>💡 光照</span>
            <span class="status-value">{{ survivalStore.lightLevel }}</span>
          </div>
          <el-progress :percentage="survivalStore.lightLevel" color="#e6a23c" :stroke-width="8" />
        </div>
        <div class="status-bar danger">
          <div class="status-label">
            <span>⚠️ 危险</span>
            <span class="status-value">{{ survivalStore.dangerLevel }}%</span>
          </div>
          <el-progress :percentage="survivalStore.dangerLevel" :color="getDangerColor" :stroke-width="8" />
        </div>
      </div>
      
      <div class="efficiency-info">
        <el-tag size="small" :type="efficiencyType">
          行动效率: {{ Math.round(survivalStore.actionEfficiency * 100) }}%
        </el-tag>
        <el-tag size="small" type="info">
          消耗倍率: 食物{{ consumptionRate.food.toFixed(1) }}x / 水{{ consumptionRate.water.toFixed(1) }}x
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSurvivalStore } from '../store';

const survivalStore = useSurvivalStore();

const isNight = computed(() => survivalStore.isNight);
const isDay = computed(() => survivalStore.isDay);
const isPaused = computed(() => survivalStore.isPaused);
const timePeriod = computed(() => survivalStore.timePeriod);
const consumptionRate = computed(() => survivalStore.resourceConsumptionRate);

const timeIcon = computed(() => {
  const icons = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };
  return icons[timePeriod.value] || '☀️';
});

const timePeriodName = computed(() => survivalStore.getTimePeriodName());

const formattedTime = computed(() => {
  const hour = Math.floor(survivalStore.gameTime);
  const minute = Math.floor((survivalStore.gameTime % 1) * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const seasonIcon = computed(() => {
  const icons = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
  return icons[survivalStore.season] || '🌸';
});

const weatherIcon = computed(() => {
  const icons = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️', stormy: '⛈️', foggy: '🌫️' };
  return icons[survivalStore.weather] || '☀️';
});

const efficiencyType = computed(() => {
  const eff = survivalStore.actionEfficiency;
  if (eff >= 0.8) return 'success';
  if (eff >= 0.5) return 'warning';
  return 'danger';
});

const getDefenseColor = (percentage) => {
  if (percentage >= 60) return '#67c23a';
  if (percentage >= 30) return '#e6a23c';
  return '#f56c6c';
};

const getDangerColor = (percentage) => {
  if (percentage >= 60) return '#f56c6c';
  if (percentage >= 30) return '#e6a23c';
  return '#67c23a';
};

const skipTime = () => {
  survivalStore.advanceTime(1);
};

const skipToDay = () => {
  let hoursSkipped = 0;
  while (!survivalStore.isDay && hoursSkipped < 24) {
    survivalStore.advanceTime(1);
    hoursSkipped++;
  }
};
</script>

<style scoped>
.survival-calendar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.5s ease;
}

.survival-calendar.night-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.survival-calendar.day-mode {
  background: linear-gradient(135deg, #87ceeb 0%, #98d8c8 50%, #f6d365 100%);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-icon {
  font-size: 32px;
}

.time-text {
  font-size: 28px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.period-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
}

.period-badge.dawn { background: linear-gradient(90deg, #ff9a9e, #fecfef); }
.period-badge.day { background: linear-gradient(90deg, #ffecd2, #fcb69f); }
.period-badge.dusk { background: linear-gradient(90deg, #ff6e7f, #bfe9ff); }
.period-badge.night { background: linear-gradient(90deg, #434343, #000000); }

.day-display {
  text-align: right;
}

.day-label {
  font-size: 14px;
  opacity: 0.9;
}

.day-number {
  font-size: 36px;
  font-weight: bold;
  margin: 0 5px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.calendar-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 15px;
  border-radius: 8px;
  flex: 1;
}

.info-icon {
  font-size: 20px;
}

.info-label {
  font-size: 12px;
  opacity: 0.8;
}

.info-value {
  font-weight: bold;
  font-size: 14px;
}

.time-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-bar {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
}

.status-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
}

.status-value {
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.efficiency-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

:deep(.el-progress-bar__outer) {
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>

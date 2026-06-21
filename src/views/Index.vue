<template>
  <div class="island-container" :class="{ 'night-theme': isNight, 'day-theme': isDay }">
    <div class="island-header">
      <h1>🏝️ 海岛生存</h1>
      <p>在荒岛上建立你的生存基地</p>
      <div class="header-actions">
        <el-button 
          size="small" 
          type="danger" 
          icon="RefreshRight"
          @click="confirmReset"
        >
          重新开始
        </el-button>
      </div>
    </div>
    
    <div class="island-main">
      <div class="left-panel">
        <SurvivalCalendar />
        
        <div class="stats-panel">
          <div class="stat-card" :class="{ low: survivalStore.resources.food < 30 }">
            <div class="stat-icon">🍖</div>
            <div class="stat-content">
              <div class="stat-number">{{ Math.floor(survivalStore.resources.food) }}</div>
              <div class="stat-label">食物</div>
              <div class="stat-bar">
                <div class="stat-bar-fill food" :style="{ width: foodPercent + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" :class="{ low: survivalStore.resources.water < 30 }">
            <div class="stat-icon">💧</div>
            <div class="stat-content">
              <div class="stat-number">{{ Math.floor(survivalStore.resources.water) }}</div>
              <div class="stat-label">淡水</div>
              <div class="stat-bar">
                <div class="stat-bar-fill water" :style="{ width: waterPercent + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🪵</div>
            <div class="stat-content">
              <div class="stat-number">{{ Math.floor(survivalStore.resources.wood) }}</div>
              <div class="stat-label">木材</div>
              <div class="stat-bar">
                <div class="stat-bar-fill wood" :style="{ width: woodPercent + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⛏️</div>
            <div class="stat-content">
              <div class="stat-number">{{ Math.floor(survivalStore.resources.stone) }}</div>
              <div class="stat-label">石头</div>
              <div class="stat-bar">
                <div class="stat-bar-fill stone" :style="{ width: stonePercent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <NightEvent />
      </div>
      
      <div class="center-panel">
        <div class="actions-panel">
          <div class="panel-header">
            <h3>📋 可执行操作</h3>
            <el-tag size="small" :type="efficiencyType">
              效率: {{ Math.round(survivalStore.actionEfficiency * 100) }}%
            </el-tag>
          </div>
          
          <div class="action-grid">
            <div 
              class="action-card" 
              @click="gatherFood"
              :class="{ 'night-action': isNight, 'disabled': isGathering }"
            >
              <div class="action-icon">🍓</div>
              <div class="action-title">采集食物</div>
              <div class="action-desc">在岛上寻找可食用的果实和动物</div>
              <div class="action-result" v-if="lastGatherResult.food">
                上次获得: +{{ lastGatherResult.food }}
              </div>
            </div>
            
            <div 
              class="action-card" 
              @click="collectWater"
              :class="{ 'night-action': isNight, 'disabled': isGathering }"
            >
              <div class="action-icon">💧</div>
              <div class="action-title">收集淡水</div>
              <div class="action-desc">收集雨水或净化海水</div>
              <div class="action-result" v-if="lastGatherResult.water">
                上次获得: +{{ lastGatherResult.water }}
              </div>
            </div>
            
            <div 
              class="action-card" 
              @click="chopWood"
              :class="{ 'night-action': isNight, 'disabled': isGathering }"
            >
              <div class="action-icon">🪓</div>
              <div class="action-title">砍伐木材</div>
              <div class="action-desc">砍伐树木获取木材资源</div>
              <div class="action-result" v-if="lastGatherResult.wood">
                上次获得: +{{ lastGatherResult.wood }}
              </div>
            </div>
            
            <div 
              class="action-card" 
              @click="mineStone"
              :class="{ 'night-action': isNight, 'disabled': isGathering }"
            >
              <div class="action-icon">⛏️</div>
              <div class="action-title">挖掘石头</div>
              <div class="action-desc">在岛上挖掘石头资源</div>
              <div class="action-result" v-if="lastGatherResult.stone">
                上次获得: +{{ lastGatherResult.stone }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="build-panel">
          <div class="panel-header">
            <h3>🏗️ 建造系统</h3>
            <el-tag size="small" :type="survivalStore.isNight && !survivalStore.canBuildAtNight ? 'danger' : 'info'">
              {{ survivalStore.isNight && !survivalStore.canBuildAtNight ? '需要光源' : '可以建造' }}
            </el-tag>
          </div>
          
          <el-tabs v-model="activeBuildTab">
            <el-tab-pane label="可建造" name="available">
              <div class="build-grid">
                <div 
                  v-for="building in survivalStore.availableBuildings" 
                  :key="building.id"
                  class="build-card"
                  @click="buildStructure(building.id)"
                  :class="{ 'can-build': canAfford(building.cost) && !(survivalStore.isNight && !survivalStore.canBuildAtNight) }"
                >
                  <div class="build-icon">{{ building.icon }}</div>
                  <div class="build-info">
                    <div class="build-name">{{ building.name }}</div>
                    <div class="build-desc">{{ building.description }}</div>
                    <div class="build-stats">
                      <span v-if="building.defense" class="stat-badge defense">🛡️+{{ building.defense }}</span>
                      <span v-if="building.warmth" class="stat-badge warmth">🌡️+{{ building.warmth }}</span>
                      <span v-if="building.light" class="stat-badge light">💡光源</span>
                      <span v-if="building.waterBonus" class="stat-badge water">💧+{{ building.waterBonus }}%</span>
                      <span v-if="building.storageBonus" class="stat-badge storage">📦+{{ building.storageBonus }}</span>
                    </div>
                    <div class="build-cost">
                      <span v-for="(amount, resource) in building.cost" :key="resource" 
                            :class="{ 'not-enough': survivalStore.resources[resource] < amount }">
                        {{ getResourceIcon(resource) }}{{ amount }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="survivalStore.availableBuildings.length === 0" class="empty-build">
                  <el-empty description="所有建筑已建造完成！" :image-size="80" />
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="已建造" name="built">
              <div class="build-grid">
                <div 
                  v-for="building in survivalStore.builtBuildings" 
                  :key="building.id"
                  class="build-card built"
                >
                  <div class="build-icon">{{ building.icon }}</div>
                  <div class="build-info">
                    <div class="build-name">{{ building.name }} ✅</div>
                    <div class="build-desc">{{ building.description }}</div>
                    <div class="build-stats">
                      <span v-if="building.defense" class="stat-badge defense">🛡️+{{ building.defense }}</span>
                      <span v-if="building.warmth" class="stat-badge warmth">🌡️+{{ building.warmth }}</span>
                      <span v-if="building.light" class="stat-badge light">💡光源</span>
                      <span v-if="building.waterBonus" class="stat-badge water">💧+{{ building.waterBonus }}%</span>
                      <span v-if="building.storageBonus" class="stat-badge storage">📦+{{ building.storageBonus }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="survivalStore.builtBuildings.length === 0" class="empty-build">
                  <el-empty description="尚未建造任何建筑" :image-size="80" />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        
        <div class="map-panel">
          <div class="panel-header">
            <h3>🗺️ 海岛地图</h3>
            <el-tag size="small" :type="isNight ? 'danger' : 'success'">
              {{ isNight ? '夜间探索危险' : '安全探索中' }}
            </el-tag>
          </div>
          <div class="map-container">
            <div class="map-grid">
              <div 
                v-for="(cell, index) in mapGrid" 
                :key="index" 
                :class="['map-cell', cell.type, { explored: cell.explored, 'night-cell': isNight }]"
                @click="exploreCell(index)"
              >
                {{ cell.icon }}
                <span v-if="cell.explored" class="cell-badge">已探索</span>
              </div>
            </div>
            <div class="map-legend">
              <div class="legend-item">
                <span class="legend-icon">🌳</span>
                <span>森林</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon">🏔️</span>
                <span>山地</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon">🌊</span>
                <span>海洋</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon">🏠</span>
                <span>营地</span>
              </div>
            </div>
          </div>
          <div class="explore-tip" v-if="isNight">
            <el-alert 
              title="🌙 夜间探索提示" 
              type="warning" 
              :closable="false"
              show-icon
            >
              <template #default>
                夜间探索效率降低70%，危险大幅增加，但有30%概率发现特殊资源！
              </template>
            </el-alert>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <GuardDuty />
        
        <div class="message-log">
          <div class="panel-header">
            <h3>📜 生存日志</h3>
            <el-button 
              size="small" 
              type="primary" 
              plain
              @click="scrollToBottom"
            >
              最新
            </el-button>
          </div>
          <div class="log-list" ref="logListRef">
            <div 
              v-for="(log, index) in displayLogs" 
              :key="index" 
              class="log-item"
              :class="[log.period, { 'important': isImportantLog(log) }]"
            >
              <span class="log-icon">{{ log.icon }}</span>
              <span class="log-time">D{{ log.day }} {{ log.time }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
            <div v-if="displayLogs.length === 0" class="empty-log">
              <el-empty description="暂无日志记录" :image-size="60" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <el-dialog 
      v-model="showExploring" 
      title="🔍 探索中..." 
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="exploring-content">
        <div class="exploring-icon">
          <i class="exploring-animation">🚶</i>
        </div>
        <p>正在探索{{ exploringCell?.icon || '' }}区域...</p>
        <el-progress :percentage="exploreProgress" :stroke-width="10" />
      </div>
    </el-dialog>
    
    <el-dialog 
      v-model="showExploreResult" 
      title="探索结果" 
      width="500px"
    >
      <div class="explore-result" :class="{ success: exploreResult?.success, danger: !exploreResult?.success }">
        <div class="result-icon">
          {{ exploreResult?.special ? '✨' : (exploreResult?.success ? '🎉' : '💔') }}
        </div>
        <p class="result-message">{{ exploreResult?.message }}</p>
        
        <div v-if="Object.keys(exploreResult?.rewards || {}).length > 0" class="result-rewards">
          <h4>获得物资</h4>
          <div class="rewards-list">
            <span 
              v-for="(amount, resource) in exploreResult.rewards" 
              :key="resource"
              class="reward-item"
            >
              {{ getResourceIcon(resource) }} +{{ amount }} {{ getResourceName(resource) }}
            </span>
          </div>
        </div>
        
        <div v-if="Object.keys(exploreResult?.losses || {}).length > 0" class="result-losses">
          <h4>损失物资</h4>
          <div class="losses-list">
            <span 
              v-for="(amount, resource) in exploreResult.losses" 
              :key="resource"
              class="loss-item"
            >
              {{ getResourceIcon(resource) }} -{{ amount }} {{ getResourceName(resource) }}
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showExploreResult = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useSurvivalStore } from '../store';
import { ElMessage, ElMessageBox } from 'element-plus';
import SurvivalCalendar from '../components/SurvivalCalendar.vue';
import GuardDuty from '../components/GuardDuty.vue';
import NightEvent from '../components/NightEvent.vue';

const survivalStore = useSurvivalStore();

const isNight = computed(() => survivalStore.isNight);
const isDay = computed(() => survivalStore.isDay);
const efficiencyType = computed(() => {
  const eff = survivalStore.actionEfficiency;
  if (eff >= 0.8) return 'success';
  if (eff >= 0.5) return 'warning';
  return 'danger';
});

const foodPercent = computed(() => {
  const max = survivalStore.maxResources.food + (survivalStore.buildings.storage.built ? 50 : 0);
  return Math.min(100, (survivalStore.resources.food / max) * 100);
});
const waterPercent = computed(() => {
  const max = survivalStore.maxResources.water + (survivalStore.buildings.storage.built ? 50 : 0);
  return Math.min(100, (survivalStore.resources.water / max) * 100);
});
const woodPercent = computed(() => {
  const max = survivalStore.maxResources.wood + (survivalStore.buildings.storage.built ? 50 : 0);
  return Math.min(100, (survivalStore.resources.wood / max) * 100);
});
const stonePercent = computed(() => {
  const max = survivalStore.maxResources.stone + (survivalStore.buildings.storage.built ? 50 : 0);
  return Math.min(100, (survivalStore.resources.stone / max) * 100);
});

const activeBuildTab = ref('available');
const isGathering = ref(false);
const lastGatherResult = ref({});
const showExploring = ref(false);
const showExploreResult = ref(false);
const exploringCell = ref(null);
const exploreProgress = ref(0);
const exploreResult = ref(null);
const logListRef = ref(null);

const mapGrid = ref([
  { type: 'forest', icon: '🌳', explored: true },
  { type: 'forest', icon: '🌳', explored: true },
  { type: 'mountain', icon: '🏔️', explored: false },
  { type: 'ocean', icon: '🌊', explored: false },
  { type: 'camp', icon: '🏠', explored: true },
  { type: 'forest', icon: '🌳', explored: false },
  { type: 'ocean', icon: '🌊', explored: false },
  { type: 'mountain', icon: '🏔️', explored: false },
  { type: 'forest', icon: '🌳', explored: false }
]);

const displayLogs = computed(() => {
  if (!survivalStore.eventLog || !Array.isArray(survivalStore.eventLog)) {
    return [];
  }
  return survivalStore.eventLog.slice().reverse();
});

let timeInterval = null;

const getResourceIcon = (type) => {
  const icons = { food: '🍖', water: '💧', wood: '🪵', stone: '⛏️' };
  return icons[type] || '📦';
};

const getResourceName = (type) => {
  const names = { food: '食物', water: '淡水', wood: '木材', stone: '石头' };
  return names[type] || type;
};

const canAfford = (cost) => {
  return Object.entries(cost).every(([resource, amount]) => 
    survivalStore.resources[resource] >= amount
  );
};

const isImportantLog = (log) => {
  if (!log || !log.content) return false;
  return log.content.includes('事件') || 
         log.content.includes('袭击') || 
         log.content.includes('危险') ||
         log.content.includes('发现') ||
         log.content.includes('建造完成');
};

const gatherFood = () => {
  if (isGathering.value) return;
  isGathering.value = true;
  
  const result = survivalStore.gatherResource('food');
  lastGatherResult.value.food = result.amount;
  
  const periodText = isNight.value ? '夜间' : '白天';
  survivalStore.addEventLog('🍓', 
    `${periodText}采集食物，获得${result.amount}食物${result.nightBonus}${result.weatherPenalty}`
  );
  
  ElMessage.success(`获得${result.amount}食物${result.nightBonus}`);
  
  setTimeout(() => {
    isGathering.value = false;
  }, 1000);
};

const collectWater = () => {
  if (isGathering.value) return;
  isGathering.value = true;
  
  const result = survivalStore.gatherResource('water');
  lastGatherResult.value.water = result.amount;
  
  const periodText = isNight.value ? '夜间' : '白天';
  survivalStore.addEventLog('💧', 
    `${periodText}收集淡水，获得${result.amount}水${result.nightBonus}${result.weatherPenalty}`
  );
  
  ElMessage.success(`获得${result.amount}水${result.nightBonus}`);
  
  setTimeout(() => {
    isGathering.value = false;
  }, 1000);
};

const chopWood = () => {
  if (isGathering.value) return;
  isGathering.value = true;
  
  const result = survivalStore.gatherResource('wood');
  lastGatherResult.value.wood = result.amount;
  
  const periodText = isNight.value ? '夜间' : '白天';
  survivalStore.addEventLog('🪵', 
    `${periodText}砍伐木材，获得${result.amount}木材${result.nightBonus}${result.weatherPenalty}`
  );
  
  ElMessage.success(`获得${result.amount}木材${result.nightBonus}`);
  
  setTimeout(() => {
    isGathering.value = false;
  }, 1000);
};

const mineStone = () => {
  if (isGathering.value) return;
  isGathering.value = true;
  
  const result = survivalStore.gatherResource('stone');
  lastGatherResult.value.stone = result.amount;
  
  const periodText = isNight.value ? '夜间' : '白天';
  survivalStore.addEventLog('⛏️', 
    `${periodText}挖掘石头，获得${result.amount}石头${result.nightBonus}${result.weatherPenalty}`
  );
  
  ElMessage.success(`获得${result.amount}石头${result.nightBonus}`);
  
  setTimeout(() => {
    isGathering.value = false;
  }, 1000);
};

const buildStructure = (buildingId) => {
  if (survivalStore.isNight && !survivalStore.canBuildAtNight) {
    ElMessage.error('夜间太暗无法建造，请先建造篝火提供光源');
    return;
  }
  
  const result = survivalStore.buildStructure(buildingId);
  if (result.success) {
    ElMessage.success(result.message);
  } else {
    ElMessage.error(result.message);
  }
};

const exploreCell = (index) => {
  const cell = mapGrid.value[index];
  if (cell.type === 'camp') {
    ElMessage.info('这是你的营地');
    return;
  }
  
  if (cell.explored) {
    ElMessage.info('这个区域已经探索过了');
    return;
  }
  
  const dangerText = isNight.value ? '夜间探索更加危险，' : '';
  ElMessageBox.confirm(
    `${dangerText}确定要探索这个区域吗？可能会遇到危险或发现资源。`,
    '探索未知区域',
    {
      confirmButtonText: '开始探索',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    exploringCell.value = cell;
    showExploring.value = true;
    exploreProgress.value = 0;
    
    survivalStore.addEventLog('🔍', `开始${isNight.value ? '夜间' : ''}探索${cell.icon}区域...`);
    
    const progressInterval = setInterval(() => {
      exploreProgress.value += 10;
      if (exploreProgress.value >= 100) {
        clearInterval(progressInterval);
        
        cell.explored = true;
        const result = survivalStore.exploreCell(cell);
        exploreResult.value = result;
        
        survivalStore.addEventLog(
          result.success ? '✨' : '⚠️',
          result.message
        );
        
        setTimeout(() => {
          showExploring.value = false;
          showExploreResult.value = true;
        }, 300);
      }
    }, 300);
  }).catch(() => {
    survivalStore.addEventLog('🚫', '取消了探索');
  });
};

const confirmReset = () => {
  ElMessageBox.confirm(
    '确定要重新开始游戏吗？所有进度将会丢失。',
    '重新开始',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    survivalStore.resetGame();
    mapGrid.value.forEach(cell => {
      if (cell.type !== 'camp') {
        cell.explored = cell.type === 'forest' && mapGrid.value.indexOf(cell) < 2;
      }
    });
    ElMessage.success('游戏已重置！');
  }).catch(() => {});
};

const scrollToBottom = () => {
  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = 0;
    }
  });
};

watch(displayLogs, () => {
  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = 0;
    }
  });
}, { deep: true });

onMounted(() => {
  survivalStore.updateTimePeriod();
  survivalStore.addEventLog('🏝️', '欢迎来到海岛生存游戏！');
  
  timeInterval = setInterval(() => {
    if (!survivalStore.isPaused) {
      survivalStore.advanceTime(1);
      
      if (survivalStore.resources.food <= 0 || survivalStore.resources.water <= 0) {
        ElMessageBox.alert(
          '你的食物或水耗尽了，游戏结束！',
          '游戏结束',
          {
            confirmButtonText: '重新开始',
            type: 'error'
          }
        ).then(() => {
          survivalStore.resetGame();
        });
      }
    }
  }, 10000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.island-container {
  min-height: 100vh;
  padding: 20px;
  transition: all 0.5s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.island-container.night-theme {
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b4e 100%);
}

.island-container.day-theme {
  background: linear-gradient(135deg, #87ceeb 0%, #98d8c8 50%, #f6d365 100%);
}

.island-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  position: relative;
}

.island-header h1 {
  font-size: 42px;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.island-header p {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.header-actions {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.island-main {
  display: grid;
  grid-template-columns: 380px 1fr 380px;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.left-panel,
.center-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card.low {
  animation: pulse-danger 2s infinite;
  border: 2px solid #f56c6c;
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(245, 108, 108, 0); }
}

.stat-icon {
  font-size: 36px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-bar {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stat-bar-fill.food { background: linear-gradient(90deg, #ff6b6b, #ee5a24); }
.stat-bar-fill.water { background: linear-gradient(90deg, #74b9ff, #0984e3); }
.stat-bar-fill.wood { background: linear-gradient(90deg, #a29bfe, #6c5ce7); }
.stat-bar-fill.stone { background: linear-gradient(90deg, #b2bec3, #636e72); }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.actions-panel,
.build-panel,
.map-panel {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.action-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-align: center;
}

.action-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.action-card.night-action {
  background: linear-gradient(135deg, #e8e8f8 0%, #d8d8f0 100%);
}

.action-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.action-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.action-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.action-result {
  font-size: 11px;
  color: #67c23a;
  font-weight: bold;
  padding: 4px 8px;
  background: #f0f9eb;
  border-radius: 4px;
  display: inline-block;
}

.build-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 350px;
  overflow-y: auto;
}

.build-card {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.build-card:hover.can-build {
  transform: translateX(5px);
  border-color: #67c23a;
  background: #f0f9eb;
}

.build-card.built {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  cursor: default;
}

.build-icon {
  font-size: 36px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.build-info {
  flex: 1;
}

.build-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.build-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.build-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.stat-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.stat-badge.defense { background: #fff3e0; color: #e65100; }
.stat-badge.warmth { background: #ffebee; color: #c62828; }
.stat-badge.light { background: #fffde7; color: #f57f17; }
.stat-badge.water { background: #e3f2fd; color: #1565c0; }
.stat-badge.storage { background: #f3e5f5; color: #6a1b9a; }

.build-cost {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.build-cost span {
  color: #333;
  font-weight: 500;
}

.build-cost span.not-enough {
  color: #f56c6c;
}

.empty-build {
  padding: 30px;
  text-align: center;
}

.map-container {
  text-align: center;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(3, 90px);
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.map-cell {
  width: 90px;
  height: 90px;
  background: #f0f0f0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #ddd;
  position: relative;
}

.map-cell:hover:not(.explored) {
  transform: scale(1.05);
  border-color: #667eea;
}

.map-cell.explored {
  background: #e8f4fa;
  border-color: #409eff;
}

.map-cell.night-cell:not(.explored) {
  background: #2c3e50;
  border-color: #34495e;
}

.cell-badge {
  position: absolute;
  bottom: 4px;
  font-size: 9px;
  padding: 1px 4px;
  background: #409eff;
  color: white;
  border-radius: 3px;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 25px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-icon {
  font-size: 20px;
}

.explore-tip {
  margin-top: 15px;
}

.message-log {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.log-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #f8f9fa;
  font-size: 13px;
  transition: all 0.2s ease;
}

.log-item:hover {
  background: #eef1f6;
}

.log-item.night {
  background: #e8eaf6;
  border-left: 3px solid #3f51b5;
}

.log-item.day {
  background: #fff8e1;
  border-left: 3px solid #ffc107;
}

.log-item.dawn {
  background: #fce4ec;
  border-left: 3px solid #e91e63;
}

.log-item.dusk {
  background: #f3e5f5;
  border-left: 3px solid #9c27b0;
}

.log-item.important {
  background: #fff3e0;
  border-left: 3px solid #ff5722;
  font-weight: 500;
}

.log-icon {
  font-size: 16px;
}

.log-time {
  font-size: 11px;
  color: #409eff;
  font-weight: bold;
  min-width: 60px;
  white-space: nowrap;
}

.log-content {
  flex: 1;
  color: #333;
  line-height: 1.4;
}

.empty-log {
  padding: 30px;
  text-align: center;
}

.exploring-content {
  text-align: center;
  padding: 20px;
}

.exploring-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.exploring-animation {
  display: inline-block;
  animation: walk 0.5s infinite alternate;
}

@keyframes walk {
  from { transform: translateX(-10px); }
  to { transform: translateX(10px); }
}

.explore-result {
  text-align: center;
  padding: 20px;
}

.explore-result.success .result-icon {
  color: #67c23a;
}

.explore-result.danger .result-icon {
  color: #f56c6c;
}

.result-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.result-message {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.6;
}

.result-rewards h4,
.result-losses h4 {
  margin: 15px 0 10px;
  font-size: 14px;
  color: #666;
}

.rewards-list,
.losses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.reward-item {
  padding: 8px 16px;
  background: #f0f9eb;
  color: #67c23a;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
}

.loss-item {
  padding: 8px 16px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
}

:deep(.el-tabs__content) {
  padding-top: 15px;
}

@media (max-width: 1400px) {
  .island-main {
    grid-template-columns: 320px 1fr 320px;
  }
}

@media (max-width: 1100px) {
  .island-main {
    grid-template-columns: 1fr;
  }
  
  .left-panel,
  .right-panel {
    order: 2;
  }
  
  .center-panel {
    order: 1;
  }
}

@media (max-width: 768px) {
  .island-header h1 {
    font-size: 28px;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .map-grid {
    grid-template-columns: repeat(3, 70px);
  }
  
  .map-cell {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }
}
</style>

<template>
  <div class="guard-duty">
    <div class="panel-header">
      <h3>🏕️ 营地值守安排</h3>
      <el-tag size="small" :type="isNight ? 'danger' : 'info'">
        {{ isNight ? '夜间值守中' : '白天' }}
      </el-tag>
    </div>
    
    <div class="defense-overview">
      <div class="defense-item">
        <span class="defense-icon">🛡️</span>
        <div class="defense-info">
          <div class="defense-label">总防御力</div>
          <div class="defense-value">{{ survivalStore.defense }}</div>
        </div>
      </div>
      <div class="defense-item">
        <span class="defense-icon">👥</span>
        <div class="defense-info">
          <div class="defense-label">值守人数</div>
          <div class="defense-value">{{ survivalStore.guards.length }} / {{ survivalStore.maxGuards }}</div>
        </div>
      </div>
      <div class="defense-item">
        <span class="defense-icon">🏠</span>
        <div class="defense-info">
          <div class="defense-label">防御建筑</div>
          <div class="defense-value">{{ defenseBuildings.length }}</div>
        </div>
      </div>
    </div>
    
    <div class="section-title">
      <span>👤 当前守卫</span>
      <el-button size="small" type="primary" @click="showAddGuard = true">
        + 添加守卫
      </el-button>
    </div>
    
    <div class="guards-list">
      <div v-if="survivalStore.guards.length === 0" class="empty-guards">
        <el-empty description="暂无守卫，请添加守卫保护营地" :image-size="80" />
      </div>
      <div v-for="guard in survivalStore.guards" :key="guard.id" class="guard-card" :class="{ 'on-duty': guard.onDuty }">
        <div class="guard-avatar">{{ guard.avatar }}</div>
        <div class="guard-info">
          <div class="guard-name">{{ guard.name }}</div>
          <div class="guard-stats">
            <el-tag size="small" type="warning">🛡️ 防御 +{{ guard.defense }}</el-tag>
            <el-tag size="small" :type="guard.onDuty ? 'success' : 'info'">
              {{ guard.onDuty ? '值守中' : '休息中' }}
            </el-tag>
          </div>
        </div>
        <div class="guard-actions">
          <el-button 
            size="small" 
            :type="guard.onDuty ? 'warning' : 'success'"
            @click="toggleDuty(guard.id)"
          >
            {{ guard.onDuty ? '休息' : '值守' }}
          </el-button>
          <el-button size="small" type="danger" @click="removeGuard(guard.id)">
            移除
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="section-title">
      <span>🏠 防御建筑</span>
    </div>
    
    <div class="buildings-list">
      <div v-if="defenseBuildings.length === 0" class="empty-buildings">
        <el-empty description="暂无防御建筑，请建造防御设施" :image-size="80" />
      </div>
      <div v-for="building in defenseBuildings" :key="building.id" class="building-card">
        <span class="building-icon">{{ building.icon }}</span>
        <div class="building-info">
          <div class="building-name">{{ building.name }}</div>
          <div class="building-desc">{{ building.description }}</div>
        </div>
        <div class="building-stats">
          <el-tag v-if="building.defense" size="small" type="warning">
            🛡️ +{{ building.defense }}
          </el-tag>
          <el-tag v-if="building.warmth" size="small" type="danger">
            🌡️ +{{ building.warmth }}
          </el-tag>
          <el-tag v-if="building.light" size="small" type="warning">
            💡 光源
          </el-tag>
        </div>
      </div>
    </div>
    
    <div class="section-title">
      <span>📋 夜间行动计划</span>
    </div>
    
    <div class="night-plan">
      <el-checkbox v-model="nightPlan.enhancedPatrol" :disabled="!isNight">
        🚶 加强巡逻（消耗10木材，危险降低20%）
      </el-checkbox>
      <el-checkbox v-model="nightPlan.bonfire" :disabled="!isNight || !hasEnoughWoodForBonfire">
        🔥 篝火晚会（消耗20木材，温度+20，士气提升）
      </el-checkbox>
      <el-checkbox v-model="nightPlan.extraWatch" :disabled="!isNight || survivalStore.guards.length === 0">
        ⏰ 额外警戒（守卫防御力+50%，但第二天效率降低）
      </el-checkbox>
    </div>
    
    <div class="night-tips" v-if="isNight">
      <el-alert 
        :title="getNightTip()" 
        type="warning" 
        :closable="false"
        show-icon
      />
    </div>
    
    <el-dialog v-model="showAddGuard" title="添加守卫" width="400px">
      <el-form label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="newGuard.name" placeholder="输入守卫姓名" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newGuard.type" placeholder="选择守卫类型">
            <el-option label="猎人" value="hunter">
              <span>🏹 猎人 - 防御+15</span>
            </el-option>
            <el-option label="战士" value="warrior">
              <span>⚔️ 战士 - 防御+20</span>
            </el-option>
            <el-option label="斥候" value="scout">
              <span>👁️ 斥候 - 防御+10，提前预警</span>
            </el-option>
            <el-option label="工匠" value="craftsman">
              <span>🔧 工匠 - 防御+8，可修复建筑</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddGuard = false">取消</el-button>
        <el-button type="primary" @click="addGuard">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSurvivalStore } from '../store';
import { ElMessage } from 'element-plus';

const survivalStore = useSurvivalStore();

const showAddGuard = ref(false);
const newGuard = ref({
  name: '',
  type: 'hunter'
});

const nightPlan = ref({
  enhancedPatrol: false,
  bonfire: false,
  extraWatch: false
});

const isNight = computed(() => survivalStore.isNight);

const hasEnoughWoodForBonfire = computed(() => survivalStore.resources.wood >= 20);

const defenseBuildings = computed(() => {
  return survivalStore.builtBuildings.filter(b => b.defense || b.warmth || b.light);
});

const guardTypes = {
  hunter: { avatar: '🏹', defense: 15, name: '猎人' },
  warrior: { avatar: '⚔️', defense: 20, name: '战士' },
  scout: { avatar: '👁️', defense: 10, name: '斥候' },
  craftsman: { avatar: '🔧', defense: 8, name: '工匠' }
};

const addGuard = () => {
  if (!newGuard.value.name.trim()) {
    ElMessage.warning('请输入守卫姓名');
    return;
  }
  
  const typeInfo = guardTypes[newGuard.value.type];
  const guard = {
    id: Date.now(),
    name: newGuard.value.name,
    type: newGuard.value.type,
    avatar: typeInfo.avatar,
    defense: typeInfo.defense
  };
  
  const result = survivalStore.addGuard(guard);
  if (result.success) {
    ElMessage.success(result.message);
    survivalStore.addEventLog('👤', `${guard.name}（${typeInfo.name}）加入了守卫队伍`);
    showAddGuard.value = false;
    newGuard.value = { name: '', type: 'hunter' };
  } else {
    ElMessage.error(result.message);
  }
};

const removeGuard = (guardId) => {
  const result = survivalStore.removeGuard(guardId);
  if (result.success) {
    ElMessage.success(result.message);
    survivalStore.addEventLog('👋', result.message);
  } else {
    ElMessage.error(result.message);
  }
};

const toggleDuty = (guardId) => {
  const result = survivalStore.toggleGuardDuty(guardId);
  if (result.success) {
    ElMessage.info(result.message);
    survivalStore.addEventLog('🔄', result.message);
  }
};

const getNightTip = () => {
  const danger = survivalStore.dangerLevel;
  if (danger >= 70) {
    return '⚠️ 危险等级很高！建议增加守卫和防御建筑，考虑加强巡逻';
  } else if (danger >= 40) {
    return '⚡ 有一定危险，确保守卫在岗，检查防御设施';
  } else {
    return '✨ 今晚相对安全，但仍需保持警惕';
  }
};
</script>

<style scoped>
.guard-duty {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

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

.defense-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.defense-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px;
  border-radius: 10px;
  color: white;
}

.defense-icon {
  font-size: 28px;
}

.defense-label {
  font-size: 12px;
  opacity: 0.9;
}

.defense-value {
  font-size: 20px;
  font-weight: bold;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 15px;
  font-size: 14px;
  font-weight: bold;
  color: #666;
}

.guards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.empty-guards,
.empty-buildings {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.guard-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.guard-card.on-duty {
  border-color: #67c23a;
  background: #f0f9eb;
}

.guard-avatar {
  font-size: 36px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.guard-info {
  flex: 1;
}

.guard-name {
  font-weight: bold;
  font-size: 15px;
  color: #333;
  margin-bottom: 5px;
}

.guard-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.guard-actions {
  display: flex;
  gap: 8px;
}

.buildings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.building-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  border-radius: 10px;
}

.building-icon {
  font-size: 28px;
}

.building-info {
  flex: 1;
}

.building-name {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.building-desc {
  font-size: 12px;
  color: #666;
}

.building-stats {
  display: flex;
  gap: 8px;
}

.night-plan {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 15px;
}

.night-tips {
  margin-top: 15px;
}
</style>

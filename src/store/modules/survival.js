import { defineStore } from 'pinia';

const TIME_PERIODS = {
  DAWN: 'dawn',
  DAY: 'day',
  DUSK: 'dusk',
  NIGHT: 'night'
};

const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter'
};

const WEATHER_TYPES = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  STORMY: 'stormy',
  FOGGY: 'foggy'
};

const NIGHT_EVENTS = [
  {
    id: 'beast_attack',
    name: '野兽袭击',
    icon: '🐺',
    description: '一群野兽正在接近营地！',
    probability: 0.15,
    effect: { food: -20, wood: -10 },
    defenseRequired: 30,
    successMessage: '守卫成功击退了野兽！',
    failMessage: '野兽闯入营地，造成了损失！'
  },
  {
    id: 'storm',
    name: '暴风雨',
    icon: '⛈️',
    description: '一场暴风雨正在逼近！',
    probability: 0.12,
    effect: { wood: -15, stone: -5 },
    shelterRequired: true,
    successMessage: '庇护所保护了我们免受暴风雨侵袭！',
    failMessage: '暴风雨摧毁了部分建筑和资源！'
  },
  {
    id: 'mysterious_visitor',
    name: '神秘访客',
    icon: '👤',
    description: '一个神秘人物出现在营地附近...',
    probability: 0.08,
    effect: { food: 30, water: 20 },
    successMessage: '访客分享了一些物资作为感谢！',
    failMessage: '访客悄悄离开了，什么也没发生。'
  },
  {
    id: 'resource_discovery',
    name: '夜间发现',
    icon: '✨',
    description: '夜间巡逻时发现了隐藏的资源！',
    probability: 0.1,
    effect: { stone: 25, wood: 15 },
    guardRequired: true,
    successMessage: '守卫发现了一处隐藏的资源点！',
    failMessage: '夜间太黑了，什么都没发现。'
  },
  {
    id: 'disease_outbreak',
    name: '疾病爆发',
    icon: '🤒',
    description: '营地有人开始出现不适症状...',
    probability: 0.06,
    effect: { food: -10, water: -15 },
    waterRequired: 50,
    successMessage: '充足的水源帮助大家恢复了健康！',
    failMessage: '疾病导致体力下降，消耗了额外资源。'
  },
  {
    id: 'cold_snap',
    name: '寒流来袭',
    icon: '❄️',
    description: '夜间气温骤降！',
    probability: 0.1,
    effect: { wood: -20 },
    warmthRequired: 40,
    successMessage: '充足的燃料让我们度过了寒冷的夜晚！',
    failMessage: '寒冷消耗了大量木材用于取暖。'
  }
];

const BUILDINGS = {
  shelter: {
    id: 'shelter',
    name: '庇护所',
    icon: '🏠',
    description: '提供基本的住所保护',
    cost: { wood: 50, stone: 30 },
    defense: 20,
    warmth: 30,
    built: false
  },
  watchtower: {
    id: 'watchtower',
    name: '瞭望塔',
    icon: '🗼',
    description: '提高守卫效率，提前发现危险',
    cost: { wood: 40, stone: 20 },
    defense: 30,
    guardBonus: 50,
    built: false
  },
  campfire: {
    id: 'campfire',
    name: '篝火',
    icon: '🔥',
    description: '提供光源和温暖，夜间建造必需',
    cost: { wood: 20, stone: 5 },
    warmth: 40,
    light: true,
    built: false
  },
  fence: {
    id: 'fence',
    name: '围栏',
    icon: '🚧',
    description: '基础防御设施，阻挡野兽',
    cost: { wood: 30, stone: 10 },
    defense: 25,
    built: false
  },
  well: {
    id: 'well',
    name: '水井',
    icon: '🪣',
    description: '提供稳定的水源',
    cost: { wood: 15, stone: 40 },
    waterBonus: 20,
    built: false
  },
  storage: {
    id: 'storage',
    name: '仓库',
    icon: '📦',
    description: '增加资源存储上限',
    cost: { wood: 35, stone: 25 },
    storageBonus: 50,
    built: false
  }
};

const STORAGE_KEY = 'island_survival_state';

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const buildings = { ...BUILDINGS };
      if (parsed.buildings) {
        Object.keys(parsed.buildings).forEach(key => {
          if (buildings[key]) {
            buildings[key].built = parsed.buildings[key].built || false;
          }
        });
      }
      return {
        day: parsed.day || 1,
        gameTime: parsed.gameTime || 8,
        timeSpeed: parsed.timeSpeed || 1,
        isPaused: parsed.isPaused || false,
        timePeriod: parsed.timePeriod || TIME_PERIODS.DAY,
        season: parsed.season || SEASONS.SPRING,
        weather: parsed.weather || WEATHER_TYPES.SUNNY,
        resources: parsed.resources || { food: 100, water: 100, wood: 100, stone: 100 },
        maxResources: parsed.maxResources || { food: 200, water: 200, wood: 200, stone: 200 },
        buildings,
        guards: parsed.guards || [],
        maxGuards: parsed.maxGuards || 3,
        currentNightEvent: null,
        eventLog: parsed.eventLog || [],
        defense: parsed.defense || 0,
        warmth: parsed.warmth || 0,
        lightLevel: parsed.lightLevel || 0
      };
    }
  } catch (e) {
    console.error('Failed to load saved state:', e);
  }
  return null;
};

const saveState = (state) => {
  try {
    const toSave = {
      day: state.day,
      gameTime: state.gameTime,
      timeSpeed: state.timeSpeed,
      isPaused: state.isPaused,
      timePeriod: state.timePeriod,
      season: state.season,
      weather: state.weather,
      resources: state.resources,
      maxResources: state.maxResources,
      buildings: {},
      guards: state.guards,
      maxGuards: state.maxGuards,
      eventLog: state.eventLog,
      defense: state.defense,
      warmth: state.warmth,
      lightLevel: state.lightLevel
    };
    Object.keys(state.buildings).forEach(key => {
      toSave.buildings[key] = { built: state.buildings[key].built };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
};

const initialState = loadState();

export default defineStore('survival', {
  state: () => initialState || {
    day: 1,
    gameTime: 8,
    timeSpeed: 1,
    isPaused: false,
    timePeriod: TIME_PERIODS.DAY,
    season: SEASONS.SPRING,
    weather: WEATHER_TYPES.SUNNY,
    resources: {
      food: 100,
      water: 100,
      wood: 100,
      stone: 100
    },
    maxResources: {
      food: 200,
      water: 200,
      wood: 200,
      stone: 200
    },
    buildings: { ...BUILDINGS },
    guards: [],
    maxGuards: 3,
    currentNightEvent: null,
    eventLog: [],
    defense: 0,
    warmth: 0,
    lightLevel: 0
  },

  getters: {
    isNight: (state) => state.timePeriod === TIME_PERIODS.NIGHT,
    isDay: (state) => state.timePeriod === TIME_PERIODS.DAY,
    isDawn: (state) => state.timePeriod === TIME_PERIODS.DAWN,
    isDusk: (state) => state.timePeriod === TIME_PERIODS.DUSK,
    
    resourceConsumptionRate: (state) => {
      let rate = { food: 1, water: 1, wood: 0, stone: 0 };
      
      if (state.timePeriod === TIME_PERIODS.NIGHT) {
        rate.food = 1.5;
        rate.water = 1.3;
        rate.wood = state.weather === WEATHER_TYPES.STORMY ? 2 : 1.2;
      }
      
      if (state.weather === WEATHER_TYPES.RAINY) {
        rate.water = 0.5;
      } else if (state.weather === WEATHER_TYPES.STORMY) {
        rate.food = 1.2;
        rate.water = 0.3;
      }
      
      if (state.season === SEASONS.WINTER) {
        rate.wood *= 1.5;
        rate.food *= 1.3;
      } else if (state.season === SEASONS.SUMMER) {
        rate.water *= 1.5;
      }
      
      return rate;
    },
    
    actionEfficiency: (state) => {
      let efficiency = 1;
      
      if (state.timePeriod === TIME_PERIODS.NIGHT) {
        efficiency = state.lightLevel >= 50 ? 0.7 : 0.4;
      } else if (state.timePeriod === TIME_PERIODS.DAWN || state.timePeriod === TIME_PERIODS.DUSK) {
        efficiency = 0.85;
      }
      
      if (state.weather === WEATHER_TYPES.RAINY) {
        efficiency *= 0.8;
      } else if (state.weather === WEATHER_TYPES.STORMY) {
        efficiency *= 0.5;
      } else if (state.weather === WEATHER_TYPES.FOGGY) {
        efficiency *= 0.7;
      }
      
      return efficiency;
    },
    
    dangerLevel: (state) => {
      let danger = 0;
      
      if (state.timePeriod === TIME_PERIODS.NIGHT) {
        danger += 50;
      }
      
      if (state.weather === WEATHER_TYPES.STORMY) {
        danger += 30;
      } else if (state.weather === WEATHER_TYPES.FOGGY) {
        danger += 15;
      }
      
      danger -= state.defense;
      
      return Math.max(0, Math.min(100, danger));
    },
    
    totalDefense: (state) => {
      let def = 0;
      Object.values(state.buildings).forEach(b => {
        if (b.built && b.defense) def += b.defense;
      });
      state.guards.forEach(g => {
        def += g.defense || 10;
      });
      return def;
    },
    
    totalWarmth: (state) => {
      let warm = 0;
      Object.values(state.buildings).forEach(b => {
        if (b.built && b.warmth) warm += b.warmth;
      });
      if (state.timePeriod !== TIME_PERIODS.NIGHT) {
        warm += 30;
      }
      return warm;
    },
    
    totalLight: (state) => {
      let light = 0;
      Object.values(state.buildings).forEach(b => {
        if (b.built && b.light) light += 50;
      });
      if (state.timePeriod === TIME_PERIODS.DAY) {
        light = 100;
      } else if (state.timePeriod === TIME_PERIODS.DAWN || state.timePeriod === TIME_PERIODS.DUSK) {
        light = 60;
      }
      return Math.min(100, light);
    },
    
    canBuildAtNight: (state) => {
      return state.buildings.campfire.built || state.lightLevel >= 30;
    },
    
    builtBuildings: (state) => {
      return Object.values(state.buildings).filter(b => b.built);
    },
    
    availableBuildings: (state) => {
      return Object.values(state.buildings).filter(b => !b.built);
    }
  },

  actions: {
    updateTimePeriod() {
      const hour = this.gameTime;
      if (hour >= 5 && hour < 8) {
        this.timePeriod = TIME_PERIODS.DAWN;
      } else if (hour >= 8 && hour < 18) {
        this.timePeriod = TIME_PERIODS.DAY;
      } else if (hour >= 18 && hour < 20) {
        this.timePeriod = TIME_PERIODS.DUSK;
      } else {
        this.timePeriod = TIME_PERIODS.NIGHT;
      }
      
      this.defense = this.totalDefense;
      this.warmth = this.totalWarmth;
      this.lightLevel = this.totalLight;
    },

    advanceTime(hours = 1) {
      if (this.isPaused) return;
      
      const wasNight = this.isNight;
      
      for (let i = 0; i < hours; i++) {
        this.gameTime++;
        if (this.gameTime >= 24) {
          this.gameTime = 0;
          this.day++;
          this.updateSeason();
          this.updateWeather();
        }
      }
      
      this.updateTimePeriod();
      this.consumeResources(hours);
      
      if (!wasNight && this.isNight) {
        this.onNightStart();
      } else if (wasNight && !this.isNight) {
        this.onNightEnd();
      }
      
      saveState(this.$state);
    },

    updateSeason() {
      const dayInYear = this.day % 120;
      if (dayInYear < 30) {
        this.season = SEASONS.SPRING;
      } else if (dayInYear < 60) {
        this.season = SEASONS.SUMMER;
      } else if (dayInYear < 90) {
        this.season = SEASONS.AUTUMN;
      } else {
        this.season = SEASONS.WINTER;
      }
    },

    updateWeather() {
      const rand = Math.random();
      const seasonMod = {
        [SEASONS.SPRING]: { sunny: 0.4, cloudy: 0.3, rainy: 0.2, stormy: 0.05, foggy: 0.05 },
        [SEASONS.SUMMER]: { sunny: 0.6, cloudy: 0.2, rainy: 0.1, stormy: 0.08, foggy: 0.02 },
        [SEASONS.AUTUMN]: { sunny: 0.3, cloudy: 0.35, rainy: 0.25, stormy: 0.05, foggy: 0.05 },
        [SEASONS.WINTER]: { sunny: 0.3, cloudy: 0.3, rainy: 0.1, stormy: 0.1, foggy: 0.2 }
      }[this.season];
      
      let cumulative = 0;
      for (const [weather, prob] of Object.entries(seasonMod)) {
        cumulative += prob;
        if (rand < cumulative) {
          this.weather = weather;
          break;
        }
      }
    },

    consumeResources(hours = 1) {
      const rate = this.resourceConsumptionRate;
      const wellBonus = this.buildings.well.built ? this.buildings.well.waterBonus / 100 : 0;
      
      this.resources.food = Math.max(0, this.resources.food - 5 * rate.food * hours / 24);
      this.resources.water = Math.max(0, this.resources.water - 5 * rate.water * (1 - wellBonus) * hours / 24);
      
      if (this.isNight && this.weather === WEATHER_TYPES.STORMY) {
        this.resources.wood = Math.max(0, this.resources.wood - 2 * rate.wood * hours / 12);
      }
      
      Object.keys(this.resources).forEach(key => {
        const max = this.maxResources[key] + (this.buildings.storage.built ? this.buildings.storage.storageBonus : 0);
        this.resources[key] = Math.min(max, this.resources[key]);
      });
    },

    addResources(resources) {
      Object.entries(resources).forEach(([key, value]) => {
        if (this.resources.hasOwnProperty(key)) {
          const max = this.maxResources[key] + (this.buildings.storage.built ? this.buildings.storage.storageBonus : 0);
          this.resources[key] = Math.min(max, this.resources[key] + value);
        }
      });
    },

    consumeResourcesForAction(cost) {
      for (const [resource, amount] of Object.entries(cost)) {
        if (this.resources[resource] < amount) {
          return false;
        }
      }
      
      for (const [resource, amount] of Object.entries(cost)) {
        this.resources[resource] -= amount;
      }
      
      return true;
    },

    onNightStart() {
      this.addEventLog('🌙', `第${this.day}天夜晚降临了...`);
      this.triggerNightEvent();
    },

    onNightEnd() {
      this.addEventLog('🌅', `第${this.day}天黎明到来，新的一天开始了！`);
      this.currentNightEvent = null;
    },

    triggerNightEvent() {
      const rand = Math.random();
      let cumulative = 0;
      
      for (const event of NIGHT_EVENTS) {
        cumulative += event.probability;
        if (rand < cumulative) {
          this.currentNightEvent = { ...event };
          this.resolveNightEvent(event);
          return;
        }
      }
      
      this.addEventLog('✨', '平静的夜晚过去了，什么也没发生。');
    },

    resolveNightEvent(event) {
      this.addEventLog(event.icon, `${event.name}：${event.description}`);
      
      let success = true;
      
      if (event.defenseRequired && this.totalDefense < event.defenseRequired) {
        success = false;
      }
      
      if (event.shelterRequired && !this.buildings.shelter.built) {
        success = false;
      }
      
      if (event.guardRequired && this.guards.length === 0) {
        success = false;
      }
      
      if (event.waterRequired && this.resources.water < event.waterRequired) {
        success = false;
      }
      
      if (event.warmthRequired && this.totalWarmth < event.warmthRequired) {
        success = false;
      }
      
      if (success) {
        this.addEventLog('✅', event.successMessage);
        if (event.effect) {
          const positiveEffect = {};
          Object.entries(event.effect).forEach(([k, v]) => {
            if (v > 0) positiveEffect[k] = v;
          });
          if (Object.keys(positiveEffect).length > 0) {
            this.addResources(positiveEffect);
          }
        }
      } else {
        this.addEventLog('❌', event.failMessage);
        if (event.effect) {
          const negativeEffect = {};
          Object.entries(event.effect).forEach(([k, v]) => {
            if (v < 0) negativeEffect[k] = Math.abs(v);
          });
          if (Object.keys(negativeEffect).length > 0) {
            this.consumeResourcesForAction(negativeEffect);
          }
        }
      }
      
      this.eventLog.push({
        day: this.day,
        event: event.name,
        icon: event.icon,
        success,
        timestamp: Date.now()
      });
    },

    addGuard(guard) {
      if (this.guards.length >= this.maxGuards) {
        return { success: false, message: '守卫人数已达上限' };
      }
      if (this.guards.find(g => g.id === guard.id)) {
        return { success: false, message: '该角色已在守卫名单中' };
      }
      this.guards.push({
        ...guard,
        defense: guard.defense || 10,
        onDuty: true
      });
      this.defense = this.totalDefense;
      saveState(this.$state);
      return { success: true, message: `${guard.name}已加入守卫队伍` };
    },

    removeGuard(guardId) {
      const index = this.guards.findIndex(g => g.id === guardId);
      if (index > -1) {
        const guard = this.guards[index];
        this.guards.splice(index, 1);
        this.defense = this.totalDefense;
        saveState(this.$state);
        return { success: true, message: `${guard.name}已离开守卫队伍` };
      }
      return { success: false, message: '未找到该守卫' };
    },

    toggleGuardDuty(guardId) {
      const guard = this.guards.find(g => g.id === guardId);
      if (guard) {
        guard.onDuty = !guard.onDuty;
        this.defense = this.totalDefense;
        saveState(this.$state);
        return { success: true, message: guard.onDuty ? `${guard.name}开始值守` : `${guard.name}休息中` };
      }
      return { success: false, message: '未找到该守卫' };
    },

    buildStructure(buildingId) {
      const building = this.buildings[buildingId];
      if (!building) {
        return { success: false, message: '建筑不存在' };
      }
      if (building.built) {
        return { success: false, message: '该建筑已建造' };
      }
      
      if (this.isNight && !this.canBuildAtNight) {
        return { success: false, message: '夜间太暗无法建造，请先建造篝火提供光源' };
      }
      
      if (!this.consumeResourcesForAction(building.cost)) {
        return { success: false, message: '资源不足' };
      }
      
      building.built = true;
      this.defense = this.totalDefense;
      this.warmth = this.totalWarmth;
      this.lightLevel = this.totalLight;
      saveState(this.$state);
      
      return { success: true, message: `${building.name}建造完成！` };
    },

    gatherResource(type) {
      const efficiency = this.actionEfficiency;
      const baseAmount = { food: 20, water: 30, wood: 15, stone: 10 }[type] || 10;
      const amount = Math.floor(baseAmount * efficiency);
      
      const gains = {};
      gains[type] = amount;
      this.addResources(gains);
      
      const nightBonus = this.isNight ? '（夜间效率较低）' : '';
      const weatherPenalty = this.weather !== WEATHER_TYPES.SUNNY ? `（${this.getWeatherName()}天气影响）` : '';
      
      return { amount, efficiency, nightBonus, weatherPenalty };
    },

    exploreCell(cell) {
      const efficiency = this.actionEfficiency;
      const danger = this.dangerLevel;
      const isNight = this.isNight;
      
      const result = {
        success: true,
        rewards: {},
        losses: {},
        message: '',
        special: null
      };
      
      if (isNight && Math.random() < 0.3) {
        result.special = 'night_discovery';
        result.rewards = { stone: 30, wood: 20 };
        result.message = '夜间探索时发现了一处被月光照亮的隐秘矿脉！';
        this.addResources(result.rewards);
        return result;
      }
      
      const dangerRoll = Math.random() * 100;
      if (dangerRoll < danger) {
        result.success = false;
        result.losses = { food: 15, water: 15 };
        result.message = isNight ? '夜间探索遭遇危险，损失了一些物资！' : '探索时遇到意外，损失了一些物资！';
        this.consumeResourcesForAction(result.losses);
        return result;
      }
      
      const rewardsMultiplier = efficiency * (isNight ? 0.7 : 1);
      const baseRewards = {
        forest: { food: Math.floor(15 * rewardsMultiplier), wood: Math.floor(20 * rewardsMultiplier) },
        mountain: { stone: Math.floor(25 * rewardsMultiplier) },
        ocean: { food: Math.floor(25 * rewardsMultiplier), water: Math.floor(10 * rewardsMultiplier) }
      }[cell.type] || { food: Math.floor(10 * rewardsMultiplier) };
      
      result.rewards = baseRewards;
      this.addResources(baseRewards);
      
      const rewardText = Object.entries(baseRewards).map(([k, v]) => `${v}${this.getResourceName(k)}`).join('、');
      result.message = `探索成功！获得了${rewardText}${isNight ? '（夜间探索收获较少）' : ''}`;
      
      return result;
    },

    addEventLog(icon, content) {
      const now = new Date();
      const time = `${String(Math.floor(this.gameTime)).padStart(2, '0')}:${String(Math.floor((this.gameTime % 1) * 60)).padStart(2, '0')}`;
      
      this.eventLog.push({
        icon,
        content,
        time,
        day: this.day,
        period: this.timePeriod,
        timestamp: Date.now()
      });
      
      if (this.eventLog.length > 50) {
        this.eventLog.shift();
      }
    },

    getResourceName(type) {
      const names = { food: '食物', water: '淡水', wood: '木材', stone: '石头' };
      return names[type] || type;
    },

    getWeatherName() {
      const names = {
        sunny: '晴朗',
        cloudy: '多云',
        rainy: '雨天',
        stormy: '暴风雨',
        foggy: '雾天'
      };
      return names[this.weather] || this.weather;
    },

    getSeasonName() {
      const names = {
        spring: '春季',
        summer: '夏季',
        autumn: '秋季',
        winter: '冬季'
      };
      return names[this.season] || this.season;
    },

    getTimePeriodName() {
      const names = {
        dawn: '黎明',
        day: '白天',
        dusk: '黄昏',
        night: '夜晚'
      };
      return names[this.timePeriod] || this.timePeriod;
    },

    togglePause() {
      this.isPaused = !this.isPaused;
    },

    resetGame() {
      localStorage.removeItem(STORAGE_KEY);
      this.day = 1;
      this.gameTime = 8;
      this.timePeriod = TIME_PERIODS.DAY;
      this.season = SEASONS.SPRING;
      this.weather = WEATHER_TYPES.SUNNY;
      this.resources = { food: 100, water: 100, wood: 100, stone: 100 };
      this.buildings = { ...BUILDINGS };
      this.guards = [];
      this.currentNightEvent = null;
      this.eventLog = [];
      this.isPaused = false;
      this.defense = 0;
      this.warmth = 0;
      this.lightLevel = 0;
      this.updateTimePeriod();
      saveState(this.$state);
    }
  }
});

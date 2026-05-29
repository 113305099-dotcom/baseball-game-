// game-params.js — v3.23：集中可調參數表
// 所有「升級數量、能力提升幅度、掉落機率、後勤效果」都放在這裡。
// 想做平衡調整，只改這個檔案，不要動到引擎/UI。
(function (global) {
  "use strict";

  const GAME_PARAMS = {
    version: '3.23',

    // ──────────────────────────────────────────────────────────────
    // 1. 球員養成三軌：經驗 / 球員卡 / 碎片品階
    // ──────────────────────────────────────────────────────────────

    // 1a. 經驗升級（打比賽吃經驗）
    experience: {
      // 每次成功取得 XP 的事件值
      xpPerHit: 6,
      xpPerExtraBaseHit: 10,
      xpPerHR: 18,
      xpPerStrikeoutBatter: -2, // 打者三振失分
      xpPerStrikeoutPitcher: 5, // 投手三振 +5
      xpPerWalkPitcher: -1,
      xpPerInningPitched: 4,
      xpPerWinTeam: 25, // 全隊勝場
      xpPerLossTeam: 8, // 敗場也有少量
      xpPerStartDefense: 3,
      // 球員等級成長：等級 → 升下一級所需 XP
      xpToLevelTable: (level) => Math.round(80 * Math.pow(1.22, Math.max(level, 1) - 1)),
      // 每升一級獲得多少能力點數（玩家自動分配於主力屬性）
      statPointsPerLevel: 2,
      maxLevel: 30
    },

    // 1b. 球員卡升級（直接提升能力值）
    cardLevel: {
      maxLevel: 10,
      // 升到該級需要的「資金」（index = 該級，0 級不算）
      costToReachLevel: [0, 300, 700, 1500, 3000, 6000, 12000, 24000, 45000, 80000, 140000],
      // 每升一級獲得的能力加成（會均分到打者主屬性 / 投手主屬性）
      batterBonusPerLevel: { contact: 1, power: 1, discipline: 1, speed: 1, fielding: 1 },
      pitcherBonusPerLevel: { velocity: 1, control: 1, breaking: 1, stuff: 1, stamina: 2 }
    },

    // 1c. 球員碎片 → 品階（決定潛力上限）
    rank: {
      // 8 個品階
      names: ['銅', '銀', '金', '白金', '鑽石', '大師', '宗師', '傳奇'],
      // 升到下一品階所需「該球員的碎片數」
      fragmentsToNextRank: [0, 3, 6, 12, 24, 48, 96, 192],
      // 每升一階：能力上限 +5、潛力 +10
      abilityCeilingPerRank: 5,
      growthPotentialPerRank: 10,
      maxRank: 7 // 0~7 共 8 階
    },

    // ──────────────────────────────────────────────────────────────
    // 2. 教練系統（費氏序列升級）
    // ──────────────────────────────────────────────────────────────
    coaches: {
      maxLevel: 9,
      // 從 level N → N+1 需要的「教練證」（費氏：1, 2, 3, 5, 8, 13, 21, 34）
      certToNextLevel: [1, 2, 3, 5, 8, 13, 21, 34], // index 0 表示 1→2
      // 同時需要的「資金」
      moneyToNextLevel: [400, 800, 1500, 3000, 6000, 12000, 24000, 48000],
      // 每升一級：對所屬部門加成 +2（具體加成種類依部門而定）
      bonusPerLevel: 2,
      // 教練特性顯示用
      specialties: {
        hitting: '打擊指導',
        pitching: '投手指導',
        defense: '守備指導',
        conditioning: '體能調整',
        marketing: '行銷企劃',
        cheerleader: '啦啦隊監督',
        farm: '二軍指導'
      }
    },

    // ──────────────────────────────────────────────────────────────
    // 3. 後勤管理建築效果（每個部門的基礎效果 + 教練加成）
    // ──────────────────────────────────────────────────────────────
    logistics: {
      // 二軍訓練中心：下二軍的選手每場給予訓練值（換算 XP）
      farmTraining: {
        baseXPPerGame: 8,        // 沒派教練也有
        perCoachLevelXP: 3,      // 每教練等級再加
        injuryRecovery: 0.08     // 每場降低下二軍球員傷病風險
      },
      // 一軍訓練中心（三個子部門）
      majorTraining: {
        pitcher: { baseMultiplier: 1.0, perCoachLevel: 0.05 }, // 投手部門：投手 XP × multiplier
        batter:  { baseMultiplier: 1.0, perCoachLevel: 0.05 }, // 打擊部門：打者 XP × multiplier
        fielder: { baseMultiplier: 1.0, perCoachLevel: 0.04 }  // 守備部門：野手守備 XP × multiplier
      },
      // 恢復中心：加快體力恢復、降低傷病
      recovery: {
        baseExtraRecovery: 4,    // 場間多回的體力
        perCoachLevelRecovery: 2,
        baseInjuryReduction: 0.05,
        perCoachLevelReduction: 0.02
      },
      // 行銷部門（兩個子部門）
      marketing: {
        events:  { baseAttendance: 120, perCoachLevel: 40 },     // 活動部門：觀眾基底
        cheer:   { homeBonusMod: 0.04, perCoachLevel: 0.015 }    // 啦啦隊：主場加成（士氣）
      }
    },

    // ──────────────────────────────────────────────────────────────
    // 4. 賽後獎勵（資金 / 教練證 / 球員卡）
    // ──────────────────────────────────────────────────────────────
    rewards: {
      // 資金（已含原本 currency 賞）
      money: {
        win: 900,
        loss: 280,
        tie: 480,
        // MVP 額外
        mvpBonus: 220,
        // 大勝（差距 >= 5）
        blowoutBonus: 350,
        // 每位安打獎金
        perHit: 12,
        perHR: 60
      },
      // 教練證：每場可能掉 0~2 張
      coachCert: {
        winBaseChance: 0.55,
        lossBaseChance: 0.18,
        tieBaseChance: 0.32,
        bonusPerMvpEvent: 0.08,        // MVP 表現出色再加
        shutoutBonus: 0.25,            // 完封勝再加
        // 期望張數（隨機 1 或 2）
        secondCertChance: 0.18
      },
      // 球員卡：掉落該球員的「卡片」（卡片可以拿來給該球員升 cardLevel 或轉為碎片）
      playerCard: {
        winBaseChance: 0.30,
        lossBaseChance: 0.06,
        // 卡片掉的對象：以該場有上場且表現好的球員為主
        favorPlayerWithHitsWeight: 3,
        favorPlayerWithHRWeight: 6,
        favorWinningPitcherWeight: 4
      }
    },

    // ──────────────────────────────────────────────────────────────
    // 5. 報紙頭版（旺來體育）參數
    // ──────────────────────────────────────────────────────────────
    newspaper: {
      title: '旺來體育',
      subtitle: 'WANG-LAI SPORTS DAILY',
      issueFormat: (year, month, day) => `${year}年${month}月${day}日`,
      // 不同戰局的頭版標題模板（會隨機挑一句）
      headlines: {
        bigWin:   ['政大重砲輾壓對手！', '一面倒！政大屠殺敵營', '猛獸出柵 政大大開殺戒', '怒擊全場！政大狂勝'],
        win:      ['政大力克強敵', '勝利之歌再次響起', '政大守住榮耀勝局', '驚險過關 政大笑到最後'],
        comeback: ['驚天逆轉！政大絕地大反攻', '九局奇蹟 政大演出大逆轉', '從谷底翻身！政大上演逆轉秀'],
        walkoff:  ['再見安打！政大全場沸騰', '本壘決勝點 政大笑到最後', 'WALK-OFF！政大絕殺對手'],
        tie:      ['鏖戰未分勝負 政大握平局', '勢均力敵 雙方握手言和'],
        close:    ['一分天堂 一分地獄', '驚險戰役 政大遺憾告負'],
        loss:     ['政大鎩羽而歸', '不甘的一敗 政大需要調整', '失誤連連 政大難敵對手'],
        blowout:  ['苦吞慘敗 政大全面失守', '全壘打雨襲擊 政大潰敗']
      }
    },

    // ──────────────────────────────────────────────────────────────
    // 6. 球員升級時隨等級的能力增幅（給 levelUp 用）
    // ──────────────────────────────────────────────────────────────
    levelUpGrowth: {
      // 升級時隨機提升 1~2 個主力屬性
      batterAttrs: ['contact', 'power', 'discipline', 'speed', 'fielding'],
      pitcherAttrs: ['velocity', 'control', 'breaking', 'stuff', 'stamina'],
      // 每升 1 級給多少能力點（會被 statPointsPerLevel 取代，這裡保留）
      pointsPerLevel: 2
    },

    // ──────────────────────────────────────────────────────────────
    // 6.3 特殊投法投手對照（v3.25.4）
    //     依出手點分類：over / three_quarter / sidearm / submarine
    //     如需新增，直接擴充此表（不必動 stat-mapper）
    //     資料來源：CPBL 維基、Yahoo 體育、Sports Vision「中職下勾投手興衰溯源」
    // ──────────────────────────────────────────────────────────────
    specialPitcherArmSlot: {
      '黃子鵬': 'sidearm',     // 低肩側投，2022 防禦率王
      '宋家豪': 'submarine',   // 前旅日下勾
      '林岳谷': 'submarine',   // 味全龍下勾救援
      '陳鴻文': 'sidearm',     // 中信兄弟前低肩側投
      '倪福德': 'sidearm',     // 前 MLB 老虎隊低肩側投
      '鄭凱文': 'sidearm',     // 富邦悍將側投救援
      '江國謙': 'submarine'    // 統一獅低肩下勾
      // ↑ 可繼續擴充。如有新球員，直接加在此表
    },
    // 各出手點對引擎的修正
    armSlotBonus: {
      submarine: {
        label: '下勾投手',
        stuffScore: 6,            // 模擬出手點怪 → 球質難打
        movementScale: 0.05,      // 球路尾勁略增
        vsRightContact: -4,       // 右打者極不適應
        vsLeftContact:   2,       // 左打者反而比較看得到
        battleLog: '下勾出手讓打者難以判斷球路'
      },
      sidearm: {
        label: '低肩側投',
        stuffScore: 4,
        movementScale: 0.03,
        vsRightContact: -3,
        vsLeftContact:   1,
        battleLog: '低肩側投的角度讓打者揮棒不順'
      },
      three_quarter: { label: '一般出手' },
      over:           { label: '上肩出手' }
    },

    // ──────────────────────────────────────────────────────────────
    // 6.5 投手體力 5 級狀態（v3.25.2）
    //     min = 體力百分比下限；decayMul = 該區段每球扣血倍率
    //     mods = 對能力的修正（套用在 game.js 投打對決前）
    // ──────────────────────────────────────────────────────────────
    staminaStates: [
      { min: 80, key: 'fresh',     label: '龍精虎猛', icon: '🐉', color: '#22c55e', decayMul: 0.50, mods: { velocity:  2, control:  2, breaking:  2 } },
      { min: 60, key: 'sweating',  label: '微微出汗', icon: '💧', color: '#3b82f6', decayMul: 0.85, mods: { velocity:  0, control:  0, breaking:  0 } },
      { min: 35, key: 'tiring',    label: '略顯疲憊', icon: '😮‍💨', color: '#facc15', decayMul: 1.20, mods: { velocity: -3, control: -2, breaking: -2 } },
      { min: 15, key: 'exhausted', label: '累死了',   icon: '😩', color: '#f97316', decayMul: 1.70, mods: { velocity: -8, control: -6, breaking: -4 } },
      { min:  0, key: 'broken',    label: '懷疑人生', icon: '💀', color: '#ef4444', decayMul: 2.20, mods: { velocity: -15, control: -12, breaking: -10 } }
    ],

    // ──────────────────────────────────────────────────────────────
    // 7. 能力值字母評級門檻（v3.25）
    // ──────────────────────────────────────────────────────────────
    abilityGrades: [
      { min: 90, grade: 'S', color: '#ffd700', label: '超凡' },
      { min: 80, grade: 'A', color: '#9b59b6', label: '頂尖' },
      { min: 70, grade: 'B', color: '#3498db', label: '優良' },
      { min: 60, grade: 'C', color: '#27ae60', label: '中庸' },
      { min: 50, grade: 'D', color: '#7f8c8d', label: '尚可' },
      { min: 0,  grade: 'E', color: '#95a5a6', label: '不足' }
    ],

    // ──────────────────────────────────────────────────────────────
    // 8. 天賦（從 abilities 推出的顯示標籤，v3.25）
    //    天賦純顯示，不直接加成；用來告訴玩家球員的特色
    // ──────────────────────────────────────────────────────────────
    talents: [
      // 打者天賦
      { id: 'contact_high',     name: '安打製造機', side: 'B', condition: a => a.contact    >= 80, desc: '聯盟頂尖接觸打者，極少落入打擊低潮' },
      { id: 'power_high',       name: '重砲手',     side: 'B', condition: a => a.power      >= 80, desc: '砲管型強打，每場都可能轟出全壘打' },
      { id: 'power_extreme',    name: '怪力',       side: 'B', condition: a => a.power      >= 90, desc: 'CPBL 等級之上的長打怪物' },
      { id: 'discipline_high',  name: '選球眼',     side: 'B', condition: a => a.discipline >= 80, desc: '老練的選球眼，難用壞球騙到他出棒' },
      { id: 'speed_high',       name: '快腿',       side: 'B', condition: a => a.speed      >= 80, desc: '聯盟頂級腳程，盜壘威脅大' },
      { id: 'fielding_high',    name: '鐵手套',     side: 'B', condition: a => a.fielding   >= 80, desc: '守備穩定如鐵，極少失誤' },
      { id: 'arm_high',         name: '強肩',       side: 'B', condition: a => a.arm        >= 80, desc: '肩力出眾，跑者不敢輕舉妄動' },
      { id: 'clutch_high',      name: '大心臟',     side: 'B', condition: a => a.clutch     >= 80, desc: '得點圈表現遠勝平均' },
      { id: 'vsLeft_high',      name: '剋左投',     side: 'B', condition: a => a.vsLeft     >= 80, desc: '面對左投打擊率顯著提升' },
      // 投手天賦
      { id: 'velocity_high',    name: '火球男',     side: 'P', condition: a => a.velocity   >= 82, desc: '球速壓制力強' },
      { id: 'control_high',     name: '精準投手',   side: 'P', condition: a => a.control    >= 82, desc: '控球精準，少送保送' },
      { id: 'breaking_high',    name: '變化球大師', side: 'P', condition: a => a.breaking   >= 82, desc: '變化球尾勁犀利' },
      { id: 'stamina_high',     name: '鐵人',       side: 'P', condition: a => a.stamina   >= 82, desc: '不易疲勞，可投長局' },
      { id: 'stuff_high',       name: '尖牙利齒',   side: 'P', condition: a => a.stuff     >= 86, desc: '整體球質頂級' },
      // 負面天賦（純顯示，已反映在 abilities 數值上，不再額外懲罰）
      { id: 'wild_pitcher',     name: '控球不穩',   side: 'P', condition: a => a.control    <= 58, desc: '保送威脅，必須謹慎配球' },
      { id: 'lefty_phobia',     name: '恐左',       side: 'B', condition: a => a.vsLeft     <= 60, desc: '面對左投表現明顯下降' }
    ],

    // ──────────────────────────────────────────────────────────────
    // 9. 特質（透過品階解鎖，會實際加成，v3.25）
    //    需要 abilities 達門檻 + playerRank 達門檻才能解鎖
    //    每升一個品階呼叫 PlayerGrowth.unlockTraits() 檢查
    // ──────────────────────────────────────────────────────────────
    traits: [
      // 打者特質（unlocker = ability key, min = 能力門檻, minRank = 品階門檻）
      { id: 'godly_hands',   name: '神之巧手',   side: 'B', unlocker: 'contact',    min: 80, minRank: 1, effect: { contactScore: 6 },   desc: '出棒接觸品質 +6' },
      { id: 'giant_power',   name: '巨人之力',   side: 'B', unlocker: 'power',      min: 80, minRank: 1, effect: { power: 7 },          desc: '長打力 +7' },
      { id: 'green_eye',     name: '綠繡眼',     side: 'B', unlocker: 'discipline', min: 80, minRank: 1, effect: { eye: 7 },            desc: '選球能力 +7（影響追打率）' },
      { id: 'lightning',     name: '閃電俠',     side: 'B', unlocker: 'speed',      min: 80, minRank: 1, effect: { speed: 8 },          desc: '跑壘速度 +12%、盜壘成功率 +10%' },
      { id: 'iron_glove',    name: '絕對守備',   side: 'B', unlocker: 'fielding',   min: 80, minRank: 1, effect: { catchRange: 0.08 },  desc: '守備接球範圍 +8%' },
      { id: 'cannon_arm',    name: '神鵰俠侶',   side: 'B', unlocker: 'arm',        min: 80, minRank: 1, effect: { throwVelocity: 0.10 }, desc: '傳球速度 +10%' },
      { id: 'final_weapon',  name: '最終兵器',   side: 'B', unlocker: 'clutch',     min: 80, minRank: 1, effect: { clutchContact: 8, clutchPower: 5 }, desc: '得點圈 contact +8、power +5' },
      { id: 'lefty_killer',  name: '剋左狂魔',   side: 'B', unlocker: 'vsLeft',     min: 80, minRank: 1, effect: { vsLeftContact: 7, vsLeftPower: 5 }, desc: '面對左投 contact +7、power +5' },
      // 投手特質
      { id: 'lightspeed',    name: '光速球',     side: 'P', unlocker: 'velocity',   min: 82, minRank: 1, effect: { velocity: 6, stuffScore: 6 }, desc: '球速 +6、球質 +6' },
      { id: 'sewing_machine', name: '縫紉機',    side: 'P', unlocker: 'control',    min: 82, minRank: 1, effect: { missRadius: -0.25 }, desc: '控球偏差 -25%' },
      { id: 'witch_pitcher', name: '魔球師',     side: 'P', unlocker: 'breaking',   min: 82, minRank: 1, effect: { breaking: 5, movementScale: 0.08 }, desc: '變化量 +8%、變化 +5' },
      { id: 'infinite_engine', name: '無限發動機', side: 'P', unlocker: 'stamina',  min: 82, minRank: 1, effect: { staminaDecayMul: -0.15 }, desc: '體力下降 -15%' },
      // 雙能力複合特質（需要高品階）
      { id: 'absolute_ace',  name: '絕對王牌',   side: 'P', unlocker: 'stuff',      min: 86, minRank: 4, secondary: { key: 'crisis', min: 82 }, effect: { control: 5, breaking: 4 }, desc: '高 leverage 時 ctrl +5、break +4（需鑽石階）' },
      { id: 'awakening',     name: '覺醒',       side: 'BP', unlocker: 'any',       min: 0,  minRank: 6, effect: { allAbilities: 2 }, desc: '宗師階質變：全能力 +2（必殺技預留）' }
    ]
  };

  global.GAME_PARAMS = GAME_PARAMS;
})(typeof window !== 'undefined' ? window : globalThis);

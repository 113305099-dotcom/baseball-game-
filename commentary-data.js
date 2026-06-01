// commentary-data.js — v3.23：豐富化的轉播文案資料庫
// 含網路梗、PTT/鄉民用語、戲劇化轉播詞。
// 每個事件分 default / 特殊情境兩層；隨機抽取。
// 想新增旁白：直接在對應陣列裡 push 即可，不必動引擎。
(function (global) {
  "use strict";

  const COMMENTARY_LIBRARY = {

    // ────────────────────── 全壘打 ──────────────────────
    homeRun: {
      default: [
        '這顆飛得又高又遠 — 出去啦！全壘打！',
        '碰！這球就像你的前女友 — 再也回不來啦！',
        '飛球 飛球 飛球⋯⋯阿出去啦！',
        '球進場外！這個瞬間值得回放一萬次！',
        '看到沒？這就是政大的力量！',
        '蹦！直接送到二樓看台！',
        '對不起，但這球真的沒辦法接 — HR！'
      ],
      walkoff: [
        '再見全壘打！政大瞬間沸騰！',
        '比賽結束！政大用一顆全壘打結束戰役！',
        '這⋯⋯這是電影才會出現的劇本！再見砲！',
        'WALK-OFF！球場屋頂都快被掀飛了！'
      ],
      grandSlam: [
        '滿貫炮！這顆值四分！',
        '滿壘全壘打！對方投手已經跪了！',
        '一棒掃光所有跑者，這就是滿貫的浪漫！'
      ],
      powerHitter: [
        '怪力打者上場 — 球場根本關不住他！',
        '這就是長打型打者的暴力美學。',
        '不用看了，這顆早就出去了。'
      ],
      tape: [
        '這球目測一百一十公尺以上，超大號特大號滿天紅！',
        '彈道學家都要重新換算了，這球飛到外太空！'
      ]
    },

    // ────────────────────── 三振 ──────────────────────
    strikeout: {
      default: [
        'K！打者揮空，三振出局！',
        '好球三顆，BYE BYE！',
        '完全被吃掉，三振出局！',
        '揮空！對方打者吞下這顆 K！',
        '球進好球帶角落 — 打者來不及反應！',
        'K！K！K！這位投手今天狀態爆棚！'
      ],
      lookingStrike: [
        '看著三振！打者直接呆在原地！',
        '球進角落！打者眼睜睜看球穿過好球帶！',
        '主審舉手 — 看著三振，對方傻眼！',
        '這顆主審決定，三振！打者一臉問號離場！'
      ],
      elitePitcher: [
        '精準到不可思議！這位投手簡直是神！',
        '完美的控球！打者徹底被讀死！',
        '王牌就是王牌，連揮棒的機會都不給對方！'
      ],
      crisis: [
        '滿壘危機？投手三振解決！這就是大心臟！',
        '危機時刻 — 一球三振！冷血殺手！'
      ],
      streak: [
        '連續三振！這顆是本場第 ${count} K！',
        '投手已經進入無人之境！再吃下一位！'
      ]
    },

    // ────────────────────── 一壘安打 ──────────────────────
    single: {
      default: [
        '安打！球穿過防線，打者輕鬆上一壘！',
        '滾過二游中間 — 安打！',
        '球從投手腳邊溜進中外野，一壘安打！',
        '紮實的擊球 — 漂亮的一壘安打！',
        '飛越游擊頭頂落在淺外野 — 安打！'
      ],
      clutchHitter: [
        '關鍵時刻 — 大心臟發揮作用！',
        '兩出局還能扛住！這就是政大的關鍵打者！',
        '壓力下的真男人，安打！'
      ],
      bunt: [
        '觸擊安打！防守來不及！',
        '小球戰術成功！打者跑出來了！',
        '完美的犧牲觸擊 — 安全上壘！'
      ],
      seeingEyeSingle: [
        '球從游擊與三壘間鑽過 — 運氣球！',
        '這顆⋯⋯滾過去了！棒運加持！'
      ]
    },

    // ────────────────────── 二壘安打 ──────────────────────
    double: {
      default: [
        '深遠的擊球 — 二壘安打！打者直接上二壘！',
        '球打到全壘打牆下沿彈回 — 二壘安打！',
        '長打！打者輕鬆站上二壘！',
        '一棒撕裂外野防線 — 二壘安打！'
      ],
      wallBall: [
        '砸到牆面！打者跑進二壘！',
        '差一點就出去 — 但這顆是穩穩的二壘安打！'
      ],
      gap: [
        '球穿過中外野與右外野中間的死角 — 二壘安打！',
        '兩位外野手都追不到！漂亮的長打！'
      ]
    },

    // ────────────────────── 三壘安打 ──────────────────────
    triple: {
      default: [
        '三壘安打！打者全力衝刺！',
        '深遠的飛球！打者已經跑到三壘！',
        '球滾到全壘打牆角落 — 三壘安打！',
        '速度型打者的價值就在這 — 三壘安打！'
      ],
      speed: [
        '速度太快了！外野傳球都來不及 — 三壘安打！',
        '跑出全場最快速度 — 上到三壘！'
      ]
    },

    // ────────────────────── 滾地球出局 ──────────────────────
    groundOut: {
      default: [
        '滾地球到二壘 — 出局！',
        '一個簡單的滾地球，封殺一壘！',
        '球進手套，傳一壘 — OUT！',
        '紮實的守備 — 滾地球出局！',
        '游擊手撿起來，傳一壘 — 安全出局！'
      ],
      doublePlay: [
        '6-4-3！漂亮的雙殺！',
        '兩個出局！對方投手鬆了口氣！',
        '二壘出局 — 一壘出局！教科書級雙殺！',
        '雙殺打！政大牢牢守住！',
        '一顆球換兩個出局，這就是守備的價值！'
      ],
      weakContact: [
        '軟弱的滾地球 — 輕鬆出局。',
        '打到投手腳邊 — 直接傳一壘出局。'
      ]
    },

    // ────────────────────── 高飛球出局 ──────────────────────
    flyOut: {
      default: [
        '高飛球被中外野手接殺！',
        '球往外野飛 — 接殺！',
        '輕鬆的接殺，一個出局！',
        '外野手退到牆邊 — 穩穩接住！'
      ],
      deepFly: [
        '差一點就出去！外野手在牆邊接到！',
        '這顆嚇出一身冷汗 — 還好沒飛出去！'
      ],
      sacrificeFly: [
        '高飛犧牲打 — 三壘跑者回本壘得分！',
        '雖然出局，但跑者回來了 — 算成功的犧牲！',
        '高飛球換一分 — 戰術成功！'
      ],
      shallow: [
        '淺外野飛球 — 接殺！',
        '球沒打深 — 二壘手後退接住！'
      ]
    },

    // ────────────────────── 內野高飛 ──────────────────────
    popupOut: {
      default: [
        '內野高飛球 — 游擊手接殺！',
        '球高高彈起 — 一壘手原地接住！',
        '完全沒打到甜蜜點 — 內野彈跳出局！'
      ]
    },

    // ────────────────────── 保送 ──────────────────────
    walk: {
      default: [
        '四壞球保送！打者輕鬆上壘！',
        '投手控球失準 — 送一個保送！',
        '球四壞 — 打者站上一壘！',
        '保送！等於免費的安打！'
      ],
      disciplined: [
        '選球眼！打者一球都不揮 — 保送上壘！',
        '紀律性打者 — 用眼睛打出保送！'
      ],
      intentional: [
        '故意保送！對方教練選擇閃打！',
        '不打你了 — 故意四壞！'
      ]
    },

    // ────────────────────── 觸身球 ──────────────────────
    hitByPitch: {
      default: [
        '觸身球！打者皺著眉走向一壘！',
        '球打到打者 — HBP！上壘！',
        '失投球 — 痛！但上壘了！'
      ]
    },

    // ────────────────────── 失誤 ──────────────────────
    error: {
      default: [
        '失誤！球從手套裡彈出來！',
        '守備失誤 — 跑者推進！',
        '哎呀⋯⋯這顆漏接，跑者上壘！',
        '球進手套又掉出來 — 失誤！'
      ],
      throwingError: [
        '傳球失準！球滾過一壘 — 跑者多進一個壘包！',
        '傳偏了！跑者趁機推進！'
      ]
    },

    // ────────────────────── 得分 ──────────────────────
    runScored: {
      default: [
        '跑者回本壘 — 得分！',
        '又一分！政大領先擴大！',
        '球場沸騰 — 計分板亮起新的數字！'
      ],
      tiedGame: [
        '追平了！比賽再度回到原點！',
        '這分把比分追平 — 觀眾全場起立！'
      ],
      leadChange: [
        '逆轉！政大反超對手！',
        '這分讓政大反客為主！'
      ]
    },

    // ────────────────────── 開場 / 局數 ──────────────────────
    opening: {
      default: [
        '各位觀眾朋友晚安，今天在 ${stadium} ，是 ${team} 對上 ${opponent} 的精彩對決！',
        '比賽正式開始 — ${team} vs ${opponent}，地點在 ${stadium}！',
        '萬眾矚目的一戰 — 政大今晚迎戰 ${opponent}！',
        '球迷們，準備好了嗎？${stadium} 即將上演今晚的好戲！'
      ]
    },

    // ────────────────────── 神守備 ──────────────────────
    greatPlay: {
      default: [
        '神守備！這顆球居然接住了！',
        '飛撲接殺！對方教練都鼓掌了！',
        '不可思議！這位野手剛剛飛起來！',
        '這就是守備天才！'
      ]
    },

    // ────────────────────── 場面：滿壘 / 危機 ──────────────────────
    bigSituation: {
      basesLoaded: [
        '滿壘 — 任何結果都可能改變比賽！',
        '一二三壘有人 — 投手肩上的壓力倍增！',
        '滿壘危機 — 球場安靜得能聽到呼吸聲！'
      ],
      tworuts: [
        '兩出局 — 接下來這一球決定一切！',
        '兩個好球 — 投手只差一球！'
      ]
    },

    // ────────────────────── 比賽總結 / 報紙副標 ──────────────────────
    newspaperLead: {
      bigWin: [
        '政大主場炸裂，刷新本季最大分差紀錄！',
        '一面倒的勝利 — 政大用實力告訴世界，台灣棒球進化了。',
        '從第一局打到最後一局，政大全方位輾壓對手。'
      ],
      win: [
        '政大穩穩守住勝局，繳出近期最有質感的一戰。',
        '攻守兼備，政大再添一勝。',
        '從投手丘到打擊區，政大今天都做到了。'
      ],
      walkoff: [
        '再見一擊！政大用最戲劇化的方式拿下勝利。',
        '九局下絕殺！政大球迷今晚將失眠到天亮。'
      ],
      comeback: [
        '逆境中爆發！政大用堅韌寫下這場逆轉戲碼。',
        '從落後到反超 — 政大的「不放棄精神」再次顯現。'
      ],
      tie: [
        '勢均力敵 — 雙方都展現出冠軍隊的水準。',
        '握手言和 — 但雙方都知道這場仗未結束。'
      ],
      loss: [
        '政大今天碰上強敵，調整後將再起。',
        '一場學習意義濃厚的失利。',
        '失誤葬送可能的勝局 — 政大需要回去檢討。'
      ],
      blowout: [
        '苦吞慘敗 — 但這是球季的一部分。',
        '政大今天全面失守 — 但下一場將是反擊的起點。'
      ]
    }
  };

  // ──────────────────────────────────────────────────────────────
  // 工具：模板插值（${stadium} 之類）
  // ──────────────────────────────────────────────────────────────
  function fillTemplate(text, vars = {}) {
    return String(text).replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  }

  // 工具：從陣列隨機取
  function pickRandom(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ═══════════════════════════════════════════════════════════════
  // v4.2b — 雙人播報對話模板（broadcast.*）
  // 格式：[{ speaker: 'caster'|'color', text: '...' }, ...]
  // 變數：${batter} ${pitcher} ${distance} ${hrCount} ${inning} ${score}
  //        ${count} ${outs} ${team} ${stadium} ${avg} ${era} ${runners}
  // ═══════════════════════════════════════════════════════════════
  const BROADCAST = {
    homeRun: {
      default: [
        { lines: [
          { speaker: 'caster', text: '這球咬中！${batter}大棒一揮——' },
          { speaker: 'caster', text: '——出去啦！${distance}公尺的大號全壘打！' }
        ]},
        { lines: [
          { speaker: 'color', text: '噢——這聲音！甜蜜點扎扎實實。' },
          { speaker: 'caster', text: '不用看了！${batter}一棒掃出全壘打牆！' }
        ]},
        { lines: [
          { speaker: 'caster', text: '飛球！左外野方向——非常深遠！' },
          { speaker: 'color', text: '${batter}的揮棒軌跡真的漂亮，這球咬得太扎實。' },
          { speaker: 'caster', text: '——出去啦！全壘打！' }
        ]}
      ],
      walkoff: [
        { lines: [
          { speaker: 'caster', text: '這球打向——右外野！還在飛！還在飛！' },
          { speaker: 'caster', text: '——再見全壘打！比賽結束！政大贏了！' },
          { speaker: 'color', text: '天啊，這是電影劇本吧？九局下半的再見轟！' }
        ]},
        { lines: [
          { speaker: 'caster', text: '這球一出手就知道不妙——出去了！WALK-OFF！' },
          { speaker: 'color', text: '${batter}直接英雄式繞壘，全場沸騰！好震撼的畫面。' }
        ]}
      ],
      grandSlam: [
        { lines: [
          { speaker: 'caster', text: '滿壘！這球如果出去就是——' },
          { speaker: 'caster', text: '——滿貫全壘打！四分通通回來！' },
          { speaker: 'color', text: '一棒四分的暴力美學！對方投手直接跪了。' }
        ]},
        { lines: [
          { speaker: 'color', text: '${batter}站在打擊區的表情⋯⋯他想要一棒結束這局。' },
          { speaker: 'caster', text: '——真的出去了！滿貫炮！政大一次掃光所有跑者！' }
        ]}
      ],
      powerHitter: [
        { lines: [
          { speaker: 'caster', text: '怪力級打者上場——球場根本關不住${batter}！' },
          { speaker: 'color', text: '他今年的 ${hrCount} 轟就是這樣來的，只要咬到甜蜜點，沒有球場關得住。' },
          { speaker: 'caster', text: '——出去了！超大號！' }
        ]}
      ]
    },

    strikeout: {
      default: [
        { lines: [
          { speaker: 'caster', text: '外角低球——揮空！三振出局！' },
          { speaker: 'color', text: '這顆變化球的軌跡太刁鑽，打者完全對不到。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '兩好球之後的決勝球——打者揮棒落空！K！' },
          { speaker: 'color', text: '${pitcher}今天這顆決勝球非常精準，打者根本沒機會。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '好球進壘！主審拉弓！三振！' }
        ]}
      ],
      elitePitcher: [
        { lines: [
          { speaker: 'caster', text: '又是一個三振！${pitcher}今天完全宰制！' },
          { speaker: 'color', text: '他的球速跟控球今天都是頂尖水準，打者毫無反擊能力。' }
        ]},
        { lines: [
          { speaker: 'color', text: '你看這顆球的位移——從打者眼裡看起來是好球，進來才發現完全對不到。' },
          { speaker: 'caster', text: '王牌就是王牌，連揮棒的機會都不給對方！K！' }
        ]}
      ],
      crisis: [
        { lines: [
          { speaker: 'caster', text: '滿壘危機——三振！${pitcher}安全下庄！' },
          { speaker: 'color', text: '這就是大心臟！危機時刻反而投得更好。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '得點圈有跑者、兩好三壞——揮空！' },
          { speaker: 'color', text: '冷靜到不可思議，這種時刻還敢投刁鑽的變化球。' }
        ]}
      ]
    },

    single: {
      default: [
        { lines: [
          { speaker: 'caster', text: '球穿過二游之間——安打！${batter}站上一壘！' }
        ]},
        { lines: [
          { speaker: 'caster', text: '滾地球！穿出去了！一壘安打！' },
          { speaker: 'color', text: '打得巧不如打得準，這球落點剛好在守備員之間。' }
        ]}
      ],
      clutchHitter: [
        { lines: [
          { speaker: 'caster', text: '關鍵時刻！${batter}——安打！跑者回來得分！' },
          { speaker: 'color', text: '大心臟就是大心臟，越是關鍵越能發揮。' }
        ]}
      ]
    },

    double: {
      default: [
        { lines: [
          { speaker: 'caster', text: '這球掃向中外野深處！落在牆前——二壘安打！' },
          { speaker: 'color', text: '完美的平飛球，外野手追到牆邊還是來不及。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '左外野方向——打在牆上反彈！${batter}輕鬆上二壘！' }
        ]}
      ]
    },

    triple: {
      default: [
        { lines: [
          { speaker: 'caster', text: '深遠飛球！外野手追到牆邊——沒接到！' },
          { speaker: 'caster', text: '${batter}繞過二壘——繼續衝！三壘安打！' },
          { speaker: 'color', text: '速度跟力量兼具，這球跑出三壘太精彩了。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '這球打在外野大空檔！${batter}開全速——三壘安打！' }
        ]}
      ],
      speed: [
        { lines: [
          { speaker: 'caster', text: '快腿出擊！球剛碰到外野，${batter}已經繞過二壘！' },
          { speaker: 'color', text: '他的速度真的是聯盟頂尖，這球換成別人頂多二壘。' }
        ]}
      ]
    },

    groundOut: {
      default: [
        { lines: [
          { speaker: 'caster', text: '游擊方向滾地球——穩穩傳一壘，出局！' }
        ]},
        { lines: [
          { speaker: 'caster', text: '三壘手接到——傳一壘！一個彈跳進手套，出局！' }
        ]}
      ],
      doublePlay: [
        { lines: [
          { speaker: 'caster', text: '滾地球！6-4-3 雙殺！一次拿下兩個出局數！' },
          { speaker: 'color', text: '漂亮！二游連線的默契就是這麼舒服。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '雙殺打！投手最想看到的結果！' },
          { speaker: 'color', text: '滾地球型投手的最佳夥伴——穩定的內野守備。' }
        ]}
      ]
    },

    flyOut: {
      default: [
        { lines: [
          { speaker: 'caster', text: '高飛球——外野手就定位，接殺出局。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '內野高飛球——出局！' }
        ]}
      ],
      deepFly: [
        { lines: [
          { speaker: 'caster', text: '深遠飛球！外野手退到警戒區——接殺！' },
          { speaker: 'color', text: '差一點就出去了，這球擊球初速很驚人，可惜角度高了點。' }
        ]}
      ],
      sacrificeFly: [
        { lines: [
          { speaker: 'caster', text: '外野高飛球——跑者準備起跑！接殺後跑者回本壘！犧牲打一分！' },
          { speaker: 'color', text: '基本功，這就是團隊棒球。' }
        ]}
      ]
    },

    walk: {
      default: [
        { lines: [
          { speaker: 'caster', text: '四壞球——保送！打者站上一壘。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '連續四顆壞球，打者直接放掉——保送。' },
          { speaker: 'color', text: '${pitcher}這打席控球有點走樣，需要穩下來。' }
        ]}
      ],
      disciplined: [
        { lines: [
          { speaker: 'caster', text: '打者完全沒揮棒——四壞保送！' },
          { speaker: 'color', text: '${batter}的選球眼真的厲害，壞球騙不了他。' }
        ]}
      ]
    },

    error: {
      default: [
        { lines: [
          { speaker: 'caster', text: '哎呀——失誤！球從手套下穿了過去！' },
          { speaker: 'color', text: '這球應該要接到的，守備的基本功出了問題。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '暴傳！球飛過一壘手頭頂！跑者安全上壘！' },
          { speaker: 'color', text: '傳球急了，腳步沒踩穩就出手。' }
        ]}
      ]
    },

    runScored: {
      default: [
        { lines: [
          { speaker: 'caster', text: '跑者回本壘——得分！【${team} ${score}】' },
          { speaker: 'color', text: '好的跑壘判斷，把握對方的守備空檔。' }
        ]}
      ]
    },

    stolenBase: {
      default: [
        { lines: [
          { speaker: 'caster', text: '跑者起跑！球傳到——Safe！盜壘成功！' },
          { speaker: 'color', text: '起跑時機抓得完美，捕手完全來不及。' }
        ]},
        { lines: [
          { speaker: 'caster', text: '盜壘！${batter}腳程飛快——二壘 Safe！' }
        ]}
      ]
    },

    inningBreak: {
      default: [
        { lines: [
          { speaker: 'caster', text: '═══ ${inning} 結束 ═══ ${team} ${score}' },
          { speaker: 'color', text: '這一局雙方各有亮點，接下來下半局是關鍵。' }
        ]}
      ]
    },

    moundVisit: {
      default: [
        { lines: [
          { speaker: 'caster', text: '教練團走上投手丘——討論了一下配球策略。' },
          { speaker: 'color', text: '${pitcher}今天已經投了不少球，教練團來關心一下狀況。' }
        ]}
      ]
    },

    pitchingChange: {
      default: [
        { lines: [
          { speaker: 'caster', text: '牛棚有動作——${pitcher}今天的工作到此為止。' },
          { speaker: 'color', text: '教練團的調度很明快，不讓投手硬撐。' }
        ]}
      ]
    },

    greatPlay: {
      default: [
        { lines: [
          { speaker: 'caster', text: '美技守備！飛撲接殺！太神了！' },
          { speaker: 'color', text: '這種球平常十顆掉八顆，這球居然接到了！' }
        ]},
        { lines: [
          { speaker: 'caster', text: '撲下去！撈起來！傳一壘——Out！' },
          { speaker: 'color', text: '這球可以選進本週十大好球了。' }
        ]}
      ]
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // v4.2b — 閒聊話題池（BANTER）
  // 低張力時刻隨機觸發，不干擾比賽關鍵時刻
  // ═══════════════════════════════════════════════════════════════
  const BANTER = {
    playerStory: [
      { lines: [
        { speaker: 'color', text: '你知道嗎，${batter} 大學時期其實是投手。後來手臂受傷才轉打者，結果反而打出名堂。' },
        { speaker: 'caster', text: '真的假的？那他現在能投能打，根本二刀流啊！' }
      ]},
      { lines: [
        { speaker: 'color', text: '${batter}小時候是看 CPBL 長大的，他說他小學就在球場外面等球星簽名。' },
        { speaker: 'caster', text: '現在換他在場上幫球迷簽名了，這就是傳承吧。' }
      ]},
      { lines: [
        { speaker: 'color', text: '${batter}今年做了很多重量訓練，他說要加強長打。' },
        { speaker: 'caster', text: '看得出來，他今年的揮棒速度明顯比去年快多了。' }
      ]},
      { lines: [
        { speaker: 'color', text: '講到${batter}，他有一個習慣——每打席前一定會摸一下頭盔。' },
        { speaker: 'caster', text: '這算是他的幸運動作吧，很多球員都有這種小儀式。' }
      ]},
      { lines: [
        { speaker: 'color', text: '${batter}的爸爸也是棒球員，從小在球場長大的。' },
        { speaker: 'caster', text: '棒球世家出身，那種球感是刻在骨子裡的。' }
      ]}
    ],

    statFun: [
      { lines: [
        { speaker: 'color', text: '我剛查了一下，${batter}在第七局之後的打擊率高達 .340，越晚越猛。' },
        { speaker: 'caster', text: '這就是所謂的 clutch hitter 啊，關鍵時刻特別興奮。' }
      ]},
      { lines: [
        { speaker: 'color', text: '你知道嗎，${pitcher}今年對左打的被打擊率只有 .210。' },
        { speaker: 'caster', text: '難怪左打碰到他都特別苦手，那顆外角變化球太刁了。' }
      ]},
      { lines: [
        { speaker: 'color', text: '數據上來看，${team}今年在一分差比賽的勝率超過六成。' },
        { speaker: 'caster', text: '這說明他們的牛棚很穩，能守住小比分。' }
      ]},
      { lines: [
        { speaker: 'color', text: '你知道嗎，${pitcher}的第一球好球率高達 68%，聯盟前五。' },
        { speaker: 'caster', text: '搶到第一球好球，投手就掌握主動權了。' }
      ]}
    ],

    ballparkChat: [
      { lines: [
        { speaker: 'color', text: '今天 ${stadium} 的風向是順風，外野手可能要往後站兩步。' },
        { speaker: 'caster', text: '而且濕度偏高，變化球的轉速會比平常更好。' }
      ]},
      { lines: [
        { speaker: 'color', text: '講到 ${stadium}，我上次來這裡的時候，外野的風大到旗子都打橫了。' },
        { speaker: 'caster', text: '對投手來說順風很恐怖啊，任何飛球都有機會出去。' }
      ]},
      { lines: [
        { speaker: 'color', text: '今天觀眾席氣氛很好欸，好久沒看到這麼多球迷了。' },
        { speaker: 'caster', text: '棒球就是要有人氣才好看！觀眾的聲音就是最好的配樂。' }
      ]},
      { lines: [
        { speaker: 'color', text: '今天天空很藍、雲很白，標準的棒球好天氣。' },
        { speaker: 'caster', text: '這種天氣打球最舒服了，不冷不熱剛剛好。' }
      ]}
    ],

    opponentTalk: [
      { lines: [
        { speaker: 'color', text: '對手 ${pitcher} 今年對左打的被打擊率只有 .210，今天政大排了五個左打，會是關鍵。' },
        { speaker: 'caster', text: '鍾sir 犀利，這個對戰組合確實不好打。' }
      ]},
      { lines: [
        { speaker: 'color', text: '你看對方捕手的配球，很喜歡在兩好球之後來一顆外角低的變化球。' },
        { speaker: 'caster', text: '打者要有耐心，不要被釣到。' }
      ]},
      { lines: [
        { speaker: 'color', text: '對方總教練的戰術很靈活，短打、打帶跑、強迫取分都會用。' },
        { speaker: 'caster', text: '所以守備要隨時保持警覺，不能有半秒鬆懈。' }
      ]}
    ],

    nostalgia: [
      { lines: [
        { speaker: 'color', text: '看到這場景我想到 2003 年亞錦賽，同樣的滿場觀眾、同樣的緊張氣氛⋯⋯' },
        { speaker: 'caster', text: '那場真的是經典啊，到現在球迷還在講。' }
      ]},
      { lines: [
        { speaker: 'color', text: '以前 CPBL 的老球迷應該記得，那個年代的外野看台都是拿椅子去坐的。' },
        { speaker: 'caster', text: '現在有舒服的座位、大螢幕重播，環境真的好太多了。' }
      ]},
      { lines: [
        { speaker: 'color', text: '棒球在台灣一百多年的歷史，從日治時期到現在，真的是最長壽的運動。' },
        { speaker: 'caster', text: '棒球就是台灣的國球，每一代人都有自己的經典回憶。' }
      ]}
    ],

    foodChat: [
      { lines: [
        { speaker: 'color', text: '說到棒球，我覺得球場的便當比外面好吃三倍。是心理作用還是真的？' },
        { speaker: 'caster', text: '絕對是心理作用，但我也覺得比較好吃⋯⋯尤其是配著比賽吃。' }
      ]},
      { lines: [
        { speaker: 'color', text: '你知道球場最受歡迎的食物是什麼嗎？不是熱狗——是炸雞排！' },
        { speaker: 'caster', text: '台灣球場的特色：邊看球邊啃雞排配珍奶，這就是幸福。' }
      ]},
      { lines: [
        { speaker: 'color', text: '我上次在球場吃了一碗滷肉飯，那個滷汁香到隔壁球迷都轉頭看我。' },
        { speaker: 'caster', text: '你這樣講我肚子開始叫了⋯⋯比賽結束一定要去買一碗。' }
      ]}
    ]
  };

  // ═══════════════════════════════════════════════════════════════
  // v4.2b — 冷笑話池（DAD_JOKES）
  // 球評講 → 主播吐槽，低機率觸發（5-8%），每場最多 3 則
  // ═══════════════════════════════════════════════════════════════
  const DAD_JOKES = [
    { lines: [
      { speaker: 'color', text: '為什麼棒球員不玩撲克牌？' },
      { speaker: 'caster', text: '⋯⋯為什麼？' },
      { speaker: 'color', text: '因為怕被發「王牌」啊。' },
      { speaker: 'caster', text: '⋯⋯我到底為什麼要接這個梗。' }
    ]},
    { lines: [
      { speaker: 'color', text: '投手跟咖啡有什麼共通點？' },
      { speaker: 'caster', text: '我不知道，但我直覺這不會是好笑話。' },
      { speaker: 'color', text: '都需要好的 pitch。' },
      { speaker: 'caster', text: '導播，下一則請切掉謝謝。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼棒球場的草總是特別綠嗎？' },
      { speaker: 'caster', text: '因為澆水澆得多？' },
      { speaker: 'color', text: '因為每天都有人在外野「飛」來「飛」去⋯⋯灌溉得很均勻。' },
      { speaker: 'caster', text: '這個笑話的水平跟你的打擊率一樣低。' }
    ]},
    { lines: [
      { speaker: 'color', text: '為什麼野手不會迷路？' },
      { speaker: 'caster', text: '？？？' },
      { speaker: 'color', text: '因為他們永遠知道自己的「守備位置」。' },
      { speaker: 'caster', text: '⋯⋯今天轉播就到這裡，謝謝大家收看。' }
    ]},
    { lines: [
      { speaker: 'color', text: '棒球跟數學有什麼關係？' },
      { speaker: 'caster', text: '你又要講什麼？' },
      { speaker: 'color', text: '都有一堆「分數」可以算。' },
      { speaker: 'caster', text: '好，以下開放球迷打電話進來申訴轉播品質。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼投手都很有錢嗎？' },
      { speaker: 'caster', text: '因為薪水高？' },
      { speaker: 'color', text: '因為他們每天都在「投」資。' },
      { speaker: 'caster', text: '這個我連反應都不想給。' }
    ]},
    { lines: [
      { speaker: 'color', text: '打者最怕什麼動物？' },
      { speaker: 'caster', text: '⋯⋯什麼？' },
      { speaker: 'color', text: '蝴蝶，因為蝴蝶球打不到。' },
      { speaker: 'caster', text: '好吧這個還行⋯⋯但我還是要扣你薪水。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼壘包是正方形的嗎？' },
      { speaker: 'caster', text: '因為棒球規則規定的？' },
      { speaker: 'color', text: '因為如果是圓形的，跑者會一直轉圈圈停不下來。' },
      { speaker: 'caster', text: '⋯⋯我今天不跟你講話了。' }
    ]},
    { lines: [
      { speaker: 'color', text: '為什麼捕手是最聰明的球員？' },
      { speaker: 'caster', text: '為什麼？' },
      { speaker: 'color', text: '因為他每次蹲下來都在「思考」配球。' },
      { speaker: 'caster', text: '那投手站在投手丘上是在做什麼？' },
      { speaker: 'color', text: '在等捕手思考完。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼棒球裁判戴面具嗎？' },
      { speaker: 'caster', text: '為了保護臉？' },
      { speaker: 'color', text: '因為他們的判決常常「沒臉見人」。' },
      { speaker: 'caster', text: '這個太大膽了⋯⋯裁判不要看轉播！' }
    ]},
    { lines: [
      { speaker: 'color', text: '棒球員最喜歡什麼天氣？' },
      { speaker: 'caster', text: '晴天？' },
      { speaker: 'color', text: '不，是「安」打日。' },
      { speaker: 'caster', text: '導播我們直接進廣告第 37 段謝謝。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼全壘打要叫 Home Run 嗎？' },
      { speaker: 'caster', text: '因為打出去可以慢慢跑回家？' },
      { speaker: 'color', text: '沒錯，但有時候是對方投手會想跑回家。' },
      { speaker: 'caster', text: '這個投手心靈創傷的部分就不好笑了⋯⋯' }
    ]},
    { lines: [
      { speaker: 'color', text: '為什麼變速球是最有禮貌的球種？' },
      { speaker: 'caster', text: '？' },
      { speaker: 'color', text: '因為它會「慢」慢來。' },
      { speaker: 'caster', text: '今天的冷笑話配額已經用完了。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼觸擊短打叫 sacrifice bunt 嗎？' },
      { speaker: 'caster', text: '因為犧牲自己送隊友前進？' },
      { speaker: 'color', text: '對，就像我每次講笑話都在犧牲自己的專業形象。' },
      { speaker: 'caster', text: '你終於承認了。' }
    ]},
    { lines: [
      { speaker: 'color', text: '你知道為什麼界外球都很貴嗎？' },
      { speaker: 'caster', text: '因為⋯⋯？' },
      { speaker: 'color', text: '因為每顆都是「額外」支出。' },
      { speaker: 'caster', text: '這球真的界外了，我說你的笑話。' }
    ]}
  ];

  // ═══════════════════════════════════════════════════════════════
  // 工具函式：從新格式（lines 陣列）隨機選取
  // ═══════════════════════════════════════════════════════════════
  function pickBroadcastLines(library, subKey = 'default') {
    const arr = library[subKey] || library.default || [];
    if (!Array.isArray(arr) || !arr.length) return null;
    return pickRandom(arr);
  }

  function pickBanterLines(category) {
    const arr = BANTER[category];
    if (!Array.isArray(arr) || !arr.length) return null;
    return pickRandom(arr);
  }

  function pickDadJoke() {
    if (!Array.isArray(DAD_JOKES) || !DAD_JOKES.length) return null;
    return pickRandom(DAD_JOKES);
  }

  // ═══════════════════════════════════════════════════════════════
  // 公開 API
  // ═══════════════════════════════════════════════════════════════
  global.COMMENTARY_LIBRARY = COMMENTARY_LIBRARY;
  global.BROADCAST = BROADCAST;
  global.BANTER = BANTER;
  global.DAD_JOKES = DAD_JOKES;
  global.pickBroadcastLines = pickBroadcastLines;
  global.pickBanterLines = pickBanterLines;
  global.pickDadJoke = pickDadJoke;

  global.pickCommentaryFromLibrary = function (category, subcategory = 'default', vars = {}) {
    const lib = COMMENTARY_LIBRARY[category];
    if (!lib) return '';
    let arr = lib[subcategory] || lib.default || [];
    if (!Array.isArray(arr)) arr = [];
    return fillTemplate(pickRandom(arr), vars);
  };
  global.fillCommentaryTemplate = fillTemplate;
})(typeof window !== 'undefined' ? window : globalThis);

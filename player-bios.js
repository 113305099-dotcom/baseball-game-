// =====================================================================
// player-bios.js — CPBL 球員基本資料（身高/體重/生日/投打/守位/照片）
// 資料來源：cpbl.com.tw 官網 + Wikipedia，2026-05-28 爬取
// 用法：PLAYER_META["張育成"].heightCm  → 185
// 注意：改名為 PLAYER_META，避免與 data.js 的 PLAYER_BIOS（一句話介紹字串）撞名。
//       （v4.1 Phase 3A 修：兩者同名 const 會丟 SyntaxError 讓本檔整個無法載入）
// =====================================================================

const PLAYER_META = {
  "力亞士": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "小野寺賢人": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "孔念恩": {
    heightCm: 184, weightKg: 89,
    birthDate: "2003/09/01",
    bats: "L", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L277412499434187213/82孔念恩2026.jpg",
    team: "富邦悍將二軍"
  },
  "尹柏淮": {
    heightCm: 176, weightKg: 95,
    birthDate: "2004/04/30",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N066404016997150668/84尹柏淮.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "戈威士": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "王正棠": {
    heightCm: 177, weightKg: 82,
    birthDate: "1995/09/17",
    bats: "L", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782033525863311/35王正棠2026.jpg",
    team: "富邦悍將二軍"
  },
  "王伯洋": {
    heightCm: 180, weightKg: 83,
    birthDate: "2000/02/17",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N294456895711364852/107王伯洋.jpg",
    team: "味全龍"
  },
  "王志煊": {
    heightCm: 175, weightKg: 72,
    birthDate: "2001/09/05",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088831565607771580/64王志煊2025.jpg",
    team: "樂天桃猿"
  },
  "王定穎": {
    heightCm: 184, weightKg: 81,
    birthDate: "1996/01/18",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782034995208781/90王定穎2025.jpg",
    team: "味全龍二軍"
  },
  "王念好": {
    heightCm: 183, weightKg: 96,
    birthDate: "2005/04/29",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N265563964441613812/5王念好2026.jpg",
    team: "富邦悍將"
  },
  "王威晨": {
    heightCm: 185, weightKg: 85,
    birthDate: "1991/07/03",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782008227837668/王威晨2024.png",
    team: "中信兄弟"
  },
  "王政順": {
    heightCm: 175, weightKg: 86,
    birthDate: "1996/10/30",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782039897258835/王政順2024.png",
    team: "中信兄弟"
  },
  "王柏傑": {
    heightCm: 178, weightKg: 78,
    birthDate: "2004/10/18",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N241575187154939998/12王柏傑2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "王柏融": {
    heightCm: 182, weightKg: 91,
    birthDate: "1993/09/09",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782008861716695/9王柏融2025.jpg",
    team: "台鋼雄鷹"
  },
  "王苡丞": {
    heightCm: 185, weightKg: 95,
    birthDate: "2003/05/01",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L277391736750578048/14王苡丞2026.jpg",
    team: "富邦悍將"
  },
  "王浩原": {
    heightCm: 181, weightKg: 83,
    birthDate: "1995/09/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782034704611366/王浩原202634.jpg",
    team: "富邦悍將二軍"
  },
  "王偉軒": {
    heightCm: 182, weightKg: 75,
    birthDate: "1998/02/05",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P206377286889321948/37王偉軒2026.jpg",
    team: "富邦悍將二軍"
  },
  "王凱程": {
    heightCm: 192, weightKg: 105,
    birthDate: "1991/09/08",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781997164142571/15_王凱程.png",
    team: "中信兄弟二軍"
  },
  "王勝偉": {
    heightCm: 180, weightKg: 87,
    birthDate: "1984/04/01",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782119710866768/3王勝偉2026.jpg",
    team: "富邦悍將"
  },
  "王博玄": {
    heightCm: 184, weightKg: 86,
    birthDate: "2000/04/01",
    bats: "L", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494325095917865/6王博玄2025.jpg",
    team: "台鋼雄鷹"
  },
  "王順和": {
    heightCm: 175, weightKg: 70,
    birthDate: "2001/10/26",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088844419941267987/24王順和.jpg",
    team: "味全龍"
  },
  "王維中": {
    heightCm: 188, weightKg: 83,
    birthDate: "1992/04/25",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782025464643241/T54124王維中.jpg",
    team: "台鋼雄鷹二軍"
  },
  "王鏡銘": {
    heightCm: 176, weightKg: 93,
    birthDate: "1986/01/16",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782138225368340/41王鏡銘2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "王躍霖": {
    heightCm: 184, weightKg: 94,
    birthDate: "1991/02/05",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782027656705783/95王躍霖2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "古林睿煬": {
    heightCm: 182, weightKg: 80,
    birthDate: "2000/06/12",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Ruei-Yang_Gu_Lin_with_Hokkaido_Nippon-Ham.jpg",
    team: "北海道日本火腿鬥士"
  },
  "布坎南": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "布雷克": {
    heightCm: 206, weightKg: 120,
    birthDate: "1994/07/02",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088851516909723984/50布雷克.jpg",
    team: "統一7-ELEVEn獅"
  },
  "布藍登": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "申皓瑋": {
    heightCm: 183, weightKg: 95,
    birthDate: "1997/09/12",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781910421857619/29申皓瑋2026.jpg",
    team: "富邦悍將"
  },
  "石梓霖": {
    heightCm: 186, weightKg: 91,
    birthDate: "2005/01/08",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q068554412120098327/24石梓霖2026.jpg",
    team: "富邦悍將二軍"
  },
  "石萬金": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "伍立辰": {
    heightCm: 179, weightKg: 80,
    birthDate: "2002/03/06",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064569981891996880/伍立辰2025.jpg",
    team: "中信兄弟二軍"
  },
  "伍祐城": {
    heightCm: 180, weightKg: 90,
    birthDate: "2004/02/15",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062485217858503814/55伍祐城2025.jpg",
    team: "台鋼雄鷹"
  },
  "伍鐸": {
    heightCm: 185, weightKg: 91,
    birthDate: "1986/10/24",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781989991182030/52伍鐸2025.jpg",
    team: "味全龍"
  },
  "吉力吉撈．鞏冠": {
    heightCm: 180, weightKg: 104,
    birthDate: "1994/03/13",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782153170013481/4吉力吉撈.jpg",
    team: "味全龍二軍"
  },
  "吉田一将": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "成晉": {
    heightCm: 184, weightKg: 90,
    birthDate: "1998/11/13",
    bats: "R", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781888038719580/35成晉2025.jpg",
    team: "樂天桃猿"
  },
  "朱育賢": {
    heightCm: 188, weightKg: 108,
    birthDate: "1991/11/26",
    bats: "L", throws: "L",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782010562693207/11朱育賢.jpg",
    team: "味全龍"
  },
  "朱承洋": {
    heightCm: 175, weightKg: 70,
    birthDate: "1995/04/15",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781872057811482/22朱承洋2025.jpg",
    team: "樂天桃猿"
  },
  "朱迦恩": {
    heightCm: 175, weightKg: 70,
    birthDate: "2001/01/15",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088856149799849722/8朱迦恩2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "江少慶": {
    heightCm: 183, weightKg: 94,
    birthDate: "1993/11/10",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L090428114162413381/76江少慶.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "江坤宇": {
    heightCm: 175, weightKg: 78,
    birthDate: "2000/07/04",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088838281170132791/江坤宇2024.png",
    team: "中信兄弟二軍"
  },
  "江忠城": {
    heightCm: 180, weightKg: 95,
    birthDate: "1990/03/10",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782018036240253/江忠城2024.png",
    team: "中信兄弟"
  },
  "江承峰": {
    heightCm: 180, weightKg: 90,
    birthDate: "1988/10/14",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782152636134454/95江承峰.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "江承諺": {
    heightCm: 175, weightKg: 70,
    birthDate: "1995/06/03",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782070711951503/20江承諺2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "江國豪": {
    heightCm: 178, weightKg: 84,
    birthDate: "1997/12/29",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088856657657537117/12江國豪2026.jpg",
    team: "富邦悍將"
  },
  "池恩齊": {
    heightCm: 173, weightKg: 75,
    birthDate: "2003/08/03",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062571373676149447/97池恩齊2026.jpg",
    team: "富邦悍將"
  },
  "艾速特": {
    heightCm: 190, weightKg: 92,
    birthDate: "1993/03/27",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N235644011761778473/30艾速特2025.jpg",
    team: "台鋼雄鷹"
  },
  "艾菩樂": {
    heightCm: 196, weightKg: 104,
    birthDate: "1993/01/05",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075604767224001517/23艾菩樂.jpg",
    team: "樂天桃猿"
  },
  "艾璞樂": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "何品室融": {
    heightCm: 183, weightKg: 79,
    birthDate: "2005/09/08",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0P070530701785517620/66何品室融2025.jpg",
    team: "樂天桃猿二軍"
  },
  "何恆佑": {
    heightCm: 185, weightKg: 86,
    birthDate: "2001/10/12",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088851651816087425/7何恆佑2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "余德龍": {
    heightCm: 180, weightKg: 73,
    birthDate: "1988/06/12",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782143005578924/36余德龍2025.jpg",
    team: "樂天桃猿"
  },
  "余謙": {
    heightCm: 180, weightKg: 85,
    birthDate: "2001/04/09",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088838572893869773/49余謙2025.png",
    team: "中信兄弟二軍"
  },
  "克迪": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "吳世豪": {
    heightCm: 180, weightKg: 83,
    birthDate: "1999/01/13",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781911500604664/吳世豪202650.jpg",
    team: "富邦悍將二軍"
  },
  "吳君奕": {
    heightCm: 181, weightKg: 75,
    birthDate: "2001/05/24",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M270551712613090685/78吳君奕.jpg",
    team: "味全龍二軍"
  },
  "吳念庭": {
    heightCm: 175, weightKg: 80,
    birthDate: "1993/06/07",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0O194044076909723984/39吳念庭2025.jpg",
    team: "台鋼雄鷹"
  },
  "吳承諭": {
    heightCm: 181, weightKg: 85,
    birthDate: "1997/01/09",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088851757722450956/57吳承諭.jpg",
    team: "統一7-ELEVEn獅"
  },
  "吳明鴻": {
    heightCm: 178, weightKg: 85,
    birthDate: "1994/11/02",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782038253379807/031吳明鴻2025.jpg",
    team: "台鋼雄鷹"
  },
  "吳東融": {
    heightCm: 173, weightKg: 72,
    birthDate: "1991/09/29",
    bats: "R", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782023007047251/61吳東融.jpg",
    team: "味全龍二軍"
  },
  "吳俊杰": {
    heightCm: 190, weightKg: 83,
    birthDate: "1996/11/07",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782039267693295/20吳俊杰.jpg",
    team: "味全龍二軍"
  },
  "吳俊偉": {
    heightCm: 175, weightKg: 78,
    birthDate: "1998/12/31",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088838708709222204/吳俊偉2024.png",
    team: "中信兄弟"
  },
  "呂彥青": {
    heightCm: 177, weightKg: 75,
    birthDate: "1996/03/10",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L245758674856403908/呂彥青2024.png",
    team: "中信兄弟"
  },
  "呂偉晟": {
    heightCm: 192, weightKg: 80,
    birthDate: "1999/07/10",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088845795328942684/39呂偉晟.jpg",
    team: "味全龍"
  },
  "呂詠臻": {
    heightCm: 180, weightKg: 85,
    birthDate: "1998/12/24",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P070528313067299981/48呂詠臻2025.jpg",
    team: "樂天桃猿二軍"
  },
  "坎南": {
    heightCm: 190, weightKg: 90,
    birthDate: "1989/05/11",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q089567610847438944/坎南2026.jpg",
    team: "台鋼雄鷹"
  },
  "宋文華": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "宋晟睿": {
    heightCm: 182, weightKg: 82,
    birthDate: "2002/08/14",
    bats: "R", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088838939522959286/88_宋晟睿.png",
    team: "中信兄弟"
  },
  "宋嘉翔": {
    heightCm: 183, weightKg: 85,
    birthDate: "2004/07/22",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062540191915652836/2宋嘉翔2025.jpg",
    team: "樂天桃猿"
  },
  "巫柏葳": {
    heightCm: 183, weightKg: 80,
    birthDate: "2002/10/02",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O009387257655068889/22巫柏葳2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "李丞齡": {
    heightCm: 176, weightKg: 84,
    birthDate: "2000/08/08",
    bats: "R", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088852107098961110/6李丞齡2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "李吳永勤": {
    heightCm: 177, weightKg: 97,
    birthDate: "1998/03/29",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781996620263554/38李吳永勤2026.jpg",
    team: "富邦悍將"
  },
  "李其峰": {
    heightCm: 180, weightKg: 73,
    birthDate: "1997/10/14",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088852295439312727/30李其峰2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "李宗賢": {
    heightCm: 178, weightKg: 78,
    birthDate: "1994/06/29",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782024286895206/22李宗賢2026.jpg",
    team: "富邦悍將"
  },
  "李東洺": {
    heightCm: 184, weightKg: 74,
    birthDate: "1999/12/29",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L277412124901686188/66李東洺2026.jpg",
    team: "富邦悍將"
  },
  "李欣穎": {
    heightCm: 181, weightKg: 70,
    birthDate: "2000/08/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062484440990236480/18李欣穎2025.jpg",
    team: "台鋼雄鷹"
  },
  "李建勳": {
    heightCm: 192, weightKg: 106,
    birthDate: "1996/09/08",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q068578763679627165/李建勳202617new.jpg",
    team: "富邦悍將"
  },
  "李軍": {
    heightCm: 174, weightKg: 81,
    birthDate: "2006/03/28",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064615516257005449/62李軍.jpg",
    team: "統一7-ELEVEn獅"
  },
  "李家明": {
    heightCm: 184, weightKg: 98,
    birthDate: "2000/12/15",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P070532819022921682/92李家明2025.jpg",
    team: "樂天桃猿二軍"
  },
  "李展毅": {
    heightCm: 188, weightKg: 115,
    birthDate: "2003/01/30",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281590678006814631/36李展毅.jpg",
    team: "味全龍"
  },
  "李振昌": {
    heightCm: 180, weightKg: 87,
    birthDate: "1986/10/21",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782127337107701/李振昌2024.png",
    team: "中信兄弟"
  },
  "李凱威": {
    heightCm: 174, weightKg: 76,
    birthDate: "1997/09/11",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088846283692901115/21李凱威.jpg",
    team: "味全龍"
  },
  "李勛傑": {
    heightCm: 187, weightKg: 96,
    birthDate: "2005/01/20",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N265548813159495983/95李勛傑2025.jpg",
    team: "樂天桃猿"
  },
  "李博登": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "李超": {
    heightCm: 191, weightKg: 95,
    birthDate: "1999/10/23",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062555412386889507/0李超.jpg",
    team: "味全龍"
  },
  "杜家明": {
    heightCm: 183, weightKg: 98,
    birthDate: "1996/02/03",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781982362192527/71杜家明2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "辛元旭": {
    heightCm: 178, weightKg: 92,
    birthDate: "1999/06/04",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088856878470254289/67辛元旭2026.jpg",
    team: "富邦悍將二軍"
  },
  "辛俊昇": {
    heightCm: 190, weightKg: 100,
    birthDate: "2004/06/22",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N329410587377690026/69辛俊昇.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "那瑪夏": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "邦力多": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "周佳樂": {
    heightCm: 172, weightKg: 75,
    birthDate: "1999/12/02",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0M258363014898203598/77周佳樂2026.jpg",
    team: "富邦悍將"
  },
  "周彥農": {
    heightCm: 190, weightKg: 92,
    birthDate: "2005/02/06",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O058615924424885980/45周彥農2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "岳少華": {
    heightCm: 180, weightKg: 88,
    birthDate: "1999/06/01",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L277411850013063971/48岳少華2026.jpg",
    team: "富邦悍將二軍"
  },
  "岳東華": {
    heightCm: 179, weightKg: 83,
    birthDate: "1995/10/19",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782036996773808/岳東華2024.png",
    team: "中信兄弟"
  },
  "岳政華": {
    heightCm: 182, weightKg: 85,
    birthDate: "2001/01/29",
    bats: "L", throws: "L",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088839477974766861/岳政華2024.png",
    team: "中信兄弟"
  },
  "杰戈": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "林子昱": {
    heightCm: 185, weightKg: 80,
    birthDate: "1993/09/19",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782027366118278/71林子昱.jpg",
    team: "味全龍"
  },
  "林子偉": {
    heightCm: 175, weightKg: 85,
    birthDate: "1994/02/15",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N228626166699407798/15林子偉2025.jpg",
    team: "樂天桃猿"
  },
  "林子崴": {
    heightCm: 179, weightKg: 78,
    birthDate: "1995/09/17",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782073347495558/17林子崴2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "林子豪": {
    heightCm: 185, weightKg: 73,
    birthDate: "2002/03/29",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088853140534315264/2林子豪2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "林立": {
    heightCm: 182, weightKg: 86,
    birthDate: "1996/01/01",
    bats: "R", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782035718925753/39林立2025.jpg",
    team: "樂天桃猿二軍"
  },
  "林安可": {
    heightCm: 184, weightKg: 90,
    birthDate: "1997/05/19",
    bats: "L", throws: "L",
    position: "OF",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Lin-An-Ko_Lions_20260416.jpg",
    team: "埼玉西武獅"
  },
  "林吳晉瑋": {
    heightCm: 179, weightKg: 90,
    birthDate: "2002/02/04",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088839699697483843/0林吳晉瑋2025.png",
    team: "中信兄弟二軍"
  },
  "林孝程": {
    heightCm: 172, weightKg: 80,
    birthDate: "1999/11/30",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088846388939219477/7林孝程.jpg",
    team: "味全龍"
  },
  "林辰勳": {
    heightCm: 180, weightKg: 70,
    birthDate: "2001/12/10",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088846484770759160/9林辰勳.jpg",
    team: "味全龍"
  },
  "林佳緯": {
    heightCm: 182, weightKg: 74,
    birthDate: "2005/01/11",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0N301600677138588817/20林佳緯2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "林岱安": {
    heightCm: 175, weightKg: 87,
    birthDate: "1992/06/23",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782020736138765/31林岱安2026.jpg",
    team: "富邦悍將"
  },
  "林岳谷": {
    heightCm: 178, weightKg: 71,
    birthDate: "2001/10/20",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062570737571767718/62林岳谷2026.jpg",
    team: "富邦悍將二軍"
  },
  "林承飛": {
    heightCm: 180, weightKg: 86,
    birthDate: "1997/04/08",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781887959961536/6林承飛2025.jpg",
    team: "樂天桃猿二軍"
  },
  "林泓育": {
    heightCm: 181, weightKg: 103,
    birthDate: "1986/03/21",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782141949560349/11林泓育2025.jpg",
    team: "樂天桃猿"
  },
  "林泓弦": {
    heightCm: 176, weightKg: 70,
    birthDate: "2005/08/11",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0O058616131785517620/67林泓弦.jpg",
    team: "統一7-ELEVEn獅"
  },
  "林政華": {
    heightCm: 173, weightKg: 73,
    birthDate: "2001/09/22",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088833158596417147/65林政華2025.jpg",
    team: "樂天桃猿"
  },
  "林哲瑄": {
    heightCm: 180, weightKg: 90,
    birthDate: "1988/09/21",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782128694703800/1林哲瑄2026.jpg",
    team: "富邦悍將二軍"
  },
  "林家勝": {
    heightCm: 178, weightKg: 107,
    birthDate: "2003/08/26",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O058605912991900264/73林家勝2026.jpg",
    team: "富邦悍將二軍"
  },
  "林家鋐": {
    heightCm: 175, weightKg: 75,
    birthDate: "2002/03/10",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494442724907379/16林家鋐2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "林栚呈": {
    heightCm: 195, weightKg: 87,
    birthDate: "2000/06/07",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062561139844338683/94林栚呈2026.jpg",
    team: "富邦悍將"
  },
  "林益全": {
    heightCm: 180, weightKg: 85,
    birthDate: "1985/11/11",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c4/%E6%9E%97%E7%9B%8A%E5%85%A8.jpg",
    team: "上海正大龍"
  },
  "林祖傑": {
    heightCm: 176, weightKg: 80,
    birthDate: "1991/05/13",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782021106572224/39林祖傑2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "林培緯": {
    heightCm: 188, weightKg: 93,
    birthDate: "2004/01/26",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N066406714406937119/25林培緯2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "林凱威": {
    heightCm: 178, weightKg: 79,
    birthDate: "1996/03/19",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M250568257972241434/99林凱威2026.jpg",
    team: "味全龍"
  },
  "林智平": {
    heightCm: 178, weightKg: 77,
    birthDate: "1985/03/23",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782139873551855/79林智平2025.jpg",
    team: "樂天桃猿"
  },
  "林智勝": {
    heightCm: 183, weightKg: 108,
    birthDate: "1982/01/01",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/85/%E6%9E%97%E6%99%BA%E5%8B%9D202112.jpg",
    team: "味全龍（教練）"
  },
  "林詔恩": {
    heightCm: 177, weightKg: 69,
    birthDate: "2004/02/13",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N066402463339970593/74林詔恩.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "林逸達": {
    heightCm: 185, weightKg: 99,
    birthDate: "2000/12/26",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088846831400830673/48林逸達.jpg",
    team: "味全龍二軍"
  },
  "林暉盛": {
    heightCm: 188, weightKg: 93,
    birthDate: "1998/10/09",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N247636005470428080/12_林暉盛.png",
    team: "中信兄弟二軍"
  },
  "林詩翔": {
    heightCm: 181, weightKg: 83,
    birthDate: "2001/07/31",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N241575734429211458/14林詩翔2025.jpg",
    team: "台鋼雄鷹"
  },
  "林靖凱": {
    heightCm: 170, weightKg: 70,
    birthDate: "2000/07/22",
    bats: "R", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088853465542247023/64林靖凱.jpg",
    team: "統一7-ELEVEn獅"
  },
  "林鋅杰": {
    heightCm: 187, weightKg: 115,
    birthDate: "1999/03/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062556009117956717/77林鋅杰2026.jpg",
    team: "味全龍"
  },
  "林澤彬": {
    heightCm: 177, weightKg: 78,
    birthDate: "1998/12/23",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088833481032850191/2林澤彬2026.jpg",
    team: "富邦悍將"
  },
  "波賽樂": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "肯特": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "邱浩鈞": {
    heightCm: 180, weightKg: 70,
    birthDate: "1990/12/29",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782014312948154/37邱浩鈞2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "邱智呈": {
    heightCm: 168, weightKg: 80,
    birthDate: "2000/11/26",
    bats: "L", throws: "L",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088853811359500564/14邱智呈2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "邱駿威": {
    heightCm: 176, weightKg: 86,
    birthDate: "2002/11/10",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L280404012709998851/46邱駿威2025.jpg",
    team: "樂天桃猿"
  },
  "阿部雄大": {
    heightCm: 183, weightKg: 91,
    birthDate: "2000/07/28",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q068567565886586677/90阿部雄大2026.jpg",
    team: "富邦悍將"
  },
  "哈瑪星": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "姚杰宏": {
    heightCm: 184, weightKg: 90,
    birthDate: "1998/04/15",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088853977265964005/79姚杰宏.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "姚冠瑋": {
    heightCm: 170, weightKg: 81,
    birthDate: "1996/01/11",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088857639740188930/65姚冠瑋.jpg",
    team: "味全龍二軍"
  },
  "威戈神": {
    heightCm: 188, weightKg: 104,
    birthDate: "1989/05/24",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q068560046542134683/49威戈神2026.jpg",
    team: "富邦悍將二軍"
  },
  "威能帝": {
    heightCm: 183, weightKg: 79,
    birthDate: "1994/05/25",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N265548593305128625/49威能帝2025.jpg",
    team: "樂天桃猿二軍"
  },
  "後勁": {
    heightCm: 190, weightKg: 95,
    birthDate: "1989/05/12",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088836205009344702/40後勁2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "施子謙": {
    heightCm: 184, weightKg: 96,
    birthDate: "1994/12/19",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782030076006889/19施子謙2025.jpg",
    team: "台鋼雄鷹"
  },
  "柯育民": {
    heightCm: 175, weightKg: 77,
    birthDate: "1997/11/14",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782159265124977/柯育民2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "柯威士": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "洪瑋漢": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "紀慶然": {
    heightCm: 177, weightKg: 80,
    birthDate: "2002/04/24",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494578175240837/24紀慶然2025.jpg",
    team: "台鋼雄鷹"
  },
  "胡金龍": {
    heightCm: 180, weightKg: 86,
    birthDate: "1984/02/02",
    bats: "R", throws: "R",
    position: "OF",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Chin-lung_Hu_2013.jpg",
    team: "統一7-ELEVEn獅（教練）"
  },
  "胡智爲": {
    heightCm: 182, weightKg: 90,
    birthDate: "1993/11/04",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L090427017999453841/胡智爲2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "范柏絜": {
    heightCm: 183, weightKg: 90,
    birthDate: "2000/08/13",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088834615756052190/15范柏絜2026.jpg",
    team: "富邦悍將二軍"
  },
  "范國宸": {
    heightCm: 183, weightKg: 100,
    birthDate: "1994/11/25",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782035982469310/46范國宸2026.jpg",
    team: "富邦悍將"
  },
  "韋宏亮": {
    heightCm: 180, weightKg: 75,
    birthDate: "2005/10/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q043526354159679275/韋宏亮2026.jpg",
    team: "台鋼雄鷹二軍"
  },
  "韋禮加": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "飛力獅": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "徐若熙": {
    heightCm: 180, weightKg: 76,
    birthDate: "2000/11/01",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: "福岡軟銀鷹"
  },
  "徐基麟": {
    heightCm: 190, weightKg: 101,
    birthDate: "1999/08/09",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M263412686455431130/徐基麟2024.png",
    team: "中信兄弟二軍"
  },
  "拿莫．伊漾": {
    heightCm: 187, weightKg: 85,
    birthDate: "1998/09/21",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088845395240194639/拿莫伊漾.jpg",
    team: "味全龍"
  },
  "班恩": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "馬傑森": {
    heightCm: 180, weightKg: 80,
    birthDate: "2002/05/15",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088835065934800145/94馬傑森2025.jpg",
    team: "樂天桃猿"
  },
  "高宇杰": {
    heightCm: 184, weightKg: 94,
    birthDate: "1997/07/17",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782030445441249/高宇杰2024.png",
    team: "中信兄弟"
  },
  "高偉強": {
    heightCm: 178, weightKg: 86,
    birthDate: "1999/09/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q071650077746034586/63高偉強.jpg",
    team: "統一7-ELEVEn獅"
  },
  "高國麟": {
    heightCm: 183, weightKg: 102,
    birthDate: "1993/01/02",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782016679544153/98高國麟2026.jpg",
    team: "富邦悍將二軍"
  },
  "高捷": {
    heightCm: 178, weightKg: 89,
    birthDate: "2002/08/22",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N266502862891916799/高捷20264.jpg",
    team: "富邦悍將二軍"
  },
  "高聖恩": {
    heightCm: 181, weightKg: 80,
    birthDate: "2000/11/19",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062497879195886812/50高聖恩2025.jpg",
    team: "台鋼雄鷹"
  },
  "張仁瑋": {
    heightCm: 171, weightKg: 77,
    birthDate: "2003/05/01",
    bats: "R", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281350087876066733/28張仁瑋2025.png",
    team: "中信兄弟"
  },
  "張志豪": {
    heightCm: 181, weightKg: 92,
    birthDate: "1987/05/15",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782116275412714/7_張志豪.png",
    team: "中信兄弟"
  },
  "張育成": {
    heightCm: 185, weightKg: 95,
    birthDate: "1995/08/18",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0O194042770407743516/99張育成2026.jpg",
    team: "富邦悍將"
  },
  "張奕": {
    heightCm: 182, weightKg: 86,
    birthDate: "1994/02/26",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N346634336325304509/19張奕2026.jpg",
    team: "富邦悍將"
  },
  "張宥謙": {
    heightCm: 180, weightKg: 68,
    birthDate: "2006/07/01",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064613420474509858/16張宥謙2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "張政禹": {
    heightCm: 178, weightKg: 70,
    birthDate: "2000/06/08",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088847274945283727/25張政禹.jpg",
    team: "味全龍"
  },
  "張洺瑀": {
    heightCm: 178, weightKg: 90,
    birthDate: "1998/09/01",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781915159462106/33張洺瑀2026.jpg",
    team: "富邦悍將二軍"
  },
  "張祐嘉": {
    heightCm: 185, weightKg: 86,
    birthDate: "2003/05/24",
    bats: "L", throws: "L",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281592278495807710/81張祐嘉2026.jpg",
    team: "味全龍"
  },
  "張祐銘": {
    heightCm: 180, weightKg: 86,
    birthDate: "1997/03/15",
    bats: "L", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088847399842647268/34張祐銘.jpg",
    team: "味全龍二軍"
  },
  "張景淯": {
    heightCm: 191, weightKg: 85,
    birthDate: "2000/02/11",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N235641877733575862/51張景淯2026.jpg",
    team: "味全龍二軍"
  },
  "張翔": {
    heightCm: 180, weightKg: 88,
    birthDate: "2003/01/22",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281368646520849370/4張翔2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "張進德": {
    heightCm: 179, weightKg: 97,
    birthDate: "1993/05/17",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782002410473137/47張進德2026.jpg",
    team: "富邦悍將二軍"
  },
  "張鈞守": {
    heightCm: 186, weightKg: 84,
    birthDate: "2002/10/15",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281591191218130417/74張鈞守.jpg",
    team: "味全龍二軍"
  },
  "張閔勛": {
    heightCm: 177, weightKg: 80,
    birthDate: "1994/08/08",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782035173056736/28張閔勛2025.jpg",
    team: "樂天桃猿二軍"
  },
  "張瑞麟": {
    heightCm: 181, weightKg: 87,
    birthDate: "1992/06/28",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782008405685613/72張瑞麟2026.jpg",
    team: "富邦悍將二軍"
  },
  "張誠恩": {
    heightCm: 178, weightKg: 75,
    birthDate: "2004/09/17",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N241576031284332431/93張誠恩2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "張肇元": {
    heightCm: 182, weightKg: 110,
    birthDate: "1997/10/30",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088854832336761093/29張肇元2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "曹祐齊": {
    heightCm: 186, weightKg: 87,
    birthDate: "2003/03/30",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281591420277271441/67曹祐齊2026.jpg",
    team: "味全龍二軍"
  },
  "梁家榮": {
    heightCm: 180, weightKg: 90,
    birthDate: "1995/03/25",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0P070523294404183608/5梁家榮2025.jpg",
    team: "樂天桃猿二軍"
  },
  "梅賽斯": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "梅賽鍶": {
    heightCm: 190, weightKg: 108,
    birthDate: "1994/03/08",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075586206483430973/梅賽鍶2026.jpg",
    team: "味全龍"
  },
  "猛登": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "笠原祥太郎": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "莊昕諺": {
    heightCm: 181, weightKg: 91,
    birthDate: "2000/10/19",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088835515806899778/77莊昕諺2025.jpg",
    team: "樂天桃猿"
  },
  "許育銘": {
    heightCm: 180, weightKg: 82,
    birthDate: "1998/09/25",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062485779951425770/74許育銘2025.jpg",
    team: "台鋼雄鷹"
  },
  "許哲晏": {
    heightCm: 176, weightKg: 78,
    birthDate: "1998/01/16",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088855053059488076/10許哲晏2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "許峻暘": {
    heightCm: 181, weightKg: 73,
    birthDate: "1998/03/23",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088835633108869775/84許峻暘2025.jpg",
    team: "台鋼雄鷹"
  },
  "許庭綸": {
    heightCm: 182, weightKg: 90,
    birthDate: "2005/10/30",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064567073965326399/13許庭綸2025.jpg",
    team: "中信兄弟"
  },
  "許基宏": {
    heightCm: 189, weightKg: 112,
    birthDate: "1992/07/22",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782011941038667/74_許基宏.png",
    team: "中信兄弟二軍"
  },
  "郭天信": {
    heightCm: 173, weightKg: 70,
    birthDate: "2000/04/15",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088847591564374230/2郭天信.jpg",
    team: "味全龍"
  },
  "郭永維": {
    heightCm: 175, weightKg: 75,
    birthDate: "1988/04/13",
    bats: "R", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782110368158273/7郭永維2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "郭阜林": {
    heightCm: 181, weightKg: 90,
    birthDate: "1991/01/07",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782015299109783/59郭阜林2025.jpg",
    team: "台鋼雄鷹"
  },
  "郭俊麟": {
    heightCm: 175, weightKg: 75,
    birthDate: "1992/02/02",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782014477482711/75郭俊麟.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "郭俞延": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "郭郁政": {
    heightCm: 187, weightKg: 94,
    birthDate: "1997/12/01",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088847736471637771/17郭郁政.jpg",
    team: "味全龍二軍"
  },
  "郭嚴文": {
    heightCm: 178, weightKg: 82,
    birthDate: "1988/10/25",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/03/20140915%E9%83%AD%E5%9A%B4%E6%96%87.jpg",
    team: "中信兄弟"
  },
  "陳子豪": {
    heightCm: 180, weightKg: 103,
    birthDate: "1995/07/29",
    bats: "L", throws: "L",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781980370627500/1陳子豪.jpg",
    team: "味全龍"
  },
  "陳文杰": {
    heightCm: 184, weightKg: 76,
    birthDate: "1997/10/11",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781991358788030/3陳文杰2025.jpg",
    team: "台鋼雄鷹"
  },
  "陳世嘉": {
    heightCm: 178, weightKg: 75,
    birthDate: "2003/06/01",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0N241576379035045516/78陳世嘉2025.jpg",
    team: "台鋼雄鷹"
  },
  "陳仕朋": {
    heightCm: 179, weightKg: 88,
    birthDate: "1997/09/20",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781915793341123/81陳仕朋2026.jpg",
    team: "富邦悍將二軍"
  },
  "陳正毅": {
    heightCm: 180, weightKg: 85,
    birthDate: "2000/06/14",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062484127280358879/11陳正毅2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "陳宇宏": {
    heightCm: 180, weightKg: 73,
    birthDate: "2001/05/12",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062484267099761454/17陳宇宏2025.jpg",
    team: "台鋼雄鷹"
  },
  "陳克羿": {
    heightCm: 185, weightKg: 74,
    birthDate: "1999/10/27",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088835829014133216/19陳克羿2025.jpg",
    team: "樂天桃猿"
  },
  "陳俊秀": {
    heightCm: 183, weightKg: 105,
    birthDate: "1988/11/01",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782155907043941/29_陳俊秀2.png",
    team: "中信兄弟"
  },
  "陳冠宇": {
    heightCm: 178, weightKg: 80,
    birthDate: "1990/10/29",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L235603319457569957/17陳冠宇2025.jpg",
    team: "樂天桃猿"
  },
  "陳冠偉": {
    heightCm: 183, weightKg: 92,
    birthDate: "1996/10/28",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088847998294364743/59陳冠偉.jpg",
    team: "味全龍"
  },
  "陳冠豪": {
    heightCm: 184, weightKg: 80,
    birthDate: "2003/06/14",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062484889130594787/28陳冠豪2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "陳冠勳": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "陳冠穎": {
    heightCm: 183, weightKg: 90,
    birthDate: "2003/08/20",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064585601349427262/陳冠穎2025.jpg",
    team: "中信兄弟二軍"
  },
  "陳品宏": {
    heightCm: 183, weightKg: 85,
    birthDate: "2005/01/13",
    bats: "R", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O282694019737772611/10陳品宏2026.jpg",
    team: "富邦悍將"
  },
  "陳品捷": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "陳柏均": {
    heightCm: 175, weightKg: 83,
    birthDate: "2001/05/07",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M263424731932428434/56陳柏均2025.jpg",
    team: "中信兄弟二軍"
  },
  "陳柏清": {
    heightCm: 182, weightKg: 98,
    birthDate: "1998/10/25",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062485644068375626/66陳柏清2025.jpg",
    team: "台鋼雄鷹"
  },
  "陳柏豪": {
    heightCm: 180, weightKg: 88,
    birthDate: "1999/01/28",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781992071505012/9陳柏豪2025.jpg",
    team: "樂天桃猿二軍"
  },
  "陳禹勳": {
    heightCm: 182, weightKg: 90,
    birthDate: "1989/05/20",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781874779548454/5陳禹勳.jpg",
    team: "味全龍二軍"
  },
  "陳致嘉": {
    heightCm: 177, weightKg: 79,
    birthDate: "2002/05/14",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062491203314533352/33陳致嘉2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "陳重羽": {
    heightCm: 183, weightKg: 83,
    birthDate: "1995/09/14",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782032347015376/65陳重羽.jpg",
    team: "統一7-ELEVEn獅"
  },
  "陳重廷": {
    heightCm: 181, weightKg: 81,
    birthDate: "1995/09/14",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782036352804880/66陳重廷.jpg",
    team: "統一7-ELEVEn獅"
  },
  "陳飛霖": {
    heightCm: 175, weightKg: 70,
    birthDate: "2000/12/18",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0N241576685884273784/79陳飛霖2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "陳真": {
    heightCm: 185, weightKg: 89,
    birthDate: "1998/10/22",
    bats: "R", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088858904778280842/7陳真2026.jpg",
    team: "富邦悍將"
  },
  "陳晨威": {
    heightCm: 180, weightKg: 72,
    birthDate: "1997/12/12",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088835934921596757/98陳晨威2025.jpg",
    team: "樂天桃猿"
  },
  "陳統恩": {
    heightCm: 178, weightKg: 90,
    birthDate: "2001/09/19",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L281353281834818739/48_陳統恩.png",
    team: "中信兄弟"
  },
  "陳傑憲": {
    heightCm: 173, weightKg: 73,
    birthDate: "1994/01/07",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782027721249240/24陳傑憲2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "陳琥": {
    heightCm: 180, weightKg: 108,
    birthDate: "1998/04/29",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781996086394526/陳琥2024.png",
    team: "中信兄弟"
  },
  "陳愷佑": {
    heightCm: 176, weightKg: 80,
    birthDate: "2004/07/02",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0N266502981054592747/56陳愷佑2026.jpg",
    team: "富邦悍將二軍"
  },
  "陳暐皓": {
    heightCm: 177, weightKg: 79,
    birthDate: "1999/09/24",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M087553993380946291/56陳暐皓.jpg",
    team: "味全龍二軍"
  },
  "陳聖平": {
    heightCm: 176, weightKg: 84,
    birthDate: "2000/10/27",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0O194672407210827276/73陳聖平.jpg",
    team: "統一7-ELEVEn獅"
  },
  "陳鴻文": {
    heightCm: 180, weightKg: 98,
    birthDate: "1986/02/03",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/10/Hung-Wen_Chen_on_April_21%2C_2008.jpg",
    team: "樂天桃猿"
  },
  "陳鏞基": {
    heightCm: 179, weightKg: 89,
    birthDate: "1983/07/13",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782075805688062/13陳鏞基2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "陳韻文": {
    heightCm: 183, weightKg: 97,
    birthDate: "1995/11/28",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782077806162099/12陳韻文2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "陳鐿中": {
    heightCm: 182, weightKg: 95,
    birthDate: "2002/09/09",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O282693462411160042/75陳鐿中2026.jpg",
    team: "富邦悍將二軍"
  },
  "髙塩將樹": {
    heightCm: 180, weightKg: 85,
    birthDate: "1989/03/24",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064602008507008643/28高塩將樹2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "鳥松": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "麥斯威尼": {
    heightCm: 193, weightKg: 95,
    birthDate: "1997/09/21",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075604570341729492/20麥斯威尼.jpg",
    team: "樂天桃猿二軍"
  },
  "凱樂": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "勝騎士": {
    heightCm: 185, weightKg: 95,
    birthDate: "1994/10/31",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P114644839361412029/勝騎士.jpg",
    team: "中信兄弟二軍"
  },
  "喬登": {
    heightCm: 196, weightKg: 97,
    birthDate: "1998/09/17",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q071652851460336585/87喬登.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "富藍戈": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "曾子祐": {
    heightCm: 178, weightKg: 81,
    birthDate: "2003/09/16",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494061270649160/1曾子祐2025.jpg",
    team: "台鋼雄鷹"
  },
  "曾仁和": {
    heightCm: 186, weightKg: 91,
    birthDate: "1994/10/03",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L280404317508900250/55曾仁和.jpg",
    team: "味全龍"
  },
  "曾奕翔": {
    heightCm: 183, weightKg: 92,
    birthDate: "2004/10/07",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N241576513330928824/54曾奕翔2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "曾昱磬": {
    heightCm: 180, weightKg: 84,
    birthDate: "2002/12/17",
    bats: "L", throws: "R",
    position: "2B",
    imageUrl: "https://cpbl.com.tw/files/atts/0P064414959519999719/44曾昱磬2025.jpg",
    team: "台鋼雄鷹"
  },
  "曾家輝": {
    heightCm: 184, weightKg: 70,
    birthDate: "2003/04/19",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N265549508421824088/44曾家輝2025.jpg",
    team: "樂天桃猿"
  },
  "曾峻岳": {
    heightCm: 174, weightKg: 68,
    birthDate: "2001/11/07",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088859115063802563/60曾峻岳2026.jpg",
    team: "富邦悍將"
  },
  "曾聖安": {
    heightCm: 178, weightKg: 78,
    birthDate: "2006/03/28",
    bats: "L", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0O253542622985095553/50曾聖安.jpg",
    team: "味全龍二軍"
  },
  "曾頌恩": {
    heightCm: 178, weightKg: 105,
    birthDate: "2000/01/08",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088841792586119300/1曾頌恩2025.jpg",
    team: "中信兄弟二軍"
  },
  "游竣宥": {
    heightCm: 175, weightKg: 81,
    birthDate: "2003/07/02",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O326633970904242355/游竣宥2025.jpg",
    team: "中信兄弟"
  },
  "游霆崴": {
    heightCm: 178, weightKg: 81,
    birthDate: "1997/10/11",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781916872199278/80游霆崴2026.jpg",
    team: "富邦悍將二軍"
  },
  "舒治浩": {
    heightCm: 177, weightKg: 75,
    birthDate: "2004/07/15",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062544632589334521/1舒治浩2025.jpg",
    team: "樂天桃猿"
  },
  "象騎士": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "馮健庭": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "黃子豪": {
    heightCm: 186, weightKg: 82,
    birthDate: "2004/12/25",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P072577613903855323/85黃子豪2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "黃子鵬": {
    heightCm: 183, weightKg: 80,
    birthDate: "1994/03/19",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782033816450736/T54123黃子鵬.jpg",
    team: "台鋼雄鷹二軍"
  },
  "黃劼希": {
    heightCm: 177, weightKg: 75,
    birthDate: "2004/06/21",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494853602168918/42黃劼希2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "黃秉揚": {
    heightCm: 177, weightKg: 85,
    birthDate: "2003/05/17",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494701345563819/25黃秉揚2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "黃保羅": {
    heightCm: 188, weightKg: 94,
    birthDate: "2004/04/16",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062558224514382473/18黃保羅2026.jpg",
    team: "富邦悍將二軍"
  },
  "黃柏豪": {
    heightCm: 178, weightKg: 95,
    birthDate: "1996/09/14",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088848967368898201/16黃柏豪.jpg",
    team: "味全龍二軍"
  },
  "黃韋盛": {
    heightCm: 183, weightKg: 96,
    birthDate: "1999/02/19",
    bats: "R", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L090371185823444267/黃韋盛2024.png",
    team: "中信兄弟"
  },
  "黃恩賜": {
    heightCm: 185, weightKg: 110,
    birthDate: "1996/05/17",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782028900097295/64黃恩賜2025.jpg",
    team: "中信兄弟二軍"
  },
  "黃偉晟": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "黃紹睿": {
    heightCm: 175, weightKg: 80,
    birthDate: "2002/03/31",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062485347606397008/56黃紹睿2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "黃博多": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "黃竣彥": {
    heightCm: 190, weightKg: 93,
    birthDate: "1993/10/06",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782033981984394/40黃竣彥2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "黃暐傑": {
    heightCm: 185, weightKg: 77,
    birthDate: "1993/09/26",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q068506369711077474/14黃暐傑.jpg",
    team: "味全龍二軍"
  },
  "黃群": {
    heightCm: 176, weightKg: 81,
    birthDate: "2003/03/18",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N262685500774418760/46黃群2025.jpg",
    team: "台鋼雄鷹"
  },
  "奧德銳": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "楊志龍": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "楊彬": {
    heightCm: 180, weightKg: 90,
    birthDate: "1996/01/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088859316885529535/57楊彬2025.jpg",
    team: "樂天桃猿二軍"
  },
  "楊祥禾": {
    heightCm: 180, weightKg: 84,
    birthDate: "2003/01/12",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0O058614092429838629/3楊祥禾2025.png",
    team: "中信兄弟二軍"
  },
  "楊達翔": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "獅帝芬": {
    heightCm: 188, weightKg: 100,
    birthDate: "1994/05/11",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q071654522887973508/獅帝芬2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "葉子霆": {
    heightCm: 170, weightKg: 72,
    birthDate: "1998/01/07",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088858339256448022/6葉子霆2026.jpg",
    team: "富邦悍將二軍"
  },
  "葉保弟": {
    heightCm: 174, weightKg: 70,
    birthDate: "1999/02/23",
    bats: "L", throws: "L",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062498172212021166/73葉保弟2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "董子恩": {
    heightCm: 182, weightKg: 86,
    birthDate: "2003/02/28",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L277412286356333579/78董子恩2026.jpg",
    team: "富邦悍將二軍"
  },
  "詹子賢": {
    heightCm: 183, weightKg: 95,
    birthDate: "1994/02/24",
    bats: "R", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782037175521853/詹子賢2024.png",
    team: "中信兄弟二軍"
  },
  "豊暐": {
    heightCm: 176, weightKg: 83,
    birthDate: "1999/10/02",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062570122530839795/43豊暐2026.jpg",
    team: "富邦悍將二軍"
  },
  "道鉑戈": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "鈴木駿輔": {
    heightCm: 185, weightKg: 86,
    birthDate: "1998/06/12",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O058616534833715309/69鈴木駿輔2026.jpg",
    team: "富邦悍將"
  },
  "雷公": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "廖乙忠": {
    heightCm: 188, weightKg: 110,
    birthDate: "1995/11/02",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782030801562222/67廖乙忠2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "廖任磊": {
    heightCm: 201, weightKg: 141,
    birthDate: "1993/08/30",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782035539177708/13廖任磊2026.jpg",
    team: "富邦悍將"
  },
  "廖健富": {
    heightCm: 178, weightKg: 88,
    birthDate: "1998/09/28",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781882766224067/58廖健富2025.jpg",
    team: "樂天桃猿二軍"
  },
  "蒙德茲": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "裴瑞茲": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "趙璟榮": {
    heightCm: 181, weightKg: 82,
    birthDate: "1998/06/12",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088849370360363338/42趙璟榮.jpg",
    team: "味全龍"
  },
  "劉子杰": {
    heightCm: 178, weightKg: 82,
    birthDate: "2002/08/05",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0O074603816180852981/56劉子杰2025.jpg",
    team: "樂天桃猿"
  },
  "劉予承": {
    heightCm: 175, weightKg: 80,
    birthDate: "2002/02/03",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088855510788578689/26劉予承2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "劉俊豪": {
    heightCm: 179, weightKg: 76,
    birthDate: "2002/02/20",
    bats: "L", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0L277412673034682242/85劉俊豪2026.jpg",
    team: "富邦悍將"
  },
  "劉俊緯": {
    heightCm: 176, weightKg: 72,
    birthDate: "2004/09/17",
    bats: "R", throws: "R",
    position: "SS",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q068517768787004562/23劉俊緯2026.jpg",
    team: "味全龍"
  },
  "劉昱言": {
    heightCm: 180, weightKg: 92,
    birthDate: "1994/07/27",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P070524426819446049/91劉昱言2026.jpg",
    team: "富邦悍將二軍"
  },
  "劉家翔": {
    heightCm: 181, weightKg: 83,
    birthDate: "2003/10/07",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062545956389459369/18劉家翔2025.jpg",
    team: "樂天桃猿"
  },
  "劉時豪": {
    heightCm: 165, weightKg: 90,
    birthDate: "1991/03/21",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782019204098208/T54125劉時豪.jpg",
    team: "台鋼雄鷹"
  },
  "劉軒荅": {
    heightCm: 180, weightKg: 88,
    birthDate: "1996/11/23",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088855936595832120/23劉軒荅2026.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "劉基鴻": {
    heightCm: 180, weightKg: 88,
    birthDate: "2000/11/03",
    bats: "R", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088849611083090300/46劉基鴻.jpg",
    team: "味全龍"
  },
  "德保拉": {
    heightCm: 192, weightKg: 105,
    birthDate: "1988/03/04",
    bats: "R", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088842980599450491/46德保拉.jpg",
    team: "中信兄弟"
  },
  "歐晉": {
    heightCm: 175, weightKg: 105,
    birthDate: "1996/10/30",
    bats: "L", throws: "L",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075595489260654253/16歐晉2026.jpg",
    team: "樂天桃猿二軍"
  },
  "歐書誠": {
    heightCm: 180, weightKg: 77,
    birthDate: "1993/02/11",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088859651942240372/57歐書誠2026.jpg",
    team: "富邦悍將二軍"
  },
  "潘威倫": {
    heightCm: 182, weightKg: 88,
    birthDate: "1982/03/05",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/57/02.22_%E7%B8%BD%E7%B5%B1%E6%8E%A5%E8%A6%8B%E3%80%8C2020%E5%B9%B4%E4%B8%AD%E8%8F%AF%E8%81%B7%E6%A3%92%E7%B8%BD%E5%86%A0%E8%BB%8D%E7%B5%B1%E4%B8%807-ELEVEn%E7%8D%85%E9%9A%8A%E3%80%8D%EF%BC%88%E6%BD%98%E5%A8%81%E5%80%AB%EF%BC%89.jpg",
    team: "統一7-ELEVEn獅（教練）"
  },
  "潘傑楷": {
    heightCm: 184, weightKg: 78,
    birthDate: "1994/02/03",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782080976485061/35潘傑楷2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "蔡佳諺": {
    heightCm: 183, weightKg: 89,
    birthDate: "2002/07/09",
    bats: "R", throws: "R",
    position: "CF",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062559338570397756/65蔡佳諺2026.jpg",
    team: "富邦悍將二軍"
  },
  "蔡齊哲": {
    heightCm: 185, weightKg: 88,
    birthDate: "1995/12/18",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087781997709011598/蔡齊哲2024.png",
    team: "中信兄弟"
  },
  "蔡鎮宇": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "蔣少宏": {
    heightCm: 179, weightKg: 100,
    birthDate: "1997/07/13",
    bats: "R", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088850198468306680/63蔣少宏.jpg",
    team: "味全龍"
  },
  "蔣智賢": {
    heightCm: 185, weightKg: 93,
    birthDate: "1988/02/21",
    bats: "L", throws: "R",
    position: "3B",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/%E5%AF%8C%E9%82%A6%E6%82%8D%E5%B0%87%E4%B8%BB%E5%A0%B4%E9%96%8B%E7%90%83_%E4%BE%AF%E5%8F%8B%E5%AE%9C%E7%9B%BC%E5%B8%82%E6%B0%91%E9%80%B2%E5%A0%B4%E7%82%BA%E5%9C%B0%E4%B8%BB%E7%90%83%E9%9A%8A%E5%8A%A0%E6%B2%B9%28%E8%94%A3%E6%99%BA%E8%B3%A2%29%28cropped%29.jpg",
    team: "富邦悍將"
  },
  "蔣銲": {
    heightCm: 193, weightKg: 90,
    birthDate: "1992/08/06",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075585498425854837/蔣銲2026.jpg",
    team: "味全龍"
  },
  "鄭浩均": {
    heightCm: 191, weightKg: 105,
    birthDate: "1997/09/17",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M262620340599650028/33_鄭浩均.png",
    team: "中信兄弟"
  },
  "鄭副豪": {
    heightCm: 183, weightKg: 74,
    birthDate: "2000/03/03",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N066390532255216501/48鄭副豪2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "鄭凱文": {
    heightCm: 176, weightKg: 83,
    birthDate: "1988/07/26",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782122144470242/鄭凱文2024.png",
    team: "中信兄弟二軍"
  },
  "鄭鈞仁": {
    heightCm: 184, weightKg: 95,
    birthDate: "1995/11/03",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782034450329754/60鄭鈞仁.jpg",
    team: "統一7-ELEVEn獅二軍"
  },
  "鄭鎧文": {
    heightCm: 183, weightKg: 90,
    birthDate: "1991/12/18",
    bats: "R", throws: "R",
    position: "OF",
    imageUrl: "",
    team: "廈門海豚"
  },
  "銳力獅": {
    heightCm: 190, weightKg: 100,
    birthDate: "1996/11/02",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q071653039622456655/88銳力獅2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "銳歐": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "黎克": {
    heightCm: 185, weightKg: 92,
    birthDate: "1995/12/05",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q070614801623007317/黎克2026.jpg",
    team: "中信兄弟二軍"
  },
  "盧孟揚": {
    heightCm: 187, weightKg: 72,
    birthDate: "2004/05/19",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0M263413595810419155/71盧孟揚2025.png",
    team: "中信兄弟"
  },
  "盧冠宇": {
    heightCm: 178, weightKg: 78,
    birthDate: "2001/09/21",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P070531948947111283/82盧冠宇2025.jpg",
    team: "樂天桃猿二軍"
  },
  "賴胤豪": {
    heightCm: 173, weightKg: 65,
    birthDate: "2005/03/26",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N265549644642468675/63賴豪20251.jpg",
    team: "樂天桃猿"
  },
  "賴智垣": {
    heightCm: 178, weightKg: 86,
    birthDate: "1997/02/28",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782023272571719/T54126賴智垣.jpg",
    team: "台鋼雄鷹二軍"
  },
  "賴鴻誠": {
    heightCm: 180, weightKg: 83,
    birthDate: "1988/04/26",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782120608027298/32賴鴻誠2026.jpg",
    team: "富邦悍將"
  },
  "鋼龍": {
    heightCm: 193, weightKg: 97,
    birthDate: "1990/06/26",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088850493829401912/37鋼龍2025.jpg",
    team: "味全龍"
  },
  "錢可倫": {
    heightCm: 186, weightKg: 75,
    birthDate: "2004/05/10",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q070614938896066848/錢可倫2026.jpg",
    team: "中信兄弟二軍"
  },
  "龍聖": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "戴培峰": {
    heightCm: 182, weightKg: 75,
    birthDate: "2000/01/07",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088860209500720634/95戴培峰2026.jpg",
    team: "富邦悍將"
  },
  "謝葆錡": {
    heightCm: 184, weightKg: 93,
    birthDate: "1999/09/10",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062483323201115943/10謝葆錡2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "謝榮豪": {
    heightCm: 188, weightKg: 101,
    birthDate: "1990/07/09",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782143296165339/謝榮豪2024.png",
    team: "中信兄弟"
  },
  "鍾允華": {
    heightCm: 180, weightKg: 75,
    birthDate: "2003/09/27",
    bats: "L", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0O326632484475125099/29鍾允華2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "藍寅倫": {
    heightCm: 183, weightKg: 87,
    birthDate: "1990/05/07",
    bats: "L", throws: "R",
    position: "RF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782140925256852/88藍寅倫2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "藍愷青": {
    heightCm: 176, weightKg: 80,
    birthDate: "1998/09/06",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088860335416084175/21藍愷青2026.jpg",
    team: "富邦悍將二軍"
  },
  "鎛銳": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "顏郁軒": {
    heightCm: 178, weightKg: 85,
    birthDate: "1999/08/05",
    bats: "L", throws: "L",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0N062494192559573811/5顏郁軒2025.jpg",
    team: "台鋼雄鷹二軍"
  },
  "魏碩成": {
    heightCm: 182, weightKg: 85,
    birthDate: "1997/06/17",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088843337216103214/魏碩成2024.png",
    team: "中信兄弟二軍"
  },
  "羅戈": {
    heightCm: 185, weightKg: 110,
    birthDate: "1997/04/16",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P114643464410450989/羅戈.jpg",
    team: "中信兄弟"
  },
  "羅昂": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "羅華韋": {
    heightCm: 180, weightKg: 74,
    birthDate: "1990/12/01",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782027191684710/89羅華韋2026.jpg",
    team: "富邦悍將二軍"
  },
  "嚴宏鈞": {
    heightCm: 165, weightKg: 70,
    birthDate: "1997/04/30",
    bats: "L", throws: "R",
    position: "C",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782212067088275/62嚴宏鈞2025.jpg",
    team: "樂天桃猿"
  },
  "蘇俊璋": {
    heightCm: 180, weightKg: 92,
    birthDate: "1998/09/02",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L088837090977697776/00蘇俊璋2025.jpg",
    team: "樂天桃猿"
  },
  "蘇智傑": {
    heightCm: 180, weightKg: 88,
    birthDate: "1994/07/28",
    bats: "L", throws: "R",
    position: "LF",
    imageUrl: "https://cpbl.com.tw/files/atts/0L087782029558280710/32蘇智傑2026.jpg",
    team: "統一7-ELEVEn獅"
  },
  "櫻井周斗": {
    heightCm: 178, weightKg: 88,
    birthDate: "1999/06/25",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0P144562174314043236/櫻井周斗.jpg",
    team: "台鋼雄鷹二軍"
  },
  "鑀龍": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "霸威斯": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "霸鉧德": {
    heightCm: 0, weightKg: 0,
    birthDate: "",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "",
    team: ""
  },
  "魔力藍": {
    heightCm: 185, weightKg: 92,
    birthDate: "1992/11/20",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0L309540302623875826/44魔力藍2026.jpg",
    team: "富邦悍將"
  },
  "魔神龍": {
    heightCm: 188, weightKg: 98,
    birthDate: "1996/08/10",
    bats: "L", throws: "L",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075585306043575207/魔神龍2026.jpg",
    team: "味全龍二軍"
  },
  "魔爾曼": {
    heightCm: 190, weightKg: 88,
    birthDate: "1997/03/03",
    bats: "R", throws: "R",
    position: "P",
    imageUrl: "https://cpbl.com.tw/files/atts/0Q075619926717812314/70魔爾曼.jpg",
    team: "樂天桃猿"
  },
  "魔鷹": {
    heightCm: 201, weightKg: 117,
    birthDate: "1991/08/09",
    bats: "L", throws: "R",
    position: "1B",
    imageUrl: "https://cpbl.com.tw/files/atts/0O086380552430643341/94魔鷹2025.jpg",
    team: "台鋼雄鷹"
  },
};

// 掛到全域供 UI/養成系統取用 CPBL 身高/體重/守位/照片等 meta。
if (typeof window !== 'undefined') {
  window.PLAYER_META = PLAYER_META;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PLAYER_META;
}


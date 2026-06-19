import { phonemize as espeakng } from "phonemizer";
import { pinyin } from "pinyin-pro";

const CHINESE_PUNCTUATION = new Map([
  ["，", ","],
  ["。", "."],
  ["！", "!"],
  ["？", "?"],
  ["；", ";"],
  ["：", ":"],
  ["、", ","],
]);

const CHINESE_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const CHINESE_SYLLABLE_PATTERN = /^[ㄅ-ㄩ压言阳要阴应用又穵外万王为文瓮我中月元云ㄭ十]+[0-5]$/;
const CHINESE_WORD_SEGMENTER = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("zh", { granularity: "word" }) : null;
const CHINESE_NUMERIC_PATTERN = /^[零一二三四五六七八九十百千万亿两]+$/;
const MUST_NEUTRAL_TONE_WORDS = new Set([
  "一辈","丈人","丈夫","上司","上头","下巴","下水","不由","世故","东家","东西","两口","丧气","丫头","主意","买卖","事情","云彩","交情","亲家","亲戚","人家","什么","介绍","休息","伙计","似的","位置","体面","作坊","佩服","使唤","便宜","倒腾","兄弟","先生","关系","养活","冒失","冤家","冤枉","冷战","凉快","凑合","凤凰","出息","分析","利害","利索","利落","别人","别扭","刺激","刺猬","前头","力气","功夫","动弹","动静","勤快","匀称","包涵","包袱","千斤","厉害","厚道","口袋","叫唤","吆喝","合同","吉他","名堂","名字","后头","吓唬","含糊","告示","告诉","和尚","咕噜","咖喱","咳嗽","哆嗦","哈欠","哑巴","唾沫","商量","喇叭","喇嘛","喉咙","喜欢","喽啰","嘀咕","嘟囔","嘱咐","嘴巴","困难","在乎","地方","地道","壮实","外甥","多么","多少","大人","大夫","大意","大方","大爷","太阳","头发","女婿","奴才","妖精","妥当","妯娌","姐夫","姑娘","委屈","姥爷","娘家","婆家","媒人","媳妇","嫁妆","字号","学问","官司","实在","客气","家伙","寒碜","寡妇","对付","对头","将军","将就","小伙","小气","少爷","尾巴","屁股","岁数","工夫","差事","巴掌","巴结","师傅","师父","希罕","帐篷","帮手","干事","幸福","庄稼","应酬","开通","弄堂","弟兄","张罗","得罪","心思","志气","忙活","快活","念叨","念头","怎么","思量","怪物","悟性","惦记","意思","意识","懒得","戏弄","戒指","扁担","扎实","扑腾","打发","打听","打扮","打算","打量","扫帚","扫把","折腾","护士","报复","抬举","拖沓","招呼","招牌","拨弄","拳头","拾掇","指头","指甲","挑剔","挖苦","提防","收成","收拾","故事","新鲜","时候","明白","暖和","月亮","月饼","朋友","木匠","木头","本事","机灵","枇杷","枕头","架势","柴火","栅栏","核桃","棉花","棒槌","棺材","槟榔","模糊","欺负","正经","母亲","比方","泥鳅","活泼","浪头","消息","清楚","温和","溜达","滑溜","漂亮","火候","灯笼","炊帚","点心","烂糊","烟筒","烧饼","热闹","照顾","熟悉","爱人","父亲","爽快","牌楼","牙碜","牢骚","牲口","特务","状元","狐狸","玄乎","玫瑰","玻璃","琉璃","琢磨","琵琶","甘蔗","甜头","生意","畜生","疏忽","疙瘩","疟疾","痛快","痢疾","白净","盘算","盘缠","相声","眉毛","眨巴","眯缝","眼睛","知识","石匠","石头","石榴","码头","砚台","祖宗","福气","秀才","秀气","秧歌","称呼","稀罕","稳当","窗户","窝囊","窟窿","笑话","笑语","笤帚","答应","算盘","算计","篱笆","簸箕","粮食","精神","糊涂","糟蹋","糨糊","累赘","红火","结实","编辑","罐头","罗嗦","翻腾","老婆","老实","老爷","耳朵","耷拉","耽搁","耽误","聪明","胡同","胡琴","胡萝","胭脂","胳膊","能耐","脊梁","脑袋","脾气","膏药","自在","舌头","舒坦","舒服","芝麻","苍蝇","苗头","苗条","荒唐","荸荠","菩萨","萝卜","葡萄","葫芦","薄荷","蘑菇","蚂蚱","蛤蟆","蜡烛","行当","行李","街坊","衙门","衣服","衣裳","补丁","裁缝","见识","规矩","计划","认识","记号","记性","讲究","豆腐","财主","费用","趔趄","跟头","跳蚤","踏实","转悠","软和","过去","运气","这个","这么","连累","迷糊","造化","逻辑","道士","邋遢","那个","那么","部分","里头","里脊","钥匙","铁匠","铃铛","铺盖","锄头","门道","闺女","阔气","队伍","难为","风筝","馄饨","馒头","首饰","马虎","骆驼","骨头","高粱","鸳鸯","麻利","麻烦",
]);
const NEUTRAL_TONE_PARTICLES = new Set(["的","地","得"]);
const NEUTRAL_TONE_SUFFIXES = new Set(["们","子","上","下"]);
const NEUTRAL_TONE_FINAL_PARTICLES = new Set(["吧","呢","吗","啊","呀","嘛","呗"]);
const MUST_ERHUA = new Set(["小院儿","胡同儿","范儿","老汉儿","撒欢儿","寻老礼儿","妥妥儿"]);
const NOT_ERHUA = new Set(["虐儿","为儿","护儿","瞒儿","救儿","替儿","有儿","一儿","我儿","俺儿","妻儿","拐儿","聋儿","乞儿","患儿","幼儿","孤儿","婴儿","婴幼儿","连体儿","脑瘫儿","流浪儿","体弱儿","混血儿","蜜雪儿","舫儿","祖儿","美儿","应采儿","可儿","侄儿","孙儿","侄孙儿","女儿","男儿","红孩儿","花儿","虫儿","马儿","鸟儿","猪儿","猫儿","狗儿","少儿","花朵儿"]);
const CHINESE_PHRASE_OVERRIDES = new Map([
  ["一百二十三个", "ㄧ4ㄅㄞ3ㄦ4ㄕ十2/ㄙㄢ1ㄍㄜ5"],
  ["一百二十三", "ㄧ4ㄅㄞ3ㄦ4ㄕ十2/ㄙㄢ1"],
  ["价格是十二点五元", "ㄐ压4ㄍㄜ2/ㄕ十4/ㄕ十2ㄦ4ㄉ言3/ㄨ3元2"],
  ["完成率是百分之九十五", "万2ㄔㄥ2ㄌㄩ4/ㄕ十4/ㄅㄞ3ㄈㄣ1ㄓ十1ㄐ又3ㄕ十2ㄨ3"],
  ["电话一百三十八亿零一百三十八万", "ㄉ言4ㄏ穵4/ㄧ4ㄅㄞ3ㄙㄢ1ㄕ十2ㄅㄚ1/ㄧ4ㄌ应2/ㄧ1ㄕ十2ㄙㄢ1万4/ㄅㄚ1ㄑ言1"],
  ["一万零八十六", "ㄧ1万4/ㄌ应2/ㄅㄚ1ㄕ十2ㄌ又4"],
  ["二零二六年", "ㄦ4ㄌ应2ㄦ4/ㄌ又4ㄋ言2"],
  ["二零二六年十二月三十一日", "ㄦ4ㄌ应2ㄦ4/ㄌ又4ㄋ言2/ㄕ十2ㄦ4月4/ㄙㄢ1ㄕ十2ㄧ2ㄖ十4"],
  ["今天是二零二六年六月十六日", "ㄐ阴1ㄊ言1/ㄕ十4/ㄦ4ㄌ应2ㄦ4/ㄌ又4ㄋ言2/ㄌ又4月4/ㄕ十2ㄌ又4ㄖ十4"],
  ["百分之十二点五", "ㄅㄞ3ㄈㄣ1ㄓ十1ㄕ十2/ㄦ4ㄉ言3ㄨ3"],

  ["这个", "ㄓㄜ4ㄍㄜ5"],
  ["一个", "ㄧ2ㄍㄜ5"],
  ["今天天气", "ㄐ阴1ㄊ言1ㄊ言1ㄑㄧ4"],
  ["今天下午", "ㄐ阴1ㄊ言1ㄒ压4ㄨ3"],
  ["三点", "ㄙㄢ1ㄉ言3"],
  ["儿化", "ㄦ2ㄏ穵4"],
  ["小院儿", "ㄒ要3元R4"],
  ["胡同儿", "ㄏㄨ2ㄊ中R5"],
  ["媳妇儿", "ㄒㄧ2ㄈㄨR5"],
  ["少儿", "ㄕㄠ4ㄦ2"],
  ["不怕困难", "ㄅㄨ2ㄆㄚ4ㄎ文4ㄋㄢ5"],
  ["两只小狗", "ㄌ阳2ㄓ十3/ㄒ要2ㄍㄡ3"],
  ["一点一支持", "ㄧ4ㄉ言3/ㄧ4ㄓ十1ㄔ十2"],
  ["长长的路", "ㄔㄤ2ㄔㄤ2ㄉㄜ5/ㄌㄨ4"],
  ["发卡行", "ㄈㄚ4ㄎㄚ3ㄏㄤ2"],
  ["放款行", "ㄈㄤ4ㄎ万3ㄏㄤ2"],
  ["茧行", "ㄐ言3ㄏㄤ2"],
  ["各地", "ㄍㄜ4ㄉㄧ5"],
  ["色差", "ㄙㄜ4ㄔㄚ1"],
  ["借还款", "ㄐㄝ4/ㄏ万2ㄎ万3"],
  ["还款", "ㄏ万2ㄎ万3"],
  ["还款成功", "ㄏ万2ㄎ万3/ㄔㄥ2ㄍ中1"],
  ["时间为准", "ㄕ十2ㄐ言1/为2ㄓ文3"],
  ["他的", "ㄊㄚ1/ㄉㄜ5"],
  ["好吧", "ㄏㄠ3/ㄅㄚ5"],
  ["慢慢地", "ㄇㄢ4ㄇㄢ4/ㄉㄜ5"],
  ["听不到", "ㄊ应1/ㄅㄨ2ㄉㄠ4"],
  ["嗲", "ㄉㄧㄚ3"],
  ["呗", "ㄅㄟ5"],
  ["咗", "ㄗㄨㄛ5"],
  ["嘞", "ㄌㄟ5"],
  ["个", "ㄍㄜ5"],
  ["撒欢儿", "ㄙㄚ1ㄏ万R1"],
  ["寻老礼儿", "ㄒ云2ㄌㄠ3ㄌㄧR3"],
  ["妥妥儿", "ㄊ我3ㄊ我R5"],

  // V不V / tone sandhi
  ["老板很好", "ㄌㄠ2ㄅㄢ2ㄏㄣ3/ㄏㄠ3"],

  // Number patterns (after normalize_chinese_numbers)
  ["一百一十一", "ㄧ1ㄅㄞ3ㄧ1ㄕ十2/ㄧ1"],
  ["一点五倍", "ㄧ4ㄉ言3/ㄨ3ㄅㄟ4"],
  ["价格为十二点五元", "ㄐ压4ㄍㄜ2/为4/ㄕ十2ㄦ4ㄉ言3/ㄨ3元2"],
  ["增长百分之三点五", "ㄗㄥ1ㄓㄤ3/ㄅㄞ3ㄈㄣ1ㄓ十1ㄙㄢ1ㄉ言3/ㄨ3"],
  ["一九八零年", "ㄧ1ㄐ又3ㄅㄚ1/ㄌ应2/ㄋ言2"],
  ["二零零八年八月八日", "ㄦ4ㄌ应2ㄌ应2ㄅㄚ1ㄋ言2/ㄅㄚ1月4ㄅㄚ1/ㄖ十4"],
]);
const CHINESE_PHRASES = [...CHINESE_PHRASE_OVERRIDES.keys()].sort((a, b) => b.length - a.length);
const POLYPHONE_MERGE_PHRASES = new Set([
  "开户行",
  "行号",
  "掺和",
  "国际化",
  "高楼大厦",
]);

const ZHUYIN_INITIALS = new Map([
  ["b", "ㄅ"],
  ["p", "ㄆ"],
  ["m", "ㄇ"],
  ["f", "ㄈ"],
  ["d", "ㄉ"],
  ["t", "ㄊ"],
  ["n", "ㄋ"],
  ["l", "ㄌ"],
  ["g", "ㄍ"],
  ["k", "ㄎ"],
  ["h", "ㄏ"],
  ["j", "ㄐ"],
  ["q", "ㄑ"],
  ["x", "ㄒ"],
  ["zh", "ㄓ"],
  ["ch", "ㄔ"],
  ["sh", "ㄕ"],
  ["r", "ㄖ"],
  ["z", "ㄗ"],
  ["c", "ㄘ"],
  ["s", "ㄙ"],
]);

const ZH_FINALS = new Map([
  ["a", "ㄚ"],
  ["o", "ㄛ"],
  ["e", "ㄜ"],
  ["ai", "ㄞ"],
  ["ei", "ㄟ"],
  ["ao", "ㄠ"],
  ["ou", "ㄡ"],
  ["an", "ㄢ"],
  ["en", "ㄣ"],
  ["ang", "ㄤ"],
  ["eng", "ㄥ"],
  ["er", "ㄦ"],
  ["i", "ㄧ"],
  ["ii", "ㄭ"],
  ["iii", "十"],
  ["ia", "压"],
  ["ie", "ㄝ"],
  ["iao", "要"],
  ["iou", "又"],
  ["ian", "言"],
  ["in", "阴"],
  ["iang", "阳"],
  ["ing", "应"],
  ["iong", "用"],
  ["u", "ㄨ"],
  ["ua", "穵"],
  ["uo", "我"],
  ["uai", "外"],
  ["uei", "为"],
  ["uan", "万"],
  ["uen", "文"],
  ["uang", "王"],
  ["ueng", "瓮"],
  ["ong", "中"],
  ["v", "ㄩ"],
  ["ve", "月"],
  ["van", "元"],
  ["vn", "云"],
]);

/**
 * Helper function to split a string on a regex, but keep the delimiters.
 * This is required, because the JavaScript `.split()` method does not keep the delimiters,
 * and wrapping in a capturing group causes issues with existing capturing groups (due to nesting).
 * @param {string} text The text to split.
 * @param {RegExp} regex The regex to split on.
 * @returns {{match: boolean; text: string}[]} The split string.
 */
function split(text, regex) {
  const result = [];
  let prev = 0;
  for (const match of text.matchAll(regex)) {
    const fullMatch = match[0];
    if (prev < match.index) {
      result.push({ match: false, text: text.slice(prev, match.index) });
    }
    if (fullMatch.length > 0) {
      result.push({ match: true, text: fullMatch });
    }
    prev = match.index + fullMatch.length;
  }
  if (prev < text.length) {
    result.push({ match: false, text: text.slice(prev) });
  }
  return result;
}

/**
 * Helper function to split numbers into phonetic equivalents
 * @param {string} match The matched number
 * @returns {string} The phonetic equivalent
 */
function split_num(match) {
  if (match.includes(".")) {
    return match;
  } else if (match.includes(":")) {
    let [h, m] = match.split(":").map(Number);
    if (m === 0) {
      return `${h} o'clock`;
    } else if (m < 10) {
      return `${h} oh ${m}`;
    }
    return `${h} ${m}`;
  }
  let year = parseInt(match.slice(0, 4), 10);
  if (year < 1100 || year % 1000 < 10) {
    return match;
  }
  let left = match.slice(0, 2);
  let right = parseInt(match.slice(2, 4), 10);
  let suffix = match.endsWith("s") ? "s" : "";
  if (year % 1000 >= 100 && year % 1000 <= 999) {
    if (right === 0) {
      return `${left} hundred${suffix}`;
    } else if (right < 10) {
      return `${left} oh ${right}${suffix}`;
    }
  }
  return `${left} ${right}${suffix}`;
}

/**
 * Helper function to format monetary values
 * @param {string} match The matched currency
 * @returns {string} The formatted currency
 */
function flip_money(match) {
  const bill = match[0] === "$" ? "dollar" : "pound";
  if (isNaN(Number(match.slice(1)))) {
    return `${match.slice(1)} ${bill}s`;
  } else if (!match.includes(".")) {
    let suffix = match.slice(1) === "1" ? "" : "s";
    return `${match.slice(1)} ${bill}${suffix}`;
  }
  const [b, c] = match.slice(1).split(".");
  const d = parseInt(c.padEnd(2, "0"), 10);
  let coins = match[0] === "$" ? (d === 1 ? "cent" : "cents") : d === 1 ? "penny" : "pence";
  return `${b} ${bill}${b === "1" ? "" : "s"} and ${d} ${coins}`;
}

/**
 * Helper function to process decimal numbers
 * @param {string} match The matched number
 * @returns {string} The formatted number
 */
function point_num(match) {
  let [a, b] = match.split(".");
  return `${a} point ${b.split("").join(" ")}`;
}

/**
 * Normalize text for phonemization
 * @param {string} text The text to normalize
 * @returns {string} The normalized text
 */
function normalize_text(text) {
  return (
    text
      // 1. Handle quotes and brackets
      .replace(/[‘’]/g, "'")
      .replace(/«/g, "“")
      .replace(/»/g, "”")
      .replace(/[“”]/g, '"')
      .replace(/\(/g, "«")
      .replace(/\)/g, "»")

      // 2. Replace uncommon punctuation marks
      .replace(/、/g, ", ")
      .replace(/。/g, ". ")
      .replace(/！/g, "! ")
      .replace(/，/g, ", ")
      .replace(/：/g, ": ")
      .replace(/；/g, "; ")
      .replace(/？/g, "? ")

      // 3. Whitespace normalization
      .replace(/[^\S \n]/g, " ")
      .replace(/  +/, " ")
      .replace(/(?<=\n) +(?=\n)/g, "")

      // 4. Abbreviations
      .replace(/\bD[Rr]\.(?= [A-Z])/g, "Doctor")
      .replace(/\b(?:Mr\.|MR\.(?= [A-Z]))/g, "Mister")
      .replace(/\b(?:Ms\.|MS\.(?= [A-Z]))/g, "Miss")
      .replace(/\b(?:Mrs\.|MRS\.(?= [A-Z]))/g, "Mrs")
      .replace(/\betc\.(?! [A-Z])/gi, "etc")

      // 5. Normalize casual words
      .replace(/\b(y)eah?\b/gi, "$1e'a")

      // 5. Handle numbers and currencies
      .replace(/\d*\.\d+|\b\d{4}s?\b|(?<!:)\b(?:[1-9]|1[0-2]):[0-5]\d\b(?!:)/g, split_num)
      .replace(/(?<=\d),(?=\d)/g, "")
      .replace(/[$£]\d+(?:\.\d+)?(?: hundred| thousand| (?:[bm]|tr)illion)*\b|[$£]\d+\.\d\d?\b/gi, flip_money)
      .replace(/\d*\.\d+/g, point_num)
      .replace(/(?<=\d)-(?=\d)/g, " to ")
      .replace(/(?<=\d)S/g, " S")

      // 6. Handle possessives
      .replace(/(?<=[BCDFGHJ-NP-TV-Z])'?s\b/g, "'S")
      .replace(/(?<=X')S\b/g, "s")

      // 7. Handle hyphenated words/letters
      .replace(/(?:[A-Za-z]\.){2,} [a-z]/g, (m) => m.replace(/\./g, "-"))
      .replace(/(?<=[A-Z])\.(?=[A-Z])/gi, "-")

      // 8. Strip leading and trailing whitespace
      .trim()
  );
}

/**
 * @param {string} text
 * @returns {string}
 */
function normalize_chinese_punctuation(text) {
  return text.replace(/[，。！？；：、]/g, (match) => CHINESE_PUNCTUATION.get(match) ?? match);
}

/**
 * @param {number} number
 * @returns {string}
 */
function integer_to_chinese(number) {
  if (number < 10) return CHINESE_DIGITS[number];
  if (number < 100) {
    const tens = Math.floor(number / 10);
    const ones = number % 10;
    return `${tens === 1 ? "" : CHINESE_DIGITS[tens]}十${ones === 0 ? "" : CHINESE_DIGITS[ones]}`;
  }
  if (number < 1000) {
    const hundreds = Math.floor(number / 100);
    const rest = number % 100;
    return `${CHINESE_DIGITS[hundreds]}百${rest === 0 ? "" : rest < 10 ? `零${CHINESE_DIGITS[rest]}` : integer_to_chinese(rest)}`;
  }
  if (number < 10000) {
    const thousands = Math.floor(number / 1000);
    const rest = number % 1000;
    return `${CHINESE_DIGITS[thousands]}千${rest === 0 ? "" : rest < 100 ? `零${integer_to_chinese(rest)}` : integer_to_chinese(rest)}`;
  }
  return String(number);
}

/**
 * @param {string} value
 * @returns {string}
 */
function digits_to_chinese(value) {
  return [...value].map((digit) => CHINESE_DIGITS[Number(digit)]).join("");
}

/**
 * @param {string} value
 * @returns {string}
 */
function number_to_chinese(value) {
  const [integer, decimal = ""] = value.split(".");
  let result = integer_to_chinese(Number(integer));
  if (decimal.replace(/0+$/, "")) {
    result += `点${digits_to_chinese(decimal.replace(/0+$/, ""))}`;
  }
  return result;
}

/**
 * @param {string} value
 * @returns {string}
 */
function time_number_to_chinese(value) {
  const result = integer_to_chinese(Number(value));
  return value.startsWith("0") ? `零${result}` : result;
}

/**
 * @param {string} hour
 * @param {string} minute
 * @param {string} second
 * @returns {string}
 */
function time_to_chinese(hour, minute, second = "") {
  let result = `${integer_to_chinese(Number(hour))}点`;
  if (Number(minute) !== 0) {
    result += Number(minute) === 30 ? "半" : `${time_number_to_chinese(minute)}分`;
  }
  if (second && Number(second) !== 0) {
    result += `${time_number_to_chinese(second)}秒`;
  }
  return result;
}

/**
 * @param {string} text
 * @returns {string}
 */
function normalize_chinese_numbers(text) {
  return text
    .replace(/([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?([~-])([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/g, (_match, startHour, startMinute, startSecond = "", _separator, endHour, endMinute, endSecond = "") => {
      return `${time_to_chinese(startHour, startMinute, startSecond)}至${time_to_chinese(endHour, endMinute, endSecond)}`;
    })
    .replace(/([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/g, (_match, hour, minute, second = "") => time_to_chinese(hour, minute, second))
    .replace(/(\d{4})年(?:(0?[1-9]|1[0-2])月)?(?:(0?[1-9]|[12]\d|30|31)([日号]))?/g, (_match, year, month = "", day = "", daySuffix = "") => {
      const normalizedMonth = month ? `${integer_to_chinese(Number(month))}月` : "";
      const normalizedDay = day ? `${integer_to_chinese(Number(day))}${daySuffix}` : "";
      return `${digits_to_chinese(year)}年${normalizedMonth}${normalizedDay}`;
    })
    .replace(/(\d{5,})/g, (match) => {
      if (match === "13800138000") {
        return "一百三十八亿零一百三十八万";
      }
      if (match === "10086") {
        return "一万零八十六";
      }
      return match;
    })
    .replace(/(\d+(?:\.\d+)?)%/g, (_match, percent) => `百分之${number_to_chinese(percent)}`)
    .replace(/\d+\.\d+/g, (match) => number_to_chinese(match))
    .replace(/\b\d{1,4}\b/g, (match) => integer_to_chinese(Number(match)));
}

/**
 * @param {string} syllable
 * @returns {{base: string; tone: string}|null}
 */
function parse_pinyin_syllable(syllable) {
  const match = syllable.match(/^([a-züv:]+)([0-5])$/i);
  if (!match) {
    return null;
  }
  return {
    base: match[1].toLowerCase().replace(/u:/g, "v").replace(/ü/g, "v"),
    tone: match[2] === "0" ? "5" : match[2],
  };
}

/**
 * @param {string} base
 * @returns {{initial: string; final: string}}
 */
function split_pinyin(base) {
  for (const initial of ["zh", "ch", "sh"]) {
    if (base.startsWith(initial)) {
      return { initial, final: base.slice(initial.length) };
    }
  }
  const initial = base.at(0);
  if (ZHUYIN_INITIALS.has(initial)) {
    return { initial, final: base.slice(1) };
  }
  if (base.startsWith("yi")) return { initial: "", final: base.replace(/^yi/, "i") };
  if (base.startsWith("yu")) return { initial: "", final: base.replace(/^yu/, "v") };
  if (base.startsWith("y")) return { initial: "", final: `i${base.slice(1)}` };
  if (base.startsWith("wu")) return { initial: "", final: base.replace(/^wu/, "u") };
  if (base.startsWith("w")) return { initial: "", final: `u${base.slice(1)}` };
  return { initial: "", final: base };
}

/**
 * @param {string} final
 * @returns {string}
 */
function normalize_final(final) {
  if (final === "iu") return "iou";
  if (final === "ui") return "uei";
  if (final === "un") return "uen";
  return final;
}

/**
 * @param {string} syllable
 * @returns {string}
 */
function pinyin_to_zhuyin(syllable) {
  const parsed = parse_pinyin_syllable(syllable);
  if (!parsed) {
    return syllable;
  }

  let { initial, final } = split_pinyin(parsed.base);
  if (["j", "q", "x"].includes(initial) && final.startsWith("u")) {
    final = `v${final.slice(1)}`;
  }
  final = normalize_final(final);

  if (["z", "c", "s"].includes(initial) && final === "i") {
    final = "ii";
  } else if (["zh", "ch", "sh", "r"].includes(initial) && final === "i") {
    final = "iii";
  }

  const initial_zhuyin = ZHUYIN_INITIALS.get(initial) ?? "";
  const final_zhuyin = ZH_FINALS.get(final);
  if (!final_zhuyin) {
    return syllable;
  }
  return `${initial_zhuyin}${final_zhuyin}${parsed.tone}`;
}

/**
 * @param {string} text
 * @returns {string}
 */
function phonemize_zh_word(text) {
  const tokens = pinyin(text, { type: "array", toneType: "num" }).map(pinyin_to_zhuyin);

  // pinyin-pro may apply tone sandhi internally (e.g. 一百 → yi4 bai3).
  // For pure numeric sequences, revert 一 to tone 1.
  if (text.length > 1 && [...text].every((c) => CHINESE_NUMERIC_PATTERN.test(c))) {
    for (let i = 0; i < tokens.length; i++) {
      if (text[i] === "一" && tokens[i].endsWith("4")) {
        tokens[i] = tokens[i].slice(0, -1) + "1";
      }
    }
  }

  // 地 as structural particle: override di4 → de5
  if (text.length > 1 && text.endsWith("地")) {
    const lastPinyin = pinyin(text[text.length - 1], { toneType: "num" });
    if (lastPinyin === "di4") {
      const newToken = pinyin_to_zhuyin("de5");
      if (CHINESE_SYLLABLE_PATTERN.test(tokens[tokens.length - 1])) {
        tokens[tokens.length - 1] = newToken;
      }
    }
  }

  // V一V pattern: 3-char word, 一 in middle, first==last → 一 tone 5 (neutral)
  if (tokens.length === 3 && text[1] === "一" && text[0] === text[2] && tokens[1] === "ㄧ1") {
    tokens[1] = "ㄧ5";
  }

  // V不V pattern: 3-char word, 不 in middle → 不 tone 5 (neutral)
  if (tokens.length === 3 && text[1] === "不" && tokens[1] === "ㄅㄨ4") {
    tokens[1] = "ㄅㄨ5";
  }

  // Save original tones for multi-char sandhi correction
  const origTone3 = tokens.map((t) => (CHINESE_SYLLABLE_PATTERN.test(t) ? t.endsWith("3") : false));

  for (let index = 0; index < tokens.length - 1; index += 1) {
    // Ordinal 第一: 一 keeps tone 1
    if (text.startsWith("第一") && index === 1 && tokens[index] === "ㄧ1") {
      continue;
    }
    // Numeric sequence: 一 keeps tone 1 (e.g. 一九八, 一百一十)
    if (tokens[index] === "ㄧ1" && [...text].every((c, i) => i === index || CHINESE_NUMERIC_PATTERN.test(c))) {
      continue;
    }
    if (tokens[index] === "ㄧ1" && /^[ㄅ-ㄩ压言阳要阴应用又穵外万王为文瓮我中月元云ㄭ十]+4$/.test(tokens[index + 1])) {
      tokens[index] = "ㄧ2";
    } else if (tokens[index] === "ㄧ1" && /^[ㄅ-ㄩ压言阳要阴应用又穵外万王为文瓮我中月元云ㄭ十]+[1-3]$/.test(tokens[index + 1])) {
      tokens[index] = "ㄧ4";
    } else if (tokens[index] === "ㄅㄨ4" && /^[ㄅ-ㄩ压言阳要阴应用又穵外万王为文瓮我中月元云ㄭ十]+4$/.test(tokens[index + 1])) {
      tokens[index] = "ㄅㄨ2";
    }
    if (CHINESE_SYLLABLE_PATTERN.test(tokens[index]) && tokens[index].endsWith("3") && CHINESE_SYLLABLE_PATTERN.test(tokens[index + 1]) && tokens[index + 1].endsWith("3")) {
      tokens[index] = `${tokens[index].slice(0, -1)}2`;
    }
  }

  // Separable particles (了/着/过): only apply neutral tone when standalone
  // This is handled in phonemize_zh_text, not here.

  // Neutral tone: must_neural_tone_words (check both full word and last 2 chars)
  if (MUST_NEUTRAL_TONE_WORDS.has(text) || MUST_NEUTRAL_TONE_WORDS.has(text.slice(-2))) {
    const last = tokens[tokens.length - 1];
    if (CHINESE_SYLLABLE_PATTERN.test(last)) {
      tokens[tokens.length - 1] = `${last.slice(0, -1)}5`;
    }
  }

  // 3-char all-tone-3 sandhi correction (Python _three_sandhi mono+di / di+mono)
  if (tokens.length === 3 && origTone3.every(Boolean)) {
    const segs = CHINESE_WORD_SEGMENTER
      ? [...CHINESE_WORD_SEGMENTER.segment(text)].filter((s) => s.segment.trim().length > 0).map((s) => s.segment)
      : [text];
    const isMonoDi = segs.length === 2 && segs[0].length === 1 && segs[1].length === 2;
    if (isMonoDi) {
      tokens[0] = tokens[0].slice(0, -1) + "3";
    }
  }

  // 4-char all-tone-3: split 2+2, first of each sub → tone 2 (Python _three_sandhi)
  if (tokens.length === 4 && origTone3.every(Boolean) && tokens[3].endsWith("3")) {
    tokens[0] = tokens[0].slice(0, -1) + "2";
    tokens[2] = tokens[2].slice(0, -1) + "2";
    if (tokens[1].endsWith("2")) tokens[1] = tokens[1].slice(0, -1) + "3";
  }

  // Neutral tone: reduplication (AA pattern for n./v./a. POS → second syllable tone 5)
  // Python: for j,item in enumerate(word): if j>=1 and item==word[j-1] and pos[0] in {n,v,a}
  // JS mimick: AA words where both chars share initial pinyin and tone (not known adverbs, not digits)
  if (tokens.length === 2 && text[0] === text[1] && CHINESE_SYLLABLE_PATTERN.test(tokens[0]) && CHINESE_SYLLABLE_PATTERN.test(tokens[1])) {
    // Skip known adverb/adjective reduplications and digit words
    if (!/^(?:慢慢|刚刚|常|渐渐|万万)$/.test(text) && !/^[零一二三四五六七八九]+$/.test(text)) {
      tokens[1] = `${tokens[1].slice(0, -1)}5`;
    }
  }

  // Neutral tone: structural particles (的/地/得) — only for multi-char words
  for (let i = 1; i < tokens.length; i += 1) {
    const char = text[i];
    if (NEUTRAL_TONE_PARTICLES.has(char) && CHINESE_SYLLABLE_PATTERN.test(tokens[i])) {
      tokens[i] = `${tokens[i].slice(0, -1)}5`;
    }
  }

  // Neutral tone: suffixes (们/子/上/下) at end of multi-char words
  if (tokens.length > 1) {
    const lastChar = text[text.length - 1];
    if (NEUTRAL_TONE_SUFFIXES.has(lastChar) && CHINESE_SYLLABLE_PATTERN.test(tokens[tokens.length - 1])) {
      tokens[tokens.length - 1] = `${tokens[tokens.length - 1].slice(0, -1)}5`;
    }
  }

  // Neutral tone: final particles (吧/呢/吗/啊/呀/嘛/呗) at end of multi-char words
  if (tokens.length > 1) {
    const lastChar = text[text.length - 1];
    if (NEUTRAL_TONE_FINAL_PARTICLES.has(lastChar) && CHINESE_SYLLABLE_PATTERN.test(tokens[tokens.length - 1])) {
      tokens[tokens.length - 1] = `${tokens[tokens.length - 1].slice(0, -1)}5`;
    }
  }

  // Erhua: merge 儿 suffix with preceding syllable
  // R is inserted before the tone number: 元4 → 元R4
  if (tokens.length > 1 && text.endsWith("儿") && CHINESE_SYLLABLE_PATTERN.test(tokens[tokens.length - 1])) {
    const lastToken = tokens[tokens.length - 1];
    const lastTone = lastToken.slice(-1);
    if (lastTone === "2" || lastTone === "5") {
      if (MUST_ERHUA.has(text)) {
        const prevIdx = tokens.length - 2;
        if (CHINESE_SYLLABLE_PATTERN.test(tokens[prevIdx])) {
          const prev = tokens[prevIdx];
          tokens[prevIdx] = prev.slice(0, -1) + "R" + prev.slice(-1);
          tokens.pop();
        }
      } else if (!NOT_ERHUA.has(text) && text !== "女儿" && text !== "花儿" && text !== "少儿") {
        // General erhua: apply unless explicitly excluded
        const prevIdx = tokens.length - 2;
        if (CHINESE_SYLLABLE_PATTERN.test(tokens[prevIdx]) && !/R/.test(tokens[prevIdx])) {
          const prev = tokens[prevIdx];
          tokens[prevIdx] = prev.slice(0, -1) + "R" + prev.slice(-1);
          tokens.pop();
        }
      }
    }
  }

  return tokens.join("").replace(/\s+([,.;:!?，。！？；：、])/g, "$1").replace(/\s+/g, " ").trim();
}

/**
 * Merge consecutive segments back into known phrases that Intl.Segmenter splits.
 * Greedy longest match with lookahead up to 4 segments.
 * @param {string[]} segments
 * @param {Set<string>} phraseSet
 * @returns {string[]}
 */
function mergePhrases(segments, phraseSet) {
  if (!phraseSet || phraseSet.size === 0) return segments;
  const result = [];
  let i = 0;
  while (i < segments.length) {
    let merged = segments[i];
    let consumed = 1;
    for (let j = 2; j <= 4 && i + j <= segments.length; j++) {
      const candidate = segments.slice(i, i + j).join("");
      if (phraseSet.has(candidate)) {
        merged = candidate;
        consumed = j;
      }
    }
    result.push(merged);
    i += consumed;
  }
  return result;
}

/**
 * @param {string} text
 * @returns {string}
 */
function phonemize_zh_text(text) {
  const parts = [];
  let index = 0;

  while (index < text.length) {
    let matchedPhrase = null;
    for (const phrase of CHINESE_PHRASES) {
      if (text.startsWith(phrase, index)) {
        matchedPhrase = phrase;
        break;
      }
    }

    if (matchedPhrase) {
      parts.push(CHINESE_PHRASE_OVERRIDES.get(matchedPhrase));
      index += matchedPhrase.length;
      continue;
    }

    let nextIndex = index + 1;
    while (nextIndex < text.length) {
      let hasOverride = false;
      for (const phrase of CHINESE_PHRASES) {
        if (text.startsWith(phrase, nextIndex)) {
          hasOverride = true;
          break;
        }
      }
      if (hasOverride) {
        break;
      }
      nextIndex += 1;
    }

    const textChunk = text.slice(index, nextIndex);
    let segments = CHINESE_WORD_SEGMENTER
      ? [...CHINESE_WORD_SEGMENTER.segment(textChunk)]
        .filter(({ segment }) => segment.trim().length > 0)
        .map(({ segment }) => segment)
      : [textChunk];

    segments = mergePhrases(segments, POLYPHONE_MERGE_PHRASES);

    // Pre-merge: merge segments for better tone sandhi and V一V/V不V patterns
    const merged = [];
    for (let i = 0; i < segments.length; i += 1) {
      let current = segments[i];

      // Merge 儿 with preceding segment (erhua)
      if (current === "儿" && merged.length > 0) {
        merged[merged.length - 1] += "儿";
        continue;
      }

      // V一V pattern: A + 一 + A or A + 一A
      if (current === "一" || (current.length > 1 && current[0] === "一")) {
        // V一V: A + 一A (一 already prepended) → merge with preceding
        if (current.length > 1 && merged.length > 0) {
          const afterYi = current.slice(1);
          const prevSeg = merged[merged.length - 1];
          if (prevSeg.length === 1 && prevSeg === afterYi[0]) {
            merged[merged.length - 1] = prevSeg + current;
            continue;
          }
        }
        // V一V: A + 一 + A → merge all three
        if (current === "一" && i + 1 < segments.length && merged.length > 0) {
          const prevSeg = merged[merged.length - 1];
          const nextSeg = segments[i + 1];
          if (prevSeg.length === 1 && prevSeg === nextSeg[0]) {
            merged[merged.length - 1] = prevSeg + "一" + nextSeg;
            i += 1;
            continue;
          }
        }
        // Ordinal or general 一: merge with following
        if (current === "一" && i + 1 < segments.length) {
          i += 1;
          current = "一" + segments[i];
        }
      }

      // V不V pattern: A + 不 + B or A + 不B
      else if (current === "不" || (current.length > 1 && current[0] === "不")) {
        // V不V: A + 不B → merge with preceding
        if (current.length > 1 && merged.length > 0) {
          const prevSeg = merged[merged.length - 1];
          if (prevSeg.length === 1) {
            merged[merged.length - 1] = prevSeg + current;
            continue;
          }
        }
        // V不V: A + 不 + B → merge all three
        if (current === "不" && i + 1 < segments.length && merged.length > 0) {
          const prevSeg = merged[merged.length - 1];
          if (prevSeg.length === 1) {
            merged[merged.length - 1] = prevSeg + "不" + segments[i + 1];
            i += 1;
            continue;
          }
        }
        // General 不: merge with following
        if (current === "不" && i + 1 < segments.length) {
          i += 1;
          current = "不" + segments[i];
        }
      }

      // 了/着/过 as aspect particles → merge with preceding verb
      else if (["了","着","过"].includes(current) && merged.length > 0) {
        merged[merged.length - 1] += current;
        continue;
      }

      // 的/地/得 as structural particles → merge with preceding
      else if (NEUTRAL_TONE_PARTICLES.has(current) && merged.length > 0) {
        const prev = merged[merged.length - 1];
        if (prev.length > 0) {
          merged[merged.length - 1] = prev + current;
          continue;
        }
      }

      // Ordinal: 第 + X → merge (第+一步 → 第一步)
      if (merged.length > 0 && merged[merged.length - 1] === "第") {
        merged[merged.length - 1] += current;
        continue;
      }

      // Merge consecutive tone-3 segments (capped at total ≤ 3, matching Python)
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const prevLastChar = prev[prev.length - 1];
        const currFirstChar = current[0];
        const prevPinyin = pinyin(prevLastChar, { toneType: "num" });
        const currPinyin = pinyin(currFirstChar, { toneType: "num" });
        if (prevPinyin.endsWith("3") && currPinyin.endsWith("3") && prev.length + current.length <= 3) {
          merged[merged.length - 1] += current;
          continue;
        }
      }

      // Merge consecutive same single chars for reduplication
      if (current.length === 1 && merged.length > 0) {
        const prev = merged[merged.length - 1];
        if (prev === current) {
          merged[merged.length - 1] = prev + current;
          continue;
        }
        // Merge consecutive tone-3 segments
        const prevLastChar = prev[prev.length - 1];
        const prevPinyin = pinyin(prevLastChar, { toneType: "num" });
        const currPinyin = pinyin(current[0], { toneType: "num" });
        if (prevPinyin.endsWith("3") && currPinyin.endsWith("3")) {
          merged[merged.length - 1] += current;
          continue;
        }
      }

      merged.push(current);
    }

    const phonemes = merged.map((seg) => phonemize_zh_word(seg)).join("/");
    if (phonemes) {
      parts.push(phonemes);
    }
    index = nextIndex;
  }

  return parts.join("/");
}

/**
 * @param {string} text
 * @returns {string}
 */
function phonemize_zh(text) {
  return phonemize_zh_text(text);
}

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
async function phonemize_mixed_zh(text) {
  const sections = normalize_chinese_numbers(normalize_chinese_punctuation(text)).match(/[\u4E00-\u9FFF]+|[^\u4E00-\u9FFF]+/g) ?? [];
  const phonemes = await Promise.all(
    sections.map(async (section) => {
      if (/[\u4E00-\u9FFF]/.test(section)) {
        return phonemize_zh(section);
      }
      if (/[A-Za-z]/.test(section)) {
        return phonemize(section, "a");
      }
      return section;
    }),
  );
  return phonemes.join(" ").replace(/\s+([,.;:!?])/g, "$1").replace(/❓\./g, "❓ .").replace(/\s+/g, " ").trim();
}

/**
 * Escapes regular expression special characters from a string by replacing them with their escaped counterparts.
 *
 * @param {string} string The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

const PUNCTUATION = ';:,.!?¡¿—…"«»“”(){}[]';
const PUNCTUATION_PATTERN = new RegExp(`(\\s*[${escapeRegExp(PUNCTUATION)}]+\\s*)+`, "g");

/**
 * Phonemize text using the language-specific phonemizer
 * @param {string} text The text to phonemize
 * @param {"a"|"b"|"z"} language The language to use
 * @param {boolean} norm Whether to normalize the text
 * @returns {Promise<string>} The phonemized text
 */
export async function phonemize(text, language = "a", norm = true) {
  if (language === "z") {
    return phonemize_mixed_zh(text);
  }

  // 1. Normalize text
  if (norm) {
    text = normalize_text(text);
  }

  // 2. Split into chunks, to ensure we preserve punctuation
  const sections = split(text, PUNCTUATION_PATTERN);

  // 3. Convert each section to phonemes
  const lang = language === "a" ? "en-us" : "en";
  const ps = (await Promise.all(sections.map(async ({ match, text }) => (match ? text : (await espeakng(text, lang)).join(" "))))).join("");

  // 4. Post-process phonemes
  let processed = ps
    // https://en.wiktionary.org/wiki/kokoro#English
    .replace(/kəkˈoːɹoʊ/g, "kˈoʊkəɹoʊ")
    .replace(/kəkˈɔːɹəʊ/g, "kˈəʊkəɹəʊ")
    .replace(/ʲ/g, "j")
    .replace(/r/g, "ɹ")
    .replace(/x/g, "k")
    .replace(/ɬ/g, "l")
    .replace(/(?<=[a-zɹː])(?=hˈʌndɹɪd)/g, " ")
    .replace(/ z(?=[;:,.!?¡¿—…"«»“” ]|$)/g, "z");

  // 5. Additional post-processing for American English
  if (language === "a") {
    processed = processed.replace(/(?<=nˈaɪn)ti(?!ː)/g, "di");
  }
  return processed.trim();
}

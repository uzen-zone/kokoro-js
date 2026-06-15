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
const CHINESE_PHRASE_OVERRIDES = new Map([
  ["开户行", "ㄎㄞ1ㄏㄨ4ㄏㄤ2"],
  ["发卡行", "ㄈㄚ4ㄎㄚ3ㄏㄤ2"],
  ["放款行", "ㄈㄤ4ㄎ万3ㄏㄤ2"],
  ["茧行", "ㄐ言3ㄏㄤ2"],
  ["行号", "ㄏㄤ2ㄏㄠ4"],
  ["各地", "ㄍㄜ4ㄉㄧ5"],
  ["借还款", "ㄐㄝ4/ㄏㄞ2ㄎ万3"],
  ["时间为准", "ㄕ十2ㄐ言1/为2ㄓ文3"],
  ["时间为", "ㄕ十2ㄐ言1/为2"],
  ["为准", "为2ㄓ文3"],
  ["色差", "ㄙㄜ4ㄔㄚ1"],
  ["掺和", "ㄔㄢ1ㄏ我5"],
  ["一个", "ㄧ2ㄍㄜ5"],
  ["今天天气", "ㄐ阴1ㄊ言1ㄊ言1ㄑㄧ4"],
  ["儿化", "ㄦ2ㄏ穵4"],
]);
const CHINESE_PHRASES = [...CHINESE_PHRASE_OVERRIDES.keys()].sort((a, b) => b.length - a.length);

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
 * @param {string} text
 * @returns {string}
 */
function normalize_chinese_numbers(text) {
  return text.replace(/\b\d{1,4}\b/g, (match) => integer_to_chinese(Number(match)));
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
  for (let index = 0; index < tokens.length - 1; index += 1) {
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
  return tokens.join("").replace(/\s+([,.;:!?，。！？；：、])/g, "$1").replace(/\s+/g, " ").trim();
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
    const phonemes = CHINESE_WORD_SEGMENTER
      ? [...CHINESE_WORD_SEGMENTER.segment(textChunk)]
        .filter(({ segment }) => segment.trim().length > 0)
        .map(({ segment }) => phonemize_zh_word(segment))
        .join("/")
      : phonemize_zh_word(textChunk);
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
        return phonemize(section, "a", false);
      }
      return section;
    }),
  );
  return phonemes.join(" ").replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
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
  // 1. Normalize text
  if (norm) {
    text = normalize_text(text);
  }

  if (language === "z") {
    return phonemize_mixed_zh(text);
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

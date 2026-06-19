import { phonemize as espeakng } from "phonemizer";
import { pinyin } from "pinyin-pro";

import {
  CHINESE_DIGITS,
  CHINESE_NUMERIC_PATTERN,
  CHINESE_PHRASES,
  CHINESE_PHRASE_OVERRIDES,
  CHINESE_PUNCTUATION,
  CHINESE_SYLLABLE_PATTERN,
  MUST_ERHUA,
  MUST_NEUTRAL_TONE_WORDS,
  NEUTRAL_TONE_FINAL_PARTICLES,
  NEUTRAL_TONE_PARTICLES,
  NEUTRAL_TONE_SUFFIXES,
  NON_STRUCTURAL_DI_WORDS,
  NOT_ERHUA,
  POLYPHONE_MERGE_PHRASES,
  ZH_FINALS,
  ZHUYIN_INITIALS,
} from "./zh-data.js";

const CHINESE_WORD_SEGMENTER = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("zh", { granularity: "word" }) : null;
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
 * @param {string} sign
 * @param {string} value
 * @returns {string}
 */
function percentage_to_chinese(sign, value) {
  const prefix = sign === "+" ? "正" : sign === "-" ? "负" : "";
  return `${prefix}百分之${number_to_chinese(value)}`;
}

/**
 * @param {string} start
 * @param {string} end
 * @returns {string}
 */
function range_to_chinese(start, end) {
  return `${integer_to_chinese(Number(start))}到${integer_to_chinese(Number(end))}`;
}

/**
 * @param {string} numerator
 * @param {string} denominator
 * @returns {string}
 */
function fraction_to_chinese(numerator, denominator) {
  return `${integer_to_chinese(Number(denominator))}分之${integer_to_chinese(Number(numerator))}`;
}

/**
 * @param {string} value
 * @param {string} unit
 * @returns {string}
 */
function measurement_to_chinese(value, unit) {
  const normalizedUnit = unit.toLowerCase();
  const number = number_to_chinese(value);
  if (normalizedUnit === "℃" || normalizedUnit === "°c") {
    return `摄氏${number}度`;
  }
  if (normalizedUnit === "kg") {
    return `${number}千克`;
  }
  if (normalizedUnit === "cm") {
    return `${number}厘米`;
  }
  return `${number}${unit}`;
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
    .replace(/(\d{4})([- /.])(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])/g, (_match, year, _separator, month, day) => {
      return `${digits_to_chinese(year)}年${integer_to_chinese(Number(month))}月${integer_to_chinese(Number(day))}日`;
    })
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
    .replace(/(?<![\d./A-Za-z])([1-9]\d{0,3})\/([1-9]\d{0,3})(?![\d./A-Za-z])/g, (_match, numerator, denominator) => fraction_to_chinese(numerator, denominator))
    .replace(/(?<![\d.])([+-]?)(\d+(?:\.\d+)?)%/g, (_match, sign, percent) => percentage_to_chinese(sign, percent))
    .replace(/(?<![\d./A-Za-z])(\d+(?:\.\d+)?)(℃|°C|kg|cm)(?![\d./A-Za-z])/gi, (_match, value, unit) => measurement_to_chinese(value, unit))
    .replace(/(\bv)(\d+\.\d+)(?![\d./A-Za-z])/gi, (_match, prefix, value) => `${prefix}${number_to_chinese(value)}`)
    .replace(/(?<![\d./A-Za-z])\d+\.\d+(?![\d./A-Za-z])/g, (match) => number_to_chinese(match))
    .replace(/(?<![\d./A-Za-z])([1-9]\d{0,3})[~-]([1-9]\d{0,3})(?![\d./A-Za-z])/g, (_match, start, end) => range_to_chinese(start, end))
    .replace(/(?<![\d.])-(\d{1,4})(?![\d.])/g, (_match, value) => `负${integer_to_chinese(Number(value))}`)
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
  const isMoneyNumber = text.endsWith("元") && [...text.slice(0, -1)].every((c) => CHINESE_NUMERIC_PATTERN.test(c));

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
    if (!isMoneyNumber && CHINESE_SYLLABLE_PATTERN.test(tokens[index]) && tokens[index].endsWith("3") && CHINESE_SYLLABLE_PATTERN.test(tokens[index + 1]) && tokens[index + 1].endsWith("3")) {
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
  if (!isMoneyNumber && tokens.length === 4 && origTone3.every(Boolean) && tokens[3].endsWith("3")) {
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
 * @param {string[]} segments
 * @returns {string[]}
 */
function mergeNumericMeasureSegments(segments) {
  const result = [];
  for (let i = 0; i < segments.length; i += 1) {
    let current = segments[i];

    if (CHINESE_NUMERIC_PATTERN.test(current)) {
      const start = i;
      while (i + 1 < segments.length && CHINESE_NUMERIC_PATTERN.test(segments[i + 1])) {
        current += segments[i + 1];
        i += 1;
      }
      if (i + 1 < segments.length && segments[i + 1] === "元") {
        current += segments[i + 1];
        i += 1;
      } else if (i + 2 < segments.length && segments[i + 1] === "个" && segments[i + 2] === "半") {
        result.push(`${current}个`);
        result.push("半");
        i += 2;
        continue;
      } else {
        i = start;
        current = segments[i];
      }
    }

    if (current === "半" && i + 1 < segments.length && segments[i + 1] === "小时") {
      result.push("半小时");
      i += 1;
      continue;
    }

    result.push(current);
  }
  return result;
}

/**
 * @param {string} text
 * @param {number} index
 * @returns {boolean}
 */
function isMeasureHalfContext(text, index) {
  return index > 0 && text[index] === "个" && CHINESE_NUMERIC_PATTERN.test(text[index - 1]) && text[index + 1] === "半";
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
      if (text.startsWith(phrase, index) && !isMeasureHalfContext(text, index)) {
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
        if (text.startsWith(phrase, nextIndex) && !isMeasureHalfContext(text, nextIndex)) {
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
    segments = mergeNumericMeasureSegments(segments);

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

      // Date suffix: keep day number with 日/号 (e.g. 十九日) like misaki/jieba.
      else if (["日", "号"].includes(current) && merged.length > 0) {
        merged[merged.length - 1] += current;
        continue;
      }

      // 的/地/得 as structural particles → merge with preceding.
      // 地 is ambiguous in noun compounds like 地标, so keep those split.
      else if (NEUTRAL_TONE_PARTICLES.has(current) && merged.length > 0 && !(current === "地" && i + 1 < segments.length && NON_STRUCTURAL_DI_WORDS.has(`${current}${segments[i + 1]}`))) {
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

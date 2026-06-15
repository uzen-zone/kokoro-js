import path from "path";
import fs from "fs/promises";

export const VOICES = Object.freeze({
  af_maple: { name: "af_maple", language: "en-us", gender: "Female" },
  af_sol: { name: "af_sol", language: "en-us", gender: "Female" },
  bf_vale: { name: "bf_vale", language: "en-gb", gender: "Female" },
  zf_001: { name: "zf_001", language: "zh", gender: "Female" },
  zf_002: { name: "zf_002", language: "zh", gender: "Female" },
  zf_003: { name: "zf_003", language: "zh", gender: "Female" },
  zf_004: { name: "zf_004", language: "zh", gender: "Female" },
  zf_005: { name: "zf_005", language: "zh", gender: "Female" },
  zf_006: { name: "zf_006", language: "zh", gender: "Female" },
  zf_007: { name: "zf_007", language: "zh", gender: "Female" },
  zf_008: { name: "zf_008", language: "zh", gender: "Female" },
  zf_017: { name: "zf_017", language: "zh", gender: "Female" },
  zf_018: { name: "zf_018", language: "zh", gender: "Female" },
  zf_019: { name: "zf_019", language: "zh", gender: "Female" },
  zf_021: { name: "zf_021", language: "zh", gender: "Female" },
  zf_022: { name: "zf_022", language: "zh", gender: "Female" },
  zf_023: { name: "zf_023", language: "zh", gender: "Female" },
  zf_024: { name: "zf_024", language: "zh", gender: "Female" },
  zf_026: { name: "zf_026", language: "zh", gender: "Female" },
  zf_027: { name: "zf_027", language: "zh", gender: "Female" },
  zf_028: { name: "zf_028", language: "zh", gender: "Female" },
  zf_032: { name: "zf_032", language: "zh", gender: "Female" },
  zf_036: { name: "zf_036", language: "zh", gender: "Female" },
  zf_038: { name: "zf_038", language: "zh", gender: "Female" },
  zf_039: { name: "zf_039", language: "zh", gender: "Female" },
  zf_040: { name: "zf_040", language: "zh", gender: "Female" },
  zf_042: { name: "zf_042", language: "zh", gender: "Female" },
  zf_043: { name: "zf_043", language: "zh", gender: "Female" },
  zf_044: { name: "zf_044", language: "zh", gender: "Female" },
  zf_046: { name: "zf_046", language: "zh", gender: "Female" },
  zf_047: { name: "zf_047", language: "zh", gender: "Female" },
  zf_048: { name: "zf_048", language: "zh", gender: "Female" },
  zf_049: { name: "zf_049", language: "zh", gender: "Female" },
  zf_051: { name: "zf_051", language: "zh", gender: "Female" },
  zf_059: { name: "zf_059", language: "zh", gender: "Female" },
  zf_060: { name: "zf_060", language: "zh", gender: "Female" },
  zf_067: { name: "zf_067", language: "zh", gender: "Female" },
  zf_070: { name: "zf_070", language: "zh", gender: "Female" },
  zf_071: { name: "zf_071", language: "zh", gender: "Female" },
  zf_072: { name: "zf_072", language: "zh", gender: "Female" },
  zf_073: { name: "zf_073", language: "zh", gender: "Female" },
  zf_074: { name: "zf_074", language: "zh", gender: "Female" },
  zf_075: { name: "zf_075", language: "zh", gender: "Female" },
  zf_076: { name: "zf_076", language: "zh", gender: "Female" },
  zf_077: { name: "zf_077", language: "zh", gender: "Female" },
  zf_078: { name: "zf_078", language: "zh", gender: "Female" },
  zf_079: { name: "zf_079", language: "zh", gender: "Female" },
  zf_083: { name: "zf_083", language: "zh", gender: "Female" },
  zf_084: { name: "zf_084", language: "zh", gender: "Female" },
  zf_085: { name: "zf_085", language: "zh", gender: "Female" },
  zf_086: { name: "zf_086", language: "zh", gender: "Female" },
  zf_087: { name: "zf_087", language: "zh", gender: "Female" },
  zf_088: { name: "zf_088", language: "zh", gender: "Female" },
  zf_090: { name: "zf_090", language: "zh", gender: "Female" },
  zf_092: { name: "zf_092", language: "zh", gender: "Female" },
  zf_093: { name: "zf_093", language: "zh", gender: "Female" },
  zf_094: { name: "zf_094", language: "zh", gender: "Female" },
  zf_099: { name: "zf_099", language: "zh", gender: "Female" },
  zm_009: { name: "zm_009", language: "zh", gender: "Male" },
  zm_010: { name: "zm_010", language: "zh", gender: "Male" },
  zm_011: { name: "zm_011", language: "zh", gender: "Male" },
  zm_012: { name: "zm_012", language: "zh", gender: "Male" },
  zm_013: { name: "zm_013", language: "zh", gender: "Male" },
  zm_014: { name: "zm_014", language: "zh", gender: "Male" },
  zm_015: { name: "zm_015", language: "zh", gender: "Male" },
  zm_016: { name: "zm_016", language: "zh", gender: "Male" },
  zm_020: { name: "zm_020", language: "zh", gender: "Male" },
  zm_025: { name: "zm_025", language: "zh", gender: "Male" },
  zm_029: { name: "zm_029", language: "zh", gender: "Male" },
  zm_030: { name: "zm_030", language: "zh", gender: "Male" },
  zm_031: { name: "zm_031", language: "zh", gender: "Male" },
  zm_033: { name: "zm_033", language: "zh", gender: "Male" },
  zm_034: { name: "zm_034", language: "zh", gender: "Male" },
  zm_035: { name: "zm_035", language: "zh", gender: "Male" },
  zm_037: { name: "zm_037", language: "zh", gender: "Male" },
  zm_041: { name: "zm_041", language: "zh", gender: "Male" },
  zm_045: { name: "zm_045", language: "zh", gender: "Male" },
  zm_050: { name: "zm_050", language: "zh", gender: "Male" },
  zm_052: { name: "zm_052", language: "zh", gender: "Male" },
  zm_053: { name: "zm_053", language: "zh", gender: "Male" },
  zm_054: { name: "zm_054", language: "zh", gender: "Male" },
  zm_055: { name: "zm_055", language: "zh", gender: "Male" },
  zm_056: { name: "zm_056", language: "zh", gender: "Male" },
  zm_057: { name: "zm_057", language: "zh", gender: "Male" },
  zm_058: { name: "zm_058", language: "zh", gender: "Male" },
  zm_061: { name: "zm_061", language: "zh", gender: "Male" },
  zm_062: { name: "zm_062", language: "zh", gender: "Male" },
  zm_063: { name: "zm_063", language: "zh", gender: "Male" },
  zm_064: { name: "zm_064", language: "zh", gender: "Male" },
  zm_065: { name: "zm_065", language: "zh", gender: "Male" },
  zm_066: { name: "zm_066", language: "zh", gender: "Male" },
  zm_068: { name: "zm_068", language: "zh", gender: "Male" },
  zm_069: { name: "zm_069", language: "zh", gender: "Male" },
  zm_080: { name: "zm_080", language: "zh", gender: "Male" },
  zm_081: { name: "zm_081", language: "zh", gender: "Male" },
  zm_082: { name: "zm_082", language: "zh", gender: "Male" },
  zm_089: { name: "zm_089", language: "zh", gender: "Male" },
  zm_091: { name: "zm_091", language: "zh", gender: "Male" },
  zm_095: { name: "zm_095", language: "zh", gender: "Male" },
  zm_096: { name: "zm_096", language: "zh", gender: "Male" },
  zm_097: { name: "zm_097", language: "zh", gender: "Male" },
  zm_098: { name: "zm_098", language: "zh", gender: "Male" },
  zm_100: { name: "zm_100", language: "zh", gender: "Male" },
});


const VOICE_DATA_PATH = "/kokoro/voices";

/**
 *
 * @param {keyof typeof VOICES} id
 * @returns {Promise<ArrayBufferLike>}
 */
async function getVoiceFile(id) {
  if (fs && Object.hasOwn(fs, 'readFile')) {
    const dirname = typeof __dirname !== "undefined" ? __dirname : import.meta.dirname;
    const file = path.resolve(dirname, `../voices/${id}.bin`);
    const { buffer } = await fs.readFile(file);
    return buffer;
  }

  const url = `${VOICE_DATA_PATH}/${id}.bin`;

  let cache;
  try {
    cache = await caches.open("kokoro-voices");
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      return await cachedResponse.arrayBuffer();
    }
  } catch (e) {
    console.warn("Unable to open cache", e);
  }

  // No cache, or cache failed to open. Fetch the local public voice file.
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load voice data for "${id}" from ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();

  if (cache) {
    try {
      // NOTE: We use `new Response(buffer, ...)` instead of `response.clone()` to handle LFS files
      await cache.put(
        url,
        new Response(buffer, {
          headers: response.headers,
        }),
      );
    } catch (e) {
      console.warn("Unable to cache file", e);
    }
  }

  return buffer;
}

const VOICE_CACHE = new Map();
export async function getVoiceData(voice) {
  if (VOICE_CACHE.has(voice)) {
    return VOICE_CACHE.get(voice);
  }

  const file = await getVoiceFile(voice);
  if (file.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error(`Invalid voice data for "${voice}": byte length ${file.byteLength} is not a multiple of ${Float32Array.BYTES_PER_ELEMENT}.`);
  }
  const buffer = new Float32Array(file);
  VOICE_CACHE.set(voice, buffer);
  return buffer;
}

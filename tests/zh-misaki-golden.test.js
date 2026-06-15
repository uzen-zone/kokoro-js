import { readFileSync } from "fs";
import { describe, expect, test } from "vitest";
import { phonemize } from "../src/phonemize.js";

const corpus = JSON.parse(readFileSync(new URL("./fixtures/zh-misaki-golden.json", import.meta.url), "utf8"));

describe("zh misaki golden corpus", () => {
  for (const sample of corpus) {
    test(sample.text, async () => {
      const actual = await phonemize(sample.text, "z");
      if (sample.status === "match") {
        expect(actual).toBe(sample.py);
      } else {
        expect(actual).toBe(sample.current);
      }
    });
  }
});

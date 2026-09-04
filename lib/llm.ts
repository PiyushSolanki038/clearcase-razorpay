// Single source of truth for all Gemini calls. Per CLAUDE.md: no direct SDK calls elsewhere.
// - Requests JSON output, strips markdown fences before parsing
// - Validates every response with a caller-supplied Zod schema
// - Filesystem-caches by prompt hash (dev-time quota protection)
// - Retries with exponential backoff on 429, max 3 retries, then fails loud

import { GoogleGenAI } from "@google/genai";
import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ZodType } from "zod";

const MODEL = "gemini-2.5-flash";
const CACHE_DIR = path.join(process.cwd(), ".llm-cache");
const MAX_RETRIES = 3;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function promptHash(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

async function readCache(hash: string): Promise<string | null> {
  try {
    return await readFile(path.join(CACHE_DIR, `${hash}.json`), "utf-8");
  } catch {
    return null;
  }
}

async function writeCache(hash: string, raw: string): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, `${hash}.json`), raw, "utf-8");
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("429") || message.toLowerCase().includes("rate limit");
}

async function callGeminiWithRetry(prompt: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty response");
      }
      return text;
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err) && attempt < MAX_RETRIES - 1) {
        await sleep(2 ** attempt * 1000);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Sends `prompt` to Gemini, requests JSON output, validates the parsed result
 * against `schema`. Uses a filesystem cache keyed by prompt hash — same prompt
 * always returns the same cached response during dev.
 */
export async function extractStructured<T>(
  prompt: string,
  schema: ZodType<T>
): Promise<T> {
  const hash = promptHash(prompt);
  const cached = await readCache(hash);
  const raw = cached ?? (await callGeminiWithRetry(prompt));

  if (!cached) {
    await writeCache(hash, raw);
  }

  const stripped = stripMarkdownFences(raw);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripped);
  } catch (err) {
    throw new Error(
      `Gemini response was not valid JSON: ${err instanceof Error ? err.message : String(err)}\nRaw: ${raw}`
    );
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error(`Gemini response failed schema validation: ${result.error.message}`);
  }

  return result.data;
}

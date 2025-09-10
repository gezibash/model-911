import { blake3 } from "@noble/hashes/blake3.js";
import { bytesToHex } from "@noble/hashes/utils";

export interface PromptResponseData {
  stepNumber: number;
  prompt: string;
  rawResponse: string;
  extractedAnswer: string;
  responseTime: number;
}

export function extractAnswerFromResponse(response: string): string | null {
  try {
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.answer || null;
    }

    const parsed = JSON.parse(response.trim());
    return parsed.answer || null;
  } catch {
    return null;
  }
}

export function calculateFingerprint(finalSentence: string): string {
  // Use BLAKE3 with 16-byte output (like original BLAKE2b)
  const hash = blake3(new TextEncoder().encode(finalSentence), { dkLen: 16 });
  return bytesToHex(hash);
}

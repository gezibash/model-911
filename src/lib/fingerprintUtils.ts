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
  // Check for empty response
  if (!response || response.trim() === "") {
    console.warn("Empty response received from model");
    return null;
  }

  try {
    // First try to find JSON in the response
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.answer && typeof parsed.answer === "string") {
        return parsed.answer.trim();
      }
    }

    // Try parsing the entire response as JSON
    const parsed = JSON.parse(response.trim());
    if (parsed.answer && typeof parsed.answer === "string") {
      return parsed.answer.trim();
    }

    console.warn(
      `JSON response missing 'answer' field: ${response.substring(0, 100)}...`,
    );
    return null;
  } catch (error) {
    console.warn(
      `Failed to parse JSON response: "${response.substring(0, 100)}..."`,
    );
    return null;
  }
}

export function calculateFingerprint(finalSentence: string): string {
  // Use BLAKE3 with 16-byte output (like original BLAKE2b)
  const hash = blake3(new TextEncoder().encode(finalSentence), { dkLen: 16 });
  return bytesToHex(hash);
}

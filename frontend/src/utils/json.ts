/**
 * Extracts a JSON string from a markdown code block.
 * If no markdown block is found, it assumes the whole string is JSON.
 * @param str The raw string from the LLM.
 * @returns The cleaned JSON string.
 */
export function extractJson(str: string): string {
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // If no markdown block is found, return the original string, trimmed.
  return str.trim();
}


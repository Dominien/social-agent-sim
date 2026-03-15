import { spawn } from "child_process";

let totalCalls = 0;
let totalTokensEstimated = 0;

export function getLLMStats() {
  return { totalCalls, totalTokensIn: totalTokensEstimated, totalTokensOut: 0 };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Call Claude CLI as a subprocess.
 * Pipes prompt via stdin to avoid shell argument length limits.
 * --max-turns 1 prevents agentic loops.
 */
export async function callClaude(
  prompt: string,
  options?: { model?: string },
): Promise<string> {
  const args = ["-p", "--output-format", "text", "--max-turns", "1"];
  if (options?.model) args.push("--model", options.model);

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      totalCalls++;
      totalTokensEstimated += estimateTokens(prompt) + estimateTokens(stdout);

      if (code !== 0) {
        reject(new Error(`claude exited with code ${code}: ${stderr}`));
        return;
      }

      const result = stdout.trim();
      if (!result) {
        reject(new Error("Empty response from claude CLI"));
        return;
      }

      resolve(result);
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * Call Claude and parse response as JSON.
 * Strips markdown code fences if present, retries once on parse failure.
 */
export async function callClaudeJSON<T>(
  prompt: string,
  options?: { model?: string },
): Promise<T> {
  const raw = await callClaude(prompt, options);

  let jsonStr = raw.trim();
  // Strip markdown code fences
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```[a-z]*\n?/i, "");
    jsonStr = jsonStr.replace(/\n?```\s*$/, "");
  }
  // Also handle case where there's text before the JSON
  const jsonStart = jsonStr.indexOf("{");
  if (jsonStart > 0) {
    jsonStr = jsonStr.substring(jsonStart);
  }
  // Handle trailing text after JSON
  const lastBrace = jsonStr.lastIndexOf("}");
  if (lastBrace >= 0 && lastBrace < jsonStr.length - 1) {
    jsonStr = jsonStr.substring(0, lastBrace + 1);
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Retry once
    const retryPrompt = `The following was supposed to be valid JSON but isn't. Return ONLY the corrected JSON object, no markdown fences or extra text:\n\n${raw}`;
    const retryRaw = await callClaude(retryPrompt, options);

    let retryStr = retryRaw.trim();
    if (retryStr.startsWith("```")) {
      retryStr = retryStr.replace(/^```[a-z]*\n?/i, "");
      retryStr = retryStr.replace(/\n?```\s*$/, "");
    }
    const retryJsonStart = retryStr.indexOf("{");
    if (retryJsonStart > 0) retryStr = retryStr.substring(retryJsonStart);
    const retryLastBrace = retryStr.lastIndexOf("}");
    if (retryLastBrace >= 0) retryStr = retryStr.substring(0, retryLastBrace + 1);

    try {
      return JSON.parse(retryStr) as T;
    } catch (e) {
      throw new Error(
        `Failed to parse JSON after retry.\nOriginal: ${raw}\nRetry: ${retryRaw}\nError: ${e}`,
      );
    }
  }
}

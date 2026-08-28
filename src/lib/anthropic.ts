import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment to use AI features."
    );
  }
  if (!client) {
    // Identity-linked API keys (issued from a Console account tied to an
    // organization, as opposed to a plain workspace API key) require this
    // header on every request or the API rejects it with a 400.
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
    });
  }
  return client;
}

const MODEL = "claude-sonnet-5";

export async function askClaude(params: {
  system?: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getClient();
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 2048,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.includes("anthropic-workspace-id")) {
      throw new Error(
        "This ANTHROPIC_API_KEY is an identity-linked key and needs a workspace ID too. " +
          "In the Anthropic Console, open the workspace this key should act in and copy its ID " +
          "(starts with wksp_), then set ANTHROPIC_WORKSPACE_ID to it alongside ANTHROPIC_API_KEY."
      );
    }
    throw err;
  }
}

/** Ask Claude for strict JSON and parse it, stripping any markdown fencing. */
export async function askClaudeJSON<T>(params: {
  system?: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const raw = await askClaude(params);
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

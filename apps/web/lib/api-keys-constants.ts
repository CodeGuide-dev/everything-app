export const SUPPORTED_PROVIDERS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"] },
  { value: "google", label: "Google", models: ["gemini-pro", "gemini-pro-vision"] },
  { value: "cohere", label: "Cohere", models: ["command-r-plus", "command-r"] },
  { value: "mistral", label: "Mistral", models: ["mistral-large-latest", "mistral-medium-latest"] },
] as const;

import { useQueryState } from "nuqs";

export function useSessionHistory() {
  const [sessionId, setSessionId] = useQueryState("sessionId", {
    defaultValue: null,
    clearOnDefault: true,
  });

  return {
    sessionId,
    setSessionId,
  };
}

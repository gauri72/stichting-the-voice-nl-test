import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch, apiUrl, authHeaders } from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const AiAssistantContext = createContext(null);

export function AiAssistantProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [prebuiltPrompts, setPrebuiltPrompts] = useState([]);
  const [scheduledPrompts, setScheduledPrompts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const openAssistant = useCallback(() => setIsOverlayOpen(true), []);
  const closeAssistant = useCallback(() => setIsOverlayOpen(false), []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  const loadChatHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/ai/chat/history", { headers: authHeaders() });
      setChatHistory(data.sessions || []);
    } catch (err) {
      setError(err.message || "Could not load chat history.");
    }
  }, [isAuthenticated]);

  const openChatSession = useCallback(async (id) => {
    try {
      const data = await apiFetch(`/api/ai/chat/history/${id}`, { headers: authHeaders() });
      setSessionId(data.session.id);
      setMessages(data.session.messages || []);
    } catch (err) {
      setError(err.message || "Could not load this chat.");
    }
  }, []);

  const loadUsage = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/ai/usage", { headers: authHeaders() });
      setUsage(data.usage);
    } catch {
      // non-fatal — quota ring just stays hidden
    }
  }, [isAuthenticated]);

  /**
   * Sends a message and streams the reply. Reads the response body as
   * newline-delimited JSON chunks via a manual fetch + stream reader — native
   * EventSource can't carry the customer's Bearer auth header, so it isn't
   * usable here.
   */
  const sendMessage = useCallback(
    async (text) => {
      setError("");
      const userMessage = { role: "user", content: text, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "", timestamp: new Date().toISOString(), streaming: true }]);
      setStreaming(true);

      try {
        const response = await fetch(apiUrl("/api/ai/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ sessionId, message: text }),
        });

        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "The assistant could not respond.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // last (possibly incomplete) line stays in the buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            const chunk = JSON.parse(line);
            if (chunk.type === "session") {
              setSessionId(chunk.sessionId);
            } else if (chunk.type === "delta") {
              assistantText += chunk.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: assistantText, toolCall: null };
                return next;
              });
            } else if (chunk.type === "tool_call") {
              // Surfaced briefly while a wallet-booking tool is running — the
              // chat bubble shows a "Booking via V.Wallet…" style indicator.
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], toolCall: chunk.tool };
                return next;
              });
            } else if (chunk.type === "wallet_booking") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], walletBooking: chunk.booking, toolCall: null };
                return next;
              });
            } else if (chunk.type === "error") {
              throw new Error(chunk.message);
            }
          }
        }
      } catch (err) {
        setError(err.message || "The assistant could not respond.");
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: err.message || "Something went wrong.", isError: true };
          return next;
        });
      } finally {
        setStreaming(false);
        setMessages((prev) => {
          const next = [...prev];
          if (next.length) next[next.length - 1] = { ...next[next.length - 1], streaming: false };
          return next;
        });
        loadUsage();
      }
    },
    [sessionId, loadUsage]
  );

  const loadPrompts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/ai/prompts", { headers: authHeaders() });
      setSavedPrompts(data.prompts || []);
      setPrebuiltPrompts(data.prebuiltPrompts || []);
    } catch (err) {
      setError(err.message || "Could not load your prompt library.");
    }
  }, [isAuthenticated]);

  const savePrompt = useCallback(async (promptText, category) => {
    const data = await apiFetch("/api/ai/prompts", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ promptText, category }),
    });
    setSavedPrompts((prev) => [data.prompt, ...prev]);
    return data.prompt;
  }, []);

  const toggleFavourite = useCallback(async (id, isFavourite) => {
    const data = await apiFetch(`/api/ai/prompts/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ isFavourite }),
    });
    setSavedPrompts((prev) => prev.map((p) => (p.id === id ? data.prompt : p)));
  }, []);

  const removePrompt = useCallback(async (id) => {
    await apiFetch(`/api/ai/prompts/${id}`, { method: "DELETE", headers: authHeaders() });
    setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const loadSchedules = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/ai/schedule", { headers: authHeaders() });
      setScheduledPrompts(data.schedules || []);
    } catch (err) {
      setError(err.message || "Could not load scheduled prompts.");
    }
  }, [isAuthenticated]);

  const createSchedule = useCallback(async (payload) => {
    const data = await apiFetch("/api/ai/schedule", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    setScheduledPrompts((prev) => [data.schedule, ...prev]);
    return data.schedule;
  }, []);

  const updateSchedule = useCallback(async (id, updates) => {
    const data = await apiFetch(`/api/ai/schedule/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    setScheduledPrompts((prev) => prev.map((s) => (s.id === id ? data.schedule : s)));
    return data.schedule;
  }, []);

  const removeSchedule = useCallback(async (id) => {
    await apiFetch(`/api/ai/schedule/${id}`, { method: "DELETE", headers: authHeaders() });
    setScheduledPrompts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      messages,
      sessionId,
      streaming,
      error,
      setError,
      sendMessage,
      startNewChat,
      chatHistory,
      loadChatHistory,
      openChatSession,
      savedPrompts,
      prebuiltPrompts,
      loadPrompts,
      savePrompt,
      toggleFavourite,
      removePrompt,
      scheduledPrompts,
      loadSchedules,
      createSchedule,
      updateSchedule,
      removeSchedule,
      usage,
      loadUsage,
      isOverlayOpen,
      openAssistant,
      closeAssistant,
    }),
    [
      messages, sessionId, streaming, error, sendMessage, startNewChat,
      chatHistory, loadChatHistory, openChatSession,
      savedPrompts, prebuiltPrompts, loadPrompts, savePrompt, toggleFavourite, removePrompt,
      scheduledPrompts, loadSchedules, createSchedule, updateSchedule, removeSchedule,
      usage, loadUsage, isOverlayOpen, openAssistant, closeAssistant,
    ]
  );

  return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>;
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error("useAiAssistant must be used within AiAssistantProvider");
  }
  return context;
}

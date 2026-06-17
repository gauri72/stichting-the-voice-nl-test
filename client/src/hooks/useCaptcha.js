import { useCallback, useState } from "react";
import { isTurnstileEnabled } from "../utils/captcha.js";

export function useCaptcha({ required = true } = {}) {
  const configured = isTurnstileEnabled();
  const isRequired = required && configured;
  const [token, setTokenState] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const setToken = useCallback((value) => {
    setTokenState(String(value || "").trim());
  }, []);

  const clearToken = useCallback(() => {
    setTokenState("");
  }, []);

  const reset = useCallback(() => {
    setTokenState("");
    setResetKey((current) => current + 1);
  }, []);

  return {
    configured,
    required: isRequired,
    token,
    resetKey,
    setToken,
    clearToken,
    reset
  };
}

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export function useDayMode(): [boolean, () => void] {
  // Always starts as "day" on both server and first client render (matches SSR
  // output) to avoid a hydration mismatch; the saved preference is applied
  // right after mount instead.
  const [isDayMode, setIsDayMode] = useState(true);

  useEffect(() => {
    const saved = Cookies.get("isDayMode");
    if (saved !== undefined) {
      setIsDayMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    Cookies.set("isDayMode", JSON.stringify(isDayMode));
  }, [isDayMode]);

  return [isDayMode, () => setIsDayMode((value) => !value)];
}

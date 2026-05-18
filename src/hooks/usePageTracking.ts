import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "../lib/analytics";

export function usePageTracking() {
  const location = useLocation();
  const enteredAt = useRef(Date.now());
  const prevPath = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (path === prevPath.current) return;

    // Track time spent on previous page
    if (prevPath.current) {
      const timeMs = Date.now() - enteredAt.current;
      trackEvent("page_view", { path: prevPath.current, exit: true, time_ms: timeMs });
    }

    prevPath.current = path;
    enteredAt.current = Date.now();
    trackEvent("page_view", { path });
  }, [location.pathname]);
}

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const timeout = useRef(null);

  const showToast = useCallback(message => {
    window.clearTimeout(timeout.current);
    setToast(message);
    timeout.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => window.clearTimeout(timeout.current), []);
  return { toast, showToast };
}

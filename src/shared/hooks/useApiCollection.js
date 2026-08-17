import { useCallback, useEffect, useRef, useState } from "react";

const initialRequestState = {
  loading: false,
  loaded: false,
  error: null,
};

export function useApiCollection({ enabled, load, errorMessage }) {
  const [items, setItems] = useState([]);
  const [state, setState] = useState(initialRequestState);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return [];

    const currentRequest = ++requestId.current;
    setState(previous => ({ ...previous, loading: true, error: null }));

    try {
      const nextItems = await load();
      if (requestId.current !== currentRequest) return nextItems;
      setItems(nextItems);
      setState({ loading: false, loaded: true, error: null });
      return nextItems;
    } catch (error) {
      if (requestId.current !== currentRequest) return [];
      setState(previous => ({
        loading: false,
        loaded: previous.loaded,
        error: errorMessage(error),
      }));
      return [];
    }
  }, [enabled, errorMessage, load]);

  useEffect(() => {
    if (enabled && !state.loaded && !state.loading && !state.error) refresh();
  }, [enabled, refresh, state.error, state.loaded, state.loading]);

  useEffect(() => () => {
    requestId.current += 1;
  }, []);

  return { items, setItems, state, refresh };
}

export function apiErrorMessage(fallback) {
  return error => {
    if (error?.response?.status === 401) return "Your session is required to load this data.";
    if (error?.response?.status === 403) return "Your role cannot access this data.";
    return fallback;
  };
}

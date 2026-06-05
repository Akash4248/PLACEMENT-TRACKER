import { useCallback, useEffect, useRef, useState } from "react";

export default function useAsync(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const hasLoadedRef = useRef(false);

  const run = useCallback(async () => {
    const isInitialLoad = !hasLoadedRef.current;

    if (isInitialLoad) {
      setLoading(true);
      setError("");
    } else {
      setRefreshing(true);
      setRefreshError("");
    }

    try {
      const result = await loader();
      setData(result);
      hasLoadedRef.current = true;
      setError("");
      setRefreshError("");
      return result;
    } catch (err) {
      const message = err.message || "Unable to load data";

      if (isInitialLoad) {
        setError(message);
      } else {
        setRefreshError(message);
      }

      return null;
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return {
    data,
    error,
    loading,
    refresh: run,
    refreshing,
    refreshError,
    setData,
  };
}

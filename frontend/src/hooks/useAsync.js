import { useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

const normalizePart = (part) => {
  if (part === undefined) return "undefined";
  if (part === null) return "null";
  if (typeof part === "object") return JSON.stringify(part);
  return part;
};

export default function useAsync(loader, deps = []) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["campustrack", loader.toString(), ...deps.map(normalizePart)],
    deps
  );

  const query = useQuery({
    queryKey,
    queryFn: loader,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    error: query.error?.message || "",
    loading: query.isLoading,
    refresh: query.refetch,
    refreshing: query.isFetching && !query.isLoading,
    refreshError: query.isError && !query.isLoading ? query.error?.message || "" : "",
    setData: (updater) => queryClient.setQueryData(queryKey, updater),
  };
}

import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

let hasHandledUnauthorized = false;

async function handleUnauthorized() {
  if (hasHandledUnauthorized) {
    return;
  }
  hasHandledUnauthorized = true;

  if (typeof window !== "undefined") {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userAvatar");
      localStorage.removeItem("isAuthenticated");
      window.location.href = "/auth";
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { throwOnError?: boolean; handle401?: boolean },
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401 && options?.handle401 !== false) {
    await handleUnauthorized();
  }

  if (options?.throwOnError !== false) {
    await throwIfResNotOk(res);
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await apiRequest(
        "GET",
        queryKey.join("/") as string,
        undefined,
        { throwOnError: false },
      );

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ["/api/users/current"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

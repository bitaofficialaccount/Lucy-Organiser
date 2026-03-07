import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useFamilyMembers() {
  return useQuery({
    queryKey: [api.family.getMembers.path],
    queryFn: async () => {
      const res = await fetch(api.family.getMembers.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch family members");
      return api.family.getMembers.responses[200].parse(await res.json());
    },
  });
}

export function useRegisterKid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kidData: any) => {
      const validated = api.auth.registerKid.input.parse(kidData);
      const res = await fetch(api.auth.registerKid.path, {
        method: api.auth.registerKid.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register kid");
      return api.auth.registerKid.responses[201].parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.family.getMembers.path] }),
  });
}

export function useUpdateBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const url = buildUrl(api.family.updateBalance.path, { id });
      const validated = api.family.updateBalance.input.parse({ amount });
      
      const res = await fetch(url, {
        method: api.family.updateBalance.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update balance");
      return api.family.updateBalance.responses[200].parse(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.family.getMembers.path] }),
  });
}

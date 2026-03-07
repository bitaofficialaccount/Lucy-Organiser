import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// --- CHORES ---
export function useChores() {
  return useQuery({
    queryKey: [api.chores.list.path],
    queryFn: async () => {
      const res = await fetch(api.chores.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chores");
      return api.chores.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (choreData: any) => {
      const validated = api.chores.create.input.parse(choreData);
      const res = await fetch(api.chores.create.path, {
        method: api.chores.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create chore");
      return api.chores.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.chores.list.path] }),
  });
}

export function useMarkChoreDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.chores.markDone.path, { id });
      const res = await fetch(url, {
        method: api.chores.markDone.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update chore");
      return api.chores.markDone.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.chores.list.path] }),
  });
}

// --- ALLOWANCE ---
export function useAllowanceRequests() {
  return useQuery({
    queryKey: [api.allowance.list.path],
    queryFn: async () => {
      const res = await fetch(api.allowance.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch allowance requests");
      return api.allowance.list.responses[200].parse(await res.json());
    },
  });
}

export function useRequestAllowance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.allowance.request.input.parse(data);
      const res = await fetch(api.allowance.request.path, {
        method: api.allowance.request.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to request allowance");
      return api.allowance.request.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.allowance.list.path] }),
  });
}

export function useRespondAllowance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      const url = buildUrl(api.allowance.respond.path, { id });
      const validated = api.allowance.respond.input.parse({ status });
      const res = await fetch(url, {
        method: api.allowance.respond.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to respond to allowance request");
      return api.allowance.respond.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.allowance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.family.getMembers.path] });
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] }); // Re-fetch me just in case balance updated
    },
  });
}

// --- APPOINTMENTS ---
export function useAppointments() {
  return useQuery({
    queryKey: [api.appointments.list.path],
    queryFn: async () => {
      const res = await fetch(api.appointments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return api.appointments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.appointments.create.input.parse(data);
      const res = await fetch(api.appointments.create.path, {
        method: api.appointments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create appointment");
      return api.appointments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] }),
  });
}

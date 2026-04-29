import { z } from "zod";
import { 
  insertUserSchema, users, 
  insertChoreSchema, chores, 
  insertAllowanceRequestSchema, allowanceRequests,
  insertMessageSchema, messages,
  insertAppointmentSchema, appointments 
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    registerParent: {
      method: "POST" as const,
      path: "/api/auth/register/parent" as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    registerKid: {
      method: "POST" as const,
      path: "/api/auth/register/kid" as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
        color: z.string(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout" as const,
      responses: {
        200: z.void(),
      }
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    lookup: {
      method: "GET" as const,
      path: "/api/auth/lookup/:username" as const,
      responses: {
        200: z.object({
          username: z.string(),
          color: z.string().nullable(),
          role: z.string(),
        }),
        404: errorSchemas.notFound,
      }
    }
  },
  family: {
    getMembers: {
      method: "GET" as const,
      path: "/api/family/members" as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    updateBalance: {
      method: "PATCH" as const,
      path: "/api/family/members/:id/balance" as const,
      input: z.object({
        amount: z.number(), 
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  chores: {
    list: {
      method: "GET" as const,
      path: "/api/chores" as const,
      responses: {
        200: z.array(z.custom<typeof chores.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/chores" as const,
      input: z.object({
        title: z.string(),
        kidId: z.number(),
      }),
      responses: {
        201: z.custom<typeof chores.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    markDone: {
      method: "PATCH" as const,
      path: "/api/chores/:id/done" as const,
      responses: {
        200: z.custom<typeof chores.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  allowance: {
    list: {
      method: "GET" as const,
      path: "/api/allowance/requests" as const,
      responses: {
        200: z.array(z.custom<typeof allowanceRequests.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    request: {
      method: "POST" as const,
      path: "/api/allowance/requests" as const,
      input: z.object({
        amount: z.number(),
      }),
      responses: {
        201: z.custom<typeof allowanceRequests.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    respond: {
      method: "PATCH" as const,
      path: "/api/allowance/requests/:id" as const,
      input: z.object({
        status: z.enum(["approved", "rejected"]),
      }),
      responses: {
        200: z.custom<typeof allowanceRequests.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/messages/:otherId" as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    send: {
      method: "POST" as const,
      path: "/api/messages" as const,
      input: z.object({
        receiverId: z.number(),
        content: z.string(),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  appointments: {
    list: {
      method: "GET" as const,
      path: "/api/appointments" as const,
      responses: {
        200: z.array(z.custom<typeof appointments.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/appointments" as const,
      input: z.object({
        title: z.string(),
        date: z.string(),
      }),
      responses: {
        201: z.custom<typeof appointments.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  send: {
    signal: z.object({ receiverId: z.number(), signalData: z.any() }),
  },
  receive: {
    signal: z.object({ senderId: z.number(), signalData: z.any() }),
  }
};

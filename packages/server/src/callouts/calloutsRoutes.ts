import type { FastifyInstance, FastifyReply } from "fastify";
import { type CalloutPacks, MAX_PACK_BYTES, PackError } from "./packs.ts";

const STATUS = { invalid: 400, missing: 404, unavailable: 409 } as const;

async function attempt<T>(reply: FastifyReply, change: () => T): Promise<T | FastifyReply> {
  try {
    return change();
  } catch (error) {
    if (error instanceof PackError) {
      return reply.code(STATUS[error.reason]).send({ error: error.message });
    }
    throw error;
  }
}

export function registerCallouts(app: FastifyInstance, packs: CalloutPacks) {
  app.get("/api/callouts", async (_request, reply) =>
    reply.header("cache-control", "no-cache").send(packs.pack()),
  );

  app.get<{ Params: { id: string; file: string } }>(
    "/api/callouts/:id/:file",
    async (request, reply) => {
      const file = packs.file(request.params.id, request.params.file);
      if (!file) return reply.code(404).send({ error: "no such file" });
      return reply
        .type(file.type)
        .header("cache-control", "public, max-age=31536000, immutable")
        .send(file.data);
    },
  );

  app.get("/api/admin/callouts", async () => packs.admin());

  app.register(async (zips) => {
    zips.addContentTypeParser(
      ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
      { parseAs: "buffer", bodyLimit: MAX_PACK_BYTES },
      (_request, body, done) => done(null, body),
    );
    zips.post<{ Querystring: { name?: string }; Body: Buffer }>(
      "/api/admin/callouts",
      async (request, reply) =>
        attempt(reply, () =>
          reply.code(201).send(packs.add(request.query.name ?? "", request.body)),
        ),
    );
  });

  app.put<{ Body: { id?: unknown } }>("/api/admin/callouts/active", async (request, reply) =>
    attempt(reply, () => {
      const id = request.body?.id;
      if (id !== null && typeof id !== "string") {
        throw new PackError("Choose a pack, or null for the default voice.", "invalid");
      }
      packs.activate(id);
      return packs.admin();
    }),
  );

  app.delete<{ Params: { id: string } }>("/api/admin/callouts/:id", async (request, reply) =>
    attempt(reply, () => {
      packs.remove(request.params.id);
      return packs.admin();
    }),
  );
}

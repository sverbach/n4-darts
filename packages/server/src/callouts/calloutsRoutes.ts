import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { ActivePackInput } from "../api.ts";
import { FileBody, parse, TextIdParams } from "../parse.ts";
import { type CalloutPacks, MAX_PACK_BYTES, PackError } from "./packs.ts";

const FileParams = z.object({ id: z.string(), file: z.string() });
/** The uploaded file's name, which the pack is named after. */
const UploadQuery = z.object({ name: z.string().default("") });

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

  app.get("/api/callouts/:id/:file", async (request, reply) => {
    const { id, file: name } = parse(FileParams, request.params);
    const file = packs.file(id, name);
    if (!file) return reply.code(404).send({ error: "no such file" });
    return reply
      .type(file.type)
      .header("cache-control", "public, max-age=31536000, immutable")
      .send(file.data);
  });

  app.get("/api/admin/callouts", async () => packs.admin());

  app.register(async (zips) => {
    zips.addContentTypeParser(
      ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
      { parseAs: "buffer", bodyLimit: MAX_PACK_BYTES },
      (_request, body, done) => done(null, body),
    );
    zips.post("/api/admin/callouts", async (request, reply) => {
      const { name } = parse(UploadQuery, request.query);
      const zip = parse(FileBody, request.body);
      return attempt(reply, () => reply.code(201).send(packs.add(name, zip)));
    });
  });

  app.put("/api/admin/callouts/active", async (request, reply) => {
    const { id } = parse(ActivePackInput, request.body);
    return attempt(reply, () => {
      packs.activate(id);
      return packs.admin();
    });
  });

  app.delete("/api/admin/callouts/:id", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    return attempt(reply, () => {
      packs.remove(id);
      return packs.admin();
    });
  });
}

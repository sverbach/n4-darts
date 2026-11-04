// Reading a request's body, params or query string against a schema from api.ts. What doesn't fit
// throws, and app.ts answers it with a 400.

import { z } from "zod";

const english = z.locales.en().localeError;

const withField: z.core.$ZodErrorMap = (issue) => {
  const text = english(issue);
  const message = typeof text === "string" ? text : text?.message;
  return issue.path?.length && message ? `${issue.path.join(".")}: ${message}` : message;
};

/** The value, typed by its schema; throws if it doesn't fit. */
export function parse<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  return schema.parse(value, { error: withField });
}

/** Why a request was refused, if `error` is from `parse`. */
export function requestProblem(error: unknown): string | null {
  if (!(error instanceof z.ZodError)) return null;
  return error.issues[0]?.message ?? "invalid request";
}

/** A numeric id in the path, e.g. a station's. */
export const IdParams = z.object({ id: z.coerce.number().int() });

/** A text id in the path, e.g. a match's. */
export const TextIdParams = z.object({ id: z.string().min(1) });

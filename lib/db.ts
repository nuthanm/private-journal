import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazy initialization: don't read process.env at module-load time, because
// `next build` evaluates this module without a DATABASE_URL set in CI.
let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the Neon connection string."
    );
  }
  _sql = neon(url);
  return _sql;
}

// Proxy that defers connection until first use. This is what API routes
// import — calling `sql\`SELECT ...\`` works exactly the same as before.
export const sql = new Proxy(
  function () {} as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, thisArg, args: unknown[]) {
      const fn = getSql();
      // The neon driver is a tagged template function; forward the args.
      return (fn as unknown as (...a: unknown[]) => unknown).apply(thisArg, args);
    },
    get(_target, prop) {
      const fn = getSql();
      return (fn as unknown as Record<string, unknown>)[prop as string];
    },
  }
);

// Convenience type for query rows
export type Row = Record<string, unknown>;

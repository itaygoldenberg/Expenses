import postgres from 'postgres'

let sql: postgres.Sql | null = null

/**
 * Server-only Postgres connection (restricted app_backend user, through the
 * Supabase transaction pooler). Must never be imported from browser code.
 */
export function getDb(): postgres.Sql {
  if (sql) return sql
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL environment variable')
  sql = postgres(url, {
    ssl: 'require',
    prepare: false, // required by the transaction pooler (port 6543)
    // Supabase's pooler (Supavisor) hangs on pipelined queries: answers never arrive.
    // Send one query at a time per connection (see postgres.js README, "PgBouncer").
    max_pipeline: 1,
    max: 1, // serverless: one connection per function instance
    idle_timeout: 20,
    connect_timeout: 10,
    // Safety net: a pooler that stops answering rejects instead of hanging forever
    query_timeout: 10,
    queue_timeout: 15,
  })
  return sql
}

/** True for database constraint violations (SQLSTATE class 23). */
export function isConstraintViolation(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code
  return typeof code === 'string' && code.startsWith('23')
}

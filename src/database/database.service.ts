// "Pool" is the class from the "pg" package that manages a GROUP of
// reusable connections to Postgres (not just a single connection). This matters because:
// the API will receive multiple concurrent requests (multiple users at
// the same time), and opening/closing a new DB connection for every
// request would be very slow (the TCP+SSL handshake with Neon takes time).
// The Pool maintains a set of already-open connections, automatically
// lending and reclaiming them as queries require them.
//
// "QueryResult" and "QueryResultRow" are TYPES (not classes with logic,
// just data shapes) used so that TypeScript knows the structure of a
// query result.
import { Pool, QueryResult, QueryResultRow } from 'pg';

// OnModuleDestroy es una INTERFAZ de NestJS. Una interfaz en TypeScript
// es un "contrato": si una clase dice "implements OnModuleDestroy", se
// está comprometiendo a tener un método llamado onModuleDestroy(). Nest
// automáticamente llama ese método cuando la aplicación se está cerrando
// (ej. al hacer Ctrl+C, o cuando Render reinicia el contenedor) — es
// la oportunidad de cerrar las conexiones del Pool ordenadamente en
// vez de dejarlas colgadas.
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  // "private readonly pool: Pool" declares a class property of
  // type Pool that is assigned only once (in the constructor) and never
  // reassigned afterwards.
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      // connectionString: the full URL to connect to Neon
      connectionString: process.env.DATABASE_URL,

      // Neon requires SSL/TLS (encrypted) connections. "rejectUnauthorized:
      // false" tells the driver not to validate the certificate chain
      // against a local certificate authority—this is the standard
      // configuration for connecting to managed Postgres providers
      // like Neon/Supabase from a Node client, since they use valid
      // certificates, but Node's default strict validation sometimes
      // fails to recognize the full chain.
      ssl: { rejectUnauthorized: false },
    });
  }

  // This is a GENERIC method: `<T extends QueryResultRow = any>` is
  // a type parameter. This means that whoever CALLS this method
  // can specify, "I expect the returned rows to have this
  // specific shape" (e.g., `query<{ id: number; email: string }>(...)`),
  // and TypeScript will provide autocompletion and type checking for
  // the result. If nothing is specified, it defaults to `any` (no type checking).
  //
  // `params?: any[]` — the `?` indicates that this parameter is OPTIONAL (a
  // query like an unfiltered SELECT does not require parameters).
  //
  // `Promise<QueryResult<T>>` is the return type: a Promise that,
  // when resolved, yields a `QueryResult` containing rows of type `T`.
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    // this.pool.query() borrows a connection from the pool, executes the
    // query, and automatically returns it to the pool when finished—all
    // of this happens automatically; it is not handled manually.
    return this.pool.query<T>(text, params);
  }

  // This method is automatically called when the application shuts down (thanks
  // to "implements OnModuleDestroy" above). pool.end() gracefully closes all
  // open connections, preventing "zombie" connections in Neon.
  async onModuleDestroy() {
    // Pause the application shutdown sequence until pool.end() successfully
    // completes its work or fails.
    await this.pool.end();
  }
}
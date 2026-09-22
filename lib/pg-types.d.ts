declare module 'pg' {
  export class Pool {
    constructor(config?: unknown);
    query(
      sql: string,
      params?: unknown[]
    ): Promise<{ rowCount: number | null; rows: Array<Record<string, unknown>> }>;
  }
}

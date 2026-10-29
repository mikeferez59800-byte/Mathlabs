/*
 * Minimal in-memory stand-in for a Cloudflare D1 binding, built on Node's built-in SQLite (Node 22+).
 * Same calls as D1: prepare().bind().first()/all()/run(), batch() (one transaction) and exec().
 * It also counts queries and written rows so the tests can check the free-plan budgets.
 */
import { DatabaseSync } from 'node:sqlite';

export function createD1() {
  const db = new DatabaseSync(':memory:');
  const stats = { queries: 0, rowsWritten: 0 };
  const norm = (args) => args.map((a) => (a === undefined ? null : typeof a === 'boolean' ? Number(a) : a));
  class Stmt {
    constructor(sql, args = []) { this.sql = sql; this.args = args; }
    bind(...args) { return new Stmt(this.sql, norm(args)); }
    _exec(mode) {
      stats.queries++;
      const st = db.prepare(this.sql);
      if (mode === 'run') {
        const r = st.run(...this.args);
        stats.rowsWritten += Number(r.changes) || 0;
        return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
      }
      const rows = st.all(...this.args).map((r) => ({ ...r }));
      if (/^\s*(INSERT|UPDATE|DELETE)/i.test(this.sql)) stats.rowsWritten += rows.length || 1;
      return mode === 'first' ? (rows[0] || null) : { success: true, results: rows, meta: {} };
    }
    async first(col) { const r = this._exec('first'); return col && r ? r[col] : r; }
    async all() { return this._exec('all'); }
    async run() { return this._exec(/RETURNING/i.test(this.sql) ? 'all' : 'run'); }
  }
  return {
    stats,
    raw: db,
    prepare: (sql) => new Stmt(sql),
    async batch(stmts) {
      db.exec('BEGIN');
      try {
        const out = stmts.map((s) => s._exec(/^\s*(SELECT|WITH)/i.test(s.sql) ? 'all' : 'run'));
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    async exec(sql) { db.exec(sql); return { count: 1 }; }
  };
}

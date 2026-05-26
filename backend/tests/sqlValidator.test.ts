import { validateSQL } from '../src/middleware/sqlValidator';

describe('SQL Validator', () => {
  // ── Safe queries ──────────────────────────────────────────

  it('allows basic SELECT', () => {
    const result = validateSQL('SELECT * FROM users LIMIT 10');
    expect(result.isSafe).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('allows SELECT with WHERE and GROUP BY', () => {
    const result = validateSQL(
      'SELECT region, COUNT(*) AS cnt FROM sales WHERE year = 2024 GROUP BY region ORDER BY cnt DESC LIMIT 20'
    );
    expect(result.isSafe).toBe(true);
  });

  it('allows WITH (CTE)', () => {
    const result = validateSQL(
      'WITH top AS (SELECT * FROM orders LIMIT 5) SELECT * FROM top'
    );
    expect(result.isSafe).toBe(true);
  });

  // ── Blocked queries ───────────────────────────────────────

  it('blocks DROP TABLE', () => {
    const result = validateSQL('DROP TABLE users');
    expect(result.isSafe).toBe(false);
    expect(result.errors.some((e) => e.includes('DROP'))).toBe(true);
  });

  it('blocks DELETE', () => {
    const result = validateSQL('DELETE FROM users WHERE id = 1');
    expect(result.isSafe).toBe(false);
    expect(result.errors.some((e) => e.includes('DELETE'))).toBe(true);
  });

  it('blocks INSERT', () => {
    const result = validateSQL("INSERT INTO users VALUES ('hacker', 'pwnd')");
    expect(result.isSafe).toBe(false);
  });

  it('blocks UPDATE', () => {
    const result = validateSQL("UPDATE users SET password = 'x'");
    expect(result.isSafe).toBe(false);
  });

  it('blocks ALTER TABLE', () => {
    const result = validateSQL('ALTER TABLE users ADD COLUMN evil TEXT');
    expect(result.isSafe).toBe(false);
  });

  it('blocks EXEC', () => {
    const result = validateSQL('EXEC xp_cmdshell(\'dir\')');
    expect(result.isSafe).toBe(false);
  });

  it('blocks statement not starting with SELECT', () => {
    const result = validateSQL('PRAGMA table_info(users)');
    expect(result.isSafe).toBe(false);
  });

  // ── Injection patterns ────────────────────────────────────

  it('blocks stacked query injection', () => {
    const result = validateSQL('SELECT * FROM users; DROP TABLE users');
    expect(result.isSafe).toBe(false);
  });

  it('blocks SQL comment injection', () => {
    const result = validateSQL("SELECT * FROM users WHERE id = 1 -- comment");
    expect(result.isSafe).toBe(false);
  });

  // ── Warnings ──────────────────────────────────────────────

  it('warns on missing LIMIT', () => {
    const result = validateSQL('SELECT * FROM large_table');
    expect(result.isSafe).toBe(true);
    expect(result.warnings.some((w) => w.includes('LIMIT'))).toBe(true);
  });

  it('normalizes whitespace', () => {
    const result = validateSQL('SELECT    *   FROM   users   LIMIT   10');
    expect(result.normalizedSQL).toBe('SELECT * FROM users LIMIT 10');
  });

  // ── Edge cases ────────────────────────────────────────────

  it('handles empty string', () => {
    const result = validateSQL('');
    expect(result.isValid).toBe(false);
  });

  it('does not block "delete" inside string literal', () => {
    // "delete" as a column value in a WHERE clause — tricky
    // Our sanitizer removes string literals first
    const result = validateSQL("SELECT * FROM logs WHERE action = 'delete' LIMIT 10");
    // After removing literals: SELECT * FROM logs WHERE action = '' LIMIT 10
    // 'delete' is a literal value, not a keyword here
    expect(result.isSafe).toBe(true);
  });
});

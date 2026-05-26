import { SQLValidationResult } from '../types';

// ── Blocked keywords (case-insensitive) ───────────────────────
const BLOCKED_KEYWORDS = [
  'DROP',
  'DELETE',
  'INSERT',
  'UPDATE',
  'ALTER',
  'CREATE',
  'EXEC',
  'EXECUTE',
  'PRAGMA',
  'ATTACH',
  'DETACH',
  'LOAD',
  'IMPORT',
  'COPY',
  'TRUNCATE',
  'REPLACE',
  'MERGE',
  'CALL',
  'GRANT',
  'REVOKE',
];

// ── Allowed top-level statements ──────────────────────────────
const ALLOWED_STARTS = ['SELECT', 'WITH', 'EXPLAIN'];

export function validateSQL(sql: string): SQLValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sql || typeof sql !== 'string') {
    return {
      isValid: false,
      isSafe: false,
      normalizedSQL: '',
      errors: ['SQL is empty or not a string'],
      warnings: [],
    };
  }

  // Normalize: collapse whitespace, trim
  const normalized = sql.replace(/\s+/g, ' ').trim();

  // Remove string literals before keyword scanning to avoid false positives
  const withoutStrings = normalized.replace(/'([^']|'')*'/g, "''");

  // Check for blocked keywords
  const upperSQL = withoutStrings.toUpperCase();
  for (const kw of BLOCKED_KEYWORDS) {
    // Match whole words only
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(upperSQL)) {
      errors.push(`Blocked keyword detected: ${kw}`);
    }
  }

  // Must start with an allowed statement
  const firstWord = normalized.trim().split(/\s+/)[0].toUpperCase();
  if (!ALLOWED_STARTS.includes(firstWord)) {
    errors.push(
      `Statement must start with: ${ALLOWED_STARTS.join(', ')}. Got: ${firstWord}`
    );
  }

  // Warn about potentially expensive operations
  if (!/\bLIMIT\b/i.test(normalized)) {
    warnings.push('No LIMIT clause — query may return many rows');
  }

  if (/\bUNION\s+ALL\b/i.test(normalized)) {
    warnings.push('UNION ALL detected — verify this is intentional');
  }

  // Detect SQL injection patterns
  const injectionPatterns = [
    /;\s*(SELECT|DROP|INSERT|UPDATE|DELETE)/i,
    /--[^\n]*/,
    /\/\*.*?\*\//s,
    /\bXP_\w+/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(normalized)) {
      errors.push(`Potential SQL injection pattern detected: ${pattern.toString()}`);
    }
  }

  const isSafe = errors.length === 0;
  const isValid = isSafe; // For now, validity = safety; could add syntax checks

  return {
    isValid,
    isSafe,
    normalizedSQL: normalized,
    errors,
    warnings,
  };
}

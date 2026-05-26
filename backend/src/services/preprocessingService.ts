import {
  ColumnSchema,
  ColumnType,
  QualityIssue,
  QualityReport,
} from '../types';

// ── Preprocessing Pipeline ────────────────────────────────────

export interface ParsedData {
  headers: string[];
  rows: unknown[][];
}

export class PreprocessingService {
  /**
   * Full preprocessing pipeline.
   * Steps: schema inference → issue detection → quality score
   */
  static analyze(data: ParsedData): {
    schema: ColumnSchema[];
    report: QualityReport;
  } {
    const { headers, rows } = data;
    const schema = PreprocessingService.inferSchema(headers, rows);
    const issues = PreprocessingService.detectIssues(headers, rows, schema);
    const score = PreprocessingService.computeScore(rows.length, issues);
    const suggestions = PreprocessingService.buildSuggestions(issues, schema);

    const report: QualityReport = {
      score,
      totalRows: rows.length,
      totalColumns: headers.length,
      issues,
      suggestions,
    };

    return { schema, report };
  }

  // ── Schema Inference ──────────────────────────────────────

  static inferSchema(headers: string[], rows: unknown[][]): ColumnSchema[] {
    return headers.map((name, colIdx) => {
      const values = rows
        .map((r) => (r as unknown[])[colIdx])
        .filter((v) => v !== null && v !== undefined && v !== '');

      const type = PreprocessingService.inferType(values);
      const nullable = values.length < rows.length;
      const uniqueSet = new Set(values.map(String));

      return {
        name,
        type,
        nullable,
        uniqueCount: uniqueSet.size,
        sampleValues: [...uniqueSet].slice(0, 5),
      } as ColumnSchema;
    });
  }

  static inferType(values: unknown[]): ColumnType {
    if (values.length === 0) return 'unknown';

    const sample = values.slice(0, 500);

    const allNumbers = sample.every((v) => v !== '' && !isNaN(Number(v)));
    if (allNumbers) return 'number';

    const dateRe = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;
    const allDates = sample.every((v) => dateRe.test(String(v)));
    if (allDates) return 'date';

    const boolSet = new Set(['true', 'false', '0', '1', 'yes', 'no']);
    const allBool = sample.every((v) => boolSet.has(String(v).toLowerCase()));
    if (allBool) return 'boolean';

    return 'string';
  }

  // ── Issue Detection ───────────────────────────────────────

  static detectIssues(
    headers: string[],
    rows: unknown[][],
    schema: ColumnSchema[]
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const totalRows = rows.length;

    // 1. Missing values per column
    headers.forEach((col, colIdx) => {
      const missing = rows.filter((r) => {
        const v = (r as unknown[])[colIdx];
        return v === null || v === undefined || v === '';
      }).length;

      if (missing > 0) {
        issues.push({
          type: 'missing_values',
          column: col,
          count: missing,
          percentage: Math.round((missing / totalRows) * 100),
          description: `Column "${col}" has ${missing} missing values (${Math.round((missing / totalRows) * 100)}%)`,
        });
      }
    });

    // 2. Duplicate rows
    const rowStrings = rows.map((r) => JSON.stringify(r));
    const dupCount = rowStrings.length - new Set(rowStrings).size;
    if (dupCount > 0) {
      issues.push({
        type: 'duplicates',
        count: dupCount,
        percentage: Math.round((dupCount / totalRows) * 100),
        description: `${dupCount} duplicate rows detected`,
      });
    }

    // 3. Empty columns
    schema.forEach((col) => {
      if (col.type === 'unknown') {
        issues.push({
          type: 'empty_column',
          column: col.name,
          count: totalRows,
          percentage: 100,
          description: `Column "${col.name}" appears to be completely empty`,
        });
      }
    });

    // 4. Outliers (numeric columns, simple IQR method)
    schema
      .filter((c) => c.type === 'number')
      .forEach((col, i) => {
        const colIdx = headers.indexOf(col.name);
        const nums = rows
          .map((r) => Number((r as unknown[])[colIdx]))
          .filter((n) => !isNaN(n));

        if (nums.length < 4) return;

        nums.sort((a, b) => a - b);
        const q1 = nums[Math.floor(nums.length * 0.25)];
        const q3 = nums[Math.floor(nums.length * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;

        const outliers = nums.filter((n) => n < lower || n > upper).length;
        if (outliers > 0) {
          issues.push({
            type: 'outliers',
            column: col.name,
            count: outliers,
            percentage: Math.round((outliers / nums.length) * 100),
            description: `Column "${col.name}" has ${outliers} potential outliers (IQR method)`,
          });
        }
      });

    return issues;
  }

  // ── Quality Score ─────────────────────────────────────────

  static computeScore(totalRows: number, issues: QualityIssue[]): number {
    if (totalRows === 0) return 0;

    let penalty = 0;

    for (const issue of issues) {
      switch (issue.type) {
        case 'missing_values':
          penalty += issue.percentage * 0.4;
          break;
        case 'duplicates':
          penalty += issue.percentage * 0.3;
          break;
        case 'empty_column':
          penalty += 5;
          break;
        case 'outliers':
          penalty += issue.percentage * 0.1;
          break;
        case 'type_mismatch':
          penalty += 10;
          break;
      }
    }

    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  // ── Suggestions ───────────────────────────────────────────

  static buildSuggestions(issues: QualityIssue[], schema: ColumnSchema[]): string[] {
    const suggestions: string[] = [];

    const missingCols = issues.filter((i) => i.type === 'missing_values');
    if (missingCols.length > 0) {
      const cols = missingCols.map((i) => i.column).join(', ');
      suggestions.push(
        `Consider filling missing values in: ${cols}. Use /fix to apply median/mode imputation.`
      );
    }

    const hasDuplicates = issues.some((i) => i.type === 'duplicates');
    if (hasDuplicates) {
      suggestions.push('Duplicate rows detected. Use /fix to remove duplicates.');
    }

    const numericCols = schema.filter((c) => c.type === 'number');
    if (numericCols.length > 0) {
      suggestions.push(
        `You have ${numericCols.length} numeric column(s). Try asking: "Show average ${numericCols[0]?.name}" or "Plot ${numericCols[0]?.name} distribution".`
      );
    }

    if (schema.some((c) => c.type === 'date')) {
      suggestions.push('Date columns detected. Try: "Show trends over time" or "Group by month".');
    }

    return suggestions;
  }
}

import { PreprocessingService } from '../src/services/preprocessingService';

describe('PreprocessingService', () => {
  const headers = ['name', 'age', 'salary', 'joined'];
  const rows = [
    ['Alice', '30', '50000', '2020-01-15'],
    ['Bob', '25', '45000', '2019-06-01'],
    ['Charlie', '35', '75000', '2018-03-20'],
    ['Alice', '30', '50000', '2020-01-15'], // duplicate
    ['Eve', '', '60000', '2021-07-10'],     // missing age
    ['Frank', '28', '', '2022-02-28'],       // missing salary
  ];

  describe('inferType', () => {
    it('detects number type', () => {
      expect(PreprocessingService.inferType(['1', '2', '3', '4.5'])).toBe('number');
    });

    it('detects string type', () => {
      expect(PreprocessingService.inferType(['Alice', 'Bob', 'Charlie'])).toBe('string');
    });

    it('detects date type', () => {
      expect(
        PreprocessingService.inferType(['2024-01-01', '2024-06-15', '2023-12-31'])
      ).toBe('date');
    });

    it('detects boolean type', () => {
      expect(PreprocessingService.inferType(['true', 'false', 'true'])).toBe('boolean');
    });

    it('returns unknown for empty array', () => {
      expect(PreprocessingService.inferType([])).toBe('unknown');
    });
  });

  describe('inferSchema', () => {
    it('infers correct types for all columns', () => {
      const schema = PreprocessingService.inferSchema(headers, rows);
      expect(schema[0].name).toBe('name');
      expect(schema[0].type).toBe('string');
      expect(schema[1].name).toBe('age');
      expect(schema[1].type).toBe('number');
      expect(schema[3].name).toBe('joined');
      expect(schema[3].type).toBe('date');
    });

    it('marks nullable columns correctly', () => {
      const schema = PreprocessingService.inferSchema(headers, rows);
      const ageCol = schema.find((c) => c.name === 'age');
      expect(ageCol?.nullable).toBe(true); // Eve has no age
    });
  });

  describe('detectIssues', () => {
    it('detects missing values', () => {
      const schema = PreprocessingService.inferSchema(headers, rows);
      const issues = PreprocessingService.detectIssues(headers, rows, schema);
      const missing = issues.filter((i) => i.type === 'missing_values');
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.some((i) => i.column === 'age')).toBe(true);
    });

    it('detects duplicate rows', () => {
      const schema = PreprocessingService.inferSchema(headers, rows);
      const issues = PreprocessingService.detectIssues(headers, rows, schema);
      const dups = issues.filter((i) => i.type === 'duplicates');
      expect(dups.length).toBe(1);
      expect(dups[0].count).toBe(1);
    });

    it('detects outliers in numeric columns', () => {
      const h = ['value'];
      const r = [
        ['10'], ['11'], ['10'], ['12'], ['10'], ['10'],
        ['11'], ['10'], ['9'], ['10'], ['10'], ['1000'], // outlier
      ];
      const schema = PreprocessingService.inferSchema(h, r);
      const issues = PreprocessingService.detectIssues(h, r, schema);
      const outliers = issues.filter((i) => i.type === 'outliers');
      expect(outliers.length).toBeGreaterThan(0);
    });
  });

  describe('computeScore', () => {
    it('returns 100 for clean data', () => {
      const score = PreprocessingService.computeScore(100, []);
      expect(score).toBe(100);
    });

    it('returns a low score for very poor data', () => {
      // 100% missing (penalty=40) + 100% duplicates (penalty=30) = 70 penalty → score=30
      const issues = [
        { type: 'missing_values' as const, count: 100, percentage: 100, column: 'x', description: '' },
        { type: 'duplicates' as const, count: 100, percentage: 100, description: '' },
      ];
      const score = PreprocessingService.computeScore(100, issues);
      expect(score).toBeLessThanOrEqual(35);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('penalizes missing values more than outliers', () => {
      const missingIssue = [
        { type: 'missing_values' as const, count: 50, percentage: 50, column: 'x', description: '' },
      ];
      const outlierIssue = [
        { type: 'outliers' as const, count: 50, percentage: 50, column: 'x', description: '' },
      ];
      const scoreWithMissing = PreprocessingService.computeScore(100, missingIssue);
      const scoreWithOutliers = PreprocessingService.computeScore(100, outlierIssue);
      expect(scoreWithMissing).toBeLessThan(scoreWithOutliers);
    });
  });

  describe('full analyze pipeline', () => {
    it('returns schema and report together', () => {
      const { schema, report } = PreprocessingService.analyze({ headers, rows });
      expect(schema).toHaveLength(headers.length);
      expect(report.totalRows).toBe(rows.length);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.issues)).toBe(true);
      expect(Array.isArray(report.suggestions)).toBe(true);
    });
  });
});

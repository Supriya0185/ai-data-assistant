# DataPilot — Project Charter

## What We Are Building
A universal AI data assistant chatbot.
Users can upload CSV, Excel, PDF, images, connect to GitHub, Jira,
databases, or any API — then chat with that data in plain English.

## Core Rules (Never Break These)
- NEVER execute DROP, DELETE, UPDATE, INSERT SQL
- ALWAYS validate SQL before executing
- ALWAYS show quality score after data ingestion
- NEVER store raw credentials in code (use .env)
- ALWAYS handle errors gracefully (never crash the server)
- ALWAYS write tests for new features

## Architecture
- Frontend: React 18 + TypeScript + TailwindCSS + Zustand + Recharts
- Backend: Node.js + Express + TypeScript
- AI: Anthropic Claude API (claude-3-5-sonnet-20241022)
- In-memory DB: DuckDB (fast queries on loaded data)
- Persistent DB: PostgreSQL (user data, history)
- MCP: @modelcontextprotocol/sdk (third-party connectors)

## Data Flow
User Input → Chat Engine → Input Handler → Preprocessing → DuckDB → Analysis → Output

## Input Handlers (build in this order)
1. CSV Handler (Week 1) - START HERE
2. Excel Handler (Week 2)
3. PDF Handler (Week 2)
4. Image Handler / Claude Vision (Week 2)
5. JSON Handler (Week 2)
6. Database Handler (Week 3)
7. MCP Adapters: GitHub, Jira, Slack (Week 3)

## Preprocessing Pipeline (apply to ALL inputs)
1. Detect format
2. Parse and extract data
3. Infer schema (column types)
4. Detect issues (missing values, duplicates, outliers)
5. Calculate quality score (0-100%)
6. Load into DuckDB session
7. Return summary to user

## API Endpoints
POST /chat              - Main endpoint (receives message + optional file)
POST /datasets/upload   - Upload file
GET  /datasets          - List loaded datasets
POST /query             - NLP query on dataset
POST /mcp/connect       - Connect MCP server
GET  /mcp/list          - List connected MCP servers
POST /export/pdf        - Generate PDF report
GET  /health            - Health check

## SQL Safety Rules
ALLOWED: SELECT, WHERE, GROUP BY, ORDER BY, HAVING, LIMIT,
         JOIN, LEFT JOIN, COUNT, SUM, AVG, MIN, MAX,
         CASE WHEN, CAST, COALESCE, DATE functions
BLOCKED: DROP, DELETE, INSERT, UPDATE, ALTER, CREATE,
         EXEC, UNION ALL (without approval), PRAGMA

## Session Memory
Each conversation tracks:
- datasets[] = list of loaded datasets (name, schema, rowCount, source)
- mcpConnections[] = active MCP servers
- queryHistory[] = all queries + results this session
- currentDataset = last used dataset

## Current Status
Phase: 1 - MVP (CSV + Chat + Query + Charts)

### Completed
- Problem statement
- README
- Project structure
- Config files
- CLAUDE.md

### In Progress
- Backend Express server setup

### Not Started
- Frontend chat UI
- CSV handler
- Query engine
- Excel, PDF, Image handlers
- MCP connectors
- Preprocessing pipeline
- Forecasting
- Export/PDF

## Subagent Roles
- Frontend Dev: React components, Zustand state, Recharts
- Backend Dev: Express routes, file handlers, DuckDB
- AI Engineer: Claude prompts, SQL generation, schema detection
- QA: Tests, fixtures, coverage

## Skills (reference when building)
- /skill:api-design      - REST endpoint patterns
- /skill:csv-parsing     - Papa-parse edge cases
- /skill:sql-safety      - SQL injection prevention
- /skill:error-handling  - Try/catch, Winston logging
- /skill:testing         - Jest patterns, fixtures

## Slash Commands
/ingest   - Upload + preprocess new data source
/connect  - Add MCP server connection
/analyze  - NLP query on loaded data
/export   - Generate PDF report
/quality  - Show data quality report
/schema   - Show loaded dataset schemas
/history  - Show query history
/fix      - Auto-fix data quality issues
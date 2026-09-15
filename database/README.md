# BhoomiAI Database Architecture

This directory holds PostgreSQL migrations, DDL scripts, and seed configurations.

## Target Database
- **Engine**: PostgreSQL 15+
- **Spatial Extensions**: PostGIS (for geospatial cadastral parcel boundaries in future iterations)

## Schema Blueprint (Phase 2 Preparation)
- `documents`: Raw document metadata, storage paths, upload timestamp, state, document type, language.
- `extractions`: Extracted structured fields (survey numbers, owners, plot area, tax history, transaction details, confidence scores).
- `reconciliations`: Cross-document comparison runs, matching keys, similarity metrics.
- `conflicts`: Detected inconsistencies, severity/risk score, field discrepancies, source evidence references (page, bounding box).
- `verification_cases`: Verification tickets for revenue authority review with adjudication actions and audit trails.

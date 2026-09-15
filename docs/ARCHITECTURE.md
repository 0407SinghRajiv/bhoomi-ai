# BhoomiAI Architecture Documentation

## Problem Statement 26018 (Smart India Hackathon 2026)
**Title**: Intelligent Land Record Digitization and Validation System

## Core Pipeline
1. **Document Ingestion**: Multi-document upload (Sale Deed, Mutation Records, RoR/7-12/RTC/Khatauni).
2. **Multilingual OCR & Text Analysis**: Text extraction across English, Hindi, Marathi, and regional scripts.
3. **Information Extraction**: Field extraction (Owner names, Survey/Khasra/Gat numbers, Plot dimensions, Dates, Registration numbers).
4. **Data Normalization**: Translating local units (Bigha, Guntha, Acre, Hectare, Square Feet, Marla) and phonetically standardizing Indian names.
5. **Cross-Document Reconciliation**: Graph/relational matching between chronological records.
6. **Conflict & Inconsistency Detection**: Area delta checks, ownership continuity breaks, survey number mismatches, date sequence violations.
7. **Evidence Viewer**: Side-by-side highlighting showing exact text snippets and bounding context.
8. **Authority Verification Queue & Audit Trail**: Revenue officer adjudication with tamper-evident audit logs.

"""
Operational Risk Engine for BhoomiAI Cross-Document Reconciliation
Smart India Hackathon 2026 - Problem Statement 26018

Strictly separates Extraction Confidence (OCR character clarity)
from Operational Risk (cadastral, legal, and title integrity).

Evaluates 6 core risk dimensions:
1. Conflicting Owner (owner_name / current_owner)
2. Conflicting Survey / Gat / Khasra Number
3. Area Difference (exceeding tolerance > ±2.0%)
4. Missing Supporting Document in chain of title
5. Poor OCR Quality (< 70% or image degradation)
6. Chronology Inconsistency (e.g. mutation earlier than sale deed)
"""
from typing import Dict, Any, List, Optional
from datetime import datetime


class RiskEngine:
    @staticmethod
    def get_extraction_confidence_level(confidence: Optional[float]) -> str:
        """
        Maps numeric OCR extraction confidence to qualitative bucket:
        - High: >= 0.85 (Clear OCR, high certainty)
        - Medium: 0.70 - 0.84 (Acceptable OCR, minor noise)
        - Low: < 0.70 (Poor OCR, low token confidence)
        """
        if confidence is None:
            return "Medium"
        if confidence >= 0.85:
            return "High"
        elif confidence >= 0.70:
            return "Medium"
        else:
            return "Low"

    @classmethod
    def evaluate_case_risk(
        cls,
        field_evaluations: List[Dict[str, Any]],
        documents: List[Any],
        conflicts: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Evaluates the 6 operational risk dimensions across the case.
        Returns a comprehensive assessment detailing risk level, score, and dimensional breakdown.
        """
        # Map fields by key
        fields_by_key = {f["field_key"]: f for f in field_evaluations}

        dimension_results: Dict[str, Dict[str, Any]] = {}
        active_factors: List[str] = []
        accumulated_risk_points = 0

        # =====================================================================
        # 1. Conflicting Owner
        # =====================================================================
        owner_eval = fields_by_key.get("owner_name")
        curr_owner_eval = fields_by_key.get("current_owner")
        owner_has_conflict = (
            (owner_eval and owner_eval.get("status") == "CONFLICT")
            or (curr_owner_eval and curr_owner_eval.get("status") == "CONFLICT")
        )

        if owner_has_conflict:
            dimension_results["conflicting_owner"] = {
                "name": "Conflicting Owner",
                "status": "FAIL",
                "severity": "CRITICAL",
                "score_impact": 40,
                "explanation": (
                    "Party identity variance detected between registered deeds and revenue records. "
                    "Manual verification recommended to confirm identity or legal succession."
                ),
            }
            active_factors.append("Conflicting Owner Name")
            accumulated_risk_points += 40
        else:
            dimension_results["conflicting_owner"] = {
                "name": "Conflicting Owner",
                "status": "PASS",
                "severity": "LOW",
                "score_impact": 0,
                "explanation": "Owner identity is consistent across compared records.",
            }

        # =====================================================================
        # 2. Conflicting Survey / Gat Number
        # =====================================================================
        survey_eval = fields_by_key.get("survey_number")
        gat_eval = fields_by_key.get("gat_number")
        khasra_eval = fields_by_key.get("khasra_number")

        survey_conflict = any(
            f and f.get("status") == "CONFLICT"
            for f in (survey_eval, gat_eval, khasra_eval)
        )

        if survey_conflict:
            dimension_results["conflicting_survey_number"] = {
                "name": "Conflicting Survey / Gat Number",
                "status": "FAIL",
                "severity": "HIGH",
                "score_impact": 30,
                "explanation": (
                    "Cadastral parcel identifier mismatch between submitted instruments. "
                    "Physical parcel boundary inspection or sub-division verification required."
                ),
            }
            active_factors.append("Conflicting Cadastral Number")
            accumulated_risk_points += 30
        else:
            dimension_results["conflicting_survey_number"] = {
                "name": "Conflicting Survey / Gat Number",
                "status": "PASS",
                "severity": "LOW",
                "score_impact": 0,
                "explanation": "Cadastral survey/gat numbers are concordant.",
            }

        # =====================================================================
        # 3. Area Difference (Exceeding Tolerance)
        # =====================================================================
        area_eval = fields_by_key.get("area")
        area_conflict = area_eval and area_eval.get("status") == "CONFLICT"
        area_minor = area_eval and area_eval.get("status") == "MINOR_DIFFERENCE"

        if area_conflict:
            dimension_results["area_difference"] = {
                "name": "Area Discrepancy",
                "status": "FAIL",
                "severity": "HIGH",
                "score_impact": 25,
                "explanation": (
                    "Recorded land area differs by more than the allowable cadastral tolerance (±2.0%). "
                    "Discrepancy may indicate unrecorded land surrender, road widening, or partition."
                ),
            }
            active_factors.append("Area Variance > ±2.0%")
            accumulated_risk_points += 25
        elif area_minor:
            dimension_results["area_difference"] = {
                "name": "Area Discrepancy",
                "status": "WARN",
                "severity": "MEDIUM",
                "score_impact": 10,
                "explanation": "Minor area difference within rounding tolerance (≤ 2.0%).",
            }
            active_factors.append("Minor Area Delta (Within Tolerance)")
            accumulated_risk_points += 10
        else:
            dimension_results["area_difference"] = {
                "name": "Area Discrepancy",
                "status": "PASS",
                "severity": "LOW",
                "score_impact": 0,
                "explanation": "Land parcel area matches across documents.",
            }

        # =====================================================================
        # 4. Missing Supporting Document
        # =====================================================================
        # Standard evidentiary triad: Sale Deed, Mutation Record, Record of Rights (7/12 / RTC)
        doc_codes = [
            (d.document_type.code if hasattr(d, "document_type") and d.document_type else "")
            for d in documents
        ]
        has_deed = any("SALE" in c or "DEED" in c for c in doc_codes)
        has_mutation = any("MUTATION" in c or "FERFAR" in c for c in doc_codes)
        has_extract = any("7_12" in c or "RTC" in c or "KHASRA" in c for c in doc_codes)

        missing_docs: List[str] = []
        if not has_deed:
            missing_docs.append("Sale Deed / Conveyance")
        if not has_mutation:
            missing_docs.append("Mutation Record (Ferfar)")
        if not has_extract:
            missing_docs.append("Current Land Record (7/12 / RoR)")

        if missing_docs and len(documents) < 3:
            dimension_results["missing_supporting_document"] = {
                "name": "Missing Supporting Document",
                "status": "WARN",
                "severity": "MEDIUM",
                "score_impact": 15,
                "explanation": (
                    f"Incomplete chain-of-title triad: missing {', '.join(missing_docs)}. "
                    "Submission of complete triad is recommended for conclusive validation."
                ),
            }
            active_factors.append(f"Missing {', '.join(missing_docs)}")
            accumulated_risk_points += 15
        else:
            dimension_results["missing_supporting_document"] = {
                "name": "Missing Supporting Document",
                "status": "PASS",
                "severity": "LOW",
                "score_impact": 0,
                "explanation": "Complete chain-of-title document set provided.",
            }

        # =====================================================================
        # 5. Poor OCR Quality
        # =====================================================================
        poor_quality_docs: List[str] = []
        for d in documents:
            q_status = getattr(d, "quality_status", "GOOD")
            if q_status in ("POOR", "FLAGGED", "LOW_QUALITY"):
                poor_quality_docs.append(getattr(d, "file_name", "Document"))

        # Also inspect average extraction confidence
        avg_confidence = 0.90
        all_confs = [
            v.get("confidence")
            for f in field_evaluations
            for v in f.get("doc_values", [])
            if v.get("confidence") is not None
        ]
        if all_confs:
            avg_confidence = sum(all_confs) / len(all_confs)

        if poor_quality_docs or avg_confidence < 0.70:
            dimension_results["poor_ocr_quality"] = {
                "name": "OCR Quality Assessment",
                "status": "WARN",
                "severity": "MEDIUM",
                "score_impact": 15,
                "explanation": (
                    f"Document visual quality or OCR confidence is below optimal threshold ({avg_confidence*100:.1f}%). "
                    "Potential for character misrecognition; manual verification suggested."
                ),
            }
            active_factors.append("Sub-optimal OCR Confidence")
            accumulated_risk_points += 15
        else:
            dimension_results["poor_ocr_quality"] = {
                "name": "OCR Quality Assessment",
                "status": "PASS",
                "severity": "LOW",
                "score_impact": 0,
                "explanation": f"High document clarity and OCR confidence ({avg_confidence*100:.1f}%).",
            }

        # =====================================================================
        # 6. Chronology Inconsistency
        # =====================================================================
        doc_date_val = fields_by_key.get("document_date", {}).get("doc_values", [])
        mut_date_val = fields_by_key.get("mutation_date", {}).get("doc_values", [])

        chronology_conflict = False
        chrono_explanation = "Temporal chronology of deeds and mutations is logically consistent."

        # Find earliest valid deed date and mutation date
        parsed_doc_date = None
        parsed_mut_date = None

        for dv in doc_date_val:
            if dv.get("normalized_value"):
                try:
                    parsed_doc_date = datetime.strptime(dv["normalized_value"][:10], "%Y-%m-%d")
                    break
                except Exception:
                    pass

        for mv in mut_date_val:
            if mv.get("normalized_value"):
                try:
                    parsed_mut_date = datetime.strptime(mv["normalized_value"][:10], "%Y-%m-%d")
                    break
                except Exception:
                    pass

        if parsed_doc_date and parsed_mut_date:
            if parsed_mut_date < parsed_doc_date:
                chronology_conflict = True
                chrono_explanation = (
                    f"Chronological inversion detected: Mutation date ({parsed_mut_date.strftime('%Y-%m-%d')}) "
                    f"precedes Sale Deed execution date ({parsed_doc_date.strftime('%Y-%m-%d')}). "
                    "Manual verification recommended."
                )

        if chronology_conflict:
            dimension_results["chronology_inconsistency"] = {
                "name": "Chronology Inconsistency",
                "status": "FAIL",
                "severity": "HIGH",
                "score_impact": 20,
                "explanation": chrono_explanation,
            }
            active_factors.append("Chronological Sequence Inversion")
            accumulated_risk_points += 20
        else:
            dimension_results["chronology_inconsistency"] = {
                "name": "Chronology Inconsistency",
                "status": "PASS",
                "severity": "LOW",
                "score_impact": 0,
                "explanation": chrono_explanation,
            }

        # =====================================================================
        # Overall Case Risk Level & Score
        # =====================================================================
        # Score capped at 100
        risk_score = min(100, accumulated_risk_points)

        if dimension_results["conflicting_owner"]["status"] == "FAIL":
            overall_risk = "CRITICAL" if len(active_factors) > 1 else "HIGH"
        elif dimension_results["conflicting_survey_number"]["status"] == "FAIL":
            overall_risk = "HIGH"
        elif dimension_results["area_difference"]["status"] == "FAIL":
            overall_risk = "HIGH"
        elif accumulated_risk_points >= 40:
            overall_risk = "HIGH"
        elif accumulated_risk_points >= 20:
            overall_risk = "MEDIUM"
        else:
            overall_risk = "LOW"

        # Construct advisory summary explanation
        if overall_risk in ("CRITICAL", "HIGH"):
            summary_explanation = (
                f"Significant cadastral variances identified across {len(active_factors)} risk factors. "
                "Advisory review required prior to title clearance."
            )
        elif overall_risk == "MEDIUM":
            summary_explanation = (
                f"Moderate discrepancies noted ({', '.join(active_factors)}). "
                "Recommend clarification before final record updating."
            )
        else:
            summary_explanation = (
                "All compared instruments are concordant with no critical title or cadastral discrepancies."
            )

        return {
            "overall_risk": overall_risk,
            "risk_score": risk_score,
            "risk_factors": active_factors,
            "risk_dimensions": dimension_results,
            "summary_explanation": summary_explanation,
        }

"""
Land Area Unit Normalizer and Converter
Standardizes Indian cadastral area units to Hectares and Square Meters.
Computes delta, tolerance check, and equivalence across multiple documents.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import re
from typing import Optional, Tuple, Dict, Any, List
from dataclasses import dataclass, asdict

# Exact conversion factors to standard base unit: HECTARE (1 Hectare = 10,000 sq.m)
UNIT_TO_HECTARE = {
    "hectare": 1.0,
    "acre": 0.40468564224,      # 1 Acre = 4,046.856 m² = 0.4046856 Ha
    "sq_meter": 0.0001,          # 10,000 m² = 1 Ha
    "sq_feet": 0.000009290304,   # 1 sq.ft = 0.09290304 m² = 0.000009290304 Ha
    "guntha": 0.010117141,       # 1 Guntha = 1/40 Acre = 101.1714 m² = 0.010117 Ha
    "bigha": 0.252928526,        # Standard cadastral Bigha (approx 2,529.28 m² / 5/8 acre)
    "cent": 0.004046856,         # 1 Cent = 1/100 Acre = 40.4686 m²
    "decimal": 0.004046856,      # 1 Decimal = 1/100 Acre = 40.4686 m²
}

UNIT_LABELS = {
    "hectare": "Hectare",
    "acre": "Acre",
    "sq_meter": "Square Meter",
    "sq_feet": "Square Feet",
    "guntha": "Guntha",
    "bigha": "Bigha",
    "cent": "Cent",
    "decimal": "Decimal",
}

UNIT_PATTERNS = [
    (re.compile(r"\b(sq\.?\s*meters?|square\s*meters?|चौ\.?\s*मी\.?|चौरस\s*मीटर|वर्ग\s*मीटर|sqm|sq\s*m)\b", re.I), "sq_meter"),
    (re.compile(r"\b(sq\.?\s*f(?:ee|oo)?ts?|square\s*f(?:ee|oo)?ts?|चौ\.?\s*फूट|चौरस\s*फूट|वर्ग\s*फूट|sqft|sq\s*ft)\b", re.I), "sq_feet"),
    (re.compile(r"\b(hectares?|हेक्टर|हे\.?\s*आर\.?|हे\.?|ha)\b", re.I), "hectare"),
    (re.compile(r"\b(acres?|एकर|ac)\b", re.I), "acre"),
    (re.compile(r"\b(gunthas?|guntas?|गुंठा|गुंठे|आर)\b", re.I), "guntha"),
    (re.compile(r"\b(bighas?|बीघा|बिघा)\b", re.I), "bigha"),
    (re.compile(r"\b(cents?|सेंट)\b", re.I), "cent"),
    (re.compile(r"\b(decimals?|डेशिमल|डेसिमल)\b", re.I), "decimal"),
]

DEVANAGARI_DIGITS = {
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
}


@dataclass
class AreaValue:
    original_text: str
    numeric_value: float
    unit_key: str
    unit_name: str
    normalized_hectares: float
    normalized_sq_meters: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AreaComparisonItem:
    doc_id: Optional[int]
    doc_title: str
    original: str
    numeric_value: float
    unit: str
    normalized_hectares: float
    normalized_sq_meters: float
    difference_hectares: float
    difference_pct: float
    tolerance_pct: float
    status: str  # EXACT_MATCH, APPROXIMATE_MATCH, MINOR_DIFFERENCE, CONFLICT

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AreaComparisonReport:
    items: List[AreaComparisonItem]
    baseline_doc: str
    baseline_hectares: float
    max_difference_pct: float
    tolerance_pct: float
    status: str
    explanation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "items": [item.to_dict() for item in self.items],
            "baseline_doc": self.baseline_doc,
            "baseline_hectares": self.baseline_hectares,
            "max_difference_pct": self.max_difference_pct,
            "tolerance_pct": self.tolerance_pct,
            "status": self.status,
            "explanation": self.explanation,
        }


class LandUnitConverter:
    DEFAULT_TOLERANCE_PCT = 2.0  # Standard cadastral tolerance for survey rounding

    @staticmethod
    def normalize_digits(text: str) -> str:
        """Converts Devanagari numerals to Arabic digits."""
        res = []
        for ch in text:
            res.append(DEVANAGARI_DIGITS.get(ch, ch))
        return "".join(res)

    @classmethod
    def parse_area(cls, area_str: str) -> Optional[AreaValue]:
        """
        Parses an area string (e.g. '2.00 Acres', '0.809 Hectares', '80 Guntha', '०.८०९ हे.आर.')
        into standardized AreaValue with normalized Hectares and Square Meters.
        """
        if not area_str or not area_str.strip():
            return None

        clean_text = cls.normalize_digits(area_str.strip())

        # Extract numeric value (supporting integers and decimals)
        num_match = re.search(r"(\d+(?:\.\d+)?)", clean_text)
        if not num_match:
            return None

        numeric_val = float(num_match.group(1))

        # Detect unit
        detected_unit = "hectare"  # Default if unit not specified
        for pattern, unit_key in UNIT_PATTERNS:
            if pattern.search(clean_text):
                detected_unit = unit_key
                break

        factor = UNIT_TO_HECTARE.get(detected_unit, 1.0)
        norm_ha = round(numeric_val * factor, 6)
        norm_sqm = round(norm_ha * 10000.0, 2)

        return AreaValue(
            original_text=area_str.strip(),
            numeric_value=numeric_val,
            unit_key=detected_unit,
            unit_name=UNIT_LABELS.get(detected_unit, detected_unit.title()),
            normalized_hectares=norm_ha,
            normalized_sq_meters=norm_sqm,
        )

    @classmethod
    def compare_areas(
        cls,
        document_areas: List[Dict[str, Any]],
        tolerance_pct: float = DEFAULT_TOLERANCE_PCT,
    ) -> AreaComparisonReport:
        """
        Compares area measurements across multiple documents.
        Input: list of { "doc_id": ..., "doc_title": ..., "area_text": ... }
        Returns: AreaComparisonReport detailing Original, Normalized, Difference, Tolerance, Status.
        """
        parsed_entries: List[Tuple[Dict[str, Any], Optional[AreaValue]]] = []
        for d in document_areas:
            area_text = d.get("area_text", "")
            parsed = cls.parse_area(area_text) if area_text else None
            parsed_entries.append((d, parsed))

        valid_entries = [(d, p) for d, p in parsed_entries if p is not None]

        if not valid_entries:
            return AreaComparisonReport(
                items=[],
                baseline_doc="",
                baseline_hectares=0.0,
                max_difference_pct=0.0,
                tolerance_pct=tolerance_pct,
                status="MISSING",
                explanation="No valid area measurements found in submitted documents.",
            )

        # Use first valid document as baseline (typically primary conveyance or registered extract)
        baseline_doc_meta, baseline_area = valid_entries[0]
        baseline_ha = baseline_area.normalized_hectares

        items: List[AreaComparisonItem] = []
        max_diff_pct = 0.0

        for d, p in parsed_entries:
            doc_id = d.get("doc_id")
            doc_title = d.get("doc_title", f"Doc {doc_id}")

            if p is None:
                items.append(
                    AreaComparisonItem(
                        doc_id=doc_id,
                        doc_title=doc_title,
                        original=d.get("area_text", "Not Recorded"),
                        numeric_value=0.0,
                        unit="N/A",
                        normalized_hectares=0.0,
                        normalized_sq_meters=0.0,
                        difference_hectares=0.0,
                        difference_pct=0.0,
                        tolerance_pct=tolerance_pct,
                        status="MISSING",
                    )
                )
                continue

            diff_ha = round(p.normalized_hectares - baseline_ha, 5)
            abs_diff_ha = abs(diff_ha)
            diff_pct = round((abs_diff_ha / baseline_ha) * 100.0, 2) if baseline_ha > 0 else 0.0

            if diff_pct > max_diff_pct:
                max_diff_pct = diff_pct

            # Determine individual item status
            if abs_diff_ha < 1e-4:
                item_status = "EXACT_MATCH"
            elif diff_pct <= 0.5:
                item_status = "APPROXIMATE_MATCH"
            elif diff_pct <= tolerance_pct:
                item_status = "MINOR_DIFFERENCE"
            else:
                item_status = "CONFLICT"

            items.append(
                AreaComparisonItem(
                    doc_id=doc_id,
                    doc_title=doc_title,
                    original=p.original_text,
                    numeric_value=p.numeric_value,
                    unit=p.unit_name,
                    normalized_hectares=round(p.normalized_hectares, 4),
                    normalized_sq_meters=p.normalized_sq_meters,
                    difference_hectares=round(diff_ha, 4),
                    difference_pct=diff_pct,
                    tolerance_pct=tolerance_pct,
                    status=item_status,
                )
            )

        # Determine overall status and explanation
        if max_diff_pct < 1e-4:
            overall_status = "EXACT_MATCH"
            explanation = f"All documents have identical normalized area of {round(baseline_ha, 4)} Hectares."
        elif max_diff_pct <= 0.5:
            overall_status = "EXACT_MATCH"
            explanation = (
                f"Area values (e.g. {items[0].original} vs {items[1].original if len(items) > 1 else ''}) "
                f"are approximately equivalent ({round(baseline_ha, 4)} Ha baseline, delta {max_diff_pct}% within tolerance)."
            )
        elif max_diff_pct <= tolerance_pct:
            overall_status = "MINOR_DIFFERENCE"
            explanation = (
                f"Minor area variation detected ({max_diff_pct}% difference), which is within "
                f"cadastral survey tolerance of ±{tolerance_pct}%. Manual confirmation advised."
            )
        else:
            overall_status = "CONFLICT"
            explanation = (
                f"Potential inconsistency detected: area variance of {max_diff_pct}% exceeds "
                f"allowable tolerance of ±{tolerance_pct}%. Manual verification recommended."
            )

        return AreaComparisonReport(
            items=items,
            baseline_doc=baseline_doc_meta.get("doc_title", "Document 1"),
            baseline_hectares=round(baseline_ha, 4),
            max_difference_pct=max_diff_pct,
            tolerance_pct=tolerance_pct,
            status=overall_status,
            explanation=explanation,
        )

"""
Cadastral Field Normalizer
Handles Devanagari numerals, phonetic transliteration, area unit conversion, and date standardization.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import re
from typing import Optional, Tuple, Dict, Any

DEVANAGARI_DIGITS_MAP = {
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
}

# Common Devanagari cadastral names vocabulary for precise transliteration
COMMON_NAME_TRANSLITERATION = {
    "राजेश": "Rajesh",
    "राकेश": "Rakesh",
    "कुमार": "Kumar",
    "गणेश": "Ganesh",
    "विठ्ठल": "Vitthal",
    "हरी": "Hari",
    "रमेश": "Ramesh",
    "पाटील": "Patil",
    "सुरेश": "Suresh",
    "चंद्र": "Chandra",
    "पटेल": "Patel",
    "रामेश्वर": "Rameshwar",
    "पवार": "Pawar",
    "शिंदे": "Shinde",
    "जाधव": "Jadhav",
    "देशमुख": "Deshmukh",
    "कदम": "Kadam",
    "भोसले": "Bhosale",
    "कुलकर्णी": "Kulkarni",
    "जोशी": "Joshi",
    "मोरे": "More",
    "गायकवाड": "Gaikwad",
    "शर्मा": "Sharma",
    "वर्मा": "Verma",
    "सिंह": "Singh",
    "यादव": "Yadav",
    "चौधरी": "Choudhary",
    "गुप्ता": "Gupta",
    "वाघोली": "Wagholi",
    "हवेली": "Haveli",
    "पुणे": "Pune",
    "बाणेर": "Baner",
}


class FieldNormalizer:
    @staticmethod
    def normalize_digits(text: str) -> str:
        """Converts Devanagari numbers to standard Arabic digits."""
        res = []
        for ch in text:
            res.append(DEVANAGARI_DIGITS_MAP.get(ch, ch))
        return "".join(res)

    @staticmethod
    def transliterate_name(text: str) -> str:
        """
        Transliterates Devanagari names to clean Latin script.
        If already Latin, cleans excess spacing and returns.
        """
        clean = text.strip()
        # Check if already English/Latin
        if re.search(r"^[A-Za-z\s\.\,\'\-]+$", clean):
            return " ".join(clean.split())

        # If has both English and Marathi, e.g. "राजेश कुमार (Rajesh Kumar)"
        en_match = re.search(r"\(([^)]+)\)", clean)
        if en_match:
            candidate = en_match.group(1).strip()
            if re.search(r"[A-Za-z]", candidate):
                return " ".join(candidate.split())

        # Replace vocabulary words
        words = clean.split()
        transliterated = []
        for w in words:
            # Strip punctuation
            clean_w = re.sub(r"[^\u0900-\u097F]", "", w)
            if clean_w in COMMON_NAME_TRANSLITERATION:
                transliterated.append(COMMON_NAME_TRANSLITERATION[clean_w])
            else:
                # Basic Devanagari character substitution fallback
                transliterated.append(w)

        res = " ".join(transliterated)
        return res if res else clean

    @staticmethod
    def normalize_area(area_text: str) -> Tuple[Optional[float], Optional[str], Optional[float]]:
        """
        Parses area text and normalizes to standard Hectares and Sq. Meters.
        Returns: (parsed_value, original_unit, normalized_hectares)
        """
        # First normalize any Devanagari digits
        norm_text = FieldNormalizer.normalize_digits(area_text.strip().lower())

        # Extract numeric value
        num_match = re.search(r"(\d+(?:\.\d+)?)", norm_text)
        if not num_match:
            return None, None, None

        val = float(num_match.group(1))

        # Detect unit
        unit = "Hectare"
        hectares = val

        if any(k in norm_text for k in ["acre", "एकर", "ac"]):
            unit = "Acre"
            hectares = round(val * 0.404686, 4)
        elif any(k in norm_text for k in ["guntha", "गुंठा", "gunta", "आर"]):
            unit = "Guntha"
            hectares = round(val * 0.010117, 4)
        elif any(k in norm_text for k in ["bigha", "बीघा", "बिघा"]):
            unit = "Bigha"
            hectares = round(val * 0.2529, 4)
        elif any(k in norm_text for k in ["biswa", "बिस्वा"]):
            unit = "Biswa"
            hectares = round(val * 0.0126, 4)
        elif any(k in norm_text for k in ["cent", "सेंट"]):
            unit = "Cent"
            hectares = round(val * 0.004047, 4)
        elif any(k in norm_text for k in ["sq. meter", "sq meter", "चौ.मी.", "चौरस मीटर"]):
            unit = "Sq. Meter"
            hectares = round(val / 10000.0, 4)
        elif any(k in norm_text for k in ["sq. ft", "sq feet", "चौ.फूट"]):
            unit = "Sq. Feet"
            hectares = round(val * 0.0000929, 4)
        elif any(k in norm_text for k in ["kanal", "कनाल"]):
            unit = "Kanal"
            hectares = round(val * 0.05058, 4)
        elif any(k in norm_text for k in ["marla", "मरला"]):
            unit = "Marla"
            hectares = round(val * 0.002529, 4)
        elif any(k in norm_text for k in ["hectare", "हेक्टर", "हे.आर", "हे."]):
            unit = "Hectare"
            hectares = round(val, 4)

        return val, unit, hectares

    @staticmethod
    def normalize_date(date_text: str) -> Optional[str]:
        """Converts DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, or verbal dates to ISO YYYY-MM-DD."""
        norm = FieldNormalizer.normalize_digits(date_text.strip())

        # Match ISO YYYY-MM-DD or YYYY/MM/DD
        iso_match = re.search(r"\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b", norm)
        if iso_match:
            year, month, day = iso_match.groups()
            return f"{year}-{int(month):02d}-{int(day):02d}"

        # Match DD/MM/YYYY or DD-MM-YYYY
        match = re.search(r"(\b\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4}\b)", norm)
        if match:
            day, month, year = match.groups()
            return f"{year}-{int(month):02d}-{int(day):02d}"

        # Match English month names like "14th November 2018"
        month_names = {
            "january": "01", "february": "02", "march": "03", "april": "04",
            "may": "05", "june": "06", "july": "07", "august": "08",
            "september": "09", "october": "10", "november": "11", "december": "12",
        }
        word_match = re.search(r"(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})", norm)
        if word_match:
            d, m, y = word_match.groups()
            m_num = month_names.get(m.lower())
            if m_num:
                return f"{y}-{m_num}-{int(d):02d}"

        return None


# Backward-compatible alias
FieldNormalizer.transliterate_devanagari = FieldNormalizer.transliterate_name


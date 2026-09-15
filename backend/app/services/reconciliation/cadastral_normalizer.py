"""
Cadastral Field Normalizer
Cleans whitespace, punctuation, case, OCR noise, spelling variations,
Indian name transliterations, land units, and date formats.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import re
import unicodedata
from typing import Optional, Tuple, Dict, Any, List
from difflib import SequenceMatcher

DEVANAGARI_DIGITS = {
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
}

INDIAN_HONORIFICS = [
    r"\bshri\b\.?", r"\bsmt\b\.?", r"\bshrimati\b", r"\blate\b", r"\bsh\b\.?",
    r"\bmr\b\.?", r"\bmrs\b\.?", r"\bms\b\.?", r"\bdr\b\.?", r"\badv\b\.?",
    r"\bश्री\b", r"\bश्रीमती\b", r"\bस्व\b\.?", r"\bमा\b\.?", r"\bचि\b\.?",
]

KINSHIP_PATTERNS = [
    r"\bs/o\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bw/o\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bd/o\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bc/o\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bआत्मज\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bपुत्र\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bसुपुत्र\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bपत्नी\s+[A-Za-z\s\.\u0900-\u097F]+",
    r"\bवडील\s+[A-Za-z\s\.\u0900-\u097F]+",
]

COMMON_NAME_MAP = {
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

MONTH_MAP = {
    "january": "01", "jan": "01",
    "february": "02", "feb": "02",
    "march": "03", "mar": "03",
    "april": "04", "apr": "04",
    "may": "05",
    "june": "06", "jun": "06",
    "july": "07", "jul": "07",
    "august": "08", "aug": "08",
    "september": "09", "sep": "09", "sept": "09",
    "october": "10", "oct": "10",
    "november": "11", "nov": "11",
    "december": "12", "dec": "12",
}


class CadastralNormalizer:
    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """Trims and collapses all tabs, newlines, and multi-spaces into single spaces."""
        if not text:
            return ""
        return " ".join(text.split()).strip()

    @staticmethod
    def normalize_digits(text: str) -> str:
        """Replaces Devanagari numerals with standard Arabic digits."""
        if not text:
            return ""
        return "".join(DEVANAGARI_DIGITS.get(ch, ch) for ch in text)

    @staticmethod
    def clean_ocr_noise_in_number(text: str) -> str:
        """
        Fixes common OCR misreads in cadastral numbers (Survey, Gat, Khasra, Khata).
        E.g. letter 'O' instead of digit '0', 'l'/'I' instead of '1', etc.
        """
        clean = CadastralNormalizer.normalize_digits(text.strip())
        # Replace common letter substitutions in number-like strings (e.g. 142/3)
        res = []
        for ch in clean:
            if ch in ("O", "o"):
                res.append("0")
            elif ch in ("l", "I", "|"):
                res.append("1")
            elif ch in ("S", "s") and any(c.isdigit() for c in clean):
                res.append("5")
            elif ch in ("B",) and any(c.isdigit() for c in clean):
                res.append("8")
            else:
                res.append(ch)
        out = "".join(res)
        # Normalize slashes: "142 / 3" -> "142/3"
        out = re.sub(r"\s*/\s*", "/", out)
        # Remove trailing or leading punctuation
        out = out.strip(" .,-:")
        return out

    @staticmethod
    def normalize_punctuation(text: str) -> str:
        """Normalizes quotes, dashes, and strips trailing punctuation while preserving slashes."""
        if not text:
            return ""
        # Replace smart quotes and dashes
        s = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
        s = s.replace("–", "-").replace("—", "-")
        # Remove unnecessary special characters but keep / and -
        s = re.sub(r"[^\w\s/\-\.]", " ", s)
        return CadastralNormalizer.normalize_whitespace(s)

    @classmethod
    def transliterate_devanagari(cls, text: str) -> str:
        """
        Transliterates Devanagari names and cadastral entities to clean Latin script.
        Handles parenthetical english, vocabulary lookup, and character maps.
        """
        if not text:
            return ""

        clean = cls.normalize_whitespace(text)

        # Check if already purely Latin
        if re.search(r"^[A-Za-z\s\.\,\'\-]+$", clean):
            return clean

        # Extract parenthetical Latin name if present, e.g. "राजेश कुमार (Rajesh Kumar)"
        en_match = re.search(r"\(([^)]+)\)", clean)
        if en_match:
            candidate = en_match.group(1).strip()
            if re.search(r"[A-Za-z]", candidate):
                return cls.normalize_whitespace(candidate)

        # Replace recognized vocabulary words
        words = clean.split()
        transliterated = []
        for w in words:
            # Strip punctuation for lookup
            clean_w = re.sub(r"[^\u0900-\u097F]", "", w)
            if clean_w in COMMON_NAME_MAP:
                transliterated.append(COMMON_NAME_MAP[clean_w])
            else:
                transliterated.append(w)

        result = " ".join(transliterated)
        return result if result else clean

    @classmethod
    def normalize_person_name(cls, name_text: str) -> str:
        """
        Normalizes an Indian personal name:
        - Transliterates Devanagari
        - Strips honorifics (Shri, Smt, etc.)
        - Strips kinship qualifiers (s/o, w/o, etc.)
        - Removes excess punctuation and extra spaces
        """
        if not name_text:
            return ""

        # Step 1: Transliterate Devanagari & normalize whitespace
        t = cls.transliterate_devanagari(name_text)

        # Step 2: Strip parenthetical notes like "(Vendor)", "(Purchaser)", "(Typographical variance)"
        t = re.sub(r"\([^)]*\)", "", t)

        # Step 3: Strip kinship suffixes like "s/o Rameshwar Kumar"
        for kp in KINSHIP_PATTERNS:
            t = re.sub(kp, "", t, flags=re.IGNORECASE)

        # Step 4: Strip honorifics
        for hon in INDIAN_HONORIFICS:
            t = re.sub(hon, "", t, flags=re.IGNORECASE)

        # Step 5: Clean residual punctuation and multiple spaces
        t = re.sub(r"[\.,\-]", " ", t)
        return cls.normalize_whitespace(t).title()

    @classmethod
    def normalize_date(cls, date_str: str) -> Optional[str]:
        """
        Standardizes various date formats to ISO YYYY-MM-DD.
        Handles:
        - ISO: 2018-11-14, 2018/11/14
        - Indian format: 14/11/2018, 14-11-2018, 14.11.2018
        - Verbal: 14th November 2018, November 14, 2018
        - Devanagari numerals
        """
        if not date_str:
            return None

        clean = cls.normalize_digits(date_str.strip())

        # Match ISO YYYY-MM-DD or YYYY/MM/DD
        iso_match = re.search(r"\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b", clean)
        if iso_match:
            y, m, d = iso_match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"

        # Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        dmy_match = re.search(r"\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})\b", clean)
        if dmy_match:
            d, m, y = dmy_match.groups()
            return f"{y}-{int(m):02d}-{int(d):02d}"

        # Match verbal dates: "14th November 2018"
        verbal_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\b", clean)
        if verbal_match:
            d, month_name, y = verbal_match.groups()
            m_code = MONTH_MAP.get(month_name.lower())
            if m_code:
                return f"{y}-{m_code}-{int(d):02d}"

        # Match "November 14, 2018"
        verbal_rev_match = re.search(r"\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b", clean)
        if verbal_rev_match:
            month_name, d, y = verbal_rev_match.groups()
            m_code = MONTH_MAP.get(month_name.lower())
            if m_code:
                return f"{y}-{m_code}-{int(d):02d}"

        return None

    @staticmethod
    def string_similarity(s1: str, s2: str) -> float:
        """Calculates token-insensitive string similarity ratio (0.0 to 1.0)."""
        if not s1 or not s2:
            return 0.0
        n1 = s1.lower().strip()
        n2 = s2.lower().strip()
        if n1 == n2:
            return 1.0

        # Exact token match (e.g. "Kumar Rajesh" vs "Rajesh Kumar")
        t1 = sorted(n1.split())
        t2 = sorted(n2.split())
        if t1 == t2:
            return 0.98

        # Levenshtein ratio via SequenceMatcher
        return SequenceMatcher(None, n1, n2).ratio()

    @classmethod
    def compare_cadastral_numbers(cls, num1: str, num2: str) -> Tuple[str, float]:
        """
        Compares cadastral numbers (Survey, Gat, Khasra, Khata).
        Returns: (match_status, similarity_score)
        """
        n1 = cls.clean_ocr_noise_in_number(num1)
        n2 = cls.clean_ocr_noise_in_number(num2)

        if not n1 and not n2:
            return "MISSING", 1.0
        if not n1 or not n2:
            return "MISSING", 0.0

        if n1 == n2:
            return "EXACT_MATCH", 1.0

        # Check sub-division equivalence or containment e.g. "142/3" vs "142 / 3"
        s1 = n1.replace(" ", "")
        s2 = n2.replace(" ", "")
        if s1 == s2:
            return "EXACT_MATCH", 1.0

        # Check if one is parent cadastral number, e.g. "142" vs "142/3"
        if s1.split("/")[0] == s2.split("/")[0]:
            return "MINOR_DIFFERENCE", 0.85

        return "CONFLICT", cls.string_similarity(s1, s2)

    @classmethod
    def compare_names(cls, name1: str, name2: str) -> Tuple[str, float, str]:
        """
        Compares two personal/owner names with transliteration and phonetic normalization.
        Returns: (match_status, similarity_score, explanation)
        """
        p1 = cls.normalize_person_name(name1)
        p2 = cls.normalize_person_name(name2)

        if not p1 and not p2:
            return "MISSING", 1.0, "Both name fields are unrecorded."
        if not p1 or not p2:
            missing_doc = "first" if not p1 else "second"
            return "MISSING", 0.0, f"Name is unrecorded in {missing_doc} document."

        if p1.lower() == p2.lower():
            return "EXACT_MATCH", 1.0, f"Identical normalized name '{p1}'."

        # Token set match (e.g. "Rajesh Kumar" vs "Kumar Rajesh")
        tokens1 = set(p1.lower().split())
        tokens2 = set(p2.lower().split())
        if tokens1 == tokens2:
            return "EXACT_MATCH", 0.98, f"Identical name tokens with alternate word order ('{p1}' vs '{p2}')."

        # Token containment (e.g. "Rajesh Kumar" vs "Rajesh Rameshwar Kumar")
        if tokens1.issubset(tokens2) or tokens2.issubset(tokens1):
            return "LIKELY_MATCH", 0.92, f"Substantial token overlap: '{p1}' and '{p2}' likely reference the same party."

        sim = cls.string_similarity(p1, p2)

        # Single letter difference / close typo (e.g. "Rajesh Kumar" vs "Rakesh Kumar" -> sim ~0.83)
        if sim >= 0.80:
            return (
                "CONFLICT",
                sim,
                f"Potential inconsistency detected: typographical or phonetic variance between '{name1.strip()}' and '{name2.strip()}'. Manual verification recommended.",
            )

        return (
            "CONFLICT",
            sim,
            f"Potential inconsistency detected: completely divergent names ('{name1.strip()}' vs '{name2.strip()}'). Manual verification recommended.",
        )

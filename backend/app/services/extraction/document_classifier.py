"""
Cadastral Document Type Classifier
Auto-detects Indian land record document types from OCR text and visual patterns.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import re
from typing import Dict, Any, List, Tuple


class DocumentClassifier:
    # Weighted keyword signatures for document types
    DOCUMENT_SIGNATURES: Dict[str, Dict[str, Any]] = {
        "7_12_EXTRACT": {
            "name": "7/12 Extract",
            "code": "7_12_EXTRACT",
            "keywords": [
                (r"गाव\s*नमुना\s*सात", 5),
                (r"अधिकार\s*अभिलेख\s*पत्रक", 4),
                (r"७\s*/\s*१२", 5),
                (r"7\s*/\s*12", 5),
                (r"सातबारा", 5),
                (r"भोगवटादार\s*वर्ग", 3),
                (r"पोटखराब", 3),
                (r"आकारणी", 2),
                (r"कुल", 2),
            ],
            "default_state": "Maharashtra",
        },
        "8A_EXTRACT": {
            "name": "8A Extract",
            "code": "8A_EXTRACT",
            "keywords": [
                (r"गाव\s*नमुना\s*आठ", 5),
                (r"गाव\s*नमुना\s*८", 5),
                (r"८\s*-?\s*अ", 5),
                (r"8\s*-?\s*A", 5),
                (r"खातेवही", 4),
                (r"जमिनीची\s*खातेवही", 4),
                (r"एकूण\s*खाते", 2),
            ],
            "default_state": "Maharashtra",
        },
        "MUTATION_RECORD": {
            "name": "Ferfar / Mutation Record",
            "code": "MUTATION_RECORD",
            "keywords": [
                (r"गाव\s*नमुना\s*सहा", 5),
                (r"गाव\s*नमुना\s*६", 5),
                (r"फेरफार\s*नोंद", 5),
                (r"फेरफार", 4),
                (r"mutation\s*(?:entry|register|record)?", 4),
                (r"form\s*6", 3),
                (r"हक्क\s*नोंदणी", 3),
                (r"intiqal", 4),
                (r"namantaran", 4),
                (r"दाखिल\s*खारिज", 4),
            ],
            "default_state": "Maharashtra",
        },
        "RTC": {
            "name": "RTC (Pahani)",
            "code": "RTC",
            "keywords": [
                (r"record\s*of\s*rights[,\s]*tenancy", 5),
                (r"pahani", 5),
                (r"bhoomi\s*online", 4),
                (r"form\s*16", 4),
                (r"pattadar", 3),
                (r"hissa", 2),
                (r"khata\s*no", 2),
            ],
            "default_state": "Karnataka",
        },
        "KHATAUNI": {
            "name": "Khatauni",
            "code": "KHATAUNI",
            "keywords": [
                (r"खतौनी", 5),
                (r"भूलेख", 4),
                (r"अधिकार\s*अभिलेख", 3),
                (r"काश्तकार", 3),
                (r"मालगुजारी", 3),
                (r"खाता\s*संख्या", 3),
                (r"खसरा\s*संख्या", 3),
                (r"खातेदार\s*का\s*नाम", 3),
            ],
            "default_state": "Uttar Pradesh",
        },
        "JAMABANDI": {
            "name": "Jamabandi",
            "code": "JAMABANDI",
            "keywords": [
                (r"jamabandi", 5),
                (r"जमाबंदी", 5),
                (r"fard\s*jamabandi", 4),
                (r"nakal\s*jamabandi", 4),
                (r"khasra\s*girdawari", 3),
                (r"khewat", 3),
                (r"khatoni", 3),
            ],
            "default_state": None,
        },
        "PROPERTY_CARD": {
            "name": "Property Card",
            "code": "PROPERTY_CARD",
            "keywords": [
                (r"property\s*card", 5),
                (r"मालमत्ता\s*पत्रक", 5),
                (r"city\s*survey", 4),
                (r"नगर\s*भूमापन", 4),
                (r"c\.?t\.?s\.?\s*no", 4),
                (r"chalta\s*no", 3),
            ],
            "default_state": None,
        },
        "SALE_DEED": {
            "name": "Sale Deed",
            "code": "SALE_DEED",
            "keywords": [
                (r"sale\s*deed", 5),
                (r"deed\s*of\s*(?:absolute\s*)?conveyance", 5),
                (r"खरेदीखत", 5),
                (r"vendor", 4),
                (r"purchaser", 4),
                (r"sub-registrar", 4),
                (r"consideration", 3),
                (r"schedule\s*of\s*(?:the\s*)?property", 3),
                (r"बैनामा", 4),
                (r"विलेख", 3),
            ],
            "default_state": None,
        },
        "REGISTRATION_DOC": {
            "name": "Registration Document",
            "code": "REGISTRATION_DOC",
            "keywords": [
                (r"registration\s*receipt", 4),
                (r"index\s*ii", 5),
                (r"दस्त\s*नोंदणी", 4),
                (r"sub-registrar\s*office", 4),
                (r"book\s*no", 3),
                (r"volume\s*no", 3),
            ],
            "default_state": None,
        },
    }

    @classmethod
    def classify(cls, text: str) -> Dict[str, Any]:
        """
        Analyzes document text and returns detected document type, code, and confidence.
        """
        clean_text = text.lower()
        best_type = "GENERIC_LAND_RECORD"
        best_name = "Generic Land Record"
        best_score = 0
        total_matched_keywords = 0

        for type_code, sig in cls.DOCUMENT_SIGNATURES.items():
            score = 0
            for pattern, weight in sig["keywords"]:
                matches = len(re.findall(pattern, clean_text, re.IGNORECASE))
                if matches > 0:
                    score += weight * min(matches, 3)
                    total_matched_keywords += 1

            if score > best_score:
                best_score = score
                best_type = type_code
                best_name = sig["name"]

        # Calculate confidence
        if best_score >= 12:
            confidence = 0.98
        elif best_score >= 8:
            confidence = 0.90
        elif best_score >= 4:
            confidence = 0.78
        elif best_score > 0:
            confidence = 0.60
        else:
            confidence = 0.40
            best_type = "GENERIC_LAND_RECORD"
            best_name = "Generic Land Record"

        return {
            "code": best_type,
            "name": best_name,
            "score": best_score,
            "confidence": confidence,
            "is_confident": best_score >= 4,
        }

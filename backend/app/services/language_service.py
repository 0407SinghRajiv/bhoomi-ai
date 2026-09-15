"""
Multilingual Language Detection Service
Detects English, Hindi, Marathi, and Indic scripts for land records.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import re
from typing import Dict, Any, Optional
from langdetect import detect_langs


class LanguageDetectionService:
    # Cadastral lexeme markers for distinguishing Marathi vs Hindi in Devanagari script
    MARATHI_MARKERS = {
        "क्षेत्र", "गाव", "गट", "खातेदार", "फेरफार", "दस्त", "तलाठी", "तहसीलदार",
        "नोंद", "पाहणी", "हक्क", "नमुना", "जिल्हा", "तालुका", "आहे", "आणि",
        "सातबारा", "आठअ", "भोगवटादार", "पोटखराब", "आकारणी", "रुपये", "दिनांक",
        "खरेदीखत", "वारस", "वारसा", "पोटहिस्सा", "माहिती", "अर्जदार"
    }

    HINDI_MARKERS = {
        "खसरा", "खतौनी", "गाँव", "तहसील", "मालगुजारी", "बिक्री", "भूलेख",
        "खाता", "हिस्सा", "खातेदार", "काश्तकार", "रकबा", "दाखिल", "खारिज",
        "प्रमाणपत्र", "नामांतरण", "बैनामा", "पट्टा", "चकबंदी", "लेखपाल",
        "पिता", "पुत्र", "का", "की", "के", "है", "में", "से", "पर"
    }

    @classmethod
    def detect_script(cls, text: str) -> str:
        """Determines predominant Unicode script block."""
        counts = {
            "Devanagari": len(re.findall(r"[\u0900-\u097F]", text)),
            "Latin": len(re.findall(r"[A-Za-z]", text)),
            "Kannada": len(re.findall(r"[\u0C80-\u0CFF]", text)),
            "Telugu": len(re.findall(r"[\u0C00-\u0C7F]", text)),
            "Tamil": len(re.findall(r"[\u0B80-\u0BFF]", text)),
            "Gujarati": len(re.findall(r"[\u0A80-\u0AFF]", text)),
            "Bengali": len(re.findall(r"[\u0980-\u09FF]", text)),
        }
        total = sum(counts.values())
        if total == 0:
            return "Unknown"
        predominant = max(counts.items(), key=lambda x: x[1])
        return predominant[0] if predominant[1] > 0 else "Unknown"

    @classmethod
    def detect_language(cls, text: str, fallback_lang: str = "en") -> Dict[str, Any]:
        """
        Detects language of input text with cadastral domain disambiguation.
        Returns: language_code, language_name, confidence, script
        """
        clean_text = text.strip()
        if not clean_text:
            return {
                "language_code": fallback_lang,
                "language_name": "English" if fallback_lang == "en" else fallback_lang,
                "confidence": 0.5,
                "script": "Latin",
            }

        script = cls.detect_script(clean_text)

        # Latin Script -> English
        if script == "Latin":
            return {
                "language_code": "en",
                "language_name": "English",
                "confidence": 0.98,
                "script": "Latin",
            }

        # Other Indic scripts
        if script == "Kannada":
            return {"language_code": "kn", "language_name": "Kannada", "confidence": 0.95, "script": "Kannada"}
        if script == "Telugu":
            return {"language_code": "te", "language_name": "Telugu", "confidence": 0.95, "script": "Telugu"}
        if script == "Tamil":
            return {"language_code": "ta", "language_name": "Tamil", "confidence": 0.95, "script": "Tamil"}
        if script == "Gujarati":
            return {"language_code": "gu", "language_name": "Gujarati", "confidence": 0.95, "script": "Gujarati"}
        if script == "Bengali":
            return {"language_code": "bn", "language_name": "Bengali", "confidence": 0.95, "script": "Bengali"}

        # Devanagari Script -> Disambiguate Marathi vs Hindi
        if script == "Devanagari":
            tokens = set(re.findall(r"[\u0900-\u097F]+", clean_text))
            marathi_matches = len(tokens.intersection(cls.MARATHI_MARKERS))
            hindi_matches = len(tokens.intersection(cls.HINDI_MARKERS))

            if marathi_matches > hindi_matches:
                conf = min(0.98, 0.70 + (marathi_matches * 0.05))
                return {
                    "language_code": "mr",
                    "language_name": "Marathi",
                    "confidence": round(conf, 2),
                    "script": "Devanagari",
                }
            elif hindi_matches > marathi_matches:
                conf = min(0.98, 0.70 + (hindi_matches * 0.05))
                return {
                    "language_code": "hi",
                    "language_name": "Hindi",
                    "confidence": round(conf, 2),
                    "script": "Devanagari",
                }

            # If tokens are neutral, try langdetect
            try:
                detected = detect_langs(clean_text)
                for lang_prob in detected:
                    if lang_prob.lang in ["mr", "hi"]:
                        return {
                            "language_code": lang_prob.lang,
                            "language_name": "Marathi" if lang_prob.lang == "mr" else "Hindi",
                            "confidence": round(float(lang_prob.prob), 2),
                            "script": "Devanagari",
                        }
            except Exception:
                pass

            # Default Devanagari to Marathi for Maharashtra or Hindi
            return {
                "language_code": "mr",
                "language_name": "Marathi",
                "confidence": 0.75,
                "script": "Devanagari",
            }

        return {
            "language_code": fallback_lang,
            "language_name": "English",
            "confidence": 0.5,
            "script": script,
        }

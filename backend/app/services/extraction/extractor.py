"""
Structured Land Record Entity Extractor
Extracts cadastral entities with layout context, bounding boxes, and normalization.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import re
import json
from typing import List, Dict, Any, Optional, Tuple
from app.services.extraction.normalizer import FieldNormalizer
from app.services.extraction.document_classifier import DocumentClassifier


class EntityExtractor:
    @staticmethod
    def _find_matching_box(
        text_snippet: str,
        bounding_boxes: List[Dict[str, Any]]
    ) -> Optional[List[float]]:
        """Finds bounding box coordinates corresponding to extracted text snippet."""
        if not bounding_boxes or not text_snippet:
            return None

        clean_snip = text_snippet.lower().strip()
        for b in bounding_boxes:
            box_text = b.get("text", "").lower().strip()
            if clean_snip in box_text or box_text in clean_snip:
                return b.get("box")

        # Fallback to first box if any
        return bounding_boxes[0].get("box") if bounding_boxes else None

    @classmethod
    def extract_from_pages(
        cls,
        pages: List[Dict[str, Any]],
        document_type_code: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Extracts structured fields across all document pages.
        Returns: (extracted_fields_list, land_record_dict)
        """
        extracted_fields: List[Dict[str, Any]] = []
        full_text = "\n".join(p.get("text", "") for p in pages)

        # 1. Document Type Auto-Detection if not provided
        if not document_type_code or document_type_code == "GENERIC_LAND_RECORD":
            classified = DocumentClassifier.classify(full_text)
            doc_type = classified["code"]
        else:
            doc_type = document_type_code

        # Process page by page
        for page in pages:
            p_num = page.get("page_number", 1)
            text = page.get("text", "")
            boxes = page.get("bounding_boxes", [])
            lines = [l.strip() for l in text.split("\n") if l.strip()]

            for line in lines:
                norm_line = FieldNormalizer.normalize_digits(line)

                # ================= 1. GAT / SURVEY / KHASRA NUMBERS =================
                # Gat Number (Maharashtra)
                gat_match = re.search(r"(?:गट\s*(?:क्रमांक|क्र|नं)?\.?|Gat\s*(?:No|Number)?\.?)\s*[:\-]?\s*([०-९0-9]+(?:\s*/\s*[०-९0-9]+)?)", line, re.IGNORECASE)
                if gat_match and not any(f["field_name"] == "gat_number" for f in extracted_fields):
                    raw_val = gat_match.group(1).strip()
                    norm_val = FieldNormalizer.normalize_digits(raw_val).replace(" ", "")
                    extracted_fields.append({
                        "field_name": "gat_number",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.96,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # Survey Number
                survey_match = re.search(r"(?:Survey\s*(?:No|Number)?\.?|सर्व्हे\s*(?:नंबर|क्र)?\.?|भूमापन\s*क्रमांक)\s*[:\-]?\s*([०-९0-9]+(?:\s*/\s*[०-९0-9]+)?)", line, re.IGNORECASE)
                if survey_match and not any(f["field_name"] == "survey_number" for f in extracted_fields):
                    raw_val = survey_match.group(1).strip()
                    norm_val = FieldNormalizer.normalize_digits(raw_val).replace(" ", "")
                    extracted_fields.append({
                        "field_name": "survey_number",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.96,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # Khasra Number (UP / MP / Rajasthan)
                khasra_match = re.search(r"(?:खसरा\s*(?:संख्या|नंबर|क्र)?\.?|Khasra\s*(?:No|Number)?\.?)\s*[:\-]?\s*([०-९0-9]+(?:\s*/\s*[०-९0-9]+)?)", line, re.IGNORECASE)
                if khasra_match and not any(f["field_name"] == "khasra_number" for f in extracted_fields):
                    raw_val = khasra_match.group(1).strip()
                    norm_val = FieldNormalizer.normalize_digits(raw_val).replace(" ", "")
                    extracted_fields.append({
                        "field_name": "khasra_number",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.95,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # Khata / Account Number
                khata_match = re.search(r"(?:खाते\s*(?:क्रमांक|क्र|नं)?\.?|खाता\s*(?:संख्या|क्र)?\.?|Khata\s*(?:No|Number)?\.?)\s*[:\-]?\s*([०-९0-9]+)", line, re.IGNORECASE)
                if khata_match and not any(f["field_name"] == "khata_number" for f in extracted_fields):
                    raw_val = khata_match.group(1).strip()
                    norm_val = FieldNormalizer.normalize_digits(raw_val)
                    extracted_fields.append({
                        "field_name": "khata_number",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.95,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # ================= 2. OWNER & PARTY NAMES =================
                # Purchaser / Buyer Name
                buyer_match = re.search(r"(?:PURCHASER|खरेदीदार|Buyer|Transferee|Second\s*Party)\s*[:\-]?\s*(?:Shri|Smt\.?)?\s*([A-Za-z\u0900-\u097F\s\.\(\)]+?)(?:\s*(?:for|and|s/o|w/o|d/o|Resident|खरेदीदार|having|,|\.|$))", line, re.IGNORECASE)
                if buyer_match and not any(f["field_name"] == "buyer_name" for f in extracted_fields):
                    raw_val = buyer_match.group(1).strip()
                    if len(raw_val) >= 3 and not re.match(r"^(is|the|for|and)$", raw_val.lower()):
                        norm_val = FieldNormalizer.transliterate_name(raw_val)
                        extracted_fields.append({
                            "field_name": "buyer_name",
                            "raw_value": raw_val,
                            "normalized_value": norm_val,
                            "confidence": 0.93,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(raw_val, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

                # Vendor / Seller Name
                seller_match = re.search(r"(?:VENDOR|विक्रेता|Seller|Transferor|First\s*Party|Previous\s*Holder)\s*[:\-]?\s*(?:Shri|Smt\.?)?\s*([A-Za-z\u0900-\u097F\s\.\(\)]+?)(?:\s*(?:and|for|s/o|w/o|d/o|Resident|,|\.|$))", line, re.IGNORECASE)
                if seller_match and not any(f["field_name"] == "seller_name" for f in extracted_fields):
                    raw_val = seller_match.group(1).strip()
                    if len(raw_val) >= 3 and not re.match(r"^(is|the|for|and)$", raw_val.lower()):
                        norm_val = FieldNormalizer.transliterate_name(raw_val)
                        extracted_fields.append({
                            "field_name": "seller_name",
                            "raw_value": raw_val,
                            "normalized_value": norm_val,
                            "confidence": 0.93,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(raw_val, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

                # Khatedar / Current Owner Name / Bhogavatadar (Occupant)
                owner_match = re.search(r"(?:भोगवटादाराचे\s*नाव|भोगवटादार|खातेदाराचे\s*नाव|खातेदार|Owner\s*Name|Pattadar|काश्तकार)\s*[:\-]?\s*(?:Shri|Smt\.?)?\s*([A-Za-z\u0900-\u097F\s\.\(\)]+?)(?:\s*(?:क्षेत्र|,|\.|$))", line, re.IGNORECASE)
                if owner_match and not any(f["field_name"] == "owner_name" for f in extracted_fields):
                    raw_val = owner_match.group(1).strip()
                    if len(raw_val) >= 3:
                        norm_val = FieldNormalizer.transliterate_name(raw_val)
                        extracted_fields.append({
                            "field_name": "owner_name",
                            "raw_value": raw_val,
                            "normalized_value": norm_val,
                            "confidence": 0.95,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(raw_val, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

                # ================= 3. AREA & NORMALIZATION =================
                area_match = re.search(r"(?:एकूण\s*क्षेत्र|क्षेत्र|Area|admeasuring|measuring|रकबा)\s*[:\-]?\s*(?:in\s*the\s*aggregate\s*)?([०-९0-9]+(?:\.[०-९0-9]+)?\s*(?:हेक्टर|हे\.आर|हे\.|एकर|गुंठा|आर|बीघा|बिघा|Acres?|Acre|Hectares?|Guntha|Bigha|Cent|Sq\.\s*(?:Meters?|Feet|Yard)|चौ\.मी\.))", line, re.IGNORECASE)
                if area_match and not any(f["field_name"] == "area" for f in extracted_fields):
                    raw_val = area_match.group(1).strip()
                    val, unit, ha = FieldNormalizer.normalize_area(raw_val)
                    norm_val = f"{ha:.4f} Hectares ({val} {unit})" if ha is not None else raw_val
                    extracted_fields.append({
                        "field_name": "area",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.96,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # ================= 4. GEOGRAPHIC LOCATION =================
                # Village & District in line like "in Wagholi, Pune"
                loc_pair_match = re.search(r"(?:in|at)\s+([A-Za-z\u0900-\u097F]+)\s*,\s*([A-Za-z\u0900-\u097F]+)", line, re.IGNORECASE)
                if loc_pair_match:
                    v_raw = loc_pair_match.group(1).strip()
                    d_raw = loc_pair_match.group(2).strip()
                    if not any(f["field_name"] == "village" for f in extracted_fields):
                        extracted_fields.append({
                            "field_name": "village",
                            "raw_value": v_raw,
                            "normalized_value": FieldNormalizer.transliterate_name(v_raw),
                            "confidence": 0.94,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(v_raw, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })
                    if not any(f["field_name"] == "district" for f in extracted_fields):
                        extracted_fields.append({
                            "field_name": "district",
                            "raw_value": d_raw,
                            "normalized_value": FieldNormalizer.transliterate_name(d_raw),
                            "confidence": 0.94,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(d_raw, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

                # Village
                village_match = re.search(r"(?:गाव|गाँव|Village)\s*[:\-]?\s*([A-Za-z\u0900-\u097F]+)", line, re.IGNORECASE)
                if village_match and not any(f["field_name"] == "village" for f in extracted_fields):
                    raw_val = village_match.group(1).strip()
                    norm_val = FieldNormalizer.transliterate_name(raw_val)
                    extracted_fields.append({
                        "field_name": "village",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.94,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # Taluka / Tehsil
                taluka_match = re.search(r"(?:तालुका|तहसील|Taluka|Tehsil)\s*[:\-]?\s*([A-Za-z\u0900-\u097F]+)", line, re.IGNORECASE)
                if taluka_match and not any(f["field_name"] == "taluka_tehsil" for f in extracted_fields):
                    raw_val = taluka_match.group(1).strip()
                    norm_val = FieldNormalizer.transliterate_name(raw_val)
                    extracted_fields.append({
                        "field_name": "taluka_tehsil",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.94,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # District
                district_match = re.search(r"(?:जिल्हा|District|Dist\.?)\s*[:\-]?\s*([A-Za-z\u0900-\u097F]+)", line, re.IGNORECASE)
                if district_match and not any(f["field_name"] == "district" for f in extracted_fields):
                    raw_val = district_match.group(1).strip()
                    norm_val = FieldNormalizer.transliterate_name(raw_val)
                    extracted_fields.append({
                        "field_name": "district",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.94,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # State
                state_match = re.search(r"(?:State\s*of\s*|शासन\s*|GOVERNMENT\s*OF\s*)(Maharashtra|Karnataka|Uttar\s*Pradesh|Telangana|महाराष्ट्र|कर्नाटक|उत्तर\s*प्रदेश)", line, re.IGNORECASE)
                if state_match and not any(f["field_name"] == "state" for f in extracted_fields):
                    raw_val = state_match.group(1).strip()
                    norm_val = FieldNormalizer.transliterate_name(raw_val)
                    extracted_fields.append({
                        "field_name": "state",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.95,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # ================= 5. MUTATION & REGISTRATION NUMBERS =================
                # Mutation Number
                mut_match = re.search(r"(?:फेरफार\s*(?:क्रमांक|क्र|नोंद)?\.?|Mutation\s*(?:Entry\s*No|Number)?\.?)\s*[:\-]?\s*([०-९0-9A-Za-z\-_/]+)", line, re.IGNORECASE)
                if mut_match and not any(f["field_name"] == "mutation_number" for f in extracted_fields):
                    raw_val = mut_match.group(1).strip()
                    norm_val = FieldNormalizer.normalize_digits(raw_val)
                    extracted_fields.append({
                        "field_name": "mutation_number",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.95,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # Registration Number
                reg_match = re.search(r"(?:Registration\s*No|दस्त\s*क्रमांक|नोंदणी\s*क्रमांक)\s*[:\-]?\s*([A-Za-z0-9\-_/]+)", line, re.IGNORECASE)
                if reg_match and not any(f["field_name"] == "registration_number" for f in extracted_fields):
                    raw_val = reg_match.group(1).strip()
                    norm_val = FieldNormalizer.normalize_digits(raw_val)
                    extracted_fields.append({
                        "field_name": "registration_number",
                        "raw_value": raw_val,
                        "normalized_value": norm_val,
                        "confidence": 0.96,
                        "page_number": p_num,
                        "bounding_box": cls._find_matching_box(raw_val, boxes),
                        "source_text": line,
                        "status": "EXTRACTED",
                    })

                # ================= 6. DATES =================
                date_match = re.search(r"(?:executed\s*on|दिनांक|Date)\s*[:\-]?\s*([०-९0-9A-Za-z\s\.,/\-]+?(?:20\d\d|19\d\d))", line, re.IGNORECASE)
                if date_match and not any(f["field_name"] == "document_date" for f in extracted_fields):
                    raw_val = date_match.group(1).strip()
                    norm_date = FieldNormalizer.normalize_date(raw_val)
                    if norm_date:
                        extracted_fields.append({
                            "field_name": "document_date",
                            "raw_value": raw_val,
                            "normalized_value": norm_date,
                            "confidence": 0.92,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(raw_val, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

                # ================= 7. BOUNDARIES =================
                if any(k in line.lower() for k in ["north:", "south:", "east:", "west:", "चतुःसीमा", "उत्तर:", "दक्षिण:"]):
                    if not any(f["field_name"] == "boundaries" for f in extracted_fields):
                        extracted_fields.append({
                            "field_name": "boundaries",
                            "raw_value": line,
                            "normalized_value": line,
                            "confidence": 0.90,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(line, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

                # ================= 8. LAND TYPE / USE =================
                if any(k in line.lower() for k in ["agricultural", "jirayat", "bagayat", "non-agricultural", "भोगवटादार वर्ग"]):
                    if not any(f["field_name"] == "land_type" for f in extracted_fields):
                        extracted_fields.append({
                            "field_name": "land_type",
                            "raw_value": line,
                            "normalized_value": line,
                            "confidence": 0.88,
                            "page_number": p_num,
                            "bounding_box": cls._find_matching_box(line, boxes),
                            "source_text": line,
                            "status": "EXTRACTED",
                        })

        # Fallback: if buyer_name exists but owner_name does not (e.g. Sale Deed), derive current_owner
        buyer_field = next((f for f in extracted_fields if f["field_name"] == "buyer_name"), None)
        owner_field = next((f for f in extracted_fields if f["field_name"] == "owner_name"), None)
        if buyer_field and not owner_field:
            extracted_fields.append({
                "field_name": "owner_name",
                "raw_value": buyer_field["raw_value"],
                "normalized_value": buyer_field["normalized_value"],
                "confidence": 0.91,
                "page_number": buyer_field["page_number"],
                "bounding_box": buyer_field["bounding_box"],
                "source_text": f"Transferred to purchaser {buyer_field['raw_value']}",
                "status": "EXTRACTED",
            })

        # Compile canonical LandRecord dict
        land_record_dict = {
            "owner_name": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "owner_name"), None),
            "survey_number": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "survey_number"), None),
            "gat_number": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "gat_number"), None),
            "khasra_number": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "khasra_number"), None),
            "khata_number": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "khata_number"), None),
            "village": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "village"), None),
            "taluka_tehsil": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "taluka_tehsil"), None),
            "district": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "district"), None),
            "mutation_number": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "mutation_number"), None),
            "registration_number": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "registration_number"), None),
            "land_type": next((f["normalized_value"] for f in extracted_fields if f["field_name"] == "land_type"), "Agricultural"),
        }

        # Parse numeric area for land record
        area_f = next((f for f in extracted_fields if f["field_name"] == "area"), None)
        if area_f and area_f.get("raw_value"):
            val, unit, ha = FieldNormalizer.normalize_area(area_f["raw_value"])
            land_record_dict["area_value"] = ha
            land_record_dict["area_unit"] = "Hectare"

        # Standard field catalogue
        STANDARD_FIELDS = [
            "owner_name", "co_owner_name", "survey_number", "gat_number", "khasra_number",
            "khata_number", "account_number", "village", "taluka_tehsil", "district",
            "state", "area", "land_type", "mutation_number", "registration_number",
            "document_date", "mutation_date", "seller_name", "buyer_name", "previous_owner",
            "current_owner", "boundaries", "plot_number", "property_number", "land_use", "remarks"
        ]

        extracted_field_names = {f["field_name"] for f in extracted_fields}
        for sf in STANDARD_FIELDS:
            if sf not in extracted_field_names:
                extracted_fields.append({
                    "field_name": sf,
                    "raw_value": None,
                    "normalized_value": None,
                    "confidence": 0.0,
                    "page_number": 1,
                    "bounding_box": None,
                    "source_text": "Field not present in document",
                    "status": "MISSING",
                    "review_status": "MISSING",
                })

        # Ensure all existing items have review_status
        for f in extracted_fields:
            if "review_status" not in f:
                conf = f.get("confidence", 0.90)
                f["review_status"] = "NEEDS_REVIEW" if conf < 0.70 else f.get("status", "EXTRACTED")

        return extracted_fields, land_record_dict


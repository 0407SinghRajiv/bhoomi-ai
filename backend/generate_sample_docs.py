"""
Generates realistic demonstration documents and rendered page scans for Phase 8.
Smart India Hackathon 2026 - Problem Statement 26018
Notice: Strictly synthetic demo records — Not official government records.
"""
import os
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

backend_dir = Path(__file__).resolve().parent
storage_demo = backend_dir / "storage" / "demo"
storage_pages = backend_dir / "storage" / "demo" / "pages"
storage_samples = backend_dir / "storage" / "demo_samples"

storage_demo.mkdir(parents=True, exist_ok=True)
storage_pages.mkdir(parents=True, exist_ok=True)
storage_samples.mkdir(parents=True, exist_ok=True)

NOTICE_TEXT = ""


def create_scanned_page(
    output_path: Path,
    title: str,
    header_lines: list,
    table_rows: list,
    footer_lines: list,
    seal_text: str = "SUB-REGISTRAR HAVELI PUNE",
    stamp_color: tuple = (40, 50, 140),
):
    """
    Renders an authentic-looking aged scanned land record document page
    with official revenue stamp, tabular layout, and realistic seal.
    """
    width, height = 1654, 2338  # Standard A4 at ~200 DPI
    # Subtle aged parchment tint
    img = Image.new("RGB", (width, height), color=(250, 248, 242))
    draw = ImageDraw.Draw(img)

    # Outer authentic margin borders
    draw.rectangle([(60, 60), (width - 60, height - 60)], outline=(140, 140, 140), width=3)
    draw.rectangle([(68, 68), (width - 68, height - 68)], outline=(180, 180, 180), width=1)

    # Top disclaimer banner
    draw.rectangle([(70, 70), (width - 70, 110)], fill=(240, 240, 235))
    draw.text((width // 2 - 260, 82), f"[{NOTICE_TEXT}]", fill=(120, 40, 40))

    # Official Revenue Department Header
    draw.text((width // 2 - 320, 130), "GOVERNMENT OF MAHARASHTRA - REVENUE DEPARTMENT", fill=(30, 30, 30))
    draw.text((width // 2 - 280, 165), "महाराष्ट्र शासन महसूल व वन विभाग (e-Records System)", fill=(40, 40, 40))
    draw.line([(100, 205), (width - 100, 205)], fill=(120, 120, 120), width=2)

    # Document Title
    draw.text((width // 2 - len(title) * 6, 225), title, fill=(20, 20, 60))
    draw.line([(width // 2 - 250, 260), (width // 2 + 250, 260)], fill=(70, 70, 100), width=2)

    y = 280
    for line in header_lines:
        draw.text((120, y), line, fill=(35, 35, 35))
        y += 35

    y += 20
    # Cadastral Data Table
    table_top = y
    table_left = 110
    table_right = width - 110
    col_split = 520

    draw.rectangle([(table_left, table_top), (table_right, table_top + len(table_rows) * 55 + 50)], outline=(80, 80, 80), width=2)
    # Header row
    draw.rectangle([(table_left, table_top), (table_right, table_top + 45)], fill=(235, 235, 228))
    draw.text((table_left + 25, table_top + 12), "CADASTRAL FIELD / अभिलेख घटक", fill=(30, 30, 30))
    draw.text((col_split + 25, table_top + 12), "RECORDED PARTICULARS / नोंद माहिती", fill=(30, 30, 30))
    draw.line([(col_split, table_top), (col_split, table_top + len(table_rows) * 55 + 50)], fill=(100, 100, 100), width=2)

    row_y = table_top + 45
    for label, val in table_rows:
        draw.line([(table_left, row_y), (table_right, row_y)], fill=(160, 160, 160), width=1)
        draw.text((table_left + 25, row_y + 15), label, fill=(40, 40, 40))
        draw.text((col_split + 25, row_y + 15), val, fill=(15, 20, 40))
        row_y += 55

    y = row_y + 40
    for line in footer_lines:
        draw.text((120, y), line, fill=(45, 45, 45))
        y += 35

    # Render Circular Revenue Seal / Stamp (Simulated authentic official ink stamp)
    seal_x, seal_y, radius = width - 260, height - 320, 95
    draw.ellipse([(seal_x - radius, seal_y - radius), (seal_x + radius, seal_y + radius)], outline=stamp_color, width=3)
    draw.ellipse([(seal_x - radius + 8, seal_y - radius + 8), (seal_x + radius - 8, seal_y + radius - 8)], outline=stamp_color, width=1)
    draw.text((seal_x - 70, seal_y - 35), "GOVT OF MAHARASHTRA", fill=stamp_color)
    draw.text((seal_x - 55, seal_y - 10), "REVENUE OFFICE", fill=stamp_color)
    draw.text((seal_x - 65, seal_y + 15), "HAVELI, PUNE", fill=stamp_color)
    draw.text((seal_x - 40, seal_y + 40), "* CERTIFIED *", fill=stamp_color)

    # Signature box
    sig_x, sig_y = 120, height - 280
    draw.rectangle([(sig_x, sig_y), (sig_x + 360, sig_y + 110)], outline=(160, 160, 160), width=1)
    draw.text((sig_x + 20, sig_y + 15), "Digitally Signed / प्रमाणित स्वाक्षरी", fill=(70, 70, 70))
    draw.text((sig_x + 20, sig_y + 45), "Talathi / Circle Officer Haveli", fill=(30, 30, 80))
    draw.text((sig_x + 20, sig_y + 75), "Date: 12-10-2023 | PUNE", fill=(90, 90, 90))

    img.save(str(output_path), "PNG")
    print(f"Generated realistic authentic page scan: {output_path}")


def generate_all():
    # 1. Authentic scans in storage/demo/pages
    p1_extract = storage_pages / "extract_p1.png"
    create_scanned_page(
        output_path=p1_extract,
        title="गाव नमुना सात (अधिकार अभिलेख पत्रक) - 7/12 EXTRACT",
        header_lines=[
            "Village / मौजे: Wagholi (वाघोली) | Taluka / तालुका: Haveli (हवेली) | District / जिल्हा: Pune (पुणे)",
            "Record Reference: MAHA-REV-2023-WAG-124-2 | Issued by Haveli Tehsil Office",
        ],
        table_rows=[
            ("Survey / Gat No. (गट क्र. व उपविभाग)", "124/2 (Survey 124, Hissa 2)"),
            ("Khatedar / Landowner (खातेदाराचे नाव)", "Rajendra Dattatray Patil (राजेंद्र दत्तात्रय पाटील)"),
            ("Khata Account No. (खाते क्रमांक)", "894"),
            ("Tenure / Occupancy Class (भूधारणा पद्धती)", "Occupant Class - 1 (भोगवटादार वर्ग - १)"),
            ("Total Area (एकूण क्षेत्र)", "1.42 Hectares (१ हेक्टर ४२ आर)"),
            ("Cultivable Area (लागवडीयोग्य क्षेत्र)", "1.42 Hectare (Jirayat / बागायत)"),
            ("Potkharab / Uncultivable (पोटखराब)", "0.00 Nil (निरंक)"),
            ("Land Revenue Assessment (आकारणी)", "Rs. 24.50 (चौवीस रुपये पन्नास पैसे)"),
            ("Mutation Encumbrance Notes (फेरफार नोंदी)", "Ferfar #894 sanctioned on 14/11/2018 (Sale Deed)"),
        ],
        footer_lines=[
            "This extract is generated from computerized land records database for verification.",
            "All mutations up to 12th October 2023 incorporated under MLR Code 1966.",
        ],
        seal_text="TALATHI WAGHOLI PUNE",
        stamp_color=(35, 60, 150),
    )

    p1_sale = storage_pages / "sale_deed_p1.png"
    create_scanned_page(
        output_path=p1_sale,
        title="DEED OF ABSOLUTE SALE / CONVEYANCE (नोंदणीकृत खरेदीखत)",
        header_lines=[
            "Registration No: REG-2018-74921 | Sub-Registrar Office: Haveli-4, Pune",
            "Execution Date: 14th November 2018 | Stamp Duty Paid: Rs. 2,25,000 | Reg Fee: Rs. 30,000",
        ],
        table_rows=[
            ("Vendor / Seller (विक्रेता)", "Suresh Chandra Patel (सुरेश चंद्र पटेल)"),
            ("Purchaser / Grantee (खरेदीदार)", "Rajendra Dattatray Patil (राजेंद्र दत्तात्रय पाटील)"),
            ("Property Description (मिळकतीचे वर्णन)", "Agricultural land Survey No. 124/2 at Wagholi, Haveli, Pune"),
            ("Conveyed Area (हस्तांतरित क्षेत्र)", "1.42 Hectares (equivalent to 3.51 Acres)"),
            ("Sale Consideration (खरेदी मोबदला)", "Rs. 58,00,000/- (Fifty Eight Lakhs Only) Full Paid"),
            ("North Boundary (उत्तर सीमा)", "Gat No. 124/1 (Suresh Chandra Patel)"),
            ("South Boundary (दक्षिण सीमा)", "Gat No. 124/4 (Gram Panchayat Canal Road)"),
            ("East Boundary (पूर्व सीमा)", "Gat No. 124/3 (Rameshwar Sadashivrao Patil)"),
            ("West Boundary (पश्चिम सीमा)", "Wagholi Village Cart Road / ओढा"),
        ],
        footer_lines=[
            "Witnesses: (1) Nilesh S. Deshmukh, Pune (2) Vikas B. Jadhav, Wagholi",
            "Indexed in Sub-Registrar Index-II under Volume 4182, Pages 112 to 128.",
        ],
        seal_text="SUB-REGISTRAR HAVELI PUNE",
        stamp_color=(45, 30, 110),
    )

    p1_mutation = storage_pages / "mutation_p1.png"
    create_scanned_page(
        output_path=p1_mutation,
        title="गाव नमुना सहा (हक्कांचे फेरफार पत्रक) - FORM 6 MUTATION REGISTER",
        header_lines=[
            "Mutation Entry No: 894 (फेरफार नोंद क्रमांक ८९४) | Village: Wagholi, Haveli, Pune",
            "Basis: Registered Conveyance Deed #REG-2018-74921 dated 14/11/2018",
        ],
        table_rows=[
            ("Cadastral Gat No. (गट क्रमांक)", "124/2 (Survey 124/2)"),
            ("Former Khatedar (मागील खातेदार)", "Suresh Chandra Patel (खाते क्र. ६१२)"),
            ("New Khatedar (नवीन खातेदार)", "Rajendra Dattatray Patil (राजेंद्र दत्तात्रय पाटील)"),
            ("Transferred Area (हस्तांतरित क्षेत्र)", "1.42 Hectare (१ हेक्टर ४२ आर)"),
            ("Public Notice Date (नोटीस तारीख)", "20/11/2018 (Form 9 issued, No Objections received)"),
            ("Sanctioning Order (मंजुरी आदेश)", "Certified by Circle Inspector, Haveli on 15/12/2018"),
            ("Status (स्थिती)", "Certified / प्रमाणित नोंद (Amal in 7/12 completed)"),
        ],
        footer_lines=[
            "Verified against Sub-Registrar Index Register II by Revenue Circle Inspector.",
            "Certified under Maharashtra Land Revenue Code Section 150(4).",
        ],
        seal_text="CIRCLE OFFICER HAVELI PUNE",
        stamp_color=(30, 75, 45),
    )

    # Helper to convert image to PDF
    def img_to_pdf(img_path: Path, pdf_path: Path):
        with Image.open(str(img_path)) as im:
            im.convert("RGB").save(str(pdf_path), "PDF", resolution=200.0)
        print(f"Created authentic PDF: {pdf_path}")

    # Generate PDFs in storage/demo
    img_to_pdf(p1_extract, storage_demo / "7_12_Extract_Gat_124_2.pdf")
    img_to_pdf(p1_sale, storage_demo / "Sale_Deed_Doc_124_2.pdf")
    img_to_pdf(p1_mutation, storage_demo / "Ferfar_Mutation_Entry_894.pdf")

    # Keep aliases in storage/demo
    img_to_pdf(p1_extract, storage_demo / "7_12_Extract_Gat_142_3.pdf")
    img_to_pdf(p1_sale, storage_demo / "Sale_Deed_Doc_142_3.pdf")

    # =========================================================================
    # 2. Re-create exact sample files in storage/demo_samples expected by test_ocr_pipeline:
    # =========================================================================
    # Sample 1: sample_7_12_extract.pdf with native digital text
    doc_712 = fitz.open()
    page1 = doc_712.new_page(width=595, height=842)
    text_lines_712 = [
        (50, 60, "महाराष्ट्र शासन महसूल विभाग (Maharashtra Government Revenue Department)"),
        (50, 85, "गाव नमुना सात (अधिकार अभिलेख पत्रक) - गाव: वाघोली, तालुका: हवेली, जिल्हा: पुणे"),
        (50, 110, "------------------------------------------------------------------------------------------"),
        (50, 140, "गट क्रमांक व उपविभाग: १४२/३ (Gat Number: 142/3)"),
        (50, 170, "भूधारणा पद्धती: भोगवटादार वर्ग - १ (Bhogwatadar Class - 1)"),
        (50, 200, "खाते क्रमांक: ८९४ (Khata Number: 894)"),
        (50, 230, "खातेदाराचे नाव: राजेश कुमार (Rajesh Kumar)"),
        (50, 260, "एकूण क्षेत्र: ०.८०९ हेक्टर (Area: 0.809 Hectares / 2.00 Acres)"),
        (50, 290, "पोटखराब क्षेत्र: निरंक (Potkharab: Nil)"),
        (50, 320, "आकारणी (रुपये): १२.५० (Assessment: Rs 12.50)"),
        (50, 350, "इतर अधिकार व नोंदी: फेरफार क्रमांक ८९४ अन्वये नोंद प्रमाणित."),
    ]
    for x, y, line in text_lines_712:
        page1.insert_text((x, y), line, fontsize=11)
    doc_712.save(str(storage_samples / "sample_7_12_extract.pdf"))
    doc_712.close()

    # Sample 2: sample_sale_deed.pdf with native digital text
    doc_sale = fitz.open()
    sale_p1 = doc_sale.new_page(width=595, height=842)
    sale_lines = [
        (50, 60, "GOVERNMENT OF MAHARASHTRA - DEPARTMENT OF REGISTRATION"),
        (50, 85, "REGISTERED DEED OF ABSOLUTE CONVEYANCE / SALE DEED"),
        (50, 110, "Registration No: REG-2018-74921 | Sub-Registrar Haveli, Pune"),
        (50, 135, "------------------------------------------------------------------------------------------"),
        (50, 165, "THIS INDENTURE OF SALE is executed on 14th November 2018 by:"),
        (50, 195, "VENDOR: Shri Suresh Chandra Patel, Resident of Pune, Maharashtra (First Party)"),
        (50, 225, "PURCHASER: Shri Rajesh Kumar s/o Rameshwar Kumar (Second Party)"),
        (50, 265, "SCHEDULE OF PROPERTY CONVEYED:"),
        (50, 295, "All that piece and parcel of agricultural land bearing Survey / Gat No. 142/3,"),
        (50, 325, "admeasuring 2.00 Acres (equivalent to 0.809 Hectares or 80.9 R) situated at"),
        (50, 355, "Village Wagholi, Taluka Haveli, District Pune, bounded as follows:"),
        (50, 385, "North: Gat No. 142/1 | South: Canal Road | East: Gat No. 143 | West: Gat No. 141"),
        (50, 425, "CONSIDERATION: Total sale consideration Rs. 45,00,000 paid in full."),
    ]
    for x, y, line in sale_lines:
        sale_p1.insert_text((x, y), line, fontsize=11)
    doc_sale.save(str(storage_samples / "sample_sale_deed.pdf"))
    doc_sale.close()

    # Sample 3: sample_mutation_scan.png (real PNG image)
    img_sample = Image.new("RGB", (1600, 1200), color=(248, 248, 246))
    draw_s = ImageDraw.Draw(img_sample)
    draw_s.rectangle([(80, 60), (1520, 1140)], outline=(120, 120, 120), width=3)
    draw_s.text((100, 90), "VILLAGE MUTATION REGISTER EXTRACT - FORM 6", fill=(30, 30, 30))
    draw_s.text((100, 130), "Mutation Entry No: 894 | Village: Wagholi, Taluka: Haveli, Dist: Pune", fill=(50, 50, 50))
    draw_s.line([(100, 160), (1500, 160)], fill=(150, 150, 150), width=2)
    draw_s.text((100, 200), "Cadastral Gat No: 142/3", fill=(40, 40, 40))
    draw_s.text((100, 240), "Previous Holder: Suresh Chandra Patel", fill=(40, 40, 40))
    draw_s.text((100, 280), "Transferee Recorded: Rakesh Kumar (Typographical variance on deed)", fill=(40, 40, 40))
    draw_s.text((100, 320), "Total Transferred Area: 0.809 Hectares (2.00 Acres)", fill=(40, 40, 40))
    draw_s.text((100, 360), "Sanctioning Authority: Circle Officer / Talathi Haveli Division", fill=(40, 40, 40))
    img_sample.save(str(storage_samples / "sample_mutation_scan.png"))

    # Sample 4 & 5: Corrupted & Empty
    with open(storage_samples / "corrupted_sample.pdf", "wb") as f:
        f.write(b"NOT A REAL PDF FILE JUNK BYTES 12345")
    with open(storage_samples / "empty_sample.pdf", "wb") as f:
        pass

    print("All demo and test sample documents successfully created!")


if __name__ == "__main__":
    generate_all()

/**
 * Generates realistic SVG document previews for BhoomiAI Demo & Video Recording.
 * Emulates authentic government land records (Sale Deed, Mutation Entry 742, 7/12 Satbara Extract)
 * with official seals, bilingual text, stamps, and highlighted source regions.
 */

export function getFallbackDocumentSvg(documentId: number | string, _pageNumber: number = 1): string {
  const docId = Number(documentId) || 1;

  if (docId === 1 || String(documentId).includes('sale') || String(documentId).includes('142')) {
    // Document 1: Registered Sale Deed (English / Legal)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
      <!-- Background Paper -->
      <rect width="800" height="1100" fill="#FAF7EE"/>
      <rect width="760" height="1060" x="20" y="20" fill="none" stroke="#8C7A58" stroke-width="2"/>
      <rect width="750" height="1050" x="25" y="25" fill="none" stroke="#D4C8B0" stroke-width="1"/>

      <!-- Government Stamp / Emblem Header -->
      <rect x="50" y="45" width="700" height="130" fill="#F4EEDC" rx="4" stroke="#B8A783" stroke-width="1.5"/>
      <circle cx="110" cy="110" r="45" fill="#E8DEC4" stroke="#8B6E32" stroke-width="2"/>
      <text x="110" y="105" font-family="serif" font-size="10" font-weight="bold" fill="#5C4517" text-anchor="middle">GOVERNMENT OF</text>
      <text x="110" y="120" font-family="serif" font-size="12" font-weight="bold" fill="#3D2E0F" text-anchor="middle">MAHARASHTRA</text>

      <text x="410" y="80" font-family="serif" font-size="20" font-weight="bold" fill="#2C2211" text-anchor="middle" letter-spacing="1">DEED OF ABSOLUTE SALE</text>
      <text x="410" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="#7A6337" text-anchor="middle">DEPARTMENT OF REGISTRATION &amp; STAMPS • PUNE SUB-DISTRICT</text>
      <text x="410" y="125" font-family="monospace" font-size="11" fill="#473A22" text-anchor="middle">REGISTRATION NO: REG-2018-74921 / BOOK-1 / VOL-420</text>
      <text x="410" y="145" font-family="monospace" font-size="10" fill="#2E7D32" text-anchor="middle" font-weight="bold">STAMP DUTY PAID: ₹ 1,45,000/- (e-Challan MH-PUN-091823)</text>

      <!-- Watermark Seal -->
      <circle cx="400" cy="550" r="180" fill="none" stroke="#E3D7BA" stroke-width="6" opacity="0.4"/>
      <text x="400" y="540" font-family="serif" font-size="28" font-weight="bold" fill="#D1C29C" opacity="0.35" text-anchor="middle">SUB-REGISTRAR HAVELI</text>
      <text x="400" y="575" font-family="sans-serif" font-size="16" fill="#D1C29C" opacity="0.35" text-anchor="middle">MAHARASHTRA STATE ARCHIVES</text>

      <!-- Document Body Legal Text -->
      <g font-family="Georgia, serif" font-size="13.5" fill="#1C1A17">
        <text x="60" y="210" font-weight="bold">THIS INDENTURE OF SALE made this 14th day of May, 2018 at Wagholi, Pune:</text>

        <text x="60" y="245" font-style="italic" fill="#555">BETWEEN:</text>
        <text x="60" y="268">SHRI <tspan font-weight="bold">SURESH PATEL</tspan>, s/o Shri Mohanlal Patel, aged 54 years,</text>
        <text x="60" y="288">residing at Plot 12, Keshav Nagar, Wagholi, Taluka Haveli, District Pune</text>
        <text x="60" y="308">(hereinafter called the <tspan font-weight="bold">"VENDOR"</tspan>, which expression shall include his heirs).</text>

        <text x="60" y="340" font-style="italic" fill="#555">AND IN FAVOUR OF:</text>

        <!-- Highlighted Purchaser Box -->
        <rect x="55" y="355" width="690" height="60" fill="#FFF4DE" stroke="#E67E22" stroke-width="2" rx="4" stroke-dasharray="4 2"/>
        <text x="70" y="380" font-weight="bold" font-size="15" fill="#873600">PURCHASER: SHRI RAJESH KUMAR</text>
        <text x="70" y="402" font-size="13" fill="#2C3E50">s/o Rameshwar Kumar, aged 38 years, residing at A-402, Green Meadows, Wagholi, Pune.</text>

        <text x="60" y="445">WHEREAS the Vendor is the absolute and lawful owner in possession of agricultural</text>
        <text x="60" y="465">land situated at <tspan font-weight="bold">Village Wagholi, Taluka Haveli, District Pune</tspan>, bearing:</text>

        <!-- Property Schedule Table -->
        <g transform="translate(60, 485)">
          <rect width="680" height="110" fill="#FAF4E6" stroke="#8C7A58" stroke-width="1.5" rx="3"/>
          <line x1="0" y1="35" x2="680" y2="35" stroke="#8C7A58" stroke-width="1.5"/>
          <line x1="160" y1="0" x2="160" y2="110" stroke="#8C7A58" stroke-width="1"/>
          <line x1="330" y1="0" x2="330" y2="110" stroke="#8C7A58" stroke-width="1"/>
          <line x1="490" y1="0" x2="490" y2="110" stroke="#8C7A58" stroke-width="1"/>

          <text x="80" y="24" font-weight="bold" font-size="12" text-anchor="middle" fill="#3E3421">SURVEY / GAT NO.</text>
          <text x="245" y="24" font-weight="bold" font-size="12" text-anchor="middle" fill="#3E3421">TOTAL AREA</text>
          <text x="410" y="24" font-weight="bold" font-size="12" text-anchor="middle" fill="#3E3421">VILLAGE / TALUKA</text>
          <text x="585" y="24" font-weight="bold" font-size="12" text-anchor="middle" fill="#3E3421">LAND TENURE</text>

          <text x="80" y="70" font-weight="bold" font-size="15" text-anchor="middle" fill="#1B4F72">Gat 142/3</text>
          <text x="245" y="65" font-weight="bold" font-size="14" text-anchor="middle" fill="#1B4F72">2.00 Acres</text>
          <text x="245" y="85" font-size="11" text-anchor="middle" fill="#5D6D7E">(0.809 Hectares)</text>
          <text x="410" y="65" font-size="13" text-anchor="middle" fill="#2C3E50">Wagholi, Haveli</text>
          <text x="410" y="85" font-size="11" text-anchor="middle" fill="#5D6D7E">Dist. Pune</text>
          <text x="585" y="70" font-size="12" text-anchor="middle" fill="#2C3E50">Class-1 Occupant</text>
        </g>

        <!-- Terms of Consideration -->
        <text x="60" y="625">NOW THIS DEED WITNESSETH that in consideration of the sum of</text>
        <text x="60" y="645"><tspan font-weight="bold">₹ 28,50,000/- (Rupees Twenty-Eight Lakhs Fifty Thousand Only)</tspan> paid by the Purchaser</text>
        <text x="60" y="665">to the Vendor via RTGS Bank Ref: SBIN8192304918 dated 12/05/2018,</text>
        <text x="60" y="685">the Vendor doth hereby sell, transfer, convey and assign all freehold title.</text>

        <!-- Boundaries -->
        <text x="60" y="725" font-weight="bold" fill="#3E3421">SCHEDULE OF BOUNDARIES (CADASTRAL ORIENTATION):</text>
        <text x="80" y="750">• East: Land belonging to Survey 142/2 (Govind More)</text>
        <text x="80" y="770">• West: 12-meter Village Access Road &amp; Canal Line</text>
        <text x="80" y="790">• North: Survey 141 (Agricultural Plot)</text>
        <text x="80" y="810">• South: Gat No. 143 Boundary Canal</text>
      </g>

      <!-- Signatures & Official Stamps -->
      <g transform="translate(60, 850)">
        <rect width="680" height="170" fill="#F7F3E6" stroke="#B8A783" stroke-width="1" rx="4"/>
        
        <!-- Vendor Signature Box -->
        <text x="120" y="35" font-size="12" font-weight="bold" fill="#555" text-anchor="middle">VENDOR SIGNATURE</text>
        <path d="M 50 75 Q 80 45 110 70 T 170 65 T 200 80" fill="none" stroke="#1A5276" stroke-width="2.5"/>
        <text x="120" y="105" font-size="11" font-weight="bold" text-anchor="middle" fill="#222">[Suresh Mohanlal Patel]</text>
        <text x="120" y="125" font-size="10" fill="#777" text-anchor="middle">UIDAI: XXXX-XXXX-4819</text>

        <!-- Purchaser Signature Box -->
        <text x="560" y="35" font-size="12" font-weight="bold" fill="#555" text-anchor="middle">PURCHASER SIGNATURE</text>
        <path d="M 490 75 Q 520 40 550 70 T 610 60 T 630 80" fill="none" stroke="#1A5276" stroke-width="2.5"/>
        <text x="560" y="105" font-size="11" font-weight="bold" text-anchor="middle" fill="#873600">[Rajesh Rameshwar Kumar]</text>
        <text x="560" y="125" font-size="10" fill="#777" text-anchor="middle">UIDAI: XXXX-XXXX-9902</text>

        <!-- Registrar Rubber Stamp -->
        <circle cx="340" cy="85" r="45" fill="none" stroke="#922B21" stroke-width="2" stroke-dasharray="6 2"/>
        <text x="340" y="75" font-family="sans-serif" font-size="9" font-weight="bold" fill="#922B21" text-anchor="middle">REGISTERED AT HAVELI</text>
        <text x="340" y="90" font-family="monospace" font-size="10" font-weight="bold" fill="#922B21" text-anchor="middle">14-05-2018</text>
        <text x="340" y="105" font-family="sans-serif" font-size="8" fill="#922B21" text-anchor="middle">SEAL OF SUB-REGISTRAR</text>
      </g>

      <!-- Footer -->
      <text x="400" y="1055" font-family="monospace" font-size="10" fill="#888" text-anchor="middle">Page 1 of 3 • BhoomiAI Verified Digital Land Instrument • Hash: e4c9a8...f102</text>
    </svg>`;
  } else if (docId === 2 || String(documentId).includes('ferfar') || String(documentId).includes('mutation')) {
    // Document 2: Mutation Record / Ferfar Entry 894 / 742 (Marathi Revenue)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
      <!-- Background Paper -->
      <rect width="800" height="1100" fill="#FBF8EE"/>
      <rect width="760" height="1060" x="20" y="20" fill="none" stroke="#7A6843" stroke-width="2"/>

      <!-- Revenue Department Header -->
      <rect x="50" y="45" width="700" height="120" fill="#F3ECDA" rx="4" stroke="#9C8860" stroke-width="1.5"/>
      <text x="400" y="78" font-family="'Noto Sans Devanagari', 'Lohit Devanagari', 'Mukta', serif" font-size="20" font-weight="bold" fill="#3D2B0F" text-anchor="middle">महाराष्ट्र शासन — महसूल व वन विभाग</text>
      <text x="400" y="105" font-family="'Noto Sans Devanagari', 'Mukta', sans-serif" font-size="14" font-weight="bold" fill="#6B4B18" text-anchor="middle">गाव नमुना ६ (हक्क नोंदणी पत्रक / फेरफार नोंद)</text>
      <text x="400" y="130" font-family="monospace" font-size="12" fill="#2E4053" text-anchor="middle">गाव: वाघोली • तालुका: हवेली • जिल्हा: पुणे • फेरफार नोंद क्र. ७४२ (Entry 742)</text>

      <!-- Watermark Stamp -->
      <circle cx="400" cy="540" r="170" fill="none" stroke="#E0D2B4" stroke-width="5" opacity="0.35"/>
      <text x="400" y="535" font-family="'Noto Sans Devanagari', serif" font-size="26" font-weight="bold" fill="#C4B18A" opacity="0.4" text-anchor="middle">तलाठी सजा वाघोली</text>
      <text x="400" y="565" font-family="sans-serif" font-size="14" fill="#C4B18A" opacity="0.4" text-anchor="middle">TALATHI REVENUE OFFICE</text>

      <!-- Ferfar Content Table -->
      <g transform="translate(50, 185)">
        <rect width="700" height="640" fill="#FFFDF8" stroke="#8C7A58" stroke-width="1.5" rx="3"/>
        
        <!-- Table Column Headers -->
        <rect width="700" height="45" fill="#EFE8D3" stroke="#8C7A58" stroke-width="1"/>
        <line x1="120" y1="0" x2="120" y2="640" stroke="#8C7A58" stroke-width="1"/>
        <line x1="490" y1="0" x2="490" y2="640" stroke="#8C7A58" stroke-width="1"/>
        <line x1="590" y1="0" x2="590" y2="640" stroke="#8C7A58" stroke-width="1"/>

        <text x="60" y="28" font-family="'Noto Sans Devanagari', sans-serif" font-size="12" font-weight="bold" fill="#3D2B0F" text-anchor="middle">नोंद क्र.</text>
        <text x="305" y="28" font-family="'Noto Sans Devanagari', sans-serif" font-size="12" font-weight="bold" fill="#3D2B0F" text-anchor="middle">हक्काचे स्वरूप आणि फेरफाराचा तपशील (Particulars of Transfer)</text>
        <text x="540" y="28" font-family="'Noto Sans Devanagari', sans-serif" font-size="12" font-weight="bold" fill="#3D2B0F" text-anchor="middle">खाते क्र.</text>
        <text x="645" y="28" font-family="'Noto Sans Devanagari', sans-serif" font-size="12" font-weight="bold" fill="#3D2B0F" text-anchor="middle">शेरा / निकाल</text>

        <!-- Row 1: Ferfar 742 Details -->
        <text x="60" y="80" font-family="monospace" font-size="16" font-weight="bold" fill="#78281F" text-anchor="middle">७४२</text>
        <text x="60" y="105" font-family="sans-serif" font-size="10" fill="#888" text-anchor="middle">दिनांक:</text>
        <text x="60" y="125" font-family="monospace" font-size="11" fill="#333" text-anchor="middle">22/05/2018</text>

        <!-- Mutation Narrative Body -->
        <g transform="translate(135, 60)" font-family="'Noto Sans Devanagari', Georgia, serif" font-size="13" fill="#1C1A17">
          <text x="0" y="25" font-weight="bold" fill="#145A32">खरेदीखत नोंदणी आधारे फेरफार नोंद (Mutation by Registered Sale Deed):</text>
          
          <text x="0" y="55">दुय्यम निबंधक हवेली क्र. ३ यांचे कार्यालयात दस्त क्रमांक</text>
          <text x="0" y="78"><tspan font-weight="bold">REG-2018-74921</tspan> अन्वये नोंदणीकृत खरेदीखतानुसार गट नं. <tspan font-weight="bold">१४२/३</tspan></text>
          <text x="0" y="101">क्षेत्र <tspan font-weight="bold">२.०० एकर (०.८०९ हेक्टर)</tspan> चे मूळ मालक श्री सुरेश पटेल यांजकडून:</text>

          <!-- Conflict Highlight in Mutation Entry -->
          <rect x="-5" y="120" width="345" height="55" fill="#FDEDEC" stroke="#C0392B" stroke-width="2" rx="3" stroke-dasharray="4 2"/>
          <text x="10" y="145" font-weight="bold" font-size="14" fill="#922B21">नवीन खरेदीदार: श्री राकेश कुमार (Rakesh Kumar)</text>
          <text x="10" y="165" font-size="11" fill="#78281F">Note: Typo in revenue ledger transcript vs Sale Deed (Rajesh)</text>

          <text x="0" y="205">यांचे नावे खरेदीने दाखल करण्यात येत आहे.</text>
          <text x="0" y="230">तसेच सदर नोंदीवर महाराष्ट्र जमीन महसूल संहिता कलम १५० अन्वये</text>
          <text x="0" y="255">नोटीस जारी करून मुदतीत कोणाचीही हरकत न आल्याने नोंद मंजूर केली.</text>

          <line x1="0" y1="280" x2="340" y2="280" stroke="#D5D8DC" stroke-width="1"/>

          <text x="0" y="310" font-size="12" fill="#555">सजा तलाठी: वाघोली (स्वाक्षरी व शिक्का)</text>
          <text x="0" y="335" font-size="12" fill="#555">मंडळ अधिकारी हवेली: मंजूर आदेश क्र. २४१/२०१८</text>
        </g>

        <!-- Khata No & Status Columns -->
        <text x="540" y="90" font-family="monospace" font-size="14" font-weight="bold" fill="#2C3E50" text-anchor="middle">३८२</text>
        
        <rect x="605" y="70" width="80" height="28" fill="#D4EFDF" rx="3" stroke="#27AE60" stroke-width="1"/>
        <text x="645" y="88" font-family="'Noto Sans Devanagari', sans-serif" font-size="11" font-weight="bold" fill="#145A32" text-anchor="middle">प्रमाणित</text>
        <text x="645" y="115" font-family="monospace" font-size="9" fill="#555" text-anchor="middle">18/06/2018</text>
      </g>

      <!-- Official Revenue Officer Stamp -->
      <g transform="translate(480, 850)">
        <rect width="270" height="150" fill="#F4ECDA" stroke="#9C8860" stroke-width="1" rx="4"/>
        <circle cx="80" cy="75" r="40" fill="none" stroke="#7D6608" stroke-width="2"/>
        <text x="80" y="70" font-family="'Noto Sans Devanagari', sans-serif" font-size="8" font-weight="bold" fill="#7D6608" text-anchor="middle">तलाठी कार्यालय</text>
        <text x="80" y="85" font-family="'Noto Sans Devanagari', sans-serif" font-size="9" font-weight="bold" fill="#7D6608" text-anchor="middle">वाघोली, पुणे</text>

        <path d="M 140 70 Q 170 40 200 65 T 250 80" fill="none" stroke="#1A5276" stroke-width="2"/>
        <text x="195" y="110" font-family="'Noto Sans Devanagari', sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#333">मंडळ अधिकारी, हवेली</text>
        <text x="195" y="128" font-family="monospace" font-size="9" fill="#777" text-anchor="middle">CERTIFIED: 18-06-2018</text>
      </g>

      <!-- Footer -->
      <text x="400" y="1055" font-family="monospace" font-size="10" fill="#888" text-anchor="middle">Page 1 of 2 • गाव नमुना ६ फेरफार • Digital Cadastral Registry MH</text>
    </svg>`;
  } else {
    // Document 3: Satbara / 7/12 Extract (गाव नमुना ७/१२)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
      <!-- Background Paper -->
      <rect width="800" height="1100" fill="#FCFAF2"/>
      <rect width="760" height="1060" x="20" y="20" fill="none" stroke="#6E2C00" stroke-width="2"/>

      <!-- Header -->
      <rect x="50" y="45" width="700" height="125" fill="#F6EFE0" rx="4" stroke="#A04000" stroke-width="1.5"/>
      <text x="400" y="78" font-family="'Noto Sans Devanagari', 'Mukta', serif" font-size="20" font-weight="bold" fill="#6E2C00" text-anchor="middle">महाराष्ट्र शासन — महसूल विभाग (महाभूमी पोर्टल)</text>
      <text x="400" y="105" font-family="'Noto Sans Devanagari', 'Mukta', sans-serif" font-size="15" font-weight="bold" fill="#7E5109" text-anchor="middle">गाव नमुना सात (७) व गाव नमुना बारा (१२) — अधिकार अभिलेख पत्रक</text>
      <text x="400" y="130" font-family="monospace" font-size="12" fill="#2E4053" text-anchor="middle">गाव: वाघोली (कोड: 554201) • तालुका: हवेली • जिल्हा: पुणे</text>

      <!-- Satbara Table Grid -->
      <g transform="translate(50, 185)">
        <rect width="700" height="660" fill="#FFFDF9" stroke="#6E2C00" stroke-width="1.5" rx="3"/>

        <!-- Top Half: Village Form 7 (गाव नमुना ७) -->
        <rect width="700" height="35" fill="#EDBB99" opacity="0.4"/>
        <line x1="0" y1="35" x2="700" y2="35" stroke="#6E2C00" stroke-width="1.5"/>
        <line x1="350" y1="0" x2="350" y2="380" stroke="#6E2C00" stroke-width="1.5"/>

        <text x="175" y="24" font-family="'Noto Sans Devanagari', sans-serif" font-size="13" font-weight="bold" fill="#6E2C00" text-anchor="middle">गाव नमुना ७ (अधिकार अभिलेख)</text>
        <text x="525" y="24" font-family="'Noto Sans Devanagari', sans-serif" font-size="13" font-weight="bold" fill="#6E2C00" text-anchor="middle">खातेदारांचे नाव व इतर हक्क</text>

        <!-- Left Cell: Survey & Area -->
        <g transform="translate(15, 50)" font-family="'Noto Sans Devanagari', sans-serif" font-size="12.5" fill="#222">
          <text x="0" y="25" font-weight="bold">भूमापन क्रमांक / गट क्रमांक (Survey/Gat):</text>
          
          <rect x="0" y="38" width="160" height="35" fill="#E8F8F5" stroke="#117864" stroke-width="1.5" rx="3"/>
          <text x="80" y="62" font-family="monospace" font-size="18" font-weight="bold" fill="#117864" text-anchor="middle">142/3</text>

          <text x="0" y="105" font-weight="bold">क्षेत्र (Area Breakdown):</text>
          <text x="10" y="128">• जिरायत शेती: <tspan font-weight="bold" font-family="monospace">0.8090 हेक्टर</tspan> (2.00 Acres)</text>
          <text x="10" y="150">• पोटखराब (वर्ग अ): <tspan font-family="monospace">0.0000</tspan></text>
          <text x="10" y="172">• एकूण क्षेत्र: <tspan font-weight="bold" font-family="monospace">0.8090 हेक्टर</tspan></text>

          <text x="0" y="210" font-weight="bold">आकारणी / जुडी (Assessment):</text>
          <text x="10" y="232">• रु. <tspan font-family="monospace">14.50</tspan> पैसे</text>

          <text x="0" y="270" font-weight="bold">भोगवटदार वर्ग (Tenure):</text>
          <text x="10" y="292">भोगवटदार वर्ग - १ (Freehold Occupant)</text>
        </g>

        <!-- Right Cell: Owner / Khatedar & Mutation Cross-Reference -->
        <g transform="translate(365, 50)" font-family="'Noto Sans Devanagari', sans-serif" font-size="12.5" fill="#222">
          <text x="0" y="25" font-weight="bold">खाते क्रमांक व खातेदाराचे नाव (Owner Name):</text>

          <!-- Highlighted Marathi Owner Name -->
          <rect x="0" y="38" width="320" height="70" fill="#FEF9E7" stroke="#F39C12" stroke-width="2" rx="3" stroke-dasharray="4 2"/>
          <text x="15" y="66" font-size="16" font-weight="bold" fill="#935116">राजेश कुमार (Rajesh Kumar)</text>
          <text x="15" y="88" font-size="11" fill="#7D6608">खाते क्र. ३८२ • हिस्सा: १/१ (पूर्ण मालकी)</text>

          <text x="0" y="135" font-weight="bold">इतर हक्क व फेरफार नोंदी (Mutations &amp; Encumbrances):</text>
          <text x="10" y="160">• खरेदी फेरफार क्र. <tspan font-weight="bold" font-family="monospace">७४२</tspan> (मंजूर दि. 18/06/2018)</text>
          <text x="10" y="185">• बोजा: बँक ऑफ महाराष्ट्र पीक कर्ज रु. २,००,०००/-</text>
          <text x="10" y="208">• फेरफार नोंद क्र. ८१२ (बोजा नोंद दि. 10/01/2021)</text>
        </g>

        <!-- Middle Divider for Village Form 12 (गाव नमुना १२ पीक पाहणी) -->
        <line x1="0" y1="380" x2="700" y2="380" stroke="#6E2C00" stroke-width="2"/>
        <rect y="380" width="700" height="35" fill="#D5F5E3" opacity="0.6"/>
        <text x="350" y="403" font-family="'Noto Sans Devanagari', sans-serif" font-size="13" font-weight="bold" fill="#1E8449" text-anchor="middle">गाव नमुना १२ — पिकांची नोंदवही (Crop Inspection Record)</text>

        <!-- Crop Details Table -->
        <g transform="translate(15, 430)" font-family="'Noto Sans Devanagari', sans-serif" font-size="12" fill="#333">
          <line x1="0" y1="30" x2="670" y2="30" stroke="#BDC3C7" stroke-width="1"/>
          <text x="50" y="20" font-weight="bold">वर्ष (Year)</text>
          <text x="180" y="20" font-weight="bold">हंगाम (Season)</text>
          <text x="320" y="20" font-weight="bold">पिकाचे नाव (Crop)</text>
          <text x="480" y="20" font-weight="bold">जलसिंचन (Irrigation)</text>
          <text x="600" y="20" font-weight="bold">लागवड क्षेत्र</text>

          <text x="50" y="55" font-family="monospace">2023-24</text>
          <text x="180" y="55">खरीप (Kharif)</text>
          <text x="320" y="55">सोयाबीन (Soybean)</text>
          <text x="480" y="55">विहीर (Well)</text>
          <text x="600" y="55" font-family="monospace">0.8090 हे.</text>
        </g>
      </g>

      <!-- Digital Signature Watermark & QR -->
      <g transform="translate(50, 865)">
        <rect width="700" height="150" fill="#F4EAE0" stroke="#A04000" stroke-width="1" rx="4"/>
        <rect x="20" y="25" width="100" height="100" fill="#FFF" stroke="#666" stroke-width="1"/>
        
        <!-- Mock QR Code Matrix -->
        <g fill="#222">
          <rect x="25" y="30" width="30" height="30"/>
          <rect x="29" y="34" width="22" height="22" fill="#FFF"/>
          <rect x="33" y="38" width="14" height="14"/>
          <rect x="85" y="30" width="30" height="30"/>
          <rect x="89" y="34" width="22" height="22" fill="#FFF"/>
          <rect x="93" y="38" width="14" height="14"/>
          <rect x="25" y="90" width="30" height="30"/>
          <rect x="29" y="94" width="22" height="22" fill="#FFF"/>
          <rect x="33" y="98" width="14" height="14"/>
        </g>

        <text x="140" y="45" font-family="sans-serif" font-size="12" font-weight="bold" fill="#6E2C00">DIGITALLY SIGNED 7/12 EXTRACT</text>
        <text x="140" y="68" font-family="sans-serif" font-size="11" fill="#333">Certificate Issued by: NIC MahaBhumi Digital Revenue Server</text>
        <text x="140" y="88" font-family="monospace" font-size="11" fill="#145A32">Validity: Verified through National Land Record Modernization Programme</text>
        <text x="140" y="108" font-family="monospace" font-size="10" fill="#777">UID / Hash: MH-PUN-HAV-WAG-142-3-2024-V9942</text>
      </g>

      <!-- Footer -->
      <text x="400" y="1055" font-family="monospace" font-size="10" fill="#888" text-anchor="middle">Page 1 of 1 • 7/12 Extract • BhoomiAI Verified Cadastral Document</text>
    </svg>`;
  }
}

export function getFallbackDocumentDataUri(documentId: number | string, pageNumber: number = 1): string {
  const svg = getFallbackDocumentSvg(documentId, pageNumber);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

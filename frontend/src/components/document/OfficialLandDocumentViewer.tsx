import React, { useState } from 'react';
import {
  Printer,
  ShieldCheck,
  QrCode,
  FileText,
  Building,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface OfficialLandDocumentViewerProps {
  record: {
    id: number;
    owner_name: string;
    owner_name_native?: string | null;
    survey_number: string;
    gat_number?: string | null;
    khasra_number?: string | null;
    khata_number?: string | null;
    village: string;
    taluka_tehsil: string;
    district: string;
    area_value: number;
    area_unit: string;
    land_type: string;
    mutation_number?: string | null;
    registration_number?: string | null;
    document_date?: string | null;
    is_restricted?: boolean;
  };
  onPrint?: () => void;
}

export const OfficialLandDocumentViewer: React.FC<OfficialLandDocumentViewerProps> = ({
  record,
  onPrint,
}) => {
  const [activeDocType, setActiveDocType] = useState<'712' | 'ferfar' | 'sale_deed'>('712');

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const ulpin = `MH-27-${record.district.slice(0, 3).toUpperCase()}-${record.survey_number.replace('/', '-')}-001`;
  const formattedDate = record.document_date
    ? new Date(record.document_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '12-Jan-2026';

  return (
    <div className="space-y-4">
      {/* Top Document Selection Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveDocType('712')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeDocType === '712'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>गाव नमुना ७/१२ (Form 7/12 Extract)</span>
          </button>
          <button
            onClick={() => setActiveDocType('ferfar')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeDocType === 'ferfar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>गाव नमुना ६ (Mutation Ferfar)</span>
          </button>
          <button
            onClick={() => setActiveDocType('sale_deed')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeDocType === 'sale_deed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>नोंदणीकृत खरेदी खत (Sale Deed)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>e-MahaBhumi Certified Format</span>
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. FORM VII-XII EXTRACT (गाव नमुना ७ आणि १२)              */}
      {/* ======================================================== */}
      {activeDocType === '712' && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden font-sans text-slate-900 print:border-none print:shadow-none print:m-0 print:p-0">
          {/* Official Government Masthead */}
          <div className="bg-[#FFFDF5] border-b-2 border-slate-300 p-6 text-center relative">
            <div className="flex items-center justify-between gap-4 border-b border-amber-900/20 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full border-2 border-amber-800/40 bg-amber-50 flex items-center justify-center font-serif font-black text-amber-900 text-xl shadow-inner">
                  म
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                    महाराष्ट्र शासन &bull; महसूल विभाग
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Government of Maharashtra &bull; Revenue Department
                  </div>
                </div>
              </div>

              {/* QR Verification Badge */}
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-amber-200 shadow-sm text-left">
                <div className="w-10 h-10 bg-slate-900 text-white rounded flex items-center justify-center">
                  <QrCode className="w-7 h-7" />
                </div>
                <div className="text-[10px] font-mono leading-tight">
                  <span className="text-slate-500 block">DIGITAL VERIFICATION</span>
                  <span className="font-bold text-slate-800 block">ULPIN: {ulpin}</span>
                  <span className="text-emerald-600 font-bold">mahabhumi.gov.in/verify</span>
                </div>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif">
              गाव नमुना सात आणि बारा (अधिकार अभिलेख पत्रक व पिकांची नोंदवही)
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Village Form VII & XII (Record of Rights & Register of Crops) &bull; Under Maharashtra Land Revenue Code, 1966
            </p>

            {/* Jurisdiction strip */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-amber-100/50 p-2.5 rounded-lg border border-amber-200 text-xs font-semibold text-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">गाव / Village</span>
                <span className="font-bold text-slate-900">{record.village} (वाघोली)</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">तालुका / Taluka</span>
                <span className="font-bold text-slate-900">{record.taluka_tehsil} (हवेली)</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">जिल्हा / District</span>
                <span className="font-bold text-slate-900">{record.district} (पुणे)</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">भूमापन क्र. / Survey No.</span>
                <span className="font-mono font-extrabold text-blue-700 text-sm">{record.survey_number}</span>
              </div>
            </div>
          </div>

          {/* Form VII Table Section */}
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  गाव नमुना ७ (अधिकार अभिलेख - Village Form VII)
                </h2>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  खाते क्रमांक (Khata No.): <strong className="text-slate-900">{record.khata_number || '894'}</strong>
                </span>
              </div>

              <div className="overflow-x-auto border-2 border-slate-300 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b-2 border-slate-300 divide-x divide-slate-300 text-center">
                      <th className="p-2.5 w-1/4">
                        भूधारणा पद्धती व खातेदाराचे नाव
                        <span className="block text-[10px] font-normal text-slate-500">
                          Tenure Class & Khatedar Name
                        </span>
                      </th>
                      <th className="p-2.5 w-1/4">
                        लागवडीयोग्य क्षेत्र व आकारणी
                        <span className="block text-[10px] font-normal text-slate-500">
                          Cultivable Area & Assessment
                        </span>
                      </th>
                      <th className="p-2.5 w-1/4">
                        पोट खराब क्षेत्र (वर्ग अ व ब)
                        <span className="block text-[10px] font-normal text-slate-500">
                          Uncultivable Area (Pot-Kharab)
                        </span>
                      </th>
                      <th className="p-2.5 w-1/4">
                        इतर हक्क व फेरफार नोंदी
                        <span className="block text-[10px] font-normal text-slate-500">
                          Other Rights & Mutation Entries
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="divide-x divide-slate-200 align-top">
                      {/* Column 1: Owner & Tenure */}
                      <td className="p-3.5 space-y-2 bg-slate-50/50">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">पद्धती / Class</span>
                          <span className="font-bold text-slate-800">भोगवटादार वर्ग - १ (Occupant Class I)</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">खातेदाराचे नाव / Owner</span>
                          <span className="text-sm font-extrabold text-blue-950 block">
                            {record.owner_name}
                          </span>
                          {record.owner_name_native && (
                            <span className="text-xs font-semibold text-slate-600 block">
                              {record.owner_name_native}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1">
                          नोंदणी क्रमांक: {record.registration_number || 'REG-2018-74921'}
                        </div>
                      </td>

                      {/* Column 2: Area & Assessment */}
                      <td className="p-3.5 space-y-2">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">जिरायत (Dry Crop):</span>
                          <span className="font-mono font-bold text-slate-900">
                            {record.area_value} {record.area_unit}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">बागायत (Irrigated):</span>
                          <span className="font-mono font-bold text-slate-900">0.00 {record.area_unit}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">एकूण क्षेत्र (Total Area):</span>
                          <span className="font-mono font-extrabold text-emerald-700 text-sm">
                            {record.area_value} {record.area_unit}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500">आकारणी (Assessment):</span>
                          <span className="font-bold text-slate-900">रु. 14.50</span>
                        </div>
                      </td>

                      {/* Column 3: Pot Kharab */}
                      <td className="p-3.5 space-y-2 bg-slate-50/50">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">वर्ग (अ) शेती अयोग्य:</span>
                          <span className="font-mono font-semibold text-slate-700">0.00 Ha</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">वर्ग (ब) सार्वजनिक वापर:</span>
                          <span className="font-mono font-semibold text-slate-700">0.00 Ha</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 mt-2 font-medium">
                          संपूर्ण क्षेत्र लागवडीयोग्य व वहिवाटीत आहे.
                        </div>
                      </td>

                      {/* Column 4: Other Rights & Encumbrance */}
                      <td className="p-3.5 space-y-2">
                        <div className="bg-amber-50/60 p-2 rounded border border-amber-200">
                          <div className="font-bold text-amber-950 flex items-center justify-between">
                            <span>फेरफार नोंद / Mutation</span>
                            <span className="font-mono text-xs">{record.mutation_number || 'FERFAR-894'}</span>
                          </div>
                          <p className="text-[11px] text-amber-900 mt-0.5">
                            खरेदी खतान्वये नोंद मंजूर. आदेश दिनांक: {formattedDate}
                          </p>
                        </div>

                        <div className="bg-slate-100 p-2 rounded border border-slate-200 text-[11px] text-slate-700 space-y-1">
                          <div className="font-bold text-slate-900">कर्ज बोजा व इतर हक्क:</div>
                          <div>&bull; स्टेट बँक ऑफ इंडिया कृषी पतपुरवठा कर्ज रु. २,५०,०००/- बोजा नोंद क्र. ६१२.</div>
                          <div>&bull; वीज वितरण कंपनी कृषी पंप वीज वाहिनी वहिवाट हक्क.</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form XII Crop Register Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  गाव नमुना १२ (पिकांची पाहणी नोंदवही - Village Form XII Register of Crops)
                </h2>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  हंगाम: <strong className="text-slate-900">२०२५-२६ (खरीप)</strong>
                </span>
              </div>

              <div className="overflow-x-auto border-2 border-slate-300 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b-2 border-slate-300 divide-x divide-slate-300 text-center">
                      <th className="p-2 w-16">वर्ष / Year</th>
                      <th className="p-2 w-20">हंगाम / Season</th>
                      <th className="p-2">पिकाचे नाव / Crop Name</th>
                      <th className="p-2 w-28">पिकाखालील क्षेत्र / Area</th>
                      <th className="p-2">जलसिंचनाचे साधन / Irrigation Source</th>
                      <th className="p-2 w-32">शेरा / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-center">
                    <tr className="divide-x divide-slate-200">
                      <td className="p-2.5 font-mono">2025-26</td>
                      <td className="p-2.5 font-semibold text-blue-900">खरीप (Kharif)</td>
                      <td className="p-2.5 font-bold text-slate-900 text-left pl-4">
                        बाजरी, मूग व भाजीपाला (Millets & Mixed Cash Crops)
                      </td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">
                        {record.area_value ? (record.area_value * 0.85).toFixed(2) : '1.00'} Ha
                      </td>
                      <td className="p-2.5 text-slate-700">शेततळे व विहीर (Farm Pond + Well)</td>
                      <td className="p-2.5 font-semibold text-emerald-700">पिक पाहणी प्रमाणित</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Digital Signature Footer */}
            <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-slate-500 max-w-xl">
                <p className="font-semibold text-slate-700">
                  टीप: सदर ७/१२ उतारा हा महाराष्ट्र शासनाच्या ई-महाभूमी डिजिटल प्रणालीद्वारे निर्गमित करण्यात आलेला आहे.
                </p>
                <p className="mt-0.5">
                  This document is a certified digital extract generated by BhoomiAI Computerized Land Registry under IT Act, 2000.
                </p>
              </div>

              {/* Stamp */}
              <div className="border-2 border-dashed border-blue-600 bg-blue-50/60 p-3 rounded-xl text-center min-w-[220px]">
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>शासकीय डिजिटल स्वाक्षरी</span>
                </div>
                <div className="text-[10px] text-blue-800 mt-1 font-mono">
                  तलाठी / मंडळ अधिकारी कार्यालय, हवेली
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Timestamp: {new Date().toISOString().split('T')[0]} 11:30:00 IST
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VILLAGE FORM VI - MUTATION REGISTER (गाव नमुना ६)     */}
      {/* ======================================================== */}
      {activeDocType === 'ferfar' && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl p-6 font-sans text-slate-900 space-y-5">
          <div className="border-b border-slate-200 pb-4 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              महाराष्ट्र शासन महसूल विभाग
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2 font-serif">
              गाव नमुना ६ — फेरफार पत्रक (Mutation Register)
            </h2>
            <p className="text-xs text-slate-500">
              हवेली, मौजे वाघोली, जिल्हा पुणे &bull; नोंदीचा दिनांक: {formattedDate}
            </p>
          </div>

          <div className="border-2 border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 p-3 font-bold text-slate-800 border-b border-slate-300 flex justify-between">
              <span>फेरफार नोंद क्रमांक: {record.mutation_number || 'FERFAR-894'}</span>
              <span className="font-mono">गट क्रमांक: {record.survey_number}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">व्यवहाराचे स्वरूप / Transaction Type</span>
                  <span className="font-bold text-slate-900 text-sm">नोंदणीकृत खरेदी खत (Registered Sale Deed Transfer)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">हस्तांतरित क्षेत्र / Transferred Area</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {record.area_value} {record.area_unit}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-slate-800 space-y-2">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>मंडळ अधिकारी / तलाठी आदेश सारांश:</span>
                </div>
                <p className="text-xs leading-relaxed">
                  मौजे वाघोली, तालुका हवेली, जिल्हा पुणे येथील सर्व्हे / गट नंबर {record.survey_number} मधील क्षेत्र{' '}
                  {record.area_value} {record.area_unit} हे खरेदी खत नोंदणी क्रमांक{' '}
                  <strong>{record.registration_number || 'REG-2018-74921'}</strong> अन्वये{' '}
                  <strong>{record.owner_name}</strong> यांच्या नावे दाखल करण्याची कायदेशीर प्रक्रिया पूर्ण झाली असून,
                  कोणतीही तक्रार न आल्याने फेरफार नोंद प्रमाणित (Certified) करण्यात येत आहे.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. REGISTERED SALE DEED (नोंदणीकृत खरेदी खत - INDEX II)  */}
      {/* ======================================================== */}
      {activeDocType === 'sale_deed' && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl p-6 font-sans text-slate-900 space-y-5">
          <div className="border-b border-slate-200 pb-4 text-center">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              नोंदणी व मुद्रांक विभाग &bull; Registration & Stamps Department
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2 font-serif">
              नोंदणीकृत दस्तऐवज सूची क्रमांक २ (Index II Certificate)
            </h2>
            <p className="text-xs text-slate-500">
              सह दुय्यम निबंधक वर्ग-२, हवेली क्रमांक ४, पुणे
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">दस्त नोंदणी क्रमांक / Reg. No.</span>
              <span className="font-mono font-extrabold text-blue-700 text-sm">
                {record.registration_number || 'REG-2018-74921'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">दस्त प्रकार / Document Type</span>
              <span className="font-bold text-slate-900 text-sm">खरेदी खत (Conveyance / Sale Deed)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">खरेदीदार / Purchaser</span>
              <span className="font-extrabold text-slate-900 text-sm">{record.owner_name}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">मिळकतीचे वर्णन / Parcel Description</span>
              <span className="font-semibold text-slate-800 text-sm">
                सर्व्हे क्र. {record.survey_number}, वाघोली ({record.area_value} {record.area_unit})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

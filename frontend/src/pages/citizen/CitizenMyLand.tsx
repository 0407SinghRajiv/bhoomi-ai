import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Compass,
  Building,
  Loader2,
  Lock,
  Unlock,
  Clock,
  Search,
  FileCheck,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { CadastralMap } from '../../components/gis/CadastralMap';
import { AccessRequestModal } from '../../components/citizen/AccessRequestModal';
import { api } from '../../services/api';
import type {
  ApiCadastralParcel,
  ApiCadastralParcelDetail,
  ApiLandRecordSummary,
  ApiPublicRegistryParcel,
  ApiAccessRequest,
} from '../../services/api';

const CITIZEN_NAME = 'Rajendra Dattatray Patil';

export const CitizenMyLand: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my_land' | 'public_registry'>('my_land');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [landRecords, setLandRecords] = useState<ApiLandRecordSummary[]>([]);
  const [parcels, setParcels] = useState<ApiCadastralParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ApiCadastralParcelDetail | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);

  // Public Registry & Access Requests state
  const [registrySearch, setRegistrySearch] = useState<string>('');
  const [publicParcels, setPublicParcels] = useState<ApiPublicRegistryParcel[]>([]);
  const [accessRequests, setAccessRequests] = useState<ApiAccessRequest[]>([]);
  const [isRegistryLoading, setIsRegistryLoading] = useState<boolean>(false);

  // Modal State for Request Access
  const [requestModalOpen, setRequestModalOpen] = useState<boolean>(false);
  const [targetRequestParcel, setTargetRequestParcel] = useState<any | null>(null);

  useEffect(() => {
    loadMyLandData();
    loadPublicRegistryAndRequests();
  }, []);

  const loadMyLandData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch strictly CITIZEN'S OWN Land Records (citizen_only: true)
      const records = await api.getLandRecords({ citizen_only: true });
      setLandRecords(records);

      // 2. Fetch Cadastral Parcels for Leaflet GIS map
      const allParcels = await api.getCadastralParcels();
      setParcels(allParcels);

      // Default select the citizen's primary parcel (124/2)
      const p124 = allParcels.find((p) => p.parcel_number === '124/2') || allParcels[0];
      if (p124) {
        setSelectedParcelId(p124.id);
        const detail = await api.getCadastralParcelDetail(p124.id);
        setSelectedParcel(detail);
      }
    } catch (err) {
      console.error('Failed to load citizen land records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicRegistryAndRequests = async (searchQuery?: string) => {
    setIsRegistryLoading(true);
    try {
      const [registryData, reqs] = await Promise.all([
        api.searchPublicRegistry({
          search: searchQuery,
          citizen_name: CITIZEN_NAME,
        }),
        api.getAccessRequests({ applicant_name: CITIZEN_NAME }),
      ]);
      setPublicParcels(registryData);
      setAccessRequests(reqs);
    } catch (err) {
      console.error('Failed to load public registry:', err);
    } finally {
      setIsRegistryLoading(false);
    }
  };

  const handleSelectParcel = async (parcel: ApiCadastralParcel) => {
    setSelectedParcelId(parcel.id);
    try {
      const detail = await api.getCadastralParcelDetail(parcel.id);
      setSelectedParcel(detail);
    } catch (err) {
      console.error('Failed to fetch parcel detail:', err);
    }
  };

  const handleOpenAccessModal = (parcel: ApiPublicRegistryParcel) => {
    setTargetRequestParcel({
      parcel_id: parcel.parcel_id,
      record_id: parcel.land_record_id,
      survey_number: parcel.survey_number,
      village: parcel.village,
      district: parcel.district,
      owner_name: parcel.owner_name,
      area: parcel.area,
      area_unit: parcel.area_unit,
    });
    setRequestModalOpen(true);
  };

  const handleRequestCreated = (newReq: ApiAccessRequest) => {
    setAccessRequests((prev) => [newReq, ...prev]);
    loadPublicRegistryAndRequests(registrySearch);
  };

  const totalArea = landRecords.reduce((acc, r) => acc + (r.area_value || 0), 0).toFixed(2);


  return (
    <PortalLayout
      portalType="citizen"
      title="My Land Holdings & Cadastral GIS"
      subtitle="Computerized Land Record Intelligence & Authority-Protected Parcel Access"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step 2 Guided Journey Banner for Rural Citizens */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  STEP 2 OF 3
                </span>
                <Compass className="w-4 h-4" />
                Cadastral Landowner Registry &bull; Maharashtra Revenue
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Landowner Portfolio: <span className="text-blue-400">{CITIZEN_NAME}</span>
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl font-medium">
                Village Wagholi, Taluka Haveli, District Pune. Inspect your surveyed land parcels on satellite basemaps and verify registered title continuity.
              </p>
            </div>

            {/* Quick Actions & Stats */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/citizen/analysis"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md"
              >
                <span>Step 3: Conflict Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">My Records</span>
                <span className="text-xl font-extrabold text-white">{landRecords.length}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Area</span>
                <span className="text-xl font-extrabold text-amber-300">{totalArea} Ha</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Permissions</span>
                <span className="text-xs font-bold text-emerald-300 block mt-1">
                  {accessRequests.filter((r) => r.status === 'APPROVED').length} Approved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('my_land')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'my_land'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Land Holdings ({landRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('public_registry')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'public_registry'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Village Registry & Authority Access Requests</span>
            {accessRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white text-blue-800">
                {accessRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: MY LAND HOLDINGS (STRICTLY CITIZEN SCOPED)         */}
        {/* ======================================================== */}
        {activeTab === 'my_land' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Your Verified Land Holdings ({landRecords.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Cadastral land records linked to your verified citizen profile. Only you and authorized revenue officers can access these full extracts.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-semibold">Loading your verified land records...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {landRecords.map((rec) => {
                  const isRecVerified = rec.parcel_status === 'VERIFIED';
                  const isSelected = selectedParcel?.survey_number === rec.survey_number;
                  return (
                    <div
                      key={rec.id}
                      className={`bg-white rounded-xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-base text-slate-900">
                                Survey No. {rec.survey_number}
                              </span>
                              {rec.gat_number && rec.gat_number !== rec.survey_number && (
                                <span className="text-xs text-slate-500 font-mono">
                                  (Gat {rec.gat_number})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              {rec.village}, Taluka {rec.taluka_tehsil}, {rec.district}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shrink-0 ${
                              isRecVerified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isRecVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                            {isRecVerified ? 'Verified Holding' : 'Needs Verification'}
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-700 mb-4 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Owner:</span>
                            <span className="font-bold text-slate-900">{rec.owner_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Registered Area:</span>
                            <span className="font-bold text-slate-900">
                              {rec.area_value} {rec.area_unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Land Category:</span>
                            <span className="font-semibold text-slate-800">{rec.land_type}</span>
                          </div>
                          {rec.mutation_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Mutation Ferfar:</span>
                              <span className="font-mono font-bold text-blue-700">{rec.mutation_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            const matchingParcel = parcels.find(
                              (p) => p.survey_number === rec.survey_number
                            );
                            if (matchingParcel) handleSelectParcel(matchingParcel);
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Locate on Map</span>
                        </button>

                        <Link
                          to={`/citizen/land/${rec.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          <span>Official 7/12 Extract</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cadastral Map Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Village Wagholi Cadastral Overlay
                  </h2>
                  <p className="text-xs text-slate-500">
                    Satellite GIS boundary layer highlighting your registered holdings.
                  </p>
                </div>
                {selectedParcel && (
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                    Selected: Parcel #{selectedParcel.parcel_number}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CadastralMap
                    parcels={parcels}
                    selectedParcelId={selectedParcelId}
                    onSelectParcel={handleSelectParcel}
                    height="450px"
                  />
                </div>
                <div>
                  {selectedParcel ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Parcel #{selectedParcel.parcel_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {selectedParcel.status}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-slate-600">
                        <div><strong>Khatedar:</strong> {selectedParcel.owner_name}</div>
                        <div><strong>Area:</strong> {selectedParcel.area} {selectedParcel.area_unit}</div>
                        <div><strong>Tehsil:</strong> {selectedParcel.tehsil}, {selectedParcel.district}</div>
                      </div>
                      <div className="pt-2">
                        <Link
                          to={`/citizen/land/${selectedParcel.record_id || 4}`}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <span>Open Full Land Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                      Click a parcel on map to view details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PUBLIC REGISTRY & AUTHORITY ACCESS REQUESTS        */}
        {/* ======================================================== */}
        {activeTab === 'public_registry' && (
          <div className="space-y-6">
            {/* Privacy Law Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-300/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    State Land Records Privacy & Access Regulation
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under the Maharashtra Land Records Regulation and Digital Personal Data Protection Act,
                    citizens can only view basic public index parameters of other parcels.
                    Full extracts (7/12, Mutation Ferfar, and Registered Deeds) are protected.
                    If you require access for boundary verification or title due diligence,
                    you must submit a formal <strong>Access Request</strong> to the competent revenue authority (Tahsildar).
                  </p>
                </div>
              </div>
            </div>

            {/* My Submitted Requests Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    My Submitted Access Requests ({accessRequests.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track the authorization status of your requests submitted to the Tahsildar / Sub-Registrar.
                  </p>
                </div>
              </div>

              {accessRequests.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No access requests submitted yet. Search below to find parcels and request access.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {accessRequests.map((req) => {
                    const isApproved = req.status === 'APPROVED';
                    const isPending = req.status === 'PENDING';
                    const isRejected = req.status === 'REJECTED';

                    return (
                      <div
                        key={req.id}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              Survey No. {req.survey_number}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({req.village}, {req.district})
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isApproved && <Unlock className="w-3 h-3" />}
                              {isPending && <Clock className="w-3 h-3" />}
                              {isRejected && <Lock className="w-3 h-3" />}
                              <span>{req.status}</span>
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            <strong>Reason:</strong> {req.reason_category} &bull;{' '}
                            <span className="text-slate-500 italic">"{req.reason_description}"</span>
                          </div>
                          {req.reviewed_by && (
                            <div className="text-[11px] text-slate-500">
                              Reviewed by: <strong className="text-slate-700">{req.reviewed_by}</strong>
                              {req.review_remarks && ` — "${req.review_remarks}"`}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isApproved ? (
                            <Link
                              to={`/citizen/land/${req.target_record_id || 1}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>View Authorized Record & 7/12</span>
                            </Link>
                          ) : isPending ? (
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Awaiting Authority Action</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                              Request Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Public Village Cadastral Search */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Village Land Registry Index
                  </h2>
                  <p className="text-xs text-slate-500">
                    Search village parcels. Restricted parcels can be unlocked by requesting permission from the Authority.
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Survey No., Owner..."
                    value={registrySearch}
                    onChange={(e) => {
                      setRegistrySearch(e.target.value);
                      loadPublicRegistryAndRequests(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400"
                  />
                </div>
              </div>

              {isRegistryLoading ? (
                <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Searching public registry...</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">Survey / Parcel</th>
                        <th className="p-3">Village / Location</th>
                        <th className="p-3">Khatedar (Owner)</th>
                        <th className="p-3">Area</th>
                        <th className="p-3">Access Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {publicParcels.map((parcel) => {
                        const isOwn = parcel.access_status === 'OWNED';
                        const isApproved = parcel.access_status === 'APPROVED';
                        const isPending = parcel.access_status === 'PENDING_REQUEST';

                        return (
                          <tr key={parcel.parcel_id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-bold text-slate-900">
                              #{parcel.survey_number}
                            </td>
                            <td className="p-3 text-slate-600">
                              {parcel.village}, {parcel.district}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {parcel.owner_name}
                            </td>
                            <td className="p-3 text-slate-600 font-mono">
                              {parcel.area} {parcel.area_unit}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                  isOwn
                                    ? 'bg-blue-100 text-blue-800'
                                    : isApproved
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isOwn && <UserCheck className="w-3 h-3" />}
                                {isApproved && <Unlock className="w-3 h-3" />}
                                {isPending && <Clock className="w-3 h-3" />}
                                {!isOwn && !isApproved && !isPending && <Lock className="w-3 h-3 text-slate-400" />}
                                <span>
                                  {isOwn
                                    ? 'Your Property'
                                    : isApproved
                                    ? 'Access Approved'
                                    : isPending
                                    ? 'Request Pending'
                                    : 'Restricted'}
                                </span>
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {isOwn || isApproved ? (
                                <Link
                                  to={`/citizen/land/${parcel.land_record_id || 1}`}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition"
                                >
                                  <span>View Record</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              ) : isPending ? (
                                <span className="text-[11px] font-semibold text-amber-700">
                                  Pending Authority
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenAccessModal(parcel)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-sm transition"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Request Access</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Access Request Submission Modal */}
      {targetRequestParcel && (
        <AccessRequestModal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          onSuccess={handleRequestCreated}
          targetParcel={targetRequestParcel}
          applicantName={CITIZEN_NAME}
        />
      )}
    </PortalLayout>
  );
};


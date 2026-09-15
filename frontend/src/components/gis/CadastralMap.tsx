import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  MapPin,
  Compass,
} from 'lucide-react';
import type { ApiCadastralParcel, ApiCadastralGeoJSONFeature } from '../../services/api';

interface CadastralMapProps {
  parcels?: ApiCadastralParcel[];
  selectedParcelId?: number | null;
  onSelectParcel?: (parcel: ApiCadastralParcel) => void;
  height?: string;
  zoomToSelected?: boolean;
  interactive?: boolean;
}

const DEFAULT_SATELLITE_URL =
  import.meta.env.VITE_TILE_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const DEFAULT_SATELLITE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION ||
  'Tiles &copy; Esri &mdash; DigitalGlobe, GeoEye, Earthstar Geographics';

const STREET_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const STREET_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>';

export const CadastralMap: React.FC<CadastralMapProps> = ({
  parcels = [],
  selectedParcelId = null,
  onSelectParcel,
  height = '560px',
  zoomToSelected = true,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'street'>('satellite');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ApiCadastralParcel[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Wagholi Pune default
    const map = L.map(mapContainerRef.current, {
      center: [18.5794, 73.9816],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Basemaps
    const satelliteLayer = L.tileLayer(DEFAULT_SATELLITE_URL, {
      maxZoom: 19,
      attribution: DEFAULT_SATELLITE_ATTRIBUTION,
    });

    const streetLayer = L.tileLayer(STREET_TILE_URL, {
      maxZoom: 19,
      attribution: STREET_ATTRIBUTION,
    });

    satelliteLayer.addTo(map);

    satelliteLayerRef.current = satelliteLayer;
    streetLayerRef.current = streetLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Mouse movement coordinate tracker
    map.on('mousemove', (e) => {
      setCurrentCoordinates({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap
  const toggleBasemap = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !satelliteLayerRef.current || !streetLayerRef.current) return;

    if (activeBasemap === 'satellite') {
      map.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(map);
      setActiveBasemap('street');
    } else {
      map.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(map);
      setActiveBasemap('satellite');
    }
  }, [activeBasemap]);

  // Style for cadastral polygons
  const getParcelStyle = useCallback(
    (parcelId: number) => {
      const isSelected = parcelId === selectedParcelId;
      if (isSelected) {
        return {
          color: '#22C55E', // Vibrant Emerald green for selected parcel
          weight: 4,
          opacity: 1,
          fillColor: '#10B981',
          fillOpacity: 0.38,
          dashArray: '',
        };
      }
      return {
        color: '#F59E0B', // Bright Cadastral Amber / Gold
        weight: 2.2,
        opacity: 0.95,
        fillColor: '#F59E0B',
        fillOpacity: 0.16,
        dashArray: '3, 4',
      };
    },
    [selectedParcelId]
  );

  // Render GeoJSON parcel overlay and label markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing geojson layer
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    if (!parcels || parcels.length === 0) return;

    // Build GeoJSON features
    const features: ApiCadastralGeoJSONFeature[] = parcels
      .filter((p) => p.geometry)
      .map((p) => {
        let geomObj: any = { type: 'Polygon', coordinates: [] };
        try {
          geomObj = typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry;
        } catch {
          // fallback
        }
        return {
          type: 'Feature',
          id: p.id,
          properties: p,
          geometry: geomObj,
        };
      });

    const geojsonData: any = {
      type: 'FeatureCollection',
      features,
    };

    const layer = L.geoJSON(geojsonData, {
      style: (feature) => {
        const pId = feature?.properties?.id;
        return getParcelStyle(pId);
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties as ApiCadastralParcel;

        if (interactive) {
          featureLayer.on({
            click: () => {
              if (onSelectParcel) {
                onSelectParcel(props);
              }
            },
            mouseover: (e) => {
              const target = e.target;
              if (props.id !== selectedParcelId) {
                target.setStyle({
                  fillOpacity: 0.3,
                  weight: 3,
                  color: '#FBBF24',
                });
              }
            },
            mouseout: (e) => {
              const target = e.target;
              if (props.id !== selectedParcelId) {
                target.setStyle(getParcelStyle(props.id));
              }
            },
          });
        }

        // Parcel Label Marker in center
        if (markersLayerRef.current && props.centroid_lat && props.centroid_lng) {
          const isSelected = props.id === selectedParcelId;
          const labelHtml = `
            <div class="px-1.5 py-0.5 rounded shadow-sm text-center font-mono font-bold text-[11px] whitespace-nowrap cursor-pointer transition ${
              isSelected
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1 scale-105'
                : 'bg-slate-900/90 text-amber-300 border border-amber-400/60 backdrop-blur-sm'
            }">
              <span>${props.survey_number || props.parcel_number}</span>
            </div>
          `;
          const icon = L.divIcon({
            html: labelHtml,
            className: 'cadastral-label-marker',
            iconSize: [50, 20],
            iconAnchor: [25, 10],
          });
          const marker = L.marker([props.centroid_lat, props.centroid_lng], { icon, interactive: true });
          if (interactive && onSelectParcel) {
            marker.on('click', () => onSelectParcel(props));
          }
          markersLayerRef.current.addLayer(marker);
        }
      },
    });

    layer.addTo(map);
    geojsonLayerRef.current = layer;

    // Zoom to bounds or selected parcel
    if (selectedParcelId && zoomToSelected) {
      const selected = parcels.find((p) => p.id === selectedParcelId);
      if (selected && selected.centroid_lat && selected.centroid_lng) {
        map.flyTo([selected.centroid_lat, selected.centroid_lng], 17, {
          duration: 0.8,
        });
      }
    } else if (parcels.length > 0 && layer.getBounds().isValid()) {
      map.fitBounds(layer.getBounds(), { padding: [40, 40] });
    }
  }, [parcels, selectedParcelId, getParcelStyle, onSelectParcel, zoomToSelected, interactive]);

  // Handle Search Input
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const q = val.toLowerCase().trim();
    const matched = parcels.filter(
      (p) =>
        p.parcel_number.toLowerCase().includes(q) ||
        p.survey_number.toLowerCase().includes(q) ||
        (p.gat_number && p.gat_number.toLowerCase().includes(q)) ||
        (p.khasra_number && p.khasra_number.toLowerCase().includes(q)) ||
        p.owner_name.toLowerCase().includes(q) ||
        (p.owner_name_native && p.owner_name_native.toLowerCase().includes(q))
    );
    setSearchResults(matched);
    setShowSearchDropdown(true);
  };

  const handleSelectSearchResult = (p: ApiCadastralParcel) => {
    setSearchQuery(`${p.survey_number} — ${p.owner_name}`);
    setShowSearchDropdown(false);
    if (onSelectParcel) {
      onSelectParcel(p);
    }
    if (mapInstanceRef.current && p.centroid_lat && p.centroid_lng) {
      mapInstanceRef.current.flyTo([p.centroid_lat, p.centroid_lng], 18, {
        duration: 0.9,
      });
    }
  };

  const resetView = () => {
    const map = mapInstanceRef.current;
    if (!map || !geojsonLayerRef.current) return;
    if (geojsonLayerRef.current.getBounds().isValid()) {
      map.fitBounds(geojsonLayerRef.current.getBounds(), { padding: [40, 40] });
    } else {
      map.setView([18.5794, 73.9816], 16);
    }
  };

  return (
    <div className="relative rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-xl" style={{ height }}>
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2">
        {/* Search Box */}
        <div className="relative">
          <div className="flex items-center bg-slate-900/95 border border-slate-700 rounded-lg shadow-lg px-3 py-1.5 backdrop-blur-md w-64 md:w-80">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search Survey, Gat, Khasra, Owner..."
              className="bg-transparent border-none text-xs text-slate-100 placeholder-slate-400 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                &times;
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[500] max-h-60 overflow-y-auto divide-y divide-slate-800">
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      Survey / Gat {res.survey_number}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate max-w-[200px]">
                      {res.owner_name} {res.owner_name_native ? `(${res.owner_name_native})` : ''}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {res.area} {res.area_unit} &bull; {res.village}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      res.status === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {res.status === 'VERIFIED' ? 'Verified' : 'Needs Review'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Control Buttons (Top-Right) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <button
          onClick={toggleBasemap}
          title={`Switch to ${activeBasemap === 'satellite' ? 'Street/Carto' : 'Satellite'} Basemap`}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">
            {activeBasemap === 'satellite' ? 'Satellite Imagery' : 'Street Map'}
          </span>
        </button>

        <button
          onClick={resetView}
          title="Reset Map View"
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2 text-xs shadow-lg backdrop-blur-md transition flex items-center justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <div className="flex flex-col bg-slate-900/90 border border-slate-700 rounded-lg shadow-lg backdrop-blur-md divide-y divide-slate-800">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-2 hover:bg-slate-800 text-slate-200 transition rounded-t-lg flex items-center justify-center"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-2 hover:bg-slate-800 text-slate-200 transition rounded-b-lg flex items-center justify-center"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Cadastral GIS Footer / Status Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Coordinates and CRS info */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-slate-300 font-mono shadow-md backdrop-blur-md flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-400">
            <Compass className="w-3 h-3 text-blue-400" />
            WGS84 / EPSG:4326
          </span>
          {currentCoordinates && (
            <span>
              LAT: {currentCoordinates.lat.toFixed(4)}° N | LNG: {currentCoordinates.lng.toFixed(4)}° E
            </span>
          )}
          <span className="text-amber-400 font-medium hidden sm:inline">
            Parcels: {parcels.length} Active Plots
          </span>
        </div>

        {/* Legend */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-slate-300 shadow-md backdrop-blur-md flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm border border-emerald-400 bg-emerald-500/40" />
            <span>Selected Parcel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm border border-amber-400 bg-amber-500/20" />
            <span>Cadastral Boundary</span>
          </div>
        </div>
      </div>
    </div>
  );
};

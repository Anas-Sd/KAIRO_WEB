import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  X,
  Search,
  Navigation,
  Check,
  Compass,
  Loader2,
} from 'lucide-react';

export interface LocationSearchResult {
  title: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number | null;
  formattedDistance?: string | null;
}

// Calculate distance between two coordinates using Haversine formula (matches Android Location.distanceBetween)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatDistance(meters: number | null | undefined): string | null {
  if (meters == null) return null;
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

interface LocationPickerDialogProps {
  initialLocation?: string | null;
  initialLat?: number | null;
  initialLng?: number | null;
  initialRadius?: number;
  onDismiss: () => void;
  onConfirm: (
    name: string | null,
    lat: number | null,
    lng: number | null,
    radius: number
  ) => void;
}

export const LocationPickerDialog: React.FC<LocationPickerDialogProps> = ({
  initialLocation = null,
  initialLat = null,
  initialLng = null,
  initialRadius = 500,
  onDismiss,
  onConfirm,
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialLocation || '');
  const [selectedResult, setSelectedResult] = useState<LocationSearchResult | null>(() => {
    if (initialLocation && initialLat != null && initialLng != null) {
      return {
        title: initialLocation,
        fullAddress: initialLocation,
        latitude: initialLat,
        longitude: initialLng,
      };
    }
    return null;
  });

  const [selectedRadius, setSelectedRadius] = useState<number>(initialRadius || 500);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);

  const debounceTimeoutRef = useRef<any>(null);

  // Request browser geolocation
  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setHasLocationPermission(true);
        setIsLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsLocatingUser(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Debounced search recommendations calling Photon / Nominatim OpenStreetMap APIs
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || trimmed === selectedResult?.title) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results: LocationSearchResult[] = [];

      try {
        // 1. Try Photon API with user location proximity bias (matches Android LocationSearchHelper)
        const biasParam = userLocation
          ? `&lat=${userLocation.lat}&lon=${userLocation.lng}`
          : '';
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed
        )}${biasParam}&limit=10`;

        const resp = await fetch(photonUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.features)) {
            data.features.forEach((feat: any) => {
              const coords = feat.geometry?.coordinates;
              const props = feat.properties;
              if (coords && coords.length >= 2 && props) {
                const lng = coords[0];
                const lat = coords[1];
                const name = props.name || trimmed;
                const street = props.street;
                const city = props.city || props.state;
                const country = props.country;
                const addressParts = [street, city, country].filter(Boolean);
                const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : name;

                const dist = userLocation
                  ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
                  : null;

                results.push({
                  title: name,
                  fullAddress,
                  latitude: lat,
                  longitude: lng,
                  distanceMeters: dist,
                  formattedDistance: formatDistance(dist),
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Photon lookup error:', err);
      }

      // 2. Fallback to OpenStreetMap Nominatim if fewer than 3 results
      if (results.length < 3) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            trimmed
          )}&format=json&limit=8`;
          const resp2 = await fetch(nomUrl, {
            headers: { 'Accept-Language': 'en' },
          });
          if (resp2.ok) {
            const data2 = await resp2.json();
            if (Array.isArray(data2)) {
              data2.forEach((item: any) => {
                const lat = parseFloat(item.lat);
                const lng = parseFloat(item.lon);
                if (!isNaN(lat) && !isNaN(lng)) {
                  const parts = (item.display_name || '').split(',');
                  const title = parts[0] || trimmed;
                  const fullAddress = parts.slice(1).join(',').trim() || title;

                  // Avoid duplicates
                  if (!results.some((r) => Math.abs(r.latitude - lat) < 0.0001)) {
                    const dist = userLocation
                      ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
                      : null;
                    results.push({
                      title,
                      fullAddress,
                      latitude: lat,
                      longitude: lng,
                      distanceMeters: dist,
                      formattedDistance: formatDistance(dist),
                    });
                  }
                }
              });
            }
          }
        } catch (err2) {
          console.warn('Nominatim fallback error:', err2);
        }
      }

      // Sort by proximity if user location is available
      if (userLocation) {
        results.sort((a, b) => (a.distanceMeters || 9999999) - (b.distanceMeters || 9999999));
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 350);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, userLocation, selectedResult]);

  const handleSelectResult = (result: LocationSearchResult) => {
    setSelectedResult(result);
    setSearchQuery(result.title);
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (selectedResult) {
      onConfirm(
        selectedResult.title,
        selectedResult.latitude,
        selectedResult.longitude,
        selectedRadius
      );
    } else if (searchQuery.trim()) {
      onConfirm(searchQuery.trim(), null, null, selectedRadius);
    } else {
      onConfirm(null, null, null, 500);
    }
    onDismiss();
  };

  const handleRemove = () => {
    onConfirm(null, null, null, 500);
    onDismiss();
  };

  const selectedDistStr = selectedResult?.formattedDistance || (
    selectedResult && userLocation
      ? formatDistance(
          calculateDistance(
            userLocation.lat,
            userLocation.lng,
            selectedResult.latitude,
            selectedResult.longitude
          )
        )
      : null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#15131e] border border-[#333140] rounded-[24px] p-5 shadow-2xl flex flex-col gap-3.5 text-white max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#38BDF8]/15 flex items-center justify-center text-[#38BDF8]">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Set Reminder Location</h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-full text-[#c8c4d9] hover:bg-[#252233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Permission / Active Status Banner (Matches LocationPickerDialog.kt lines 185-240) */}
        {!hasLocationPermission ? (
          <div
            onClick={handleRequestUserLocation}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFB77D]/15 border border-[#FFB77D]/40 text-[#FFB77D] text-xs font-medium cursor-pointer hover:bg-[#FFB77D]/20 transition-colors"
          >
            {isLocatingUser ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Compass className="w-4 h-4 flex-shrink-0" />
            )}
            <span>Tap to enable GPS for live distance & nearby places</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#38BDF8]">
            <Compass className="w-3.5 h-3.5" />
            <span>Current location active • Showing closest destinations first</span>
          </div>
        )}

        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#918ea2] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search place, shop, area..."
            className="w-full h-11 pl-10 pr-9 bg-[#201d2c] border border-[#333140] focus:border-[#5a45ff] rounded-xl text-xs text-white placeholder-[#6b687c] outline-none transition-colors"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-[#5a45ff] animate-spin absolute right-3" />
          ) : (
            searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedResult(null);
                  setSearchResults([]);
                }}
                className="p-1 text-[#918ea2] hover:text-white absolute right-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* Selected Destination Card (Matches Android lines 282-340) */}
        {selectedResult && (
          <div className="p-3 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/45 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#38BDF8] flex items-center justify-center text-[#003350] flex-shrink-0 font-bold">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-white truncate">
                {selectedResult.title}
              </span>
              <span className="text-[11px] font-semibold text-[#38BDF8] truncate">
                {selectedDistStr
                  ? `📍 ${selectedDistStr} from your current location`
                  : '📍 Destination selected'}
              </span>
            </div>
          </div>
        )}

        {/* Autocomplete Recommendations List (Matches Android lines 345-430) */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 min-h-[140px] max-h-[220px]">
          {searchResults.length > 0 ? (
            searchResults.map((result) => {
              const isSelected =
                selectedResult?.latitude === result.latitude &&
                selectedResult?.longitude === result.longitude;

              return (
                <div
                  key={`${result.latitude}-${result.longitude}-${result.title}`}
                  onClick={() => handleSelectResult(result)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#5a45ff]/20 border border-[#5a45ff]/40 text-white'
                      : 'hover:bg-[#201d2c] text-[#f0f0f5]'
                  }`}
                >
                  <Navigation
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? 'text-[#5a45ff]' : 'text-[#918ea2]'
                    }`}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold truncate">
                        {result.title}
                      </span>
                      {result.formattedDistance && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] text-[9px] font-bold flex-shrink-0">
                          {result.formattedDistance} away
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#918ea2] truncate">
                      {result.fullAddress}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#5a45ff] flex-shrink-0" />
                  )}
                </div>
              );
            })
          ) : searchQuery.length >= 2 && !isSearching ? (
            <div className="py-6 text-center text-xs text-[#918ea2]">
              No places found. You can still set "{searchQuery}" as a label.
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#6b687c]">
              Type a location name, shop, or city to get recommendations.
            </div>
          )}
        </div>

        {/* Trigger Radius Selector (Matches Android lines 437-478) */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#2d2a3c]">
          <span className="text-[10px] font-bold tracking-wider text-[#918ea2]">
            TRIGGER RADIUS
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { meters: 200, label: '200m' },
              { meters: 500, label: '500m' },
              { meters: 1000, label: '1 km' },
            ].map(({ meters, label }) => {
              const isSelected = selectedRadius === meters;
              return (
                <button
                  key={meters}
                  type="button"
                  onClick={() => setSelectedRadius(meters)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#5a45ff]/25 border border-[#5a45ff] text-white font-bold'
                      : 'bg-[#201d2c] border border-[#333140] text-[#918ea2] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {(selectedResult || searchQuery.trim()) && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex-1 py-2.5 rounded-xl border border-[#3a374c] hover:bg-[#252233] text-xs font-semibold text-[#c8c4d9] transition-colors"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#5a45ff] hover:bg-[#6b58ff] text-xs font-bold text-[#130067] shadow-lg shadow-[#5a45ff]/20 transition-all active:scale-[0.98]"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

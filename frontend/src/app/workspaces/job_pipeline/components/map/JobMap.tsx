import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";
import {
  fetchJobLocations,
  fetchUserLocation,
} from "@shared/cache/coreFetchers";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Use Vite-friendly URLs for Leaflet's default marker images
const iconRetinaUrl = new URL(
  "../../../../../../node_modules/leaflet/dist/images/marker-icon-2x.png",
  import.meta.url
).href;
const iconUrl = new URL(
  "../../../../../../node_modules/leaflet/dist/images/marker-icon.png",
  import.meta.url
).href;
const shadowUrl = new URL(
  "../../../../../../node_modules/leaflet/dist/images/marker-shadow.png",
  import.meta.url
).href;

(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Create a simple SVG pindrop icon as a data URL for a clean pin look
const pinSvg = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 24 36' fill='none'>
	<path d='M12 0C7.03 0 3 4.03 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.97-4.03-9-9-9z' fill='%23ff0000'/>
	<circle cx='12' cy='9' r='4' fill='red'/>
</svg>`);
const pinDataUrl = `data:image/svg+xml;utf8,${pinSvg}`;

const pinIcon = new L.Icon({
  iconUrl: pinDataUrl,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -46],
  shadowUrl: shadowUrl,
  shadowSize: [41, 41],
  shadowAnchor: [13, 41],
});

type JobLocation = {
  id: string;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
  job_id: number | null;
};

type JobRowMini = {
  id: number;
  job_title?: string | null;
  company_name?: string | null;
  location_type?: string | null;
};

type LocationWithJob = JobLocation & { job?: JobRowMini | null };

type JobMapProps = {
  onOpenJob?: (jobId: number) => void;
};

export const JobMap: React.FC<JobMapProps> = ({ onOpenJob }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const { user } = useAuth();

  const [locations, setLocations] = useState<JobLocation[]>([]);
  const [locationsWithJob, setLocationsWithJob] = useState<LocationWithJob[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [homeLocation, setHomeLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    // initialize map once
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [39.5, -98.35],
        4
      ); // continental US

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      // don't remove map on component unmount in case of remount; but clean markers
      if (markersRef.current) {
        markersRef.current.clearLayers();
      }
    };
  }, []);

  useEffect(() => {
    // fetch job_locations from Supabase
    let cancelled = false;

    async function loadLocations() {
      setLoading(true);
      setError(null);
      try {
        if (!user?.id) {
          setLocations([]);
          setLocationsWithJob([]);
          setLoading(false);
          return;
        }

        const qc = getAppQueryClient();
        const rows = await qc.ensureQueryData({
          queryKey: coreKeys.jobLocations(user.id),
          queryFn: () => fetchJobLocations<JobLocation>(user.id),
          staleTime: 60 * 60 * 1000,
        });

        if (!cancelled) {
          const filtered = (rows || []).filter(
            (r) => r.latitude !== null && r.longitude !== null
          );

          // Fetch job rows for these locations to get title/company/location_type
          const jobIds = Array.from(
            new Set(filtered.map((r) => Number(r.job_id)).filter(Boolean))
          );
          let jobsMap: Record<number, JobRowMini> = {};
          if (jobIds.length > 0) {
            try {
              const allJobs = await qc.ensureQueryData({
                queryKey: coreKeys.jobs(user.id),
                queryFn: () => fetchCoreJobs<JobRowMini>(user.id),
                staleTime: 60 * 60 * 1000,
              });
              jobsMap = (allJobs || [])
                .filter((j) => j && jobIds.includes(Number(j.id)))
                .reduce((acc, j) => {
                  acc[Number(j.id)] = j;
                  return acc;
                }, {} as Record<number, JobRowMini>);
            } catch (_e) {
              // If cache load fails, we still render locations without job titles.
            }
          }

          const withJob = filtered.map((loc) => ({
            ...loc,
            job: loc.job_id ? jobsMap[Number(loc.job_id)] ?? null : null,
          }));
          setLocations(filtered);
          setLocationsWithJob(withJob);
          setLoading(false);

          // fetch user's saved home location from user_locations table (cached)
          try {
            const loc = await qc.ensureQueryData({
              queryKey: coreKeys.userLocation(user.id),
              queryFn: () =>
                fetchUserLocation<{ latitude: number; longitude: number }>(
                  user.id
                ),
              staleTime: 60 * 60 * 1000,
            });
            if (
              loc &&
              typeof (loc as any).latitude === "number" &&
              typeof (loc as any).longitude === "number"
            ) {
              setHomeLocation({
                latitude: (loc as any).latitude,
                longitude: (loc as any).longitude,
              });
            }
          } catch (_e) {
            // ignore
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || String(err));
          setLoading(false);
        }
      }
    }

    loadLocations();

    // optionally subscribe to changes if real-time desired (not added here)

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    // update markers when locations change
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (locationsWithJob.length === 0) return;

    const latLngTuples: L.LatLngTuple[] = [];

    locationsWithJob.forEach((loc) => {
      if (loc.latitude == null || loc.longitude == null) return;
      // Apply filter: if filter != 'all' then require job.location_type === filter
      if (filter !== "all") {
        const jt = loc.job?.location_type
          ? String(loc.job.location_type).toLowerCase()
          : null;
        if (jt !== filter) return;
      }

      const marker = L.marker([loc.latitude, loc.longitude], { icon: pinIcon });

      const titleHtml = loc.job?.job_title
        ? `<div><strong>${loc.job!.job_title}</strong></div>`
        : "";
      const companyHtml = loc.job?.company_name
        ? `<div>${loc.job!.company_name}</div>`
        : "";
      const addressHtml = loc.full_address
        ? `<div>${loc.full_address}</div>`
        : "";
      const linkHtml = loc.job_id
        ? `<div><button id="open-job-${loc.job_id}" style="background:none;border:none;color:var(--link);text-decoration:underline;cursor:pointer;padding:0">Open job</button></div>`
        : "";

      // compute commute info
      let commuteHtml = "";
      const jtLower = loc.job?.location_type
        ? String(loc.job.location_type).toLowerCase()
        : null;
      if (jtLower === "remote") {
        commuteHtml = `<div><em>Remote role — no commute</em></div>`;
      } else if (
        homeLocation &&
        typeof homeLocation.latitude === "number" &&
        typeof homeLocation.longitude === "number"
      ) {
        // haversine distance
        function haversineKm(
          lat1: number,
          lon1: number,
          lat2: number,
          lon2: number
        ) {
          const toRad = (v: number) => (v * Math.PI) / 180;
          const R = 6371; // km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        }

        const distKm = haversineKm(
          homeLocation.latitude,
          homeLocation.longitude,
          loc.latitude as number,
          loc.longitude as number
        );
        const toKm = (km: number) => `${km.toFixed(1)} km`;
        // estimate travel time assuming average driving speed 60 km/h
        const avgSpeedKph = 60;
        const minutes = Math.round((distKm / avgSpeedKph) * 60);
        commuteHtml = `<div>Commute: ${toKm(
          distKm
        )} (~${minutes} min drive)</div>`;
      } else {
        commuteHtml = `<div><em>Commute: home location not set</em></div>`;
      }

      marker.bindPopup(
        `${titleHtml}${companyHtml}${addressHtml}${commuteHtml}${linkHtml}`
      );
      marker.addTo(markersRef.current as L.LayerGroup);

      // wire the Open job button inside the popup to the provided handler
      if (loc.job_id && onOpenJob) {
        const btnId = `open-job-${loc.job_id}`;
        marker.on("popupopen", () => {
          const el = document.getElementById(btnId);
          if (el) {
            // set onclick directly; safe because closure has onOpenJob
            (el as HTMLElement).onclick = () => onOpenJob(Number(loc.job_id));
          }
        });
      }

      // cast to tuple since we've checked for null above
      latLngTuples.push([loc.latitude as number, loc.longitude as number]);
    });

    try {
      if (latLngTuples.length === 1) {
        mapRef.current.setView(latLngTuples[0], 12);
      } else if (latLngTuples.length > 1) {
        mapRef.current.fitBounds(L.latLngBounds(latLngTuples));
      }
    } catch (e) {
      // ignore fitBounds errors
    }
  }, [locationsWithJob, filter, homeLocation]);

  return (
    <div>
      {error && <div style={{ color: "var(--error)" }}>Error: {error}</div>}
      {loading && <div>Loading job locations…</div>}
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <label htmlFor="location-filter" style={{ fontSize: 13 }}>
          Filter:
        </label>
        <select
          id="location-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6 }}
        >
          <option value="all">All</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="in person">In person</option>
        </select>
      </div>
      <div
        ref={mapContainerRef}
        style={{
          height: "420px",
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
        }}
        role="region"
        aria-label="Job locations map"
      />
    </div>
  );
};

export default JobMap;

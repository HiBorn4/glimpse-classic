'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

import { apiFetch, prefetchImages, Photo, Person, EventInfo, PhotosResponse } from '@/lib/api';
import { HeroSection } from '@/components/hero/HeroSection';
import { ThumbnailPanel } from '@/components/thumbnails/ThumbnailPanel';
import { FilterBar } from '@/components/filters/FilterBar';
import { PhotoGrid } from '@/components/gallery/PhotoGrid';
import { Lightbox } from '@/components/gallery/Lightbox';
import { SelfieOverlay } from '@/components/gallery/SelfieSearch';

const PER_PAGE = 80;

export default function Home() {
  // ── Data ────────────────────────────────────────────────────────────────────
  const [eventInfo, setEventInfo]   = useState<EventInfo | null>(null);
  const [people, setPeople]         = useState<Person[]>([]);
  const [photos, setPhotos]         = useState<Photo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetching, setFetching]     = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);
  const [ceremony, setCeremony]     = useState('');
  const [exactOnly, setExactOnly]   = useState(false);
  const [onlyMe, setOnlyMe]         = useState(false);
  const [orientation, setOrientation] = useState('');

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters]         = useState(true);
  const [showThumbnails, setShowThumbnails]   = useState(true);
  const [showSearch, setShowSearch]           = useState(false);
  const [lightboxIdx, setLightboxIdx]         = useState<number | null>(null);

  // filterKey tracks a filter change — used to fade grid without emptying it
  const [filterKey, setFilterKey] = useState(0);

  const galleryRef  = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      apiFetch<EventInfo>('/api/events/info').catch(() => null),
      apiFetch<{ people: Person[] }>('/api/events/people').catch(() => ({ people: [] })),
    ]).then(([info, ppl]) => {
      if (info) setEventInfo(info);
      if (ppl)  setPeople(ppl.people ?? []);
      setLoading(false);
    });
  }, []);

  // ── Fetch photos ─────────────────────────────────────────────────────────────
  const fetchPhotos = useCallback(async (pageNum: number, append: boolean) => {
    setFetching(true);
    try {
      const p = new URLSearchParams();
      if (ceremony)              p.set('ceremony', ceremony);
      if (selectedPeople.length) p.set('person_ids', selectedPeople.join(','));
      if (selectedPeople.length >= 2) p.set('exact_only', String(exactOnly));
      if (selectedPeople.length === 1 && onlyMe) p.set('only_me', 'true');
      if (orientation)           p.set('orientation', orientation);
      p.set('page', String(pageNum));
      p.set('per_page', String(PER_PAGE));

      const res = await apiFetch<PhotosResponse>(`/api/gallery/photos?${p}`);

      if (append) {
        // Infinite scroll — append to bottom. No blink because grid stays mounted.
        setPhotos((prev) => [...prev, ...res.photos]);
        // Prefetch next batch images for instant display
        prefetchImages(res.photos.map((ph) => ph.viewing_url), 24);
      } else {
        // Filter change — replace grid. We do NOT clear to [] first.
        // This prevents the empty-flash. New photos replace old photos atomically.
        setPhotos(res.photos);
        prefetchImages(res.photos.map((ph) => ph.viewing_url), 32);
      }
      setTotalPhotos(res.total);
      setHasMore(res.has_more);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [ceremony, selectedPeople, exactOnly, onlyMe, orientation]);

  // ── Filter change: reset pagination, re-fetch ──────────────────────────────
  // IMPORTANT: we do NOT do setPhotos([]) here — that was causing the blink.
  // Old photos stay visible until the API responds with new ones.
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setFilterKey((k) => k + 1); // bump key → CSS animation re-fires for first batch
    fetchPhotos(1, false);
  }, [fetchPhotos]);

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || fetching) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !fetching) {
          const next = page + 1;
          setPage(next);
          fetchPhotos(next, true);
        }
      },
      { rootMargin: '900px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, fetching, page, fetchPhotos]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const scrollToGallery = () => galleryRef.current?.scrollIntoView({ behavior: 'smooth' });

  const clearAll = () => {
    setSelectedPeople([]);
    setCeremony('');
    setExactOnly(false);
    setOnlyMe(false);
    setOrientation('');
  };

  const handlePeopleSelect = (ids: number[]) => {
    setSelectedPeople(ids);
    if (ids.length < 2) setExactOnly(false);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#ddd', borderTopColor: 'transparent' }}
          />
          <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (!eventInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">📷</p>
          <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Georgia,serif' }}>
            No Event Data
          </h1>
          <p className="text-sm text-gray-400">Run the classifier to populate the gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <HeroSection onScrollDown={scrollToGallery} />

      <div ref={galleryRef}>

        {/* Collapsible thumbnail panel */}
        {people.length > 0 && (
          <ThumbnailPanel
            show={showThumbnails}
            onToggle={() => setShowThumbnails((v) => !v)}
            people={people}
            selected={selectedPeople}
            onSelect={handlePeopleSelect}
            onFindMe={() => setShowSearch(true)}
          />
        )}

        {/* Filter bar */}
        <FilterBar
          ceremonies={eventInfo.ceremonies}
          activeCeremony={ceremony}
          onCeremony={setCeremony}
          orientation={orientation}
          onOrientation={setOrientation}
          selectedPeople={selectedPeople}
          exactOnly={exactOnly}
          setExactOnly={setExactOnly}
          onlyMe={onlyMe}
          setOnlyMe={setOnlyMe}
          totalPhotos={totalPhotos}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
          showThumbnails={showThumbnails}
          onToggleThumbnails={() => setShowThumbnails((v) => !v)}
          onClear={clearAll}
        />

        {/* Photo grid — keyed by filterKey so animation re-runs on filter change */}
        <div className="w-full mx-auto py-1">
          {photos.length === 0 && !fetching ? (
            <div className="text-center py-32">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1" className="mx-auto mb-4">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm" style={{ color: '#ccc' }}>No photos match your filters</p>
            </div>
          ) : (
            <PhotoGrid key={filterKey} photos={photos} onPhotoClick={setLightboxIdx} />
          )}

          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

          {fetching && (
            <div className="flex justify-center py-8">
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#e0e0e0', borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {!hasMore && photos.length > 0 && (
            <div className="text-center py-8 text-xs tracking-widest uppercase" style={{ color: '#e8e8e8' }}>
              All {totalPhotos.toLocaleString()} photos loaded
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && photos[lightboxIdx] && (
          <Lightbox
            photo={photos[lightboxIdx]}
            onClose={() => setLightboxIdx(null)}
            onPrev={lightboxIdx > 0 ? () => setLightboxIdx((i) => (i ?? 0) - 1) : undefined}
            onNext={lightboxIdx < photos.length - 1 ? () => setLightboxIdx((i) => (i ?? 0) + 1) : undefined}
          />
        )}
      </AnimatePresence>

      {showSearch && (
        <SelfieOverlay
          onMatch={(pid) => { setSelectedPeople([pid]); setShowSearch(false); scrollToGallery(); }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

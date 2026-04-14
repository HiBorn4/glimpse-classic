'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUpload } from '@/lib/api';

interface SelfieOverlayProps {
  onMatch: (personId: number) => void;
  onClose: () => void;
}

type Step = 'choose' | 'camera' | 'loading' | 'error';

export function SelfieOverlay({ onMatch, onClose }: SelfieOverlayProps) {
  const [step, setStep] = useState<Step>('choose');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [capturing, setCapturing] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const uploadRef   = useRef<HTMLInputElement>(null);

  // ── Stop camera stream ───────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Start camera via getUserMedia ────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError('');
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',        // front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      stopStream();
      const e = err as DOMException;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera in your browser settings, then try again.');
      } else if (e.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Please upload a photo instead.');
      } else {
        setCameraError('Could not open camera. Please upload a photo instead.');
      }
    }
  }, [stopStream]);

  // ── Capture photo from video ─────────────────────────────────────────────
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;
    setCapturing(true);

    const video  = videoRef.current;

    // Use at least 1280px wide for reliable face detection
    const targetW = Math.max(video.videoWidth  || 640, 1280);
    const targetH = Math.round(targetW * ((video.videoHeight || 480) / (video.videoWidth || 640)));

    const canvas = document.createElement('canvas');
    canvas.width  = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) { setCapturing(false); return; }

    // ⚠️ Do NOT mirror the canvas blob — the face detector needs natural
    // (unmirrored) orientation. The video preview is mirrored via CSS scaleX(-1)
    // for the user's comfort only. We draw the raw frame here.
    ctx.drawImage(video, 0, 0, targetW, targetH);

    stopStream();

    canvas.toBlob(async (blob) => {
      if (!blob) { setCapturing(false); return; }
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      await processFile(file);
      setCapturing(false);
    }, 'image/jpeg', 0.95);  // higher quality = better face detection accuracy
  }, [stopStream]);

  // ── Process file (upload + search) ───────────────────────────────────────
  const processFile = async (file: File) => {
    setStep('loading');
    setError('');
    try {
      // Use a permissive threshold (0.35) so partial/angled faces still match.
      // The backend default is 0.35 now, but we pass explicitly for clarity.
      const res = await apiUpload('/api/search/selfie?threshold=0.35&top_k=5', file);
      if (res.matches?.length > 0) {
        onMatch(res.matches[0].person_id);
      } else if (res.error) {
        // Backend returned a face-detection error (e.g. "No face detected")
        setError("We couldn't detect a face. Please try again in better lighting, face the camera directly, and make sure your full face is visible.");
        setStep('error');
      } else {
        setError("No matching photos found. Make sure you're a guest in the wedding album.");
        setStep('error');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.toLowerCase().includes('no face') || msg.toLowerCase().includes('face detected')) {
        setError("We couldn't detect a face. Please try again in better lighting with your face fully visible.");
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
      setStep('error');
    }
  };

  // ── Cleanup stream on unmount or close ────────────────────────────────────
  useEffect(() => { return () => stopStream(); }, [stopStream]);

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const goBack = () => {
    stopStream();
    setCameraError('');
    setStep('choose');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(28px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-3xl w-full relative overflow-hidden"
        style={{
          maxWidth: 380,
          boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden file upload input */}
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
        />

        {/* Close / Back button */}
        <button
          onClick={step === 'camera' ? goBack : handleClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 30, height: 30, borderRadius: '50%',
            background: step === 'camera' ? 'rgba(0,0,0,0.4)' : '#f5f5f5',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {step === 'camera' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </button>

        <AnimatePresence mode="wait">

          {/* ── CHOOSE ── */}
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
              style={{ padding: '28px 28px 28px' }}
            >
              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #fff8e8 0%, #fff0d4 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round">
                  <defs>
                    <linearGradient id="findGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#D4A017"/>
                      <stop offset="100%" stopColor="#E07B00"/>
                    </linearGradient>
                  </defs>
                  <circle cx="11" cy="11" r="7" stroke="url(#findGrad)"/>
                  <path d="M16.5 16.5L21 21" stroke="url(#findGrad)"/>
                  <circle cx="11" cy="9" r="2.5" stroke="url(#findGrad)"/>
                  <path d="M7 15c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="url(#findGrad)"/>
                </svg>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Georgia,serif', marginBottom: 6, textAlign: 'center' }}>
                Find Your Photos
              </h2>
              <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24, fontFamily: 'Inter,-apple-system,sans-serif', lineHeight: 1.5, textAlign: 'center' }}>
                Take a selfie or upload a photo — we'll find every picture you're in
              </p>

              {/* Take selfie — opens in-app camera */}
              <button
                onClick={startCamera}
                style={{
                  width: '100%', padding: '14px 20px', marginBottom: 10,
                  borderRadius: 16, border: 'none',
                  background: 'linear-gradient(135deg, #D4A017 0%, #F5C842 50%, #E07B00 100%)',
                  color: 'white', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 6px 20px rgba(212,160,23,0.38)',
                  fontFamily: 'Inter,-apple-system,sans-serif',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(212,160,23,0.48)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(212,160,23,0.38)'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Take a Selfie
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                <span style={{ fontSize: 12, color: '#ccc', fontFamily: 'Inter,-apple-system,sans-serif' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              </div>

              {/* Upload */}
              <button
                onClick={() => uploadRef.current?.click()}
                style={{
                  width: '100%', padding: '13px 20px',
                  borderRadius: 16, border: '1.5px solid #e8e8e8',
                  background: 'white', color: '#555',
                  fontWeight: 500, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'Inter,-apple-system,sans-serif',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#D4A017'; (e.currentTarget as HTMLElement).style.background = '#fffdf5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8'; (e.currentTarget as HTMLElement).style.background = 'white'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload a Photo
              </button>

              <p style={{ fontSize: 11, color: '#ccc', marginTop: 14, textAlign: 'center', fontFamily: 'Inter,-apple-system,sans-serif', lineHeight: 1.4 }}>
                Your photo is only used to search and is never stored
              </p>
            </motion.div>
          )}

          {/* ── CAMERA ── */}
          {step === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              {cameraError ? (
                /* Camera permission error */
                <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: '#fff8e8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 1l22 22M17 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5M21 9v8.5M9 3h6l2 3h1a2 2 0 0 1 2 2v4"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 20, fontFamily: 'Inter,-apple-system,sans-serif' }}>
                    {cameraError}
                  </p>
                  <button
                    onClick={() => uploadRef.current?.click()}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #D4A017, #E07B00)',
                      color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      fontFamily: 'Inter,-apple-system,sans-serif',
                    }}
                  >
                    Upload a Photo Instead
                  </button>
                </div>
              ) : (
                /* Live camera view */
                <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: 'scaleX(-1)',  // mirror for selfie
                    }}
                  />

                  {/* Face guide oval */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      width: '55%', height: '72%',
                      border: '2px solid rgba(255,255,255,0.55)',
                      borderRadius: '50%',
                      boxShadow: '0 0 0 4000px rgba(0,0,0,0.3)',
                    }} />
                  </div>

                  {/* Instruction */}
                  <div style={{
                    position: 'absolute', bottom: 12, left: 0, right: 0,
                    textAlign: 'center', pointerEvents: 'none',
                  }}>
                    <span style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.75)',
                      fontFamily: 'Inter,-apple-system,sans-serif',
                      background: 'rgba(0,0,0,0.35)', padding: '4px 12px', borderRadius: 20,
                    }}>
                      Position your face in the oval
                    </span>
                  </div>
                </div>
              )}

              {/* Capture button */}
              {!cameraError && (
                <div style={{ padding: '20px 28px 24px', textAlign: 'center' }}>
                  <button
                    onClick={capturePhoto}
                    disabled={capturing}
                    style={{
                      width: 68, height: 68, borderRadius: '50%',
                      border: '4px solid #D4A017',
                      background: capturing ? '#f0f0f0' : 'white',
                      cursor: capturing ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto',
                      boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'; }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  >
                    {capturing ? (
                      <div style={{
                        width: 24, height: 24, border: '3px solid #D4A017',
                        borderTopColor: 'transparent', borderRadius: '50%',
                        animation: 'selfieSpinner 0.7s linear infinite',
                      }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #D4A017, #F5C842)' }} />
                    )}
                  </button>
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 10, fontFamily: 'Inter,-apple-system,sans-serif' }}>
                    {capturing ? 'Processing…' : 'Tap to capture'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 58, height: 58, position: 'relative' }}>
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'conic-gradient(#D4A017, #F5C842, #E07B00, #D4A017)',
                    borderRadius: '50%',
                    animation: 'selfieSpinner 0.9s linear infinite',
                  }} />
                  <div style={{ position: 'absolute', inset: 5, background: 'white', borderRadius: '50%' }} />
                </div>
                <p style={{ fontSize: 15, color: '#555', fontFamily: 'Inter,-apple-system,sans-serif', fontWeight: 500 }}>
                  Searching all photos…
                </p>
                <p style={{ fontSize: 12, color: '#bbb', fontFamily: 'Inter,-apple-system,sans-serif' }}>
                  This takes just a moment
                </p>
              </div>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: '#fff5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e57373" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 20, fontFamily: 'Inter,-apple-system,sans-serif' }}>
                  {error}
                </p>
                <button
                  onClick={goBack}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #D4A017, #E07B00)',
                    color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    fontFamily: 'Inter,-apple-system,sans-serif',
                  }}
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes selfieSpinner {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

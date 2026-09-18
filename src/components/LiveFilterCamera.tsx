import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Download, Zap, Video, Image as ImageIcon } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// ─── Filter definitions ──────────────────────────────────────────────────────
// Each filter is a CSS filter string + canvas post-processing descriptor

interface FilterDef {
  id: string;
  label: string | ((isDog: boolean) => string);
  emoji: string;
  css: string;           // CSS filter applied to <video>
  overlay?: string;      // optional rgba overlay color
  overlayOpacity?: number;
  cat?: boolean;         // show on cat platform
  dog?: boolean;         // show on dog platform
  kind?: 'ar';            // 'ar' = animated, face-tracked overlay instead of a CSS filter
  arId?: 'dog-ears' | 'cat-ears';
}

const FILTERS: FilterDef[] = [
  {
    id: 'none',
    label: 'Normal',
    emoji: '📷',
    css: 'none',
    cat: true, dog: true,
  },
  {
    id: 'warm-glow',
    label: isDog => isDog ? 'Golden Hour' : 'Warm Loaf',
    emoji: '🌅',
    css: 'sepia(0.25) saturate(1.4) contrast(1.1) brightness(1.05) hue-rotate(-8deg)',
    overlay: '#ff9900',
    overlayOpacity: 0.06,
    cat: true, dog: true,
  },
  {
    id: 'vintage-whiskers',
    label: isDog => isDog ? 'Vintage Rover' : 'Vintage Whiskers',
    emoji: '📸',
    css: 'sepia(0.45) contrast(1.25) brightness(0.88) saturate(1.5)',
    overlay: '#8B4513',
    overlayOpacity: 0.08,
    cat: true, dog: true,
  },
  {
    id: 'cyber-cool',
    label: 'Cyber Neon',
    emoji: '🔮',
    css: 'hue-rotate(180deg) contrast(1.3) saturate(1.6) brightness(0.95)',
    overlay: '#0ff',
    overlayOpacity: 0.05,
    cat: true, dog: true,
  },
  {
    id: 'sepia-purr',
    label: isDog => isDog ? 'Sepia Snoot' : 'Sepia Purr',
    emoji: '🎞️',
    css: 'sepia(0.75) contrast(1.1) brightness(0.98)',
    cat: true, dog: true,
  },
  {
    id: 'black-white-paws',
    label: 'B&W Paws',
    emoji: '🖤',
    css: 'grayscale(1) contrast(1.5) brightness(1.02)',
    cat: true, dog: true,
  },
  {
    id: 'catwalk-editorial',
    label: 'Editorial',
    emoji: '👁️',
    css: 'contrast(1.4) saturate(0.6) brightness(0.92)',
    overlay: '#1a1e3c',
    overlayOpacity: 0.10,
    cat: true, dog: false,
  },
  {
    id: 'electric-purple',
    label: 'Electric',
    emoji: '⚡',
    css: 'saturate(2.0) contrast(1.2) hue-rotate(-30deg) brightness(1.08)',
    overlay: '#8b30e8',
    overlayOpacity: 0.08,
    cat: true, dog: false,
  },
  {
    id: 'dog-park-sunny',
    label: 'Dog Park',
    emoji: '☀️',
    css: 'saturate(1.6) contrast(1.1) brightness(1.12) hue-rotate(10deg)',
    overlay: '#fdb52a',
    overlayOpacity: 0.06,
    cat: false, dog: true,
  },
  {
    id: 'teal-dream',
    label: 'Teal Dream',
    emoji: '🌊',
    css: 'saturate(1.4) contrast(1.15) hue-rotate(160deg) brightness(0.98)',
    overlay: '#2ec4b6',
    overlayOpacity: 0.07,
    cat: false, dog: true,
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    emoji: '🌑',
    css: 'contrast(1.7) saturate(0.8) brightness(0.78)',
    overlay: '#000',
    overlayOpacity: 0.15,
    cat: true, dog: true,
  },
  {
    id: 'dreamy',
    label: 'Dreamy',
    emoji: '🌸',
    css: 'saturate(1.2) brightness(1.15) contrast(0.9) blur(0.5px)',
    overlay: '#f9a8d4',
    overlayOpacity: 0.08,
    cat: true, dog: true,
  },
  // ─── Animated, face-tracked filters ────────────────────────────────────
  // These draw moving ears/whiskers on top of your face in real time (like a
  // Snapchat/TikTok lens), instead of just tinting the image with CSS.
  {
    id: 'dog-ears',
    label: 'Dog Ears',
    emoji: '🐶',
    css: 'none',
    kind: 'ar',
    arId: 'dog-ears',
    cat: true, dog: true,
  },
  {
    id: 'cat-ears',
    label: 'Cat Ears',
    emoji: '🐱',
    css: 'none',
    kind: 'ar',
    arId: 'cat-ears',
    cat: true, dog: true,
  },
];

// Runtime label resolver
function getLabel(f: FilterDef, isDog: boolean): string {
  if (typeof f.label === 'function') return (f.label as (d: boolean) => string)(isDog);
  return f.label as string;
}

const MAX_RECORD_MS = 15000; // keep clips short so the upload stays small
const RECORD_CANVAS_MAX_DIM = 720; // cap resolution for filtered video recording

// ─── Face-tracked "AR" overlay (dog ears / cat ears) ────────────────────────
// A lightweight in-browser face tracker (MediaPipe) finds a handful of face
// points each frame (eyes, forehead, nose, chin). We use those points to
// place, scale, and rotate hand-drawn ear/nose/whisker shapes so they follow
// the face — no external art assets needed, and it works entirely on-device.

type FacePoint = { x: number; y: number; z?: number };

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
      );
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    })().catch(err => {
      landmarkerPromise = null; // allow a retry on the next camera open
      throw err;
    });
  }
  return landmarkerPromise;
}

function toPt(lm: FacePoint[], i: number, w: number, h: number) {
  return { x: lm[i].x * w, y: lm[i].y * h };
}

function drawFloppyEar(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, size: number, mirror: boolean) {
  const dir = mirror ? 1 : -1;
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.fillStyle = '#8a5a3c';
  ctx.strokeStyle = '#5f3c26';
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.2);
  ctx.quadraticCurveTo(dir * size * 0.6, size * 0.1, dir * size * 0.35, size * 1.1);
  ctx.quadraticCurveTo(dir * size * 0.05, size * 0.9, 0, size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c98a68';
  ctx.beginPath();
  ctx.ellipse(dir * size * 0.18, size * 0.55, size * 0.12, size * 0.28, dir * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPointyEar(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, size: number, mirror: boolean) {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, size * 0.2);
  ctx.lineTo(0, -size * 0.95);
  ctx.lineTo(size * 0.35, size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8a0b0';
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, size * 0.1);
  ctx.lineTo(0, -size * 0.55);
  ctx.lineTo(size * 0.18, size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  void mirror; // shape is symmetric; kept for a consistent call signature
}

function drawArOverlay(
  ctx: CanvasRenderingContext2D,
  lm: FacePoint[],
  w: number,
  h: number,
  arId: 'dog-ears' | 'cat-ears'
) {
  if (!lm || lm.length < 468) return;
  const forehead = toPt(lm, 10, w, h);
  const leftEye = toPt(lm, 33, w, h);
  const rightEye = toPt(lm, 263, w, h);
  const nose = toPt(lm, 1, w, h);
  const chin = toPt(lm, 152, w, h);

  const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) || 1;
  const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y) || eyeDist * 1.6;

  const earSize = eyeDist * 1.6;
  const earGap = eyeDist * 1.1;

  ctx.save();
  ctx.translate(forehead.x, forehead.y);
  ctx.rotate(angle);
  ctx.translate(0, -faceHeight * 0.28);
  if (arId === 'dog-ears') {
    drawFloppyEar(ctx, -earGap, 0, earSize, false);
    drawFloppyEar(ctx, earGap, 0, earSize, true);
  } else {
    drawPointyEar(ctx, -earGap, 0, earSize, false);
    drawPointyEar(ctx, earGap, 0, earSize, true);
  }
  ctx.restore();

  // Nose (and whiskers for the cat filter), tilted with the face but placed
  // at the nose's own tracked position rather than projected from the ears.
  ctx.save();
  ctx.translate(nose.x, nose.y);
  ctx.rotate(angle);
  const noseSize = eyeDist * 0.35;
  ctx.fillStyle = arId === 'dog-ears' ? '#231815' : '#e07a9b';
  ctx.beginPath();
  ctx.ellipse(0, 0, noseSize, noseSize * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  if (arId === 'cat-ears') {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(1.5, eyeDist * 0.03);
    const whiskerLen = eyeDist * 1.4;
    [-1, 1].forEach(side => {
      [-0.25, 0, 0.25].forEach(offset => {
        ctx.beginPath();
        ctx.moveTo(side * noseSize * 0.6, offset * noseSize);
        ctx.lineTo(side * (noseSize * 0.6 + whiskerLen), offset * noseSize * 2.4);
        ctx.stroke();
      });
    });
  }
  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

export type CapturedMedia = { url: string; filterId: string; mediaType: 'image' | 'video' };

interface LiveFilterCameraProps {
  isDog?: boolean;
  onCapture: (media: CapturedMedia) => void;
  onClose: () => void;
}

export const LiveFilterCamera: React.FC<LiveFilterCameraProps> = ({
  isDog = false,
  onCapture,
  onClose,
}) => {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordTickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode]                 = useState<'photo' | 'video'>('photo');
  const [activeFilter, setActiveFilter] = useState('none');
  const [facing, setFacing]             = useState<'user' | 'environment'>('environment');
  const [permission, setPermission]     = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [captured, setCaptured]         = useState<CapturedMedia | null>(null);
  const [flash, setFlash]               = useState(false);
  const [recording, setRecording]       = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [arStatus, setArStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const arRafRef = useRef<number>(0);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastLandmarksRef = useRef<FacePoint[] | null>(null);

  const availableFilters = FILTERS.filter(f => isDog ? f.dog : f.cat);
  const currentFilter = availableFilters.find(f => f.id === activeFilter) ?? availableFilters[0];
  const isArFilter = currentFilter.kind === 'ar';

  // Start camera stream. Video mode also requests the microphone so recorded
  // clips have sound; photo mode doesn't ask for the mic at all.
  const startCamera = useCallback(async (facingMode: 'user' | 'environment', wantAudio: boolean) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: wantAudio,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermission('granted');
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    startCamera(facing, mode === 'video');
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(rafRef.current);
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
      if (recordTickRef.current) clearInterval(recordTickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, mode]);

  // Lazily load the face tracker the first time someone picks Dog Ears / Cat
  // Ears — most users won't touch it, so we don't make everyone download it.
  useEffect(() => {
    if (!isArFilter || landmarkerRef.current || arStatus === 'loading') return;
    setArStatus('loading');
    getFaceLandmarker()
      .then(lm => { landmarkerRef.current = lm; setArStatus('ready'); })
      .catch(() => { landmarkerRef.current = null; setArStatus('error'); });
  }, [isArFilter, arStatus]);

  // Continuously find the face and draw the ears/nose onto a transparent
  // canvas layered on top of the live video preview, so the effect follows
  // your face in real time (not just when the photo/video is captured).
  useEffect(() => {
    let active = true;
    function loop() {
      if (!active) return;
      const video = videoRef.current;
      const arCanvas = arCanvasRef.current;
      if (video && arCanvas && video.videoWidth) {
        if (arCanvas.width !== video.videoWidth || arCanvas.height !== video.videoHeight) {
          arCanvas.width = video.videoWidth;
          arCanvas.height = video.videoHeight;
        }
        const actx = arCanvas.getContext('2d');
        if (actx) {
          actx.clearRect(0, 0, arCanvas.width, arCanvas.height);
          if (isArFilter && landmarkerRef.current && video.readyState >= 2) {
            try {
              const result = landmarkerRef.current.detectForVideo(video, performance.now());
              const lm = (result.faceLandmarks?.[0] as FacePoint[] | undefined) ?? null;
              lastLandmarksRef.current = lm;
              if (lm && currentFilter.arId) {
                drawArOverlay(actx, lm, arCanvas.width, arCanvas.height, currentFilter.arId);
              }
            } catch {
              // A detection hiccup on one frame isn't worth surfacing — just skip it.
            }
          } else if (!isArFilter) {
            lastLandmarksRef.current = null;
          }
        }
      }
      arRafRef.current = requestAnimationFrame(loop);
    }
    arRafRef.current = requestAnimationFrame(loop);
    return () => { active = false; cancelAnimationFrame(arRafRef.current); };
  }, [isArFilter, currentFilter.arId]);

  // ─── Photo capture ──────────────────────────────────────────────────────
  const handleCapturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d')!;

    ctx.filter = currentFilter.css !== 'none' ? currentFilter.css : '';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = '';

    if (currentFilter.overlay && currentFilter.overlayOpacity) {
      ctx.fillStyle = currentFilter.overlay;
      ctx.globalAlpha = currentFilter.overlayOpacity;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
    if (isArFilter && currentFilter.arId && lastLandmarksRef.current) {
      drawArOverlay(ctx, lastLandmarksRef.current, canvas.width, canvas.height, currentFilter.arId);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured({ url: dataUrl, filterId: activeFilter, mediaType: 'image' });

    setFlash(true);
    setTimeout(() => setFlash(false), 180);
  }, [currentFilter, activeFilter]);

  // ─── Video recording ────────────────────────────────────────────────────
  // Continuously redraws the (filtered) video frame onto the hidden canvas so
  // canvas.captureStream() has fresh, filtered frames to hand to MediaRecorder
  // — this is what actually bakes the chosen filter into the recorded video,
  // not just the on-screen preview.
  const drawLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.videoWidth) {
      const ctx = canvas.getContext('2d')!;
      ctx.filter = currentFilter.css !== 'none' ? currentFilter.css : '';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = '';
      if (currentFilter.overlay && currentFilter.overlayOpacity) {
        ctx.fillStyle = currentFilter.overlay;
        ctx.globalAlpha = currentFilter.overlayOpacity;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }
      if (isArFilter && currentFilter.arId && lastLandmarksRef.current) {
        drawArOverlay(ctx, lastLandmarksRef.current, canvas.width, canvas.height, currentFilter.arId);
      }
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  }, [currentFilter, isArFilter]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const scale = Math.min(1, RECORD_CANVAS_MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    canvas.width  = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawLoop);

    const canvasStream = (canvas as HTMLCanvasElement).captureStream(30);
    const audioTracks = streamRef.current?.getAudioTracks() ?? [];
    const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find(t => (window as any).MediaRecorder && MediaRecorder.isTypeSupported(t)) || 'video/webm';

    chunksRef.current = [];
    const recorder = new MediaRecorder(combined, { mimeType });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      cancelAnimationFrame(rafRef.current);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setCaptured({ url: reader.result as string, filterId: activeFilter, mediaType: 'video' });
      };
      reader.readAsDataURL(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setRecordSeconds(0);

    recordTickRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    recordTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, MAX_RECORD_MS);
  }, [drawLoop, activeFilter, stopRecording]);

  const handleShutter = () => {
    if (mode === 'photo') {
      handleCapturePhoto();
      return;
    }
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    if (!recording) {
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
      if (recordTickRef.current) clearInterval(recordTickRef.current);
      setRecordSeconds(0);
    }
  }, [recording]);

  // recorder.onstop fires asynchronously — reflect that in `recording` state
  useEffect(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    const onStopUi = () => setRecording(false);
    recorder.addEventListener('stop', onStopUi);
    return () => recorder.removeEventListener('stop', onStopUi);
  }, [recording]);

  const handleAccept = () => {
    if (captured) {
      onCapture(captured);
      onClose();
    }
  };

  const handleRetake = () => {
    setCaptured(null);
  };

  const isDogGrad = 'linear-gradient(135deg,#0d9488,#2ec4b6,#fdb52a)';
  const isCatGrad = 'linear-gradient(135deg,#8b30e8,#f050a0,#f07040)';
  const accentGrad = isDog ? isDogGrad : isCatGrad;
  const accentColor = isDog ? '#2ec4b6' : '#8b30e8';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
        <button onClick={onClose}
          className="w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
          <X className="w-5 h-5" />
        </button>

        <div className="text-white text-sm font-bold px-3 py-1 rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
          {recording
            ? `● Recording · ${recordSeconds}s`
            : `${isDog ? '🐶 The Dog Park' : '🐱 The Catwalk'} · ${getLabel(currentFilter, isDog)}`}
        </div>

        <button onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')}
          disabled={recording}
          className="w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 disabled:opacity-40">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Photo / Video mode toggle */}
      {!captured && (
        <div className="absolute top-16 left-0 right-0 z-20 flex justify-center">
          <div className="flex bg-black/50 backdrop-blur-md rounded-full border border-white/20 p-1">
            <button
              disabled={recording}
              onClick={() => setMode('photo')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${mode === 'photo' ? 'text-white' : 'text-white/50'}`}
              style={{ background: mode === 'photo' ? accentGrad : 'transparent' }}>
              <ImageIcon className="w-3.5 h-3.5" /> Photo
            </button>
            <button
              disabled={recording}
              onClick={() => setMode('video')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${mode === 'video' ? 'text-white' : 'text-white/50'}`}
              style={{ background: mode === 'video' ? accentGrad : 'transparent' }}>
              <Video className="w-3.5 h-3.5" /> Video
            </button>
          </div>
        </div>
      )}

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: currentFilter.css !== 'none' ? currentFilter.css : undefined }}
            />
            {currentFilter.overlay && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: currentFilter.overlay, opacity: currentFilter.overlayOpacity }}
              />
            )}
            <canvas ref={arCanvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            {isArFilter && arStatus === 'loading' && (
              <div className="absolute top-28 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md">
                  Loading face tracking…
                </div>
              </div>
            )}
            {isArFilter && arStatus === 'error' && (
              <div className="absolute top-28 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md">
                  Face tracking unavailable — try another filter
                </div>
              </div>
            )}
            {flash && (
              <div className="absolute inset-0 bg-white z-30 animate-ping" style={{ animationDuration: '150ms', animationIterationCount: 1 }} />
            )}
            {permission === 'denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white text-center p-8">
                <Camera className="w-12 h-12 opacity-40" />
                <p className="text-sm opacity-60">Camera access denied.<br />Enable it in your browser settings.</p>
              </div>
            )}
          </>
        ) : captured.mediaType === 'video' ? (
          <video src={captured.url} controls autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={captured.url} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Hidden canvas used for both photo capture and filtered video recording */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Filter strip */}
      {!captured && (
        <div className="absolute bottom-28 left-0 right-0 z-20">
          <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-none">
            {availableFilters.map(f => {
              const active = f.id === activeFilter;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl transition-all ${active ? 'scale-110' : 'opacity-70'}`}
                    style={{
                      borderColor: active ? accentColor : 'rgba(255,255,255,0.3)',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(8px)',
                      filter: f.css !== 'none' ? f.css : undefined,
                    }}
                  >
                    {f.emoji}
                  </div>
                  <span className={`text-[10px] font-bold text-white ${active ? 'opacity-100' : 'opacity-50'}`}>
                    {getLabel(f, isDog)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-around px-8 pb-safe-bottom pb-8 pt-4">
        {!captured ? (
          <>
            <div className="w-10" />
            {/* Shutter */}
            <button
              onClick={handleShutter}
              className="rounded-full border-4 border-white flex items-center justify-center shadow-xl transition-transform active:scale-95"
              style={{ width: 72, height: 72 }}>
              <div
                className={mode === 'video' && recording ? 'rounded-md' : 'rounded-full'}
                style={{
                  width: mode === 'video' && recording ? 28 : 56,
                  height: mode === 'video' && recording ? 28 : 56,
                  background: mode === 'video' ? (recording ? '#ef4444' : accentGrad) : accentGrad,
                  transition: 'all 0.15s',
                }}
              />
            </button>
            <div className="w-10" />
          </>
        ) : (
          <>
            <button
              onClick={handleRetake}
              className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">Retake</span>
            </button>

            <button
              onClick={handleAccept}
              className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                style={{ background: accentGrad }}>
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] font-bold text-white">
                Use {captured.mediaType === 'video' ? 'Video' : 'Photo'}
              </span>
            </button>

            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = captured.url;
                link.download = `pawprint-${Date.now()}.${captured.mediaType === 'video' ? 'webm' : 'jpg'}`;
                link.click();
              }}
              className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">Save</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

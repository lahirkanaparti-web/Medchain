import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, X } from 'lucide-react';

export default function CameraCapture({ onPhotoCaptured, currentPreview }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(currentPreview || null);
  const [errorMsg, setErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start live in-browser camera stream
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('In-browser live camera stream is not supported by your device or browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setErrorMsg(err.message || 'Camera permission denied or device unavailable.');
      setIsStreaming(false);
    }
  };

  // Capture current video frame to Canvas Blob
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `packaging_sample_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          setCapturedPreview(previewUrl);
          stopCamera();
          onPhotoCaptured(file, previewUrl);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // Native file input fallback handler
  const handleFallbackFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCapturedPreview(previewUrl);
      stopCamera();
      onPhotoCaptured(file, previewUrl);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    onPhotoCaptured(null, null);
    startCamera();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-700">
        Packaging photograph (Required for physical verification)
      </label>

      {/* Captured Image Preview State */}
      {capturedPreview && !isStreaming ? (
        <div className="bg-white border border-slate-300 rounded p-3 space-y-3 doc-panel">
          <div className="relative rounded overflow-hidden border border-slate-200 bg-slate-900 h-56 flex items-center justify-center">
            <img
              src={capturedPreview}
              alt="Captured medicine packaging"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-2 left-2 bg-clinical-900/90 text-white text-[11px] px-2 py-0.5 rounded font-medium flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" /> Photo attached
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Sample photograph ready for inspection</span>
            <button
              type="button"
              onClick={handleRetake}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold border border-slate-300 transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 mr-1" />
              <span>Retake photo</span>
            </button>
          </div>
        </div>
      ) : isStreaming ? (
        /* Live Camera Video Feed & Capture Target Overlay */
        <div className="bg-clinical-900 border border-slate-700 rounded p-3 space-y-3 text-white">
          <div className="relative rounded overflow-hidden bg-black h-64 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Framing Overlay */}
            <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded pointer-events-none flex items-center justify-center">
              <div className="bg-black/60 text-white text-[11px] px-2.5 py-1 rounded font-medium backdrop-blur-sm">
                Align medicine box within frame
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </button>
            <button
              type="button"
              onClick={captureFrame}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors flex items-center space-x-1 shadow-md"
            >
              <Camera className="w-4 h-4 mr-1.5" /> Capture photo
            </button>
          </div>
        </div>
      ) : (
        /* Initial Action State: Launch Stream OR File Fallback */
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded p-6 text-center space-y-4">
          <div className="max-w-md mx-auto space-y-1">
            <div className="w-10 h-10 rounded bg-clinical-50 border border-clinical-200 text-clinical-800 flex items-center justify-center mx-auto mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-clinical-900">
              Capture or attach a physical photo of the medicine packaging
            </p>
            <p className="text-[11px] text-slate-500">
              Use your device camera or upload an image file to compare against the manufacturer baseline.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded text-left flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Camera access unavailable: {errorMsg}. You can upload an image file below instead.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={startCamera}
              className="w-full sm:w-auto px-4 py-2 bg-clinical-800 hover:bg-clinical-900 text-white text-xs font-bold rounded transition-colors flex items-center justify-center"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" /> Open camera stream
            </button>
            <label className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors cursor-pointer text-center flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Select file from device
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { shouldProcessQrScan } from '@/lib/visitorStore';

interface UseQrScannerOptions {
  onScan: (data: string) => Promise<void> | void;
  cooldownMs?: number;
}

export function useQrScanner({ onScan, cooldownMs = 4000 }: UseQrScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const cameraActiveRef = useRef<boolean>(false);
  const scanningRef = useRef<boolean>(false);
  const lastScanRef = useRef<{ data: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopCamera = useCallback(() => {
    cameraActiveRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActiveRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (
        code &&
        code.data &&
        !scanningRef.current &&
        shouldProcessQrScan(lastScanRef.current, code.data, Date.now(), cooldownMs)
      ) {
        lastScanRef.current = { data: code.data.trim(), at: Date.now() };
        scanningRef.current = true;
        Promise.resolve(onScanRef.current(code.data)).finally(() => {
          scanningRef.current = false;
        });
      }
    }

    if (cameraActiveRef.current) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [cooldownMs]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        cameraActiveRef.current = true;
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        'Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera trên trình duyệt hoặc sử dụng chế độ tải ảnh QR / tra cứu mã.'
      );
      cameraActiveRef.current = false;
      setIsCameraActive(false);
    }
  }, [scanVideoFrame]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    animationFrameId,
    cameraActiveRef,
    scanningRef,
    lastScanRef,
    isCameraActive,
    setIsCameraActive,
    cameraError,
    setCameraError,
    scanVideoFrame,
    startCamera,
    stopCamera,
  };
}

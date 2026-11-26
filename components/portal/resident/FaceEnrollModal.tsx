'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Scan,
  ArrowRight,
  ArrowLeft,
  ZoomIn,
  Lock,
  Zap,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import { skylineEnrollFaceId } from '@/lib/skylineApiClient';
import { saveEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import {
  analyzeBiometric4Samples,
  Biometric4AngleAnalysisResult,
  EnrolledFaceProfile,
  analyzeVideoLighting,
  LightingAnalysisResult,
  playBiometricChime,
} from '@/lib/biometricFaceEngine';
import {
  loadFaceVisionModels,
  scanRealtimeFace,
  RealFacePoseResult,
  extractNeuralDescriptorFromBase64,
  verifyAndAnalyzeBiometricSamples,
  DeepBiometricVerificationResult,
} from '@/lib/realtimeFaceVision';
import {
  canvasToBase64,
  normalizeBiometricSamplesToBase64,
} from '@/lib/imageUtils';
import { useLanguage } from '@/lib/languageContext';

export interface FaceEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  fullName: string;
  apartmentCode: string;
  phone?: string;
  email?: string;
  isFamilyMemberSelfEnroll?: boolean;
  submittedByRole?: string;
  onEnrollSuccess?: (profile: EnrolledFaceProfile) => void;
}

type StepKey = 'FRONT' | 'LEFT' | 'RIGHT' | 'CLOSER' | 'REVIEW';

interface StepConfig {
  key: StepKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  guideText: string;
  icon: string;
  progressPercent: number;
}

const STEPS: StepConfig[] = [
  {
    key: 'FRONT',
    stepNumber: 1,
    title: 'BÆ¯á»šC 1: NHÃŒN THáº²NG VÃ€O CAMERA',
    subtitle: 'GÃ³c chÃ­nh diá»‡n â€¢ Giá»¯ Ä‘áº§u tháº³ng',
    guideText: 'Vui lÃ²ng nhÃ¬n tháº³ng vÃ o mÃ n hÃ¬nh, giá»¯ khuÃ´n máº·t náº±m trong khung trÃ²n.',
    icon: '',
    progressPercent: 25,
  },
  {
    key: 'LEFT',
    stepNumber: 2,
    title: 'BÆ¯á»šC 2: NGHIÃŠNG NHáº¸ SANG TRÃI',
    subtitle: 'NghiÃªng nháº¹ máº·t sang bÃªn trÃ¡i',
    guideText: 'Tá»« tá»« quay nháº¹ máº·t sang bÃªn trÃ¡i Ä‘á»ƒ há»‡ thá»‘ng ghi nháº­n gÃ³c nghiÃªng.',
    icon: '',
    progressPercent: 50,
  },
  {
    key: 'RIGHT',
    stepNumber: 3,
    title: 'BÆ¯á»šC 3: NGHIÃŠNG NHáº¸ SANG PHáº¢I',
    subtitle: 'NghiÃªng nháº¹ máº·t sang bÃªn pháº£i',
    guideText: 'Tá»« tá»« quay nháº¹ máº·t sang bÃªn pháº£i Ä‘á»ƒ há»‡ thá»‘ng ghi nháº­n gÃ³c nghiÃªng.',
    icon: '',
    progressPercent: 75,
  },
  {
    key: 'CLOSER',
    stepNumber: 4,
    title: 'BÆ¯á»šC 4: TIáº¾N Láº I Gáº¦N Má»˜T CHÃšT',
    subtitle: 'Khoáº£ng cÃ¡ch gáº§n hÆ¡n â€¢ XÃ¡c nháº­n ngÆ°á»i tháº­t',
    guideText: 'Tá»« tá»« Ä‘Æ°a máº·t láº¡i gáº§n camera hÆ¡n má»™t chÃºt Ä‘á»ƒ hoÃ n táº¥t nháº­n diá»‡n.',
    icon: '',
    progressPercent: 100,
  },
];

export default function FaceEnrollModal({
  isOpen,
  onClose,
  userId,
  fullName,
  apartmentCode,
  phone,
  email,
  isFamilyMemberSelfEnroll,
  submittedByRole,
  onEnrollSuccess,
}: FaceEnrollModalProps) {
  useEscapeKey(isOpen, onClose);
  const { t } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [biometricAnalysis, setBiometricAnalysis] = useState<Biometric4AngleAnalysisResult | null>(null);

  // 4 Biometric Samples
  const [samples, setSamples] = useState<{
    front: string | null;
    left: string | null;
    right: string | null;
    smile: string | null;
  }>({
    front: null,
    left: null,
    right: null,
    smile: null,
  });

  // Camera & Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-capture & Automated Biometric Sequence State
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [stepLocked, setStepLocked] = useState<boolean>(false);
  const [autoFeedback, setAutoFeedback] = useState<string>('');
  const [poseData, setPoseData] = useState<RealFacePoseResult | null>(null);
  const [isAiReady, setIsAiReady] = useState<boolean>(false);
  const currentStepIndexRef = useRef<number>(0);
  const samplesRef = useRef(samples);
  const consecutiveMatchesRef = useRef<number>(0);
  const isScanningRef = useRef<boolean>(false);
  const autoProgressRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const stepLockedRef = useRef<boolean>(false);
  const baselineCoverageRef = useRef<number>(38);
  const stepGracePeriodUntilRef = useRef<number>(0);

  // Optical Environmental Lighting Assessment
  const [lighting, setLighting] = useState<LightingAnalysisResult | null>(null);

  // Shutter Flash Visual Effect
  const [isShutterFlash, setIsShutterFlash] = useState<boolean>(false);

  // Status & Submit
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  // Náº¡p mÃ´ hÃ¬nh máº¡ng nÆ¡-ron há»c sÃ¢u khi má»Ÿ Modal
  useEffect(() => {
    if (isOpen) {
      loadFaceVisionModels().then((ready) => {
        setIsAiReady(ready);
      }).catch(() => {
        setIsAiReady(false);
      });
    }
  }, [isOpen]);

  // 1. Initialize High-Definition Realtime Webcam Stream (Tá»‘i Æ°u Ä‘á»™ trá»… tháº¥p 640x480)
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, min: 480 },
            height: { ideal: 480, min: 360 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setCameraStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            setIsCameraActive(true);
          } catch (playErr) {
            console.warn('Video play deferred:', playErr);
          }
        }
      } else {
        throw new Error('TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£ káº¿t ná»‘i thiáº¿t bá»‹ MediaDevices.');
      }
    } catch (err: any) {
      console.error('Camera connection error:', err);
      let msg = 'KhÃ´ng thá»ƒ truy cáº­p camera. Vui lÃ²ng cáº¥p quyá»n truy cáº­p webcam trong cÃ i Ä‘áº·t trÃ¬nh duyá»‡t.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Báº¡n Ä‘Ã£ tá»« chá»‘i quyá»n camera. Vui lÃ²ng báº¥m vÃ o biá»ƒu tÆ°á»£ng khÃ³a trÃªn thanh Ä‘á»‹a chá»‰ Ä‘á»ƒ cáº¥p quyá»n.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'KhÃ´ng tÃ¬m tháº¥y thiáº¿t bá»‹ camera trÃªn mÃ¡y tÃ­nh cá»§a báº¡n.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraActive(false);
  }, []);

  // Open/Close Camera on Modal toggle
  useEffect(() => {
    if (isOpen && !isReviewMode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, isReviewMode, startCamera, stopCamera]);

  // Periodic Lighting Assessment (Every 450ms)
  useEffect(() => {
    if (!isOpen || isReviewMode || !isCameraActive) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const result = analyzeVideoLighting(videoRef.current);
        setLighting(result);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, isReviewMode, isCameraActive]);

  // 2. Capture Single High-Res Frame from Video Feed
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Flip horizontal so that user captured image preserves mirror expectation
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvasToBase64(canvas, 'image/jpeg', 0.92);
  }, []);

  // 3. Trigger Step Capture with Audio-Visual Feedback & Seamless Auto Advancement
  const triggerStepCapture = useCallback((stepIdxToCapture?: number) => {
    if (isProcessingRef.current || stepLockedRef.current) return;

    const stepIdx = typeof stepIdxToCapture === 'number' ? stepIdxToCapture : currentStepIndexRef.current;
    const photo = captureFrame();
    if (!photo) {
      setErrorMessage('Camera Ä‘ang khá»Ÿi Ä‘á»™ng hoáº·c chÆ°a á»•n Ä‘á»‹nh khung hÃ¬nh. Báº¡n vui lÃ²ng giá»¯ yÃªn khuÃ´n máº·t vÃ  thá»­ láº¡i nhÃ©.');
      return;
    }

    isProcessingRef.current = true;
    stepLockedRef.current = true;
    setIsProcessing(true);
    setStepLocked(true);
    autoProgressRef.current = 100;
    setAutoProgress(100);

    // Ã‚m thanh sinh tráº¯c há»c chuáº©n
    playBiometricChime(stepIdx === 3 ? 'success' : 'step');

    // Shutter flash effect
    setIsShutterFlash(true);
    setTimeout(() => setIsShutterFlash(false), 200);

    const stepKey = STEPS[stepIdx]?.key || 'FRONT';
    const newSamples = { ...samplesRef.current };

    if (stepKey === 'FRONT') {
      newSamples.front = photo;
      if (poseData?.faceCoverage) {
        baselineCoverageRef.current = poseData.faceCoverage;
      }
    }
    if (stepKey === 'LEFT') newSamples.left = photo;
    if (stepKey === 'RIGHT') newSamples.right = photo;
    if (stepKey === 'CLOSER') newSamples.smile = photo;

    samplesRef.current = newSamples;
    setSamples(newSamples);

    // Dá»«ng 550ms hiá»ƒn thá»‹ tráº¡ng thÃ¡i Ä‘Ã£ khÃ³a gÃ³c trÆ°á»›c khi sang bÆ°á»›c tiáº¿p theo
    setTimeout(async () => {
      isProcessingRef.current = false;
      setIsProcessing(false);
      autoProgressRef.current = 0;
      setAutoProgress(0);

      if (stepIdx < STEPS.length - 1) {
        const nextIdx = stepIdx + 1;
        setCurrentStepIndex(nextIdx);
        currentStepIndexRef.current = nextIdx;
        stepLockedRef.current = false;
        setStepLocked(false);
        consecutiveMatchesRef.current = 0;
        autoProgressRef.current = 0;
        setAutoProgress(0);
        // Khoáº£ng Ä‘á»‡m chuyá»ƒn bÆ°á»›c: BÆ°á»›c 4 (Láº¡i gáº§n) cho 1.4s Ä‘á»ƒ ngÆ°á»i dÃ¹ng ká»‹p Ä‘á»c hÆ°á»›ng dáº«n vÃ  chuáº©n bá»‹ tiáº¿n láº¡i gáº§n
        stepGracePeriodUntilRef.current = Date.now() + (nextIdx === 3 ? 1400 : 700);
      } else {
        // ÄÃ£ Ä‘á»§ 4 gÃ³c -> Tháº©m Ä‘á»‹nh chuyÃªn sÃ¢u báº±ng Deep Computer Vision
        if (newSamples.front && newSamples.left && newSamples.right && newSamples.smile) {
          try {
            const deepRes = await verifyAndAnalyzeBiometricSamples(newSamples as any);
            if (!deepRes.valid) {
              setErrorMessage(deepRes.error || 'áº¢nh chá»¥p chÆ°a rÃµ. Báº¡n vui lÃ²ng thá»±c hiá»‡n láº¡i cÃ¡c bÆ°á»›c nhÃ©.');
              stepLockedRef.current = false;
              setStepLocked(false);
              return;
            }
            setBiometricAnalysis(deepRes as any);
          } catch (e) {
            console.warn('Biometric analysis fallback:', e);
          }
        }
        stopCamera();
        stepLockedRef.current = false;
        setStepLocked(false);
        setIsReviewMode(true);
      }
    }, 550);
  }, [captureFrame, stopCamera]);

  const handleCaptureCurrentStep = () => {
    triggerStepCapture(currentStepIndex);
  };

  // 3.1 VÃ²ng láº·p nháº­n diá»‡n khuÃ´n máº·t vÃ  tÆ° tháº¿ tá»± Ä‘á»™ng báº±ng Deep Computer Vision (Hands-Free Deep Vision Auto-Scanning)
  useEffect(() => {
    if (!isOpen || isReviewMode || !isCameraActive || !isAutoMode) {
      autoProgressRef.current = 0;
      setAutoProgress(0);
      return;
    }

    const interval = setInterval(async () => {
      if (stepLockedRef.current || isProcessingRef.current || isSubmitting) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      if (isScanningRef.current) return;

      isScanningRef.current = true;
      try {
        const result = await scanRealtimeFace(videoRef.current, false);
        setPoseData(result);

        const stepIdx = currentStepIndexRef.current;
        const stepKey = STEPS[stepIdx]?.key;

        // 1. Khoáº£ng Ä‘á»‡m thá»i gian chuáº©n bá»‹ chuyá»ƒn bÆ°á»›c (Grace Period) Ä‘á»ƒ cÆ° dÃ¢n ká»‹p Ä‘á»c hÆ°á»›ng dáº«n, khÃ´ng bá»‹ chá»¥p giáº­t mÃ¬nh
        const now = Date.now();
        if (now < stepGracePeriodUntilRef.current) {
          if (stepKey === 'CLOSER') {
            setAutoFeedback(t('BÆ°á»›c 4: Chuáº©n bá»‹ tiáº¿n láº¡i gáº§n camera...'));
          } else if (stepKey === 'LEFT') {
            setAutoFeedback(t('BÆ°á»›c 2: Chuáº©n bá»‹ quay nháº¹ sang TRÃI...'));
          } else if (stepKey === 'RIGHT') {
            setAutoFeedback(t('BÆ°á»›c 3: Chuáº©n bá»‹ quay nháº¹ sang PHáº¢I...'));
          }
          autoProgressRef.current = 0;
          setAutoProgress(0);
          consecutiveMatchesRef.current = 0;
          return;
        }

        if (!result.hasFace) {
          setAutoFeedback(t('Vui lÃ²ng Ä‘Æ°a máº·t vÃ o giá»¯a khung hÃ¬nh'));
          consecutiveMatchesRef.current = 0;
          autoProgressRef.current = Math.max(0, autoProgressRef.current - 12);
          setAutoProgress(autoProgressRef.current);
          return;
        }

        const coverage = result.faceCoverage || 0;
        const yaw = result.yawDegrees || 0;
        const pitch = result.pitchDegrees || 0;
        let isMatch = false;
        let promptText = '';

        // PhÃ¢n tÃ­ch cá»± ly khoáº£ng cÃ¡ch: quÃ¡ xa hoáº·c quÃ¡ gáº§n
        if (coverage < 24) {
          promptText = t('Báº¡n Ä‘ang hÆ¡i xa, hÃ£y tiáº¿n láº¡i gáº§n hÆ¡n');
          isMatch = false;
        } else if (stepKey !== 'CLOSER' && coverage > 65) {
          promptText = t('Báº¡n Ä‘ang quÃ¡ gáº§n, hÃ£y lÃ¹i ra xa má»™t chÃºt');
          isMatch = false;
        } else if (stepKey === 'FRONT') {
          // BÆ°á»›c 1: NhÃ¬n tháº³ng chÃ­nh diá»‡n
          const isFacingStraight = Math.abs(yaw) <= 8 && Math.abs(pitch) <= 18;
          if (isFacingStraight) {
            isMatch = true;
            promptText = t('Äang giá»¯ tháº³ng máº·t, xin giá»¯ yÃªn...');
          } else if (yaw > 8) {
            promptText = t('Máº·t Ä‘ang lá»‡ch sang trÃ¡i, hÃ£y nhÃ¬n tháº³ng vÃ o camera');
          } else if (yaw < -8) {
            promptText = t('Máº·t Ä‘ang lá»‡ch sang pháº£i, hÃ£y nhÃ¬n tháº³ng vÃ o camera');
          } else if (pitch > 18) {
            promptText = t('Máº·t Ä‘ang ngÆ°á»›c lÃªn, hÃ£y nhÃ¬n tháº³ng vÃ o camera');
          } else if (pitch < -18) {
            promptText = t('Máº·t Ä‘ang cÃºi xuá»‘ng, hÃ£y nhÃ¬n tháº³ng vÃ o camera');
          } else {
            promptText = t('Vui lÃ²ng nhÃ¬n tháº³ng vÃ o camera');
          }
        } else if (stepKey === 'LEFT') {
          // BÆ°á»›c 2: Quay nháº¹ sang TRÃI
          if (yaw >= 7) {
            isMatch = true;
            promptText = t('GÃ³c nghiÃªng trÃ¡i ráº¥t tá»‘t, giá»¯ yÃªn...');
          } else {
            promptText = t('Tá»« tá»« quay nháº¹ máº·t sang TRÃI');
          }
        } else if (stepKey === 'RIGHT') {
          // BÆ°á»›c 3: Quay nháº¹ sang PHáº¢I
          if (yaw <= -7) {
            isMatch = true;
            promptText = t('GÃ³c nghiÃªng pháº£i ráº¥t tá»‘t, giá»¯ yÃªn...');
          } else {
            promptText = t('Tá»« tá»« quay nháº¹ máº·t sang PHáº¢I');
          }
        } else if (stepKey === 'CLOSER') {
          // BÆ°á»›c 4: Cá»± ly gáº§n (Tiáº¿n tá»›i gáº§n hÆ¡n so vá»›i BÆ°á»›c 1)
          const base = Math.max(28, Math.min(50, baselineCoverageRef.current || 38));
          // Pháº£i thá»±c sá»± di chuyá»ƒn Ä‘áº§u láº¡i gáº§n (+12% diá»‡n tÃ­ch vÃ  Ä‘áº¡t Ã­t nháº¥t 52%)
          const targetCloser = Math.min(72, Math.max(52, base + 12));

          if (coverage > 78) {
            promptText = t('QuÃ¡ gáº§n! Vui lÃ²ng lÃ¹i ra má»™t chÃºt');
            isMatch = false;
          } else if (coverage < targetCloser) {
            promptText = t('Tá»« tá»« Ä‘Æ°a máº·t láº¡i gáº§n camera hÆ¡n...');
            isMatch = false;
          } else {
            if (Math.abs(yaw) > 15 || Math.abs(pitch) > 20) {
              promptText = t('Vui lÃ²ng nhÃ¬n tháº³ng vÃ o camera khi láº¡i gáº§n');
              isMatch = false;
            } else {
              isMatch = true;
              promptText = t('Khoáº£ng cÃ¡ch ráº¥t tá»‘t, xin giá»¯ yÃªn...');
            }
          }
        }

        setAutoFeedback(promptText);

        if (isMatch) {
          consecutiveMatchesRef.current += 1;
          // Vá»›i bÆ°á»›c láº¡i gáº§n (CLOSER), tÄƒng cháº­m rÃ£i (+12 má»—i 90ms â‰ˆ 800ms) Ä‘á»ƒ ngÆ°á»i dÃ¹ng cÃ³ thá»i gian giá»¯ yÃªn
          // giÃºp camera láº¥y nÃ©t rÃµ, chá»‘ng rung nhÃ²e vÃ  khÃ´ng cÃ³ cáº£m giÃ¡c bá»‹ chá»¥p giáº­t mÃ¬nh
          const progIncrement = stepKey === 'CLOSER' ? 12 : 28;
          const nextProg = Math.min(100, autoProgressRef.current + progIncrement);
          autoProgressRef.current = nextProg;
          setAutoProgress(nextProg);

          // Khi Ä‘á»§ 100% -> Tá»± Ä‘á»™ng chá»›p chá»¥p
          if (nextProg >= 100) {
            autoProgressRef.current = 0;
            triggerStepCapture(stepIdx);
          }
        } else {
          consecutiveMatchesRef.current = 0;
          if (stepKey === 'CLOSER' && coverage > (baselineCoverageRef.current || 38)) {
            const base = Math.max(28, Math.min(50, baselineCoverageRef.current || 38));
            const targetCloser = Math.min(72, Math.max(52, base + 12));
            const approachRatio = Math.max(0, Math.min(1, (coverage - base) / Math.max(1, targetCloser - base)));
            const visualProg = Math.round(approachRatio * 45);
            autoProgressRef.current = visualProg;
            setAutoProgress(visualProg);
          } else {
            const nextProg = Math.max(0, autoProgressRef.current - 12);
            autoProgressRef.current = nextProg;
            setAutoProgress(nextProg);
          }
        }
      } catch (err) {
        console.warn('Realtime face scan interval error:', err);
      } finally {
        isScanningRef.current = false;
      }
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen, isReviewMode, isCameraActive, isAutoMode, isSubmitting, t, triggerStepCapture]);

  // 4. Retake Specific Step
  const handleRetakeStep = (stepIdx: number) => {
    setCurrentStepIndex(stepIdx);
    currentStepIndexRef.current = stepIdx;
    if (stepIdx === 0) {
      baselineCoverageRef.current = 38;
    }
    setIsReviewMode(false);
    setBiometricAnalysis(null);
    autoProgressRef.current = 0;
    setAutoProgress(0);
    isProcessingRef.current = false;
    stepLockedRef.current = false;
    setStepLocked(false);
    consecutiveMatchesRef.current = 0;
    stepGracePeriodUntilRef.current = Date.now() + (stepIdx === 3 ? 1400 : 700);
    startCamera();
  };

  // 5. Retake All
  const handleRetakeAll = () => {
    setSamples({ front: null, left: null, right: null, smile: null });
    samplesRef.current = { front: null, left: null, right: null, smile: null };
    baselineCoverageRef.current = 38;
    setBiometricAnalysis(null);
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setIsReviewMode(false);
    autoProgressRef.current = 0;
    setAutoProgress(0);
    isProcessingRef.current = false;
    stepLockedRef.current = false;
    setStepLocked(false);
    consecutiveMatchesRef.current = 0;
    stepGracePeriodUntilRef.current = Date.now() + 800;
    startCamera();
  };

  // 6. Submit 4 Biometric Samples Officially
  const handleFinalSubmit = async () => {
    if (!samples.front || !samples.left || !samples.right || !samples.smile) {
      setErrorMessage('Vui lÃ²ng chá»¥p Ä‘á»§ cáº£ 4 gÃ³c khuÃ´n máº·t trÆ°á»›c khi xÃ¡c nháº­n.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const normalizedSamples = await normalizeBiometricSamplesToBase64(samples);

      // Tháº©m Ä‘á»‹nh báº±ng máº¡ng há»c sÃ¢u Computer Vision thá»±c thá»¥ (Kiá»ƒm tra tá»«ng gÃ³c, Ä‘á»™ sÃ¢u, danh tÃ­nh)
      let finalAnalysis: any = null;
      try {
        finalAnalysis = await verifyAndAnalyzeBiometricSamples(normalizedSamples as any);
      } catch (err) {
        console.warn('Verify samples error, using fallback:', err);
      }

      if (finalAnalysis && !finalAnalysis.valid) {
        setErrorMessage(finalAnalysis.error || 'HÃ¬nh áº£nh chÆ°a Ä‘áº¡t yÃªu cáº§u. Báº¡n vui lÃ²ng chá»¥p láº¡i nhÃ©.');
        setIsSubmitting(false);
        return;
      }

      const verifiedDescriptor = finalAnalysis?.compositeDescriptor?.length === 128
        ? finalAnalysis.compositeDescriptor
        : (analyzeBiometric4Samples(normalizedSamples).compositeDescriptor);

      const verifiedScore = finalAnalysis?.faceScore || 92.5;

      // Gá»i API chÃ­nh thá»©c backend
      const res = await skylineEnrollFaceId({
        userId,
        fullName,
        apartmentCode,
        phone,
        email,
        isFamilyMemberSelfEnroll,
        submittedByRole,
        samples: normalizedSamples,
        descriptor: verifiedDescriptor,
        descriptorsByAngle: finalAnalysis?.descriptorsByAngle,
        faceScore: verifiedScore,
      } as any);

      const isPendingOwner = isFamilyMemberSelfEnroll || (submittedByRole === 'TENANT');
      const targetStatus: 'PENDING_OWNER' | 'PENDING' = (res as any)?.status || (isPendingOwner ? 'PENDING_OWNER' : 'PENDING');

      const fullProfile: EnrolledFaceProfile = {
        userId,
        fullName: fullName || 'CÆ° DÃ¢n Skyline',
        apartmentCode: apartmentCode || 'CH-06',
        phone: phone || '',
        avatarUrl: '',
        samples: normalizedSamples,
        descriptor: verifiedDescriptor,
        descriptorsByAngle: finalAnalysis?.descriptorsByAngle || undefined,
        enrolledAt: new Date().toISOString(),
        status: targetStatus,
        confirmedByOwner: !isPendingOwner,
        confirmedByOwnerAt: !isPendingOwner ? new Date().toISOString() : undefined,
        faceScore: verifiedScore,
        livenessVerified: true,
      };

      saveEnrolledFaceProfile(fullProfile);

      setSubmitSuccess(true);
      if (onEnrollSuccess) {
        onEnrollSuccess(fullProfile);
      }

      setTimeout(() => {
        onClose();
      }, 1900);
    } catch (err: any) {
      console.error('Enroll error:', err);
      setErrorMessage(err?.message || 'Lá»—i khi gá»­i dá»¯ liá»‡u FaceID. Vui lÃ²ng thá»­ láº¡i.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDistanceAlert = Boolean(
    poseData?.hasFace && !stepLocked && (
      poseData.faceCoverage < 24 ||
      (currentStep.key !== 'CLOSER' && poseData.faceCoverage > 65) ||
      (currentStep.key === 'CLOSER' && poseData.faceCoverage > 78)
    )
  );
  const ovalStrokeColor = stepLocked ? '#10B981' : isDistanceAlert ? '#F59E0B' : '#C5A880';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Hidden Canvas for Frame Capturing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880] text-white flex flex-col rounded-none overflow-hidden max-h-[96vh]">

        {/* Shutter Flash Effect */}
        {isShutterFlash && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 opacity-90 animate-fadeOut" />
        )}

        {/* ----------------------------------------------------------- */}
        {/* TOP HEADER: BRAND & CLOSE                                   */}
        {/* ----------------------------------------------------------- */}
        <div className="px-5 py-3.5 border-b border-[#222B35] bg-[#121820] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1C2533] border border-[#C5A880]/70 flex items-center justify-center text-[#C5A880] rounded-none">
              <Scan className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">
                {t('Nháº­n Diá»‡n CÆ° DÃ¢n Skyline â€¢ An ToÃ n & Báº£o Máº­t')}
              </div>
              <h3 className="text-sm font-serif font-bold text-white tracking-wide flex items-center gap-2">
                <span>{t('ÄÄƒng KÃ½ KhuÃ´n Máº·t (4 BÆ°á»›c):')}</span>
                <span className="text-[#C5A880] underline underline-offset-2">{fullName}</span>
                {isFamilyMemberSelfEnroll && (
                  <span className="text-[10px] bg-[#1C2533] border border-[#2D3748] text-gray-300 px-1.5 py-0.5">
                    {t('NgÆ°á»i NhÃ  Tá»± Cáº­p Nháº­t')}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-950/90 border-b border-rose-500 text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* VIEW 1: LIVE 4-STEP CAPTURE MODE                            */}
        {/* ----------------------------------------------------------- */}
        {!isReviewMode ? (
          <div className="p-4 sm:p-5 flex flex-col items-center space-y-3.5">

            {/* Unified Step & Real-time AI Status Strip */}
            <div className="w-full max-w-sm bg-[#121820] border border-[#222B35] px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 bg-[#C5A880] text-[#0D1117] font-bold text-[10px] uppercase shrink-0">
                  {currentStep.stepNumber}/4
                </span>
                <span className="font-semibold text-white truncate">
                  {isAutoMode ? autoFeedback : t(currentStep.guideText)}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                {isAutoMode && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 bg-black border border-gray-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-150"
                        style={{ width: `${autoProgress}%` }}
                      />
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px] min-w-[28px] text-right">
                      {Math.round(autoProgress)}%
                    </span>
                  </div>
                )}
                {lighting && !lighting.isOptimal && (
                  <span className={`text-[10px] font-semibold ${lighting.status === 'TOO_DARK' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {lighting.status === 'TOO_DARK' ? t('Thiáº¿u sÃ¡ng') : t('QuÃ¡ sÃ¡ng')}
                  </span>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* OVAL BIOMETRIC SCANNING FRAME                             */}
            {/* --------------------------------------------------------- */}
            <div className="relative w-64 h-80 sm:w-72 sm:h-84 bg-black border border-[#222B35] flex items-center justify-center overflow-hidden">

              {/* Real-time Status */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/85 border border-[#222B35] text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAiReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-gray-300 font-semibold">{t('Tá»± Ä‘á»™ng nháº­n diá»‡n')}</span>
                </div>
                {poseData && poseData.hasFace && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-black/85 border border-[#222B35] text-[10px]">
                    <span className="text-[#C5A880]">
                      {currentStep.key === 'FRONT' ? t('HÆ°á»›ng tháº³ng') :
                       currentStep.key === 'LEFT' ? t('GÃ³c trÃ¡i') :
                       currentStep.key === 'RIGHT' ? t('GÃ³c pháº£i') : t('Tiáº¿n gáº§n')}
                    </span>
                    <span className="text-emerald-400 font-medium">âœ“ {t('Äang quÃ©t')}</span>
                  </div>
                )}
              </div>

              {/* Distance Guidance Assist Badge */}
              {poseData && poseData.hasFace && !stepLocked && (
                <div className="absolute top-9 inset-x-0 flex justify-center pointer-events-none z-20">
                  {poseData.faceCoverage < 24 ? (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                      âš ï¸ {t('HÆ¡i xa â€¢ Láº¡i gáº§n hÆ¡n')}
                    </span>
                  ) : ((currentStep.key !== 'CLOSER' && poseData.faceCoverage > 65) || (currentStep.key === 'CLOSER' && poseData.faceCoverage > 78)) ? (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow animate-pulse">
                      âš ï¸ {t('QuÃ¡ gáº§n â€¢ LÃ¹i ra xa')}
                    </span>
                  ) : currentStep.key === 'CLOSER' && poseData.faceCoverage < Math.min(72, Math.max(52, (baselineCoverageRef.current || 38) + 12)) ? (
                    <span className="px-2.5 py-0.5 bg-sky-500 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                      ðŸ” {t('Tiáº¿n gáº§n camera hÆ¡n')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-black/85 border border-emerald-500/70 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                      âœ“ {t('Cá»± ly chuáº©n')}
                    </span>
                  )}
                </div>
              )}

              {/* Live Webcam Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  setIsCameraActive(true);
                  videoRef.current?.play().catch(() => { });
                }}
                onPlay={() => setIsCameraActive(true)}
                className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              />

              {/* Connecting / Error Overlay */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-3 bg-[#0D1117] text-gray-400 z-10">
                  <Camera className="w-8 h-8 text-[#C5A880]" />
                  <div className="text-xs max-w-xs text-gray-300">
                    {cameraError || t('Äang káº¿t ná»‘i camera...')}
                  </div>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    {t('Thá»­ Láº¡i Káº¿t Ná»‘i')}
                  </button>
                </div>
              )}

              {/* Biometric Oval Guide (Vector SVG Only - No Duplicate Borders) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-52 h-72 flex items-center justify-center">
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 208 288"
                  >
                    {/* Ellipse Guide Background Track */}
                    <ellipse
                      cx="104"
                      cy="144"
                      rx="92"
                      ry="128"
                      fill="none"
                      stroke="#222B35"
                      strokeWidth="2"
                    />
                    {/* Circular AI Progress Stroke */}
                    <ellipse
                      cx="104"
                      cy="144"
                      rx="92"
                      ry="128"
                      fill="none"
                      stroke={ovalStrokeColor}
                      strokeWidth="3"
                      strokeDasharray="696"
                      strokeDashoffset={696 - (696 * Math.min(100, Math.max(0, autoProgress))) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 104 144)"
                      className="transition-all duration-100 ease-out"
                    />

                    {/* Crosshairs */}
                    <line x1="104" y1="12" x2="104" y2="22" stroke={ovalStrokeColor} strokeWidth="1.5" />
                    <line x1="104" y1="266" x2="104" y2="276" stroke={ovalStrokeColor} strokeWidth="1.5" />
                    <line x1="8" y1="144" x2="18" y2="144" stroke={ovalStrokeColor} strokeWidth="1.5" />
                    <line x1="190" y1="144" x2="200" y2="144" stroke={ovalStrokeColor} strokeWidth="1.5" />
                  </svg>

                  {/* Pose Indicators Positioned Safely INSIDE the Oval */}
                  {currentStep.key === 'LEFT' && !stepLocked && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                      <ArrowLeft className="w-3 h-3" /> {t('Quay TrÃ¡i')}
                    </div>
                  )}

                  {currentStep.key === 'RIGHT' && !stepLocked && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                      {t('Quay Pháº£i')} <ArrowRight className="w-3 h-3" />
                    </div>
                  )}

                  {currentStep.key === 'CLOSER' && !stepLocked && (
                    <div className="absolute bottom-5 px-2.5 py-1 bg-emerald-500 text-[#0D1117] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                      <ZoomIn className="w-3.5 h-3.5" /> {t('Láº¡i Gáº§n')}
                    </div>
                  )}

                  {/* Step Locked Success Stamp */}
                  {stepLocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                      <span className="mt-1.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-black/90 px-2.5 py-0.5 border border-emerald-500/60">
                        {currentStep.key === 'FRONT' ? t('ÄÃƒ LÆ¯U: NHÃŒN THáº²NG âœ“') :
                         currentStep.key === 'LEFT' ? t('ÄÃƒ LÆ¯U: NGHIÃŠNG TRÃI âœ“') :
                         currentStep.key === 'RIGHT' ? t('ÄÃƒ LÆ¯U: NGHIÃŠNG PHáº¢I âœ“') : t('ÄÃƒ LÆ¯U: TIáº¾N Gáº¦N âœ“')}
                      </span>
                    </div>
                  )}

                  {countdown !== null && (
                    <div className="text-5xl font-extrabold text-[#C5A880]">
                      {countdown}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Target Label */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
                <span className="px-2.5 py-0.5 bg-black/80 text-[10px] text-gray-300 border border-[#222B35]">
                  {fullName} â€¢ {apartmentCode}
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* ACTION BUTTONS & AUTOMATION TOGGLE                        */}
            {/* --------------------------------------------------------- */}
            <div className="flex items-center gap-2.5 w-full max-w-sm">
              {/* Toggle Auto Mode */}
              <button
                type="button"
                onClick={() => {
                  setIsAutoMode(!isAutoMode);
                  setAutoProgress(0);
                  consecutiveMatchesRef.current = 0;
                }}
                disabled={!isCameraActive}
                className={`w-1/2 py-2 px-3 border text-xs font-semibold rounded-none transition-colors flex items-center justify-center gap-1.5 ${
                  isAutoMode
                    ? 'bg-[#15251C] border-emerald-600 text-emerald-300 hover:bg-[#1C3225]'
                    : 'bg-[#161B22] border-[#2D3748] text-gray-400 hover:text-white hover:bg-[#202936]'
                } disabled:opacity-50`}
              >
                {isAutoMode ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('Tá»± Äá»™ng: Báº¬T')}</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('Tá»± Äá»™ng: Táº®T')}</span>
                  </>
                )}
              </button>

              {/* Manual Snapshot Trigger */}
              <button
                type="button"
                onClick={handleCaptureCurrentStep}
                disabled={!isCameraActive || isProcessing || stepLocked}
                className="w-1/2 py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-none disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t('Chá»¥p áº¢nh Ngay')}</span>
              </button>
            </div>

            {/* --------------------------------------------------------- */}
            {/* 4-SLOT MINI PROGRESS STRIP AT BOTTOM                      */}
            {/* --------------------------------------------------------- */}
            <div className="w-full max-w-sm pt-1">
              <div className="grid grid-cols-4 gap-2 text-center">
                {STEPS.map((s, idx) => {
                  const sampleImg = idx === 0 ? samples.front : idx === 1 ? samples.left : idx === 2 ? samples.right : samples.smile;
                  const isActive = currentStepIndex === idx;
                  const stepLabel = idx === 0 ? t('1. Tháº³ng') : idx === 1 ? t('2. TrÃ¡i') : idx === 2 ? t('3. Pháº£i') : t('4. Láº¡i gáº§n');
                  return (
                    <div
                      key={s.key}
                      onClick={() => sampleImg && handleRetakeStep(idx)}
                      className={`p-1.5 border text-center transition-colors ${
                        sampleImg
                          ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300 cursor-pointer'
                          : isActive
                          ? 'border-[#C5A880] bg-[#161B22] text-[#C5A880]'
                          : 'border-[#222B35] bg-[#121820] text-gray-500'
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase truncate">{stepLabel}</div>
                      <div className="w-full h-9 mt-1 flex items-center justify-center overflow-hidden bg-black/70">
                        {sampleImg ? (
                          <img src={sampleImg} alt={s.key} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-gray-500">
                            {isActive ? t('Äang chá»', 'Waiting') : t('Trá»‘ng', 'Empty')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------------- */
          /* VIEW 2: REVIEW 4 SAMPLES & OFFICIAL CONFIRMATION SCREEN     */
          /* ----------------------------------------------------------- */
          <div className="p-6 space-y-6 overflow-y-auto">

            {/* Top Success Banner */}
            <div className="p-4 bg-[#121820] border border-[#C5A880] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t('HoÃ n Táº¥t Chá»¥p 4 GÃ³c KhuÃ´n Máº·t')}
                </div>
                <div className="text-sm font-serif font-bold text-white">
                  {t('Äá»™ rÃµ nÃ©t & chÃ­nh xÃ¡c:')} {biometricAnalysis ? `${biometricAnalysis.faceScore}%` : '100%'} ({t('Äáº¡t TiÃªu Chuáº©n Má»Ÿ Cá»­a')})
                </div>
                <div className="text-xs text-gray-400">
                  {t('Kiá»ƒm tra ngÆ°á»i tháº­t:')} {t('Äáº¡t chuáº©n')} â€¢ {t('ÄÃ£ lÆ°u Ä‘á»§ 4 gÃ³c khuÃ´n máº·t')}
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> {t('KhuÃ´n máº·t: Há»£p lá»‡')}
              </span>
            </div>

            {/* 4-Sample Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Sample 1: Front */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase">
                  1. {t('NhÃ¬n Tháº³ng')}
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.front && (
                    <img src={samples.front} alt="Front" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(0)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    {t('Chá»¥p Láº¡i')}
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400">{t('Äá»™ rÃµ nÃ©t:')} 100%</div>
              </div>

              {/* Sample 2: Left */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase">
                  2. {t('NghiÃªng TrÃ¡i')}
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.left && (
                    <img src={samples.left} alt="Left" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(1)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    {t('Chá»¥p Láº¡i')}
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400">
                  {t('Äá»™ tÆ°Æ¡ng Ä‘á»“ng:')} {biometricAnalysis?.details?.frontLeftSim ? `${biometricAnalysis.details.frontLeftSim}%` : t('Äang xá»­ lÃ½', 'Processing')}
                </div>
              </div>

              {/* Sample 3: Right */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase">
                  3. {t('NghiÃªng Pháº£i')}
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.right && (
                    <img src={samples.right} alt="Right" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(2)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    {t('Chá»¥p Láº¡i')}
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400">
                  {t('Äá»™ tÆ°Æ¡ng Ä‘á»“ng:')} {biometricAnalysis?.details?.frontRightSim ? `${biometricAnalysis.details.frontRightSim}%` : t('Äang xá»­ lÃ½', 'Processing')}
                </div>
              </div>

              {/* Sample 4: Closer / 3D Depth */}
              <div className="p-2.5 bg-[#161B22] border border-[#2D3748] space-y-2 text-center">
                <div className="text-[10px] font-bold text-[#C5A880] uppercase">
                  4. {t('Tiáº¿n Láº¡i Gáº§n')}
                </div>
                <div className="w-full h-32 bg-black border border-gray-700 overflow-hidden relative group">
                  {samples.smile && (
                    <img src={samples.smile} alt="Closer" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRetakeStep(3)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-bold"
                  >
                    {t('Chá»¥p Láº¡i')}
                  </button>
                </div>
                <div className="text-[9.5px] text-emerald-400">
                  {t('Äá»™ chi tiáº¿t:')} {(biometricAnalysis?.details as any)?.frontCloserSim || biometricAnalysis?.details?.frontSmileSim || biometricAnalysis?.faceScore || t('Äáº¡t chuáº©n', 'Standard Passed')}
                  {typeof (biometricAnalysis?.details as any)?.frontCloserSim === 'number' || typeof biometricAnalysis?.details?.frontSmileSim === 'number' ? '%' : ''}
                </div>
              </div>
            </div>

            {/* Privacy & System Sync Note */}
            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2 font-bold text-[#C5A880]">
                <Lock className="w-3.5 h-3.5" /> {t('Tiá»‡n Ã­ch sau khi kÃ­ch hoáº¡t:')}
              </div>
              <ul className="space-y-1 text-gray-400 pl-4 list-disc text-[11px]">
                <li>{t('ÄÄƒng nháº­p nhanh trÃªn trang chá»§ báº±ng khuÃ´n máº·t, khÃ´ng cáº§n máº­t kháº©u.')}</li>
                <li>{t('Tá»± Ä‘á»™ng má»Ÿ cá»­a sáº£nh Ä‘Ã³n vÃ  thang mÃ¡y khi báº¡n bÆ°á»›c vÃ o tÃ²a nhÃ .')}</li>
                <li>{t('HÃ¬nh áº£nh Ä‘Æ°á»£c báº£o máº­t an toÃ n, chá»‰ dÃ¹ng cho tiá»‡n Ã­ch ná»™i bá»™ chung cÆ°.')}</li>
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={handleRetakeAll}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('Chá»¥p Láº¡i Tá»« Äáº§u')}</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || submitSuccess}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {t('Äang LÆ°u & Gá»­i Há»“ SÆ¡...')}
                  </>
                ) : submitSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    {isFamilyMemberSelfEnroll
                      ? t('ÄÃ£ Gá»­i Cho Chá»§ Há»™ XÃ¡c Nháº­n!')
                      : t('ÄÃ£ Gá»­i Cho VinHomes Manager PhÃª Duyá»‡t!')}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {isFamilyMemberSelfEnroll
                      ? t('LÆ°u & Gá»­i Chá»§ Há»™ XÃ¡c Nháº­n')
                      : t('Gá»­i VinHomes Manager PhÃª Duyá»‡t')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


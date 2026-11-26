'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Lock,
  Mail,
  Smartphone,
  ScanFace,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  Timer,
  ArrowRight,
  Upload,
  ShieldCheck,
  UserCheck,
  Video,
  VideoOff,
  Laptop,
  Image as ImageIcon,
  Sun,
  Moon,
  SunMedium,
  Check,
  Zap,
  Info
} from 'lucide-react';
import SkylineLogo from '@/components/shared/SkylineLogo';
import { useAuth } from '@/lib/authContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useLanguage } from '@/lib/languageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { analyzeVideoLighting, LightingAnalysisResult, extractDescriptorFromPixels } from '@/lib/biometricFaceEngine';
import { extractNeuralDescriptorFromBase64 } from '@/lib/realtimeFaceVision';
import { cleanPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccount?: string;
}

type AuthMethod = 'CREDENTIALS' | 'PHONE_OTP' | 'FACE_ID';

export default function LoginModal({ isOpen, onClose, defaultAccount = '' }: LoginModalProps) {
  useEscapeKey(isOpen, onClose);
  const router = useRouter();
  const { login, faceLogin } = useAuth();
  const { t, language, isEn } = useLanguage();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('CREDENTIALS');

  // 1. Unified Credentials state (Email / Username / Password)
  const [account, setAccount] = useState(defaultAccount);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2. Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);

  // 3. FaceID & Webcam Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isConnectingCamera, setIsConnectingCamera] = useState(false);
  const [isShutterFlash, setIsShutterFlash] = useState(false);
  const [uploadedFaceImage, setUploadedFaceImage] = useState<string | null>(null);
  const [matchedFaceResult, setMatchedFaceResult] = useState<{ name: string; apt: string; score: number; bestAngle?: string } | null>(null);
  const [faceScanStatus, setFaceScanStatus] = useState<'IDLE' | 'SCANNING' | 'LIVENESS' | 'MATCHING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [scanStepText, setScanStepText] = useState<string>('');
  const [lighting, setLighting] = useState<LightingAnalysisResult | null>(null);

  // 3.1 Device & Input Mode State (Laptop vs Mobile & Camera vs Upload)
  const [deviceType, setDeviceType] = useState<'LAPTOP' | 'MOBILE'>('LAPTOP');
  const [faceInputMode, setFaceInputMode] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect device type (Laptop/Desktop vs Mobile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setDeviceType(isMob ? 'MOBILE' : 'LAPTOP');
    }
  }, []);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  // Helper: Redirect based on role
  const handleRoleRedirect = (loggedUser: any) => {
    const role = loggedUser.role;
    const name = loggedUser.full_name || loggedUser.fullname || loggedUser.name || '';
    const rawApt = loggedUser.apartment_code || '';
    const cleanApt = rawApt;
    const apt = cleanApt ? `${t('CÄƒn')} ${cleanApt}` : '';
    let roleNotice = t('ÄÄƒng nháº­p thÃ nh cÃ´ng!');
    let redirectTab = 'resident-home';

    if (role === 'ADMIN') {
      roleNotice = `${t('ChÃ o má»«ng Quáº£n trá»‹ viÃªn')}: VinHomes Manager`;
      redirectTab = 'admin-dashboard';
    } else if (role === 'TECHNICIAN') {
      roleNotice = `${t('ChÃ o má»«ng Ká»¹ thuáº­t viÃªn')}: ${name}`;
      redirectTab = 'admin-kanban';
    } else if (role === 'OWNER') {
      roleNotice = `${t('ChÃ o má»«ng Chá»§ há»™')} ${apt ? `${apt}: ` : ''}${name}`;
      redirectTab = 'resident-home';
    } else {
      roleNotice = `${t('ChÃ o má»«ng CÆ° dÃ¢n')} ${apt ? `${apt}: ` : ''}${name}`;
      redirectTab = 'resident-home';
    }

    setSuccessMessage(roleNotice);

    setTimeout(() => {
      onClose();
      router.push(`/portal?tab=${redirectTab}`);
    }, 600);
  };

  // 1. Handle Credentials Login (Email / Username + Password)
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim()) {
      setErrorMessage('Vui lÃ²ng nháº­p Email hoáº·c TÃªn tÃ i khoáº£n.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lÃ²ng nháº­p máº­t kháº©u tÃ i khoáº£n.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const loggedUser = await login(account.trim(), password);
      if (loggedUser) {
        handleRoleRedirect(loggedUser);
      } else {
        setErrorMessage('TÃ i khoáº£n hoáº·c máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c. Vui lÃ²ng kiá»ƒm tra láº¡i.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lá»—i káº¿t ná»‘i mÃ¡y chá»§ xÃ¡c thá»±c.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Send Phone OTP
  const handleSendOtp = async () => {
    const cleanPhone = cleanPhoneNumber(phone);
    const phoneErr = getPhoneValidationError(cleanPhone);
    if (phoneErr) {
      setErrorMessage(phoneErr);
      return;
    }
    setErrorMessage(null);

    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const e164 = cleanPhone.startsWith('+') ? cleanPhone : `+84${cleanPhone.replace(/^0/, '')}`;
      const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({ phone: e164 });
      if (error) {
        setErrorMessage(`KhÃ´ng thá»ƒ gá»­i OTP qua Supabase Auth: ${error.message}`);
        return;
      }
      setGeneratedOtp('');
      setIsOtpSent(true);
      setCountdown(60);
      setIsCounting(true);
      setOtpCode('');
      return;
    }

    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    const randomCode = String(100000 + (buf[0] % 900000));
    setGeneratedOtp(randomCode);
    setIsOtpSent(true);
    setCountdown(60);
    setIsCounting(true);
    setOtpCode('');
  };

  // 2b. Handle Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setErrorMessage('Vui lÃ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Vui lÃ²ng nháº­p Ä‘á»§ 6 chá»¯ sá»‘ mÃ£ OTP.');
      return;
    }

    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const e164 = cleanPhone.startsWith('+') ? cleanPhone : `+84${cleanPhone.replace(/^0/, '')}`;
      const { error } = await createSupabaseBrowserClient().auth.verifyOtp({
        phone: e164,
        token: otpCode.trim(),
        type: 'sms',
      });
      if (error) {
        setErrorMessage(`XÃ¡c thá»±c OTP tháº¥t báº¡i: ${error.message}`);
        return;
      }
    } else if (!generatedOtp || otpCode.trim() !== generatedOtp) {
      setErrorMessage('MÃ£ OTP khÃ´ng chÃ­nh xÃ¡c. Vui lÃ²ng kiá»ƒm tra láº¡i!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const loggedUser = await login(cleanPhone, undefined, true);
      if (loggedUser) {
        handleRoleRedirect(loggedUser);
      } else {
        setErrorMessage('Sá»‘ Ä‘iá»‡n thoáº¡i chÆ°a tá»“n táº¡i trong cÆ¡ sá»Ÿ dá»¯ liá»‡u cÆ° dÃ¢n tÃ²a nhÃ .');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lá»—i xÃ¡c thá»±c OTP tá»« mÃ¡y chá»§.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // CAMERA LIFECYCLE MANAGEMENT (ELIMINATES BLACK SCREEN BUG)
  // =========================================================================

  // Callback ref: As soon as the <video> DOM node attaches, bind active stream immediately
  const setVideoElementRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      if (element.srcObject !== streamRef.current) {
        element.srcObject = streamRef.current;
      }
      element.play().then(() => {
        setIsCameraActive(true);
      }).catch(() => { });
    }
  }, []);

  // Initialize Camera Stream with high-res ideal and robust fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsConnectingCamera(true);

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraError('TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£ truy cáº­p Camera trá»±c tiáº¿p.');
      setIsConnectingCamera(false);
      return;
    }

    try {
      // Clear any prior stream tracks to prevent hardware camera lock
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('High-res camera constraints failed, falling back to basic camera:', firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      setCameraStream(stream);

      // Attach immediately to videoRef if element is already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setIsCameraActive(true);
        } catch (playErr) {
          console.warn('Video auto-play delayed until user interaction:', playErr);
          setIsCameraActive(true);
        }
      } else {
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera start failed:', err);
      setIsCameraActive(false);
      setCameraStream(null);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Quyá»n truy cáº­p Camera bá»‹ tá»« chá»‘i trÃªn trÃ¬nh duyá»‡t. Báº¡n cÃ³ thá»ƒ báº¥m vÃ o á»• khÃ³a cáº¡nh URL Ä‘á»ƒ Cáº¥p quyá»n Camera (Allow) vÃ  báº¥m "Thá»­ Láº¡i Camera".');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('KhÃ´ng tÃ¬m tháº¥y thiáº¿t bá»‹ webcam trÃªn mÃ¡y tÃ­nh cá»§a báº¡n.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Camera Ä‘ang bá»‹ á»©ng dá»¥ng khÃ¡c (Zoom, Teams, Meet...) chiáº¿m dá»¥ng. Vui lÃ²ng táº¯t cÃ¡c á»©ng dá»¥ng Ä‘Ã³ rá»“i báº¥m "Thá»­ Láº¡i Camera".');
      } else {
        setCameraError('KhÃ´ng thá»ƒ káº¿t ná»‘i Camera pháº§n cá»©ng trÃªn thiáº¿t bá»‹. Báº¡n cÃ³ thá»ƒ chuyá»ƒn sang "Táº£i áº¢nh ChÃ¢n Dung" Ä‘á»ƒ xÃ¡c thá»±c.');
      }
    } finally {
      setIsConnectingCamera(false);
    }
  }, [deviceType]);

  // Gracefully stop all tracks and reset references
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraActive(false);
    setIsConnectingCamera(false);
    setLighting(null);
  }, []);

  // Synchronize cameraStream state with videoRef whenever stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().then(() => {
        setIsCameraActive(true);
      }).catch((e) => {
        console.warn('Video play error in stream effect:', e);
      });
    }
  }, [cameraStream]);

  // Manage camera lifecycle strictly according to modal state & active tab
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authMethod === 'FACE_ID' && isOpen && faceInputMode === 'CAMERA') {
      // Small timeout to allow modal animation to mount DOM elements smoothly
      timer = setTimeout(() => {
        startCamera();
      }, 60);
    } else {
      stopCamera();
    }
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [authMethod, isOpen, faceInputMode, startCamera, stopCamera]);

  // Browser tab visibility change listener (fixes black camera when switching browser tabs)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && authMethod === 'FACE_ID' && isOpen && faceInputMode === 'CAMERA') {
        if (videoRef.current && streamRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => { });
          }
        } else {
          startCamera();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [authMethod, isOpen, faceInputMode, startCamera]);

  // Real-time environmental lighting analysis (cycle: 380ms)
  useEffect(() => {
    if (authMethod !== 'FACE_ID' || !isOpen || faceInputMode !== 'CAMERA' || !isCameraActive) {
      setLighting(null);
      return;
    }

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        try {
          const result = analyzeVideoLighting(videoRef.current);
          setLighting(result);
        } catch (e) {
          console.warn('Lighting analysis error:', e);
        }
      }
    }, 380);

    return () => clearInterval(interval);
  }, [authMethod, isOpen, faceInputMode, isCameraActive]);

  // Handle uploaded face image file
  const handleFacePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lÃ²ng chá»n tá»‡p hÃ¬nh áº£nh há»£p lá»‡ (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedFaceImage(base64);
      setFaceInputMode('UPLOAD');
      stopCamera();
      setFaceScanStatus('IDLE');
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // 3. Main FaceID Biometric Scan & Recognition Execution
  const handleStartFaceScan = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const isUsingCamera = faceInputMode === 'CAMERA';

    // Environmental lighting check for live camera
    if (isUsingCamera && isCameraActive && lighting) {
      if (lighting.status === 'TOO_DARK' && lighting.luminance < 35) {
        setFaceScanStatus('FAILED');
        setErrorMessage('MÃ´i trÆ°á»ng Ä‘ang quÃ¡ tá»‘i Ä‘á»ƒ nháº­n diá»‡n. Vui lÃ²ng báº­t Ä‘Ã¨n hoáº·c di chuyá»ƒn Ä‘áº¿n nÆ¡i cÃ³ Ã¡nh sÃ¡ng tá»‘t hÆ¡n.');
        return;
      }
      if (lighting.status === 'TOO_BRIGHT' && lighting.luminance > 235) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Camera Ä‘ang bá»‹ chÃ³i sÃ¡ng hoáº·c ngÆ°á»£c sÃ¡ng máº¡nh. Vui lÃ²ng trÃ¡nh nguá»“n sÃ¡ng rá»i tháº³ng vÃ o á»‘ng kÃ­nh.');
        return;
      }
    }

    let capturedImage = uploadedFaceImage || null;
    let extractedFaceVector: number[] | null = null;

    if (isUsingCamera) {
      if (!isCameraActive || !videoRef.current || videoRef.current.readyState < 2) {
        setFaceScanStatus('FAILED');
        setErrorMessage('Camera Ä‘ang chuáº©n bá»‹ khung hÃ¬nh. Vui lÃ²ng Ä‘á»£i trong giÃ¢y lÃ¡t hoáº·c báº¥m "Báº­t láº¡i Camera".');
        return;
      }

      // Shutter visual flash
      setIsShutterFlash(true);
      setTimeout(() => setIsShutterFlash(false), 200);

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth > 0 ? video.videoWidth : 640;
        canvas.height = video.videoHeight > 0 ? video.videoHeight : 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          capturedImage = canvas.toDataURL('image/jpeg', 0.92);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          extractedFaceVector = Array.from(extractDescriptorFromPixels(imgData.data, canvas.width, canvas.height));
        }
      } catch (e) {
        console.warn('Canvas frame capture error:', e);
      }
    } else if (capturedImage) {
      try {
        const img = new Image();
        img.src = capturedImage;
        await new Promise((res) => {
          if (img.complete) res(true);
          img.onload = () => res(true);
          img.onerror = () => res(false);
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 640;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          extractedFaceVector = Array.from(extractDescriptorFromPixels(imgData.data, canvas.width, canvas.height));
        }
      } catch (e) {
        console.warn('Upload image vector extract error:', e);
      }
    }

    if (!capturedImage) {
      setFaceScanStatus('FAILED');
      setErrorMessage(
        faceInputMode === 'CAMERA'
          ? 'KhÃ´ng thá»ƒ ghi nháº­n hÃ¬nh áº£nh tá»« Camera. Vui lÃ²ng thá»­ láº¡i hoáº·c chá»n "Táº£i áº¢nh".'
          : 'Vui lÃ²ng chá»n áº£nh chÃ¢n dung Ä‘á»ƒ quÃ©t.'
      );
      return;
    }

    setFaceScanStatus('SCANNING');
    setScanStepText('Äang kiá»ƒm tra nháº­n diá»‡n khuÃ´n máº·t...');

    // Æ¯u tiÃªn trÃ­ch xuáº¥t vector Ä‘áº·c trÆ°ng ResNet 128-D thá»±c táº¿
    try {
      const neuralDesc = await extractNeuralDescriptorFromBase64(capturedImage);
      if (neuralDesc && neuralDesc.length === 128) {
        extractedFaceVector = Array.from(neuralDesc);
      }
    } catch (e) {
      // Fallback sang vector pixel Ä‘Ã£ trÃ­ch xuáº¥t
    }

    try {
      const result = await faceLogin({
        faceImage: capturedImage || undefined,
        faceVector: extractedFaceVector || undefined,
        isCameraCapture: isUsingCamera,
      });

      if (result.success && result.user) {
        setFaceScanStatus('SUCCESS');
        setScanStepText('Nháº­n diá»‡n khuÃ´n máº·t thÃ nh cÃ´ng!');
        const cleanApt = result.user.apartment_code || '';
        setMatchedFaceResult({
          name: result.user.full_name || (result.user as any).fullname || (result.user as any).name || '',
          apt: cleanApt,
          score: result.matchScore || 0,
          bestAngle: (result as any).bestAngle || '',
        });

        setTimeout(() => {
          stopCamera();
          handleRoleRedirect(result.user);
        }, 500);
      } else {
        setFaceScanStatus('FAILED');
        setScanStepText('');
        setErrorMessage(result.message || 'KhÃ´ng nháº­n diá»‡n Ä‘Æ°á»£c khuÃ´n máº·t.');
      }
    } catch (err: any) {
      setFaceScanStatus('FAILED');
      setScanStepText('');
      setErrorMessage(err?.message || 'Lá»—i xÃ¡c thá»±c khuÃ´n máº·t.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div key={language} className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880]/80 p-5 sm:p-7 shadow-2xl text-white space-y-4 select-none rounded-none max-h-[92vh] overflow-y-auto">

        {/* Language Switcher */}
        <div className="absolute top-4 left-4 z-10">
          <LanguageSwitcher variant="inline" />
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161B22] transition-colors"
          title={isEn ? 'Close window' : 'ÄÃ³ng cá»­a sá»•'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Brand */}
        <div className="text-center space-y-1 border-b border-[#222B35] pb-3">
          <SkylineLogo variant="stacked" size="md" theme="dark" className="mx-auto" />
          <h3 className="font-serif text-lg text-white font-bold tracking-wide">
            {t('Cá»•ng SKYLINE Smart Residence')}
          </h3>
          <p className="text-[11px] text-gray-400 font-light">
            {t('Cá»•ng Ä‘Äƒng nháº­p há»‡ thá»‘ng dÃ nh cho CÆ° DÃ¢n & VinHomes Manager')}
          </p>
        </div>

        {/* 3-Tab Selector: Email / Password | SÄT OTP | FaceID AI */}
        <div className="grid grid-cols-3 gap-1 bg-[#121820] p-1 border border-[#222B35] rounded-none text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('CREDENTIALS');
              setErrorMessage(null);
              setSuccessMessage(null);
              stopCamera();
            }}
            className={`py-2 px-1 text-center font-medium transition-all rounded-none flex flex-col items-center justify-center gap-1 min-w-0 ${authMethod === 'CREDENTIALS'
              ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
              : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
              }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] leading-tight text-center break-words min-w-0">{t('Email / Máº­t Kháº©u')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('PHONE_OTP');
              setErrorMessage(null);
              setSuccessMessage(null);
              stopCamera();
            }}
            className={`py-2 px-1 text-center font-medium transition-all rounded-none flex flex-col items-center justify-center gap-1 min-w-0 ${authMethod === 'PHONE_OTP'
              ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
              : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
              }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] leading-tight text-center break-words min-w-0">{t('SÄT & MÃ£ OTP')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('FACE_ID');
              setErrorMessage(null);
              setSuccessMessage(null);
              setFaceScanStatus('IDLE');
              setFaceInputMode('CAMERA');
            }}
            className={`py-2 px-1 text-center font-medium transition-all rounded-none flex flex-col items-center justify-center gap-1 relative min-w-0 ${authMethod === 'FACE_ID'
              ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
              : 'text-gray-400 hover:text-white hover:bg-[#1A2330]'
              }`}
          >
            <ScanFace className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] leading-tight text-center break-words min-w-0">{t('FaceID AI')}</span>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center justify-between gap-2 rounded-none animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            {authMethod === 'FACE_ID' && faceScanStatus === 'FAILED' && (
              <button
                type="button"
                onClick={() => {
                  setFaceScanStatus('IDLE');
                  setErrorMessage(null);
                  if (faceInputMode === 'CAMERA' && !isCameraActive) {
                    startCamera();
                  }
                }}
                className="px-2 py-0.5 bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-[10px] uppercase font-bold border border-rose-400/40 rounded-none whitespace-nowrap"
              >
                Thá»­ láº¡i
              </button>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded-none animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: EMAIL / TÃ€I KHOáº¢N & Máº¬T KHáº¨U                           */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Email / TÃ i Khoáº£n:')}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{t('CÆ° dÃ¢n & Quáº£n lÃ½')}</span>
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={t('Nháº­p email tÃ i khoáº£n (VD: huuluc04@gmail.com)...')}
                className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-none focus:outline-none focus:border-[#C5A880] transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-[11px] flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Máº­t Kháº©u:')}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{t('Báº£o máº­t há»‡ thá»‘ng')}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Nháº­p máº­t kháº©u...')}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pr-10 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !account.trim() || !password}
              className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-none shadow-lg ${account.trim() && password && !isSubmitting
                ? 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> {t('Äang XÃ¡c Thá»±c TÃ i Khoáº£n...')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> {t('ÄÄƒng Nháº­p Há»‡ Thá»‘ng')}
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: Sá» ÄIá»†N THOáº I & MÃƒ OTP                                 */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'PHONE_OTP' && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-gray-300 flex items-center justify-between text-[11px] font-medium">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Sá»‘ Äiá»‡n Thoáº¡i CÆ° DÃ¢n:')}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{t('ÄÃ£ Ä‘Äƒng kÃ½')}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneNumber(e.target.value))}
                  placeholder={t('Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i 10 sá»‘ (VD: 0901234567)')}
                  className="flex-1 bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isCounting}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 whitespace-nowrap ${isCounting
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : 'bg-[#C5A880] text-[#0D1117] hover:bg-white font-bold shadow'
                    }`}
                >
                  {isCounting ? (
                    <>
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      {countdown}s
                    </>
                  ) : (
                    t('Gá»­i MÃ£ OTP')
                  )}
                </button>
              </div>
            </div>

            {/* OTP Message Simulation (chá»‰ báº­t khi NEXT_PUBLIC_DEMO_MODE=true) */}
            {isOtpSent && process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && generatedOtp && (
              <div className="p-3 bg-[#121E2A] border border-[#C5A880]/70 rounded-none text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[#C5A880] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> {t('MÃ£ OTP gá»­i tá»›i')} {phone}:
                  </span>
                  <span className="font-mono bg-[#C5A880] text-[#0D1117] px-2 py-0.5 text-xs font-bold rounded-none">
                    {generatedOtp}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {t('MÃ£ OTP cÃ³ hiá»‡u lá»±c trong 60 giÃ¢y.')}
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedOtp)}
                  className="text-[10px] text-[#C5A880] underline hover:text-white font-semibold"
                >
                  {t('Báº¥m Ä‘á»ƒ tá»± Ä‘á»™ng Ä‘iá»n mÃ£')}: {generatedOtp}
                </button>
              </div>
            )}

            {/* Submit OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-300 text-[11px] flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Nháº­p mÃ£ OTP 6 chá»¯ sá»‘:')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="------"
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-center text-lg font-mono tracking-[0.35em] text-[#C5A880] rounded-none focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isOtpSent || otpCode.length < 6}
                className={`w-full py-2.5 text-xs uppercase tracking-widest font-bold rounded-none transition-all flex items-center justify-center gap-2 ${isOtpSent && otpCode.length === 6
                  ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] shadow-lg'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {t('Äang XÃ¡c Thá»±c OTP...')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> {t('XÃ¡c Thá»±c OTP & ÄÄƒng Nháº­p')}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: BIOMETRIC FACEID SCAN (SOLVED BLACK SCREEN & RELIABLE) */}
        {/* ------------------------------------------------------------- */}
        {authMethod === 'FACE_ID' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Hidden canvas for capturing video frames */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden file input for portrait photo */}
            <input
              ref={fileUploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleFacePhotoUpload}
              className="hidden"
            />

            {/* Mode Indicator */}
            <div className="p-2.5 bg-[#121820] border border-[#222B35] rounded-none text-xs flex items-center justify-between select-none">
              <div className="flex items-center gap-2 text-[#C5A880] font-semibold text-[11px]">
                {deviceType === 'MOBILE' ? <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> : <Camera className="w-3.5 h-3.5 text-[#C5A880]" />}
                <span>{t('Nháº­n Diá»‡n KhuÃ´n Máº·t Trá»±c Tiáº¿p')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className={`w-2 h-2 rounded-none ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isCameraActive ? t('Camera Sáºµn SÃ ng') : t('Äang Káº¿t Ná»‘i')}</span>
              </div>
            </div>

            {/* Central Biometric Viewport - Always Keeps Video Mounted to Avoid Black Screen */}
            <div className={`relative w-full h-64 sm:h-72 bg-[#06090E] border rounded-none overflow-hidden transition-all duration-300 flex items-center justify-center ${faceScanStatus === 'SUCCESS'
              ? 'border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
              : faceScanStatus === 'FAILED'
                ? 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'border-[#C5A880]/40 shadow-[0_0_20px_rgba(197,168,128,0.1)]'
              }`}>

              {/* Shutter Flash Animation when capturing */}
              {isShutterFlash && (
                <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-fadeOut" />
              )}

              {/* Camera Mode: Video element is ALWAYS in DOM so videoRef is never null */}
              {faceInputMode === 'CAMERA' ? (
                <>
                  <video
                    ref={setVideoElementRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => {
                      setIsCameraActive(true);
                      videoRef.current?.play().catch(() => { });
                    }}
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraActive && !cameraError ? 'opacity-100' : 'opacity-0'
                      }`}
                  />

                  {/* Connecting / Loading Overlay */}
                  {(!isCameraActive || isConnectingCamera) && !cameraError && (
                    <div className="absolute inset-0 bg-[#06090E] flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 animate-fadeIn">
                      <div className="w-14 h-14 rounded-none bg-[#161B22] border border-[#C5A880]/50 flex items-center justify-center text-[#C5A880]">
                        <Camera className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="text-xs text-gray-300 font-medium">
                        {t('Äang káº¿t ná»‘i Camera')} {deviceType === 'MOBILE' ? t('Ä‘iá»‡n thoáº¡i') : t('laptop')}...
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {t('Vui lÃ²ng cho phÃ©p quyá»n Camera trÃªn trÃ¬nh duyá»‡t náº¿u cÃ³ yÃªu cáº§u')}
                      </div>
                    </div>
                  )}

                  {/* Camera Error Overlay with Quick Fallback Actions */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-[#06090E]/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 animate-fadeIn">
                      <div className="w-12 h-12 rounded-none bg-rose-950/50 border border-rose-500/60 flex items-center justify-center text-rose-400">
                        <VideoOff className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-rose-300 max-w-xs leading-relaxed">
                        {cameraError}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-[#C5A880] text-[#0D1117] text-xs font-bold rounded-none hover:bg-white transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> {t('Thá»­ láº¡i Camera')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFaceInputMode('UPLOAD');
                            fileUploadInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-gray-300 text-xs font-medium rounded-none hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Táº£i áº¢nh')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : uploadedFaceImage ? (
                /* Upload Mode with Preview */
                <div className="relative w-full h-full">
                  <img
                    src={uploadedFaceImage}
                    alt="Face Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileUploadInputRef.current?.click()}
                    className="absolute top-3 right-3 px-2.5 py-1 bg-black/75 hover:bg-black text-[11px] text-[#C5A880] rounded-none border border-white/20 backdrop-blur transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> {t('Äá»•i áº£nh')}
                  </button>
                </div>
              ) : (
                /* Upload Dropzone Placeholder */
                <div
                  onClick={() => fileUploadInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 cursor-pointer hover:bg-[#0E1520] transition-colors"
                >
                  <div className="w-14 h-14 rounded-none bg-[#161B22] border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-medium text-gray-300">
                    {t('Báº¥m vÃ o Ä‘Ã¢y Ä‘á»ƒ chá»n áº£nh khuÃ´n máº·t')}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {t('Há»— trá»£ Ä‘á»‹nh dáº¡ng áº£nh rÃµ nÃ©t (JPG, PNG, WebP)')}
                  </div>
                </div>
              )}

              {/* Real-time Environmental Lighting Indicator */}
              {faceInputMode === 'CAMERA' && isCameraActive && lighting && faceScanStatus === 'IDLE' && (
                <div className="absolute top-3 right-3 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur border border-[#222B35] text-[10px] font-mono">
                  {lighting.status === 'TOO_DARK' ? (
                    <Moon className="w-3 h-3 text-rose-400 animate-pulse" />
                  ) : lighting.status === 'TOO_BRIGHT' ? (
                    <Sun className="w-3 h-3 text-amber-400 animate-pulse" />
                  ) : (
                    <SunMedium className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className={
                    lighting.status === 'TOO_DARK' ? 'text-rose-400 font-semibold' :
                      lighting.status === 'TOO_BRIGHT' ? 'text-amber-400 font-semibold' :
                        'text-emerald-400 font-semibold'
                  }>
                    {lighting.label} ({lighting.scorePercent}%)
                  </span>
                </div>
              )}

              {/* Clean Biometric Face Guide Oval (KhÃ´ng rÆ°á»m rÃ  Ä‘Æ°á»ng káº») */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className={`w-36 h-48 sm:w-40 sm:h-52 border rounded-[50%] transition-all duration-300 ${faceScanStatus === 'SUCCESS'
                  ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                  : faceScanStatus === 'FAILED'
                    ? 'border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : (faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING')
                      ? 'border-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.35)] animate-pulse'
                      : lighting?.status === 'TOO_DARK'
                        ? 'border-rose-500/60'
                        : lighting?.status === 'TOO_BRIGHT'
                          ? 'border-amber-500/60'
                          : 'border-[#C5A880]/35'
                  }`} />
              </div>

              {/* Minimalist Floating Status - Chá»‰ hiá»ƒn thá»‹ khi IDLE hoáº·c khi cÃ³ káº¿t quáº£ SUCCESS/FAILED, khÃ´ng hiá»ƒn thá»‹ chá»“ng lÃºc Ä‘ang quÃ©t */}
              {(faceScanStatus === 'IDLE' || faceScanStatus === 'SUCCESS' || faceScanStatus === 'FAILED') && (
                <div className="absolute bottom-3 inset-x-4 flex justify-center pointer-events-none z-20">
                  <div className="px-3 py-1 bg-black/85 backdrop-blur border border-white/10 rounded-none text-xs font-medium flex items-center gap-1.5 shadow-lg">
                    {faceScanStatus === 'IDLE' && (
                      <span className={
                        lighting?.status === 'TOO_DARK' ? 'text-rose-300 flex items-center gap-1.5' :
                          lighting?.status === 'TOO_BRIGHT' ? 'text-amber-300 flex items-center gap-1.5' :
                            'text-gray-300'
                      }>
                        {faceInputMode === 'CAMERA' ? (
                          lighting?.status === 'TOO_DARK' ? (
                            <>
                              <Moon className="w-3 h-3 text-rose-400" />
                              <span>{t('Ãnh sÃ¡ng yáº¿u')} ({lighting.scorePercent}%) - {t('Cáº§n thÃªm Ã¡nh sÃ¡ng')}</span>
                            </>
                          ) : lighting?.status === 'TOO_BRIGHT' ? (
                            <>
                              <Sun className="w-3 h-3 text-amber-400" />
                              <span>{t('Ãnh sÃ¡ng chÃ³i - TrÃ¡nh ngÆ°á»£c sÃ¡ng')}</span>
                            </>
                          ) : isCameraActive ? (
                            t('CÄƒn khuÃ´n máº·t vÃ o khung elip')
                          ) : (
                            t('Äang káº¿t ná»‘i camera...')
                          )
                        ) : (
                          uploadedFaceImage ? t('áº¢nh Ä‘Ã£ sáºµn sÃ ng quÃ©t FaceID') : t('Chá»n áº£nh chÃ¢n dung Ä‘á»ƒ quÃ©t')
                        )}
                      </span>
                    )}
                    {faceScanStatus === 'SUCCESS' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {t('XÃ¡c thá»±c thÃ nh cÃ´ng')}
                      </span>
                    )}
                    {faceScanStatus === 'FAILED' && (
                      <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        {errorMessage ? t(errorMessage) : t('KhÃ´ng khá»›p dá»¯ liá»‡u')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Success Info Card */}
            {faceScanStatus === 'SUCCESS' && matchedFaceResult && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-none flex items-center justify-between text-xs animate-fadeIn shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[13px]">
                      {matchedFaceResult.name}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                      <span>{t('CÄƒn há»™')}: <span className="text-emerald-300 font-mono font-semibold">{matchedFaceResult.apt}</span></span>
                      {matchedFaceResult.bestAngle && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#C5A880]/20 text-[#D8BC95] border border-[#C5A880]/30 font-medium">
                          {t('Máº«u')}: {matchedFaceResult.bestAngle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-none text-[10px] font-mono font-bold">
                  {matchedFaceResult.score}% {t('KHá»šP')}
                </div>
              </div>
            )}

            {/* Primary Action Button - Duy nháº¥t hiá»ƒn thá»‹ vÃ²ng xoay loading táº¡i Ä‘Ã¢y */}
            <button
              type="button"
              onClick={() => {
                if (faceInputMode === 'UPLOAD' && !uploadedFaceImage) {
                  fileUploadInputRef.current?.click();
                } else {
                  handleStartFaceScan();
                }
              }}
              disabled={faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING'}
              className={`w-full py-3 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-none shadow-lg ${faceScanStatus === 'IDLE' || faceScanStatus === 'FAILED'
                ? 'bg-[#C5A880] hover:bg-white text-[#0D1117] active:scale-[0.99]'
                : 'bg-[#C5A880] text-[#0D1117] opacity-90 cursor-wait'
                }`}
            >
              {faceScanStatus === 'SCANNING' || faceScanStatus === 'LIVENESS' || faceScanStatus === 'MATCHING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0D1117]" />
                  <span>{t('Äang Nháº­n Diá»‡n KhuÃ´n Máº·t...')}</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>
                    {faceInputMode === 'UPLOAD' && !uploadedFaceImage
                      ? t('Chá»n áº¢nh Äá»ƒ Nháº­n Diá»‡n')
                      : faceScanStatus === 'FAILED'
                        ? t('QuÃ©t Láº¡i KhuÃ´n Máº·t')
                        : t('Báº¯t Äáº§u Nháº­n Diá»‡n KhuÃ´n Máº·t')}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

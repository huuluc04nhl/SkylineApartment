'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  CreditCard, 
  Scan, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Eye, 
  Layers, 
  RotateCw, 
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  runDualSideCccdOcr, 
  parseCccdText, 
  OcrCccdResult, 
  formatToDateInput, 
  formatToDisplayDate, 
  formatToApiDate,
  compressImageDataUrl,
  rotateImageDataUrl,
  extractCccdFromClientQr 
} from '@/lib/ocrParser';
import { skylineUpdateCccd } from '@/lib/skylineApiClient';
import { useLanguage } from '@/lib/languageContext';
import { cleanCccdNumber, isValidCccdNumber, getCccdValidationError } from '@/lib/validationUtils';

interface CccdOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcrData: (data: OcrCccdResult, frontImage: string, backImage: string) => void;
  initialFrontImage?: string;
  initialBackImage?: string;
}

export default function CccdOcrScannerModal({
  isOpen,
  onClose,
  onApplyOcrData,
  initialFrontImage,
  initialBackImage,
}: CccdOcrScannerModalProps) {
  useEscapeKey(isOpen, onClose);
  const { t, isEn } = useLanguage();
  const [frontImage, setFrontImage] = useState<string>(initialFrontImage || '');
  const [backImage, setBackImage] = useState<string>(initialBackImage || '');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialFrontImage) setFrontImage(initialFrontImage);
      if (initialBackImage) setBackImage(initialBackImage);
    }
  }, [isOpen, initialFrontImage, initialBackImage]);
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<'IDLE' | 'SCANNING_FRONT' | 'FLIPPING' | 'SCANNING_BACK' | 'COMPLETE'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrCccdResult | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields in verification table
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState<'1' | '0'>('1');
  const [editPob, setEditPob] = useState('');
  const [editIdDate, setEditIdDate] = useState('');
  const [editIdPlace, setEditIdPlace] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Tá»‡p táº£i lÃªn chÆ°a Ä‘Ãºng Ä‘á»‹nh dáº¡ng. QuÃ½ cÆ° dÃ¢n vui lÃ²ng chá»n tá»‡p hÃ¬nh áº£nh (JPG, PNG).');
      return;
    }

    if (file.size < 5000) {
      setErrorMessage('áº¢nh chá»¥p chÆ°a Ä‘á»§ rÃµ nÃ©t. QuÃ½ cÆ° dÃ¢n vui lÃ²ng táº£i áº£nh chá»¥p rÃµ cÃ¡c gÃ³c cá»§a tháº».');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = async () => {
          let finalDataUrl = dataUrl;
          if (img.height > img.width) {
            finalDataUrl = await rotateImageDataUrl(dataUrl, 90, 1200);
          } else {
            finalDataUrl = await compressImageDataUrl(dataUrl, 1200);
          }
          setFrontImage(finalDataUrl);
          setOcrResult(null);
          setErrorMessage(null);
          if (!backImage) {
            setTimeout(() => {
              setIsFlipped(true);
            }, 400);
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Tá»‡p táº£i lÃªn chÆ°a Ä‘Ãºng Ä‘á»‹nh dáº¡ng. QuÃ½ cÆ° dÃ¢n vui lÃ²ng chá»n tá»‡p hÃ¬nh áº£nh (JPG, PNG).');
      return;
    }

    if (file.size < 5000) {
      setErrorMessage('áº¢nh chá»¥p chÆ°a Ä‘á»§ rÃµ nÃ©t. QuÃ½ cÆ° dÃ¢n vui lÃ²ng táº£i áº£nh chá»¥p rÃµ cÃ¡c gÃ³c cá»§a tháº».');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = async () => {
          let finalDataUrl = dataUrl;
          if (img.height > img.width) {
            finalDataUrl = await rotateImageDataUrl(dataUrl, 90, 1200);
          } else {
            finalDataUrl = await compressImageDataUrl(dataUrl, 1200);
          }
          setBackImage(finalDataUrl);
          setOcrResult(null);
          setErrorMessage(null);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * 2-Stage Auto-Flip Scanning Workflow
   * 1. Turn to Front Side -> Scan Front (0 -> 50%)
   * 2. Auto 3D-Flip to Back Side -> Scan Back (50 -> 100%)
   * 3. Consolidate Real Data
   */
  const handleStartAutoFlipOcr = async () => {
    if (!frontImage || !backImage) {
      setErrorMessage('Vui lÃ²ng táº£i lÃªn Ä‘áº§y Ä‘á»§ cáº£ Máº·t TrÆ°á»›c vÃ  Máº·t Sau cá»§a CCCD trÆ°á»›c khi quÃ©t.');
      return;
    }

    setIsScanning(true);
    setOcrResult(null);
    setErrorMessage(null);

    try {
      // 1. Force flip to FRONT SIDE
      setIsFlipped(false);
      setScanStage('SCANNING_FRONT');
      setScanStatusText('Äang kiá»ƒm tra thÃ´ng tin máº·t trÆ°á»›c cá»§a tháº»...');
      setScanProgress(25);

      let ocrSucceeded = false;

      // 1. Æ¯U TIÃŠN: QuÃ©t mÃ£ QR báº£o máº­t trá»±c tiáº¿p trÃªn áº£nh máº·t trÆ°á»›c hoáº·c máº·t sau
      try {
        let clientQrResult = await extractCccdFromClientQr(frontImage);
        if (!clientQrResult && backImage) {
          clientQrResult = await extractCccdFromClientQr(backImage);
        }

        if (clientQrResult && clientQrResult.idNumber) {
          setScanProgress(60);
          setScanStatusText('âœ¨ ÄÃ£ tÃ¬m tháº¥y thÃ´ng tin trÃªn tháº»! Äang kiá»ƒm tra máº·t sau...');
          setIsFlipped(true);
          await new Promise((r) => setTimeout(r, 400));

          setScanProgress(100);
          setScanStatusText('âœ¨ HoÃ n táº¥t nháº­n diá»‡n! Äang tá»± Ä‘á»™ng Ä‘iá»n vÃ o há»“ sÆ¡...');
          setScanStage('COMPLETE');

          const finalResult: OcrCccdResult = {
            ...clientQrResult,
            idNumber: clientQrResult.idNumber.replace(/\D/g, '').slice(0, 12),
            fullName: clientQrResult.fullName.toUpperCase().trim(),
            dob: formatToDateInput(clientQrResult.dob),
            gender: clientQrResult.gender,
            pob: clientQrResult.pob,
            province: clientQrResult.province || 'TP. Há»“ ChÃ­ Minh',
            idDate: formatToDateInput(clientQrResult.idDate),
            idPlace: clientQrResult.idPlace || 'Cá»¥c Cáº£nh sÃ¡t QLHC vá» TTXH',
          };

          setOcrResult(finalResult);
          ocrSucceeded = true;

          // Tá»± Ä‘á»™ng Ä‘iá»n tháº³ng thÃ´ng tin vÃ o há»“ sÆ¡ vÃ  Ä‘Ã³ng modal
          onApplyOcrData(finalResult, frontImage, backImage);
          setTimeout(() => {
            onClose();
          }, 500);
          return;
        }
      } catch (qrErr) {
        console.warn('Client QR scan attempt:', qrErr);
      }

      // 2. Náº¿u QR khÃ´ng cÃ³ hoáº·c bá»‹ má», gá»­i áº£nh lÃªn há»‡ thá»‘ng Ä‘á»ƒ Ä‘á»c chá»¯ vÃ  Ä‘á»‘i chiáº¿u
      if (!ocrSucceeded) {
        setScanStatusText('Äang Ä‘á»‘i chiáº¿u thÃ´ng tin tá»« hÃ¬nh áº£nh tháº»...');
        setScanProgress(40);

        const [compFront, compBack] = await Promise.all([
          compressImageDataUrl(frontImage),
          compressImageDataUrl(backImage),
        ]);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        try {
          const aiRes = await fetch('/api/ai/ocr-cccd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frontImage: compFront, backImage: compBack }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const aiData = await aiRes.json();
          if (aiRes.ok && aiData.success && (aiData.data?.idNumber || aiData.data?.fullName)) {
            setScanProgress(60);
            setScanStatusText('âœ¨ ÄÃ£ nháº­n diá»‡n thÃ´ng tin máº·t trÆ°á»›c! Äang kiá»ƒm tra máº·t sau...');
            setIsFlipped(true);
            await new Promise((r) => setTimeout(r, 400));

            setScanProgress(100);
            setScanStatusText('âœ¨ HoÃ n táº¥t nháº­n diá»‡n! Äang tá»± Ä‘á»™ng Ä‘iá»n vÃ o há»“ sÆ¡...');
            setScanStage('COMPLETE');

            const d = aiData.data;
            const finalResult: OcrCccdResult = {
              idNumber: (d.idNumber || '').replace(/\D/g, '').slice(0, 12),
              fullName: (d.fullName || '').toUpperCase().trim(),
              dob: formatToDateInput(d.dob || ''),
              gender: (d.gender === '0' || d.gender === 0 ? '0' : '1') as '1' | '0',
              pob: d.pob || '',
              residence: d.residence || d.pob || '',
              province: d.province || 'TP. Há»“ ChÃ­ Minh',
              idDate: formatToDateInput(d.idDate || ''),
              idPlace: d.idPlace || 'Cá»¥c Cáº£nh sÃ¡t QLHC vá» TTXH',
              confidence: d.confidence || 98,
              rawText: `[THÃ”NG TIN THáºº CÄ‚N CÆ¯á»šC]:\nSá»‘ CCCD: ${d.idNumber}\nHá» tÃªn: ${d.fullName}`,
            };

            setOcrResult(finalResult);
            ocrSucceeded = true;

            // Tá»± Ä‘á»™ng Ä‘iá»n tháº³ng thÃ´ng tin vÃ o há»“ sÆ¡ vÃ  Ä‘Ã³ng modal
            onApplyOcrData(finalResult, frontImage, backImage);
            setTimeout(() => {
              onClose();
            }, 500);
            return;
          } else {
            // Khi áº£nh chá»¥p bá»‹ má»/lÃ³a khÃ´ng nháº­n dáº¡ng Ä‘Æ°á»£c chá»¯: LÆ°u láº¡i áº£nh chá»¥p vÃ o há»“ sÆ¡ vÃ  má»Ÿ báº£ng nháº­p nhanh
            setScanProgress(100);
            setScanStatusText('âœ¨ ÄÃ£ lÆ°u áº£nh chá»¥p 2 máº·t! QuÃ½ cÆ° dÃ¢n vui lÃ²ng há»— trá»£ Ä‘iá»n nhanh thÃ´ng tin:');
            setScanStage('COMPLETE');
            setIsFlipped(false);
            setErrorMessage('áº¢nh chá»¥p cÃ³ thá»ƒ bá»‹ lÃ³a sÃ¡ng hoáº·c nghiÃªng gÃ³c. Há»‡ thá»‘ng Ä‘Ã£ lÆ°u áº£nh 2 máº·t, QuÃ½ cÆ° dÃ¢n vui lÃ²ng há»— trá»£ Ä‘iá»n nhanh cÃ¡c Ã´ bÃªn dÆ°á»›i.');
            ocrSucceeded = true;
          }
        } catch (fetchErr: any) {
          setScanProgress(100);
          setScanStatusText('âœ¨ ÄÃ£ lÆ°u áº£nh chá»¥p 2 máº·t! QuÃ½ cÆ° dÃ¢n vui lÃ²ng há»— trá»£ Ä‘iá»n nhanh thÃ´ng tin:');
          setScanStage('COMPLETE');
          setIsFlipped(false);
          setErrorMessage('Há»‡ thá»‘ng Ä‘Ã£ nháº­n 2 máº·t áº£nh chá»¥p. QuÃ½ cÆ° dÃ¢n vui lÃ²ng há»— trá»£ Ä‘iá»n nhanh thÃ´ng tin vÃ o cÃ¡c Ã´ bÃªn dÆ°á»›i.');
          ocrSucceeded = true;
        }
      }
    } catch (err: any) {
      console.error('Scan Error:', err);
      setErrorMessage('QuÃ½ cÆ° dÃ¢n vui lÃ²ng kiá»ƒm tra láº¡i áº£nh chá»¥p hoáº·c tá»± Ä‘iá»n thÃ´ng tin vÃ o cÃ¡c Ã´ bÃªn dÆ°á»›i.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async () => {
    if (!ocrResult) return;

    const cccdErr = getCccdValidationError(editIdNumber);
    if (cccdErr) {
      setErrorMessage(cccdErr);
      return;
    }

    setIsSyncingApi(true);
    const finalResult: OcrCccdResult = {
      ...ocrResult,
      idNumber: cleanCccdNumber(editIdNumber),
      fullName: editFullName.trim().toUpperCase(),
      dob: formatToDateInput(editDob),
      gender: editGender,
      pob: editPob.trim(),
      province: editPob.trim().includes('Há»“ ChÃ­ Minh') ? 'TP. Há»“ ChÃ­ Minh' : editPob.trim().includes('HÃ  Ná»™i') ? 'HÃ  Ná»™i' : (ocrResult.province || 'TP. Há»“ ChÃ­ Minh'),
      idDate: formatToDateInput(editIdDate),
      idPlace: editIdPlace.trim(),
    };

    // Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ ngay lÃªn API
    try {
      await skylineUpdateCccd({
        number: finalResult.idNumber,
        date: finalResult.idDate,
        place: finalResult.idPlace,
        front: frontImage,
        back: backImage,
        fullName: finalResult.fullName,
        dob: finalResult.dob,
        pob: finalResult.pob,
        gender: finalResult.gender === '1' ? 1 : 0,
      });
    } catch (apiErr) {
      console.warn('API sync in modal warning:', apiErr);
    } finally {
      setIsSyncingApi(false);
    }

    onApplyOcrData(finalResult, frontImage, backImage);
    onClose();
  };

  const hasBothImages = Boolean(frontImage && backImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0D1117] border border-[#C5A880] max-w-3xl w-full p-4 sm:p-8 text-white space-y-5 sm:space-y-6 shadow-2xl overflow-y-auto max-h-[94vh] rounded-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3 sm:pb-4">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> 
              <span>{t('ThÃ´ng Tin CÆ° DÃ¢n')}</span>
            </div>
            <h3 className="font-serif text-base sm:text-2xl font-bold text-white flex items-center gap-2 truncate">
              <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A880] flex-shrink-0" /> <span>{t('Äá»c ThÃ´ng Tin Tháº» CÄƒn CÆ°á»›c (2 Máº·t)')}</span>
            </h3>
            <p className="text-xs text-gray-400 hidden sm:block">
              {t('QuÃ©t thÃ´ng tin tá»« 2 máº·t tháº» CÄƒn cÆ°á»›c cÃ´ng dÃ¢n Ä‘á»ƒ cáº­p nháº­t há»“ sÆ¡.')}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="ÄÃ³ng mÃ¡y quÃ©t CCCD"
            className="p-2 text-gray-400 hover:text-white hover:bg-[#161B22] rounded-none transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice / Guidance Alert */}
        {errorMessage && (
          <div className="p-3 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs flex items-center gap-2 rounded-none">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE 3D FLIPPABLE CARD CONTAINER                       */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Card Face Status Switcher Bar */}
          <div className="flex items-center justify-between bg-[#121820] p-2.5 px-3 sm:px-4 border border-[#222B35] rounded-none">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 hidden sm:inline">{t('Äang hiá»ƒn thá»‹:')}</span>
              <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-none text-[11px] font-mono ${
                !isFlipped 
                  ? 'bg-amber-950/80 text-[#C5A880] border border-[#C5A880]' 
                  : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500'
              }`}>
                {!isFlipped ? t('Máº¶T TRÆ¯á»šC') : t('Máº¶T SAU')}
              </span>
            </div>

            {/* Manual Flip Button */}
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              disabled={isScanning}
              className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#C5A880] text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shadow"
            >
              <RotateCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
              <span>{isFlipped ? t('Xem Máº·t TrÆ°á»›c') : t('Xem Máº·t Sau')}</span>
            </button>
          </div>

          {/* 3D Perspective Flip Box - Exact Physical Card Aspect Ratio 85.6mm x 54mm */}
          <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[85.6/54] [perspective:1400px]">
            <div
              className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${
                isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
              }`}
            >
              {/* ========================================================= */}
              {/* FACE 1: FRONT SIDE (Máº¶T TRÆ¯á»šC)                            */}
              {/* ========================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-none overflow-hidden border-2 border-[#C5A880]/80 bg-gradient-to-br from-[#1A232E] via-[#121820] to-[#0A0E14] shadow-2xl p-2.5 sm:p-4 flex flex-col justify-between">
                {/* Decorative chip header */}
                <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880]" />
                    <span className="text-[#C5A880] font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                      {t('Máº·t TrÆ°á»›c â€¢ CÄƒn CÆ°á»›c CÃ´ng DÃ¢n')}
                    </span>
                  </div>
                  {frontImage && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('ÄÃ£ Táº£i LÃªn')}
                    </span>
                  )}
                </div>

                {/* Front Image Content */}
                <div 
                  onClick={() => frontInputRef.current?.click()}
                  className="flex-1 my-1 sm:my-2 bg-black/60 border border-dashed border-gray-700 hover:border-[#C5A880] rounded-none overflow-hidden relative group cursor-pointer flex items-center justify-center"
                >
                  {frontImage ? (
                    <>
                      <img
                        src={frontImage}
                        alt="CCCD Front"
                        className="w-full h-full object-contain sm:object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Laser scanning beam */}
                      {isScanning && scanStage === 'SCANNING_FRONT' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent shadow-[0_0_20px_#C5A880] animate-bounce top-1/2 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mr-1" /> {t('Chá»n Láº¡i áº¢nh Máº·t TrÆ°á»›c')}
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1.5 text-gray-400 p-2 sm:p-4">
                      <Camera className="w-7 h-7 sm:w-10 sm:h-10 mx-auto text-gray-500 group-hover:text-[#C5A880] transition-colors" />
                      <div className="text-[11px] sm:text-xs font-semibold text-white">{t('Báº¥m Ä‘á»ƒ táº£i lÃªn Máº·t TrÆ°á»›c CCCD')}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500">{t('Chá»©a áº£nh chÃ¢n dung, 12 sá»‘ CCCD, Há» tÃªn, NgÃ y sinh')}</div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar on Front Face */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="text-gray-400 hover:text-white flex items-center gap-1 font-mono hover:underline"
                  >
                    <Upload className="w-3 h-3" /> {frontImage ? t('Äá»•i áº¢nh Máº·t TrÆ°á»›c') : t('Chá»n Tá»‡p áº¢nh')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="text-[#C5A880] hover:text-white font-bold flex items-center gap-1"
                  >
                    <span>{t('Láº­t Sang Máº·t Sau')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* FACE 2: BACK SIDE (Máº¶T SAU)                              */}
              {/* ========================================================= */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] rounded-none overflow-hidden border-2 border-cyan-500/80 bg-gradient-to-br from-[#121E2A] via-[#101820] to-[#091018] shadow-2xl p-2.5 sm:p-4 flex flex-col justify-between">
                {/* Decorative chip header */}
                <div className="flex items-center justify-between text-xs border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                      {t('Máº·t Sau â€¢ NgÃ y Cáº¥p & NÆ¡i Cáº¥p')}
                    </span>
                  </div>
                  {backImage && (
                    <span className="text-cyan-400 font-mono text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('ÄÃ£ Táº£i LÃªn')}
                    </span>
                  )}
                </div>

                {/* Back Image Content */}
                <div 
                  onClick={() => backInputRef.current?.click()}
                  className="flex-1 my-1 sm:my-2 bg-black/60 border border-dashed border-gray-700 hover:border-cyan-400 rounded-none overflow-hidden relative group cursor-pointer flex items-center justify-center"
                >
                  {backImage ? (
                    <>
                      <img
                        src={backImage}
                        alt="CCCD Back"
                        className="w-full h-full object-contain sm:object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Laser scanning beam */}
                      {isScanning && scanStage === 'SCANNING_BACK' && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#38BDF8] animate-bounce top-1/2 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mr-1" /> {t('Chá»n Láº¡i áº¢nh Máº·t Sau')}
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1.5 text-gray-400 p-2 sm:p-4">
                      <Camera className="w-7 h-7 sm:w-10 sm:h-10 mx-auto text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      <div className="text-[11px] sm:text-xs font-semibold text-white">{t('Báº¥m Ä‘á»ƒ táº£i lÃªn Máº·t Sau CCCD')}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500">{t('Bao gá»“m NgÃ y cáº¥p vÃ  NÆ¡i cáº¥p tháº»')}</div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar on Back Face */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="text-gray-400 hover:text-white flex items-center gap-1 font-mono hover:underline"
                  >
                    <Upload className="w-3 h-3" /> {backImage ? t('Äá»•i áº¢nh Máº·t Sau') : t('Chá»n Tá»‡p áº¢nh')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="text-cyan-400 hover:text-white font-bold flex items-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    <span>{t('Xem Máº·t TrÆ°á»›c')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            onChange={handleFrontUpload}
            className="hidden"
          />
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackUpload}
            className="hidden"
          />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SCAN TRIGGER & PROGRESS SECTION                               */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 bg-[#161D26] border border-[#222B35] space-y-3 rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-gray-300">
              {hasBothImages ? (
                <span className="text-emerald-400 font-bold font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {t('ÄÃ£ Táº£i Äá»§ 2 Máº·t â€” Sáºµn sÃ ng nháº­n diá»‡n thÃ´ng tin tháº»')}
                </span>
              ) : (
                <span className="text-amber-400 font-bold font-mono">
                  âš ï¸ {t('HÃ£y táº£i lÃªn Ä‘á»§ cáº£ Máº·t TrÆ°á»›c vÃ  Máº·t Sau trÆ°á»›c khi quÃ©t!')}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleStartAutoFlipOcr}
              disabled={isScanning || !hasBothImages}
              className={`w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-lg ${
                isScanning || !hasBothImages
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#C5A880] to-amber-400 hover:from-white hover:to-white text-[#0D1117] cursor-pointer'
              }`}
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-[#0D1117]" />
              )}
              {isScanning ? t('Äang Nháº­n Diá»‡n ThÃ´ng Tin...') : t('Tá»± Äá»™ng Nháº­n Diá»‡n ThÃ´ng Tin Tháº»')}
            </button>
          </div>

          {/* Scanning Progress & Status */}
          {isScanning && (
            <div className="space-y-1.5 pt-2 animate-fadeIn">
              <div className="flex justify-between text-[11px] font-mono text-gray-300">
                <span className="text-[#C5A880]">{t(scanStatusText)}</span>
                <span className="font-bold">{scanProgress}%</span>
              </div>
              <div className="w-full bg-[#0D1117] h-2 rounded-none overflow-hidden border border-gray-700">
                <div
                  className="bg-gradient-to-r from-[#C5A880] via-cyan-400 to-emerald-400 h-full transition-all duration-300 rounded-none"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* EXTRACTED REAL DATA TABLE (EDITABLE BEFORE APPLYING)          */}
        {/* ------------------------------------------------------------- */}
        {ocrResult && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#121820] to-[#161D26] border border-emerald-500/80 space-y-4 rounded-none animate-fadeIn shadow-2xl">
            <div className="border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> {t('ThÃ´ng Tin Tháº» CÄƒn CÆ°á»›c')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('1. Sá»‘ CÄƒn cÆ°á»›c cÃ´ng dÃ¢n:')}</label>
                <input
                  type="text"
                  maxLength={12}
                  value={editIdNumber}
                  onChange={(e) => setEditIdNumber(cleanCccdNumber(e.target.value))}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-[#C5A880] font-mono font-bold rounded-none focus:border-[#C5A880] outline-none"
                  placeholder={isEn ? '12-digit ID number...' : '12 sá»‘ Ä‘á»‹nh danh...'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('2. Há» vÃ  TÃªn:')}</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-bold rounded-none focus:border-[#C5A880] outline-none uppercase"
                  placeholder={isEn ? 'Full name...' : 'Há» vÃ  tÃªn...'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('3. NgÃ y sinh:')}</label>
                <input
                  type="date"
                  value={formatToApiDate(editDob)}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('4. Giá»›i TÃ­nh:')}</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value as '1' | '0')}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                >
                  <option value="1">{t('Nam')}</option>
                  <option value="0">{t('Ná»¯')}</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('5. QuÃª quÃ¡n / NÆ¡i sinh:')}</label>
                <input
                  type="text"
                  value={editPob}
                  onChange={(e) => setEditPob(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                  placeholder={isEn ? 'Ward, District, City/Province...' : 'XÃ£/PhÆ°á»ng, Quáº­n/Huyá»‡n, Tá»‰nh/ThÃ nh phá»‘...'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('6. NgÃ y Cáº¥p (Máº·t Sau):')}</label>
                <input
                  type="date"
                  value={formatToApiDate(editIdDate)}
                  onChange={(e) => setEditIdDate(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 font-mono rounded-none focus:border-[#C5A880] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono font-semibold">{t('7. NÆ¡i Cáº¥p (Máº·t Sau):')}</label>
                <input
                  type="text"
                  value={editIdPlace}
                  onChange={(e) => setEditIdPlace(e.target.value)}
                  className="w-full bg-[#0D1117] border border-gray-700 p-2 text-cyan-400 rounded-none focus:border-[#C5A880] outline-none"
                  placeholder={isEn ? 'Police Dept of Administrative Management...' : 'Cá»¥c Cáº£nh sÃ¡t QLHC vá» TTXH...'}
                />
              </div>
            </div>

            {/* Action Bar when data is ready */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={isSyncingApi}
                className={`w-full sm:w-auto px-8 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none shadow-xl cursor-pointer ${
                  isSyncingApi
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                }`}
              >
                {isSyncingApi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0D1117]" />
                    <span>{t('Äang LÆ°u ThÃ´ng Tin...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('XÃ¡c Nháº­n & LÆ°u VÃ o Há»“ SÆ¡')}</span>
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

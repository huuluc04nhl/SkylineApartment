'use client';

import { useState, useEffect, useRef } from 'react';
import { useResidentApartment } from '@/lib/hooks/useResidentApartment';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { User } from '@/lib/dataStore';
import {
  skylineGetUserInfo,
  skylineUpdateInfo,
  skylineUpdateCccd,
  skylineUpdateAvatar,
  skylineGetEnrolledFaceProfile
} from '@/lib/skylineApiClient';
import { useAuth } from '@/lib/authContext';
import { OcrCccdResult, formatToDateInput, formatToDisplayDate, formatToApiDate } from '@/lib/ocrParser';
import {
  getEkycForUser,
  getEkycRequests,
  saveEkycRequests,
  submitEkycRequest,
  updateEkycCardImages,
  EkycRequest
} from '@/lib/ekycStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';
import { getEnrolledFaceProfile, EnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { useLanguage } from '@/lib/languageContext';
import {
  isValidPhoneNumber,
  getPhoneValidationError,
  cleanCccdNumber,
  isValidCccdNumber,
  getCccdValidationError
} from '@/lib/validationUtils';

export function useProfileEkyc(currentUser: User) {
  const { t, isEn } = useLanguage();
  const { updateUserInfo, refreshUser } = useAuth();
  const isOwner = currentUser.role === 'OWNER';
  const { aptCode, missing: missingApartment } = useResidentApartment(currentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTabState] = useState<'INFO' | 'EKYC' | 'PASSWORD'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get('subtab');
      if (sub === 'INFO' || sub === 'EKYC' || sub === 'PASSWORD') return sub;
    }
    return 'INFO';
  });

  const setActiveTab = (tab: 'INFO' | 'EKYC' | 'PASSWORD') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('subtab') !== tab) {
        url.searchParams.set('subtab', tab);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  };
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCardViewerOpen, setIsCardViewerOpen] = useState(false);
  const [isFaceEnrollOpen, setIsFaceEnrollOpen] = useState(false);
  const [enrolledFaceProfile, setEnrolledFaceProfile] = useState<EnrolledFaceProfile | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [ocrFilledNotice, setOcrFilledNotice] = useState(false);

  // Form State (Populated 100% directly from API response)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'1' | '0'>('1');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idDate, setIdDate] = useState('');
  const [idPlace, setIdPlace] = useState('');
  const [birthday, setBirthday] = useState('');
  const [pob, setPob] = useState('');
  const [province, setProvince] = useState('');
  const [intro, setIntro] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // e-KYC State
  const [ekycStatus, setEkycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED' | 'DRAFT' | 'PENDING_OWNER'>('DRAFT');
  const [isEditingLegal, setIsEditingLegal] = useState(false);
  const [currentEkyc, setCurrentEkyc] = useState<EkycRequest | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [cccdImage, setCccdImage] = useState('');
  const [cccdBackImage, setCccdBackImage] = useState('');
  const [matchScore, setMatchScore] = useState(99.8);

  // Load live user info directly from API endpoint on mount & sync e-KYC status
  useEffect(() => {
    async function loadApiUserData() {
      setIsLoadingApi(true);
      try {
        const apiUser = await skylineGetUserInfo();
        if (apiUser) {
          setFullName(apiUser.fullname || apiUser.full_name || '');
          setPhone(apiUser.phone || apiUser.username || '');
          setEmail(apiUser.email || '');
          setGender(apiUser.gender !== undefined ? (apiUser.gender.toString() as '1' | '0') : '1');
          setIdCardNumber(apiUser.id_number || (apiUser as any).id_card_no || (apiUser as any).id_card_number || '');
          setIdDate(formatToDateInput(apiUser.id_date || ''));
          setIdPlace(apiUser.id_place || '');
          setBirthday(formatToDateInput(apiUser.dob || (apiUser as any).formatedDob || ''));
          setPob(apiUser.pob || '');
          setProvince(apiUser.province || '');
          setIntro(apiUser.intro || '');
          setLicensePlate(apiUser.license_plate || '');
          setAvatarUrl(apiUser.avatar_url || apiUser.avatar || '');
          if ((apiUser as any).cccd_front_url) {
            setCccdImage((apiUser as any).cccd_front_url);
          }
          if ((apiUser as any).cccd_back_url) {
            setCccdBackImage((apiUser as any).cccd_back_url);
          }
        } else {
          // Fallback to currentUser if offline
          setFullName(currentUser.full_name || '');
          setPhone(currentUser.phone || currentUser.username || '');
          setEmail(currentUser.email || '');
          setIdCardNumber(currentUser.id_card_no || (currentUser as any).id_number || '');
          setBirthday(currentUser.dob ? formatToDateInput(currentUser.dob) : '');
          setPob(currentUser.pob || '');
          setAvatarUrl(currentUser.avatar_url || '');
          if ((currentUser as any).cccd_front_url) setCccdImage((currentUser as any).cccd_front_url);
          if ((currentUser as any).cccd_back_url) setCccdBackImage((currentUser as any).cccd_back_url);
        }
      } catch (err) {
        console.warn('Failed to fetch live API user info:', err);
      } finally {
        setIsLoadingApi(false);
      }
    }

    loadApiUserData();

    const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;

    // Persistent CCCD images are synchronized from EKYC database model

    // Synchronize live e-KYC status with BQL approval center (Local + Server)
    const syncEkycStatus = async () => {
      const userRecord = getEkycForUser(userKey);
      if (userRecord) {
        setCurrentEkyc(userRecord);
        setEkycStatus(userRecord.status === 'APPROVED' ? 'VERIFIED' : userRecord.status);
        if (userRecord.idCardFrontUrl) setCccdImage(userRecord.idCardFrontUrl);
        if (userRecord.idCardBackUrl) setCccdBackImage(userRecord.idCardBackUrl);
        if (userRecord.faceScore) setMatchScore(userRecord.faceScore);
      } else {
        setEkycStatus('DRAFT');
      }

      // Kéo dữ liệu thời gian thực từ API máy chủ để phản ánh tức thì quyết định Phê Duyệt / Từ Chối của BQL
      try {
        const res = await fetch(`/api/ekyc?userId=${encodeURIComponent(userKey)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.ekyc) {
            const serverEkyc: EkycRequest = data.ekyc;
            setCurrentEkyc(serverEkyc);
            setEkycStatus(serverEkyc.status === 'APPROVED' ? 'VERIFIED' : serverEkyc.status);
            if (serverEkyc.idCardFrontUrl) setCccdImage(serverEkyc.idCardFrontUrl);
            if (serverEkyc.idCardBackUrl) setCccdBackImage(serverEkyc.idCardBackUrl);
            if (serverEkyc.faceScore) setMatchScore(serverEkyc.faceScore);

            // Đồng bộ bộ nhớ đệm client
            const allReqs: EkycRequest[] = getEkycRequests();
            const idx = allReqs.findIndex((r: EkycRequest) => r.id === serverEkyc.id || r.userId === serverEkyc.userId);
            if (idx >= 0) {
              allReqs[idx] = serverEkyc;
            } else {
              allReqs.unshift(serverEkyc);
            }
            saveEkycRequests(allReqs);
          }
        }
      } catch (err) {
        console.warn('Sync ekyc status from server error:', err);
      }
    };

    syncEkycStatus();
    window.addEventListener('skyline_ekyc_updated', syncEkycStatus);

    // Synchronize FaceID enrolled biometric profile (Local + Remote Server API)
    const syncEnrolledFace = () => {
      const p = getEnrolledFaceProfile(userKey);
      if (p) setEnrolledFaceProfile(p);

      // Tự động kéo từ máy chủ API để đồng bộ mẫu vừa quét trên Mobile sang Desktop
      skylineGetEnrolledFaceProfile(userKey).then(remoteP => {
        if (remoteP) {
          setEnrolledFaceProfile(remoteP);
        }
      });
    };
    syncEnrolledFace();
    window.addEventListener('skyline_faceid_enrolled', syncEnrolledFace);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncEkycStatus();
        syncEnrolledFace();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('skyline_ekyc_updated', syncEkycStatus);
      window.removeEventListener('skyline_faceid_enrolled', syncEnrolledFace);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser]);

  // 1. Submit Update Profile Info to Skyline API (POST /api/user/updateInfo + updateCccd)
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSavedSuccess(false);

    // Bẫy dữ liệu số điện thoại & CCCD (Bilingual: VI / EN)
    const phoneErr = getPhoneValidationError(phone, isEn);
    if (phoneErr) {
      setSaveError(phoneErr);
      return;
    }

    if (idCardNumber && idCardNumber.trim()) {
      const cccdErr = getCccdValidationError(idCardNumber, isEn);
      if (cccdErr) {
        setSaveError(cccdErr);
        return;
      }
    }

    setIsSaving(true);

    try {
      const parts = fullName.trim().split(' ');
      const firstname = parts.slice(-1)[0] || '';
      const lastname = parts.slice(0, -1).join(' ') || '';

      const res = await skylineUpdateInfo({
        username: currentUser?.username || currentUser?.email || phone.trim(),
        firstname,
        lastname,
        fullname: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender: gender === '1' ? 1 : 0,
        dob: formatToDateInput(birthday),
        pob: pob || '',
        id_number: idCardNumber.trim(),
        id_date: formatToDateInput(idDate),
        id_place: idPlace,
        province: province,
        intro: intro,
        license_plate: licensePlate,
      });

      // Also synchronize CCCD card images to Skyline Server
      try {
        await skylineUpdateCccd({
          number: idCardNumber.trim(),
          date: idDate,
          place: idPlace,
          front: cccdImage,
          back: cccdBackImage,
        });
      } catch (cccdErr) {
        console.warn('Sync CCCD on save error:', cccdErr);
      }

      if (res.success && res.user) {
        // Synchronize state across active session and components immediately
        updateUserInfo({
          ...res.user as any,
          id_card_no: idCardNumber.trim(),
          dob: formatToApiDate(birthday),
          pob: pob || '',
        });

        // Real-time synchronization across entire portal shell
        await refreshUser();

        // Update local state directly with returned API payload (replacing old data)
        setFullName(res.user.fullname || res.user.full_name || fullName);
        setPhone(res.user.phone || phone);
        setEmail(res.user.email || email);
        setIdCardNumber(res.user.id_number || idCardNumber);
        setLicensePlate(res.user.license_plate || licensePlate);
        setPob(res.user.pob || '');
        if (res.user.dob) setBirthday(formatToApiDate(res.user.dob));
        if (res.user.id_date) setIdDate(formatToApiDate(res.user.id_date));
        if (res.user.id_place) setIdPlace(res.user.id_place);

        setSavedSuccess(true);
        setOcrFilledNotice(false);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setSaveError('Không thể lưu thông tin. Vui lòng thử lại sau.');
      }
    } catch (err: any) {
      console.warn('Skyline save info error', err);
      setSaveError('Lỗi kết nối máy chủ khi cập nhật thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Submit Update Avatar to Skyline API (POST /api/user/updateAvatar)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        setAvatarUrl(base64Data);

        const res = await skylineUpdateAvatar(base64Data);
        if (res.success) {
          updateUserInfo({ avatar_url: base64Data });
          await refreshUser();
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setIsUploadingAvatar(false);
    }
  };

  // 2. Handle auto-filling data from OCR Scanner Modal (2 sides)
  const handleApplyOcrData = async (ocrData: OcrCccdResult, frontSrc: string, backSrc: string) => {
    const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;

    const stdIdNumber = (ocrData.idNumber || '').replace(/\D/g, '').slice(0, 12);
    const stdFullName = (ocrData.fullName || '').toUpperCase().trim();
    const stdDob = formatToDateInput(ocrData.dob || '');
    const stdGender = ocrData.gender || '1';
    const stdPob = ocrData.pob?.trim() || '';
    const stdProvince = ocrData.province || (stdPob.includes('Hồ Chí Minh') ? 'Thành phố Hồ Chí Minh' : stdPob.includes('Hà Nội') ? 'Hà Nội' : 'Thành phố Hồ Chí Minh');
    const stdIdDate = formatToDateInput(ocrData.idDate || '');
    const stdIdPlace = ocrData.idPlace?.trim() || 'Cục Cảnh sát QLHC về TTXH';

    if (stdIdNumber) setIdCardNumber(stdIdNumber);
    if (stdFullName) setFullName(stdFullName);
    if (stdDob) setBirthday(stdDob);
    if (stdGender) setGender(stdGender);
    if (stdPob) setPob(stdPob);
    if (stdProvince) setProvince(stdProvince);
    if (stdIdDate) setIdDate(stdIdDate);
    if (stdIdPlace) setIdPlace(stdIdPlace);

    if (frontSrc) setCccdImage(frontSrc);
    if (backSrc) setCccdBackImage(backSrc);
    updateEkycCardImages(userKey, frontSrc, backSrc);

    // Tự động lưu và cập nhật đầy đủ lên API ngay sau khi quét
    try {
      setIsSaving(true);
      await skylineUpdateCccd({
        front: frontSrc,
        back: backSrc,
        number: stdIdNumber,
        date: stdIdDate,
        place: stdIdPlace,
        fullName: stdFullName,
        dob: stdDob,
        pob: stdPob,
        gender: stdGender === '1' ? 1 : 0,
      });

      const parts = stdFullName.split(' ');
      const firstname = parts.slice(-1)[0] || '';
      const lastname = parts.slice(0, -1).join(' ') || '';

      const updateRes = await skylineUpdateInfo({
        username: currentUser?.username || currentUser?.email || currentUser?.phone || userKey,
        firstname,
        lastname,
        fullname: stdFullName,
        phone: phone || currentUser?.phone || '',
        email: email || currentUser?.email || '',
        gender: stdGender === '1' ? 1 : 0,
        dob: stdDob,
        pob: stdPob,
        id_number: stdIdNumber,
        id_date: stdIdDate,
        id_place: stdIdPlace,
        province: stdProvince,
        intro: intro || '',
        license_plate: licensePlate || '',
      });

      if (updateRes.success && updateRes.user) {
        updateUserInfo({
          ...updateRes.user as any,
          id_card_no: stdIdNumber,
          id_number: stdIdNumber,
          full_name: stdFullName,
          fullname: stdFullName,
          dob: stdDob,
          pob: stdPob,
          id_date: stdIdDate,
          id_place: stdIdPlace,
          cccd_front_url: frontSrc,
          cccd_back_url: backSrc,
        });
        await refreshUser();
      }
    } catch (apiErr) {
      console.warn('Sync CCCD to API error:', apiErr);
    } finally {
      setIsSaving(false);
    }

    // Switch to tab 1 (Thông tin cá nhân) so the user can review all fields
    setActiveTab('EKYC');
    setIsEditingLegal(true);

    setEkycFeedback({
      type: 'success',
      message: '✨ Đã trích xuất chuẩn xác và tự động cập nhật lên hệ thống thành công! Bạn có thể kiểm tra lại thông tin và bấm "Gửi Ban Quản Lý Xác Nhận Chốt Hồ Sơ" khi hoàn tất.'
    });

    // Display clear notice that data is auto-filled and ready to be saved
    setOcrFilledNotice(true);
    setTimeout(() => setOcrFilledNotice(false), 8000);
  };

  // Feedback notification for e-KYC
  const [ekycFeedback, setEkycFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  const handleSubmitEkycToBql = async () => {
    setEkycFeedback(null);

    // 1. Kiểm tra điều kiện Căn cước công dân (Đã lưu riêng)
    if (!idCardNumber.trim() || !cccdImage || !cccdBackImage) {
      setEkycFeedback({
        type: 'warning',
        message: 'Vui lòng hoàn tất quét thẻ Căn cước công dân (đủ 2 mặt trước/sau và 12 số CCCD) trước khi chốt hồ sơ gửi Ban Quản Lý.'
      });
      return;
    }

    const cccdErr = getCccdValidationError(idCardNumber, isEn);
    if (cccdErr) {
      setEkycFeedback({
        type: 'warning',
        message: cccdErr
      });
      return;
    }

    // 2. Kiểm tra điều kiện FaceID 4 mẫu (Đã lưu riêng)
    if (!enrolledFaceProfile || !enrolledFaceProfile.samples?.front) {
      setEkycFeedback({
        type: 'warning',
        message: 'Vui lòng chụp đủ 4 góc khuôn mặt trước khi gửi hồ sơ cho Ban Quản Lý.'
      });
      return;
    }

    const currentAvatar = avatarUrl || currentUser.avatar_url || '';
    const faceSamples = enrolledFaceProfile.samples;

    setIsScanningOcr(true);
    try {
      const reqPayload = {
        userId: currentUser.id || currentUser.username || currentUser.phone || 'resident-user',
        fullName: fullName.trim() || currentUser.full_name,
        roleLabel: isOwner ? `Chủ Hộ (Căn ${aptCode})` : `Người Nhà (Căn ${aptCode})`,
        apartmentCode: aptCode,
        phone: phone.trim() || currentUser.phone || '',
        email: email.trim() || currentUser.email || '',
        idCardNo: idCardNumber.trim(),
        idDate: idDate,
        idPlace: idPlace,
        dob: birthday,
        pob: pob,
        avatarUrl: currentAvatar,
        idCardFrontUrl: cccdImage,
        idCardBackUrl: cccdBackImage || '',
        faceSamples,
        faceScore: enrolledFaceProfile?.faceScore || 0,
      };

      const req = submitEkycRequest(reqPayload);
      setCurrentEkyc(req);
      setEkycStatus('PENDING');
      setIsEditingLegal(false);

      // Đồng bộ tới máy chủ cho Ban Quản Lý thẩm định tức thì
      try {
        const res = await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT',
            ...reqPayload,
          }),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.warn('Server sync message:', resJson?.message);
        }
      } catch (apiErr) {
        console.warn('Sync ekyc submit API error:', apiErr);
      }

      // Phát sự kiện đồng bộ thời gian thực cho BQL
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('skyline_ekyc_updated', { detail: req }));
        window.dispatchEvent(new CustomEvent('skyline_faceid_enrolled', { detail: enrolledFaceProfile }));
      }

      setEkycFeedback({
        type: 'success',
        message: 'Đã gửi toàn bộ hồ sơ (CCCD 2 mặt & 4 góc khuôn mặt) tới VinHomes Manager thành công! Ban Quản Lý sẽ tiến hành đối soát và phê duyệt kích hoạt quyền ra vào chung cư.'
      });
    } finally {
      setIsScanningOcr(false);
    }
  };

  const profileResource = useAsyncResource(async () => {
    const res = await fetch('/api/user', { credentials: 'include' });
    if (!res.ok) throw new Error(`Không thể tải hồ sơ cá nhân & e-KYC (HTTP ${res.status})`);
    const json = await res.json();
    return json?.user || null;
  }, []);

  return {
    currentUser,
    t,
    isEn,
    updateUserInfo,
    refreshUser,
    isOwner,
    aptCode,
    missingApartment,
    fileInputRef,
    activeTab,
    setActiveTab,
    isOcrModalOpen,
    setIsOcrModalOpen,
    isAvatarModalOpen,
    setIsAvatarModalOpen,
    isCardViewerOpen,
    setIsCardViewerOpen,
    isFaceEnrollOpen,
    setIsFaceEnrollOpen,
    enrolledFaceProfile,
    setEnrolledFaceProfile,
    isLoadingApi,
    ocrFilledNotice,
    setOcrFilledNotice,
    fullName,
    setFullName,
    phone,
    setPhone,
    email,
    setEmail,
    gender,
    setGender,
    idCardNumber,
    setIdCardNumber,
    idDate,
    setIdDate,
    idPlace,
    setIdPlace,
    birthday,
    setBirthday,
    pob,
    setPob,
    province,
    setProvince,
    intro,
    setIntro,
    licensePlate,
    setLicensePlate,
    avatarUrl,
    setAvatarUrl,
    isSaving,
    savedSuccess,
    setSavedSuccess,
    saveError,
    setSaveError,
    isUploadingAvatar,
    ekycStatus,
    isEditingLegal,
    setIsEditingLegal,
    currentEkyc,
    isScanningOcr,
    cccdImage,
    setCccdImage,
    cccdBackImage,
    setCccdBackImage,
    matchScore,
    ekycFeedback,
    setEkycFeedback,
    handleSaveInfo,
    handleAvatarFileChange,
    handleApplyOcrData,
    handleSubmitEkycToBql,
    profileResource,
  };
}

export type ProfileEkycContext = ReturnType<typeof useProfileEkyc>;

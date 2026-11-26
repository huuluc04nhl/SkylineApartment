'use client';
import { getInitialsAvatar } from '@/lib/avatarHelper';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CreditCard, 
  Car, 
  Phone, 
  ScanFace, 
  User, 
  Sparkles, 
  Lock,
  Search,
  Check,
  CheckCircle,
  Clock,
  Camera,
  Upload,
  Calendar,
  MapPin,
  FileText,
  Eye,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Scan,
  Edit2,
  ZoomIn,
  Info,
  Mail,
  Crown,
  Filter
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  skylineGetFamilyMembers, 
  skylineAddFamilyMember, 
  skylineUpdateFamilyMember,
  skylineRemoveFamilyMember, 
  skylineSearchFamilyAccount,
  skylineConfirmFamilyFaceIdByOwner 
} from '@/lib/skylineApiClient';
import { 
  getEkycForUser, 
  submitEkycRequest, 
  EkycRequest 
} from '@/lib/ekycStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import { OcrCccdResult, formatToDateInput } from '@/lib/ocrParser';
import FaceEnrollModal from './FaceEnrollModal';
import { getEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { useLanguage } from '@/lib/languageContext';
import { toast } from '@/components/ui/Toast';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';
import { clearApartmentMembers } from '@/lib/userStore';
import { 
  cleanPhoneNumber, 
  isValidPhoneNumber, 
  getPhoneValidationError, 
  cleanCccdNumber, 
  isValidCccdNumber, 
  getCccdValidationError 
} from '@/lib/validationUtils';

export interface FamilyMemberItem {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'Family' | 'Tenant';
  relationship: string;
  idCard?: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  gender?: string;
  pob?: string;
  licensePlate?: string;
  vehicleType?: string;
  avatarUrl?: string;
  username?: string;
  faceStatus?: string;
  addedDate?: string;

  // TrÆ°á»ng thÃ´ng tin Ä‘á»“ng bá»™ vá»›i Chá»§ há»™:
  sponsorName?: string;
  sponsorPhone?: string;
  apartmentCode?: string;
  residenceType?: string;
  temporaryResidenceStatus?: string;
  relationshipProof?: string;
  accessLevel?: string;
  emergencyContact?: string;
  note?: string;
}

export interface BqlEligibleAccount {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone: string;
  idCard: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  gender?: string;
  pob?: string;
  licensePlate?: string;
  avatarUrl?: string;
  role: 'Family';
  relationship?: string;
  isAdded?: boolean;
}

interface FamilyMembersProps {
  currentUser: UserType;
}

export default function FamilyMembers({ currentUser }: FamilyMembersProps) {
  const { t, isEn } = useLanguage();
  const aptCode = currentUser.apartment_code || 'CH-06';
  const isOwner = currentUser.role === 'OWNER';
  const ownerName = currentUser.full_name || (currentUser as any)?.fullname || 'Tráº§n Há»¯u Lá»±c';

  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [bqlAccounts, setBqlAccounts] = useState<BqlEligibleAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'PRE_APPROVED' | 'SEARCH_API' | 'DIRECT_INPUT'>('PRE_APPROVED');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [faceEnrollTarget, setfaceEnrollTarget] = useState<FamilyMemberItem | null>(null);
  const [confirmTargetMember, setConfirmTargetMember] = useState<FamilyMemberItem | null>(null);
  const [isConfirmingFace, setIsConfirmingFace] = useState<boolean>(false);

  // Live Owner Data & Filter State
  const [ownerData, setOwnerData] = useState<any>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');
  const [memberFilterStatus, setMemberFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'NO_FACE'>('ALL');

  // Direct Add Member State (Tab 3)
  const [directFullName, setDirectFullName] = useState<string>('');
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directIdCard, setDirectIdCard] = useState<string>('');
  const [directRelationship, setDirectRelationship] = useState<string>('Vá»£ / Chá»“ng');
  const [directLicensePlate, setDirectLicensePlate] = useState<string>('');

  // Selected Account from API
  const [selectedAccount, setSelectedAccount] = useState<BqlEligibleAccount | null>(null);
  const [newRelationship, setNewRelationship] = useState<string>('Vá»£ / Chá»“ng');
  const [newLicensePlate, setNewLicensePlate] = useState<string>('');

  // Live API Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<BqlEligibleAccount | null>(null);
  const [searchResults, setSearchResults] = useState<BqlEligibleAccount[]>([]);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);
  const [preApprovedFilter, setPreApprovedFilter] = useState<string>('');

  // New fields suitable for owner-family relationship
  const [newResidenceType, setNewResidenceType] = useState<string>('ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™');
  const [newRelationshipProof, setNewRelationshipProof] = useState<string>('Sá»• Há»™ Kháº©u / XÃ¡c nháº­n CT07');
  const [newTemporaryResidenceStatus, setNewTemporaryResidenceStatus] = useState<string>('Äang LÃ m Thá»§ Tá»¥c');
  const [directDob, setDirectDob] = useState<string>('');
  const [directGender, setDirectGender] = useState<string>('Nam');
  const [directPob, setDirectPob] = useState<string>('');
  const [directResidenceType, setDirectResidenceType] = useState<string>('ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™');
  const [directRelationshipProof, setDirectRelationshipProof] = useState<string>('Sá»• Há»™ Kháº©u / XÃ¡c nháº­n CT07');
  const [directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus] = useState<string>('Äang LÃ m Thá»§ Tá»¥c');
  const [directVehicleType, setDirectVehicleType] = useState<string>('Xe mÃ¡y');

  // Custom Remove Member Confirmation State
  const [removeTargetMember, setRemoveTargetMember] = useState<FamilyMemberItem | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [isClearDataConfirmOpen, setIsClearDataConfirmOpen] = useState<boolean>(false);

  // Clear local temporary cache and re-sync strictly from API
  const handleClearLocalData = () => {
    setIsClearDataConfirmOpen(true);
  };

  const executeClearLocalData = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/user/family?aptCode=${encodeURIComponent(aptCode)}&action=CLEAR_LOCAL`);
      clearApartmentMembers(aptCode);
      await fetchMembers();
      setActionSuccess(isEn ? 'âœ“ Cleared local cache and synchronized with API.' : 'âœ“ ÄÃ£ dá»n dáº¹p dá»¯ liá»‡u lÆ°u táº¡m á»Ÿ local vÃ  Ä‘á»“ng bá»™ láº¡i tá»« API thÃ nh cÃ´ng.');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (e) {
      console.warn('Clear local data error', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Lightbox Zoom for Angle Samples
  const [selectedAnglePreview, setSelectedAnglePreview] = useState<{ title: string; src: string } | null>(null);

  // =========================================================================
  // OWNER PROXY e-KYC MODAL STATE (Chá»§ há»™ kÃª khai há»“ sÆ¡ cho ngÆ°á»i nhÃ )
  // =========================================================================
  const [showEkycModal, setShowEkycModal] = useState<boolean>(false);
  const [ekycTargetMember, setEkycTargetMember] = useState<FamilyMemberItem | null>(null);
  const [ekycFullName, setEkycFullName] = useState<string>('');
  const [ekycRelationship, setEkycRelationship] = useState<string>('Vá»£ / Chá»“ng');
  const [ekycPhone, setEkycPhone] = useState<string>('');
  const [ekycIdCard, setEkycIdCard] = useState<string>('');
  const [ekycDob, setEkycDob] = useState<string>('');
  const [ekycPob, setEkycPob] = useState<string>('');
  const [ekycIdDate, setEkycIdDate] = useState<string>('');
  const [ekycIdPlace, setEkycIdPlace] = useState<string>('');
  const [ekycLicensePlate, setEkycLicensePlate] = useState<string>('');
  const [ekycAvatarUrl, setEkycAvatarUrl] = useState<string>('');
  const [ekycFrontImage, setEkycFrontImage] = useState<string>('');
  const [ekycBackImage, setEkycBackImage] = useState<string>('');
  const [isSubmittingEkyc, setIsSubmittingEkyc] = useState<boolean>(false);
  const [ekycModalError, setEkycModalError] = useState<string | null>(null);
  const [isMemberOcrModalOpen, setIsMemberOcrModalOpen] = useState<boolean>(false);

  const handleApplyMemberOcrData = (ocrData: OcrCccdResult, frontSrc: string, backSrc: string) => {
    const stdIdNumber = (ocrData.idNumber || '').replace(/\D/g, '').slice(0, 12);
    const stdFullName = (ocrData.fullName || '').toUpperCase().trim();
    const stdDob = formatToDateInput(ocrData.dob || '');
    const stdPob = (ocrData.pob || '').trim();
    const stdIdDate = formatToDateInput(ocrData.idDate || '');
    const stdIdPlace = (ocrData.idPlace || 'Cá»¥c Cáº£nh sÃ¡t QLHC vá» TTXH').trim();

    if (stdFullName) setEkycFullName(stdFullName);
    if (stdIdNumber) setEkycIdCard(stdIdNumber);
    if (stdDob) setEkycDob(stdDob);
    if (stdPob) setEkycPob(stdPob);
    if (stdIdDate) setEkycIdDate(stdIdDate);
    if (stdIdPlace) setEkycIdPlace(stdIdPlace);
    if (frontSrc) setEkycFrontImage(frontSrc);
    if (backSrc) setEkycBackImage(backSrc);
    setIsMemberOcrModalOpen(false);
    setEkycModalError(null);
    setActionSuccess(
      isEn
        ? `âœ¨ Successfully read Citizen ID for "${stdFullName || 'member'}"! All details verified and populated into the form.`
        : `âœ¨ ÄÃ£ Ä‘á»c thÃ´ng tin CCCD thÃ nh cÃ´ng cho "${stdFullName || 'thÃ nh viÃªn'}"! ToÃ n bá»™ thÃ´ng tin Ä‘Ã£ Ä‘Æ°á»£c chuáº©n hÃ³a vÃ  tá»± Ä‘á»™ng Ä‘iá»n vÃ o há»“ sÆ¡.`
    );
    setTimeout(() => setActionSuccess(null), 5000);
  };

  // Camera capture inside e-KYC modal
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputFrontRef = useRef<HTMLInputElement | null>(null);
  const fileInputBackRef = useRef<HTMLInputElement | null>(null);
  const fileInputAvatarRef = useRef<HTMLInputElement | null>(null);

  // Helper to query e-KYC request of any member
  const getMemberEkyc = (m: FamilyMemberItem): EkycRequest | undefined => {
    return (
      getEkycForUser(m.id) ||
      getEkycForUser(m.phone) ||
      (m.idCard ? getEkycForUser(m.idCard) : undefined) ||
      (m.username ? getEkycForUser(m.username) : undefined)
    );
  };

  // Helper to normalize unified e-KYC status
  const getMemberStatus = (m: FamilyMemberItem): 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED' | 'PENDING_OWNER' => {
    const profile = getEnrolledFaceProfile(m.phone || m.id || m.username || '');
    if (m.faceStatus?.includes('Chá» Chá»§ Há»™') || m.faceStatus?.includes('Chá» chá»§ há»™') || profile?.status === 'PENDING_OWNER') {
      return 'PENDING_OWNER';
    }
    const ekyc = getMemberEkyc(m);
    if (ekyc?.status === 'APPROVED' || ekyc?.status === 'VERIFIED') return 'APPROVED';
    if (ekyc?.status === 'PENDING') return 'PENDING';
    if (ekyc?.status === 'REJECTED') return 'REJECTED';
    if (m.faceStatus?.includes('Chá»')) return 'PENDING';
    if (m.faceStatus?.includes('KÃ­ch Hoáº¡t') || m.faceStatus?.includes('ÄÃ£ kÃ­ch hoáº¡t')) return 'APPROVED';
    if (m.faceStatus?.includes('Tá»« Chá»‘i') || m.faceStatus?.includes('Chá»¥p Láº¡i')) return 'REJECTED';
    return 'NOT_SUBMITTED';
  };

  // Load Family Members & Pre-verified API Accounts (100% qua API)
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await skylineGetFamilyMembers();
      if (res.success) {
        if (res.members) {
          setMembers(res.members);
        }
        if (res.bqlAccounts) {
          setBqlAccounts(res.bqlAccounts);
        }
        if (res.owner) {
          setOwnerData(res.owner);
        }
      }
    } catch (err) {
      console.warn('Load family API error:', err);
      setBqlAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Listen to real-time e-KYC, FaceID & BQL Family Member changes
    const handleSyncUpdated = () => {
      fetchMembers();
    };
    window.addEventListener('skyline_ekyc_updated', handleSyncUpdated);
    window.addEventListener('skyline_faceid_enrolled', handleSyncUpdated);
    window.addEventListener('skyline_family_updated', handleSyncUpdated);
    return () => {
      window.removeEventListener('skyline_ekyc_updated', handleSyncUpdated);
      window.removeEventListener('skyline_faceid_enrolled', handleSyncUpdated);
      window.removeEventListener('skyline_family_updated', handleSyncUpdated);
    };
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Attach video stream when camera state activates
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Camera video autoplay error:', err);
      });
    }
  }, [isCameraActive]);

  // =========================================================================
  // CAMERA & FILE UPLOAD HANDLERS
  // =========================================================================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.warn('KhÃ´ng thá»ƒ má»Ÿ camera:', err);
      setIsCameraActive(false);
      toast.error('KhÃ´ng thá»ƒ kÃ­ch hoáº¡t Camera trÃªn thiáº¿t bá»‹ nÃ y. Báº¡n cÃ³ thá»ƒ chá»n táº£i áº£nh chÃ¢n dung trá»±c tiáº¿p tá»« tá»‡p tin.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setEkycAvatarUrl(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEkycModalError('Tá»‡p táº£i lÃªn khÃ´ng pháº£i lÃ  áº£nh há»£p lá»‡ (cháº¥p nháº­n JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        setEkycModalError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCccdUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'FRONT' | 'BACK',
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEkycModalError('Tá»‡p táº£i lÃªn khÃ´ng pháº£i lÃ  áº£nh há»£p lá»‡ (cháº¥p nháº­n JPEG, PNG, WEBP).');
      return;
    }

    if (file.size < 15000) {
      setEkycModalError('áº¢nh chá»¥p tháº» CCCD quÃ¡ má» hoáº·c dung lÆ°á»£ng quÃ¡ nhá» (dÆ°á»›i 15KB). Vui lÃ²ng táº£i áº£nh rÃµ nÃ©t.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio < 1.22) {
            setEkycModalError(`áº¢nh táº£i lÃªn lÃ  áº£nh dá»c (tá»· lá»‡ ${ratio.toFixed(2)}:1). Tháº» CÄƒn cÆ°á»›c cÃ´ng dÃ¢n pháº£i lÃ  áº£nh chá»¥p ngang bao gá»“m Ä‘á»§ 4 gÃ³c tháº» (tá»· lá»‡ chuáº©n ~1.58:1). KhÃ´ng Ä‘Æ°á»£c sá»­ dá»¥ng áº£nh selfie dá»c!`);
            return;
          }
          if (ratio > 2.05) {
            setEkycModalError(`áº¢nh bá»‹ cáº¯t xÃ©n quÃ¡ dÃ i (tá»· lá»‡ ${ratio.toFixed(2)}:1). Vui lÃ²ng chá»¥p trá»n váº¹n 4 gÃ³c tháº» CCCD.`);
            return;
          }
          if (img.width < 380 || img.height < 240) {
            setEkycModalError(`Äá»™ phÃ¢n giáº£i áº£nh quÃ¡ tháº¥p (${img.width}x${img.height}px). YÃªu cáº§u tá»‘i thiá»ƒu 400x250px.`);
            return;
          }

          setter(dataUrl);
          setEkycModalError(null);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // MODAL OPEN / CLOSE HANDLERS
  // =========================================================================
  const handleOpenEkycModal = (member: FamilyMemberItem) => {
    const existing = getMemberEkyc(member);
    const profile = getEnrolledFaceProfile(member.phone || member.id || member.username || '');
    setEkycTargetMember(member);
    setEkycFullName(existing?.fullName || member.fullName || '');
    setEkycRelationship(member.relationship || 'Vá»£ / Chá»“ng');
    setEkycPhone(existing?.phone || member.phone || '');
    setEkycIdCard(existing?.idCardNo || member.idCard || '');
    setEkycDob(existing?.dob || member.dob || '');
    setEkycPob(existing?.pob || member.pob || '');
    setEkycIdDate(existing?.idDate || member.idDate || '');
    setEkycIdPlace(existing?.idPlace || member.idPlace || '');
    setEkycLicensePlate(member.licensePlate || '');

    // Æ¯u tiÃªn hiá»ƒn thá»‹ chÃ¢n dung chuáº©n cá»§a ngÆ°á»i nhÃ  (tuyá»‡t Ä‘á»‘i khÃ´ng láº¥y áº£nh máº«u FaceID ghi Ä‘Ã¨ chÃ¢n dung)
    let resolvedAvatar = '';
    if (existing?.avatarUrl && !existing.avatarUrl.includes('default.png') && !existing.avatarUrl.startsWith('data:image/')) {
      resolvedAvatar = existing.avatarUrl;
    } else if (member.avatarUrl && !member.avatarUrl.includes('default.png') && !member.avatarUrl.startsWith('data:image/')) {
      resolvedAvatar = member.avatarUrl;
    } else if (profile?.avatarUrl && !profile.avatarUrl.includes('default.png') && !profile.avatarUrl.startsWith('data:image/')) {
      resolvedAvatar = profile.avatarUrl;
    } else {
      resolvedAvatar = getInitialsAvatar('Skyline Resident');
    }
    setEkycAvatarUrl(resolvedAvatar);

    setEkycFrontImage(existing?.idCardFrontUrl || '');
    setEkycBackImage(existing?.idCardBackUrl || '');
    setEkycModalError(null);
    setIsCameraActive(false);
    setShowEkycModal(true);
  };

  const handleCloseEkycModal = () => {
    stopCamera();
    setShowEkycModal(false);
    setEkycTargetMember(null);
  };

  // =========================================================================
  // SUBMIT OWNER PROXY e-KYC TO BQL
  // =========================================================================
  const handleSubmitMemberEkyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekycTargetMember) return;

    if (!ekycFullName.trim()) {
      setEkycModalError('Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ há» vÃ  tÃªn ngÆ°á»i nhÃ .');
      return;
    }
    const phoneErr = getPhoneValidationError(ekycPhone);
    if (phoneErr) {
      setEkycModalError(phoneErr);
      return;
    }
    const cccdErr = getCccdValidationError(ekycIdCard);
    if (cccdErr) {
      setEkycModalError(cccdErr);
      return;
    }

    // 1. Kiá»ƒm tra áº£nh {t('CCCD Máº·t TrÆ°á»›c', 'National ID Front')}
    if (ekycFrontImage) {
      const frontCheck = validateCccdCard(ekycFrontImage, 'FRONT');
      if (!frontCheck.valid) {
        setEkycModalError(frontCheck.error || (isEn ? 'National ID Front photo is invalid.' : 'áº¢nh CCCD Máº·t TrÆ°á»›c khÃ´ng Ä‘Ãºng tiÃªu chuáº©n.'));
        return;
      }
    }

    // 2. Kiá»ƒm tra áº£nh {t('CCCD Máº·t Sau', 'National ID Back')}
    if (ekycBackImage) {
      const backCheck = validateCccdCard(ekycBackImage, 'BACK');
      if (!backCheck.valid) {
        setEkycModalError(backCheck.error || (isEn ? 'National ID Back photo is invalid.' : 'áº¢nh CCCD Máº·t Sau khÃ´ng Ä‘Ãºng tiÃªu chuáº©n.'));
        return;
      }
    }

    // 3. Äá»‘i chiáº¿u sinh tráº¯c há»c: áº¢nh ChÃ¢n Dung vs áº¢nh Tháº» CCCD (Thuáº­t toÃ¡n tháº­t)
    let calculatedFaceScore = 0;
    let isSimulatedBio = false;
    let bioAlgorithm = 'PERCEPTUAL_COSINE_SIMILARITY';
    if (ekycAvatarUrl && ekycFrontImage) {
      const bioCheck = verifyFaceWithCccd(ekycAvatarUrl, ekycFrontImage);
      calculatedFaceScore = bioCheck.score;
      isSimulatedBio = !!bioCheck.isSimulation;
      bioAlgorithm = bioCheck.algorithm || 'PERCEPTUAL_COSINE_SIMILARITY';
      if (!bioCheck.matched) {
        setEkycModalError(bioCheck.reason);
        return;
      }
    }

    setIsSubmittingEkyc(true);
    setEkycModalError(null);

    try {
      const roleLabel = `NgÆ°á»i NhÃ  (CÄƒn ${aptCode}) - Báº£o lÃ£nh bá»Ÿi Chá»§ Há»™: ${ownerName}`;

      const payload = {
        userId: ekycTargetMember.id || ekycTargetMember.phone,
        fullName: ekycFullName.trim(),
        roleLabel,
        apartmentCode: aptCode,
        phone: ekycPhone.trim(),
        idCardNo: ekycIdCard.trim(),
        idDate: ekycIdDate.trim(),
        idPlace: ekycIdPlace.trim(),
        dob: ekycDob.trim(),
        pob: ekycPob.trim(),
        avatarUrl: ekycAvatarUrl,
        idCardFrontUrl: ekycFrontImage,
        idCardBackUrl: ekycBackImage,
        faceScore: calculatedFaceScore,
        isSimulation: isSimulatedBio,
        algorithm: bioAlgorithm,
      };

      // 1. Submit to local e-KYC Store
      submitEkycRequest(payload);

      // 2. Submit to Server API
      try {
        await fetch('/api/ekyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SUBMIT',
            ...payload,
          }),
        });
      } catch (apiErr) {
        console.warn('API ekyc submit error:', apiErr);
      }

      // 3. Update local state
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === ekycTargetMember.id || m.phone === ekycTargetMember.phone) {
            return {
              ...m,
              fullName: ekycFullName.trim(),
              relationship: ekycRelationship,
              phone: ekycPhone.trim(),
              idCard: ekycIdCard.trim(),
              avatarUrl: ekycAvatarUrl,
              licensePlate: ekycLicensePlate.trim() || m.licensePlate,
              faceStatus: 'Äang Chá» BQL PhÃª Duyá»‡t',
            };
          }
          return m;
        })
      );

      // 4. Feedback
      setActionSuccess(
        isEn
          ? `âœ“ Identity & face photo records for family member "${ekycFullName}" successfully submitted to Management Office! Pending review.`
          : `âœ“ ÄÃ£ gá»­i thÃ´ng tin cÄƒn cÆ°á»›c & khuÃ´n máº·t cá»§a ngÆ°á»i nhÃ  "${ekycFullName}" lÃªn Ban Quáº£n LÃ½ thÃ nh cÃ´ng! Há»“ sÆ¡ Ä‘ang chá» Ban Quáº£n LÃ½ phÃª duyá»‡t.`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      handleCloseEkycModal();
      fetchMembers();
    } catch (err: any) {
      setEkycModalError(err.message || (isEn ? 'Error submitting data to Management Office.' : 'Lá»—i khi gá»­i thÃ´ng tin lÃªn Ban Quáº£n LÃ½.'));
    } finally {
      setIsSubmittingEkyc(false);
    }
  };

  // Select account from pre-verified list
  const handleSelectPreApproved = (acc: BqlEligibleAccount) => {
    setSelectedAccount(acc);
    setNewRelationship(acc.relationship || 'Vá»£ / Chá»“ng');
    setNewLicensePlate(acc.licensePlate || '');
    setActionError(null);
  };

  // Search account via live API with client fallback
  const handleSearchApi = async (e?: React.FormEvent, directQ?: string) => {
    if (e) e.preventDefault();
    const query = (directQ !== undefined ? directQ : searchQuery).trim();
    if (!query) return;

    setIsSearchingApi(true);
    setSearchNotFound(null);
    setSearchResult(null);
    setSearchResults([]);
    setActionError(null);

    try {
      const res = await skylineSearchFamilyAccount(query);
      if (res.success && res.found) {
        const list = Array.isArray((res as any).accounts) && (res as any).accounts.length > 0
          ? (res as any).accounts
          : res.account ? [res.account] : [];
        if (list.length > 0) {
          setSearchResults(list);
          setSearchResult(list[0]);
          setSelectedAccount(list[0]);
          setNewRelationship(list[0].relationship || 'Vá»£ / Chá»“ng');
          setNewLicensePlate(list[0].licensePlate || '');
        } else {
          setSearchNotFound(isEn ? `No registered family account matching "${query}".` : `KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n ngÆ°á»i nhÃ  nÃ o khá»›p vá»›i "${query}".`);
        }
      } else {
        setSearchResults([]);
        setSearchResult(null);
        setSelectedAccount(null);
        setSearchNotFound(
          res.message || (isEn 
            ? `No registered family account matching "${query}" on the system.` 
            : `KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n ngÆ°á»i thÃ¢n nÃ o khá»›p vá»›i "${query}" trÃªn há»‡ thá»‘ng.`)
        );
      }
    } catch (err) {
      setSearchNotFound(isEn ? 'Connection error while searching for account.' : 'Lá»—i káº¿t ná»‘i khi tra cá»©u ngÆ°á»i dÃ¹ng.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Submit Add Member strictly via API
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setActionError(isEn ? 'Please select or search a valid account from the API system.' : 'Vui lÃ²ng chá»n hoáº·c tra cá»©u má»™t tÃ i khoáº£n há»£p lá»‡ tá»« há»‡ thá»‘ng API.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await skylineAddFamilyMember({
        accountId: selectedAccount.id,
        username: selectedAccount.username,
        phone: selectedAccount.phone,
        fullName: selectedAccount.fullName,
        idCard: selectedAccount.idCard,
        licensePlate: newLicensePlate.trim() || selectedAccount.licensePlate,
        avatarUrl: selectedAccount.avatarUrl,
        relationship: newRelationship,
        residenceType: newResidenceType,
        temporaryResidenceStatus: newTemporaryResidenceStatus,
        relationshipProof: newRelationshipProof,
        dob: selectedAccount.dob,
        gender: selectedAccount.gender,
        pob: selectedAccount.pob,
      } as any);

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(
          isEn
            ? `âœ“ Added family member "${selectedAccount.fullName}" to Unit ${aptCode} via API profile successfully!`
            : `âœ“ ÄÃ£ thÃªm thÃ nh viÃªn "${selectedAccount.fullName}" vÃ o CÄƒn há»™ ${aptCode} theo há»“ sÆ¡ API thÃ nh cÃ´ng!`
        );
        setTimeout(() => setActionSuccess(null), 4000);

        // Reset
        setSelectedAccount(null);
        setSearchResult(null);
        setSearchQuery('');
        setNewRelationship('Vá»£ / Chá»“ng');
        setNewLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Failed to add member. Please try again.' : 'KhÃ´ng thá»ƒ thÃªm thÃ nh viÃªn. Vui lÃ²ng thá»­ láº¡i.'));
      }
    } catch (err: any) {
      setActionError(err.message || (isEn ? 'API connection error when adding member.' : 'Lá»—i káº¿t ná»‘i API khi thÃªm thÃ nh viÃªn.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Custom Revoke Modal
  const handlePromptRemoveMember = (member: FamilyMemberItem) => {
    setRemoveTargetMember(member);
  };

  // Execute Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!removeTargetMember) return;
    setIsRemoving(true);
    try {
      const res = await skylineRemoveFamilyMember(removeTargetMember.id);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== removeTargetMember.id));
        setActionSuccess(
          isEn
            ? `âœ“ Revoked residency authorization & FaceID access for member "${removeTargetMember.fullName}".`
            : `âœ“ ÄÃ£ há»§y phÃ¢n quyá»n cÆ° trÃº & thu há»“i quyá»n FaceID cá»§a thÃ nh viÃªn "${removeTargetMember.fullName}".`
        );
        setTimeout(() => setActionSuccess(null), 4000);
        setRemoveTargetMember(null);
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Could not remove member.' : 'KhÃ´ng thá»ƒ xÃ³a thÃ nh viÃªn.'));
      }
    } catch (err) {
      setActionError(isEn ? 'Connection error while removing member.' : 'Lá»—i káº¿t ná»‘i khi xÃ³a thÃ nh viÃªn.');
    } finally {
      setIsRemoving(false);
    }
  };

  // Submit Add Member directly (Mode 3: Direct Input)
  const handleDirectAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directFullName.trim()) {
      setActionError(isEn ? 'Please enter member full name.' : 'Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ há» vÃ  tÃªn ngÆ°á»i thÃ¢n.');
      return;
    }
    const phoneErr = getPhoneValidationError(directPhone, isEn);
    if (phoneErr) {
      setActionError(phoneErr);
      return;
    }
    if (directIdCard && directIdCard.trim()) {
      const cccdErr = getCccdValidationError(directIdCard, isEn);
      if (cccdErr) {
        setActionError(cccdErr);
        return;
      }
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await skylineAddFamilyMember({
        fullName: directFullName.trim(),
        phone: directPhone.trim(),
        idCard: directIdCard.trim(),
        relationship: directRelationship,
        licensePlate: directLicensePlate.trim(),
        avatarUrl: 'https://ui-avatars.com/api/?name=User&background=1C2533&color=C5A880&bold=true',
        residenceType: directResidenceType,
        temporaryResidenceStatus: directTemporaryResidenceStatus,
        relationshipProof: directRelationshipProof,
        dob: directDob,
        gender: directGender,
        pob: directPob,
        vehicleType: directVehicleType,
      } as any);

      if (res.success && res.members) {
        setMembers(res.members);
        setShowAddModal(false);
        setActionSuccess(
          isEn
            ? `âœ“ Added member "${directFullName}" to Unit ${aptCode}! You can now enroll FaceID and scan Citizen ID.`
            : `âœ“ ÄÃ£ thÃªm thÃ nh viÃªn "${directFullName}" vÃ o CÄƒn há»™ ${aptCode}! Báº¡n cÃ³ thá»ƒ tiáº¿n hÃ nh quÃ©t FaceID vÃ  chá»¥p CCCD ngay.`
        );
        setTimeout(() => setActionSuccess(null), 5000);

        // Reset
        setDirectFullName('');
        setDirectPhone('');
        setDirectIdCard('');
        setDirectRelationship('Vá»£ / Chá»“ng');
        setDirectLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Failed to add member. Please try again.' : 'KhÃ´ng thá»ƒ thÃªm thÃ nh viÃªn. Vui lÃ²ng thá»­ láº¡i.'));
      }
    } catch (err: any) {
      setActionError(err.message || (isEn ? 'API connection error when adding member.' : 'Lá»—i káº¿t ná»‘i API khi thÃªm thÃ nh viÃªn.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregate metrics correctly using unified helper
  const totalApproved = members.filter((m) => getMemberStatus(m) === 'APPROVED').length;
  const totalPendingOwner = members.filter((m) => getMemberStatus(m) === 'PENDING_OWNER').length;
  const totalPendingBql = members.filter((m) => getMemberStatus(m) === 'PENDING').length;
  const totalVehicles = ((currentUser.license_plate || ownerData?.licensePlate) ? 1 : 0) + members.filter((m) => m.licensePlate).length;
  const totalResidents = 1 + members.length;

  // Real-time filtered members by search term and status
  const filteredMembers = members.filter((m) => {
    if (memberSearchTerm.trim()) {
      const term = memberSearchTerm.toLowerCase().trim();
      const matchName = m.fullName.toLowerCase().includes(term);
      const matchPhone = m.phone.includes(term);
      const matchCccd = m.idCard?.includes(term);
      const matchRel = m.relationship?.toLowerCase().includes(term);
      const matchPlate = m.licensePlate?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchCccd && !matchRel && !matchPlate) {
        return false;
      }
    }
    const status = getMemberStatus(m);
    const hasFace = !!getEnrolledFaceProfile(m.phone || m.id || m.username || '');
    if (memberFilterStatus === 'APPROVED') {
      return status === 'APPROVED';
    }
    if (memberFilterStatus === 'PENDING') {
      return status === 'PENDING' || status === 'PENDING_OWNER';
    }
    if (memberFilterStatus === 'NO_FACE') {
      return !hasFace;
    }
    return true;
  });

  const familyResource = useAsyncResource(async () => {
    const res = await fetch('/api/user/family', { credentials: 'include' });
    if (!res.ok) throw new Error(`KhÃ´ng thá»ƒ táº£i danh sÃ¡ch nhÃ¢n kháº©u (HTTP ${res.status})`);
    const json = await res.json();
    return Array.isArray(json?.members) ? json.members : [];
  }, []);

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {familyResource.loading && <ResourceSkeleton label="Äang táº£i danh sÃ¡ch nhÃ¢n kháº©u..." />}
      {!familyResource.loading && familyResource.error && (
        <ResourceError message={familyResource.error} onRetry={familyResource.retry} />
      )}
      {!familyResource.loading && !familyResource.error && members.length === 0 && (
        <ResourceEmpty message="ChÆ°a cÃ³ thÃ nh viÃªn nÃ o Ä‘Æ°á»£c Ä‘Äƒng kÃ½ trong cÄƒn há»™." />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {t('Quáº£n Trá»‹ CÄƒn Há»™')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('NhÃ¢n Kháº©u')} â€¢ {t('CÄƒn')} {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('Chá»§ há»™:')} <strong className="text-[#C5A880]">{ownerName}</strong> â€¢ {t('CÄƒn')} <strong className="text-white font-mono">{aptCode}</strong>
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setfaceEnrollTarget({
                  id: currentUser.id || 'usr-120',
                  fullName: currentUser.full_name || 'Tráº§n Há»¯u Lá»±c',
                  phone: currentUser.phone || '',
                  email: currentUser.email || 'huuluc04@gmail.com',
                  role: 'Family',
                  relationship: 'Chá»§ Há»™ (Chá»§ Sá»Ÿ Há»¯u)',
                });
              }}
              className="px-3 py-2 bg-[#161D26] hover:bg-[#1E2631] border border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              title={isEn ? 'Rescan Primary Resident FaceID' : 'QuÃ©t láº¡i FaceID Chá»§ Há»™'}
            >
              <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t('QuÃ©t FaceID')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(true);
                setSelectedAccount(null);
                setSearchResult(null);
                setActionError(null);
              }}
              className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-none shadow flex-shrink-0 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> {t('ThÃªm ThÃ nh ViÃªn')}
            </button>
          </div>
        )}
      </div>

      {/* Success Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 rounded-none animate-fadeIn shadow">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Overview Stats Bar: 5-Card Clean Modern Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
            <span>{t('NhÃ¢n Kháº©u', 'Total Residents')}</span>
            <Users className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-white mt-1 flex items-baseline gap-1.5">
            <span>{totalResidents}</span>
            <span className="text-xs text-gray-400 font-normal">{t('ngÆ°á»i', 'residents')}</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center justify-between">
            <span>{t('ÄÃ£ FaceID', 'FaceID Enrolled')}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {1 + totalApproved} <span className="text-xs font-sans text-gray-400 font-normal">{t('ngÆ°á»i', 'residents')}</span>
          </div>
        </div>

        {/* Highlighted Pending Owner Stat Card */}
        <div className={`p-3.5 rounded-none transition-all ${
          totalPendingOwner > 0
            ? 'bg-amber-950/40 border-2 border-amber-500 animate-pulse'
            : 'bg-[#121820] border border-[#222B35]'
        }`}>
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold flex items-center justify-between">
            <span>{t('Chá» Duyá»‡t', 'Pending Review')}</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-1 flex items-baseline gap-1.5">
            <span>{totalPendingOwner}</span>
            <span className="text-xs font-sans text-gray-400 font-normal">{t('há»“ sÆ¡', 'profiles')}</span>
            {totalPendingOwner > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-[#0D1117] font-bold uppercase">
                {t('Cáº§n duyá»‡t', 'Action needed')}
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center justify-between">
            <span>{t('Chá» BQL', 'Pending Mgmt')}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-cyan-400 mt-1">
            {totalPendingBql} <span className="text-xs font-sans text-gray-400 font-normal">{t('há»“ sÆ¡', 'profiles')}</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold flex items-center justify-between">
            <span>{t('PhÆ°Æ¡ng Tiá»‡n', 'Vehicles')}</span>
            <Car className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-purple-400 mt-1">
            {totalVehicles} <span className="text-xs font-sans text-gray-400 font-normal">{t('xe', 'vehicles')}</span>
          </div>
        </div>
      </div>

      {/* Owner Action Alert Banner when members are PENDING_OWNER */}
      {isOwner && totalPendingOwner > 0 && (
        <div className="p-3.5 bg-amber-950/80 border border-amber-500 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0 text-amber-300">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {t('Cáº§n duyá»‡t FaceID ngÆ°á»i nhÃ ', 'Pending Family FaceID Review')} ({totalPendingOwner})
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                ThÃ nh viÃªn Ä‘Ã£ quÃ©t Ä‘á»§ 4 máº«u FaceID. Vui lÃ²ng kiá»ƒm tra vÃ  duyá»‡t Ä‘á»ƒ BQL kÃ­ch hoáº¡t.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
            {(() => {
              const pendingMember = members.find((m) => getMemberStatus(m) === 'PENDING_OWNER');
              return pendingMember ? (
                <button
                  type="button"
                  onClick={() => setConfirmTargetMember(pendingMember)}
                  className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Duyá»‡t Ngay ({pendingMember.fullName})
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-[#121820] border border-[#222B35] rounded-none overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-[#222B35] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C5A880]" /> ThÃ nh ViÃªn CÄƒn Há»™ ({members.length})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder={isEn ? "Search member, phone..." : "TÃ¬m kiáº¿m thÃ nh viÃªn, SÄT..."}
                className="bg-[#161B22] border border-[#2D3748] pl-8 pr-7 py-1.5 text-white text-xs rounded-none focus:border-[#C5A880] outline-none w-36 sm:w-44 font-sans"
              />
              {memberSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMemberSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  âœ•
                </button>
              )}
            </div>

            {/* Filter Status */}
            <select
              value={memberFilterStatus}
              onChange={(e) => setMemberFilterStatus(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] px-2 py-1.5 text-xs text-gray-200 rounded-none focus:border-[#C5A880] outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? `All (${members.length})` : `Táº¥t cáº£ (${members.length})`}</option>
              <option value="APPROVED">{isEn ? `FaceID Active (${totalApproved})` : `ÄÃ£ FaceID (${totalApproved})`}</option>
              <option value="PENDING">{isEn ? `Pending (${totalPendingOwner + totalPendingBql})` : `Chá» duyá»‡t (${totalPendingOwner + totalPendingBql})`}</option>
              <option value="NO_FACE">{isEn ? 'No FaceID' : 'ChÆ°a FaceID'}</option>
            </select>

            <button
              onClick={fetchMembers}
              disabled={isLoading}
              title={isEn ? "Refresh member list" : "LÃ m má»›i danh sÃ¡ch thÃ nh viÃªn"}
              className="text-xs text-gray-300 hover:text-[#C5A880] flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 bg-[#161B22] border border-[#2D3748] rounded-none hover:border-[#C5A880]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> {isEn ? 'Refresh' : 'LÃ m má»›i'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-xs text-[#C5A880] font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Äang táº£i dá»¯ liá»‡u...
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>{t('ChÆ°a cÃ³ thÃ nh viÃªn nÃ o trong cÄƒn há»™', 'No members found in unit')} {aptCode}.</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
              >
                + ThÃªm thÃ nh viÃªn
              </button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs space-y-2">
            <Filter className="w-6 h-6 text-gray-600 mx-auto mb-1" />
            <p>{t('KhÃ´ng tÃ¬m tháº¥y káº¿t quáº£ phÃ¹ há»£p.', 'No matching results found.')}</p>
            <button
              type="button"
              onClick={() => {
                setMemberSearchTerm('');
                setMemberFilterStatus('ALL');
              }}
              className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
            >
              Xem táº¥t cáº£
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#222B35]">
            {filteredMembers.map((m) => {
              const ekyc = getMemberEkyc(m);
              const ekycStatus = getMemberStatus(m);

              const avatarSrc =
                (ekyc?.avatarUrl && !ekyc.avatarUrl.startsWith('data:image/'))
                  ? ekyc.avatarUrl
                  : (m.avatarUrl && !m.avatarUrl.startsWith('data:image/'))
                    ? m.avatarUrl
                    : getInitialsAvatar('Skyline Resident');

              return (
                <div
                  key={m.id}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#161B22] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Member Avatar */}
                    <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-none overflow-hidden border border-[#C5A880]/70 shadow bg-[#161D26] flex-shrink-0">
                      <img
                        src={avatarSrc}
                        alt={m.fullName}
                        onError={(e) => {
                          e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          {m.fullName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-none border bg-purple-950/80 text-purple-300 border-purple-600/60 flex-shrink-0">
                          {m.relationship || 'NgÆ°á»i NhÃ '}
                        </span>

                        {/* Status Badges */}
                        {/* Tráº¡ng thÃ¡i xÃ¡c thá»±c duy nháº¥t, rÃµ rÃ ng */}
                        {ekycStatus === 'APPROVED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-emerald-950/90 text-emerald-300 border-emerald-500/80 flex items-center gap-1 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t('ÄÃ£ KÃ­ch Hoáº¡t FaceID', 'FaceID Active')}
                          </span>
                        )}
                        {ekycStatus === 'PENDING_OWNER' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-amber-950/90 text-amber-300 border-amber-500/80 flex items-center gap-1 animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-amber-400" /> {t('Chá» Chá»§ Há»™ XÃ¡c Nháº­n', 'Pending Owner')}
                          </span>
                        )}
                        {ekycStatus === 'PENDING' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-cyan-950/90 text-cyan-300 border-cyan-500/80 flex items-center gap-1 animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-cyan-400" /> {t('Chá» Ban Quáº£n LÃ½ Duyá»‡t', 'Pending BQL')}
                          </span>
                        )}
                        {ekycStatus === 'REJECTED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-rose-950/90 text-rose-300 border-rose-500/80 flex items-center gap-1 flex-shrink-0">
                            <XCircle className="w-3 h-3 text-rose-400" /> {t('Cáº§n Gá»­i Láº¡i áº¢nh', 'Photo Resubmission Needed')}
                          </span>
                        )}
                        {ekycStatus === 'NOT_SUBMITTED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-medium rounded-none border bg-gray-900/90 text-gray-300 border-gray-700 flex items-center gap-1 flex-shrink-0">
                            <AlertCircle className="w-3 h-3 text-gray-400" /> {t('ChÆ°a ÄÄƒng KÃ½ FaceID', 'Not Enrolled')}
                          </span>
                        )}
                      </div>

                      <div className="text-gray-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          SÄT: <strong className="font-mono text-gray-200">{m.phone}</strong>
                        </span>
                        {m.idCard && (
                          <span>
                            â€¢ CCCD: <strong className="font-mono text-[#C5A880]">{m.idCard}</strong>
                          </span>
                        )}
                        {m.licensePlate && (
                          <span>
                            â€¢ Biá»ƒn sá»‘: <strong className="font-mono text-cyan-400">{m.licensePlate}</strong> {m.vehicleType ? `(${m.vehicleType})` : ''}
                          </span>
                        )}
                      </div>

                      {/* ThÃ´ng tin cÆ° trÃº & PhÃ¡p lÃ½ */}
                      <div className="text-[11px] text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <span>{t('HÃ¬nh thá»©c:', 'Type:')} <strong className="text-gray-200">{m.residenceType || (isEn ? 'Permanent resident with owner' : 'ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™')}</strong></span>
                        <span>â€¢ {t('Táº¡m trÃº:', 'Status:')} <strong className="text-emerald-400">{m.temporaryResidenceStatus || 'Äang lÃ m thá»§ tá»¥c'}</strong></span>
                        {m.dob && <span>â€¢ {t('Sinh:', 'DOB:')} <strong className="font-mono text-gray-300">{m.dob}</strong></span>}
                        {m.gender && <span>({m.gender})</span>}
                      </div>

                      {/* Rejection Notice if any */}
                      {ekycStatus === 'REJECTED' && ekyc?.rejectionReason && (
                        <div className="p-1.5 bg-rose-950/50 border border-rose-800/80 rounded-none text-[11px] text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>{t('LÃ½ do tá»« BQL:', 'Reason from Management:')}</strong> {ekyc.rejectionReason}
                          </span>
                        </div>
                      )}

                      {/* Privilege description & Legal proof */}
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
                        <span className="truncate">
                          {m.accessLevel || 'Sáº£nh â€¢ Thang mÃ¡y T12 â€¢ Háº§m B1/B2 â€¢ Tiá»‡n Ã­ch cÆ° dÃ¢n'}
                        </span>
                        {m.relationshipProof && (
                          <span className="text-[10px] text-[#C5A880]/80 font-mono">
                            â€¢ CÄƒn cá»©: {m.relationshipProof}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Owner & Family Member */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#222B35]/60 flex-shrink-0">
                    {/* Owner Confirm Button when Member is PENDING_OWNER */}
                    {isOwner && ekycStatus === 'PENDING_OWNER' && (
                      <button
                        type="button"
                        onClick={() => setConfirmTargetMember(m)}
                        className="px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117]"
                        title={t('XÃ¡c nháº­n 4 máº«u áº£nh vÃ  chuyá»ƒn Ban Quáº£n LÃ½ phÃª duyá»‡t')}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('XÃ¡c Nháº­n Gá»­i BQL', 'Confirm & Send to BQL')}</span>
                      </button>
                    )}

                    {/* FaceID Scanning Button */}
                    {(isOwner || (m.id === currentUser.id || m.phone === currentUser.phone || m.username === currentUser.username)) && (
                      <button
                        type="button"
                        onClick={() => setfaceEnrollTarget(m)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 ${
                          getEnrolledFaceProfile(m.phone || m.id || m.username || '')
                            ? 'bg-[#121820] hover:bg-[#1E2631] border border-cyan-500/80 text-cyan-300'
                            : 'bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold'
                        }`}
                        title={t('QuÃ©t máº«u khuÃ´n máº·t')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('QuÃ©t KhuÃ´n Máº·t', 'Scan Face')}</span>
                      </button>
                    )}

                    {/* CCCD & Bio Details */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleOpenEkycModal(m)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 bg-[#161D26] hover:bg-[#1F2937] border border-[#2D3748] hover:border-[#C5A880] text-gray-200"
                        title={t('Xem vÃ  cáº­p nháº­t áº£nh CÄƒn cÆ°á»›c cÃ´ng dÃ¢n')}
                      >
                        <ScanFace className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{t('Há»“ SÆ¡ & CCCD', 'Profile & ID')}</span>
                      </button>
                    )}

                    {/* Delete Member */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handlePromptRemoveMember(m)}
                        className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                        title={t('XÃ³a ngÆ°á»i thÃ¢n khá»i cÄƒn há»™')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('XÃ³a', 'Delete')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL: CHá»¦ Há»˜ KHAI BÃO & Cáº¬P NHáº¬T E-KYC CHO NGÆ¯á»œI NHÃ€ Gá»¬I BQL        */}
      {/* =================================================================== */}
      {showEkycModal && ekycTargetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEkycModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-5 sm:p-7 text-white space-y-5 shadow-2xl rounded-none max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222B35] pb-3 gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center text-[#C5A880] flex-shrink-0">
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    ThÃ´ng Tin Tháº» & KhuÃ´n Máº·t NgÆ°á»i ThÃ¢n
                  </h3>
                  <p className="text-xs text-gray-400">
                    CÄƒn {aptCode} â€¢ Chá»§ há»™ {ownerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMemberOcrModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#C5A880] to-[#E2C799] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow rounded-none active:scale-95"
                >
                  <Scan className="w-3.5 h-3.5 text-[#0D1117]" /> Táº£i áº¢nh CCCD
                </button>
                <button
                  type="button"
                  onClick={handleCloseEkycModal}
                  className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legal Representation Guarantee Box */}
            <div className="p-2.5 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs text-gray-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
              <span>{t('Chá»§ há»™', 'Owner')} <strong className="text-white">{ownerName}</strong> {t('báº£o lÃ£nh thÃ´ng tin cho', 'guarantees information for')} <strong className="text-white">{ekycFullName || ekycTargetMember.fullName}</strong> {t('gá»­i BQL duyá»‡t FaceID.', 'to submit for BQL FaceID approval.')}</span>
            </div>

            {/* Error Message */}
            {ekycModalError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ekycModalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitMemberEkyc} className="space-y-4 text-xs">
              
              {/* SECTION 1: THÃ”NG TIN PHÃP LÃ NHÃ‚N THÃ‚N */}
              <div className="space-y-2.5 p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                    <User className="w-4 h-4" /> 1. ThÃ´ng Tin NgÆ°á»i ThÃ¢n
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Há» vÃ  TÃªn (Theo CCCD): *
                    </label>
                    <input
                      type="text"
                      required
                      value={ekycFullName}
                      onChange={(e) => setEkycFullName(e.target.value)}
                      placeholder={isEn ? 'Enter full name as on ID card' : 'Nháº­p há» vÃ  tÃªn theo CCCD'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      {t('Má»‘i Quan Há»‡ Vá»›i Chá»§ Há»™:', 'Relationship to Owner:')} *
                    </label>
                    <select
                      value={ekycRelationship}
                      onChange={(e) => setEkycRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Vá»£ / Chá»“ng', 'Spouse')}">{t('Vá»£ / Chá»“ng', 'Spouse')}</option>
                      <option value="{t('Con CÃ¡i', 'Children')}">{t('Con CÃ¡i', 'Children')}</option>
                      <option value="{t('Bá»‘ / Máº¹', 'Parents')}">{t('Bá»‘ / Máº¹', 'Parents')}</option>
                      <option value="{t('Anh / Chá»‹ / Em', 'Siblings')}">{t('Anh / Chá»‹ / Em', 'Siblings')}</option>
                      <option value="{t('NgÆ°á»i ThÃ¢n CÃ¹ng CÄƒn Há»™', 'Co-resident Relatives')}">{t('NgÆ°á»i ThÃ¢n CÃ¹ng CÄƒn Há»™', 'Co-resident Relatives')}</option>
                      <option value="{t('NgÆ°á»i NhÃ  / ThÃ nh ViÃªn KhÃ¡c', 'Other Family Members')}">{t('NgÆ°á»i NhÃ  / ThÃ nh ViÃªn KhÃ¡c', 'Other Family Members')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Sá»‘ Äiá»‡n Thoáº¡i LiÃªn Há»‡ (10 sá»‘): *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={ekycPhone}
                      onChange={(e) => setEkycPhone(cleanPhoneNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 10-digit phone number' : 'Nháº­p 10 sá»‘ Ä‘iá»‡n thoáº¡i'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {ekycPhone && !isValidPhoneNumber(ekycPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getPhoneValidationError(ekycPhone)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Sá»‘ CCCD / Äá»‹nh Danh (12 sá»‘): *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={ekycIdCard}
                      onChange={(e) => setEkycIdCard(cleanCccdNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 12-digit ID card number' : 'Nháº­p 12 sá»‘ CCCD'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-[#C5A880] font-mono font-bold rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {ekycIdCard && !isValidCccdNumber(ekycIdCard) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getCccdValidationError(ekycIdCard)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      NgÃ y Sinh:
                    </label>
                    <input
                      type="date"
                      value={ekycDob}
                      onChange={(e) => setEkycDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      NÆ¡i ThÆ°á»ng TrÃº / QuÃª QuÃ¡n:
                    </label>
                    <input
                      type="text"
                      value={ekycPob}
                      onChange={(e) => setEkycPob(e.target.value)}
                      placeholder={isEn ? 'Enter hometown / permanent address' : 'Nháº­p quÃª quÃ¡n / nÆ¡i thÆ°á»ng trÃº'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      NgÃ y Cáº¥p CCCD:
                    </label>
                    <input
                      type="date"
                      value={ekycIdDate}
                      onChange={(e) => setEkycIdDate(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Biá»ƒn Sá»‘ Xe ÄÄƒng KÃ½ (Náº¿u cÃ³):
                    </label>
                    <input
                      type="text"
                      value={ekycLicensePlate}
                      onChange={(e) => setEkycLicensePlate(e.target.value)}
                      placeholder={isEn ? 'Enter license plate (if any)' : 'Nháº­p biá»ƒn sá»‘ xe (náº¿u cÃ³)'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-cyan-300 font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: áº¢NH Äáº I DIá»†N Há»’ SÆ  & CCCD 2 Máº¶T */}
              <div className="space-y-4 p-4 bg-[#121820] border border-[#222B35] rounded-none">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2.5">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" /> 2. {t('áº¢nh Äáº¡i Diá»‡n (Avatar)', 'Profile Avatar')} & CCCD 2 Máº·t Gá»­i BQL
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo 1: áº¢nh Äáº¡i Diá»‡n Há»“ SÆ¡ */}
                  <div className="p-3 bg-[#161B22] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{t('áº¢nh Äáº¡i Diá»‡n (Avatar)', 'Profile Avatar')}</span>
                        <span className="text-[10px] text-[#C5A880]">{t('Há»“ sÆ¡ cÃ¡ nhÃ¢n', 'Personal Profile')}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        áº¢nh chÃ¢n dung hiá»ƒn thá»‹ trang cÃ¡ nhÃ¢n. Má»Ÿ cá»­a dÃ¹ng tÃ­nh nÄƒng QuÃ©t FaceID 4 máº«u Ä‘á»™c láº­p.
                      </p>
                    </div>

                    {/* Camera or Image Preview */}
                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <img
                            src={ekycAvatarUrl || getInitialsAvatar('Skyline Resident')}
                            alt="Resident Avatar"
                            onError={(e) => {
                              e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-[#C5A880] border border-[#C5A880]/30">
                            áº¢NH Äáº I DIá»†N â€¢ AVATAR
                          </div>
                          {ekycAvatarUrl && !ekycAvatarUrl.includes('default.png') && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                              âœ“ ÄÃ£ CÃ³ Avatar
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {isCameraActive ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={captureCamera}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Chá»¥p Ngay
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-none cursor-pointer"
                          >
                            Há»§y
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex-1 py-2 bg-[#1C2533] hover:bg-[#253245] border border-[#C5A880]/70 text-[#C5A880] font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" /> Camera
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputAvatarRef.current?.click()}
                              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" /> Chá»n Tá»‡p
                            </button>
                            <input
                              ref={fileInputAvatarRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setEkycAvatarUrl)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo 2: {t('CCCD Máº·t TrÆ°á»›c', 'National ID Front')} */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{t('CCCD Máº·t TrÆ°á»›c', 'National ID Front')}</span>
                        <span className="text-[10px] text-cyan-400">{t('Máº·t cÃ³ áº£nh', 'Photo side')}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chá»¥p Ä‘á»§ 4 gÃ³c tháº», khÃ´ng lÃ³a sÃ¡ng hoáº·c máº¥t gÃ³c.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {ekycFrontImage ? (
                        <img
                          src={ekycFrontImage}
                          alt="{t('CCCD Máº·t TrÆ°á»›c', 'National ID Front')}"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                          <CreditCard className="w-7 h-7 text-cyan-500/60" />
                          <span className="text-[11px] text-gray-400 font-medium">{t('ChÆ°a cÃ³ áº£nh máº·t trÆ°á»›c tháº» CCCD', 'No ID front photo yet')}</span>
                          <span className="text-[9.5px] text-gray-600">{t('Báº¥m "Táº£i LÃªn Máº·t TrÆ°á»›c" bÃªn dÆ°á»›i', 'Click "Upload Front Photo" below')}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-cyan-300 border border-cyan-500/30">
                        Vá»Š TRÃ 1 â€¢ Máº¶T TRÆ¯á»šC
                      </div>
                      {ekycFrontImage && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                          âœ“ ÄÃ£ Tá»± Äá»™ng Äiá»n
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputFrontRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Táº£i LÃªn Máº·t TrÆ°á»›c
                      </button>
                      <input
                        ref={fileInputFrontRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCccdUpload(e, 'FRONT', setEkycFrontImage)}
                      />
                    </div>
                  </div>

                  {/* Photo 3: {t('CCCD Máº·t Sau', 'National ID Back')} */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{t('CCCD Máº·t Sau', 'National ID Back')}</span>
                        <span className="text-[10px] text-purple-400">{t('Chip & VÃ¢n tay', 'Chip & Fingerprint side')}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chá»¥p rÃµ chip Ä‘iá»‡n tá»­, mÃ£ QR vÃ  ngÃ y cáº¥p.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {ekycBackImage ? (
                        <img
                          src={ekycBackImage}
                          alt="{t('CCCD Máº·t Sau', 'National ID Back')}"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                          <CreditCard className="w-7 h-7 text-purple-500/60" />
                          <span className="text-[11px] text-gray-400 font-medium">{t('ChÆ°a cÃ³ áº£nh máº·t sau tháº» CCCD (Chip)', 'No ID back photo (Chip) yet')}</span>
                          <span className="text-[9.5px] text-gray-600">{t('Báº¥m "Táº£i LÃªn Máº·t Sau" bÃªn dÆ°á»›i', 'Click "Upload Back Photo" below')}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-purple-300 border border-purple-500/30">
                        Vá»Š TRÃ 2 â€¢ Máº¶T SAU
                      </div>
                      {ekycBackImage && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                          âœ“ ÄÃ£ Tá»± Äá»™ng Äiá»n
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputBackRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Táº£i LÃªn Máº·t Sau
                      </button>
                      <input
                        ref={fileInputBackRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCccdUpload(e, 'BACK', setEkycBackImage)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#222B35]">
                <div className="text-[11px] text-gray-400">
                  Há»“ sÆ¡ sáº½ Ä‘Æ°á»£c chuyá»ƒn tá»›i Ban Quáº£n LÃ½ Ä‘á»ƒ xÃ¡c nháº­n ngay láº­p tá»©c.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEkyc}
                  className="w-full sm:w-auto px-7 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmittingEkyc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Äang Gá»­i...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Gá»­i BQL Duyá»‡t Há»“ SÆ¡
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÃŠM THÃ€NH VIÃŠN                                               */}
      {/* =================================================================== */}
      {showAddModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-2xl w-full p-4 sm:p-5 text-white space-y-3.5 shadow-2xl rounded-none max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-none bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                    ThÃªm CÆ° DÃ¢n â€¢ CÄƒn {aptCode}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    ThÃªm thÃ nh viÃªn vÃ o danh sÃ¡ch cÄƒn há»™
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error / Alert */}
            {actionError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Tab Selector Mode (3 Tabs) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161B22] border border-[#222B35] rounded-none text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalMode('PRE_APPROVED');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'PRE_APPROVED'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('CÃ³ Sáºµn', 'Pre-registered')} ({bqlAccounts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('SEARCH_API');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'SEARCH_API'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('Tra Cá»©u', 'Search')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('DIRECT_INPUT');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'DIRECT_INPUT'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('Nháº­p Má»›i', 'Add New')}</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* ------------------------------------------------------------- */}
            {/* MODE 1: CHá»ŒN Tá»ª DANH SÃCH TÃ€I KHOáº¢N KHáº¢ Dá»¤NG                   */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'PRE_APPROVED' && (() => {
              const filteredBqlAccounts = bqlAccounts.filter((acc) => {
                if (!preApprovedFilter.trim()) return true;
                const q = preApprovedFilter.toLowerCase().trim();
                const qDigits = q.replace(/\D/g, '');
                return (
                  acc.fullName.toLowerCase().includes(q) ||
                  acc.phone.includes(qDigits || q) ||
                  (acc.idCard && acc.idCard.toLowerCase().includes(q)) ||
                  (acc.username && acc.username.toLowerCase().includes(q))
                );
              });

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{t('TÃ i khoáº£n ngÆ°á»i nhÃ  Ä‘Ã£ Ä‘Äƒng kÃ½ trong há»‡ thá»‘ng:', 'Registered family accounts in system:')}</span>
                    <span className="text-[#C5A880] font-mono font-bold">
                      {filteredBqlAccounts.length} / {bqlAccounts.length} tÃ i khoáº£n
                    </span>
                  </div>

                  {/* Quick filter search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={preApprovedFilter}
                      onChange={(e) => setPreApprovedFilter(e.target.value)}
                      placeholder={isEn ? 'Filter by name, phone or ID...' : 'Lá»c nhanh theo há» tÃªn, SÄT hoáº·c CCCD...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-2 text-white text-xs font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {preApprovedFilter && (
                      <button
                        type="button"
                        onClick={() => setPreApprovedFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {filteredBqlAccounts.length === 0 ? (
                    <div className="p-5 bg-[#161D26] border border-[#222B35] rounded-none text-center text-xs text-gray-400 space-y-1.5">
                      <p>{t('KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n phÃ¹ há»£p vá»›i tá»« khÃ³a', 'No accounts found matching keyword')} "{preApprovedFilter}".</p>
                      <button
                        type="button"
                        onClick={() => setPreApprovedFilter('')}
                        className="text-[#C5A880] hover:underline text-xs"
                      >
                        Hiá»ƒn thá»‹ láº¡i táº¥t cáº£ tÃ i khoáº£n
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredBqlAccounts.map((acc) => {
                        const isAlreadyInUnit = members.some(
                          (m) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                        );
                        const isSelected = selectedAccount?.id === acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                            className={`p-2.5 rounded-none border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyInUnit
                                ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1C2533] border-[#C5A880] shadow cursor-pointer'
                                : 'bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/60 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-none overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
                                <img
                                  src={acc.avatarUrl || getInitialsAvatar('Skyline Resident')}
                                  alt={acc.fullName}
                                  onError={(e) => {
                                    e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{acc.fullName}</span>
                                  {isAlreadyInUnit ? (
                                    <span className="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-none flex-shrink-0">
                                      Äang á»Ÿ cÄƒn nÃ y
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.5 bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#C5A880] rounded-none flex-shrink-0 font-mono">
                                      NgÆ°á»i NhÃ 
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono flex-wrap">
                                  <span className="text-gray-300">{t('SÄT:', 'Phone:')} {acc.phone}</span>
                                  {acc.idCard && <span>â€¢ CCCD: {acc.idCard}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isAlreadyInUnit ? (
                                <span className="text-[10px] text-gray-500 italic">{t('ÄÃ£ cÃ³', 'Added')}</span>
                              ) : isSelected ? (
                                <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded-none flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> ÄÃ£ chá»n
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#141B24] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10px] font-semibold rounded-none transition-colors"
                                >
                                  Chá»n
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ------------------------------------------------------------- */}
            {/* MODE 2: TRA Cá»¨U TÃ€I KHOáº¢N QUA API Báº°NG SÄT / CCCD             */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'SEARCH_API' && (
              <div className="space-y-3">
                <form onSubmit={handleSearchApi} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEn ? 'Enter phone, ID or member name...' : 'Nháº­p SÄT, CCCD hoáº·c há» tÃªn ngÆ°á»i nhÃ ...'}
                    className="flex-1 bg-[#161B22] border border-[#2D3748] p-2 text-white text-xs font-mono rounded-none focus:border-[#C5A880] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingApi || !searchQuery.trim()}
                    className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isSearchingApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Tra Cá»©u
                  </button>
                </form>

                {/* Quick Suggestion Pills */}
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 font-mono">{t('TÃ i khoáº£n máº«u cÃ³ sáºµn trong há»‡ thá»‘ng:', 'Available sample accounts in system:')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Nguyá»…n Há»¯u Nhá»±t', q: '0917795211' },
                      { name: 'Nguyá»…n VÄƒn CÆ°á»ng', q: '0325524482' },
                      { name: 'LÃª Äá»©c Háº£i', q: '0977758215' },
                      { name: 'VÅ© CÃ¡t Thá»‹nh', q: '0909262626' },
                    ].map((hint) => (
                      <button
                        key={hint.q}
                        type="button"
                        onClick={() => {
                          setSearchQuery(hint.q);
                          handleSearchApi(undefined, hint.q);
                        }}
                        className="px-2 py-0.5 bg-[#161D26] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10.5px] transition-colors rounded-none font-mono cursor-pointer"
                      >
                        {hint.name} ({hint.q})
                      </button>
                    ))}
                  </div>
                </div>

                {searchNotFound && (
                  <div className="p-2.5 bg-[#161D26] border border-rose-500/40 text-rose-300 text-xs rounded-none">
                    {searchNotFound}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 border-b border-[#222B35] pb-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Káº¿t Quáº£ TÃ¬m Tháº¥y ({searchResults.length}):
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {searchResults.map((acc) => {
                        const isAlreadyInUnit = members.some(
                          (m) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                        );
                        const isSelected = selectedAccount?.id === acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                            className={`p-2.5 rounded-none border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyInUnit
                                ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1C2533] border-[#C5A880] shadow cursor-pointer'
                                : 'bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/60 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-none overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
                                <img
                                  src={acc.avatarUrl || getInitialsAvatar('Skyline Resident')}
                                  alt={acc.fullName}
                                  onError={(e) => {
                                    e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{acc.fullName}</span>
                                  {isAlreadyInUnit && (
                                    <span className="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-none flex-shrink-0">
                                      Äang á»Ÿ cÄƒn nÃ y
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono flex-wrap">
                                  <span>{t('SÄT:', 'Phone:')} {acc.phone}</span>
                                  {acc.idCard && <span>â€¢ CCCD: {acc.idCard}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isAlreadyInUnit ? (
                                <span className="text-[10px] text-gray-500 italic">{t('ÄÃ£ cÃ³', 'Added')}</span>
                              ) : isSelected ? (
                                <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded-none flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> ÄÃ£ chá»n
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] font-bold text-[10px] rounded-none hover:bg-white transition-colors"
                                >
                                  + Chá»n
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MODE 3: NHáº¬P TRá»°C TIáº¾P THÃ”NG TIN NGÆ¯á»œI THÃ‚N                     */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'DIRECT_INPUT' && (
              <form onSubmit={handleDirectAddMember} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Há» vÃ  TÃªn <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directFullName}
                      onChange={(e) => setDirectFullName(e.target.value)}
                      placeholder={isEn ? 'Enter full name...' : 'Nháº­p há» vÃ  tÃªn...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Sá»‘ Äiá»‡n Thoáº¡i (10 sá»‘) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={directPhone}
                      onChange={(e) => setDirectPhone(cleanPhoneNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 10-digit phone number...' : 'Nháº­p 10 sá»‘ Ä‘iá»‡n thoáº¡i...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {directPhone && !isValidPhoneNumber(directPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getPhoneValidationError(directPhone)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Má»‘i Quan Há»‡ Vá»›i Chá»§ Há»™ <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={directRelationship}
                      onChange={(e) => setDirectRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Vá»£ / Chá»“ng', 'Spouse')}">{t('Vá»£ / Chá»“ng', 'Spouse')}</option>
                      <option value="{t('Con ruá»™t', 'Biological child')}">{t('Con ruá»™t', 'Biological child')}</option>
                      <option value="{t('Con nuÃ´i', 'Adopted child')}">{t('Con nuÃ´i', 'Adopted child')}</option>
                      <option value="{t('Bá»‘ / Máº¹', 'Parents')} ruá»™t">{t('Bá»‘ / Máº¹', 'Parents')} ruá»™t</option>
                      <option value="{t('Bá»‘ / Máº¹', 'Parents')} vá»£ / chá»“ng">{t('Bá»‘ / Máº¹', 'Parents')} vá»£ / chá»“ng</option>
                      <option value="{t('Anh / Chá»‹ / Em', 'Siblings')} ruá»™t">{t('Anh / Chá»‹ / Em', 'Siblings')} ruá»™t</option>
                      <option value="{t('ChÃ¡u ruá»™t', 'Niece / Nephew')}">{t('ChÃ¡u ruá»™t', 'Niece / Nephew')}</option>
                      <option value="{t('NgÆ°á»i thÃ¢n khÃ¡c', 'Other relative')}">{t('NgÆ°á»i thÃ¢n khÃ¡c', 'Other relative')}</option>
                      <option value="{t('NgÆ°á»i giÃºp viá»‡c / Báº£o máº«u', 'Housekeeper / Nanny')}">{t('NgÆ°á»i giÃºp viá»‡c / Báº£o máº«u', 'Housekeeper / Nanny')}</option>
                      <option value="{t('LÃ¡i xe riÃªng', 'Private driver')}">{t('LÃ¡i xe riÃªng', 'Private driver')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Sá»‘ CCCD / Äá»‹nh Danh (12 sá»‘)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={directIdCard}
                      onChange={(e) => setDirectIdCard(cleanCccdNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 12-digit ID card number...' : 'Nháº­p 12 sá»‘ CCCD...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {directIdCard && !isValidCccdNumber(directIdCard) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getCccdValidationError(directIdCard)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('HÃ¬nh Thá»©c CÆ° TrÃº:', 'Residency Status:')}</label>
                    <select
                      value={directResidenceType}
                      onChange={(e) => setDirectResidenceType(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™', 'Permanent resident with owner')}">{t('ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™', 'Permanent resident with owner')}</option>
                      <option value="{t('Táº¡m trÃº dÃ i háº¡n', 'Long-term temporary resident')}">{t('Táº¡m trÃº dÃ i háº¡n', 'Long-term temporary resident')}</option>
                      <option value="{t('LÆ°u trÃº cÃ³ thá»i háº¡n', 'Fixed-term stay')}">{t('LÆ°u trÃº cÃ³ thá»i háº¡n', 'Fixed-term stay')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('CÄƒn Cá»© Báº£o LÃ£nh / Chá»©ng Minh:', 'Proof of Relationship:')}</label>
                    <select
                      value={directRelationshipProof}
                      onChange={(e) => setDirectRelationshipProof(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Sá»• Há»™ Kháº©u / XÃ¡c nháº­n CT07', 'Household Registry / CT07')}">{t('Sá»• Há»™ Kháº©u / XÃ¡c nháº­n CT07', 'Household Registry / CT07')}</option>
                      <option value="{t('Giáº¥y chá»©ng nháº­n káº¿t hÃ´n', 'Marriage Certificate')}">{t('Giáº¥y chá»©ng nháº­n káº¿t hÃ´n', 'Marriage Certificate')}</option>
                      <option value="{t('Giáº¥y khai sinh', 'Birth Certificate')}">{t('Giáº¥y khai sinh', 'Birth Certificate')}</option>
                      <option value="{t('Há»£p Ä‘á»“ng lao Ä‘á»™ng báº£o máº«u / lÃ¡i xe', 'Labor Contract for Nanny / Driver')}">{t('Há»£p Ä‘á»“ng lao Ä‘á»™ng báº£o máº«u / lÃ¡i xe', 'Labor Contract for Nanny / Driver')}</option>
                      <option value="{t('VÄƒn báº£n báº£o lÃ£nh cá»§a chá»§ há»™', 'Owner Sponsorship Letter')}">{t('VÄƒn báº£n báº£o lÃ£nh cá»§a chá»§ há»™', 'Owner Sponsorship Letter')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('NgÃ y Sinh (DOB):', 'Date of Birth (DOB):')}</label>
                    <input
                      type="date"
                      value={directDob}
                      onChange={(e) => setDirectDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Giá»›i TÃ­nh:', 'Gender:')}</label>
                    <select
                      value={directGender}
                      onChange={(e) => setDirectGender(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Nam">{t('Nam', 'Male')}</option>
                      <option value="Ná»¯">{t('Ná»¯', 'Female')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('NÆ¡i Sinh / QuÃª QuÃ¡n:', 'Place of Birth / Origin:')}</label>
                    <input
                      type="text"
                      value={directPob}
                      onChange={(e) => setDirectPob(e.target.value)}
                      placeholder={isEn ? 'Enter place of birth / hometown...' : 'Nháº­p nÆ¡i sinh / quÃª quÃ¡n...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">{t('Biá»ƒn Sá»‘ Xe:', 'License Plate:')}</label>
                      <input
                        type="text"
                        value={directLicensePlate}
                        onChange={(e) => setDirectLicensePlate(e.target.value)}
                        placeholder="VD: 59P1-123.45"
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">{t('Loáº¡i PhÆ°Æ¡ng Tiá»‡n:', 'Vehicle Type:')}</label>
                      <select
                        value={directVehicleType}
                        onChange={(e) => setDirectVehicleType(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                      >
                        <option value="Xe mÃ¡y">{t('Xe mÃ¡y', 'Motorcycle')}</option>
                        <option value="Ã” tÃ´">{t('Ã” tÃ´', 'Car')}</option>
                        <option value="Xe Ä‘áº¡p Ä‘iá»‡n">{t('Xe Ä‘áº¡p Ä‘iá»‡n', 'Electric bike')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#161D26] border border-[#C5A880]/30 text-[11px] text-[#C5A880] flex items-center gap-2">
                  <Crown className="w-4 h-4 flex-shrink-0 text-[#C5A880]" />
                  <span>{t('Chá»§ Há»™ Báº£o LÃ£nh:', 'Sponsoring Owner:')} <strong>{ownerName}</strong> (CÄƒn {aptCode} - The Tropical BS-07)</span>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-none cursor-pointer text-center"
                  >
                    Há»§y
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !directFullName.trim() || !directPhone.trim()}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Äang ThÃªm...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> ThÃªm ThÃ nh ViÃªn
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONFIRMATION & ROLE ASSIGNMENT SECTION (CHO TAB 1 & 2)       */}
            {/* ------------------------------------------------------------- */}
            {selectedAccount && modalMode !== 'DIRECT_INPUT' ? (
              <form onSubmit={handleAddMember} className="pt-2.5 border-t border-[#222B35] space-y-2.5 text-xs">
                <div className="p-2.5 bg-[#161D26] border border-[#C5A880]/60 rounded-none flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#C5A880]" />
                    <span className="text-white font-bold text-xs">{selectedAccount.fullName}</span>
                    <span className="text-gray-400 font-mono text-xs">({selectedAccount.phone})</span>
                  </div>
                  <span className="text-[11px] text-[#C5A880] font-medium">
                    {t('ÄÄƒng kÃ½ vÃ o cÄƒn', 'Registering to')} {aptCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Má»‘i Quan Há»‡ Vá»›i Chá»§ Há»™:', 'Relationship to Owner:')}</label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Vá»£ / Chá»“ng', 'Spouse')}">{t('Vá»£ / Chá»“ng', 'Spouse')}</option>
                      <option value="{t('Con ruá»™t', 'Biological child')}">{t('Con ruá»™t', 'Biological child')}</option>
                      <option value="{t('Con nuÃ´i', 'Adopted child')}">{t('Con nuÃ´i', 'Adopted child')}</option>
                      <option value="{t('Bá»‘ / Máº¹', 'Parents')} ruá»™t">{t('Bá»‘ / Máº¹', 'Parents')} ruá»™t</option>
                      <option value="{t('Bá»‘ / Máº¹', 'Parents')} vá»£ / chá»“ng">{t('Bá»‘ / Máº¹', 'Parents')} vá»£ / chá»“ng</option>
                      <option value="{t('Anh / Chá»‹ / Em', 'Siblings')} ruá»™t">{t('Anh / Chá»‹ / Em', 'Siblings')} ruá»™t</option>
                      <option value="{t('ChÃ¡u ruá»™t', 'Niece / Nephew')}">{t('ChÃ¡u ruá»™t', 'Niece / Nephew')}</option>
                      <option value="{t('NgÆ°á»i thÃ¢n khÃ¡c', 'Other relative')}">{t('NgÆ°á»i thÃ¢n khÃ¡c', 'Other relative')}</option>
                      <option value="{t('NgÆ°á»i giÃºp viá»‡c / Báº£o máº«u', 'Housekeeper / Nanny')}">{t('NgÆ°á»i giÃºp viá»‡c / Báº£o máº«u', 'Housekeeper / Nanny')}</option>
                      <option value="{t('LÃ¡i xe riÃªng', 'Private driver')}">{t('LÃ¡i xe riÃªng', 'Private driver')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('HÃ¬nh Thá»©c CÆ° TrÃº:', 'Residency Status:')}</label>
                    <select
                      value={newResidenceType}
                      onChange={(e) => setNewResidenceType(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™', 'Permanent resident with owner')}">{t('ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™', 'Permanent resident with owner')}</option>
                      <option value="{t('Táº¡m trÃº dÃ i háº¡n', 'Long-term temporary resident')}">{t('Táº¡m trÃº dÃ i háº¡n', 'Long-term temporary resident')}</option>
                      <option value="{t('LÆ°u trÃº cÃ³ thá»i háº¡n', 'Fixed-term stay')}">{t('LÆ°u trÃº cÃ³ thá»i háº¡n', 'Fixed-term stay')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('CÄƒn Cá»© Báº£o LÃ£nh:', 'Proof of Relationship:')}</label>
                    <select
                      value={newRelationshipProof}
                      onChange={(e) => setNewRelationshipProof(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Sá»• Há»™ Kháº©u / XÃ¡c nháº­n CT07', 'Household Registry / CT07')}">{t('Sá»• Há»™ Kháº©u / XÃ¡c nháº­n CT07', 'Household Registry / CT07')}</option>
                      <option value="{t('Giáº¥y chá»©ng nháº­n káº¿t hÃ´n', 'Marriage Certificate')}">{t('Giáº¥y chá»©ng nháº­n káº¿t hÃ´n', 'Marriage Certificate')}</option>
                      <option value="{t('Giáº¥y khai sinh', 'Birth Certificate')}">{t('Giáº¥y khai sinh', 'Birth Certificate')}</option>
                      <option value="{t('Há»£p Ä‘á»“ng lao Ä‘á»™ng báº£o máº«u / lÃ¡i xe', 'Labor Contract for Nanny / Driver')}">{t('Há»£p Ä‘á»“ng lao Ä‘á»™ng báº£o máº«u / lÃ¡i xe', 'Labor Contract for Nanny / Driver')}</option>
                      <option value="{t('VÄƒn báº£n báº£o lÃ£nh cá»§a chá»§ há»™', 'Owner Sponsorship Letter')}">{t('VÄƒn báº£n báº£o lÃ£nh cá»§a chá»§ há»™', 'Owner Sponsorship Letter')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Biá»ƒn Sá»‘ Xe (tÃ¹y chá»n):', 'License Plate (optional):')}</label>
                    <input
                      type="text"
                      value={newLicensePlate}
                      onChange={(e) => setNewLicensePlate(e.target.value)}
                      placeholder="VD: 59P1-886.79"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-none transition-colors cursor-pointer text-center text-xs"
                  >
                    Há»§y
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Äang Xá»­ LÃ½...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> ThÃªm ThÃ nh ViÃªn
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : null}

          </div>
        </div>
      )}

      {/* OCR Scanner Modal for Family Member CCCD */}
      <CccdOcrScannerModal
        isOpen={isMemberOcrModalOpen}
        onClose={() => setIsMemberOcrModalOpen(false)}
        onApplyOcrData={handleApplyMemberOcrData}
        initialFrontImage={ekycFrontImage}
        initialBackImage={ekycBackImage}
      />

      {/* Official 4-Step FaceID Biometric Enrollment Modal for Family Member */}
      {faceEnrollTarget && (
        <FaceEnrollModal
          isOpen={!!faceEnrollTarget}
          onClose={() => setfaceEnrollTarget(null)}
          userId={faceEnrollTarget.phone || faceEnrollTarget.id || faceEnrollTarget.username || faceEnrollTarget.fullName}
          fullName={faceEnrollTarget.fullName}
          apartmentCode={aptCode}
          phone={faceEnrollTarget.phone || ''}
          email={faceEnrollTarget.email || ''}
          isFamilyMemberSelfEnroll={!isOwner}
          submittedByRole={currentUser.role}
          onEnrollSuccess={() => {
            setMembers((prev) =>
              prev.map((m) => {
                if (m.id === faceEnrollTarget.id || m.phone === faceEnrollTarget.phone) {
                  return {
                    ...m,
                    faceStatus: !isOwner ? 'Chá» Chá»§ Há»™ XÃ¡c Nháº­n' : 'Äang Chá» BQL PhÃª Duyá»‡t',
                  };
                }
                return m;
              })
            );
            fetchMembers();
            setActionSuccess(
              !isOwner
                ? `âœ“ ÄÃ£ chá»¥p Ä‘á»§ 4 gÃ³c khuÃ´n máº·t cho ${faceEnrollTarget.fullName}! Há»“ sÆ¡ Ä‘ang chá» Chá»§ Há»™ xÃ¡c nháº­n.`
                : `âœ“ ÄÃ£ chá»¥p Ä‘á»§ 4 gÃ³c khuÃ´n máº·t thÃ nh cÃ´ng cho ${faceEnrollTarget.fullName}!`
            );
            setTimeout(() => setActionSuccess(null), 5000);
            setfaceEnrollTarget(null);
          }}
        />
      )}

      {/* MODAL: CHá»¦ Há»˜ KIá»‚M TRA 4 MáºªU FACEID Cá»¦A NGÆ¯á»œI NHÃ€ VÃ€ XÃC NHáº¬N Gá»¬I BQL */}
      {confirmTargetMember && (() => {
        const enrolled = getEnrolledFaceProfile(confirmTargetMember.phone || confirmTargetMember.id || confirmTargetMember.username || '');
        const samples = enrolled?.samples;

        const handleConfirmAndSendToBql = async () => {
          setIsConfirmingFace(true);
          try {
            // 1. XÃ¡c nháº­n FaceID trong há»“ sÆ¡ sinh tráº¯c há»c
            await skylineConfirmFamilyFaceIdByOwner(
              confirmTargetMember.id || confirmTargetMember.phone || '', 
              aptCode,
              confirmTargetMember.phone
            );

            // 2. Äá»“ng bá»™ tráº¡ng thÃ¡i e-KYC sang PENDING trÃªn mÃ¡y chá»§ Ä‘á»ƒ BQL nháº­n há»“ sÆ¡ tháº©m duyá»‡t ngay
            try {
              await fetch('/api/ekyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'CONFIRM_BY_OWNER',
                  userId: confirmTargetMember.id || confirmTargetMember.phone,
                  phone: confirmTargetMember.phone,
                }),
              });
            } catch (ekycSyncErr) {
              console.warn('Sync confirm to ekyc api error:', ekycSyncErr);
            }

            setActionSuccess(`âœ“ ÄÃ£ xÃ¡c nháº­n báº£o lÃ£nh há»“ sÆ¡ FaceID cho thÃ nh viÃªn "${confirmTargetMember.fullName}" vÃ  gá»­i Ban Quáº£n LÃ½ phÃª duyá»‡t thÃ nh cÃ´ng!`);
            setTimeout(() => setActionSuccess(null), 5000);
            setConfirmTargetMember(null);
            fetchMembers();
          } catch (err: any) {
            setActionError(err?.message || 'Lá»—i khi xÃ¡c nháº­n há»“ sÆ¡ FaceID.');
            setTimeout(() => setActionError(null), 5000);
          } finally {
            setIsConfirmingFace(false);
          }
        };

        return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmTargetMember(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
          >
            <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-5 sm:p-6 space-y-5 rounded-none max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#161D26] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                      Quyá»n PhÃª Duyá»‡t Chá»§ Há»™ â€¢ CÄƒn Há»™ {aptCode}
                    </div>
                    <h3 className="text-base font-serif font-bold text-white">
                      XÃ¡c Nháº­n 4 Máº«u FaceID Cá»§a NgÆ°á»i NhÃ : {confirmTargetMember.fullName}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmTargetMember(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Member Brief Info */}
              <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-gray-400 block text-[11px]">{t('ThÃ nh viÃªn:', 'Member:')}</span>
                  <strong className="text-white">{confirmTargetMember.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{t('Quan há»‡:', 'Relationship:')}</span>
                  <span className="text-[#C5A880] font-semibold">{confirmTargetMember.relationship}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{t('SÄT:', 'Phone:')}</span>
                  <span className="font-mono text-gray-200">{confirmTargetMember.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">CCCD:</span>
                  <span className="font-mono text-gray-200">{confirmTargetMember.idCard || t('Äang cáº­p nháº­t', 'Updating')}</span>
                </div>
              </div>

              {/* 4 Angle Samples Display */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#C5A880]" /> 4 GÃ³c KhuÃ´n Máº·t:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Äá»™ khá»›p: {enrolled?.faceScore ? `${enrolled.faceScore}%` : 'ChÆ°a quÃ©t'}
                  </span>
                </div>

                {samples ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '1. Front View' : '1. ChÃ­nh Diá»‡n', src: samples.front })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('1. ChÃ­nh Diá»‡n', '1. Front View')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.front} alt="Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '2. Turn Left' : '2. Quay TrÃ¡i', src: samples.left })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('2. Quay TrÃ¡i', '2. Turn Left')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.left} alt="Left" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '3. Turn Right' : '3. Quay Pháº£i', src: samples.right })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('3. Quay Pháº£i', '3. Turn Right')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.right} alt="Right" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '4. Smile' : '4. Má»‰m CÆ°á»i', src: samples.smile })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('4. Má»‰m CÆ°á»i', '4. Smile')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.smile} alt="Smile" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-[#161B22] border border-gray-800 text-center text-xs text-gray-400">
                    ChÆ°a cÃ³ máº«u áº£nh quÃ©t cá»§a thÃ nh viÃªn nÃ y.
                  </div>
                )}
              </div>

              {/* Owner Legal Responsibility Notice */}
              <div className="p-2.5 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span>{t('XÃ¡c nháº­n thÃ nh viÃªn', 'Confirm Member')} <strong>{confirmTargetMember.fullName}</strong> thuá»™c cÄƒn <strong>{aptCode}</strong> Ä‘á»ƒ gá»­i BQL kÃ­ch hoáº¡t FaceID.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2.5 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmTargetMember(null);
                    setfaceEnrollTarget(confirmTargetMember);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-colors cursor-pointer"
                >
                  QuÃ©t Láº¡i
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSendToBql}
                  disabled={isConfirmingFace || !samples}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isConfirmingFace ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Äang Gá»­i...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> XÃ¡c Nháº­n & Gá»­i BQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}



      {/* =================================================================== */}
      {/* MODAL: XÃC NHáº¬N Há»¦Y PHÃ‚N QUYá»€N CÆ¯ DÃ‚N CAO Cáº¤P                       */}
      {/* =================================================================== */}
      {removeTargetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemoveTargetMember(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none"
        >
          <div className="bg-[#0D1117] border border-rose-600/80 max-w-md w-full p-4 sm:p-5 text-white space-y-3.5 shadow-2xl rounded-none">
            <div className="flex items-center gap-2.5 border-b border-[#222B35] pb-2.5">
              <div className="w-8 h-8 bg-rose-950 border border-rose-500 text-rose-300 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                  {t('XÃ¡c Nháº­n XÃ³a ThÃ nh ViÃªn', 'Confirm Remove Member')}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {t('CÄƒn há»™', 'Apartment')} {aptCode} â€¢ {t('Chá»§ há»™', 'Owner')} {ownerName}
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-rose-950/40 border border-rose-900/80 text-rose-200 text-xs space-y-1">
              <p>
                {t(
                  `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a thÃ nh viÃªn ${removeTargetMember.fullName} khá»i danh sÃ¡ch cÄƒn há»™ ${aptCode}?`,
                  `Are you sure you want to remove ${removeTargetMember.fullName} from unit ${aptCode}?`
                )}
              </p>
              <p className="text-gray-300 text-[11px]">
                {t(
                  'Quyá»n ra vÃ o sáº£nh vÃ  thang mÃ¡y cá»§a ngÆ°á»i thÃ¢n sáº½ táº¡m ngá»«ng. Báº¡n cÃ³ thá»ƒ thÃªm láº¡i báº¥t cá»© lÃºc nÃ o.',
                  'Access privileges will be revoked. You can add this member back at any time.'
                )}
              </p>
            </div>

            {/* Target Member Mini Summary */}
            <div className="p-2.5 bg-[#161D26] border border-[#222B35] flex items-center gap-2.5 text-xs">
              <div className="w-9 h-9 rounded-none overflow-hidden border border-gray-700 bg-black flex-shrink-0">
                <img
                  src={removeTargetMember.avatarUrl || getInitialsAvatar('Skyline Resident')}
                  alt={removeTargetMember.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-white">{removeTargetMember.fullName}</div>
                <div className="text-gray-400 font-mono text-[11px]">{t('SÄT:', 'Phone:')} {removeTargetMember.phone} â€¢ {removeTargetMember.relationship}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRemoveTargetMember(null)}
                className="px-3.5 py-1.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-none transition-colors cursor-pointer text-xs"
              >
                {t('Giá»¯ Láº¡i', 'Cancel')}
              </button>

              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemoveMember}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isRemoving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('Äang XÃ³a...', 'Removing...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> {t('XÃ³a ThÃ nh ViÃªn', 'Remove Member')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: LIGHTBOX PHÃ“NG TO MáºªU áº¢NH FACEID GÃ“C QUÃ‰T                   */}
      {/* =================================================================== */}
      {selectedAnglePreview && (
        <div 
          onClick={() => setSelectedAnglePreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D1117] border border-[#C5A880] p-4 max-w-lg w-full text-white shadow-2xl rounded-none space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <div className="text-xs font-bold font-mono text-[#C5A880] uppercase tracking-wider">
                {selectedAnglePreview.title}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnglePreview(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-square bg-black border border-gray-800 overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src={selectedAnglePreview.src}
                alt={selectedAnglePreview.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: QUÃ‰T CCCD Tá»° Äá»˜NG CHO NGÆ¯á»œI NHÃ€ (TESSERACT OCR)              */}
      {/* =================================================================== */}
      <CccdOcrScannerModal
        isOpen={isMemberOcrModalOpen}
        onClose={() => setIsMemberOcrModalOpen(false)}
        onApplyOcrData={handleApplyMemberOcrData}
        initialFrontImage={ekycFrontImage}
        initialBackImage={ekycBackImage}
      />

      {/* =================================================================== */}
      {/* MODAL: SINH TRáº®C Há»ŒC FACEID 4 BÆ¯á»šC CHO THÃ€NH VIÃŠN                   */}
      {/* =================================================================== */}
      {faceEnrollTarget && (
        <FaceEnrollModal
          isOpen={Boolean(faceEnrollTarget)}
          onClose={() => setfaceEnrollTarget(null)}
          userId={faceEnrollTarget.phone || faceEnrollTarget.id || faceEnrollTarget.username || ''}
          fullName={faceEnrollTarget.fullName || ''}
          apartmentCode={aptCode}
          phone={faceEnrollTarget.phone || ''}
          email={faceEnrollTarget.email || ''}
          isFamilyMemberSelfEnroll={faceEnrollTarget.id !== currentUser.id && faceEnrollTarget.phone !== currentUser.phone}
          submittedByRole={currentUser.role}
          onEnrollSuccess={(profile) => {
            setActionSuccess(`âœ“ ÄÃ£ thu tháº­p vÃ  lÆ°u thÃ nh cÃ´ng 4 máº«u FaceID cho "${faceEnrollTarget.fullName}"!`);
            setTimeout(() => setActionSuccess(null), 5000);
            setfaceEnrollTarget(null);
            fetchMembers();
          }}
        />
      )}

      {/* Confirm Clear Cache Modal */}
      <ConfirmDeleteModal
        isOpen={isClearDataConfirmOpen}
        onClose={() => setIsClearDataConfirmOpen(false)}
        onConfirm={executeClearLocalData}
        title={isEn ? 'Clear Cache & Sync Family' : 'Äá»“ng Bá»™ & Dá»n Dáº¹p Bá»™ Nhá»› Táº¡m'}
        message={isEn 
          ? 'Clear temporary client memory and synchronize family member profiles fresh from the server store?' 
          : 'XÃ¡c nháº­n dá»n dáº¹p bá»™ nhá»› táº¡m vÃ  Ä‘á»“ng bá»™ láº¡i danh sÃ¡ch há»“ sÆ¡ thÃ nh viÃªn gia Ä‘Ã¬nh trá»±c tiáº¿p tá»« mÃ¡y chá»§?'
        }
        itemCode={aptCode}
        itemName={isEn ? 'Unit Family Cache' : 'Bá»™ nhá»› táº¡m há»“ sÆ¡ cÄƒn há»™'}
        confirmText={isEn ? 'Sync Fresh' : 'Äá»“ng Bá»™ Láº¡i'}
        isDanger={false}
      />
    </div>
  );
}


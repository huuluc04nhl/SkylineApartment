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

import FamilyMemberList from './FamilyMemberList';
import FamilyEkycModal from './FamilyEkycModal';
import FamilyAddMemberModal from './FamilyAddMemberModal';
import FamilyFaceReviewModal from './FamilyFaceReviewModal';
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

  const modalCtx: any = { t, isEn, currentUser, aptCode, isOwner, getEnrolledFaceProfile, skylineConfirmFamilyFaceIdByOwner, members, setMembers, bqlAccounts, setBqlAccounts, isLoading, setIsLoading, showAddModal, setShowAddModal, modalMode, setModalMode, isSubmitting, setIsSubmitting, actionSuccess, setActionSuccess, actionError, setActionError, faceEnrollTarget, setfaceEnrollTarget, confirmTargetMember, setConfirmTargetMember, isConfirmingFace, setIsConfirmingFace, ownerData, setOwnerData, memberSearchTerm, setMemberSearchTerm, memberFilterStatus, setMemberFilterStatus, directFullName, setDirectFullName, directPhone, setDirectPhone, directIdCard, setDirectIdCard, directRelationship, setDirectRelationship, directLicensePlate, setDirectLicensePlate, selectedAccount, setSelectedAccount, newRelationship, setNewRelationship, newLicensePlate, setNewLicensePlate, searchQuery, setSearchQuery, isSearchingApi, setIsSearchingApi, searchResult, setSearchResult, searchResults, setSearchResults, searchNotFound, setSearchNotFound, preApprovedFilter, setPreApprovedFilter, newResidenceType, setNewResidenceType, newRelationshipProof, setNewRelationshipProof, newTemporaryResidenceStatus, setNewTemporaryResidenceStatus, directDob, setDirectDob, directGender, setDirectGender, directPob, setDirectPob, directResidenceType, setDirectResidenceType, directRelationshipProof, setDirectRelationshipProof, directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus, directVehicleType, setDirectVehicleType, removeTargetMember, setRemoveTargetMember, isRemoving, setIsRemoving, isClearDataConfirmOpen, setIsClearDataConfirmOpen, selectedAnglePreview, setSelectedAnglePreview, showEkycModal, setShowEkycModal, ekycTargetMember, setEkycTargetMember, ekycFullName, setEkycFullName, ekycRelationship, setEkycRelationship, ekycPhone, setEkycPhone, ekycIdCard, setEkycIdCard, ekycDob, setEkycDob, ekycPob, setEkycPob, ekycIdDate, setEkycIdDate, ekycIdPlace, setEkycIdPlace, ekycLicensePlate, setEkycLicensePlate, ekycAvatarUrl, setEkycAvatarUrl, ekycFrontImage, setEkycFrontImage, ekycBackImage, setEkycBackImage, isSubmittingEkyc, setIsSubmittingEkyc, ekycModalError, setEkycModalError, isMemberOcrModalOpen, setIsMemberOcrModalOpen, isCameraActive, setIsCameraActive, ownerName, handleClearLocalData, executeClearLocalData, handleApplyMemberOcrData, videoRef, streamRef, fileInputFrontRef, fileInputBackRef, fileInputAvatarRef, getMemberEkyc, getMemberStatus, fetchMembers, startCamera, stopCamera, captureCamera, handleFileUpload, handleCccdUpload, handleOpenEkycModal, handleCloseEkycModal, handleSubmitMemberEkyc, handleSelectPreApproved, handleSearchApi, handleAddMember, handlePromptRemoveMember, handleConfirmRemoveMember, handleDirectAddMember, totalApproved, totalPendingOwner, totalPendingBql, totalVehicles, totalResidents, filteredMembers, familyResource };
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

      <FamilyMemberList ctx={modalCtx} />
      {/* =================================================================== */}
      {/* MODAL: CHá»¦ Há»˜ KHAI BÃO & Cáº¬P NHáº¬T E-KYC CHO NGÆ¯á»œI NHÃ€ Gá»¬I BQL        */}
      {/* =================================================================== */}
      <FamilyEkycModal ctx={modalCtx} />

      {/* =================================================================== */}
      {/* MODAL: THÃŠM THÃ€NH VIÃŠN                                               */}
      {/* =================================================================== */}
      <FamilyAddMemberModal ctx={modalCtx} />

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
      <FamilyFaceReviewModal ctx={modalCtx} />
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


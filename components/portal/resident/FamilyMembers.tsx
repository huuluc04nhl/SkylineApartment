'use client';
import { getInitialsAvatar } from '@/lib/avatarHelper';
import { useResidentApartment } from '@/lib/hooks/useResidentApartment';
import MissingApartmentNotice from '@/components/portal/resident/MissingApartmentNotice';

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

  // Trường thông tin đồng bộ với Chủ hộ:
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
  const { aptCode, missing: missingApartment } = useResidentApartment(currentUser);
  const isOwner = currentUser.role === 'OWNER';
  const ownerName = currentUser.full_name || (currentUser as any)?.fullname || 'Trần Hữu Lực';

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
  const [directRelationship, setDirectRelationship] = useState<string>('Vợ / Chồng');
  const [directLicensePlate, setDirectLicensePlate] = useState<string>('');

  // Selected Account from API
  const [selectedAccount, setSelectedAccount] = useState<BqlEligibleAccount | null>(null);
  const [newRelationship, setNewRelationship] = useState<string>('Vợ / Chồng');
  const [newLicensePlate, setNewLicensePlate] = useState<string>('');

  // Live API Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<BqlEligibleAccount | null>(null);
  const [searchResults, setSearchResults] = useState<BqlEligibleAccount[]>([]);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);
  const [preApprovedFilter, setPreApprovedFilter] = useState<string>('');

  // New fields suitable for owner-family relationship
  const [newResidenceType, setNewResidenceType] = useState<string>('Thường trú cùng chủ hộ');
  const [newRelationshipProof, setNewRelationshipProof] = useState<string>('Sổ Hộ Khẩu / Xác nhận CT07');
  const [newTemporaryResidenceStatus, setNewTemporaryResidenceStatus] = useState<string>('Đang Làm Thủ Tục');
  const [directDob, setDirectDob] = useState<string>('');
  const [directGender, setDirectGender] = useState<string>('Nam');
  const [directPob, setDirectPob] = useState<string>('');
  const [directResidenceType, setDirectResidenceType] = useState<string>('Thường trú cùng chủ hộ');
  const [directRelationshipProof, setDirectRelationshipProof] = useState<string>('Sổ Hộ Khẩu / Xác nhận CT07');
  const [directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus] = useState<string>('Đang Làm Thủ Tục');
  const [directVehicleType, setDirectVehicleType] = useState<string>('Xe máy');

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
      setActionSuccess(isEn ? '✓ Cleared local cache and synchronized with API.' : '✓ Đã dọn dẹp dữ liệu lưu tạm ở local và đồng bộ lại từ API thành công.');
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
  // OWNER PROXY e-KYC MODAL STATE (Chủ hộ kê khai hồ sơ cho người nhà)
  // =========================================================================
  const [showEkycModal, setShowEkycModal] = useState<boolean>(false);
  const [ekycTargetMember, setEkycTargetMember] = useState<FamilyMemberItem | null>(null);
  const [ekycFullName, setEkycFullName] = useState<string>('');
  const [ekycRelationship, setEkycRelationship] = useState<string>('Vợ / Chồng');
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
    const stdIdPlace = (ocrData.idPlace || 'Cục Cảnh sát QLHC về TTXH').trim();

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
        ? `✨ Successfully read Citizen ID for "${stdFullName || 'member'}"! All details verified and populated into the form.`
        : `✨ Đã đọc thông tin CCCD thành công cho "${stdFullName || 'thành viên'}"! Toàn bộ thông tin đã được chuẩn hóa và tự động điền vào hồ sơ.`
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
    if (m.faceStatus?.includes('Chờ Chủ Hộ') || m.faceStatus?.includes('Chờ chủ hộ') || profile?.status === 'PENDING_OWNER') {
      return 'PENDING_OWNER';
    }
    const ekyc = getMemberEkyc(m);
    if (ekyc?.status === 'APPROVED' || ekyc?.status === 'VERIFIED') return 'APPROVED';
    if (ekyc?.status === 'PENDING') return 'PENDING';
    if (ekyc?.status === 'REJECTED') return 'REJECTED';
    if (m.faceStatus?.includes('Chờ')) return 'PENDING';
    if (m.faceStatus?.includes('Kích Hoạt') || m.faceStatus?.includes('Đã kích hoạt')) return 'APPROVED';
    if (m.faceStatus?.includes('Từ Chối') || m.faceStatus?.includes('Chụp Lại')) return 'REJECTED';
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
      console.warn('Không thể mở camera:', err);
      setIsCameraActive(false);
      toast.error('Không thể kích hoạt Camera trên thiết bị này. Bạn có thể chọn tải ảnh chân dung trực tiếp từ tệp tin.');
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
      setEkycModalError('Tệp tải lên không phải là ảnh hợp lệ (chấp nhận JPEG, PNG, WEBP).');
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
      setEkycModalError('Tệp tải lên không phải là ảnh hợp lệ (chấp nhận JPEG, PNG, WEBP).');
      return;
    }

    if (file.size < 15000) {
      setEkycModalError('Ảnh chụp thẻ CCCD quá mờ hoặc dung lượng quá nhỏ (dưới 15KB). Vui lòng tải ảnh rõ nét.');
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
            setEkycModalError(`Ảnh tải lên là ảnh dọc (tỷ lệ ${ratio.toFixed(2)}:1). Thẻ Căn cước công dân phải là ảnh chụp ngang bao gồm đủ 4 góc thẻ (tỷ lệ chuẩn ~1.58:1). Không được sử dụng ảnh selfie dọc!`);
            return;
          }
          if (ratio > 2.05) {
            setEkycModalError(`Ảnh bị cắt xén quá dài (tỷ lệ ${ratio.toFixed(2)}:1). Vui lòng chụp trọn vẹn 4 góc thẻ CCCD.`);
            return;
          }
          if (img.width < 380 || img.height < 240) {
            setEkycModalError(`Độ phân giải ảnh quá thấp (${img.width}x${img.height}px). Yêu cầu tối thiểu 400x250px.`);
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
    setEkycRelationship(member.relationship || 'Vợ / Chồng');
    setEkycPhone(existing?.phone || member.phone || '');
    setEkycIdCard(existing?.idCardNo || member.idCard || '');
    setEkycDob(existing?.dob || member.dob || '');
    setEkycPob(existing?.pob || member.pob || '');
    setEkycIdDate(existing?.idDate || member.idDate || '');
    setEkycIdPlace(existing?.idPlace || member.idPlace || '');
    setEkycLicensePlate(member.licensePlate || '');

    // Ưu tiên hiển thị chân dung chuẩn của người nhà (tuyệt đối không lấy ảnh mẫu FaceID ghi đè chân dung)
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
      setEkycModalError('Vui lòng nhập đầy đủ họ và tên người nhà.');
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

    // 1. Kiểm tra ảnh {t('CCCD Mặt Trước', 'National ID Front')}
    if (ekycFrontImage) {
      const frontCheck = validateCccdCard(ekycFrontImage, 'FRONT');
      if (!frontCheck.valid) {
        setEkycModalError(frontCheck.error || (isEn ? 'National ID Front photo is invalid.' : 'Ảnh CCCD Mặt Trước không đúng tiêu chuẩn.'));
        return;
      }
    }

    // 2. Kiểm tra ảnh {t('CCCD Mặt Sau', 'National ID Back')}
    if (ekycBackImage) {
      const backCheck = validateCccdCard(ekycBackImage, 'BACK');
      if (!backCheck.valid) {
        setEkycModalError(backCheck.error || (isEn ? 'National ID Back photo is invalid.' : 'Ảnh CCCD Mặt Sau không đúng tiêu chuẩn.'));
        return;
      }
    }

    // 3. Đối chiếu sinh trắc học: Ảnh Chân Dung vs Ảnh Thẻ CCCD (Thuật toán thật)
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
      const roleLabel = `Người Nhà (Căn ${aptCode}) - Bảo lãnh bởi Chủ Hộ: ${ownerName}`;

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
              faceStatus: 'Đang Chờ BQL Phê Duyệt',
            };
          }
          return m;
        })
      );

      // 4. Feedback
      setActionSuccess(
        isEn
          ? `✓ Identity & face photo records for family member "${ekycFullName}" successfully submitted to Management Office! Pending review.`
          : `✓ Đã gửi thông tin căn cước & khuôn mặt của người nhà "${ekycFullName}" lên Ban Quản Lý thành công! Hồ sơ đang chờ Ban Quản Lý phê duyệt.`
      );
      setTimeout(() => setActionSuccess(null), 5000);

      handleCloseEkycModal();
      fetchMembers();
    } catch (err: any) {
      setEkycModalError(err.message || (isEn ? 'Error submitting data to Management Office.' : 'Lỗi khi gửi thông tin lên Ban Quản Lý.'));
    } finally {
      setIsSubmittingEkyc(false);
    }
  };

  // Select account from pre-verified list
  const handleSelectPreApproved = (acc: BqlEligibleAccount) => {
    setSelectedAccount(acc);
    setNewRelationship(acc.relationship || 'Vợ / Chồng');
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
          setNewRelationship(list[0].relationship || 'Vợ / Chồng');
          setNewLicensePlate(list[0].licensePlate || '');
        } else {
          setSearchNotFound(isEn ? `No registered family account matching "${query}".` : `Không tìm thấy tài khoản người nhà nào khớp với "${query}".`);
        }
      } else {
        setSearchResults([]);
        setSearchResult(null);
        setSelectedAccount(null);
        setSearchNotFound(
          res.message || (isEn 
            ? `No registered family account matching "${query}" on the system.` 
            : `Không tìm thấy tài khoản người thân nào khớp với "${query}" trên hệ thống.`)
        );
      }
    } catch (err) {
      setSearchNotFound(isEn ? 'Connection error while searching for account.' : 'Lỗi kết nối khi tra cứu người dùng.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Submit Add Member strictly via API
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setActionError(isEn ? 'Please select or search a valid account from the API system.' : 'Vui lòng chọn hoặc tra cứu một tài khoản hợp lệ từ hệ thống API.');
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
            ? `✓ Added family member "${selectedAccount.fullName}" to Unit ${aptCode} via API profile successfully!`
            : `✓ Đã thêm thành viên "${selectedAccount.fullName}" vào Căn hộ ${aptCode} theo hồ sơ API thành công!`
        );
        setTimeout(() => setActionSuccess(null), 4000);

        // Reset
        setSelectedAccount(null);
        setSearchResult(null);
        setSearchQuery('');
        setNewRelationship('Vợ / Chồng');
        setNewLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Failed to add member. Please try again.' : 'Không thể thêm thành viên. Vui lòng thử lại.'));
      }
    } catch (err: any) {
      setActionError(err.message || (isEn ? 'API connection error when adding member.' : 'Lỗi kết nối API khi thêm thành viên.'));
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
            ? `✓ Revoked residency authorization & FaceID access for member "${removeTargetMember.fullName}".`
            : `✓ Đã hủy phân quyền cư trú & thu hồi quyền FaceID của thành viên "${removeTargetMember.fullName}".`
        );
        setTimeout(() => setActionSuccess(null), 4000);
        setRemoveTargetMember(null);
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Could not remove member.' : 'Không thể xóa thành viên.'));
      }
    } catch (err) {
      setActionError(isEn ? 'Connection error while removing member.' : 'Lỗi kết nối khi xóa thành viên.');
    } finally {
      setIsRemoving(false);
    }
  };

  // Submit Add Member directly (Mode 3: Direct Input)
  const handleDirectAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directFullName.trim()) {
      setActionError(isEn ? 'Please enter member full name.' : 'Vui lòng nhập đầy đủ họ và tên người thân.');
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
            ? `✓ Added member "${directFullName}" to Unit ${aptCode}! You can now enroll FaceID and scan Citizen ID.`
            : `✓ Đã thêm thành viên "${directFullName}" vào Căn hộ ${aptCode}! Bạn có thể tiến hành quét FaceID và chụp CCCD ngay.`
        );
        setTimeout(() => setActionSuccess(null), 5000);

        // Reset
        setDirectFullName('');
        setDirectPhone('');
        setDirectIdCard('');
        setDirectRelationship('Vợ / Chồng');
        setDirectLicensePlate('');
        fetchMembers();
      } else {
        setActionError(res.message || (isEn ? 'Failed to add member. Please try again.' : 'Không thể thêm thành viên. Vui lòng thử lại.'));
      }
    } catch (err: any) {
      setActionError(err.message || (isEn ? 'API connection error when adding member.' : 'Lỗi kết nối API khi thêm thành viên.'));
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
    if (!res.ok) throw new Error(`Không thể tải danh sách nhân khẩu (HTTP ${res.status})`);
    const json = await res.json();
    return Array.isArray(json?.members) ? json.members : [];
  }, []);

  const modalCtx: any = { t, isEn, currentUser, aptCode, isOwner, getEnrolledFaceProfile, skylineConfirmFamilyFaceIdByOwner, members, setMembers, bqlAccounts, setBqlAccounts, isLoading, setIsLoading, showAddModal, setShowAddModal, modalMode, setModalMode, isSubmitting, setIsSubmitting, actionSuccess, setActionSuccess, actionError, setActionError, faceEnrollTarget, setfaceEnrollTarget, confirmTargetMember, setConfirmTargetMember, isConfirmingFace, setIsConfirmingFace, ownerData, setOwnerData, memberSearchTerm, setMemberSearchTerm, memberFilterStatus, setMemberFilterStatus, directFullName, setDirectFullName, directPhone, setDirectPhone, directIdCard, setDirectIdCard, directRelationship, setDirectRelationship, directLicensePlate, setDirectLicensePlate, selectedAccount, setSelectedAccount, newRelationship, setNewRelationship, newLicensePlate, setNewLicensePlate, searchQuery, setSearchQuery, isSearchingApi, setIsSearchingApi, searchResult, setSearchResult, searchResults, setSearchResults, searchNotFound, setSearchNotFound, preApprovedFilter, setPreApprovedFilter, newResidenceType, setNewResidenceType, newRelationshipProof, setNewRelationshipProof, newTemporaryResidenceStatus, setNewTemporaryResidenceStatus, directDob, setDirectDob, directGender, setDirectGender, directPob, setDirectPob, directResidenceType, setDirectResidenceType, directRelationshipProof, setDirectRelationshipProof, directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus, directVehicleType, setDirectVehicleType, removeTargetMember, setRemoveTargetMember, isRemoving, setIsRemoving, isClearDataConfirmOpen, setIsClearDataConfirmOpen, selectedAnglePreview, setSelectedAnglePreview, showEkycModal, setShowEkycModal, ekycTargetMember, setEkycTargetMember, ekycFullName, setEkycFullName, ekycRelationship, setEkycRelationship, ekycPhone, setEkycPhone, ekycIdCard, setEkycIdCard, ekycDob, setEkycDob, ekycPob, setEkycPob, ekycIdDate, setEkycIdDate, ekycIdPlace, setEkycIdPlace, ekycLicensePlate, setEkycLicensePlate, ekycAvatarUrl, setEkycAvatarUrl, ekycFrontImage, setEkycFrontImage, ekycBackImage, setEkycBackImage, isSubmittingEkyc, setIsSubmittingEkyc, ekycModalError, setEkycModalError, isMemberOcrModalOpen, setIsMemberOcrModalOpen, isCameraActive, setIsCameraActive, ownerName, handleClearLocalData, executeClearLocalData, handleApplyMemberOcrData, videoRef, streamRef, fileInputFrontRef, fileInputBackRef, fileInputAvatarRef, getMemberEkyc, getMemberStatus, fetchMembers, startCamera, stopCamera, captureCamera, handleFileUpload, handleCccdUpload, handleOpenEkycModal, handleCloseEkycModal, handleSubmitMemberEkyc, handleSelectPreApproved, handleSearchApi, handleAddMember, handlePromptRemoveMember, handleConfirmRemoveMember, handleDirectAddMember, totalApproved, totalPendingOwner, totalPendingBql, totalVehicles, totalResidents, filteredMembers, familyResource };
  if (missingApartment) return <MissingApartmentNotice />;
  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {familyResource.loading && <ResourceSkeleton label="Đang tải danh sách nhân khẩu..." />}
      {!familyResource.loading && familyResource.error && (
        <ResourceError message={familyResource.error} onRetry={familyResource.retry} />
      )}
      {!familyResource.loading && !familyResource.error && members.length === 0 && (
        <ResourceEmpty message="Chưa có thành viên nào được đăng ký trong căn hộ." />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {t('Quản Trị Căn Hộ')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Nhân Khẩu')} • {t('Căn')} {aptCode}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('Chủ hộ:')} <strong className="text-[#C5A880]">{ownerName}</strong> • {t('Căn')} <strong className="text-white font-mono">{aptCode}</strong>
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setfaceEnrollTarget({
                  id: currentUser.id || 'usr-120',
                  fullName: currentUser.full_name || 'Trần Hữu Lực',
                  phone: currentUser.phone || '',
                  email: currentUser.email || 'huuluc04@gmail.com',
                  role: 'Family',
                  relationship: 'Chủ Hộ (Chủ Sở Hữu)',
                });
              }}
              className="px-3 py-2 bg-[#161D26] hover:bg-[#1E2631] border border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              title={isEn ? 'Rescan Primary Resident FaceID' : 'Quét lại FaceID Chủ Hộ'}
            >
              <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t('Quét FaceID')}</span>
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
              <UserPlus className="w-4 h-4" /> {t('Thêm Thành Viên')}
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
            <span>{t('Nhân Khẩu', 'Total Residents')}</span>
            <Users className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-white mt-1 flex items-baseline gap-1.5">
            <span>{totalResidents}</span>
            <span className="text-xs text-gray-400 font-normal">{t('người', 'residents')}</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center justify-between">
            <span>{t('Đã FaceID', 'FaceID Enrolled')}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
            {1 + totalApproved} <span className="text-xs font-sans text-gray-400 font-normal">{t('người', 'residents')}</span>
          </div>
        </div>

        {/* Highlighted Pending Owner Stat Card */}
        <div className={`p-3.5 rounded-none transition-all ${
          totalPendingOwner > 0
            ? 'bg-amber-950/40 border-2 border-amber-500 animate-pulse'
            : 'bg-[#121820] border border-[#222B35]'
        }`}>
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold flex items-center justify-between">
            <span>{t('Chờ Duyệt', 'Pending Review')}</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-400 mt-1 flex items-baseline gap-1.5">
            <span>{totalPendingOwner}</span>
            <span className="text-xs font-sans text-gray-400 font-normal">{t('hồ sơ', 'profiles')}</span>
            {totalPendingOwner > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-[#0D1117] font-bold uppercase">
                {t('Cần duyệt', 'Action needed')}
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
          <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center justify-between">
            <span>{t('Chờ BQL', 'Pending Mgmt')}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-cyan-400 mt-1">
            {totalPendingBql} <span className="text-xs font-sans text-gray-400 font-normal">{t('hồ sơ', 'profiles')}</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold flex items-center justify-between">
            <span>{t('Phương Tiện', 'Vehicles')}</span>
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
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {t('Cần duyệt FaceID người nhà', 'Pending Family FaceID Review')} ({totalPendingOwner})
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Thành viên đã quét đủ 4 mẫu FaceID. Vui lòng kiểm tra và duyệt để BQL kích hoạt.
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
                  <ShieldCheck className="w-4 h-4" /> Duyệt Ngay ({pendingMember.fullName})
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      <FamilyMemberList ctx={modalCtx} />
      {/* =================================================================== */}
      {/* MODAL: CHỦ HỘ KHAI BÁO & CẬP NHẬT E-KYC CHO NGƯỜI NHÀ GỬI BQL        */}
      {/* =================================================================== */}
      <FamilyEkycModal ctx={modalCtx} />

      {/* =================================================================== */}
      {/* MODAL: THÊM THÀNH VIÊN                                               */}
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
                    faceStatus: !isOwner ? 'Chờ Chủ Hộ Xác Nhận' : 'Đang Chờ BQL Phê Duyệt',
                  };
                }
                return m;
              })
            );
            fetchMembers();
            setActionSuccess(
              !isOwner
                ? `✓ Đã chụp đủ 4 góc khuôn mặt cho ${faceEnrollTarget.fullName}! Hồ sơ đang chờ Chủ Hộ xác nhận.`
                : `✓ Đã chụp đủ 4 góc khuôn mặt thành công cho ${faceEnrollTarget.fullName}!`
            );
            setTimeout(() => setActionSuccess(null), 5000);
            setfaceEnrollTarget(null);
          }}
        />
      )}

      {/* MODAL: CHỦ HỘ KIỂM TRA 4 MẪU FACEID CỦA NGƯỜI NHÀ VÀ XÁC NHẬN GỬI BQL */}
      <FamilyFaceReviewModal ctx={modalCtx} />
      {/* =================================================================== */}
      {/* MODAL: QUÉT CCCD TỰ ĐỘNG CHO NGƯỜI NHÀ (TESSERACT OCR)              */}
      {/* =================================================================== */}
      <CccdOcrScannerModal
        isOpen={isMemberOcrModalOpen}
        onClose={() => setIsMemberOcrModalOpen(false)}
        onApplyOcrData={handleApplyMemberOcrData}
        initialFrontImage={ekycFrontImage}
        initialBackImage={ekycBackImage}
      />

      {/* =================================================================== */}
      {/* MODAL: SINH TRẮC HỌC FACEID 4 BƯỚC CHO THÀNH VIÊN                   */}
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
            setActionSuccess(`✓ Đã thu thập và lưu thành công 4 mẫu FaceID cho "${faceEnrollTarget.fullName}"!`);
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
        title={isEn ? 'Clear Cache & Sync Family' : 'Đồng Bộ & Dọn Dẹp Bộ Nhớ Tạm'}
        message={isEn 
          ? 'Clear temporary client memory and synchronize family member profiles fresh from the server store?' 
          : 'Xác nhận dọn dẹp bộ nhớ tạm và đồng bộ lại danh sách hồ sơ thành viên gia đình trực tiếp từ máy chủ?'
        }
        itemCode={aptCode}
        itemName={isEn ? 'Unit Family Cache' : 'Bộ nhớ tạm hồ sơ căn hộ'}
        confirmText={isEn ? 'Sync Fresh' : 'Đồng Bộ Lại'}
        isDanger={false}
      />
    </div>
  );
}


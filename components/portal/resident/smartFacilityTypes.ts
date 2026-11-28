import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '@/lib/dataStore';
import type {
  FacilityBooking,
  FacilityCheckinLog,
  FACILITY_LIMIT_RULES,
  getFacilitySlotStatus,
} from '@/lib/facilityStore';

export interface FacilityAmenityItem {
  id: string;
  name: string;
  category: string;
  location: string;
  hours: string;
  density: string;
  temp: string;
  image: string;
  icon: LucideIcon;
  accessType: string;
  accessBadge: string;
  price: string;
}

export interface RefundResultAlert {
  type: 'success' | 'error' | 'warning';
  message: string;
  refundRate?: number;
  refundAmount?: number;
}

export interface FacilityContext {
  t: (vi: string, en?: string) => string;
  isEn: boolean;
  currentUser: User;
  onNavigateModule?: (moduleId: string) => void;
  aptCode: string;
  missingApartment: boolean;
  isOwner: boolean;
  userName: string;
  activeTab: 'DISCOVER' | 'BOOKING' | 'LOGS';
  setActiveTab: React.Dispatch<React.SetStateAction<'DISCOVER' | 'BOOKING' | 'LOGS'>>;
  filterCategory: 'ALL' | 'SPORTS' | 'WELLNESS' | 'PARTY' | 'PARK';
  setFilterCategory: React.Dispatch<React.SetStateAction<'ALL' | 'SPORTS' | 'WELLNESS' | 'PARTY' | 'PARK'>>;
  logFilter: string;
  setLogFilter: React.Dispatch<React.SetStateAction<string>>;
  showSmartCardModal: boolean;
  setShowSmartCardModal: React.Dispatch<React.SetStateAction<boolean>>;
  turnstileModalFac: FacilityAmenityItem | null;
  setTurnstileModalFac: React.Dispatch<React.SetStateAction<FacilityAmenityItem | null>>;
  turnstileMethod: 'NFC' | 'FACE_ID';
  setTurnstileMethod: React.Dispatch<React.SetStateAction<'NFC' | 'FACE_ID'>>;
  isTurnstileScanning: boolean;
  setIsTurnstileScanning: React.Dispatch<React.SetStateAction<boolean>>;
  turnstileSuccessMsg: string | null;
  setTurnstileSuccessMsg: React.Dispatch<React.SetStateAction<string | null>>;
  accessLogs: FacilityCheckinLog[];
  setAccessLogs: React.Dispatch<React.SetStateAction<FacilityCheckinLog[]>>;
  bookings: FacilityBooking[];
  setBookings: React.Dispatch<React.SetStateAction<FacilityBooking[]>>;
  quota: { used: number; max: number; remaining: number };
  setQuota: React.Dispatch<React.SetStateAction<{ used: number; max: number; remaining: number }>>;
  bookingFacilityId: string;
  setBookingFacilityId: React.Dispatch<React.SetStateAction<string>>;
  bookingDate: string;
  setBookingDate: React.Dispatch<React.SetStateAction<string>>;
  bookingTimeSlot: string;
  setBookingTimeSlot: React.Dispatch<React.SetStateAction<string>>;
  bookingGuestCount: number;
  setBookingGuestCount: React.Dispatch<React.SetStateAction<number>>;
  bookingDurationHours: number;
  setBookingDurationHours: React.Dispatch<React.SetStateAction<number>>;
  bookingPaymentMethod: string;
  setBookingPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  bookingNotes: string;
  setBookingNotes: React.Dispatch<React.SetStateAction<string>>;
  bookingSuccessMsg: string | null;
  setBookingSuccessMsg: React.Dispatch<React.SetStateAction<string | null>>;
  bookingErrorMsg: string | null;
  setBookingErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  refundModalBooking: FacilityBooking | null;
  setRefundModalBooking: React.Dispatch<React.SetStateAction<FacilityBooking | null>>;
  refundReason: string;
  setRefundReason: React.Dispatch<React.SetStateAction<string>>;
  isProcessingRefund: boolean;
  setIsProcessingRefund: React.Dispatch<React.SetStateAction<boolean>>;
  refundResultAlert: RefundResultAlert | null;
  setRefundResultAlert: React.Dispatch<React.SetStateAction<RefundResultAlert | null>>;
  amenitiesList: FacilityAmenityItem[];
  todayStr: string;
  facilityTimeSlots: string[];
  currentSlotStatus: ReturnType<typeof getFacilitySlotStatus>;
  currentLimitRule: (typeof FACILITY_LIMIT_RULES)[keyof typeof FACILITY_LIMIT_RULES];
  handleExecuteTurnstileCheckin: () => void;
  handleCheckinTicket: (ticketCode: string) => Promise<void> | void;
  handleCreateBooking: (e: React.FormEvent) => void;
  handleOpenRefundModal: (booking: FacilityBooking) => void;
  handleConfirmRefund: () => void;
  filteredAmenities: FacilityAmenityItem[];
  filteredLogs: FacilityCheckinLog[];
}

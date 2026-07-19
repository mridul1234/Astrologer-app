export type SessionStatus = "ACTIVE" | "ENDED" | "CANCELLED";

export type ChatSession = {
  id: string;
  userId: string;
  astrologerId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  totalCost: number | null;
  astrologerEarnings?: number | null;
  astrologer?: {
    ratePerMin: number;
    profileImage?: string | null;
    user?: { name: string } | null;
  };
  user: { name: string; walletBalance?: number; kundliProfile?: KundliProfile | null } | null;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
  user?: { name: string } | null;
};

export type KundliProfile = {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

export type AstrologerProfile = {
  id: string;
  userId: string;
  bio: string | null;
  speciality: string | null;
  languages: string | null;
  ratePerMin: number;
  profileImage?: string | null;
  telegramChatId?: string | null;
  phoneNumber?: string | null;
  isOnline: boolean;
  user: { id: string; name: string; email?: string; walletBalance?: number };
  chatSessions: ChatSession[];
  reviews: Review[];
  totalEarnings: number;
  todaysEarnings: number;
  avgRating: number;
  balance: number;
};

export type Withdrawal = {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  processedAt?: string | null;
};

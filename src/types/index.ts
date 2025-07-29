export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'guest';
  createdAt: Date;
  updatedAt: Date;
}

export interface Competition {
  _id: string;
  name: string;
  description: string;
  category: string;
  startDate: string | Date;
  endDate: string | Date;
  maxParticipants: number;
  currentParticipants: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  prizes: {
    first: string;
    second: string;
    third: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CompetitionFormData {
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  prizes: {
    first: string;
    second: string;
    third: string;
  };
}

export interface Participant {
  _id: string;
  competitionId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  registrationDate: Date;
  status: 'registered' | 'confirmed' | 'disqualified';
  teamMembers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  _id: string;
  competitionId: string;
  participantId: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  files: string[];
  score?: number;
  feedback?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Finance {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  reference?: string;
  source: 'manual' | 'telegram' | 'bank';
  telegramData?: {
    messageId: string;
    chatId: string;
    username?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  type: 'proposal_update' | 'finance_update' | 'participant_update' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  userId?: string;
  createdAt: Date;
}

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'competition' | 'proposal' | 'finance' | 'participant';
  status: 'completed' | 'in_progress' | 'upcoming';
}

export interface HeatmapData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}
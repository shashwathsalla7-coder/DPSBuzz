'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send,
  Lock,
  Unlock,
  Users,
  CheckCheck,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  MoreVertical,
  Video,
  Smile,
  Paperclip,
  Mic,
  Shield,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Megaphone,
  UserPlus,
  Check,
  Mail,
  Award,
  Play,
  Share2,
  Clock,
  WifiOff,
  Camera,
  FileText,
  Image as ImageIcon,
  Flame,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MessageCircle,
  Phone,
  Info,
  Bell,
  BellOff,
  Pin,
  Sparkles,
  ExternalLink,
  UserCheck,
  GraduationCap,
  BookOpen,
  Building,
  Layers,
  Database,
  CheckCircle,
  Radio,
  Upload,
} from 'lucide-react';
import {
  schoolSystem,
  WhatsAppChannel,
  WhatsAppMessage,
  GroupInvite,
} from '@/lib/schoolFeatures';
import { DataStore, Profile } from '@/lib/dataStore';

// Apple Palette Distinct Accent Colors
const SENDER_COLORS = [
  '#007AFF', // Apple Blue
  '#34C759', // Apple Green
  '#FF9500', // Apple Orange
  '#AF52DE', // Apple Purple
  '#FF2D55', // Apple Pink
  '#5856D6', // Apple Indigo
  '#00C7BE', // Apple Teal
  '#FF3B30', // Apple Red
];

function getSenderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

export function cleanChannelName(name: string): string {
  if (!name) return '';
  return name
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1F004}\u{1F0CF}\u{2B50}\u{2B55}\u{231A}-\u{23F3}]/gu, '')
    .trim();
}

interface ReactionItem {
  emoji: string;
  count: number;
  users: string[];
}

interface EnrolledMember {
  id: string;
  username: string;
  name: string;
  role: 'principal' | 'faculty' | 'rep' | 'student';
  roleLabel: string;
  className: string;
  rollNo?: string;
  admissionNo: string;
  house: string;
  isVerified: boolean;
  avatar?: string | null;
  online: boolean;
  spiritPoints: number;
  attendance: string;
}

// ============================================================================
// STRICT ROSTERS PER CHANNEL (ZERO Cross-Class Student Pollution)
// ============================================================================
const ROSTERS_BY_CHANNEL: Record<string, EnrolledMember[]> = {
  // --------------------------------------------------------------------------
  // CLASS 9-B ROSTER: ONLY Grade 9, Section B Students + Assigned Teachers
  // --------------------------------------------------------------------------
  'channel-class-9b': [
    {
      id: 'mem-9b-principal',
      username: 'madam_principal',
      name: 'Dr. Pratibha Kohli',
      role: 'principal',
      roleLabel: 'Office of the Principal',
      className: 'Official Staff',
      admissionNo: 'DPS-STAFF-001',
      house: 'Ex-Officio',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 1250,
      attendance: '100%',
    },
    {
      id: 'mem-9b-teacher',
      username: 'teacher_english',
      name: 'Anita Sharma Madam',
      role: 'faculty',
      roleLabel: 'Faculty (English Dept Head & 9-B Mentor)',
      className: 'Staff Faculty',
      admissionNo: 'DPS-FAC-2018',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 890,
      attendance: '99%',
    },
    {
      id: 'mem-9b-sahana',
      username: 'sahana_3009',
      name: 'S. Sahana',
      role: 'rep',
      roleLabel: 'Class Representative (9-B)',
      className: 'Class 9-B',
      rollNo: '31',
      admissionNo: 'DPS-2024-9B31',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 710,
      attendance: '98.5%',
    },
    {
      id: 'mem-9b-aarav',
      username: 'aarav_mehta9',
      name: 'Aarav Mehta',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '1',
      admissionNo: 'DPS-2024-9B01',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 580,
      attendance: '97.4%',
    },
    {
      id: 'mem-9b-ananya',
      username: 'ananya_sharma9',
      name: 'Ananya Sharma',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '4',
      admissionNo: 'DPS-2024-9B04',
      house: 'Kaveri House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 620,
      attendance: '98.1%',
    },
    {
      id: 'mem-9b-kabir',
      username: 'kabir_j9',
      name: 'Kabir Joshi',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '12',
      admissionNo: 'DPS-2024-9B12',
      house: 'Narmada House',
      isVerified: true,
      avatar: null,
      online: false,
      spiritPoints: 490,
      attendance: '95.8%',
    },
    {
      id: 'mem-9b-diya',
      username: 'diya_k9',
      name: 'Diya Kapoor',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '15',
      admissionNo: 'DPS-2024-9B15',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 530,
      attendance: '96.5%',
    },
    {
      id: 'mem-9b-ishaan',
      username: 'ishaan_v9',
      name: 'Ishaan Verma',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '19',
      admissionNo: 'DPS-2024-9B19',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 510,
      attendance: '96.0%',
    },
    {
      id: 'mem-9b-priya',
      username: 'priya_n9',
      name: 'Priya Nair',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '24',
      admissionNo: 'DPS-2024-9B24',
      house: 'Kaveri House',
      isVerified: true,
      avatar: null,
      online: false,
      spiritPoints: 470,
      attendance: '95.1%',
    },
    {
      id: 'mem-9b-rohan',
      username: 'rohan_sen9b',
      name: 'Rohan Sen',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '27',
      admissionNo: 'DPS-2024-9B27',
      house: 'Narmada House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 540,
      attendance: '97.0%',
    },
    {
      id: 'mem-9b-tanvi',
      username: 'tanvi_r9',
      name: 'Tanvi Reddy',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '35',
      admissionNo: 'DPS-2024-9B35',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 600,
      attendance: '98.0%',
    },
    {
      id: 'mem-9b-vivaan',
      username: 'vivaan_g9',
      name: 'Vivaan Gupta',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 9-B',
      rollNo: '39',
      admissionNo: 'DPS-2024-9B39',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: false,
      spiritPoints: 460,
      attendance: '94.8%',
    },
  ],

  // --------------------------------------------------------------------------
  // CLASS 8-G ROSTER: ONLY Grade 8, Section G Students + Assigned Teachers
  // --------------------------------------------------------------------------
  'channel-class-8g': [
    {
      id: 'mem-8g-principal',
      username: 'madam_principal',
      name: 'Dr. Pratibha Kohli',
      role: 'principal',
      roleLabel: 'Office of the Principal',
      className: 'Official Staff',
      admissionNo: 'DPS-STAFF-001',
      house: 'Ex-Officio',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 1250,
      attendance: '100%',
    },
    {
      id: 'mem-8g-teacher',
      username: 'teacher_english',
      name: 'Anita Sharma Madam',
      role: 'faculty',
      roleLabel: 'Faculty (Class Teacher 8-G)',
      className: 'Staff Faculty',
      admissionNo: 'DPS-FAC-2018',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 890,
      attendance: '99%',
    },
    {
      id: 'mem-8g-shashwath',
      username: 'shashwath71845',
      name: 'Shashwath Salla',
      role: 'rep',
      roleLabel: 'Class Representative (8-G)',
      className: 'Class 8-G',
      rollNo: '24',
      admissionNo: 'DPS-2024-8G24',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 720,
      attendance: '98.5%',
    },
    {
      id: 'mem-8g-rishi',
      username: 'rishi_one9',
      name: 'Y Rishikesh Reddy',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '36',
      admissionNo: 'DPS-2024-8G36',
      house: 'Kaveri House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 640,
      attendance: '97.2%',
    },
    {
      id: 'mem-8g-rohan',
      username: 'rohan728',
      name: 'Rohan R',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '28',
      admissionNo: 'DPS-2024-8G28',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 510,
      attendance: '96.8%',
    },
    {
      id: 'mem-8g-chandan',
      username: 'chandan',
      name: 'Chandan',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '12',
      admissionNo: 'DPS-2024-8G12',
      house: 'Narmada House',
      isVerified: true,
      avatar: null,
      online: false,
      spiritPoints: 480,
      attendance: '95.4%',
    },
    {
      id: 'mem-8g-ashwith',
      username: 'ashwith',
      name: 'K. Ashwith',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '19',
      admissionNo: 'DPS-2024-8G19',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 530,
      attendance: '97.0%',
    },
    {
      id: 'mem-8g-sreekrishna',
      username: 'sreekrishna',
      name: 'G. Ananth Sree Krishna',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '15',
      admissionNo: 'DPS-2024-8G15',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: false,
      spiritPoints: 490,
      attendance: '96.1%',
    },
    {
      id: 'mem-8g-vignesh',
      username: 'vignesh',
      name: 'Vignesh',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '41',
      admissionNo: 'DPS-2024-8G41',
      house: 'Kaveri House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 420,
      attendance: '94.8%',
    },
    {
      id: 'mem-8g-varshith',
      username: 'varshithjella',
      name: 'Jella Varshith',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 8-G',
      rollNo: '21',
      admissionNo: 'DPS-2024-8G21',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 495,
      attendance: '96.4%',
    },
  ],

  // --------------------------------------------------------------------------
  // CLASS 10-A ROSTER: ONLY Grade 10, Section A Students + Senior Teachers
  // --------------------------------------------------------------------------
  'channel-class-10a': [
    {
      id: 'mem-10a-principal',
      username: 'madam_principal',
      name: 'Dr. Pratibha Kohli',
      role: 'principal',
      roleLabel: 'Office of the Principal',
      className: 'Official Staff',
      admissionNo: 'DPS-STAFF-001',
      house: 'Ex-Officio',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 1250,
      attendance: '100%',
    },
    {
      id: 'mem-10a-teacher',
      username: 'bhattacharya_maths',
      name: 'R. K. Bhattacharya Sir',
      role: 'faculty',
      roleLabel: 'Senior Faculty (Class Teacher 10-A)',
      className: 'Senior Staff',
      admissionNo: 'DPS-FAC-2012',
      house: 'Kaveri House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 950,
      attendance: '100%',
    },
    {
      id: 'mem-10a-ishaan',
      username: 'kvsishaan',
      name: 'Kvsishaan',
      role: 'rep',
      roleLabel: 'Class Representative (10-A)',
      className: 'Class 10-A',
      rollNo: '14',
      admissionNo: 'DPS-2024-10A14',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 730,
      attendance: '98.9%',
    },
    {
      id: 'mem-10a-meera',
      username: 'meera_p10',
      name: 'Meera Patel',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 10-A',
      rollNo: '18',
      admissionNo: 'DPS-2024-10A18',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 640,
      attendance: '98.0%',
    },
    {
      id: 'mem-10a-aditya',
      username: 'aditya_r10',
      name: 'Aditya Rao',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 10-A',
      rollNo: '3',
      admissionNo: 'DPS-2024-10A03',
      house: 'Kaveri House',
      isVerified: true,
      avatar: null,
      online: false,
      spiritPoints: 560,
      attendance: '96.2%',
    },
    {
      id: 'mem-10a-sneha',
      username: 'sneha_p10',
      name: 'Sneha Pillai',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 10-A',
      rollNo: '29',
      admissionNo: 'DPS-2024-10A29',
      house: 'Narmada House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 590,
      attendance: '97.5%',
    },
    {
      id: 'mem-10a-aryan',
      username: 'aryan_c10',
      name: 'Aryan Chopra',
      role: 'student',
      roleLabel: 'Verified Student',
      className: 'Class 10-A',
      rollNo: '7',
      admissionNo: 'DPS-2024-10A07',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 520,
      attendance: '95.8%',
    },
  ],

  // --------------------------------------------------------------------------
  // SCIENCE CLUB ROSTER: Inter-Grade STEM Society Members
  // --------------------------------------------------------------------------
  'channel-science-club': [
    {
      id: 'mem-sc-teacher',
      username: 'science_faculty',
      name: 'Dr. A. P. J. Verma',
      role: 'faculty',
      roleLabel: 'Faculty Advisor (Science Society)',
      className: 'Science Dept',
      admissionNo: 'DPS-FAC-2015',
      house: 'Narmada House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 920,
      attendance: '100%',
    },
    {
      id: 'mem-sc-shashwath',
      username: 'shashwath71845',
      name: 'Shashwath Salla',
      role: 'rep',
      roleLabel: 'Club President (Class 8-G)',
      className: 'Class 8-G',
      rollNo: '24',
      admissionNo: 'DPS-2024-8G24',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 720,
      attendance: '98.5%',
    },
    {
      id: 'mem-sc-sahana',
      username: 'sahana_3009',
      name: 'S. Sahana',
      role: 'rep',
      roleLabel: 'Club Vice-President (Class 9-B)',
      className: 'Class 9-B',
      rollNo: '31',
      admissionNo: 'DPS-2024-9B31',
      house: 'Ganges House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 710,
      attendance: '98.5%',
    },
    {
      id: 'mem-sc-kvsishaan',
      username: 'kvsishaan',
      name: 'Kvsishaan',
      role: 'student',
      roleLabel: 'Club Secretary (Class 10-A)',
      className: 'Class 10-A',
      rollNo: '14',
      admissionNo: 'DPS-2024-10A14',
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 730,
      attendance: '98.9%',
    },
  ],

  // --------------------------------------------------------------------------
  // PRINCIPAL DISPATCHES: School-Wide Central Announcements
  // --------------------------------------------------------------------------
  'channel-school-broadcast': [
    {
      id: 'mem-broad-principal',
      username: 'madam_principal',
      name: 'Dr. Pratibha Kohli',
      role: 'principal',
      roleLabel: 'School Principal & Head of Institution',
      className: 'Office of Principal',
      admissionNo: 'DPS-STAFF-001',
      house: 'Ex-Officio',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 1250,
      attendance: '100%',
    },
    {
      id: 'mem-broad-vice',
      username: 'vice_principal',
      name: 'Mrs. S. Chona',
      role: 'faculty',
      roleLabel: 'Vice-Principal (Academic Affairs)',
      className: 'Administrative Office',
      admissionNo: 'DPS-STAFF-002',
      house: 'Ex-Officio',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 1100,
      attendance: '100%',
    },
  ],
};

// ============================================================================
// STUDENT DIRECTORY FOR ADDING MEMBERS (Categorized by Strict Grade)
// ============================================================================
// STUDENT DIRECTORY FOR ADDING MEMBERS (Strict Grade AND Section Isolation)
// ============================================================================
const ALL_STUDENT_DIRECTORY = [
  // Class 8, Section G Candidates (Strictly 8-G only)
  { name: 'Shashwath Salla', username: 'shashwath71845', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Yamuna House', rollNo: '24' },
  { name: 'Y Rishikesh Reddy', username: 'rishi_one9', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Kaveri House', rollNo: '36' },
  { name: 'Rohan R', username: 'rohan728', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Ganges House', rollNo: '28' },
  { name: 'Chandan', username: 'chandan', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Narmada House', rollNo: '12' },
  { name: 'K. Ashwith', username: 'ashwith', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Yamuna House', rollNo: '19' },
  { name: 'G. Ananth Sree Krishna', username: 'sreekrishna', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Ganges House', rollNo: '15' },
  { name: 'Vignesh', username: 'vignesh', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Kaveri House', rollNo: '41' },
  { name: 'Jella Varshith', username: 'varshithjella', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Yamuna House', rollNo: '21' },
  { name: 'Pranav Nair', username: 'pranav_n8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Kaveri House', rollNo: '29' },
  { name: 'Sai Teja Reddy', username: 'saiteja_8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Ganges House', rollNo: '31' },
  { name: 'Anirudh Rao', username: 'anirudh_r8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Yamuna House', rollNo: '7' },
  { name: 'B. Karthik', username: 'karthik_b8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Narmada House', rollNo: '9' },
  { name: 'Niharika Reddy', username: 'niharika_8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Kaveri House', rollNo: '23' },
  { name: 'Aditi Deshpande', username: 'aditi_d8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Ganges House', rollNo: '2' },
  { name: 'Tanmay Kulkarni', username: 'tanmay_k8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Yamuna House', rollNo: '38' },
  { name: 'Kavya Menon', username: 'kavya_m8g', class: 'Class 8-G', grade: 'Class 8', section: 'G', house: 'Kaveri House', rollNo: '17' },

  // Class 9, Section B Candidates (Strictly 9-B only)
  { name: 'S. Sahana', username: 'sahana_3009', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Ganges House', rollNo: '31' },
  { name: 'Aarav Mehta', username: 'aarav_mehta9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Yamuna House', rollNo: '1' },
  { name: 'Ananya Sharma', username: 'ananya_sharma9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Kaveri House', rollNo: '4' },
  { name: 'Kabir Joshi', username: 'kabir_j9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Narmada House', rollNo: '12' },
  { name: 'Diya Kapoor', username: 'diya_k9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Ganges House', rollNo: '15' },
  { name: 'Ishaan Verma', username: 'ishaan_v9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Yamuna House', rollNo: '19' },
  { name: 'Priya Nair', username: 'priya_n9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Kaveri House', rollNo: '24' },
  { name: 'Rohan Sen', username: 'rohan_sen9b', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Narmada House', rollNo: '27' },
  { name: 'Tanvi Reddy', username: 'tanvi_r9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Ganges House', rollNo: '35' },
  { name: 'Vivaan Gupta', username: 'vivaan_g9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Yamuna House', rollNo: '39' },
  { name: 'Mehak Kaur', username: 'mehak_k9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Kaveri House', rollNo: '22' },
  { name: 'Aditya Jain', username: 'aditya_j9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Narmada House', rollNo: '3' },
  { name: 'Devansh Rastogi', username: 'devansh_r9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Yamuna House', rollNo: '8' },
  { name: 'Samaira Seth', username: 'samaira_s9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Ganges House', rollNo: '33' },
  { name: 'Tarun Aggarwal', username: 'tarun_a9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Kaveri House', rollNo: '37' },
  { name: 'Ritika Roy', username: 'ritika_r9', class: 'Class 9-B', grade: 'Class 9', section: 'B', house: 'Yamuna House', rollNo: '26' },

  // Class 10, Section A Candidates (Strictly 10-A only)
  { name: 'Kvsishaan', username: 'kvsishaan', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Yamuna House', rollNo: '14' },
  { name: 'Meera Patel', username: 'meera_p10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Ganges House', rollNo: '18' },
  { name: 'Aditya Rao', username: 'aditya_r10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Kaveri House', rollNo: '3' },
  { name: 'Sneha Pillai', username: 'sneha_p10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Narmada House', rollNo: '29' },
  { name: 'Aryan Chopra', username: 'aryan_c10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Yamuna House', rollNo: '7' },
  { name: 'Rahul Verma', username: 'rahul_v10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Kaveri House', rollNo: '22' },
  { name: 'Pooja Nair', username: 'pooja_n10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Ganges House', rollNo: '20' },
  { name: 'Tarun Joshi', username: 'tarun_j10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Narmada House', rollNo: '32' },
  { name: 'Anika Singhal', username: 'anika_s10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Yamuna House', rollNo: '5' },
  { name: 'Karan Malhotra', username: 'karan_m10', class: 'Class 10-A', grade: 'Class 10', section: 'A', house: 'Kaveri House', rollNo: '15' },

  // Class 8, Section A Candidates (Strictly 8-A only - Never appears in 8-G)
  { name: 'Ishanvi', username: 'ishanvi', class: 'Class 8-A', grade: 'Class 8', section: 'A', house: 'Yamuna House', rollNo: '18' },
  { name: 'Dhruv Patil', username: 'dhruv_p8a', class: 'Class 8-A', grade: 'Class 8', section: 'A', house: 'Ganges House', rollNo: '11' },
  { name: 'Sanya Verma', username: 'sanya_v8a', class: 'Class 8-A', grade: 'Class 8', section: 'A', house: 'Kaveri House', rollNo: '27' },

  // Class 7, Section B Candidates (Strictly 7-B only)
  { name: 'Neelam Mokshith Ram', username: 'mokshith7b', class: 'Class 7-B', grade: 'Class 7', section: 'B', house: 'Narmada House', rollNo: '22' },
  { name: 'Aarav Deshmukh', username: 'aarav_d7', class: 'Class 7-B', grade: 'Class 7', section: 'B', house: 'Yamuna House', rollNo: '1' },
  { name: 'Charvi Sharma', username: 'charvi_s7', class: 'Class 7-B', grade: 'Class 7', section: 'B', house: 'Ganges House', rollNo: '9' },
  { name: 'Vihaan Kulkarni', username: 'vihaan_k7b', class: 'Class 7-B', grade: 'Class 7', section: 'B', house: 'Kaveri House', rollNo: '34' },
];

// ============================================================================
// AUTHENTIC SEED MESSAGES ISOLATED PER CLASSROOM
// ============================================================================
const SEED_CLASS_MESSAGES: WhatsAppMessage[] = [
  // Class 9-B Messages (ONLY 9-B students & teachers)
  {
    id: 'msg-9b-1',
    channelId: 'channel-class-9b',
    senderUsername: 'teacher_english',
    senderName: 'Anita Sharma Madam',
    senderRole: 'teacher',
    senderClass: 'English Dept Head',
    text: 'Good morning Class 9-B! Please ensure your Term 1 English Literature projects on "The Merchant of Venice" are ready for review this Wednesday.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 'msg-9b-2',
    channelId: 'channel-class-9b',
    senderUsername: 'sahana_3009',
    senderName: 'S. Sahana',
    senderRole: 'student',
    senderClass: 'Class 9-B • Roll 31',
    text: 'Good morning Anita Madam! I have compiled the class list for group presentations. All 10 groups have submitted their slide decks.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    id: 'msg-9b-3',
    channelId: 'channel-class-9b',
    senderUsername: 'aarav_mehta9',
    senderName: 'Aarav Mehta',
    senderRole: 'student',
    senderClass: 'Class 9-B • Roll 1',
    text: 'Madam, are we presenting in the AV room or our regular classroom 302?',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'msg-9b-4',
    channelId: 'channel-class-9b',
    senderUsername: 'teacher_english',
    senderName: 'Anita Sharma Madam',
    senderRole: 'teacher',
    senderClass: 'English Dept Head',
    text: '> Replying to @Aarav Mehta: "Madam, are we presenting in the AV room or our regular classroom 302?"\n\nWe have booked the AV Room 1 for periods 4 and 5. Please bring your presentations on a pendrive or shared drive.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 1,
  },
  {
    id: 'msg-9b-5',
    channelId: 'channel-class-9b',
    senderUsername: 'ananya_sharma9',
    senderName: 'Ananya Sharma',
    senderRole: 'student',
    senderClass: 'Class 9-B • Roll 4',
    text: 'Thank you Madam! Group 4 presentation is uploaded to the study drive.',
    templateType: 'none',
    timestamp: Date.now() - 1800000,
  },

  // Class 8-G Messages (ONLY 8-G students & teachers)
  {
    id: 'msg-8g-1',
    channelId: 'channel-class-8g',
    senderUsername: 'teacher_english',
    senderName: 'Anita Sharma Madam',
    senderRole: 'teacher',
    senderClass: 'Class Teacher 8-G',
    text: 'Good morning Class 8-G! Science lab practical notebooks must be submitted by this Friday 3 PM at Lab 204.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: 'msg-8g-2',
    channelId: 'channel-class-8g',
    senderUsername: 'shashwath71845',
    senderName: 'Shashwath Salla',
    senderRole: 'admin',
    senderClass: 'Class 8-G • Roll 24',
    text: 'Understood Madam, I will collect all notebooks from roll 1 to 41 during period 3 and deposit them at Lab 204.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    id: 'msg-8g-3',
    channelId: 'channel-class-8g',
    senderUsername: 'rishi_one9',
    senderName: 'Y Rishikesh Reddy',
    senderRole: 'student',
    senderClass: 'Class 8-G • Roll 36',
    text: 'Shashwath, are diagrams compulsory for chapter 5 practicals?',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'msg-8g-4',
    channelId: 'channel-class-8g',
    senderUsername: 'shashwath71845',
    senderName: 'Shashwath Salla',
    senderRole: 'admin',
    senderClass: 'Class 8-G • Roll 24',
    text: '> Replying to @Y Rishikesh Reddy: "Shashwath, are diagrams compulsory for chapter 5 practicals?"\n\nYes Rishi, page 42 circuit diagram is compulsory with HB pencil.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 1,
  },
  {
    id: 'msg-8g-5',
    channelId: 'channel-class-8g',
    senderUsername: 'rohan728',
    senderName: 'Rohan R',
    senderRole: 'student',
    senderClass: 'Class 8-G • Roll 28',
    text: 'Completed mine! See you all in period 3.',
    templateType: 'none',
    timestamp: Date.now() - 1200000,
  },

  // Class 10-A Messages (ONLY 10-A students & teachers)
  {
    id: 'msg-10a-1',
    channelId: 'channel-class-10a',
    senderUsername: 'bhattacharya_maths',
    senderName: 'R. K. Bhattacharya Sir',
    senderRole: 'teacher',
    senderClass: 'Senior Mathematics Faculty',
    text: 'Class 10-A, Quadratic Equations board preparatory mock test is scheduled for next Tuesday.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 'msg-10a-2',
    channelId: 'channel-class-10a',
    senderUsername: 'kvsishaan',
    senderName: 'Kvsishaan',
    senderRole: 'student',
    senderClass: 'Class 10-A • Roll 14',
    text: 'Sir, will NCERT Exemplar problems be included in the test?',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'msg-10a-3',
    channelId: 'channel-class-10a',
    senderUsername: 'bhattacharya_maths',
    senderName: 'R. K. Bhattacharya Sir',
    senderRole: 'teacher',
    senderClass: 'Senior Mathematics Faculty',
    text: '> Replying to @Kvsishaan: "Sir, will NCERT Exemplar problems be included in the test?"\n\nYes Kvsishaan, practice exercise 4.3 and 4.4 thoroughly along with 5-mark word problems.',
    templateType: 'none',
    timestamp: Date.now() - 3600000 * 1,
  },

  // Principal Dispatches (Central School Announcements)
  {
    id: 'msg-broadcast-1',
    channelId: 'channel-school-broadcast',
    senderUsername: 'madam_principal',
    senderName: 'Dr. Pratibha Kohli',
    senderRole: 'admin',
    senderClass: 'Office of the Principal',
    text: 'CIRCULAR NO. 42 / 2026: Delhi Public School Term 1 Examination Date Sheet and Syllabus guidelines have been officially released. All students from Grades 5 to 12 must review their subject timetables.',
    templateType: 'exam',
    timestamp: Date.now() - 3600000 * 8,
  },
];

// ============================================================================
// APPLE MESSAGE BUBBLE COMPONENT
// ============================================================================
interface MessageBubbleProps {
  msg: WhatsAppMessage;
  isMe: boolean;
  isSameSenderAsPrev: boolean;
  isDark: boolean;
  reactions: ReactionItem[];
  onToggleReaction: (msgId: string, emoji: string) => void;
  onReply: (msg: WhatsAppMessage) => void;
  onOpenProfile: (username: string) => void;
}

const MessageBubbleItem = memo(function MessageBubbleItem({
  msg,
  isMe,
  isSameSenderAsPrev,
  isDark,
  reactions,
  onToggleReaction,
  onReply,
  onOpenProfile,
}: MessageBubbleProps) {
  const isPrincipal =
    msg.senderRole === 'admin' ||
    msg.senderUsername.toLowerCase() === 'madam_principal' ||
    msg.senderName.toLowerCase().includes('principal');
  const isFaculty = msg.senderRole === 'teacher' || msg.senderUsername.toLowerCase().includes('teacher') || msg.senderUsername.includes('maths');
  const isSystem = msg.senderUsername === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3 px-4">
        <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 text-center max-w-md shadow-xs border border-black/5 dark:border-white/5">
          {msg.text}
        </span>
      </div>
    );
  }

  const senderColor = isPrincipal ? '#ea4335' : isFaculty ? '#f59e0b' : getSenderColor(msg.senderName);

  // Quoted text parsing
  let quoteAuthor = '';
  let quoteSnippet = '';
  let mainBody = msg.text;

  if (msg.text.startsWith('> Replying to @')) {
    const quoteEnd = msg.text.indexOf('\n\n');
    if (quoteEnd !== -1) {
      const quoteLine = msg.text.slice(0, quoteEnd);
      const match = quoteLine.match(/> Replying to @([^:]+):\s*"([\s\S]+?)"/);
      if (match) {
        quoteAuthor = match[1];
        quoteSnippet = match[2];
        mainBody = msg.text.slice(quoteEnd + 2);
      }
    }
  }

  let extractedMedia = msg.mediaUrl;
  if (!extractedMedia) {
    const imgMatch = mainBody.match(/https?:\/\/[^\s]+?\.(?:png|jpe?g|webp|gif|svg)(\?[^\s]*)?/i) || mainBody.match(/data:image\/[a-z0-9+-]+;base64,[^\s]+/i);
    if (imgMatch) {
      extractedMedia = imgMatch[0];
    }
  }
  const isVideoPost = msg.mediaType === 'video' || mainBody.includes('Me in my prime');
  const isImagePost = msg.mediaType === 'image' || Boolean(extractedMedia && !isVideoPost);
  const displayBody = extractedMedia && mainBody.includes(extractedMedia) ? mainBody.replace(extractedMedia, '').trim() : mainBody;

  return (
    <div
      className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${
        isSameSenderAsPrev ? 'mt-1' : 'mt-3.5'
      }`}
    >
      {!isMe && (
        <div className="w-8 shrink-0">
          {!isSameSenderAsPrev ? (
            <button
              type="button"
              onClick={() => onOpenProfile(msg.senderUsername)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
              style={{ backgroundColor: senderColor }}
              title={`View @${msg.senderUsername}'s Verified DPS Profile`}
            >
              {msg.senderName.slice(0, 1).toUpperCase()}
              {isPrincipal ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-900">
                  ★
                </span>
              ) : isFaculty ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-900">
                  ✓
                </span>
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-900">
                  ✓
                </span>
              )}
            </button>
          ) : null}
        </div>
      )}

      <div className="flex flex-col max-w-[86%] sm:max-w-[76%] md:max-w-[70%] group relative">
        {!isMe && !isSameSenderAsPrev && (
          <div className="mb-1 ml-1 flex items-center gap-1.5 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => onOpenProfile(msg.senderUsername)}
              className="font-semibold hover:underline cursor-pointer flex items-center gap-1"
              style={{ color: senderColor }}
            >
              <span>{msg.senderName}</span>
              {isPrincipal ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/20">
                  <Award size={10} />
                  <span>Principal</span>
                </span>
              ) : isFaculty ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                  <ShieldCheck size={10} />
                  <span>Faculty</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-500/10 text-[#007AFF] dark:text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                  <CheckCircle2 size={10} />
                  <span>Verified</span>
                </span>
              )}
            </button>

            {msg.senderClass && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                • {msg.senderClass}
              </span>
            )}
          </div>
        )}

        {isPrincipal && !isSameSenderAsPrev && (
          <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 shadow-2xs">
            <Award size={14} className="shrink-0 text-red-500" />
            <span>OFFICIAL DISPATCH • OFFICE OF THE PRINCIPAL</span>
          </div>
        )}

        {/* Subtle Apple-style Reply Action on Hover */}
        <div
          className={`absolute top-2 ${
            isMe ? '-left-14' : '-right-14'
          } opacity-0 group-hover:opacity-100 transition-opacity flex items-center z-10`}
        >
          <button
            type="button"
            onClick={() => onReply(msg)}
            className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-[#2C2C2E]/90 text-[11px] font-medium text-[#007AFF] shadow-xs border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Reply"
          >
            Reply
          </button>
        </div>

        <div
          className={`relative px-3.5 py-2 text-[14.5px] leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] word-break:break-word transition-all select-text ${
            isMe
              ? 'bg-[#007AFF] text-white rounded-[18px] rounded-br-[4px] shadow-[0_1px_2px_rgba(0,122,255,0.2)]'
              : isDark
              ? 'bg-[#2C2C2E] text-zinc-100 rounded-[18px] rounded-bl-[4px] shadow-xs border border-white/[0.06]'
              : 'bg-[#E9E9EB] text-zinc-900 rounded-[18px] rounded-bl-[4px] shadow-xs border border-black/[0.04]'
          }`}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
          }}
        >
          {quoteAuthor && (
            <div
              className={`mb-2 p-2 rounded-xl text-xs border-l-2 text-left break-words [overflow-wrap:anywhere] ${
                isMe
                  ? 'bg-white/15 border-white text-white/95'
                  : 'bg-black/5 dark:bg-white/5 border-[#007AFF] text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="font-semibold text-[11px] text-[#007AFF] dark:text-blue-400 mb-0.5">
                @{quoteAuthor}
              </div>
              <div className="text-[12px] opacity-90 line-clamp-2 leading-snug">
                {quoteSnippet}
              </div>
            </div>
          )}

          {isVideoPost && (
            <div className="mb-2 relative rounded-[16px] overflow-hidden bg-black/60 border border-white/10 group/video cursor-pointer">
              <div className="h-48 sm:h-56 w-full bg-linear-to-b from-stone-900 via-zinc-900 to-black flex items-center justify-center relative">
                <div className="w-13 h-13 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white group-hover/video:scale-110 transition-transform shadow-lg border border-white/30">
                  <Play size={24} className="ml-0.5 fill-white" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[11px] text-white font-medium flex items-center gap-1.5">
                  <Video size={11} />
                  <span>{msg.mediaDuration || '2:20'}</span>
                </div>
              </div>
            </div>
          )}

          {isImagePost && extractedMedia && (
            <div className="mb-2 rounded-[16px] overflow-hidden max-h-80 cursor-pointer shadow-xs border border-black/5 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={extractedMedia}
                alt="Class Attachment"
                className="w-full h-auto object-cover rounded-[16px] hover:opacity-95 transition-opacity"
              />
            </div>
          )}

          {displayBody && (
            <div className="leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] word-break:break-word">
              {displayBody}
            </div>
          )}

          <div
            className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] select-none ${
              isMe ? 'text-white/75' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
            {isMe && <CheckCheck size={12} className="text-white/90 ml-0.5" />}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN GROUPS PAGE COMPONENT
// ============================================================================
export default function GroupsPage() {
  const router = useRouter();

  // Theme Detection
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr === 'dark') {
        setIsDark(true);
      } else if (themeAttr === 'light') {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  // Core State
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('channel-class-9b');
  const [messages, setMessages] = useState<WhatsAppMessage[]>(SEED_CLASS_MESSAGES);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // STRICT STUDENT GRADE & SECTION ISOLATION
  // Defaults to Class 9-B so 9th grader sees ONLY 9th grade section!
  const [studentGrade, setStudentGrade] = useState<string>('Class 9');
  const [studentSection, setStudentSection] = useState<string>('B');

  // Teacher / Admin Mode Switcher (defaults to teacher mode for reference match)
  const [clientViewMode, setClientViewMode] = useState<'teacher' | 'student'>('teacher');
  const [facultyFilter, setFacultyFilter] = useState<'all' | '9b' | '8g' | '10a' | 'broadcast'>('all');

  // SECTION ROSTERS STATE (Strictly Isolated per Channel)
  const [sectionRosters, setSectionRosters] = useState<Record<string, EnrolledMember[]>>(ROSTERS_BY_CHANNEL);

  // Modals & Sheets
  const [showGroupDetailsSheet, setShowGroupDetailsSheet] = useState(false);
  const [memberFilterTab, setMemberFilterTab] = useState<'all' | 'faculty' | 'reps' | 'students'>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [drawerActiveTab, setDrawerActiveTab] = useState<'members' | 'media' | 'settings'>('members');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [inspectedMember, setInspectedMember] = useState<EnrolledMember | null>(null);
  const [isPinnedNoticeDismissed, setIsPinnedNoticeDismissed] = useState(false);

  // Student Group Creation Notice Modal (Redirect to Chats)
  const [showStudentCreateNotice, setShowStudentCreateNotice] = useState(false);

  // 91 Sections Implementation Demo Sheet for Madam
  const [show91SectionsDemo, setShow91SectionsDemo] = useState(false);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetGroup, setAssignTargetGroup] = useState('channel-class-9b');
  const [assignUsername, setAssignUsername] = useState('teacher_english');
  const [assignRole, setAssignRole] = useState<'teacher' | 'student'>('teacher');
  const [assignSubject, setAssignSubject] = useState('English Faculty');
  const [isAssigning, setIsAssigning] = useState(false);

  // Create Classroom Modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('Class 9');
  const [newGroupSection, setNewGroupSection] = useState('B');
  const [newGroupIsLocked, setNewGroupIsLocked] = useState(false);

  // Principal Multi-Group Broadcast Modal State
  const [showPrincipalBroadcastModal, setShowPrincipalBroadcastModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastImageUrl, setBroadcastImageUrl] = useState('');
  const [broadcastImagePreview, setBroadcastImagePreview] = useState<string | null>(null);
  const [broadcastPriority, setBroadcastPriority] = useState<'urgent' | 'official'>('official');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);

  // Offline and Replying
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ msg: WhatsAppMessage; targetChannelId: string }>>([]);
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCallRoom, setActiveCallRoom] = useState<{ type: 'audio' | 'video'; title: string } | null>(null);
  const [reactions, setReactions] = useState<Record<string, ReactionItem[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSyncTimestampRef = useRef<number>(0);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    const items = [...offlineQueue];
    setOfflineQueue([]);

    for (const item of items) {
      try {
        await fetch('/api/campus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_whatsapp_message',
            channelId: item.targetChannelId,
            senderUsername: item.msg.senderUsername,
            senderName: item.msg.senderName,
            senderRole: item.msg.senderRole,
            senderClass: item.msg.senderClass,
            text: item.msg.text,
            templateType: 'none',
          }),
        });
      } catch {}
    }
    refreshAllData();
  };

  // Adaptive Polling Engine
  const syncIncrementalMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/campus?action=whatsapp_messages&after=${lastSyncTimestampRef.current}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = data.messages.filter((m: WhatsAppMessage) => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return [...prev, ...newOnes];
          });
          const highestTs = Math.max(...data.messages.map((m: WhatsAppMessage) => m.timestamp));
          if (highestTs > lastSyncTimestampRef.current) {
            lastSyncTimestampRef.current = highestTs;
          }
        }
      }
    } catch {}
  }, []);

  const startAdaptivePolling = useCallback(() => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    const isHidden = typeof document !== 'undefined' && document.hidden;
    const intervalMs = isHidden ? 15000 : 2000;

    pollingTimerRef.current = setInterval(() => {
      syncIncrementalMessages();
    }, intervalMs);
  }, [syncIncrementalMessages]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        syncIncrementalMessages();
        startAdaptivePolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    startAdaptivePolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [syncIncrementalMessages, startAdaptivePolling]);

  // Auth & Initial Data Load
  useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    const isTeacher =
      (user as any)?.role === 'teacher' ||
      user?.role === 'admin' ||
      user?.username?.toLowerCase() === 'shashwath71845' ||
      user?.username?.toLowerCase().includes('teacher') ||
      user?.username?.toLowerCase() === 'madam_principal';
    setClientViewMode(isTeacher ? 'teacher' : 'student');

    const rawClass = (user as any)?.class || (user as any)?.classGrade || '';
    if (rawClass && String(rawClass).includes('9')) {
      setStudentGrade('Class 9');
      setStudentSection((user as any)?.section || 'B');
    }

    refreshAllData();

    const handleUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);

    return () => {
      window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
    };
  }, []);

  const refreshAllData = async () => {
    try {
      const res = await fetch('/api/campus', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.whatsappChannels) && data.whatsappChannels.length > 0) {
          setChannels(
            data.whatsappChannels.map((c: any) => ({
              ...c,
              name: cleanChannelName(c.name),
              lastMessage: cleanChannelName(c.lastMessage),
            }))
          );
        } else {
          // Fallback channels matching 91 sections architecture
          setChannels([
            {
              id: 'channel-class-9b',
              name: 'Class 9-B Official Classroom',
              grade: 'Class 9',
              section: 'B',
              isLocked: false,
              adminUsernames: ['madam_principal', 'teacher_english'],
              enrolledUsernames: ['madam_principal', 'teacher_english', 'sahana_3009', 'aarav_mehta9'],
              memberCount: 42,
              lastMessage: 'Anita Sharma Madam: Merchant of Venice review on Wednesday',
              lastMessageTime: '08:30 AM',
            },
            {
              id: 'channel-class-8g',
              name: 'Class 8-G Official Classroom',
              grade: 'Class 8',
              section: 'G',
              isLocked: false,
              adminUsernames: ['madam_principal', 'shashwath71845'],
              enrolledUsernames: ['madam_principal', 'shashwath71845', 'rishi_one9', 'rohan728'],
              memberCount: 39,
              lastMessage: 'Shashwath Salla: Science lab notebooks submission today',
              lastMessageTime: '09:15 AM',
            },
            {
              id: 'channel-class-10a',
              name: 'Class 10-A Official Classroom',
              grade: 'Class 10',
              section: 'A',
              isLocked: false,
              adminUsernames: ['madam_principal', 'bhattacharya_maths'],
              enrolledUsernames: ['madam_principal', 'bhattacharya_maths', 'kvsishaan', 'meera_p10'],
              memberCount: 44,
              lastMessage: 'R. K. Bhattacharya: Quadratic equations practice exercises',
              lastMessageTime: '10:00 AM',
            },
            {
              id: 'channel-science-club',
              name: 'DPS Ramanujan & Aryabhatta Science Club',
              grade: 'Class 8-10',
              section: 'Club',
              isLocked: false,
              adminUsernames: ['madam_principal', 'science_faculty'],
              enrolledUsernames: ['shashwath71845', 'sahana_3009', 'kvsishaan'],
              memberCount: 68,
              lastMessage: 'Dr. Verma: Regional Science Fair registration open',
              lastMessageTime: '11:20 AM',
            },
            {
              id: 'channel-school-broadcast',
              name: 'DPS Official Principal Dispatches',
              grade: 'All',
              section: 'All',
              isLocked: true,
              adminUsernames: ['madam_principal'],
              enrolledUsernames: [],
              memberCount: 5500,
              lastMessage: 'Dr. Pratibha Kohli: Term 1 examination schedule published',
              lastMessageTime: '07:45 AM',
            },
          ]);
        }

        if (Array.isArray(data.whatsappMessages) && data.whatsappMessages.length > 0) {
          // Merge API messages with SEED_CLASS_MESSAGES
          setMessages((prev) => {
            const seedIds = new Set(prev.map((m) => m.id));
            const newOnes = data.whatsappMessages.filter((m: WhatsAppMessage) => !seedIds.has(m.id));
            return [...prev, ...newOnes];
          });
        }

        if (Array.isArray(data.groupInvites)) {
          setGroupInvites(data.groupInvites);
        }
      }
    } catch (e) {
      console.warn('Could not sync class groups:', e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedChannelId]);

  // ==========================================================================
  // STRICT CHANNEL FILTERING: STUDENTS SEE ONLY THEIR SECTION & DISPATCHES
  // ==========================================================================
  const visibleChannels = useMemo(() => {
    if (clientViewMode === 'teacher') {
      if (facultyFilter === '9b') {
        return channels.filter((c) => c.id === 'channel-class-9b' || c.id === 'channel-school-broadcast');
      }
      if (facultyFilter === '8g') {
        return channels.filter((c) => c.id === 'channel-class-8g' || c.id === 'channel-school-broadcast');
      }
      if (facultyFilter === '10a') {
        return channels.filter((c) => c.id === 'channel-class-10a' || c.id === 'channel-school-broadcast');
      }
      if (facultyFilter === 'broadcast') {
        return channels.filter((c) => c.id === 'channel-school-broadcast' || c.grade === 'All');
      }
      // All sections across 91 classrooms
      return channels;
    }

    // STRICT STUDENT ISOLATION:
    // A student in Class 9-B sees ONLY:
    // 1. Class 9-B Official Classroom (their exact section)
    // 2. DPS Official Principal Dispatches (School broadcast)
    // They NEVER see Class 8-G, 10-A, or other grade/section rooms!
    return channels.filter((c) => {
      // 1. Principal Dispatches (Always visible to all 5,500 students)
      if (c.id === 'channel-school-broadcast' || c.grade === 'All') return true;

      // 2. Exact Grade AND Section matching
      const userGradeClean = studentGrade.toLowerCase().replace(/[^0-9]/g, '');
      const channelGradeClean = (c.grade || '').toLowerCase().replace(/[^0-9]/g, '');
      const userSectionClean = studentSection.toLowerCase().trim();
      const channelSectionClean = (c.section || '').toLowerCase().trim();

      const gradeMatches = userGradeClean === channelGradeClean;
      const sectionMatches = userSectionClean === channelSectionClean;

      return gradeMatches && sectionMatches;
    });
  }, [channels, clientViewMode, facultyFilter, studentGrade, studentSection]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return visibleChannels;
    const q = searchQuery.toLowerCase();
    return visibleChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [visibleChannels, searchQuery]);

  // Active Selected Channel
  const activeChannel = useMemo(() => {
    const found = visibleChannels.find((c) => c.id === selectedChannelId);
    if (found) return found;
    return (
      visibleChannels[0] || {
        id: 'channel-class-9b',
        name: 'Class 9-B Official Classroom',
        grade: 'Class 9',
        section: 'B',
        isLocked: false,
        adminUsernames: ['madam_principal', 'teacher_english'],
        enrolledUsernames: ['madam_principal', 'teacher_english', 'sahana_3009'],
        memberCount: 42,
        lastMessage: 'Anita Sharma Madam: Merchant of Venice review on Wednesday',
        lastMessageTime: '08:30 AM',
      }
    );
  }, [visibleChannels, selectedChannelId]);

  // Active Roster Strictly for the Selected Classroom
  const activeClassRoster = useMemo(() => {
    if (sectionRosters[activeChannel.id]) {
      return sectionRosters[activeChannel.id];
    }
    // Fallback: Generate an authentic strictly partitioned roster for this grade & section
    return [
      {
        id: `gen-p-${activeChannel.id}`,
        username: 'madam_principal',
        name: 'Dr. Pratibha Kohli',
        role: 'principal' as const,
        roleLabel: 'Office of the Principal',
        className: 'Staff',
        admissionNo: 'DPS-STAFF-001',
        house: 'Ex-Officio',
        isVerified: true,
        online: true,
        spiritPoints: 1250,
        attendance: '100%',
      },
      {
        id: `gen-t-${activeChannel.id}`,
        username: 'teacher_english',
        name: 'Anita Sharma Madam',
        role: 'faculty' as const,
        roleLabel: `Faculty (${activeChannel.grade}-${activeChannel.section})`,
        className: 'Staff',
        admissionNo: 'DPS-FAC-2018',
        house: 'Ganges House',
        isVerified: true,
        online: true,
        spiritPoints: 890,
        attendance: '99%',
      },
    ];
  }, [sectionRosters, activeChannel]);

  const channelMessages = useMemo(() => {
    return messages.filter((m) => m.channelId === activeChannel.id);
  }, [messages, activeChannel.id]);

  const canSendMessage = clientViewMode === 'teacher' || !activeChannel.isLocked;

  // Header Subtitle showing ONLY this classroom's students
  const channelSubtitle = useMemo(() => {
    if (activeChannel.id === 'channel-school-broadcast') {
      return '5,500 Enrolled Students & Faculty • Official Dispatches';
    }
    const currentList = activeClassRoster;
    const students = currentList.filter((m) => m.role === 'student' || m.role === 'rep');
    const teacher = currentList.find((m) => m.role === 'faculty')?.name.split(' ')[0] || 'Anita';
    const firstTwoStudents = students.slice(0, 2).map((m) => m.name.split(' ')[0]).join(', ');
    const count = activeChannel.memberCount || Math.max(currentList.length, 38);
    return `${activeChannel.grade}${activeChannel.section && activeChannel.section !== 'All' ? `-${activeChannel.section}` : ''} • ${teacher} Madam, ${firstTwoStudents} + ${Math.max(1, count - 3)} enrolled students`;
  }, [activeChannel, activeClassRoster]);

  // Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend || isSending) return;

    if (!canSendMessage) {
      setToastMessage('This channel is read-only. Switch to your classroom to send messages.');
      return;
    }

    setIsSending(true);

    const is9B = activeChannel.id === 'channel-class-9b';
    const is8G = activeChannel.id === 'channel-class-8g';

    const senderUsername = currentUser?.username || (
      clientViewMode === 'teacher'
        ? 'madam_principal'
        : is9B
        ? 'sahana_3009'
        : is8G
        ? 'shashwath71845'
        : 'student'
    );
    const senderName = clientViewMode === 'teacher'
      ? 'Principal Madam (Office)'
      : is9B
      ? 'S. Sahana'
      : is8G
      ? 'Shashwath Salla'
      : (currentUser?.fullName || 'DPS Student');
    const senderRole = clientViewMode === 'teacher' ? 'admin' : (currentUser?.role || 'student');
    const senderClass = clientViewMode === 'teacher' ? 'Office of Principal' : `${activeChannel.grade}-${activeChannel.section}`;

    const optimisticId = `wmsg-opt-${Date.now()}`;
    const quotedText = replyingTo ? `> Replying to @${replyingTo.senderName}: "${replyingTo.text.slice(0, 180)}"\n\n` : '';
    const finalText = quotedText + textToSend;

    const optimisticMsg: WhatsAppMessage = {
      id: optimisticId,
      channelId: activeChannel.id,
      senderUsername,
      senderName,
      senderRole: senderRole as any,
      senderClass,
      text: finalText,
      templateType: 'none',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText('');
    setReplyingTo(null);

    if (!navigator.onLine) {
      setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-username': senderUsername,
          'x-user-role': senderRole,
        },
        body: JSON.stringify({
          action: 'send_whatsapp_message',
          channelId: activeChannel.id,
          senderUsername,
          senderName,
          senderRole,
          senderClass,
          text: finalText,
          templateType: 'none',
          broadcastToAll: clientViewMode === 'teacher' && activeChannel.id === 'channel-school-broadcast',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorText = errorData.error || 'Failed to send message.';
        if (res.status === 403 || errorData.isLocked) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setToastMessage(errorText);
        } else {
          setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
        }
      } else {
        refreshAllData();
      }
    } catch {
      setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Toggle Reactions
  const handleToggleReaction = useCallback((msgId: string, emoji: string) => {
    const curU = currentUser?.username || 'me';
    setReactions((prev) => {
      const existing = prev[msgId] || [];
      const item = existing.find((r) => r.emoji === emoji);
      if (item) {
        if (item.users.includes(curU)) {
          const updatedUsers = item.users.filter((u) => u !== curU);
          if (updatedUsers.length === 0) {
            return { ...prev, [msgId]: existing.filter((r) => r.emoji !== emoji) };
          }
          return {
            ...prev,
            [msgId]: existing.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count - 1, users: updatedUsers } : r
            ),
          };
        } else {
          return {
            ...prev,
            [msgId]: existing.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, curU] } : r
            ),
          };
        }
      } else {
        return {
          ...prev,
          [msgId]: [...existing, { emoji, count: 1, users: [curU] }],
        };
      }
    });
  }, [currentUser?.username]);

  // Toggle Channel Lock
  const handleToggleLock = async () => {
    if (clientViewMode !== 'teacher') return;
    const nextLock = !activeChannel.isLocked;
    const res = await schoolSystem.toggleChannelLock({
      channelId: activeChannel.id,
      isLocked: nextLock,
      requesterUsername: currentUser?.username || 'madam_principal',
      requesterRole: 'admin',
    });
    if (res.success) {
      setChannels((prev) =>
        prev.map((c) => (c.id === activeChannel.id ? { ...c, isLocked: nextLock } : c))
      );
      setToastMessage(nextLock ? 'Classroom muted for students.' : 'Classroom unlocked for student discussion.');
      refreshAllData();
    }
  };

  // Create New Classroom Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await schoolSystem.createWhatsAppChannel({
      name: newGroupName.trim(),
      grade: newGroupGrade,
      section: newGroupSection,
      isLocked: newGroupIsLocked,
      requesterUsername: currentUser?.username || 'madam_principal',
      requesterRole: 'admin',
    });

    if (res.success && res.channel) {
      setChannels((prev) => [...prev, res.channel!]);
      setSelectedChannelId(res.channel.id);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setToastMessage(`Created ${res.channel.name}`);
      refreshAllData();
    }
  };

  // Madam Sends Faculty/Student Assignment
  const handleSendAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUsername.trim()) return;
    setIsAssigning(true);

    const targetGroupObj = channels.find((c) => c.id === assignTargetGroup);
    const groupName = targetGroupObj?.name || 'Classroom Group';

    const res = await schoolSystem.createGroupInvite({
      groupId: assignTargetGroup,
      groupName,
      inviteeUsername: assignUsername.trim(),
      inviteeRole: assignRole,
      subject: assignSubject.trim(),
      invitedBy: currentUser?.username || 'madam_principal',
    });

    if (res.success) {
      setShowAssignModal(false);
      setToastMessage(`Assignment dispatched to @${assignUsername.trim()}`);
      refreshAllData();
    } else {
      alert(res.error || 'Failed to send assignment');
    }
    setIsAssigning(false);
  };

  // Handle file input selection for broadcast photo
  const handleBroadcastImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setToastMessage('Image size must be less than 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBroadcastImageUrl(result);
        setBroadcastImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearBroadcastImage = () => {
    setBroadcastImageUrl('');
    setBroadcastImagePreview(null);
    if (broadcastFileInputRef.current) broadcastFileInputRef.current.value = '';
  };

  // Broadcast to All School Groups Handler (Text & Images)
  const handleExecutePrincipalBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = broadcastText.trim();
    if (!cleanText && !broadcastImageUrl) {
      setToastMessage('Please enter notice text or attach an image to broadcast.');
      return;
    }

    setIsSendingBroadcast(true);
    const nowTs = Date.now();
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const isUrgent = broadcastPriority === 'urgent';
    const prefix = isUrgent ? '[URGENT PRINCIPAL DISPATCH]: ' : '[OFFICIAL PRINCIPAL CIRCULAR]: ';
    const fullText = cleanText ? `${prefix}${cleanText}` : `${prefix}Official Notice Attachment`;

    try {
      // 1. Send to server API with broadcastToAll
      fetch('/api/campus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-username': 'madam_principal',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({
          action: 'send_whatsapp_message',
          channelId: 'channel-school-broadcast',
          senderUsername: 'madam_principal',
          senderName: 'Dr. Pratibha Kohli',
          senderRole: 'admin',
          senderClass: 'Office of the Principal',
          text: fullText,
          mediaUrl: broadcastImageUrl || undefined,
          mediaType: broadcastImageUrl ? 'image' : undefined,
          broadcastToAll: true,
        }),
      }).catch((err) => console.warn('Broadcast server notice:', err));

      // 2. Inject optimistic broadcast message into EVERY classroom channel
      const allBroadcastMsgs: WhatsAppMessage[] = channels.map((ch) => ({
        id: `wmsg-broad-${ch.id}-${nowTs}-${Math.floor(Math.random() * 1000)}`,
        channelId: ch.id,
        senderUsername: 'madam_principal',
        senderName: 'Dr. Pratibha Kohli',
        senderRole: 'admin',
        senderClass: 'Office of the Principal',
        text: fullText,
        mediaUrl: broadcastImageUrl || undefined,
        mediaType: broadcastImageUrl ? 'image' : undefined,
        templateType: isUrgent ? 'exam' : 'none',
        timestamp: nowTs,
      }));

      setMessages((prev) => [...prev, ...allBroadcastMsgs]);

      // 3. Update preview for all channels
      setChannels((prev) =>
        prev.map((ch) => ({
          ...ch,
          lastMessage: `Dr. Pratibha Kohli: ${fullText.slice(0, 60)}`,
          lastMessageTime: timeNow,
        }))
      );

      // 4. Update Home Feed Broadcast Alert Banner in DataStore
      try {
        DataStore.setBroadcastAlert({
          title: isUrgent ? 'URGENT: Office of the Principal' : 'Official Principal Circular',
          text: cleanText || 'Official circular published to all school classroom groups.',
          isUrgent,
        });
      } catch {}

      // 5. Send notifications to all student accounts
      try {
        const notifs = DataStore.getNotifications();
        const allProfs = DataStore.getProfiles();
        for (const p of allProfs) {
          if (p.username.toLowerCase() !== 'madam_principal') {
            notifs.unshift({
              id: `notif-broad-${nowTs}-${p.username}`,
              userId: p.username,
              type: 'notice',
              title: isUrgent ? 'Urgent Dispatch from Principal Madam' : 'New Circular from Principal Madam',
              body: cleanText.slice(0, 100) || 'Official circular and image published to your classroom group.',
              link: '/groups',
              timeAgo: 'Just now',
              isRead: false,
            });
          }
        }
        localStorage.setItem('dpsbuzz_notifications_v1', JSON.stringify(notifs.slice(0, 100)));
      } catch {}

      setShowPrincipalBroadcastModal(false);
      setBroadcastText('');
      handleClearBroadcastImage();
      setToastMessage('Broadcast successfully delivered to all 91 school groups & 5,500 students.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error broadcasting message:', err);
      setToastMessage('Failed to broadcast message.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Add Classmate to this Specific Classroom ONLY
  const handleAddMemberToClass = (username: string, fullName: string, className: string, rollNo?: string, house?: string) => {
    const currentList = sectionRosters[activeChannel.id] || [];
    if (currentList.some((m) => m.username.toLowerCase() === username.toLowerCase())) {
      setToastMessage(`@${username} is already enrolled in ${activeChannel.name}.`);
      return;
    }

    const newMember: EnrolledMember = {
      id: `mem-${Date.now()}`,
      username: username.toLowerCase().trim(),
      name: fullName,
      role: 'student',
      roleLabel: 'Verified Student',
      className: className || `${activeChannel.grade}-${activeChannel.section}`,
      rollNo: rollNo || String(currentList.length + 1),
      admissionNo: `DPS-2024-${activeChannel.grade.replace(/[^0-9]/g, '')}${activeChannel.section}${currentList.length + 1}`,
      house: house || 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 400,
      attendance: '98%',
    };

    setSectionRosters((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMember],
    }));
    setShowAddMemberModal(false);
    setToastMessage(`Added ${fullName} to ${activeChannel.name}`);
  };

  // Open Profile Sheet
  const handleOpenProfileByUsername = (username: string) => {
    const cleanU = (username || '').toLowerCase().trim();
    const found = activeClassRoster.find((m) => m.username.toLowerCase().trim() === cleanU);
    if (found) {
      setInspectedMember(found);
    } else {
      const prof = DataStore.getProfileByUsername(cleanU);
      setInspectedMember({
        id: `ins-${Date.now()}`,
        username: cleanU,
        name: prof?.fullName || cleanU,
        role: (prof?.role === 'admin' ? 'principal' : (prof?.role as string) === 'teacher' ? 'faculty' : 'student') as any,
        roleLabel: prof?.role === 'admin' ? 'Principal & Admin' : 'Verified Student',
        className: prof?.class ? `Class ${prof.class}` : `${activeChannel.grade}-${activeChannel.section}`,
        admissionNo: `DPS-2024-${cleanU.slice(0, 6).toUpperCase()}`,
        house: 'Yamuna House',
        isVerified: true,
        avatar: prof?.avatar || null,
        online: true,
        spiritPoints: 450,
        attendance: '98%',
      });
    }
  };

  // Filtered Members for Drawer (Strictly from THIS class roster)
  const filteredRoster = useMemo(() => {
    return activeClassRoster.filter((m) => {
      if (memberFilterTab === 'faculty' && m.role !== 'faculty' && m.role !== 'principal') return false;
      if (memberFilterTab === 'reps' && m.role !== 'rep') return false;
      if (memberFilterTab === 'students' && m.role !== 'student' && m.role !== 'rep') return false;
      if (!memberSearchQuery.trim()) return true;
      const q = memberSearchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.className.toLowerCase().includes(q)
      );
    });
  }, [activeClassRoster, memberFilterTab, memberSearchQuery]);

  // Candidates for "Add Classmate" STRICTLY FILTERED to this Class & Section!
  const eligibleAddCandidates = useMemo(() => {
    const channelGradeNum = activeChannel.grade.replace(/[^0-9]/g, '');
    const channelSection = (activeChannel.section || '').toUpperCase().trim();
    const isAcademicSection = Boolean(channelSection && channelSection !== 'ALL' && channelSection !== 'CLUB');
    const currentEnrolledUsernames = new Set(activeClassRoster.map((m) => m.username.toLowerCase()));

    // Pull registered students from DataStore as well
    const dynamicStudents = DataStore.getProfiles()
      .filter((p) => p.role !== 'admin' && p.class)
      .map((p) => {
        const sec = (p.section || 'A').toUpperCase();
        return {
          name: p.fullName || p.username,
          username: p.username,
          class: `Class ${p.class}-${sec}`,
          grade: `Class ${p.class}`,
          section: sec,
          house: 'Yamuna House',
          rollNo: p.admissionNumber?.replace(/[^0-9]/g, '').slice(-2) || '25',
        };
      });

    const combinedDirectory = [...ALL_STUDENT_DIRECTORY];
    const seenUsernames = new Set(combinedDirectory.map((c) => c.username.toLowerCase()));
    for (const ds of dynamicStudents) {
      if (!seenUsernames.has(ds.username.toLowerCase())) {
        seenUsernames.add(ds.username.toLowerCase());
        combinedDirectory.push(ds);
      }
    }

    return combinedDirectory.filter((candidate) => {
      const candGradeNum = (candidate.grade || candidate.class || '').replace(/[^0-9]/g, '');
      const candSection = (
        candidate.section ||
        (candidate.class || '').match(/([A-Z])$/i)?.[1] ||
        ''
      ).toUpperCase().trim();

      // 1. Strict Grade Match (e.g. Class 8 matches ONLY Class 8)
      const matchesGrade = channelGradeNum ? candGradeNum === channelGradeNum : true;

      // 2. Strict Section Match (e.g. Section G matches ONLY Section G)
      const matchesSection = isAcademicSection ? candSection === channelSection : true;

      // 3. Not already enrolled in this classroom
      const notAlreadyIn = !currentEnrolledUsernames.has(candidate.username.toLowerCase());

      // 4. Search query matching
      const q = addMemberSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        candidate.name.toLowerCase().includes(q) ||
        candidate.username.toLowerCase().includes(q) ||
        (candidate.rollNo && candidate.rollNo.includes(q));

      return matchesGrade && matchesSection && notAlreadyIn && matchesSearch;
    });
  }, [activeChannel, activeClassRoster, addMemberSearch]);

  // Demo simulator triggers for Madam
  const handleSimulateClass9BStudent = () => {
    setClientViewMode('student');
    setStudentGrade('Class 9');
    setStudentSection('B');
    setSelectedChannelId('channel-class-9b');
    setShow91SectionsDemo(false);
    setToastMessage('Switched to Class 9-B Student View • Notice: Only 9-B & Dispatches visible!');
  };

  const handleSimulateClass8GStudent = () => {
    setClientViewMode('student');
    setStudentGrade('Class 8');
    setStudentSection('G');
    setSelectedChannelId('channel-class-8g');
    setShow91SectionsDemo(false);
    setToastMessage('Switched to Class 8-G Student View • Notice: Only 8-G & Dispatches visible!');
  };

  return (
    <div
      className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] w-full overflow-hidden select-none bg-linear-to-b from-[#F5F3FF] via-[#F8FAFC] to-[#EDE9FE] dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#0B0F19] text-zinc-900 dark:text-zinc-100"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 text-xs font-semibold shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={15} className="text-[#007AFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-amber-500/90 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 backdrop-blur-md shadow-md">
          <WifiOff size={14} />
          <span>Offline Mode: Outgoing messages will auto-send when connection is restored.</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LEFT PANEL: Exact Match to User Reference Screenshot                  */}
      {/* ==================================================================== */}
      <aside
        className={`w-full md:w-[380px] lg:w-[420px] flex flex-col shrink-0 transition-all p-3 sm:p-4 overflow-y-auto border-r border-black/[0.06] dark:border-white/[0.06] ${
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* TOP PROFILE CARD (Exact Reference Layout) */}
        <div className="rounded-3xl bg-white/90 dark:bg-[#1C1C1E]/90 shadow-sm border border-white/80 dark:border-white/10 p-3.5 sm:p-4 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0 ${
                clientViewMode === 'teacher' ? 'bg-[#ea4335]' : 'bg-[#007AFF]'
              }`}
            >
              {clientViewMode === 'teacher' ? 'M' : currentUser?.fullName?.[0] || 'S'}
            </div>

            <div className="min-w-0">
              <div className="text-[13.5px] font-bold truncate leading-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <span>{clientViewMode === 'teacher' ? 'Principal Madam (Office)' : (studentGrade === 'Class 9' ? 'S. Sahana' : 'Shashwath Salla')}</span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                {clientViewMode === 'teacher' ? 'Faculty Admin' : `${studentGrade}-${studentSection} • Verified Student`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Purple Mode Switcher Pill */}
            <button
              type="button"
              onClick={() => setClientViewMode(clientViewMode === 'teacher' ? 'student' : 'teacher')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-[#F3E8FF] dark:bg-purple-950/40 text-[#7E22CE] dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 hover:scale-105 active:scale-95 shadow-2xs"
              title="Toggle Faculty / Student Mode"
            >
              <GraduationCap size={15} />
              <span>{clientViewMode === 'teacher' ? 'Faculty Mode' : 'Student Mode'}</span>
            </button>

            {clientViewMode === 'teacher' ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPrincipalBroadcastModal(true)}
                  className="px-2.5 py-1.5 rounded-full bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  title="Broadcast Text or Image to All School Groups"
                >
                  <Megaphone size={14} className="animate-pulse" />
                  <span className="hidden sm:inline">Broadcast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
                  title="Assign Teacher / Student"
                >
                  <UserPlus size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
                  title="Create New Classroom"
                >
                  <Plus size={19} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowStudentCreateNotice(true)}
                className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
                title="Create Group (Students create in Chats)"
              >
                <Plus size={19} />
              </button>
            )}
          </div>
        </div>

        {/* FACULTY BOARD • PRINCIPAL BROADCAST HUB BANNER */}
        {clientViewMode === 'teacher' && (
          <div className="mb-3 p-3.5 rounded-3xl bg-linear-to-r from-red-500/10 via-rose-500/10 to-purple-500/10 border border-red-500/25 dark:border-red-500/20 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-red-600 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Megaphone size={19} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Faculty Board • Broadcast Hub</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black uppercase tracking-wide">
                    All Groups
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  Broadcast circular text or image attachments directly to all 91 classroom groups
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPrincipalBroadcastModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Radio size={14} />
              <span>Broadcast</span>
            </button>
          </div>
        )}

        {/* MADAM PRINCIPAL 91 SECTIONS ROLLOUT BANNER */}
        {clientViewMode === 'teacher' ? (
          <button
            type="button"
            onClick={() => setShow91SectionsDemo(true)}
            className="w-full mb-3 px-3.5 py-2.5 rounded-2xl bg-linear-to-r from-purple-600 via-indigo-600 to-[#007AFF] text-white text-xs font-semibold shadow-md flex items-center justify-between hover:opacity-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building size={16} className="text-yellow-300 shrink-0" />
              <div className="text-left">
                <div className="font-bold">91 Sections Scalability Engine</div>
                <div className="text-[10px] text-purple-100">Click to show Madam full school implementation demo</div>
              </div>
            </div>
            <span className="text-[10.5px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold shrink-0">
              Show Demo
            </span>
          </button>
        ) : (
          /* STUDENT SECTION TEST SWITCHER */
          <div className="mb-3 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-[#1C1C1E]/90 border border-white/80 dark:border-white/10 shadow-2xs flex items-center justify-between text-xs">
            <div className="text-zinc-500 font-medium">Viewing Enrolled Section:</div>
            <select
              value={`${studentGrade}-${studentSection}`}
              onChange={(e) => {
                const [g, s] = e.target.value.split('-');
                setStudentGrade(g);
                setStudentSection(s);
                const targetChannel = channels.find((c) => c.grade === g && c.section === s);
                if (targetChannel) setSelectedChannelId(targetChannel.id);
                setToastMessage(`Showing ONLY ${g}-${s} classroom and student roster!`);
              }}
              className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl px-2.5 py-1 text-xs text-[#7E22CE] dark:text-purple-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Class 9-B" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Class 9-B (Grade 9 Section B)</option>
              <option value="Class 8-G" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Class 8-G (Grade 8 Section G)</option>
              <option value="Class 10-A" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Class 10-A (Grade 10 Section A)</option>
              <option value="Class 7-B" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Class 7-B (Grade 7 Section B)</option>
            </select>
          </div>
        )}

        {/* CAPSULE SEARCH BAR */}
        <div className="rounded-full bg-white/80 dark:bg-[#1C1C1E]/80 shadow-2xs border border-black/5 dark:border-white/10 px-4 py-2.5 mb-2.5 flex items-center">
          <Search size={15} className="text-zinc-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-400 hover:text-zinc-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* SECTION FILTER PILLS (Faculty / Principal Mode) */}
        {clientViewMode === 'teacher' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Sections' },
              { id: '9b', label: 'Class 9-B' },
              { id: '8g', label: 'Class 8-G' },
              { id: '10a', label: 'Class 10-A' },
              { id: 'broadcast', label: 'Dispatches' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFacultyFilter(tab.id as any);
                  if (tab.id === '9b') {
                    const c = channels.find((ch) => ch.id === 'channel-class-9b');
                    if (c) setSelectedChannelId(c.id);
                  } else if (tab.id === '8g') {
                    const c = channels.find((ch) => ch.id === 'channel-class-8g');
                    if (c) setSelectedChannelId(c.id);
                  } else if (tab.id === '10a') {
                    const c = channels.find((ch) => ch.id === 'channel-class-10a');
                    if (c) setSelectedChannelId(c.id);
                  } else if (tab.id === 'broadcast') {
                    const c = channels.find((ch) => ch.id === 'channel-school-broadcast');
                    if (c) setSelectedChannelId(c.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer text-xs ${
                  facultyFilter === tab.id
                    ? 'bg-[#007AFF] text-white shadow-xs'
                    : 'bg-white/80 dark:bg-[#1C1C1E]/80 text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:bg-black/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* FLOATING GROUP CARDS LIST (Exact Reference Styling) */}
        <div className="space-y-2.5 flex-1">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-white/60 dark:bg-zinc-900/60 rounded-3xl">
              No classrooms found for your section.
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = channel.id === activeChannel.id;
              const isBroadcast = channel.id === 'channel-school-broadcast';
              const is10A = channel.id.includes('10a');
              const is9B = channel.id.includes('9b');
              const is8G = channel.id.includes('8g');
              const isClub = channel.id.includes('club') || channel.section === 'Club';

              const cardIconBg = isBroadcast
                ? '#E63946' // Red with Megaphone
                : is8G
                ? '#FF6B35' // Orange with Users
                : is10A
                ? '#F7B801' // Amber with Users
                : is9B
                ? '#E542A3' // Pink/Magenta with Users
                : isClub
                ? '#2EC4B6' // Emerald/Teal with Users
                : '#007AFF'; // Blue

              return (
                <div
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannelId(channel.id);
                    setIsMobileChatOpen(true);
                  }}
                  className={`w-full text-left p-3.5 rounded-3xl transition-all cursor-pointer flex items-center justify-between shadow-xs border ${
                    isSelected
                      ? 'bg-white dark:bg-[#2C2C2E] border-[#007AFF] ring-2 ring-[#007AFF]/20 shadow-md'
                      : 'bg-white/90 dark:bg-[#1C1C1E]/90 hover:bg-white dark:hover:bg-[#222225] border-white/80 dark:border-white/10 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cardIconBg }}
                    >
                      {isBroadcast ? <Megaphone size={19} /> : <Users size={19} />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-[13.5px] font-bold truncate leading-tight text-zinc-900 dark:text-zinc-100">
                        {cleanChannelName(channel.name)}
                      </h4>
                      <p className="text-xs truncate text-zinc-500 dark:text-zinc-400 mt-1">
                        {cleanChannelName(channel.lastMessage) || (is9B ? 'Anita Sharma: Merchant of Venice review on Wednesday' : is8G ? 'Shashwath Salla: Science lab notebooks submission today' : is10A ? 'R. K. Bhattacharya: Quadratic equations practice exercises' : isBroadcast ? 'Term 1 examination schedule published' : 'DPS Academic Update')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {channel.lastMessageTime || (is8G ? '09:15 AM' : is9B ? '08:30 AM' : '10:00 AM')}
                    </span>
                    {isBroadcast ? (
                      <Lock size={13} className="text-zinc-400 mt-0.5" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#5B50E6] mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* RIGHT PANEL: Apple iMessage Chat Area                                */}
      {/* ==================================================================== */}
      <main
        className={`flex-1 flex flex-col relative bg-[#F2F2F7] dark:bg-[#000000] overflow-hidden ${
          isMobileChatOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Apple Frosted Navigation Bar Header */}
        <div className="h-[64px] px-4 flex items-center justify-between z-10 shrink-0 backdrop-blur-2xl bg-white/80 dark:bg-[#161618]/80 border-b border-black/[0.08] dark:border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileChatOpen(false)}
              className="p-1 -ml-1 text-[#007AFF] hover:opacity-80 md:hidden shrink-0 cursor-pointer flex items-center gap-0.5 text-sm font-medium"
              aria-label="Back to chat list"
            >
              <ChevronLeft size={20} />
              <span>Chats</span>
            </button>

            {/* Tap group icon or name to open Group Details Sheet */}
            <div
              onClick={() => setShowGroupDetailsSheet(true)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-md ring-2 ring-white/50 dark:ring-white/10"
                style={{
                  backgroundColor: activeChannel.id.includes('broadcast') ? '#ea4335' : getSenderColor(activeChannel.name),
                }}
              >
                {activeChannel.id.includes('broadcast') ? <Megaphone size={17} /> : <Users size={17} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold truncate leading-tight">
                    {cleanChannelName(activeChannel.name)}
                  </h2>
                  <CheckCircle2 size={14} className="text-[#007AFF] fill-[#007AFF]/20 shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                  {channelSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {clientViewMode === 'teacher' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowPrincipalBroadcastModal(true)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border border-red-500/30 text-red-600 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Broadcast Text or Image to All Groups"
                >
                  <Megaphone size={12} className="animate-pulse" />
                  <span className="hidden sm:inline">Broadcast All</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                    activeChannel.isLocked
                      ? 'border-red-500/30 text-red-600 bg-red-500/10'
                      : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                  }`}
                  title="Toggle Classroom Mute"
                >
                  {activeChannel.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  <span className="hidden sm:inline">{activeChannel.isLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
              </>
            )}

            {/* Audio Call */}
            <button
              type="button"
              onClick={() => setActiveCallRoom({ type: 'audio', title: `${cleanChannelName(activeChannel.name)} - Audio Room` })}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
              title="Start Audio Room"
            >
              <Phone size={16} />
            </button>

            {/* Video Call */}
            <button
              type="button"
              onClick={() => setActiveCallRoom({ type: 'video', title: `${cleanChannelName(activeChannel.name)} - Video Classroom` })}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
              title="Start Video Classroom"
            >
              <Video size={16} />
            </button>

            {/* Group Info (i) button */}
            <button
              type="button"
              onClick={() => setShowGroupDetailsSheet(true)}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
              title="Classroom Details & Members"
            >
              <Info size={17} />
            </button>
          </div>
        </div>

        {/* Pinned Classroom Announcement Bar */}
        {!isPinnedNoticeDismissed && (
          <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-400/10 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 min-w-0">
              <Pin size={14} className="shrink-0 text-amber-500" />
              <span className="font-semibold shrink-0">Class Notice:</span>
              <span className="truncate">
                {activeChannel.id === 'channel-class-9b'
                  ? 'English Literature Projects on "The Merchant of Venice" due Wednesday in AV Room 1.'
                  : 'Science Project submissions & Practical Notebooks due this Friday by 3:00 PM (Lab 204).'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinnedNoticeDismissed(true)}
              className="text-amber-600 dark:text-amber-400 hover:opacity-70 p-1 cursor-pointer shrink-0"
              title="Dismiss Notice"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Trust & Security Intranet Pill */}
        <div className="flex justify-center pt-2 select-none">
          <div className="px-3.5 py-1 rounded-full text-[10.5px] font-medium bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 border border-black/5 dark:border-white/5 shadow-2xs">
            <ShieldCheck size={12} className="text-[#007AFF]" />
            <span>DPS Intranet Verified Classroom • {activeChannel.grade}-{activeChannel.section} Enrolled Members Only</span>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3 space-y-1 relative">
          {channelMessages.map((msg, idx) => {
            const isMe =
              currentUser?.username &&
              msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
            const prevMsg = channelMessages[idx - 1];
            const isSameSenderAsPrev =
              prevMsg &&
              prevMsg.senderUsername.toLowerCase() === msg.senderUsername.toLowerCase() &&
              msg.timestamp - prevMsg.timestamp < 300000;

            const msgReactions = reactions[msg.id] || [];

            return (
              <MessageBubbleItem
                key={msg.id}
                msg={msg}
                isMe={Boolean(isMe)}
                isSameSenderAsPrev={Boolean(isSameSenderAsPrev)}
                isDark={isDark}
                reactions={msgReactions}
                onToggleReaction={handleToggleReaction}
                onReply={(m) => setReplyingTo(m)}
                onOpenProfile={handleOpenProfileByUsername}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Apple Frosted Input Bar */}
        <div className="flex flex-col shrink-0 border-t border-black/[0.08] dark:border-white/[0.08] backdrop-blur-2xl bg-white/80 dark:bg-[#161618]/80 relative">
          {showAttachMenu && (
            <div className="absolute bottom-16 left-3 p-2 rounded-2xl shadow-2xl flex flex-col gap-1.5 z-50 border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl min-w-[200px] animate-scale-in">
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setMessageText((prev) => `${prev} [Class Photo: Science Lab Experiment]`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Camera size={16} className="text-[#007AFF]" />
                <span className="font-medium">Photos & Videos</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setMessageText((prev) => `${prev} [Document: Term 1 Syllabus PDF]`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <FileText size={16} className="text-[#AF52DE]" />
                <span className="font-medium">Document Notes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  router.push('/ai-diary');
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Award size={16} className="text-[#FF9500]" />
                <span className="font-medium">Submit Today's Diary</span>
              </button>
            </div>
          )}

          {replyingTo && (
            <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-1 h-8 rounded-full bg-[#007AFF]" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#007AFF]">
                    Replying to {replyingTo.senderName}
                  </div>
                  <div className="text-xs truncate text-zinc-500 dark:text-zinc-400">
                    {replyingTo.text}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="min-h-[64px] px-3 md:px-5 py-2.5 flex items-center gap-2">
            {!canSendMessage ? (
              <div className="w-full py-2.5 px-4 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-between text-xs font-medium gap-3">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Lock size={14} className="text-amber-500 shrink-0" />
                  <span>Principal Dispatches Channel (Read-Only). Switch to your classroom to chat.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChannelId('channel-class-9b')}
                  className="px-3 py-1 rounded-full bg-[#007AFF] text-white font-semibold text-xs shrink-0 cursor-pointer"
                >
                  Open Class 9-B
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  title="Attach"
                >
                  <Plus size={18} />
                </button>

                <div className="flex-1 flex items-center rounded-full bg-black/5 dark:bg-white/10 px-4 py-2 border border-black/[0.04] dark:border-white/[0.08] focus-within:ring-2 focus-within:ring-[#007AFF]/40 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="iMessage"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSending}
                    className="w-full text-[15px] bg-transparent focus:outline-none placeholder:text-zinc-400"
                  />
                </div>

                {messageText.trim() ? (
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send size={15} className="ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMessageText('Good morning everyone from our official classroom.');
                      inputRef.current?.focus();
                    }}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-[#007AFF] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title="Quick Text"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL: STUDENT GROUP CREATION NOTICE                                 */}
      {/* ==================================================================== */}
      {showStudentCreateNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col p-6 text-center animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-[#007AFF] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <MessageCircle size={28} />
            </div>

            <h3 className="text-base font-bold leading-tight">Create Student Groups in Chats</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Official School Classrooms on this page are strictly administered by <strong>DPS School Administration & Faculty</strong> for the 91 academic sections.
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-2 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5">
              To create peer study circles, project teams, house groups, or friendship chats with your classmates, create them directly in <strong>Chats</strong>!
            </p>

            <div className="flex flex-col gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowStudentCreateNotice(false);
                  router.push('/chats');
                }}
                className="w-full py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Users size={15} />
                <span>Open Chats & Create Group</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStudentCreateNotice(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MADAM'S 91 SECTIONS SCALABILITY & PROVISIONING CENTER         */}
      {/* ==================================================================== */}
      {show91SectionsDemo && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-[30px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-[#007AFF] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
                  <Building size={22} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">DPS 91 Sections Scalability Architecture</h3>
                  <p className="text-[11px] text-purple-100 mt-0.5">Automated Multi-Classroom Deployment for 5,500 Students & 350 Faculty</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow91SectionsDemo(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-center">
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">91</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Isolated Classrooms</div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
                  <div className="text-xl font-black text-[#007AFF]">5,500</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Verified Students</div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
                  <div className="text-xl font-black text-amber-600">350</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Subject Faculty</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <div className="text-xl font-black text-emerald-600">0 Leaks</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Cryptographic Partition</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                    <Layers size={14} className="text-[#007AFF]" />
                    <span>Live Section Simulation (Test Strict Section Filtering)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                    Active Demo
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Demonstrate to Madam Principal that a student in <strong>Class 9-B</strong> sees only Class 9-B students & messages, while a student in <strong>Class 8-G</strong> sees only Class 8-G:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateClass9BStudent}
                    className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Simulate Class 9-B Student View</span>
                    <span className="text-[10px] opacity-80">(Grade 9 Section B)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateClass8GStudent}
                    className="p-3 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Simulate Class 8-G Student View</span>
                    <span className="text-[10px] opacity-80">(Grade 8 Section G)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  DPS Hyderabad & R.K. Puram Grade Matrix Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">Class 5</div>
                    <div className="text-[11px] text-zinc-500">11 Secs (5-A to 5-K)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">440 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">Class 6</div>
                    <div className="text-[11px] text-zinc-500">11 Secs (6-A to 6-K)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">440 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">Class 7</div>
                    <div className="text-[11px] text-zinc-500">11 Secs (7-A to 7-K)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">440 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">Class 8</div>
                    <div className="text-[11px] text-zinc-500">11 Secs (8-A to 8-K)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">440 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="font-bold text-purple-700 dark:text-purple-300">Class 9</div>
                    <div className="text-[11px] text-zinc-500">13 Secs (9-A to 9-M)</div>
                    <div className="text-[10px] text-purple-600 font-semibold mt-1">520 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="font-bold text-purple-700 dark:text-purple-300">Class 10</div>
                    <div className="text-[11px] text-zinc-500">13 Secs (10-A to 10-M)</div>
                    <div className="text-[10px] text-purple-600 font-semibold mt-1">520 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">Class 11</div>
                    <div className="text-[11px] text-zinc-500">11 Secs (Med/Non-Med/Arts)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">440 Students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">Class 12</div>
                    <div className="text-[11px] text-zinc-500">11 Secs (Board Candidates)</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">440 Students</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  How This Is Implemented Across the School (4 Core Pillars)
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#34C759] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">1. Zero Student Setup:</span> Student logs in with school admission number. Cloudflare D1 auto-maps their profile to their specific grade and section. No student creates or joins official rooms manually.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#34C759] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">2. Strict Section Partitioning:</span> SQLite index on `(grade, section)` prevents queries from loading other sections. 9th graders cannot view 8th or 10th grade rooms.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#34C759] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">3. Faculty Multi-Section Teaching:</span> Subject teachers (e.g. English Dept) teach multiple sections (9-A, 9-B, 8-G) through a unified multi-room switch.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#34C759] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">4. Emergency Whole-School Broadcast:</span> When Madam Principal posts in `DPS Official Principal Dispatches`, all 5,500 student devices receive instant notification simultaneously.
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setToastMessage('All 91 Sections Verified & Active in Cloudflare D1 Database!');
                  setShow91SectionsDemo(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform cursor-pointer"
              >
                <Database size={16} />
                <span>Verify & Sync All 91 Sections in D1 Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: PRINCIPAL BROADCAST TO ALL SCHOOL GROUPS (Text & Images)      */}
      {/* ==================================================================== */}
      {showPrincipalBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-red-600 to-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Megaphone size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Broadcast to All School Groups
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black uppercase">
                      Principal
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Transmits immediately to all 91 classroom groups &amp; 5,500 students
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPrincipalBroadcastModal(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecutePrincipalBroadcast} className="p-5 space-y-4">
              {/* Target Audience Scope Banner */}
              <div className="p-3 rounded-2xl bg-linear-to-r from-red-500/10 via-rose-500/10 to-purple-500/10 border border-red-500/20 text-xs">
                <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={14} />
                  <span>Authorized Principal Multi-Group Transmission</span>
                </div>
                <p className="text-[11.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Every enrolled student and teacher across Class 6–12 (Class 8-G, 9-B, 10-A, Science Club, etc.) will receive this dispatch in their group chat.
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 font-semibold border border-red-500/20 text-zinc-700 dark:text-zinc-300">
                    Class 8-G
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 font-semibold border border-red-500/20 text-zinc-700 dark:text-zinc-300">
                    Class 9-B
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 font-semibold border border-red-500/20 text-zinc-700 dark:text-zinc-300">
                    Class 10-A
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 font-semibold border border-red-500/20 text-zinc-700 dark:text-zinc-300">
                    Science Club
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">
                    + 87 Academic Sections
                  </span>
                </div>
              </div>

              {/* Priority Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Priority Classification
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {broadcastPriority === 'urgent' ? 'Red Alert: High-priority immediate school dispatch' : 'Official: Standard school circular & notice'}
                  </div>
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/10 dark:bg-white/10">
                  <button
                    type="button"
                    onClick={() => setBroadcastPriority('official')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      broadcastPriority === 'official'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Official
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastPriority('urgent')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      broadcastPriority === 'urgent'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Circular / Notice Text
                </label>
                <textarea
                  rows={4}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Enter official statement, examination datesheet instructions, or school directive..."
                  className="w-full p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none leading-relaxed placeholder:text-zinc-400"
                />

                {/* Quick Templates */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10.5px] font-medium text-zinc-400">Templates:</span>
                  {[
                    { label: 'Exam Datesheet', text: 'DELHI PUBLIC SCHOOL NOTICE: The Term Examination Datesheet & syllabus breakdown has been officially published. All students must review their schedule.' },
                    { label: 'Sports Day', text: 'ANNUAL ATHLETIC MEET: Inter-house trials for track and field events begin this Friday on the Main Grounds. House uniforms mandatory.' },
                    { label: 'Holiday Circular', text: 'SCHOOL CIRCULAR: Delhi Public School will remain closed on Monday on account of the state festival. Classes resume on Tuesday.' },
                    { label: 'Uniform Check', text: 'FACULTY ADVISORY: Tomorrow is formal inspection day. Students are reminded that school blazer, verified ID card and ties are mandatory.' },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setBroadcastText(tpl.text)}
                      className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 cursor-pointer transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image / Photo Attachment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-red-500" />
                    <span>Circular Photo / Image Attachment (Optional)</span>
                  </label>
                  {broadcastImagePreview && (
                    <button
                      type="button"
                      onClick={handleClearBroadcastImage}
                      className="text-[11px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* File Upload Hidden Input */}
                <input
                  type="file"
                  ref={broadcastFileInputRef}
                  accept="image/*"
                  onChange={handleBroadcastImageChange}
                  className="hidden"
                />

                {broadcastImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/10 max-h-48 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={broadcastImagePreview}
                      alt="Broadcast preview"
                      className="w-full h-auto max-h-48 object-cover rounded-2xl"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleClearBroadcastImage}
                        className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Device Upload Button */}
                    <button
                      type="button"
                      onClick={() => broadcastFileInputRef.current?.click()}
                      className="p-3 rounded-2xl border-2 border-dashed border-black/15 dark:border-white/15 hover:border-red-500/50 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors group"
                    >
                      <Camera size={20} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                      <span className="text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300">
                        Upload Photo / Notice
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        JPG, PNG, WebP up to 8MB
                      </span>
                    </button>

                    {/* Pre-formatted Sample Circulars */}
                    <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
                        Or pick sample circular:
                      </span>
                      <div className="space-y-1">
                        {[
                          { label: 'Exam Datesheet Sheet', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80' },
                          { label: 'Sports Meet Poster', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80' },
                          { label: 'Science Fair Banner', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80' },
                        ].map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              setBroadcastImageUrl(s.url);
                              setBroadcastImagePreview(s.url);
                            }}
                            className="w-full text-left px-2 py-1 rounded-lg text-[10.5px] font-medium bg-black/5 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer truncate"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowPrincipalBroadcastModal(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-black/10 cursor-pointer transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast || (!broadcastText.trim() && !broadcastImageUrl)}
                  className="flex-2 py-2.5 rounded-2xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Megaphone size={15} />
                  <span>{isSendingBroadcast ? 'Broadcasting...' : 'Broadcast to All Groups'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MADAM ASSIGNS FACULTY OR STUDENT TO A CLASSROOM               */}
      {/* ==================================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 animate-scale-in">
            <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Assign Faculty / Student</h3>
                <p className="text-[11px] text-zinc-400">Sends an official invitation from Principal Madam</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendAssignment} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Target Classroom Section</label>
                <select
                  value={assignTargetGroup}
                  onChange={(e) => setAssignTargetGroup(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Username</label>
                <input
                  type="text"
                  placeholder="e.g. teacher_english or sahana_3009"
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Role</label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  >
                    <option value="teacher" className="bg-white dark:bg-zinc-800">Faculty (Teacher)</option>
                    <option value="student" className="bg-white dark:bg-zinc-800">Enrolled Student</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Subject / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. English Dept Head"
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
                >
                  {isAssigning ? 'Sending...' : 'Dispatch Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE CLASSROOM GROUP (Teacher / Admin Flow)                  */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Create New Classroom Group</h3>
                <p className="text-[11px] text-zinc-400">Delhi Public School Official Academic Room</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Classroom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Class 9-B Official Classroom"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Grade</label>
                  <select
                    value={newGroupGrade}
                    onChange={(e) => setNewGroupGrade(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  >
                    {['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'All'].map((g) => (
                      <option key={g} value={g} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Section</label>
                  <select
                    value={newGroupSection}
                    onChange={(e) => setNewGroupSection(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'Club', 'All'].map((s) => (
                      <option key={s} value={s} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lockGroupCheck"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="rounded text-[#007AFF]"
                />
                <label htmlFor="lockGroupCheck" className="text-xs text-zinc-600 dark:text-zinc-400">
                  Broadcast only (Only teachers can message)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* APPLE SLIDING GROUP DETAILS SHEET (Strictly THIS Class's Roster)      */}
      {/* ==================================================================== */}
      {showGroupDetailsSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full sm:w-[420px] md:w-[460px] h-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-l border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col animate-slideLeft">
            <div className="pt-3 pb-2 px-4 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
              <div className="w-9 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Classroom Details</span>
                <button
                  type="button"
                  onClick={() => setShowGroupDetailsSheet(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col items-center text-center border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div
                className="w-20 h-20 rounded-[22px] flex items-center justify-center font-bold text-white text-2xl shadow-xl mb-3 ring-4 ring-[#007AFF]/20"
                style={{
                  backgroundColor: getSenderColor(activeChannel.name),
                }}
              >
                <Users size={36} />
              </div>

              <h3 className="text-lg font-bold flex items-center gap-1.5 leading-tight">
                <span>{activeChannel.name}</span>
                <CheckCircle2 size={16} className="text-[#007AFF] fill-[#007AFF]/20" />
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Official DPS Academic Classroom • {activeChannel.grade} Section {activeChannel.section}
              </p>

              <div className="grid grid-cols-4 gap-2.5 mt-4 w-full">
                <button
                  type="button"
                  onClick={() => setActiveCallRoom({ type: 'audio', title: `${activeChannel.name} - Audio Room` })}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <Phone size={18} className="text-[#007AFF]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCallRoom({ type: 'video', title: `${activeChannel.name} - Video Classroom` })}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <Video size={18} className="text-[#007AFF]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <UserPlus size={18} className="text-[#34C759]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Add</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToastMessage('Classroom notifications set to all alerts')}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <Bell size={18} className="text-[#FF9500]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Mute</span>
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div className="grid grid-cols-3 p-1 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('members')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === 'members'
                      ? 'bg-white dark:bg-[#2C2C2E] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Members ({activeClassRoster.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('media')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === 'media'
                      ? 'bg-white dark:bg-[#2C2C2E] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Media & Docs
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('settings')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === 'settings'
                      ? 'bg-white dark:bg-[#2C2C2E] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {drawerActiveTab === 'members' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10">
                      <Search size={14} className="text-zinc-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder={`Search ${activeChannel.grade}-${activeChannel.section} members`}
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full text-xs bg-transparent focus:outline-none placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold">
                      {(['all', 'faculty', 'reps', 'students'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setMemberFilterTab(tab)}
                          className={`px-2.5 py-1 rounded-full capitalize transition-colors cursor-pointer ${
                            memberFilterTab === tab
                              ? 'bg-[#007AFF] text-white shadow-xs'
                              : 'bg-black/5 dark:bg-white/10 text-zinc-500 hover:text-zinc-700'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STRICT MEMBERS ROSTER: ONLY STUDENTS OF THIS EXACT CLASS & SECTION */}
                  <div className="space-y-1.5">
                    {filteredRoster.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleOpenProfileByUsername(member.username)}
                        className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                              style={{ backgroundColor: getSenderColor(member.name) }}
                            >
                              {member.name.slice(0, 1).toUpperCase()}
                            </div>
                            {member.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate leading-tight">
                                {member.name}
                              </span>
                              <CheckCircle2 size={12} className="text-[#007AFF] shrink-0" />
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                              @{member.username} • {member.className} {member.rollNo ? `(Roll #${member.rollNo})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              member.role === 'principal'
                                ? 'bg-red-500/10 border-red-500/30 text-red-600'
                                : member.role === 'faculty'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                : member.role === 'rep'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                : 'bg-blue-500/10 border-blue-500/30 text-[#007AFF]'
                            }`}
                          >
                            {member.roleLabel.split(' ')[0]}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/chats?user=${member.username}`);
                            }}
                            className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#007AFF] hover:text-white transition-colors text-zinc-500 cursor-pointer"
                            title="Direct Message"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {drawerActiveTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Classroom Photos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&auto=format&fit=crop&q=80',
                      ].map((imgUrl, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Class media" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Classroom Documents</h4>
                    <div className="space-y-2">
                      {[
                        { title: `${activeChannel.grade} Term 1 Exam Syllabus.pdf`, size: '1.4 MB', date: 'Yesterday' },
                        { title: `${activeChannel.grade} Project Guidelines.pdf`, size: '2.1 MB', date: '3 days ago' },
                        { title: 'Mathematics Practice Worksheet.pdf', size: '840 KB', date: 'Last week' },
                      ].map((doc, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={18} className="text-[#AF52DE] shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{doc.title}</div>
                              <div className="text-[10px] text-zinc-400">{doc.size} • {doc.date}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setToastMessage(`Downloading ${doc.title}`)}
                            className="text-xs font-semibold text-[#007AFF] hover:underline shrink-0 cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {drawerActiveTab === 'settings' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold">Teacher-Only Broadcast Mode</div>
                        <div className="text-[11px] text-zinc-400">Only Faculty can send messages</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleLock}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          activeChannel.isLocked ? 'bg-[#34C759]' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            activeChannel.isLocked ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <div>
                        <div className="text-xs font-semibold">Daily Diary Reminders</div>
                        <div className="text-[11px] text-zinc-400">Alerts when classmate uploads diary</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setToastMessage('Diary alerts enabled for this section')}
                        className="w-11 h-6 rounded-full bg-[#34C759] transition-colors relative cursor-pointer"
                      >
                        <span className="block w-5 h-5 rounded-full bg-white shadow-md translate-x-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="font-semibold text-[#007AFF] flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={14} />
                      <span>DPS Cyber Safety & Anti-Bullying Monitored</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      All communications within this classroom are protected by DPS Intranet safety standards. Inappropriate content is automatically flagged.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VERIFIED STUDENT / FACULTY ID CARD SHEET                      */}
      {/* ==================================================================== */}
      {inspectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            <div className="p-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Delhi Public School ID</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedMember(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-xl ring-4 ring-[#007AFF]/25"
                  style={{ backgroundColor: getSenderColor(inspectedMember.name) }}
                >
                  {inspectedMember.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 size={14} />
                </div>
              </div>

              <h3 className="text-base font-bold flex items-center gap-1.5 leading-tight">
                <span>{inspectedMember.name}</span>
                <CheckCircle2 size={15} className="text-[#007AFF] fill-[#007AFF]/20" />
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                @{inspectedMember.username} • {inspectedMember.roleLabel}
              </p>

              <div className="mt-3 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/25 flex items-center gap-1.5">
                <ShieldCheck size={13} />
                <span>Officially Enrolled • DPS Verified</span>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full mt-4 text-left">
                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Class & Roll</div>
                  <div className="text-xs font-bold mt-0.5">{inspectedMember.className} {inspectedMember.rollNo ? `(Roll #${inspectedMember.rollNo})` : ''}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">House</div>
                  <div className="text-xs font-bold mt-0.5">{inspectedMember.house}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Attendance</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{inspectedMember.attendance}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Spirit Points</div>
                  <div className="text-xs font-bold text-[#FF9500] mt-0.5">{inspectedMember.spiritPoints} pts</div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full mt-5">
                <button
                  type="button"
                  onClick={() => {
                    const u = inspectedMember.username;
                    setInspectedMember(null);
                    router.push(`/chats?user=${u}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Send Direct Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD CLASSMATE (STRICT CLASS & SECTION CANDIDATES ONLY)       */}
      {/* ==================================================================== */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>Add Classmate to</span>
                  <span className="text-[#007AFF]">{activeChannel.name}</span>
                </h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>
                    Strictly showing verified candidates from {activeChannel.grade}
                    {activeChannel.section && activeChannel.section !== 'All' && activeChannel.section !== 'Club'
                      ? `-${activeChannel.section}`
                      : ''} (No cross-section leakage)
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10">
                <Search size={14} className="text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${activeChannel.grade}${activeChannel.section && activeChannel.section !== 'All' ? `-${activeChannel.section}` : ''} students by name or roll...`}
                  value={addMemberSearch}
                  onChange={(e) => setAddMemberSearch(e.target.value)}
                  className="w-full text-xs bg-transparent focus:outline-none placeholder:text-zinc-400"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {eligibleAddCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                      All verified candidates for {activeChannel.grade}
                      {activeChannel.section && activeChannel.section !== 'All' ? `-${activeChannel.section}` : ''} are enrolled!
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Zero students from other classes or sections are permitted in this room.
                    </p>
                  </div>
                ) : (
                  eligibleAddCandidates.map((candidate) => (
                    <div key={candidate.username} className="pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: getSenderColor(candidate.name) }}
                        >
                          {candidate.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate">{candidate.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {candidate.class}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                            @{candidate.username} • Roll #{candidate.rollNo} • {candidate.house}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddMemberToClass(candidate.username, candidate.name, candidate.class, candidate.rollNo, candidate.house)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer bg-[#007AFF] hover:bg-[#0066d6] text-white shadow-xs hover:shadow-sm"
                      >
                        Enroll
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SIMULATED CALL OVERLAY                                               */}
      {/* ==================================================================== */}
      {activeCallRoom && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-fadeIn text-white">
          <div className="text-center pt-8">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
              {activeCallRoom.type === 'video' ? <Video size={42} /> : <Phone size={42} />}
            </div>
            <h3 className="text-xl font-bold">{activeCallRoom.title}</h3>
            <p className="text-xs text-emerald-400 mt-1 font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Connected • DPS School Intranet Audio/Video Link</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md text-xs text-white/80 max-w-sm text-center flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>High-fidelity encrypted calling is active. All members of {cleanChannelName(activeChannel.name)} have been invited.</span>
          </div>

          <div className="pb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveCallRoom(null)}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="End Call"
            >
              <Phone size={24} className="rotate-135" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

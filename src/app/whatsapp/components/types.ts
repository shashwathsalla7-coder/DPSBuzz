// WhatsApp Desktop Replica – Shared Types
// Clean-room implementation for DPS Buzz

export interface MessageItem {
  id: string;
  senderName: string;
  senderUsername?: string;
  senderRole?: 'admin' | 'teacher' | 'student' | 'parent';
  senderClass?: string;
  senderColor?: string;
  subtitle?: string;
  text: string;
  time: string;
  timestamp?: number;
  isMe?: boolean;
  isVideo?: boolean;
  isImage?: boolean;
  isDocument?: boolean;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  audioUrl?: string;
  videoDuration?: string;
  videoCaption?: string;
  imageUrl?: string;
  documentName?: string;
  documentSize?: string;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  quotedAuthor?: string;
  quotedText?: string;
  isStarred?: boolean;
  isPinned?: boolean;
  isForwarded?: boolean;
  isDeleted?: boolean;
  disappearing?: boolean;
  templateType?: 'none' | 'attendance' | 'homework' | 'exam' | 'system';
}

export interface ChatRoom {
  id: string;
  name: string;
  subtitle: string;
  grade?: string;
  section?: string;
  avatarColor: string;
  initials: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isGroup?: boolean;
  isLocked?: boolean;
  isSchoolBroadcast?: boolean;
  targetAudience?: 'all' | 'students' | 'parents' | 'teachers';
  type?: 'group' | 'direct' | 'broadcast' | 'community';
  members?: ContactItem[];
  adminUsernames?: string[];
  enrolledUsernames?: string[];
  pinnedMessage?: { id: string; text: string; senderName: string };
  description?: string;
  createdBy?: string;
  createdAt?: string;
  disappearingEnabled?: boolean;
  disappearingDuration?: string;
  mediaCount?: number;
}

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  about?: string;
  avatarColor: string;
  initials: string;
  lastSeen?: string;
  isOnline?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface StatusItem {
  id: string;
  contactName: string;
  contactColor: string;
  contactInitials: string;
  time: string;
  viewed: boolean;
  updates: StatusUpdate[];
}

export interface StatusUpdate {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  backgroundColor?: string;
  time: string;
  caption?: string;
  viewCount?: number;
}

export interface CallItem {
  id: string;
  contactName: string;
  contactColor: string;
  contactInitials: string;
  time: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
  isGroup?: boolean;
}

export interface CommunityItem {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  initials: string;
  memberCount: number;
  groups: string[];
}

export type SidebarTab = 'chats' | 'status' | 'calls' | 'communities';
export type SettingsSection = 'main' | 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help' | 'linked-devices';
export type RightPanel = 'none' | 'contact-info' | 'group-info' | 'search' | 'starred' | 'media-gallery' | 'settings' | 'new-chat' | 'new-group' | 'profile';

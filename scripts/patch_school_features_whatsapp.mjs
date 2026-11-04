import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/lib/schoolFeatures.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Interfaces
const interfacesMarker = `export interface LostFoundItem {`;
const newInterfaces = `export interface WhatsAppChannel {
  id: string;
  name: string;
  grade: string;
  section: string;
  avatar?: string;
  isLocked: boolean;
  adminUsernames: string[];
  memberCount: number;
  lastMessage: string;
  lastMessageTime: string;
  createdAt?: string;
}

export interface WhatsAppMessage {
  id: string;
  channelId: string;
  senderUsername: string;
  senderName: string;
  senderRole: 'admin' | 'teacher' | 'student';
  senderClass?: string;
  text: string;
  templateType?: 'none' | 'attendance' | 'homework' | 'exam';
  timestamp: number;
  createdAt?: string;
}

export interface RosterStudent {
  name: string;
  classSection: string;
  parentKey: string;
  enrollmentId: string;
  mappedRoomId: string;
}

`;

if (!content.includes('interface WhatsAppChannel')) {
  content = content.replace(interfacesMarker, newInterfaces + interfacesMarker);
}

// 2. DB state variables
const stateMarker = `let dbLostFound: LostFoundItem[] = [];`;
const stateAdditions = `let dbLostFound: LostFoundItem[] = [];
let dbWhatsAppChannels: WhatsAppChannel[] = [];
let dbWhatsAppMessages: WhatsAppMessage[] = [];`;

if (!content.includes('let dbWhatsAppChannels:')) {
  content = content.replace(stateMarker, stateAdditions);
}

// 3. syncFromDatabase updates
const syncMarker = `        if (Array.isArray(data.lostFound)) {
          dbLostFound = data.lostFound;
        }`;
const syncAdditions = `        if (Array.isArray(data.lostFound)) {
          dbLostFound = data.lostFound;
        }
        if (Array.isArray(data.whatsappChannels)) {
          dbWhatsAppChannels = data.whatsappChannels;
        }
        if (Array.isArray(data.whatsappMessages)) {
          dbWhatsAppMessages = data.whatsappMessages;
        }`;

if (!content.includes('dbWhatsAppChannels = data.whatsappChannels;')) {
  content = content.replace(syncMarker, syncAdditions);
}

// 4. Methods on schoolSystem object
const methodsMarker = `  async claimLostFound(itemId: string): Promise<boolean> {`;
const newMethods = `  // --- WHATSAPP SCHOOL HUB ---
  getWhatsAppChannels(): WhatsAppChannel[] {
    return dbWhatsAppChannels;
  },

  getWhatsAppMessages(channelId?: string): WhatsAppMessage[] {
    if (!channelId) return dbWhatsAppMessages;
    return dbWhatsAppMessages.filter((m) => m.channelId === channelId);
  },

  async sendWhatsAppMessage(data: {
    channelId: string;
    senderUsername: string;
    senderName: string;
    senderRole?: 'admin' | 'teacher' | 'student';
    senderClass?: string;
    text: string;
    templateType?: 'none' | 'attendance' | 'homework' | 'exam';
  }): Promise<{ success: boolean; message?: WhatsAppMessage; error?: string }> {
    const optimisticMsg: WhatsAppMessage = {
      id: \`wmsg-\${Date.now()}\`,
      channelId: data.channelId,
      senderUsername: data.senderUsername,
      senderName: data.senderName,
      senderRole: data.senderRole || 'student',
      senderClass: data.senderClass || 'Class 10',
      text: data.text,
      templateType: data.templateType || 'none',
      timestamp: Date.now(),
    };

    dbWhatsAppMessages = [...dbWhatsAppMessages, optimisticMsg];
    const ch = dbWhatsAppChannels.find((c) => c.id === data.channelId);
    if (ch) {
      ch.lastMessage = data.text.slice(0, 80);
      ch.lastMessageTime = 'Just now';
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_whatsapp_message',
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        dbWhatsAppMessages = dbWhatsAppMessages.filter((m) => m.id !== optimisticMsg.id);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: false, error: json.error || 'Failed to send message' };
      }
      return { success: true, message: json.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleChannelLock(data: {
    channelId: string;
    isLocked: boolean;
    requesterUsername: string;
    requesterRole?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const ch = dbWhatsAppChannels.find((c) => c.id === data.channelId);
    if (ch) {
      ch.isLocked = data.isLocked;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_channel_lock',
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (ch) ch.isLocked = !data.isLocked;
        return { success: false, error: json.error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async createWhatsAppChannel(data: {
    name: string;
    grade?: string;
    section?: string;
    isLocked?: boolean;
    requesterUsername?: string;
    requesterRole?: string;
  }): Promise<{ success: boolean; channel?: WhatsAppChannel; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_whatsapp_channel',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok && json.channel) {
        dbWhatsAppChannels = [...dbWhatsAppChannels, json.channel];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true, channel: json.channel };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async ingestStudentRoster(data: {
    rawRosterText: string;
    targetChannelId?: string;
  }): Promise<{ success: boolean; enrolledCount?: number; students?: RosterStudent[]; logs?: string[]; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_student_roster',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        await syncFromDatabase();
        return {
          success: true,
          enrolledCount: json.enrolledCount,
          students: json.students,
          logs: json.logs,
        };
      }
      return { success: false, error: json.error, logs: json.logs };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async dispatchWhatsAppTemplate(data: {
    channelId: string;
    templateType: 'attendance' | 'homework' | 'exam';
    content?: string;
    senderName?: string;
  }): Promise<{ success: boolean; message?: WhatsAppMessage; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_whatsapp_template',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.message) {
          dbWhatsAppMessages = [...dbWhatsAppMessages, json.message];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
        }
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async claimLostFound(itemId: string): Promise<boolean> {`;

if (!content.includes('getWhatsAppChannels()')) {
  content = content.replace(methodsMarker, newMethods);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched src/lib/schoolFeatures.ts with WhatsApp methods!');

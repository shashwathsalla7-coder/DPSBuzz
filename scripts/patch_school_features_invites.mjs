import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/lib/schoolFeatures.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Interface
const interfaceMarker = `export interface RosterStudent {`;
const inviteInterface = `export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviteeUsername: string;
  inviteeRole: 'teacher' | 'student' | 'admin';
  subject?: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
}

`;

if (!content.includes('interface GroupInvite')) {
  content = content.replace(interfaceMarker, inviteInterface + interfaceMarker);
}

// 2. State variable
const stateMarker = `let dbWhatsAppMessages: WhatsAppMessage[] = [];`;
const stateAdd = `let dbWhatsAppMessages: WhatsAppMessage[] = [];
let dbGroupInvites: GroupInvite[] = [];`;

if (!content.includes('let dbGroupInvites:')) {
  content = content.replace(stateMarker, stateAdd);
}

// 3. syncFromDatabase
const syncMarker = `        if (Array.isArray(data.whatsappMessages)) {
          dbWhatsAppMessages = data.whatsappMessages;
        }`;
const syncAdd = `        if (Array.isArray(data.whatsappMessages)) {
          dbWhatsAppMessages = data.whatsappMessages;
        }
        if (Array.isArray(data.groupInvites)) {
          dbGroupInvites = data.groupInvites;
        }`;

if (!content.includes('dbGroupInvites = data.groupInvites;')) {
  content = content.replace(syncMarker, syncAdd);
}

// 4. Methods on SchoolFeatures
const methodsMarker = `  async addStudentToChannel(data: {`;
const inviteMethods = `  getGroupInvites(username?: string): GroupInvite[] {
    if (!username) return dbGroupInvites;
    const clean = username.toLowerCase().trim();
    return dbGroupInvites.filter((inv) => inv.inviteeUsername.toLowerCase().trim() === clean);
  },

  async createGroupInvite(data: {
    groupId: string;
    groupName: string;
    inviteeUsername: string;
    inviteeRole?: 'teacher' | 'student';
    subject?: string;
    invitedBy?: string;
  }): Promise<{ success: boolean; invite?: GroupInvite; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_group_invite',
          ...data,
        }),
      });
      const json = await res.json();
      if (res.ok && json.invite) {
        dbGroupInvites = [json.invite, ...dbGroupInvites];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true, invite: json.invite };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async respondGroupInvite(
    inviteId: string,
    response: 'accepted' | 'declined',
    username: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_group_invite',
          inviteId,
          response,
          username,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        const inv = dbGroupInvites.find((i) => i.id === inviteId);
        if (inv) inv.status = response;
        await syncFromDatabase();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
        }
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async addStudentToChannel(data: {`;

if (!content.includes('getGroupInvites(username?: string)')) {
  content = content.replace(methodsMarker, inviteMethods);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched schoolFeatures.ts with GroupInvite methods!');

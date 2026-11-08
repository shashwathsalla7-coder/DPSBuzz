import { getServerStore } from '@/lib/serverStore';
import type { Session } from './session';

/**
 * Who may read/write a conversation:
 *  - DM "a__b": only a or b
 *  - group "conv-group-x" / "group-x": members, creator, or invited users
 *  - admins: always
 * Other ids (legacy per-user "conv-<name>", class channels) are allowed for any logged-in user.
 */
export async function canAccessConversation(conversationId: string, session: Session): Promise<boolean> {
  if (session.role === 'admin') return true;
  const me = session.username;
  if (conversationId.includes('__')) {
    return conversationId.split('__').map((x) => x.trim().toLowerCase()).includes(me);
  }
  if (conversationId.startsWith('conv-group-') || conversationId.startsWith('group-')) {
    const groupId = conversationId.replace(/^conv-/, '');
    const store = await getServerStore();
    const members = (store.groupMembers?.[groupId] || []).map((m: string) => m.toLowerCase().trim());
    const group: any = (store.groups || []).find((g: any) => g.id === groupId);
    const fromGroup = Array.isArray(group?.members) ? group.members.map((m: string) => m.toLowerCase().trim()) : [];
    const creator = String(group?.creator_username || group?.creator || group?.creatorUsername || '').toLowerCase().trim();
    const invited = (store.groupJoinRequests || []).some(
      (r: any) => r.groupId === groupId && String(r.username || '').toLowerCase().trim() === me
    );
    return members.includes(me) || fromGroup.includes(me) || creator === me || invited;
  }
  return true;
}

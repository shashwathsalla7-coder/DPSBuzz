import type { Session } from './session';
import type { ServerStoreData } from '@/lib/serverStore';

const norm = (v: unknown) => String(v || '').toLowerCase().trim().replace(/^@+/, '');

function groupCreator(g: any): string {
  return norm(g?.creator_username || g?.creator || g?.creatorUsername || g?.createdBy || g?.adminUsername);
}

/**
 * Strips everything from a /api/sync POST body that the session user is not
 * allowed to write. Mutates and returns `body`. Admins/teachers keep staff powers.
 */
export function sanitizeSyncBody(body: any, session: Session, current: ServerStoreData): any {
  const me = session.username;
  const admin = session.role === 'admin';
  const staff = admin || session.role === 'teacher';
  if (!body || typeof body !== 'object') return {};

  const own = (u: unknown) => admin || norm(u) === me;

  if (Array.isArray(body.posts)) body.posts = body.posts.filter((p: any) => p && own(p.username));
  if (Array.isArray(body.stories)) body.stories = body.stories.filter((s: any) => s && own(s.username));
  if (Array.isArray(body.profiles)) body.profiles = body.profiles.filter((p: any) => p && own(p.username));

  if (body.comments && typeof body.comments === 'object') {
    const out: Record<string, any[]> = {};
    for (const [postId, list] of Object.entries(body.comments)) {
      if (Array.isArray(list)) out[postId] = list.filter((c: any) => c && own(c.username));
    }
    body.comments = out;
  } else {
    delete body.comments;
  }

  // Likes: a user may only add/remove THEMSELVES on each post.
  if (body.likes && typeof body.likes === 'object') {
    const out: Record<string, string[]> = {};
    for (const [postId, list] of Object.entries(body.likes)) {
      if (!Array.isArray(list)) continue;
      const existing = (current.likes?.[postId] || []).map(norm);
      const wantsLike = list.map(norm).includes(me);
      const others = existing.filter((u) => u !== me);
      out[postId] = wantsLike ? [...others, me] : others;
    }
    body.likes = out;
  } else {
    delete body.likes;
  }

  if (!staff) delete body.notices;

  const pendingReq = (requester: string, target: string) =>
    (current.followRequests || []).some((r) => norm(r.requester) === requester && norm(r.target) === target);

  if (Array.isArray(body.follows)) {
    body.follows = body.follows.filter((f: any) => {
      const fol = norm(f?.follower);
      const fing = norm(f?.following);
      if (admin) return true;
      if (fol === me) return true; // I follow someone
      if (fing === me && pendingReq(fol, me)) return true; // I accept their request
      return false;
    });
  }
  if (Array.isArray(body.removedFollows)) {
    body.removedFollows = body.removedFollows.filter(
      (f: any) => admin || norm(f?.follower) === me || norm(f?.following) === me
    );
  }
  if (Array.isArray(body.followRequests)) {
    body.followRequests = body.followRequests.filter((r: any) => admin || norm(r?.requester) === me);
  }
  if (Array.isArray(body.removedFollowRequests)) {
    body.removedFollowRequests = body.removedFollowRequests.filter(
      (r: any) => admin || norm(r?.requester) === me || norm(r?.target) === me
    );
  }

  // ---- Groups ----
  const existingGroups = new Map((current.groups || []).map((g: any) => [g.id, g]));
  const createdNow = new Set<string>();
  const isGroupOwner = (gid: string) => {
    if (admin) return true;
    const g = existingGroups.get(gid);
    return g ? groupCreator(g) === me : createdNow.has(gid);
  };
  const hasInviteOrRequest = (gid: string) =>
    (current.groupJoinRequests || []).some((r: any) => r?.groupId === gid && norm(r?.username) === me);

  if (Array.isArray(body.groups)) {
    const kept: any[] = [];
    for (const g of body.groups) {
      if (!g?.id) continue;
      const existing = existingGroups.get(g.id);
      if (!existing) {
        // New group: the creator is always the caller.
        const creator = groupCreator(g) || me;
        if (!admin && creator !== me) continue;
        createdNow.add(g.id);
        kept.push({ ...g, creator_username: creator, creator, creatorUsername: creator });
      } else if (isGroupOwner(g.id)) {
        kept.push(g);
      } else if (Array.isArray(g.members) && g.members.map(norm).includes(me) && hasInviteOrRequest(g.id)) {
        // Non-owner joining via invite: only add themselves.
        kept.push({ id: g.id, members: [...(existing.members || []), me] });
      }
    }
    body.groups = kept;
  }

  if (body.groupMembers && typeof body.groupMembers === 'object') {
    const out: Record<string, string[]> = {};
    for (const [gid, members] of Object.entries(body.groupMembers)) {
      if (!Array.isArray(members)) continue;
      if (isGroupOwner(gid)) out[gid] = members as string[];
      else if (members.map(norm).includes(me) && hasInviteOrRequest(gid)) out[gid] = [me];
    }
    body.groupMembers = out;
  }

  if (Array.isArray(body.groupJoinRequests)) {
    body.groupJoinRequests = body.groupJoinRequests.filter((r: any) => {
      if (!r?.groupId) return false;
      if (admin || norm(r.username) === me) return true;
      if (norm(r.invitedBy) === me) return true;
      return isGroupOwner(r.groupId);
    });
  }

  // Notifications: the actor is always the caller.
  if (Array.isArray(body.notifications)) {
    body.notifications = body.notifications
      .filter((n: any) => n && (n.recipientUsername || n.userId))
      .slice(0, 50)
      .map((n: any) => ({ ...n, actorUsername: me, actor: me }));
  }

  return body;
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, saveServerStore } from '@/lib/serverStore';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.toLowerCase().trim();

    const store = await getServerStore();
    const isAdmin = username === 'shashwath71845';

    // STRICT PRIVACY: Only return chat messages for conversations the requesting user belongs to
    const filteredChatMessages: Record<string, any[]> = {};
    if (username) {
      for (const [key, msgs] of Object.entries(store.chatMessages || {})) {
        if (key.includes('__')) {
          const participants = key.split('__').map((p) => p.trim().toLowerCase());
          if (participants.includes(username)) {
            filteredChatMessages[key] = msgs;
          }
        } else if (key.startsWith('conv-group-') || key.startsWith('group-')) {
          const groupId = key.replace(/^conv-/, '');
          const groupMembers = (store.groupMembers?.[groupId] || []).map((m: string) => m.toLowerCase().trim());
          const group = (store.groups || []).find((g: any) => g.id === groupId);
          const membersFromGroup = Array.isArray(group?.members) ? group.members.map((m: string) => m.toLowerCase().trim()) : [];
          const isMember = groupMembers.includes(username) || membersFromGroup.includes(username);
          const isInvited = (store.groupJoinRequests || []).some(
            (r: any) => r.groupId === groupId && r.username.toLowerCase().trim() === username && r.status === 'pending'
          );
          if (isAdmin || isMember || isInvited) {
            filteredChatMessages[key] = msgs;
          }
        }
      }
    }

    // Filter groups strictly: NEVER leak private groups to uninvited non-members!
    let filteredGroups: any[] = [];
    let filteredGroupRequests: any[] = [];
    if (username) {
      filteredGroups = (store.groups || []).filter((g: any) => {
        if (isAdmin) return true;
        const groupMembers = (store.groupMembers?.[g.id] || []).map((m: string) => m.toLowerCase().trim());
        const membersFromGroup = Array.isArray(g.members) ? g.members.map((m: string) => m.toLowerCase().trim()) : [];
        const isMember = groupMembers.includes(username) || membersFromGroup.includes(username);
        const isInvited = (store.groupJoinRequests || []).some(
          (r: any) => r.groupId === g.id && r.username.toLowerCase().trim() === username && r.status === 'pending'
        );
        const hasReq = (store.groupJoinRequests || []).some(
          (r: any) => r.groupId === g.id && r.username.toLowerCase().trim() === username
        );
        return isMember || isInvited || hasReq;
      });

      filteredGroupRequests = (store.groupJoinRequests || []).filter((r: any) => {
        if (isAdmin) return true;
        const reqUser = (r.username || '').toLowerCase().trim();
        const inviter = (r.invitedBy || '').toLowerCase().trim();
        const groupMembers = (store.groupMembers?.[r.groupId] || []).map((m: string) => m.toLowerCase().trim());
        return reqUser === username || inviter === username || groupMembers.includes(username);
      });
    }

    // Filter notifications so only recipient's notifications are returned
    const userCookie = req.cookies.get('dpsbuzz_user')?.value;
    let authUser = '';
    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        authUser = (parsed?.username || '').toLowerCase().trim();
      } catch {}
    }
    const reqUsername = authUser || username;

    const filteredNotifications = reqUsername
      ? (store.notifications || []).filter((n: any) => {
          const target = (n.recipientUsername || n.userId || '').toLowerCase().trim();
          return target === reqUsername || target === '' || reqUsername === 'shashwath71845';
        })
      : [];

    const mode = searchParams.get('mode');
    if (mode === 'incoming' || mode === 'alerts') {
      const recentPosts = (store.posts || []).slice(0, 3).map((p: any) => ({
        id: p.id,
        username: p.username,
        caption: p.caption,
        avatar: p.avatar,
      }));
      return NextResponse.json({
        success: true,
        mode: 'incoming',
        chatMessages: filteredChatMessages,
        notifications: filteredNotifications,
        activeCalls: store.activeCalls || {},
        posts: recentPosts,
        lastUpdated: store.lastUpdated,
      }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({
      success: true,
      posts: store.posts,
      stories: store.stories,
      profiles: store.profiles,
      comments: store.comments,
      likes: store.likes,
      chatNotes: store.chatNotes,
      chatMessages: filteredChatMessages, // Never expose all messages globally!
      groups: filteredGroups,
      groupMembers: store.groupMembers || {},
      groupJoinRequests: filteredGroupRequests,
      deletedPostIds: store.deletedPostIds || [],
      deletedUsernames: store.deletedUsernames || [],
      notifications: filteredNotifications,
      notices: store.notices || [],
      follows: store.follows || [],
      followRequests: store.followRequests || [],
      lastUpdated: store.lastUpdated,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error in GET /api/sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { posts, stories, profiles, comments, likes } = body;
    const current = await getServerStore({ forceRefresh: true });
    const deletedIds = new Set(current.deletedPostIds || []);
    const deletedUsernames = new Set((current.deletedUsernames || []).map((u) => u.toLowerCase().trim()));

    // Merge posts (keep unique by id, newest first, exclude deleted posts and deleted authors)
    let mergedPosts = [...current.posts];
    if (Array.isArray(posts)) {
      const existingIds = new Set(mergedPosts.map((p) => p.id));
      for (const p of posts) {
        const author = (p.username || '').toLowerCase().trim();
        if (!existingIds.has(p.id) && !deletedIds.has(p.id) && !deletedUsernames.has(author)) {
          mergedPosts.unshift(p);
          existingIds.add(p.id);
        }
      }
    }

    // Merge stories (exclude deleted authors)
    let mergedStories = [...current.stories];
    if (Array.isArray(stories)) {
      const existingIds = new Set(mergedStories.map((s) => s.id));
      for (const s of stories) {
        const author = (s.username || '').toLowerCase().trim();
        if (!existingIds.has(s.id) && !deletedUsernames.has(author)) {
          mergedStories.unshift(s);
          existingIds.add(s.id);
        }
      }
    }

    // Merge profiles (exclude deleted usernames, update existing ones)
    let mergedProfiles = [...current.profiles];
    if (Array.isArray(profiles)) {
      const userCookie = req.cookies.get('dpsbuzz_user')?.value;
      let authUser = '';
      let isAdmin = false;
      if (userCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userCookie));
          authUser = (parsed?.username || '').toLowerCase().trim();
          isAdmin = parsed?.role === 'admin' && authUser === 'shashwath71845';
        } catch {}
      }

      const existingMap = new Map(mergedProfiles.map((pr) => [pr.username.toLowerCase().trim(), pr]));
      for (const pr of profiles) {
        const u = pr.username?.toLowerCase()?.trim();
        if (!u || deletedUsernames.has(u)) continue;

        // Security: Non-admin users can ONLY update their own profile details
        if (!isAdmin && authUser && u !== authUser) {
          continue;
        }

        if (existingMap.has(u)) {
          // Update existing profile with new details (class, section, bio, avatar, etc.)
          const existing = existingMap.get(u)!;
          if (pr.class) existing.class = pr.class;
          if (pr.section) existing.section = pr.section;
          if (pr.fullName) existing.fullName = pr.fullName;
          if (pr.bio !== undefined) existing.bio = pr.bio;
          if (pr.avatar !== undefined) existing.avatar = pr.avatar;
          if (pr.isPrivate !== undefined) existing.isPrivate = pr.isPrivate;
          if (isAdmin && pr.spiritPoints !== undefined) existing.spiritPoints = pr.spiritPoints;

          // Propagate updated class & section to this student's posts
          const newClassStr = pr.class
            ? pr.class.toString().startsWith('Class')
              ? pr.class
              : `Class ${pr.class}-${pr.section || 'A'}`
            : undefined;
          if (newClassStr) {
            for (const p of mergedPosts) {
              if ((p.username || '').toLowerCase().trim() === u) {
                p.class = newClassStr;
              }
            }
          }
        } else {
          mergedProfiles.push(pr);
          existingMap.set(u, pr);
        }
      }
    }

    // Merge comments
    const mergedComments = { ...current.comments };
    if (comments && typeof comments === 'object') {
      for (const [postId, list] of Object.entries(comments)) {
        if (Array.isArray(list)) {
          const currentList = mergedComments[postId] || [];
          const currentCommentIds = new Set(currentList.map((c) => c.id));
          for (const c of list as any[]) {
            if (!currentCommentIds.has(c.id)) {
              currentList.push(c);
              currentCommentIds.add(c.id);
            }
          }
          mergedComments[postId] = currentList;
        }
      }
    }

    // Merge notices
    let mergedNotices = Array.isArray(current.notices) ? [...current.notices] : [];
    if (Array.isArray(body.notices)) {
      const existingNoticeIds = new Set(mergedNotices.map((n) => n.id));
      for (const n of body.notices) {
        if (!existingNoticeIds.has(n.id)) {
          mergedNotices.unshift(n);
          existingNoticeIds.add(n.id);
        }
      }
    }

    // Merge follows
    let mergedFollows = Array.isArray(current.follows) ? [...current.follows] : [];
    if (Array.isArray(body.follows)) {
      const existingSet = new Set(mergedFollows.map((f) => `${(f.follower || '').toLowerCase().trim()}__${(f.following || '').toLowerCase().trim()}`));
      for (const f of body.follows) {
        const fol = (f.follower || '').toLowerCase().trim();
        const fing = (f.following || '').toLowerCase().trim();
        if (fol && fing && fol !== fing && !deletedUsernames.has(fol) && !deletedUsernames.has(fing)) {
          const key = `${fol}__${fing}`;
          if (!existingSet.has(key)) {
            mergedFollows.push({ follower: fol, following: fing });
            existingSet.add(key);
          }
        }
      }
    }
    if (Array.isArray(body.removedFollows)) {
      const removeSet = new Set(body.removedFollows.map((f: any) => `${(f.follower || '').toLowerCase().trim()}__${(f.following || '').toLowerCase().trim()}`));
      mergedFollows = mergedFollows.filter((f) => !removeSet.has(`${(f.follower || '').toLowerCase().trim()}__${(f.following || '').toLowerCase().trim()}`));
    }

    // Merge followRequests
    let mergedFollowRequests = Array.isArray(current.followRequests) ? [...current.followRequests] : [];
    if (Array.isArray(body.followRequests)) {
      const existingReqs = new Set(mergedFollowRequests.map((r) => `${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
      for (const r of body.followRequests) {
        const req = (r.requester || '').toLowerCase().trim();
        const tar = (r.target || '').toLowerCase().trim();
        if (req && tar && req !== tar && !deletedUsernames.has(req) && !deletedUsernames.has(tar)) {
          const key = `${req}__${tar}`;
          if (!existingReqs.has(key)) {
            mergedFollowRequests.push({ requester: req, target: tar });
            existingReqs.add(key);
          }
        }
      }
    }
    if (Array.isArray(body.removedFollowRequests)) {
      const removeReqSet = new Set(body.removedFollowRequests.map((r: any) => `${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
      mergedFollowRequests = mergedFollowRequests.filter((r) => !removeReqSet.has(`${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
    }

    // Merge groups
    let mergedGroups = Array.isArray(current.groups) ? [...current.groups] : [];
    if (Array.isArray(body.groups)) {
      const groupMap = new Map(mergedGroups.map((g: any) => [g.id, g]));
      for (const g of body.groups) {
        if (g && g.id) {
          const existing = groupMap.get(g.id);
          if (existing) {
            const mergedMems = Array.from(new Set([...(existing.members || []), ...(g.members || [])]));
            groupMap.set(g.id, { ...existing, ...g, members: mergedMems, memberCount: Math.max(mergedMems.length, g.memberCount || 1) });
          } else {
            groupMap.set(g.id, g);
          }
        }
      }
      mergedGroups = Array.from(groupMap.values());
    }

    // Merge group members
    const mergedGroupMembers: Record<string, string[]> = { ...(current.groupMembers || {}) };
    if (body.groupMembers && typeof body.groupMembers === 'object') {
      for (const [gid, members] of Object.entries(body.groupMembers)) {
        if (Array.isArray(members)) {
          const currentMems = mergedGroupMembers[gid] || [];
          const set = new Set([...currentMems.map((m: string) => m.toLowerCase().trim()), ...members.map((m: string) => m.toLowerCase().trim())]);
          mergedGroupMembers[gid] = Array.from(set);
        }
      }
    }

    // Merge group join requests / invites
    let mergedGroupRequests = Array.isArray(current.groupJoinRequests) ? [...current.groupJoinRequests] : [];
    if (Array.isArray(body.groupJoinRequests)) {
      const reqMap = new Map(mergedGroupRequests.map((r: any) => [r.id, r]));
      for (const r of body.groupJoinRequests) {
        if (r && r.id) {
          reqMap.set(r.id, { ...(reqMap.get(r.id) || {}), ...r });
        }
      }
      mergedGroupRequests = Array.from(reqMap.values());
    }

    const updated = await saveServerStore({
      posts: mergedPosts,
      stories: mergedStories,
      profiles: mergedProfiles,
      comments: mergedComments,
      likes: { ...current.likes, ...(likes || {}) },
      notices: mergedNotices,
      follows: mergedFollows,
      followRequests: mergedFollowRequests,
      groups: mergedGroups,
      groupMembers: mergedGroupMembers,
      groupJoinRequests: mergedGroupRequests,
    });

    return NextResponse.json({
      success: true,
      posts: updated.posts,
      stories: updated.stories,
      profiles: updated.profiles,
      comments: updated.comments,
      likes: updated.likes,
      notices: updated.notices,
      follows: updated.follows || [],
      followRequests: updated.followRequests || [],
      groups: updated.groups || [],
      groupJoinRequests: updated.groupJoinRequests || [],
      deletedUsernames: updated.deletedUsernames || [],
      lastUpdated: updated.lastUpdated,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync update failed' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

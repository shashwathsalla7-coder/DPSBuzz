import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStore, saveServerStore } from '@/lib/serverStore';
import {
  getD1Profiles,
  getD1Follows,
  getD1FollowRequests,
  getD1Groups,
  getD1GroupMembers,
  getD1MessagesForUser,
  getD1NotificationsForUser,
  insertD1Message,
  insertD1Notification,
  insertD1Group,
  addD1Follow,
  removeD1Friendship,
  addD1FollowRequest,
  removeD1FollowRequest,
  isD1Configured,
} from '@/lib/cloudflare/dbService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

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

      // DIRECT READ FROM CLOUDFLARE D1 for permanent fast cross-device sync
      if (isD1Configured() && username) {
        try {
          const d1Msgs = await getD1MessagesForUser(username);
          for (const [chatKey, msgs] of Object.entries(d1Msgs)) {
            if (chatKey.includes('__')) {
              const parts = chatKey.split('__').map((p: string) => p.trim().toLowerCase());
              if (!parts.includes(username) && username !== 'shashwath71845') continue;
            }
            if (!filteredChatMessages[chatKey]) {
              filteredChatMessages[chatKey] = [];
            }
            for (const m of msgs) {
              if (!filteredChatMessages[chatKey].some((existing: any) => existing.id === m.id)) {
                filteredChatMessages[chatKey].push({
                  ...m,
                  sender: (m.senderUsername || '').toLowerCase() === username ? 'me' : 'them',
                });
              }
            }
          }
        } catch (d1Err) {
          console.warn('Cloudflare D1 sync messages notice:', d1Err);
        }
      }

      // DIRECT READ FROM SUPABASE messages table for cross-device & incoming message sync
      if (supabaseUrl && supabaseKey) {
        try {
          const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
          const { data: dbRows } = await sb
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${username},chat_id.ilike.%${username}%`)
            .order('created_at', { ascending: true })
            .limit(300);

          if (Array.isArray(dbRows)) {
            for (const row of dbRows) {
              const chatKey = row.chat_id;
              if (!chatKey) continue;
              if (chatKey.includes('__')) {
                const parts = chatKey.split('__').map((p: string) => p.trim().toLowerCase());
                if (!parts.includes(username) && username !== 'shashwath71845') continue; // STRICT PRIVACY
              }
              if (!filteredChatMessages[chatKey]) {
                filteredChatMessages[chatKey] = [];
              }
              if (!filteredChatMessages[chatKey].some((m: any) => m.id === row.id || (row.client_id && m.client_id === row.client_id))) {
                let previewObj: any = null;
                if (row.post_preview && typeof row.post_preview === 'object') {
                  previewObj = row.post_preview;
                } else if (typeof row.post_preview === 'string') {
                  try { previewObj = JSON.parse(row.post_preview); } catch {}
                }
                if (!previewObj && (row.post_id || row.message_type === 'post_share')) {
                  previewObj = { id: row.post_id || '', username: '', caption: '' };
                }
                filteredChatMessages[chatKey].push({
                  id: row.id,
                  client_id: row.client_id,
                  text: row.text,
                  sender: (row.sender_id || '').toLowerCase() === username ? 'me' : 'them',
                  senderUsername: row.sender_id,
                  time: row.created_at ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(row.created_at)) : 'Recently',
                  createdAt: row.created_at,
                  status: row.read_at ? 'read' : row.delivered_at ? 'delivered' : (row.status || 'sent'),
                  is_read: Boolean(row.read_at || row.is_read),
                  isSeen: Boolean(row.read_at || row.is_read),
                  isDelivered: Boolean(row.delivered_at || row.read_at || row.status === 'delivered' || row.status === 'read'),
                  sharedPost: previewObj,
                  message_type: row.message_type || (previewObj ? 'post_share' : 'text'),
                  post_id: row.post_id || previewObj?.id,
                  post_preview: previewObj,
                  isChatPhoto: Boolean(previewObj?.id?.startsWith('chat-photo-') || previewObj?.caption === 'Chat photo' || previewObj?.caption === 'Shared a photo'),
                });
              }
            }
          }
        } catch (err) {
          console.warn('Supabase sync messages error:', err);
        }
      }
    }

    // Hydrate groups and group memberships directly from Supabase for cross-device consistency
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: dbGroups } = await sb.from('groups').select('*').limit(200);
        if (Array.isArray(dbGroups) && dbGroups.length > 0) {
          const groupMap = new Map((store.groups || []).map((g: any) => [g.id, g]));
          for (const dg of dbGroups) {
            const existing = groupMap.get(dg.id);
            groupMap.set(dg.id, {
              id: dg.id,
              name: dg.name,
              description: dg.description || '',
              creator: dg.creator_username,
              creatorUsername: dg.creator_username,
              creator_username: dg.creator_username,
              memberCount: dg.member_count || 1,
              members: existing?.members || [dg.creator_username],
              category: dg.category || 'Study Group',
              avatarUrl: dg.avatar_url || null,
              isOfficial: dg.is_official || false,
              createdAt: dg.created_at,
            });
          }
          store.groups = Array.from(groupMap.values());
        }

        const { data: memSetting } = await sb.from('app_settings').select('value').eq('key', 'group_members_registry').maybeSingle();
        if (memSetting?.value && typeof memSetting.value === 'object') {
          store.groupMembers = { ...(store.groupMembers || {}), ...memSetting.value };
        }

        const { data: invSetting } = await sb.from('app_settings').select('value').eq('key', 'group_invitations_registry').maybeSingle();
        if (Array.isArray(invSetting?.value)) {
          const reqMap = new Map((store.groupJoinRequests || []).map((r: any) => [r.id, r]));
          for (const r of invSetting.value) {
            if (r && r.id) reqMap.set(r.id, r);
          }
          store.groupJoinRequests = Array.from(reqMap.values());
        }
      } catch (grpErr) {
        console.warn('Supabase groups hydration error:', grpErr);
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

    let filteredNotifications = reqUsername
      ? (store.notifications || []).filter((n: any) => {
          const target = (n.recipientUsername || n.userId || '').toLowerCase().trim();
          return target === reqUsername || target === '' || reqUsername === 'shashwath71845';
        })
      : [];

    // DIRECT READ FROM CLOUDFLARE D1 for notifications
    if (isD1Configured() && reqUsername) {
      try {
        const d1Notifs = await getD1NotificationsForUser(reqUsername);
        for (const dn of d1Notifs) {
          if (!filteredNotifications.some((n: any) => n.id === dn.id)) {
            filteredNotifications.unshift(dn);
          }
        }
      } catch (d1NotifErr) {
        console.warn('Cloudflare D1 notification sync error:', d1NotifErr);
      }
    }

    if (sb && reqUsername) {
      try {
        const { data: dbNotifs } = await sb
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${reqUsername},recipient_username.eq.${reqUsername}`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (Array.isArray(dbNotifs) && dbNotifs.length > 0) {
          for (const dn of dbNotifs) {
            if (!filteredNotifications.some((n: any) => n.id === dn.id)) {
              filteredNotifications.unshift({
                id: dn.id,
                type: dn.type || 'system',
                title: dn.title,
                body: dn.body,
                link: dn.link,
                isRead: Boolean(dn.is_read),
                createdAt: dn.created_at,
                timeAgo: 'Recently',
              } as any);
            }
          }
        }
      } catch (notifErr) {
        console.warn('Supabase notifications sync error:', notifErr);
      }
    }

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

    let syncFollows = Array.isArray(store.follows) ? [...store.follows] : [];
    let syncFollowRequests = Array.isArray(store.followRequests) ? [...store.followRequests] : [];
    let syncProfiles = Array.isArray(store.profiles) ? [...store.profiles] : [];
    let syncPosts = Array.isArray(store.posts) ? [...store.posts] : [];
    let syncStories = Array.isArray(store.stories) ? [...store.stories] : [];

    // DIRECT READ FROM CLOUDFLARE D1 DATABASE (never pauses, permanent)
    if (isD1Configured()) {
      try {
        const [d1Follows, d1Reqs, d1Profs, d1Grps, d1GrpMembers] = await Promise.all([
          getD1Follows(),
          getD1FollowRequests(),
          getD1Profiles(),
          getD1Groups(),
          getD1GroupMembers(),
        ]);

        if (d1Follows.length > 0) {
          const followSet = new Set(syncFollows.map((f: any) => `${(f.follower || '').toLowerCase().trim()}__${(f.following || '').toLowerCase().trim()}`));
          for (const df of d1Follows) {
            const fol = df.follower;
            const fing = df.following;
            if (fol && fing && fol !== fing && !followSet.has(`${fol}__${fing}`)) {
              syncFollows.push({ follower: fol, following: fing });
              followSet.add(`${fol}__${fing}`);
            }
          }
        }

        if (d1Reqs.length > 0) {
          const reqSet = new Set(syncFollowRequests.map((r: any) => `${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
          for (const dr of d1Reqs) {
            const reqUser = dr.requester;
            const tarUser = dr.target;
            if (reqUser && tarUser && reqUser !== tarUser && !reqSet.has(`${reqUser}__${tarUser}`)) {
              syncFollowRequests.push({ requester: reqUser, target: tarUser });
              reqSet.add(`${reqUser}__${tarUser}`);
            }
          }
        }

        if (d1Profs.length > 0) {
          const profileMap = new Map<string, any>();
          for (const sp of syncProfiles) profileMap.set(sp.username.toLowerCase().trim(), sp);
          for (const dp of d1Profs) profileMap.set(dp.username.toLowerCase().trim(), dp);
          syncProfiles = Array.from(profileMap.values());
        }

        if (d1Grps.length > 0) {
          const existingGroupIds = new Set((store.groups || []).map((g: any) => g.id));
          for (const dg of d1Grps) {
            if (!existingGroupIds.has(dg.id)) {
              if (!store.groups) store.groups = [];
              store.groups.push(dg);
            }
          }
        }
      } catch (d1SyncErr) {
        console.warn('Cloudflare D1 sync error:', d1SyncErr);
      }
    }

    // DIRECT READ FROM SUPABASE DATABASE
    if (sb) {
      try {
        const [
          { data: dbFollows },
          { data: dbReqs },
          { data: dbProfiles },
          { data: dbPosts },
          { data: dbStories },
        ] = await Promise.all([
          sb.from('follows').select('*').limit(1000),
          sb.from('follow_requests').select('*').eq('status', 'pending').limit(1000),
          sb.from('profiles').select('*').limit(500),
          sb.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
          sb.from('stories').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100),
        ]);

        if (Array.isArray(dbFollows)) {
          const followSet = new Set(syncFollows.map((f: any) => `${(f.follower || '').toLowerCase().trim()}__${(f.following || '').toLowerCase().trim()}`));
          for (const df of dbFollows) {
            const fol = (df.follower || '').toLowerCase().trim();
            const fing = (df.following || '').toLowerCase().trim();
            if (fol && fing && fol !== fing && !followSet.has(`${fol}__${fing}`)) {
              syncFollows.push({ follower: fol, following: fing });
              followSet.add(`${fol}__${fing}`);
            }
          }
        }

        if (Array.isArray(dbReqs)) {
          const reqSet = new Set(syncFollowRequests.map((r: any) => `${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
          for (const dr of dbReqs) {
            const reqUser = (dr.requester || '').toLowerCase().trim();
            const tarUser = (dr.target || '').toLowerCase().trim();
            if (reqUser && tarUser && reqUser !== tarUser && !reqSet.has(`${reqUser}__${tarUser}`)) {
              syncFollowRequests.push({ requester: reqUser, target: tarUser });
              reqSet.add(`${reqUser}__${tarUser}`);
            }
          }
        }

        if (Array.isArray(dbProfiles) && dbProfiles.length > 0) {
          const profileMap = new Map<string, any>();
          for (const sp of syncProfiles) profileMap.set(sp.username.toLowerCase().trim(), sp);
          for (const dp of dbProfiles) {
            const u = dp.username.toLowerCase().trim();
            const existing = profileMap.get(u);
            profileMap.set(u, {
              id: dp.id,
              username: dp.username,
              fullName: dp.full_name || dp.username,
              avatar: dp.avatar_url || existing?.avatar || null,
              bio: dp.bio || existing?.bio || '',
              class: dp.class || existing?.class || '8',
              section: dp.section || existing?.section || 'A',
              role: dp.role || existing?.role || 'student',
              isVerified: dp.is_verified ?? existing?.isVerified ?? true,
              isApproved: dp.is_approved ?? existing?.isApproved ?? true,
              isPrivate: dp.is_private ?? existing?.isPrivate ?? false,
              followerCount: dp.follower_count || existing?.followerCount || 0,
              followingCount: dp.following_count || existing?.followingCount || 0,
              postCount: dp.post_count || existing?.postCount || 0,
              spiritPoints: dp.spirit_points || existing?.spiritPoints || 50,
              createdAt: dp.created_at || existing?.createdAt,
            });
          }
          syncProfiles = Array.from(profileMap.values());
        }

        if (Array.isArray(dbPosts) && dbPosts.length > 0) {
          const postMap = new Map<string, any>();
          for (const sp of syncPosts) postMap.set(sp.id, sp);
          for (const dp of dbPosts) {
            postMap.set(dp.id, {
              id: dp.id,
              userId: dp.user_id,
              username: dp.username,
              fullName: dp.full_name,
              avatar: dp.user_avatar,
              class: dp.class,
              caption: dp.caption || '',
              imageUrl: dp.image_url,
              images: dp.images || (dp.image_url ? [dp.image_url] : []),
              song: dp.song,
              habitCategory: dp.habit_category,
              habitTag: dp.habit_tag,
              likes: dp.likes_count || 0,
              comments: dp.comments_count || 0,
              repostCount: dp.repost_count || 0,
              isRepost: Boolean(dp.is_repost),
              repostedFrom: dp.reposted_from,
              createdAt: dp.created_at,
              timeAgo: 'Just now',
            });
          }
          syncPosts = Array.from(postMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        }

        if (Array.isArray(dbStories) && dbStories.length > 0) {
          const storyMap = new Map<string, any>();
          for (const ss of syncStories) storyMap.set(ss.id, ss);
          for (const ds of dbStories) {
            let extra: any = {};
            if (ds.caption && typeof ds.caption === 'string' && ds.caption.startsWith('{')) {
              try { extra = JSON.parse(ds.caption); } catch {}
            }
            storyMap.set(ds.id, {
              id: ds.id,
              userId: ds.user_id,
              username: ds.username,
              fullName: extra.fullName || ds.username,
              avatar: extra.avatar || null,
              imageUrl: ds.media_url || extra.imageUrl || '',
              caption: extra.caption || (!ds.caption?.startsWith('{') ? ds.caption : '') || '',
              text: extra.text || (!ds.caption?.startsWith('{') ? ds.caption : '') || undefined,
              background: extra.background || '#0F131B',
              textColor: extra.textColor || '#FFFFFF',
              song: extra.song || undefined,
              filter: extra.filter || undefined,
              stickers: extra.stickers || undefined,
              textStyle: extra.textStyle || undefined,
              template: extra.template || undefined,
              templateData: extra.templateData || undefined,
              expiresAt: ds.expires_at,
              createdAt: ds.created_at,
              hasStory: true,
              isSeen: false,
              isNew: true,
            });
          }
          syncStories = Array.from(storyMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        }
      } catch (err) {
        // Fallback to store
      }
    }

    return NextResponse.json({
      success: true,
      posts: syncPosts,
      stories: syncStories,
      profiles: syncProfiles,
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
      follows: syncFollows,
      followRequests: syncFollowRequests,
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
    const sb = getSupabase();

    // 1. Merge posts (keep unique by id, newest first, exclude deleted posts and deleted authors)
    let mergedPosts = [...current.posts];
    if (Array.isArray(posts)) {
      const existingIds = new Set(mergedPosts.map((p) => p.id));
      for (const p of posts) {
        const author = (p.username || '').toLowerCase().trim();
        if (p && p.id && !deletedIds.has(p.id) && !existingIds.has(p.id) && !deletedUsernames.has(author)) {
          mergedPosts.unshift(p);
          existingIds.add(p.id);

          // Direct write to Supabase posts table
          if (sb) {
            const firstImg = p.imageUrl || (p.images && p.images.length > 0 ? p.images[0] : null);
            sb.from('posts').upsert({
              id: p.id,
              user_id: p.userId || p.username,
              username: p.username,
              full_name: p.fullName || p.username,
              user_avatar: p.avatar || null,
              class: p.class || null,
              caption: p.caption || '',
              image_url: firstImg,
              images: Array.isArray(p.images) ? p.images : (firstImg ? [firstImg] : []),
              song: p.song || null,
              habit_category: p.habitCategory || null,
              habit_tag: p.habitTag || null,
              likes_count: p.likes || 0,
              comments_count: p.comments || 0,
              repost_count: p.repostCount || 0,
              is_repost: Boolean(p.isRepost),
              reposted_from: p.repostedFrom || null,
              created_at: p.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' }).then(() => {}, () => {});
          }
        }
      }
    }

    // 2. Merge stories (keep active only, deduplicate)
    let mergedStories = [...current.stories];
    if (Array.isArray(stories)) {
      const existingIds = new Set(mergedStories.map((s) => s.id));
      for (const s of stories) {
        const author = (s.username || '').toLowerCase().trim();
        if (!existingIds.has(s.id) && !deletedUsernames.has(author)) {
          mergedStories.unshift(s);
          existingIds.add(s.id);

          if (sb) {
            sb.from('stories').upsert({
              id: s.id,
              user_id: s.userId || s.username,
              username: s.username,
              media_url: s.imageUrl || s.mediaUrl || '',
              caption: s.caption || '',
              expires_at: s.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: s.createdAt || new Date().toISOString(),
            }, { onConflict: 'id' }).then(() => {}, () => {});
          }
        }
      }
    }

    // 3. Merge profiles (exclude deleted usernames, update existing ones)
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
          // Update existing profile with new details (class, section, bio, avatar, isPrivate, etc.)
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

          // Direct write to Supabase profiles table
          if (sb) {
            sb.from('profiles').update({
              full_name: existing.fullName,
              avatar_url: existing.avatar || null,
              bio: existing.bio || '',
              class: existing.class || '8',
              section: existing.section || 'A',
              is_private: Boolean(existing.isPrivate),
              spirit_points: existing.spiritPoints || 50,
              updated_at: new Date().toISOString(),
            }).eq('username', u).then(() => {}, () => {});
          }
        } else {
          mergedProfiles.push(pr);
          existingMap.set(u, pr);

          if (sb) {
            sb.from('profiles').upsert({
              username: u,
              full_name: pr.fullName || u,
              avatar_url: pr.avatar || null,
              bio: pr.bio || '',
              class: pr.class || '8',
              section: pr.section || 'A',
              role: pr.role || 'student',
              is_verified: Boolean(pr.isVerified),
              is_approved: true,
              is_private: Boolean(pr.isPrivate),
              follower_count: pr.followerCount || 0,
              following_count: pr.followingCount || 0,
              post_count: pr.postCount || 0,
              spirit_points: pr.spiritPoints || 50,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'username' }).then(() => {}, () => {});
          }
        }
      }
    }

    // 4. Merge comments
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

              if (sb && c && c.username) {
                sb.from('comments').upsert({
                  id: c.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  post_id: postId,
                  username: c.username,
                  user_avatar: c.userAvatar || null,
                  text: c.text || '',
                  image: c.image || null,
                  created_at: new Date().toISOString(),
                }, { onConflict: 'id' }).then(() => {}, () => {});
              }
            }
          }
          mergedComments[postId] = currentList;
        }
      }
    }

    // 5. Merge notices
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

    // 6. Merge follows
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

    // 7. Merge followRequests
    let mergedFollowRequests = Array.isArray(current.followRequests) ? [...current.followRequests] : [];
    if (Array.isArray(body.followRequests)) {
      const existingReqs = new Set(mergedFollowRequests.map((r) => `${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
      for (const r of body.followRequests) {
        const reqUser = (r.requester || '').toLowerCase().trim();
        const tarUser = (r.target || '').toLowerCase().trim();
        if (reqUser && tarUser && reqUser !== tarUser && !deletedUsernames.has(reqUser) && !deletedUsernames.has(tarUser)) {
          const key = `${reqUser}__${tarUser}`;
          if (!existingReqs.has(key)) {
            mergedFollowRequests.push({ requester: reqUser, target: tarUser });
            existingReqs.add(key);
          }
        }
      }
    }
    if (Array.isArray(body.removedFollowRequests)) {
      const removeReqSet = new Set(body.removedFollowRequests.map((r: any) => `${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
      mergedFollowRequests = mergedFollowRequests.filter((r) => !removeReqSet.has(`${(r.requester || '').toLowerCase().trim()}__${(r.target || '').toLowerCase().trim()}`));
    }

    // Direct write to Cloudflare D1 database (never pauses, permanent)
    if (isD1Configured()) {
      try {
        if (Array.isArray(body.follows)) {
          for (const f of body.follows) {
            if (f.follower && f.following) addD1Follow(f.follower, f.following).catch(() => {});
          }
        }
        if (Array.isArray(body.removedFollows)) {
          for (const rf of body.removedFollows) {
            if (rf.follower && rf.following) removeD1Friendship(rf.follower, rf.following).catch(() => {});
          }
        }
        if (Array.isArray(body.followRequests)) {
          for (const r of body.followRequests) {
            if (r.requester && r.target) addD1FollowRequest(r.requester, r.target).catch(() => {});
          }
        }
        if (Array.isArray(body.removedFollowRequests)) {
          for (const rr of body.removedFollowRequests) {
            if (rr.requester && rr.target) removeD1FollowRequest(rr.requester, rr.target).catch(() => {});
          }
        }
        if (Array.isArray(body.groups)) {
          for (const g of body.groups) {
            if (g && g.id) {
              const creator = (g.creator_username || g.creator || g.creatorUsername || 'shashwath71845').toLowerCase().trim();
              insertD1Group({
                id: g.id,
                name: g.name || 'Study Group',
                description: g.description || '',
                createdBy: creator,
                iconUrl: g.icon_url || null,
                members: Array.isArray(g.members) ? g.members : [creator],
              }).catch(() => {});
            }
          }
        }
        if (Array.isArray(body.notifications)) {
          for (const n of body.notifications) {
            const target = (n.recipientUsername || n.userId || '').toLowerCase().trim();
            if (target) {
              insertD1Notification({
                id: n.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                userId: target,
                type: n.type || 'system',
                title: n.title || 'Notification',
                body: n.body || '',
                data: n.data || null,
              }).catch(() => {});
            }
          }
        }
      } catch (d1PostErr) {
        console.warn('Cloudflare D1 sync POST warning:', d1PostErr);
      }
    }

    // Direct write to Supabase follows and follow_requests tables (reliably awaited)
    if (sb && (body.follows || body.removedFollows || body.followRequests || body.removedFollowRequests)) {
      try {
        const affectedUsers = new Set<string>();

        if (Array.isArray(body.follows) && body.follows.length > 0) {
          const rows = body.follows
            .map((f: any) => ({
              follower: (f.follower || '').toLowerCase().trim(),
              following: (f.following || '').toLowerCase().trim(),
            }))
            .filter((f: any) => f.follower && f.following && f.follower !== f.following);
          if (rows.length > 0) {
            await sb.from('follows').upsert(rows, { onConflict: 'follower,following' });
            for (const r of rows) {
              affectedUsers.add(r.follower);
              affectedUsers.add(r.following);
            }
          }
        }
        if (Array.isArray(body.removedFollows) && body.removedFollows.length > 0) {
          for (const rf of body.removedFollows) {
            const fol = (rf.follower || '').toLowerCase().trim();
            const fing = (rf.following || '').toLowerCase().trim();
            if (fol && fing) {
              await sb.from('follows').delete().match({ follower: fol, following: fing });
              affectedUsers.add(fol);
              affectedUsers.add(fing);
            }
          }
        }
        if (Array.isArray(body.followRequests) && body.followRequests.length > 0) {
          const reqRows = body.followRequests
            .map((r: any) => ({
              requester: (r.requester || '').toLowerCase().trim(),
              target: (r.target || '').toLowerCase().trim(),
              status: 'pending',
            }))
            .filter((r: any) => r.requester && r.target && r.requester !== r.target);
          if (reqRows.length > 0) {
            await sb.from('follow_requests').upsert(reqRows, { onConflict: 'requester,target' });
          }
        }
        if (Array.isArray(body.removedFollowRequests) && body.removedFollowRequests.length > 0) {
          for (const rr of body.removedFollowRequests) {
            const reqUser = (rr.requester || '').toLowerCase().trim();
            const tarUser = (rr.target || '').toLowerCase().trim();
            if (reqUser && tarUser) {
              await sb.from('follow_requests').delete().match({ requester: reqUser, target: tarUser });
            }
          }
        }

        // Authoritative reconciliation of follower_count and following_count in Supabase profiles
        for (const uname of affectedUsers) {
          const { count: fersCount } = await sb.from('follows').select('id', { count: 'exact', head: true }).eq('following', uname);
          const { count: fingCount } = await sb.from('follows').select('id', { count: 'exact', head: true }).eq('follower', uname);
          await sb.from('profiles').update({
            follower_count: fersCount || 0,
            following_count: fingCount || 0,
            updated_at: new Date().toISOString(),
          }).eq('username', uname);
        }
      } catch (sbErr) {
        console.warn('Supabase follows sync warning:', sbErr);
      }
    }

    // 8. Merge groups
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

    // 9. Merge group members
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

    // 10. Merge group join requests / invites
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

    // Direct write of groups, memberships, and notifications to Supabase
    if (sb) {
      // (a) Groups table persistence
      if (Array.isArray(body.groups) && body.groups.length > 0) {
        for (const g of body.groups) {
          if (g && g.id) {
            const creator = (g.creator_username || g.creator || g.creatorUsername || '').toLowerCase().trim();
            const groupRow = {
              id: g.id,
              name: g.name || 'Study Group',
              description: g.description || '',
              creator_username: creator || 'student',
              member_count: Math.max(1, g.memberCount || (Array.isArray(g.members) ? g.members.length : 1)),
            };
            sb.from('groups').upsert(groupRow, { onConflict: 'id' }).then(() => {}, (e) => console.warn('Supabase group upsert error:', e));
          }
        }
      }

      // (b) Group members registry in app_settings for multi-server reliability
      if (body.groupMembers && typeof body.groupMembers === 'object') {
        sb.from('app_settings').upsert({
          key: 'group_members_registry',
          value: mergedGroupMembers,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' }).then(() => {}, () => {});
      }

      // (c) Group invitations registry in app_settings
      if (body.groupJoinRequests && Array.isArray(body.groupJoinRequests)) {
        sb.from('app_settings').upsert({
          key: 'group_invitations_registry',
          value: mergedGroupRequests,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' }).then(() => {}, () => {});
      }

      // (d) Notifications table persistence with guaranteed UUIDs
      if (Array.isArray(body.notifications) && body.notifications.length > 0) {
        for (const n of body.notifications) {
          if (n && (n.userId || n.recipientUsername)) {
            const notifId = n.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const targetUser = (n.recipientUsername || n.userId || '').toLowerCase().trim();
            const actorUser = (n.actorUsername || n.actor || '').toLowerCase().trim();
            sb.from('notifications').upsert({
              id: notifId,
              user_id: targetUser,
              recipient_username: targetUser,
              actor_username: actorUser || null,
              type: n.type || 'system',
              title: n.title || 'Notification',
              body: n.body || '',
              link: n.link || null,
              is_read: Boolean(n.isRead),
              created_at: n.createdAt || new Date().toISOString(),
            }, { onConflict: 'id' }).then(() => {}, (e) => console.warn('Supabase notification upsert error:', e));
          }
        }
      }
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

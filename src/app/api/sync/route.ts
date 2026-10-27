import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStore, saveServerStore } from '@/lib/serverStore';

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

    let syncFollows = Array.isArray(store.follows) ? [...store.follows] : [];
    let syncFollowRequests = Array.isArray(store.followRequests) ? [...store.followRequests] : [];
    let syncProfiles = Array.isArray(store.profiles) ? [...store.profiles] : [];
    let syncPosts = Array.isArray(store.posts) ? [...store.posts] : [];

    // DIRECT READ FROM SUPABASE DATABASE
    const sb = getSupabase();
    if (sb) {
      try {
        const [
          { data: dbFollows },
          { data: dbReqs },
          { data: dbProfiles },
          { data: dbPosts },
        ] = await Promise.all([
          sb.from('follows').select('*').limit(1000),
          sb.from('follow_requests').select('*').eq('status', 'pending').limit(1000),
          sb.from('profiles').select('*').limit(500),
          sb.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
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
      } catch (err) {
        // Fallback to store
      }
    }

    return NextResponse.json({
      success: true,
      posts: syncPosts,
      stories: store.stories,
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

    // Direct write to Supabase follows and follow_requests tables
    if (sb && (body.follows || body.removedFollows || body.followRequests || body.removedFollowRequests)) {
      (async () => {
        try {
          if (Array.isArray(body.follows) && body.follows.length > 0) {
            const rows = body.follows
              .map((f: any) => ({
                follower: (f.follower || '').toLowerCase().trim(),
                following: (f.following || '').toLowerCase().trim(),
              }))
              .filter((f: any) => f.follower && f.following && f.follower !== f.following);
            if (rows.length > 0) {
              await sb.from('follows').upsert(rows, { onConflict: 'follower,following' });
            }
          }
          if (Array.isArray(body.removedFollows) && body.removedFollows.length > 0) {
            for (const rf of body.removedFollows) {
              const fol = (rf.follower || '').toLowerCase().trim();
              const fing = (rf.following || '').toLowerCase().trim();
              if (fol && fing) {
                await sb.from('follows').delete().match({ follower: fol, following: fing });
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
        } catch (sbErr) {
          console.warn('Supabase follows sync warning:', sbErr);
        }
      })().catch(() => {});
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

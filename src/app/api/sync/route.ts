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

    // STRICT PRIVACY: Only return chat messages for conversations the requesting user belongs to
    const filteredChatMessages: Record<string, any[]> = {};
    if (username) {
      for (const [key, msgs] of Object.entries(store.chatMessages || {})) {
        if (key.includes('__')) {
          const participants = key.split('__').map((p) => p.trim().toLowerCase());
          if (participants.includes(username)) {
            filteredChatMessages[key] = msgs;
          }
        } else if (key.startsWith('conv-group-')) {
          // Group chat
          filteredChatMessages[key] = msgs;
        }
      }
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
      deletedPostIds: store.deletedPostIds || [],
      deletedUsernames: store.deletedUsernames || [],
      notifications: store.notifications || [],
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

    // Merge profiles (exclude deleted usernames)
    let mergedProfiles = [...current.profiles];
    if (Array.isArray(profiles)) {
      const existingUsernames = new Set(mergedProfiles.map((pr) => pr.username.toLowerCase().trim()));
      for (const pr of profiles) {
        const u = pr.username?.toLowerCase()?.trim();
        if (u && !existingUsernames.has(u) && !deletedUsernames.has(u)) {
          mergedProfiles.push(pr);
          existingUsernames.add(u);
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

    const updated = await saveServerStore({
      posts: mergedPosts,
      stories: mergedStories,
      profiles: mergedProfiles,
      comments: mergedComments,
      likes: { ...current.likes, ...(likes || {}) },
      notices: mergedNotices,
      follows: mergedFollows,
      followRequests: mergedFollowRequests,
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

import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, saveServerStore } from '@/lib/serverStore';

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
      notifications: store.notifications || [],
      notices: store.notices || [],
      lastUpdated: store.lastUpdated,
    });
  } catch (error: any) {
    console.error('Error in GET /api/sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { posts, stories, profiles, comments, likes } = body;
    const current = await getServerStore({ forceRefresh: true });
    const deletedIds = new Set(current.deletedPostIds || []);

    // Merge posts (keep unique by id, newest first, exclude deleted posts)
    let mergedPosts = [...current.posts];
    if (Array.isArray(posts)) {
      const existingIds = new Set(mergedPosts.map((p) => p.id));
      for (const p of posts) {
        if (!existingIds.has(p.id) && !deletedIds.has(p.id)) {
          mergedPosts.unshift(p);
          existingIds.add(p.id);
        }
      }
    }

    // Merge stories
    let mergedStories = [...current.stories];
    if (Array.isArray(stories)) {
      const existingIds = new Set(mergedStories.map((s) => s.id));
      for (const s of stories) {
        if (!existingIds.has(s.id)) {
          mergedStories.unshift(s);
          existingIds.add(s.id);
        }
      }
    }

    // Merge profiles
    let mergedProfiles = [...current.profiles];
    if (Array.isArray(profiles)) {
      const existingUsernames = new Set(mergedProfiles.map((pr) => pr.username.toLowerCase()));
      for (const pr of profiles) {
        const u = pr.username?.toLowerCase();
        if (u && !existingUsernames.has(u)) {
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

    const updated = await saveServerStore({
      posts: mergedPosts,
      stories: mergedStories,
      profiles: mergedProfiles,
      comments: mergedComments,
      likes: { ...current.likes, ...(likes || {}) },
      notices: mergedNotices,
    });

    return NextResponse.json({
      success: true,
      posts: updated.posts,
      stories: updated.stories,
      profiles: updated.profiles,
      comments: updated.comments,
      likes: updated.likes,
      notices: updated.notices,
      lastUpdated: updated.lastUpdated,
    });
  } catch (error: any) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync update failed' },
      { status: 500 }
    );
  }
}

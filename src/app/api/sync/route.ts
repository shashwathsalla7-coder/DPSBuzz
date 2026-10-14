import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, saveServerStore } from '@/lib/serverStore';

export async function GET() {
  try {
    const store = await getServerStore();
    return NextResponse.json({
      success: true,
      posts: store.posts,
      stories: store.stories,
      profiles: store.profiles,
      comments: store.comments,
      likes: store.likes,
      chatNotes: store.chatNotes,
      chatMessages: store.chatMessages,
      deletedPostIds: store.deletedPostIds || [],
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

    const updated = await saveServerStore({
      posts: mergedPosts,
      stories: mergedStories,
      profiles: mergedProfiles,
      comments: mergedComments,
      likes: { ...current.likes, ...(likes || {}) },
    });

    return NextResponse.json({
      success: true,
      posts: updated.posts,
      stories: updated.stories,
      profiles: updated.profiles,
      comments: updated.comments,
      likes: updated.likes,
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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataStore, Story, Profile, UserStoryGroup } from '@/lib/dataStore';
import { StoryRing } from './StoryRing';
import { StoryViewer } from './StoryViewer';
import { StoryCreatorModal } from './StoryCreatorModal';

export interface StoriesRowProps {
  currentUser?: Profile;
}

export const StoriesRow: React.FC<StoriesRowProps> = ({ currentUser }) => {
  const [userGroups, setUserGroups] = useState<{
    myGroup: UserStoryGroup | null;
    peerGroups: UserStoryGroup[];
    allGroups: UserStoryGroup[];
  }>({ myGroup: null, peerGroups: [], allGroups: [] });

  const [activeViewerState, setActiveViewerState] = useState<{
    userIndex: number;
    storyIndex: number;
  } | null>(null);

  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(false);
  const [user, setUser] = useState<Profile | null>(currentUser || null);

  const effectiveUser = user || DataStore.getCurrentUser();

  const loadStoryGroups = useCallback(() => {
    const activeUser = currentUser || DataStore.getCurrentUser();
    const groups = DataStore.getUserStoryGroups(activeUser?.username);
    setUserGroups(groups);
  }, [currentUser]);

  useEffect(() => {
    loadStoryGroups();
    if (!user) {
      setUser(DataStore.getCurrentUser());
    }

    const handleUpdate = () => loadStoryGroups();
    const handleOpenStoriesSwipe = () => {
      const activeUser = currentUser || DataStore.getCurrentUser();
      const groups = DataStore.getUserStoryGroups(activeUser?.username);
      if (groups.allGroups.length > 0) {
        setActiveViewerState({ userIndex: 0, storyIndex: 0 });
      } else {
        setIsCreatorOpen(true);
      }
    };
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('dpsbuzz:open_stories', handleOpenStoriesSwipe);

    // Live background polling to automatically sync stories between Web and Android App
    const syncInterval = setInterval(() => {
      DataStore.syncWithServer().then(() => loadStoryGroups());
    }, 4000);

    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('dpsbuzz:open_stories', handleOpenStoriesSwipe);
      clearInterval(syncInterval);
    };
  }, [loadStoryGroups, user]);

  const handleStorySeen = useCallback((storyId: string) => {
    DataStore.markStorySeen(storyId);
    setUserGroups((prev) => {
      const isAlreadySeen = prev.allGroups.some((g) =>
        g.stories.some((s) => s.id === storyId && s.isSeen)
      );
      if (isAlreadySeen) return prev;

      const updateStory = (s: Story) =>
        s.id === storyId ? { ...s, isSeen: true, isNew: false } : s;

      const updateGroup = (g: UserStoryGroup): UserStoryGroup => {
        const updatedStories = g.stories.map(updateStory);
        return {
          ...g,
          stories: updatedStories,
          hasUnseen: updatedStories.some((s) => !s.isSeen),
        };
      };

      return {
        myGroup: prev.myGroup ? updateGroup(prev.myGroup) : null,
        peerGroups: prev.peerGroups.map(updateGroup),
        allGroups: prev.allGroups.map(updateGroup),
      };
    });
  }, []);

  const hasMyStory = Boolean(userGroups.myGroup && userGroups.myGroup.stories.length > 0);

  const handleStoryCreated = () => {
    loadStoryGroups();
    const activeUser = currentUser || DataStore.getCurrentUser();
    const freshGroups = DataStore.getUserStoryGroups(activeUser?.username);
    setUserGroups(freshGroups);

    // If I created a story, open my group starting at the newly added story
    if (freshGroups.myGroup && freshGroups.myGroup.stories.length > 0) {
      const myUserIndex = freshGroups.allGroups.findIndex(
        (g) => g.username.toLowerCase() === activeUser?.username.toLowerCase()
      );
      const newStoryIdx = freshGroups.myGroup.stories.length - 1;
      setActiveViewerState({
        userIndex: myUserIndex !== -1 ? myUserIndex : 0,
        storyIndex: newStoryIdx,
      });
    }
  };

  return (
    <div
      className="px-4 py-3.5 border-b overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
      }}
    >
      <div className="flex items-start gap-4.5 overflow-x-auto no-scrollbar">
        {/* 1. "Your Story" Ring: Shows Instagram gradient ring if user has stories, or plus badge */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <StoryRing
            variant="your-story"
            size="lg"
            username={effectiveUser?.username || 'you'}
            name={effectiveUser?.fullName || 'You'}
            avatarUrl={effectiveUser?.avatar}
            hasStory={hasMyStory}
            onClick={() => {
              if (hasMyStory) {
                const myIdx = userGroups.allGroups.findIndex(
                  (g) => g.username.toLowerCase() === effectiveUser?.username.toLowerCase()
                );
                setActiveViewerState({
                  userIndex: myIdx !== -1 ? myIdx : 0,
                  storyIndex: 0,
                });
              } else {
                setIsCreatorOpen(true);
              }
            }}
            onAddStory={() => setIsCreatorOpen(true)}
          />
          <span
            className="text-[12px] font-semibold w-[88px] truncate text-center"
            style={{ color: hasMyStory ? 'var(--text)' : 'var(--text-muted)' }}
          >
            {hasMyStory ? 'Your story' : 'Add story'}
          </span>
        </div>

        {/* 2. Each Classmate Profile with Stories (Grouped by Profile, 1 Ring per Profile) */}
        {userGroups.peerGroups.map((group) => {
          const isSeen = !group.hasUnseen;
          const variant = isSeen ? 'seen' : 'unseen';

          return (
            <div key={group.username} className="flex flex-col items-center gap-1.5 shrink-0">
              <StoryRing
                variant={variant}
                size="lg"
                username={group.username}
                name={group.fullName}
                avatarUrl={group.avatar}
                isNew={group.hasUnseen}
                onClick={() => {
                  const uIdx = userGroups.allGroups.findIndex(
                    (g) => g.username.toLowerCase() === group.username.toLowerCase()
                  );
                  // Find index of first unread story in this group
                  const unreadStoryIdx = group.stories.findIndex((s) => !s.isSeen);
                  setActiveViewerState({
                    userIndex: uIdx !== -1 ? uIdx : 0,
                    storyIndex: unreadStoryIdx !== -1 ? unreadStoryIdx : 0,
                  });
                }}
              />
              <span
                className="text-[12px] w-[88px] truncate text-center font-semibold"
                style={{
                  color: isSeen ? 'var(--text-muted)' : 'var(--text)',
                }}
              >
                {group.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal — Displays exactly the number of bars of the active profile */}
      {activeViewerState !== null && userGroups.allGroups.length > 0 && (
        <StoryViewer
          userGroups={userGroups.allGroups}
          initialUserIndex={activeViewerState.userIndex}
          initialStoryIndex={activeViewerState.storyIndex}
          isOpen={activeViewerState !== null}
          onClose={() => setActiveViewerState(null)}
          onStorySeen={handleStorySeen}
        />
      )}

      {/* Story Creator Modal */}
      {effectiveUser && (
        <StoryCreatorModal
          isOpen={isCreatorOpen}
          currentUser={effectiveUser}
          onClose={() => setIsCreatorOpen(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  );
};

export default StoriesRow;

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Newspaper,
  Lock,
  X,
  Check,
  Clock,
  Sparkles,
  ShieldAlert,
  UserPlus,
  Plus,
  Search,
} from 'lucide-react';
import { school } from '@/config/school';
import {
  DataStore,
  type Profile,
  type GroupJoinRequest,
  type Group,
} from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export interface GroupStudentContact {
  id: string;
  name: string;
  username: string;
  studentClass: string;
  avatarUrl?: string | null;
}

export default function GroupsPage() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'members'>('feed');

  // Create Group State
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Join Requests, Invites, and Groups State
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [myInvites, setMyInvites] = useState<GroupJoinRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddGroupFriendsOpen, setIsAddGroupFriendsOpen] = useState(false);
  const [addFriendsSearchQuery, setAddFriendsSearchQuery] = useState('');
  const [tick, setTick] = useState(0);

  const currentUser = useMemo(() => DataStore.getCurrentUser(), []);

  // Reload team join requests, group invites, and groups
  const reloadData = () => {
    const user = DataStore.getCurrentUser();
    const cleanUser = (user?.username || '').toLowerCase().trim();
    const isAdmin = user.role === 'admin' || cleanUser === 'shashwath71845';
    const allReqs = DataStore.getGroupJoinRequests();
    // Only show join requests for groups where the current user is an enrolled member OR admin
    const relevantReqs = allReqs.filter(
      (r) => isAdmin || DataStore.isGroupMember(r.groupId, user.username)
    );
    setJoinRequests(relevantReqs);
    setMyInvites(DataStore.getGroupInvitesForUser(user.username));
    setGroups(DataStore.getGroups());
    setTick((prev) => prev + 1);
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Classmates followed by current user
  const liveFollowing = useMemo<GroupStudentContact[]>(() => {
    const current = DataStore.getCurrentUser();
    const profiles = DataStore.getProfiles().filter(
      (p) => p.username.toLowerCase() !== current.username.toLowerCase() && p.role === 'student'
    );
    const following = profiles.filter((p) => DataStore.isFollowing(current.username, p.username));
    return following.map((p) => ({
      id: p.id || p.username,
      name: p.fullName,
      username: p.username,
      studentClass: p.class ? `Class ${p.class}-${p.section || ''}` : 'DPS Student',
      avatarUrl: p.avatar,
    }));
  }, [tick]);

  const handleToggleGroupMember = (username: string) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const handleSelectAllFollowing = () => {
    if (selectedGroupMembers.length === liveFollowing.length && liveFollowing.length > 0) {
      setSelectedGroupMembers([]);
    } else {
      setSelectedGroupMembers(liveFollowing.map((s) => s.username));
    }
  };

  const handleCreateGroupSubmit = () => {
    const name = newGroupName.trim() || 'New Study Group';
    if (selectedGroupMembers.length === 0) {
      showToast('Please select at least one student to invite to the group.');
      return;
    }

    // Create group in DataStore (registers only creator as enrolled member, sends invitations to classmates)
    DataStore.createGroup({
      name,
      description: `Student study group created by @${currentUser.username}`,
      category: 'Study Group',
      members: selectedGroupMembers,
    });

    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setSelectedGroupMembers([]);
    reloadData();
    showToast(`Created group "${name}"! Invitations sent to ${selectedGroupMembers.length} classmate${selectedGroupMembers.length > 1 ? 's' : ''}. 📬`);
    router.push('/chats');
  };

  // Group Invitation Handlers ("Yes, I want to join" / "No, I don't want to join")
  const handleAcceptInvite = (invite: GroupJoinRequest) => {
    const res = DataStore.acceptGroupInvite(invite.id, currentUser.username);
    if (res.success) {
      showToast(`Joined "${invite.groupName}"! 🎉 Group chat added to your Chats.`);
      reloadData();
    }
  };

  const handleDeclineInvite = (invite: GroupJoinRequest) => {
    const res = DataStore.declineGroupInvite(invite.id);
    if (res.success) {
      showToast(`Declined invitation to join "${invite.groupName}".`);
      reloadData();
    }
  };

  // Team Join Approval Handlers (Members & Admins accepting students who requested to join)
  const handleAcceptRequest = (request: GroupJoinRequest) => {
    const res = DataStore.acceptGroupJoinRequest(request.id, currentUser.username);
    if (res.success) {
      showToast(`Accepted @${request.username} into ${request.groupName}! 🎉`);
      reloadData();
    }
  };

  const handleDeclineRequest = (request: GroupJoinRequest) => {
    const res = DataStore.declineGroupJoinRequest(request.id);
    if (res.success) {
      showToast(`Declined request from @${request.username}.`);
      reloadData();
    }
  };

  const handleRequestToJoinTeam = (groupId: string, groupName: string) => {
    DataStore.requestToJoinGroup(groupId, currentUser.username);
    showToast(`Join request submitted to ${groupName}! Group members must accept. ⏳`);
    reloadData();
  };

  const handleInviteFriendToSelectedGroup = (friendUsername: string) => {
    if (!selectedGroup) return;
    DataStore.sendGroupInvite(selectedGroup.id, friendUsername, currentUser.username);
    showToast(`Invitation sent to @${friendUsername}! They will join when they accept. 📬`);
    reloadData();
  };

  return (
    <div className="min-h-dvh pb-24 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-black/90 text-white text-xs font-semibold shadow-xl border border-white/20 backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* If viewing a single group hub */}
      {selectedGroup ? (
        <div className="space-y-4 max-w-[480px] mx-auto">
          {/* Top Bar with Apple Rounded Back Button */}
          <div
            className="flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] transition-colors"
              style={{ color: 'var(--text)' }}
              aria-label="Back to groups"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
              {selectedGroup.name} Hub
            </div>
            <div className="w-9" />
          </div>

          <div className="p-4 space-y-4">
            {/* Apple Squircle Header Card */}
            <div
              className="rounded-[22px] border overflow-hidden shadow-sm"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div
                className="h-24 w-full"
                style={{ backgroundColor: selectedGroup.color || 'var(--primary)' }}
              />
              <div className="p-4 -mt-10 space-y-3">
                <div className="flex items-end justify-between">
                  <div
                    className="w-16 h-16 rounded-[18px] flex items-center justify-center font-bold text-base text-white border-2 shadow-md"
                    style={{
                      backgroundColor: selectedGroup.color || 'var(--primary)',
                      borderColor: 'var(--surface)',
                    }}
                  >
                    {selectedGroup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full border shadow-xs"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {(Array.isArray(selectedGroup.members) ? selectedGroup.members.length : selectedGroup.members) || selectedGroup.memberCount || 1} Enrolled Members
                  </span>
                </div>

                <div>
                  <h2
                    className="text-lg font-bold tracking-[-0.02em] leading-[1.15]"
                    style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif", color: 'var(--text)' }}
                  >
                    {selectedGroup.name}
                  </h2>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {selectedGroup.description ||
                      'Official community for homework updates, project planning, and timetable announcements.'}
                  </p>
                </div>
              </div>
            </div>

            {/* iOS Pill Segmented Control */}
            <div
              className="p-1 rounded-full border flex gap-1"
              style={{
                backgroundColor: 'var(--surface-sunken)',
                borderColor: 'var(--line)',
              }}
            >
              {[
                { id: 'feed', label: 'Feed' },
                { id: 'chat', label: 'Chat' },
                { id: 'members', label: 'Members' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 py-1.5 rounded-full text-xs font-bold transition-all btn-press cursor-pointer"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Hub Tab Content */}
            <div
              className="p-5 rounded-[22px] border space-y-4 shadow-xs"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              {activeTab === 'feed' && (
                <div className="py-8 text-center space-y-1.5">
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    No posts shared yet in {selectedGroup.name}.
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Only verified members of {selectedGroup.name} can participate and post updates.
                  </p>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      Official Group Chat
                    </h3>
                    <p className="text-xs max-w-xs mx-auto mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Encrypted and real-time chat with fellow enrolled members of {selectedGroup.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/chats?conv=conv-${selectedGroup.id}`)}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
                  >
                    <MessageSquare size={14} />
                    <span>Open Group Chat</span>
                  </button>
                </div>
              )}

              {activeTab === 'members' && (() => {
                const rawMembers = DataStore.getGroupMembers(selectedGroup.id);
                const members = Array.from(
                  new Set(
                    (Array.isArray(rawMembers) ? rawMembers : [])
                      .map((m: any) => {
                        if (!m) return '';
                        if (typeof m === 'string') return m.toLowerCase().trim();
                        if (typeof m === 'object' && m.username) return String(m.username).toLowerCase().trim();
                        return String(m).toLowerCase().trim();
                      })
                      .filter(Boolean)
                  )
                );
                const pendingInvites = DataStore.getGroupPendingInvites(selectedGroup.id);

                return (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                          Enrolled Members
                        </h3>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {members.length} student{members.length !== 1 ? 's' : ''} enrolled
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddGroupFriendsOpen(true)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <UserPlus size={13} strokeWidth={2.5} />
                        <span>+ Add Friends</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {members.map((m) => {
                        const prof = DataStore.getProfileByUsername(m);
                        const effectiveAvatar = prof?.avatar || null;
                        const fullName = prof?.fullName || m;
                        const pair = getAvatarColorPair(m);
                        const isMe = m.toLowerCase() === currentUser.username.toLowerCase();
                        const isCreator = selectedGroup.members?.[0]?.toLowerCase() === m.toLowerCase();

                        return (
                          <div
                            key={m}
                            className="p-2.5 rounded-[16px] border flex items-center justify-between bg-[var(--surface-sunken)] border-[var(--line)]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                                style={{ backgroundColor: pair.bg, color: pair.text }}
                              >
                                {effectiveAvatar ? (
                                  <img src={effectiveAvatar} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                  fullName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--text)] truncate">
                                  {fullName} {isMe && <span className="text-[10px] text-[var(--primary)] font-semibold">(You)</span>}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] truncate">
                                  @{m} {prof?.class && `· Class ${prof.class}-${prof.section || 'A'}`}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[var(--text-muted)]">
                              {isCreator ? 'Admin' : 'Member'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {pendingInvites.length > 0 && (
                      <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          <span>Pending Invitations ({pendingInvites.length})</span>
                          <span className="text-[10px] text-amber-500 font-semibold lowercase">waiting to join</span>
                        </div>
                        <div className="space-y-1.5">
                          {pendingInvites.map((inv) => (
                            <div
                              key={inv.id}
                              className="p-2 rounded-[14px] border flex items-center justify-between bg-[var(--surface-sunken)]/60 border-[var(--line)]"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--text)] truncate">@{inv.username}</p>
                                <p className="text-[10px] text-[var(--text-muted)]">Invited by @{inv.invitedBy}</p>
                              </div>
                              <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                <Clock size={10} /> Pending
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Add Friends Modal for Selected Group */}
            {isAddGroupFriendsOpen && (() => {
              const members = DataStore.getGroupMembers(selectedGroup.id);
              const pendingInvites = DataStore.getGroupPendingInvites(selectedGroup.id);
              const memberSet = new Set(members.map((m: string) => m.toLowerCase().trim()));
              const pendingSet = new Set(pendingInvites.map((r) => r.username.toLowerCase().trim()));

              const candidates = liveFollowing.concat(
                DataStore.getProfiles()
                  .filter((p) => p.username.toLowerCase() !== currentUser.username.toLowerCase() && p.role === 'student')
                  .map((p) => ({
                    id: p.id || p.username,
                    name: p.fullName,
                    username: p.username,
                    studentClass: p.class ? `Class ${p.class}-${p.section || ''}` : 'DPS Student',
                    avatarUrl: p.avatar,
                  }))
              );
              // Deduplicate
              const seen = new Set<string>();
              const dedupedCandidates = candidates.filter((c) => {
                const u = c.username.toLowerCase();
                if (seen.has(u)) return false;
                seen.add(u);
                return true;
              });

              const filtered = dedupedCandidates.filter((cand) => {
                if (cand.username.toLowerCase() === currentUser.username.toLowerCase()) return false;
                if (!addFriendsSearchQuery.trim()) return true;
                const q = addFriendsSearchQuery.toLowerCase();
                return (
                  cand.name.toLowerCase().includes(q) ||
                  cand.username.toLowerCase().includes(q) ||
                  cand.studentClass.toLowerCase().includes(q)
                );
              });

              return (
                <div
                  className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
                  onClick={() => {
                    setIsAddGroupFriendsOpen(false);
                    setAddFriendsSearchQuery('');
                  }}
                >
                  <div
                    className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto sm:hidden" />

                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500">
                          <UserPlus size={18} />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text)]">Add Friends</h3>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Invite classmates to {selectedGroup.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddGroupFriendsOpen(false);
                          setAddFriendsSearchQuery('');
                        }}
                        className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search classmates by name or @username..."
                        value={addFriendsSearchQuery}
                        onChange={(e) => setAddFriendsSearchQuery(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-full text-xs outline-none border transition-colors focus:border-[var(--primary)]"
                        style={{
                          backgroundColor: 'var(--surface-sunken)',
                          borderColor: 'var(--line)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Invitations will be sent. When your classmate accepts (&ldquo;Yes, I want to join&rdquo;), they will be added automatically.
                    </p>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {filtered.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                          No classmates found matching &ldquo;{addFriendsSearchQuery}&rdquo;
                        </div>
                      ) : (
                        filtered.map((st) => {
                          const isMember = memberSet.has(st.username.toLowerCase());
                          const isInvited = pendingSet.has(st.username.toLowerCase());
                          const liveProf = DataStore.getProfileByUsername(st.username);
                          const effectiveAvatar = liveProf?.avatar || st.avatarUrl || null;
                          const pair = getAvatarColorPair(st.username);

                          return (
                            <div
                              key={st.username}
                              className="p-2.5 rounded-[18px] border flex items-center justify-between transition-colors bg-[var(--surface-sunken)] border-[var(--line)]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                                  style={{ backgroundColor: pair.bg, color: pair.text }}
                                >
                                  {effectiveAvatar ? (
                                    <img src={effectiveAvatar} alt={st.name} className="w-full h-full object-cover" />
                                  ) : (
                                    st.name.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text)] truncate">{st.name}</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                                    @{st.username} · {st.studentClass}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isMember ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                    ✓ Member
                                  </span>
                                ) : isInvited ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                                    <Clock size={11} /> Invited
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleInviteFriendToSelectedGroup(st.username)}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <Plus size={13} strokeWidth={2.5} />
                                    <span>Invite</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Groups Directory View */
        <div className="space-y-4">
          {/* Top Bar with Apple Rounded Corners */}
          <div
            className="flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20 backdrop-blur-md"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className="w-9 h-9 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] transition-colors"
                style={{ color: 'var(--text)' }}
                aria-label="Back to home"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1
                className="text-lg font-bold tracking-[-0.02em] leading-[1.15]"
                style={{
                  fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                  color: 'var(--text)',
                }}
              >
                School Groups & Teams
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold btn-press cursor-pointer flex items-center gap-1.5 transition-all bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 shadow-sm"
              title="Create a study group with classmates you follow"
            >
              <Users size={14} />
              <span>+ Create Group</span>
            </button>
          </div>

          <div className="p-4 max-w-[480px] mx-auto space-y-4">
            {/* ======================================================== */}
            {/* REQUIREMENT: GROUP INVITATIONS FOR CURRENT USER */}
            {/* "add when groups are created add a request from the account group was made ansdd a option yes i wnat to join thenn they must be joined no i diont wnat to jin then no join in the group" */}
            {/* ======================================================== */}
            {myInvites.length > 0 && (
              <section
                className="p-4 rounded-[22px] border space-y-3 shadow-md ring-2 ring-emerald-500/30"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Group Invitations for You 📬
                      </h2>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        You were invited to join these groups. Accept or decline below.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                    {myInvites.length} pending
                  </span>
                </div>

                <div className="space-y-2.5">
                  {myInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-[18px] border flex flex-col gap-3 transition-all"
                      style={{
                        backgroundColor: 'var(--surface-sunken)',
                        borderColor: 'var(--line)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          {inv.groupName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                            {inv.groupName}
                          </h3>
                          <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            Invited by <span className="font-bold text-[var(--primary)]">@{inv.invitedBy || 'Creator'}</span>
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {inv.requestedAt}
                          </span>
                        </div>
                      </div>

                      {/* Explicit Consent Buttons: "Yes, I want to join" and "No, I don't want to join" */}
                      <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(inv)}
                          className="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all btn-press cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                          <Check size={14} />
                          <span>Yes, I want to join</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineInvite(inv)}
                          className="py-2 px-3 rounded-full text-xs font-semibold transition-all btn-press cursor-pointer flex items-center justify-center gap-1.5 border border-red-500/30 hover:bg-red-500/10 text-red-500"
                          style={{ backgroundColor: 'var(--surface)' }}
                        >
                          <X size={14} />
                          <span>No, I don&apos;t want to join</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ======================================================== */}
            {/* REQUIREMENT: MEMBER JOIN REQUESTS (WAITING FOR APPROVAL) */}
            {/* "if the other person wanted to join a group but request was not sent can give a request to all members or admin if they accept they can get init" */}
            {/* ======================================================== */}
            <section
              className="p-4 rounded-[22px] border space-y-3 shadow-sm"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <UserPlus size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      Pending Member Join Requests 👥
                    </h2>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Students requesting to join • Can be accepted by any member or admin
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                  {joinRequests.length} pending
                </span>
              </div>

              {joinRequests.length === 0 ? (
                <div
                  className="p-4 rounded-[16px] text-center text-xs border"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text-muted)',
                  }}
                >
                  No pending member join requests at the moment. When classmates request to join a group you are in, their request appears here to approve.
                </div>
              ) : (
                <div className="space-y-2">
                  {joinRequests.map((req) => {
                    const colors = getAvatarColorPair(req.username);
                    return (
                      <div
                        key={req.id}
                        className="p-3 rounded-[18px] border flex flex-col gap-2.5 transition-all hover:border-[var(--primary)]"
                        style={{
                          backgroundColor: 'var(--surface-sunken)',
                          borderColor: 'var(--line)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {(req.avatar || DataStore.getProfileByUsername(req.username)?.avatar) ? (
                              <img
                                src={req.avatar || DataStore.getProfileByUsername(req.username)?.avatar || ''}
                                alt={req.fullName}
                                className="w-9 h-9 rounded-full object-cover shrink-0 border"
                                style={{ borderColor: 'var(--line)' }}
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                }}
                              >
                                {req.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                                  {req.fullName}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  @{req.username}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                                {req.studentClass} • Wants to join <span className="font-bold text-[var(--primary)]">{req.groupName}</span>
                              </p>
                              <span className="text-[10px] flex items-center gap-1 text-[var(--text-muted)] mt-0.5">
                                <Clock size={11} />
                                {req.requestedAt}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Accept Member / Decline */}
                        <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--line)' }}>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(req)}
                            className="flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all btn-press cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                          >
                            <Check size={14} />
                            <span>Accept Member ✓</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineRequest(req)}
                            className="py-1.5 px-3 rounded-full text-xs font-semibold transition-all btn-press cursor-pointer flex items-center justify-center gap-1 border hover:bg-red-500/10 text-red-500"
                            style={{
                              borderColor: 'var(--line)',
                              backgroundColor: 'var(--surface)',
                            }}
                          >
                            <X size={14} />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Create Custom Group Banner with Apple Rounded Corners */}
            <div
              className="p-4 border rounded-[22px] flex items-center justify-between shadow-sm"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  Create Study & Project Group 🐝
                </h2>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Start a group with classmates you are following.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold btn-press shrink-0 cursor-pointer hover:opacity-90 flex items-center gap-1.5 shadow-sm"
              >
                <Users size={14} />
                <span>+ Create</span>
              </button>
            </div>

            {/* ======================================================== */}
            {/* GROUPS LIST */}
            {/* ======================================================== */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Groups ({groups.length})
                </h2>
              </div>

              {groups.length === 0 ? (
                <div
                  className="p-8 rounded-[22px] border text-center space-y-3"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                  }}
                >
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] text-xl">
                    👥
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    No Groups Created Yet
                  </h3>
                  <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                    Start a study squad, house group, or project club with classmates you follow!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Users size={14} />
                    <span>+ Create First Group</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {groups.map((group) => {
                    const isMember = DataStore.isGroupMember(group.id, currentUser.username);
                    const pendingInvite = myInvites.find((inv) => inv.groupId === group.id);
                    const hasRequested = DataStore.hasRequestedToJoinGroup(group.id, currentUser.username);
                    const memberCount = (Array.isArray(group.members) ? group.members.length : 0) || group.memberCount || 1;
                    const initials = group.name.slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={group.id}
                        className="p-3.5 rounded-[20px] border shadow-xs space-y-2.5 transition-all"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--line)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-[16px] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: 'var(--primary)' }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                                  {group.name}
                                </h3>
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                                  style={{
                                    backgroundColor: 'var(--surface-sunken)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--line)',
                                  }}
                                >
                                  {group.category || 'Group'}
                                </span>
                              </div>
                              {group.description && !group.description.startsWith('Student study group created by') && (
                                <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {group.description}
                                </p>
                              )}
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {memberCount} member{memberCount === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action status */}
                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedGroup(group)}
                            className="text-[11px] font-semibold text-[var(--primary)] hover:underline btn-press cursor-pointer"
                          >
                            View Group Hub →
                          </button>

                          {isMember ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                              <Check size={13} />
                              <span>Member ✓</span>
                            </span>
                          ) : pendingInvite ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                              <Clock size={13} />
                              <span>Invited 📬</span>
                            </span>
                          ) : hasRequested ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                              <Clock size={13} />
                              <span>Requested ⏳</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestToJoinTeam(group.id, group.name)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--on-primary)] btn-press cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center gap-1"
                            >
                              <UserPlus size={13} />
                              <span>Request to Join</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Create Group Modal with Apple Rounded Corners */}
      {isCreateGroupOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Create new group"
        >
          <div
            className="w-full max-w-md rounded-[26px] border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div>
                <h3 className="text-base font-extrabold" style={{ color: 'var(--text)' }}>
                  Create New Group
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Add classmates you are following
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateGroupOpen(false);
                  setNewGroupName('');
                  setSelectedGroupMembers([]);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Group Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Science Project Warriors 🔬"
                  className="w-full h-11 px-3.5 rounded-[14px] text-xs border outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {/* Add All Students Button with Apple Pill */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSelectAllFollowing}
                  className="w-full py-2.5 px-3 rounded-full text-xs font-bold border btn-press cursor-pointer flex items-center justify-center gap-2 transition-all shadow-xs"
                  style={{
                    backgroundColor:
                      selectedGroupMembers.length === liveFollowing.length && liveFollowing.length > 0
                        ? 'var(--primary)'
                        : 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color:
                      selectedGroupMembers.length === liveFollowing.length && liveFollowing.length > 0
                        ? 'var(--on-primary)'
                        : 'var(--text)',
                  }}
                >
                  <Users size={16} />
                  <span>
                    {selectedGroupMembers.length === liveFollowing.length && liveFollowing.length > 0
                      ? `Deselect All Following (${liveFollowing.length})`
                      : `Add All Students I Follow (${liveFollowing.length}) 🐝`}
                  </span>
                </button>
              </div>

              {/* Following Students List */}
              <div className="space-y-1">
                <div
                  className="flex items-center justify-between text-xs font-semibold pb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>Following Students</span>
                  <span>{selectedGroupMembers.length} selected</span>
                </div>

                {liveFollowing.length === 0 ? (
                  <div
                    className="p-4 text-center rounded-[16px] border text-xs"
                    style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}
                  >
                    You are not following any students yet. Follow classmates from Search or Star Board to add them to groups.
                  </div>
                ) : (
                  <div
                    className="divide-y border rounded-[18px] max-h-56 overflow-y-auto"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    {liveFollowing.map((student) => {
                      const isSelected = selectedGroupMembers.includes(student.username);
                      const colors = getAvatarColorPair(student.username);
                      return (
                        <div
                          key={student.id}
                          onClick={() => handleToggleGroupMember(student.username)}
                          className="p-2.5 flex items-center gap-3 hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleGroupMember(student.username)}
                            className="rounded accent-[var(--primary)] cursor-pointer w-4 h-4"
                            aria-label={`Select ${student.name}`}
                          />
                          {(student.avatarUrl || (student as any).avatar || DataStore.getProfileByUsername(student.username)?.avatar) ? (
                            <img
                              src={student.avatarUrl || (student as any).avatar || DataStore.getProfileByUsername(student.username)?.avatar || ''}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                              }}
                            >
                              {student.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                              {student.name}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                              @{student.username} • {student.studentClass}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Apple Rounded Buttons */}
            <div
              className="p-4 border-t flex items-center justify-end gap-2.5 shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsCreateGroupOpen(false);
                  setNewGroupName('');
                  setSelectedGroupMembers([]);
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold border btn-press cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroupSubmit}
                disabled={selectedGroupMembers.length === 0}
                className="px-5 py-2 rounded-full text-xs font-bold btn-press cursor-pointer transition-all disabled:opacity-50 shadow-sm"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
              >
                Create Group ({selectedGroupMembers.length}) ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

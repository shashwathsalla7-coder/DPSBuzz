'use client';

import React, { useState } from 'react';
import { X, Search, Users, UserPlus, ArrowLeft } from 'lucide-react';
import { ContactItem } from './types';
import { DEMO_CONTACTS } from './constants';

interface NewChatModalProps {
  onClose: () => void;
  onSelectContact: (contact: ContactItem) => void;
  onCreateNewGroup: (groupName: string, selectedMembers: ContactItem[]) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onSelectContact,
  onCreateNewGroup,
}) => {
  const [search, setSearch] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<ContactItem[]>([]);
  const [groupSubject, setGroupSubject] = useState('');

  const filtered = DEMO_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const toggleSelect = (contact: ContactItem) => {
    if (selectedContacts.some((c) => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter((c) => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleFinishGroup = () => {
    if (!groupSubject.trim() || selectedContacts.length === 0) return;
    onCreateNewGroup(groupSubject.trim(), selectedContacts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md h-[560px] bg-[#111b21] rounded-2xl border border-[#222d34] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
          <div className="flex items-center gap-3">
            {isGroupMode ? (
              <button
                onClick={() => setIsGroupMode(false)}
                className="p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
              >
                <ArrowLeft size={19} />
              </button>
            ) : null}
            <h2 className="text-base font-semibold text-[#e9edef]">
              {isGroupMode ? 'New group' : 'New chat'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
          >
            <X size={19} />
          </button>
        </div>

        {/* Group Creation Subject Input (When in Group Mode) */}
        {isGroupMode && (
          <div className="p-4 bg-[#182229] border-b border-[#222d34] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Users size={20} />
            </div>
            <input
              type="text"
              placeholder="Group subject (e.g. Class 8 Physics Club)"
              value={groupSubject}
              onChange={(e) => setGroupSubject(e.target.value)}
              className="w-full text-sm text-[#e9edef] bg-transparent outline-none placeholder-[#8696a0]"
              autoFocus
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 border-b border-[#222d34] bg-[#111b21]">
          <div className="flex items-center px-3 py-1.5 rounded-lg bg-[#202c33]">
            <Search size={15} className="text-[#8696a0] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search name or number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs text-[#e9edef] bg-transparent outline-none placeholder-[#8696a0]"
            />
          </div>
        </div>

        {/* Action rows when not in group mode */}
        {!isGroupMode && (
          <div className="border-b border-[#222d34]/60 bg-[#111b21]">
            <button
              onClick={() => setIsGroupMode(true)}
              className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-[#202c33] transition-colors text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center font-bold shrink-0">
                <Users size={18} />
              </div>
              <div className="text-sm font-medium text-[#e9edef]">New group</div>
            </button>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#00a884]">
            Contacts on DPS Buzz
          </div>

          {filtered.map((contact) => {
            const isSelected = selectedContacts.some((c) => c.id === contact.id);

            return (
              <div
                key={contact.id}
                onClick={() => {
                  if (isGroupMode) {
                    toggleSelect(contact);
                  } else {
                    onSelectContact(contact);
                    onClose();
                  }
                }}
                className={`px-4 py-2.5 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#2a3942]' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                    style={{ backgroundColor: contact.avatarColor }}
                  >
                    {contact.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#e9edef] truncate">
                      {contact.name}
                    </div>
                    <div className="text-xs text-[#8696a0] truncate mt-0.5">
                      {contact.about || contact.phone}
                    </div>
                  </div>
                </div>

                {isGroupMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-[#00a884] w-4 h-4 cursor-pointer"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer for group mode */}
        {isGroupMode && (
          <div className="p-3 bg-[#202c33] border-t border-[#222d34] flex items-center justify-between">
            <span className="text-xs text-[#8696a0]">
              {selectedContacts.length} contacts selected
            </span>
            <button
              onClick={handleFinishGroup}
              disabled={!groupSubject.trim() || selectedContacts.length === 0}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00a884] text-[#111b21] hover:bg-[#008f6f] disabled:opacity-50 transition-all cursor-pointer"
            >
              Create Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

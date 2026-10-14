'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Smile, ThumbsUp, Heart, Trophy, GraduationCap, Coffee, Sparkles } from 'lucide-react';

interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: EmojiItem[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys & Mood',
    icon: '😀',
    emojis: [
      { emoji: '😀', name: 'Grinning Face', keywords: ['smile', 'happy', 'grin'] },
      { emoji: '😃', name: 'Smiley', keywords: ['smile', 'happy', 'joy'] },
      { emoji: '😄', name: 'Smile with eyes', keywords: ['happy', 'laugh'] },
      { emoji: '😁', name: 'Beaming', keywords: ['grin', 'smile'] },
      { emoji: '😆', name: 'Laughing', keywords: ['laugh', 'lol', 'haha'] },
      { emoji: '😅', name: 'Sweat smile', keywords: ['nervous', 'relief'] },
      { emoji: '🤣', name: 'ROFL', keywords: ['lol', 'laugh', 'rofl', 'funny'] },
      { emoji: '😂', name: 'Tears of joy', keywords: ['crying', 'laugh', 'lol', 'haha'] },
      { emoji: '🥹', name: 'Holding back tears', keywords: ['grateful', 'cry', 'proud'] },
      { emoji: '🙂', name: 'Slight smile', keywords: ['okay', 'smile'] },
      { emoji: '🙃', name: 'Upside down', keywords: ['sarcasm', 'silly'] },
      { emoji: '😉', name: 'Wink', keywords: ['flirt', 'wink'] },
      { emoji: '😊', name: 'Blush smile', keywords: ['sweet', 'happy', 'blush'] },
      { emoji: '😇', name: 'Halo innocent', keywords: ['angel', 'good'] },
      { emoji: '🥰', name: 'Love hearts', keywords: ['love', 'crush', 'cute'] },
      { emoji: '😍', name: 'Heart eyes', keywords: ['love', 'crush', 'adoring'] },
      { emoji: '🤩', name: 'Star eyes', keywords: ['wow', 'amazing', 'excited'] },
      { emoji: '😘', name: 'Blow kiss', keywords: ['kiss', 'love'] },
      { emoji: '😋', name: 'Yummy', keywords: ['tasty', 'food', 'tongue'] },
      { emoji: '😛', name: 'Tongue out', keywords: ['playful', 'silly'] },
      { emoji: '😜', name: 'Wink tongue', keywords: ['crazy', 'joke'] },
      { emoji: '🤪', name: 'Goofy', keywords: ['wild', 'funny', 'crazy'] },
      { emoji: '😝', name: 'Squint tongue', keywords: ['playful', 'lol'] },
      { emoji: '🤑', name: 'Money mouth', keywords: ['rich', 'cash', 'money'] },
      { emoji: '🤗', name: 'Hug face', keywords: ['hug', 'warm', 'friendly'] },
      { emoji: '🤭', name: 'Giggle hand', keywords: ['oops', 'secret', 'teehee'] },
      { emoji: '🤫', name: 'Quiet shh', keywords: ['silent', 'secret', 'shh'] },
      { emoji: '🤔', name: 'Thinking', keywords: ['wonder', 'doubt', 'hmm'] },
      { emoji: '🤐', name: 'Zipper mouth', keywords: ['secret', 'quiet'] },
      { emoji: '🤨', name: 'Raised eyebrow', keywords: ['suspicious', 'skeptical'] },
      { emoji: '😐', name: 'Neutral', keywords: ['meh', 'straight face'] },
      { emoji: '😑', name: 'Expressionless', keywords: ['annoyed', 'blank'] },
      { emoji: '😶', name: 'No mouth', keywords: ['speechless', 'silent'] },
      { emoji: '😏', name: 'Smirk', keywords: ['clever', 'smug'] },
      { emoji: '😒', name: 'Unamused', keywords: ['bored', 'annoyed'] },
      { emoji: '🙄', name: 'Eye roll', keywords: ['sarcastic', 'whatever'] },
      { emoji: '😬', name: 'Grimace', keywords: ['awkward', 'oops', 'yikes'] },
      { emoji: '🤥', name: 'Lying nose', keywords: ['pinocchio', 'lie'] },
      { emoji: '😌', name: 'Relieved', keywords: ['peaceful', 'calm'] },
      { emoji: '😔', name: 'Pensive sad', keywords: ['down', 'regret'] },
      { emoji: '😪', name: 'Sleepy tear', keywords: ['tired', 'sleep'] },
      { emoji: '🤤', name: 'Drooling', keywords: ['hungry', 'craving'] },
      { emoji: '😴', name: 'Sleeping', keywords: ['tired', 'goodnight', 'zzz'] },
      { emoji: '😷', name: 'Face mask', keywords: ['sick', 'ill'] },
      { emoji: '🤒', name: 'Thermometer', keywords: ['fever', 'sick'] },
      { emoji: '🤕', name: 'Bandage head', keywords: ['hurt', 'injury'] },
      { emoji: '🤢', name: 'Nauseated', keywords: ['gross', 'sick'] },
      { emoji: '🤮', name: 'Vomiting', keywords: ['disgust', 'sick'] },
      { emoji: '🥵', name: 'Hot sweating', keywords: ['heat', 'summer'] },
      { emoji: '🥶', name: 'Freezing cold', keywords: ['ice', 'winter'] },
      { emoji: '🥴', name: 'Woozy dizzy', keywords: ['confused', 'tipsy'] },
      { emoji: '😵', name: 'Dizzy dead', keywords: ['exhausted', 'faint'] },
      { emoji: '🤯', name: 'Mind blown', keywords: ['shock', 'crazy', 'insane'] },
      { emoji: '🥳', name: 'Party popper', keywords: ['celebrate', 'birthday', 'yay'] },
      { emoji: '😎', name: 'Sunglasses cool', keywords: ['cool', 'boss', 'swag'] },
      { emoji: '🤓', name: 'Nerd glasses', keywords: ['study', 'smart', 'geek'] },
      { emoji: '🧐', name: 'Monocle', keywords: ['inspect', 'curious'] },
      { emoji: '😕', name: 'Confused', keywords: ['puzzled', 'what'] },
      { emoji: '😟', name: 'Worried', keywords: ['nervous', 'scared'] },
      { emoji: '😮', name: 'Open mouth', keywords: ['surprised', 'whoa'] },
      { emoji: '😲', name: 'Astonished', keywords: ['shocked', 'omg'] },
      { emoji: '😳', name: 'Flushed red', keywords: ['embarrassed', 'shy'] },
      { emoji: '🥺', name: 'Pleading puppy', keywords: ['please', 'puppy eyes', 'beg'] },
      { emoji: '😦', name: 'Frowning open', keywords: ['scared', 'shocked'] },
      { emoji: '😨', name: 'Fearful', keywords: ['afraid', 'terrified'] },
      { emoji: '😰', name: 'Anxious sweat', keywords: ['panic', 'nervous'] },
      { emoji: '😥', name: 'Sad relief', keywords: ['close call', 'whew'] },
      { emoji: '😢', name: 'Crying tear', keywords: ['sad', 'tears'] },
      { emoji: '😭', name: 'Loud crying', keywords: ['bawling', 'sob', 'sad', 'crying'] },
      { emoji: '😱', name: 'Screaming fear', keywords: ['horror', 'scared', 'shock'] },
      { emoji: '😖', name: 'Confounded', keywords: ['distressed', 'frustrated'] },
      { emoji: '😣', name: 'Persevering', keywords: ['struggling', 'pain'] },
      { emoji: '😞', name: 'Disappointed', keywords: ['sad', 'defeated'] },
      { emoji: '😓', name: 'Cold sweat', keywords: ['down', 'tired'] },
      { emoji: '😩', name: 'Weary tired', keywords: ['exhausted', 'whining'] },
      { emoji: '😫', name: 'Tired frustrated', keywords: ['done', 'over it'] },
      { emoji: '🥱', name: 'Yawning', keywords: ['sleepy', 'bored'] },
      { emoji: '😤', name: 'Triumph huff', keywords: ['determined', 'angry'] },
      { emoji: '😡', name: 'Pouting red', keywords: ['mad', 'rage'] },
      { emoji: '😠', name: 'Angry', keywords: ['mad', 'furious'] },
      { emoji: '🤬', name: 'Cursing swear', keywords: ['censored', 'rage'] },
      { emoji: '😈', name: 'Smiling devil', keywords: ['evil', 'naughty'] },
      { emoji: '👿', name: 'Angry devil', keywords: ['demon', 'furious'] },
      { emoji: '💀', name: 'Skull dead', keywords: ['dead', 'dying', 'lol'] },
      { emoji: '👻', name: 'Ghost', keywords: ['spooky', 'halloween'] },
      { emoji: '👽', name: 'Alien', keywords: ['ufo', 'space'] },
      { emoji: '🤖', name: 'Robot', keywords: ['bot', 'ai', 'tech'] },
      { emoji: '💩', name: 'Poop smiling', keywords: ['poo', 'funny'] },
    ],
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: '👋',
    emojis: [
      { emoji: '👋', name: 'Waving hand', keywords: ['hello', 'hi', 'bye'] },
      { emoji: '🤚', name: 'Raised back hand', keywords: ['stop', 'high five'] },
      { emoji: '✋', name: 'Raised hand', keywords: ['stop', 'volunteer', 'question'] },
      { emoji: '🖖', name: 'Vulcan salute', keywords: ['spock', 'star trek'] },
      { emoji: '👌', name: 'OK hand', keywords: ['okay', 'perfect', 'fine'] },
      { emoji: '🤌', name: 'Pinched fingers', keywords: ['italian', 'what do you mean'] },
      { emoji: '🤏', name: 'Pinching hand', keywords: ['tiny', 'little bit'] },
      { emoji: '✌️', name: 'Peace victory', keywords: ['peace', 'two', 'v'] },
      { emoji: '🤞', name: 'Fingers crossed', keywords: ['luck', 'hope'] },
      { emoji: '🫰', name: 'Finger heart', keywords: ['kpop', 'love'] },
      { emoji: '🤟', name: 'Love you gesture', keywords: ['rock', 'love'] },
      { emoji: '🤘', name: 'Rock on horns', keywords: ['metal', 'cool'] },
      { emoji: '🤙', name: 'Call me shaka', keywords: ['chill', 'phone'] },
      { emoji: '👈', name: 'Point left', keywords: ['direction', 'look'] },
      { emoji: '👉', name: 'Point right', keywords: ['direction', 'look'] },
      { emoji: '👆', name: 'Point up', keywords: ['this', 'above'] },
      { emoji: '👇', name: 'Point down', keywords: ['below', 'look'] },
      { emoji: '☝️', name: 'Index up', keywords: ['one', 'first', 'question'] },
      { emoji: '👍', name: 'Thumbs up', keywords: ['yes', 'agree', 'cool', 'like'] },
      { emoji: '👎', name: 'Thumbs down', keywords: ['no', 'dislike', 'bad'] },
      { emoji: '✊', name: 'Raised fist', keywords: ['power', 'solidarity'] },
      { emoji: '👊', name: 'Oncoming fist', keywords: ['fist bump', 'punch'] },
      { emoji: '🤛', name: 'Left fist bump', keywords: ['fist bump', 'bro'] },
      { emoji: '🤜', name: 'Right fist bump', keywords: ['fist bump', 'bro'] },
      { emoji: '👏', name: 'Clapping hands', keywords: ['applause', 'bravo', 'congrats'] },
      { emoji: '🙌', name: 'Raised hands', keywords: ['hooray', 'celebrate', 'praise'] },
      { emoji: '🫶', name: 'Heart hands', keywords: ['love', 'friendship', 'kind'] },
      { emoji: '👐', name: 'Open hands', keywords: ['hug', 'open'] },
      { emoji: '🤲', name: 'Palms together', keywords: ['prayer', 'ask'] },
      { emoji: '🤝', name: 'Handshake', keywords: ['deal', 'agreement', 'partner'] },
      { emoji: '🙏', name: 'Folded hands', keywords: ['pray', 'please', 'thanks', 'namaste'] },
      { emoji: '✍️', name: 'Writing hand', keywords: ['write', 'homework', 'notes'] },
      { emoji: '💪', name: 'Flexed bicep', keywords: ['strong', 'gym', 'workout', 'power'] },
      { emoji: '👀', name: 'Eyes looking', keywords: ['see', 'look', 'drama'] },
      { emoji: '👁️', name: 'Single eye', keywords: ['watch', 'look'] },
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Fire',
    icon: '❤️',
    emojis: [
      { emoji: '❤️', name: 'Red heart', keywords: ['love', 'like', 'red'] },
      { emoji: '🧡', name: 'Orange heart', keywords: ['love', 'orange'] },
      { emoji: '💛', name: 'Yellow heart', keywords: ['friendship', 'warm'] },
      { emoji: '💚', name: 'Green heart', keywords: ['nature', 'love'] },
      { emoji: '💙', name: 'Blue heart', keywords: ['trust', 'peace'] },
      { emoji: '💜', name: 'Purple heart', keywords: ['royal', 'bts'] },
      { emoji: '🤎', name: 'Brown heart', keywords: ['earth', 'love'] },
      { emoji: '🖤', name: 'Black heart', keywords: ['dark', 'goth'] },
      { emoji: '🤍', name: 'White heart', keywords: ['pure', 'peace'] },
      { emoji: '💔', name: 'Broken heart', keywords: ['sad', 'heartbreak'] },
      { emoji: '❤️‍🔥', name: 'Heart on fire', keywords: ['passion', 'hot', 'love'] },
      { emoji: '❣️', name: 'Heart exclamation', keywords: ['emphasis', 'love'] },
      { emoji: '💕', name: 'Two hearts', keywords: ['love', 'cute'] },
      { emoji: '💞', name: 'Revolving hearts', keywords: ['crush', 'love'] },
      { emoji: '💓', name: 'Beating heart', keywords: ['heartbeat', 'alive'] },
      { emoji: '💗', name: 'Growing heart', keywords: ['sparkle', 'love'] },
      { emoji: '💖', name: 'Sparkling heart', keywords: ['shine', 'glitter'] },
      { emoji: '💘', name: 'Heart with arrow', keywords: ['cupid', 'crush'] },
      { emoji: '💝', name: 'Heart ribbon', keywords: ['gift', 'present'] },
      { emoji: '🔥', name: 'Fire flame', keywords: ['lit', 'hot', 'insane', 'fire'] },
      { emoji: '✨', name: 'Sparkles', keywords: ['magic', 'clean', 'shine', 'aesthetic'] },
      { emoji: '🌟', name: 'Glowing star', keywords: ['star', 'bright'] },
      { emoji: '⭐', name: 'Star', keywords: ['favorite', 'top'] },
      { emoji: '💯', name: 'Hundred points', keywords: ['100', 'perfect', 'facts'] },
      { emoji: '⚡', name: 'Lightning bolt', keywords: ['electric', 'fast', 'shock'] },
      { emoji: '💥', name: 'Collision boom', keywords: ['explosion', 'bang'] },
      { emoji: '🎉', name: 'Party popper', keywords: ['celebration', 'party', 'congrats'] },
      { emoji: '🎊', name: 'Confetti ball', keywords: ['celebrate', 'fun'] },
    ],
  },
  {
    id: 'school',
    name: 'School & Studies',
    icon: '📚',
    emojis: [
      { emoji: '🐝', name: 'DPS Honeybee', keywords: ['bee', 'dpsbuzz', 'mascot', 'school'] },
      { emoji: '📚', name: 'Books stack', keywords: ['study', 'reading', 'homework', 'library'] },
      { emoji: '📖', name: 'Open book', keywords: ['read', 'novel', 'textbook'] },
      { emoji: '📕', name: 'Closed book', keywords: ['book', 'binder'] },
      { emoji: '📝', name: 'Memo pad', keywords: ['notes', 'exam', 'test', 'write'] },
      { emoji: '✏️', name: 'Pencil', keywords: ['draw', 'write', 'sketch'] },
      { emoji: '✒️', name: 'Black nib pen', keywords: ['ink', 'fountain pen'] },
      { emoji: '🖋️', name: 'Fountain pen', keywords: ['exam pen', 'signature'] },
      { emoji: '🖊️', name: 'Ballpoint pen', keywords: ['blue pen', 'notes'] },
      { emoji: '🖍️', name: 'Crayon', keywords: ['art', 'color'] },
      { emoji: '📐', name: 'Triangular ruler', keywords: ['geometry', 'math', 'drawing'] },
      { emoji: '📏', name: 'Straight ruler', keywords: ['measure', 'math'] },
      { emoji: '🔬', name: 'Microscope', keywords: ['science', 'biology', 'lab'] },
      { emoji: '🧪', name: 'Test tube', keywords: ['chemistry', 'experiment', 'lab'] },
      { emoji: '🧫', name: 'Petri dish', keywords: ['biology', 'cells'] },
      { emoji: '🧬', name: 'DNA strand', keywords: ['genetics', 'science'] },
      { emoji: '🔭', name: 'Telescope', keywords: ['astronomy', 'stars', 'space'] },
      { emoji: '📡', name: 'Satellite antenna', keywords: ['signal', 'tech'] },
      { emoji: '💻', name: 'Laptop', keywords: ['computer', 'code', 'typing'] },
      { emoji: '🎒', name: 'School backpack', keywords: ['bag', 'school', 'supplies'] },
      { emoji: '🎓', name: 'Graduation cap', keywords: ['graduate', 'degree', 'topper'] },
      { emoji: '🏆', name: 'Trophy cup', keywords: ['winner', 'first place', 'champion'] },
      { emoji: '🥇', name: '1st place medal', keywords: ['gold', 'winner'] },
      { emoji: '🥈', name: '2nd place medal', keywords: ['silver'] },
      { emoji: '🥉', name: '3rd place medal', keywords: ['bronze'] },
      { emoji: '🏅', name: 'Sports medal', keywords: ['honor', 'prize'] },
      { emoji: '🎨', name: 'Artist palette', keywords: ['paint', 'art club', 'drawing'] },
      { emoji: '🎭', name: 'Performing arts', keywords: ['drama', 'acting', 'theatre'] },
      { emoji: '🎤', name: 'Microphone', keywords: ['sing', 'speech', 'assembly'] },
      { emoji: '🎸', name: 'Guitar', keywords: ['music', 'band'] },
      { emoji: '🎹', name: 'Musical keyboard', keywords: ['piano', 'notes'] },
      { emoji: '🥁', name: 'Drum kit', keywords: ['band', 'music'] },
      { emoji: '🔔', name: 'School bell', keywords: ['period bell', 'recess'] },
      { emoji: '📢', name: 'Loudspeaker', keywords: ['announcement', 'notice'] },
    ],
  },
  {
    id: 'sports',
    name: 'Sports & Games',
    icon: '🏏',
    emojis: [
      { emoji: '🏏', name: 'Cricket bat & ball', keywords: ['cricket', 'match', 'ipl', 'sports'] },
      { emoji: '⚽', name: 'Soccer football', keywords: ['football', 'goal', 'kick'] },
      { emoji: '🏀', name: 'Basketball', keywords: ['hoops', 'court', 'dunk'] },
      { emoji: '🏸', name: 'Badminton shuttlecock', keywords: ['badminton', 'racket'] },
      { emoji: '🎾', name: 'Tennis ball', keywords: ['tennis', 'match'] },
      { emoji: '🏐', name: 'Volleyball', keywords: ['volleyball', 'serve'] },
      { emoji: '🏓', name: 'Table tennis', keywords: ['ping pong', 'tt'] },
      { emoji: '♟️', name: 'Chess pawn', keywords: ['chess', 'board game', 'checkmate'] },
      { emoji: '🏃‍♂️', name: 'Runner boy', keywords: ['race', 'athletics', 'fast'] },
      { emoji: '🏃‍♀️', name: 'Runner girl', keywords: ['sports day', 'sprint'] },
      { emoji: '🏊‍♂️', name: 'Swimmer', keywords: ['swimming pool', 'freestyle'] },
      { emoji: '🚴‍♂️', name: 'Cyclist', keywords: ['bicycle', 'cycling'] },
      { emoji: '🎯', name: 'Bullseye target', keywords: ['archery', 'darts', 'goal'] },
      { emoji: '🎲', name: 'Game die', keywords: ['board game', 'chance'] },
      { emoji: '🎮', name: 'Video game controller', keywords: ['gaming', 'play'] },
      { emoji: '🛹', name: 'Skateboard', keywords: ['skate', 'trick'] },
    ],
  },
  {
    id: 'food',
    name: 'Canteen & Food',
    icon: '🥪',
    emojis: [
      { emoji: '🥪', name: 'Sandwich', keywords: ['canteen', 'lunch', 'recess'] },
      { emoji: '🍕', name: 'Pizza slice', keywords: ['cheese', 'party'] },
      { emoji: '🍔', name: 'Burger', keywords: ['fast food', 'treat'] },
      { emoji: '🍟', name: 'French fries', keywords: ['chips', 'snack'] },
      { emoji: '🍜', name: 'Noodles ramen', keywords: ['maggi', 'canteen', 'hot'] },
      { emoji: ' samosa', name: 'Pastry snack', keywords: ['samosa', 'chaat'] },
      { emoji: '🧃', name: 'Juice box', keywords: ['drink', 'fruit'] },
      { emoji: '🥤', name: 'Cup with straw', keywords: ['cold drink', 'soda'] },
      { emoji: '🍫', name: 'Chocolate bar', keywords: ['sweet', 'candy'] },
      { emoji: '🍿', name: 'Popcorn', keywords: ['movie', 'snack'] },
      { emoji: '🍦', name: 'Ice cream cone', keywords: ['dessert', 'cool'] },
      { emoji: '🍩', name: 'Doughnut', keywords: ['sweet', 'treat'] },
      { emoji: '🍪', name: 'Cookie', keywords: ['biscuit', 'snack'] },
      { emoji: '🍎', name: 'Red apple', keywords: ['fruit', 'healthy'] },
      { emoji: '🍌', name: 'Banana', keywords: ['fruit', 'potassium'] },
      { emoji: '🥭', name: 'Mango', keywords: ['king of fruits', 'sweet'] },
      { emoji: '🍉', name: 'Watermelon', keywords: ['summer', 'slice'] },
      { emoji: '🍇', name: 'Grapes', keywords: ['fruit', 'snack'] },
    ],
  },
];

interface EmojiPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPickerDrawer: React.FC<EmojiPickerDrawerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [activeTab, setActiveTab] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const all: EmojiItem[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (
          item.name.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        ) {
          all.push(item);
        }
      }
    }
    return all;
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];
  const displayEmojis = searchResults !== null ? searchResults : currentCategory.emojis;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Emoji Picker"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-[500px] h-[55dvh] max-h-[460px] flex flex-col border-t shadow-2xl animate-fade-in rounded-none"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        {/* Header with Search and Close */}
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
          <div
            className="flex-1 h-10 px-3 border flex items-center gap-2 rounded-none"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search all emojis (e.g. fire, laugh, cricket, book)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs"
              style={{ color: 'var(--text)' }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 hover:text-[var(--text)] text-[var(--text-muted)] cursor-pointer"
                aria-label="Clear emoji search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer rounded-none transition-colors shrink-0"
            aria-label="Close emoji picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs (when not searching) */}
        {!searchQuery.trim() && (
          <div
            className="px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar border-b shrink-0"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
            }}
          >
            {EMOJI_CATEGORIES.map((cat) => {
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className="px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 shrink-0 rounded-none cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    border: isActive ? '1px solid var(--line)' : '1px solid transparent',
                  }}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-[11px]">{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Emojis Grid View */}
        <div className="flex-1 p-3 overflow-y-auto">
          {displayEmojis.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-[var(--text-muted)] gap-1">
              <span>No emojis match "{searchQuery}"</span>
              <span className="text-[11px]">Try searching by feeling or name like "happy", "study", "heart"</span>
            </div>
          ) : (
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 text-center">
              {displayEmojis.map((item, idx) => (
                <button
                  key={`${item.emoji}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelectEmoji(item.emoji);
                  }}
                  title={item.name}
                  className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 hover:bg-[var(--surface-sunken)] active:scale-95 transition-transform cursor-pointer rounded-none select-none"
                  aria-label={item.name}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

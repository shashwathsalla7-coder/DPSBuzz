# Instagram Direct Messages & Follow Request Architecture Guide

This comprehensive technical guide outlines the system design, data models, state management, and edge-case logic required to implement Instagram-style chat routing and follow request features.

---

## 1. System Overviews & Core Philosophy
Instagram separates **social graphs** (following relationships) from **message flows** (inboxes). 
* A user's privacy settings (`is_private`) control the entry lifecycle of a follow request.
* A user's social connection status to a sender (Do I follow them? Do they follow me?) directly determines whether a newly sent message routes to the **Primary/General Inbox** or the **Message Requests Folder**.
* Accepting a message request grants communication clearance but **does not** automatically create a follow relationship.

---

## 2. Database Schema (Relational/NoSQL Reference Models)

### Users Table / Collection
Stores the profile settings, highlighting the privacy mode.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Follows Table / Collection
Manages stateful connections between accounts. This tracks pending or active status.
```sql
CREATE TABLE follows (
    id UUID PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'ACCEPTED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);
```

### Chat Rooms Table / Collection
The orchestrator of a communication boundary.
```sql
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY,
    is_group BOOLEAN DEFAULT FALSE,
    title VARCHAR(100), -- Nullable for 1-on-1 chats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Participants Table / Collection
Links users to rooms and determines their localized access rules (Inbox routing tier).
```sql
CREATE TABLE chat_participants (
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    inbox_tier VARCHAR(20) DEFAULT 'PRIMARY', -- 'PRIMARY', 'GENERAL', 'REQUESTS'
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);
```

### Messages Table / Collection
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL, -- 'TEXT', 'MEDIA', 'POST_SHARE'
    payload TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_vanish_mode_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. The State Machine & Logical Flowcharts

### A. Follow Request Pipeline
When User A triggers a follow request on User B:

1. **Check Target Privacy:** Is User B `is_private == true`?
   - **NO:** Insert record into `follows` as `status = 'ACCEPTED'`. Increment Follower/Following counts. Complete.
   - **YES:** Insert record into `follows` as `status = 'PENDING'`. Push notification event to User B's activity feed.
2. **User B Evaluation:**
   - **Action: CONFIRM:** Update record to `status = 'ACCEPTED'`. Move record to active followers.
   - **Action: DELETE:** Delete the row from the `follows` table completely. User A returns to a standard neutral state.

### B. Message Routing & Gatekeeper Logic
When User A sends a message to User B for the first time:

1. **Verify Existing Channel:** Does a common `chat_room` already exist where both are participants?
   - **YES:** Append the message to the room. The existing `inbox_tier` for User B governs the presentation.
   - **NO:** Check Social Trust Boundaries.
2. **Check Trust Status:** Does User B follow User A?
   - **YES (Trusted):** 
     - Create a `chat_room`.
     - Insert both into `chat_participants`.
     - Set User B's `inbox_tier = 'PRIMARY'`.
   - **NO (Stranger):**
     - Create a `chat_room`.
     - Insert both into `chat_participants`.
     - Set User B's `inbox_tier = 'REQUESTS'`.
     - Restrict message features to text-only (Block rich media upload pipelines).

---

## 4. Message Request Handling (The "Stranger" Sandbox)

When a message resides in the `REQUESTS` inbox tier, the room is isolated under distinct constraints to shield the recipient:

* **Anonymity (Invisible Reads):** Opening and fetching messages inside a thread where `inbox_tier == 'REQUESTS'` must **never** write a read receipt timestamp or trigger a websocket "seen" update back to the sender.
* **Recipient Action States:**
  1. **ACCEPT:** Updates `chat_participants.inbox_tier` from `REQUESTS` to `PRIMARY`. This action emits historical read-receipt states to the sender and enables media features.
  2. **DELETE:** Deletes the specific `chat_participants` link and removes or hides the thread for the recipient.
  3. **BLOCK:** Transitions the state to a `blocks` table, terminating any future socket connections or message handshakes from the sender's user ID.

---

## 5. Modern Real-Time Chat Features

### Unsend Protocol
* When a user triggers "Unsend", hard-delete or flag the message as deleted in the database (`is_deleted = true`).
* Broadcast a WebSocket event payload (`type: 'MESSAGE_UNSEND', message_id: 'XYZ'`) to all active room participants.
* The frontend receives the event and immediately drops the message object from its local state arrays, removing it visually from both devices.

### Vanish Mode State Engine
* When Vanish Mode is toggled active inside a `chat_room`, flag the room metadata or track a user-specific toggle state.
* Any messages sent while Vanish Mode is active are marked `is_vanish_mode_message = true`.
* **Disappearance Rule:** Once a participant opens the screen, views the vanish messages, and subsequently exits or closes the chat view, the frontend signals the backend to mark those specific message IDs as permanently expired, purging them from storage.
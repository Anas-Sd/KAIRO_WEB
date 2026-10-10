# KAIRO: Android to Web Feature Parity Specification
**Document Version:** 1.0.0  
**Phase:** Phase 1 (Analysis & Architecture Parity)  
**Single Source of Truth:** Android Source Code (`/app/src/main/java/com/kairo/app/`)

---

## 1. Screen, Activity, Fragment & Navigation Flow

### 1.1 Architecture & Navigation Stack
The Android app is built using **Jetpack Compose Single-Activity Architecture** (`MainActivity.kt`), supplemented by standalone Activities for full-screen alarm ringing (`AlarmActivity.kt`) and quick-action lock screen widgets.

```mermaid
graph TD
    Splash[Splash / Auth Check] -->|No Code in Prefs| Login[LoginScreen]
    Splash -->|Valid Code in Prefs| Home[HomeScreen / TasksWorkspace]
    Login -->|Valid 6-Char Access Code| Home
    
    subgraph Main Navigation
        Home -->|Top-bar Bell Icon| Settings[SettingsScreen]
        Home -->|Top-bar Sparkle Icon| AI[AiAssistantScreen / BottomSheet]
        Home -->|Card Click / Breadcrumb Click| SubtaskView[HomeScreen Drill-Down (parentId)]
        Home -->|FAB '+' Button| CreateDialog[CreateTaskDialog / BottomSheet]
        Home -->|Card Click / More Action| TaskDetails[TaskDetailsBottomSheet]
        TaskDetails -->|Edit Button| EditDialog[EditTaskDialog]
        TaskDetails -->|Reparent Button| AdjustParent[AdjustParentDialog]
        TaskDetails -->|Delete Action| DeleteConfirm[DeleteTaskConfirmDialog]
    end

    subgraph System & Background Flow
        AlarmReceiver[AlarmReceiver] -->|Exact Alarm Fires| RingingService[AlarmRingingService]
        RingingService -->|Full Screen Intent| AlarmScreen[AlarmActivity]
        AlarmScreen -->|Snooze Button| Home
        AlarmScreen -->|Complete Button| Home
        GeofenceReceiver[GeofenceBroadcastReceiver] -->|Geofence Trigger| Notification[Location Notification]
    end
```

### 1.2 Screen Catalog & Composable Breakdown
1. **`LoginScreen.kt`**:
   - Single clean input box for the 6-character user access code.
   - Live character validation, uppercase transformation, auto-submit or explicit "Enter Workspace" button.
   - Network validation against Supabase `access_codes` table.
   - Error banner with vibration feedback on invalid codes.
2. **`HomeScreen.kt`** (Tasks Workspace):
   - **Header Bar**: Workspace branding ("KAIRO"), active access code badge (`user_code`), AI Assistant toggle, Settings toggle, and online/sync status indicator.
   - **Breadcrumb Bar (`BreadcrumbBar.kt`)**: Displays navigational hierarchy when drilled into a parent task (`Root > Parent Task > Subtask`). Supports clicking any ancestor crumb to pop back.
   - **Task Sections**:
     - *Overdue*: Tasks with `dueDateMillis < currentTime` and `!isCompleted` (Expanded by default).
     - *Today*: Tasks scheduled for current calendar day (Expanded by default).
     - *Upcoming*: Future scheduled tasks (Collapsed by default).
     - *Completed*: Finished tasks (Collapsed by default, struck-through titles).
   - **Task Card (`TaskCard.kt`)**:
     - Completion checkbox with confetti/ripple animation.
     - Title, time badge, priority badge (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), location pill, recurrence chip.
     - Subtask counter pill (`X subtasks`) that drills down into child view.
     - Swipe actions: Swipe right to Complete, Swipe left to Snooze/Delete.
     - Quick menu: Edit, Adjust Parent, Snooze, Delete.
   - **Undo Banner (`UndoDoneBar.kt`)**: Snackbar showing "Task marked done — [UNDO]" with 5-second countdown.
   - **Floating Action Button (FAB)**: Primary floating button to trigger task creation.
3. **`CreateTaskDialog.kt` & `EditTaskDialog.kt`**:
   - Title input (required, autofocus).
   - Description input (markdown/plaintext supported).
   - Date picker & Time picker (supports 12h/24h formats).
   - Priority selector (None, Low, Medium, High, Urgent).
   - Subtask parent assignment picker (`parentId`).
   - Location picker (`LocationPickerDialog.kt` with radius, lat, lng, and geofence toggle).
   - Alarm tone selector (`TonePickerDialog.kt` with preview playback).
   - Recurrence picker (`NONE`, `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `CUSTOM`).
4. **`AdjustParentDialog.kt`**:
   - Tree selector to move tasks across hierarchy.
   - Cycle-prevention logic: Disallows selecting the task itself or any of its descendants as the new parent.
   - Option: "Move subtasks together" vs "Promote subtasks to root".
5. **`SettingsScreen.kt`**:
   - Current user profile info (Name, Access Code).
   - **Access Code Rotation (`rotateAccessCode`)**: Input for new 6-character code, validates uniqueness, cascades updates across all tasks in Supabase and local cache.
   - Default Alarm Tone & Ring volume.
   - Default Snooze duration (5, 10, 15, 30, 60 minutes).
   - Sync settings: Force Sync Now, Clear Cache, Logout / Disconnect.
6. **`AlarmActivity.kt`**:
   - Fullscreen alarm screen showing pulsing glow, task title, time, and sound playback.
   - Action buttons: Complete Task, Snooze (with duration pills: 5m, 10m, 15m, 30m, 60m).
   - Text-to-speech engine speaks: *"Reminder: [Task Title]"*.
7. **`AiAssistantScreen.kt`**:
   - Interactive voice & text dialog.
   - Real-time speech input visualization.
   - Tool calling feedback ("Creating task 'Gym at 6 PM'...", "Updated meeting time").

---

## 2. Feature-by-Feature Matrix, Actions, Validations & Edge Cases

| Feature / UI Element | User Actions & Triggers | Validation Rules | Error Handling & Messages | Edge Cases Handled in Android |
| :--- | :--- | :--- | :--- | :--- |
| **Access Code Login** | Enter 6 characters, click Submit | Must be alphanumeric, exactly 6 chars, trimmed, uppercase | "Invalid code. Please check your workspace code." | Offline login allowed if code was previously verified and cached in SharedPreferences. |
| **Task Creation** | FAB click, enter details, save | `title` must not be blank (trimmed length > 0) | "Title cannot be empty" inline text | Due date in past triggers confirmation or auto-flags as Overdue immediately. |
| **Task Completion** | Checkbox click or swipe right | Any task status toggle | Reverts on sync error | Triggering complete on parent shows prompt: "Complete all X subtasks as well?". Undo snackbar available for 5s. |
| **Subtask Drill-Down** | Click subtask count badge | Requires `subtaskCount > 0` | None | Deep nested levels (> 5) truncate breadcrumbs with ellipsis in `BreadcrumbBar`. |
| **Adjust Parent (Reparenting)** | Dialog selection of new parent | Cannot select self (`id != targetId`) or any child in sub-tree | "Cannot move a task into its own subtask" | Root promotion (`parentId = null`) clears breadcrumb hierarchy. |
| **Snooze Task** | Quick menu or Alarm Ringing screen | Snooze duration: 5m, 10m, 15m, 30m, 60m | Reschedules alarm trigger | If scheduled time exceeds end of day, updates `dueDate` to tomorrow automatically. |
| **Task Deletion** | Swipe left or delete icon | Confirmation dialog with count of cascading subtasks | "Delete task and X subtasks?" | Cascading delete removes parent and all recursive children from DB and Supabase. |
| **Code Rotation** | Settings -> Change Code | New code != Old code, exactly 6 alphanumeric characters | "New code cannot be identical", "Code already in use" | Network interruption midway: updates Supabase first, rolls back local if Supabase fails. |
| **Offline Sync Queue** | Automatic on mutation | Valid SQLite queue action (`INSERT`, `UPDATE`, `DELETE`) | Retry count increment, max 5 retries | Conflict resolution: Last-Write-Wins based on `updated_at` timestamp. |

---

## 3. Authentication & Session Architecture

### 3.1 Mechanism
- **Model**: Custom Workspace Access Code system (Zero-password design).
- **Identifier**: 6-character uppercase alphanumeric string (`user_access_code`, e.g., `SDANAS`).
- **Database Table**: `access_codes`
  ```sql
  CREATE TABLE access_codes (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- **Login Flow (`AuthManager.kt`)**:
  1. User inputs string. Input is formatted to uppercase and trimmed.
  2. Query Supabase:
     ```http
     GET /rest/v1/access_codes?code=eq.SDANAS&select=code,name HTTP/1.1
     apikey: <SUPABASE_ANON_KEY>
     Authorization: Bearer <SUPABASE_ANON_KEY>
     ```
  3. If result is non-empty:
     - Store `user_access_code = "SDANAS"` and `user_display_name = name` in persistent storage (`SharedPreferences` on Android, `localStorage`/`httpOnly` cookie on web).
     - Mark `isLoggedIn = true`.
     - Initialize `SyncManager.triggerSync()`.
  4. If empty: Display "Invalid access code. Please verify with your workspace administrator."

### 3.2 Auto-Login & Session Persistence
- On app launch, `AuthManager.getSavedAccessCode()` is inspected.
- If present, the user is directly transitioned to `HomeScreen` without re-authenticating against the network (offline-first).
- Background validation checks validity during periodic sync.

### 3.3 Logout / Disconnect
- Clears stored access code and display name.
- Cancels all pending `AlarmManager` alarms.
- Clears local database tables (`local_tasks`, `sync_queue`).
- Redirects immediately to `LoginScreen`.

---

## 4. Code Rotation & Time-Based Verification Algorithm

### 4.1 Rotation Protocol (`rotateAccessCode`)
In `SettingsScreen.kt` / `SupabaseClient.kt`, users can rotate their workspace code. The exact byte-for-byte protocol is:
1. **Validation**: Check that `newCode` matches regex `^[A-Za-z0-9]{6}$` and `newCode.uppercase() != oldCode`.
2. **Availability Check**:
   ```http
   GET /rest/v1/access_codes?code=eq.<NEW_CODE>&select=code
   ```
   If records exist: Abort with `"Code already taken. Choose another code."`
3. **Database Migration Step 1 (Create new access record)**:
   ```http
   POST /rest/v1/access_codes
   {"code": "<NEW_CODE>", "name": "<CURRENT_NAME>"}
   ```
4. **Database Migration Step 2 (Cascade Tasks)**:
   ```http
   PATCH /rest/v1/tasks?user_code=eq.<OLD_CODE>
   {"user_code": "<NEW_CODE>"}
   ```
5. **Database Migration Step 3 (Delete Old Access Record)**:
   ```http
   DELETE /rest/v1/access_codes?code=eq.<OLD_CODE>
   ```
6. **Local Cache & Queue Update**:
   - `UPDATE local_tasks SET user_code = '<NEW_CODE>' WHERE user_code = '<OLD_CODE>'`
   - `UPDATE sync_queue SET user_code = '<NEW_CODE>' WHERE user_code = '<OLD_CODE>'`
   - Write `newCode` into local settings storage.

---

## 5. API Endpoints, PostgREST Schema, Headers & Auth

### 5.1 Supabase Configuration
- **Host**: `https://lswzgwzbvuiolkzvyrof.supabase.co`
- **Headers**:
  ```http
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_ANON_KEY>
  Content-Type: application/json
  Prefer: return=representation
  ```

### 5.2 Supabase Endpoint Registry

| Operation | Method | Supabase REST URL | Payload / Parameters |
| :--- | :--- | :--- | :--- |
| **Validate Code** | `GET` | `/rest/v1/access_codes?code=eq.<CODE>&select=code,name` | None |
| **Fetch Tasks** | `GET` | `/rest/v1/tasks?user_code=eq.<CODE>&select=*` | Filtered by `user_code` |
| **Insert Task** | `POST` | `/rest/v1/tasks` | Full `TaskDto` JSON object |
| **Update Task** | `PATCH` | `/rest/v1/tasks?id=eq.<ID>&user_code=eq.<CODE>` | Updated fields in `TaskDto` |
| **Delete Task** | `DELETE` | `/rest/v1/tasks?id=eq.<ID>&user_code=eq.<CODE>` | None |
| **Bulk Cascade Delete** | `DELETE` | `/rest/v1/tasks?user_code=eq.<CODE>&or=(id.eq.<ID>,parent_id.eq.<ID>)` | Multi-row deletion |
| **Groq AI Chat** | `POST` | `https://api.groq.com/openai/v1/chat/completions` | Model: `llama-3.3-70b-versatile`, Tools schema |

---

## 6. Complete Data Models & Sync Engine

### 6.1 Domain Task Model (`Task.kt`) vs Supabase DTO (`TaskDto.kt`)

```typescript
// Web TypeScript Interface matching Android Task.kt & TaskDto.kt byte-for-byte
export interface Task {
  id: string;                       // UUID v4
  userCode: string;                 // 6-character owner code
  title: string;                    // Required task title
  description?: string;             // Optional notes/markdown
  dueDate?: string;                 // "YYYY-MM-DD"
  dueTime?: string;                 // "HH:mm" (24-hour format)
  dueDateMillis?: number;           // Epoch timestamp for alarms/ordering
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  section: 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED';
  isCompleted: boolean;             // Boolean completion state
  completedAt?: number;             // Epoch timestamp when checked
  parentId?: string | null;         // Reference to parent task id
  subtaskOrder?: number;            // Ordering within parent subtasks
  position?: number;                // Custom order index
  
  // Recurrence
  recurrenceType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  recurrenceInterval?: number;      // e.g., every 2 days
  recurrenceDaysOfWeek?: number[];  // [1, 2, 3, 4, 5] (Mon-Fri)
  
  // Geofencing & Location
  locationName?: string;            // Human-readable address
  latitude?: number;                // Lat coordinate
  longitude?: number;               // Lng coordinate
  radiusMeters?: number;            // Geofence radius (default 500)
  triggerOnEntry?: boolean;         // Trigger when entering area
  triggerOnExit?: boolean;          // Trigger when exiting area
  
  // Notification & Audio
  alarmToneUri?: string;            // Audio identifier / ringtone path
  vibrate?: boolean;                // Haptic feedback enabled
  snoozeCount?: number;             // Count of times snoozed
  
  // Metadata
  createdAt: number;                // Epoch ms
  updatedAt: number;                // Epoch ms
}
```

### 6.2 Supabase Column Mapping (`tasks` table)

| Column Name (`tasks` table) | Postgres Type | Domain Field (`Task.kt`) |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | `id` |
| `user_code` | `varchar(10)` | `userCode` |
| `title` | `text` | `title` |
| `description` | `text` | `description` |
| `due_date` | `varchar(20)` | `dueDate` |
| `due_time` | `varchar(10)` | `dueTime` |
| `due_date_millis` | `int8` | `dueDateMillis` |
| `priority` | `varchar(20)` | `priority` |
| `section` | `varchar(20)` | `section` |
| `is_completed` | `bool` | `isCompleted` |
| `completed_at` | `int8` | `completedAt` |
| `parent_id` | `uuid` (nullable) | `parentId` |
| `subtask_order` | `int4` | `subtaskOrder` |
| `position` | `int4` | `position` |
| `recurrence_type` | `varchar(20)` | `recurrenceType` |
| `recurrence_interval` | `int4` | `recurrenceInterval` |
| `recurrence_days_of_week` | `text` (JSON string) | `recurrenceDaysOfWeek` |
| `location_name` | `text` | `locationName` |
| `latitude` | `float8` | `latitude` |
| `longitude` | `float8` | `longitude` |
| `radius_meters` | `float8` | `radiusMeters` |
| `trigger_on_entry` | `bool` | `triggerOnEntry` |
| `trigger_on_exit` | `bool` | `triggerOnExit` |
| `alarm_tone_uri` | `text` | `alarmToneUri` |
| `vibrate` | `bool` | `vibrate` |
| `snooze_count` | `int4` | `snoozeCount` |
| `created_at` | `int8` | `createdAt` |
| `updated_at` | `int8` | `updatedAt` |

### 6.3 Local Storage & Two-Way Sync Engine (`SyncManager.kt`)
1. **Local Store**: Android uses Room (`local_tasks` + `sync_queue`). Web will use **IndexedDB** (`idb` library) replicating the exact same schemas.
2. **`sync_queue` Structure**:
   - `id`: Auto-increment integer
   - `taskId`: Task UUID
   - `action`: `INSERT` | `UPDATE` | `DELETE`
   - `payload`: JSON stringified `TaskDto`
   - `retryCount`: Integer (0 to 5)
   - `timestamp`: Epoch ms
3. **Sync Strategy**:
   - **Local Mutation First**: UI updates immediately from IndexedDB. Mutation is enqueued in `sync_queue`.
   - **Drain Queue**: Worker processes `sync_queue` items sequentially against Supabase REST API. On HTTP 200/201/204, remove item from queue.
   - **Remote Pull**: Query `GET /rest/v1/tasks?user_code=eq.<CODE>`. For each remote task:
     - If local `updated_at > remote.updated_at` and task is in `sync_queue`, preserve local.
     - Otherwise, overwrite local IndexedDB record with remote.
   - **Realtime Updates**: Subscribe to Supabase Realtime channel `realtime:public:tasks:user_code=eq.<CODE>` to receive instant server-side changes made from Android or other web tabs.

---

## 7. Background Work, Alarms & Notifications

### 7.1 Android Implementation vs Web Equivalent

| Component | Android Mechanism | Web Implementation Equivalent |
| :--- | :--- | :--- |
| **Exact Task Alarms** | `AlarmManager.setExactAndAllowWhileIdle()` | Service Worker + `Notification` API + Web Audio API (`AudioContext`) + Client Tab Timer fallback |
| **Alarm Ringing & Audio** | Foreground Service (`AlarmRingingService`) playing media loop | Web Audio API / HTML5 `<audio>` element with custom high-fidelity tones (`retro_synth.mp3`, `digital_bell.mp3`, etc.) |
| **Lock Screen / Wake Up** | `AlarmActivity` with `FLAG_SHOW_WHEN_LOCKED` & `FLAG_TURN_SCREEN_ON` | High-priority Web Notification with Action Buttons ("Complete", "Snooze 10m") + Fullscreen Modal when tab is focused |
| **Geofencing** | Google Play Services `GeofencingClient` | `navigator.geolocation.watchPosition()` evaluating Haversine distance against task `latitude`, `longitude`, `radiusMeters` |
| **TTS (Text-to-Speech)** | Android `TextToSpeech` | Web Speech Synthesis API (`window.speechSynthesis.speak()`) |
| **STT (Speech-to-Text)** | Android `SpeechRecognizer` | Web Speech Recognition API (`webkitSpeechRecognition` / `SpeechRecognition`) |

---

## 8. Android-Only Features & Proposed Web Substitutions

1. **Android Keystore / EncryptedSharedPreferences**:
   - *Android*: Stores user code in private app sandbox.
   - *Web Substitute*: Secure `localStorage` with fallback to `httpOnly` secure cookies if backend proxy is deployed.
2. **Foreground Media Playback Service**:
   - *Android*: Continues ringing even if app is completely closed or screen is off.
   - *Web Substitute*: Service Worker push notifications for background alerts + In-tab HTML5 Audio Player loop with user-interaction unlock policy.
3. **Haptic Vibrator (`VibratorManager`)**:
   - *Android*: Vibrates phone on alarm and task completion.
   - *Web Substitute*: `navigator.vibrate([200, 100, 200])` supported on modern mobile browsers.
4. **Hardware Back Button / Predictive Back**:
   - *Android*: Navigates up breadcrumb parent hierarchy.
   - *Web Substitute*: Browser History API (`history.pushState` / `popstate`) syncing URL search params (`?parent=<id>`).

---

## 9. Third-Party SDK & Dependency Mapping

| Category | Android Library / SDK | Web Counterpart (Production) |
| :--- | :--- | :--- |
| **UI Framework** | Jetpack Compose (Kotlin) | React 18 + Tailwind CSS (matching provided `/ui-code`) |
| **Icons** | Material Icons Extended | Material Symbols Outlined (`https://fonts.googleapis.com/...`) |
| **Database** | Room / SQLite | IndexedDB via `idb` |
| **Backend / BaaS** | Supabase PostgREST via OkHttp | `@supabase/supabase-js` or direct `fetch()` to Supabase REST endpoints |
| **AI LLM Engine** | Groq API via OkHttp | Groq SDK / direct fetch to `https://api.groq.com/openai/v1/chat/completions` |
| **Sound & Audio** | Android `MediaPlayer` / `SoundPool` | Howler.js or Native Web Audio API |
| **Date & Time** | `java.time.LocalDate` / `Instant` | `date-fns` |
| **UUIDs** | `java.util.UUID.randomUUID()` | `crypto.randomUUID()` |

---

## 10. Open Architectural Questions for User Approval

Before proceeding to **Phase 2: PLAN**, please confirm the following design decisions:

1. **Browser Tab Closed Alarm Limitation**:
   - In native Android, `AlarmManager` can wake up a phone when the screen is off and the app is dead. On the web, browsers restrict playing loud audio when the browser is completely closed without active user interaction. 
   - *Proposal*: We implement Service Worker Web Notifications for background alerts, and full-screen ringing audio whenever any tab or PWA window is open. Is this acceptable?
2. **Groq API Key Exposure**:
   - On Android, the Groq API key is bundled inside BuildConfig/code. On client-side web apps, exposing the key in browser bundles is readable by anyone inspecting network tabs.
   - *Question*: Do you want direct client-side calling to Groq (matching Android), or a lightweight API proxy endpoint?
3. **Routing & URL Structure**:
   - Should we support direct deep-linking to subtasks and views via URL (e.g. `/workspace?code=SDANAS&parent=<uuid>`)?

---

*End of Phase 1 Feature Parity Specification.*

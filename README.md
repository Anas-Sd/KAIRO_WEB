# KAIRO Web Workspace

Production-grade web application for **KAIRO Task Manager**, built with **React 18, TypeScript, Vite, Tailwind CSS**, and powered by **Supabase as the single source of truth**.

---

## ⚡ Tech Stack

- **Framework & Runtime**: React 18 + TypeScript + Vite
- **Database & Sync**: `@supabase/supabase-js` connected directly to the cloud `tasks` table with **Supabase Realtime WebSockets**
- **Styling & UI**: Tailwind CSS, Google Inter & Roboto Flex typography, Material Symbols & Lucide icons
- **State Management**: Reactive hierarchy scoping with subtask drill-down and optimistic offline-safe updates

---

## 🚀 Exact Feature Parity with Android Mobile Application

### 1. Supabase as Single Source of Truth
- Direct PostgREST and Realtime WebSocket integration with the Kairo Supabase database (`tasks` table).
- Scoped by user access code (`user_code`) — tasks created or edited on your Android phone immediately appear on the web in real-time, and vice versa!
- Settings dialog to input your 6-character user access code, generate a new code, or test sync.

### 2. Parent & Subtasks Hierarchy
- **Hierarchy Scoping**: At root view, only top-level tasks (`parentId = null`) are displayed.
- **Subtask Progress Indicator**: Tasks with subtasks display an arrow indicator (`subdirectory_arrow_right`) and a progress capsule (e.g. `2 of 4 subtasks`).
- **Drill-Down Navigation**: Clicking a task with subtasks or choosing *"View Subtasks"* navigates into that task.
- **Breadcrumb Bar**: Header breadcrumb bar (`All Tasks > Parent > Sub-parent`) allows 1-click back navigation or jumping to any ancestor level.
- **Direct Subtask Creation**: Adding a task while drilled down automatically links its `parentId`. Choosing *"Add Subtask"* from any card pre-sets its parent.
- **Adjust Parent / Reparenting**: Full modal matching Android's `AdjustParentDialog.kt` with:
  - Searchable task tree
  - Move to root ("No parent")
  - Automatic circular-dependency cycle prevention (cannot make a task a child of itself or its descendants)
  - Toggle to move task alone or with all its subtasks

### 3. Default Accordion States
- **Overdue**: **EXPANDED** by default (with ping indicator, count badge, and "Reschedule all" action).
- **Today**: **EXPANDED** by default (with date badge, remaining task count, and quick add).
- **Upcoming**: **COLLAPSED** by default (accordion closed with rotated chevron).
- **Completed**: **COLLAPSED** by default (accordion closed with rotated chevron and "Clear all" action).

### 4. Full Android Task Metadata
- **Priority Capsules**: Urgent/High (Red `#dc2626`), Medium (Blue `#2563eb`), Low (Green `#16a34a`).
- **Due Date & Time**: Display dates ("Today", "Tomorrow", "Oct 25") and alarm times.
- **Locations**: Location name badge with pin icon.
- **Recurrence**: Repeat capsule (Daily, Weekdays, Weekly, Monthly).
- **Attachments**: File attachment indicators.
- **Notes / Description**: Expandable task descriptions.

### 5. Interactive Polish & Micro-interactions
- **Undo Done Bar**: Matching Android's `UndoDoneBar.kt` — completing a task shows a floating bar with an **UNDO** button to instantly revert.
- **Delete Confirmation**: Matching Android's `DeleteTaskConfirmDialog.kt` — warns if a task has subtasks that will also be removed.
- **Live Search**: Instant search matching titles, notes, and locations with <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> shortcut.
- **Sort & Filter**: Live sorting by Due Date, Priority, or Alphabetical; filter by Priority (All, Urgent, High, Medium, Low).
- **Shortcuts**: Press <kbd>N</kbd> anywhere to create a task.
- **Export to CSV**: Download your tasks anytime.

---

## 🛠️ How to Run

From `c:\PROJECTS\KAIRO WEB`:

```bash
# Start development server with hot-reload (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

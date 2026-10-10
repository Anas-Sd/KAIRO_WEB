import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Calendar as CalendarIcon,
  Search,
  Settings,
  RefreshCw,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Flame,
  ListTodo,
  TrendingUp,
  Infinity,
  Menu,
  ChevronDown,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Task, Priority, TaskSection, TaskSort } from './types/task';
import { SupabaseService } from './services/supabase';
import { AuthManager } from './services/auth';
import { TaskCard } from './components/TaskCard';
import { BreadcrumbBar } from './components/BreadcrumbBar';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { AdjustParentModal } from './components/AdjustParentModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UndoDoneBar } from './components/UndoDoneBar';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // App & Authentication State
  const [userCode, setUserCode] = useState<string>(AuthManager.getUserCode());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'lists' | 'habits' | 'calendar' | 'analytics'>('tasks');

  // Hierarchy Navigation
  const [breadcrumbStack, setBreadcrumbStack] = useState<Task[]>([]);

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortOption, setSortOption] = useState<TaskSort>('DATE_NEAR');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);

  // Accordion Section States (Default: Overdue & Today expanded, rest collapsed)
  const [overdueExpanded, setOverdueExpanded] = useState<boolean>(true);
  const [todayExpanded, setTodayExpanded] = useState<boolean>(true);
  const [upcomingExpanded, setUpcomingExpanded] = useState<boolean>(false);
  const [completedExpanded, setCompletedExpanded] = useState<boolean>(false);

  // Modals & Sheets
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createSubtaskParent, setCreateSubtaskParent] = useState<Task | null>(null);
  const [createDefaultSection, setCreateDefaultSection] = useState<TaskSection>('TODAY');

  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [selectedTaskForAdjustParent, setSelectedTaskForAdjustParent] = useState<Task | null>(null);
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState<Task | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Undo state
  const [undoTask, setUndoTask] = useState<{ id: string; title: string; previousCompleted: boolean } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  /* --------------------------------------------------------------------------
     Data Loading & Supabase Realtime Synchronization
     -------------------------------------------------------------------------- */
  const loadTasksFromSupabase = async (code = userCode) => {
    setIsSyncing(true);
    try {
      const data = await SupabaseService.fetchTasks(code);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load from Supabase:', err);
      showToast('Could not reach cloud database. Check connection.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadTasksFromSupabase(userCode);

    // Subscribe to real-time changes directly in Supabase
    const subscription = SupabaseService.subscribeToTasks(userCode, () => {
      loadTasksFromSupabase(userCode);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userCode]);

  /* --------------------------------------------------------------------------
     Hierarchy Scoping & Filter/Sort Logic
     -------------------------------------------------------------------------- */
  const scopedTasks = useMemo(() => {
    const isSearching = searchQuery.trim().length > 0;

    if (breadcrumbStack.length > 0) {
      // Drilled into a parent task: show its direct subtasks
      const currentParent = breadcrumbStack[breadcrumbStack.length - 1];
      return tasks.filter((t) => t.parentId === currentParent.id);
    } else if (isSearching) {
      // Show all matching tasks across hierarchy when actively searching
      return tasks;
    } else {
      // Root workspace: show only top-level tasks
      return tasks.filter((t) => !t.parentId);
    }
  }, [tasks, breadcrumbStack, searchQuery]);

  const filteredTasks = useMemo(() => {
    let result = [...scopedTasks];

    // Priority filter
    if (priorityFilter !== 'All') {
      result = result.filter((t) => t.priority === priorityFilter.toUpperCase());
    }

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q))
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (sortOption === 'PRIORITY_HIGH') {
        const order: Record<Priority, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return order[b.priority] - order[a.priority];
      }
      if (sortOption === 'PRIORITY_LOW') {
        const order: Record<Priority, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return order[a.priority] - order[b.priority];
      }
      if (sortOption === 'TITLE_AZ') {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === 'TITLE_ZA') {
        return b.title.localeCompare(a.title);
      }
      if (sortOption === 'DATE_LATE') {
        return (b.dueDateMillis || b.createdAt) - (a.dueDateMillis || a.createdAt);
      }
      // DATE_NEAR default
      return (a.dueDateMillis || a.createdAt) - (b.dueDateMillis || b.createdAt);
    });

    return result;
  }, [scopedTasks, priorityFilter, searchQuery, sortOption]);

  const overdueTasks = useMemo(
    () => filteredTasks.filter((t) => t.section === 'OVERDUE' && !t.isCompleted),
    [filteredTasks]
  );
  const todayTasks = useMemo(
    () => filteredTasks.filter((t) => t.section === 'TODAY' && !t.isCompleted),
    [filteredTasks]
  );
  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t) => t.section === 'UPCOMING' && !t.isCompleted),
    [filteredTasks]
  );
  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.isCompleted),
    [filteredTasks]
  );

  /* --------------------------------------------------------------------------
     Task Operations (CRUD with direct Supabase sync)
     -------------------------------------------------------------------------- */
  const handleToggleCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated: Task = {
      ...task,
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? Date.now() : null,
      updatedAt: Date.now(),
    };

    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

    // Set undo action
    setUndoTask({
      id: task.id,
      title: task.title,
      previousCompleted: task.isCompleted,
    });

    try {
      await SupabaseService.upsertTask(updated, userCode);
      showToast(updated.isCompleted ? 'Task marked complete 🎉' : 'Task marked active');
    } catch (err) {
      console.error('Supabase update failed:', err);
      showToast('Error syncing completion to Supabase');
    }
  };

  const handleUndo = async () => {
    if (!undoTask) return;
    const task = tasks.find((t) => t.id === undoTask.id);
    if (!task) return;

    const restored: Task = {
      ...task,
      isCompleted: undoTask.previousCompleted,
      completedAt: undoTask.previousCompleted ? Date.now() : null,
      updatedAt: Date.now(),
    };

    setTasks((prev) => prev.map((t) => (t.id === undoTask.id ? restored : t)));
    setUndoTask(null);

    try {
      await SupabaseService.upsertTask(restored, userCode);
      showToast('Action undone');
    } catch (err) {
      console.error('Supabase undo failed:', err);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: taskData.title || '',
      notes: taskData.notes || null,
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate || 'Today',
      dueDateMillis: taskData.dueDateMillis || Date.now(),
      dueTime: taskData.dueTime || null,
      location: taskData.location || null,
      attachmentName: null,
      isCompleted: false,
      section: taskData.section || 'TODAY',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      repeatType: taskData.repeatType || null,
      parentId: taskData.parentId || null,
      position: tasks.length,
      user_code: userCode,
    };

    setTasks((prev) => [newTask, ...prev]);
    showToast('Task created');

    try {
      await SupabaseService.upsertTask(newTask, userCode);
    } catch (err) {
      console.error('Supabase create failed:', err);
      showToast('Error saving to cloud');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    showToast('Task updated');

    try {
      await SupabaseService.upsertTask(updatedTask, userCode);
    } catch (err) {
      console.error('Supabase update failed:', err);
      showToast('Error saving update to cloud');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    // Delete task and its subtasks
    const toDeleteIds = new Set<string>([task.id]);
    const queue = [task.id];
    while (queue.length > 0) {
      const current = queue.pop()!;
      const children = tasks.filter((t) => t.parentId === current);
      children.forEach((c) => {
        toDeleteIds.add(c.id);
        queue.push(c.id);
      });
    }

    setTasks((prev) => prev.filter((t) => !toDeleteIds.has(t.id)));
    showToast('Task deleted');

    try {
      for (const id of toDeleteIds) {
        await SupabaseService.deleteTask(id, userCode);
      }
    } catch (err) {
      console.error('Supabase delete failed:', err);
      showToast('Error removing from cloud');
    }
  };

  const handleAdjustParent = async (newParentId: string | null, moveSubtasks: boolean) => {
    if (!selectedTaskForAdjustParent) return;

    const task = selectedTaskForAdjustParent;
    const updatedTask: Task = {
      ...task,
      parentId: newParentId,
      updatedAt: Date.now(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    showToast(newParentId ? 'Task moved to new parent' : 'Task moved to top-level');

    try {
      await SupabaseService.upsertTask(updatedTask, userCode);
    } catch (err) {
      console.error('Supabase reparent failed:', err);
    }
  };

  const handleRescheduleAllOverdue = async () => {
    const overdue = tasks.filter((t) => t.section === 'OVERDUE' && !t.isCompleted);
    if (overdue.length === 0) {
      showToast('No overdue tasks to reschedule');
      return;
    }

    const updatedList = overdue.map((t) => ({
      ...t,
      section: 'TODAY' as TaskSection,
      dueDate: 'Today',
      dueDateMillis: Date.now(),
      updatedAt: Date.now(),
    }));

    setTasks((prev) =>
      prev.map((t) => {
        const found = updatedList.find((u) => u.id === t.id);
        return found || t;
      })
    );

    showToast(`Rescheduled ${overdue.length} overdue tasks to Today`);

    try {
      for (const t of updatedList) {
        await SupabaseService.upsertTask(t, userCode);
      }
    } catch (err) {
      console.error('Failed to reschedule overdue on cloud:', err);
    }
  };

  const handleClearCompleted = async () => {
    const completed = tasks.filter((t) => t.isCompleted);
    if (completed.length === 0) {
      showToast('No completed tasks to clear');
      return;
    }

    setTasks((prev) => prev.filter((t) => !t.isCompleted));
    showToast('Cleared completed tasks');

    try {
      for (const t of completed) {
        await SupabaseService.deleteTask(t.id, userCode);
      }
    } catch (err) {
      console.error('Failed to clear completed on cloud:', err);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['ID', 'Title', 'Notes', 'Priority', 'Section', 'DueDate', 'DueTime', 'Location', 'IsCompleted', 'ParentID'],
    ];

    tasks.forEach((t) => {
      rows.push([
        t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        t.priority,
        t.section,
        t.dueDate,
        t.dueTime || '',
        t.location || '',
        t.isCompleted ? 'true' : 'false',
        t.parentId || '',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kairo_tasks_${userCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported tasks to CSV');
  };

  /* --------------------------------------------------------------------------
     Hierarchy Drill-Down Navigation
     -------------------------------------------------------------------------- */
  const handleDrillDown = (task: Task) => {
    setBreadcrumbStack((prev) => [...prev, task]);
  };

  const handlePopBreadcrumb = () => {
    setBreadcrumbStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleNavigateToCrumb = (index: number) => {
    if (index < 0) {
      setBreadcrumbStack([]);
    } else {
      setBreadcrumbStack((prev) => prev.slice(0, index + 1));
    }
  };

  /* --------------------------------------------------------------------------
     Keyboard Shortcuts
     -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (input) input.focus();
      }
      if (
        e.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setCreateSubtaskParent(
          breadcrumbStack.length > 0 ? breadcrumbStack[breadcrumbStack.length - 1] : null
        );
        setCreateDefaultSection('TODAY');
        setShowCreateModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [breadcrumbStack]);

  return (
    <div className="flex w-full min-h-screen bg-[#12131a] text-[#e3e1ec]">
      {/* =========================================================================
          DESKTOP COLLAPSIBLE SIDEBAR
         ========================================================================= */}
      <aside
        id="sidebar"
        className={`fixed left-0 top-0 h-screen ${
          sidebarCollapsed ? 'w-16 sidebar-collapsed' : 'w-64'
        } bg-[#1a1b22] border-r border-[#292931] z-50 flex flex-col justify-between p-4 shadow-xl`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo Branding & Collapse Action */}
          <div className="flex items-center justify-between px-2 pt-1 relative">
            <div
              className="flex items-center gap-3 overflow-hidden cursor-pointer"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5a45ff] to-[#00f5a0] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#5a45ff]/20 active:scale-95 transition-transform">
                <Infinity className="w-5 h-5 text-white" />
              </div>
              <span className="sidebar-text font-bold text-xl tracking-wider text-white font-display">
                KAIRO
              </span>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-[#292931] text-[#918ea2] hover:text-[#e3e1ec] transition-all flex items-center justify-center active:scale-90"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'tasks'
                  ? 'bg-[#5a45ff] text-white shadow-md shadow-[#5a45ff]/25'
                  : 'text-[#c8c4d9] hover:text-white hover:bg-[#292931]'
              }`}
              data-tooltip="Tasks"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="sidebar-text truncate">Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('lists')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'lists'
                  ? 'bg-[#5a45ff] text-white shadow-md shadow-[#5a45ff]/25'
                  : 'text-[#c8c4d9] hover:text-white hover:bg-[#292931]'
              }`}
              data-tooltip="Lists"
            >
              <ListTodo className="w-5 h-5 flex-shrink-0" />
              <span className="sidebar-text truncate">Lists</span>
            </button>

            <button
              onClick={() => setActiveTab('habits')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'habits'
                  ? 'bg-[#5a45ff] text-white shadow-md shadow-[#5a45ff]/25'
                  : 'text-[#c8c4d9] hover:text-white hover:bg-[#292931]'
              }`}
              data-tooltip="Habits"
            >
              <Flame className="w-5 h-5 flex-shrink-0" />
              <span className="sidebar-text truncate">Habits</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-[#5a45ff] text-white shadow-md shadow-[#5a45ff]/25'
                  : 'text-[#c8c4d9] hover:text-white hover:bg-[#292931]'
              }`}
              data-tooltip="Calendar"
            >
              <CalendarIcon className="w-5 h-5 flex-shrink-0" />
              <span className="sidebar-text truncate">Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#5a45ff] text-white shadow-md shadow-[#5a45ff]/25'
                  : 'text-[#c8c4d9] hover:text-white hover:bg-[#292931]'
              }`}
              data-tooltip="Analytics"
            >
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              <span className="sidebar-text truncate">Analytics</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: Settings & Supabase Status */}
        <div className="flex flex-col gap-2 border-t border-[#292931] pt-4">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#c8c4d9] hover:text-white hover:bg-[#292931] text-sm font-medium transition-colors"
            data-tooltip="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="sidebar-text truncate">Settings</span>
          </button>

          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-3 py-2 text-xs text-[#918ea2]">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-white"
                onClick={() => loadTasksFromSupabase()}
                title="Click to sync with Supabase"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSyncing ? 'bg-amber-400 animate-spin' : 'bg-[#00f5a0] animate-pulse'
                  }`}
                />
                <span className="font-medium text-[#c8c4d9]">
                  {isSyncing ? 'Syncing...' : 'Supabase Live'}
                </span>
              </div>
              <span className="font-mono text-[10px] bg-[#292931] px-1.5 py-0.5 rounded text-[#918ea2]">
                {userCode}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================================
          MAIN LAYOUT CONTAINER
         ========================================================================= */}
      <div
        id="mainLayout"
        className={`flex-1 flex flex-col min-w-0 ${
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        } transition-all duration-300`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 w-full bg-[#12131a]/90 backdrop-blur-md border-b border-[#292931] flex items-center justify-between px-6 transition-colors duration-200">
          {/* Global Search Bar */}
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="search-wrapper flex items-center gap-2.5 w-full bg-[#1a1b22] border border-[#292931] hover:border-[#474556] transition-all px-3.5 py-2 rounded-xl text-[#c8c4d9]">
              <Search className="w-4 h-4 text-[#918ea2]" />
              <input
                id="globalSearchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, notes, subtasks, locations..."
                className="bg-transparent border-0 outline-none w-full text-sm text-[#e3e1ec] placeholder:text-[#918ea2] p-0 focus:ring-0"
              />
              <kbd className="px-2 py-0.5 rounded bg-[#292931] border border-[#33343c] text-[#c8c4d9] text-[11px] font-semibold tracking-wide flex-shrink-0">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadTasksFromSupabase()}
              className="p-2 rounded-xl bg-[#1a1b22] border border-[#292931] hover:border-[#474556] text-[#c8c4d9] hover:text-white transition-all active:scale-95 flex items-center justify-center"
              title="Sync with Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#00f5a0]' : ''}`} />
            </button>

            <div
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2.5 pl-1 cursor-pointer"
              title={`Account Code: ${userCode}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5a45ff] to-[#00f5a0] text-white font-bold flex items-center justify-center text-xs ring-2 ring-[#292931] hover:ring-[#5a45ff]/60 transition-all active:scale-95 shadow-inner">
                {userCode.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            WORKSPACE CONTENT
           ========================================================================= */}
        {activeTab === 'tasks' ? (
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
            {/* View Header & Toolbar */}
            <div className="flex flex-col gap-4 animate-entrance">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-3xl font-bold tracking-tight text-white font-display">
                    {breadcrumbStack.length > 0
                      ? breadcrumbStack[breadcrumbStack.length - 1].title
                      : 'Tasks'}
                  </h1>
                  <div className="flex items-center gap-2 bg-[#1a1b22] border border-[#292931] px-3 py-1 rounded-full text-xs font-medium text-[#c8c4d9] w-fit shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-[#00f5a0]" />
                    <span>
                      {tasks.length} total • {tasks.filter((t) => t.isCompleted).length} completed
                    </span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Priority Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1b22] border border-[#292931] hover:border-[#474556] text-[#e3e1ec] text-xs font-medium transition-all shadow-sm active:scale-95"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-[#918ea2]" />
                      <span>Priority:</span>
                      <span className="bg-[#292931] text-[#00f5a0] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {priorityFilter}
                      </span>
                    </button>

                    {showFilterDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowFilterDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-44 bg-[#1a1b22] border border-[#292931] rounded-xl p-1.5 shadow-2xl z-40 flex flex-col gap-1 animate-entrance">
                          {['All', 'Urgent', 'High', 'Medium', 'Low'].map((p) => (
                            <button
                              key={p}
                              onClick={() => {
                                setPriorityFilter(p);
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                                priorityFilter === p
                                  ? 'bg-[#292931] text-white font-medium'
                                  : 'text-[#c8c4d9] hover:bg-[#292931]'
                              }`}
                            >
                              <span>{p === 'All' ? 'All Priorities' : p}</span>
                              {priorityFilter === p && (
                                <CheckCircle className="w-3.5 h-3.5 text-[#00f5a0]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1b22] border border-[#292931] hover:border-[#474556] text-[#e3e1ec] text-xs font-medium transition-all shadow-sm active:scale-95"
                    >
                      <ArrowUpDown className="w-4 h-4 text-[#918ea2]" />
                      <span>
                        Sort:{' '}
                        {sortOption === 'DATE_NEAR'
                          ? 'Due Date'
                          : sortOption === 'PRIORITY_HIGH'
                          ? 'Priority (High)'
                          : sortOption === 'TITLE_AZ'
                          ? 'Title (A-Z)'
                          : 'Custom'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#918ea2]" />
                    </button>

                    {showSortDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowSortDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-[#1a1b22] border border-[#292931] rounded-xl p-1.5 shadow-2xl z-40 flex flex-col gap-1 animate-entrance">
                          <button
                            onClick={() => {
                              setSortOption('DATE_NEAR');
                              setShowSortDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg text-white hover:bg-[#292931]"
                          >
                            Due Date (Earliest first)
                          </button>
                          <button
                            onClick={() => {
                              setSortOption('PRIORITY_HIGH');
                              setShowSortDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg text-[#c8c4d9] hover:bg-[#292931]"
                          >
                            Priority (Highest first)
                          </button>
                          <button
                            onClick={() => {
                              setSortOption('TITLE_AZ');
                              setShowSortDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg text-[#c8c4d9] hover:bg-[#292931]"
                          >
                            Title (Alphabetical)
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Export CSV */}
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a1b22] border border-[#292931] hover:border-[#474556] text-[#c8c4d9] hover:text-white text-xs font-medium transition-all shadow-sm active:scale-95"
                    title="Export tasks to CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  {/* Primary New Task Button */}
                  <button
                    onClick={() => {
                      setCreateSubtaskParent(
                        breadcrumbStack.length > 0 ? breadcrumbStack[breadcrumbStack.length - 1] : null
                      );
                      setCreateDefaultSection('TODAY');
                      setShowCreateModal(true);
                    }}
                    className="btn-ripple flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white text-xs font-semibold shadow-md shadow-[#5a45ff]/25 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{breadcrumbStack.length > 0 ? 'Add Subtask' : 'New Task'}</span>
                    <kbd className="hidden sm:inline-block ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-medium">
                      N
                    </kbd>
                  </button>
                </div>
              </div>

              {/* Subtask Breadcrumbs Bar */}
              <BreadcrumbBar
                breadcrumbStack={breadcrumbStack}
                onNavigateBack={handlePopBreadcrumb}
                onNavigateToCrumb={handleNavigateToCrumb}
              />
            </div>

            {/* =====================================================================
                TASK SECTIONS (By default: Overdue & Today expanded, rest collapsed)
               ===================================================================== */}
            <div className="flex flex-col gap-5">
              {/* SECTION 1: Overdue (EXPANDED BY DEFAULT) */}
              <section className="bg-[#1a1b22] border border-[#292931] rounded-2xl p-4 md:p-5 shadow-lg transition-all">
                <div
                  className="flex items-center justify-between cursor-pointer select-none py-1 group"
                  onClick={() => setOverdueExpanded(!overdueExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 text-[#ffb4ab] transition-transform duration-300 ${
                        overdueExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab] animate-ping" />
                      <h2 className="text-base font-semibold text-white tracking-wide">Overdue</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#93000a]/50 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-semibold">
                      {overdueTasks.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={handleRescheduleAllOverdue}
                      className="text-xs font-medium text-[#ffb77d] hover:text-[#ffdcc3] flex items-center gap-1.5 bg-[#ffb77d]/10 hover:bg-[#ffb77d]/20 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reschedule all</span>
                    </button>
                  </div>
                </div>

                {/* Overdue Content: Expanded by default */}
                <div className={`accordion-content ${overdueExpanded ? '' : 'collapsed'}`}>
                  <div className="accordion-inner">
                    <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-[#292931]">
                      {overdueTasks.length > 0 ? (
                        overdueTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            allTasks={tasks}
                            onToggleCompletion={handleToggleCompletion}
                            onDrillDown={handleDrillDown}
                            onEdit={(t) => setSelectedTaskForEdit(t)}
                            onShowDetails={(t) => setSelectedTaskForDetails(t)}
                            onAddSubtask={(t) => {
                              setCreateSubtaskParent(t);
                              setShowCreateModal(true);
                            }}
                            onAdjustParent={(t) => setSelectedTaskForAdjustParent(t)}
                            onDelete={(t) => setSelectedTaskForDelete(t)}
                          />
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-[#918ea2] bg-[#12131a]/40 rounded-xl border border-dashed border-[#292931]">
                          No overdue tasks 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Today (EXPANDED BY DEFAULT) */}
              <section className="bg-[#1a1b22] border border-[#292931] rounded-2xl p-4 md:p-5 shadow-lg transition-all">
                <div
                  className="flex items-center justify-between cursor-pointer select-none py-1 group"
                  onClick={() => setTodayExpanded(!todayExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 text-[#5a45ff] transition-transform duration-300 ${
                        todayExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-white tracking-wide">Today</h2>
                      <span className="text-xs text-[#918ea2] font-normal">
                        • {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#5a45ff]/20 text-[#c5c0ff] border border-[#5a45ff]/30 text-xs font-semibold">
                      {todayTasks.length} remaining
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateSubtaskParent(
                          breadcrumbStack.length > 0 ? breadcrumbStack[breadcrumbStack.length - 1] : null
                        );
                        setCreateDefaultSection('TODAY');
                        setShowCreateModal(true);
                      }}
                      className="p-1 rounded-lg hover:bg-[#292931] text-[#918ea2] hover:text-[#e3e1ec] transition-all active:scale-90"
                      title="Add task for today"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Today Content: Expanded by default */}
                <div className={`accordion-content ${todayExpanded ? '' : 'collapsed'}`}>
                  <div className="accordion-inner">
                    <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-[#292931]">
                      {todayTasks.length > 0 ? (
                        todayTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            allTasks={tasks}
                            onToggleCompletion={handleToggleCompletion}
                            onDrillDown={handleDrillDown}
                            onEdit={(t) => setSelectedTaskForEdit(t)}
                            onShowDetails={(t) => setSelectedTaskForDetails(t)}
                            onAddSubtask={(t) => {
                              setCreateSubtaskParent(t);
                              setShowCreateModal(true);
                            }}
                            onAdjustParent={(t) => setSelectedTaskForAdjustParent(t)}
                            onDelete={(t) => setSelectedTaskForDelete(t)}
                          />
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-[#918ea2] bg-[#12131a]/40 rounded-xl border border-dashed border-[#292931]">
                          No tasks scheduled for today. Click + to add one.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 3: Upcoming (COLLAPSED BY DEFAULT) */}
              <section className="bg-[#1a1b22] border border-[#292931] rounded-2xl p-4 md:p-5 shadow-lg transition-all">
                <div
                  className="flex items-center justify-between cursor-pointer select-none py-1 group"
                  onClick={() => setUpcomingExpanded(!upcomingExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 text-[#918ea2] group-hover:text-white transition-transform duration-300 ${
                        upcomingExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <h2 className="text-base font-semibold text-white tracking-wide">Upcoming</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#292931] text-[#c8c4d9] text-xs font-medium">
                      {upcomingTasks.length} scheduled
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateSubtaskParent(
                          breadcrumbStack.length > 0 ? breadcrumbStack[breadcrumbStack.length - 1] : null
                        );
                        setCreateDefaultSection('UPCOMING');
                        setShowCreateModal(true);
                      }}
                      className="p-1 rounded-lg hover:bg-[#292931] text-[#918ea2] hover:text-[#e3e1ec] transition-all active:scale-90"
                      title="Add upcoming task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Upcoming Content: Collapsed by default */}
                <div className={`accordion-content ${upcomingExpanded ? '' : 'collapsed'}`}>
                  <div className="accordion-inner">
                    <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-[#292931]">
                      {upcomingTasks.length > 0 ? (
                        upcomingTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            allTasks={tasks}
                            onToggleCompletion={handleToggleCompletion}
                            onDrillDown={handleDrillDown}
                            onEdit={(t) => setSelectedTaskForEdit(t)}
                            onShowDetails={(t) => setSelectedTaskForDetails(t)}
                            onAddSubtask={(t) => {
                              setCreateSubtaskParent(t);
                              setShowCreateModal(true);
                            }}
                            onAdjustParent={(t) => setSelectedTaskForAdjustParent(t)}
                            onDelete={(t) => setSelectedTaskForDelete(t)}
                          />
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-[#918ea2] bg-[#12131a]/40 rounded-xl border border-dashed border-[#292931]">
                          No upcoming tasks scheduled.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Completed (COLLAPSED BY DEFAULT) */}
              <section className="bg-[#1a1b22] border border-[#292931] rounded-2xl p-4 md:p-5 shadow-lg transition-all">
                <div
                  className="flex items-center justify-between cursor-pointer select-none py-1 group"
                  onClick={() => setCompletedExpanded(!completedExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`w-5 h-5 text-[#918ea2] group-hover:text-white transition-transform duration-300 ${
                        completedExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00f5a0]" />
                      <h2 className="text-base font-semibold text-[#c8c4d9] tracking-wide">
                        Completed
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#292931] text-[#918ea2] text-xs font-medium">
                      {completedTasks.length} completed
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={handleClearCompleted}
                      className="text-xs text-[#918ea2] hover:text-white transition-colors hover:underline active:scale-95"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* Completed Content: Collapsed by default */}
                <div className={`accordion-content ${completedExpanded ? '' : 'collapsed'}`}>
                  <div className="accordion-inner">
                    <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-[#292931]">
                      {completedTasks.length > 0 ? (
                        completedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            allTasks={tasks}
                            onToggleCompletion={handleToggleCompletion}
                            onDrillDown={handleDrillDown}
                            onEdit={(t) => setSelectedTaskForEdit(t)}
                            onShowDetails={(t) => setSelectedTaskForDetails(t)}
                            onAddSubtask={(t) => {
                              setCreateSubtaskParent(t);
                              setShowCreateModal(true);
                            }}
                            onAdjustParent={(t) => setSelectedTaskForAdjustParent(t)}
                            onDelete={(t) => setSelectedTaskForDelete(t)}
                          />
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-[#918ea2] bg-[#12131a]/40 rounded-xl border border-dashed border-[#292931]">
                          No completed tasks yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        ) : (
          /* =========================================================================
              PLACEHOLDER TABS (Matching Android's PlaceholderScreens.kt)
             ========================================================================= */
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col justify-center items-center text-center">
            <div className="bg-[#1a1b22] border border-[#292931] rounded-2xl p-10 max-w-lg w-full flex flex-col items-center gap-4 shadow-xl animate-entrance">
              <div className="w-16 h-16 rounded-2xl bg-[#5a45ff]/20 text-[#c5c0ff] flex items-center justify-center text-3xl mb-2">
                {activeTab === 'lists' && <ListTodo className="w-8 h-8 text-[#5a45ff]" />}
                {activeTab === 'habits' && <Flame className="w-8 h-8 text-[#00f5a0]" />}
                {activeTab === 'calendar' && <CalendarIcon className="w-8 h-8 text-[#ffb77d]" />}
                {activeTab === 'analytics' && <TrendingUp className="w-8 h-8 text-[#67e8f9]" />}
              </div>
              <h2 className="text-2xl font-bold text-white font-display">
                {activeTab === 'lists' && 'Lists'}
                {activeTab === 'habits' && 'Habits Tracker'}
                {activeTab === 'calendar' && 'Calendar'}
                {activeTab === 'analytics' && 'Analytics & Insights'}
              </h2>
              <p className="text-sm text-[#918ea2] max-w-sm">
                {activeTab === 'lists' &&
                  'Organize tasks into flexible projects, shopping, and to-do lists.'}
                {activeTab === 'habits' &&
                  'Build daily streaks, monitor routines, and hit consistency targets.'}
                {activeTab === 'calendar' &&
                  'Unified monthly & weekly timeline view of all scheduled tasks.'}
                {activeTab === 'analytics' &&
                  'Weekly productivity scores, completion rates, and focus trends.'}
              </p>
              <button
                onClick={() => setActiveTab('tasks')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white text-xs font-semibold shadow-lg shadow-[#5a45ff]/25 transition-all"
              >
                Back to Tasks
              </button>
            </div>
          </main>
        )}
      </div>

      {/* =========================================================================
          MODALS & OVERLAYS
         ========================================================================= */}
      <CreateTaskModal
        isOpen={showCreateModal}
        subtaskParent={createSubtaskParent}
        defaultSection={createDefaultSection}
        onClose={() => {
          setShowCreateModal(false);
          setCreateSubtaskParent(null);
        }}
        onCreate={handleCreateTask}
      />

      <EditTaskModal
        task={selectedTaskForEdit}
        isOpen={!!selectedTaskForEdit}
        onClose={() => setSelectedTaskForEdit(null)}
        onUpdate={handleUpdateTask}
      />

      <TaskDetailsModal
        task={selectedTaskForDetails}
        allTasks={tasks}
        isOpen={!!selectedTaskForDetails}
        onClose={() => setSelectedTaskForDetails(null)}
        onEdit={(t) => setSelectedTaskForEdit(t)}
        onAddSubtask={(t) => {
          setCreateSubtaskParent(t);
          setShowCreateModal(true);
        }}
        onAdjustParent={(t) => setSelectedTaskForAdjustParent(t)}
        onDelete={(t) => setSelectedTaskForDelete(t)}
        onToggleCompletion={handleToggleCompletion}
        onDrillDown={handleDrillDown}
      />

      <AdjustParentModal
        task={selectedTaskForAdjustParent}
        allTasks={tasks}
        isOpen={!!selectedTaskForAdjustParent}
        onClose={() => setSelectedTaskForAdjustParent(null)}
        onConfirm={handleAdjustParent}
      />

      <DeleteConfirmModal
        task={selectedTaskForDelete}
        allTasks={tasks}
        isOpen={!!selectedTaskForDelete}
        onClose={() => setSelectedTaskForDelete(null)}
        onConfirm={() => {
          if (selectedTaskForDelete) {
            handleDeleteTask(selectedTaskForDelete);
          }
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        userCode={userCode}
        onClose={() => setShowSettingsModal(false)}
        onSaveUserCode={(newCode) => {
          AuthManager.setUserCode(newCode);
          setUserCode(newCode);
        }}
        onSyncNow={() => loadTasksFromSupabase()}
      />

      {/* Undo Notification Bar */}
      {undoTask && (
        <UndoDoneBar
          taskTitle={undoTask.title}
          onUndo={handleUndo}
          onDismiss={() => setUndoTask(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1a1b22] border border-[#00f5a0]/40 text-[#e3e1ec] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-entrance">
          <CheckCircle className="w-5 h-5 text-[#00f5a0]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

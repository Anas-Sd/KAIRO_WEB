import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle,
  Calendar as CalendarIcon,
  Search,
  Settings,
  RefreshCw,
  Plus,
  Filter,
  ArrowUpDown,
  ListTodo,
  Infinity,
  Menu,
  ChevronDown,
  Clock,
  LogOut,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Task, Priority, TaskSort, FilterCriteria } from './types/task';
import { SupabaseService } from './services/supabase';
import { AuthManager, UserSession } from './services/auth';
import { TaskCard } from './components/TaskCard';
import { BreadcrumbBar } from './components/BreadcrumbBar';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { AdjustParentModal } from './components/AdjustParentModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UndoDoneBar } from './components/UndoDoneBar';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { FilterModal } from './components/FilterModal';
import { SortModal } from './components/SortModal';

export const App: React.FC = () => {
  // Authentication Session
  const [session, setSession] = useState<UserSession | null>(() => AuthManager.getSession());
  const userCode = session?.code || '';

  // App Data & Loading States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Hierarchy Navigation (Android Breadcrumb Stack)
  const [breadcrumbStack, setBreadcrumbStack] = useState<Task[]>([]);

  // Search, Filter & Sort (Exact Android Match)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    selectedStatuses: [],
    selectedPriorities: [],
    selectedDate: null,
    dateRangeStart: null,
    dateRangeEnd: null,
  });
  const [sortOption, setSortOption] = useState<TaskSort>('DATE_NEAR');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showSortModal, setShowSortModal] = useState<boolean>(false);

  // Section Accordion States (Overdue & Today expanded by default, rest collapsed)
  const [overdueExpanded, setOverdueExpanded] = useState<boolean>(true);
  const [todayExpanded, setTodayExpanded] = useState<boolean>(true);
  const [upcomingExpanded, setUpcomingExpanded] = useState<boolean>(false);
  const [completedExpanded, setCompletedExpanded] = useState<boolean>(false);

  // Modals & Sheets
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createSubtaskParent, setCreateSubtaskParent] = useState<Task | null>(null);

  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [selectedTaskForAdjustParent, setSelectedTaskForAdjustParent] = useState<Task | null>(null);
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState<Task | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Undo Snack State
  const [undoTask, setUndoTask] = useState<{ id: string; title: string; previousCompleted: boolean } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  /* --------------------------------------------------------------------------
     Fetch Tasks & Supabase Realtime Subscription
     -------------------------------------------------------------------------- */
  const loadTasksFromSupabase = useCallback(
    async (code: string) => {
      if (!code) return;
      setIsSyncing(true);
      try {
        const data = await SupabaseService.fetchTasks(code);
        setTasks(data);
      } catch (err: any) {
        console.error('Failed to load from Supabase:', err);
        showToast('Error syncing with database. Check network.');
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!userCode) {
      setIsLoading(false);
      return;
    }

    loadTasksFromSupabase(userCode);

    const channel = SupabaseService.subscribeToTasks(userCode, () => {
      loadTasksFromSupabase(userCode);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userCode, loadTasksFromSupabase]);

  /* --------------------------------------------------------------------------
     Date & Time Calculations (Exact Android Match)
     -------------------------------------------------------------------------- */
  const isOverdue = useCallback((task: Task): boolean => {
    if (task.isCompleted) return false;
    if (task.dueDate && task.dueDate.toLowerCase().includes('yesterday')) return true;
    if (task.section === 'OVERDUE') return true;

    if (task.dueDateMillis) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (task.dueDateMillis < todayStart.getTime()) {
        return true;
      }
    }
    return false;
  }, []);

  const isToday = useCallback(
    (task: Task): boolean => {
      if (task.isCompleted) return false;
      if (isOverdue(task)) return false;
      if (task.dueDate && task.dueDate.toLowerCase().includes('today')) return true;
      if (task.section === 'TODAY') return true;

      if (task.dueDateMillis) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = todayStart.getTime() + 86400000;
        return task.dueDateMillis >= todayStart.getTime() && task.dueDateMillis < todayEnd;
      }
      return false;
    },
    [isOverdue]
  );

  const isTomorrow = useCallback(
    (task: Task): boolean => {
      if (task.isCompleted) return false;
      if (isOverdue(task)) return false;
      if (task.dueDate && task.dueDate.toLowerCase().includes('tomorrow')) return true;

      if (task.dueDateMillis) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrowStart = today.getTime() + 86400000;
        const tomorrowEnd = tomorrowStart + 86400000;
        return task.dueDateMillis >= tomorrowStart && task.dueDateMillis < tomorrowEnd;
      }
      return false;
    },
    [isOverdue]
  );

  const isUpcoming = useCallback(
    (task: Task): boolean => {
      if (task.isCompleted) return false;
      if (isOverdue(task)) return false;
      if (isToday(task)) return false;
      return true;
    },
    [isOverdue, isToday]
  );

  /* --------------------------------------------------------------------------
     Hierarchy Scoping & Exact Filter / Sort Engine
     -------------------------------------------------------------------------- */
  const isFilterActive = useMemo(() => {
    return (
      filterCriteria.selectedStatuses.length > 0 ||
      filterCriteria.selectedPriorities.length > 0 ||
      filterCriteria.selectedDate !== null
    );
  }, [filterCriteria]);

  const scopedTasks = useMemo(() => {
    const isSearchingOrFiltering = searchQuery.trim().length > 0 || isFilterActive;

    if (breadcrumbStack.length > 0) {
      const currentParent = breadcrumbStack[breadcrumbStack.length - 1];
      return tasks.filter((t) => t.parentId === currentParent.id);
    } else if (isSearchingOrFiltering) {
      // Global search/filter across all hierarchy levels (matching TaskViewModel.kt)
      return tasks;
    } else {
      // Root view: top-level tasks only
      return tasks.filter((t) => !t.parentId);
    }
  }, [tasks, breadcrumbStack, searchQuery, isFilterActive]);

  const filteredTasks = useMemo(() => {
    let result = [...scopedTasks];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter (Active / Completed)
    if (filterCriteria.selectedStatuses.length > 0) {
      const showActive = filterCriteria.selectedStatuses.includes('ACTIVE');
      const showCompleted = filterCriteria.selectedStatuses.includes('COMPLETED');
      result = result.filter(
        (task) => (showActive && !task.isCompleted) || (showCompleted && task.isCompleted)
      );
    }

    // 3. Priority Filter (Low / Med / High / Urgent)
    if (filterCriteria.selectedPriorities.length > 0) {
      result = result.filter((task) => filterCriteria.selectedPriorities.includes(task.priority));
    }

    // 4. Due Date Filter
    if (filterCriteria.selectedDate) {
      if (filterCriteria.selectedDate === 'TODAY') {
        result = result.filter((t) => isToday(t));
      } else if (filterCriteria.selectedDate === 'TOMORROW') {
        result = result.filter((t) => isTomorrow(t));
      } else if (filterCriteria.selectedDate === 'RANGE') {
        if (filterCriteria.dateRangeStart && filterCriteria.dateRangeEnd) {
          result = result.filter((t) => {
            const due = t.dueDateMillis || t.createdAt;
            return due >= filterCriteria.dateRangeStart! && due <= filterCriteria.dateRangeEnd!;
          });
        }
      }
    }

    // 5. Sort Order
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
  }, [scopedTasks, searchQuery, filterCriteria, sortOption, isToday, isTomorrow]);

  const overdueTasks = useMemo(() => filteredTasks.filter((t) => isOverdue(t)), [filteredTasks, isOverdue]);
  const todayTasks = useMemo(() => filteredTasks.filter((t) => isToday(t)), [filteredTasks, isToday]);
  const upcomingTasks = useMemo(() => filteredTasks.filter((t) => isUpcoming(t)), [filteredTasks, isUpcoming]);
  const completedTasks = useMemo(() => filteredTasks.filter((t) => t.isCompleted), [filteredTasks]);

  /* --------------------------------------------------------------------------
     Task CRUD Operations (Direct Supabase Sync)
     -------------------------------------------------------------------------- */
  const handleToggleCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextCompleted = !task.isCompleted;
    const updated: Task = {
      ...task,
      isCompleted: nextCompleted,
      section: nextCompleted ? 'COMPLETED' : 'TODAY',
      completedAt: nextCompleted ? Date.now() : null,
      updatedAt: Date.now(),
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

    setUndoTask({
      id: task.id,
      title: task.title,
      previousCompleted: task.isCompleted,
    });

    try {
      await SupabaseService.upsertTask(updated, userCode);
      showToast(updated.isCompleted ? 'Task completed' : 'Task marked active');
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
      section: undoTask.previousCompleted ? 'COMPLETED' : 'TODAY',
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
    const taskId = crypto.randomUUID();
    const newTask: Task = {
      id: taskId,
      title: taskData.title || '',
      notes: taskData.notes || null,
      priority: taskData.priority || 'LOW',
      dueDate: taskData.dueDate || 'Today',
      dueDateMillis: taskData.dueDateMillis ?? Date.now(),
      dueTime: taskData.dueTime || null,
      location: taskData.location || null,
      latitude: taskData.latitude ?? null,
      longitude: taskData.longitude ?? null,
      locationRadius: taskData.locationRadius ?? 500,
      attachmentName: taskData.attachmentName || null,
      attachmentUri: taskData.attachmentUri || null,
      alarmToneTitle: taskData.alarmToneTitle || 'Default Alarm Tone',
      alarmToneUri: taskData.alarmToneUri || 'default',
      isCompleted: false,
      section: taskData.section || 'TODAY',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      repeatType: taskData.repeatType || null,
      repeatDays: taskData.repeatDays || null,
      repeatDates: taskData.repeatDates || null,
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
      showToast('Error saving task to cloud');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const updatedWithTimestamp: Task = {
      ...updatedTask,
      updatedAt: Date.now(),
    };
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedWithTimestamp : t)));
    showToast('Task updated');

    try {
      await SupabaseService.upsertTask(updatedWithTimestamp, userCode);
    } catch (err) {
      console.error('Supabase update failed:', err);
      showToast('Error saving update to cloud');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const toDeleteIds: string[] = [task.id];
    const queue = [task.id];
    while (queue.length > 0) {
      const current = queue.pop()!;
      const children = tasks.filter((t) => t.parentId === current);
      children.forEach((c) => {
        toDeleteIds.push(c.id);
        queue.push(c.id);
      });
    }

    const toDeleteSet = new Set(toDeleteIds);
    setTasks((prev) => prev.filter((t) => !toDeleteSet.has(t.id)));
    showToast(`Deleted task${toDeleteIds.length > 1 ? ` and ${toDeleteIds.length - 1} subtasks` : ''}`);

    try {
      await SupabaseService.deleteTasks(toDeleteIds, userCode);
    } catch (err) {
      console.error('Supabase delete failed:', err);
      showToast('Error deleting task in cloud');
    }
  };

  const handleAdjustParent = async (newParentId: string | null) => {
    if (!selectedTaskForAdjustParent) return;

    const updated: Task = {
      ...selectedTaskForAdjustParent,
      parentId: newParentId,
      updatedAt: Date.now(),
    };

    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTaskForAdjustParent(null);
    showToast('Task moved');

    try {
      await SupabaseService.upsertTask(updated, userCode);
    } catch (err) {
      console.error('Supabase reparent failed:', err);
      showToast('Error saving change to cloud');
    }
  };

  const handleDrillDown = (task: Task) => {
    setBreadcrumbStack((prev) => [...prev, task]);
  };

  const handleNavigateBack = () => {
    setBreadcrumbStack((prev) => prev.slice(0, -1));
  };

  const handleNavigateToCrumb = (index: number) => {
    if (index === -1) {
      setBreadcrumbStack([]);
    } else {
      setBreadcrumbStack((prev) => prev.slice(0, index + 1));
    }
  };

  const handleLogout = () => {
    AuthManager.clearSession();
    setSession(null);
    setTasks([]);
    setBreadcrumbStack([]);
    setShowSettingsModal(false);
  };

  const getSortDisplayName = (sort: TaskSort) => {
    switch (sort) {
      case 'DATE_NEAR':
        return 'Earliest First';
      case 'DATE_LATE':
        return 'Latest First';
      case 'PRIORITY_HIGH':
        return 'High Priority';
      case 'PRIORITY_LOW':
        return 'Low Priority';
      case 'TITLE_AZ':
        return 'Name (A-Z)';
      case 'TITLE_ZA':
        return 'Name (Z-A)';
    }
  };

  if (!session) {
    return (
      <LoginScreen
        onLoginSuccess={(newSession) => {
          setSession(newSession);
        }}
      />
    );
  }

  const currentParentTask = breadcrumbStack.length > 0 ? breadcrumbStack[breadcrumbStack.length - 1] : null;

  return (
    <div className="flex w-full min-h-screen bg-[#12131a] text-[#e3e1ec]">
      {/* =========================================================================
          DESKTOP SIDEBAR
         ========================================================================= */}
      <aside
        className={`fixed left-0 top-0 h-screen ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-[#1a1b22] border-r border-[#292931] z-40 flex flex-col justify-between p-4 shadow-xl transition-all duration-200 hidden md:flex`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5a45ff] to-[#00f5a0] flex items-center justify-center shadow-lg shadow-[#5a45ff]/20 flex-shrink-0">
                <Infinity className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <h1 className="font-display font-bold text-base tracking-wider text-white">KAIRO</h1>
                  <span className="text-[10px] text-[#918ea2] uppercase tracking-wider font-mono">
                    {userCode}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-lg text-[#918ea2] hover:text-white hover:bg-[#292931] transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#5a45ff]/15 text-[#c5c0ff] border border-[#5a45ff]/30 shadow-sm transition-all`}
            >
              <ListTodo className="w-4 h-4 text-[#5a45ff] flex-shrink-0" />
              {!sidebarCollapsed && <span>Tasks</span>}
              {!sidebarCollapsed && tasks.length > 0 && (
                <span className="ml-auto bg-[#5a45ff]/30 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {tasks.filter((t) => !t.isCompleted).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-[#292931]">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#c8c4d9] hover:bg-[#292931] hover:text-white transition-colors"
            title="Settings & Workspace"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#ffb4ab] hover:bg-[#93000a]/20 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE CONTENT
         ========================================================================= */}
      <main
        className={`flex-1 min-h-screen ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } flex flex-col transition-all duration-200`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#12131a]/95 backdrop-blur border-b border-[#292931] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-bold font-display text-white tracking-tight truncate">
              {currentParentTask ? currentParentTask.title : 'Tasks'}
            </h2>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1b22] border border-[#292931] text-[11px] text-[#c8c4d9]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0]" />
              <span className="font-mono text-white font-medium">{userCode}</span>
            </div>

            {isSyncing && (
              <div className="flex items-center gap-1 text-[11px] text-[#918ea2]">
                <RefreshCw className="w-3 h-3 animate-spin text-[#5a45ff]" />
                <span className="hidden sm:inline">Syncing...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTasksFromSupabase(userCode)}
              disabled={isSyncing}
              className="p-2 rounded-xl bg-[#1a1b22] border border-[#292931] hover:bg-[#292931] text-[#c8c4d9] hover:text-white transition-all disabled:opacity-50"
              title="Refresh tasks from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-[#1a1b22] border border-[#292931] hover:bg-[#292931] text-[#c8c4d9] hover:text-white transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCreateSubtaskParent(currentParentTask);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#5a45ff] hover:bg-[#6e5aff] text-white text-xs font-semibold shadow-md shadow-[#5a45ff]/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{currentParentTask ? 'Add Subtask' : 'Add Task'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto flex flex-col gap-5">
          {breadcrumbStack.length > 0 && (
            <BreadcrumbBar
              breadcrumbStack={breadcrumbStack}
              onNavigateBack={handleNavigateBack}
              onNavigateToCrumb={handleNavigateToCrumb}
            />
          )}

          {/* =============================================================
              EXACT ANDROID FilterSortBar + Search Input
             ============================================================= */}
          <div className="flex flex-col gap-2.5">
            {/* Search Input Bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#918ea2] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, notes, locations..."
                className="w-full bg-[#1a1b22] border border-[#292931] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#918ea2] focus:border-[#5a45ff] outline-none transition-all"
              />
            </div>

            {/* Filter & Sort Bar (Matching FilterSortBar.kt) */}
            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFilterModal(true)}
                className={`h-11 px-4 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isFilterActive
                    ? 'bg-[#1a1b22] border-[#5a45ff] text-white'
                    : 'bg-[#1a1b22] border-[#292931] text-[#c8c4d9] hover:border-[#5a45ff]/40'
                }`}
              >
                <Filter className={`w-4 h-4 ${isFilterActive ? 'text-[#5a45ff]' : 'text-[#c8c4d9]'}`} />
                <span>Filter</span>
                {isFilterActive && <span className="w-2 h-2 rounded-full bg-[#5a45ff]" />}
              </button>

              {/* Sort Button */}
              <button
                type="button"
                onClick={() => setShowSortModal(true)}
                className="flex-1 h-11 px-4 rounded-2xl bg-[#1a1b22] border border-[#292931] hover:border-[#5a45ff]/40 text-xs font-medium text-white flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <ArrowUpDown className="w-4 h-4 text-[#5a45ff] flex-shrink-0" />
                  <span className="truncate">{getSortDisplayName(sortOption)}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#918ea2] flex-shrink-0" />
              </button>

              {/* Reset Filter Button (Active when filter criteria applied) */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() =>
                    setFilterCriteria({
                      selectedStatuses: [],
                      selectedPriorities: [],
                      selectedDate: null,
                      dateRangeStart: null,
                      dateRangeEnd: null,
                    })
                  }
                  className="h-11 px-3 rounded-2xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="flex flex-col gap-3 py-12 items-center justify-center text-[#918ea2]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#5a45ff]" />
              <p className="text-xs">Loading tasks from Supabase...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* 1. OVERDUE SECTION (Expanded by default) */}
              {overdueTasks.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOverdueExpanded(!overdueExpanded)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#93000a]/15 border border-[#ffb4ab]/20 hover:bg-[#93000a]/25 text-[#ffb4ab] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#93000a]/40 text-[#ffdad6] text-[10px] font-mono font-bold">
                        {overdueTasks.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        overdueExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {overdueExpanded && (
                    <div className="flex flex-col gap-2 pl-1 animate-entrance">
                      {overdueTasks.map((task) => (
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
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* 2. TODAY SECTION (Expanded by default) */}
              <section className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setTodayExpanded(!todayExpanded)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1e1f26] border border-[#292931] hover:border-[#5a45ff]/40 text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#5a45ff]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Today</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#292931] text-[#c8c4d9] text-[10px] font-mono font-bold">
                      {todayTasks.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#918ea2] transition-transform duration-200 ${
                      todayExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {todayExpanded && (
                  <div className="flex flex-col gap-2 pl-1 animate-entrance">
                    {todayTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#918ea2] border border-dashed border-[#292931] rounded-2xl">
                        No tasks due today. Enjoy your day or add a new task!
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}
              </section>

              {/* 3. UPCOMING SECTION (Collapsed by default) */}
              {upcomingTasks.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUpcomingExpanded(!upcomingExpanded)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1e1f26] border border-[#292931] hover:border-[#5a45ff]/40 text-[#c8c4d9] hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00f5a0]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Upcoming</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#292931] text-[#c8c4d9] text-[10px] font-mono font-bold">
                        {upcomingTasks.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#918ea2] transition-transform duration-200 ${
                        upcomingExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {upcomingExpanded && (
                    <div className="flex flex-col gap-2 pl-1 animate-entrance">
                      {upcomingTasks.map((task) => (
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
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* 4. COMPLETED SECTION (Collapsed by default) */}
              {completedTasks.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCompletedExpanded(!completedExpanded)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1e1f26] border border-[#292931] hover:border-[#5a45ff]/40 text-[#918ea2] hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00f5a0]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#292931] text-[#918ea2] text-[10px] font-mono font-bold">
                        {completedTasks.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#918ea2] transition-transform duration-200 ${
                        completedExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {completedExpanded && (
                    <div className="flex flex-col gap-2 pl-1 animate-entrance opacity-85">
                      {completedTasks.map((task) => (
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
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        {/* Mobile Floating Add Task Button */}
        <button
          onClick={() => {
            setCreateSubtaskParent(currentParentTask);
            setShowCreateModal(true);
          }}
          className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full bg-[#5a45ff] text-white flex items-center justify-center shadow-2xl shadow-[#5a45ff]/50 hover:bg-[#6e5aff] active:scale-95 transition-all z-30"
          title="Add Task"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </main>

      {/* =========================================================================
          MODALS & OVERLAYS
         ========================================================================= */}
      {/* Create Task Modal (Exact Android Match) */}
      <CreateTaskModal
        isOpen={showCreateModal}
        subtaskParent={createSubtaskParent}
        allTasks={tasks}
        onClose={() => {
          setShowCreateModal(false);
          setCreateSubtaskParent(null);
        }}
        onCreate={handleCreateTask}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={selectedTaskForEdit}
        allTasks={tasks}
        isOpen={!!selectedTaskForEdit}
        onClose={() => setSelectedTaskForEdit(null)}
        onUpdate={handleUpdateTask}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTaskForDetails}
        allTasks={tasks}
        isOpen={!!selectedTaskForDetails}
        onClose={() => setSelectedTaskForDetails(null)}
        onEdit={(task) => {
          setSelectedTaskForDetails(null);
          setSelectedTaskForEdit(task);
        }}
        onDelete={(task) => {
          setSelectedTaskForDetails(null);
          setSelectedTaskForDelete(task);
        }}
        onAddSubtask={(task) => {
          setSelectedTaskForDetails(null);
          setCreateSubtaskParent(task);
          setShowCreateModal(true);
        }}
        onAdjustParent={(task) => {
          setSelectedTaskForDetails(null);
          setSelectedTaskForAdjustParent(task);
        }}
        onToggleCompletion={handleToggleCompletion}
        onDrillDown={(task) => {
          setSelectedTaskForDetails(null);
          handleDrillDown(task);
        }}
      />

      {/* Adjust Parent / Move Task Modal */}
      <AdjustParentModal
        task={selectedTaskForAdjustParent}
        allTasks={tasks}
        isOpen={!!selectedTaskForAdjustParent}
        onClose={() => setSelectedTaskForAdjustParent(null)}
        onConfirm={handleAdjustParent}
      />

      {/* Delete Confirmation Modal */}
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

      {/* Settings Modal (User details + Logout) */}
      <SettingsModal
        isOpen={showSettingsModal}
        userCode={userCode}
        userName={session.name}
        onClose={() => setShowSettingsModal(false)}
        onLogout={handleLogout}
      />

      {/* Exact Android Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        initialFilter={filterCriteria}
        onApplyFilter={(criteria) => setFilterCriteria(criteria)}
        onClose={() => setShowFilterModal(false)}
      />

      {/* Exact Android Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        initialSort={sortOption}
        onApplySort={(sort) => setSortOption(sort)}
        onClose={() => setShowSortModal(false)}
      />

      {/* Undo Action Bar */}
      {undoTask && (
        <UndoDoneBar
          taskTitle={undoTask.title}
          onUndo={handleUndo}
          onDismiss={() => setUndoTask(null)}
        />
      )}

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e1f26] border border-[#5a45ff]/40 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-entrance flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

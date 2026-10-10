export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskSection = 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED';

export type StatusFilter = 'ACTIVE' | 'COMPLETED';
export type DateFilter = 'TODAY' | 'TOMORROW' | 'RANGE';

export interface FilterCriteria {
  selectedStatuses: StatusFilter[];
  selectedPriorities: Priority[];
  selectedDate: DateFilter | null;
  dateRangeStart: number | null;
  dateRangeEnd: number | null;
}

export type TaskSort =
  | 'DATE_NEAR'
  | 'DATE_LATE'
  | 'PRIORITY_HIGH'
  | 'PRIORITY_LOW'
  | 'TITLE_AZ'
  | 'TITLE_ZA';

export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  priority: Priority;
  dueDate: string;
  dueDateMillis?: number | null;
  dueTime?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationRadius?: number;
  attachmentName?: string | null;
  attachmentUri?: string | null;
  isCompleted: boolean;
  section: TaskSection;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  alarmToneUri?: string | null;
  alarmToneTitle?: string | null;
  repeatType?: string | null;
  repeatDays?: string | null;
  repeatDates?: string | null;
  parentId?: string | null;
  position: number;
  user_code?: string;
}

export interface TaskDto {
  id: string;
  title: string;
  notes?: string | null;
  priority: string;
  due_date: string;
  due_date_millis?: number | null;
  due_time?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number | null;
  attachment_name?: string | null;
  attachment_uri?: string | null;
  is_completed: boolean;
  section: string;
  created_at: number;
  updated_at: number;
  completed_at?: number | null;
  alarm_tone_uri?: string | null;
  alarm_tone_title?: string | null;
  repeat_type?: string | null;
  repeat_days?: string | null;
  repeat_dates?: string | null;
  parent_id?: string | null;
  position: number;
  user_code?: string;
}

export function fromDto(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    notes: dto.notes ?? null,
    priority: (dto.priority?.toUpperCase() as Priority) || 'LOW',
    dueDate: dto.due_date || 'Today',
    dueDateMillis: dto.due_date_millis ?? null,
    dueTime: dto.due_time ?? null,
    location: dto.location ?? null,
    latitude: dto.latitude ?? null,
    longitude: dto.longitude ?? null,
    locationRadius: dto.radius_meters ?? 500,
    attachmentName: dto.attachment_name ?? null,
    attachmentUri: dto.attachment_uri ?? null,
    isCompleted: !!dto.is_completed,
    section: (dto.section?.toUpperCase() as TaskSection) || 'TODAY',
    createdAt: dto.created_at || Date.now(),
    updatedAt: dto.updated_at || Date.now(),
    completedAt: dto.completed_at ?? null,
    alarmToneUri: dto.alarm_tone_uri ?? null,
    alarmToneTitle: dto.alarm_tone_title ?? null,
    repeatType: dto.repeat_type ?? null,
    repeatDays: dto.repeat_days ?? null,
    repeatDates: dto.repeat_dates ?? null,
    parentId: dto.parent_id ?? null,
    position: dto.position ?? 0,
    user_code: dto.user_code,
  };
}

export function toDto(task: Task, userCode: string): TaskDto {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes ?? null,
    priority: task.priority,
    due_date: task.dueDate,
    due_date_millis: task.dueDateMillis ?? null,
    due_time: task.dueTime ?? null,
    location: task.location ?? null,
    latitude: task.latitude ?? null,
    longitude: task.longitude ?? null,
    radius_meters: task.locationRadius ?? 500,
    attachment_name: task.attachmentName ?? null,
    attachment_uri: task.attachmentUri ?? null,
    is_completed: task.isCompleted,
    section: task.section,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt ?? null,
    alarm_tone_uri: task.alarmToneUri ?? null,
    alarm_tone_title: task.alarmToneTitle ?? null,
    repeat_type: task.repeatType ?? null,
    repeat_days: task.repeatDays ?? null,
    repeat_dates: task.repeatDates ?? null,
    parent_id: task.parentId ?? null,
    position: task.position ?? 0,
    user_code: userCode,
  };
}

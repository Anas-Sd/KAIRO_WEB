import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Task, TaskDto, fromDto, toDto } from '../types/task';

export const SUPABASE_URL = 'https://lswzgwzbvuiolkzvyrof.supabase.co';
export const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3pnd3pidnVpb2xrenZ5cm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3ODIxMzIsImV4cCI6MjEwNjM1ODEzMn0.u7iQyOKyjKPblLtDYgoiLAHv4p01lEU2LD5HQQ9-7SA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const SupabaseService = {
  async fetchTasks(userCode: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_code', userCode)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching tasks from Supabase:', error);
      throw error;
    }

    return (data || []).map((row: any) => fromDto(row as TaskDto));
  },

  async upsertTask(task: Task, userCode: string): Promise<void> {
    const dto = toDto(task, userCode);
    const { error } = await supabase.from('tasks').upsert(dto, {
      onConflict: 'id',
    });

    if (error) {
      console.warn('Error upserting task in Supabase:', error);
      throw error;
    }
  },

  async upsertTasks(tasks: Task[], userCode: string): Promise<void> {
    if (tasks.length === 0) return;
    const dtos = tasks.map((t) => toDto(t, userCode));
    const { error } = await supabase.from('tasks').upsert(dtos, {
      onConflict: 'id',
    });

    if (error) {
      console.warn('Error batch upserting tasks in Supabase:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string, userCode: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_code', userCode);

    if (error) {
      console.warn('Error deleting task in Supabase:', error);
      throw error;
    }
  },

  async deleteTasks(taskIds: string[], userCode: string): Promise<void> {
    if (taskIds.length === 0) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds)
      .eq('user_code', userCode);

    if (error) {
      console.warn('Error batch deleting tasks in Supabase:', error);
      throw error;
    }
  },

  subscribeToTasks(userCode: string, onChange: () => void): RealtimeChannel {
    const channelName = `realtime-tasks-${userCode}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_code=eq.${userCode}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return channel;
  },
};

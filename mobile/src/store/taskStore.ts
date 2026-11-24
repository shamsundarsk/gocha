import { create } from 'zustand';
import { Task } from '@/types';
import { tasksApi } from '@/services/api';
import { format } from 'date-fns';

interface TaskStore {
  tasks: Task[];
  todayTasks: Task[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: (date?: string) => Promise<void>;
  createTask: (data: object) => Promise<Task>;
  parseAndCreate: (text: string, date?: string) => Promise<Task[]>;
  updateTask: (id: string, data: object) => Promise<void>;
  updateStatus: (id: string, status: string, actualDuration?: number, note?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  todayTasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (date?: string) => {
    set({ isLoading: true, error: null });
    try {
      const today = date || format(new Date(), 'yyyy-MM-dd');
      const res = await tasksApi.list({ task_date: today });
      const tasks: Task[] = res.data;
      set({ tasks, todayTasks: tasks, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createTask: async (data) => {
    const res = await tasksApi.create(data);
    const task: Task = res.data;
    set((s) => ({ tasks: [task, ...s.tasks], todayTasks: [task, ...s.todayTasks] }));
    return task;
  },

  parseAndCreate: async (text, date) => {
    const res = await tasksApi.parse(text, date);
    const newTasks: Task[] = res.data;
    set((s) => ({
      tasks: [...newTasks, ...s.tasks],
      todayTasks: [...newTasks, ...s.todayTasks],
    }));
    return newTasks;
  },

  updateTask: async (id, data) => {
    const res = await tasksApi.update(id, data);
    const updated: Task = res.data;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      todayTasks: s.todayTasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  updateStatus: async (id, status, actualDuration, note) => {
    const res = await tasksApi.updateStatus(id, status, actualDuration, note);
    const updated: Task = res.data;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      todayTasks: s.todayTasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      todayTasks: s.todayTasks.filter((t) => t.id !== id),
    }));
  },

  setTasks: (tasks) => set({ tasks, todayTasks: tasks }),
}));

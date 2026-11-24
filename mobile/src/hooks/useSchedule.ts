import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { scheduleApi } from '@/services/api';
import { ScheduleBlock } from '@/types';

interface ScheduleState {
  blocks: ScheduleBlock[];
  nextAction: ScheduleBlock | null;
  freeMinutes: number;
  isLoading: boolean;
  error: string | null;
  isDemo: boolean;
}

export function useSchedule(date?: string) {
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');
  const [state, setState] = useState<ScheduleState>({
    blocks: [],
    nextAction: null,
    freeMinutes: 0,
    isLoading: false,
    error: null,
    isDemo: false,
  });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await scheduleApi.get(targetDate);
      setState({
        blocks: res.data.blocks || [],
        nextAction: res.data.next_action || null,
        freeMinutes: res.data.free_minutes_today || 0,
        isLoading: false,
        error: null,
        isDemo: res.data.demo || false,
      });
    } catch (e: any) {
      setState((s) => ({ ...s, isLoading: false, error: e.message }));
    }
  }, [targetDate]);

  const recalculate = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await scheduleApi.recalculate(targetDate);
      setState({
        blocks: res.data.blocks || [],
        nextAction: res.data.next_action || null,
        freeMinutes: res.data.free_minutes_today || 0,
        isLoading: false,
        error: null,
        isDemo: res.data.demo || false,
      });
    } catch (e: any) {
      setState((s) => ({ ...s, isLoading: false, error: e.message }));
    }
  }, [targetDate]);

  return { ...state, fetch, recalculate };
}

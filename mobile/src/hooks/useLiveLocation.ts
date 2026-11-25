import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { contextApi } from '@/services/api';
import { LatLng } from '@/utils/geo';

const DEMO_LOCATION: LatLng = { latitude: 11.0168, longitude: 76.9558 };
const DEMO_CITY = 'Coimbatore';

interface LiveLocationState {
  coords: LatLng | null;
  city: string | null;
  granted: boolean;
  isDemo: boolean;
  loading: boolean;
  error: string | null;
}

async function currentPosition(): Promise<Location.LocationObject | null> {
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    if (last) return last;
  } catch {}

  try {
    const current = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    return await Promise.race([current, timeout]);
  } catch {
    return null;
  }
}

export function useLiveLocation() {
  const [state, setState] = useState<LiveLocationState>({
    coords: null,
    city: null,
    granted: false,
    isDemo: false,
    loading: true,
    error: null,
  });

  const mounted = useRef(true);
  const lastReport = useRef(0);
  const watch = useRef<Location.LocationSubscription | null>(null);
  const reverseDone = useRef(false);

  const applyCity = useCallback(async (coords: LatLng) => {
    if (reverseDone.current) return;
    reverseDone.current = true;
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (mounted.current) {
        setState((prev) => ({
          ...prev,
          city: place?.city || place?.district || place?.region || null,
        }));
      }
    } catch {}
  }, []);

  const report = useCallback((coords: LatLng) => {
    const now = Date.now();
    if (now - lastReport.current < 60_000) return;
    lastReport.current = now;
    contextApi
      .updateLocation(
        Math.round(coords.latitude * 100) / 100,
        Math.round(coords.longitude * 100) / 100
      )
      .catch(() => {});
  }, []);

  const start = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mounted.current) {
          setState({
            coords: DEMO_LOCATION,
            city: DEMO_CITY,
            granted: false,
            isDemo: true,
            loading: false,
            error: 'Location permission denied — using a demo location.',
          });
        }
        return;
      }

      const position = await currentPosition();
      if (!position) {
        if (mounted.current) {
          setState({
            coords: DEMO_LOCATION,
            city: DEMO_CITY,
            granted: true,
            isDemo: true,
            loading: false,
            error: 'Could not get a GPS fix — using a demo location.',
          });
        }
        return;
      }

      const coords: LatLng = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      if (mounted.current) {
        setState({
          coords,
          city: null,
          granted: true,
          isDemo: false,
          loading: false,
          error: null,
        });
      }
      applyCity(coords);
      report(coords);

      watch.current?.remove();
      watch.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10_000,
          distanceInterval: 15,
        },
        (next) => {
          if (!mounted.current) return;
          const nextCoords: LatLng = {
            latitude: next.coords.latitude,
            longitude: next.coords.longitude,
          };
          setState((prev) => ({ ...prev, coords: nextCoords, isDemo: false }));
          report(nextCoords);
        }
      );
    } catch (error: any) {
      if (mounted.current) {
        setState({
          coords: DEMO_LOCATION,
          city: DEMO_CITY,
          granted: false,
          isDemo: true,
          loading: false,
          error: error?.message || 'Location unavailable.',
        });
      }
    }
  }, [applyCity, report]);

  useEffect(() => {
    mounted.current = true;
    start();
    return () => {
      mounted.current = false;
      watch.current?.remove();
    };
  }, [start]);

  return { ...state, refresh: start, demoLocation: DEMO_LOCATION };
}

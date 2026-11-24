import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { contextApi } from '@/services/api';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  granted: boolean;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: null,
    granted: false,
    loading: false,
  });

  const requestAndFetch = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({ ...s, loading: false, granted: false }));
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = Math.round(loc.coords.latitude * 100) / 100;
      const lon = Math.round(loc.coords.longitude * 100) / 100;

      // Reverse geocode for city
      let city: string | null = null;
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        city = place?.city || place?.region || null;
      } catch {}

      setState({ latitude: lat, longitude: lon, city, granted: true, loading: false });

      // Report to backend (coarse location)
      try {
        await contextApi.updateLocation(lat, lon);
      } catch {}
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    requestAndFetch();
  }, []);

  return { ...state, refresh: requestAndFetch };
}

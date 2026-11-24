import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { Colors, FontSize, Spacing, Radius, FontWeight, Shadow } from '@/constants/theme';
import { eventsApi } from '@/services/api';
import { NearbyEvent } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'technology', label: 'Tech', emoji: '💻' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'arts', label: 'Arts', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'education', label: 'Learn', emoji: '📚' },
  { id: 'community', label: 'Community', emoji: '🤝' },
];

export default function DiscoverScreen() {
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [locationDenied, setLocationDenied] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);

  const fetchEvents = useCallback(async (lat?: number, lon?: number, cat?: string) => {
    const useLat = lat ?? userLat;
    const useLon = lon ?? userLon;
    if (!useLat || !useLon) return;

    setLoading(true);
    try {
      const params: any = { latitude: useLat, longitude: useLon, radius_km: 10 };
      const activeCat = cat ?? category;
      if (activeCat !== 'all') params.category = activeCat;
      const res = await eventsApi.getNearby(params);
      setEvents(res.data.events || []);
    } catch {}
    setLoading(false);
  }, [userLat, userLon, category]);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationDenied(true);
      // Try demo context
      await fetchWithDemoLocation();
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLat(loc.coords.latitude);
    setUserLon(loc.coords.longitude);
    await fetchEvents(loc.coords.latitude, loc.coords.longitude);
  }, [fetchEvents]);

  const fetchWithDemoLocation = async () => {
    // Use demo location (Coimbatore) for demo mode
    const lat = 11.0168;
    const lon = 76.9558;
    setUserLat(lat);
    setUserLon(lon);
    await fetchEvents(lat, lon);
  };

  useEffect(() => { requestLocation(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const handleCategoryChange = async (cat: string) => {
    setCategory(cat);
    await fetchEvents(undefined, undefined, cat);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>What's happening around you</Text>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
        style={styles.categoriesContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryPill, category === cat.id && styles.categoryPillActive]}
            onPress={() => handleCategoryChange(cat.id)}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={[styles.categoryLabel, category === cat.id && styles.categoryLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {locationDenied && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>📍 Location access denied. Showing demo events.</Text>
          </View>
        )}

        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.brand.primary} size="large" />
            <Text style={styles.loadingText}>Finding events nearby...</Text>
          </View>
        )}

        {!loading && events.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗺</Text>
            <Text style={styles.emptyTitle}>Nothing found nearby</Text>
            <Text style={styles.emptySub}>Try a different category or expand your search radius.</Text>
          </View>
        )}

        {events.map((event) => <EventCard key={event.id} event={event} />)}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({ event }: { event: NearbyEvent }) {
  const handleOpen = () => {
    if (event.source_url) Linking.openURL(event.source_url);
  };

  const startTime = new Date(event.start_time);
  const isToday = new Date().toDateString() === startTime.toDateString();

  return (
    <TouchableOpacity style={styles.eventCard} onPress={handleOpen} activeOpacity={0.85}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.eventImage} />
      ) : (
        <LinearGradient
          colors={[Colors.brand.primary + '40', Colors.brand.secondary + '40']}
          style={styles.eventImagePlaceholder}
        >
          <Text style={styles.eventImageEmoji}>
            {getCategoryEmoji(event.category)}
          </Text>
        </LinearGradient>
      )}

      <View style={styles.eventContent}>
        <View style={styles.eventTopRow}>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>📍 {event.distance_km} km</Text>
          </View>
          {event.is_free ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Free</Text>
            </View>
          ) : event.price ? (
            <Text style={styles.priceText}>₹{event.price}</Text>
          ) : null}
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>

        <View style={styles.eventMeta}>
          <Text style={styles.eventTime}>
            {isToday ? 'Today' : format(startTime, 'MMM d')} · {format(startTime, 'h:mm a')}
          </Text>
          {event.venue && <Text style={styles.eventVenue}> · {event.venue}</Text>}
        </View>

        {event.tags && event.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {event.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getCategoryEmoji(cat?: string): string {
  const map: Record<string, string> = {
    technology: '💻', music: '🎵', arts: '🎨', fitness: '🏃',
    business: '💼', food: '🍽️', education: '📚', community: '🤝',
    entertainment: '🎭', other: '📌',
  };
  return map[cat || 'other'] || '📌';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary },

  categoriesContainer: { paddingTop: Spacing.md },
  categoriesScroll: { paddingHorizontal: Spacing['2xl'], gap: Spacing.sm, paddingBottom: Spacing.md },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  categoryPillActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  categoryLabelActive: { color: Colors.white },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.sm },

  banner: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  bannerText: { fontSize: FontSize.sm, color: Colors.text.secondary },

  loadingContainer: { paddingTop: Spacing['5xl'], alignItems: 'center', gap: Spacing.base },
  loadingText: { fontSize: FontSize.base, color: Colors.text.secondary },

  empty: { alignItems: 'center', paddingTop: Spacing['5xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: 'center' },

  eventCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Shadow.sm,
  },
  eventImage: { width: '100%', height: 160 },
  eventImagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImageEmoji: { fontSize: 48 },
  eventContent: { padding: Spacing.base },
  eventTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  distanceBadge: {
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  distanceText: { fontSize: FontSize.xs, color: Colors.text.secondary },
  freeBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  freeText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold },
  priceText: { fontSize: FontSize.xs, color: Colors.text.secondary },
  eventTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  eventMeta: { flexDirection: 'row', marginBottom: Spacing.sm },
  eventTime: { fontSize: FontSize.sm, color: Colors.text.secondary },
  eventVenue: { fontSize: FontSize.sm, color: Colors.text.muted },
  tagsRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.text.muted },
});

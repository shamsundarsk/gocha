import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import {
  Colors,
  FontWeight,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { LocationMap } from '@/components/map/LocationMap';
import { EmptyState, Press } from '@/components/ui/kit';
import { eventsApi } from '@/services/api';
import { NearbyEvent } from '@/types';

const CATS = [
  { id: 'all', label: 'All', icon: 'sparkles' as const, color: Colors.brand.primary },
  { id: 'technology', label: 'Tech', icon: 'code-slash' as const, color: '#0A84FF' },
  { id: 'music', label: 'Music', icon: 'musical-notes' as const, color: '#FF375F' },
  { id: 'arts', label: 'Arts', icon: 'color-palette' as const, color: '#BF5AF2' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell' as const, color: '#30D158' },
  { id: 'business', label: 'Business', icon: 'briefcase' as const, color: '#FF9F0A' },
  { id: 'food', label: 'Food', icon: 'restaurant' as const, color: '#FF9F0A' },
  { id: 'education', label: 'Learn', icon: 'book' as const, color: '#64D2FF' },
  { id: 'community', label: 'Community', icon: 'people' as const, color: '#30D158' },
];

const CAT_COLOR: Record<string, string> = CATS.reduce((acc, c) => {
  acc[c.id] = c.color;
  return acc;
}, {} as Record<string, string>);

const CAT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  technology: 'code-slash',
  music: 'musical-notes',
  arts: 'color-palette',
  fitness: 'barbell',
  business: 'briefcase',
  food: 'restaurant',
  education: 'book',
  community: 'people',
};

function getCatIcon(cat?: string) {
  return CAT_ICON[cat || ''] || 'calendar';
}

function catLabel(cat?: string) {
  const found = CATS.find((c) => c.id === cat);
  return found ? found.label : cat ? cat[0].toUpperCase() + cat.slice(1) : 'Event';
}

export default function DiscoverScreen() {
  const live = useLiveLocation();
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');

  const fetchEvents = useCallback(
    async (cat?: string, coords = live.coords) => {
      if (!coords) return;
      setLoading(true);
      try {
        const params: any = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius_km: 15,
        };
        const selected = cat ?? category;
        if (selected !== 'all') params.category = selected;
        const res = await eventsApi.getNearby(params);
        setEvents(res.data.events || []);
      } catch {}
      setLoading(false);
    },
    [category, live.coords]
  );

  useEffect(() => {
    if (live.coords) fetchEvents(category, live.coords);
  }, [live.coords?.latitude, live.coords?.longitude, category]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([live.refresh(), fetchEvents(category, live.coords || undefined)]);
    setRefreshing(false);
  }, [live, fetchEvents, category]);

  const handleCat = (cat: string) => {
    setCategory(cat);
    fetchEvents(cat, live.coords || undefined);
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <Text style={s.eyebrow}>
            {live.city ? `Around ${live.city}` : 'Close to you'}
          </Text>
          <Text style={s.title}>Discover</Text>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.text.secondary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={s.mapWrap}>
            <LocationMap
              user={live.coords || (live.isDemo ? live.demoLocation : null)}
              city={live.city}
              height={168}
            />
            <View style={s.mapCaption} pointerEvents="none">
              <View style={s.mapDot} />
              <Text style={s.mapCaptionText}>
                {live.coords ? 'Within 15 km of you' : 'Finding your location…'}
              </Text>
            </View>
          </View>

          {live.error ? (
            <View style={s.notice}>
              <Ionicons name="location-outline" size={15} color={Colors.text.tertiary} />
              <Text style={s.noticeText}>{live.error}</Text>
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catsScroll}
            style={s.catsContainer}
          >
            {CATS.map((c) => {
              const active = category === c.id;
              return (
                <Press
                  key={c.id}
                  style={[s.chip, active && { backgroundColor: Colors.white }]}
                  onPress={() => handleCat(c.id)}
                  accessibilityLabel={c.label}
                >
                  <Ionicons
                    name={c.icon}
                    size={15}
                    color={active ? Colors.black : Colors.text.tertiary}
                  />
                  <Text style={[s.chipLabel, active && s.chipLabelActive]}>{c.label}</Text>
                </Press>
              );
            })}
          </ScrollView>

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>
              {category === 'all'
                ? 'Happening nearby'
                : `${CATS.find((c) => c.id === category)?.label} nearby`}
            </Text>
            <Text style={s.sectionHint}>{events.length} found</Text>
          </View>

          {loading && !refreshing && (
            <View style={s.loadWrap}>
              <ActivityIndicator color={Colors.text.secondary} />
              <Text style={s.loadText}>Looking around you…</Text>
            </View>
          )}

          {!loading && events.length === 0 && (
            <EmptyState
              icon="compass-outline"
              title="Nothing found nearby"
              body="Try another category, widen the radius, or check back later."
            />
          )}

          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EventCard({ event }: { event: NearbyEvent }) {
  const color = CAT_COLOR[event.category || 'all'] || Colors.brand.primary;
  const startDate = new Date(event.start_time);
  const isToday = new Date().toDateString() === startDate.toDateString();

  return (
    <Press
      style={s.card}
      onPress={() => event.source_url && Linking.openURL(event.source_url)}
      accessibilityLabel={event.title}
    >
      <View style={s.media}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={s.mediaImg} />
        ) : (
          <View style={[s.mediaPlaceholder, { backgroundColor: color + '1F' }]}>
            <Ionicons name={getCatIcon(event.category)} size={38} color={color} />
          </View>
        )}

        <View style={s.mediaTop}>
          <View style={s.catBadge}>
            <View style={[s.catDot, { backgroundColor: color }]} />
            <Text style={s.catBadgeText}>{catLabel(event.category)}</Text>
          </View>
          {event.is_free ? (
            <View style={s.priceBadge}>
              <Text style={s.priceText}>Free</Text>
            </View>
          ) : event.price ? (
            <View style={s.priceBadge}>
              <Text style={s.priceText}>₹{event.price}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={s.cardBody}>
        <View style={s.cardMain}>
          <View style={s.dateBadge}>
            <Text style={s.dateDay}>{format(startDate, 'd')}</Text>
            <Text style={s.dateMon}>{format(startDate, 'MMM')}</Text>
          </View>
          <View style={s.cardCopy}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={s.cardMeta} numberOfLines={1}>
              {isToday ? 'Today' : format(startDate, 'EEE')} · {format(startDate, 'h:mm a')}
              {event.venue ? ` · ${event.venue}` : ''}
            </Text>
          </View>
        </View>

        <View style={s.cardFooter}>
          <View style={s.distanceRow}>
            <Ionicons name="location-outline" size={13} color={Colors.text.tertiary} />
            <Text style={s.distanceText}>{event.distance_km} km away</Text>
          </View>
          <View style={s.openRow}>
            <Text style={s.openText}>Open</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.brand.secondary} />
          </View>
        </View>
      </View>
    </Press>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  title: { ...Type.largeTitle, color: Colors.text.primary },
  scroll: { paddingHorizontal: Spacing.lg },

  mapWrap: { marginBottom: Spacing.base },
  mapCaption: {
    position: 'absolute',
    left: Spacing.sm,
    bottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28,28,30,0.92)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  mapDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent.teal },
  mapCaptionText: { fontSize: 12, color: Colors.text.secondary, fontWeight: FontWeight.medium },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  noticeText: { fontSize: 13, color: Colors.text.tertiary, flex: 1 },

  catsContainer: { maxHeight: 46, marginBottom: Spacing.md },
  catsScroll: { gap: Spacing.sm, paddingRight: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.fill,
    paddingHorizontal: Spacing.base,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  chipLabelActive: { color: Colors.black, fontWeight: FontWeight.semibold },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionHint: { fontSize: 13, color: Colors.text.tertiary },

  loadWrap: { paddingVertical: Spacing['4xl'], alignItems: 'center', gap: Spacing.md },
  loadText: { fontSize: 14, color: Colors.text.tertiary },

  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  media: { height: 176 },
  mediaImg: { width: '100%', height: '100%' },
  mediaPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  mediaTop: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.60)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catBadgeText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  priceBadge: {
    backgroundColor: 'rgba(0,0,0,0.60)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  priceText: { fontSize: 12, fontWeight: FontWeight.semibold, color: Colors.text.primary },

  cardBody: { padding: Spacing.base, gap: Spacing.md },
  cardMain: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  dateBadge: {
    width: 44,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.fill,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 21,
  },
  dateMon: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
  },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },
  cardMeta: { fontSize: 13, color: Colors.text.tertiary },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 13, color: Colors.text.tertiary },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openText: { fontSize: 14, fontWeight: FontWeight.semibold, color: Colors.brand.secondary },
});

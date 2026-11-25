import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import {
  LatLng,
  TILE_SIZE,
  clamp,
  haversineMeters,
  metersPerPixel,
  midpoint,
  worldPixel,
} from '@/utils/geo';

interface LocationMapProps {
  user: LatLng | null;
  destination?: LatLng | null;
  radiusMeters?: number;
  city?: string | null;
  locked?: boolean;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  dimmed?: boolean;
}

function tileUrl(x: number, y: number, zoom: number): string {
  // Esri's keyless dark basemap: real street network with labels, tuned for dark UI.
  return `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${y}/${x}`;
}

export function LocationMap({
  user,
  destination,
  radiusMeters = 130,
  city,
  locked,
  height = 300,
  style,
  children,
  dimmed,
}: LocationMapProps) {
  const window = useWindowDimensions();
  const [width, setWidth] = useState(Math.max(280, window.width - 48));
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const distance = user && destination ? haversineMeters(user, destination) : 0;

  const zoom = useMemo(() => {
    if (!destination || !user) return 16;
    if (distance > 6000) return 12;
    if (distance > 2600) return 13;
    if (distance > 1200) return 14;
    if (distance > 550) return 15;
    return 16;
  }, [destination, user, distance]);

  const center = useMemo<LatLng | null>(() => {
    if (user && destination && distance > 320) {
      return midpoint(user, destination);
    }
    return user || destination || null;
  }, [user, destination, distance]);

  const map = useMemo(() => {
    if (!center) return null;

    const centerWorld = worldPixel(center, zoom);
    const scale = metersPerPixel(center.latitude, zoom);
    const n = Math.pow(2, zoom);
    const centerTileX = Math.floor(centerWorld.x / TILE_SIZE);
    const centerTileY = Math.floor(centerWorld.y / TILE_SIZE);

    const tiles: Array<{ key: string; x: number; y: number; left: number; top: number }> = [];
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const tileX = centerTileX + dx;
        const tileY = centerTileY + dy;
        if (tileY < 0 || tileY >= n) continue;
        const wrappedX = ((tileX % n) + n) % n;
        tiles.push({
          key: `${zoom}-${tileX}-${tileY}`,
          x: wrappedX,
          y: tileY,
          left: tileX * TILE_SIZE - centerWorld.x + width / 2,
          top: tileY * TILE_SIZE - centerWorld.y + height / 2,
        });
      }
    }

    const screenOf = (coordinate: LatLng) => {
      const p = worldPixel(coordinate, zoom);
      return {
        x: p.x - centerWorld.x + width / 2,
        y: p.y - centerWorld.y + height / 2,
      };
    };

    const userPoint = user ? screenOf(user) : null;
    const destinationPoint = destination ? screenOf(destination) : null;
    const radiusPx = clamp(radiusMeters / scale, 10, 240);

    let route: string | null = null;
    if (userPoint && destinationPoint) {
      const dx = destinationPoint.x - userPoint.x;
      const dy = destinationPoint.y - userPoint.y;
      const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const bend = clamp(length * 0.18, 16, 90);
      const controlX = (userPoint.x + destinationPoint.x) / 2 - (dy / length) * bend;
      const controlY = (userPoint.y + destinationPoint.y) / 2 + (dx / length) * bend;
      route = `M ${userPoint.x} ${userPoint.y} Q ${controlX} ${controlY} ${destinationPoint.x} ${destinationPoint.y}`;
    }

    return { tiles, userPoint, destinationPoint, radiusPx, route, scale };
  }, [center, zoom, width, height, user, destination, radiusMeters]);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0 && Math.abs(next - width) > 1) setWidth(next);
  };

  return (
    <View style={[styles.root, { height }, style]} onLayout={onLayout}>
      <View style={styles.fallback}>
        <Svg width="100%" height="100%" viewBox="0 0 360 300">
          <Rect x="0" y="0" width="360" height="300" fill="#07070A" />
          <Rect x="28" y="52" width="104" height="74" rx="14" fill="#10251F" opacity="0.7" />
          <Rect x="238" y="178" width="96" height="86" rx="16" fill="#101E2A" opacity="0.7" />
          <Path d="M -20 78 L 390 118" stroke="#1E2536" strokeWidth="12" />
          <Path d="M -20 78 L 390 118" stroke="#2B3245" strokeWidth="1.5" />
          <Path d="M 92 -20 L 138 330" stroke="#1A2130" strokeWidth="9" />
          <Path d="M 92 -20 L 138 330" stroke="#2B3245" strokeWidth="1.2" />
          <Path d="M 238 -20 L 208 330" stroke="#171E2C" strokeWidth="7" />
          <Path d="M -20 220 L 390 198" stroke="#1A2130" strokeWidth="8" />
          <Path d="M 0 268 L 360 252" stroke="#151B28" strokeWidth="4" />
        </Svg>
      </View>

      {map?.tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tileUrl(tile.x, tile.y, zoom) }}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
          fadeDuration={0}
        />
      ))}

      <View style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />

      {map && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {map.destinationPoint && (
            <>
              <Circle
                cx={map.destinationPoint.x}
                cy={map.destinationPoint.y}
                r={map.radiusPx}
                fill={Colors.emotion.snap + '12'}
                stroke={Colors.emotion.snap + '99'}
                strokeWidth={1.4}
                strokeDasharray="6 7"
              />
              <Circle
                cx={map.destinationPoint.x}
                cy={map.destinationPoint.y}
                r={map.radiusPx * 0.55}
                fill={Colors.emotion.snap + '0C'}
                stroke={Colors.emotion.snap + '33'}
                strokeWidth={1}
              />
            </>
          )}
          {map.route && (
            <>
              <Path
                d={map.route}
                stroke={Colors.brand.primary + '40'}
                strokeWidth={7}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={map.route}
                stroke={Colors.brand.secondary}
                strokeWidth={2.4}
                fill="none"
                strokeLinecap="round"
                strokeDasharray="3 7"
              />
            </>
          )}
        </Svg>
      )}

      {map?.userPoint && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.userPulse,
              {
                left: map.userPoint.x - 26,
                top: map.userPoint.y - 26,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.8] }) },
                ],
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[styles.userHalo, { left: map.userPoint.x - 15, top: map.userPoint.y - 15 }]}
          >
            <View style={styles.userDot} />
          </View>
        </>
      )}

      {map?.destinationPoint && (
        <View
          pointerEvents="none"
          style={[
            styles.destinationPin,
            { left: map.destinationPoint.x - 19, top: map.destinationPoint.y - 19 },
          ]}
        >
          <Ionicons name={locked ? 'lock-closed' : 'flag'} size={16} color={Colors.black} />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.16)', 'rgba(0,0,0,0)']}
        style={[StyleSheet.absoluteFill, { bottom: height * 0.62 }]}
        pointerEvents="none"
      />

      <View style={styles.topRow} pointerEvents="none">
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
          {city ? <Text style={styles.cityText} numberOfLines={1}>· {city}</Text> : null}
        </View>

        {locked ? (
          <View style={styles.lockChip}>
            <Ionicons name="lock-closed" size={10} color={Colors.emotion.snap} />
            <Text style={styles.lockText}>Location locked</Text>
          </View>
        ) : (
          <View style={styles.radiusChip}>
            <Text style={styles.radiusText}>You are here</Text>
          </View>
        )}
      </View>

      {!center && (
        <View style={styles.loading} pointerEvents="none">
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Finding your location…</Text>
        </View>
      )}

      {dimmed && <View style={[StyleSheet.absoluteFill, styles.dim]} pointerEvents="none" />}

      {children}

      <Text style={styles.attribution}>© Esri · OpenStreetMap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.bg.map,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...Shadow.md,
  },
  fallback: { ...StyleSheet.absoluteFillObject },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#07070A',
  },
  tint: { backgroundColor: 'rgba(0,0,0,0.14)' },
  dim: { backgroundColor: 'rgba(0,0,0,0.58)' },

  userPulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.primary + '55',
  },
  userHalo: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.brand.primary + '35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white + 'AA',
  },
  userDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.brand.secondary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  destinationPin: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.emotion.snap,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.md,
  },
  destinationEmoji: { fontSize: 16 },

  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16,16,18,0.82)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    maxWidth: '62%',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent.teal },
  liveText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.accent.teal, letterSpacing: 0.3 },
  cityText: { fontSize: 11, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56,189,248,0.16)',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.38)',
  },
  
  lockText: { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.emotion.snap },
  radiusChip: {
    backgroundColor: 'rgba(16,16,18,0.82)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  radiusText: { fontSize: 11, fontWeight: FontWeight.medium, color: Colors.text.secondary },

  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.brand.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },

  attribution: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    fontSize: 8,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
});

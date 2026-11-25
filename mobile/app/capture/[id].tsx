import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, FontWeight, Gradient, Radius, Spacing, Shadow } from '@/constants/theme';
import { useMissionStore } from '@/store/missionStore';
import { useTaskStore } from '@/store/taskStore';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { clamp, formatDistance, haversineMeters } from '@/utils/geo';

const DEMO_PHOTO =
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80';

export default function CaptureScreen() {
  const params = useLocalSearchParams<{ id: string; demo?: string }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;
  const demoParam = Array.isArray(params.demo) ? params.demo[0] : params.demo;

  const { missions, getMission, capturePhoto, createMission, hydrate, hydrated } = useMissionStore();
  const { tasks, updateStatus } = useTaskStore();
  const live = useLiveLocation();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [demoArrival, setDemoArrival] = useState(demoParam === '1');
  const [saving, setSaving] = useState(false);

  const task = tasks.find((t) => t.id === taskId) || null;
  const mission = taskId ? missions[taskId] || getMission(taskId) : undefined;

  useEffect(() => {
    if (hydrated && !mission && task && live.coords) {
      createMission(task, live.coords);
    }
  }, [hydrated, mission, task, live.coords, createMission]);

  const distance =
    mission && live.coords ? haversineMeters(live.coords, mission.destination) : null;
  const inRange = demoArrival || (!!mission && distance !== null && distance <= mission.radiusMeters);
  const progress =
    mission && distance !== null
      ? clamp(
          (mission.startDistanceMeters - distance) /
            Math.max(1, mission.startDistanceMeters - mission.radiusMeters),
          0,
          1
        )
      : 0;

  const canCapture = useMemo(
    () => !!permission?.granted && inRange && cameraReady && !capturing && !photo && !cameraError,
    [permission, inRange, cameraReady, capturing, photo, cameraError]
  );

  const capture = async () => {
    if (!cameraRef.current || !canCapture) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.72,
        skipProcessing: false,
      });
      if (shot?.uri) {
        setPhoto(shot.uri);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'Could not take the photo.' });
    } finally {
      setCapturing(false);
    }
  };

  const usePhoto = async () => {
    if (!photo || !taskId) return;
    setSaving(true);
    try {
      await capturePhoto(taskId, photo, mission?.title || task?.title);
      try {
        await updateStatus(taskId, 'completed');
      } catch {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: 'success',
        text1: 'Moment captured',
        text2: 'Task completed. Your proof is in Day Wrapped.',
      });
      router.back();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'Could not save the photo.' });
    } finally {
      setSaving(false);
    }
  };

  const useDemoFrame = () => {
    setCameraError(null);
    setPhoto(DEMO_PHOTO);
  };

  const close = () => router.back();

  return (
    <View style={s.root}>
      {!photo && permission?.granted && !cameraError ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(event: any) => setCameraError(event?.message || 'Camera unavailable.')}
        />
      ) : photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.black }]} />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.90)', 'rgba(0,0,0,0)']}
        style={s.topFade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.96)']}
        style={s.bottomFade}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={close} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <Text style={s.eyebrow}>Proof of moment</Text>
            <Text style={s.title} numberOfLines={1}>{mission?.placeName || 'Your mission'}</Text>
          </View>
          <View style={s.lockChip}>
            <Text style={s.lockChipText}>{inRange ? 'Unlocked' : 'Locked'}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom panel */}
        <View style={s.panel}>
          {!permission ? (
            <View style={s.permissionCard}>
              <Ionicons name="camera-outline" size={34} color={Colors.brand.primary} />
              <Text style={s.permissionTitle}>Camera permission needed</Text>
              <Text style={s.permissionSub}>
                Gocha only opens the camera when you reach the locked finish line.
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={s.permissionCard}>
              <Ionicons name="lock-open-outline" size={30} color={Colors.brand.primary} />
              <Text style={s.permissionTitle}>Allow the camera</Text>
              <Text style={s.permissionSub}>
                We use it to capture one photo at the finish line — your proof of the day.
              </Text>
              <TouchableOpacity style={s.permissionBtn} onPress={requestPermission} activeOpacity={0.85}>
                <Text style={s.permissionBtnText}>Allow camera</Text>
              </TouchableOpacity>
            </View>
          ) : cameraError ? (
            <View style={s.permissionCard}>
              <Ionicons name="warning-outline" size={30} color={Colors.accent.amber} />
              <Text style={s.permissionTitle}>Camera unavailable here</Text>
              <Text style={s.permissionSub}>
                This looks like a simulator. Use a demo frame to test the full capture flow.
              </Text>
              <TouchableOpacity style={s.permissionBtn} onPress={useDemoFrame} activeOpacity={0.85}>
                <Text style={s.permissionBtnText}>Use demo frame</Text>
              </TouchableOpacity>
            </View>
          ) : photo ? (
            <View style={s.reviewWrap}>
              <Text style={s.reviewTitle}>This is your proof.</Text>
              <Text style={s.reviewSub}>Keep it, or retake it. One honest moment is enough.</Text>
              <View style={s.reviewActions}>
                <TouchableOpacity
                  style={s.retakeBtn}
                  onPress={() => setPhoto(null)}
                  activeOpacity={0.8}
                  disabled={saving}
                >
                  <Text style={s.retakeText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.useBtn, saving && { opacity: 0.6 }]}
                  onPress={usePhoto}
                  activeOpacity={0.86}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={s.useText}>Use photo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={s.missionRow}>
                <View style={s.missionEmojiWrap}>
                  <Ionicons name="flag-outline" size={18} color={Colors.brand.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.missionTitle} numberOfLines={1}>
                    {mission?.title || 'Locked mission'}
                  </Text>
                  <Text style={s.missionMeta}>
                    {inRange
                      ? demoArrival && !(distance !== null && distance <= (mission?.radiusMeters || 0))
                        ? 'Demo arrival enabled'
                        : 'You are inside the unlock zone'
                      : `${formatDistance(distance || 0)} away · get within ${mission?.radiusMeters || 130}m`}
                  </Text>
                </View>
                <View style={[s.statePill, inRange && s.statePillReady]}>
                  <Text style={[s.stateText, inRange && s.stateTextReady]}>
                    {inRange ? 'Ready' : 'Locked'}
                  </Text>
                </View>
              </View>

              {!inRange ? (
                <>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                  <Text style={s.lockHint}>
                    The camera unlocks when you are within {mission?.radiusMeters || 130}m of the pin.
                  </Text>
                  <View style={s.lockActions}>
                    <TouchableOpacity
                      style={s.checkBtn}
                      onPress={() => live.refresh()}
                      activeOpacity={0.8}
                    >
                      <Text style={s.checkBtnText}>Check my location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.demoBtn}
                      onPress={() => setDemoArrival(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.demoBtnText}>Demo arrival</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.readyHint}>
                    {demoArrival
                      ? 'Demo arrival is on. Take the shot.'
                      : 'You made it. Take the shot — this becomes your proof.'}
                  </Text>
                  <View style={s.shutterRow}>
                    <View style={s.shutterSide} />
                    <TouchableOpacity
                      style={[s.shutter, !canCapture && s.shutterDisabled]}
                      onPress={capture}
                      activeOpacity={0.8}
                      disabled={!canCapture}
                    >
                      {capturing ? (
                        <ActivityIndicator color={Colors.black} />
                      ) : (
                        <View style={s.shutterInner} />
                      )}
                    </TouchableOpacity>
                    <View style={s.shutterSide}>
                      {cameraError ? (
                        <TouchableOpacity onPress={useDemoFrame}>
                          <Text style={s.demoFrameText}>Demo frame</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  {!cameraReady && !cameraError ? (
                    <Text style={s.cameraHint}>Warming up the camera…</Text>
                  ) : null}
                </>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  safe: { flex: 1 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 360 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.fill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 17, color: Colors.white, fontWeight: FontWeight.bold },
  titleWrap: { flex: 1 },
  eyebrow: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.emotion.snap,
  },
  title: { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.3 },
  lockChip: {
    backgroundColor: Colors.fill,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lockChipText: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.white },

  panel: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(18,18,20,0.94)',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: Spacing.base,
    ...Shadow.lg,
  },

  permissionCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  permissionEmoji: { fontSize: 32 },
  permissionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  permissionSub: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  permissionBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  permissionBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },

  missionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  missionEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.emotion.snap + '18',
    borderWidth: 1,
    borderColor: Colors.emotion.snap + '38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionEmoji: { fontSize: 18 },
  missionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  missionMeta: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 1 },
  statePill: {
    backgroundColor: Colors.emotion.snap + '18',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.emotion.snap + '38',
  },
  statePillReady: {
    backgroundColor: Colors.accent.teal + '1C',
    borderColor: Colors.accent.teal + '55',
  },
  stateText: { fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 1, color: Colors.emotion.snap },
  stateTextReady: { color: Colors.accent.teal },

  progressTrack: {
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    marginTop: Spacing.base,
  },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.brand.primary },
  lockHint: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
    lineHeight: 17,
    textAlign: 'center',
  },
  lockActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  checkBtn: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  checkBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  demoBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  demoBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary },

  readyHint: {
    fontSize: FontSize.xs,
    color: Colors.accent.teal,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 17,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  shutterSide: { flex: 1, alignItems: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  shutterDisabled: { opacity: 0.45 },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.white,
  },
  demoFrameText: { fontSize: FontSize.xs, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  cameraHint: { fontSize: FontSize.xs, color: Colors.text.muted, textAlign: 'center', marginTop: Spacing.sm },

  reviewWrap: { gap: Spacing.sm },
  reviewTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.text.primary },
  reviewSub: { fontSize: FontSize.sm, color: Colors.text.secondary, lineHeight: 20 },
  reviewActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  retakeBtn: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.bg.elevated,
  },
  retakeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  useBtn: {
    flex: 2,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.accent.teal,
  },
  useText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.black },
});

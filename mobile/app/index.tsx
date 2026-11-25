import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading, onboardingComplete } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary }}>
        <ActivityIndicator color={Colors.brand.primary} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (onboardingComplete === false) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

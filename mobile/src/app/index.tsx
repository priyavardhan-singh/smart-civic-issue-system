import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>
            Report Civic Issues Easily
          </Text>

          <Text style={styles.subtitle}>
            Help improve your city by reporting local problems quickly and easily.
          </Text>

          <Link href="/report" asChild>
  <Pressable style={styles.reportButton}>
    <Text style={styles.reportButtonText}>
      📍 Report an Issue
    </Text>
  </Pressable>
</Link>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            How It Works
          </Text>

          <Text style={styles.sectionSubtitle}>
            Report and track civic issues in three simple steps.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Report</Text>
            <Text style={styles.cardText}>
              Report a civic issue with details, location, and supporting evidence.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Track</Text>
            <Text style={styles.cardText}>
              Track the progress of your reported issue through the system.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Resolve</Text>
            <Text style={styles.cardText}>
              Authorities review the issue and take appropriate action.
            </Text>
          </View>
        </View>

        {/* Why Smart Civic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Why Smart Civic?
          </Text>

          <Text style={styles.sectionSubtitle}>
            Making civic issue reporting easier, faster, and more transparent.
          </Text>

          <View style={styles.featureCard}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.featureTitle}>
              Location-Based Reporting
            </Text>
            <Text style={styles.cardText}>
              Report civic problems with their location so authorities can identify where action is needed.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.icon}>📷</Text>
            <Text style={styles.featureTitle}>
              Photo Evidence
            </Text>
            <Text style={styles.cardText}>
              Upload images to provide clear evidence of the reported civic issue.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.icon}>📊</Text>
            <Text style={styles.featureTitle}>
              Track Progress
            </Text>
            <Text style={styles.cardText}>
              Keep track of your reported issues and see their progress toward resolution.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    paddingBottom: 40,
  },

  heroSection: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 24,
    paddingVertical: 50,
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 16,
    fontSize: 17,
    lineHeight: 26,
    color: '#4b5563',
    textAlign: 'center',
  },

  reportButton: {
    marginTop: 28,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },

  reportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  sectionSubtitle: {
    marginTop: 10,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 23,
    color: '#6b7280',
    textAlign: 'center',
  },

  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1d4ed8',
  },

  cardText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#4b5563',
  },

  featureCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },

  icon: {
    fontSize: 38,
  },

  featureTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});
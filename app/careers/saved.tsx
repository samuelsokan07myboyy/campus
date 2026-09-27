import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Job } from '@/services/jobs/types/Job';
import { getSavedJobs } from '@/services/jobs/jobsService';
import { JobCard } from '@/components/jobs/JobCard';

export default function SavedJobsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getSavedJobs();
      setSavedJobs(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSaved();
    }, [loadSaved]),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: c.text }]}>Saved Jobs</Text>

        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadSaved(true)}
            tintColor={c.primary}
          />
        }
        ListHeaderComponent={
          savedJobs.length > 0 ? (
            <View style={styles.countBar}>
              <Text style={[styles.countText, { color: c.textMuted }]}>
                You have <Text style={{ color: c.text, fontWeight: '800' }}>{savedJobs.length}</Text> saved {savedJobs.length === 1 ? 'opportunity' : 'opportunities'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <JobCard
              job={item}
              isSaved={true}
              onToggleSave={(_job, isSaved) => {
                if (!isSaved) {
                  setSavedJobs((prev) => prev.filter((j) => j.id !== item.id));
                }
              }}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: `${c.primary}15` }]}>
                <Ionicons name="bookmark-outline" size={38} color={c.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No saved jobs yet</Text>
              <Text style={[styles.emptySub, { color: c.textMuted }]}>
                Bookmark any role you find in Careers to keep track of deadlines and review later.
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: c.primary }]}
                onPress={() => router.back()}
              >
                <Text style={styles.browseBtnText}>Explore Openings</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 38,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  countBar: {
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 12.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  browseBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

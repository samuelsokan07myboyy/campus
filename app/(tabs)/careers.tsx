import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Job, JobFilterState, EmploymentType, WorkplaceType, JobIndustry } from '@/services/jobs/types/Job';
import {
  fetchUnifiedJobs,
  filterJobs,
  getSavedJobIds,
  partitionJobSections,
} from '@/services/jobs/jobsService';
import { JobCard } from '@/components/jobs/JobCard';
import { JobCardSkeleton } from '@/components/jobs/JobCardSkeleton';
import { JobFiltersModal } from '@/components/jobs/JobFiltersModal';

const PAGE_SIZE = 15;

const QUICK_FILTER_PILLS: Array<{
  key: string;
  label: string;
  type: 'workplace' | 'employment' | 'industry' | 'location';
  value: WorkplaceType | EmploymentType | JobIndustry | string;
}> = [
  { key: 'philly-pa', label: '📍 Philly Jobs', type: 'location', value: 'philly' },
  { key: 'part-time', label: 'Part-Time & Hourly', type: 'employment', value: 'Part-time' },
  { key: 'internship', label: 'Internships', type: 'employment', value: 'Internship' },
  { key: 'fastfood', label: 'Food & Dining', type: 'industry', value: 'fastfood' },
  { key: 'retail', label: 'Retail & Fashion', type: 'industry', value: 'retail' },
  { key: 'warehouse', label: 'Warehouse & Logistics', type: 'industry', value: 'warehouse' },
  { key: 'entry-level', label: 'Entry Level', type: 'employment', value: 'Entry Level' },
  { key: 'remote', label: 'Remote', type: 'workplace', value: 'Remote' },
  { key: 'full-time', label: 'Full Time', type: 'employment', value: 'Full-time' },
];

export default function CareersScreen() {
  const { currentUser } = useApp();
  const { theme } = useTheme();
  const c = theme.colors;

  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Search input state + debounced query
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Active filter state
  const [filters, setFilters] = useState<JobFilterState>({
    searchQuery: '',
    workplaceType: 'all',
    employmentType: 'all',
    industry: 'all',
    stateQuery: 'all',
    locationQuery: '',
    companyQuery: '',
    recentlyPostedOnly: false,
  });

  // Pagination for all jobs list / search view
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput);
      setFilters((prev) => ({ ...prev, searchQuery: searchInput }));
    }, 280);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [jobsData, savedIds] = await Promise.all([
        fetchUnifiedJobs(isRefresh),
        getSavedJobIds(),
      ]);
      setAllJobs(jobsData);
      setSavedJobIds(savedIds);
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  // When focusing tab, ONLY refresh bookmark states (NEVER refetch 18 companies over network)
  useFocusEffect(
    useCallback(() => {
      void getSavedJobIds().then(setSavedJobIds);
    }, []),
  );

  const isSearchOrFilterActive = useMemo(() => {
    return Boolean(
      debouncedQuery.trim() ||
      (filters.workplaceType && filters.workplaceType !== 'all') ||
      (filters.employmentType && filters.employmentType !== 'all') ||
      (filters.industry && filters.industry !== 'all') ||
      (filters.stateQuery && filters.stateQuery !== 'all') ||
      filters.locationQuery ||
      filters.companyQuery ||
      filters.recentlyPostedOnly,
    );
  }, [debouncedQuery, filters]);

  const filteredJobs = useMemo(() => {
    return filterJobs(allJobs, filters);
  }, [allJobs, filters]);

  // Section partition for clean discovery view
  const sections = useMemo(() => {
    return partitionJobSections(allJobs, currentUser.major, currentUser.schoolId, currentUser.schoolName);
  }, [allJobs, currentUser.major, currentUser.schoolId, currentUser.schoolName]);

  const togglePill = (item: typeof QUICK_FILTER_PILLS[0]) => {
    void Haptics.selectionAsync();
    setDisplayCount(PAGE_SIZE);
    setFilters((prev) => {
      if (item.type === 'workplace') {
        const next = prev.workplaceType === item.value ? 'all' : (item.value as WorkplaceType);
        return { ...prev, workplaceType: next };
      } else if (item.type === 'employment') {
        const next = prev.employmentType === item.value ? 'all' : (item.value as EmploymentType);
        return { ...prev, employmentType: next };
      } else if (item.type === 'industry') {
        const next = prev.industry === item.value ? 'all' : (item.value as JobIndustry);
        return { ...prev, industry: next };
      } else {
        const next = prev.locationQuery === item.value ? '' : (item.value as string);
        return { ...prev, locationQuery: next };
      }
    });
  };

  const handleToggleSave = useCallback((job: Job, isSaved: boolean) => {
    setSavedJobIds((prev) =>
      isSaved ? [job.id, ...prev] : prev.filter((id) => id !== job.id),
    );
  }, []);

  const handleEndReached = () => {
    if (displayCount < filteredJobs.length) {
      setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredJobs.length));
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.workplaceType && filters.workplaceType !== 'all') count++;
    if (filters.employmentType && filters.employmentType !== 'all') count++;
    if (filters.industry && filters.industry !== 'all') count++;
    if (filters.stateQuery && filters.stateQuery !== 'all') count++;
    if (filters.locationQuery) count++;
    if (filters.companyQuery) count++;
    if (filters.recentlyPostedOnly) count++;
    return count;
  }, [filters]);

  const renderSectionHeader = (title: string, count?: number) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionHeading, { color: c.text }]}>{title}</Text>
      {count !== undefined && (
        <Text style={[styles.sectionCountBadge, { color: c.textMuted }]}>{count}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Top Bar: Title, Subtitle, Saved Jobs Icon */}
      <View style={[styles.topHeader, { borderBottomColor: c.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.findTitle, { color: c.text }]}>Find your next opportunity</Text>
          <Text style={[styles.findSubtitle, { color: c.textMuted }]}>
            Live roles across Big Tech, Startups, Retail, Dining & PA Campus Jobs
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.savedIconBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => {
            void Haptics.selectionAsync();
            router.push('/careers/saved');
          }}
          accessibilityRole="button"
          accessibilityLabel="View Saved Jobs"
        >
          <Ionicons name="bookmark" size={18} color={c.primary} />
          {savedJobIds.length > 0 && (
            <View style={[styles.savedBadgeCount, { backgroundColor: c.primary }]}>
              <Text style={styles.savedBadgeText}>{savedJobIds.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="search" size={17} color={c.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search jobs, companies, or keywords"
            placeholderTextColor={c.textMuted}
            style={[styles.searchInput, { color: c.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={17} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Button */}
        <TouchableOpacity
          style={[
            styles.filtersButton,
            {
              backgroundColor: activeFilterCount > 0 ? c.primary : c.card,
              borderColor: activeFilterCount > 0 ? c.primary : c.border,
            },
          ]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open filter options"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? '#fff' : c.text}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterDotBadge}>
              <Text style={styles.filterDotText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Chips Row */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {QUICK_FILTER_PILLS.map((pill) => {
            const isActive =
              pill.type === 'workplace'
                ? filters.workplaceType === pill.value
                : pill.type === 'employment'
                ? filters.employmentType === pill.value
                : pill.type === 'industry'
                ? filters.industry === pill.value
                : filters.locationQuery === pill.value;

            return (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? c.primary : c.card,
                    borderColor: isActive ? c.primary : c.border,
                  },
                ]}
                onPress={() => togglePill(pill)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isActive ? '#fff' : c.text },
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Body: Skeleton Loading, Filtered Search Results, or Discovery Sections */}
      {loading && allJobs.length === 0 ? (
        <ScrollView contentContainerStyle={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </ScrollView>
      ) : isSearchOrFilterActive ? (
        /* Filtered/Search Active View with Pagination */
        <FlatList
          data={filteredJobs.slice(0, displayCount)}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadData(true)}
              tintColor={c.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.resultsBar}>
              <Text style={[styles.resultsCountText, { color: c.textMuted }]}>
                Found <Text style={{ color: c.text, fontWeight: '800' }}>{filteredJobs.length}</Text> opportunities
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <JobCard
                job={item}
                isSaved={savedJobIds.includes(item.id)}
                onToggleSave={handleToggleSave}
              />
            </View>
          )}
          ListFooterComponent={
            displayCount < filteredJobs.length ? (
              <View style={styles.loadMoreWrap}>
                <ActivityIndicator size="small" color={c.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={46} color={c.textMuted} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>No opportunities found</Text>
              <Text style={[styles.emptySub, { color: c.textMuted }]}>
                Try adjusting your search keywords or clearing active filters.
              </Text>
              <TouchableOpacity
                style={[styles.resetSearchBtn, { backgroundColor: c.primary }]}
                onPress={() => {
                  setSearchInput('');
                  setFilters({
                    searchQuery: '',
                    workplaceType: 'all',
                    employmentType: 'all',
                    industry: 'all',
                    stateQuery: 'all',
                    locationQuery: '',
                    companyQuery: '',
                    recentlyPostedOnly: false,
                  });
                }}
              >
                <Text style={styles.resetSearchBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        /* Discovery Home Sections View (Horizontal Carousels + Infinite Feed) */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.discoveryScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadData(true)}
              tintColor={c.primary}
            />
          }
        >
          {/* 1. Recommended for you */}
          {sections.recommended.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Recommended for you', sections.recommended.length)}
              <View style={styles.sectionCards}>
                {sections.recommended.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 2. Philadelphia Spotlight */}
          {sections.phillyAndPa.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Philadelphia Jobs', sections.phillyAndPa.length)}
              <View style={styles.sectionCards}>
                {sections.phillyAndPa.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 3. Near Your Campus & State */}
          {sections.nearCampus.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader(`Near ${currentUser.schoolName || 'Your Campus'} & State`, sections.nearCampus.length)}
              <View style={styles.sectionCards}>
                {sections.nearCampus.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 3. Big Tech & Leading AI Labs */}
          {sections.bigTechAndAI.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Big Tech & Leading AI Labs', sections.bigTechAndAI.length)}
              <View style={styles.sectionCards}>
                {sections.bigTechAndAI.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 4. Part-Time & Student Hourly Jobs */}
          {sections.partTimeAndHourly.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Part-Time & Student Hourly', sections.partTimeAndHourly.length)}
              <View style={styles.sectionCards}>
                {sections.partTimeAndHourly.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 3. Fast Food, Retail & Warehouse */}
          {sections.retailFoodWarehouse.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Fast Food, Retail & Warehouse', sections.retailFoodWarehouse.length)}
              <View style={styles.sectionCards}>
                {sections.retailFoodWarehouse.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 4. Internships */}
          {sections.internships.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Internships', sections.internships.length)}
              <View style={styles.sectionCards}>
                {sections.internships.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 3. Entry-level jobs */}
          {sections.entryLevel.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Entry-level jobs', sections.entryLevel.length)}
              <View style={styles.sectionCards}>
                {sections.entryLevel.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 4. Remote opportunities */}
          {sections.remote.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Remote opportunities', sections.remote.length)}
              <View style={styles.sectionCards}>
                {sections.remote.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 5. Recently posted */}
          {sections.recentlyPosted.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('Recently posted', sections.recentlyPosted.length)}
              <View style={styles.sectionCards}>
                {sections.recentlyPosted.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 6. All jobs Feed (Vertical) */}
          {sections.allRemaining.length > 0 && (
            <View style={styles.sectionBlock}>
              {renderSectionHeader('All jobs', sections.allRemaining.length)}
              <View style={styles.sectionCards}>
                {sections.allRemaining.slice(0, displayCount).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </View>
              {displayCount < sections.allRemaining.length && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={handleEndReached}
                >
                  <Text style={[styles.loadMoreButtonText, { color: c.primary }]}>Load More Jobs</Text>
                  <Ionicons name="chevron-down" size={16} color={c.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Filter Modal */}
      <JobFiltersModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setDisplayCount(PAGE_SIZE);
        }}
        onResetFilters={() => {
          setFilters({
            searchQuery: searchInput,
            workplaceType: 'all',
            employmentType: 'all',
            industry: 'all',
            stateQuery: 'all',
            locationQuery: '',
            companyQuery: '',
            recentlyPostedOnly: false,
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  findTitle: { fontSize: 22, fontWeight: '900' },
  findSubtitle: { fontSize: 12, marginTop: 2 },
  savedIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  savedBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  savedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, height: '100%', paddingVertical: 0 },
  filtersButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  filterDotBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDotText: { fontSize: 10, fontWeight: '900', color: '#000' },
  pillsWrapper: { paddingBottom: 8 },
  pillsScroll: { paddingHorizontal: 16, gap: 8 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { fontWeight: '800' },
  skeletonContainer: { padding: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  resultsBar: { paddingVertical: 8, paddingHorizontal: 2 },
  resultsCountText: { fontSize: 12 },
  loadMoreWrap: { paddingVertical: 18, alignItems: 'center' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  resetSearchBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetSearchBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  discoveryScroll: { paddingBottom: 32 },
  sectionBlock: { marginTop: 18, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: { fontSize: 17, fontWeight: '800' },
  sectionCountBadge: { fontSize: 12, fontWeight: '600' },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCardWrap: {
    width: 295,
  },
  sectionCards: { gap: 12 },
  loadMoreButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadMoreButtonText: { fontSize: 13.5, fontWeight: '700' },
});

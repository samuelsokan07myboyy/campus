import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import {
  DimensionValue,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Job } from '@/services/jobs/types/Job';
import { formatTimeAgo, setActiveSelectedJob, toggleSaveJob } from '@/services/jobs/jobsService';
import { useTheme } from '@/context/ThemeContext';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onToggleSave?: (job: Job, isSaved: boolean) => void;
  cardWidth?: DimensionValue;
}

export const JobCard = memo(function JobCard({
  job,
  isSaved = false,
  onToggleSave,
  cardWidth,
}: JobCardProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [imageError, setImageError] = useState(false);
  const [savedState, setSavedState] = useState(isSaved);

  useEffect(() => {
    setSavedState(isSaved);
  }, [isSaved]);

  const timeAgo = formatTimeAgo(job.postedAt);

  const handleSavePress = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSaved = !savedState;
    setSavedState(nextSaved);
    const res = await toggleSaveJob(job);
    setSavedState(res.isSaved);
    if (onToggleSave) {
      onToggleSave(job, res.isSaved);
    }
  };

  const handleCardPress = () => {
    setActiveSelectedJob(job);
    void Haptics.selectionAsync();
    router.push({
      pathname: '/careers/job-detail',
      params: { jobId: job.id },
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, cardWidth ? { width: cardWidth } : null]}
      onPress={handleCardPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${job.title} at ${job.company}`}
    >
      {/* Top Header: Logo, Title, Company, Bookmark */}
      <View style={styles.topRow}>
        <View style={styles.logoContainer}>
          {job.companyLogo && !imageError ? (
            <Image
              source={{ uri: job.companyLogo }}
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.fallbackLogo, { backgroundColor: `${job.companyColor}22` }]}>
              <Text style={[styles.fallbackLogoText, { color: job.companyColor }]}>
                {job.company[0]}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.jobTitle, { color: c.text }]} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={[styles.companyName, { color: c.textMuted }]} numberOfLines={1}>
            {job.company}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleSavePress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={savedState ? 'Unsave job' : 'Save job'}
        >
          <Ionicons
            name={savedState ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={savedState ? c.primary : c.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Location & Workplace string */}
      {(job.location || job.workplaceType) && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={c.textMuted} style={styles.pinIcon} />
          <Text style={[styles.locationText, { color: c.textMuted }]} numberOfLines={1}>
            {job.location || 'Multiple Locations'}
            {job.workplaceType && job.workplaceType !== 'On-site' ? ` • ${job.workplaceType}` : ''}
          </Text>
        </View>
      )}

      {/* Badges Row: Employment Type, Salary, Department */}
      <View style={styles.badgesRow}>
        {job.employmentType && (
          <View
            style={[
              styles.badgePill,
              job.employmentType === 'Internship'
                ? [styles.internshipPill, { backgroundColor: `${c.primary}18`, borderColor: `${c.primary}40` }]
                : { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                job.employmentType === 'Internship' ? { color: c.primary, fontWeight: '700' } : { color: c.text },
              ]}
            >
              {job.employmentType}
            </Text>
          </View>
        )}

        {/* Salary ONLY if provided by API */}
        {job.salary ? (
          <View style={[styles.badgePill, styles.salaryPill, { backgroundColor: '#10b98118', borderColor: '#10b98140' }]}>
            <Ionicons name="cash-outline" size={12} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981', fontWeight: '800' }]}>
              {job.salary}
            </Text>
          </View>
        ) : null}

        {job.workplaceType === 'Remote' && (
          <View style={[styles.badgePill, { backgroundColor: '#10b98112', borderColor: '#10b98130' }]}>
            <Ionicons name="wifi" size={11} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>Remote</Text>
          </View>
        )}

        {job.department && (
          <View style={[styles.badgePill, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.badgeText, { color: c.textMuted }]} numberOfLines={1}>
              {job.department}
            </Text>
          </View>
        )}

        {job.industry && job.industry !== 'tech' && (
          <View style={[styles.badgePill, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons
              name={
                job.industry === 'fastfood'
                  ? 'restaurant-outline'
                  : job.industry === 'retail'
                  ? 'shirt-outline'
                  : job.industry === 'warehouse'
                  ? 'cube-outline'
                  : 'paw-outline'
              }
              size={11}
              color={c.textMuted}
            />
            <Text style={[styles.badgeText, { color: c.textMuted }]}>
              {job.industry === 'fastfood'
                ? 'Food & Dining'
                : job.industry === 'retail'
                ? 'Retail'
                : job.industry === 'warehouse'
                ? 'Warehouse'
                : 'Pet Care'}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: Posted time + View Details button */}
      <View style={[styles.footerRow, { borderTopColor: c.border }]}>
        <Text style={[styles.postedTimeText, { color: c.textDim }]}>
          {timeAgo || `Via ${job.provider === 'greenhouse' ? 'Greenhouse' : 'Lever'}`}
        </Text>

        <View style={styles.viewDetailsWrap}>
          <Text style={[styles.viewDetailsText, { color: c.primary }]}>View Details</Text>
          <Ionicons name="arrow-forward" size={13} color={c.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  fallbackLogo: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLogoText: {
    fontSize: 20,
    fontWeight: '900',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  pinIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  internshipPill: {
    borderWidth: 1,
  },
  salaryPill: {
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postedTimeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  viewDetailsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

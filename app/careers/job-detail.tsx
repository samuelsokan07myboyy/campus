import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Job } from '@/services/jobs/types/Job';
import {
  enrichJobDetails,
  findJobById,
  formatTimeAgo,
  getCachedJobById,
  getSavedJobIds,
  toggleSaveJob,
} from '@/services/jobs/jobsService';

interface ContentSection {
  title?: string;
  paragraphs: string[];
  bullets: string[];
}

function parseJobSections(rawContent?: string): ContentSection[] {
  if (!rawContent) return [];

  // Decode HTML entities
  const decoded = rawContent
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');

  // Convert headings and strong markers into section breaks
  const markedText = decoded
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, (match, p1) => {
      const clean = p1.replace(/<[^>]+>/g, '').trim();
      if (clean.length > 3 && clean.length < 80 && !clean.includes('.')) {
        return `\n\n### ${clean}\n\n`;
      }
      return clean;
    })
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '\n• $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  const lines = markedText.split('\n');
  const sections: ContentSection[] = [];
  let current: ContentSection = { title: undefined, paragraphs: [], bullets: [] };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('###')) {
      if (current.paragraphs.length > 0 || current.bullets.length > 0) {
        sections.push(current);
      }
      const heading = line.replace(/^###\s*/, '').trim();
      current = { title: heading, paragraphs: [], bullets: [] };
    } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      const bullet = line.replace(/^[•\-\*]\s*/, '').trim();
      if (bullet.length > 2) {
        current.bullets.push(bullet);
      }
    } else {
      current.paragraphs.push(line);
    }
  }

  if (current.paragraphs.length > 0 || current.bullets.length > 0) {
    sections.push(current);
  }

  return sections;
}

export default function JobDetailsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { theme } = useTheme();
  const c = theme.colors;

  // Initialize immediately from memory cache (0ms latency, no loading screen)
  const [job, setJob] = useState<Job | undefined>(() => getCachedJobById(jobId));
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    // If job wasn't in memory (e.g. reload or deep link), fetch from disk cache
    if (!job && jobId) {
      void findJobById(jobId).then((found) => {
        if (isCurrent && found) {
          setJob(found);
          if (!found.cleanDescription || found.cleanDescription.length < 50) {
            void enrichJobDetails(found).then((enriched) => {
              if (isCurrent && enriched) setJob(enriched);
            });
          }
        }
      });
    } else if (job && (!job.cleanDescription || job.cleanDescription.length < 50)) {
      void enrichJobDetails(job).then((enriched) => {
        if (isCurrent && enriched) setJob(enriched);
      });
    }

    void getSavedJobIds().then((savedIds) => {
      if (isCurrent && jobId) setIsSaved(savedIds.includes(jobId));
    });

    return () => {
      isCurrent = false;
    };
  }, [jobId]);

  const parsedSections = useMemo(() => {
    if (!job) return [];
    return parseJobSections(job.cleanDescription || job.description);
  }, [job]);

  const handleToggleSave = async () => {
    if (!job) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await toggleSaveJob(job);
    setIsSaved(res.isSaved);
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      await Share.share({
        title: `${job.title} at ${job.company}`,
        message: `Check out this opening: ${job.title} at ${job.company}${job.location ? ` (${job.location})` : ''} on CAMPUS!\n${job.applyUrl}`,
        url: job.applyUrl,
      });
    } catch {
      // Ignored
    }
  };

  const handleApplyNow = async () => {
    if (!job) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Open using in-app browser with system chrome/safari view
      await WebBrowser.openBrowserAsync(job.applyUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      // Fallback to system browser
      void Linking.openURL(job.applyUrl).catch(() => {
        Alert.alert('Link Error', 'Unable to open application page.');
      });
    }
  };

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={c.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: c.textMuted }]}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeAgo = formatTimeAgo(job.postedAt);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>

        <Text style={[styles.headerCompanyTitle, { color: c.text }]} numberOfLines={1}>
          {job.company}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Share job"
          >
            <Ionicons name="share-outline" size={21} color={c.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleSave}
            style={[styles.headerBtn, { marginLeft: 4 }]}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Unsave job' : 'Save job'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? c.primary : c.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroLogoContainer}>
            {job.companyLogo && !imageError ? (
              <Image
                source={{ uri: job.companyLogo }}
                style={styles.heroLogo}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.heroFallbackLogo, { backgroundColor: `${job.companyColor}22` }]}>
                <Text style={[styles.heroFallbackText, { color: job.companyColor }]}>
                  {job.company[0]}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.heroCompanyName, { color: c.textMuted }]}>{job.company}</Text>
          <Text style={[styles.heroJobTitle, { color: c.text }]}>{job.title}</Text>

          {/* Location & Meta String */}
          <View style={styles.metaRow}>
            {job.location && (
              <View style={[styles.metaPill, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="location-outline" size={13} color={c.textMuted} />
                <Text style={[styles.metaPillText, { color: c.text }]}>{job.location}</Text>
              </View>
            )}

            {job.workplaceType && (
              <View
                style={[
                  styles.metaPill,
                  job.workplaceType === 'Remote'
                    ? { backgroundColor: '#10b98115', borderColor: '#10b98135' }
                    : { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                {job.workplaceType === 'Remote' && (
                  <Ionicons name="wifi" size={12} color="#10b981" />
                )}
                <Text
                  style={[
                    styles.metaPillText,
                    job.workplaceType === 'Remote' ? { color: '#10b981', fontWeight: '700' } : { color: c.text },
                  ]}
                >
                  {job.workplaceType}
                </Text>
              </View>
            )}

            {job.employmentType && (
              <View style={[styles.metaPill, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="briefcase-outline" size={12} color={c.textMuted} />
                <Text style={[styles.metaPillText, { color: c.text }]}>{job.employmentType}</Text>
              </View>
            )}

            {job.department && (
              <View style={[styles.metaPill, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="folder-outline" size={12} color={c.textMuted} />
                <Text style={[styles.metaPillText, { color: c.textMuted }]}>{job.department}</Text>
              </View>
            )}
          </View>

          {/* Salary card if provided */}
          {job.salary && (
            <View style={[styles.salaryCard, { backgroundColor: '#10b98112', borderColor: '#10b98130' }]}>
              <Ionicons name="cash-outline" size={18} color="#10b981" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.salaryCardLabel}>Compensation</Text>
                <Text style={styles.salaryCardValue}>{job.salary}</Text>
              </View>
            </View>
          )}

          {/* Posted Date */}
          {timeAgo && (
            <View style={styles.postedRow}>
              <Ionicons name="time-outline" size={13} color={c.textDim} />
              <Text style={[styles.postedText, { color: c.textDim }]}>{timeAgo}</Text>
              <Text style={[styles.postedDot, { color: c.textDim }]}>·</Text>
              <Text style={[styles.postedText, { color: c.textDim }]}>
                Verified via {job.provider === 'greenhouse' ? 'Greenhouse' : 'Lever'}
              </Text>
            </View>
          )}
        </View>

        {/* Structured Sections (Intro, What You'll Do, Requirements, Perks, etc.) */}
        {parsedSections.length > 0 ? (
          parsedSections.map((sec, secIdx) => {
            const isFirst = secIdx === 0;
            const sectionHeading = sec.title || (isFirst ? 'About the Role' : undefined);

            return (
              <View key={secIdx} style={[styles.section, { borderTopColor: c.border }]}>
                {sectionHeading && (
                  <Text style={[styles.sectionTitle, { color: c.text }]}>
                    {sectionHeading}
                  </Text>
                )}

                {sec.paragraphs.map((p, pIdx) => (
                  <Text key={pIdx} style={[styles.paragraphText, { color: c.text }]}>
                    {p}
                  </Text>
                ))}

                {sec.bullets.length > 0 && (
                  <View style={styles.bulletsList}>
                    {sec.bullets.map((b, bIdx) => (
                      <View key={bIdx} style={styles.bulletRow}>
                        <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
                        <Text style={[styles.bulletText, { color: c.text }]}>{b}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={[styles.section, { borderTopColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>About the Role</Text>
            <Text style={[styles.paragraphText, { color: c.text }]}>
              {job.cleanDescription || 'See original employer listing for full role specifics.'}
            </Text>
          </View>
        )}

        {/* About the Company (if available) */}
        {job.aboutCompany && (
          <View style={[styles.section, { borderTopColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>About {job.company}</Text>
            <Text style={[styles.paragraphText, { color: c.textMuted }]}>
              {job.aboutCompany}
            </Text>
          </View>
        )}

        {/* Official Application Notice */}
        <View style={[styles.noticeCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.noticeTitle, { color: c.text }]}>Official Employer Application</Text>
            <Text style={[styles.noticeSub, { color: c.textMuted }]}>
              Tapping Apply Now will open {job.company}'s official job portal directly.
            </Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky Bottom Apply Now Bar */}
      <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: c.primary }]}
          onPress={handleApplyNow}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`Apply Now at ${job.company}`}
        >
          <Ionicons name="open-outline" size={18} color="#fff" />
          <Text style={styles.applyButtonText}>Apply on Employer Site</Text>
        </TouchableOpacity>
      </View>
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
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCompanyTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  heroLogoContainer: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroLogo: {
    width: 48,
    height: 48,
  },
  heroFallbackLogo: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    fontSize: 28,
    fontWeight: '900',
  },
  heroCompanyName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroJobTitle: {
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  salaryCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  salaryCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  salaryCardValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 1,
  },
  postedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  postedText: {
    fontSize: 12,
  },
  postedDot: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  paragraphText: {
    fontSize: 14.5,
    lineHeight: 23,
    marginBottom: 12,
  },
  descriptionBody: {
    fontSize: 14.5,
    lineHeight: 23,
    marginBottom: 12,
  },
  bulletsList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 21,
  },
  noticeCard: {
    marginHorizontal: 20,
    marginTop: 22,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeSub: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
});

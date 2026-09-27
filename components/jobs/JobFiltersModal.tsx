import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { JobFilterState, EmploymentType, WorkplaceType, JobIndustry } from '@/services/jobs/types/Job';
import { useTheme } from '@/context/ThemeContext';

interface JobFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  filters: JobFilterState;
  onApplyFilters: (newFilters: JobFilterState) => void;
  onResetFilters: () => void;
}

const WORKPLACE_OPTIONS: Array<{ key: WorkplaceType | 'all'; label: string }> = [
  { key: 'all', label: 'Any Workplace' },
  { key: 'Remote', label: 'Remote' },
  { key: 'Hybrid', label: 'Hybrid' },
  { key: 'On-site', label: 'On-site' },
];

const EMPLOYMENT_OPTIONS: Array<{ key: EmploymentType | 'all'; label: string }> = [
  { key: 'all', label: 'Any Type' },
  { key: 'Part-time', label: 'Part-time & Hourly' },
  { key: 'Internship', label: 'Internship' },
  { key: 'Entry Level', label: 'Entry Level' },
  { key: 'Full-time', label: 'Full-time' },
  { key: 'Contract', label: 'Contract' },
];

const INDUSTRY_OPTIONS: Array<{ key: JobIndustry | 'all'; label: string }> = [
  { key: 'all', label: 'All Industries' },
  { key: 'fastfood', label: 'Fast Food & Dining' },
  { key: 'retail', label: 'Retail & Fashion' },
  { key: 'warehouse', label: 'Warehouse & Logistics' },
  { key: 'tech', label: 'Tech & AI' },
  { key: 'petcare', label: 'Pet Care & Services' },
];

const STATE_REGION_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All States / Any' },
  { key: 'PA', label: '📍 PA (Philly)' },
  { key: 'NJ', label: 'NJ (Nearby)' },
  { key: 'DE', label: 'DE (Nearby)' },
  { key: 'MD', label: 'MD (Nearby)' },
  { key: 'NY', label: 'NY (New York)' },
  { key: 'CA', label: 'CA (Bay Area / LA)' },
  { key: 'WA', label: 'WA (Seattle)' },
  { key: 'TX', label: 'TX (Austin / Dallas)' },
  { key: 'MA', label: 'MA (Boston)' },
];

export function JobFiltersModal({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}: JobFiltersModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [localWorkplace, setLocalWorkplace] = useState<WorkplaceType | 'all'>(filters.workplaceType || 'all');
  const [localEmployment, setLocalEmployment] = useState<EmploymentType | 'all'>(filters.employmentType || 'all');
  const [localIndustry, setLocalIndustry] = useState<JobIndustry | 'all'>(filters.industry || 'all');
  const [localState, setLocalState] = useState<string>(filters.stateQuery || 'all');
  const [localLocation, setLocalLocation] = useState(filters.locationQuery || '');
  const [localCompany, setLocalCompany] = useState(filters.companyQuery || '');
  const [localRecent, setLocalRecent] = useState(Boolean(filters.recentlyPostedOnly));

  useEffect(() => {
    if (!visible) return;
    setLocalWorkplace(filters.workplaceType || 'all');
    setLocalEmployment(filters.employmentType || 'all');
    setLocalIndustry(filters.industry || 'all');
    setLocalState(filters.stateQuery || 'all');
    setLocalLocation(filters.locationQuery || '');
    setLocalCompany(filters.companyQuery || '');
    setLocalRecent(Boolean(filters.recentlyPostedOnly));
  }, [visible, filters]);

  const handleApply = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onApplyFilters({
      ...filters,
      workplaceType: localWorkplace,
      employmentType: localEmployment,
      industry: localIndustry,
      stateQuery: localState,
      locationQuery: localLocation.trim(),
      companyQuery: localCompany.trim(),
      recentlyPostedOnly: localRecent,
    });
    onClose();
  };

  const handleReset = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalWorkplace('all');
    setLocalEmployment('all');
    setLocalIndustry('all');
    setLocalState('all');
    setLocalLocation('');
    setLocalCompany('');
    setLocalRecent(false);
    onResetFilters();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: c.surface, borderColor: c.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <View style={[styles.dragHandle, { backgroundColor: c.border }]} />
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: c.text }]}>Filters</Text>
              <TouchableOpacity onPress={handleReset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.resetText, { color: c.primary }]}>Reset All</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Workplace Type */}
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>WORKPLACE TYPE</Text>
            <View style={styles.optionsWrap}>
              {WORKPLACE_OPTIONS.map((opt) => {
                const isSelected = localWorkplace === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected ? c.primary : c.card,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => setLocalWorkplace(opt.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? '#fff' : c.text },
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Employment Type */}
            <Text style={[styles.sectionTitle, { color: c.textMuted, marginTop: 18 }]}>
              EMPLOYMENT TYPE
            </Text>
            <View style={styles.optionsWrap}>
              {EMPLOYMENT_OPTIONS.map((opt) => {
                const isSelected = localEmployment === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected ? c.primary : c.card,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => setLocalEmployment(opt.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? '#fff' : c.text },
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Industry Category */}
            <Text style={[styles.sectionTitle, { color: c.textMuted, marginTop: 18 }]}>
              INDUSTRY & CATEGORY
            </Text>
            <View style={styles.optionsWrap}>
              {INDUSTRY_OPTIONS.map((opt) => {
                const isSelected = localIndustry === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected ? c.primary : c.card,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => setLocalIndustry(opt.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? '#fff' : c.text },
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* State & Region */}
            <Text style={[styles.sectionTitle, { color: c.textMuted, marginTop: 18 }]}>
              STATE & REGION
            </Text>
            <View style={styles.optionsWrap}>
              {STATE_REGION_OPTIONS.map((opt) => {
                const isSelected = localState === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected ? c.primary : c.card,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    onPress={() => setLocalState(opt.key)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? '#fff' : c.text },
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter by Location */}
            <Text style={[styles.sectionTitle, { color: c.textMuted, marginTop: 18 }]}>LOCATION KEYWORD</Text>
            <View style={[styles.inputRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <Ionicons name="location-outline" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={localLocation}
                onChangeText={setLocalLocation}
                placeholder="e.g. Philadelphia, New York, King of Prussia..."
                placeholderTextColor={c.textMuted}
                style={[styles.textInput, { color: c.text }]}
              />
            </View>

            {/* Filter by Company */}
            <Text style={[styles.sectionTitle, { color: c.textMuted, marginTop: 18 }]}>COMPANY</Text>
            <View style={[styles.inputRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <Ionicons name="business-outline" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={localCompany}
                onChangeText={setLocalCompany}
                placeholder="e.g. Figma, Stripe, Spotify..."
                placeholderTextColor={c.textMuted}
                style={[styles.textInput, { color: c.text }]}
              />
            </View>

            {/* Recently Posted Toggle */}
            <View style={[styles.toggleRow, { borderTopColor: c.border }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.toggleTitle, { color: c.text }]}>Recently Posted Only</Text>
                <Text style={[styles.toggleSub, { color: c.textMuted }]}>
                  Only show opportunities published within the last 14 days
                </Text>
              </View>
              <Switch
                value={localRecent}
                onValueChange={setLocalRecent}
                trackColor={{ false: c.border, true: c.primary }}
              />
            </View>
          </ScrollView>

          {/* Footer with Apply Button */}
          <View style={[styles.footer, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: c.primary }]}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '85%',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  optionTextActive: {
    fontWeight: '800',
  },
  inputRow: {
    height: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSub: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});

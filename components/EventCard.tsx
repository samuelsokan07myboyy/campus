import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { CampusEvent, EventRsvpSelection } from '@/services/eventsService';

type Props = {
  event: CampusEvent;
  onRSVP: (eventId: string, status: EventRsvpSelection) => void;
  onOpen: () => void;
};

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function EventCard({ event, onRSVP, onOpen }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const start = new Date(event.startTime);
  const month = start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(start.getDate()).padStart(2, '0');
  const eventTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const goingSelected = event.userRsvp === 'going';
  const interestedSelected = event.userRsvp === 'interested';

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View details for ${event.title}`} onPress={onOpen} style={styles.coverWrap}>
        {event.coverUrl ? (
          <Image source={{ uri: event.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: c.primaryMuted }]}>
            <Ionicons name="sparkles-outline" size={34} color={c.primary} />
          </View>
        )}
        <LinearGradient
          colors={['rgba(7, 10, 16, 0.22)', 'transparent', 'rgba(7, 10, 16, 0.76)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.coverTopRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryLabel}>{event.category}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceLabel}>{event.isFree ? 'FREE' : event.price || 'TICKETED'}</Text>
          </View>
        </View>
        <View style={styles.coverBottomRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.monthLabel}>{month}</Text>
            <Text style={styles.dayLabel}>{day}</Text>
          </View>
          <View style={styles.coverDateText}>
            <Text style={styles.coverWeekday}>{start.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
            <Text style={styles.coverTime}>{eventTime}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.body}>
        <Pressable accessibilityRole="button" onPress={onOpen}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{event.title}</Text>
        </Pressable>

        <View style={styles.hostRow}>
          <View style={styles.hostAvatar}>
            {event.host.avatarUrl ? (
              <Image source={{ uri: event.host.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={[styles.avatarInitials, { color: c.primary }]}>{initials(event.host.name)}</Text>
            )}
          </View>
          <Text style={[styles.hostName, { color: c.textMuted }]} numberOfLines={1}>@{event.host.username}</Text>
          {event.host.isVerified && <Ionicons name="checkmark-circle" size={14} color={c.primary} />}
          <View style={styles.attendeePreview}>
            {event.attendees.slice(0, 3).map((person, index) => (
              <View key={person.id} style={[styles.attendeeAvatar, { marginLeft: index === 0 ? 0 : -9, zIndex: 4 - index, borderColor: c.card }]}>
                {person.avatarUrl ? (
                  <Image source={{ uri: person.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Text style={[styles.tinyInitials, { color: c.text }]}>{initials(person.name)}</Text>
                )}
              </View>
            ))}
            <Text style={[styles.goingLabel, { color: c.textMuted }]}>{event.goingCount} going</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={c.secondary} />
          <Text style={[styles.location, { color: c.textMuted }]} numberOfLines={1}>{event.locationName}</Text>
        </View>

        <View style={[styles.actionsRow, { borderTopColor: c.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={goingSelected ? 'Cancel going RSVP' : 'RSVP going'}
            onPress={() => onRSVP(event.id, goingSelected ? 'none' : 'going')}
            style={[styles.rsvpButton, styles.goingButton, { borderColor: goingSelected ? c.primary : c.border }, goingSelected && { backgroundColor: c.primaryMuted }]}
          >
            <Ionicons name={goingSelected ? 'checkmark-circle' : 'checkmark-circle-outline'} size={17} color={goingSelected ? c.primary : c.textMuted} />
            <Text style={[styles.actionText, { color: goingSelected ? c.primary : c.textMuted }]}>Going</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={interestedSelected ? 'Remove interested RSVP' : 'Mark interested'}
            onPress={() => onRSVP(event.id, interestedSelected ? 'none' : 'interested')}
            style={[styles.rsvpButton, { borderColor: interestedSelected ? c.secondary : c.border }, interestedSelected && { backgroundColor: c.secondary + '18' }]}
          >
            <Ionicons name={interestedSelected ? 'star' : 'star-outline'} size={16} color={interestedSelected ? c.secondary : c.textMuted} />
            <Text style={[styles.actionText, { color: interestedSelected ? c.secondary : c.textMuted }]}>Interested</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 1.82,
    overflow: 'hidden',
    backgroundColor: '#17202A',
  },
  coverPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(10, 14, 22, 0.76)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },
  categoryLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  priceBadge: {
    backgroundColor: '#F4C95D',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },
  priceLabel: {
    color: '#181818',
    fontSize: 10,
    fontWeight: '900',
  },
  coverBottomRow: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  dateBadge: {
    width: 48,
    height: 54,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: '#D54F42',
    fontSize: 10,
    fontWeight: '900',
  },
  dayLabel: {
    color: '#171717',
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '900',
  },
  coverDateText: {
    paddingBottom: 3,
  },
  coverWeekday: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  coverTime: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    gap: 6,
  },
  hostAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 9,
    fontWeight: '900',
  },
  hostName: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 112,
  },
  attendeePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  attendeeAvatar: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tinyInitials: {
    fontSize: 8,
    fontWeight: '800',
  },
  goingLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 7,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 11,
    marginBottom: 12,
  },
  location: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 11,
  },
  rsvpButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  goingButton: {
    backgroundColor: 'transparent',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

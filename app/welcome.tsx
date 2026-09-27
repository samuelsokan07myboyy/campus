import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'school',
    emoji: '🎓',
    title: 'Your Campus,\nYour Community',
    subtitle: 'Connect with real students at your school. Share moments, find your people.',
    color: '#38bdf8',
    bg: '#0c1a2e',
  },
  {
    id: '2',
    icon: 'book',
    emoji: '📚',
    title: 'Study Smarter\nTogether',
    subtitle: 'Join live study rooms, track streaks, solve problems with AI — all in one place.',
    color: '#8b5cf6',
    bg: '#130d1f',
  },
  {
    id: '3',
    icon: 'briefcase',
    emoji: '💼',
    title: 'Launch Your\nCareer',
    subtitle: 'Find internships, connect with alumni, and land your dream job straight from campus.',
    color: '#10b981',
    bg: '#0d1f1a',
  },
];

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlide]);

  const goNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
    } else {
      router.push('/login');
    }
  };

  const skip = () => router.push('/login');

  const slide = SLIDES[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <StatusBar style="light" />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {SLIDES.map((s, i) => (
          <View key={s.id} style={styles.slide}>
            {/* Big Emoji Circle */}
            <Animated.View style={[
              styles.iconWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                backgroundColor: `${s.color}15`,
                borderColor: `${s.color}30`,
              }
            ]}>
              <Text style={styles.slideEmoji}>{s.emoji}</Text>

              {/* Orbit rings */}
              <View style={[styles.ring, { borderColor: `${s.color}20` }]} />
              <View style={[styles.ring2, { borderColor: `${s.color}10` }]} />
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={[styles.slideTitle, { color: '#fff' }]}>{s.title}</Text>
              <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setCurrentSlide(i);
              fadeAnim.setValue(0);
              slideAnim.setValue(20);
              scrollRef.current?.scrollTo({ x: width * i, animated: true });
            }}
          >
            <View style={[
              styles.dot,
              i === currentSlide && [styles.dotActive, { backgroundColor: slide.color }]
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Button */}
      <View style={styles.bottom}>
        <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
          <LinearGradient
            colors={currentSlide === SLIDES.length - 1
              ? ['#38bdf8', '#8b5cf6']
              : [slide.color, slide.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={currentSlide === SLIDES.length - 1 ? 'rocket' : 'arrow-forward'}
              size={20}
              color="#000"
            />
          </LinearGradient>
        </TouchableOpacity>

        {currentSlide === SLIDES.length - 1 && (
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: '#38bdf8' }}>Sign in</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  skipText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    borderWidth: 1,
    position: 'relative',
  },
  slideEmoji: {
    fontSize: 72,
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
  },
  ring2: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 16,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  ctaText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#6b7280',
    fontSize: 14,
  },
});

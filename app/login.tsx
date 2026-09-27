import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const SCHOOLS = [
  { id: 'mit', name: 'MIT', domain: 'mit.edu', location: 'Cambridge, MA' },
  { id: 'stanford', name: 'Stanford University', domain: 'stanford.edu', location: 'Stanford, CA' },
  { id: 'harvard', name: 'Harvard University', domain: 'harvard.edu', location: 'Cambridge, MA' },
  { id: 'berkeley', name: 'UC Berkeley', domain: 'berkeley.edu', location: 'Berkeley, CA' },
  { id: 'nyu', name: 'NYU', domain: 'nyu.edu', location: 'New York, NY' },
  { id: 'columbia', name: 'Columbia University', domain: 'columbia.edu', location: 'New York, NY' },
  { id: 'yale', name: 'Yale University', domain: 'yale.edu', location: 'New Haven, CT' },
  { id: 'princeton', name: 'Princeton University', domain: 'princeton.edu', location: 'Princeton, NJ' },
  { id: 'umich', name: 'University of Michigan', domain: 'umich.edu', location: 'Ann Arbor, MI' },
  { id: 'ucla', name: 'UCLA', domain: 'ucla.edu', location: 'Los Angeles, CA' },
  { id: 'gatech', name: 'Georgia Tech', domain: 'gatech.edu', location: 'Atlanta, GA' },
  { id: 'cornell', name: 'Cornell University', domain: 'cornell.edu', location: 'Ithaca, NY' },
];

export default function LoginScreen() {
  const { setIsLoggedIn } = useApp();
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const filtered = SCHOOLS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.domain.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendCode = () => {
    if (!email.includes('@') || !email.includes('.edu')) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      setStep('otp');
    }, 1200);
  };

  const handleVerify = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      router.replace('/(tabs)');
    }, 1000);
  };

  const handleOtpChange = (val: string, i: number) => {
    const updated = [...otp];
    updated[i] = val;
    setOtp(updated);
  };

  const isEmailValid = email.includes('@') && email.includes('.edu');
  const isOtpComplete = otp.every(d => d !== '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.back} onPress={() => {
        if (step === 'otp') setStep('email');
        else router.back();
      }}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>CAMPUS</Text>
          <Text style={styles.tagline}>Students only. No influencers.</Text>
          <TouchableOpacity 
            style={{ marginTop: 12, backgroundColor: '#1f2937', padding: 8, borderRadius: 8, alignSelf: 'flex-start' }}
            onPress={() => {
              setIsLoggedIn(true);
              router.replace('/(tabs)');
            }}
          >
            <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold' }}>DEV BYPASS: Skip Login →</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {step === 'email' ? (
            <>
              <Text style={styles.stepTitle}>Enter your .edu email</Text>
              <Text style={styles.stepSub}>We'll send a verification code to confirm you're a student.</Text>

              {/* School search */}
              <View style={styles.inputBox}>
                <Ionicons name="search" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search your school..."
                  placeholderTextColor="#6b7280"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* School list */}
              <View style={styles.schoolList}>
                {filtered.slice(0, 6).map(school => (
                  <TouchableOpacity
                    key={school.id}
                    style={[styles.schoolItem, selectedSchool === school.id && styles.schoolItemActive]}
                    onPress={() => {
                      setSelectedSchool(school.id);
                      setEmail(`@${school.domain}`);
                    }}
                  >
                    <View style={styles.schoolInitials}>
                      <Text style={styles.schoolInitialsText}>{school.name[0]}</Text>
                    </View>
                    <View style={styles.schoolInfo}>
                      <Text style={styles.schoolName}>{school.name}</Text>
                      <Text style={styles.schoolDomain}>{school.domain}</Text>
                    </View>
                    {selectedSchool === school.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Email input */}
              <View style={[styles.inputBox, { marginTop: 16 }]}>
                <Ionicons name="mail" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@school.edu"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                {isEmailValid && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
              </View>

              <TouchableOpacity
                style={[styles.btn, !isEmailValid && styles.btnDisabled]}
                onPress={handleSendCode}
                disabled={!isEmailValid || isLoading}
              >
                <Text style={styles.btnText}>{isLoading ? 'Sending...' : 'Send Verification Code'}</Text>
                {!isLoading && <Ionicons name="send" size={16} color="#000" />}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.otpHeader}>
                <View style={styles.otpIcon}>
                  <Text style={{ fontSize: 32 }}>📬</Text>
                </View>
                <Text style={styles.stepTitle}>Check your email</Text>
                <Text style={styles.stepSub}>We sent a 6-digit code to <Text style={{ color: '#38bdf8' }}>{email}</Text></Text>
              </View>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={v => handleOtpChange(v.slice(-1), i)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.btn, !isOtpComplete && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={!isOtpComplete || isLoading}
              >
                <Text style={styles.btnText}>{isLoading ? 'Verifying...' : 'Verify & Continue'}</Text>
                {!isLoading && <Ionicons name="arrow-forward" size={16} color="#000" />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resend} onPress={() => setStep('email')}>
                <Text style={styles.resendText}>Didn't get it? <Text style={{ color: '#38bdf8' }}>Resend code</Text></Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        <Text style={styles.footer}>By continuing you agree to our Terms & Privacy Policy</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  back: { padding: 20 },
  header: { alignItems: 'center', paddingBottom: 32 },
  logo: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  tagline: { color: '#6b7280', fontSize: 14, marginTop: 6 },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  stepSub: { color: '#6b7280', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  schoolList: { gap: 8, marginBottom: 4 },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  schoolItemActive: { borderColor: '#38bdf8', backgroundColor: '#0c1a2e' },
  schoolInitials: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolInitialsText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  schoolInfo: { flex: 1 },
  schoolName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  schoolDomain: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  btn: {
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  btnDisabled: { backgroundColor: '#1f2937' },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  otpHeader: { alignItems: 'center', marginBottom: 24, gap: 8 },
  otpIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#38bdf820',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 8 },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#374151',
  },
  otpBoxFilled: { borderColor: '#38bdf8' },
  resend: { alignItems: 'center', marginTop: 16 },
  resendText: { color: '#6b7280', fontSize: 14 },
  footer: { color: '#374151', fontSize: 12, textAlign: 'center', margin: 32 },
});
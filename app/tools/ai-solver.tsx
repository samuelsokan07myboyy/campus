import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Dimensions,
  Animated,
  Easing 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

type SolutionStep = {
  step: number;
  title: string;
  explanation: string;
  math?: string;
};

const MOCK_SOLUTION: SolutionStep[] = [
  {
    step: 1,
    title: "Identify the equation",
    explanation: "We have a quadratic equation in the form ax² + bx + c = 0",
    math: "2x² + 5x - 3 = 0"
  },
  {
    step: 2,
    title: "Apply quadratic formula",
    explanation: "Using x = (-b ± √(b² - 4ac)) / 2a",
    math: "x = (-5 ± √(25 - 4(2)(-3))) / 4"
  },
  {
    step: 3,
    title: "Calculate discriminant",
    explanation: "b² - 4ac = 25 + 24 = 49",
    math: "√49 = 7"
  },
  {
    step: 4,
    title: "Find both solutions",
    explanation: "x = (-5 + 7)/4 or x = (-5 - 7)/4",
    math: "x = 0.5 or x = -3"
  }
];

export default function AISolverScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  
  // Animation values
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnalyzing) {
      // Scanning line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLinePosition, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanLinePosition, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Simulate AI processing
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowSolution(true);
      }, 4000);
    }
  }, [isAnalyzing]);

  const takePicture = async () => {
    // Mock camera capture
    setCapturedImage('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800');
    setIsAnalyzing(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      setIsAnalyzing(true);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setShowSolution(false);
    setIsAnalyzing(false);
    scanLinePosition.setValue(0);
    pulseAnim.setValue(1);
  };

  if (!permission?.granted && activeTab === 'camera') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={64} color="#38bdf8" />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>We need camera access to scan your homework</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('upload')}>
          <Text style={styles.uploadInstead}>Or upload from gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Solver</Text>
        <TouchableOpacity onPress={resetScan}>
          <Ionicons name="refresh" size={24} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mode Toggle */}
        {!capturedImage && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, activeTab === 'camera' && styles.toggleActive]}
              onPress={() => setActiveTab('camera')}
            >
              <Ionicons name="camera" size={20} color={activeTab === 'camera' ? '#000' : '#fff'} />
              <Text style={[styles.toggleText, activeTab === 'camera' && styles.toggleTextActive]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, activeTab === 'upload' && styles.toggleActive]}
              onPress={() => setActiveTab('upload')}
            >
              <Ionicons name="images" size={20} color={activeTab === 'upload' ? '#000' : '#fff'} />
              <Text style={[styles.toggleText, activeTab === 'upload' && styles.toggleTextActive]}>Upload</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Camera/Preview Area */}
        <View style={styles.cameraContainer}>
          {!capturedImage ? (
            activeTab === 'camera' ? (
              <CameraView style={styles.camera} facing="back">
                <View style={styles.cameraOverlay}>
                  <View style={styles.scanArea}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  <Text style={styles.cameraHint}>Point at math problem</Text>
                </View>
              </CameraView>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                <Ionicons name="cloud-upload" size={48} color="#38bdf8" />
                <Text style={styles.uploadText}>Tap to select image</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <Animated.View 
                    style={[
                      styles.scanLine,
                      {
                        transform: [{
                          translateY: scanLinePosition.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 300]
                          })
                        }]
                      }
                    ]} 
                  />
                  
                  <Animated.View style={[styles.aiBadge, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="sparkles" size={32} color="#38bdf8" />
                    <Text style={styles.aiText}>Analyzing...</Text>
                  </Animated.View>
                  
                  <View style={styles.scanningDots}>
                    <Text style={styles.scanningText}>Scanning problem</Text>
                    <Text style={styles.dots}>...</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Button */}
        {!capturedImage && (
          <TouchableOpacity 
            style={styles.captureBtn}
            onPress={activeTab === 'camera' ? takePicture : pickImage}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        )}

        {/* Solution Display */}
        {showSolution && (
          <View style={styles.solutionContainer}>
            <View style={styles.solutionHeader}>
              <View style={styles.solvedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.solvedText}>Solved!</Text>
              </View>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectText}>Algebra II</Text>
              </View>
            </View>

            <Text style={styles.solutionTitle}>Step-by-Step Solution</Text>
            
            {MOCK_SOLUTION.map((item, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepExplanation}>{item.explanation}</Text>
                  {item.math && (
                    <View style={styles.mathBox}>
                      <Text style={styles.mathText}>{item.math}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="bookmark-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnPrimary}>
                <Ionicons name="play" size={20} color="#000" />
                <Text style={styles.actionBtnPrimaryText}>Explain Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#38bdf8',
  },
  toggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
  },
  cameraContainer: {
    margin: 20,
    height: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#38bdf8',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  cameraHint: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 24,
    margin: 20,
  },
  uploadText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  aiBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  aiText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanningDots: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
  },
  scanningText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  dots: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
    width: 20,
  },
  solutionContainer: {
    margin: 20,
    marginTop: 0,
  },
  solutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  solvedText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  subjectBadge: {
    backgroundColor: '#38bdf820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subjectText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  solutionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  stepExplanation: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  mathBox: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  mathText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 2,
    backgroundColor: '#38bdf8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnPrimaryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionBtn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  permissionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  uploadInstead: {
    color: '#38bdf8',
    fontSize: 14,
  },
});
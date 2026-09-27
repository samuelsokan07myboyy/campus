import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { saveLocalPost } from '@/services/postsService';
import type { Post, PostCategory } from '@/types';

type SelectedMedia = { uri: string; type: 'image' | 'video'; width: number; height: number };

const CATEGORIES: Array<{ key: PostCategory; emoji: string }> = [
  { key: 'Study', emoji: '📚' },
  { key: 'Campus', emoji: '🏫' },
  { key: 'Drama', emoji: '👀' },
  { key: 'Tips', emoji: '💡' },
  { key: 'Meme', emoji: '😂' },
  { key: 'Event', emoji: '📅' },
];

function VideoPreview({ uri, isActive }: { uri: string; isActive: boolean }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  return <VideoView player={player} style={styles.previewMedia} contentFit="cover" nativeControls={false} />;
}

export default function PostScreen() {
  const { theme } = useTheme();
  const { currentUser } = useApp();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const carouselRef = useRef<ScrollView>(null);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('Campus');
  const [isPosting, setIsPosting] = useState(false);
  const canPost = selectedMedia.length > 0 && !isPosting;

  useEffect(() => {
    carouselRef.current?.scrollTo({ x: activeIndex * width, y: 0, animated: false });
  }, [activeIndex, width]);

  const appendMedia = (picked: SelectedMedia[], replace = false) => {
    setSelectedMedia((current) => {
      const next = replace
        ? picked
        : [...current, ...picked.filter((item) => !current.some((existing) => existing.uri === item.uri))];
      const limited = next.slice(0, 10);
      setActiveIndex(replace ? 0 : Math.max(0, limited.length - picked.length));
      return limited;
    });
  };

  const pickMedia = async (replace = false) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow access to your library to select post media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      orderedSelection: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length) {
      appendMedia(result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
      })), replace);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access to capture a post.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      appendMedia([{
        uri: result.assets[0].uri,
        type: result.assets[0].type === 'video' ? 'video' : 'image',
        width: result.assets[0].width,
        height: result.assets[0].height,
      }]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveIndex((current) => Math.max(0, current > index ? current - 1 : Math.min(current, selectedMedia.length - 2)));
    void Haptics.selectionAsync();
  };

  const moveMedia = (direction: -1 | 1) => {
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= selectedMedia.length) return;
    setSelectedMedia((current) => {
      const next = [...current];
      [next[activeIndex], next[targetIndex]] = [next[targetIndex], next[activeIndex]];
      return next;
    });
    setActiveIndex(targetIndex);
    void Haptics.selectionAsync();
  };

  const handlePost = async () => {
    if (!canPost) return;
    setIsPosting(true);
    try {
      const post: Post = {
        id: `local-post-${Date.now()}`,
        author: currentUser,
        type: selectedMedia.length > 1 ? 'carousel' : selectedMedia[0].type,
        mediaUrls: selectedMedia.map((item) => item.uri),
        mediaTypes: selectedMedia.map((item) => item.type),
        mediaDimensions: selectedMedia.map(({ width: mediaWidth, height: mediaHeight }) => ({ width: mediaWidth, height: mediaHeight })),
        caption: caption.trim(),
        category: selectedCategory,
        likes: 0,
        comments: 0,
        saves: 0,
        isLiked: false,
        isSaved: false,
        createdAt: new Date(),
      };
      await saveLocalPost(post);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Could not publish', 'Your post could not be saved on this device. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const activeMedia = selectedMedia[activeIndex];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={23} color={c.text} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: c.text }]}>New post</Text>
            <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>Share a moment with campus</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handlePost()}
            disabled={!canPost}
            style={[styles.shareButton, { backgroundColor: canPost ? c.primary : c.card }]}
          >
            {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.shareLabel, { color: canPost ? '#fff' : c.textDim }]}>Share</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {selectedMedia.length === 0 ? (
            <View style={[styles.emptyMedia, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.emptyMediaIcon, { backgroundColor: c.primaryMuted }]}>
                <Ionicons name="images-outline" size={26} color={c.primary} />
              </View>
              <Text style={[styles.emptyMediaTitle, { color: c.text }]}>Start with a photo or video</Text>
              <Text style={[styles.emptyMediaSubtitle, { color: c.textMuted }]}>Add one item or build a carousel with up to 10.</Text>
              <View style={styles.mediaActions}>
                <Pressable accessibilityRole="button" onPress={() => void pickMedia(true)} style={[styles.libraryButton, { backgroundColor: c.primary }]}>
                  <Ionicons name="images-outline" size={17} color="#fff" />
                  <Text style={styles.libraryButtonLabel}>Choose media</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Open camera" onPress={() => void openCamera()} style={[styles.cameraButton, { backgroundColor: c.background, borderColor: c.border }]}>
                  <Ionicons name="camera-outline" size={19} color={c.text} />
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.mediaSection}>
              <View style={[styles.previewFrame, { backgroundColor: c.card }]}>
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={(event) => {
                    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                    setActiveIndex(Math.max(0, Math.min(nextIndex, selectedMedia.length - 1)));
                    void Haptics.selectionAsync();
                  }}
                >
                  {selectedMedia.map((item, index) => (
                    <View key={item.uri} style={[styles.carouselPage, { width, height: width }]}>
                      {item.type === 'video' ? (
                        <VideoPreview uri={item.uri} isActive={index === activeIndex} />
                      ) : (
                        <Image source={{ uri: item.uri }} style={styles.previewMedia} contentFit="cover" transition={150} />
                      )}
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.previewTopRow}>
                  <View style={styles.mediaCountBadge}>
                    <Ionicons name={selectedMedia.length > 1 ? 'copy-outline' : activeMedia.type === 'video' ? 'videocam-outline' : 'image-outline'} size={13} color="#fff" />
                    <Text style={styles.mediaCountLabel}>{selectedMedia.length > 1 ? `${activeIndex + 1} of ${selectedMedia.length}` : activeMedia.type === 'video' ? 'Video' : 'Photo'}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Remove selected media" onPress={() => removeMedia(activeIndex)} style={styles.previewIconButton}>
                    <Ionicons name="trash-outline" size={17} color="#fff" />
                  </Pressable>
                </View>
                {selectedMedia.length > 1 && (
                  <View style={styles.orderControls}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Move item earlier" disabled={activeIndex === 0} onPress={() => moveMedia(-1)} style={styles.orderButton}>
                      <Ionicons name="arrow-back" size={16} color={activeIndex === 0 ? '#aab0ba' : '#fff'} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Move item later" disabled={activeIndex === selectedMedia.length - 1} onPress={() => moveMedia(1)} style={styles.orderButton}>
                      <Ionicons name="arrow-forward" size={16} color={activeIndex === selectedMedia.length - 1 ? '#aab0ba' : '#fff'} />
                    </Pressable>
                  </View>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
                {selectedMedia.map((item, index) => (
                  <Pressable key={item.uri} accessibilityRole="button" accessibilityLabel={`Select carousel item ${index + 1}`} onPress={() => setActiveIndex(index)} style={[styles.thumbnail, { borderColor: index === activeIndex ? c.primary : c.border }]}>
                    {item.type === 'video' ? (
                      <View style={[styles.videoThumbnail, { backgroundColor: c.card }]}><Ionicons name="videocam" size={16} color={c.textMuted} /></View>
                    ) : (
                      <Image source={{ uri: item.uri }} style={styles.thumbnailImage} contentFit="cover" />
                    )}
                    <View style={styles.thumbnailNumber}><Text style={styles.thumbnailNumberText}>{index + 1}</Text></View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove item ${index + 1}`} onPress={() => removeMedia(index)} style={styles.thumbnailRemove}>
                      <Ionicons name="close-circle" size={17} color="#fff" />
                    </Pressable>
                  </Pressable>
                ))}
                {selectedMedia.length < 10 && (
                  <Pressable accessibilityRole="button" accessibilityLabel="Add another carousel item" onPress={() => void pickMedia(false)} style={[styles.addThumbnail, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Ionicons name="add" size={23} color={c.primary} />
                  </Pressable>
                )}
              </ScrollView>
              <Text style={[styles.mediaHelper, { color: c.textMuted }]}>Use the arrows to set the order people will swipe through.</Text>
            </View>
          )}

          <View style={styles.authorRow}>
            {currentUser.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.authorAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.authorAvatar, { backgroundColor: c.primaryMuted }]}><Text style={[styles.authorInitial, { color: c.primary }]}>{currentUser.displayName[0]}</Text></View>
            )}
            <View style={styles.authorMeta}>
              <Text style={[styles.authorName, { color: c.text }]}>{currentUser.displayName}</Text>
              <Text style={[styles.authorSchool, { color: c.textMuted }]}>{currentUser.schoolName}</Text>
            </View>
          </View>

          <View style={[styles.captionPanel, { backgroundColor: c.card, borderColor: c.border }]}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={[styles.captionInput, { color: c.text }]}
            />
            <Text style={[styles.charCount, { color: c.textDim }]}>{caption.length}/500</Text>
          </View>

          <View style={styles.categorySection}>
            <Text style={[styles.sectionLabel, { color: c.text }]}>Add a category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {CATEGORIES.map(({ key, emoji }) => {
                const active = selectedCategory === key;
                return (
                  <Pressable key={key} onPress={() => setSelectedCategory(key)} style={[styles.categoryChip, { backgroundColor: active ? c.primaryMuted : c.card, borderColor: active ? c.primary : c.border }]}>
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: active ? c.primary : c.textMuted }]}>{key}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSubtitle: { fontSize: 10, marginTop: 2 },
  shareButton: { minWidth: 68, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  shareLabel: { fontSize: 12, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 34 },
  emptyMedia: { minHeight: 220, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyMediaIcon: { width: 49, height: 49, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyMediaTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyMediaSubtitle: { fontSize: 11, marginTop: 5, marginBottom: 15, textAlign: 'center' },
  mediaActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  libraryButton: { height: 41, borderRadius: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  libraryButtonLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cameraButton: { width: 41, height: 41, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mediaSection: { marginBottom: 15 },
  previewFrame: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  carouselPage: { overflow: 'hidden' },
  previewMedia: { width: '100%', height: '100%' },
  previewTopRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mediaCountBadge: { height: 29, paddingHorizontal: 9, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.62)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  mediaCountLabel: { color: '#fff', fontSize: 10, fontWeight: '800' },
  previewIconButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center' },
  orderControls: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', gap: 7 },
  orderButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center' },
  thumbnailStrip: { gap: 8, paddingVertical: 10 },
  thumbnail: { width: 61, height: 61, borderRadius: 9, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  thumbnailImage: { width: '100%', height: '100%' },
  videoThumbnail: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  thumbnailNumber: { position: 'absolute', left: 4, bottom: 4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  thumbnailNumberText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  thumbnailRemove: { position: 'absolute', right: 1, top: 1, width: 19, height: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10 },
  addThumbnail: { width: 61, height: 61, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mediaHelper: { fontSize: 10, marginTop: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 12 },
  authorAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { fontSize: 16, fontWeight: '800' },
  authorMeta: { flex: 1 },
  authorName: { fontSize: 12, fontWeight: '800' },
  authorSchool: { fontSize: 10, marginTop: 2 },
  captionPanel: { minHeight: 116, borderWidth: 1, borderRadius: 13, padding: 12 },
  captionInput: { minHeight: 78, fontSize: 14, lineHeight: 20, padding: 0 },
  charCount: { fontSize: 9, textAlign: 'right', marginTop: 5 },
  categorySection: { marginTop: 19 },
  sectionLabel: { fontSize: 12, fontWeight: '800', marginBottom: 9 },
  categoryRow: { gap: 7, paddingBottom: 3 },
  categoryChip: { height: 35, borderWidth: 1, borderRadius: 18, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  categoryEmoji: { fontSize: 12 },
  categoryLabel: { fontSize: 11, fontWeight: '700' },
});

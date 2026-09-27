import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { addPostComment, fetchPostComments, getCommentAuthor, togglePostCommentLike, type LocalPostComment } from '@/services/postCommentsService';

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function PostCommentsScreen() {
  const { postId: rawPostId } = useLocalSearchParams<{
    postId?: string | string[];
  }>();
  const postId = Array.isArray(rawPostId) ? rawPostId[0] : rawPostId ?? '';
  const { theme } = useTheme();
  const { currentUser } = useApp();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(Math.round(Dimensions.get('screen').height * 0.7), 620);
  const [comments, setComments] = useState<LocalPostComment[]>([]);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState<string>();
  const [replyParentId, setReplyParentId] = useState<string>();
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const topLevelComments = useMemo(() => comments.filter((comment) => !comment.parentId), [comments]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => setKeyboardHeight(event.endCoordinates.height));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sheetPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onMoveShouldSetPanResponderCapture: (_event, gesture) => gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_event, gesture) => sheetTranslateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dy > 110 || gesture.vy > 1.1) {
        Animated.timing(sheetTranslateY, { toValue: sheetHeight, duration: 180, useNativeDriver: true }).start(() => router.back());
      } else {
        Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 3 }).start();
      }
    },
  }), [sheetHeight, sheetTranslateY]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetTranslateY, { toValue: sheetHeight, duration: 180, useNativeDriver: true }).start(() => {
      router.back();
    });
  }, [sheetHeight, sheetTranslateY]);

  const backdropOpacity = useMemo(
    () =>
      sheetTranslateY.interpolate({
        inputRange: [0, sheetHeight],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [sheetHeight, sheetTranslateY],
  );

  const repliesByParent = useMemo(() => {
    const grouped: Record<string, LocalPostComment[]> = {};
    comments.forEach((comment) => {
      if (!comment.parentId) return;
      grouped[comment.parentId] = [...(grouped[comment.parentId] ?? []), comment];
    });
    return grouped;
  }, [comments]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      void fetchPostComments(postId, currentUser.id).then((next) => {
        if (active) setComments(next);
      }).finally(() => {
        if (active) setLoading(false);
      });
      return () => { active = false; };
    }, [currentUser.id, postId]),
  );

  const chooseMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to attach media to a comment.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const submitComment = async (rawMessage = message, attachmentUri = imageUri, parentId = replyParentId) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || !postId || sending) return;
    setSending(true);
    setMessage('');
    try {
      await addPostComment(postId, currentUser.id, trimmed, parentId, attachmentUri);
      setComments(await fetchPostComments(postId, currentUser.id));
      setImageUri(undefined);
      setReplyParentId(undefined);
      if (parentId) setExpandedReplies((expanded) => ({ ...expanded, [parentId]: true }));
      void Haptics.selectionAsync();
    } catch {
      setMessage(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (comment: LocalPostComment) => {
    const rootCommentId = comment.parentId ?? comment.id;
    const person = getCommentAuthor(comment.authorId);
    setReplyParentId(rootCommentId);
    setMessage(`@${person.username} `);
    inputRef.current?.focus();
  };

  const renderComment = (comment: LocalPostComment, isReply = false) => {
    const person = getCommentAuthor(comment.authorId);
    const isOwnComment = comment.authorId === currentUser.id;
    const isLiked = comment.isLikedByCurrentUser ?? false;
    const openProfile = () => router.replace({ pathname: '/user-profile', params: { userId: person.id } });
    return (
      <View key={comment.id} style={[styles.commentRow, isReply && styles.replyRow]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${person.username}'s profile`} onPress={openProfile}>
          {person.avatar ? (
            <Image source={{ uri: person.avatar }} style={[styles.commentAvatar, isReply && styles.replyAvatar]} contentFit="cover" />
          ) : (
            <View style={[styles.commentAvatar, isReply && styles.replyAvatar, styles.avatarFallback, { backgroundColor: c.primaryMuted }]}>
              <Text style={[styles.avatarInitial, { color: c.primary }]}>{person.displayName[0]}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.commentContent}>
          <View style={styles.authorLine}>
            <Pressable accessibilityRole="button" onPress={openProfile}>
              <Text style={[styles.commentAuthor, { color: c.text }]}>{person.username}</Text>
            </Pressable>
            {person.isVerified && <Ionicons name="checkmark-circle" size={12} color={c.primary} />}
            {isOwnComment && <Text style={[styles.ownCommentLabel, { color: c.textMuted }]}>you</Text>}
            <Text style={[styles.commentTime, { color: c.textMuted }]}>{relativeTime(comment.createdAt)}</Text>
          </View>
          <Text style={[styles.commentMessage, { color: c.text }]}>{comment.message}</Text>
          {comment.imageUri && <Image source={{ uri: comment.imageUri }} style={styles.attachmentImage} contentFit="cover" />}
          <View style={styles.commentActions}>
            <Text style={[styles.commentTime, { color: c.textMuted }]}>{relativeTime(comment.createdAt)}</Text>
            <Pressable accessibilityRole="button" onPress={() => handleReply(comment)}>
              <Text style={[styles.replyAction, { color: c.textMuted }]}>Reply</Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLiked ? 'Unlike comment' : 'Like comment'}
          onPress={() => void togglePostCommentLike(postId, comment.id, currentUser.id).then(setComments)}
          style={styles.likeCommentButton}
        >
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={14} color={isLiked ? c.danger : c.textMuted} />
          {(comment.likes ?? 0) > 0 && <Text style={[styles.likeCount, { color: c.textMuted }]}>{comment.likes}</Text>}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close comments"
          onPress={closeSheet}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.sheetPositioner} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, backgroundColor: c.surface, borderColor: c.border, paddingBottom: Math.max(insets.bottom, 10) },
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: c.border }]} {...sheetPanResponder.panHandlers}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Comments <Text style={[styles.headerMeta, { color: c.textMuted }]}>{comments.length}</Text></Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close comments" onPress={closeSheet} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={c.text} />
            </Pressable>
          </View>

          <FlatList
            style={styles.commentsList}
            data={topLevelComments}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: keyboardHeight + 18 }]}
            ListEmptyComponent={loading ? (
              <View style={styles.emptyState}><ActivityIndicator color={c.primary} /></View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={29} color={c.textMuted} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>Be the first to comment.</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const replies = repliesByParent[item.id] ?? [];
              const expanded = Boolean(expandedReplies[item.id]);
              return (
                <View>
                  {renderComment(item)}
                  {replies.length > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setExpandedReplies((expandedItems) => ({ ...expandedItems, [item.id]: !expandedItems[item.id] }))}
                      style={styles.repliesToggle}
                    >
                      <View style={[styles.replyRule, { backgroundColor: c.border }]} />
                      <Text style={[styles.repliesToggleText, { color: c.textMuted }]}>
                        {expanded ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                      </Text>
                    </Pressable>
                  )}
                  {expanded && replies.map((reply) => renderComment(reply, true))}
                </View>
              );
            }}
          />

          <View style={[styles.bottomControls, { transform: [{ translateY: -Math.max(0, keyboardHeight - insets.bottom) }] }]}>
            <View style={[styles.composer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
              {currentUser.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.composerAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.composerAvatar, styles.avatarFallback, { backgroundColor: c.primaryMuted }]}>
                  <Text style={[styles.avatarInitial, { color: c.primary }]}>{currentUser.displayName[0]}</Text>
                </View>
              )}
              <View style={[styles.composerField, { backgroundColor: c.card, borderColor: c.border }]}>
                {replyParentId && (
                  <View style={styles.replyContext}>
                    <Text style={[styles.replyContextText, { color: c.textMuted }]}>Replying in thread</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" onPress={() => setReplyParentId(undefined)}>
                      <Ionicons name="close" size={15} color={c.textMuted} />
                    </Pressable>
                  </View>
                )}
                {imageUri && (
                  <View style={styles.attachmentPreview}>
                    <Image source={{ uri: imageUri }} style={styles.attachmentThumbnail} contentFit="cover" />
                    <Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={() => setImageUri(undefined)} style={styles.removeAttachment}>
                      <Ionicons name="close-circle" size={18} color={c.textMuted} />
                    </Pressable>
                  </View>
                )}
                <View style={styles.composerInputRow}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Write a comment..."
                    placeholderTextColor={c.textMuted}
                    multiline
                    maxLength={500}
                    ref={inputRef}
                    style={[styles.input, { color: c.text }]}
                    onSubmitEditing={() => void submitComment()}
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel="Add photo or GIF" onPress={() => void chooseMedia()} style={styles.mediaButton}>
                    <Ionicons name="image-outline" size={20} color={c.textMuted} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Choose GIF" onPress={() => void chooseMedia()} style={[styles.gifButton, { borderColor: c.border }]}>
                    <Text style={[styles.gifLabel, { color: c.textMuted }]}>GIF</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Post comment"
                    onPress={() => void submitComment()}
                    disabled={!message.trim() || sending}
                    style={[styles.sendButton, { backgroundColor: message.trim() ? c.primary : c.border }]}
                  >
                    {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={19} color="#fff" />}
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheetPositioner: { flex: 1, justifyContent: 'flex-end' },
  sheet: { width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingTop: 9 },
  sheetHeader: { minHeight: 55, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  sheetHandle: { width: 37, height: 4, borderRadius: 2, marginBottom: 8 },
  sheetTitle: { fontSize: 14, fontWeight: '800' },
  closeButton: { position: 'absolute', right: 12, top: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerMeta: { fontSize: 10, marginTop: 2 },
  commentsList: { flex: 1, minHeight: 0 },
  listContent: { flexGrow: 1, paddingBottom: 18 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 11, fontWeight: '900' },
  emptyState: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 9 },
  emptyText: { fontSize: 12, fontWeight: '600' },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  replyRow: { paddingLeft: 58 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  replyAvatar: { width: 29, height: 29, borderRadius: 15 },
  commentContent: { flex: 1, paddingTop: 1 },
  authorLine: { minHeight: 17, flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentAuthor: { fontSize: 12, fontWeight: '800' },
  ownCommentLabel: { fontSize: 9, fontWeight: '700' },
  commentTime: { fontSize: 9, fontWeight: '600', marginLeft: 'auto' },
  commentMessage: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 6 },
  replyAction: { fontSize: 10, fontWeight: '700' },
  likeCommentButton: { minWidth: 26, alignItems: 'center', justifyContent: 'center', paddingTop: 6, gap: 3 },
  likeCount: { fontSize: 9, fontWeight: '600' },
  attachmentImage: { width: 146, height: 110, borderRadius: 9, marginTop: 8 },
  repliesToggle: { height: 31, marginLeft: 62, flexDirection: 'row', alignItems: 'center', gap: 9 },
  replyRule: { width: 25, height: StyleSheet.hairlineWidth },
  repliesToggleText: { fontSize: 10, fontWeight: '800' },
  bottomControls: { flexShrink: 0 },
  replyContext: { minHeight: 27, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyContextText: { fontSize: 10, fontWeight: '600' },
  attachmentPreview: { minHeight: 54, paddingHorizontal: 8, paddingTop: 7, flexDirection: 'row', alignItems: 'center' },
  attachmentThumbnail: { width: 40, height: 40, borderRadius: 7 },
  removeAttachment: { marginLeft: -9, alignSelf: 'flex-start' },
  composer: { minHeight: 61, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  composerAvatar: { width: 32, height: 32, borderRadius: 16 },
  composerField: { flex: 1, minWidth: 0, minHeight: 42, borderWidth: 1, borderRadius: 20, justifyContent: 'center' },
  composerInputRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', paddingLeft: 11, paddingRight: 5, gap: 2 },
  input: { flex: 1, minWidth: 0, minHeight: 38, maxHeight: 84, paddingVertical: 8, fontSize: 12 },
  mediaButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  gifButton: { width: 33, height: 25, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  gifLabel: { fontSize: 9, fontWeight: '900' },
  sendButton: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

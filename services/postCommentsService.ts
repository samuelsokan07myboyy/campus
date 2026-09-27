import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserById } from '@/context/AppContext';

export type LocalPostComment = {
  id: string;
  postId: string;
  authorId: string;
  message: string;
  createdAt: string;
  parentId?: string;
  imageUri?: string;
  likes?: number;
  likedBy?: string[];
  isLikedByCurrentUser?: boolean;
};

const STORAGE_KEY = '@campus_post_comments_v1';

type CommentStore = Record<string, LocalPostComment[]>;

function seedComments(): CommentStore {
  const now = Date.now();
  return {
    'post-1': [
      { id: 'post-1-comment-1', postId: 'post-1', authorId: 'user-niko-01', message: 'This light is unreal. Where did you all set up?', createdAt: new Date(now - 1000 * 60 * 14).toISOString(), likes: 4, likedBy: [] },
      { id: 'post-1-reply-1', postId: 'post-1', parentId: 'post-1-comment-1', authorId: 'user-maya-01', message: 'East steps, just past the big windows!', createdAt: new Date(now - 1000 * 60 * 12).toISOString(), likes: 1, likedBy: [] },
      { id: 'post-1-reply-2', postId: 'post-1', parentId: 'post-1-comment-1', authorId: 'user-ari-01', message: 'The view up there is perfect.', createdAt: new Date(now - 1000 * 60 * 9).toISOString(), likes: 0, likedBy: [] },
      { id: 'post-1-comment-2', postId: 'post-1', authorId: 'user-ari-01', message: 'Library crew knows the best spots ☀️', createdAt: new Date(now - 1000 * 60 * 31).toISOString(), likes: 2, likedBy: [] },
      { id: 'post-1-comment-3', postId: 'post-1', authorId: 'user-samuel-01', message: 'Saving this spot for next week.', createdAt: new Date(now - 1000 * 60 * 56).toISOString(), likes: 1, likedBy: [] },
    ],
    'post-2': [
      { id: 'post-2-comment-1', postId: 'post-2', authorId: 'user-maya-01', message: 'That coffee stop is becoming a campus classic.', createdAt: new Date(now - 1000 * 60 * 23).toISOString() },
      { id: 'post-2-comment-2', postId: 'post-2', authorId: 'user-ari-01', message: 'Exam fuel acquired ☕', createdAt: new Date(now - 1000 * 60 * 75).toISOString() },
    ],
    'post-3': [
      { id: 'post-3-comment-1', postId: 'post-3', authorId: 'user-maya-01', message: 'Need a quiet corner like this for my next project.', createdAt: new Date(now - 1000 * 60 * 48).toISOString() },
    ],
  };
}

async function readCommentStore(): Promise<CommentStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as CommentStore;
    }
  } catch (error) {
    console.warn('Unable to load local post comments:', error);
  }

  const seeded = seedComments();
  await writeCommentStore(seeded);
  return seeded;
}

async function writeCommentStore(comments: CommentStore) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch (error) {
    console.warn('Unable to save local post comments:', error);
  }
}

export async function fetchPostComments(postId: string, currentUserId?: string): Promise<LocalPostComment[]> {
  const comments = await readCommentStore();
  return [...(comments[postId] ?? [])].sort((first, second) =>
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  ).map((comment) => ({
    ...comment,
    likes: comment.likes ?? 0,
    likedBy: comment.likedBy ?? [],
    isLikedByCurrentUser: Boolean(currentUserId && comment.likedBy?.includes(currentUserId)),
  }));
}

export async function addPostComment(
  postId: string,
  authorId: string,
  message: string,
  parentId?: string,
  imageUri?: string,
): Promise<LocalPostComment[]> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage && !imageUri) return fetchPostComments(postId);

  const comments = await readCommentStore();
  const nextComment: LocalPostComment = {
    id: `local-comment-${Date.now()}`,
    postId,
    authorId,
    message: trimmedMessage,
    createdAt: new Date().toISOString(),
    parentId,
    imageUri,
    likes: 0,
    likedBy: [],
  };
  comments[postId] = [...(comments[postId] ?? []), nextComment];
  await writeCommentStore(comments);
  return fetchPostComments(postId);
}

export async function togglePostCommentLike(postId: string, commentId: string, userId: string): Promise<LocalPostComment[]> {
  const comments = await readCommentStore();
  const comment = comments[postId]?.find((item) => item.id === commentId);
  if (!comment) return fetchPostComments(postId, userId);

  const likedBy = comment.likedBy ?? [];
  if (likedBy.includes(userId)) {
    comment.likedBy = likedBy.filter((id) => id !== userId);
    comment.likes = Math.max(0, (comment.likes ?? 0) - 1);
  } else {
    comment.likedBy = [...likedBy, userId];
    comment.likes = (comment.likes ?? 0) + 1;
  }

  await writeCommentStore(comments);
  return fetchPostComments(postId, userId);
}

export function getCommentAuthor(authorId: string) {
  return getUserById(authorId);
}

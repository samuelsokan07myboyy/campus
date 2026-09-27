import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post } from '@/types';

const STORAGE_KEY = '@campus_local_posts_v1';

type StoredPost = Omit<Post, 'createdAt'> & { createdAt: string };

export async function fetchLocalPosts(): Promise<Post[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredPost[]).map((post) => ({
      ...post,
      createdAt: new Date(post.createdAt),
    }));
  } catch (error) {
    console.warn('Unable to load locally created posts:', error);
    return [];
  }
}

export async function saveLocalPost(post: Post): Promise<Post[]> {
  const existing = await fetchLocalPosts();
  const next = [post, ...existing.filter((item) => item.id !== post.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

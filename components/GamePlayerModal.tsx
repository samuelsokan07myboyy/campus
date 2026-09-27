import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/context/ThemeContext';
import type { ArcadeGame } from '@/services/arcadeService';

type Props = {
  game: ArcadeGame | null;
  visible: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
};

export default function GamePlayerModal({
  game,
  visible,
  isFavorite,
  onClose,
  onToggleFavorite,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const immersiveLandscape = visible && window.width > window.height;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [landscapeRequested, setLandscapeRequested] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const menuWidth = menuOpen ? Math.min(340, window.width - Math.max(insets.left, 8) - Math.max(insets.right, 8) - 16) : 48;
  const initialMenuPosition = {
    x: Math.max(insets.left, 8) + 8,
    y: Math.max(insets.top, 8) + 8,
  };
  const menuPosition = useRef(new Animated.ValueXY(initialMenuPosition)).current;
  const menuPositionRef = useRef(initialMenuPosition);
  const dragStartRef = useRef(initialMenuPosition);

  useEffect(() => {
    const minX = Math.max(insets.left, 8);
    const minY = Math.max(insets.top, 8);
    const maxX = Math.max(minX, window.width - menuWidth - Math.max(insets.right, 8));
    const maxY = Math.max(minY, window.height - 48 - Math.max(insets.bottom, 8));
    const x = Math.min(Math.max(menuPositionRef.current.x, minX), maxX);
    const y = Math.min(Math.max(menuPositionRef.current.y, minY), maxY);
    menuPositionRef.current = { x, y };
    menuPosition.setValue({ x, y });
  }, [insets.bottom, insets.left, insets.right, insets.top, menuPosition, menuWidth, window.height, window.width]);

  const dragPanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRef.current = menuPositionRef.current;
      },
      onPanResponderMove: (_event, gesture) => {
        const minX = Math.max(insets.left, 8);
        const minY = Math.max(insets.top, 8);
        const maxX = Math.max(minX, window.width - menuWidth - Math.max(insets.right, 8));
        const maxY = Math.max(minY, window.height - 48 - Math.max(insets.bottom, 8));
        const x = Math.min(Math.max(dragStartRef.current.x + gesture.dx, minX), maxX);
        const y = Math.min(Math.max(dragStartRef.current.y + gesture.dy, minY), maxY);
        menuPositionRef.current = { x, y };
        menuPosition.setValue({ x, y });
      },
      onPanResponderRelease: () => {
        Animated.spring(menuPosition, {
          toValue: menuPositionRef.current,
          useNativeDriver: true,
          speed: 22,
          bounciness: 4,
        }).start();
      },
    }),
    [insets.bottom, insets.left, insets.right, insets.top, menuPosition, menuWidth, window.height, window.width],
  );

  useEffect(() => {
    if (!visible || !game || Platform.OS === 'web') return;

    return () => {
      setLandscapeRequested(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch((orientationError) => {
        console.warn('Unable to restore portrait orientation:', orientationError);
      });
    };
  }, [visible, game?.id, game?.width, game?.height]);

  const handlePlayerShown = () => {
    if (!game || Platform.OS === 'web') return;

    setLandscapeRequested(false);
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch((orientationError) => {
      console.warn('Unable to set portrait orientation for game:', orientationError);
    });
  };

  const toggleGameOrientation = async () => {
    if (Platform.OS === 'web') return;

    const nextLandscape = !landscapeRequested;
    try {
      await ScreenOrientation.lockAsync(
        nextLandscape
          ? ScreenOrientation.OrientationLock.LANDSCAPE
          : ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
      setLandscapeRequested(nextLandscape);
    } catch (orientationError) {
      console.warn('Unable to change game orientation:', orientationError);
    }
  };

  const injectedCode = useMemo(
    () => `
      (function () {
        try {
          const meta = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
          if (!document.querySelector('meta[name="viewport"]')) document.head.appendChild(meta);

          const css = document.createElement('style');
          css.innerHTML = '* { box-sizing: border-box; } html, body { position: fixed; inset: 0; margin: 0; padding: 0; overflow: hidden; background: #000; width: 100%; height: 100%; -webkit-tap-highlight-color: transparent; } body { touch-action: manipulation; } canvas { display: block !important; width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important; margin: 0 !important; }';
          document.head.appendChild(css);

          document.body.style.margin = '0';
          document.body.style.overflow = 'hidden';
          document.body.style.background = '#000';
          document.body.style.touchAction = 'manipulation';
        } catch (e) {}
        true;
      })();
    `,
    [],
  );

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite();
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    if (error) {
      setError(false);
      return;
    }
    webViewRef.current?.reload();
  };

  if (!game) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={handlePlayerShown}
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      transparent={false}
    >
      <StatusBar hidden={false} style={theme.dark ? 'light' : 'dark'} animated />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View
          style={[
            styles.gameContent,
            !immersiveLandscape && {
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          {error ? (
            <View style={[styles.errorState, { backgroundColor: c.background }]}>
              <Ionicons name="warning-outline" size={52} color={c.primary} />
              <Text style={[styles.errorTitle, { color: c.text }]}>Couldn't load this game</Text>
              <View style={styles.errorActions}>
                <Pressable onPress={handleRefresh} style={[styles.primaryButton, { backgroundColor: c.primary }]}>
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </Pressable>
                <Pressable onPress={onClose} style={[styles.secondaryButton, { borderColor: c.border }]}>
                  <Text style={[styles.secondaryButtonText, { color: c.text }]}>Back to Games</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.webViewWrap}>
              <WebView
                ref={webViewRef}
                key={game.id}
                source={{ uri: game.url }}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                injectedJavaScript={injectedCode}
                onLoad={() => {
                  setLoading(false);
                  setError(false);
                }}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                onHttpError={() => {
                  setLoading(false);
                  setError(true);
                }}
                startInLoadingState={false}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                scalesPageToFit={false}
                setBuiltInZoomControls={false}
                setDisplayZoomControls={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={styles.webView}
              />

              {loading && (
                <View style={[styles.loaderOverlay, { backgroundColor: c.background + 'E6' }]} pointerEvents="none">
                  <ActivityIndicator size="large" color={c.primary} />
                  <Text style={[styles.loaderText, { color: c.text }]}>🎮 Loading game...</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {visible && (
          <Animated.View
            style={[
              styles.floatingMenu,
              menuOpen ? styles.landscapeMenuOpen : styles.landscapeMenuClosed,
              { width: menuWidth, transform: menuPosition.getTranslateTransform() },
            ]}
            {...dragPanResponder.panHandlers}
          >
            {menuOpen ? (
              <>
                <View style={styles.dragHandle} {...dragPanResponder.panHandlers}>
                  <Ionicons name="reorder-three" size={23} color="#fff" />
                </View>
                <Text style={styles.landscapeTitle} numberOfLines={1} {...dragPanResponder.panHandlers}>
                  {game.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  onPress={handleFavoritePress}
                  style={styles.landscapeAction}
                >
                  <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={19} color={isFavorite ? c.danger : '#fff'} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={landscapeRequested ? 'Rotate to portrait' : 'Rotate to landscape'}
                  onPress={toggleGameOrientation}
                  style={styles.landscapeAction}
                >
                  <Ionicons name={landscapeRequested ? 'phone-portrait-outline' : 'phone-landscape-outline'} size={19} color="#fff" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Reload game" onPress={handleRefresh} style={styles.landscapeAction}>
                  <Ionicons name="refresh" size={19} color="#fff" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Exit game" onPress={onClose} style={styles.landscapeAction}>
                  <Ionicons name="close" size={21} color="#fff" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Collapse game menu" onPress={() => setMenuOpen(false)} style={styles.landscapeAction}>
                  <Ionicons name="chevron-up" size={19} color="#fff" />
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open game menu"
                onPress={() => setMenuOpen(true)}
                style={styles.collapsedMenuButton}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameContent: {
    flex: 1,
  },
  floatingMenu: {
    position: 'absolute',
    zIndex: 100,
    elevation: 100,
    backgroundColor: 'rgba(12, 14, 20, 0.86)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  landscapeMenuOpen: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  landscapeMenuClosed: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 32,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  landscapeTitle: {
    flex: 1,
    minWidth: 28,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  landscapeAction: {
    width: 34,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedMenuButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewWrap: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorActions: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

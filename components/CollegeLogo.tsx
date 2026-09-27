import React, { useState } from 'react';
import { Image, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getSchoolBrand } from '@/constants/schoolBrand';
import { getCollegeInfo } from '@/services/colleges';

// ─── CollegeLogo badge component ──────────────────────────────────────────
/**
 * Renders the college/university logo fetched from Google Favicon CDN.
 * Falls back instantly to a branded initial-letter badge.
 */
export function CollegeLogo({
  schoolName,
  size = 36,
  borderRadius,
  style,
}: {
  schoolName?: string | null;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const brand = getSchoolBrand(schoolName ?? undefined);
  const info = getCollegeInfo(schoolName);
  const [imgError, setImgError] = useState(false);

  const br = borderRadius ?? Math.round(size / 5);
  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: br,
    backgroundColor: brand.logoBackground ?? brand.color,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  // 1. Bundled local asset (pre-bundled seals like Temple, UCLA, USC, Berkeley)
  if (brand.logo && typeof brand.logo === 'number') {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={brand.logo}
          style={{ width: size * 0.9, height: size * 0.9 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // 2. Google Favicon CDN via college domain info
  if (info?.logoUrl && !imgError) {
    return (
      <View style={[containerStyle, style]}>
        <ExpoImage
          source={{ uri: info.logoUrl }}
          style={{ width: size * 0.85, height: size * 0.85 }}
          contentFit="contain"
          cachePolicy="disk"
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  // 3. Branded monogram badge fallback
  const fontSize = size * 0.38;
  const label = (brand.short ?? 'U').slice(0, 3);
  return (
    <View style={[containerStyle, style]}>
      <Text
        style={{
          color: brand.accent ?? '#FFFFFF',
          fontSize,
          fontWeight: '800',
          letterSpacing: -0.5,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}

// ─── SchoolLogo (used inside existing badge containers) ───────────────────
export function SchoolLogo({
  logo,
  short,
  accent,
  backgroundColor,
  schoolName,
  size = 18,
}: {
  logo?: string | number;
  short?: string;
  accent?: string;
  backgroundColor?: string;
  schoolName?: string;
  size?: number;
}) {
  const brand = getSchoolBrand(schoolName);
  const info = getCollegeInfo(schoolName);
  const [imgError, setImgError] = useState(false);

  const resolvedLogo = logo ?? brand.logo;

  // Bundled local asset takes priority
  if (resolvedLogo && typeof resolvedLogo === 'number' && !imgError) {
    return (
      <Image
        source={resolvedLogo}
        style={{ width: size, height: size, borderRadius: 4 }}
        resizeMode="contain"
        onError={() => setImgError(true)}
      />
    );
  }

  // Remote URL passed directly
  if (resolvedLogo && typeof resolvedLogo === 'string' && !imgError) {
    return (
      <ExpoImage
        source={{ uri: resolvedLogo }}
        style={{ width: size, height: size, borderRadius: 4 }}
        contentFit="contain"
        cachePolicy="disk"
        onError={() => setImgError(true)}
      />
    );
  }

  // Google Favicon CDN via service
  if (info?.logoUrl && !imgError) {
    return (
      <ExpoImage
        source={{ uri: info.logoUrl }}
        style={{ width: size, height: size, borderRadius: 4 }}
        contentFit="contain"
        cachePolicy="disk"
        onError={() => setImgError(true)}
      />
    );
  }

  // Clean monogram text fallback inside the existing badge
  const label = short ?? brand.short ?? 'U';
  const textColor = accent ?? brand.accent ?? '#FFFFFF';
  return (
    <Text
      style={{
        color: textColor,
        fontSize: Math.max(9, Math.round(size * 0.58)),
        fontWeight: '800',
        textAlign: 'center',
      }}
      numberOfLines={1}
    >
      {label.slice(0, 3)}
    </Text>
  );
}

/**
 * BrandedSplashScreen Component
 *
 * A branded splash screen that displays the app icon, name, and tagline.
 *
 * @example
 * ```tsx
 * <BrandedSplashScreen />
 * ```
 */

import React from 'react'
import { View, Text, Image } from 'react-native'
import { useBranding, useTheme } from '../ThemeCustomization'
import { BrandedIcon } from './BrandedIcon'
import { styles } from './styles'

export function BrandedSplashScreen() {
  const branding = useBranding()
  const theme = useTheme()

  return (
    <View
      style={[styles.splashContainer, { backgroundColor: theme.colors.primary }]}
    >
      {branding.splashScreen ? (
        <Image
          source={{ uri: branding.splashScreen }}
          style={styles.splashImage}
          resizeMode="cover"
        />
      ) : (
        <>
          <BrandedIcon size={120} />
          <Text
            style={[
              styles.appName,
              { color: '#FFFFFF', marginTop: theme.spacing.lg },
            ]}
          >
            {branding.appName}
          </Text>
          {branding.tagline && (
            <Text
              style={[
                styles.tagline,
                { color: '#FFFFFF', marginTop: theme.spacing.xs },
              ]}
            >
              {branding.tagline}
            </Text>
          )}
        </>
      )}
    </View>
  )
}

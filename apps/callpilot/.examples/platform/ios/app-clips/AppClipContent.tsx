/**
 * AppClipContent.tsx
 *
 * Content components for different App Clip invocation types
 */

import React from 'react';
import { View, Text, Button } from 'react-native';
import { AppClipConfig, AppClipInvocationType, ClipContentProps } from './types';
import { styles } from './styles';

/**
 * Main App Clip Content Component
 * Routes to appropriate content based on invocation type
 */
export function AppClipContent({ config }: { config: AppClipConfig }) {
  switch (config.invocationType) {
    case AppClipInvocationType.QRCode:
      return <QRCodeClipContent metadata={config.metadata} />;

    case AppClipInvocationType.NFCTag:
      return <NFCClipContent metadata={config.metadata} />;

    default:
      return <DefaultClipContent />;
  }
}

/**
 * QR Code App Clip Content
 * Displayed when App Clip is invoked via QR code
 */
export function QRCodeClipContent({ metadata }: ClipContentProps) {
  const taskId = metadata?.taskId;

  return (
    <View style={styles.contentContainer}>
      <Text style={styles.contentTitle}>Quick Task View</Text>

      {taskId ? (
        <>
          <Text style={styles.contentText}>Task ID: {taskId}</Text>
          <Button title="View Task Details" onPress={() => {}} />
          <Button title="Mark Complete" onPress={() => {}} />
        </>
      ) : (
        <Text style={styles.contentText}>Scan a task QR code to get started</Text>
      )}
    </View>
  );
}

/**
 * NFC Tag App Clip Content
 * Displayed when App Clip is invoked via NFC tag
 */
export function NFCClipContent({ metadata }: ClipContentProps) {
  const locationId = metadata?.locationId;

  return (
    <View style={styles.contentContainer}>
      <Text style={styles.contentTitle}>Location Check-in</Text>

      {locationId ? (
        <>
          <Text style={styles.contentText}>Location: {locationId}</Text>
          <Button title="Check In" onPress={() => {}} />
        </>
      ) : (
        <Text style={styles.contentText}>Tap NFC tag to check in</Text>
      )}
    </View>
  );
}

/**
 * Default App Clip Content
 * Displayed when invocation type is unknown
 */
export function DefaultClipContent() {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.contentTitle}>Quick Actions</Text>

      <View style={styles.actionList}>
        <Button title="Create New Task" onPress={() => {}} />
        <Button title="View My Tasks" onPress={() => {}} />
        <Button title="Search Tasks" onPress={() => {}} />
      </View>
    </View>
  );
}

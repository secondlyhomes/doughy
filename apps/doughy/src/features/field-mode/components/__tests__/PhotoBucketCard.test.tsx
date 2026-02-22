// Tests for PhotoBucketCard component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PhotoBucketCard } from '../PhotoBucketCard';
import { WalkthroughItem, PhotoBucket } from '../../../deals/types';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'mock-camera-uri.jpg' }]
  })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'mock-gallery-uri.jpg' }]
  })),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native-ios18-liquid-glass
jest.mock('react-native-ios18-liquid-glass', () => ({
  LiquidGlassView: ({ children }: { children: React.ReactNode }) => children,
  isLiquidGlassSupported: () => false,
}), { virtual: true });

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: object) => React.createElement(View, { testID: `icon-${name}`, ...props });
    return MockIcon;
  };
  return {
    Camera: createMockIcon('Camera'),
    ImageIcon: createMockIcon('ImageIcon'),
    X: createMockIcon('X'),
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronUp: createMockIcon('ChevronUp'),
    Home: createMockIcon('Home'),
    UtensilsCrossed: createMockIcon('UtensilsCrossed'),
    Bath: createMockIcon('Bath'),
    Wrench: createMockIcon('Wrench'),
    Zap: createMockIcon('Zap'),
    FileText: createMockIcon('FileText'),
    Mic: createMockIcon('Mic'),
  };
});

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',
    foreground: '#000000',
    background: '#FFFFFF',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
    border: '#E5E5E5',
  }),
}));

describe('PhotoBucketCard', () => {
  const mockOnAddPhoto = jest.fn();
  const mockOnRemoveItem = jest.fn();
  const mockOnRecordMemo = jest.fn();

  const mockPhotoItems: WalkthroughItem[] = [
    {
      id: 'photo1',
      walkthrough_id: 'w1',
      bucket: 'kitchen',
      item_type: 'photo',
      file_url: 'test-photo-1.jpg',
    },
    {
      id: 'photo2',
      walkthrough_id: 'w1',
      bucket: 'kitchen',
      item_type: 'photo',
      file_url: 'test-photo-2.jpg',
    },
  ];

  const mockMemoItems: WalkthroughItem[] = [
    {
      id: 'memo1',
      walkthrough_id: 'w1',
      bucket: 'kitchen',
      item_type: 'voice_memo',
      file_url: 'test-memo-1.m4a',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render bucket title', () => {
    const { getByText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    expect(getByText('Kitchen')).toBeTruthy();
  });

  it('should display item counts', () => {
    const { getByText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[...mockPhotoItems, ...mockMemoItems]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    expect(getByText('2 photos')).toBeTruthy();
    expect(getByText('1 memo')).toBeTruthy();
  });

  it('should display singular forms for single items', () => {
    const { getByText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[mockPhotoItems[0]]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    expect(getByText('1 photo')).toBeTruthy();
  });

  it('should toggle expanded state', () => {
    const { getByLabelText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={mockPhotoItems}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    const toggleButton = getByLabelText('Toggle Kitchen bucket');
    fireEvent.press(toggleButton);

    // Component should still be in DOM, just collapsed
    expect(toggleButton).toBeTruthy();
  });

  it('should render camera button', () => {
    const { getByLabelText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    expect(getByLabelText('Take photo')).toBeTruthy();
  });

  it('should render gallery button', () => {
    const { getByLabelText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    expect(getByLabelText('Choose from gallery')).toBeTruthy();
  });

  it('should render record memo button', () => {
    const { getByLabelText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    expect(getByLabelText('Record voice memo')).toBeTruthy();
  });

  it('should call onRecordMemo when record button is pressed', () => {
    const { getByLabelText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
      />
    );

    fireEvent.press(getByLabelText('Record voice memo'));

    expect(mockOnRecordMemo).toHaveBeenCalledWith('kitchen');
  });

  it('should not call handlers when disabled', () => {
    const { getByLabelText } = render(
      <PhotoBucketCard
        bucket="kitchen"
        items={[]}
        onAddPhoto={mockOnAddPhoto}
        onRemoveItem={mockOnRemoveItem}
        onRecordMemo={mockOnRecordMemo}
        disabled
      />
    );

    fireEvent.press(getByLabelText('Record voice memo'));

    expect(mockOnRecordMemo).not.toHaveBeenCalled();
  });

  it('should render all bucket types correctly', () => {
    const buckets: PhotoBucket[] = [
      'exterior_roof',
      'kitchen',
      'baths',
      'basement_mechanical',
      'electrical_plumbing',
      'notes_other',
    ];

    buckets.forEach((bucket) => {
      const { getByText } = render(
        <PhotoBucketCard
          bucket={bucket}
          items={[]}
          onAddPhoto={mockOnAddPhoto}
          onRemoveItem={mockOnRemoveItem}
          onRecordMemo={mockOnRecordMemo}
        />
      );

      // Should render without errors
      expect(getByText).toBeTruthy();
    });
  });
});

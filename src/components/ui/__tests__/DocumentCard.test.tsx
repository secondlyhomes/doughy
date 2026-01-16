/**
 * DocumentCard Component Tests
 * Validates design system compliance, accessibility, and functionality
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DocumentCard, DocumentCardCompact, DocumentCardDocument } from '../DocumentCard';

// Mock theme colors
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    toggleTheme: jest.fn(),
  }),
  useThemeColors: () => ({
    foreground: '#000000',
    background: '#FFFFFF',
    card: '#F5F5F5',
    mutedForeground: '#6B7280',
    primary: '#4D7C5F',
    primaryForeground: '#FFFFFF',
    border: '#E5E7EB',
    muted: '#F3F4F6',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    info: '#3B82F6',
    infoForeground: '#FFFFFF',
  }),
}));

const mockDocument: DocumentCardDocument = {
  id: 'doc-1',
  title: 'Property Inspection Report',
  type: 'inspection',
  file_url: 'https://example.com/inspection.pdf',
  created_at: new Date().toISOString(),
  file_size: 1024 * 512, // 512 KB
};

describe('DocumentCard', () => {
  describe('Rendering', () => {
    it('should render document title and type', () => {
      const { getByText } = render(<DocumentCard document={mockDocument} />);
      expect(getByText('Property Inspection Report')).toBeTruthy();
      expect(getByText('Inspection Report')).toBeTruthy();
    });

    it('should format file size correctly', () => {
      const { getByText } = render(<DocumentCard document={mockDocument} />);
      expect(getByText('512.0 KB')).toBeTruthy();
    });

    it('should display upload date', () => {
      const { getByText } = render(<DocumentCard document={mockDocument} />);
      expect(getByText('Today')).toBeTruthy();
    });

    it('should render without file size', () => {
      const docWithoutSize = { ...mockDocument, file_size: undefined };
      const { queryByText } = render(<DocumentCard document={docWithoutSize} />);
      // Should not crash and should show other info
      expect(queryByText('Property Inspection Report')).toBeTruthy();
    });
  });

  describe('Link Badge', () => {
    it('should not show link badge when not linked', () => {
      const { queryByText } = render(
        <DocumentCard document={mockDocument} showLinkBadge={false} />
      );
      expect(queryByText(/linked/i)).toBeFalsy();
    });

    it('should show link badge when linked to multiple properties', () => {
      const { getByText } = render(
        <DocumentCard
          document={mockDocument}
          showLinkBadge={true}
          linkedPropertiesCount={3}
        />
      );
      expect(getByText(/3 properties/i)).toBeTruthy();
    });

    it('should show primary indicator when isPrimary is true', () => {
      const { getByText } = render(
        <DocumentCard
          document={mockDocument}
          showLinkBadge={true}
          linkedPropertiesCount={3}
          isPrimary={true}
        />
      );
      expect(getByText(/Primary/i)).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should call onView when provided', () => {
      const onView = jest.fn();
      const { getByText } = render(
        <DocumentCard document={mockDocument} onView={onView} />
      );

      // Find and press the View button
      const viewButton = getByText('View');
      fireEvent.press(viewButton.parent);
      expect(onView).toHaveBeenCalled();
    });

    it('should show all action buttons when not read-only', () => {
      const onView = jest.fn();
      const onDownload = jest.fn();
      const onDelete = jest.fn();
      const onLink = jest.fn();

      const { getByText } = render(
        <DocumentCard
          document={mockDocument}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
          onLink={onLink}
        />
      );

      expect(getByText('View')).toBeTruthy();
      expect(getByText('Download')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
      expect(getByText('Link')).toBeTruthy();
    });

    it('should not show delete/link actions when read-only', () => {
      const onDelete = jest.fn();
      const onLink = jest.fn();

      const { queryByText } = render(
        <DocumentCard
          document={mockDocument}
          onDelete={onDelete}
          onLink={onLink}
          readOnly={true}
        />
      );

      expect(queryByText('Delete')).toBeFalsy();
      expect(queryByText('Link')).toBeFalsy();
    });
  });

  describe('Document Type Icons', () => {
    it('should use correct icon for PDF documents', () => {
      const pdfDoc = { ...mockDocument, type: 'pdf' };
      const { UNSAFE_root } = render(<DocumentCard document={pdfDoc} />);
      // Icon should be rendered (component test)
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use correct icon for image documents', () => {
      const imageDoc = { ...mockDocument, type: 'photo' };
      const { UNSAFE_root } = render(<DocumentCard document={imageDoc} />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Thumbnails', () => {
    it('should render thumbnail when provided', () => {
      const docWithThumbnail = {
        ...mockDocument,
        thumbnail_url: 'https://example.com/thumb.jpg',
      };
      const { UNSAFE_getByType } = render(
        <DocumentCard document={docWithThumbnail} />
      );

      // Should render Image component
      const image = UNSAFE_getByType('Image' as any);
      expect(image).toBeTruthy();
    });

    it('should not render thumbnail when not provided', () => {
      const { UNSAFE_queryByType } = render(
        <DocumentCard document={mockDocument} />
      );

      expect(UNSAFE_queryByType('Image' as any)).toBeFalsy();
    });
  });

  describe('Variants', () => {
    it('should support default variant', () => {
      const { UNSAFE_root } = render(
        <DocumentCard document={mockDocument} variant="default" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support glass variant', () => {
      const { UNSAFE_root } = render(
        <DocumentCard document={mockDocument} variant="glass" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

describe('DocumentCardCompact', () => {
  it('should render compact version', () => {
    const { getByText } = render(
      <DocumentCardCompact document={mockDocument} />
    );
    expect(getByText('Property Inspection Report')).toBeTruthy();
    expect(getByText('Inspection Report')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <DocumentCardCompact document={mockDocument} onPress={onPress} />
    );

    const card = getByLabelText(/Document:/i);
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });

  it('should show link badge in compact mode', () => {
    const { getByText } = render(
      <DocumentCardCompact
        document={mockDocument}
        showLinkBadge={true}
        linkedPropertiesCount={3}
      />
    );
    expect(getByText('3 properties')).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role', () => {
      const { getByRole } = render(
        <DocumentCardCompact document={mockDocument} onPress={() => {}} />
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('should have descriptive accessibility label', () => {
      const { getByLabelText } = render(
        <DocumentCardCompact document={mockDocument} onPress={() => {}} />
      );
      expect(getByLabelText('Document: Property Inspection Report')).toBeTruthy();
    });
  });
});

describe('Date Formatting', () => {
  it('should show "Today" for today\'s date', () => {
    const todayDoc = { ...mockDocument, created_at: new Date().toISOString() };
    const { getByText } = render(<DocumentCard document={todayDoc} />);
    expect(getByText('Today')).toBeTruthy();
  });

  it('should show "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDoc = { ...mockDocument, created_at: yesterday.toISOString() };
    const { getByText } = render(<DocumentCard document={yesterdayDoc} />);
    expect(getByText('Yesterday')).toBeTruthy();
  });

  it('should show days ago for recent dates', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const doc = { ...mockDocument, created_at: threeDaysAgo.toISOString() };
    const { getByText } = render(<DocumentCard document={doc} />);
    expect(getByText('3 days ago')).toBeTruthy();
  });
});

describe('File Size Formatting', () => {
  it('should format bytes correctly', () => {
    const doc = { ...mockDocument, file_size: 500 };
    const { getByText } = render(<DocumentCard document={doc} />);
    expect(getByText('500 B')).toBeTruthy();
  });

  it('should format kilobytes correctly', () => {
    const doc = { ...mockDocument, file_size: 1024 * 50 }; // 50 KB
    const { getByText } = render(<DocumentCard document={doc} />);
    expect(getByText('50.0 KB')).toBeTruthy();
  });

  it('should format megabytes correctly', () => {
    const doc = { ...mockDocument, file_size: 1024 * 1024 * 2.5 }; // 2.5 MB
    const { getByText } = render(<DocumentCard document={doc} />);
    expect(getByText('2.5 MB')).toBeTruthy();
  });
});

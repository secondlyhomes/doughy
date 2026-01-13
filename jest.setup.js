// Mock expo winter runtime modules
jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal', () => ({}), { virtual: true });

// Mock expo module first to prevent winter runtime issues
jest.mock('expo', () => ({
  __esModule: true,
  default: {},
}));

// Mock expo constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: {} },
    manifest: {},
  },
}));

// Jest matchers are now included by default in @testing-library/react-native v12.4+

// Mock react-native-css-interop (NativeWind)
jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn((component) => component),
  remapProps: jest.fn((component) => component),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => inset,
  };
});

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      setParams: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useGlobalSearchParams: () => ({}),
    useSegments: () => [],
    usePathname: () => '/',
    useNavigationContainerRef: () => ({ current: null }),
    useFocusEffect: jest.fn(),
    Link: ({ children, href, ...props }) => React.createElement(Text, props, children),
    Redirect: ({ href }) => React.createElement(View, { testID: `redirect-${href}` }),
    Stack: {
      Screen: () => null,
    },
    Tabs: {
      Screen: () => null,
    },
    Slot: ({ children }) => React.createElement(View, null, children),
  };
});

// Note: React Navigation mocks removed - project now uses Expo Router exclusively

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View, TouchableOpacity } = require('react-native');
  return {
    GestureHandlerRootView: ({ children, style }) => React.createElement(View, { style }, children),
    Swipeable: React.forwardRef(({ children }, ref) => {
      React.useImperativeHandle(ref, () => ({
        close: jest.fn(),
      }));
      return React.createElement(View, { testID: 'swipeable' }, children);
    }),
    RectButton: ({ children, onPress, style }) =>
      React.createElement(TouchableOpacity, { onPress, style, testID: 'rect-button' }, children),
  };
});

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockIcon = (name) => {
    const MockIcon = (props) => React.createElement(View, { testID: `icon-${name}`, ...props });
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ArrowLeft: createMockIcon('ArrowLeft'),
    Users: createMockIcon('Users'),
    Database: createMockIcon('Database'),
    Server: createMockIcon('Server'),
    AlertTriangle: createMockIcon('AlertTriangle'),
    TrendingUp: createMockIcon('TrendingUp'),
    Activity: createMockIcon('Activity'),
    ChevronRight: createMockIcon('ChevronRight'),
    ChevronDown: createMockIcon('ChevronDown'),
    RefreshCw: createMockIcon('RefreshCw'),
    CheckCircle: createMockIcon('CheckCircle'),
    XCircle: createMockIcon('XCircle'),
    Link: createMockIcon('Link'),
    FileText: createMockIcon('FileText'),
    Search: createMockIcon('Search'),
    Filter: createMockIcon('Filter'),
    User: createMockIcon('User'),
    Shield: createMockIcon('Shield'),
    X: createMockIcon('X'),
    Mail: createMockIcon('Mail'),
    Calendar: createMockIcon('Calendar'),
    Clock: createMockIcon('Clock'),
    MoreVertical: createMockIcon('MoreVertical'),
    Trash2: createMockIcon('Trash2'),
    RotateCcw: createMockIcon('RotateCcw'),
    AlertCircle: createMockIcon('AlertCircle'),
    Info: createMockIcon('Info'),
    Bug: createMockIcon('Bug'),
    Zap: createMockIcon('Zap'),
    Cloud: createMockIcon('Cloud'),
    CreditCard: createMockIcon('CreditCard'),
    MessageSquare: createMockIcon('MessageSquare'),
    Power: createMockIcon('Power'),
    RotateCw: createMockIcon('RotateCw'),
    Plus: createMockIcon('Plus'),
    Phone: createMockIcon('Phone'),
    Building2: createMockIcon('Building'),
    Building: createMockIcon('Building'),
    MessageCircle: createMockIcon('MessageCircle'),
    Star: createMockIcon('Star'),
    MapPin: createMockIcon('MapPin'),
    Edit2: createMockIcon('Edit2'),
    Tag: createMockIcon('Tag'),
    Home: createMockIcon('Home'),
    Archive: createMockIcon('Archive'),
    Check: createMockIcon('Check'),
    ArrowUp: createMockIcon('ArrowUp'),
    ArrowDown: createMockIcon('ArrowDown'),
    ArrowRight: createMockIcon('ArrowRight'),
    SlidersHorizontal: createMockIcon('SlidersHorizontal'),
    Sparkles: createMockIcon('Sparkles'),
    Settings: createMockIcon('Settings'),
    Map: createMockIcon('Map'),
    Upload: createMockIcon('Upload'),
    Download: createMockIcon('Download'),
    FileImage: createMockIcon('FileImage'),
    FileCheck: createMockIcon('FileCheck'),
    FileCog: createMockIcon('FileCog'),
    File: createMockIcon('File'),
    FolderOpen: createMockIcon('FolderOpen'),
    Share2: createMockIcon('Share2'),
    Copy: createMockIcon('Copy'),
    FileDown: createMockIcon('FileDown'),
    CircleDot: createMockIcon('CircleDot'),
    MoreHorizontal: createMockIcon('MoreHorizontal'),
  };
});

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
              })),
            })),
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
            })),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          gte: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
          })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          ilike: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
              })),
            })),
          })),
        })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    storage: {
      listBuckets: jest.fn(() => Promise.resolve({ data: [], error: null })),
    },
  },
}));

// Mock useAuth hook
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { id: 'test-user-id', role: 'admin', name: 'Test Admin' },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock AdminGuard
jest.mock('@/features/auth/guards/AdminGuard', () => ({
  AdminGuard: ({ children }) => children,
}));

// Mock react-native Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock react-native Share (for react-native internal paths)
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
  sharedAction: 'sharedAction',
  dismissedAction: 'dismissedAction',
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: 'file:///test/document.pdf',
          name: 'document.pdf',
          size: 1024,
          mimeType: 'application/pdf',
        },
      ],
    })
  ),
}));

// Mock expo-file-system (supporting both old and new APIs)
const mockFileWrite = jest.fn(() => Promise.resolve());
const mockFileRead = jest.fn(() => Promise.resolve('base64encodedcontent'));
const mockFileDelete = jest.fn(() => Promise.resolve());

jest.mock('expo-file-system', () => {
  // Mock File class for new API (expo-file-system v19+)
  class MockFile {
    constructor(directory, filename) {
      this.directory = directory;
      this.filename = filename;
      this.uri = `${directory}${filename}`;
    }
    write = mockFileWrite;
    text = mockFileRead;
    delete = mockFileDelete;
  }

  return {
    // Legacy API (for backwards compatibility)
    cacheDirectory: 'file:///cache/',
    documentDirectory: 'file:///documents/',
    EncodingType: {
      UTF8: 'utf8',
      Base64: 'base64',
    },
    readAsStringAsync: jest.fn(() => Promise.resolve('base64encodedcontent')),
    writeAsStringAsync: jest.fn(() => Promise.resolve()),
    deleteAsync: jest.fn(() => Promise.resolve()),
    getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024 })),
    // New API (expo-file-system v19+)
    File: MockFile,
    Paths: {
      cache: 'file:///cache/',
      document: 'file:///documents/',
    },
    // Expose mocks for testing
    __mockFileWrite: mockFileWrite,
    __mockFileRead: mockFileRead,
  };
});

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

// Mock papaparse for CSV parsing
jest.mock('papaparse', () => ({
  parse: jest.fn((csvString, options) => {
    // Simple mock implementation
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return { data: [], errors: [] };

    const headers = lines[0].split(',').map(h =>
      options?.transformHeader ? options.transformHeader(h) : h.trim()
    );
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (options?.skipEmptyLines && !lines[i].trim()) continue;
      const values = lines[i].split(',').map(v =>
        options?.transform ? options.transform(v) : v.trim()
      );
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return { data, errors: [] };
  }),
}));

// Silence console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

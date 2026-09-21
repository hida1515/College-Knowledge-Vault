/**
 * Jest Global Setup
 * College Knowledge Vault
 *
 * Silences known React Native testing environment warnings
 * and provides global mocks for native modules.
 */

// Silence known act() warnings from @shopify/flash-list and react-native internals
const originalError = console.error;
console.error = (...args) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (
    message.includes('not configured to support act') ||
    message.includes('Warning: An update to') ||
    message.includes('inside a test was not wrapped in act') ||
    message.includes('overlapping act')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock @react-native-async-storage/async-storage
let mockAsyncStorageStore = {};
beforeEach(() => {
  mockAsyncStorageStore = {};
});
jest.mock('@react-native-async-storage/async-storage', () => {
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(mockAsyncStorageStore[key] || null)),
      setItem: jest.fn((key, value) => {
        mockAsyncStorageStore[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key) => {
        delete mockAsyncStorageStore[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        mockAsyncStorageStore = {};
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockAsyncStorageStore))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((k) => [k, mockAsyncStorageStore[k] || null])),
      ),
      multiSet: jest.fn((pairs) => {
        pairs.forEach(([k, v]) => {
          mockAsyncStorageStore[k] = v;
        });
        return Promise.resolve();
      }),
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => React.createElement('View', null, children),
    SafeAreaView: ({ children, ...props }) =>
      React.createElement('View', props, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: { insets: inset, frame: { x: 0, y: 0, width: 390, height: 844 } },
  };
});

// Mock @react-native-vector-icons/material-icons
jest.mock('@react-native-vector-icons/material-icons', () => {
  const React = require('react');
  const Icon = (props) =>
    React.createElement('Text', { testID: `icon-${props.name}`, ...props }, props.name);
  Icon.displayName = 'MockIcon';
  return { __esModule: true, default: Icon };
});

// Mock @react-navigation/native (partial — simple NavigationContainer)
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('View', null, children),
    useNavigation: jest.fn(() => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    })),
    createNavigationContainerRef: jest.fn(() => ({
      isReady: jest.fn(() => true),
      navigate: jest.fn(),
    })),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const flattenChildren = (children) => {
    return React.Children.toArray(children).flatMap((child) => {
      if (child && child.type === React.Fragment) {
        return flattenChildren(child.props.children);
      }
      return child;
    });
  };
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => {
        const flattened = flattenChildren(children).filter(Boolean);
        return React.createElement('View', null, flattened[0] || null);
      },
      Screen: ({ component: Component }: { component: React.ComponentType }) =>
        Component ? React.createElement(Component, null) : null,
    }),
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const flattenChildren = (children) => {
    return React.Children.toArray(children).flatMap((child) => {
      if (child && child.type === React.Fragment) {
        return flattenChildren(child.props.children);
      }
      return child;
    });
  };
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => {
        const flattened = flattenChildren(children).filter(Boolean);
        return React.createElement('View', null, flattened[0] || null);
      },
      Screen: ({ component: Component }: { component: React.ComponentType }) =>
        Component ? React.createElement(Component, null) : null,
    }),
  };
});

// Mock @shopify/flash-list — replace with FlatList
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return {
    FlashList: FlatList,
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureHandlerRootView: ({ children }) => React.createElement('View', null, children),
    Swipeable: ({ children }) => React.createElement('View', null, children),
    DrawerLayout: ({ children }) => React.createElement('View', null, children),
    State: {},
    PanGestureHandler: ({ children }) => React.createElement('View', null, children),
    BaseButton: ({ children }) => React.createElement('View', null, children),
    Directions: {},
  };
});

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pickSingle: jest.fn(),
  types: { pdf: 'application/pdf', allFiles: '*/*' },
  isCancel: jest.fn((err) => err?.name === 'AbortError' || err?.message === 'User cancelled' || err?.message?.includes?.('cancelled')),
}));

// Mock @react-native-clipboard/clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
  hasString: jest.fn(() => Promise.resolve(true)),
}));

// Mock @react-native-community/netinfo
const mockNetInfo = {
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
};
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: mockNetInfo,
  ...mockNetInfo,
}));

// Mock @react-native-firebase/messaging
const mockMessagingInstance = {
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getToken: jest.fn(() => Promise.resolve('mock-fcm-device-token-xyz')),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  setBackgroundMessageHandler: jest.fn(),
};

jest.mock('@react-native-firebase/messaging', () => {
  const messagingFn = () => mockMessagingInstance;
  messagingFn.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  return messagingFn;
});

// Mock @react-native-firebase/app
jest.mock('@react-native-firebase/app', () => ({
  initializeApp: jest.fn(),
  apps: [],
}));



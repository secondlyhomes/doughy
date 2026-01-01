# ZONE D: Business Features (Leads, Assistant, Dashboard)

**Instance 4 Assignment**

## Your Responsibility
You are converting leads management, AI assistant, conversations, dashboard, and other business features.

**Total Files: ~346 files**

## Your Directories (from doughy-ai-web-backup)

| Directory | Files | Priority |
|-----------|-------|----------|
| `src/features/leads/` | 95 | HIGH |
| `src/features/assistant/` | 81 | HIGH |
| `src/features/conversations/` | 39 | MEDIUM |
| `src/features/core/` | 43 | MEDIUM |
| `src/features/dashboard/` | 7 | HIGH |
| `src/features/transcripts/` | 19 | LOW |
| `src/features/analytics/` | 23 | MEDIUM |
| `src/features/calls/` | 6 | LOW |
| `src/features/resources/` | 12 | LOW |
| `src/features/layout/` | 16 | MEDIUM |
| `src/features/scenario/` | 3 | LOW |
| `src/features/actions/` | 2 | LOW |

## Priority Order

### Phase 1: Dashboard & Layout
1. **Dashboard Screen** - Main home screen with stats/widgets
2. **Layout Components** - Headers, bottom tabs, navigation structure
3. **Core Components** - Shared components used across features

### Phase 2: Leads Management
4. **Leads List** - List of leads with FlatList
5. **Lead Card** - Individual lead display
6. **Lead Detail** - Full lead view
7. **Lead Form** - Add/edit leads

### Phase 3: AI Assistant
8. **Chat Interface** - Main chat UI
9. **Message List** - Conversation display
10. **Message Input** - Text input with send button
11. **AI Responses** - Handle streaming responses

### Phase 4: Other Features
12. **Conversations** - Conversation list/detail
13. **Analytics** - Charts with react-native-chart-kit
14. **Transcripts** - Audio transcripts display

## Key Conversions for Your Zone

### Dashboard Screen
```tsx
// src/features/dashboard/screens/DashboardScreen.tsx
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '../components/StatsCard';
import { RecentActivity } from '../components/RecentActivity';

export function DashboardScreen() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Dashboard
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <StatsCard
            title="Total Leads"
            value={stats?.totalLeads || 0}
            icon="users"
          />
          <StatsCard
            title="Properties"
            value={stats?.totalProperties || 0}
            icon="home"
          />
          <StatsCard
            title="This Month"
            value={stats?.monthlyLeads || 0}
            icon="trending-up"
          />
          <StatsCard
            title="Conversion"
            value={`${stats?.conversionRate || 0}%`}
            icon="percent"
          />
        </View>

        {/* Recent Activity */}
        <RecentActivity activities={stats?.recentActivity || []} />
      </View>
    </ScrollView>
  );
}
```

### Leads List Screen
```tsx
// src/features/leads/screens/LeadsListScreen.tsx
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, Plus, Filter } from 'lucide-react-native';
import { useLeads } from '../hooks/useLeads';
import { LeadCard } from '../components/LeadCard';

export function LeadsListScreen() {
  const navigation = useNavigation();
  const { leads, isLoading, searchQuery, setSearchQuery } = useLeads();

  return (
    <View className="flex-1 bg-background">
      {/* Search Bar */}
      <View className="px-4 py-2 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-muted rounded-lg px-3 py-2">
          <Search size={18} className="text-muted-foreground" />
          <TextInput
            className="flex-1 ml-2 text-foreground"
            placeholder="Search leads..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity className="bg-muted p-2 rounded-lg">
          <Filter size={20} className="text-muted-foreground" />
        </TouchableOpacity>
      </View>

      {/* Leads List */}
      <FlatList
        data={leads}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('LeadDetail', { id: item.id })}
          >
            <LeadCard lead={item} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />

      {/* FAB for adding new lead */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('AddLead')}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
```

### AI Chat Interface
```tsx
// src/features/assistant/screens/AssistantScreen.tsx
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRef, useState } from 'react';
import { Send } from 'lucide-react-native';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from '../components/MessageBubble';

export function AssistantScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useChat();

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted-foreground text-center">
              Start a conversation with your AI assistant
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View className="border-t border-border p-4">
        <View className="flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-muted rounded-2xl px-4 py-3 text-foreground max-h-32"
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            className={`bg-primary w-12 h-12 rounded-full items-center justify-center ${
              (!input.trim() || isLoading) ? 'opacity-50' : ''
            }`}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Message Bubble Component
```tsx
// src/features/assistant/components/MessageBubble.tsx
import { View, Text } from 'react-native';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary rounded-br-sm'
            : 'bg-muted rounded-bl-sm'
        }`}
      >
        <Text className={isUser ? 'text-primary-foreground' : 'text-foreground'}>
          {message.content}
        </Text>
      </View>
      <Text className="text-xs text-muted-foreground mt-1">
        {new Date(message.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );
}
```

### Analytics Chart
```tsx
// src/features/analytics/components/LeadsChart.tsx
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface LeadsChartProps {
  data: { label: string; value: number }[];
}

export function LeadsChart({ data }: LeadsChartProps) {
  const screenWidth = Dimensions.get('window').width;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View className="bg-card rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-4">
        Leads Over Time
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
}
```

## Layout Conversion

### Web Sidebar → Mobile Bottom Tabs
The web app likely uses a sidebar for navigation. On mobile, convert to bottom tabs:

```tsx
// src/features/layout/components/BottomTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, Building, MessageCircle, Settings } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertyListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Building size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

## Dependencies to Install

```bash
npx expo install react-native-chart-kit react-native-svg lucide-react-native
```

## Dependencies on Other Zones

- **Zone A**: UI components, Supabase client, navigation setup
- **Zone B**: Auth context (to show user-specific data)
- **Zone C**: Property components (for dashboard widgets)

## Files to Create First

1. `src/features/dashboard/screens/DashboardScreen.tsx`
2. `src/features/layout/components/BottomTabs.tsx`
3. `src/features/leads/screens/LeadsListScreen.tsx`
4. `src/features/leads/components/LeadCard.tsx`
5. `src/features/assistant/screens/AssistantScreen.tsx`
6. `src/features/assistant/components/MessageBubble.tsx`

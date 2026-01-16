# ZONE C: Feature Logic - Implementation Guide

**Developer Role**: Feature Developer
**Focus**: Business logic, custom hooks, state management, feature screens
**Timeline**: 8-week sprint (4 sprints × 2 weeks)

---

## Your Responsibility

You are Zone C, the application layer. You integrate:
- ✅ Zone A's database types and schemas
- ✅ Zone B's UI components
- ✅ Zone D's API client wrappers

You deliver:
- ✅ Custom React hooks (data fetching, mutations)
- ✅ Feature screens (with business logic)
- ✅ State management (context providers)
- ✅ Form validation and data transformations

**DO NOT**:
- Create UI components (Zone B's job)
- Write database migrations (Zone A's job)
- Implement API clients (Zone D's job)

---

## Dependencies

### Wait for Zone A:
- ⏳ Sprint 1: Database types for documents (Week 2)
- ⏳ Sprint 2: Portfolio and creative finance types (Week 4)
- ⏳ Sprint 3: AI backend tables types (Week 6)

### Wait for Zone B:
- ⏳ Sprint 1: Document UI components (Week 2)
- ⏳ Sprint 2: Portfolio UI components (Week 4)
- ⏳ Sprint 3: AI UI components (Week 6)

### Work with Zone D:
- 🤝 Sprint 2+: API client wrappers for hooks

---

## Sprint 1 (Weeks 1-2): Dashboard & Document Hooks

### ✅ COMPLETE
- [x] `useNotifications` hook with AsyncStorage persistence
- [x] DashboardScreen reorder and Quick Actions removal

### 📋 Sprint 1 Tasks

#### 1. Create usePropertyDocuments Hook
**File**: `src/features/real-estate/hooks/usePropertyDocuments.ts`

**Purpose**: Query documents for a property (including linked docs via junction table)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PropertyDocument {
  id: string;
  property_id: string;
  title: string;
  type: string;
  file_url: string;
  file_size?: number;
  deal_id?: string;
  created_at: string;
  is_linked: boolean; // From junction table
  is_primary: boolean; // From junction table
  linked_properties_count?: number;
}

export function usePropertyDocuments(propertyId: string) {
  const queryClient = useQueryClient();

  // Fetch all documents for property (direct + linked)
  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['property-documents', propertyId],
    queryFn: async () => {
      // Get documents via junction table
      const { data, error } = await supabase
        .from('re_property_documents')
        .select(`
          is_primary,
          document:re_documents(*)
        `)
        .eq('property_id', propertyId);

      if (error) throw error;

      // Transform and add metadata
      const docs: PropertyDocument[] = await Promise.all(
        (data || []).map(async (item) => {
          // Count how many properties this doc is linked to
          const { count } = await supabase
            .from('re_property_documents')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', item.document.id);

          return {
            ...item.document,
            is_primary: item.is_primary,
            is_linked: (count || 0) > 1,
            linked_properties_count: count || 0,
          };
        })
      );

      return docs;
    },
    enabled: !!propertyId,
  });

  // Upload document mutation
  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      title,
      type,
      dealId,
    }: {
      file: File | { uri: string; name: string; type: string };
      title: string;
      type: string;
      dealId?: string;
    }) => {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${title}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const fileUrl = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName).data.publicUrl;

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('re_documents')
        .insert({
          property_id: propertyId,
          title,
          type,
          file_url: fileUrl,
          deal_id: dealId,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create junction table entry
      const { error: junctionError } = await supabase
        .from('re_property_documents')
        .insert({
          property_id: propertyId,
          document_id: doc.id,
          is_primary: true,
        });

      if (junctionError) throw junctionError;

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
    },
  });

  // Link existing document to property mutation
  const linkDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('re_property_documents')
        .insert({
          property_id: propertyId,
          document_id: documentId,
          is_primary: false, // It's a linked doc, not primary
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
    },
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // Delete junction entries first
      await supabase
        .from('re_property_documents')
        .delete()
        .eq('document_id', documentId);

      // Delete document itself (will cascade delete file)
      const { error } = await supabase
        .from('re_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
    },
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
    uploadDocument: uploadDocument.mutate,
    linkDocument: linkDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    isUploading: uploadDocument.isPending,
    isLinking: linkDocument.isPending,
    isDeleting: deleteDocument.isPending,
  };
}
```

#### 2. Create useLeadDocuments Hook
**File**: `src/features/leads/hooks/useLeadDocuments.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LeadDocument {
  id: string;
  lead_id: string;
  title: string;
  type: string;
  file_url: string;
  file_size?: number;
  created_at: string;
}

export function useLeadDocuments(leadId: string) {
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['lead-documents', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_lead_documents')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeadDocument[];
    },
    enabled: !!leadId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      title,
      type,
    }: {
      file: File | { uri: string; name: string; type: string };
      title: string;
      type: string;
    }) => {
      // Upload to storage
      const fileName = `${Date.now()}_${title}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const fileUrl = supabase.storage
        .from('lead-documents')
        .getPublicUrl(fileName).data.publicUrl;

      // Create document record
      const { data, error: docError } = await supabase
        .from('re_lead_documents')
        .insert({
          lead_id: leadId,
          title,
          type,
          file_url: fileUrl,
        })
        .select()
        .single();

      if (docError) throw docError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-documents', leadId] });
    },
  });

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadDocument.mutate,
    isUploading: uploadDocument.isPending,
  };
}
```

#### 3. Update DealDocsScreen
**File**: `src/features/deals/screens/DealDocsScreen.tsx`

**Changes**: Show 2-tier hierarchy (seller docs + property docs)

```typescript
import { useLeadDocuments } from '@/features/leads/hooks/useLeadDocuments';
import { usePropertyDocuments } from '@/features/real-estate/hooks/usePropertyDocuments';
import { DocumentCard, DocumentTypeFilter } from '@/components/ui';

export function DealDocsScreen({ dealId }: { dealId: string }) {
  const { deal } = useDeal(dealId);
  const { documents: leadDocs } = useLeadDocuments(deal.lead_id);
  const { documents: propertyDocs } = usePropertyDocuments(deal.property_id);
  const [filter, setFilter] = useState<'all' | 'research' | 'transaction'>('all');

  const filteredPropertyDocs = propertyDocs?.filter((doc) => {
    if (filter === 'all') return true;
    if (filter === 'research') {
      return ['inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp'].includes(doc.type);
    }
    if (filter === 'transaction') {
      return ['offer', 'counter_offer', 'purchase_agreement', 'addendum', 'closing_statement', 'hud1', 'deed'].includes(doc.type);
    }
    return true;
  });

  return (
    <ScrollView>
      {/* Section 1: Seller Documents (read-only) */}
      <Collapsible
        title="Seller Documents"
        icon={<User size={20} />}
        defaultCollapsed={leadDocs?.length === 0}
      >
        {leadDocs?.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            readOnly
            onView={() => openDocument(doc.file_url)}
          />
        ))}
        <TouchableOpacity onPress={() => router.push(`/leads/${deal.lead_id}`)}>
          <Text className="text-sm" style={{ color: colors.primary }}>
            View seller profile →
          </Text>
        </TouchableOpacity>
      </Collapsible>

      {/* Section 2: Property Documents (with filters) */}
      <View className="mt-4">
        <Text className="text-lg font-semibold mb-2">Property Documents</Text>
        <DocumentTypeFilter selectedType={filter} onSelectType={setFilter} />
        {filteredPropertyDocs?.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            showLinkBadge={doc.is_linked}
            linkedPropertiesCount={doc.linked_properties_count}
            onView={() => openDocument(doc.file_url)}
            onDelete={() => deleteDocument(doc.id)}
            onLink={() => openLinkSheet(doc.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
```

#### 4. Update PropertyDocsTab
**File**: `src/features/real-estate/components/PropertyDocsTab.tsx`

Add filters and linking functionality (use Zone B's DocumentTypeFilter component)

#### 5. Create LeadDocsTab
**File**: `src/features/leads/components/LeadDocsTab.tsx`

Similar to PropertyDocsTab but for seller documents.

---

## Sprint 2 (Weeks 3-4): Navigation & Portfolio Hooks

#### 1. Create usePropertyDeals Hook
**File**: `src/features/deals/hooks/usePropertyDeals.ts`

```typescript
export function usePropertyDeals(propertyId: string) {
  return useQuery({
    queryKey: ['property-deals', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_deals')
        .select('*, lead:re_leads(*)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });
}
```

#### 2. Update PropertyDetailScreen
**File**: `src/features/real-estate/screens/PropertyDetailScreen.tsx`

Add Related Deals section (use Zone B's RelatedDealsCard component)

```typescript
import { RelatedDealsCard } from '@/features/real-estate/components/RelatedDealsCard';
import { usePropertyDeals } from '@/features/deals/hooks/usePropertyDeals';

// In Overview tab:
const { data: relatedDeals } = usePropertyDeals(propertyId);

<RelatedDealsCard
  propertyId={propertyId}
  deals={relatedDeals || []}
  onDealPress={(dealId) => router.push(`/deals/${dealId}`)}
/>
```

#### 3. Update DealCockpitScreen Navigation
**File**: `src/features/deals/screens/DealCockpitScreen.tsx`

Make property address and lead name clickable (see plan for details)

#### 4. Create usePortfolio Hook
**File**: `src/features/portfolio/hooks/usePortfolio.ts`

```typescript
export function usePortfolio() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async () => {
      // Get all properties in portfolio (from closed deals)
      const { data: deals, error } = await supabase
        .from('re_deals')
        .select('*, property:re_properties(*)')
        .eq('user_id', user?.id)
        .eq('added_to_portfolio', true);

      if (error) throw error;

      // Get latest valuations for each property
      const propertiesWithValuations = await Promise.all(
        (deals || []).map(async (deal) => {
          const { data: valuation } = await supabase
            .from('re_portfolio_valuations')
            .select('*')
            .eq('property_id', deal.property_id)
            .order('valuation_date', { ascending: false })
            .limit(1)
            .single();

          return {
            ...deal.property,
            purchase_price: deal.purchase_price,
            acquisition_date: deal.portfolio_added_at,
            current_value: valuation?.estimated_value || deal.purchase_price,
            equity: (valuation?.estimated_value || deal.purchase_price) - (deal.purchase_price || 0),
          };
        })
      );

      // Calculate summary metrics
      const summary = {
        totalProperties: propertiesWithValuations.length,
        totalEquity: propertiesWithValuations.reduce((sum, p) => sum + p.equity, 0),
        totalValue: propertiesWithValuations.reduce((sum, p) => sum + p.current_value, 0),
        monthlyCashFlow: 0, // TODO: Calculate from rental income
      };

      return { properties: propertiesWithValuations, summary };
    },
    enabled: !!user?.id,
  });
}
```

#### 5. Create PortfolioScreen
**File**: `app/(tabs)/portfolio/index.tsx`

Use Zone B's PortfolioSummaryCard and PortfolioPropertyCard components.

---

## Sprint 3 (Weeks 5-6): AI & Automation Features

#### 1. Create useVoiceCapture Hook
**File**: `src/features/properties/hooks/useVoiceCapture.ts`

```typescript
import { Audio } from 'expo-av';
import { useState } from 'react';

export function useVoiceCapture() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    return uri;
  };

  const transcribeAndExtract = async (audioUri: string) => {
    // Call Zone D's OpenAI integration
    const { transcribeAudio, extractPropertyData } = await import('@/lib/openai');

    const transcript = await transcribeAudio(audioUri);
    const extractedData = await extractPropertyData(transcript);

    return { transcript, extractedData };
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcribeAndExtract,
  };
}
```

#### 2. Create usePhotoExtract Hook
**File**: `src/features/properties/hooks/usePhotoExtract.ts`

```typescript
import * as ImagePicker from 'expo-image-picker';

export function usePhotoExtract() {
  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera permission required');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  const extractDataFromPhoto = async (photoUri: string) => {
    // Call Zone D's GPT-4 Vision integration
    const { extractFromImage } = await import('@/lib/openai');
    return await extractFromImage(photoUri);
  };

  return {
    capturePhoto,
    extractDataFromPhoto,
  };
}
```

Continue with other hooks...

---

## Sprint 4 (Weeks 7-8): Creative Finance Features

Implementation details for creative finance hooks...

---

## Testing Your Work

Use React Query DevTools:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your app root
<ReactQueryDevtools initialIsOpen={false} />
```

Test hooks with sample data before Zone A delivers schemas.

---

## Ready to Begin?

Start with Sprint 1 after Zone A delivers document types (Week 2).

# Data Export Pattern

> User data portability for GDPR compliance and data sovereignty.

## Overview

Data export enables users to download their data in portable formats. This pattern covers secure data export with Supabase Edge Functions and React Native progress tracking.

## Database Schema

```sql
-- Export requests tracking
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  format TEXT DEFAULT 'json' CHECK (format IN ('json', 'csv', 'zip')),
  include_attachments BOOLEAN DEFAULT false,
  file_url TEXT,
  file_size_bytes BIGINT,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS policies
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exports"
  ON data_export_requests FOR ALL
  USING (user_id = auth.uid());

-- Audit log for exports (required for compliance)
CREATE OR REPLACE FUNCTION log_data_export()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, metadata)
  VALUES (
    NEW.user_id,
    NEW.tenant_id,
    'data.exported',
    'data_export_request',
    NEW.id,
    jsonb_build_object('format', NEW.format, 'include_attachments', NEW.include_attachments)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER data_export_audit
  AFTER UPDATE OF status ON data_export_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION log_data_export();
```

## Export Edge Function

```typescript
// supabase/functions/export-data/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization')!;
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { exportId } = await req.json();

  // Get export request
  const { data: exportReq } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', exportId)
    .eq('user_id', user.id)
    .single();

  if (!exportReq) {
    return new Response('Export not found', { status: 404 });
  }

  try {
    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', exportId);

    // Collect all user data
    const exportData = await collectUserData(supabase, user.id, exportReq.tenant_id);

    // Generate file
    const { fileContent, fileName, contentType } = await generateExportFile(
      exportData,
      exportReq.format,
      exportReq.include_attachments
    );

    // Upload to storage
    const filePath = `exports/${user.id}/${fileName}`;
    await supabase.storage
      .from('exports')
      .upload(filePath, fileContent, { contentType });

    // Get signed URL (expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { data: urlData } = await supabase.storage
      .from('exports')
      .createSignedUrl(filePath, 7 * 24 * 60 * 60);

    // Update request
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        file_url: urlData?.signedUrl,
        file_size_bytes: fileContent.length,
        expires_at: expiresAt.toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await supabase
      .from('data_export_requests')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', exportId);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function collectUserData(supabase, userId: string, tenantId: string) {
  const [profile, projects, tasks, settings] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('projects').select('*').eq('tenant_id', tenantId),
    supabase.from('tasks').select('*').eq('tenant_id', tenantId),
    supabase.from('user_settings').select('*').eq('user_id', userId).single(),
  ]);

  return {
    profile: profile.data,
    projects: projects.data,
    tasks: tasks.data,
    settings: settings.data,
    exportedAt: new Date().toISOString(),
  };
}

async function generateExportFile(data: unknown, format: string, includeAttachments: boolean) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (format === 'json') {
    return {
      fileContent: new TextEncoder().encode(JSON.stringify(data, null, 2)),
      fileName: `export-${timestamp}.json`,
      contentType: 'application/json',
    };
  }

  if (format === 'zip') {
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify(data, null, 2));

    const content = await zip.generateAsync({ type: 'uint8array' });
    return {
      fileContent: content,
      fileName: `export-${timestamp}.zip`,
      contentType: 'application/zip',
    };
  }

  throw new Error('Unsupported format');
}
```

## Export Service

```typescript
// src/services/dataExport.ts
import { supabase } from './supabase';

interface ExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: 'json' | 'csv' | 'zip';
  fileUrl?: string;
  fileSizeBytes?: number;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
}

export const requestDataExport = async (
  format: 'json' | 'csv' | 'zip' = 'json',
  includeAttachments: boolean = false
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('data_export_requests')
    .insert({
      user_id: user!.id,
      format,
      include_attachments: includeAttachments,
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger export processing
  await supabase.functions.invoke('export-data', {
    body: { exportId: data.id },
  });

  return data.id;
};

export const getExportStatus = async (exportId: string): Promise<ExportRequest> => {
  const { data, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', exportId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    status: data.status,
    format: data.format,
    fileUrl: data.file_url,
    fileSizeBytes: data.file_size_bytes,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  };
};

export const getExportHistory = async (): Promise<ExportRequest[]> => {
  const { data } = await supabase
    .from('data_export_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
};
```

## Export Screen

```typescript
// src/screens/data-export-screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { requestDataExport, getExportStatus, getExportHistory } from '@/services/dataExport';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';

export const DataExportScreen: React.FC = () => {
  const { colors } = useTheme();
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);

  useEffect(() => {
    loadExports();
  }, []);

  useEffect(() => {
    if (activeExportId) {
      const interval = setInterval(async () => {
        const status = await getExportStatus(activeExportId);
        if (status.status === 'completed' || status.status === 'failed') {
          setActiveExportId(null);
          loadExports();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeExportId]);

  const loadExports = async () => {
    const history = await getExportHistory();
    setExports(history);
  };

  const handleExport = async () => {
    setIsRequesting(true);
    try {
      const exportId = await requestDataExport('zip', false);
      setActiveExportId(exportId);
      await loadExports();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const renderExport = ({ item }: { item: ExportRequest }) => (
    <View style={[styles.exportItem, { borderBottomColor: colors.border }]}>
      <View style={styles.exportInfo}>
        <Text style={[styles.exportDate, { color: colors.text }]}>
          {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
        </Text>
        <Text style={[styles.exportStatus, { color: colors.textSecondary }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          {item.fileSizeBytes && ` (${formatFileSize(item.fileSizeBytes)})`}
        </Text>
      </View>
      {item.status === 'completed' && item.fileUrl && (
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.primary }]}
          onPress={() => Linking.openURL(item.fileUrl!)}
        >
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      )}
      {item.status === 'processing' && <ActivityIndicator color={colors.primary} />}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Export Your Data</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Download a copy of all your data in a portable format. Exports are available for 7 days.
      </Text>

      <TouchableOpacity
        style={[styles.exportButton, { backgroundColor: colors.primary }, isRequesting && styles.disabled]}
        onPress={handleExport}
        disabled={isRequesting || !!activeExportId}
      >
        {isRequesting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.exportButtonText}>Request New Export</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Export History</Text>
      <FlatList
        data={exports}
        keyExtractor={(item) => item.id}
        renderItem={renderExport}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No exports yet
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  exportButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 32 },
  exportButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  exportItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, alignItems: 'center' },
  exportInfo: { flex: 1 },
  exportDate: { fontSize: 15, fontWeight: '500' },
  exportStatus: { fontSize: 13, marginTop: 2 },
  downloadButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  downloadText: { color: '#fff', fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 24 },
});
```

## Implementation Examples

See `.examples/enterprise/data-export/` for a complete data export system with progress tracking.

## Related Patterns

- [Compliance](./COMPLIANCE.md)
- [Audit Logging](./AUDIT-LOGGING.md)

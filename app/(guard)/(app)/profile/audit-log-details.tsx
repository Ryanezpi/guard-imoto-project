import React, { JSX, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import DynamicCard from '@/components/ui/Card';

type AuditLog = {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
};

function humanize(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function renderMetadata(
  metadata: Record<string, any>,
  prefix = ''
): JSX.Element[] {
  return Object.entries(metadata).map(([key, value]) => {
    const label = prefix ? `${prefix} → ${humanize(key)}` : humanize(key);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return (
        <DynamicCard key={label} name={label} expandable={true}>
          {renderMetadata(value, label)}
        </DynamicCard>
      );
    }

    return <DynamicCard key={label} name={label} value={String(value)} />;
  });
}

export default function AuditLogDetailsScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const params = useLocalSearchParams<{ log?: string }>();

  const log: AuditLog | null = useMemo(() => {
    try {
      return params.log ? JSON.parse(params.log) : null;
    } catch {
      return null;
    }
  }, [params.log]);

  if (!log) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: bgColor }}
        edges={['bottom', 'left', 'right']}
      />
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Core info */}
        <DynamicCard
          name="Action"
          nameTextBold={true}
          value={humanize(log.action)}
        />
        <DynamicCard
          name="Actor Type"
          nameTextBold={true}
          value={log.actor_type}
        />
        <DynamicCard name="Actor ID" nameTextBold={true} value={log.actor_id} />
        <DynamicCard
          name="Target Type"
          nameTextBold={true}
          value={log.target_type}
        />
        <DynamicCard
          name="Target ID"
          nameTextBold={true}
          value={log.target_id}
        />
        <DynamicCard
          name="Date"
          nameTextBold={true}
          value={
            new Date(log.created_at).toDateString() +
            ' - ' +
            new Date(log.created_at).toLocaleTimeString()
          }
        />

        {/* Metadata */}
        {log.metadata && (
          <View style={{ marginTop: 12 }}>
            <DynamicCard
              name="Metadata"
              nameTextBold={true}
              subText="Details"
              expandable={true}
            >
              {renderMetadata(log.metadata)}
            </DynamicCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

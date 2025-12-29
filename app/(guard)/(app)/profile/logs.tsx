import React, { useEffect, useState } from 'react';
import DynamicList, { DynamicListItem } from '@/components/ui/DynamicList';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DevicePrefix from '@/components/ui/DevicePrefix';
import { AuditLog, getMyAuditLogs } from '@/services/user.service';
import { useAuth } from '@/context/AuthContext';

const actionLabelMap: Record<string, string> = {
  updated_profile: 'Updated profile',
  registered: 'Registered account',
};

function formatAction(action: string) {
  return actionLabelMap[action] ?? action.replace(/_/g, ' ');
}

function summarizeMetadata(metadata: Record<string, any>): string {
  if (!metadata) return '';

  // Diff-style metadata
  if (metadata.old && metadata.new) {
    const changedKeys = Object.keys(metadata.new).filter(
      (key) => metadata.old[key] !== metadata.new[key]
    );

    if (changedKeys.length === 0) return 'No changes detected';

    return `Changed: ${changedKeys
      .map((k) => k.replace(/_/g, ' '))
      .join(', ')}`;
  }

  // Flat metadata
  return Object.keys(metadata)
    .map((k) => `${k.replace(/_/g, ' ')} updated`)
    .join(', ');
}

export default function AuditLogsScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth(); // 🔑 THIS is what the service needs
  const router = useRouter();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idToken) return;

    let mounted = true;

    (async () => {
      try {
        const data = await getMyAuditLogs(idToken);
        if (mounted) setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [idToken]);

  const auditItems: DynamicListItem[] = logs.map((log) => ({
    id: log.id,
    name: formatAction(log.action),
    subText: summarizeMetadata(log.metadata),
    prefixElement: (
      <DevicePrefix
        color={log.action === 'updated_profile' ? '#4e8cff' : '#16a34a'}
      />
    ),
    suffixIcon: 'chevron-right',
    date: new Date(log.created_at),
    onPress: () => {
      router.navigate({
        pathname: '/profile/audit-log-details',
        params: {
          log: JSON.stringify(log),
        },
      });
    },
  }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <DynamicList
        items={auditItems}
        loading={loading}
        emptyText="No audit activity found"
      />
    </SafeAreaView>
  );
}

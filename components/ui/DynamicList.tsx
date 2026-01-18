import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DynamicCard from './Card';

export interface DynamicListItem {
  id: string;
  name: string;
  value?: string;
  subText?: string | number;
  subTextColor?: string;
  subTextBold?: boolean;
  prefixElement?: React.ReactNode;
  prefixColor?: string;
  deviceEnabled?: boolean;
  prefixIcon?: keyof typeof FontAwesome.glyphMap;
  suffixIcon?: keyof typeof FontAwesome.glyphMap;
  expandable?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  date?: Date;
}

type DynamicListProps = {
  items: DynamicListItem[];
  loading?: boolean;
  emptyText?: string;
};

interface GroupedItems {
  dateKey: string;
  label: string;
  data: DynamicListItem[];
}

const isToday = (date: Date) => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const getLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function DynamicList({
  items,
  loading = false,
  emptyText = 'No items found',
}: DynamicListProps) {
  const { theme } = useTheme();
  const textColor = theme === 'light' ? '#000' : '#fff';

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      items.forEach((item) => {
        if (item.expandable) {
          initial[item.id] = item.expanded ?? true;
        }
      });
      return initial;
    }
  );

  const toggleExpanded = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🔹 Loading state (early return)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🔹 Empty state
  if (!loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor, opacity: 0.6 }}>{emptyText}</Text>
      </View>
    );
  }

  // 🔹 Split items
  const datedItems = items.filter((i) => i.date);
  const undatedItems = items.filter((i) => !i.date);

  const grouped: GroupedItems[] = Object.values(
    datedItems
      .slice()
      // 🔹 latest items first
      .sort((a, b) => b.date!.getTime() - a.date!.getTime())
      .reduce(
        (acc, item) => {
          const dateKey = getLocalDateKey(item.date!);

          if (!acc[dateKey]) {
            acc[dateKey] = {
              dateKey,
              label: isToday(item.date!)
                ? 'Today'
                : item.date!.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
              data: [],
            };
          }

          acc[dateKey].data.push(item);
          return acc;
        },
        {} as Record<string, GroupedItems>
      )
  );

  return (
    <FlatList
      data={grouped}
      keyExtractor={(group) => group.dateKey}
      ListHeaderComponent={
        undatedItems.length > 0 ? (
          <View style={styles.group}>
            {undatedItems.map((cardItem) => (
              <DynamicCard
                key={cardItem.id}
                name={cardItem.name}
                value={cardItem.value}
                subText={cardItem.subText}
                subTextColor={cardItem.subTextColor}
                nameTextBold={!cardItem.subTextBold}
                prefixElement={cardItem.prefixElement}
                prefixColor={cardItem.prefixColor}
                prefixIcon={cardItem.prefixIcon}
                suffixIcon={cardItem.suffixIcon}
                expandable={cardItem.expandable}
                expanded={
                  cardItem.expandable ? expandedMap[cardItem.id] : undefined
                }
                onPress={() => {
                  if (cardItem.expandable) toggleExpanded(cardItem.id);
                  cardItem.onPress?.();
                }}
              >
                {cardItem.children}
              </DynamicCard>
            ))}
          </View>
        ) : null
      }
      renderItem={({ item: group }) => (
        <View style={styles.group}>
          <Text style={[styles.dateHeader, { color: textColor }]}>
            {group.label}
          </Text>

          {group.data.map((cardItem) => (
            <DynamicCard
              key={cardItem.id}
              name={cardItem.name}
              value={cardItem.value}
              subText={cardItem.subText}
              subTextColor={cardItem.subTextColor}
              nameTextBold={!cardItem.subTextBold}
              prefixIcon={cardItem.prefixIcon}
              prefixElement={cardItem.prefixElement}
              prefixColor={cardItem.prefixColor}
              suffixIcon={cardItem.suffixIcon}
              expandable={cardItem.expandable}
              expanded={
                cardItem.expandable ? expandedMap[cardItem.id] : undefined
              }
              onPress={() => {
                if (cardItem.expandable) toggleExpanded(cardItem.id);
                cardItem.onPress?.();
              }}
            >
              {cardItem.children}
            </DynamicCard>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  group: {
    padding: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    marginHorizontal: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

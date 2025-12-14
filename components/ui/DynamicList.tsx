import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
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

interface DynamicListProps {
  items: DynamicListItem[];
}

interface GroupedItems {
  dateKey: string;
  label: string;
  data: DynamicListItem[];
}

export default function DynamicList({ items }: DynamicListProps) {
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

  // 🔹 Split items
  const datedItems = items.filter((i) => i.date);
  const undatedItems = items.filter((i) => !i.date);

  // 🔹 Group ONLY dated items
  const grouped: GroupedItems[] = Object.values(
    datedItems
      .slice()
      .sort((a, b) => a.date!.getTime() - b.date!.getTime())
      .reduce((acc, item) => {
        const dateKey = item.date!.toISOString().split('T')[0];

        if (!acc[dateKey]) {
          acc[dateKey] = {
            dateKey,
            label: new Date(dateKey).toDateString(),
            data: [],
          };
        }

        acc[dateKey].data.push(item);
        return acc;
      }, {} as Record<string, GroupedItems>)
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
    marginVertical: 8,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    marginHorizontal: 12,
  },
});

// app/(app)/profile/edit.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/context/ThemeContext';
import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';

export const screenOptions = {
  headerTitle: 'Profile',
  headerTitleAlign: 'center',
};

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string | null;
};

export default function EditScreen() {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = React.useState(false);

  /** Saved profile (source of truth) */
  const [profile, setProfile] = React.useState<Profile>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+63 912 345 6789',
    avatar: null,
  });

  /** Draft profile (editable buffer) */
  const [draft, setDraft] = React.useState<Profile>(profile);

  /**
   * Header → Edit / Save toggle
   */
  React.useEffect(() => {
    globalThis.__toggleProfileEdit = () => {
      setIsEditing((prev) => {
        if (prev) {
          // SAVE
          setProfile(draft);
        } else {
          // ENTER EDIT MODE
          setDraft(profile);
        }
        return !prev;
      });
    };

    globalThis.__isProfileEditing = isEditing;

    return () => {
      delete globalThis.__toggleProfileEdit;
      delete globalThis.__isProfileEditing;
    };
  }, [isEditing, draft, profile]);

  const data = isEditing ? draft : profile;

  const initials =
    (data.firstName?.[0] ?? '') + (data.lastName?.[0] ?? '') || 'NA';

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
          paddingTop: 32,
        }}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {data.avatar ? (
              <Image source={{ uri: data.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}

            {isEditing && (
              <Pressable style={styles.cameraBadge}>
                <FontAwesome name="camera" size={14} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>

        <TitleSection title="Personal Information">
          <DynamicCard
            name="First Name"
            prefixIcon="user"
            editable={isEditing}
            value={data.firstName}
            onChange={(v) => setDraft((d) => ({ ...d, firstName: v }))}
          />
          <DynamicCard
            name="Last Name"
            prefixIcon="user"
            editable={isEditing}
            value={data.lastName}
            onChange={(v) => setDraft((d) => ({ ...d, lastName: v }))}
          />
          <DynamicCard
            name="Email"
            prefixIcon="envelope"
            editable={isEditing}
            value={data.email}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
          />
          <DynamicCard
            name="Phone"
            prefixIcon="phone"
            editable={isEditing}
            value={data.phone}
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
          />
        </TitleSection>

        {!isEditing && (
          <TitleSection title="Security">
            <DynamicCard
              name="Change Password"
              prefixIcon="lock"
              onPress={() => console.log('Change password')}
            />
          </TitleSection>
        )}
      </ScrollView>

      {!isEditing && (
        <View style={styles.logoutContainer}>
          <DynamicCard
            name="Delete Account"
            prefixIcon="trash"
            prefixColor="#ff4d4f"
            onPress={() => console.log('Delete account')}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#bdbdbd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#4e8cff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

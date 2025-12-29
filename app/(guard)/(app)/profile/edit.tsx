import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import { updateProfile, uploadAvatar } from '@/services/user.service';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const screenOptions = {
  headerTitle: 'Profile',
  headerTitleAlign: 'center',
};

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo_url: string | null;
};

export default function EditScreen() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const { user: globalUser, idToken, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = React.useState(false);

  const [profile, setProfile] = React.useState<Profile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photo_url: null,
  });

  const [draft, setDraft] = React.useState<Profile>(profile);

  /** Check if there are unsaved changes */
  const hasChanges = React.useMemo(() => {
    return (
      draft.firstName !== profile.firstName ||
      draft.lastName !== profile.lastName ||
      draft.phone !== profile.phone ||
      draft.photo_url !== profile.photo_url
    );
  }, [draft, profile]);

  /** Save draft to backend */
  const handleSave = React.useCallback(async () => {
    if (!idToken) return;

    try {
      await updateProfile(idToken, {
        first_name: draft.firstName,
        last_name: draft.lastName,
        phone: draft.phone,
        photo_url: draft.photo_url || undefined,
      });

      const latest = await refreshUser();
      if (latest) {
        setProfile({
          firstName: latest.first_name,
          lastName: latest.last_name,
          email: latest.email,
          phone: latest.phone,
          photo_url: latest.photo_url,
        });
      }

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.log('Profile update error:', err);
      Alert.alert('Error', 'Failed to update profile.');
    }
  }, [idToken, draft, refreshUser]);

  React.useEffect(() => {
    if (globalUser) {
      const { first_name, last_name, email, phone, photo_url } = globalUser;
      const loadedProfile: Profile = {
        firstName: first_name,
        lastName: last_name,
        email,
        phone,
        photo_url: photo_url,
      };
      setProfile(loadedProfile);
      setDraft(loadedProfile);
    }
  }, [globalUser]);

  /** Header → Edit / Save toggle */
  React.useEffect(() => {
    globalThis.__toggleProfileEdit = async () => {
      if (isEditing) {
        await handleSave();
      } else {
        setDraft(profile);
      }
      setIsEditing((prev) => !prev);
    };

    globalThis.__isProfileEditing = isEditing;

    return () => {
      delete globalThis.__toggleProfileEdit;
      delete globalThis.__isProfileEditing;
    };
  }, [isEditing, draft, profile, handleSave]);

  /** Back/cancel confirmation for unsaved changes */
  React.useEffect(() => {
    const onBackPress = () => {
      if (isEditing && hasChanges) {
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure you want to go back?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                setDraft(profile);
                setIsEditing(false);
              },
            },
          ]
        );
        return true; // prevent default back
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [isEditing, hasChanges, profile]);

  const data = isEditing ? draft : profile;
  const initials =
    (data.firstName?.[0] ?? '') + (data.lastName?.[0] ?? '') || 'NA';
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  /** Handle image selection & upload (camera + library) */
  const handlePickAvatar = async () => {
    if (!idToken || !globalUser) return;

    Alert.alert('Select Avatar', 'Choose image source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
          });
          if (result.canceled) return;
          const url = await uploadAvatar(
            globalUser.firebase_uid,
            result.assets[0].uri
          );
          setDraft((d) => ({ ...d, photo_url: url }));
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          });
          if (result.canceled) return;
          const url = await uploadAvatar(
            globalUser.firebase_uid,
            result.assets[0].uri
          );
          setDraft((d) => ({ ...d, photo_url: url }));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleChangePassword = async () => {
    if (!globalUser?.email) return;

    Alert.alert(
      'Change Password',
      `Send password reset email to ${globalUser.email}? You will be logged out.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, globalUser.email);
              Alert.alert(
                'Success',
                `Password reset email sent to ${globalUser.email}. You will now be logged out.`
              );
            } catch (err) {
              console.error('Failed to send reset email:', err);
              Alert.alert('Error', 'Failed to send reset email. Try again.');
            } finally {
              await logout();
            }
          },
        },
      ]
    );
  };
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
            {data.photo_url ? (
              <Image source={{ uri: data.photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}

            {isEditing && (
              <Pressable style={styles.cameraBadge} onPress={handlePickAvatar}>
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
          {!isEditing && (
            <DynamicCard
              name="Email"
              prefixIcon="envelope"
              editable={false}
              value={data.email}
              onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
            />
          )}
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
              onPress={handleChangePassword}
            />
          </TitleSection>
        )}

        {!isEditing && (
          <DynamicCard
            name="Delete Account"
            prefixIcon="trash"
            prefixColor="#ff4d4f"
            onPress={() => console.log('Delete account')}
          />
        )}
      </ScrollView>
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
});

import React, { useCallback } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import { updateProfile, uploadAvatar } from '@/services/user.service';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLoader } from '@/context/LoaderContext';
import ConfirmModal, {
  type AlertAction,
} from '@/components/ui/forms/ConfirmModal';
import AuthTextField from '@/components/ui/forms/AuthTextField';
import { useNavigation } from '@react-navigation/native';

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
  const { showLoader, hideLoader } = useLoader();
  const navigation = useNavigation();

  const [isEditing, setIsEditing] = React.useState(false);

  const [profile, setProfile] = React.useState<Profile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photo_url: null,
  });

  const [draft, setDraft] = React.useState<Profile>(profile);
  const [alert, setAlert] = React.useState<{
    visible: boolean;
    title?: string;
    message?: string;
    actions: AlertAction[];
    fullWidthActions?: boolean;
  }>({ visible: false, actions: [] });

  const closeAlert = useCallback(
    () => setAlert((prev) => ({ ...prev, visible: false })),
    []
  );
  const openAlert = useCallback(
    (
      title: string,
      message: string,
      actions?: AlertAction[],
      options?: { fullWidthActions?: boolean }
    ) =>
      setAlert({
        visible: true,
        title,
        message,
        actions: actions ?? [
          { text: 'OK', variant: 'primary', onPress: closeAlert },
        ],
        fullWidthActions: options?.fullWidthActions,
      }),
    [closeAlert]
  );

  /** Check if there are unsaved changes */
  const hasChanges = React.useMemo(() => {
    return (
      draft.firstName !== profile.firstName ||
      draft.lastName !== profile.lastName ||
      draft.phone !== profile.phone ||
      draft.photo_url !== profile.photo_url
    );
  }, [draft, profile]);

  const confirmDiscardChanges = useCallback(
    (onDiscard?: () => void) => {
      openAlert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', variant: 'cancel', onPress: closeAlert },
          {
            text: 'Discard',
            variant: 'destructive',
            onPress: () => {
              closeAlert();
              setDraft(profile);
              setIsEditing(false);
              onDiscard?.();
            },
          },
        ]
      );
    },
    [closeAlert, openAlert, profile]
  );

  /** Save draft to backend */
  const handleSave = React.useCallback(async () => {
    if (!idToken) return false;

    try {
      showLoader();
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

      openAlert('Success', 'Profile updated successfully!');
      return true;
    } catch (err) {
      console.log('Profile update error:', err);
      openAlert('Error', 'Failed to update profile.');
      return false;
    } finally {
      hideLoader();
    }
  }, [
    idToken,
    showLoader,
    draft.firstName,
    draft.lastName,
    draft.phone,
    draft.photo_url,
    refreshUser,
    openAlert,
    hideLoader,
  ]);

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
        if (hasChanges) {
          const saved = await handleSave();
          if (saved) setIsEditing(false);
        } else {
          setIsEditing(false);
        }
      } else {
        setDraft(profile);
        setIsEditing(true);
      }
    };

    globalThis.__isProfileEditing = isEditing;
    globalThis.__hasProfileChanges = hasChanges;

    return () => {
      delete globalThis.__toggleProfileEdit;
      delete globalThis.__isProfileEditing;
      delete globalThis.__hasProfileChanges;
    };
  }, [isEditing, profile, handleSave, hasChanges]);

  /** Pop/cancel confirmation for unsaved changes */
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isEditing || !hasChanges) return;
      e.preventDefault();
      confirmDiscardChanges(() => navigation.dispatch(e.data.action));
    });

    return unsubscribe;
  }, [navigation, isEditing, hasChanges, confirmDiscardChanges]);

  const data = isEditing ? draft : profile;
  const initials =
    (data.firstName?.[0] ?? '') + (data.lastName?.[0] ?? '') || 'NA';
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  /** Handle image selection & upload (camera + library) */
  const handlePickAvatar = async () => {
    if (!idToken || !globalUser) return;

    openAlert(
      'Select Avatar',
      'Choose image source',
      [
        {
          text: 'Camera',
          variant: 'primary',
          onPress: async () => {
            closeAlert();
            showLoader();
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.7,
            });
            try {
              if (result.canceled) return;
              const url = await uploadAvatar(
                globalUser.firebase_uid,
                result.assets[0].uri
              );
              setDraft((d) => ({ ...d, photo_url: url }));
            } finally {
              hideLoader();
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            closeAlert();
            showLoader();
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
            });
            try {
              if (result.canceled) return;
              const url = await uploadAvatar(
                globalUser.firebase_uid,
                result.assets[0].uri
              );
              setDraft((d) => ({ ...d, photo_url: url }));
            } finally {
              hideLoader();
            }
          },
        },
        { text: 'Cancel', variant: 'cancel', onPress: closeAlert },
      ],
      { fullWidthActions: true }
    );
  };

  const handleChangePassword = async () => {
    if (!globalUser?.email) return;

    openAlert(
      'Change Password',
      `Send password reset email to ${globalUser.email}? You will be logged out.`,
      [
        { text: 'Cancel', variant: 'cancel', onPress: closeAlert },
        {
          text: 'Yes',
          variant: 'destructive',
          onPress: async () => {
            closeAlert();
            showLoader();
            try {
              await sendPasswordResetEmail(auth, globalUser.email);
              openAlert(
                'Success',
                `Password reset email sent to ${globalUser.email}. You will now be logged out.`,
                [
                  {
                    text: 'OK',
                    variant: 'primary',
                    onPress: async () => {
                      closeAlert();
                      showLoader();
                      try {
                        await logout();
                      } finally {
                        hideLoader();
                      }
                    },
                  },
                ]
              );
            } catch (err) {
              console.error('Failed to send reset email:', err);
              openAlert('Error', 'Failed to send reset email. Try again.', [
                {
                  text: 'OK',
                  variant: 'primary',
                  onPress: async () => {
                    closeAlert();
                    showLoader();
                    try {
                      await logout();
                    } finally {
                      hideLoader();
                    }
                  },
                },
              ]);
            } finally {
              hideLoader();
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
          {isEditing ? (
            <>
              <AuthTextField
                label="First name"
                value={data.firstName}
                placeholder="First name"
                onChangeText={(v) => setDraft((d) => ({ ...d, firstName: v }))}
              />
              <AuthTextField
                label="Last name"
                value={data.lastName}
                placeholder="Last name"
                onChangeText={(v) => setDraft((d) => ({ ...d, lastName: v }))}
              />
              <AuthTextField
                label="Email"
                value={data.email}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={false}
              />
              <AuthTextField
                label="Phone"
                value={data.phone}
                placeholder="Phone"
                keyboardType="phone-pad"
                onChangeText={(v) => setDraft((d) => ({ ...d, phone: v }))}
              />
            </>
          ) : (
            <>
              <DynamicCard
                name="First Name"
                prefixIcon="user"
                editable={false}
                value={data.firstName}
              />
              <DynamicCard
                name="Last Name"
                prefixIcon="user"
                editable={false}
                value={data.lastName}
              />
              <DynamicCard
                name="Email"
                prefixIcon="envelope"
                editable={false}
                value={data.email}
              />
              <DynamicCard
                name="Phone"
                prefixIcon="phone"
                editable={false}
                value={data.phone}
              />
            </>
          )}
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
      </ScrollView>

      <ConfirmModal
        visible={alert.visible}
        title={alert.title}
        actions={alert.actions}
        onCancel={closeAlert}
        onDismiss={closeAlert}
        fullWidthActions={alert.fullWidthActions}
      >
        {alert.message ? <Text>{alert.message}</Text> : null}
      </ConfirmModal>
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
    backgroundColor: '#B874DB',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

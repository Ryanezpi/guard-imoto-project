import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export interface AuditLog {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type NFCItem = {
  id: string; // the NFC record ID in your backend
  nfc_id: string; // actual NFC card ID
  tag_uid?: string; // optional title/label
  paired_at?: string;
};

export type AlarmConfigBody = {
  relay1_alarm_type: 'continuous' | 'intermittent' | null;
  relay1_interval_sec: number | null;
  relay1_trigger_mode: 'auto' | 'manual' | null;
  relay1_delay_sec: number | null;
};
export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
}

export async function uploadAvatar(
  uid: string,
  fileUri: string
): Promise<string> {
  const storage = getStorage();
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const avatarRef = ref(storage, `users/${uid}/avatar.jpg`);
  await uploadBytes(avatarRef, blob);

  return await getDownloadURL(avatarRef);
}

export async function getMeAPI(token: string) {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Unauthorized');

  const data = await res.json();
  return data.user;
}

export async function updateProfile(
  token: string,
  payload: {
    first_name: string;
    last_name: string;
    phone: string;
    photo_url?: string;
  }
) {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  console.log(res);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Profile update failed');
  }

  return res.json();
}

/**
 * Fetch audit logs for the current authenticated user
 */
export async function getMyAuditLogs(token: string): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to fetch audit logs');
  }

  const data: AuditLogsResponse = await res.json();
  return data.logs;
}

export interface CreateDeviceBody {
  name: string;
  serial_number: string;
}

export interface Device {
  deviceId: string;
  device_color: string | null;
  deviceEnabled: boolean;
}

export async function createDevice(idToken: string, body: CreateDeviceBody) {
  const response = await fetch(`${API_BASE}/devices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let responseBody: any;
  try {
    responseBody = await response.json(); // parse JSON even if error
  } catch (err) {
    console.error('Failed to parse response JSON', err);
  }

  if (!response.ok) {
    console.error('Create Device Error:', response.status, responseBody);
    throw new Error(
      responseBody?.message || `Failed to create device (${response.status})`
    );
  }

  return {
    deviceId: responseBody.serial_number,
    device_color: responseBody.device_color ?? '#E53935', // default red
    deviceEnabled: responseBody.device_enabled ?? true,
  } as Device;
}

export async function patchDeviceConfig(
  idToken: string,
  deviceId: string,
  body: any
) {
  console.log(`${API_BASE}/devices/${deviceId}/config`);

  const res = await fetch(`${API_BASE}/devices/${deviceId}/config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to update device config');
  }

  return res.json();
}

/**
 * Get all NFCs linked to a device
 */
export async function getDeviceNFCs(
  idToken: string,
  deviceId: string
): Promise<NFCItem[]> {
  try {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/nfc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch NFCs: ${res.statusText}`);
    }

    const data = await res.json();
    console.log(data);

    // Ensure we always return an array
    if (!data || !Array.isArray(data.tags)) return [];

    // Map API response to NFCItem type
    return data.tags.map((tag: any) => ({
      id: tag.id,
      title: tag.tag_uid, // or use a custom title if available
      tag_uid: tag.tag_uid,
      paired_at: tag.paired_at,
    }));
  } catch (e) {
    console.error('Failed to fetch device NFCs', e);
    return []; // fallback to empty array
  }
}
/**
 * Link a new NFC to a device
 */
export async function linkNFC(
  idToken: string,
  deviceId: string,
  nfcId: string
) {
  const res = await fetch(`${API_BASE}/nfc/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      device_id: deviceId,
      tag_uid: nfcId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to link NFC');
  }

  return res.json();
}

/**
 * Unlink an NFC from a device
 */
export async function unlinkNFC(idToken: string, nfcId: string) {
  const res = await fetch(`${API_BASE}/nfc/unlink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      tag_uid: nfcId,
    }),
  });
  console.log(
    JSON.stringify({
      tag_uid: nfcId,
    })
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to unlink NFC');
  }

  return res.json();
}

/**
 * Trigger scan mode on a device to link NFCs
 */
export async function triggerDeviceScanMode(
  idToken: string,
  deviceId: string
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/devices/${deviceId}/scan-nfc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Failed to trigger scan mode');
    }
  } catch (e) {
    console.error('Failed to trigger device scan mode', e);
    throw e;
  }
}

/**
 * Update alarm configuration for a device
 */
export async function patchDeviceAlarm(
  idToken: string,
  deviceId: string,
  body: AlarmConfigBody
) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to update alarm config');
  }

  return res.json();
}

import { getApp } from '@react-native-firebase/app';
import {
  getStorage,
  getDownloadURL,
  ref,
} from '@react-native-firebase/storage';
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

export type VehicleType =
  | 'motorbike'
  | 'motorcycle'
  | 'bike'
  | 'car'
  | 'scooter'
  | 'truck'
  | 'van'
  | 'other';

export type Vehicle = {
  id: string;
  device_id: string;
  type: VehicleType;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  license_plate: string | null;
  vin: string | null;
  nickname: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertVehicleBody = Partial<
  Pick<
    Vehicle,
    | 'type'
    | 'make'
    | 'model'
    | 'year'
    | 'color'
    | 'license_plate'
    | 'vin'
    | 'nickname'
    | 'image_url'
  >
>;
export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
}

export async function uploadAvatar(
  uid: string,
  fileUri: string
): Promise<string> {
  const storage = getStorage(getApp());
  const avatarRef = ref(storage, `users/${uid}/avatar.jpg`);
  await avatarRef.putFile(fileUri);
  return await getDownloadURL(avatarRef);
}

export async function getMeAPI(token: string) {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {
      // ignore parse errors
    }
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.user;
}

export async function updateProfile(
  token: string,
  payload: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    photo_url?: string;
    expo_token?: string | null;
    notifications_enabled?: boolean;
  }
) {
  const body = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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
    console.log('Failed to parse response JSON', err);
  }

  if (!response.ok) {
    console.log('Create Device Error:', response.status, responseBody);
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

export type PairDeviceBody = {
  device_name: string;
  serial_number: string;
};

export async function pairDevice(idToken: string, body: PairDeviceBody) {
  const response = await fetch(`${API_BASE}/devices/pair`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let responseBody: any;
  try {
    responseBody = await response.json();
  } catch (err) {
    console.log('Failed to parse response JSON', err);
  }

  if (response.status === 404) {
    // Backend contract: 404 { "message": "Device not found" }
    throw new Error(responseBody?.message || 'Device not found');
  }

  if (!response.ok) {
    console.log('Pair Device Error:', response.status, responseBody);
    throw new Error(
      responseBody?.message || `Failed to pair device (${response.status})`
    );
  }

  // Keep return shape similar to createDevice for minimal UI changes.
  return {
    deviceId: responseBody.serial_number ?? body.serial_number,
    device_color: responseBody.device_color ?? '#E53935',
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
    console.log('Failed to fetch device NFCs', e);
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
 * Unlink (unpair) a device
 */
export async function unlinkDevice(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/devices/unpair/${deviceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({}),
  });

  console.log(`Unlinking device: ${deviceId}`);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to unlink device');
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
    console.log('Failed to trigger device scan mode', e);
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

/**
 * Fetch alerts for the current authenticated user
 */
export async function getMyAlerts(token: string) {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch alerts');
  }

  return res.json();
}

/**
 * Resolve a specific alert
 */
export async function resolveAlert(token: string, alertId: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to resolve alert');
  }

  return res.json();
}

/**
 * Get telemetry summary for a specific device
 */
export async function getDeviceTelemetrySummary(
  idToken: string,
  deviceId: string
) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/telemetry-summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch telemetry summary');
  }

  return res.json();
}

export async function getGPSTelemetry(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/telemetry/gps`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch GPS telemetry');
  }

  return res.json();
}

export async function getGyroTelemetry(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/telemetry/gyro`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch Gyro telemetry');
  }

  return res.json();
}

export async function getRfidTelemetry(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/telemetry/rfid`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch RFID telemetry');
  }

  return res.json();
}

export async function getDetectionsTelemetry(
  idToken: string,
  deviceId: string
) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}/detections`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch detections telemetry');
  }

  return res.json();
}

export async function getByDeviceId(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch Device');
  }

  return res.json();
}

/* ---------------------------------- */
/* Vehicles (optional binding)         */
/* ---------------------------------- */
export async function getVehicle(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/vehicles/${deviceId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  // Treat "not found" as "not bound yet"
  if (res.status === 404) return null;

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to fetch vehicle');
  }

  const data = await res.json().catch(() => null);
  return (data?.vehicle ?? data) as Vehicle;
}

export async function createVehicle(
  idToken: string,
  deviceId: string,
  body: UpsertVehicleBody
) {
  const res = await fetch(`${API_BASE}/vehicles/${deviceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to create vehicle');
  }

  const data = await res.json().catch(() => null);
  return (data?.vehicle ?? data) as Vehicle;
}

export async function updateVehicle(
  idToken: string,
  deviceId: string,
  body: UpsertVehicleBody
) {
  const res = await fetch(`${API_BASE}/vehicles/${deviceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to update vehicle');
  }

  const data = await res.json().catch(() => null);
  return (data?.vehicle ?? data) as Vehicle;
}

export async function deleteVehicle(idToken: string, deviceId: string) {
  const res = await fetch(`${API_BASE}/vehicles/${deviceId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  // Deleting a non-existent vehicle should be a no-op for the UI.
  if (res.status === 404) return true;

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || 'Failed to delete vehicle');
  }

  return true;
}

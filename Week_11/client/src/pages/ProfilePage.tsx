import { useState, useEffect, type FormEvent } from "react";
import { profileApi, type ProfilePayload } from "../api/profile.api";

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deviceMac, setDeviceMac] = useState("");
  const [firmwareVersion, setFirmwareVersion] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      if (data) {
        setWeightKg(String(data.demographics.weight_kg));
        setHeightCm(String(data.demographics.height_cm));
        setBirthYear(String(data.demographics.birth_year));
        setDeviceMac(data.device_mac);
        setFirmwareVersion(data.firmware_version);
      }
    } catch {
      // No profile yet
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const payload: ProfilePayload = {
        device_mac: deviceMac,
        firmware_version: firmwareVersion,
        demographics: {
          birth_year: parseInt(birthYear, 10),
          weight_kg: parseFloat(weightKg),
          height_cm: parseFloat(heightCm),
        },
      };

      const result = await profileApi.syncProfile(payload);
      setMessage(
        `Profile synced at ${new Date(result.updated_at).toLocaleString()}`,
      );
      setProfile(payload);
    } catch (err: any) {
      const detail = err.response?.data?.details;
      if (detail) {
        setError(
          detail
            .map(
              (d: { path: string; message: string }) =>
                `${d.path}: ${d.message}`,
            )
            .join(", "),
        );
      } else {
        setError(err.response?.data?.error || "Sync failed");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="text-center text-gray-500 py-12">Loading profile...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Current Profile Card */}
      <div className="bg-white   shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Profile
        </h2>
        {profile ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Weight</span>
              <p className="font-medium">{profile.demographics.weight_kg} kg</p>
            </div>
            <div>
              <span className="text-gray-500">Height</span>
              <p className="font-medium">{profile.demographics.height_cm} cm</p>
            </div>
            <div>
              <span className="text-gray-500">Birth Year</span>
              <p className="font-medium">{profile.demographics.birth_year}</p>
            </div>
            <div>
              <span className="text-gray-500">Device MAC</span>
              <p className="font-medium font-mono">{profile.device_mac}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Firmware</span>
              <p className="font-medium">{profile.firmware_version}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No profile data synced yet.</p>
        )}
      </div>

      {/* Sync Form */}
      <div className="bg-white   shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sync Wearable Profile
        </h2>

        {message && (
          <div className="bg-green-50 text-green-700 text-sm p-3   mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3   mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Year
            </label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device MAC Address
            </label>
            <input
              type="text"
              value={deviceMac}
              onChange={(e) => setDeviceMac(e.target.value)}
              placeholder="00:1A:2B:3C:4D:5E"
              className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
              required
              pattern="^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmware Version
            </label>
            <input
              type="text"
              value={firmwareVersion}
              onChange={(e) => setFirmwareVersion(e.target.value)}
              placeholder="v2.4.1"
              className="w-full px-3 py-2 border border-gray-300   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 text-white   font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Syncing..." : "Sync Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

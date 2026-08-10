'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

export default function SettingsPage() {
  const { currentUser, userProfile } = useAuth();
  const householdId = userProfile?.householdId;
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [householdName, setHouseholdName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !householdName.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'households', householdId), {
        name: householdName.trim(),
      });
      setMessage('Household name updated!');
      setHouseholdName('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update household.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {message}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-xl p-5 shadow border mb-5">
        <h2 className="font-semibold text-gray-700 mb-4">Account Information</h2>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span>{currentUser?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Display Name</span>
            <span>{currentUser?.displayName || userProfile?.displayName || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">User ID</span>
            <span className="font-mono text-xs">{currentUser?.uid?.substring(0, 16)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Household ID</span>
            <span className="font-mono text-xs">{householdId ? householdId.substring(0, 16) + '...' : 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Update Display Name */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white rounded-xl p-5 shadow border mb-5"
      >
        <h2 className="font-semibold text-gray-700 mb-4">Update Display Name</h2>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Update Name'}
        </button>
      </form>

      {/* Update Household Name */}
      <form
        onSubmit={handleUpdateHousehold}
        className="bg-white rounded-xl p-5 shadow border"
      >
        <h2 className="font-semibold text-gray-700 mb-4">Update Household Name</h2>
        <input
          type="text"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          placeholder="New household name"
          required
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Update Household'}
        </button>
      </form>
    </div>
  );
}

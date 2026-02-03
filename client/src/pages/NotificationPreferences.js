// client/src/pages/NotificationPreferences.js
import React, { useState, useEffect } from "react";
import { notificationAPI } from "../api";
import toast from "react-hot-toast";
import { Bell, Mail, Smartphone, Save } from "lucide-react";

const NotificationPreferences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email: {
      jobApplications: true,
      applicationStatusUpdates: true,
      newMessages: true,
      profileViews: false,
      newReviews: true,
      subscriptionUpdates: true,
      verificationUpdates: true,
    },
    push: {
      jobApplications: true,
      applicationStatusUpdates: true,
      newMessages: true,
      profileViews: false,
      newReviews: true,
      subscriptionUpdates: false,
      verificationUpdates: true,
    },
    inApp: {
      jobApplications: true,
      applicationStatusUpdates: true,
      newMessages: true,
      profileViews: true,
      newReviews: true,
      subscriptionUpdates: true,
      verificationUpdates: true,
    },
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getPreferences();
      setPreferences(response.data.data);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (channel, setting) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: !prev[channel][setting],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await notificationAPI.updatePreferences(preferences);
      toast.success("Notification preferences saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const notificationSettings = [
    {
      key: "jobApplications",
      label: "Job Applications",
      description: "Notifications when someone applies to your job postings",
    },
    {
      key: "applicationStatusUpdates",
      label: "Application Status Updates",
      description: "Updates on your job application status",
    },
    {
      key: "newMessages",
      label: "New Messages",
      description: "Notifications for new direct messages",
    },
    {
      key: "profileViews",
      label: "Profile Views",
      description: "Notifications when someone views your profile",
    },
    {
      key: "newReviews",
      label: "New Reviews",
      description: "Notifications when you receive a new review",
    },
    {
      key: "subscriptionUpdates",
      label: "Subscription Updates",
      description: "Updates about your subscription status",
    },
    {
      key: "verificationUpdates",
      label: "Verification Updates",
      description: "Updates on your verification status",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Notification Preferences
            </h1>
          </div>
          <p className="text-gray-600">
            Manage how you receive notifications across different channels
          </p>
        </div>

        {/* Preferences Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Notification Type
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Push
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      <Bell className="w-4 h-4" />
                      In-App
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notificationSettings.map((setting) => (
                  <tr key={setting.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {setting.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {setting.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email[setting.key]}
                          onChange={() => handleToggle("email", setting.key)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.push[setting.key]}
                          onChange={() => handleToggle("push", setting.key)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.inApp[setting.key]}
                          onChange={() => handleToggle("inApp", setting.key)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Changes to your notification preferences will
            take effect immediately. You can update these settings at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;

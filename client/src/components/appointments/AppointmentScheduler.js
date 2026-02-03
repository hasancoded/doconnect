// client/src/components/appointments/AppointmentScheduler.js
import React, { useState } from "react";
import { X, Calendar, Clock, Globe, FileText } from "lucide-react";
import { appointmentAPI } from "../../api";
import { toast } from "react-hot-toast";

const AppointmentScheduler = ({
  doctor,
  conversationId,
  applicationId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: 30,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    purpose: "",
    notes: "",
  });

  const durations = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      toast.error("Please select date and time");
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const startTime = new Date(`${formData.date}T${formData.time}`);

      // Validate future date
      if (startTime <= new Date()) {
        toast.error("Please select a future date and time");
        return;
      }

      const appointmentData = {
        doctorInviteeId: doctor._id,
        startTime: startTime.toISOString(),
        duration: formData.duration,
        timezone: formData.timezone,
        purpose: formData.purpose,
        notes: formData.notes,
        conversationId,
        applicationId, // Link to job application if provided
      };

      await appointmentAPI.create(appointmentData);

      toast.success("Appointment request sent!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating appointment:", error);

      if (error.response?.status === 409) {
        toast.error(error.response.data.message || "Time slot conflict");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create appointment"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get minimum time for today
  const getMinTime = () => {
    if (formData.date === getMinDate()) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(Math.ceil(now.getMinutes() / 15) * 15).padStart(
        2,
        "0"
      );
      return `${hours}:${minutes}`;
    }
    return "00:00";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Schedule Appointment
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              with Dr. {doctor.firstName} {doctor.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              required
              min={getMinDate()}
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Time
            </label>
            <input
              type="time"
              required
              min={getMinTime()}
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, duration: d.value })
                  }
                  className={`px-4 py-2.5 rounded-lg border-2 transition-all ${
                    formData.duration === d.value
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4" />
              Timezone
            </label>
            <input
              type="text"
              value={formData.timezone}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Purpose (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Follow-up consultation"
              maxLength={500}
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any additional information..."
              maxLength={1000}
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;

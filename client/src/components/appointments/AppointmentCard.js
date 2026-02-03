// client/src/components/appointments/AppointmentCard.js
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { appointmentAPI } from "../../api";
import { toast } from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

const AppointmentCard = ({ appointment, onUpdate, currentUserId }) => {
  const [loading, setLoading] = useState(false);
  const [timeUntil, setTimeUntil] = useState("");

  const isInitiator = appointment.doctorInitiator._id === currentUserId;
  const otherDoctor = isInitiator
    ? appointment.doctorInvitee
    : appointment.doctorInitiator;

  // Update countdown timer
  useEffect(() => {
    if (appointment.status === "confirmed") {
      const updateTimer = () => {
        const now = new Date();
        const start = new Date(appointment.startTime);
        const diff = start - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntil(`in ${hours}h ${minutes}m`);
        } else {
          setTimeUntil("Now");
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [appointment]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await appointmentAPI.confirm(appointment._id);
      toast.success("Appointment confirmed! Zoom meeting created.");
      onUpdate?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to confirm appointment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Reason for cancellation (optional):");
    if (reason === null) return; // User clicked cancel

    try {
      setLoading(true);
      await appointmentAPI.cancel(appointment._id, reason);
      toast.success("Appointment cancelled");
      onUpdate?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel appointment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    if (appointment.meetingJoinUrl) {
      window.open(appointment.meetingJoinUrl, "_blank");
    }
  };

  const getStatusBadge = () => {
    const badges = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
        text: "Pending",
      },
      confirmed: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Confirmed",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Cancelled",
      },
      completed: {
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle,
        text: "Completed",
      },
    };

    const badge = badges[appointment.status];
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  const canJoinMeeting = () => {
    if (appointment.status !== "confirmed" || !appointment.meetingJoinUrl)
      return false;

    const now = new Date();
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);

    // Can join 10 minutes before start time
    const canJoinFrom = new Date(start.getTime() - 10 * 60 * 1000);

    return now >= canJoinFrom && now <= end;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {/* Profile Photo */}
          {otherDoctor.profilePhoto?.url ? (
            <img
              src={otherDoctor.profilePhoto.url}
              alt={otherDoctor.firstName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ring-2 ring-gray-100">
              {otherDoctor.firstName?.[0]}
              {otherDoctor.lastName?.[0]}
            </div>
          )}

          {/* Doctor Info */}
          <div>
            <h3 className="font-semibold text-gray-900">
              Dr. {otherDoctor.firstName} {otherDoctor.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {otherDoctor.primarySpecialty}
            </p>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Appointment Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {format(new Date(appointment.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>
            {format(new Date(appointment.startTime), "h:mm a")} -{" "}
            {format(new Date(appointment.endTime), "h:mm a")}
            {appointment.status === "confirmed" && timeUntil && (
              <span className="ml-2 text-blue-600 font-medium">
                ({timeUntil})
              </span>
            )}
          </span>
        </div>
        {appointment.purpose && (
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Purpose:</span> {appointment.purpose}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {appointment.status === "pending" && !isInitiator && (
          <>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Confirming..." : "Confirm"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Decline
            </button>
          </>
        )}

        {appointment.status === "pending" && isInitiator && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Cancel Request
          </button>
        )}

        {appointment.status === "confirmed" && (
          <>
            {canJoinMeeting() && (
              <button
                onClick={handleJoinMeeting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Join Meeting
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;

// client/src/pages/AppointmentsList.js
import React, { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { appointmentAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import AppointmentCard from "../components/appointments/AppointmentCard";

const AppointmentsList = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let response;

      switch (activeTab) {
        case "upcoming":
          response = await appointmentAPI.getUpcoming();
          break;
        case "pending":
          response = await appointmentAPI.getPending();
          break;
        case "past":
          response = await appointmentAPI.getAll({ past: true });
          break;
        default:
          response = await appointmentAPI.getAll();
      }

      setAppointments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming", icon: Calendar },
    { id: "pending", label: "Pending", icon: AlertCircle },
    { id: "past", label: "Past", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage your scheduled appointments
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-t-blue-600 border-r-blue-600 border-b-gray-200 border-l-gray-200"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} appointments
            </h3>
            <p className="text-gray-500">
              {activeTab === "pending"
                ? "You don't have any pending appointment requests"
                : activeTab === "upcoming"
                ? "You don't have any upcoming appointments"
                : "You don't have any past appointments"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                currentUserId={user._id}
                onUpdate={fetchAppointments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;

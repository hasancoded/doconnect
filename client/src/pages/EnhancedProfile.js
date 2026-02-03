// client/src/pages/EnhancedProfile.js - MVP Testing Version
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { profileAPI, handleApiError } from "../api";
import {
  User,
  Camera,
  Upload,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  Briefcase,
  Award,
  ArrowLeft,
  Loader,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
} from "lucide-react";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const EnhancedProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editingSkill, setEditingSkill] = useState(false);
  const [editingCertification, setEditingCertification] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileAPI.getMe(),
    staleTime: 2 * 60 * 1000,
  });

  // Extract profile safely
  const profile = profileData?.data?.data || profileData?.data || null;

  // ============================================================================
  // MUTATIONS
  // ============================================================================
  const updateBasicMutation = useMutation({
    mutationFn: (data) => profileAPI.updateBasic(data),
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries(["profile"]);
      setEditingBasic(false);
    },
    onError: (error) => {
      toast.error(handleApiError(error).message);
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file) => profileAPI.uploadPhoto(file, setUploadProgress),
    onSuccess: () => {
      toast.success("Photo uploaded!");
      setUploadProgress(0);
      queryClient.invalidateQueries(["profile"]);
    },
    onError: (error) => {
      toast.error("Failed to upload photo");
      setUploadProgress(0);
    },
  });

  const uploadDocsMutation = useMutation({
    mutationFn: ({ files, types }) =>
      profileAPI.uploadDocuments(files, types, setUploadProgress),
    onSuccess: () => {
      toast.success("Documents uploaded!");
      setUploadProgress(0);
      queryClient.invalidateQueries(["profile"]);
    },
    onError: (error) => {
      toast.error("Failed to upload documents");
      setUploadProgress(0);
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId) => profileAPI.deleteDocument(docId),
    onSuccess: () => {
      toast.success("Document deleted!");
      queryClient.invalidateQueries(["profile"]);
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const experienceMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return id
        ? profileAPI.updateExperience(id, data)
        : profileAPI.addExperience(data);
    },
    onSuccess: () => {
      toast.success(
        editingExperience ? "Experience updated!" : "Experience added!"
      );
      queryClient.invalidateQueries(["profile"]);
      setEditingExperience(null);
    },
    onError: () => toast.error("Failed to save experience"),
  });

  const deleteExpMutation = useMutation({
    mutationFn: (expId) => profileAPI.deleteExperience(expId),
    onSuccess: () => {
      toast.success("Experience deleted!");
      queryClient.invalidateQueries(["profile"]);
    },
    onError: () => toast.error("Failed to delete experience"),
  });

  const skillsMutation = useMutation({
    mutationFn: (skills) => profileAPI.updateSkills({ skills }),
    onSuccess: () => {
      toast.success("Skills updated!");
      queryClient.invalidateQueries(["profile"]);
      setEditingSkill(false);
    },
    onError: () => toast.error("Failed to update skills"),
  });

  const certificationMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return id
        ? profileAPI.updateCertification(id, data)
        : profileAPI.addCertification(data);
    },
    onSuccess: () => {
      toast.success(
        editingCertification ? "Certification updated!" : "Certification added!"
      );
      queryClient.invalidateQueries(["profile"]);
      setEditingCertification(null);
    },
    onError: () => toast.error("Failed to save certification"),
  });

  const deleteCertMutation = useMutation({
    mutationFn: (certId) => profileAPI.deleteCertification(certId),
    onSuccess: () => {
      toast.success("Certification deleted!");
      queryClient.invalidateQueries(["profile"]);
    },
    onError: () => toast.error("Failed to delete certification"),
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    uploadPhotoMutation.mutate(file);
  };

  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files);
      "Selected files for upload:",
      files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
    );

    if (files.length === 0) return;

    // Reset input to allow selecting the same file again
    e.target.value = "";

    for (const file of files) {
      // More permissible type check or just log it
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        console.warn("Invalid file type:", file.type);
        toast.error(
          `File type ${
            file.type || "unknown"
          } not supported. Only images and PDFs.`
        );
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (>10MB)`);
        return;
      }
    }

    const types = files.map(() => "other");
    uploadDocsMutation.mutate({ files, types });
  };

  const handleBasicSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Parse subspecialties from comma-separated string
    const subspecialtiesStr = formData.get("subspecialties");
    const subspecialties = subspecialtiesStr
      ? subspecialtiesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Parse languages array
    const languages = [];
    let langIndex = 0;
    while (formData.get(`languages[${langIndex}].language`)) {
      const language = formData.get(`languages[${langIndex}].language`);
      const proficiency = formData.get(`languages[${langIndex}].proficiency`);
      if (language) {
        languages.push({ language, proficiency });
      }
      langIndex++;
    }

    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      yearsOfExperience: parseInt(formData.get("yearsOfExperience")) || 0,
      bio: formData.get("bio"),
      subspecialties,
      languages,
      location: {
        city: formData.get("city"),
        state: formData.get("state"),
        country: formData.get("country"),
      },
    };
    updateBasicMutation.mutate(data);
  };

  const handleExperienceSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get("title"),
      institution: formData.get("institution"),
      location: formData.get("location"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") || null,
      current: formData.get("current") === "on",
      description: formData.get("description"),
      type: formData.get("type"),
    };

    experienceMutation.mutate({
      id: editingExperience?._id,
      data,
    });
  };

  const handleSkillSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSkill = {
      name: formData.get("name"),
      category: formData.get("category"),
      proficiencyLevel: formData.get("proficiencyLevel"),
      yearsOfExperience: parseInt(formData.get("yearsOfExperience")),
    };

    const currentSkills = profile?.skills || [];
    skillsMutation.mutate([...currentSkills, newSkill]);
  };

  const handleCertificationSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      issuingOrganization: formData.get("issuingOrganization"),
      issueDate: formData.get("issueDate"),
      expirationDate: formData.get("expirationDate") || null,
      credentialId: formData.get("credentialId"),
      credentialUrl: formData.get("credentialUrl"),
    };

    certificationMutation.mutate({
      id: editingCertification?._id,
      data,
    });
  };

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary px-6 py-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No profile data available</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-8">
            <div className="flex items-center gap-6">
              {/* Profile Photo */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                  {profile.profilePhoto?.url ? (
                    <img
                      src={profile.profilePhoto.url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <User className="w-12 h-12 text-blue-600" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
                    <span className="text-white text-sm font-bold">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  Dr. {profile.firstName} {profile.lastName}
                  {profile.verificationStatus?.overall === "verified" && (
                    <CheckCircle className="w-6 h-6 inline ml-2 text-green-400" />
                  )}
                </h1>
                <p className="text-xl text-blue-100 mb-2">
                  {profile.primarySpecialty}
                </p>
                <p className="text-blue-200">
                  {profile.yearsOfExperience} years experience • {profile.role}
                </p>
                <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3 inline-block">
                  <span className="text-sm text-white">Profile Completion</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-32 bg-white bg-opacity-30 rounded-full h-2">
                      <div
                        className="bg-green-400 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            profile.profileCompletion?.percentage || 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-bold">
                      {profile.profileCompletion?.percentage || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex overflow-x-auto p-2">
            {[
              { id: "overview", label: "Overview", icon: User },
              { id: "professional", label: "Professional", icon: Briefcase },
              { id: "documents", label: "Documents", icon: FileText },
              {
                id: "availability",
                label: "Availability & Preferences",
                icon: Clock,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all rounded-lg mx-1 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <OverviewTab
              profile={profile}
              editingBasic={editingBasic}
              setEditingBasic={setEditingBasic}
              handleBasicSubmit={handleBasicSubmit}
              updateBasicMutation={updateBasicMutation}
            />
          )}
          {activeTab === "professional" && (
            <ProfessionalTab
              profile={profile}
              editingExperience={editingExperience}
              setEditingExperience={setEditingExperience}
              handleExperienceSubmit={handleExperienceSubmit}
              experienceMutation={experienceMutation}
              deleteExpMutation={deleteExpMutation}
              editingSkill={editingSkill}
              setEditingSkill={setEditingSkill}
              handleSkillSubmit={handleSkillSubmit}
              skillsMutation={skillsMutation}
              editingCertification={editingCertification}
              setEditingCertification={setEditingCertification}
              handleCertificationSubmit={handleCertificationSubmit}
              certificationMutation={certificationMutation}
              deleteCertMutation={deleteCertMutation}
            />
          )}
          {activeTab === "documents" && (
            <DocumentsTab
              profile={profile}
              docInputRef={docInputRef}
              handleDocUpload={handleDocUpload}
              uploadProgress={uploadProgress}
              uploadDocsMutation={uploadDocsMutation}
              deleteDocMutation={deleteDocMutation}
            />
          )}
          {activeTab === "availability" && (
            <AvailabilityTab profile={profile} queryClient={queryClient} />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// OVERVIEW TAB
// ============================================================================
const OverviewTab = ({
  profile,
  editingBasic,
  setEditingBasic,
  handleBasicSubmit,
  updateBasicMutation,
}) => (
  <div className="space-y-6">
    {/* Basic Information */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
        {!editingBasic && (
          <button
            onClick={() => setEditingBasic(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {editingBasic ? (
        <form onSubmit={handleBasicSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                name="firstName"
                defaultValue={profile.firstName}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                name="lastName"
                defaultValue={profile.lastName}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone}
                placeholder="+1-555-0123"
                pattern="[+]?[0-9-() ]+"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                name="yearsOfExperience"
                type="number"
                min="0"
                max="50"
                defaultValue={profile.yearsOfExperience}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subspecialties
            </label>
            <input
              name="subspecialties"
              defaultValue={profile.subspecialties?.join(", ")}
              placeholder="Interventional Cardiology, Electrophysiology"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple subspecialties with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages
            </label>
            {(profile.languages?.length > 0
              ? profile.languages
              : [{ language: "", proficiency: "conversational" }]
            ).map((lang, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                <input
                  name={`languages[${idx}].language`}
                  defaultValue={lang.language}
                  placeholder="English"
                  className="input w-full"
                />
                <select
                  name={`languages[${idx}].proficiency`}
                  defaultValue={lang.proficiency}
                  className="input w-full"
                >
                  <option value="basic">Basic</option>
                  <option value="conversational">Conversational</option>
                  <option value="fluent">Fluent</option>
                  <option value="native">Native</option>
                </select>
              </div>
            ))}
            <p className="text-xs text-gray-500">
              Add language and proficiency level
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Bio
            </label>
            <textarea
              name="bio"
              defaultValue={profile.bio}
              rows={4}
              className="input w-full"
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                name="city"
                defaultValue={profile.location?.city}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                name="state"
                defaultValue={profile.location?.state}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                name="country"
                defaultValue={profile.location?.country}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updateBasicMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateBasicMutation.isLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditingBasic(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-gray-900 font-medium">
                Dr. {profile.firstName} {profile.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Specialty</p>
              <p className="text-gray-900 font-medium">
                {profile.primarySpecialty}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-gray-900">{profile.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Years of Experience</p>
              <p className="text-gray-900">{profile.yearsOfExperience} years</p>
            </div>
          </div>

          {profile.subspecialties?.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Subspecialties</p>
              <div className="flex flex-wrap gap-2">
                {profile.subspecialties.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.languages?.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {lang.language} ({lang.proficiency})
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-sm text-gray-600">Bio</p>
              <p className="text-gray-900">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-gray-900">
                {[
                  profile.location?.city,
                  profile.location?.state,
                  profile.location?.country,
                ]
                  .filter(Boolean)
                  .join(", ") || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-gray-900 capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Verification Status */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Verification Status
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {["overall", "identity", "medical_license", "background_check"].map(
          (type) => {
            const status = profile.verificationStatus?.[type] || "pending";
            const colors = {
              verified: "bg-green-100 text-green-800 border-green-200",
              pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
              rejected: "bg-red-100 text-red-800 border-red-200",
            };

            return (
              <div key={type} className="text-center">
                <p className="text-sm text-gray-600 mb-2 capitalize">
                  {type.replace(/_/g, " ")}
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}
                >
                  {status}
                </span>
              </div>
            );
          }
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// PROFESSIONAL TAB
// ============================================================================
const ProfessionalTab = ({
  profile,
  editingExperience,
  setEditingExperience,
  handleExperienceSubmit,
  experienceMutation,
  deleteExpMutation,
  editingSkill,
  setEditingSkill,
  handleSkillSubmit,
  skillsMutation,
  editingCertification,
  setEditingCertification,
  handleCertificationSubmit,
  certificationMutation,
  deleteCertMutation,
}) => (
  <div className="space-y-6">
    {/* Experience Section */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Experience</h3>
        {!editingExperience && (
          <button
            onClick={() => setEditingExperience({})}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        )}
      </div>

      {editingExperience && (
        <form
          onSubmit={handleExperienceSubmit}
          className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                name="title"
                defaultValue={editingExperience.title}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution *
              </label>
              <input
                name="institution"
                defaultValue={editingExperience.institution}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              name="location"
              defaultValue={editingExperience.location}
              className="input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                name="startDate"
                type="date"
                defaultValue={editingExperience.startDate?.split("T")[0]}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                name="endDate"
                type="date"
                defaultValue={editingExperience.endDate?.split("T")[0]}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                defaultValue={editingExperience.type}
                className="input w-full"
                required
              >
                <option value="employment">Employment</option>
                <option value="residency">Residency</option>
                <option value="fellowship">Fellowship</option>
                <option value="education">Education</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                name="current"
                type="checkbox"
                defaultChecked={editingExperience.current}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                I currently work here
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={editingExperience.description}
              rows={3}
              className="input w-full"
              maxLength={1000}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={experienceMutation.isLoading}
              className="btn-primary"
            >
              {experienceMutation.isLoading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditingExperience(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {profile.experiences?.length > 0 ? (
          profile.experiences.map((exp) => (
            <div
              key={exp._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {exp.title}
                  </h4>
                  <p className="text-blue-600 font-medium">{exp.institution}</p>
                  <p className="text-gray-600 text-sm">{exp.location}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date(exp.startDate).toLocaleDateString()} -{" "}
                    {exp.current
                      ? "Present"
                      : new Date(exp.endDate).toLocaleDateString()}
                  </p>
                  {exp.description && (
                    <p className="text-gray-700 mt-2">{exp.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingExperience(exp)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      window.confirm("Delete this experience?") &&
                      deleteExpMutation.mutate(exp._id)
                    }
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            No experience added yet
          </p>
        )}
      </div>
    </div>

    {/* Skills Section */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Skills</h3>
        {!editingSkill && (
          <button
            onClick={() => setEditingSkill(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        )}
      </div>

      {editingSkill && (
        <form
          onSubmit={handleSkillSubmit}
          className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Name *
              </label>
              <input name="name" className="input w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select name="category" className="input w-full" required>
                <option value="clinical">Clinical</option>
                <option value="research">Research</option>
                <option value="administrative">Administrative</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proficiency Level *
              </label>
              <select name="proficiencyLevel" className="input w-full" required>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience *
              </label>
              <input
                name="yearsOfExperience"
                type="number"
                min="0"
                max="50"
                defaultValue="1"
                className="input w-full"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={skillsMutation.isLoading}
              className="btn-primary"
            >
              {skillsMutation.isLoading ? "Adding..." : "Add Skill"}
            </button>
            <button
              type="button"
              onClick={() => setEditingSkill(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4">
        {profile.skills?.length > 0 ? (
          profile.skills.map((skill, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {skill.category}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                      {skill.proficiencyLevel}
                    </span>
                    <span className="text-xs text-gray-500">
                      {skill.yearsOfExperience} years
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8 col-span-2">
            No skills added yet
          </p>
        )}
      </div>
    </div>

    {/* Certifications Section */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Certifications</h3>
        {!editingCertification && (
          <button
            onClick={() => setEditingCertification({})}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Certification
          </button>
        )}
      </div>

      {editingCertification && (
        <form
          onSubmit={handleCertificationSubmit}
          className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification Name *
              </label>
              <input
                name="name"
                defaultValue={editingCertification.name}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuing Organization *
              </label>
              <input
                name="issuingOrganization"
                defaultValue={editingCertification.issuingOrganization}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                name="issueDate"
                type="date"
                defaultValue={editingCertification.issueDate?.split("T")[0]}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                name="expirationDate"
                type="date"
                defaultValue={
                  editingCertification.expirationDate?.split("T")[0]
                }
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credential ID
              </label>
              <input
                name="credentialId"
                defaultValue={editingCertification.credentialId}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credential URL
              </label>
              <input
                name="credentialUrl"
                type="url"
                defaultValue={editingCertification.credentialUrl}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={certificationMutation.isLoading}
              className="btn-primary"
            >
              {certificationMutation.isLoading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditingCertification(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {profile.certifications?.length > 0 ? (
          profile.certifications.map((cert) => (
            <div
              key={cert._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {cert.name}
                  </h4>
                  <p className="text-blue-600 font-medium">
                    {cert.issuingOrganization}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                    {cert.expirationDate &&
                      ` • Expires: ${new Date(
                        cert.expirationDate
                      ).toLocaleDateString()}`}
                  </p>
                  {cert.credentialId && (
                    <p className="text-gray-600 text-sm">
                      ID: {cert.credentialId}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCertification(cert)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      window.confirm("Delete this certification?") &&
                      deleteCertMutation.mutate(cert._id)
                    }
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            No certifications added yet
          </p>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// DOCUMENTS TAB
// ============================================================================
const DocumentsTab = ({
  profile,
  docInputRef,
  handleDocUpload,
  uploadProgress,
  uploadDocsMutation,
  deleteDocMutation,
}) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Verification Documents
        </h3>
        <button
          onClick={() => docInputRef.current?.click()}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
        <input
          ref={docInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleDocUpload}
          className="hidden"
        />
      </div>

      {(uploadDocsMutation.isLoading ||
        (uploadProgress > 0 && uploadProgress < 100)) && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Uploading...
            </span>
            <span className="text-sm font-bold text-blue-600">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile.documents?.length > 0 ? (
          profile.documents.map((doc) => (
            <div
              key={doc._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4
                      className="font-semibold text-gray-900 text-sm truncate max-w-[180px]"
                      title={doc.name}
                    >
                      {doc.name || doc.type.replace(/_/g, " ").toUpperCase()}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {doc.type.replace(/_/g, " ").toUpperCase()} •{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {doc.verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Pending
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-100 transition-colors"
                >
                  View
                </a>
                <button
                  onClick={() =>
                    window.confirm("Delete this document?") &&
                    deleteDocMutation.mutate(doc._id)
                  }
                  disabled={deleteDocMutation.isLoading}
                  className="text-red-600 hover:text-red-700 px-3 py-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No documents uploaded yet</p>
            <button
              onClick={() => docInputRef.current?.click()}
              className="btn-primary"
            >
              Upload Your First Document
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          Document Requirements
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Accepted formats: JPG, PNG, PDF</li>
          <li>• Maximum file size: 10MB per file</li>
          <li>• Upload up to 5 files at once</li>
          <li>• Documents will be reviewed by admin for verification</li>
        </ul>
      </div>
    </div>
  </div>
);

// ============================================================================
// AVAILABILITY & PREFERENCES TAB
// ============================================================================
const AvailabilityTab = ({ profile, queryClient }) => {
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);

  const availabilityMutation = useMutation({
    mutationFn: (data) => profileAPI.updateAvailability(data),
    onSuccess: () => {
      toast.success("Availability updated!");
      queryClient.invalidateQueries(["profile"]);
      setEditingAvailability(false);
    },
    onError: (error) => {
      toast.error(handleApiError(error).message);
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: (data) => profileAPI.updateBasic({ job_preferences: data }),
    onSuccess: () => {
      toast.success("Preferences updated!");
      queryClient.invalidateQueries(["profile"]);
      setEditingPreferences(false);
    },
    onError: (error) => {
      toast.error(handleApiError(error).message);
    },
  });

  const handleAvailabilitySubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      timezone: formData.get("timezone"),
      hoursPerWeek: parseInt(formData.get("hoursPerWeek")) || 0,
      responseTime: formData.get("responseTime"),
    };

    availabilityMutation.mutate(data);
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const categories = [];
    formData
      .getAll("preferred_categories")
      .forEach((cat) => categories.push(cat));

    const data = {
      seeking_opportunities: formData.get("seeking_opportunities") === "on",
      preferred_categories: categories,
      preferred_budget_range: {
        min: parseInt(formData.get("budget_min")) || 0,
        max: parseInt(formData.get("budget_max")) || 0,
      },
      preferred_timeline: formData.get("preferred_timeline"),
      availability_hours_per_week:
        parseInt(formData.get("availability_hours")) || 0,
      remote_work_preference: formData.get("remote_work_preference"),
      notification_preferences: {
        new_jobs: formData.get("notify_new_jobs") === "on",
        job_matches: formData.get("notify_matches") === "on",
        application_updates: formData.get("notify_updates") === "on",
      },
    };

    preferencesMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Availability Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Availability Settings
          </h3>
          {!editingAvailability && (
            <button
              onClick={() => setEditingAvailability(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {editingAvailability ? (
          <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  name="timezone"
                  defaultValue={
                    profile.availability?.timezone || "America/New_York"
                  }
                  className="input w-full"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Hours Per Week
                </label>
                <input
                  name="hoursPerWeek"
                  type="number"
                  min="0"
                  max="168"
                  defaultValue={profile.availability?.hoursPerWeek || 40}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response Time
              </label>
              <select
                name="responseTime"
                defaultValue={
                  profile.availability?.responseTime || "within-day"
                }
                className="input w-full"
              >
                <option value="immediate">Immediate (within 1 hour)</option>
                <option value="within-hour">Within a few hours</option>
                <option value="within-day">Within a day</option>
                <option value="within-week">Within a week</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={availabilityMutation.isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {availabilityMutation.isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditingAvailability(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Timezone</p>
                <p className="text-gray-900 font-medium">
                  {profile.availability?.timezone || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hours Per Week</p>
                <p className="text-gray-900 font-medium">
                  {profile.availability?.hoursPerWeek || 0} hours
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-gray-900 font-medium capitalize">
                  {profile.availability?.responseTime?.replace(/-/g, " ") ||
                    "Not set"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Preferences Section - Only for Junior Doctors */}
      {profile.role === "junior" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Job Preferences</h3>
            {!editingPreferences && (
              <button
                onClick={() => setEditingPreferences(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {editingPreferences ? (
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  name="seeking_opportunities"
                  id="seeking_opportunities"
                  defaultChecked={
                    profile.job_preferences?.seeking_opportunities
                  }
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label
                  htmlFor="seeking_opportunities"
                  className="text-sm font-medium text-gray-900"
                >
                  I am currently seeking job opportunities
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Job Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "consultation",
                    "research",
                    "documentation",
                    "review",
                    "teaching",
                    "writing",
                  ].map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        name="preferred_categories"
                        value={cat}
                        defaultChecked={profile.job_preferences?.preferred_categories?.includes(
                          cat
                        )}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budget_min"
                    min="0"
                    defaultValue={
                      profile.job_preferences?.preferred_budget_range?.min || 0
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budget_max"
                    min="0"
                    defaultValue={
                      profile.job_preferences?.preferred_budget_range?.max || 0
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Timeline
                  </label>
                  <select
                    name="preferred_timeline"
                    defaultValue={
                      profile.job_preferences?.preferred_timeline || "flexible"
                    }
                    className="input w-full"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="short_term">Short Term (1-3 months)</option>
                    <option value="medium_term">
                      Medium Term (3-6 months)
                    </option>
                    <option value="long_term">Long Term (6+ months)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Hours Per Week
                  </label>
                  <input
                    type="number"
                    name="availability_hours"
                    min="0"
                    max="168"
                    defaultValue={
                      profile.job_preferences?.availability_hours_per_week || 20
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remote Work Preference
                </label>
                <select
                  name="remote_work_preference"
                  defaultValue={
                    profile.job_preferences?.remote_work_preference ||
                    "flexible"
                  }
                  className="input w-full"
                >
                  <option value="remote_only">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="on_site">On-Site</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Preferences
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="notify_new_jobs"
                      defaultChecked={
                        profile.job_preferences?.notification_preferences
                          ?.new_jobs !== false
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">
                      Notify me about new job postings
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="notify_matches"
                      defaultChecked={
                        profile.job_preferences?.notification_preferences
                          ?.job_matches !== false
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">Notify me about job matches</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="notify_updates"
                      defaultChecked={
                        profile.job_preferences?.notification_preferences
                          ?.application_updates !== false
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">
                      Notify me about application updates
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={preferencesMutation.isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {preferencesMutation.isLoading
                    ? "Saving..."
                    : "Save Preferences"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPreferences(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  profile.job_preferences?.seeking_opportunities
                    ? "bg-green-50"
                    : "bg-gray-50"
                }`}
              >
                <p className="text-sm font-medium">
                  {profile.job_preferences?.seeking_opportunities
                    ? "✓ Currently seeking opportunities"
                    : "Not currently seeking opportunities"}
                </p>
              </div>

              {profile.job_preferences?.preferred_categories?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Preferred Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.job_preferences.preferred_categories.map(
                      (cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize"
                        >
                          {cat}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Budget Range</p>
                  <p className="text-gray-900 font-medium">
                    ${profile.job_preferences?.preferred_budget_range?.min || 0}{" "}
                    - $
                    {profile.job_preferences?.preferred_budget_range?.max || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Timeline</p>
                  <p className="text-gray-900 font-medium capitalize">
                    {profile.job_preferences?.preferred_timeline?.replace(
                      /_/g,
                      " "
                    ) || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remote Preference</p>
                  <p className="text-gray-900 font-medium capitalize">
                    {profile.job_preferences?.remote_work_preference?.replace(
                      /_/g,
                      " "
                    ) || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedProfile;

// client/src/pages/Register.js - Modern MVP Design
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authAPI, handleApiError } from "../api";
import Logo from "../components/Logo";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronRight,
  ArrowLeft,
  Shield,
  Award,
  MapPin,
  Globe,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  FileText,
  LogOut,
} from "lucide-react";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);

  const totalSteps = 5;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: searchParams.get("role") || "junior",
      medicalLicenseNumber: "",
      licenseState: "",
      primarySpecialty: "",
      subspecialties: [],
      yearsOfExperience: "",
      medicalSchool: {
        name: "",
        graduationYear: "",
        location: "",
      },
      location: {
        city: "",
        state: "",
        country: "United States",
        timezone: "America/New_York",
      },
      languages: [{ language: "English", proficiency: "native" }],
      bio: "",
      privacy: {
        profileVisibility: "members_only",
        showEmail: false,
        showPhone: false,
        allowDirectContact: true,
        showLastSeen: true,
      },
    },
  });

  const watchRole = watch("role");
  const watchPassword = watch("password");
  const watchLanguages = watch("languages");
  const watchSubspecialties = watch("subspecialties");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [emailCheckTimeout]);

  const checkEmailAvailability = useCallback(async (email) => {
    setEmailCheckStatus({ checking: true, available: null, message: "" });

    try {
      const response = await authAPI.checkEmailAvailability(email);

      if (response.data.success) {
        setEmailCheckStatus({
          checking: false,
          available: response.data.available,
          message: response.data.message,
        });
      }
    } catch (error) {
      console.error("Email check error:", error);
      setEmailCheckStatus({
        checking: false,
        available: null,
        message: "",
      });
    }
  }, []);

  const handleEmailChange = (e) => {
    const email = e.target.value;

    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailCheckStatus({ checking: false, available: null, message: "" });
      return;
    }

    const timeout = setTimeout(() => {
      checkEmailAvailability(email);
    }, 800);

    setEmailCheckTimeout(timeout);
  };

  const validateStep = async (step) => {
    let fieldsToValidate = [];

    switch (step) {
      case 1:
        fieldsToValidate = [
          "firstName",
          "lastName",
          "email",
          "phone",
          "password",
          "confirmPassword",
          "role",
        ];
        break;
      case 2:
        fieldsToValidate = [
          "medicalLicenseNumber",
          "licenseState",
          "primarySpecialty",
          "yearsOfExperience",
        ];
        break;
      case 3:
        fieldsToValidate = [
          "medicalSchool.name",
          "medicalSchool.graduationYear",
        ];
        break;
      case 4:
        fieldsToValidate = ["location.city", "location.state"];
        break;
      case 5:
        return true;
      default:
        return false;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const email = getValues("email");
      const emailValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);

      if (!emailValid) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (emailCheckStatus.available === false) {
        toast.error("This email is already registered. Please login instead.", {
          duration: 5000,
        });
        return;
      }

      if (emailCheckStatus.checking) {
        toast.loading("Checking email availability...", { duration: 1000 });
        setTimeout(() => handleNext(), 1000);
        return;
      }

      if (emailCheckStatus.available === null && email) {
        setEmailCheckStatus({ checking: true, available: null, message: "" });
        try {
          const response = await authAPI.checkEmailAvailability(email);
          if (!response.data.available) {
            toast.error(
              "This email is already registered. Please login instead.",
              { duration: 5000 }
            );
            setEmailCheckStatus({
              checking: false,
              available: false,
              message: response.data.message,
            });
            return;
          }
          setEmailCheckStatus({
            checking: false,
            available: true,
            message: response.data.message,
          });
        } catch (error) {
          console.error("Email check error:", error);
        }
      }
    }

    const isValid = await validateStep(currentStep);

    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fix the errors before continuing");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLanguageChange = (index, field, value) => {
    const currentLanguages = getValues("languages");
    const updatedLanguages = [...currentLanguages];
    updatedLanguages[index] = { ...updatedLanguages[index], [field]: value };
    setValue("languages", updatedLanguages);
  };

  const addLanguage = () => {
    const currentLanguages = getValues("languages");
    setValue("languages", [
      ...currentLanguages,
      { language: "", proficiency: "conversational" },
    ]);
  };

  const removeLanguage = (index) => {
    const currentLanguages = getValues("languages");
    if (currentLanguages.length > 1) {
      const updatedLanguages = currentLanguages.filter((_, i) => i !== index);
      setValue("languages", updatedLanguages);
    }
  };

  const toggleSubspecialty = (subspecialty) => {
    const current = getValues("subspecialties") || [];
    if (current.includes(subspecialty)) {
      setValue(
        "subspecialties",
        current.filter((s) => s !== subspecialty)
      );
    } else {
      setValue("subspecialties", [...current, subspecialty]);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const { confirmPassword, ...submitData } = data;

      submitData.yearsOfExperience = parseInt(submitData.yearsOfExperience);
      submitData.medicalSchool.graduationYear = parseInt(
        submitData.medicalSchool.graduationYear
      );

      submitData.languages = submitData.languages.filter(
        (lang) => lang.language.trim() !== ""
      );

      const response = await authAPI.register(submitData);

      if (response.data.success) {
        toast.success("Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);

      if (errorInfo.errors && Array.isArray(errorInfo.errors)) {
        errorInfo.errors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const specialties = [
    "Anesthesiology",
    "Cardiology",
    "Dermatology",
    "Emergency Medicine",
    "Endocrinology",
    "Family Medicine",
    "Gastroenterology",
    "Hematology",
    "Infectious Disease",
    "Internal Medicine",
    "Nephrology",
    "Neurology",
    "Obstetrics & Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics",
    "Otolaryngology",
    "Pathology",
    "Pediatrics",
    "Psychiatry",
    "Pulmonology",
    "Radiology",
    "Rheumatology",
    "Surgery",
    "Urology",
    "Other",
  ];

  const subspecialties = [
    "Interventional Cardiology",
    "Pediatric Cardiology",
    "Cardiac Surgery",
    "Orthopedic Surgery",
    "Neurosurgery",
    "Plastic Surgery",
    "Vascular Surgery",
    "Pediatric Surgery",
    "Medical Oncology",
    "Radiation Oncology",
    "Interventional Radiology",
    "Diagnostic Radiology",
    "Nuclear Medicine",
    "Child & Adolescent Psychiatry",
    "Geriatric Medicine",
    "Sports Medicine",
    "Pain Management",
    "Critical Care Medicine",
    "Hospice & Palliative Medicine",
  ];

  const states = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese (Mandarin)",
    "Chinese (Cantonese)",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo size={40} showText={true} />
            </Link>
            <Link
              to="/login"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600">
            Join the professional medical networking platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: "Personal" },
              { num: 2, label: "Credentials" },
              { num: 3, label: "Education" },
              { num: 4, label: "Location" },
              { num: 5, label: "Profile" },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step.num
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step.num
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-all ${
                      currentStep > step.num ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <form
            onSubmit={
              currentStep === totalSteps
                ? handleSubmit(onSubmit)
                : (e) => {
                    e.preventDefault();
                    handleNext();
                  }
            }
          >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Step1
                register={register}
                errors={errors}
                watchRole={watchRole}
                emailCheckStatus={emailCheckStatus}
                handleEmailChange={handleEmailChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                watchPassword={watchPassword}
              />
            )}

            {/* Step 2: Medical Credentials */}
            {currentStep === 2 && (
              <Step2
                register={register}
                errors={errors}
                specialties={specialties}
                subspecialties={subspecialties}
                watchSubspecialties={watchSubspecialties}
                toggleSubspecialty={toggleSubspecialty}
                states={states}
              />
            )}

            {/* Step 3: Medical Education */}
            {currentStep === 3 && <Step3 register={register} errors={errors} />}

            {/* Step 4: Location & Languages */}
            {currentStep === 4 && (
              <Step4
                register={register}
                errors={errors}
                states={states}
                languages={languages}
                watchLanguages={watchLanguages}
                handleLanguageChange={handleLanguageChange}
                addLanguage={addLanguage}
                removeLanguage={removeLanguage}
              />
            )}

            {/* Step 5: Profile & Review */}
            {currentStep === 5 && (
              <Step5
                register={register}
                errors={errors}
                watch={watch}
                getValues={getValues}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              ) : (
                <div />
              )}

              {currentStep < totalSteps ? (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Secure Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span>Verified Professionals</span>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// STEP COMPONENTS
// ============================================================================

const Step1 = ({
  register,
  errors,
  watchRole,
  emailCheckStatus,
  handleEmailChange,
  showPassword,
  setShowPassword,
  watchPassword,
}) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
      <p className="text-gray-600 text-sm">
        Let's start with your basic information
      </p>
    </div>

    {/* Role Selection */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        I am a... <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label
          className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
            watchRole === "junior"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            value="junior"
            {...register("role", { required: "Role is required" })}
            className="sr-only"
          />
          <div className="flex items-center gap-3 w-full">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                watchRole === "junior"
                  ? "border-green-500 bg-green-500"
                  : "border-gray-300"
              }`}
            >
              {watchRole === "junior" && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">
                  Junior Doctor
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Looking for opportunities to gain experience
              </p>
            </div>
          </div>
        </label>

        <label
          className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
            watchRole === "senior"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            value="senior"
            {...register("role", { required: "Role is required" })}
            className="sr-only"
          />
          <div className="flex items-center gap-3 w-full">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                watchRole === "senior"
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {watchRole === "senior" && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">
                  Senior Doctor
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Looking to hire junior doctors
              </p>
            </div>
          </div>
        </label>
      </div>
      {errors.role && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.role.message}
        </p>
      )}
    </div>

    {/* Name Fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            {...register("firstName", {
              required: "First name is required",
              minLength: { value: 2, message: "Minimum 2 characters required" },
            })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.firstName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter your first name"
          />
        </div>
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.firstName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            {...register("lastName", {
              required: "Last name is required",
              minLength: { value: 2, message: "Minimum 2 characters required" },
            })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.lastName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter your last name"
          />
        </div>
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.lastName.message}
          </p>
        )}
      </div>
    </div>

    {/* Email and Phone */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
              onChange: handleEmailChange,
            })}
            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email
                ? "border-red-300"
                : emailCheckStatus.available === true
                ? "border-green-300"
                : emailCheckStatus.available === false
                ? "border-red-300"
                : "border-gray-300"
            }`}
            placeholder="doctor@example.com"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {emailCheckStatus.checking && (
              <Loader className="w-5 h-5 animate-spin text-blue-500" />
            )}
            {!emailCheckStatus.checking &&
              emailCheckStatus.available === true && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            {!emailCheckStatus.checking &&
              emailCheckStatus.available === false && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
          </div>
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email.message}
          </p>
        )}
        {!errors.email && emailCheckStatus.available === true && (
          <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Email available
          </p>
        )}
        {!errors.email && emailCheckStatus.available === false && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Email already registered.{" "}
            <Link to="/login" className="underline hover:text-red-700">
              Login?
            </Link>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^\+?[\d\s\-\(\)]{10,}$/,
                message: "Please enter a valid phone number",
              },
            })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phone ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.phone.message}
          </p>
        )}
      </div>
    </div>

    {/* Password Fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message:
                  "Must contain uppercase, lowercase, number, and special character",
              },
            })}
            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.password ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === watchPassword || "Passwords do not match",
            })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.confirmPassword ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Confirm your password"
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
    </div>
  </div>
);

const Step2 = ({
  register,
  errors,
  specialties,
  subspecialties,
  watchSubspecialties,
  toggleSubspecialty,
  states,
}) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold text-gray-900">Medical Credentials</h3>
      <p className="text-gray-600 text-sm">
        Please provide your professional medical information
      </p>
    </div>

    {/* Medical License */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical License Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("medicalLicenseNumber", {
            required: "License number is required",
            minLength: { value: 3, message: "Minimum 3 characters required" },
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.medicalLicenseNumber ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Enter your license number"
        />
        {errors.medicalLicenseNumber && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.medicalLicenseNumber.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          License State <span className="text-red-500">*</span>
        </label>
        <select
          {...register("licenseState", {
            required: "License state is required",
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.licenseState ? "border-red-300" : "border-gray-300"
          }`}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors.licenseState && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.licenseState.message}
          </p>
        )}
      </div>
    </div>

    {/* Primary Specialty */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Primary Medical Specialty <span className="text-red-500">*</span>
      </label>
      <select
        {...register("primarySpecialty", {
          required: "Primary specialty is required",
        })}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors.primarySpecialty ? "border-red-300" : "border-gray-300"
        }`}
      >
        <option value="">Select your primary specialty</option>
        {specialties.map((specialty) => (
          <option key={specialty} value={specialty}>
            {specialty}
          </option>
        ))}
      </select>
      {errors.primarySpecialty && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.primarySpecialty.message}
        </p>
      )}
    </div>

    {/* Subspecialties */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Subspecialties (Optional)
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Select any subspecialties that apply
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
        {subspecialties.map((subspecialty) => (
          <label
            key={subspecialty}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-2 rounded transition-colors"
          >
            <input
              type="checkbox"
              checked={watchSubspecialties?.includes(subspecialty)}
              onChange={() => toggleSubspecialty(subspecialty)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">{subspecialty}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Years of Experience */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Years of Medical Experience <span className="text-red-500">*</span>
      </label>
      <select
        {...register("yearsOfExperience", {
          required: "Years of experience is required",
        })}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors.yearsOfExperience ? "border-red-300" : "border-gray-300"
        }`}
      >
        <option value="">Select experience level</option>
        <option value="0">Less than 1 year</option>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((year) => (
          <option key={year} value={year}>
            {year} year{year > 1 ? "s" : ""}
          </option>
        ))}
        <option value="30">30+ years</option>
      </select>
      {errors.yearsOfExperience && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.yearsOfExperience.message}
        </p>
      )}
    </div>
  </div>
);

const Step3 = ({ register, errors }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold text-gray-900">Medical Education</h3>
      <p className="text-gray-600 text-sm">
        Tell us about your medical education background
      </p>
    </div>

    {/* Medical School Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Medical School Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        {...register("medicalSchool.name", {
          required: "Medical school name is required",
          minLength: { value: 2, message: "Minimum 2 characters required" },
        })}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors.medicalSchool?.name ? "border-red-300" : "border-gray-300"
        }`}
        placeholder="e.g., Harvard Medical School"
      />
      {errors.medicalSchool?.name && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.medicalSchool.name.message}
        </p>
      )}
    </div>

    {/* Graduation Year and Location */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Graduation Year <span className="text-red-500">*</span>
        </label>
        <select
          {...register("medicalSchool.graduationYear", {
            required: "Graduation year is required",
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.medicalSchool?.graduationYear
              ? "border-red-300"
              : "border-gray-300"
          }`}
        >
          <option value="">Select year</option>
          {Array.from(
            { length: new Date().getFullYear() - 1949 },
            (_, i) => new Date().getFullYear() - i
          ).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {errors.medicalSchool?.graduationYear && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.medicalSchool.graduationYear.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical School Location (Optional)
        </label>
        <input
          type="text"
          {...register("medicalSchool.location")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Boston, MA"
        />
      </div>
    </div>
  </div>
);

const Step4 = ({
  register,
  errors,
  states,
  languages,
  watchLanguages,
  handleLanguageChange,
  addLanguage,
  removeLanguage,
}) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold text-gray-900">Location & Languages</h3>
      <p className="text-gray-600 text-sm">
        Help us connect you with the right opportunities
      </p>
    </div>

    {/* Current Location */}
    <div>
      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        Current Location
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("location.city", {
              required: "City is required",
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location?.city ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="e.g., New York"
          />
          {errors.location?.city && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.location.city.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State <span className="text-red-500">*</span>
          </label>
          <select
            {...register("location.state", {
              required: "State is required",
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location?.state ? "border-red-300" : "border-gray-300"
            }`}
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {errors.location?.state && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.location.state.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            {...register("location.country")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="United States"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            {...register("location.timezone")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Anchorage">Alaska Time (AKT)</option>
            <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
          </select>
        </div>
      </div>
    </div>

    {/* Languages */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Languages
        </h4>
        <button
          type="button"
          onClick={addLanguage}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Language
        </button>
      </div>

      <div className="space-y-3">
        {watchLanguages?.map((lang, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex-1">
              <select
                value={lang.language}
                onChange={(e) =>
                  handleLanguageChange(index, "language", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Language</option>
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={lang.proficiency}
                onChange={(e) =>
                  handleLanguageChange(index, "proficiency", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="basic">Basic</option>
                <option value="conversational">Conversational</option>
                <option value="fluent">Fluent</option>
                <option value="native">Native</option>
              </select>
            </div>

            {watchLanguages.length > 1 && (
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Step5 = ({ register, errors, watch, getValues }) => {
  const formValues = getValues();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          Complete Your Profile
        </h3>
        <p className="text-gray-600 text-sm">
          Add a professional bio and review your information
        </p>
      </div>

      {/* Professional Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio (Optional)
        </label>
        <textarea
          rows={5}
          {...register("bio", {
            maxLength: {
              value: 2000,
              message: "Bio cannot exceed 2000 characters",
            },
          })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.bio ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Write a brief professional bio highlighting your experience, expertise, and what makes you unique..."
          maxLength={2000}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.bio && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.bio.message}
            </p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {watch("bio")?.length || 0}/2000 characters
          </p>
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Privacy Settings
        </h4>

        <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <select
              {...register("privacy.profileVisibility")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public - Visible to everyone</option>
              <option value="members_only">
                Members Only - Only registered doctors
              </option>
              <option value="private">Private - Only direct contacts</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("privacy.showEmail")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Show email address on profile
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("privacy.showPhone")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Show phone number on profile
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("privacy.allowDirectContact")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Allow other doctors to contact me directly
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("privacy.showLastSeen")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Show when I was last active
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Account Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
          <div>
            <span className="font-medium">Name:</span> Dr.{" "}
            {formValues.firstName} {formValues.lastName}
          </div>
          <div>
            <span className="font-medium">Email:</span> {formValues.email}
          </div>
          <div>
            <span className="font-medium">Role:</span>{" "}
            {formValues.role === "senior" ? "Senior Doctor" : "Junior Doctor"}
          </div>
          <div>
            <span className="font-medium">Specialty:</span>{" "}
            {formValues.primarySpecialty}
          </div>
          <div>
            <span className="font-medium">Experience:</span>{" "}
            {formValues.yearsOfExperience} years
          </div>
          <div>
            <span className="font-medium">Location:</span>{" "}
            {formValues.location.city}, {formValues.location.state}
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
          Professional Agreement
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>By creating an account, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide accurate and truthful medical credentials</li>
            <li>Maintain professional medical standards</li>
            <li>Comply with all applicable medical regulations</li>
            <li>Respect patient confidentiality and HIPAA compliance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;

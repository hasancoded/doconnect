// client/src/pages/Home.js - Modern MVP Design
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import {
  Shield,
  CheckCircle,
  Award,
  Search,
  Users,
  Lock,
  FileCheck,
  Briefcase,
  TrendingUp,
  Star,
  ChevronRight,
  ArrowRight,
  Heart,
  MessageSquare,
  Globe,
} from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Senior Cardiologist",
      content:
        "Doconnect has transformed how I manage my practice. The enhanced profiles and advanced search make finding qualified junior doctors effortless.",
      initials: "SC",
    },
    {
      name: "Dr. Michael Rodriguez",
      role: "Junior Emergency Medicine",
      content:
        "The platform helped me showcase my portfolio and connect with amazing mentors, advancing my career in ways I never imagined.",
      initials: "MR",
    },
    {
      name: "Dr. Emily Thompson",
      role: "Senior Neurologist",
      content:
        "The verification process and professional profiles ensure exceptional quality. Highly recommended for serious medical collaborations.",
      initials: "ET",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified Medical Professionals",
      description:
        "Every doctor is thoroughly verified with medical licenses and credentials through automated and admin workflows",
    },
    {
      icon: FileCheck,
      title: "Enhanced Professional Profiles",
      description:
        "Showcase your portfolio, experience, skills, ratings, and verified documents",
    },
    {
      icon: Search,
      title: "Advanced Doctor Search",
      description:
        "Multi-filter search by specialty, experience, rating, location, and more",
    },
    {
      icon: MessageSquare,
      title: "Seamless Collaboration",
      description:
        "Built-in tools for project management, secure communication, and real-time messaging",
    },
    {
      icon: Briefcase,
      title: "Flexible Opportunities",
      description:
        "Part-time, full-time, and project-based remote medical opportunities",
    },
    {
      icon: Lock,
      title: "HIPAA Compliant",
      description:
        "Enterprise-grade security for all medical communications and data",
    },
  ];

  const statistics = [
    {
      value: "1,000+",
      label: "Verified Doctors",
    },
    {
      value: "500+",
      label: "Successful Collaborations",
    },
    {
      value: "4.8/5",
      label: "Average Rating",
    },
    {
      value: "95%",
      label: "Satisfaction Rate",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Logo size={40} showText={true} />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Testimonials
              </a>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              A Smarter Way for Doctors:
              <span className="block text-blue-600 mt-2">
                Connect, Collaborate, Advance.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The premier marketplace where senior doctors delegate tasks to
              talented junior doctors for remote opportunities. Seniors scale
              their practices, juniors gain experience and income.
            </p>

            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  to="/register?role=senior"
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-lg"
                >
                  I'm a Senior Doctor
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/register?role=junior"
                  className="flex items-center gap-2 px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors text-lg"
                >
                  I'm a Junior Doctor
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">
                  100% Verified Professionals
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">
                  Secure & Confidential
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Value Propositions */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Medical Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're a senior doctor looking to delegate or a junior
              seeking opportunities, our platform has you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Senior Doctors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  For Senior Doctors
                </h3>
                <p className="text-gray-600">
                  Scale your practice with verified junior talent
                </p>
              </div>

              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Advanced search for pre-vetted juniors
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Delegate tasks via detailed job postings
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Focus on complex cases</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Secure, HIPAA-compliant tools
                  </span>
                </li>
              </ul>

              {!isAuthenticated && (
                <Link
                  to="/register?role=senior"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Start Hiring
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Junior Doctors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  For Junior Doctors
                </h3>
                <p className="text-gray-600">
                  Build your career with remote mentorship opportunities
                </p>
              </div>

              <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Showcase your enhanced profile and portfolio
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Search flexible remote opportunities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Earn competitive compensation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Build ratings and network
                  </span>
                </li>
              </ul>

              {!isAuthenticated && (
                <Link
                  to="/register?role=junior"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Find Opportunities
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Doconnect Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start collaborating on our secure platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                For Senior Doctors
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Sign up and get verified with your credentials
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Post detailed job opportunities
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Use advanced search to find matching junior doctors
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    4
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Hire, collaborate securely, and rate the experience
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                For Junior Doctors
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-green-600">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Sign up and build your enhanced professional profile
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-green-600">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Upload documents for verification
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-green-600">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Search and apply to opportunities with your portfolio
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-green-600">
                    4
                  </div>
                  <div>
                    <p className="text-gray-700">
                      Complete projects, earn ratings, and advance your career
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Doconnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The platform built for secure medical freelancing and
              collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join a growing community of medical professionals achieving
              success
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
              >
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Medical Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Hear from doctors transforming their practices and careers
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {testimonials[currentTestimonial].initials}
                </div>
                <blockquote className="text-xl md:text-2xl text-gray-700 mb-4">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="text-gray-900 font-semibold">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-gray-500 text-sm">
                  {testimonials[currentTestimonial].role}
                </div>
              </div>
            </div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial
                      ? "bg-blue-600 w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Medical Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of verified medical professionals building successful
            remote collaborations.
          </p>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg transition-colors"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Logo size={32} showText={true} />
              <p className="text-gray-400 mb-4 max-w-md">
                The premier marketplace connecting senior doctors with talented
                junior doctors for remote medical opportunities.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 Doconnect. All rights reserved. HIPAA Compliant
              Medical Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

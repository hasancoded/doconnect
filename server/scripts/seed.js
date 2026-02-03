// server/scripts/seed.js - Database Seeding Script for DocConnect
const path = require("path");

// Load environment-specific .env file
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", envFile) });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Subscription = require("../models/Subscription");
const Appointment = require("../models/Appointment");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await Subscription.deleteMany({});
    await Appointment.deleteMany({});
    console.log("🗑️  Database cleared");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  }
};

// Seed Users
const seedUsers = async () => {
  try {
    const users = [
      // Admin User
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@doconnect.com",
        password: await bcrypt.hash("Admin@123", 10),
        role: "admin",
        phone: "+1-555-0100",
        medicalLicenseNumber: "ADMIN-001",
        licenseState: "NY",
        primarySpecialty: "Administration",
        yearsOfExperience: 10,
        medicalSchool: {
          name: "Harvard Medical School",
          graduationYear: 2013,
        },
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
      },
      // Senior Doctors
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@doconnect.com",
        password: await bcrypt.hash("Senior@123", 10),
        role: "senior",
        phone: "+1-555-0101",
        medicalLicenseNumber: "MD-NY-12345",
        licenseState: "NY",
        primarySpecialty: "Cardiology",
        subspecialties: ["Interventional Cardiology", "Heart Failure"],
        yearsOfExperience: 15,
        medicalSchool: {
          name: "Johns Hopkins University School of Medicine",
          graduationYear: 2008,
        },
        bio: "Board-certified cardiologist with 15 years of experience in interventional cardiology. Specialized in complex cardiac procedures and heart failure management.",
        location: {
          city: "New York",
          state: "NY",
          country: "United States",
        },
        languages: [
          { language: "English", proficiency: "native" },
          { language: "Spanish", proficiency: "fluent" },
        ],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
        rating: {
          average: 4.8,
          count: 23,
        },
        onlineStatus: {
          status: "online",
          lastSeen: new Date(),
        },
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@doconnect.com",
        password: await bcrypt.hash("Senior@123", 10),
        role: "senior",
        phone: "+1-555-0102",
        medicalLicenseNumber: "MD-CA-67890",
        licenseState: "CA",
        primarySpecialty: "Neurology",
        subspecialties: ["Stroke", "Epilepsy"],
        yearsOfExperience: 12,
        medicalSchool: {
          name: "Stanford University School of Medicine",
          graduationYear: 2011,
        },
        bio: "Experienced neurologist specializing in stroke management and epilepsy treatment. Published researcher with focus on neurological disorders.",
        location: {
          city: "San Francisco",
          state: "CA",
          country: "United States",
        },
        languages: [
          { language: "English", proficiency: "native" },
          { language: "Mandarin", proficiency: "native" },
        ],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
        rating: {
          average: 4.9,
          count: 31,
        },
        onlineStatus: {
          status: "away",
          lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
      },
      {
        firstName: "Emily",
        lastName: "Rodriguez",
        email: "emily.rodriguez@doconnect.com",
        password: await bcrypt.hash("Senior@123", 10),
        role: "senior",
        phone: "+1-555-0103",
        medicalLicenseNumber: "MD-TX-11223",
        licenseState: "TX",
        primarySpecialty: "Pediatrics",
        subspecialties: ["Neonatology", "Pediatric Critical Care"],
        yearsOfExperience: 10,
        medicalSchool: {
          name: "Baylor College of Medicine",
          graduationYear: 2013,
        },
        bio: "Pediatrician with expertise in neonatal care and pediatric critical care. Passionate about improving child health outcomes.",
        location: {
          city: "Houston",
          state: "TX",
          country: "United States",
        },
        languages: [
          { language: "English", proficiency: "native" },
          { language: "Spanish", proficiency: "native" },
        ],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
        rating: {
          average: 4.7,
          count: 18,
        },
        onlineStatus: {
          status: "online",
          lastSeen: new Date(),
        },
      },
      // Junior Doctors
      {
        firstName: "David",
        lastName: "Kim",
        email: "david.kim@doconnect.com",
        password: await bcrypt.hash("Junior@123", 10),
        role: "junior",
        phone: "+1-555-0201",
        medicalLicenseNumber: "MD-MA-33445",
        licenseState: "MA",
        primarySpecialty: "Internal Medicine",
        subspecialties: ["Infectious Disease"],
        yearsOfExperience: 3,
        medicalSchool: {
          name: "Boston University School of Medicine",
          graduationYear: 2020,
        },
        bio: "Recent internal medicine resident looking for opportunities in infectious disease consultation and research.",
        location: {
          city: "Boston",
          state: "MA",
          country: "United States",
        },
        languages: [
          { language: "English", proficiency: "fluent" },
          { language: "Korean", proficiency: "native" },
        ],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "pending",
          overall: "partial",
        },
        job_preferences: {
          seeking_opportunities: true,
          preferred_categories: ["consultation", "research"],
          preferred_specialties: ["Internal Medicine", "Infectious Disease"],
        },
        onlineStatus: {
          status: "online",
          lastSeen: new Date(),
        },
      },
      {
        firstName: "Jessica",
        lastName: "Martinez",
        email: "jessica.martinez@doconnect.com",
        password: await bcrypt.hash("Junior@123", 10),
        role: "junior",
        phone: "+1-555-0202",
        medicalLicenseNumber: "MD-FL-55667",
        licenseState: "FL",
        primarySpecialty: "Emergency Medicine",
        yearsOfExperience: 2,
        medicalSchool: {
          name: "University of Miami Miller School of Medicine",
          graduationYear: 2021,
        },
        bio: "Emergency medicine physician seeking telemedicine and consultation opportunities. Strong clinical skills and excellent communication.",
        location: {
          city: "Miami",
          state: "FL",
          country: "United States",
        },
        languages: [
          { language: "English", proficiency: "native" },
          { language: "Spanish", proficiency: "fluent" },
        ],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
        job_preferences: {
          seeking_opportunities: true,
          preferred_categories: ["telemedicine", "consultation"],
          preferred_specialties: ["Emergency Medicine"],
        },
        onlineStatus: {
          status: "online",
          lastSeen: new Date(),
        },
      },
      {
        firstName: "Alex",
        lastName: "Thompson",
        email: "alex.thompson@doconnect.com",
        password: await bcrypt.hash("Junior@123", 10),
        role: "junior",
        phone: "+1-555-0203",
        medicalLicenseNumber: "MD-WA-77889",
        licenseState: "WA",
        primarySpecialty: "Psychiatry",
        yearsOfExperience: 4,
        medicalSchool: {
          name: "University of Washington School of Medicine",
          graduationYear: 2019,
        },
        bio: "Psychiatrist with interest in telepsychiatry and mental health consultation. Experience in adult and adolescent psychiatry.",
        location: {
          city: "Seattle",
          state: "WA",
          country: "United States",
        },
        languages: [{ language: "English", proficiency: "native" }],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
        job_preferences: {
          seeking_opportunities: true,
          preferred_categories: ["telemedicine", "consultation"],
          preferred_specialties: ["Psychiatry"],
        },
        onlineStatus: {
          status: "away",
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      },
      {
        firstName: "Priya",
        lastName: "Patel",
        email: "priya.patel@doconnect.com",
        password: await bcrypt.hash("Junior@123", 10),
        role: "junior",
        phone: "+1-555-0204",
        medicalLicenseNumber: "MD-IL-99001",
        licenseState: "IL",
        primarySpecialty: "Radiology",
        yearsOfExperience: 3,
        medicalSchool: {
          name: "Northwestern University Feinberg School of Medicine",
          graduationYear: 2020,
        },
        bio: "Radiologist specializing in diagnostic imaging. Seeking remote reading opportunities and consultation work.",
        location: {
          city: "Chicago",
          state: "IL",
          country: "United States",
        },
        languages: [
          { language: "English", proficiency: "fluent" },
          { language: "Hindi", proficiency: "native" },
          { language: "Gujarati", proficiency: "native" },
        ],
        accountStatus: "active",
        verificationStatus: {
          identity: "verified",
          medical_license: "verified",
          background_check: "verified",
          overall: "verified",
        },
        job_preferences: {
          seeking_opportunities: true,
          preferred_categories: ["review", "consultation"],
          preferred_specialties: ["Radiology"],
        },
        onlineStatus: {
          status: "offline",
          lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
};

// Seed Jobs
const seedJobs = async (users) => {
  try {
    const seniorDoctors = users.filter((u) => u.role === "senior");

    const jobs = [
      {
        title: "Cardiology Consultation - Complex Heart Failure Case Review",
        description:
          "Seeking experienced cardiologist to provide second opinion on complex heart failure case. Patient has multiple comorbidities and requires expert guidance on treatment optimization.",
        category: "consultation",
        specialty: "Cardiology",
        subSpecialties: ["Heart Failure", "Interventional Cardiology"],
        skills_required: [
          "Heart Failure Management",
          "Echocardiography",
          "Clinical Assessment",
        ],
        experience_required: {
          minimum_years: 5,
          level: "mid-level",
        },
        budget: {
          type: "fixed",
          amount: 500,
          currency: "USD",
        },
        timeline: {
          estimated_hours: 3,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          start_date: new Date(),
          flexible: true,
        },
        requirements: {
          certifications: ["Board Certified in Cardiology"],
          background_check: true,
          availability: "flexible",
        },
        posted_by: seniorDoctors[0]._id,
        status: "active",
        visibility: "public",
        featured: true,
      },
      {
        title:
          "Neurological Assessment - Stroke Patient Telemedicine Consultation",
        description:
          "Need neurologist for urgent telemedicine consultation regarding acute stroke patient. Requires expertise in stroke management and thrombolytic therapy decision-making.",
        category: "telemedicine",
        specialty: "Neurology",
        subSpecialties: ["Stroke", "Acute Care"],
        skills_required: [
          "Stroke Management",
          "Telemedicine",
          "Emergency Neurology",
        ],
        experience_required: {
          minimum_years: 3,
          level: "mid-level",
        },
        budget: {
          type: "hourly",
          amount: 200,
          currency: "USD",
        },
        timeline: {
          estimated_hours: 2,
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          start_date: new Date(),
          flexible: false,
        },
        requirements: {
          certifications: ["Board Certified in Neurology"],
          background_check: true,
          availability: "immediate",
        },
        posted_by: seniorDoctors[1]._id,
        status: "active",
        visibility: "public",
      },
      {
        title: "Pediatric Case Review - Neonatal ICU Consultation",
        description:
          "Looking for pediatrician with neonatology expertise to review NICU cases and provide guidance on complex neonatal care decisions.",
        category: "consultation",
        specialty: "Pediatrics",
        subSpecialties: ["Neonatology", "Critical Care"],
        skills_required: [
          "Neonatal Care",
          "NICU Management",
          "Ventilator Management",
        ],
        experience_required: {
          minimum_years: 5,
          level: "senior",
        },
        budget: {
          type: "fixed",
          amount: 750,
          currency: "USD",
        },
        timeline: {
          estimated_hours: 5,
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          start_date: new Date(),
          flexible: true,
        },
        requirements: {
          certifications: [
            "Board Certified in Pediatrics",
            "Neonatology Fellowship",
          ],
          background_check: true,
          availability: "flexible",
        },
        posted_by: seniorDoctors[2]._id,
        status: "active",
        visibility: "verified_only",
      },
      {
        title: "Medical Research Collaboration - Infectious Disease Study",
        description:
          "Seeking junior doctors to collaborate on infectious disease research project. Great opportunity for those interested in academic medicine and research.",
        category: "research",
        specialty: "Internal Medicine",
        subSpecialties: ["Infectious Disease"],
        skills_required: [
          "Research Methodology",
          "Data Analysis",
          "Medical Writing",
        ],
        experience_required: {
          minimum_years: 1,
          level: "junior",
        },
        budget: {
          type: "fixed",
          amount: 2000,
          currency: "USD",
        },
        timeline: {
          estimated_hours: 40,
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          start_date: new Date(),
          flexible: true,
        },
        requirements: {
          certifications: [],
          background_check: false,
          availability: "flexible",
        },
        posted_by: seniorDoctors[0]._id,
        status: "active",
        visibility: "public",
        featured: true,
      },
      {
        title: "Radiology Remote Reading - Weekend Coverage",
        description:
          "Need radiologist for weekend remote reading coverage. CT and MRI interpretation required. Flexible hours, work from home.",
        category: "review",
        specialty: "Radiology",
        skills_required: [
          "CT Interpretation",
          "MRI Interpretation",
          "PACS Systems",
        ],
        experience_required: {
          minimum_years: 2,
          level: "mid-level",
        },
        budget: {
          type: "hourly",
          amount: 150,
          currency: "USD",
        },
        timeline: {
          estimated_hours: 16,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          start_date: new Date(),
          flexible: true,
        },
        requirements: {
          certifications: ["Board Certified in Radiology"],
          background_check: true,
          availability: "weekends",
        },
        posted_by: seniorDoctors[1]._id,
        status: "active",
        visibility: "public",
      },
      {
        title: "Psychiatry Telepsychiatry - Ongoing Patient Care",
        description:
          "Seeking psychiatrist for ongoing telepsychiatry services. Adult and adolescent patients. Flexible schedule, excellent opportunity for work-life balance.",
        category: "telemedicine",
        specialty: "Psychiatry",
        skills_required: [
          "Telepsychiatry",
          "Psychotherapy",
          "Medication Management",
        ],
        experience_required: {
          minimum_years: 2,
          level: "mid-level",
        },
        budget: {
          type: "hourly",
          amount: 180,
          currency: "USD",
        },
        timeline: {
          estimated_hours: 80,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          start_date: new Date(),
          flexible: true,
        },
        requirements: {
          certifications: ["Board Certified in Psychiatry"],
          background_check: true,
          availability: "flexible",
        },
        posted_by: seniorDoctors[2]._id,
        status: "active",
        visibility: "public",
      },
    ];

    const createdJobs = await Job.insertMany(jobs);
    console.log(`✅ Created ${createdJobs.length} jobs`);
    return createdJobs;
  } catch (error) {
    console.error("❌ Error seeding jobs:", error);
    throw error;
  }
};

// Seed Applications
const seedApplications = async (users, jobs) => {
  try {
    const juniorDoctors = users.filter((u) => u.role === "junior");

    const applications = [
      {
        job_id: jobs[0]._id, // Cardiology consultation
        applicant_id: juniorDoctors[0]._id, // David Kim
        status: "submitted",
        proposal: {
          cover_letter:
            "I am very interested in this cardiology consultation opportunity. With my background in internal medicine and specific interest in infectious disease, I have experience working with complex patients with multiple comorbidities. I would be honored to provide a thorough review of this case.",
          approach:
            "I will conduct a comprehensive review of the patient's medical records, imaging studies, and current treatment plan. I will provide a detailed written consultation with evidence-based recommendations.",
          timeline_days: 5,
          proposed_budget: 500,
          availability: {
            start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            hours_per_week: 10,
          },
        },
      },
      {
        job_id: jobs[1]._id, // Neurology telemedicine
        applicant_id: juniorDoctors[1]._id, // Jessica Martinez
        status: "under_review",
        proposal: {
          cover_letter:
            "As an emergency medicine physician, I have extensive experience with acute neurological emergencies including stroke. I am available immediately for this urgent consultation and have telemedicine experience.",
          approach:
            "I will join via telemedicine within 2 hours of acceptance. I will perform a thorough neurological assessment via video and provide immediate recommendations regarding thrombolytic therapy and further management.",
          timeline_days: 1,
          proposed_budget: 400,
          availability: {
            start_date: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
            hours_per_week: 20,
          },
        },
      },
      {
        job_id: jobs[3]._id, // Research collaboration
        applicant_id: juniorDoctors[0]._id, // David Kim
        status: "accepted",
        proposal: {
          cover_letter:
            "I am extremely interested in this infectious disease research opportunity. As someone with a strong interest in infectious disease, this aligns perfectly with my career goals. I have research experience from medical school and am eager to contribute.",
          approach:
            "I will dedicate 10-15 hours per week to literature review, data collection, and manuscript preparation. I am proficient in statistical analysis and medical writing.",
          timeline_days: 60,
          proposed_budget: 2000,
          availability: {
            start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            hours_per_week: 12,
          },
        },
        accepted_at: new Date(),
      },
      {
        job_id: jobs[4]._id, // Radiology remote reading
        applicant_id: juniorDoctors[3]._id, // Priya Patel
        status: "submitted",
        proposal: {
          cover_letter:
            "I am a radiologist seeking weekend remote reading opportunities. I have 3 years of experience in diagnostic radiology with expertise in CT and MRI interpretation. I am comfortable with all major PACS systems.",
          approach:
            "I will provide timely and accurate interpretations of CT and MRI studies during weekend hours. I can commit to 8 hours per day on Saturdays and Sundays with quick turnaround times.",
          timeline_days: 14,
          proposed_budget: 2400,
          availability: {
            start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            hours_per_week: 16,
          },
        },
      },
      {
        job_id: jobs[5]._id, // Telepsychiatry
        applicant_id: juniorDoctors[2]._id, // Alex Thompson
        status: "shortlisted",
        proposal: {
          cover_letter:
            "I am a board-certified psychiatrist with 4 years of experience in both adult and adolescent psychiatry. I have been providing telepsychiatry services for the past 2 years and am very comfortable with this modality of care.",
          approach:
            "I will provide comprehensive psychiatric evaluations, ongoing medication management, and supportive psychotherapy via secure video platform. I can accommodate flexible scheduling and am available for both routine and urgent consultations.",
          timeline_days: 90,
          proposed_budget: 14400,
          availability: {
            start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            hours_per_week: 20,
          },
        },
      },
    ];

    const createdApplications = await Application.insertMany(applications);
    console.log(`✅ Created ${createdApplications.length} applications`);
    return createdApplications;
  } catch (error) {
    console.error("❌ Error seeding applications:", error);
    throw error;
  }
};

// Seed Conversations and Messages
const seedConversationsAndMessages = async (users) => {
  try {
    const seniorDoctors = users.filter((u) => u.role === "senior");
    const juniorDoctors = users.filter((u) => u.role === "junior");

    // Conversation 1: Sarah Johnson (Senior) <-> David Kim (Junior)
    const conversation1 = await Conversation.create({
      participants: [seniorDoctors[0]._id, juniorDoctors[0]._id],
      lastMessage: {
        content:
          "Thank you for your interest in the cardiology consultation. Your background looks impressive!",
        sender: seniorDoctors[0]._id,
        timestamp: new Date(),
      },
      unreadCount: {
        [juniorDoctors[0]._id]: 1,
      },
    });

    await Message.insertMany([
      {
        conversationId: conversation1._id,
        sender: juniorDoctors[0]._id,
        recipient: seniorDoctors[0]._id,
        content:
          "Hello Dr. Johnson, I just submitted my application for the cardiology consultation position. I would love to discuss this opportunity further.",
        messageType: "text",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        conversationId: conversation1._id,
        sender: seniorDoctors[0]._id,
        recipient: juniorDoctors[0]._id,
        content:
          "Thank you for your interest in the cardiology consultation. Your background looks impressive!",
        messageType: "text",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
    ]);

    // Conversation 2: Michael Chen (Senior) <-> Jessica Martinez (Junior)
    const conversation2 = await Conversation.create({
      participants: [seniorDoctors[1]._id, juniorDoctors[1]._id],
      lastMessage: {
        content:
          "I can be available for the telemedicine consultation within the next hour.",
        sender: juniorDoctors[1]._id,
        timestamp: new Date(),
      },
      unreadCount: {
        [seniorDoctors[1]._id]: 2,
      },
    });

    await Message.insertMany([
      {
        conversationId: conversation2._id,
        sender: seniorDoctors[1]._id,
        recipient: juniorDoctors[1]._id,
        content:
          "Hi Dr. Martinez, I saw your application for the stroke consultation. This is quite urgent. When would you be available?",
        messageType: "text",
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        readAt: new Date(Date.now() - 25 * 60 * 1000),
      },
      {
        conversationId: conversation2._id,
        sender: juniorDoctors[1]._id,
        recipient: seniorDoctors[1]._id,
        content:
          "I can be available for the telemedicine consultation within the next hour.",
        messageType: "text",
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      },
      {
        conversationId: conversation2._id,
        sender: juniorDoctors[1]._id,
        recipient: seniorDoctors[1]._id,
        content:
          "I have reviewed similar cases and am confident I can provide valuable input.",
        messageType: "text",
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
    ]);

    // Conversation 3: Emily Rodriguez (Senior) <-> Alex Thompson (Junior)
    const conversation3 = await Conversation.create({
      participants: [seniorDoctors[2]._id, juniorDoctors[2]._id],
      lastMessage: {
        content: "That sounds perfect. I look forward to working with you!",
        sender: juniorDoctors[2]._id,
        timestamp: new Date(),
      },
    });

    await Message.insertMany([
      {
        conversationId: conversation3._id,
        sender: seniorDoctors[2]._id,
        recipient: juniorDoctors[2]._id,
        content:
          "Hello Dr. Thompson, I reviewed your application for the telepsychiatry position. Your experience looks great!",
        messageType: "text",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      },
      {
        conversationId: conversation3._id,
        sender: juniorDoctors[2]._id,
        recipient: seniorDoctors[2]._id,
        content: "Thank you so much! I am very interested in this opportunity.",
        messageType: "text",
        createdAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ),
        readAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
      },
      {
        conversationId: conversation3._id,
        sender: seniorDoctors[2]._id,
        recipient: juniorDoctors[2]._id,
        content:
          "Would you be available for a video call next week to discuss the details?",
        messageType: "text",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      },
      {
        conversationId: conversation3._id,
        sender: juniorDoctors[2]._id,
        recipient: seniorDoctors[2]._id,
        content: "That sounds perfect. I look forward to working with you!",
        messageType: "text",
        createdAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ),
        readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log("✅ Created 3 conversations with messages");
  } catch (error) {
    console.error("❌ Error seeding conversations:", error);
    throw error;
  }
};

// Seed Notifications
const seedNotifications = async (users) => {
  try {
    const juniorDoctors = users.filter((u) => u.role === "junior");
    const seniorDoctors = users.filter((u) => u.role === "senior");

    const notifications = [
      // For Junior Doctors - David Kim
      {
        recipient: juniorDoctors[0]._id,
        type: "job_match",
        title: "New Job Match",
        message:
          "A new job posting matches your preferences: Cardiology Consultation",
        priority: "medium",
        read: false,
      },
      {
        recipient: juniorDoctors[0]._id,
        type: "application_status",
        title: "Application Accepted",
        message:
          'Your application for "Medical Research Collaboration" has been accepted!',
        priority: "high",
        read: false,
      },
      {
        recipient: juniorDoctors[0]._id,
        type: "new_message",
        title: "New Message",
        message: "Dr. Sarah Johnson sent you a message",
        priority: "high",
        read: false,
      },
      // For Junior Doctors - Jessica Martinez
      {
        recipient: juniorDoctors[1]._id,
        type: "new_message",
        title: "New Messages",
        message: "Dr. Michael Chen sent you 2 messages",
        priority: "high",
        read: false,
      },
      {
        recipient: juniorDoctors[1]._id,
        type: "job_match",
        title: "Urgent Job Match",
        message: "Urgent opportunity: Neurological Assessment - Stroke Patient",
        priority: "high",
        read: true,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      // For Junior Doctors - Alex Thompson
      {
        recipient: juniorDoctors[2]._id,
        type: "application_status",
        title: "Application Shortlisted",
        message:
          'You have been shortlisted for "Psychiatry Telepsychiatry" position',
        priority: "high",
        read: true,
        readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        recipient: juniorDoctors[2]._id,
        type: "new_message",
        title: "New Message",
        message: "Dr. Emily Rodriguez sent you a message",
        priority: "medium",
        read: false,
      },
      // For Junior Doctors - Priya Patel
      {
        recipient: juniorDoctors[3]._id,
        type: "job_match",
        title: "Perfect Match",
        message: "New radiology opportunity matches your skills perfectly!",
        priority: "medium",
        read: false,
      },
      {
        recipient: juniorDoctors[3]._id,
        type: "system_announcement",
        title: "Profile Complete",
        message: "Congratulations! Your profile is 100% complete",
        priority: "low",
        read: true,
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      // For Senior Doctors - Sarah Johnson
      {
        recipient: seniorDoctors[0]._id,
        type: "job_application",
        title: "New Application Received",
        message:
          "Dr. David Kim applied for your job posting: Cardiology Consultation",
        priority: "high",
        read: false,
      },
      {
        recipient: seniorDoctors[0]._id,
        type: "new_message",
        title: "New Message",
        message: "Dr. David Kim sent you a message",
        priority: "medium",
        read: false,
      },
      {
        recipient: seniorDoctors[0]._id,
        type: "system_announcement",
        title: "Job Posting Expiring Soon",
        message: 'Your job "Medical Research Collaboration" expires in 3 days',
        priority: "medium",
        read: false,
      },
      // For Senior Doctors - Michael Chen
      {
        recipient: seniorDoctors[1]._id,
        type: "new_message",
        title: "New Messages",
        message: "You have 2 unread messages from Dr. Jessica Martinez",
        priority: "medium",
        read: false,
      },
      {
        recipient: seniorDoctors[1]._id,
        type: "job_application",
        title: "Application Received",
        message: "Dr. Jessica Martinez applied for: Neurological Assessment",
        priority: "high",
        read: true,
        readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        recipient: seniorDoctors[1]._id,
        type: "system_announcement",
        title: "Weekly Summary",
        message: "You received 5 applications this week",
        priority: "low",
        read: true,
        readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      // For Senior Doctors - Emily Rodriguez
      {
        recipient: seniorDoctors[2]._id,
        type: "job_application",
        title: "New Application Received",
        message:
          "Dr. Alex Thompson applied for your job posting: Psychiatry Telepsychiatry",
        priority: "high",
        read: true,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        recipient: seniorDoctors[2]._id,
        type: "new_message",
        title: "New Message",
        message: "Dr. Alex Thompson sent you a message",
        priority: "medium",
        read: false,
      },
      {
        recipient: seniorDoctors[2]._id,
        type: "system_announcement",
        title: "Profile Views",
        message: "Your profile was viewed 15 times this week",
        priority: "low",
        read: false,
      },
    ];

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Created ${createdNotifications.length} notifications`);
  } catch (error) {
    console.error("❌ Error seeding notifications:", error);
    throw error;
  }
};

// Seed Appointments
const seedAppointments = async (users, applications) => {
  try {
    const seniorDoctors = users.filter((u) => u.role === "senior");
    const juniorDoctors = users.filter((u) => u.role === "junior");

    const appointments = [
      // Pending appointment - For shortlisted application (Alex Thompson)
      {
        doctorInitiator: seniorDoctors[2]._id, // Emily Rodriguez
        doctorInvitee: juniorDoctors[2]._id, // Alex Thompson
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endTime: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ), // 1 hour duration
        duration: 60,
        timezone: "America/New_York",
        purpose: "Interview for Telepsychiatry Position",
        notes:
          "Please prepare to discuss your experience with telepsychiatry and patient management.",
        status: "pending",
        meetingProvider: "zoom",
        conversationId: null, // Will be linked when conversation is created
      },
      // Confirmed appointment - With Zoom link
      {
        doctorInitiator: seniorDoctors[0]._id, // Sarah Johnson
        doctorInvitee: juniorDoctors[0]._id, // David Kim
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000
        ), // 45 min duration
        duration: 45,
        timezone: "America/New_York",
        purpose: "Research Collaboration Discussion",
        notes:
          "Let's discuss the infectious disease research project timeline and your role.",
        status: "confirmed",
        meetingProvider: "zoom",
        meetingId: "seed_meeting_123456",
        meetingJoinUrl: "https://zoom.us/j/123456789?pwd=example",
        meetingPassword: "research2024",
        conversationId: null,
      },
      // Another confirmed appointment - Upcoming soon
      {
        doctorInitiator: seniorDoctors[1]._id, // Michael Chen
        doctorInvitee: juniorDoctors[1]._id, // Jessica Martinez
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min duration
        duration: 30,
        timezone: "America/Los_Angeles",
        purpose: "Stroke Case Review",
        notes: "Quick consultation on the acute stroke patient case.",
        status: "confirmed",
        meetingProvider: "zoom",
        meetingId: "seed_meeting_789012",
        meetingJoinUrl: "https://zoom.us/j/789012345?pwd=example2",
        meetingPassword: "stroke2024",
        conversationId: null,
      },
      // Completed appointment - Past
      {
        doctorInitiator: seniorDoctors[2]._id, // Emily Rodriguez
        doctorInvitee: juniorDoctors[3]._id, // Priya Patel
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endTime: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ),
        duration: 60,
        timezone: "America/Chicago",
        purpose: "Radiology Consultation",
        notes: "Review of complex imaging cases.",
        status: "completed",
        meetingProvider: "zoom",
        meetingId: "seed_meeting_345678",
        meetingJoinUrl: "https://zoom.us/j/345678901?pwd=example3",
        meetingPassword: "radiology2024",
        conversationId: null,
      },
      // Cancelled appointment
      {
        doctorInitiator: seniorDoctors[0]._id, // Sarah Johnson
        doctorInvitee: juniorDoctors[1]._id, // Jessica Martinez
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endTime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
        ),
        duration: 30,
        timezone: "America/New_York",
        purpose: "Cardiology Consultation",
        notes: "Initial consultation cancelled due to scheduling conflict.",
        status: "cancelled",
        meetingProvider: "zoom",
        cancellationReason: "Scheduling conflict - will reschedule",
        cancelledBy: seniorDoctors[0]._id,
        cancelledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        conversationId: null,
      },
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`✅ Created ${createdAppointments.length} appointments`);

    // Log appointment distribution
    const pending = createdAppointments.filter(
      (a) => a.status === "pending"
    ).length;
    const confirmed = createdAppointments.filter(
      (a) => a.status === "confirmed"
    ).length;
    const completed = createdAppointments.filter(
      (a) => a.status === "completed"
    ).length;
    const cancelled = createdAppointments.filter(
      (a) => a.status === "cancelled"
    ).length;
    console.log(
      `   - Pending: ${pending}, Confirmed: ${confirmed}, Completed: ${completed}, Cancelled: ${cancelled}`
    );

    return createdAppointments;
  } catch (error) {
    console.error("❌ Error seeding appointments:", error);
    throw error;
  }
};

// Seed Subscriptions
const seedSubscriptions = async (users) => {
  try {
    const subscriptions = [];

    // Plan configurations
    const planConfigs = {
      free: {
        planName: "Free Tier",
        planPrice: 0,
        features: {
          unlimitedApplications: false,
          advancedSearch: false,
          featuredJobPostings: false,
          directMessaging: false,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          apiAccess: false,
          bulkOperations: false,
          scheduledPosting: false,
        },
        usage: {
          jobApplications: { limit: 5, used: 0 },
          profileViews: { limit: 50, used: 0 },
          jobPostings: { limit: 3, used: 0 },
          messageThreads: { limit: 10, used: 0 },
          bulkOperations: { limit: 0, used: 0 },
        },
      },
      basic: {
        planName: "Basic Plan",
        planPrice: 1900,
        features: {
          unlimitedApplications: true,
          advancedSearch: true,
          featuredJobPostings: false,
          directMessaging: true,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          apiAccess: false,
          bulkOperations: false,
          scheduledPosting: false,
        },
        usage: {
          jobApplications: { limit: null, used: 0 },
          profileViews: { limit: 500, used: 0 },
          jobPostings: { limit: 20, used: 0 },
          messageThreads: { limit: 50, used: 0 },
          bulkOperations: { limit: 5, used: 0 },
        },
      },
      professional: {
        planName: "Professional Plan",
        planPrice: 3900,
        features: {
          unlimitedApplications: true,
          advancedSearch: true,
          featuredJobPostings: true,
          directMessaging: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: false,
          apiAccess: false,
          bulkOperations: true,
          scheduledPosting: true,
        },
        usage: {
          jobApplications: { limit: null, used: 0 },
          profileViews: { limit: null, used: 0 },
          jobPostings: { limit: 50, used: 0 },
          messageThreads: { limit: 200, used: 0 },
          bulkOperations: { limit: 50, used: 0 },
        },
      },
    };

    // Assign plans to users
    for (const user of users) {
      let planId;

      // Admin gets professional plan
      if (user.role === "admin") {
        planId = "professional";
      }
      // First 2 senior doctors get basic plan
      else if (
        user.role === "senior" &&
        subscriptions.filter((s) => s.planId === "basic").length < 2
      ) {
        planId = "basic";
      }
      // Last senior doctor gets professional plan
      else if (user.role === "senior") {
        planId = "professional";
      }
      // All junior doctors get free plan
      else {
        planId = "free";
      }

      const config = planConfigs[planId];

      subscriptions.push({
        userId: user._id,
        stripeCustomerId: `seed_${user._id}`,
        planId,
        planName: config.planName,
        planPrice: config.planPrice,
        status: planId === "free" ? "free" : "active",
        billingEmail: user.email,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: config.features,
        usage: config.usage,
        invoices: [],
      });
    }

    const createdSubscriptions = await Subscription.insertMany(subscriptions);
    console.log(`✅ Created ${createdSubscriptions.length} subscriptions`);

    // Log subscription distribution
    const freeSubs = createdSubscriptions.filter(
      (s) => s.planId === "free"
    ).length;
    const basicSubs = createdSubscriptions.filter(
      (s) => s.planId === "basic"
    ).length;
    const proSubs = createdSubscriptions.filter(
      (s) => s.planId === "professional"
    ).length;
    console.log(
      `   - Free: ${freeSubs}, Basic: ${basicSubs}, Professional: ${proSubs}`
    );

    return createdSubscriptions;
  } catch (error) {
    console.error("❌ Error seeding subscriptions:", error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...\n");

    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    await seedSubscriptions(users);
    const jobs = await seedJobs(users);
    const applications = await seedApplications(users, jobs);
    await seedConversationsAndMessages(users);
    await seedNotifications(users);
    await seedAppointments(users, applications);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:");
    console.log("  Email: admin@doconnect.com");
    console.log("  Password: Admin@123");
    console.log("\nSenior Doctors:");
    console.log("  1. sarah.johnson@doconnect.com / Senior@123");
    console.log("  2. michael.chen@doconnect.com / Senior@123");
    console.log("  3. emily.rodriguez@doconnect.com / Senior@123");
    console.log("\nJunior Doctors:");
    console.log("  1. david.kim@doconnect.com / Junior@123");
    console.log("  2. jessica.martinez@doconnect.com / Junior@123");
    console.log("  3. alex.thompson@doconnect.com / Junior@123");
    console.log("  4. priya.patel@doconnect.com / Junior@123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();

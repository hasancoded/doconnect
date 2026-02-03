// server/controllers/matchingController.js - Smart Job Matching Algorithm
const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");

// @desc    Calculate job match score for a specific user and job
// @route   POST /api/matching/calculate/:jobId
// @access  Private (Junior doctors only)
exports.calculateJobMatch = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Job matching is only available for junior doctors",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const matchScore = await calculateMatchScore(req.user.id, jobId);

    res.status(200).json({
      success: true,
      data: {
        jobId,
        userId: req.user.id,
        matchScore,
        matchLevel: getMatchLevel(matchScore),
        breakdown: await getMatchBreakdown(req.user.id, jobId),
      },
    });
  } catch (error) {
    console.error("Error calculating job match:", error);
    res.status(500).json({
      success: false,
      message: "Server error while calculating match",
    });
  }
};

// @desc    Get personalized job recommendations
// @route   GET /api/matching/recommendations
// @access  Private (Junior doctors only)
exports.getJobRecommendations = async (req, res) => {
  try {
    const { limit = 10, minScore = 50 } = req.query;

    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Job recommendations are only available for junior doctors",
      });
    }

    // Get active jobs
    const activeJobs = await Job.find({
      status: "active",
      "timeline.deadline": { $gt: new Date() },
    })
      .populate("posted_by", "firstName lastName profilePhoto rating")
      .lean();

    // Calculate match scores for all jobs
    const jobsWithScores = [];

    for (const job of activeJobs) {
      // Skip if user already applied
      const existingApplication = await Application.findOne({
        job_id: job._id,
        applicant_id: req.user.id,
      });

      if (existingApplication) continue;

      const matchScore = await calculateMatchScore(req.user.id, job._id);

      if (matchScore >= parseInt(minScore)) {
        jobsWithScores.push({
          ...job,
          matchScore,
          matchLevel: getMatchLevel(matchScore),
        });
      }
    }

    // Sort by match score and limit results
    const recommendations = jobsWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} job recommendations`,
    });
  } catch (error) {
    console.error("Error getting job recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting recommendations",
    });
  }
};

// @desc    Get candidate recommendations for a job
// @route   GET /api/matching/candidates/:jobId
// @access  Private (Senior doctors only)
exports.getCandidateRecommendations = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 20, minScore = 60 } = req.query;

    if (req.user.role !== "senior") {
      return res.status(403).json({
        success: false,
        message:
          "Candidate recommendations are only available for senior doctors",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view candidates for this job",
      });
    }

    // Find qualified junior doctors
    const juniorDoctors = await User.find({
      role: "junior",
      accountStatus: "active",
      "job_preferences.seeking_opportunities": true,
    })
      .select(
        "firstName lastName profilePhoto rating verificationStatus primarySpecialty yearsOfExperience skills location"
      )
      .lean();

    // Calculate match scores for all candidates
    const candidatesWithScores = [];

    for (const candidate of juniorDoctors) {
      // Skip if candidate already applied
      const existingApplication = await Application.findOne({
        job_id: jobId,
        applicant_id: candidate._id,
      });

      if (existingApplication) continue;

      const matchScore = await calculateMatchScore(candidate._id, jobId);

      if (matchScore >= parseInt(minScore)) {
        candidatesWithScores.push({
          ...candidate,
          matchScore,
          matchLevel: getMatchLevel(matchScore),
        });
      }
    }

    // Sort by match score and limit results
    const recommendations = candidatesWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: recommendations,
      message: `Found ${recommendations.length} candidate recommendations`,
    });
  } catch (error) {
    console.error("Error getting candidate recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting candidate recommendations",
    });
  }
};

// @desc    Get match analytics for a job
// @route   GET /api/matching/analytics/:jobId
// @access  Private (Job owner only)
exports.getMatchAnalytics = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view analytics for this job",
      });
    }

    // Get applications with match scores
    const applications = await Application.find({ job_id: jobId })
      .populate(
        "applicant_id",
        "firstName lastName primarySpecialty yearsOfExperience"
      )
      .select("match_score status createdAt")
      .lean();

    // Calculate analytics
    const analytics = {
      totalApplications: applications.length,
      averageMatchScore:
        applications.length > 0
          ? applications.reduce((sum, app) => sum + (app.match_score || 0), 0) /
            applications.length
          : 0,
      matchScoreDistribution: {
        excellent: applications.filter((app) => app.match_score >= 80).length,
        good: applications.filter(
          (app) => app.match_score >= 60 && app.match_score < 80
        ).length,
        fair: applications.filter(
          (app) => app.match_score >= 40 && app.match_score < 60
        ).length,
        poor: applications.filter((app) => app.match_score < 40).length,
      },
      statusBreakdown: applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}),
      topMatches: applications
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 5)
        .map((app) => ({
          applicantId: app.applicant_id._id,
          name: `${app.applicant_id.firstName} ${app.applicant_id.lastName}`,
          specialty: app.applicant_id.primarySpecialty,
          experience: app.applicant_id.yearsOfExperience,
          matchScore: app.match_score,
          status: app.status,
        })),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error getting match analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting match analytics",
    });
  }
};

// @desc    Bulk calculate matches for multiple jobs
// @route   POST /api/matching/bulk-calculate
// @access  Private (Junior doctors only)
exports.bulkCalculateMatches = async (req, res) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Job IDs array is required",
      });
    }

    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Bulk matching is only available for junior doctors",
      });
    }

    const matches = [];

    for (const jobId of jobIds.slice(0, 20)) {
      // Limit to 20 jobs to prevent abuse
      try {
        const job = await Job.findById(jobId);
        if (job && job.status === "active") {
          const matchScore = await calculateMatchScore(req.user.id, jobId);
          matches.push({
            jobId,
            matchScore,
            matchLevel: getMatchLevel(matchScore),
          });
        }
      } catch (error) {
        console.error(`Error calculating match for job ${jobId}:`, error);
        matches.push({
          jobId,
          matchScore: 0,
          matchLevel: "poor",
          error: "Calculation failed",
        });
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      data: matches,
      message: `Calculated matches for ${matches.length} jobs`,
    });
  } catch (error) {
    console.error("Error bulk calculating matches:", error);
    res.status(500).json({
      success: false,
      message: "Server error while bulk calculating matches",
    });
  }
};

// Helper function to calculate match score between user and job
async function calculateMatchScore(userId, jobId) {
  try {
    const user = await User.findById(userId);
    const job = await Job.findById(jobId);

    if (!user || !job) return 0;

    let score = 0;

    // Medical specialty alignment (40% weight)
    if (user.primarySpecialty.toLowerCase() === job.specialty.toLowerCase()) {
      score += 40;
    } else if (
      user.subspecialties &&
      user.subspecialties.some(
        (sub) =>
          sub.toLowerCase().includes(job.specialty.toLowerCase()) ||
          job.specialty.toLowerCase().includes(sub.toLowerCase())
      )
    ) {
      score += 25;
    } else if (
      job.subSpecialties &&
      job.subSpecialties.some(
        (sub) =>
          sub.toLowerCase().includes(user.primarySpecialty.toLowerCase()) ||
          user.primarySpecialty.toLowerCase().includes(sub.toLowerCase())
      )
    ) {
      score += 20;
    }

    // Experience level match (25% weight)
    const experienceLevels = {
      resident: 1,
      junior: 2,
      "mid-level": 3,
      senior: 4,
      attending: 5,
    };

    const getUserLevel = (years) => {
      if (years < 2) return "resident";
      if (years < 5) return "junior";
      if (years < 10) return "mid-level";
      if (years < 20) return "senior";
      return "attending";
    };

    const userLevel = getUserLevel(user.yearsOfExperience);
    const requiredLevel = job.experience_required.level;
    const userScore = experienceLevels[userLevel] || 1;
    const requiredScore = experienceLevels[requiredLevel] || 1;

    if (userScore >= requiredScore) {
      score += 25;
    } else if (userScore === requiredScore - 1) {
      score += 15;
    } else if (userScore === requiredScore - 2) {
      score += 5;
    }

    // Skills overlap (20% weight)
    if (
      job.skills_required &&
      job.skills_required.length > 0 &&
      user.skills &&
      user.skills.length > 0
    ) {
      const jobSkills = job.skills_required.map((skill) => skill.toLowerCase());
      const userSkills = user.skills.map((skill) => skill.name.toLowerCase());
      const matchingSkills = jobSkills.filter((skill) =>
        userSkills.some(
          (userSkill) =>
            userSkill.includes(skill) ||
            skill.includes(userSkill) ||
            levenshteinDistance(userSkill, skill) <= 2
        )
      );
      const skillsScore = Math.min(
        20,
        (matchingSkills.length / jobSkills.length) * 20
      );
      score += skillsScore;
    } else {
      score += 10; // Default partial score if no specific skills required
    }

    // Years of experience requirement (10% weight)
    if (user.yearsOfExperience >= job.experience_required.minimum_years) {
      score += 10;
    } else {
      const experienceRatio = Math.min(
        1,
        user.yearsOfExperience / job.experience_required.minimum_years
      );
      score += experienceRatio * 10;
    }

    // Location and remote work preference (5% weight)
    if (job.requirements.location_preference === "remote") {
      if (
        user.job_preferences?.remote_work_preference === "remote_only" ||
        user.job_preferences?.remote_work_preference === "flexible"
      ) {
        score += 5;
      } else {
        score += 2;
      }
    } else if (job.requirements.location_preference === "hybrid") {
      if (user.job_preferences?.remote_work_preference !== "onsite_only") {
        score += 4;
      }
    } else {
      // Onsite work
      if (user.location?.city && job.posted_by) {
        // This would require fetching job poster's location
        score += 3; // Default partial score
      }
    }

    // Bonus factors (can push score above 100)
    let bonus = 0;

    // User verification status
    if (user.verificationStatus?.overall === "verified") {
      bonus += 5;
    }

    // High user rating
    if (user.rating?.average >= 4.5) {
      bonus += 3;
    } else if (user.rating?.average >= 4.0) {
      bonus += 2;
    }

    // Job preferences alignment
    if (
      user.job_preferences?.preferred_categories &&
      user.job_preferences.preferred_categories.includes(job.category)
    ) {
      bonus += 5;
    }

    // Budget alignment
    if (user.job_preferences?.preferred_budget_range) {
      const { min, max } = user.job_preferences.preferred_budget_range;
      if (job.budget.amount) {
        if (
          (!min || job.budget.amount >= min) &&
          (!max || job.budget.amount <= max)
        ) {
          bonus += 3;
        }
      }
    }

    // Apply bonus but cap at 100
    score = Math.min(100, Math.max(0, Math.round(score + bonus)));

    return score;
  } catch (error) {
    console.error("Error calculating match score:", error);
    return 0;
  }
}

// Helper function to get match level description
function getMatchLevel(score) {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

// Helper function to get detailed match breakdown
async function getMatchBreakdown(userId, jobId) {
  try {
    const user = await User.findById(userId);
    const job = await Job.findById(jobId);

    if (!user || !job) return {};

    const breakdown = {
      specialty: {
        weight: 40,
        score: 0,
        details: "",
      },
      experience: {
        weight: 25,
        score: 0,
        details: "",
      },
      skills: {
        weight: 20,
        score: 0,
        details: "",
      },
      requirements: {
        weight: 10,
        score: 0,
        details: "",
      },
      location: {
        weight: 5,
        score: 0,
        details: "",
      },
    };

    // Specialty breakdown
    if (user.primarySpecialty.toLowerCase() === job.specialty.toLowerCase()) {
      breakdown.specialty.score = 40;
      breakdown.specialty.details = "Perfect specialty match";
    } else if (
      user.subspecialties &&
      user.subspecialties.some((sub) =>
        sub.toLowerCase().includes(job.specialty.toLowerCase())
      )
    ) {
      breakdown.specialty.score = 25;
      breakdown.specialty.details = "Subspecialty match";
    } else {
      breakdown.specialty.details = "No specialty match";
    }

    // Experience breakdown
    const userYears = user.yearsOfExperience;
    const requiredYears = job.experience_required.minimum_years;

    if (userYears >= requiredYears) {
      breakdown.experience.score = 25;
      breakdown.experience.details = `${userYears} years (meets ${requiredYears} requirement)`;
    } else {
      const ratio = userYears / requiredYears;
      breakdown.experience.score = Math.round(ratio * 25);
      breakdown.experience.details = `${userYears} years (needs ${requiredYears})`;
    }

    // Skills breakdown
    if (job.skills_required && job.skills_required.length > 0 && user.skills) {
      const jobSkills = job.skills_required.map((skill) => skill.toLowerCase());
      const userSkills = user.skills.map((skill) => skill.name.toLowerCase());
      const matchingSkills = jobSkills.filter((skill) =>
        userSkills.some(
          (userSkill) => userSkill.includes(skill) || skill.includes(userSkill)
        )
      );

      breakdown.skills.score = Math.round(
        (matchingSkills.length / jobSkills.length) * 20
      );
      breakdown.skills.details = `${matchingSkills.length}/${jobSkills.length} skills match`;
    } else {
      breakdown.skills.score = 10;
      breakdown.skills.details = "No specific skills required";
    }

    return breakdown;
  } catch (error) {
    console.error("Error getting match breakdown:", error);
    return {};
  }
}

// Helper function for string similarity (Levenshtein distance)
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

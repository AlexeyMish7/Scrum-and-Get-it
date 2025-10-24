import React from "react";

interface ProfileData {
  employmentCount: number;
  skillsCount: number;
  educationCount: number;
  projectsCount: number;
}

interface ProfileCompletionProps {
  profile: ProfileData;
}

const REQUIRED_COUNTS = {
  employment: 2,
  skills: 5,
  education: 1,
  projects: 3,
};

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ profile }) => {
  // Calculate completeness per section (0-1)
  const employmentComplete = Math.min(profile.employmentCount / REQUIRED_COUNTS.employment, 1);
  const skillsComplete = Math.min(profile.skillsCount / REQUIRED_COUNTS.skills, 1);
  const educationComplete = Math.min(profile.educationCount / REQUIRED_COUNTS.education, 1);
  const projectsComplete = Math.min(profile.projectsCount / REQUIRED_COUNTS.projects, 1);

  // Overall percentage (weighted equally)
  const completionPercentage =
    ((employmentComplete + skillsComplete + educationComplete + projectsComplete) / 4) * 100;

  // Suggestions
  const suggestions: string[] = [];
  if (employmentComplete < 1) suggestions.push("Add more employment history");
  if (skillsComplete < 1) suggestions.push("Add more skills");
  if (educationComplete < 1) suggestions.push("Add more education details");
  if (projectsComplete < 1) suggestions.push("Add more projects");

  // Determine color
  let color = "#e74c3c"; // weak
  if (completionPercentage >= 70) color = "#2ecc71"; // strong
  else if (completionPercentage >= 40) color = "#f1c40f"; // moderate

  return (
    <div
      style={{
        margin: "2rem 0",
        padding: "1rem",
        border: `1px solid ${color}`,
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      <h2 style={{ marginBottom: "1rem" }}>
        Profile Completion: <span style={{ color }}>{completionPercentage.toFixed(0)}%</span>
      </h2>

      <div
        style={{
          backgroundColor: "#eee",
          height: "10px",
          borderRadius: "5px",
          overflow: "hidden",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${completionPercentage}%`,
            backgroundColor: color,
            transition: "width 0.5s ease",
          }}
        ></div>
      </div>

      {suggestions.length > 0 ? (
        <>
          <h4>Suggestions:</h4>
          <ul style={{ color: color }}>
            {suggestions.map((sugg, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                {sugg}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ color: "#2ecc71" }}>Your profile is complete! 🎉</p>
      )}
    </div>
  );
};

export default ProfileCompletion;
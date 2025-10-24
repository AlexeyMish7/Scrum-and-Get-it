// src/components/ProfileDashboard/ProfileStrengthTips.tsx
import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

interface ProfileStrengthTipsProps {
  strengthScore: number; // 0–100
  recommendations: string[];
}

const ProfileStrengthTips: React.FC<ProfileStrengthTipsProps> = ({
  strengthScore,
  recommendations,
}) => {
  // Determine label, color, and icon
  let label = "Weak";
  let color = "#e74c3c";
  let icon = <FaTimesCircle color={color} />;

  if (strengthScore >= 70) {
    label = "Strong";
    color = "#2ecc71";
    icon = <FaCheckCircle color={color} />;
  } else if (strengthScore >= 40) {
    label = "Moderate";
    color = "#f1c40f";
    icon = <FaExclamationTriangle color={color} />;
  }

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
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon} Profile Strength: <span style={{ color }}>{label}</span> ({strengthScore}%)
      </h2>

      <div
        style={{
          backgroundColor: "#eee",
          height: "10px",
          borderRadius: "5px",
          overflow: "hidden",
          margin: "0.5rem 0 1rem 0",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${strengthScore}%`,
            backgroundColor: color,
            transition: "width 0.4s ease",
          }}
        ></div>
      </div>

      {recommendations.length > 0 ? (
        <>
          <h4>Recommendations:</h4>
          <ul>
            {recommendations.map((rec, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                {rec}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ color: "#2ecc71" }}>Your profile looks great! 🎉</p>
      )}
    </div>
  );
};

export default ProfileStrengthTips;
import React from "react";

interface ActivityItem {
  id: string;
  date: string; // ISO string or formatted date
  description: string;
}

interface RecentActivityTimelineProps {
  activities: ActivityItem[];
}

const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({ activities }) => {
  return (
    <div
      style={{
        margin: "0rem 0",
        border: "1px solid #000", // thin black outline
        borderRadius: "12px",
        padding: "16px",
        height: 323,            // same height as Skills Distribution
        //overflowY: "auto",      // scroll if content exceeds height
      }}
    >
      <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
      <ul style={{ listStyle: "none", paddingLeft: 0, borderLeft: "2px solid #ccc" }}>
        {activities.map(({ id, date, description }) => (
          <li
            key={id}
            style={{
              position: "relative",
              padding: "0.5rem 1rem 0.5rem 1.5rem",
              marginBottom: "1rem",
            }}
          >
            {/* Timeline dot */}
            <span
              style={{
                position: "absolute",
                left: "-7px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#007bff",
              }}
            ></span>

            <div style={{ fontSize: "0.85rem", color: "#666" }}>
              {new Date(date).toLocaleString()}
            </div>
            <div>{description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivityTimeline;
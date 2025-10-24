import React from "react";

interface CareerEvent {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string; // optional if "Present"
  description?: string;
}

interface CareerTimelineProps {
  events: CareerEvent[];
}

const CareerTimeline: React.FC<CareerTimelineProps> = ({ events }) => {
  return (
    <div style={{ margin: "2rem 0" }}>
      <h2>Career Timeline</h2>

      <div
        style={{
          position: "relative",
          margin: "2rem 0",
          paddingLeft: "20px",
          borderLeft: "3px solid #2196f3",
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              marginBottom: "2rem",
              position: "relative",
            }}
          >
            {/* timeline dot */}
            <span
              style={{
                position: "absolute",
                left: "-10px",
                top: "8px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#2196f3",
              }}
            ></span>

            <div>
              <h3 style={{ margin: 0 }}>{event.title}</h3>
              <h4 style={{ margin: "4px 0", color: "#555" }}>{event.company}</h4>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#888" }}>
                {event.startDate} – {event.endDate ?? "Present"}
              </p>
              {event.description && (
                <p style={{ marginTop: "0.5rem", color: "#333" }}>{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerTimeline;
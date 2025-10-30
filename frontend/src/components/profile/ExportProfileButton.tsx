import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaDownload } from "react-icons/fa";

interface ExportProfileButtonProps {
  targetId?: string; // The HTML element ID you want to export
}

const ExportProfileButton: React.FC<ExportProfileButtonProps> = ({ targetId = "profile-dashboard" }) => {
  const handleExportPDF = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      console.error(`Element with ID "${targetId}" not found.`);
      return;
    }

    // Capture the element as an image
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale = better resolution
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    // Calculate width and height to fit A4 size
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add extra pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("profile-summary.pdf");
  };

  return (
    <div style={{ margin: "2rem 0" }}>
      <button
        onClick={handleExportPDF}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#2196f3",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "0.75rem 1.25rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        <FaDownload />
        Export Profile Summary (PDF)
      </button>
    </div>
  );
};

export default ExportProfileButton;
import { jsPDF } from 'jspdf';

export interface VehicleReportData {
  vehicleId: string;
  vehicleModel?: string;
  mileage?: number;
  healthScore: number;
  healthStatus: string;
  prediction: string;
  probabilityYes: number;
  factors?: Array<{ feature: string; impact: number | string }>;
  recommendations?: Array<{ action: string; recommendation: string; priority?: string }>;
  timestamp?: string;
}

export function generateVehicleHealthReport(data: VehicleReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = data.timestamp || new Date().toLocaleString();

  // Header Background banner
  doc.setFillColor(11, 27, 45); // Deep navy
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART VEHICLE HEALTH INTELLIGENCE', 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(111, 182, 255); // Cyan blue
  doc.text('AI-POWERED PREDICTIVE DIAGNOSTIC REPORT', 15, 26);

  doc.setTextColor(170, 190, 210);
  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr}`, 15, 34);
  doc.text(`Document ID: REP-${data.vehicleId}-${Date.now().toString().slice(-6)}`, pageWidth - 80, 34);

  // Vehicle Profile Card
  let currentY = 50;
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 225, 240);
  doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 70, 95);
  doc.text('VEHICLE OVERVIEW', 20, currentY + 7);

  doc.setFontSize(12);
  doc.setTextColor(15, 30, 50);
  doc.text(`ID: ${data.vehicleId}`, 20, currentY + 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 100, 120);
  const modelText = data.vehicleModel ? `Model: ${data.vehicleModel}` : 'Class: Fleet Vehicle';
  const mileageText = data.mileage ? `Odometer: ${data.mileage.toLocaleString()} km` : 'Odometer: Standard Logged';
  doc.text(`${modelText}  |  ${mileageText}`, 20, currentY + 23);

  // Health Score & Maintenance Diagnostic Block
  currentY += 34;

  // Box 1: Health Score
  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(210, 225, 240);
  doc.roundedRect(15, currentY, 85, 36, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 120, 140);
  doc.text('VEHICLE HEALTH SCORE', 20, currentY + 8);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  if (data.healthScore >= 75) {
    doc.setTextColor(34, 160, 110); // Green
  } else if (data.healthScore >= 50) {
    doc.setTextColor(215, 140, 30); // Amber
  } else {
    doc.setTextColor(215, 60, 60); // Red
  }
  doc.text(`${data.healthScore.toFixed(1)} / 100`, 20, currentY + 21);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${data.healthStatus}`, 20, currentY + 29);

  // Box 2: Maintenance Diagnostic
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(105, currentY, pageWidth - 120, 36, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 120, 140);
  doc.text('PREDICTIVE OUTCOME', 110, currentY + 8);

  doc.setFontSize(15);
  const needsMaint = data.prediction === 'Yes' || data.prediction === 'Maintenance required';
  if (needsMaint) {
    doc.setTextColor(215, 60, 60);
    doc.text('Maintenance Required', 110, currentY + 19);
  } else {
    doc.setTextColor(34, 160, 110);
    doc.text('Optimal / Healthy', 110, currentY + 19);
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 100, 120);
  const probPercent = (data.probabilityYes * 100).toFixed(2);
  doc.text(`Failure Risk Probability: ${probPercent}%`, 110, currentY + 29);

  // Section 3: Diagnostic Explainability / SHAP Factors
  currentY += 44;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 50);
  doc.text('Key Diagnostic Contributors (SHAP Explainability)', 15, currentY);

  currentY += 4;
  doc.setDrawColor(220, 230, 240);
  doc.line(15, currentY, pageWidth - 15, currentY);

  currentY += 6;
  if (data.factors && data.factors.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 90, 115);
    doc.text('Feature Parameter', 20, currentY);
    doc.text('Impact Weight', pageWidth - 45, currentY);

    currentY += 4;
    data.factors.slice(0, 6).forEach((factor) => {
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 55, 75);
      const cleanName = factor.feature.replace(/^(numeric__|categorical__)/, '').replace(/_/g, ' ');
      doc.text(cleanName, 20, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 90, 160);
      const impactVal = typeof factor.impact === 'number' ? factor.impact.toFixed(4) : String(factor.impact);
      doc.text(impactVal, pageWidth - 45, currentY);
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 140, 160);
    doc.text('Global model features applied for anomaly baseline evaluation.', 20, currentY + 5);
    currentY += 8;
  }

  // Section 4: Recommended Actions
  currentY += 14;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 50);
  doc.text('Actionable Maintenance Recommendations', 15, currentY);

  currentY += 4;
  doc.setDrawColor(220, 230, 240);
  doc.line(15, currentY, pageWidth - 15, currentY);

  currentY += 5;
  if (data.recommendations && data.recommendations.length > 0) {
    data.recommendations.slice(0, 3).forEach((rec) => {
      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 50, 50);
      const priority = rec.priority ? `[${rec.priority}] ` : '';
      doc.text(`${priority}${rec.action}`, 20, currentY);

      currentY += 5;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 75, 95);
      const lines = doc.splitTextToSize(rec.recommendation, pageWidth - 40);
      doc.text(lines, 20, currentY);
      currentY += (lines.length - 1) * 4;
    });
  } else {
    currentY += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 90, 110);
    doc.text('• Routine scheduled preventive maintenance recommended based on normal wear-and-tear metrics.', 20, currentY);
    currentY += 6;
    doc.text('• Regularly verify fluid levels, ignition systems, and mechanical system tolerances.', 20, currentY);
  }

  // Footer / Disclaimer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(220, 230, 240);
  doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 155, 175);
  doc.text('Smart Vehicle Health Intelligence — Diagnostic insights are derived from ML model inference and statistical anomaly markers.', 15, footerY);
  doc.text('Confidential Fleet Intelligence Report', pageWidth - 55, footerY);

  // Save the PDF
  doc.save(`Vehicle_Health_Report_${data.vehicleId}.pdf`);
}

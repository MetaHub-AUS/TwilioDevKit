/**
 * NFAEP Route PDF Generator
 * Generates visual timeline PDFs with route details
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Format time for display
 */
function formatTime(timeString) {
  if (!timeString) return '';
  // Assuming timeString is in HH:MM format
  return timeString;
}

/**
 * Calculate total hectares for a route
 */
function calculateTotalHectares(stops) {
  return stops.reduce((sum, stop) => sum + (stop.propertySizeHa || 0), 0);
}

/**
 * Generate exact route PDF with timeline visualization
 * @param {Object} routeData - Route data with vehicles and stops
 * @param {string} displayDate - Formatted date for display
 */
export function generateExactRoutePDF(routeData, displayDate) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('NFAEP Field Route Plan', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${displayDate}`, pageWidth / 2, 28, { align: 'center' });

  let yPos = 40;

  // Summary Section
  if (routeData.summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Route Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Bookings: ${routeData.summary.totalBookings || 0}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Vehicles: ${routeData.summary.totalVehicles || 0}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Distance: ${(routeData.summary.totalDistance || 0).toFixed(1)} km`, 14, yPos);
    yPos += 12;
  }

  // Vehicle Routes
  if (!routeData.routes || routeData.routes.length === 0) {
    doc.text('No routes available', 14, yPos);
    doc.save(`nfaep-route-${displayDate}.pdf`);
    return;
  }

  for (let i = 0; i < routeData.routes.length; i++) {
    const vehicle = routeData.routes[i];

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Vehicle Header
    doc.setFillColor(0, 128, 128); // Teal
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Vehicle ${vehicle.vehicleId || i + 1}`, 16, yPos + 5.5);

    const totalHa = vehicle.totalHa || calculateTotalHectares(vehicle.stops || []);
    doc.text(`Total: ${totalHa.toFixed(1)} ha`, pageWidth - 16, yPos + 5.5, { align: 'right' });

    yPos += 12;
    doc.setTextColor(0, 0, 0);

    // Route Stops Table
    if (vehicle.stops && vehicle.stops.length > 0) {
      const tableData = vehicle.stops.map((stop, idx) => [
        (stop.stopNumber || idx + 1).toString(),
        formatTime(stop.time),
        stop.address || 'N/A',
        stop.jobNumber || 'N/A',
        (stop.propertySizeHa || 0).toFixed(1) + ' ha',
        (stop.estimatedDuration || 0) + ' min',
        (stop.distanceFromPrevious || 0).toFixed(1) + ' km'
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['#', 'Time', 'Address', 'Job #', 'Size', 'Duration', 'Distance']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 128, 128],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 18 },
          2: { cellWidth: 55 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 22 },
          6: { cellWidth: 20 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.text('No stops scheduled', 16, yPos);
      yPos += 10;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const footerText = `Generated: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} | NFAEP Route Optimizer`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save PDF
  doc.save(`nfaep-route-${displayDate}.pdf`);
}

/**
 * Generate simple route PDF (alternative format)
 */
export function generateSimpleRoutePDF(bookings, displayDate) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NFAEP Booking List', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${displayDate}`, pageWidth / 2, 28, { align: 'center' });

  // Bookings Table
  const tableData = bookings.map((booking, idx) => [
    (idx + 1).toString(),
    formatTime(booking.time),
    booking.address || 'N/A',
    booking.jobNumber || 'N/A',
    booking.customerName || 'N/A',
    booking.teamNumberFound || 'TBD'
  ]);

  doc.autoTable({
    startY: 35,
    head: [['#', 'Time', 'Address', 'Job #', 'Customer', 'Team']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 128, 128],
      textColor: [255, 255, 255]
    }
  });

  doc.save(`nfaep-bookings-${displayDate}.pdf`);
}

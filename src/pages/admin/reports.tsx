import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../lib/context';
import { AdminSidebar } from '../../components/admin/sidebar';
import { AdminHeader } from '../../components/admin/header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Download, FileText, BarChart3 } from 'lucide-react';

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const { bookings, rooms, eventBookings, businessInfo } = useBooking();
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [reservationPeriod, setReservationPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'monthly' | 'annual'>('monthly');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalEventRevenue = eventBookings.reduce((sum, e) => sum + e.totalPrice, 0);
  const combinedRevenue = totalRevenue + totalEventRevenue;
  const totalBookings = bookings.length;
  const totalEvents = eventBookings.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const avgOccupancy = rooms.length > 0 ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : 0;

  // Period filter helper
  const filterByPeriod = (items: any[], dateField: string, period: 'daily' | 'weekly' | 'monthly' | 'annual') => {
    const refDate = new Date(reportDate + 'T00:00:00');
    if (period === 'daily') {
      return items.filter((item) => {
        const d = new Date(item[dateField]);
        return d.toDateString() === refDate.toDateString();
      });
    } else if (period === 'weekly') {
      const weekStart = new Date(refDate);
      weekStart.setDate(refDate.getDate() - refDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return items.filter((item) => {
        const d = new Date(item[dateField]);
        return d >= weekStart && d < weekEnd;
      });
    } else if (period === 'monthly') {
      return items.filter((item) => {
        const d = new Date(item[dateField]);
        return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
      });
    } else {
      return items.filter((item) => {
        const d = new Date(item[dateField]);
        return d.getFullYear() === refDate.getFullYear();
      });
    }
  };

  const reservationBookings = filterByPeriod(bookings, 'checkInDate', reservationPeriod);
  const reservationEventBookings = filterByPeriod(eventBookings, 'eventDate', reservationPeriod);
  const salesBookings = filterByPeriod(bookings, 'checkInDate', salesPeriod);
  const salesEventBookings = filterByPeriod(eventBookings, 'eventDate', salesPeriod);
  const reservationRevenue = reservationBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const reservationEventRevenue = reservationEventBookings.reduce((sum, e) => sum + e.totalPrice, 0);
  const salesRevenue = salesBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const salesEventRevenue = salesEventBookings.reduce((sum, e) => sum + e.totalPrice, 0);
  const combinedSalesRevenue = salesRevenue + salesEventRevenue;

  // Generate Reservation Report
  const handleGenerateReservationReport = () => {
    const reportData = {
      title: 'Reservation Report',
      generatedDate: new Date().toLocaleDateString(),
      period: reservationPeriod,
      reportDate,
      totalBookings: reservationBookings.length,
      bookings: reservationBookings.map((b) => ({
        id: b.id,
        guestName: b.guestName,
        email: b.guestEmail,
        phone: b.guestPhone,
        rooms: b.roomNumber || 'N/A',
        checkIn: new Date(b.checkInDate).toLocaleDateString(),
        checkOut: new Date(b.checkOutDate).toLocaleDateString(),
        status: b.status,
        totalPrice: b.totalPrice,
      })),
    };
    setGeneratedReport(reportData);
  };

  // Generate Sales Report
  const handleGenerateSalesReport = () => {
    const reportData = {
      title: 'Sales Report',
      generatedDate: new Date().toLocaleDateString(),
      period: salesPeriod,
      reportDate,
      totalRevenue: combinedSalesRevenue,
      roomBookings: salesBookings.length,
      eventBookings: salesEventBookings.length,
      roomRevenue: salesRevenue,
      eventRevenue: salesEventRevenue,
      paymentBreakdown: [
        { status: 'Pending', count: salesBookings.filter((b) => b.paymentStatus === 'pending').length },
        { status: 'Completed', count: salesBookings.filter((b) => b.paymentStatus === 'completed').length },
        { status: 'Cancelled', count: salesBookings.filter((b) => b.paymentStatus === 'cancelled').length },
      ],
      details: salesBookings.map((b) => ({
        bookingId: b.id,
        guestName: b.guestName,
        amount: b.totalPrice,
        method: b.paymentMethod || 'Not specified',
        status: b.paymentStatus || 'pending',
        date: new Date(b.checkInDate).toLocaleDateString(),
      })),
    };
    setGeneratedReport(reportData);
  };

  // Generate Guest Report
  const handleGenerateCustomerReport = () => {
    const customers = reservationBookings.map((b) => ({
      name: b.guestName,
      email: b.guestEmail,
      phone: b.guestPhone,
      bookings: reservationBookings.filter((booking) => booking.guestEmail === b.guestEmail).length,
      totalSpent: reservationBookings
        .filter((booking) => booking.guestEmail === b.guestEmail)
        .reduce((sum, booking) => sum + booking.totalPrice, 0),
    }));

    const reportData = {
      title: 'Guest Report',
      generatedDate: new Date().toLocaleDateString(),
      period: reservationPeriod,
      reportDate,
      totalCustomers: [...new Set(reservationBookings.map((b) => b.guestEmail))].length,
      customers: Array.from(
        new Map(customers.map((item) => [item.email, item])).values()
      ),
    };
    setGeneratedReport(reportData);
  };

  // Generate Room/Facility Usage Report
  const handleGenerateRoomUsageReport = () => {
    const reportData = {
      title: 'Room Usage Report',
      generatedDate: new Date().toLocaleDateString(),
      totalRooms: rooms.length,
      occupiedRooms: occupiedRooms,
      availableRooms: rooms.length - occupiedRooms,
      occupancyRate: avgOccupancy,
      roomBreakdown: [
        {
          type: 'Single',
          total: rooms.filter((r) => r.type === 'single').length,
          occupied: rooms.filter((r) => r.type === 'single' && r.status === 'occupied').length,
        },
        {
          type: 'Double',
          total: rooms.filter((r) => r.type === 'double').length,
          occupied: rooms.filter((r) => r.type === 'double' && r.status === 'occupied').length,
        },
        {
          type: 'Suite',
          total: rooms.filter((r) => r.type === 'suite').length,
          occupied: rooms.filter((r) => r.type === 'suite' && r.status === 'occupied').length,
        },
      ],
    };
    setGeneratedReport(reportData);
  };

  const businessName = businessInfo?.adminName || "Pring Kuya's Inn";
  const businessContact = businessInfo?.contactNumber || '';
  const businessLocation = businessInfo?.location || '';

  const formatPeso = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `\u20b1${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // PDF uses "PHP" prefix because jsPDF's built-in fonts don't support the peso sign Unicode glyph
  const formatPesoPDF = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `PHP ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Export as PDF
  const handleExportPDF = async () => {
    if (!generatedReport) return;

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      let yPosition = margin;

      // --- Premium Header ---
      // Top accent bar
      pdf.setFillColor(30, 58, 95);
      pdf.rect(0, 0, pageWidth, 4, 'F');

      // Business name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(30, 58, 95);
      pdf.text(businessName, margin, yPosition + 4);
      yPosition += 10;

      // Business contact info
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(110, 110, 110);
      if (businessContact) {
        pdf.text(`Contact: ${businessContact}`, margin, yPosition);
      }
      if (businessLocation) {
        pdf.text(`Location: ${businessLocation}`, margin + 80, yPosition);
      }
      yPosition += 4;

      // Decorative double line
      pdf.setDrawColor(30, 58, 95);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
      yPosition += 8;

      // Report title centered
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text(generatedReport.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;

      // Generated date and period
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      const periodLabel = generatedReport.period
        ? generatedReport.period.charAt(0).toUpperCase() + generatedReport.period.slice(1)
        : '';
      pdf.text(
        `Generated: ${generatedReport.generatedDate}${periodLabel ? '  |  Period: ' + periodLabel : ''}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 8;

      const addNewPage = () => {
        pdf.addPage();
        yPosition = margin + 8;
        // Repeat header accent on new pages
        pdf.setFillColor(30, 58, 95);
        pdf.rect(0, 0, pageWidth, 4, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 58, 95);
        pdf.text(`${businessName} - ${generatedReport.title}`, margin, yPosition);
        yPosition += 5;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      };

      const checkPage = (needed: number) => {
        if (yPosition + needed > pageHeight - 18) addNewPage();
      };

      // Helper: draw table header row with fill
      const drawTableHeader = (columns: { label: string; x: number; width?: number; align?: 'left' | 'right' | 'center' }[]) => {
        pdf.setFillColor(30, 58, 95);
        pdf.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 7, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        columns.forEach((col) => {
          pdf.text(col.label, col.x, yPosition, { align: col.align || 'left' });
        });
        yPosition += 3;
      };

      // Helper: draw a data row with alternating background
      let rowAlternator = 0;
      const drawRow = (columns: { text: string; x: number; align?: 'left' | 'right' | 'center' }[]) => {
        checkPage(6);
        if (rowAlternator % 2 === 0) {
          pdf.setFillColor(245, 247, 250);
          pdf.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 6, 'F');
        }
        rowAlternator++;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(50, 50, 50);
        columns.forEach((col) => {
          pdf.text(col.text, col.x, yPosition, { align: col.align || 'left' });
        });
        yPosition += 6;
      };

      if (generatedReport.title === 'Sales Report') {
        // Summary box
        pdf.setFillColor(237, 242, 247);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 24, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 58, 95);
        pdf.text('Revenue Summary', margin + 4, yPosition + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`Room Revenue:  ${formatPesoPDF(generatedReport.roomRevenue)}`, margin + 4, yPosition + 13);
        pdf.text(`Event Revenue:  ${formatPesoPDF(generatedReport.eventRevenue)}`, margin + 4, yPosition + 19);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 58, 95);
        pdf.text(`Total Revenue:  ${formatPesoPDF(generatedReport.totalRevenue)}`, margin + 130, yPosition + 13);
        pdf.text(`Room Bookings:  ${generatedReport.roomBookings}    Event Bookings:  ${generatedReport.eventBookings}`, margin + 130, yPosition + 19);
        yPosition += 30;

        // Payment breakdown
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Payment Status Breakdown', margin, yPosition);
        yPosition += 3;
        drawTableHeader([
          { label: 'Status', x: margin + 2 },
          { label: 'Count', x: margin + 90, align: 'right' },
        ]);
        rowAlternator = 0;
        generatedReport.paymentBreakdown.forEach((p: any) => {
          drawRow([
            { text: p.status, x: margin + 2 },
            { text: String(p.count), x: margin + 90, align: 'right' },
          ]);
        });
        yPosition += 6;

        // Transaction details
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Transaction Details', margin, yPosition);
        yPosition += 3;
        drawTableHeader([
          { label: 'Booking ID', x: margin + 2 },
          { label: 'Guest Name', x: margin + 40 },
          { label: 'Amount', x: margin + 125, align: 'right' },
          { label: 'Method', x: margin + 145 },
          { label: 'Status', x: margin + 185 },
          { label: 'Date', x: margin + 220 },
        ]);
        rowAlternator = 0;
        if (generatedReport.details.length === 0) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text('No transactions for this period.', margin + 2, yPosition);
          yPosition += 6;
        } else {
          let totalAmount = 0;
          generatedReport.details.forEach((d: any) => {
            const amt = typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount;
            totalAmount += amt;
            drawRow([
              { text: String(d.bookingId).substring(0, 8), x: margin + 2 },
              { text: String(d.guestName).substring(0, 25), x: margin + 40 },
              { text: formatPesoPDF(d.amount), x: margin + 125, align: 'right' },
              { text: String(d.method).substring(0, 15), x: margin + 145 },
              { text: String(d.status), x: margin + 185 },
              { text: String(d.date), x: margin + 220 },
            ]);
          });
          // Total row
          checkPage(8);
          pdf.setFillColor(237, 242, 247);
          pdf.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 7, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(30, 58, 95);
          pdf.text('TOTAL', margin + 40, yPosition);
          pdf.text(formatPesoPDF(totalAmount), margin + 125, yPosition, { align: 'right' });
          yPosition += 8;
        }
      } else if (generatedReport.title === 'Reservation Report') {
        // Summary box
        pdf.setFillColor(237, 242, 247);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 14, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 58, 95);
        pdf.text(`Total Reservations:  ${generatedReport.totalBookings}`, margin + 4, yPosition + 9);
        yPosition += 20;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Booking Details', margin, yPosition);
        yPosition += 3;
        drawTableHeader([
          { label: 'Guest Name', x: margin + 2 },
          { label: 'Email', x: margin + 55 },
          { label: 'Room', x: margin + 125 },
          { label: 'Check-In', x: margin + 155 },
          { label: 'Check-Out', x: margin + 195 },
          { label: 'Status', x: margin + 230 },
          { label: 'Price', x: pageWidth - margin - 2, align: 'right' },
        ]);
        rowAlternator = 0;
        if (generatedReport.bookings.length === 0) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text('No reservations for this period.', margin + 2, yPosition);
          yPosition += 6;
        } else {
          let totalPrice = 0;
          generatedReport.bookings.forEach((b: any) => {
            const price = typeof b.totalPrice === 'string' ? parseFloat(b.totalPrice) : b.totalPrice;
            totalPrice += price;
            drawRow([
              { text: String(b.guestName).substring(0, 28), x: margin + 2 },
              { text: String(b.email).substring(0, 28), x: margin + 55 },
              { text: String(b.rooms).substring(0, 20), x: margin + 125 },
              { text: String(b.checkIn), x: margin + 155 },
              { text: String(b.checkOut), x: margin + 195 },
              { text: String(b.status).substring(0, 12), x: margin + 230 },
              { text: formatPesoPDF(b.totalPrice), x: pageWidth - margin - 2, align: 'right' },
            ]);
          });
          // Total row
          checkPage(8);
          pdf.setFillColor(237, 242, 247);
          pdf.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 7, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(30, 58, 95);
          pdf.text('TOTAL', margin + 2, yPosition);
          pdf.text(formatPesoPDF(totalPrice), pageWidth - margin - 2, yPosition, { align: 'right' });
          yPosition += 8;
        }
      } else if (generatedReport.title === 'Guest Report') {
        // Summary box
        pdf.setFillColor(237, 242, 247);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 14, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 58, 95);
        pdf.text(`Total Guests:  ${generatedReport.totalCustomers}`, margin + 4, yPosition + 9);
        yPosition += 20;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Guest Details', margin, yPosition);
        yPosition += 3;
        drawTableHeader([
          { label: 'Name', x: margin + 2 },
          { label: 'Email', x: margin + 65 },
          { label: 'Phone', x: margin + 140 },
          { label: 'Bookings', x: margin + 195, align: 'center' },
          { label: 'Total Spent', x: pageWidth - margin - 2, align: 'right' },
        ]);
        rowAlternator = 0;
        if (generatedReport.customers.length === 0) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text('No guests for this period.', margin + 2, yPosition);
          yPosition += 6;
        } else {
          let totalSpent = 0;
          let totalBookings = 0;
          generatedReport.customers.forEach((c: any) => {
            const spent = typeof c.totalSpent === 'string' ? parseFloat(c.totalSpent) : c.totalSpent;
            totalSpent += spent;
            totalBookings += c.bookings;
            drawRow([
              { text: String(c.name).substring(0, 30), x: margin + 2 },
              { text: String(c.email).substring(0, 30), x: margin + 65 },
              { text: String(c.phone || 'N/A'), x: margin + 140 },
              { text: String(c.bookings), x: margin + 195, align: 'center' },
              { text: formatPesoPDF(c.totalSpent), x: pageWidth - margin - 2, align: 'right' },
            ]);
          });
          // Total row
          checkPage(8);
          pdf.setFillColor(237, 242, 247);
          pdf.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 7, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(30, 58, 95);
          pdf.text('TOTAL', margin + 2, yPosition);
          pdf.text(String(totalBookings), margin + 195, yPosition, { align: 'center' });
          pdf.text(formatPesoPDF(totalSpent), pageWidth - margin - 2, yPosition, { align: 'right' });
          yPosition += 8;
        }
      } else if (generatedReport.title === 'Room Usage Report') {
        // Summary box
        pdf.setFillColor(237, 242, 247);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 58, 95);
        pdf.text(`Total Rooms:  ${generatedReport.totalRooms}`, margin + 4, yPosition + 7);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          `Occupied: ${generatedReport.occupiedRooms}    Available: ${generatedReport.availableRooms}    Occupancy Rate: ${generatedReport.occupancyRate}%`,
          margin + 4,
          yPosition + 14
        );
        yPosition += 26;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Room Type Breakdown', margin, yPosition);
        yPosition += 3;
        drawTableHeader([
          { label: 'Type', x: margin + 2 },
          { label: 'Total', x: margin + 120, align: 'center' },
          { label: 'Occupied', x: margin + 190, align: 'center' },
          { label: 'Available', x: pageWidth - margin - 2, align: 'center' },
        ]);
        rowAlternator = 0;
        let grandTotalRooms = 0;
        let grandTotalOccupied = 0;
        generatedReport.roomBreakdown.forEach((r: any) => {
          grandTotalRooms += r.total;
          grandTotalOccupied += r.occupied;
          drawRow([
            { text: r.type, x: margin + 2 },
            { text: String(r.total), x: margin + 120, align: 'center' },
            { text: String(r.occupied), x: margin + 190, align: 'center' },
            { text: String(r.total - r.occupied), x: pageWidth - margin - 2, align: 'center' },
          ]);
        });
        // Total row
        checkPage(8);
        pdf.setFillColor(237, 242, 247);
        pdf.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 7, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 58, 95);
        pdf.text('TOTAL', margin + 2, yPosition);
        pdf.text(String(grandTotalRooms), margin + 120, yPosition, { align: 'center' });
        pdf.text(String(grandTotalOccupied), margin + 190, yPosition, { align: 'center' });
        pdf.text(String(grandTotalRooms - grandTotalOccupied), pageWidth - margin - 2, yPosition, { align: 'center' });
        yPosition += 8;
      }

      // --- Premium Footer ---
      pdf.setDrawColor(30, 58, 95);
      pdf.setLineWidth(0.5);
      pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(130, 130, 130);
      pdf.text(
        `${businessName}  |  Generated on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 9
      );
      pdf.text(
        'Confidential - For internal use only',
        pageWidth - margin,
        pageHeight - 9,
        { align: 'right' }
      );

      pdf.save(
        `${generatedReport.title || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export as Excel
  const handleExportExcel = () => {
    if (!generatedReport) return;

    const wb = XLSX.utils.book_new();

    // Build a premium header section at the top of the sheet
    const headerRows: (string | number)[][] = [];
    headerRows.push([businessName]);
    if (businessContact) headerRows.push([`Contact: ${businessContact}`]);
    if (businessLocation) headerRows.push([`Location: ${businessLocation}`]);
    headerRows.push([`${generatedReport.title}`]);
    headerRows.push([`Generated: ${generatedReport.generatedDate}${generatedReport.period ? '  |  Period: ' + (generatedReport.period.charAt(0).toUpperCase() + generatedReport.period.slice(1)) : ''}`]);
    headerRows.push([]);

    let dataRows: (string | number)[][] = [];
    let columnHeaders: string[] = [];

    if (generatedReport.title === 'Sales Report') {
      columnHeaders = ['Booking ID', 'Guest', 'Amount', 'Method', 'Status', 'Date'];
      dataRows = generatedReport.details.map((d: any) => [
        String(d.bookingId).substring(0, 8),
        d.guestName,
        formatPeso(d.amount),
        d.method,
        d.status,
        d.date,
      ]);
    } else if (generatedReport.title === 'Reservation Report') {
      columnHeaders = ['Guest', 'Email', 'Room', 'Check-In', 'Check-Out', 'Status', 'Price'];
      dataRows = generatedReport.bookings.map((b: any) => [
        b.guestName,
        b.email,
        b.rooms,
        b.checkIn,
        b.checkOut,
        b.status,
        formatPeso(b.totalPrice),
      ]);
    } else if (generatedReport.title === 'Guest Report') {
      columnHeaders = ['Name', 'Email', 'Phone', 'Bookings', 'Total Spent'];
      dataRows = generatedReport.customers.map((c: any) => [
        c.name,
        c.email,
        c.phone || 'N/A',
        c.bookings,
        formatPeso(c.totalSpent),
      ]);
    } else if (generatedReport.title === 'Room Usage Report') {
      columnHeaders = ['Type', 'Total', 'Occupied', 'Available'];
      dataRows = generatedReport.roomBreakdown.map((r: any) => [
        r.type,
        r.total,
        r.occupied,
        r.total - r.occupied,
      ]);
    }

    // Combine header + column headers + data
    const aoa: (string | number)[][] = [...headerRows, columnHeaders, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Set column widths based on number of columns
    const numCols = columnHeaders.length;
    const colWidth = 18;
    ws['!cols'] = Array(numCols).fill({ wch: colWidth });

    // Merge the first row (business name) across all columns
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${generatedReport.title || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Clear generated report
  const handleClearReport = () => {
    setGeneratedReport(null);
  };

  // Monthly data computed from real bookings
  const monthlyData = React.useMemo(() => {
    const months: { month: string; bookings: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthBookings = bookings.filter(b => {
        const bd = new Date(b.checkInDate);
        return bd.getFullYear() === year && bd.getMonth() === month;
      });
      const monthEvents = eventBookings.filter(e => {
        const ed = new Date(e.eventDate);
        return ed.getFullYear() === year && ed.getMonth() === month;
      });
      months.push({
        month: monthName,
        bookings: monthBookings.length + monthEvents.length,
        revenue: monthBookings.reduce((s, b) => s + b.totalPrice, 0) + monthEvents.reduce((s, e) => s + e.totalPrice, 0),
      });
    }
    return months;
  }, [bookings, eventBookings]);

  // Room type data
  const roomTypeData = [
    {
      type: 'Single',
      booked: rooms.filter((r) => r.type === 'single' && r.status === 'occupied').length,
      available: rooms.filter((r) => r.type === 'single' && r.status === 'available').length,
    },
    {
      type: 'Double',
      booked: rooms.filter((r) => r.type === 'double' && r.status === 'occupied').length,
      available: rooms.filter((r) => r.type === 'double' && r.status === 'available').length,
    },
    {
      type: 'Suite',
      booked: rooms.filter((r) => r.type === 'suite' && r.status === 'occupied').length,
      available: rooms.filter((r) => r.type === 'suite' && r.status === 'available').length,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Reports & Analytics</h2>
            </div>

            {/* Generated Report Display Section */}
            {generatedReport && (
              <div
                ref={reportRef}
                className="bg-white rounded-lg p-8 mb-8 border-2 border-purple-200"
              >
                <div className="text-center mb-8 border-b pb-6">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {generatedReport.title}
                  </h2>
                  <p className="text-gray-600">
                    Generated: {generatedReport.generatedDate}
                  </p>
                </div>

                {/* Reservation Report */}
                {generatedReport.title === 'Reservation Report' && (
                  <div>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Reservations</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {generatedReport.totalBookings}
                      </p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Guest</th>
                            <th className="px-4 py-2 font-semibold">Email</th>
                            <th className="px-4 py-2 font-semibold">Room</th>
                            <th className="px-4 py-2 font-semibold">Check-In</th>
                            <th className="px-4 py-2 font-semibold">Check-Out</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                            <th className="px-4 py-2 font-semibold text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedReport.bookings.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No reservations for this period.</td></tr>
                          ) : (
                            generatedReport.bookings.map((b: any, i: number) => (
                              <tr key={b.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-2">{b.guestName}</td>
                                <td className="px-4 py-2 text-gray-600">{b.email}</td>
                                <td className="px-4 py-2">{b.rooms}</td>
                                <td className="px-4 py-2">{b.checkIn}</td>
                                <td className="px-4 py-2">{b.checkOut}</td>
                                <td className="px-4 py-2 capitalize">{b.status}</td>
                                <td className="px-4 py-2 text-right font-medium">₱{b.totalPrice}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sales Report */}
                {generatedReport.title === 'Sales Report' && (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Room Revenue</p>
                        <p className="text-2xl font-bold text-green-600">₱{generatedReport.roomRevenue}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Event Revenue</p>
                        <p className="text-2xl font-bold text-purple-600">₱{generatedReport.eventRevenue}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">₱{generatedReport.totalRevenue}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Status Breakdown</h3>
                    <div className="flex gap-4 mb-6">
                      {generatedReport.paymentBreakdown.map((p: any) => (
                        <div key={p.status} className="px-4 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">{p.status}: </span>
                          <span className="font-semibold text-gray-800">{p.count}</span>
                        </div>
                      ))}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Transaction Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Booking ID</th>
                            <th className="px-4 py-2 font-semibold">Guest</th>
                            <th className="px-4 py-2 font-semibold text-right">Amount</th>
                            <th className="px-4 py-2 font-semibold">Method</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                            <th className="px-4 py-2 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedReport.details.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No transactions for this period.</td></tr>
                          ) : (
                            generatedReport.details.map((d: any, i: number) => (
                              <tr key={d.bookingId || i} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-2 font-mono text-xs">{String(d.bookingId).substring(0, 8)}</td>
                                <td className="px-4 py-2">{d.guestName}</td>
                                <td className="px-4 py-2 text-right font-medium">₱{d.amount}</td>
                                <td className="px-4 py-2">{d.method}</td>
                                <td className="px-4 py-2 capitalize">{d.status}</td>
                                <td className="px-4 py-2">{d.date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Guest Report */}
                {generatedReport.title === 'Guest Report' && (
                  <div>
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Guests</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {generatedReport.totalCustomers}
                      </p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Guest Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Name</th>
                            <th className="px-4 py-2 font-semibold">Email</th>
                            <th className="px-4 py-2 font-semibold">Phone</th>
                            <th className="px-4 py-2 font-semibold text-center">Bookings</th>
                            <th className="px-4 py-2 font-semibold text-right">Total Spent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedReport.customers.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No guests for this period.</td></tr>
                          ) : (
                            generatedReport.customers.map((c: any, i: number) => (
                              <tr key={c.email || i} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-2">{c.name}</td>
                                <td className="px-4 py-2 text-gray-600">{c.email}</td>
                                <td className="px-4 py-2 text-gray-600">{c.phone || 'N/A'}</td>
                                <td className="px-4 py-2 text-center">{c.bookings}</td>
                                <td className="px-4 py-2 text-right font-medium">₱{c.totalSpent}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Room Usage Report */}
                {generatedReport.title === 'Room Usage Report' && (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Occupied Rooms</p>
                        <p className="text-3xl font-bold text-green-600">{generatedReport.occupiedRooms}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Available Rooms</p>
                        <p className="text-3xl font-bold text-yellow-600">{generatedReport.availableRooms}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Occupancy Rate</p>
                        <p className="text-3xl font-bold text-blue-600">{generatedReport.occupancyRate}%</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Room Type Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Type</th>
                            <th className="px-4 py-2 font-semibold text-center">Total</th>
                            <th className="px-4 py-2 font-semibold text-center">Occupied</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedReport.roomBreakdown.map((r: any) => (
                            <tr key={r.type} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2">{r.type}</td>
                              <td className="px-4 py-2 text-center">{r.total}</td>
                              <td className="px-4 py-2 text-center">{r.occupied}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Export Buttons - Show when report is generated */}
            {generatedReport && (
              <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                  >
                    <Download size={18} />
                    Download Excel
                  </button>
                  <button
                    onClick={handleClearReport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-medium"
                  >
                    <FileText size={18} />
                    Clear Report
                  </button>
                </div>
              </div>
            )}

            {/* Period Filters */}
            <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Periods</h3>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Report Period</label>
                  <select
                    value={reservationPeriod}
                    onChange={(e) => setReservationPeriod(e.target.value as any)}
                    className="rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Report Period</label>
                  <select
                    value={salesPeriod}
                    onChange={(e) => setSalesPeriod(e.target.value as any)}
                    className="rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {reservationPeriod === 'daily' && `Reservation: ${new Date(reportDate).toLocaleDateString()}`}
                  {reservationPeriod === 'weekly' && `Reservation: week of ${new Date(reportDate).toLocaleDateString()}`}
                  {reservationPeriod === 'monthly' && `Reservation: ${new Date(reportDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                  {' | '}
                  {salesPeriod === 'daily' && `Sales: ${new Date(reportDate).toLocaleDateString()}`}
                  {salesPeriod === 'monthly' && `Sales: ${new Date(reportDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                  {salesPeriod === 'annual' && `Sales: ${new Date(reportDate).getFullYear()}`}
                </div>
              </div>
            </div>

            {/* Generate Reports Section */}
            <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={handleGenerateReservationReport}
                  className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Reservation Report
                </button>
                <button
                  onClick={handleGenerateSalesReport}
                  className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <BarChart3 size={16} />
                  Sales Report
                </button>
                <button
                  onClick={handleGenerateCustomerReport}
                  className="px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Guest Report
                </button>
                <button
                  onClick={handleGenerateRoomUsageReport}
                  className="px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <BarChart3 size={16} />
                  Room Usage Report
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ₱{totalRevenue}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {totalBookings}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Avg Occupancy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {avgOccupancy}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Occupied Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {occupiedRooms}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Of {rooms.length} total</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Bookings & Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Bookings & Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3b82f6"
                        name="Bookings"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Room Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Type Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roomTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="booked" fill="#ef4444" name="Occupied" />
                      <Bar dataKey="available" fill="#10b981" name="Available" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Booking Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {bookings.filter((b) => b.status === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {bookings.filter((b) => b.status === 'confirmed').length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Checked-In</p>
                    <p className="text-2xl font-bold text-green-600">
                      {bookings.filter((b) => b.status === 'checked-in').length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Checked-Out</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {bookings.filter((b) => b.status === 'checked-out').length}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600">
                      {bookings.filter((b) => b.status === 'cancelled').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

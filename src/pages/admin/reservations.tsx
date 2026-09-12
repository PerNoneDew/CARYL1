import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/sidebar';
import { AdminHeader } from '../../components/admin/header';
import { useBooking } from '../../lib/context';
import { Badge } from '../../components/ui/badge';
import { Trash2, LogIn, Send, Calendar, List, Undo2, Waves, Music, PartyPopper, Home, BedDouble } from 'lucide-react';
import { showSuccessNotification, showErrorNotification, showWarningNotification, showActionNotification } from '../../lib/notifications';
import { DeleteConfirmDialog } from '../../components/delete-confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Booking, FacilityBooking, EventBooking } from '../../lib/types';
import { ReservationCalendar } from '../../components/admin/reservation-calendar';

const statusColors: { [key: string]: string } = {
  confirmed: 'bg-blue-100 text-blue-800',
  'checked-in': 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  'checked-out': 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

type ReservationType = 'all' | 'room' | 'cottage' | 'facility' | 'event';

interface UnifiedReservation {
  id: string;
  guestName: string;
  guestEmail: string;
  type: 'room' | 'cottage' | 'facility' | 'event';
  typeLabel: string;
  itemLabel: string;
  dateLabel: string;
  dateStart: string;
  dateEnd: string;
  status: string;
  totalPrice: number;
  raw: Booking | FacilityBooking | EventBooking;
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const {
    bookings,
    rooms,
    staffAccounts,
    updateBooking,
    deleteBooking,
    facilityBookings,
    updateFacilityBooking,
    deleteFacilityBooking,
    eventBookings,
    updateEventBooking,
    deleteEventBooking,
    services,
    eventTypePrices,
    cottages,
  } = useBooking();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [bookingToDeleteType, setBookingToDeleteType] = useState<'room' | 'cottage' | 'facility' | 'event'>('room');

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [transferStaffId, setTransferStaffId] = useState('');
  const [transferRoomId, setTransferRoomId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [typeFilter, setTypeFilter] = useState<ReservationType>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const activeBooking = bookings.find((b) => b.id === activeBookingId) || null;

  const getEventName = (type: string) => {
    const et = eventTypePrices.find((p) => p.type === type);
    return et?.name || type;
  };

  const getServiceName = (facilityId?: string, facilityType?: string) => {
    if (facilityId) {
      const s = services.find((sv) => sv.id === facilityId);
      if (s) return s.name;
    }
    return facilityType === 'swimming-pool' ? 'Swimming Pool' : facilityType === 'videoke' ? 'Videoke' : 'Facility';
  };

  // Build unified reservation list
  const allReservations: UnifiedReservation[] = [
    ...bookings.map((b): UnifiedReservation => ({
      id: b.id,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      type: b.bookingType === 'cottage' ? 'cottage' : 'room',
      typeLabel: b.bookingType === 'cottage' ? 'Cottage' : 'Room',
      itemLabel: b.bookingType === 'cottage' ? `Cottage ${b.cottageNumber || ''}` : `Room ${b.roomNumber || ''}`,
      dateLabel: `${new Date(b.checkInDate).toLocaleDateString()} → ${new Date(b.checkOutDate).toLocaleDateString()}`,
      dateStart: b.checkInDate,
      dateEnd: b.checkOutDate,
      status: b.status,
      totalPrice: b.totalPrice,
      raw: b,
    })),
    ...facilityBookings.map((f): UnifiedReservation => ({
      id: f.id,
      guestName: f.guestName,
      guestEmail: f.guestEmail,
      type: 'facility',
      typeLabel: f.facilityType === 'swimming-pool' ? 'Swimming Pool' : 'Videoke',
      itemLabel: getServiceName(f.facilityId, f.facilityType),
      dateLabel: f.startTime && f.endTime
        ? `${new Date(f.bookingDate).toLocaleDateString()} (${f.startTime}–${f.endTime})`
        : new Date(f.bookingDate).toLocaleDateString(),
      dateStart: f.bookingDate,
      dateEnd: f.bookingDate,
      status: f.status,
      totalPrice: f.totalPrice,
      raw: f,
    })),
    ...eventBookings.map((e): UnifiedReservation => ({
      id: e.id,
      guestName: e.guestName,
      guestEmail: e.guestEmail,
      type: 'event',
      typeLabel: 'Event',
      itemLabel: e.eventName || getEventName(e.eventType),
      dateLabel: e.eventEndDate && e.eventEndDate !== e.eventDate
        ? `${new Date(e.eventDate).toLocaleDateString()} → ${new Date(e.eventEndDate).toLocaleDateString()}`
        : new Date(e.eventDate).toLocaleDateString(),
      dateStart: e.eventDate,
      dateEnd: e.eventEndDate || e.eventDate,
      status: e.status,
      totalPrice: e.totalPrice,
      raw: e,
    })),
  ];

  const filteredReservations = allReservations.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const typeTabs: { key: ReservationType; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'all', label: 'All', icon: List, count: allReservations.length },
    { key: 'room', label: 'Rooms', icon: BedDouble, count: allReservations.filter(r => r.type === 'room').length },
    { key: 'cottage', label: 'Cottages', icon: Home, count: allReservations.filter(r => r.type === 'cottage').length },
    { key: 'facility', label: 'Facilities', icon: Waves, count: allReservations.filter(r => r.type === 'facility').length },
    { key: 'event', label: 'Events', icon: PartyPopper, count: allReservations.filter(r => r.type === 'event').length },
  ];

  const statusTabs: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: filteredReservations.length },
    { key: 'pending', label: 'Pending', count: allReservations.filter(r => r.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: allReservations.filter(r => r.status === 'confirmed').length },
    { key: 'checked-in', label: 'Checked-in', count: allReservations.filter(r => r.status === 'checked-in').length },
    { key: 'checked-out', label: 'Checked-out', count: allReservations.filter(r => r.status === 'checked-out').length },
    { key: 'completed', label: 'Completed', count: allReservations.filter(r => r.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: allReservations.filter(r => r.status === 'cancelled').length },
    { key: 'rejected', label: 'Rejected', count: allReservations.filter(r => r.status === 'rejected').length },
  ];

  const availableRooms = rooms.filter(
    (r) =>
      r.status === 'available' ||
      (activeBooking && r.id === activeBooking.roomId),
  );

  const availableCottages = cottages.filter(
    (c) =>
      c.status === 'available' ||
      (activeBooking && c.id === activeBooking.cottageId),
  );

  const computeNights = (checkIn: string, checkOut: string) => {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    return Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const computeNewTotalPrice = () => {
    if (!activeBooking) return 0;
    const nights = computeNights(activeBooking.checkInDate, activeBooking.checkOutDate);
    if (activeBooking.bookingType === 'cottage') {
      const cottage = cottages.find((c) => c.id === transferRoomId);
      return cottage ? nights * cottage.pricePerNight : activeBooking.totalPrice;
    }
    const room = rooms.find((r) => r.id === transferRoomId);
    return room ? nights * room.pricePerNight : activeBooking.totalPrice;
  };

  const newTotalPrice = computeNewTotalPrice();

  // Approve Reservation
  const handleApproveReservation = (id: string, type: string) => {
    if (type === 'room' || type === 'cottage') {
      const booking = bookings.find((b) => b.id === id);
      const previousStatus = booking?.status;
      updateBooking(id, { status: 'confirmed' });
      showActionNotification({
        title: 'Reservation Approved',
        description: 'The reservation has been successfully approved.',
        actionLabel: 'Undo',
        onAction: () => {
          updateBooking(id, { status: previousStatus || 'pending' });
          showSuccessNotification({ title: 'Approval Reversed', description: 'The reservation status has been restored.' });
        },
      });
    } else if (type === 'facility') {
      updateFacilityBooking(id, { status: 'confirmed' });
      showSuccessNotification({ title: 'Facility Booking Approved', description: 'The facility booking has been confirmed.' });
    } else if (type === 'event') {
      updateEventBooking(id, { status: 'confirmed' });
      showSuccessNotification({ title: 'Event Booking Approved', description: 'The event booking has been confirmed.' });
    }
  };

  // Reject Reservation
  const handleRejectReservation = (id: string, type: string) => {
    if (confirm('Are you sure you want to reject this reservation?')) {
      if (type === 'room' || type === 'cottage') {
        const booking = bookings.find((b) => b.id === id);
        const previousStatus = booking?.status;
        updateBooking(id, { status: 'rejected' });
        showActionNotification({
          title: 'Reservation Rejected',
          description: 'The reservation has been rejected.',
          actionLabel: 'Undo',
          onAction: () => {
            updateBooking(id, { status: previousStatus || 'pending' });
            showSuccessNotification({ title: 'Rejection Reversed', description: 'The reservation status has been restored.' });
          },
        });
      } else if (type === 'facility') {
        updateFacilityBooking(id, { status: 'cancelled' });
        showSuccessNotification({ title: 'Facility Booking Rejected', description: 'The facility booking has been cancelled.' });
      } else if (type === 'event') {
        updateEventBooking(id, { status: 'cancelled' });
        showSuccessNotification({ title: 'Event Booking Rejected', description: 'The event booking has been cancelled.' });
      }
    }
  };

  // Delete Reservation
  const handleDeleteClick = (id: string, type: string) => {
    let canDelete = false;
    if (type === 'room' || type === 'cottage') {
      const booking = bookings.find((b) => b.id === id);
      canDelete = booking?.status === 'checked-out' || booking?.status === 'cancelled' || booking?.status === 'rejected';
    } else if (type === 'facility') {
      const fb = facilityBookings.find((f) => f.id === id);
      canDelete = fb?.status === 'cancelled' || fb?.status === 'completed';
    } else if (type === 'event') {
      const eb = eventBookings.find((e) => e.id === id);
      canDelete = eb?.status === 'cancelled' || eb?.status === 'completed';
    }
    if (!canDelete) {
      showWarningNotification({
        title: 'Cannot Delete Reservation',
        description: 'The reservation cannot be deleted until it is completed, cancelled, or checked out.',
      });
      return;
    }
    setBookingToDelete(id);
    setBookingToDeleteType(type as 'room' | 'cottage' | 'facility' | 'event');
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!bookingToDelete) return;
    if (bookingToDeleteType === 'room' || bookingToDeleteType === 'cottage') {
      deleteBooking(bookingToDelete);
    } else if (bookingToDeleteType === 'facility') {
      deleteFacilityBooking(bookingToDelete);
    } else if (bookingToDeleteType === 'event') {
      deleteEventBooking(bookingToDelete);
    }
    showErrorNotification({
      title: 'Reservation Deleted',
      description: 'The reservation has been removed.',
    });
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  // Transfer to Staff (room/cottage only)
  const openTransfer = (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    setActiveBookingId(id);
    setTransferStaffId(booking?.assignedStaffId || '');
    setTransferRoomId(booking?.bookingType === 'cottage' ? (booking?.cottageId || '') : (booking?.roomId || ''));
    setTransferOpen(true);
  };

  const handleConfirmTransfer = () => {
    if (!activeBookingId || !transferStaffId) return;
    const staff = staffAccounts.find((s) => s.id === transferStaffId);
    const booking = bookings.find((b) => b.id === activeBookingId);
    if (!booking) return;

    const isCottage = booking.bookingType === 'cottage';
    const selectedItem = isCottage
      ? cottages.find((c) => c.id === transferRoomId)
      : rooms.find((r) => r.id === transferRoomId);
    const item = transferRoomId ? selectedItem : null;

    const previousStaffId = booking.assignedStaffId;
    const previousRoomId = booking.roomId;
    const previousRoomNumber = booking.roomNumber;
    const previousCottageId = booking.cottageId;
    const previousCottageNumber = booking.cottageNumber;
    const previousTotalPrice = booking.totalPrice;

    const nights = computeNights(booking.checkInDate, booking.checkOutDate);
    const updatedPrice = item ? nights * item.pricePerNight : booking.totalPrice;

    updateBooking(activeBookingId, {
      assignedStaffId: transferStaffId,
      roomId: isCottage ? null : (item ? item.id : null),
      roomNumber: isCottage ? null : (item ? (item as any).roomNumber : null),
      cottageId: isCottage ? (item ? item.id : null) : null,
      cottageNumber: isCottage ? (item ? (item as any).cottageNumber : null) : null,
      totalPrice: updatedPrice,
    });

    showActionNotification({
      title: 'Reservation Transferred',
      description: item
        ? `Reservation handed to ${staff?.firstName} ${staff?.lastName} with ${isCottage ? 'Cottage' : 'Room'} ${(item as any).roomNumber || (item as any).cottageNumber}. Total updated to ₱${updatedPrice.toLocaleString()}.`
        : `Reservation handed to ${staff?.firstName} ${staff?.lastName}. Assignment cleared.`,
      actionLabel: 'Undo',
      onAction: () => {
        updateBooking(activeBookingId, {
          assignedStaffId: previousStaffId || '',
          roomId: previousRoomId || null,
          roomNumber: previousRoomNumber || null,
          cottageId: previousCottageId || null,
          cottageNumber: previousCottageNumber || null,
          totalPrice: previousTotalPrice,
        });
        showSuccessNotification({ title: 'Transfer Reversed', description: 'The reservation has been restored to its previous assignment and price.' });
      },
    });
    setTransferOpen(false);
    setActiveBookingId(null);
    setTransferStaffId('');
    setTransferRoomId('');
  };

  // Check In (room/cottage only)
  const openCheckIn = (id: string) => {
    setActiveBookingId(id);
    setCheckInOpen(true);
  };

  const handleConfirmCheckIn = () => {
    if (!activeBookingId) return;
    const booking = bookings.find((b) => b.id === activeBookingId);
    if (!booking) return;

    if (booking.status !== 'confirmed') {
      showErrorNotification({
        title: 'Cannot Check In',
        description: 'Only confirmed reservations can be checked in. Approve it first.',
      });
      setCheckInOpen(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(booking.checkInDate + 'T00:00:00');
    if (checkIn.getTime() !== today.getTime()) {
      showErrorNotification({
        title: 'Cannot Check In',
        description: `Check-in is only allowed on the scheduled reservation date (${booking.checkInDate}). Today is ${today.toISOString().split('T')[0]}.`,
      });
      setCheckInOpen(false);
      return;
    }

    updateBooking(activeBookingId, {
      status: 'checked-in',
      paymentStatus: 'completed',
      checkInTime: new Date().toISOString(),
    });

    showActionNotification({
      title: 'Guest Checked In',
      description: `Guest ${booking.guestName} has been checked in to Room ${booking.roomNumber}.`,
      actionLabel: 'Undo',
      onAction: () => {
        updateBooking(activeBookingId, {
          status: 'confirmed',
          paymentStatus: 'pending',
          checkInTime: undefined,
        });
        showSuccessNotification({ title: 'Check-In Reversed', description: 'The reservation has been restored to confirmed status.' });
      },
    });
    setCheckInOpen(false);
    setActiveBookingId(null);
  };

  const renderActions = (r: UnifiedReservation) => {
    const isRoomOrCottage = r.type === 'room' || r.type === 'cottage';
    const booking = r.raw as Booking;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(r.dateStart + 'T00:00:00');
    const isBookingDay = startDate.getTime() <= today.getTime();

    return (
      <div className="flex gap-1 flex-wrap">
        {r.status === 'pending' && (
          <>
            <button
              onClick={() => isBookingDay && handleApproveReservation(r.id, r.type)}
              disabled={!isBookingDay}
              className={`px-2 py-1 text-white text-xs rounded transition ${
                isBookingDay
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed opacity-60'
              }`}
              title={isBookingDay ? 'Approve' : `Approval is only allowed on or after the booking date (${r.dateStart})`}
            >
              Approve
            </button>
            <button
              onClick={() => handleRejectReservation(r.id, r.type)}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
              title="Reject"
            >
              Reject
            </button>
          </>
        )}
        {isRoomOrCottage && r.status === 'confirmed' && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkInDate = new Date(booking.checkInDate + 'T00:00:00');
          const isCheckInDay = checkInDate.getTime() === today.getTime();
          return (
            <button
              onClick={() => isCheckInDay && openCheckIn(booking.id)}
              disabled={!isCheckInDay}
              className={`px-2 py-1 text-white text-xs rounded transition flex items-center gap-1 ${
                isCheckInDay
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed opacity-60'
              }`}
              title={isCheckInDay ? 'Check In' : `Check-in is only allowed on ${booking.checkInDate}`}
            >
              <LogIn size={12} />
              Check In
            </button>
          );
        })()}
        {isRoomOrCottage && (
          <button
            onClick={() => openTransfer(r.id)}
            className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition flex items-center gap-1"
            title="Transfer to Staff"
          >
            <Send size={12} />
            Transfer
          </button>
        )}
        {(r.status === 'checked-out' || r.status === 'cancelled' || r.status === 'rejected' || r.status === 'completed') && (
          <button
            onClick={() => handleDeleteClick(r.id, r.type)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Delete"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        )}
      </div>
    );
  };

  const typeIcon = (type: string) => {
    const map: Record<string, React.ElementType> = {
      room: BedDouble,
      cottage: Home,
      facility: Waves,
      event: PartyPopper,
    };
    return map[type] || List;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    Showing {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        viewMode === 'list'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <List size={16} />
                      List
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        viewMode === 'calendar'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Calendar size={16} />
                      Calendar
                    </button>
                  </div>
                </div>

                {/* Type Filter Tabs */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {typeTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setTypeFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                          typeFilter === tab.key
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          typeFilter === tab.key
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Status Filter Tabs */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                        statusFilter === tab.key
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        statusFilter === tab.key
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar View */}
              {viewMode === 'calendar' ? (
                <div className="p-4">
                  <ReservationCalendar bookings={bookings} rooms={rooms} />
                </div>
              ) : (
                <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Guest Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Total Price
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No reservations found for this filter.
                        </td>
                      </tr>
                    ) : filteredReservations.map((r) => {
                      const Icon = typeIcon(r.type);
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                              <Icon size={14} className="text-teal-600" />
                              {r.typeLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-800 font-medium">
                            {r.guestName}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {r.guestEmail}
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-semibold">
                            {r.itemLabel}
                          </td>
                          <td className="px-6 py-4 text-gray-700 text-sm">
                            {r.dateLabel}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={statusColors[r.status] || 'bg-gray-100 text-gray-800'}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-semibold">
                            ₱{r.totalPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {renderActions(r)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredReservations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No reservations found for this filter.</p>
                ) : (
                  filteredReservations.map((r) => {
                    const Icon = typeIcon(r.type);
                    return (
                      <div
                        key={r.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon size={14} className="text-teal-600" />
                              <span className="text-xs font-semibold text-gray-600">{r.typeLabel}</span>
                            </div>
                            <h3 className="font-semibold text-gray-800">{r.guestName}</h3>
                            <p className="text-xs text-gray-600">{r.guestEmail}</p>
                            <p className="text-sm font-semibold text-gray-700 mt-1">{r.itemLabel}</p>
                          </div>
                          <Badge
                            className={`${statusColors[r.status] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1).replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <p className="font-semibold text-xs">{r.dateLabel}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Price:</span>
                            <p className="font-semibold">₱{r.totalPrice.toLocaleString()}</p>
                          </div>
                        </div>
                        {renderActions(r)}
                      </div>
                    );
                  })
                )}
              </div>
                </>
              )}
            </div>
          </div>
        </main>

        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          title="Delete Reservation"
          description="Are you sure you want to delete this reservation? This action cannot be undone and the booking record will be permanently removed from the system."
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setBookingToDelete(null);
          }}
        />

        {/* Transfer to Staff Modal */}
        <Dialog open={transferOpen} onOpenChange={(open) => !open && setTransferOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Reservation to Staff</DialogTitle>
              <DialogDescription>
                Hand this reservation to a staff member for check-in handling. Room assignment is optional — leaving it blank clears any current room assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff member <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferStaffId}
                  onChange={(e) => setTransferStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a staff member...</option>
                  {staffAccounts
                    .filter((s) => s.status === 'active')
                    .map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName} — {staff.position}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeBooking?.bookingType === 'cottage' ? 'Cottage' : 'Room'} (optional)
                </label>
                <select
                  value={transferRoomId}
                  onChange={(e) => setTransferRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No assignment</option>
                  {activeBooking?.bookingType === 'cottage'
                    ? availableCottages.map((cottage) => (
                        <option key={cottage.id} value={cottage.id}>
                          Cottage {cottage.cottageNumber} — {cottage.name} (₱{cottage.pricePerNight}/night, sleeps {cottage.capacity})
                        </option>
                      ))
                    : availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.roomNumber} — {room.type} (₱{room.pricePerNight}/night, sleeps {room.capacity})
                        </option>
                      ))
                  }
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choosing "No assignment" clears the current assignment so the staff can assign one themselves.
                </p>
              </div>
              {activeBooking && transferRoomId && newTotalPrice !== activeBooking.totalPrice && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  <p className="font-semibold text-blue-800">Price Adjustment</p>
                  <p className="text-blue-700 mt-1">
                    Previous: ₱{activeBooking.totalPrice.toLocaleString()} → New: ₱{newTotalPrice.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmTransfer}
                disabled={!transferStaffId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send size={16} className="mr-2" />
                Transfer to Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Check In Confirmation Modal */}
        <Dialog open={checkInOpen} onOpenChange={(open) => !open && setCheckInOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-blue-700">Confirm Guest Check-In</DialogTitle>
              <DialogDescription>
                You are about to check in <span className="font-semibold text-gray-900">{activeBooking?.guestName}</span>
                {activeBooking?.roomNumber ? ` to Room ${activeBooking.roomNumber}.` : '.'} The reservation status will change to "Checked In" and the room will be marked as occupied. Only staff can check out guests afterward.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckInOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCheckIn}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <LogIn size={16} className="mr-2" />
                Confirm Check-In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

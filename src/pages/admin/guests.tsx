import React, { useState } from 'react';
import { AdminSidebar } from '../../components/admin/sidebar';
import { AdminHeader } from '../../components/admin/header';
import { useBooking } from '../../lib/context';
import { Badge } from '../../components/ui/badge';
import { Trash2, Search, Clock, Eye, Check, X, Printer, History } from 'lucide-react';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';
import { EditGuestModal } from '../../components/admin/edit-guest-modal';
import { ReceiptModal } from '../../components/customer/receipt-modal';

interface GuestData {
  name: string;
  email: string;
  phone?: string;
}

export default function GuestsPage() {
  const { bookings, deleteBooking, updateBooking } = useBooking();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [historyGuest, setHistoryGuest] = useState<string | null>(null);

  const allBookings = bookings.map((b) => ({
    ...b,
    bookingRef: `REF-${b.id.substring(0, 8)}`,
    bookedAt: new Date(b.createdAt).toLocaleString(),
  }));

  const filteredBookings = allBookings.filter((booking) => {
    const matchesSearch =
      booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleAcceptBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    updateBooking(bookingId, {
      status: 'confirmed',
      paymentStatus: 'completed'
    });

    showSuccessNotification({
      title: 'Booking Accepted',
      description: `Booking for ${booking.guestName} has been confirmed.`,
    });
  };

  const handleRejectBooking = (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    updateBooking(bookingId, { status: 'rejected' });

    showErrorNotification({
      title: 'Booking Rejected',
      description: `Booking for ${booking.guestName} has been rejected.`,
    });
  };

  const handleViewScreenshot = (screenshot: string) => {
    setSelectedScreenshot(screenshot);
    setShowScreenshotModal(true);
  };

  const handleOpenEditModal = (guest: GuestData) => {
    setSelectedGuest(guest);
    setIsEditModalOpen(true);
  };

  const handleSaveGuest = (updatedGuest: GuestData) => {
    const booking = bookings.find(b => b.guestEmail === selectedGuest?.email);
    if (booking) {
      updateBooking(booking.id, {
        guestName: updatedGuest.name,
        guestEmail: updatedGuest.email,
        guestPhone: updatedGuest.phone || '',
      });
    }
    showSuccessNotification({
      title: 'Guest Updated',
      description: `Guest information for ${updatedGuest.name} has been updated successfully.`,
    });
  };

  const handleGenerateReceipt = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setReceiptBooking(booking);
      setShowReceipt(true);
    }
  };

  const handleViewHistory = (email: string) => {
    setHistoryGuest(email);
  };

  const handleDeleteGuest = (bookingId: string) => {
    if (confirm('Delete this booking? This action cannot be undone.')) {
      deleteBooking(bookingId);
      showErrorNotification({
        title: 'Booking Deleted',
        description: `Booking has been deleted.`,
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Guest List
                </h2>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg min-w-xs">
                    <Search size={18} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or booking ref..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-gray-50 border-0 outline-none text-gray-700"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Booking Ref
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Guest Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Check-In Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Booked Time
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Payment Method
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-4 text-gray-800 font-semibold">
                          {booking.bookingRef}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{booking.guestName}</p>
                            <p className="text-xs text-gray-500">{booking.guestEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {booking.roomNumber || booking.roomId || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {new Date(booking.checkInDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-gray-700 text-sm">
                            <Clock size={14} />
                            {booking.bookedAt}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={
                              booking.paymentMethod === 'gcash' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                              booking.paymentMethod === 'maya' ? 'bg-purple-50 border-purple-300 text-purple-700' :
                              'bg-gray-50 border-gray-300 text-gray-700'
                            }
                          >
                            {booking.paymentMethod ? booking.paymentMethod.toUpperCase() : 'Not Set'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-300' :
                            booking.status === 'checked-in' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            booking.status === 'checked-out' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                            booking.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAcceptBooking(booking.id)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition flex items-center gap-1"
                                  title="Accept Booking"
                                >
                                  <Check size={14} />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(booking.id)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition flex items-center gap-1"
                                  title="Reject Booking"
                                >
                                  <X size={14} />
                                  Reject
                                </button>
                              </>
                            )}
                            {booking.status !== 'pending' && (
                              <button
                                onClick={() => handleDeleteGuest(booking.id)}
                                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition flex items-center gap-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleGenerateReceipt(booking.id)}
                              className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition flex items-center gap-1"
                              title="Print Receipt"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => handleViewHistory(booking.guestEmail)}
                              className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition flex items-center gap-1"
                              title="View Guest History"
                            >
                              <History size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {filteredBookings.length === 0 && (
                    <tbody>
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No guests found
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* Screenshot Modal */}
        {showScreenshotModal && selectedScreenshot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Payment Proof</h2>
                <button
                  onClick={() => {
                    setShowScreenshotModal(false);
                    setSelectedScreenshot(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <img
                  src={selectedScreenshot}
                  alt="Transaction proof"
                  className="w-full rounded-lg border border-gray-300 shadow-lg"
                />
              </div>
            </div>
          </div>
        )}

        <EditGuestModal
          guest={selectedGuest}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGuest(null);
          }}
          onSave={handleSaveGuest}
        />

        <ReceiptModal
          booking={receiptBooking}
          isOpen={showReceipt}
          onClose={() => { setShowReceipt(false); setReceiptBooking(null); }}
        />

        {/* Guest History Modal */}
        {historyGuest && (() => {
          const guestBookings = bookings.filter((b) => b.guestEmail === historyGuest);
          const guestName = guestBookings[0]?.guestName || historyGuest;
          const totalSpent = guestBookings.reduce((sum, b) => sum + b.totalPrice, 0);
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <History size={20} /> Guest History
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{guestName} · {historyGuest}</p>
                  </div>
                  <button onClick={() => setHistoryGuest(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Bookings</p>
                      <p className="text-2xl font-bold text-blue-600">{guestBookings.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600">₱{totalSpent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Last Visit</p>
                      <p className="text-lg font-bold text-gray-900">
                        {guestBookings.length > 0
                          ? new Date(guestBookings.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())[0].checkInDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-auto flex-1">
                  {guestBookings.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No booking history found for this guest.</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Booking ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-In</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Check-Out</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {guestBookings.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()).map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{b.roomNumber || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{new Date(b.checkInDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{new Date(b.checkOutDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <Badge className={
                                b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                b.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                                b.status === 'checked-out' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {b.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">₱{b.totalPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

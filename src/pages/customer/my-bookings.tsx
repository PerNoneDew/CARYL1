import { useState } from 'react';
import { CustomerLayout } from './layout';
import { useBooking } from '../../lib/context';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, DoorOpen, Users, X, Edit2, Download, Clock, Waves, Music, PartyPopper, Home } from 'lucide-react';
import { EditCustomerBookingModal } from '../../components/customer/edit-booking-modal';
import { ReceiptModal } from '../../components/customer/receipt-modal';
import { Booking, FacilityBooking, EventBooking } from '../../lib/types';
import { showSuccessNotification } from '../../lib/notifications';

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  'checked-in': 'bg-green-100 text-green-800',
  'checked-out': 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

function facilityLabel(type: string) {
  return type === 'swimming-pool' ? 'Swimming Pool' : type === 'videoke' ? 'Videoke' : type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
}

function eventLabel(type: string, name?: string) {
  if (name) return name;
  return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
}

export default function MyBookingsPage() {
  const { bookings, facilityBookings, eventBookings, deleteBooking, updateBooking, currentUser, eventTypePrices } = useBooking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ booking?: Booking | null }>({});

  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      deleteBooking(bookingId);
      showSuccessNotification({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleSaveBooking = (updatedBooking: Booking) => {
    updateBooking(updatedBooking.id, updatedBooking);
    showSuccessNotification({
      title: 'Booking Updated',
      description: 'Your booking details have been updated.',
    });
  };

  const openReceiptModal = (booking?: Booking | null) => {
    setReceiptData({ booking });
    setIsReceiptOpen(true);
  };

  const myRoomBookings = bookings.filter((b) => b.guestEmail === currentUser.email);
  const myFacilityBookings = facilityBookings.filter((b) => b.guestEmail === currentUser.email);
  const myEventBookings = eventBookings.filter((b) => b.guestEmail === currentUser.email);

  const upcomingBookings = myRoomBookings.filter((b) => new Date(b.checkInDate) > new Date());
  const pastBookings = myRoomBookings.filter((b) => new Date(b.checkOutDate) <= new Date());
  const currentBookings = myRoomBookings.filter(
    (b) => new Date(b.checkInDate) <= new Date() && new Date(b.checkOutDate) > new Date()
  );

  const getEventName = (type: string) => {
    const et = eventTypePrices.find((p) => p.type === type);
    return et?.name || type;
  };

  return (
    <CustomerLayout>
      <main className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Bookings</h1>

        {/* Facility Bookings (Swimming Pool, Videoke) */}
        {myFacilityBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Facility Bookings</h2>
            <div className="space-y-4">
              {myFacilityBookings.map((fb) => {
                const Icon = fb.facilityType === 'swimming-pool' ? Waves : Music;
                return (
                  <Card key={fb.id} className="border-l-4 border-l-cyan-500 hover:shadow-lg transition">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-20 h-20 rounded-lg bg-cyan-50 flex items-center justify-center">
                              <Icon size={36} className="text-cyan-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Booking ID: {fb.id}</p>
                              <p className="text-2xl font-bold text-gray-800">{facilityLabel(fb.facilityType)}</p>
                              <Badge className={statusColors[fb.status] || 'bg-gray-100 text-gray-800'}>
                                {fb.status.charAt(0).toUpperCase() + fb.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-blue-600" />
                              <span>{new Date(fb.bookingDate).toLocaleDateString()}</span>
                            </div>
                            {fb.startTime && fb.endTime && (
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-cyan-600" />
                                <span>{fb.startTime} - {fb.endTime}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-purple-600" />
                              <span>{fb.numberOfGuests} guest{fb.numberOfGuests > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-right">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Total Price</p>
                            <p className="text-3xl font-bold text-gray-800">₱{fb.totalPrice.toLocaleString()}</p>
                          </div>
                          {fb.paymentStatus && (
                            <Badge className={fb.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              Payment: {fb.paymentStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Event Bookings (Function Hall) */}
        {myEventBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Event Bookings</h2>
            <div className="space-y-4">
              {myEventBookings.map((eb) => (
                <Card key={eb.id} className="border-l-4 border-l-amber-500 hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-20 h-20 rounded-lg bg-amber-50 flex items-center justify-center">
                            <PartyPopper size={36} className="text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Booking ID: {eb.id}</p>
                            <p className="text-2xl font-bold text-gray-800">{eventLabel(eb.eventType, eb.eventName) || getEventName(eb.eventType)}</p>
                            <Badge className={statusColors[eb.status] || 'bg-gray-100 text-gray-800'}>
                              {eb.status.charAt(0).toUpperCase() + eb.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span>{new Date(eb.eventDate).toLocaleDateString()}</span>
                          </div>
                          {eb.eventEndDate && eb.eventEndDate !== eb.eventDate && (
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-orange-600" />
                              <span>Ends: {new Date(eb.eventEndDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-purple-600" />
                            <span>{eb.numberOfGuests} guest{eb.numberOfGuests > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Total Price</p>
                          <p className="text-3xl font-bold text-gray-800">₱{eb.totalPrice.toLocaleString()}</p>
                        </div>
                        {eb.paymentStatus && (
                          <Badge className={eb.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            Payment: {eb.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Current Room/Cottage Bookings */}
        {currentBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current Stay</h2>
            <div className="space-y-4">
              {currentBookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-green-500 hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-4xl font-bold text-green-600 bg-green-50 w-20 h-20 rounded-lg flex items-center justify-center">
                            {booking.roomNumber || booking.cottageNumber || <Home size={32} />}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Booking ID: {booking.id}</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {booking.bookingType === 'cottage' ? `Cottage ${booking.cottageNumber || ''}` : `Room ${booking.roomNumber || ''}`}
                            </p>
                            <Badge className={statusColors[booking.status]}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-blue-600" />
                              <span>{new Date(booking.checkInDate).toLocaleDateString()} to {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                            </div>
                            {booking.checkInTime && (
                              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                                <Clock size={12} className="text-green-600" />
                                <span>Check-in: {new Date(booking.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                            {booking.checkOutTime && (
                              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                                <Clock size={12} className="text-red-600" />
                                <span>Check-out: {new Date(booking.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-purple-600" />
                            <span>{booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Total Price</p>
                          <p className="text-3xl font-bold text-gray-800">₱{booking.totalPrice}</p>
                        </div>
                        <button onClick={() => openReceiptModal(booking)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                          <Download size={16} /> Receipt
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Room/Cottage Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Bookings</h2>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-4xl font-bold text-blue-600 bg-blue-50 w-20 h-20 rounded-lg flex items-center justify-center">
                            {booking.roomNumber || booking.cottageNumber || <Home size={32} />}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Booking ID: {booking.id}</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {booking.bookingType === 'cottage' ? `Cottage ${booking.cottageNumber || ''}` : `Room ${booking.roomNumber || ''}`}
                            </p>
                            <Badge className={statusColors[booking.status]}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-blue-600" />
                              <span>{new Date(booking.checkInDate).toLocaleDateString()} to {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                            </div>
                            {booking.checkInTime && (
                              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                                <Clock size={12} className="text-green-600" />
                                <span>Check-in: {new Date(booking.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                            {booking.checkOutTime && (
                              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                                <Clock size={12} className="text-red-600" />
                                <span>Check-out: {new Date(booking.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-purple-600" />
                            <span>{booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Total Price</p>
                          <p className="text-3xl font-bold text-gray-800">₱{booking.totalPrice}</p>
                        </div>
                        <div className="flex gap-2 flex-col">
                          <button onClick={() => openReceiptModal(booking)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                            <Download size={16} /> Receipt
                          </button>
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button onClick={() => handleEditBooking(booking)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                              <Edit2 size={16} /> Edit
                            </button>
                          )}
                          {booking.status !== 'checked-out' && (
                            <button onClick={() => handleCancel(booking.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                              <X size={16} /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Room/Cottage Bookings */}
        {pastBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Past Bookings</h2>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-gray-400 opacity-75 hover:opacity-100 transition">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-4xl font-bold text-gray-400 bg-gray-100 w-20 h-20 rounded-lg flex items-center justify-center">
                            {booking.roomNumber || booking.cottageNumber || <Home size={32} />}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Booking ID: {booking.id}</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {booking.bookingType === 'cottage' ? `Cottage ${booking.cottageNumber || ''}` : `Room ${booking.roomNumber || ''}`}
                            </p>
                            <Badge className={statusColors[booking.status]}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-blue-600" />
                              <span>{new Date(booking.checkInDate).toLocaleDateString()} to {new Date(booking.checkOutDate).toLocaleDateString()}</span>
                            </div>
                            {booking.checkInTime && (
                              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                                <Clock size={12} className="text-green-600" />
                                <span>Check-in: {new Date(booking.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                            {booking.checkOutTime && (
                              <div className="flex items-center gap-2 pl-6 text-xs text-gray-500">
                                <Clock size={12} className="text-red-600" />
                                <span>Check-out: {new Date(booking.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-purple-600" />
                            <span>{booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Total Price</p>
                          <p className="text-3xl font-bold text-gray-800">₱{booking.totalPrice}</p>
                        </div>
                        <button onClick={() => openReceiptModal(booking)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                          <Download size={16} /> Receipt
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {myRoomBookings.length === 0 && myFacilityBookings.length === 0 && myEventBookings.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DoorOpen size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No bookings yet</p>
              <p className="text-gray-500 text-sm mt-2">Start exploring and make your first booking!</p>
            </CardContent>
          </Card>
        )}

        <EditCustomerBookingModal
          booking={selectedBooking}
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedBooking(null); }}
          onSave={handleSaveBooking}
        />

        <ReceiptModal
          booking={receiptData.booking}
          isOpen={isReceiptOpen}
          onClose={() => { setIsReceiptOpen(false); setReceiptData({}); }}
        />
      </main>
    </CustomerLayout>
  );
}

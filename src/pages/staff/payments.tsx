import { useState, useMemo } from 'react';
import { StaffSidebar } from '../../components/staff/staff-sidebar';
import { StaffHeader } from '../../components/staff/staff-header';
import { useBooking } from '../../lib/context';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Booking, EventBooking, FacilityBooking, PaymentMethod } from '../../lib/types';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';
import {
  Search,
  Wallet,
  CheckCircle,
  Clock,
  X,
  User,
  Mail,
  Calendar,
  BedDouble,
  PartyPopper,
  Waves,
  Home,
} from 'lucide-react';

type PaymentType = 'room' | 'cottage' | 'event' | 'facility';

interface PaymentRow {
  id: string;
  type: PaymentType;
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  paymentDate: string;
  status: string;
  method: string;
  reference?: string;
  raw: Booking | EventBooking | FacilityBooking;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
};

const methodLabels: Record<string, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  counter: 'Counter (Cash)',
};

export default function StaffPaymentsPage() {
  const { currentUser, bookings, eventBookings, facilityBookings, recordPayment, recordEventPayment, recordFacilityPayment } = useBooking();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [acceptingPayment, setAcceptingPayment] = useState<PaymentRow | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter');
  const [paymentReference, setPaymentReference] = useState('');

  const staffName = currentUser.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    : currentUser.name || currentUser.email;

  const payments = useMemo<PaymentRow[]>(() => {
    const roomPayments: PaymentRow[] = bookings
      .filter((b) => b.bookingType === 'room')
      .map((b) => ({
        id: b.id,
        type: 'room' as const,
        bookingRef: `ROOM-${b.id.substring(0, 8)}`,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        amount: b.totalPrice,
        paymentDate: b.checkInDate,
        status: b.paymentStatus || (b.status === 'checked-out' || b.status === 'confirmed' ? 'completed' : 'pending'),
        method: b.paymentMethod || '',
        reference: b.paymentReference,
        raw: b,
      }));

    const cottagePayments: PaymentRow[] = bookings
      .filter((b) => b.bookingType === 'cottage')
      .map((b) => ({
        id: b.id,
        type: 'cottage' as const,
        bookingRef: `COTTAGE-${b.id.substring(0, 8)}`,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        amount: b.totalPrice,
        paymentDate: b.checkInDate,
        status: b.paymentStatus || (b.status === 'checked-out' || b.status === 'confirmed' ? 'completed' : 'pending'),
        method: b.paymentMethod || '',
        reference: b.paymentReference,
        raw: b,
      }));

    const eventPayments: PaymentRow[] = eventBookings.map((b) => ({
      id: b.id,
      type: 'event' as const,
      bookingRef: `EVENT-${b.id.substring(0, 8)}`,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      amount: b.totalPrice,
      paymentDate: b.eventDate,
      status: b.paymentStatus || (b.status === 'confirmed' ? 'completed' : 'pending'),
      method: b.paymentMethod || '',
      reference: b.paymentReference,
      raw: b,
    }));

    const facPayments: PaymentRow[] = facilityBookings.map((b) => ({
      id: b.id,
      type: 'facility' as const,
      bookingRef: `FAC-${b.id.substring(0, 8)}`,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      amount: b.totalPrice,
      paymentDate: b.bookingDate,
      status: b.paymentStatus || (b.status === 'confirmed' ? 'completed' : 'pending'),
      method: b.paymentMethod || '',
      reference: b.paymentReference,
      raw: b,
    }));

    return [...roomPayments, ...cottagePayments, ...eventPayments, ...facPayments].sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }, [bookings, eventBookings, facilityBookings]);

  const filteredPayments = payments.filter((p) => {
    const typeMatch = filterType === 'all' ? true : p.type === filterType;
    const statusMatch = filterStatus === 'all' ? true : p.status === filterStatus;
    const searchMatch = searchTerm
      ? p.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bookingRef.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return typeMatch && statusMatch && searchMatch;
  });

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const completedCount = payments.filter((p) => p.status === 'completed').length;

  const handleAcceptPayment = async () => {
    if (!acceptingPayment) return;
    try {
      const ref = paymentMethod !== 'counter' ? paymentReference : undefined;
      if (acceptingPayment.type === 'room' || acceptingPayment.type === 'cottage') {
        await recordPayment(acceptingPayment.id, paymentMethod, acceptingPayment.amount, ref, undefined, staffName);
      } else if (acceptingPayment.type === 'event') {
        await recordEventPayment(acceptingPayment.id, paymentMethod, acceptingPayment.amount, ref, undefined, staffName);
      } else {
        await recordFacilityPayment(acceptingPayment.id, paymentMethod, acceptingPayment.amount, ref, undefined, staffName);
      }
      showSuccessNotification({
        title: 'Payment Accepted',
        description: `Payment for ${acceptingPayment.guestName} has been recorded. Accepted by ${staffName}.`,
      });
      setAcceptingPayment(null);
      setPaymentMethod('counter');
      setPaymentReference('');
    } catch {
      showErrorNotification({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
      });
    }
  };

  const getTypeIcon = (type: PaymentType) => {
    switch (type) {
      case 'room': return <BedDouble size={16} className="text-blue-600" />;
      case 'cottage': return <Home size={16} className="text-green-600" />;
      case 'event': return <PartyPopper size={16} className="text-purple-600" />;
      case 'facility': return <Waves size={16} className="text-teal-600" />;
    }
  };

  const getTypeBadge = (type: PaymentType) => {
    switch (type) {
      case 'room': return <Badge className="bg-blue-100 text-blue-800">Room</Badge>;
      case 'cottage': return <Badge className="bg-green-100 text-green-800">Cottage</Badge>;
      case 'event': return <Badge className="bg-purple-100 text-purple-800">Event</Badge>;
      case 'facility': return <Badge className="bg-teal-100 text-teal-800">Facility</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <StaffSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-1">Payments</h2>
              <p className="text-gray-600">Accept payments from customers in person (cash/counter) or online (GCash/Maya). Your name is recorded with each accepted payment.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Wallet size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                      <Clock size={24} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by guest name or booking ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Types</option>
                <option value="room">Room</option>
                <option value="cottage">Cottage</option>
                <option value="event">Event</option>
                <option value="facility">Facility</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Payment Cards */}
            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Wallet size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">No payments found</p>
                  <p className="text-gray-500 text-sm mt-1">Try adjusting your filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <Card key={`${payment.type}-${payment.id}`} className="hover:shadow-lg transition">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex flex-col items-center">
                            {getTypeIcon(payment.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <h3 className="text-lg font-bold text-gray-800">{payment.guestName}</h3>
                              {getTypeBadge(payment.type)}
                              <Badge className={statusColors[payment.status] || 'bg-gray-100 text-gray-800'}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail size={12} /> {payment.guestEmail}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{payment.bookingRef}</span>
                              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(payment.paymentDate).toLocaleDateString()}</span>
                              <span className="font-semibold text-gray-800">₱{payment.amount.toLocaleString()}</span>
                              {payment.method && (
                                <span className="text-gray-500">via {methodLabels[payment.method] || payment.method}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => {
                                setAcceptingPayment(payment);
                                setPaymentMethod('counter');
                                setPaymentReference('');
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition shadow-sm"
                            >
                              <Wallet size={18} />
                              Accept Payment
                            </button>
                          )}
                          {payment.status === 'completed' && (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                              <CheckCircle size={16} /> Payment Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Accept Payment Modal */}
      {acceptingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Accept Payment</h2>
              <button
                onClick={() => { setAcceptingPayment(null); setPaymentReference(''); }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Guest</span>
                  <span className="font-semibold text-gray-800">{acceptingPayment.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Booking Ref</span>
                  <span className="font-mono text-sm text-gray-700">{acceptingPayment.bookingRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="font-bold text-lg text-green-600">₱{acceptingPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accepted by</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <User size={14} /> {staffName}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['counter', 'gcash', 'maya'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition border ${
                        paymentMethod === m
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {methodLabels[m]}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'counter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter transaction reference..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                <User size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  This payment will be recorded as accepted by <strong>{staffName}</strong>. The admin will see your name on the payment record.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setAcceptingPayment(null); setPaymentReference(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptPayment}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

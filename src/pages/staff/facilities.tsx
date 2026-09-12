import { useState } from 'react';
import { useBooking } from '../../lib/context';
import { StaffSidebar } from '../../components/staff/staff-sidebar';
import { StaffHeader } from '../../components/staff/staff-header';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Waves, Music, Search, Home, Bath, Calendar } from 'lucide-react';

type Tab = 'all' | 'swimming-pool' | 'videoke' | 'function-hall' | 'cottage';

export default function StaffFacilitiesPage() {
  const {
    facilityBookings,
    eventBookings,
    bookings,
    eventTypePrices,
  } = useBooking();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const q = searchQuery.trim().toLowerCase();

  const getEventName = (type: string) => {
    const et = eventTypePrices.find((p) => p.type === type);
    return et?.name || type;
  };

  const cottageBookings = bookings.filter((b) => b.bookingType === 'cottage');

  const filteredFacility = facilityBookings.filter((b) => {
    const matchesSearch = !q || b.guestName.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || activeTab === 'swimming-pool' || activeTab === 'videoke';
    const matchesType = activeTab === 'all' || b.facilityType === activeTab;
    return matchesSearch && matchesTab && matchesType;
  });

  const filteredEvents = eventBookings.filter((b) => {
    const matchesSearch = !q || b.guestName.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || activeTab === 'function-hall';
    return matchesSearch && matchesTab;
  });

  const filteredCottages = cottageBookings.filter((b) => {
    const matchesSearch = !q || b.guestName.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || activeTab === 'cottage';
    return matchesSearch && matchesTab;
  });

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'all', label: 'All', icon: Calendar, count: facilityBookings.length + eventBookings.length + cottageBookings.length },
    { key: 'swimming-pool', label: 'Swimming Pool', icon: Waves, count: facilityBookings.filter((b) => b.facilityType === 'swimming-pool').length },
    { key: 'videoke', label: 'Videoke', icon: Music, count: facilityBookings.filter((b) => b.facilityType === 'videoke').length },
    { key: 'function-hall', label: 'Function Hall', icon: Bath, count: eventBookings.length },
    { key: 'cottage', label: 'Cottages', icon: Home, count: cottageBookings.length },
  ];

  const showFacility = activeTab === 'all' || activeTab === 'swimming-pool' || activeTab === 'videoke';
  const showEvents = activeTab === 'all' || activeTab === 'function-hall';
  const showCottages = activeTab === 'all' || activeTab === 'cottage';

  const totalPending =
    facilityBookings.filter((b) => b.status === 'pending').length +
    eventBookings.filter((b) => b.status === 'pending').length +
    cottageBookings.filter((b) => b.status === 'pending').length;

  const totalConfirmed =
    facilityBookings.filter((b) => b.status === 'confirmed').length +
    eventBookings.filter((b) => b.status === 'confirmed').length +
    cottageBookings.filter((b) => b.status === 'confirmed').length;

  const badgeClass = (status: string) =>
    status === 'confirmed' ? 'bg-green-100 text-green-800' :
    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
    status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
    status === 'completed' ? 'bg-gray-100 text-gray-800' :
    status === 'checked-out' ? 'bg-gray-100 text-gray-800' :
    'bg-red-100 text-red-800';

  return (
    <div className="flex h-screen bg-gray-100">
      <StaffSidebar />
      <div className="flex-1 overflow-auto">
        <StaffHeader />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Facilities & Services</h1>
            <p className="text-gray-600 mt-2">View swimming pool, videoke, function hall, and cottage bookings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Waves size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{facilityBookings.length}</p>
                    <p className="text-xs text-gray-500">Pool & Videoke</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Bath size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{eventBookings.length}</p>
                    <p className="text-xs text-gray-500">Function Hall</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-green-600">{totalConfirmed}</p>
                <p className="text-xs text-gray-500">Confirmed</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <Icon size={18} /> {tab.label}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative inline-block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Facility Bookings (Pool & Videoke) */}
          {showFacility && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Swimming Pool & Videoke</h2>
              <Card>
                <CardContent className="p-0">
                  {filteredFacility.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">No facility bookings found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredFacility.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{booking.guestName}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {booking.facilityType === 'swimming-pool' ? 'Swimming Pool' : 'Videoke'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{booking.bookingDate}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{booking.numberOfGuests}</td>
                              <td className="px-6 py-4">
                                <Badge className={badgeClass(booking.status)}>{booking.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">₱{booking.totalPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Function Hall (Events) */}
          {showEvents && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Function Hall</h2>
              <Card>
                <CardContent className="p-0">
                  {filteredEvents.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">No function hall bookings found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredEvents.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{booking.guestName}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{booking.eventName || getEventName(booking.eventType)}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{new Date(booking.eventDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{booking.eventEndDate ? new Date(booking.eventEndDate).toLocaleDateString() : '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{booking.numberOfGuests}</td>
                              <td className="px-6 py-4">
                                <Badge className={badgeClass(booking.status)}>{booking.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">₱{booking.totalPrice.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cottage Bookings */}
          {showCottages && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cottages</h2>
              <Card>
                <CardContent className="p-0">
                  {filteredCottages.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">No cottage bookings found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cottage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredCottages.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{booking.guestName}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">Cottage {booking.cottageNumber || ''}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{new Date(booking.checkInDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{booking.numberOfGuests}</td>
                              <td className="px-6 py-4">
                                <Badge className={badgeClass(booking.status)}>{booking.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">₱{booking.totalPrice.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

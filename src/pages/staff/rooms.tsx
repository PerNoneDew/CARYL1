import { useState } from 'react';
import { StaffSidebar } from '../../components/staff/staff-sidebar';
import { StaffHeader } from '../../components/staff/staff-header';
import { useBooking } from '../../lib/context';
import { Badge } from '../../components/ui/badge';
import { Search, BedDouble, Users } from 'lucide-react';

const statusColors: { [key: string]: string } = {
  available: 'bg-green-100 text-green-800 border-green-200',
  reserved: 'bg-blue-100 text-blue-800 border-blue-200',
  occupied: 'bg-red-100 text-red-800 border-red-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export default function StaffRoomsPage() {
  const { rooms, bookings } = useBooking();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');

  const filteredRooms = rooms.filter((room) => {
    const matchesType = !searchType || room.type === searchType;
    const matchesQuery = !searchQuery || room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  const getCurrentGuest = (room: any) => {
    const activeBooking = bookings.find(
      (b) =>
        b.roomId === room.id &&
        (b.status === 'confirmed' || b.status === 'checked-in') &&
        new Date(b.checkInDate) <= new Date() &&
        new Date(b.checkOutDate) >= new Date()
    );
    return activeBooking?.guestName;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <StaffSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Room Management</h2>
              <p className="text-sm text-gray-500 mt-1">View-only access to room information and availability</p>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by room number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 sm:w-44"
                >
                  <option value="">All Types</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
            </div>

            {/* Summary bar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredRooms.length} of {rooms.length} rooms
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-gray-600">{rooms.filter((r) => r.status === 'available').length} Available</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-gray-600">{rooms.filter((r) => r.status === 'occupied').length} Occupied</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-gray-600">{rooms.filter((r) => r.status === 'maintenance').length} Maintenance</span>
                </span>
              </div>
            </div>

            {/* Room Card Grid */}
            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <BedDouble size={42} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No rooms found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => {
                  const currentGuest = getCurrentGuest(room);
                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden hover:shadow-lg transition group"
                    >
                      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                        {room.image ? (
                          <img
                            src={room.image}
                            alt={`Room ${room.roomNumber}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-blue-300">
                            <BedDouble size={48} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className={`${statusColors[room.status]} border`}>
                            {room.status === 'reserved' ? 'Reserved' : room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-xl font-bold text-gray-800">Room {room.roomNumber}</h3>
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 capitalize">
                            {room.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Users size={16} />
                            <span>{room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BedDouble size={16} />
                            <span className="capitalize">{room.type} room</span>
                          </div>
                        </div>

                        {room.amenities.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1.5">
                              {room.amenities.slice(0, 3).map((amenity) => (
                                <Badge key={amenity} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {room.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{room.amenities.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Per Night</p>
                            <p className="text-lg font-bold text-gray-800">₱{room.pricePerNight}</p>
                          </div>
                          {currentGuest && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Current Guest</p>
                              <p className="text-sm font-medium text-gray-700">{currentGuest}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

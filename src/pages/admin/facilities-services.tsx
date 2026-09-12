import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { AdminHeader } from '../../components/admin/header';
import { AdminSidebar } from '../../components/admin/sidebar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useBooking } from '../../lib/context';
import type { Cottage, Service } from '../../lib/types';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';
import { Calendar, CheckCircle2, Home, ImagePlus, Music, PartyPopper, Plus, Save, Trash2, Users, Waves, Wrench, X } from 'lucide-react';

const tabs = [
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'videoke', label: 'Videoke', icon: Music },
  { id: 'function-hall', label: 'Function Hall for Events', icon: PartyPopper },
  { id: 'cottage', label: 'Cottage', icon: Home },
] as const;
type TabId = (typeof tabs)[number]['id'];
type ServiceCategory = 'swimming-pool' | 'videoke';
type InventoryStatus = 'available' | 'maintenance' | 'unavailable';
type CottageStatus = 'available' | 'reserved' | 'occupied' | 'maintenance' | 'unavailable';
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const statusLabel: Record<InventoryStatus, string> = { available: 'Available', maintenance: 'Maintenance', unavailable: 'Unavailable' };
const cottageStatusLabel: Record<CottageStatus, string> = { available: 'Available', reserved: 'Reserved', occupied: 'Occupied', maintenance: 'Maintenance', unavailable: 'Unavailable' };

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target?.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function AdminFacilitiesServicesPage() {
  const { services, addService, updateService, deleteService, businessInfo, setBusinessInfo, cottages, addCottage, updateCottage, deleteCottage, eventTypePrices, addEventType, deleteEventType, eventBookings, functionHallPhotos, addFunctionHallPhoto, deleteFunctionHallPhoto } = useBooking();
  const [activeTab, setActiveTab] = useState<TabId>('pool');
  const [modal, setModal] = useState<'service' | 'cottage' | 'event' | null>(null);
  const [editing, setEditing] = useState<Service | Cottage | null>(null);
  const [poolHours, setPoolHours] = useState(businessInfo.poolOperatingHours || '8:00 AM - 8:00 PM');
  const [hallPhotoSaving, setHallPhotoSaving] = useState(false);
  const [hallTables, setHallTables] = useState(String(businessInfo.functionHallTables ?? 0));
  const [hallChairs, setHallChairs] = useState(String(businessInfo.functionHallChairs ?? 0));
  const [hallScheduleStart, setHallScheduleStart] = useState(businessInfo.functionHallScheduleStart || '08:00');
  const [hallScheduleEnd, setHallScheduleEnd] = useState(businessInfo.functionHallScheduleEnd || '22:00');
  const [hallInventorySaving, setHallInventorySaving] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState(new Date().toISOString().split('T')[0]);

  // Inline add form state
  const [showAddService, setShowAddService] = useState(false);
  const [showAddCottage, setShowAddCottage] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', capacity: '', status: 'available' as InventoryStatus, image: '' });
  const [newCottage, setNewCottage] = useState({ name: '', cottageNumber: '', description: '', price: '', capacity: '', status: 'available' as CottageStatus, image: '' });
  const [newEvent, setNewEvent] = useState({ type: '', name: '', description: '', price: '', capacity: '' });
  const [adding, setAdding] = useState(false);

  const serviceCategory: ServiceCategory | null = activeTab === 'pool' ? 'swimming-pool' : activeTab === 'videoke' ? 'videoke' : null;
  const visibleServices = useMemo(() => serviceCategory ? services.filter((item) => item.category === serviceCategory) : [], [services, serviceCategory]);

  // --- Add Service (inline, like Rooms) ---
  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price) {
      showErrorNotification({ title: 'Missing Fields', description: 'Please fill in the service name and price.' });
      return;
    }
    setAdding(true);
    try {
      const values: Service = {
        id: Date.now().toString(),
        name: newService.name.trim(),
        category: serviceCategory!,
        description: newService.description.trim(),
        price: Number(newService.price),
        capacity: Number(newService.capacity) || undefined,
        available: newService.status === 'available',
        status: newService.status,
        image: newService.image,
      };
      await addService(values);
      showSuccessNotification({ title: 'Service Added', description: `${values.name} has been added successfully.` });
      setNewService({ name: '', description: '', price: '', capacity: '', status: 'available', image: '' });
      setShowAddService(false);
    } catch {
      showErrorNotification({ title: 'Error', description: 'Could not add the service. Please try again.' });
    } finally {
      setAdding(false);
    }
  };

  // --- Add Cottage (inline, like Rooms) ---
  const handleAddCottage = async () => {
    if (!newCottage.name.trim() || !newCottage.cottageNumber.trim() || !newCottage.price || !newCottage.capacity) {
      showErrorNotification({ title: 'Missing Fields', description: 'Please fill in all required fields.' });
      return;
    }
    setAdding(true);
    try {
      const values: Cottage = {
        id: Date.now().toString(),
        cottageNumber: newCottage.cottageNumber.trim(),
        name: newCottage.name.trim(),
        description: newCottage.description.trim(),
        pricePerNight: Number(newCottage.price),
        capacity: Number(newCottage.capacity),
        status: newCottage.status,
        image: newCottage.image,
      };
      await addCottage(values);
      showSuccessNotification({ title: 'Cottage Added', description: `${values.name} has been added successfully.` });
      setNewCottage({ name: '', cottageNumber: '', description: '', price: '', capacity: '', status: 'available', image: '' });
      setShowAddCottage(false);
    } catch {
      showErrorNotification({ title: 'Error', description: 'Could not add the cottage. Please try again.' });
    } finally {
      setAdding(false);
    }
  };

  // --- Add Event Type (inline, like Rooms) ---
  const handleAddEvent = async () => {
    if (!newEvent.type.trim() || !newEvent.name.trim()) {
      showErrorNotification({ title: 'Missing Fields', description: 'Please fill in the event type and display name.' });
      return;
    }
    setAdding(true);
    try {
      await addEventType(
        newEvent.type.trim().toLowerCase().replace(/\s+/g, '-'),
        newEvent.name.trim(),
        newEvent.description.trim(),
        Number(newEvent.price) || 0,
        Number(newEvent.capacity) || undefined,
      );
      showSuccessNotification({ title: 'Event Type Added', description: `${newEvent.name.trim()} has been added successfully.` });
      setNewEvent({ type: '', name: '', description: '', price: '', capacity: '' });
      setShowAddEvent(false);
    } catch {
      showErrorNotification({ title: 'Error', description: 'Could not add the event type. Please try again.' });
    } finally {
      setAdding(false);
    }
  };

  // --- Save edited service ---
  const saveService = (form: ServiceForm) => {
    const values: Service = { id: form.id!, name: form.name, category: form.category, description: form.description, price: Number(form.price), capacity: Number(form.capacity) || undefined, available: form.status === 'available', status: form.status, image: form.image };
    updateService(form.id!, values);
    setModal(null); setEditing(null);
    showSuccessNotification({ title: 'Service Updated', description: `${values.name} has been updated successfully.` });
  };

  // --- Save edited cottage ---
  const saveCottage = (form: CottageForm) => {
    const values: Cottage = { id: form.id!, cottageNumber: form.cottageNumber, name: form.name, description: form.description, pricePerNight: Number(form.price), capacity: Number(form.capacity), status: form.status, image: form.image };
    updateCottage(form.id!, values);
    setModal(null); setEditing(null);
    showSuccessNotification({ title: 'Cottage Updated', description: `${values.name} has been updated successfully.` });
  };

// --- Save hall inventory ---
  const saveHallInventory = async () => {
    setHallInventorySaving(true);
    try {
      await setBusinessInfo({
        ...businessInfo,
        functionHallTables: Number(hallTables) || 0,
        functionHallChairs: Number(hallChairs) || 0,
        functionHallScheduleStart: hallScheduleStart,
        functionHallScheduleEnd: hallScheduleEnd,
      });
      showSuccessNotification({ title: 'Hall Details Saved', description: 'Tables, chairs, and schedule have been updated.' });
    } catch {
      showErrorNotification({ title: 'Error', description: 'Could not save the hall details.' });
    } finally {
      setHallInventorySaving(false);
    }
  };

  const toggleStatus = (item: Service) => updateService(item.id, { status: item.status === 'available' ? 'unavailable' : 'available', available: item.status !== 'available' });

  const handleDeleteService = (item: Service) => {
    deleteService(item.id);
    showErrorNotification({ title: 'Service Deleted', description: `${item.name} has been removed.` });
  };

  const handleDeleteCottage = (item: Cottage) => {
    deleteCottage(item.id);
    showErrorNotification({ title: 'Cottage Deleted', description: `${item.name} has been removed.` });
  };

  const handleDeleteEvent = (type: string) => {
    deleteEventType(type);
    showErrorNotification({ title: 'Event Type Deleted', description: 'The event type has been removed.' });
  };

  const hallBookingsOnDate = useMemo(() => {
    return eventBookings.filter((eb) => {
      const eventDateStr = typeof eb.eventDate === 'string' ? eb.eventDate.split('T')[0] : new Date(eb.eventDate).toISOString().split('T')[0];
      return eventDateStr === availabilityDate && eb.status !== 'cancelled';
    });
  }, [eventBookings, availabilityDate]);

  const handleAddHallPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHallPhotoSaving(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await addFunctionHallPhoto(dataUrl);
      showSuccessNotification({ title: 'Photo Added', description: 'A new function hall photo has been added.' });
    } catch {
      showErrorNotification({ title: 'Error', description: 'Could not add the photo.' });
    } finally {
      setHallPhotoSaving(false);
      e.target.value = '';
    }
  };

  const handleDeleteHallPhoto = async (index: number) => {
    try {
      await deleteFunctionHallPhoto(index);
      showSuccessNotification({ title: 'Photo Removed', description: 'The function hall photo has been removed.' });
    } catch {
      showErrorNotification({ title: 'Error', description: 'Could not remove the photo.' });
    }
  };

  return <div className="flex h-screen bg-slate-50"><AdminSidebar /><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><AdminHeader /><main className="flex-1 overflow-auto"><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
    <div className="mb-7"><h1 className="text-3xl font-bold tracking-tight text-slate-900">Facilities and Services</h1><p className="mt-2 text-slate-600">Manage swimming pool, videoke, function hall events, and cottages — keep pricing, capacity, and availability accurate.</p></div>
    <div className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={17} />{tab.label}</button>; })}</div>

    {/* Swimming Pool / Videoke tab */}
    {serviceCategory && (
      <SectionShell title={tabs.find((tab) => tab.id === activeTab)?.label || 'Services'} description="Add services, update pricing, and mark items for maintenance." action={<Button onClick={() => setShowAddService(!showAddService)} className="bg-blue-600 hover:bg-blue-700"><Plus size={16} className="mr-2" />Add service</Button>}>
        {showAddService && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Add New {tabs.find((tab) => tab.id === activeTab)?.label}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Service Name *</label>
                  <input className={inputClass} placeholder="e.g. Resort Pool Access" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Price (₱) *</label>
                  <input className={inputClass} type="text" inputMode="decimal" placeholder="e.g. 150" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value.replace(/[^0-9.]/g, '') })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Capacity</label>
                  <input className={inputClass} type="number" min="1" placeholder="e.g. 10" value={newService.capacity} onChange={(e) => setNewService({ ...newService, capacity: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                  <select className={inputClass} value={newService.status} onChange={(e) => setNewService({ ...newService, status: e.target.value as InventoryStatus })}>
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea className={inputClass} rows={2} placeholder="Short description" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Service Photo</label>
                {newService.image && <img src={newService.image} alt="Preview" className="mb-3 h-40 w-full rounded-lg object-cover" />}
                <input type="file" accept="image/*" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setNewService({ ...newService, image: await fileToDataUrl(f) }); }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddService} disabled={adding} className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50">{adding ? 'Adding...' : 'Add Service'}</button>
                <button onClick={() => setShowAddService(false)} className="rounded-lg bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleServices.length ? visibleServices.map((item) => <InventoryCard key={item.id} item={item} onEdit={() => { setEditing(item); setModal('service'); }} onDelete={() => handleDeleteService(item)} onToggle={() => toggleStatus(item)} />) : <Empty text={`No ${tabs.find((tab) => tab.id === activeTab)?.label.toLowerCase()} services yet.`} />}</div>
      </SectionShell>
    )}

    {/* Pool operating hours */}
    {activeTab === 'pool' && <Card className="mt-6"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end"><div className="flex-1"><label className="mb-2 block text-sm font-semibold text-slate-700">Pool operating hours</label><input className={inputClass} value={poolHours} onChange={(event) => setPoolHours(event.target.value)} /></div><Button onClick={() => { setBusinessInfo({ ...businessInfo, poolOperatingHours: poolHours }); showSuccessNotification({ title: 'Pool Hours Saved', description: 'Operating hours have been updated.' }); }} className="bg-blue-600 hover:bg-blue-700"><Save size={16} className="mr-2" />Save hours</Button></CardContent></Card>}

    {/* Cottage tab */}
    {activeTab === 'cottage' && (
      <SectionShell title="Cottages" description="Add and manage individual cottages — name, number, price, capacity, and photo." action={<Button onClick={() => setShowAddCottage(!showAddCottage)} className="bg-blue-600 hover:bg-blue-700"><Plus size={16} className="mr-2" />Add cottage</Button>}>
        {showAddCottage && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Add New Cottage</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Cottage Name *</label>
                  <input className={inputClass} placeholder="e.g. Family Cottage" value={newCottage.name} onChange={(e) => setNewCottage({ ...newCottage, name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Cottage Number *</label>
                  <input className={inputClass} placeholder="e.g. C1" value={newCottage.cottageNumber} onChange={(e) => setNewCottage({ ...newCottage, cottageNumber: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Price/Night (₱) *</label>
                  <input className={inputClass} type="text" inputMode="decimal" placeholder="e.g. 2000" value={newCottage.price} onChange={(e) => setNewCottage({ ...newCottage, price: e.target.value.replace(/[^0-9.]/g, '') })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Capacity *</label>
                  <input className={inputClass} type="number" min="1" placeholder="e.g. 4" value={newCottage.capacity} onChange={(e) => setNewCottage({ ...newCottage, capacity: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea className={inputClass} rows={2} placeholder="Short description" value={newCottage.description} onChange={(e) => setNewCottage({ ...newCottage, description: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select className={inputClass} value={newCottage.status} onChange={(e) => setNewCottage({ ...newCottage, status: e.target.value as CottageStatus })}>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cottage Photo</label>
                {newCottage.image && <img src={newCottage.image} alt="Preview" className="mb-3 h-40 w-full rounded-lg object-cover" />}
                <input type="file" accept="image/*" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setNewCottage({ ...newCottage, image: await fileToDataUrl(f) }); }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCottage} disabled={adding} className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50">{adding ? 'Adding...' : 'Add Cottage'}</button>
                <button onClick={() => setShowAddCottage(false)} className="rounded-lg bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{cottages.length ? cottages.map((item) => <CottageCard key={item.id} item={item} onEdit={() => { setEditing(item); setModal('cottage'); }} onDelete={() => handleDeleteCottage(item)} />) : <Empty text="No cottages yet. Add your first cottage to get started." />}</div>
      </SectionShell>
    )}

    {/* Function Hall tab */}
    {activeTab === 'function-hall' && (
      <FunctionHallSection
        hallPhotos={functionHallPhotos}
        onAddHallPhoto={handleAddHallPhoto}
        onDeleteHallPhoto={handleDeleteHallPhoto}
        hallPhotoSaving={hallPhotoSaving}
        hallTables={hallTables}
        setHallTables={setHallTables}
        hallChairs={hallChairs}
        setHallChairs={setHallChairs}
        hallScheduleStart={hallScheduleStart}
        setHallScheduleStart={setHallScheduleStart}
        hallScheduleEnd={hallScheduleEnd}
        setHallScheduleEnd={setHallScheduleEnd}
        onSaveHallInventory={saveHallInventory}
        hallInventorySaving={hallInventorySaving}
        availabilityDate={availabilityDate}
        setAvailabilityDate={setAvailabilityDate}
        hallBookingsOnDate={hallBookingsOnDate}
        eventTypes={eventTypePrices}
        showAddEvent={showAddEvent}
        setShowAddEvent={setShowAddEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    )}
  </div></main></div>
  {modal === 'service' && <ServiceModal category={serviceCategory || 'videoke'} item={editing as Service | null} onClose={() => setModal(null)} onSave={saveService} />}
  {modal === 'cottage' && <CottageModal item={editing as Cottage | null} onClose={() => setModal(null)} onSave={saveCottage} />}
  </div>;
}

type ServiceForm = { id?: string; name: string; description: string; price: number; capacity: number; category: ServiceCategory; status: InventoryStatus; image?: string };
type CottageForm = { id?: string; name: string; cottageNumber: string; description: string; price: number; capacity: number; status: CottageStatus; image?: string };

function SectionShell({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-slate-600">{description}</p></div>{action}</div>{children}</>;
}
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3">{text}</div>; }

function CottageCard({ item, onEdit, onDelete }: { item: Cottage; onEdit: () => void; onDelete: () => void }) {
  return <Card className="overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
    {item.image && <div className="h-40 bg-slate-100"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>}
    <CardContent className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-bold text-slate-900">{item.name}</h3><p className="mt-1 text-xs text-slate-500">Cottage #{item.cottageNumber}</p></div>
        <CottageStatusBadge status={item.status} />
      </div>
      <p className="min-h-10 text-sm text-slate-600">{item.description || 'No description provided.'}</p>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div><p className="text-xs font-semibold uppercase text-slate-500">Price</p><p className="text-xl font-bold text-blue-600">₱{item.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-slate-500">/night</span></p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Capacity</p><p className="text-xl font-bold text-slate-800 flex items-center gap-1"><Users size={16} className="text-slate-400" />{item.capacity}</p></div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}><ImagePlus size={15} className="mr-2" />Edit</Button>
        <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 size={15} /></Button>
      </div>
    </CardContent>
  </Card>;
}

function CottageStatusBadge({ status }: { status: CottageStatus }) {
  const classes: Record<CottageStatus, string> = { available: 'bg-green-100 text-green-800', reserved: 'bg-blue-100 text-blue-800', occupied: 'bg-purple-100 text-purple-800', maintenance: 'bg-amber-100 text-amber-800', unavailable: 'bg-red-100 text-red-800' };
  return <Badge className={classes[status]}>{cottageStatusLabel[status]}</Badge>;
}

type InventoryCardItem = { id: string; name: string; description?: string; price: number; capacity?: number; available: boolean; status?: InventoryStatus; image?: string };
function InventoryCard({ item, onEdit, onDelete, onToggle }: { item: InventoryCardItem; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const status = item.status || (item.available ? 'available' : 'unavailable');
  return <Card className="overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
    {item.image && <div className="h-40 bg-slate-100"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /></div>}
    <CardContent className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-bold text-slate-900">{item.name}</h3>{'category' in item && <p className="mt-1 text-xs capitalize text-slate-500">{(item as Service).category.replace('-', ' ')}</p>}</div>
        <StatusBadge status={status} />
      </div>
      <p className="min-h-10 text-sm text-slate-600">{item.description || 'No description provided.'}</p>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div><p className="text-xs font-semibold uppercase text-slate-500">Price</p><p className="text-xl font-bold text-blue-600">₱{item.price.toLocaleString()}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Capacity</p><p className="text-xl font-bold text-slate-800 flex items-center gap-1"><Users size={16} className="text-slate-400" />{item.capacity || 'Flexible'}</p></div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onToggle()}>{status === 'available' ? 'Mark unavailable' : 'Mark available'}</Button>
        <Button variant="outline" size="sm" onClick={onEdit}><ImagePlus size={15} className="mr-1" /></Button>
        <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 size={15} /></Button>
      </div>
    </CardContent>
  </Card>;
}
function StatusBadge({ status }: { status: InventoryStatus }) { return <Badge className={status === 'available' ? 'bg-green-100 text-green-800' : status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>{status === 'maintenance' && <Wrench size={12} className="mr-1" />}{statusLabel[status]}</Badge>; }

interface FunctionHallSectionProps {
  hallPhotos: string[];
  onAddHallPhoto: (e: ChangeEvent<HTMLInputElement>) => void;
  onDeleteHallPhoto: (index: number) => void;
  hallPhotoSaving: boolean;
  hallTables: string;
  setHallTables: (v: string) => void;
  hallChairs: string;
  setHallChairs: (v: string) => void;
  hallScheduleStart: string;
  setHallScheduleStart: (v: string) => void;
  hallScheduleEnd: string;
  setHallScheduleEnd: (v: string) => void;
  onSaveHallInventory: () => void;
  hallInventorySaving: boolean;
  availabilityDate: string;
  setAvailabilityDate: (v: string) => void;
  hallBookingsOnDate: any[];
  eventTypes: { type: string; name: string; description: string; price: number; capacity?: number }[];
  showAddEvent: boolean;
  setShowAddEvent: (v: boolean) => void;
  newEvent: { type: string; name: string; description: string; price: string; capacity: string };
  setNewEvent: React.Dispatch<React.SetStateAction<{ type: string; name: string; description: string; price: string; capacity: string }>>;
  onAddEvent: () => void;
  onDeleteEvent: (type: string) => void;
}

function FunctionHallSection({ hallPhotos, onAddHallPhoto, onDeleteHallPhoto, hallPhotoSaving, hallTables, setHallTables, hallChairs, setHallChairs, hallScheduleStart, setHallScheduleStart, hallScheduleEnd, setHallScheduleEnd, onSaveHallInventory, hallInventorySaving, availabilityDate, setAvailabilityDate, hallBookingsOnDate, eventTypes, showAddEvent, setShowAddEvent, newEvent, setNewEvent, onAddEvent, onDeleteEvent }: FunctionHallSectionProps) {
  return <>
    <SectionShell title="Function Hall for Events" description="Upload photos of the hall, set available inventory (tables, chairs), and configure the operating schedule." action={null}>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Function Hall Photos</h3>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              <ImagePlus size={16} />
              <span>{hallPhotoSaving ? 'Adding...' : 'Add photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onAddHallPhoto} disabled={hallPhotoSaving} />
            </label>
          </div>
          {hallPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {hallPhotos.map((photo, index) => (
                <div key={index} className="group relative overflow-hidden rounded-lg border border-slate-200">
                  <img src={photo} alt={`Function Hall ${index + 1}`} className="h-32 w-full object-cover" />
                  <button onClick={() => onDeleteHallPhoto(index)} className="absolute right-2 top-2 rounded-lg bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-700"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No photos yet. Click "Add photo" to upload function hall photos.</p>
          )}
        </CardContent>
      </Card>

        <Card className="mt-6">
          <CardContent className="space-y-4 p-5">
            <h3 className="font-bold text-slate-900">Available Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-2 block text-sm font-semibold text-slate-700">Tables</label><input className={inputClass} type="number" min="0" placeholder="Number of tables" value={hallTables} onChange={(e) => setHallTables(e.target.value)} /></div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700">Chairs / Benches</label><input className={inputClass} type="number" min="0" placeholder="Number of chairs" value={hallChairs} onChange={(e) => setHallChairs(e.target.value)} /></div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Available Time Schedule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-xs text-slate-500">Start time</label><input className={inputClass} type="time" value={hallScheduleStart} onChange={(e) => setHallScheduleStart(e.target.value)} /></div>
                <div><label className="mb-1 block text-xs text-slate-500">End time</label><input className={inputClass} type="time" value={hallScheduleEnd} onChange={(e) => setHallScheduleEnd(e.target.value)} /></div>
              </div>
            </div>
            <Button disabled={hallInventorySaving} onClick={onSaveHallInventory} className="w-full bg-blue-600 hover:bg-blue-700"><Save size={16} className="mr-2" />{hallInventorySaving ? 'Saving...' : 'Save details'}</Button>
          </CardContent>
        </Card>
    </SectionShell>

    {/* Availability checker */}
    <Card className="mt-6">
      <CardContent className="p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Calendar size={18} className="text-blue-600" />Check Function Hall Availability</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Select date</label><input className={inputClass} type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} /></div>
          <div className="flex-1">
            {hallBookingsOnDate.length > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-red-800"><X size={16} />Status: Reserved</p>
                <div className="mt-2 space-y-1">{hallBookingsOnDate.map((eb) => <p key={eb.id} className="text-sm text-red-700">Reserved for <span className="font-semibold">{eb.eventName || eb.eventType || 'Event'}</span>{eb.guestName && ` — ${eb.guestName}`}</p>)}</div>
              </div>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-green-800"><Calendar size={16} />Status: Available</p>
                <p className="mt-1 text-sm text-green-700">The function hall is available on {new Date(availabilityDate).toLocaleDateString()}.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Event Types with inline add form */}
    <div className="mt-8">
      <SectionShell title="Event Types" description="Add event types with pricing and capacity for the function hall." action={<Button onClick={() => setShowAddEvent(!showAddEvent)} className="bg-blue-600 hover:bg-blue-700"><Plus size={16} className="mr-2" />Add event</Button>}>
        {showAddEvent && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Add New Event Type</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Event Type *</label>
                  <input className={inputClass} placeholder="e.g. birthday, wedding" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Display Name *</label>
                  <input className={inputClass} placeholder="e.g. Birthday Party" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea className={inputClass} rows={2} placeholder="Short description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Base Price (₱)</label>
                  <input className={inputClass} type="text" inputMode="decimal" placeholder="e.g. 5000" value={newEvent.price} onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value.replace(/[^0-9.]/g, '') })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Capacity (optional)</label>
                  <input className={inputClass} type="number" min="0" placeholder="e.g. 100" value={newEvent.capacity} onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onAddEvent} className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700">Add Event</button>

                <button onClick={() => setShowAddEvent(false)} className="rounded-lg bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{eventTypes.length ? eventTypes.map((et) => (
          <Card key={et.type} className="overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-slate-900">{et.name}</h3><Badge className="bg-blue-100 text-blue-800">{et.type}</Badge></div>
              <p className="min-h-10 text-sm text-slate-600">{et.description || 'No description provided.'}</p>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div><p className="text-xs font-semibold uppercase text-slate-500">Price</p><p className="text-xl font-bold text-blue-600">₱{et.price.toLocaleString()}</p></div>
                <div><p className="text-xs font-semibold uppercase text-slate-500">Capacity</p><p className="text-xl font-bold text-slate-800 flex items-center gap-1"><Users size={16} className="text-slate-400" />{et.capacity || 'Flexible'}</p></div>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => onDeleteEvent(et.type)}><Trash2 size={15} className="mr-2" />Delete event</Button>
            </CardContent>
          </Card>
        )) : <Empty text="No event types yet. Add your first event to get started." />}</div>
      </SectionShell>
    </div>
  </>;
}

// --- Edit Modals (use FileReader for images, no Supabase storage) ---

function ServiceModal({ category, item, onClose, onSave }: { category: ServiceCategory; item: Service | null; onClose: () => void; onSave: (form: ServiceForm) => void }) {
  const [form, setForm] = useState<ServiceForm>({ id: item?.id, name: item?.name || '', description: item?.description || '', price: item?.price || 0, capacity: item?.capacity || 0, category, status: item?.status || 'available', image: item?.image });
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, image: await fileToDataUrl(file) }); };
  return <Modal title="Edit service" onClose={onClose}>
    <div className="space-y-4">
      {form.image && <img src={form.image} alt="Preview" className="h-40 w-full rounded-xl object-cover" />}
      <div><label className="mb-1 block text-xs font-semibold text-slate-500">Service name</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="mb-1 block text-xs font-semibold text-slate-500">Description</label><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">Price</label><input className={inputClass} type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">Capacity</label><input className={inputClass} type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
      </div>
      <div><label className="mb-1 block text-xs font-semibold text-slate-500">Status</label>
        <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InventoryStatus })}>
          <option value="available">Available</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option>
        </select>
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
        <ImagePlus size={18} className="text-blue-600" /><span>{form.image ? 'Change photo' : 'Upload service photo'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      <Button disabled={!form.name.trim()} onClick={() => onSave(form)} className="w-full bg-blue-600 hover:bg-blue-700">Save changes</Button>
    </div>
  </Modal>;
}

function CottageModal({ item, onClose, onSave }: { item: Cottage | null; onClose: () => void; onSave: (form: CottageForm) => void }) {
  const [form, setForm] = useState<CottageForm>({ id: item?.id, name: item?.name || '', cottageNumber: item?.cottageNumber || '', description: item?.description || '', price: item?.pricePerNight || 0, capacity: item?.capacity || 1, status: item?.status || 'available', image: item?.image });
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setForm({ ...form, image: await fileToDataUrl(file) }); };
  return <Modal title="Edit cottage" onClose={onClose}>
    <div className="space-y-4">
      {form.image && <img src={form.image} alt="Preview" className="h-40 w-full rounded-xl object-cover" />}
      <input className={inputClass} placeholder="Cottage name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={inputClass} placeholder="Cottage number" value={form.cottageNumber} onChange={(e) => setForm({ ...form, cottageNumber: e.target.value })} />
      <textarea className={inputClass} rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">Price per night</label><input className={inputClass} type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">Capacity</label><input className={inputClass} type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
      </div>
      <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CottageStatus })}>
        <option value="available">Available</option><option value="reserved">Reserved</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option>
      </select>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
        <ImagePlus size={18} className="text-blue-600" /><span>{form.image ? 'Change photo' : 'Upload cottage photo'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      <Button disabled={!form.name.trim() || !form.cottageNumber.trim()} onClick={() => onSave(form)} className="w-full bg-blue-600 hover:bg-blue-700">Save changes</Button>
    </div>
  </Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>{children}</div></div>;
}

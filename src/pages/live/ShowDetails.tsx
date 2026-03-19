import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, DollarSign, Pencil, FileText, Clock, Mail, Phone, Building, Users, Truck, Plus, X, Check, Music, User, Download, Upload } from 'lucide-react';
import ShowDealModal from '../../components/shows/ShowDealModal';
import ShowAdvancesModal from '../../components/shows/ShowAdvancesModal';
import DealSummaryCard from '../../components/shows/DealSummaryCard';
import { formatDate, formatDateTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Show, SetlistItem, GuestListEntry } from '../../types';
import type { DealSummary } from '../../types/deals';
import { getDealByShowId } from '../../lib/dealService';
import { sendTicketEmail, extractEmailFromContactInfo, validateEmailAddress } from '../../lib/emailService';
import {
  getShowDetails,
  updateShowDeal,
  updateShowAdvances,
  toggleMarketingTask,
  addGuestListEntry,
  updateGuestStatus,
  markTicketsSent,
  type ShowWithDetails,
  type MarketingTask,
  type ProductionFile
} from '../../lib/showService';


export default function ShowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowWithDetails | null>(null);
  const [dealSummary, setDealSummary] = useState<DealSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'marketing' | 'production' | 'setlist' | 'guestlist'>('overview');
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isAdvancesModalOpen, setIsAdvancesModalOpen] = useState(false);
  const [marketingTasks, setMarketingTasks] = useState<MarketingTask[]>([]);
  const [productionFiles, setProductionFiles] = useState<ProductionFile[]>([]);
  const [logistics, setLogistics] = useState<any>({ transportation: [], accommodation: [] });
  const [setlist, setSetlist] = useState<any[]>([]);
  const [guestList, setGuestList] = useState<any[]>([]);
  const [isEditingSetlist, setIsEditingSetlist] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newGuest, setNewGuest] = useState<Partial<any>>({
    name: '',
    type: 'vip',
    quantity: 1,
    requested_by: 'Management',
    status: 'pending',
  });

  useEffect(() => {
    async function loadShowDetails() {
      if (!id) {
        console.log('No show ID provided');
        return;
      }

      console.log('Loading show details for ID:', id);
      setIsLoading(true);
      const showData = await getShowDetails(id);

      console.log('Show data received:', showData);

      if (showData) {
        setShow(showData);
        setMarketingTasks(showData.marketingTasks || []);
        setProductionFiles(showData.productionFiles || []);
        setLogistics({
          transportation: showData.transportation || [],
          accommodation: showData.accommodation || []
        });
        setSetlist(showData.setlist?.songs || []);
        setGuestList(showData.guestList || []);

        const dealData = await getDealByShowId(id);
        setDealSummary(dealData);

        console.log('Show state updated');
      } else {
        console.log('No show data returned');
      }

      setIsLoading(false);
    }

    loadShowDetails();
  }, [id]);

  const handleDealUpdate = async () => {
    if (!id) return;

    const dealData = await getDealByShowId(id);
    setDealSummary(dealData);
  };

  const handleAdvancesUpdate = async (updatedAdvances: any) => {
    if (!show) return;

    await updateShowAdvances(show.id, updatedAdvances);
    setShow({
      ...show,
      advances: updatedAdvances,
    });
    setIsAdvancesModalOpen(false);
  };

  const handleToggleMarketingTask = async (taskId: string) => {
    const task = marketingTasks.find(t => t.id === taskId);
    if (!task) return;

    await toggleMarketingTask(taskId, !task.completed);
    setMarketingTasks(marketingTasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: !t.completed,
          completed_at: !t.completed ? new Date().toISOString() : undefined,
          completed_by: !t.completed ? 'Current User' : '',
        };
      }
      return t;
    }));
  };

  const handleAddGuest = async () => {
    if (!newGuest.name || !show) return;

    const { data } = await addGuestListEntry(show.id, {
      name: newGuest.name,
      type: newGuest.type || 'vip',
      quantity: newGuest.quantity || 1,
      requested_by: newGuest.requested_by || 'Management',
      status: newGuest.status || 'pending',
      notes: newGuest.notes,
      contact_info: newGuest.contact_info,
    });

    if (data) {
      setGuestList([...guestList, data]);
    }

    setNewGuest({
      name: '',
      type: 'vip',
      quantity: 1,
      requested_by: 'Management',
      status: 'pending',
    });
    setIsAddingGuest(false);
  };

  const handleUpdateGuestStatus = async (guestId: string, status: 'approved' | 'pending' | 'declined') => {
    await updateGuestStatus(guestId, status);
    setGuestList(guestList.map(guest =>
      guest.id === guestId ? { ...guest, status } : guest
    ));
  };

  const handleSendTickets = async (guestId: string) => {
    const guest = guestList.find(g => g.id === guestId);
    if (!guest || !show) return;

    const email = extractEmailFromContactInfo(guest.contact_info);

    if (!email) {
      alert('No valid email address found for this guest. Please add an email in the contact info field (e.g., john@example.com)');
      return;
    }

    if (!validateEmailAddress(email)) {
      alert('Invalid email address format. Please update the contact info with a valid email.');
      return;
    }

    const confirmed = confirm(`Send ticket confirmation email to ${guest.name} at ${email}?`);
    if (!confirmed) return;

    try {
      const result = await sendTicketEmail({
        guestId: guest.id,
        guestName: guest.name,
        guestEmail: email,
        showTitle: show.title,
        venueName: show.venue_name,
        showDate: show.date,
        showTime: show.show_time || '8:00 PM',
        quantity: guest.quantity || 1,
        guestType: guest.type,
      });

      if (result.success) {
        setGuestList(guestList.map(g =>
          g.id === guestId ? { ...g, tickets_sent: true } : g
        ));
        alert(`Ticket confirmation email sent successfully to ${email}`);
      } else {
        alert(`Failed to send email: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending tickets:', error);
      alert('Failed to send ticket email. Please try again or contact support.');
    }
  };

  if (isLoading || !show) {
    if (isLoading) {
      return <LoadingSpinner fullScreen={false} />;
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Show Not Found</h2>
        <p className="text-gray-600 mb-8">The show you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/live')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Return to Live Events
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Live Events
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-title">{show.title}</h1>
            <div className="mt-1 flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-primary" />
                {formatDate(show.date)}
                {show.show_time && ` • ${show.show_time}`}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-primary" />
                {show.venue_name}, {show.venue_city}, {show.venue_country}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                show.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : show.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-beige text-black'
              }`}>
                {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logistics'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Logistics
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'marketing'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Marketing
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'production'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Production
          </button>
          <button
            onClick={() => setActiveTab('setlist')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'setlist'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Setlist
          </button>
          <button
            onClick={() => setActiveTab('guestlist')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guestlist'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Guest List
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deal Information */}
          <DealSummaryCard
            dealSummary={dealSummary}
            onEdit={() => setIsDealModalOpen(true)}
          />

          {/* Show Advances */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Show Advances
              </h2>
              <button
                onClick={() => setIsAdvancesModalOpen(true)}
                className="text-primary hover:text-primary/80"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>

            {show.advances ? (
              <div className="space-y-6">
                {/* Production Manager */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Production Manager</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{show.advances.production_manager?.name || 'N/A'}</p>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${show.advances.production_manager?.email || ''}`} className="hover:text-primary">
                          {show.advances.production_manager?.email || 'N/A'}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${show.advances.production_manager?.phone || ''}`} className="hover:text-primary">
                          {show.advances.production_manager?.phone || 'N/A'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Venue Contact */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Venue Contact</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{show.advances.venue_contact?.name || 'N/A'}</p>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${show.advances.venue_contact?.email || ''}`} className="hover:text-primary">
                          {show.advances.venue_contact?.email || 'N/A'}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${show.advances.venue_contact?.phone || ''}`} className="hover:text-primary">
                          {show.advances.venue_contact?.phone || 'N/A'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">Load In</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.schedule?.loadIn || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">Soundcheck</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.schedule?.soundcheck || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">Doors</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.schedule?.doors || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">Show Time</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.schedule?.showtime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">Curfew</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.schedule?.curfew || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Catering */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Catering</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700">Lunch</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.catering?.mealTimes?.lunch || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700">Dinner</span>
                      <span className="text-sm font-medium text-gray-900">{show.advances.catering?.mealTimes?.dinner || 'N/A'}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">{show.advances.catering?.requirements || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Parking */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Parking</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <span className="text-xs text-gray-500">Trucks</span>
                        <p className="text-sm font-medium text-gray-900">{show.advances.parking?.trucks || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Buses</span>
                        <p className="text-sm font-medium text-gray-900">{show.advances.parking?.buses || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Cars</span>
                        <p className="text-sm font-medium text-gray-900">{show.advances.parking?.cars || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">{show.advances.parking?.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No advances information available</p>
                <button
                  onClick={() => setIsAdvancesModalOpen(true)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Add Advances Information
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logistics' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Logistics
            </h2>
            <button
              onClick={() => navigate(`/live/logistics?showId=${show.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Manage Logistics
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transportation */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Transportation
              </h3>
              
              {logistics.transportation.length > 0 ? (
                <div className="space-y-4">
                  {logistics.transportation.map((item: any) => (
                    <div key={item.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 capitalize">{item.type || 'Transport'}</h4>
                          <p className="text-xs text-gray-500">{item.confirmation_number || 'No confirmation'}</p>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Departure</p>
                          <p className="text-sm text-gray-700">{item.departure_time ? formatDateTime(item.departure_time) : 'N/A'}</p>
                          <p className="text-xs text-gray-500">{item.departure_location || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Arrival</p>
                          <p className="text-sm text-gray-700">{item.arrival_time ? formatDateTime(item.arrival_time) : 'N/A'}</p>
                          <p className="text-xs text-gray-500">{item.arrival_location || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        {item.notes && (
                          <span className="text-xs text-gray-500">{item.notes}</span>
                        )}
                        <span className="text-sm font-medium text-primary ml-auto">{formatCurrency(Number(item.cost) || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No transportation information available</p>
                </div>
              )}
            </div>
            
            {/* Accommodation */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                Accommodation
              </h3>
              
              {logistics.accommodation.length > 0 ? (
                <div className="space-y-4">
                  {logistics.accommodation.map((item: any) => (
                    <div key={item.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.hotel_name || 'Hotel'}</h4>
                          <p className="text-xs text-gray-500">{item.rooms || 1} room(s)</p>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Check-in</p>
                          <p className="text-sm text-gray-700">{item.check_in_date ? formatDate(item.check_in_date) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Check-out</p>
                          <p className="text-sm text-gray-700">{item.check_out_date ? formatDate(item.check_out_date) : 'N/A'}</p>
                        </div>
                      </div>
                      
                      {item.address && (
                        <p className="mt-2 text-xs text-gray-500">{item.address}</p>
                      )}

                      <div className="mt-3 flex justify-between items-center">
                        {item.notes && (
                          <span className="text-xs text-gray-500">{item.notes}</span>
                        )}
                        <span className="text-sm font-medium text-primary ml-auto">{formatCurrency(Number(item.cost) || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No accommodation information available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Marketing Checklist</h2>
            <button
              onClick={() => navigate(`/live/marketing?showId=${show.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Marketing Dashboard
            </button>
          </div>

          {marketingTasks.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Progress</span>
                <span>{Math.round((marketingTasks.filter(task => task.completed).length / marketingTasks.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(marketingTasks.filter(task => task.completed).length / marketingTasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {marketingTasks.length > 0 ? (
            <div className="space-y-3">
              {marketingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => handleToggleMarketingTask(task.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        task.completed
                          ? 'bg-primary border-primary text-white'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </button>
                    <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.label}
                    </span>
                  </div>
                  {task.completed && task.completed_at && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {formatDate(task.completed_at)}
                      </span>
                      <span>{task.completed_by}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No marketing tasks available</p>
          )}
        </div>
      )}

      {activeTab === 'production' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Production Files</h2>
            <button
              onClick={() => navigate(`/live/production?showId=${show.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Manage Production
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productionFiles && productionFiles.length > 0 ? (
              productionFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
                        <p className="text-xs text-gray-500">
                          Version {file.version} • Updated {formatDate(file.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-gray-500"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            ) : null}
            
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center">
              <div className="p-2 bg-gray-100 rounded-full mb-2">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Upload File</h3>
              <p className="text-xs text-gray-500 mt-1">Add a new production document</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'setlist' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Setlist</h2>
              {show.setlist && (
                <p className="text-sm text-gray-500">
                  Last updated: {formatDate(show.setlist.last_updated)} by {show.setlist.updated_by}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsEditingSetlist(!isEditingSetlist)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              {isEditingSetlist ? 'Save Changes' : 'Edit Setlist'}
            </button>
          </div>

          {setlist.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Song
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Encore
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {setlist.map((song) => (
                      <tr key={song.id} className={song.is_encore ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {song.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {song.song_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {song.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {song.key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {song.is_encore ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              Encore
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {show.setlist?.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{show.setlist.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Music className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No setlist available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a setlist for this show to keep track of the performance order.
              </p>
              <button
                onClick={() => setIsEditingSetlist(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Create Setlist
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'guestlist' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Guest List</h2>
            <button
              onClick={() => setIsAddingGuest(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Guest
            </button>
          </div>

          {isAddingGuest && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Guest</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newGuest.name || ''}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={newGuest.type || 'vip'}
                    onChange={(e) => setNewGuest({ ...newGuest, type: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="vip">VIP</option>
                    <option value="industry">Industry</option>
                    <option value="friends_family">Friends & Family</option>
                    <option value="media">Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newGuest.quantity || 1}
                    onChange={(e) => setNewGuest({ ...newGuest, quantity: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Requested By
                  </label>
                  <input
                    type="text"
                    value={newGuest.requested_by || 'Management'}
                    onChange={(e) => setNewGuest({ ...newGuest, requested_by: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Info
                  </label>
                  <input
                    type="text"
                    value={newGuest.contact_info || ''}
                    onChange={(e) => setNewGuest({ ...newGuest, contact_info: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Email or phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={newGuest.status || 'pending'}
                    onChange={(e) => setNewGuest({ ...newGuest, status: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={newGuest.notes || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Any special requirements or notes"
                />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGuest(false);
                    setNewGuest({
                      name: '',
                      type: 'vip',
                      quantity: 1,
                      requested_by: 'Management',
                      status: 'pending',
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Add Guest
                </button>
              </div>
            </div>
          )}

          {guestList.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guestList.map((guest) => (
                    <tr key={guest.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                            {guest.contact_info && (
                              <div className="text-xs text-gray-500">{guest.contact_info}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                          {guest.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {guest.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {guest.requested_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={guest.status}
                          onChange={(e) => handleUpdateGuestStatus(guest.id, e.target.value as any)}
                          className="text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {guest.status === 'approved' && !guest.tickets_sent ? (
                          <button
                            onClick={() => handleSendTickets(guest.id)}
                            className="text-primary hover:text-primary/80"
                          >
                            Send Tickets
                          </button>
                        ) : guest.tickets_sent ? (
                          <span className="text-green-600">Tickets Sent</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No guests added</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add guests to the guest list for this show.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Deal Modal */}
      {isDealModalOpen && id && (
        <ShowDealModal
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          onSave={handleDealUpdate}
          showId={id}
          dealId={dealSummary?.deal.id}
        />
      )}

      {/* Advances Modal */}
      {isAdvancesModalOpen && (
        <ShowAdvancesModal
          isOpen={isAdvancesModalOpen}
          onClose={() => setIsAdvancesModalOpen(false)}
          onSave={handleAdvancesUpdate}
          advances={show.advances}
        />
      )}
    </div>
  );
}
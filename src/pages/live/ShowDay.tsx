import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Mail, Building, Calendar, FileText, Link as LinkIcon, ExternalLink, Users, Truck, Plus, X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '../../lib/utils';
import type { Show } from '../../types';

const MOCK_SHOWS: Show[] = [];

// Mock venue information
const VENUE_INFO = {
  1: {
    name: 'Madison Square Garden',
    address: '4 Pennsylvania Plaza, New York, NY 10001',
    website: 'https://www.msg.com',
    phone: '(212) 465-6741',
    contactName: 'John Smith',
    contactEmail: 'john.smith@msg.com',
    contactPhone: '(555) 987-6543',
    coordinates: {
      lat: 40.7505,
      lng: -73.9934
    },
    notes: 'Loading dock is on 8th Avenue. Security will need to check all equipment.',
    parkingInfo: 'Parking available at the venue for production vehicles. Additional parking at nearby garages.',
  },
  2: {
    name: 'Tampa Stadium',
    address: '4201 N Dale Mabry Hwy, Tampa, FL 33607',
    website: 'https://www.tampastadium.com',
    phone: '(813) 350-6500',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@tampastadium.com',
    contactPhone: '(555) 123-4567',
    coordinates: {
      lat: 27.9759,
      lng: -82.5033
    },
    notes: 'Outdoor venue. Rain contingency plan in place.',
    parkingInfo: 'Large parking lot available for all vehicles.',
  },
  3: {
    name: 'Kezar Stadium',
    address: '670 Kezar Dr, San Francisco, CA 94118',
    website: 'https://sfrecpark.org/770/Kezar-Stadium',
    phone: '(415) 831-5500',
    contactName: 'Michael Chen',
    contactEmail: 'michael.chen@sfgov.org',
    contactPhone: '(555) 789-0123',
    coordinates: {
      lat: 37.7670,
      lng: -122.4563
    },
    notes: 'Historic stadium with limited modern facilities. Bring additional equipment.',
    parkingInfo: 'Limited parking. Coordinate with venue staff for production vehicles.',
  }
};

// Mock hotel information
const HOTEL_INFO = {
  1: [
    {
      name: 'Hotel Pennsylvania',
      address: '401 7th Ave, New York, NY 10001',
      phone: '(212) 736-5000',
      website: 'https://www.hotelpenn.com',
      distanceToVenue: '0.2 miles',
      checkIn: '15:00',
      checkOut: '11:00',
      confirmationNumber: 'HP123456',
      notes: 'Band and crew on 15th floor. Late checkout arranged.',
    },
    {
      name: 'New Yorker Hotel',
      address: '481 8th Ave, New York, NY 10001',
      phone: '(212) 971-0101',
      website: 'https://www.newyorkerhotel.com',
      distanceToVenue: '0.3 miles',
      checkIn: '16:00',
      checkOut: '12:00',
      confirmationNumber: 'NY789012',
      notes: 'Production team staying here. Meeting room reserved for 7/27.',
    }
  ],
  2: [
    {
      name: 'Tampa Marriott Water Street',
      address: '505 Water St, Tampa, FL 33602',
      phone: '(813) 221-4900',
      website: 'https://www.marriott.com',
      distanceToVenue: '3.5 miles',
      checkIn: '16:00',
      checkOut: '11:00',
      confirmationNumber: 'TM456789',
      notes: 'All team members in this hotel. Breakfast included.',
    }
  ],
  3: [
    {
      name: 'Hotel Kabuki',
      address: '1625 Post St, San Francisco, CA 94115',
      phone: '(415) 922-3200',
      website: 'https://www.jdvhotels.com',
      distanceToVenue: '1.8 miles',
      checkIn: '15:00',
      checkOut: '12:00',
      confirmationNumber: 'HK345678',
      notes: 'Japanese-style hotel. Band members on top floor.',
    },
    {
      name: 'The Stanyan',
      address: '750 Stanyan St, San Francisco, CA 94117',
      phone: '(415) 751-1000',
      website: 'https://www.stanyanhotel.com',
      distanceToVenue: '0.5 miles',
      checkIn: '15:00',
      checkOut: '11:00',
      confirmationNumber: 'TS901234',
      notes: 'Crew staying here. Closest hotel to venue.',
    }
  ]
};

// Key contacts
const KEY_CONTACTS = {
  1: [
    {
      name: 'Richard Cole',
      role: 'Tour Manager',
      phone: '(555) 123-4567',
      email: 'richard.cole@ledzeppelin.com',
      notes: 'Primary contact for all tour matters',
    },
    {
      name: 'John Smith',
      role: 'Venue Manager',
      phone: '(555) 987-6543',
      email: 'john.smith@msg.com',
      notes: 'Contact for venue-specific questions',
    },
    {
      name: 'David Mitchell',
      role: 'Production Manager',
      phone: '(555) 567-8901',
      email: 'd.mitchell@ledzeppelin.com',
      notes: 'Handles all technical requirements',
    },
    {
      name: 'Sarah Johnson',
      role: 'Local Promoter',
      phone: '(555) 234-5678',
      email: 'sarah.johnson@promotions.com',
      notes: 'Local promotion and marketing',
    },
    {
      name: 'Mike Williams',
      role: 'Security Lead',
      phone: '(555) 345-6789',
      email: 'm.williams@security.com',
      notes: 'Venue security coordination',
    }
  ],
  2: [
    {
      name: 'Richard Cole',
      role: 'Tour Manager',
      phone: '(555) 123-4567',
      email: 'richard.cole@ledzeppelin.com',
      notes: 'Primary contact for all tour matters',
    },
    {
      name: 'Sarah Johnson',
      role: 'Venue Manager',
      phone: '(555) 123-4567',
      email: 'sarah.johnson@tampastadium.com',
      notes: 'Contact for venue-specific questions',
    },
    {
      name: 'David Mitchell',
      role: 'Production Manager',
      phone: '(555) 567-8901',
      email: 'd.mitchell@ledzeppelin.com',
      notes: 'Handles all technical requirements',
    }
  ],
  3: [
    {
      name: 'Richard Cole',
      role: 'Tour Manager',
      phone: '(555) 123-4567',
      email: 'richard.cole@ledzeppelin.com',
      notes: 'Primary contact for all tour matters',
    },
    {
      name: 'Michael Chen',
      role: 'Venue Manager',
      phone: '(555) 789-0123',
      email: 'michael.chen@sfgov.org',
      notes: 'Contact for venue-specific questions',
    },
    {
      name: 'David Mitchell',
      role: 'Production Manager',
      phone: '(555) 567-8901',
      email: 'd.mitchell@ledzeppelin.com',
      notes: 'Handles all technical requirements',
    }
  ]
};

// Notes for each show
const SHOW_NOTES = {
  1: [
    {
      title: 'Production Notes',
      content: 'Extra power requirements for the light show. Need to bring additional generators.',
      author: 'David Mitchell',
      date: '1973-07-15',
    },
    {
      title: 'Venue Restrictions',
      content: 'No pyrotechnics allowed in this venue. Smoke machines are permitted with prior notice.',
      author: 'John Smith',
      date: '1973-07-20',
    },
    {
      title: 'Special Guests',
      content: 'Atlantic Records executives will be attending. Reserve 10 seats in section A.',
      author: 'Richard Cole',
      date: '1973-07-22',
    }
  ],
  2: [
    {
      title: 'Weather Concerns',
      content: 'Potential for rain. Ensure all equipment is properly covered and protected.',
      author: 'David Mitchell',
      date: '1973-04-28',
    },
    {
      title: 'Local Crew',
      content: 'Local crew will be available from 10:00 AM. 20 stagehands confirmed.',
      author: 'Richard Cole',
      date: '1973-05-01',
    }
  ],
  3: [
    {
      title: 'Sound Restrictions',
      content: 'City noise ordinance in effect. Sound must be below 95dB after 10:00 PM.',
      author: 'David Mitchell',
      date: '1973-05-25',
    },
    {
      title: 'Press Access',
      content: 'Rolling Stone magazine will have backstage access for interviews before the show.',
      author: 'Richard Cole',
      date: '1973-05-30',
    }
  ]
};

export default function ShowDay() {
  const navigate = useNavigate();
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [venueInfo, setVenueInfo] = useState<any>(null);
  const [hotelInfo, setHotelInfo] = useState<any[]>([]);
  const [keyContacts, setKeyContacts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [localTime, setLocalTime] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    schedule: true,
    venue: true,
    hotels: false,
    contacts: true,
    notes: false
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Update local time every minute
  useEffect(() => {
    const updateLocalTime = () => {
      const now = new Date();
      setLocalTime(formatTime(now));
    };

    updateLocalTime();
    const interval = setInterval(updateLocalTime, 60000);

    return () => clearInterval(interval);
  }, []);
  
  // Load show data when selected show changes
  useEffect(() => {
    if (selectedShowId) {
      const show = MOCK_SHOWS.find(s => s.id === selectedShowId);
      if (show) {
        setSelectedShow(show);
        setVenueInfo(VENUE_INFO[selectedShowId as keyof typeof VENUE_INFO]);
        setHotelInfo(HOTEL_INFO[selectedShowId as keyof typeof HOTEL_INFO] || []);
        setKeyContacts(KEY_CONTACTS[selectedShowId as keyof typeof KEY_CONTACTS] || []);
        setNotes(SHOW_NOTES[selectedShowId as keyof typeof SHOW_NOTES] || []);
      }
    }
  }, [selectedShowId]);
  
  const handleAddNote = () => {
    if (!newNote.trim() || !selectedShowId) return;
    
    const newNoteObj = {
      title: 'New Note',
      content: newNote,
      author: 'Peter Grant',
      date: new Date().toISOString().split('T')[0],
    };
    
    setNotes([...notes, newNoteObj]);
    setNewNote('');
  };
  
  
  if (!selectedShow) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a show to view details</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Show Selector and Basic Info */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium text-gray-900 uppercase">{selectedShow.title}</h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedShow.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : selectedShow.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-beige text-black'
                }`}>
                  {selectedShow.status.charAt(0).toUpperCase() + selectedShow.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500">{formatDate(selectedShow.date)} • {selectedShow.time}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-900">{localTime}</p>
              </div>
            </div>
            
            <select
              value={selectedShowId || ''}
              onChange={(e) => setSelectedShowId(Number(e.target.value))}
              className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {MOCK_SHOWS.map(show => (
                <option key={show.id} value={show.id}>
                  {show.title} - {formatDate(show.date)}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => navigate(`/live/show/${selectedShowId}`)}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Details
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content in 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Day Schedule */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('schedule')}
            >
              <h2 className="text-lg font-medium text-gray-900 uppercase">
                DAY SCHEDULE
              </h2>
              {expandedSections.schedule ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {expandedSections.schedule && (
              <div className="mt-4">
                {selectedShow.advances ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.schedule.loadIn}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-primary -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Load In</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.catering.mealTimes.lunch}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-blue-500 -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Lunch</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.schedule.soundcheck}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-primary -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Soundcheck</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.catering.mealTimes.dinner}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-blue-500 -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Dinner</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.schedule.doors}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-green-500 -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Doors Open</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.schedule.showtime}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-light-blue0 -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Show Time</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right text-sm font-medium text-gray-500">
                          {selectedShow.advances.schedule.curfew}
                        </div>
                        <div className="relative">
                          <div className="absolute top-1/2 -left-2 w-3 h-3 rounded-full bg-red-500 -translate-y-1/2"></div>
                          <div className="pl-4">
                            <h3 className="text-sm font-medium text-gray-900">Curfew</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">No schedule available</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Venue Information */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('venue')}
            >
              <h2 className="text-lg font-medium text-gray-900 uppercase">
                VENUE INFORMATION
              </h2>
              {expandedSections.venue ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {expandedSections.venue && venueInfo && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Address</h3>
                      <p className="text-sm text-gray-900">{venueInfo.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Phone</h3>
                      <p className="text-sm text-gray-900">{venueInfo.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Parking</h3>
                      <p className="text-sm text-gray-900">{venueInfo.parkingInfo}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notes</h3>
                      <p className="text-sm text-gray-900">{venueInfo.notes}</p>
                    </div>
                  </div>
                </div>
                
                <div className="h-40 bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(venueInfo.name + ', ' + venueInfo.address)}`}
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
          
          {/* Hotels */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('hotels')}
            >
              <h2 className="text-lg font-medium text-gray-900 uppercase">
                HOTELS
              </h2>
              {expandedSections.hotels ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {expandedSections.hotels && (
              <div className="mt-4">
                {hotelInfo && hotelInfo.length > 0 ? (
                  <div className="space-y-3">
                    {hotelInfo.map((hotel, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:border-light-blue transition-colors">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium text-gray-900">{hotel.name}</h3>
                          <span className="text-xs bg-beige text-black px-2 py-0.5 rounded-full">
                            {hotel.distanceToVenue}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600">{hotel.address}</p>
                          </div>
                          
                          <div className="flex items-start gap-1">
                            <Phone className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600">{hotel.phone}</p>
                          </div>
                          
                          <div className="flex items-start gap-1">
                            <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600">
                              Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}
                            </p>
                          </div>
                          
                          <div className="flex items-start gap-1">
                            <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600">
                              Confirmation: {hotel.confirmationNumber}
                            </p>
                          </div>
                        </div>
                        
                        {hotel.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">{hotel.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">No hotels added</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* Key Contacts */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('contacts')}
            >
              <h2 className="text-lg font-medium text-gray-900 uppercase">
                KEY CONTACTS
              </h2>
              {expandedSections.contacts ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {expandedSections.contacts && (
              <div className="mt-4">
                {keyContacts && keyContacts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {keyContacts.map((contact, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:border-light-blue transition-colors">
                        <h3 className="text-sm font-medium text-gray-900">{contact.name}</h3>
                        <p className="text-xs text-primary">{contact.role}</p>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <a href={`tel:${contact.phone}`} className="text-xs text-gray-600 hover:text-primary">
                              {contact.phone}
                            </a>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <a href={`mailto:${contact.email}`} className="text-xs text-gray-600 hover:text-primary">
                              {contact.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">No contacts added</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('notes')}
            >
              <h2 className="text-lg font-medium text-gray-900 uppercase">
                NOTES
              </h2>
              {expandedSections.notes ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {expandedSections.notes && (
              <div className="mt-4">
                {notes && notes.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium text-gray-900">{note.title}</h3>
                          <span className="text-xs text-gray-500">{note.date}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{note.content}</p>
                        <p className="mt-1 text-xs text-gray-500">Added by {note.author}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">No notes added</p>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a new note..."
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      rows={2}
                    ></textarea>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-3 py-1 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary disabled:opacity-50 self-end"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 gap-2">
              <a 
                href={venueInfo?.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <LinkIcon className="w-4 h-4 text-primary" />
                Venue Website
              </a>
              
              <button
                onClick={() => navigate(`/live/show/${selectedShowId}/logistics`)}
                className="flex items-center gap-2 p-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <Truck className="w-4 h-4 text-primary" />
                Logistics
              </button>
              
              <button
                onClick={() => navigate(`/live/show/${selectedShowId}/production`)}
                className="flex items-center gap-2 p-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-primary" />
                Production Files
              </button>
              
              <button
                onClick={() => navigate(`/live/show/${selectedShowId}/marketing`)}
                className="flex items-center gap-2 p-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <Calendar className="w-4 h-4 text-primary" />
                Marketing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
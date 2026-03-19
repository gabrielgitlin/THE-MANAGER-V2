import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Upload, Phone, Mail, User, Calendar, Flag, Import as Passport, Plane, MapPin, CreditCard, AlertCircle, FileText, X, DollarSign, Pencil, Tag as TagIcon, Filter, CreditCard as Edit2 } from 'lucide-react';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CrewMember, CrewRole, Show, Tag } from '../types';
import { CREW_MEMBERS, DEFAULT_TAGS } from '../data/logistics';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';

export default function Team() {
  const navigate = useNavigate();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingShow, setIsAddingShow] = useState(false);
  const [newShowId, setNewShowId] = useState<number | ''>('');
  const [newShowFee, setNewShowFee] = useState<number | ''>('');
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [isSettingStandardFee, setIsSettingStandardFee] = useState(false);
  const [standardFee, setStandardFee] = useState<number | ''>('');
  
  // Tag management
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6'); // Default blue
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [showTagFilters, setShowTagFilters] = useState(false);

  // Filter crew members by search term and selected tags
  const filteredCrew = crew.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      (member.tags && selectedTags.every(tag => member.tags?.includes(tag)));
    
    return matchesSearch && matchesTags;
  });

  const handleAddShow = (memberId: number) => {
    if (!newShowId || !selectedMember) return;
    
    const show = null; // TODO: Load from database
    if (!show) return;
    
    // Check if show already exists for this member
    const existingShow = selectedMember.shows?.find(s => s.name === show.title);
    if (existingShow) {
      alert(`${selectedMember.name} is already assigned to ${show.title}`);
      return;
    }
    
    // Add the show to the member's shows
    const updatedMember = { 
      ...selectedMember,
      shows: [
        ...(selectedMember.shows || []),
        {
          name: show.title,
          date: show.date,
          status: 'Confirmed',
          fee: selectedMember.standardFee || Number(newShowFee) || undefined
        }
      ]
    };
    
    setCrew(crew.map(member => 
      member.id === memberId ? updatedMember : member
    ));
    
    setSelectedMember(updatedMember);
    setIsAddingShow(false);
    setNewShowId('');
    setNewShowFee('');
  };

  const handleExportContactPDF = () => {
    if (!selectedMember) return;
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Set font sizes and styles
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    // Add title
    doc.text('Contact Information', 105, 20, { align: 'center' });
    
    // Add logo or header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('THE MANAGER', 105, 30, { align: 'center' });
    doc.text('Tour Personnel Contact', 105, 35, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(165, 138, 103); // sand-500 color
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
    
    // Add person's name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedMember.name, 20, 55);
    
    // Add role
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(
      selectedMember.role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '), 
      20, 65
    );
    
    // Add tags if available
    if (selectedMember.tags && selectedMember.tags.length > 0) {
      doc.setFontSize(12);
      doc.text('Tags:', 20, 75);
      
      const tagNames = selectedMember.tags.map(tagId => {
        const tag = tags.find(t => t.id === tagId);
        return tag ? tag.name : tagId;
      }).join(', ');
      
      doc.text(tagNames, 50, 75);
    }
    
    // Add contact information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Information:', 20, 90);
    
    doc.setFont('helvetica', 'normal');
    
    // Add phone with icon placeholder
    doc.text('Phone:', 25, 100);
    doc.text(selectedMember.phone || 'N/A', 70, 100);
    
    // Add email with icon placeholder
    doc.text('Email:', 25, 110);
    doc.text(selectedMember.email || 'N/A', 70, 110);
    
    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated on ' + formatDate(new Date()), 20, 280);
    doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', 105, 280, { align: 'center' });
    
    // Save the PDF
    doc.save(`${selectedMember.name.replace(/\s+/g, '_')}_contact.pdf`);
  };

  const handleUpdateSelectedMember = (updates: Partial<CrewMember>) => {
    if (!selectedMember) return;

    const updatedMember = { ...selectedMember, ...updates };
    setCrew(crew.map(member => 
      member.id === selectedMember.id ? updatedMember : member
    ));
    setSelectedMember(updatedMember);
  };

  const handleRemoveRole = () => {
    if (!selectedMember) return;
    handleUpdateSelectedMember({ role: 'other' });
  };

  const handleRemoveGender = () => {
    if (!selectedMember) return;
    handleUpdateSelectedMember({ gender: undefined });
  };

  const handleRemoveNationality = () => {
    if (!selectedMember) return;
    handleUpdateSelectedMember({ nationality: undefined });
  };

  const handleSetStandardFee = () => {
    if (!selectedMember || standardFee === '') return;
    
    // Update the member's standard fee
    handleUpdateSelectedMember({ 
      standardFee: Number(standardFee)
    });
    
    setIsSettingStandardFee(false);
    setStandardFee('');
  };

  const handleUpdateShowFee = (showName: string, newFee: number) => {
    if (!selectedMember) return;
    
    // Update the fee for the specific show
    const updatedShows = selectedMember.shows?.map(show => 
      show.name === showName ? { ...show, fee: newFee } : show
    );
    
    handleUpdateSelectedMember({ shows: updatedShows });
    setIsEditingFee(false);
  };

  const handleRemoveShow = (showName: string) => {
    if (!selectedMember) return;
    
    if (window.confirm(`Remove ${showName} from ${selectedMember.name}'s schedule?`)) {
      const updatedShows = selectedMember.shows?.filter(show => show.name !== showName);
      handleUpdateSelectedMember({ shows: updatedShows });
    }
  };

  const isManagerRole = (role: CrewRole) => {
    return role === 'tour_manager' || role === 'production_manager';
  };

  const calculateTotalFees = () => {
    if (!selectedMember || !selectedMember.shows) return 0;
    
    return selectedMember.shows.reduce((total, show) => {
      return total + (show.fee || 0);
    }, 0);
  };

  const exportFeesReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Personnel Fees Report', 105, 20, { align: 'center' });
    
    // Add generation date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${formatDate(new Date())}`, 105, 30, { align: 'center' });
    
    // Create data for the table
    const tableData = crew
      .filter(member => !isManagerRole(member.role) && member.shows && member.shows.length > 0)
      .flatMap(member => 
        member.shows?.map(show => [
          member.name,
          member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          show.name,
          show.date,
          show.status,
          show.fee ? `$${show.fee}` : 'N/A'
        ]) || []
      );
    
    // Add the table
    autoTable(doc, {
      startY: 40,
      head: [['Name', 'Role', 'Show', 'Date', 'Status', 'Fee']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });
    
    // Add summary
    const summaryY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Fee Summary by Personnel', 14, summaryY);
    
    const summaryData = crew
      .filter(member => !isManagerRole(member.role) && member.shows && member.shows.some(show => show.fee))
      .map(member => [
        member.name,
        member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        member.shows?.length || 0,
        `$${member.shows?.reduce((sum, show) => sum + (show.fee || 0), 0)}`
      ]);
    
    autoTable(doc, {
      startY: summaryY + 5,
      head: [['Name', 'Role', 'Show Count', 'Total Fees']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });
    
    // Add grand total
    const grandTotal = crew.reduce((total, member) => {
      const memberTotal = member.shows?.reduce((sum, show) => sum + (show.fee || 0), 0) || 0;
      return total + memberTotal;
    }, 0);
    
    const totalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: $${grandTotal}`, 170, totalY, { align: 'right' });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(128, 128, 128);
      doc.text(
        'Generated by THE MANAGER',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }
    
    doc.save('personnel_fees_report.pdf');
  };

  // Tag management functions
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag: Tag = {
      id: newTagName.toLowerCase().replace(/\s+/g, '_'),
      name: newTagName.trim(),
      color: newTagColor
    };
    
    setTags([...tags, newTag]);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setIsTagModalOpen(false);
  };

  const handleUpdateTag = () => {
    if (!editingTag || !newTagName.trim()) return;
    
    const updatedTags = tags.map(tag => 
      tag.id === editingTag.id 
        ? { ...tag, name: newTagName.trim(), color: newTagColor }
        : tag
    );
    
    setTags(updatedTags);
    
    // Update all crew members that have this tag
    const updatedCrew = crew.map(member => {
      if (member.tags?.includes(editingTag.id)) {
        return member;
      }
      return member;
    });
    
    setCrew(updatedCrew);
    
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setIsTagModalOpen(false);
  };

  const handleDeleteTag = (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all team members.')) {
      // Remove the tag from the tags list
      setTags(tags.filter(tag => tag.id !== tagId));
      
      // Remove the tag from all crew members
      const updatedCrew = crew.map(member => {
        if (member.tags?.includes(tagId)) {
          return {
            ...member,
            tags: member.tags.filter(t => t !== tagId)
          };
        }
        return member;
      });
      
      setCrew(updatedCrew);
      
      // Update selected member if needed
      if (selectedMember?.tags?.includes(tagId)) {
        setSelectedMember({
          ...selectedMember,
          tags: selectedMember.tags.filter(t => t !== tagId)
        });
      }
      
      // Remove from selected tags if needed
      if (selectedTags.includes(tagId)) {
        setSelectedTags(selectedTags.filter(t => t !== tagId));
      }
    }
  };

  const handleToggleMemberTag = (tagId: string) => {
    if (!selectedMember) return;
    
    const currentTags = selectedMember.tags || [];
    let newTags: string[];
    
    if (currentTags.includes(tagId)) {
      // Remove tag
      newTags = currentTags.filter(t => t !== tagId);
    } else {
      // Add tag
      newTags = [...currentTags, tagId];
    }
    
    handleUpdateSelectedMember({ tags: newTags });
  };

  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal font-title">TEAM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage crew members, their schedules, and fees
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsManagingTags(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Manage Tags
          </button>
          <button
            onClick={exportFeesReport}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
          >
            Export Fees Report
          </button>
        </div>
      </div>
      
      <div className="flex gap-4">
        {/* Personnel List */}
        <div className="w-1/3 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Personnel</h2>
              <button
                onClick={() => {
                  const newMember: CrewMember = {
                    id: crew.length + 1,
                    name: 'New Team Member',
                    role: 'other',
                    phone: '',
                    email: '',
                    shows: [],
                    tags: []
                  };
                  setCrew([...crew, newMember]);
                  setSelectedMember(newMember);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              
              {/* Tag filters - initially collapsed */}
              <div>
                <button 
                  onClick={() => setShowTagFilters(!showTagFilters)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <TagIcon className="w-4 h-4" />
                  <span>Filter by tags</span>
                  {selectedTags.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-beige text-black rounded-full">
                      {selectedTags.length}
                    </span>
                  )}
                </button>
                
                {(showTagFilters || selectedTags.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          if (selectedTags.includes(tag.id)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag.id));
                          } else {
                            setSelectedTags([...selectedTags, tag.id]);
                          }
                        }}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedTags.includes(tag.id)
                            ? 'text-white'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined
                        }}
                      >
                        {tag.name}
                        {selectedTags.includes(tag.id) && (
                          <X className="ml-1 w-3 h-3" />
                        )}
                      </button>
                    ))}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredCrew.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`w-full p-4 text-left hover:bg-gray-50 ${selectedMember?.id === member.id ? 'bg-beige' : ''}`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-sm text-gray-500">
                    {member.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                  {member.tags && member.tags.length > 0 && selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.tags.filter(tagId => selectedTags.includes(tagId)).map(tagId => {
                        const tag = getTagById(tagId);
                        if (!tag) return null;
                        return (
                          <span 
                            key={tagId} 
                            className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {filteredCrew.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No team members found matching your criteria
              </div>
            )}
          </div>
        </div>

        {/* Personnel Details */}
        {selectedMember && (
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <input
                  type="text"
                  value={selectedMember.name}
                  onChange={(e) => handleUpdateSelectedMember({ name: e.target.value })}
                  className="text-2xl font-bold text-charcoal bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                />
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={selectedMember.role}
                    onChange={(e) => handleUpdateSelectedMember({ role: e.target.value as CrewRole })}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-beige text-black border-none focus:outline-none focus:ring-0"
                  >
                    <option value="tour_manager">Tour Manager</option>
                    <option value="production_manager">Production Manager</option>
                    <option value="sound_engineer">Sound Engineer</option>
                    <option value="lighting_tech">Lighting Tech</option>
                    <option value="stage_manager">Stage Manager</option>
                    <option value="backline_tech">Backline Tech</option>
                    <option value="monitor_engineer">Monitor Engineer</option>
                    <option value="guitar_tech">Guitar Tech</option>
                    <option value="drum_tech">Drum Tech</option>
                    <option value="keyboard_tech">Keyboard Tech</option>
                    <option value="rigger">Rigger</option>
                    <option value="video_director">Video Director</option>
                    <option value="photographer">Photographer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleExportContactPDF}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
              >
                Share Contact
              </button>
            </div>

            {/* Tags section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleMemberTag(tag.id)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedMember.tags?.includes(tag.id)
                        ? 'text-white'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedMember.tags?.includes(tag.id) ? tag.color : undefined
                    }}
                  >
                    {tag.name}
                    {selectedMember.tags?.includes(tag.id) ? (
                      <X className="ml-1 w-3 h-3" />
                    ) : (
                      <Plus className="ml-1 w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Born</label>
                <input
                  type="date"
                  value={selectedMember.birthDate || ''}
                  onChange={(e) => handleUpdateSelectedMember({ birthDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={selectedMember.phone}
                  onChange={(e) => handleUpdateSelectedMember({ phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={selectedMember.email}
                  onChange={(e) => handleUpdateSelectedMember({ email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <div className="mt-1 flex items-center gap-2">
                  {selectedMember.gender ? (
                    <>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {selectedMember.gender}
                      </span>
                      <button 
                        onClick={handleRemoveGender}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button className="text-xs text-primary hover:text-black">
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                <div className="mt-1 flex items-center gap-2">
                  {selectedMember.nationality ? (
                    <>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {selectedMember.nationality}
                      </span>
                      <button 
                        onClick={handleRemoveNationality}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button className="text-xs text-primary hover:text-black">
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport/ID</label>
                <input
                  type="text"
                  value={selectedMember.passportId || ''}
                  onChange={(e) => handleUpdateSelectedMember({ passportId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Home Airport</label>
                <input
                  type="text"
                  value={selectedMember.homeAirport || ''}
                  onChange={(e) => handleUpdateSelectedMember({ homeAirport: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Seating Preference</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="text"
                    value={selectedMember.seatingPreference || ''}
                    onChange={(e) => handleUpdateSelectedMember({ seatingPreference: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Add seating preference"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Known Traveler #</label>
                <input
                  type="text"
                  value={selectedMember.knownTraveler || ''}
                  onChange={(e) => handleUpdateSelectedMember({ knownTraveler: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mileage Plan #</label>
                <input
                  type="text"
                  value={selectedMember.mileagePlan || ''}
                  onChange={(e) => handleUpdateSelectedMember({ mileagePlan: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            {/* Standard Fee Section (only for non-managers) */}
            {!isManagerRole(selectedMember.role) && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Standard Fee</h3>
                  {isSettingStandardFee ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={standardFee}
                          onChange={(e) => setStandardFee(e.target.value === '' ? '' : Number(e.target.value))}
                          className="pl-7 block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="0.00"
                          min="0"
                          step="25"
                        />
                      </div>
                      <button
                        onClick={handleSetStandardFee}
                        className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-primary"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-black">
                        {selectedMember.standardFee ? `$${selectedMember.standardFee}` : 'Not set'}
                      </span>
                      <button
                        onClick={() => {
                          setIsSettingStandardFee(true);
                          setStandardFee(selectedMember.standardFee || '');
                        }}
                        className="p-1 text-gray-400 hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Standard fee applied to all new show assignments
                </p>
              </div>
            )}

            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Shows</h3>
                <button
                  onClick={() => setIsAddingShow(true)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-black"
                >
                  <Plus className="w-4 h-4" />
                  Add show
                </button>
              </div>

              {isAddingShow ? (
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Select Show
                      </label>
                      <select
                        value={newShowId}
                        onChange={(e) => setNewShowId(e.target.value === '' ? '' : Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      >
                        <option value="">Select a show</option>
                      </select>
                    </div>
                    {!isManagerRole(selectedMember.role) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fee
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            value={newShowFee}
                            onChange={(e) => setNewShowFee(e.target.value === '' ? '' : Number(e.target.value))}
                            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder={selectedMember.standardFee ? selectedMember.standardFee.toString() : '0.00'}
                            min="0"
                            step="25"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingShow(false)}
                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddShow(selectedMember.id)}
                      className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-primary"
                    >
                      Add Show
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {selectedMember.shows?.map((show, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{show.name}</p>
                        <p className="text-xs text-gray-500">{show.date} • {show.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!isManagerRole(selectedMember.role) && (
                        isEditingFee && selectedMember.shows && selectedMember.shows[index] === show ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                value={show.fee || ''}
                                onChange={(e) => {
                                  const updatedShows = [...(selectedMember.shows || [])];
                                  updatedShows[index] = {
                                    ...show,
                                    fee: e.target.value === '' ? undefined : Number(e.target.value)
                                  };
                                  handleUpdateSelectedMember({ shows: updatedShows });
                                }}
                                className="pl-7 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                min="0"
                                step="25"
                              />
                            </div>
                            <button
                              onClick={() => setIsEditingFee(false)}
                              className="px-2 py-1 text-xs text-white bg-primary rounded hover:bg-primary"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-black">
                              {show.fee ? `$${show.fee}` : 'No fee'}
                            </span>
                            <button
                              onClick={() => setIsEditingFee(true)}
                              className="p-1 text-gray-400 hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                      <button
                        onClick={() => handleRemoveShow(show.name)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!selectedMember.shows || selectedMember.shows.length === 0) && (
                  <div className="p-4 text-center text-gray-500">
                    No shows assigned yet
                  </div>
                )}
              </div>

              {!isManagerRole(selectedMember.role) && selectedMember.shows && selectedMember.shows.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Fees:</span>
                    <span className="text-lg font-bold text-black">${calculateTotalFees()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Attachments</h3>
              <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <p className="text-sm text-gray-500">
                  Drop files here <span className="text-gray-400">or</span>{' '}
                  <button className="text-primary hover:text-black">browse</button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tag Management Modal */}
      <Modal
        isOpen={isManagingTags}
        onClose={() => setIsManagingTags(false)}
        title="Manage Tags"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Team Tags</h3>
            <button
              onClick={() => {
                setIsTagModalOpen(true);
                setEditingTag(null);
                setNewTagName('');
                setNewTagColor('#3B82F6');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
            >
              <Plus className="w-4 h-4" />
              Add New Tag
            </button>
          </div>
          
          <div className="space-y-4">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="text-sm font-medium">{tag.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTag(tag);
                      setNewTagName(tag.name);
                      setNewTagColor(tag.color);
                      setIsTagModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {tags.length === 0 && (
              <div className="text-center py-8">
                <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tags</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new tag.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add/Edit Tag Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setEditingTag(null);
          setNewTagName('');
          setNewTagColor('#3B82F6');
        }}
        title={editingTag ? "Edit Tag" : "Add New Tag"}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tag Name
            </label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="e.g., Touring Party A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tag Color
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-10 h-10 rounded border-0 p-0"
              />
              <div
                className="px-3 py-1.5 rounded-full text-sm text-white"
                style={{ backgroundColor: newTagColor }}
              >
                {newTagName || 'Tag Preview'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsTagModalOpen(false);
                setEditingTag(null);
                setNewTagName('');
                setNewTagColor('#3B82F6');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={editingTag ? handleUpdateTag : handleAddTag}
              disabled={!newTagName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary disabled:opacity-50"
            >
              {editingTag ? 'Update Tag' : 'Add Tag'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
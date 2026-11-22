import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonnelList from '../components/personnel/PersonnelList';
import PersonnelForm from '../components/personnel/PersonnelForm';
import Modal from '../components/Modal';
import { getPersonnelProfiles, getPROs, getPublishers, deletePersonnelProfile } from '../lib/personnel';
import type { PersonnelProfile } from '../types/personnel';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Personnel() {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<PersonnelProfile[]>([]);
  const [pros, setPros] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonnelProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [personnelData, prosData, publishersData] = await Promise.all([
          getPersonnelProfiles(),
          getPROs(),
          getPublishers(),
        ]);
        setPersonnel(personnelData);
        setPros(prosData);
        setPublishers(publishersData);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = 
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone?.includes(searchTerm);
    
    const matchesType = selectedType === 'all' || person.type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleEdit = (id: string) => {
    const person = personnel.find(p => p.id === id);
    if (person) {
      setSelectedPerson(person);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await deletePersonnelProfile(id);
        setPersonnel(personnel.filter(p => p.id !== id));
      } catch (err) {
        console.error('Error deleting personnel:', err);
        setError('Failed to delete personnel. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div>
      {error && (
        <div className="mb-8 p-4 border-l-4 text-red-700" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--status-red)' }}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <img src="/TM-Search-negro.svg" className="pxi-lg icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
              <input
                type="text"
                placeholder="Search personnel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            >
              <option value="all">All Types</option>
              <option value="songwriter">Songwriters</option>
              <option value="producer">Producers</option>
              <option value="artist">Artists</option>
              <option value="mix_engineer">Mix Engineers</option>
              <option value="mastering_engineer">Mastering Engineers</option>
            </select>
          </div>
        </div>
      </div>

      <PersonnelList
        personnel={filteredPersonnel}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPerson(null);
        }}
        title={selectedPerson ? 'Edit Personnel' : 'Add Personnel'}
      >
        <PersonnelForm
          initialData={selectedPerson || undefined}
          onSubmit={async (data) => {
            try {
              // Handle form submission
              setIsModalOpen(false);
              setSelectedPerson(null);
              
              // Refresh the personnel list
              const updatedPersonnel = await getPersonnelProfiles();
              setPersonnel(updatedPersonnel);
            } catch (err) {
              console.error('Error saving personnel:', err);
              setError('Failed to save personnel. Please try again.');
            }
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedPerson(null);
          }}
          pros={pros}
          publishers={publishers}
        />
      </Modal>
    </div>
  );
}
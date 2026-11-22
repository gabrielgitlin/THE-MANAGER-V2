import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Users, Key, Eye, EyeOff, Plus, User, Mail, Phone, MapPin, Calendar, Flag, Import as Passport, FileText, Globe, CreditCard, Building2, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { TMDatePicker } from '../components/ui/TMDatePicker';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';

interface PersonalInfo {
  firstName: string;
  familyName: string;
  position: string;
  address: string;
  zipCode: string;
  country: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  placeOfBirth: string;
  citizenship: string;
  passportNumber: string;
  passportIssued: string;
  passportExpires: string;
  passportIssuedBy: string;
}

interface BankingInfo {
  // Credit Card 1
  card1AccountName: string;
  card1Type: string;
  card1Number: string;
  card1Expiry: string;
  card1CVC: string;
  card1BillingAddress: string;
  
  // Credit Card 2
  card2AccountName: string;
  card2Number: string;
  card2Expiry: string;
  card2CVC: string;
  card2BillingAddress: string;
  
  // Bank Account
  bankName: string;
  bankBranchAddress: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankRouting: string;
  bankSwift: string;
  bankWireNumber: string;
  
  // Digital Payment
  paypalZelle: string;
  paypalPassword: string;
}

interface Login {
  id: number;
  platform: string;
  username: string;
  password: string;
  notes?: string;
  lastUpdated: Date;
}

export default function Artist() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'personnel' | 'logins'>('personnel');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [logins, setLogins] = useState<Login[]>([
    {
      id: 1,
      platform: 'Spotify',
      username: 'ledzeppelin',
      password: '********',
      notes: 'Artist account',
      lastUpdated: new Date('2024-01-15'),
    },
    {
      id: 2,
      platform: 'Apple Music',
      username: 'ledzeppelin_official',
      password: '********',
      notes: 'Label account',
      lastUpdated: new Date('2024-01-10'),
    },
  ]);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: 'Peter',
    familyName: 'Grant',
    position: 'Tour Manager',
    address: '123 Music Lane',
    zipCode: 'W1F 9LP',
    country: 'United Kingdom',
    mobile: '+44 20 7123 4567',
    email: 'peter.grant@ledzeppelin.com',
    dateOfBirth: '1935-04-05',
    placeOfBirth: 'London',
    citizenship: 'British',
    passportNumber: 'GBR123456',
    passportIssued: '2020-01-15',
    passportExpires: '2030-01-14',
    passportIssuedBy: 'HMPO London',
  });

  const [bankingInfo, setBankingInfo] = useState<BankingInfo>({
    // Credit Card 1
    card1AccountName: 'Peter Grant',
    card1Type: 'Visa',
    card1Number: '•••• •••• •••• 4242',
    card1Expiry: '12/25',
    card1CVC: '•••',
    card1BillingAddress: '123 Music Lane, London, W1F 9LP',
    
    // Credit Card 2
    card2AccountName: 'Peter Grant',
    card2Number: '•••• •••• •••• 5555',
    card2Expiry: '06/24',
    card2CVC: '•••',
    card2BillingAddress: '123 Music Lane, London, W1F 9LP',
    
    // Bank Account
    bankName: 'Barclays Bank',
    bankBranchAddress: '1 Churchill Place, London E14 5HP',
    bankAccountName: 'Peter Grant',
    bankAccountNumber: '12345678',
    bankRouting: '012345678',
    bankSwift: 'BARCGB22',
    bankWireNumber: 'GB29 BARC 2006 0513 1234 56',
    
    // Digital Payment
    paypalZelle: 'peter.grant@ledzeppelin.com',
    paypalPassword: '••••••••',
  });

  const [isAddingLogin, setIsAddingLogin] = useState(false);
  const [editingLoginId, setEditingLoginId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [newLogin, setNewLogin] = useState<Omit<Login, 'id' | 'lastUpdated'>>({
    platform: '',
    username: '',
    password: '',
    notes: '',
  });

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (password === '123') {
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Authentication failed');
    }
    
    setPassword('');
  };

  const handleAddLogin = () => {
    if (!newLogin.platform || !newLogin.username || !newLogin.password) return;

    const login: Login = {
      id: Math.max(0, ...logins.map(l => l.id)) + 1,
      ...newLogin,
      lastUpdated: new Date(),
    };

    setLogins([...logins, login]);
    setNewLogin({
      platform: '',
      username: '',
      password: '',
      notes: '',
    });
    setIsAddingLogin(false);
  };

  const handleUpdateLogin = () => {
    if (!editingLoginId || !newLogin.platform || !newLogin.username || !newLogin.password) return;

    setLogins(logins.map(login => 
      login.id === editingLoginId
        ? { ...login, ...newLogin, lastUpdated: new Date() }
        : login
    ));
    setNewLogin({
      platform: '',
      username: '',
      password: '',
      notes: '',
    });
    setEditingLoginId(null);
  };

  const handleDeleteLogin = (id: number) => {
    setLogins(logins.filter(login => login.id !== id));
    setShowDeleteConfirm(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div style={{backgroundColor: "var(--surface)", padding: "32px"}} className="shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2" style={{color: "var(--t1)"}}>
            Protected Information
          </h2>
          <p className="text-center mb-6" style={{color: "var(--t3)"}}>
            Please enter your password to access sensitive information
          </p>

          <div style={{backgroundColor: "var(--surface-2)", borderLeft: "4px solid var(--brand-1)", padding: "16px"}} className="mb-6">
            <div className="flex items-start">
              <img src="/TM-Info-negro.svg" className="pxi-lg icon-muted mt-0.5" alt="" />
              <div className="ml-3">
                <p className="text-sm" style={{color: "var(--t1)"}}>
                  This section contains sensitive information. Make sure you're in a private location.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)"}}
                  className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{color: "var(--t3)"}} />
                  ) : (
                    <Eye className="h-4 w-4" style={{color: "var(--t3)"}} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sub-tabs mb-6">
        <button
          onClick={() => setActiveTab('logins')}
          className={`sub-tab ${activeTab === 'logins' ? 'active' : ''}`}
        >
          <Key className="tab-icon" />
          Logins & Passwords
        </button>
        <button
          onClick={() => setActiveTab('personnel')}
          className={`sub-tab ${activeTab === 'personnel' ? 'active' : ''}`}
        >
          <Users className="tab-icon" />
          Personal Information
        </button>
      </div>

      <div style={{backgroundColor: "var(--surface)", shadow: "md"}}>
        <div style={{padding: "24px", borderBottom: "1px solid var(--border)"}}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium" style={{color: "var(--t1)"}}>
              {activeTab === 'logins' ? 'Logins & Passwords' : 'Personal Information'}
            </h2>
            {activeTab === 'logins' && (
              <button
                onClick={() => {
                  setIsAddingLogin(true);
                  setEditingLoginId(null);
                  setNewLogin({
                    platform: '',
                    username: '',
                    password: '',
                    notes: '',
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Login
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'logins' ? (
            <div>
              {isAddingLogin || editingLoginId ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Platform
                    </label>
                    <input
                      type="text"
                      value={newLogin.platform}
                      onChange={(e) => setNewLogin({ ...newLogin, platform: e.target.value })}
                      style={{marginTop: "4px", backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)"}}
                      className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="e.g., Spotify"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={newLogin.username}
                      onChange={(e) => setNewLogin({ ...newLogin, username: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={newLogin.password}
                      onChange={(e) => setNewLogin({ ...newLogin, password: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Notes
                    </label>
                    <textarea
                      value={newLogin.notes}
                      onChange={(e) => setNewLogin({ ...newLogin, notes: e.target.value })}
                      rows={3}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddingLogin(false);
                        setEditingLoginId(null);
                        setNewLogin({
                          platform: '',
                          username: '',
                          password: '',
                          notes: '',
                        });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingLoginId ? handleUpdateLogin : handleAddLogin}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                    >
                      {editingLoginId ? 'Save Changes' : 'Add Login'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table style={{width: "100%", borderCollapse: "collapse"}}>
                    <thead>
                      <tr style={{borderBottom: "1px solid var(--border)"}}>
                        <th style={{padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "var(--t3)", textTransform: "uppercase"}}>Platform</th>
                        <th style={{padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "var(--t3)", textTransform: "uppercase"}}>Username</th>
                        <th style={{padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "var(--t3)", textTransform: "uppercase"}}>Password</th>
                        <th style={{padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "var(--t3)", textTransform: "uppercase"}}>Notes</th>
                        <th style={{padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "var(--t3)", textTransform: "uppercase"}}>Last Updated</th>
                        <th style={{padding: "12px 24px", textAlign: "right", fontSize: "12px", fontWeight: 500, color: "var(--t3)", textTransform: "uppercase"}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody style={{borderCollapse: "collapse"}}>
                      {logins.map((login) => (
                        <tr key={login.id} style={{borderBottom: "1px solid var(--border)"}}>
                          <td style={{padding: "16px 24px", whiteSpace: "nowrap", fontSize: "14px", color: "var(--t1)"}}>{login.platform}</td>
                          <td style={{padding: "16px 24px", whiteSpace: "nowrap", fontSize: "14px", color: "var(--t1)"}}>{login.username}</td>
                          <td style={{padding: "16px 24px", whiteSpace: "nowrap", fontSize: "14px", color: "var(--t1)"}}>{login.password}</td>
                          <td style={{padding: "16px 24px", fontSize: "14px", color: "var(--t3)"}}>{login.notes}</td>
                          <td style={{padding: "16px 24px", whiteSpace: "nowrap", fontSize: "14px", color: "var(--t3)"}}>
                            {formatDate(login.lastUpdated)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingLoginId(login.id);
                                  setNewLogin({
                                    platform: login.platform,
                                    username: login.username,
                                    password: login.password,
                                    notes: login.notes,
                                  });
                                }}
                                className="text-primary hover:text-primary/80"
                              >
                                <img src="/TM-Pluma-negro.png" className="pxi-md icon-white" alt="" />
                              </button>
                              {showDeleteConfirm === login.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDeleteLogin(login.id)}
                                    className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowDeleteConfirm(login.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* General Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4" style={{color: "var(--t1)"}}>General Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={personalInfo.familyName}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, familyName: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Position
                    </label>
                    <input
                      type="text"
                      value={personalInfo.position}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, position: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Address
                    </label>
                    <input
                      type="text"
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      ZIP/Post Code
                    </label>
                    <input
                      type="text"
                      value={personalInfo.zipCode}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, zipCode: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={personalInfo.country}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Mobile / Cell #
                    </label>
                    <input
                      type="tel"
                      value={personalInfo.mobile}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, mobile: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Date of Birth
                    </label>
                    <TMDatePicker
                      value={personalInfo.dateOfBirth}
                      onChange={(date) => setPersonalInfo({ ...personalInfo, dateOfBirth: date })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Place of Birth
                    </label>
                    <input
                      type="text"
                      value={personalInfo.placeOfBirth}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, placeOfBirth: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Citizenship
                    </label>
                    <input
                      type="text"
                      value={personalInfo.citizenship}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, citizenship: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Passport #
                    </label>
                    <input
                      type="text"
                      value={personalInfo.passportNumber}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, passportNumber: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Issued
                    </label>
                    <TMDatePicker
                      value={personalInfo.passportIssued}
                      onChange={(date) => setPersonalInfo({ ...personalInfo, passportIssued: date })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Expires
                    </label>
                    <TMDatePicker
                      value={personalInfo.passportExpires}
                      onChange={(date) => setPersonalInfo({ ...personalInfo, passportExpires: date })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>
                      Issued by
                    </label>
                    <input
                      type="text"
                      value={personalInfo.passportIssuedBy}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, passportIssuedBy: e.target.value })}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Banking Information Section */}
              <div style={{paddingTop: "32px", borderTop: "1px solid var(--border)"}}>
                <h3 className="text-lg font-medium mb-6" style={{color: "var(--t1)"}}>Banking Information</h3>
                
                {/* Credit Card 1 */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{color: "var(--t2)"}}>
                    <CreditCard className="w-4 h-4" />
                    Credit Card 1
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Account Name</label>
                      <input
                        type="text"
                        value={bankingInfo.card1AccountName}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card1AccountName: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Type</label>
                      <input
                        type="text"
                        value={bankingInfo.card1Type}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card1Type: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Card Number</label>
                      <input
                        type="text"
                        value={bankingInfo.card1Number}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card1Number: e .target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Expiry</label>
                        <input
                          type="text"
                          value={bankingInfo.card1Expiry}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, card1Expiry: e.target.value })}
                          style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="MM/YY"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>CVC</label>
                        <input
                          type="text"
                          value={bankingInfo.card1CVC}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, card1CVC: e.target.value })}
                          style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Billing Address</label>
                      <input
                        type="text"
                        value={bankingInfo.card1BillingAddress}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card1BillingAddress: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Credit Card 2 */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{color: "var(--t2)"}}>
                    <CreditCard className="w-4 h-4" />
                    Credit Card 2
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Account Name</label>
                      <input
                        type="text"
                        value={bankingInfo.card2AccountName}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card2AccountName: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Card Number</label>
                      <input
                        type="text"
                        value={bankingInfo.card2Number}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card2Number: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Expiry</label>
                        <input
                          type="text"
                          value={bankingInfo.card2Expiry}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, card2Expiry: e.target.value })}
                          style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="MM/YY"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>CVC</label>
                        <input
                          type="text"
                          value={bankingInfo.card2CVC}
                          onChange={(e) => setBankingInfo({ ...bankingInfo, card2CVC: e.target.value })}
                          style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Billing Address</label>
                      <input
                        type="text"
                        value={bankingInfo.card2BillingAddress}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, card2BillingAddress: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Account */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{color: "var(--t2)"}}>
                    <Building2 className="w-4 h-4" />
                    Bank Account
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Bank Name</label>
                      <input
                        type="text"
                        value={bankingInfo.bankName}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankName: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Branch Address</label>
                      <input
                        type="text"
                        value={bankingInfo.bankBranchAddress}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankBranchAddress: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Account Name</label>
                      <input
                        type="text"
                        value={bankingInfo.bankAccountName}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankAccountName: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Account Number</label>
                      <input
                        type="text"
                        value={bankingInfo.bankAccountNumber}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankAccountNumber: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Routing</label>
                      <input
                        type="text"
                        value={bankingInfo.bankRouting}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankRouting: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>SWIFT</label>
                      <input
                        type="text"
                        value={bankingInfo.bankSwift}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankSwift: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Wire Number</label>
                      <input
                        type="text"
                        value={bankingInfo.bankWireNumber}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, bankWireNumber: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Digital Payment */}
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{color: "var(--t2)"}}>
                    <DollarSign className="w-4 h-4" />
                    Digital Payment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>PayPal / Zelle</label>
                      <input
                        type="text"
                        value={bankingInfo.paypalZelle}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, paypalZelle: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium" style={{color: "var(--t2)"}}>Password</label>
                      <input
                        type="password"
                        value={bankingInfo.paypalPassword}
                        onChange={(e) => setBankingInfo({ ...bankingInfo, paypalPassword: e.target.value })}
                        style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)", marginTop: "4px"}} className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
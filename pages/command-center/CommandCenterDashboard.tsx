import React, { useState, useEffect, useCallback } from 'react';
import type { User, CommandCenterData, Bed, Room, Patient } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { useWebSocket } from '../../hooks/useWebSocket.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { Button } from '../../components/common/Button.tsx';
import { AdmitPatientModal } from './AdmitPatientModal.tsx';
import { DischargePatientModal } from './DischargePatientModal.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

interface CommandCenterDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: string; setActiveView: React.Dispatch<React.SetStateAction<string>>; alertCount: number }> = ({ activeView, setActiveView, alertCount }) => {
  const navItems = [
    { id: 'overview', label: 'Operations Overview', icon: Icons.LayoutDashboardIcon },
    { id: 'capacity', label: 'Hospital Capacity', icon: Icons.BedDoubleIcon },
    { id: 'patient-flow', label: 'Patient Flow', icon: Icons.ArrowLeftRightIcon },
    { id: 'er-status', label: 'ER Dashboard', icon: Icons.AlertTriangleIcon },
    { id: 'resources', label: 'Resources', icon: Icons.PackageIcon },
    { id: 'departments', label: 'Department Status', icon: Icons.BuildingIcon },
  ] as const;
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('overview')} className="sidebar-logo-button"><Logo /><h1>Command Center</h1></button>
      {alertCount > 0 && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <Icons.AlertTriangleIcon className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-900">{alertCount} Active Alert{alertCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => <button key={item.id} onClick={() => setActiveView(item.id)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>)}
      </nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, unit?: string, color: string }> = ({ icon: Icon, title, value, unit, color }) => (
    <div className="stat-card">
        <div className={`stat-card-icon ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="stat-card-title">{title}</p>
            <p className="stat-card-value">{value} <span className="text-base font-medium text-text-secondary">{unit}</span></p>
        </div>
    </div>
);

const BedManagement: React.FC<{ beds: Bed[], rooms: Room[], onBedClick: (bed: Bed) => void }> = ({ beds, rooms, onBedClick }) => {
    const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || 'Unknown Room';
    return (
        <div className="content-card">
            <div className="p-6 border-b border-border-primary">
                <h3 className="text-xl font-semibold text-text-primary">Bed Management</h3>
                <p className="text-sm text-text-secondary">Click an available bed to admit a patient or an occupied bed to view details.</p>
            </div>
            <div className="p-6 bed-grid">
                {beds.map(bed => (
                    <button key={bed.id} onClick={() => onBedClick(bed)} className={`bed-item ${bed.isOccupied ? 'occupied' : 'available'}`}>
                        <Icons.BedIcon className="w-6 h-6 mb-1"/>
                        <span className="bed-item-room">{getRoomName(bed.roomId)}</span>
                        <span className="bed-item-patient">{bed.isOccupied ? bed.patientName : 'Available'}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const PatientDetailsModal: React.FC<{ patient: Patient | null; isOpen: boolean; onClose: () => void; onTransfer?: () => void; onDischarge?: () => void }> = ({ patient, isOpen, onClose, onTransfer, onDischarge }) => {
  if (!isOpen || !patient) return null;

  const los = patient.inpatientStay?.admissionDate ? 
    Math.floor((new Date().getTime() - new Date(patient.inpatientStay.admissionDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-background-primary rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-background-primary border-b border-border-primary px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Patient Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-background-secondary rounded-lg transition-colors">
            <Icons.XIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Name</p>
              <p className="font-semibold text-text-primary">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">MRN</p>
              <p className="font-semibold text-text-primary">{patient.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Date of Birth</p>
              <p className="font-semibold text-text-primary">{patient.dateOfBirth || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Insurance</p>
              <p className="font-semibold text-text-primary">{patient.insurance?.providerId || 'N/A'}</p>
            </div>
          </div>

          {patient.inpatientStay && (
            <>
              <div className="border-t border-border-primary pt-4">
                <h3 className="font-semibold text-lg text-text-primary mb-3">Inpatient Stay</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Room</p>
                    <p className="font-semibold text-text-primary">{patient.inpatientStay.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Length of Stay</p>
                    <p className="font-semibold text-text-primary">{los} day{los !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Admission Date</p>
                    <p className="font-semibold text-text-primary">{new Date(patient.inpatientStay.admissionDate).toLocaleDateString()}</p>
                  </div>
                  {patient.inpatientStay.dischargeDate && (
                    <div>
                      <p className="text-sm text-text-secondary">Discharge Date</p>
                      <p className="font-semibold text-text-primary">{new Date(patient.inpatientStay.dischargeDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border-primary pt-4">
                <h3 className="font-semibold text-lg text-text-primary mb-3">Current Vitals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <p className="text-sm text-text-secondary">Heart Rate</p>
                    <p className="text-xl font-bold text-text-primary">{patient.inpatientStay.currentVitals.heartRate} <span className="text-sm font-normal">bpm</span></p>
                  </div>
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <p className="text-sm text-text-secondary">Blood Pressure</p>
                    <p className="text-xl font-bold text-text-primary">{patient.inpatientStay.currentVitals.bloodPressure} <span className="text-sm font-normal">mmHg</span></p>
                  </div>
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <p className="text-sm text-text-secondary">Respiratory Rate</p>
                    <p className="text-xl font-bold text-text-primary">{patient.inpatientStay.currentVitals.respiratoryRate} <span className="text-sm font-normal">/min</span></p>
                  </div>
                  {patient.inpatientStay.currentVitals.spO2 && (
                    <div className="p-3 bg-background-secondary rounded-lg">
                      <p className="text-sm text-text-secondary">SpO2</p>
                      <p className="text-xl font-bold text-text-primary">{patient.inpatientStay.currentVitals.spO2}%</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border-primary pt-4 flex gap-3">
            {onTransfer && patient.inpatientStay && (
              <button onClick={onTransfer} className="flex-1 btn-secondary">
                <Icons.ArrowLeftRightIcon className="w-4 h-4 mr-2" />
                Transfer Patient
              </button>
            )}
            {onDischarge && patient.inpatientStay && (
              <button onClick={onDischarge} className="flex-1 btn-primary">
                <Icons.DoorOpenIcon className="w-4 h-4 mr-2" />
                Discharge Patient
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityFeed: React.FC<{ logs: any[] }> = ({ logs }) => {
    const getIcon = (type: string) => {
        switch(type) {
            case 'ADMISSION': return <Icons.BedDoubleIcon />;
            case 'DISCHARGE': return <Icons.DoorOpenIcon />;
            default: return <Icons.ActivityIcon />;
        }
    };
    const getColor = (type: string) => {
        switch(type) {
            case 'ADMISSION': return 'bg-green-500';
            case 'DISCHARGE': return 'bg-amber-500';
            default: return 'bg-slate-500';
        }
    }
    return (
        <div className="content-card">
            <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border-primary">Live Activity</h3>
            <ul className="activity-feed p-4">
                {logs.slice(0, 10).map(log => {
                    // Security: Safely highlight keywords without XSS risk
                    const highlightedDetails = log.details.replace(
                        /(admitted to|discharged from)/gi,
                        (match: string) => `**${match}**`
                    );
                    const parts = highlightedDetails.split(/\*\*(.*?)\*\*/);
                    
                    return (
                        <li key={log.id} className="activity-item">
                            <div className={`activity-icon ${getColor(log.type)}`}>{getIcon(log.type)}</div>
                            <div>
                                <p className="activity-details">
                                    {parts.map((part: string, i: number) => 
                                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                    )}
                                </p>
                                <p className="activity-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<string>('overview');
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmitModalOpen, setAdmitModalOpen] = useState(false);
  const [isDischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [alerts, setAlerts] = useState<Array<{id: string; type: 'critical'|'warning'|'info'; message: string; acknowledged: boolean}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToasts();
  
  // WebSocket for real-time updates
  useWebSocket('command-center', () => {
    fetchData(); // Refresh on any command center event
  });

  const fetchData = useCallback(async () => {
    try {
      // No setIsLoading(true) here to allow for smooth background refetches
      const commandCenterData = await api.fetchCommandCenterData();
      setData(commandCenterData);
      setLastUpdated(new Date());
      calculateAlerts(commandCenterData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      addToast('Failed to load command center data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate dynamic alerts from real data
  const calculateAlerts = useCallback((cmdData: CommandCenterData) => {
    const newAlerts: Array<{id: string; type: 'critical'|'warning'|'info'; message: string; acknowledged: boolean}> = [];
    
    // Calculate unit capacities
    const units = calculateUnitCapacities(cmdData);
    
    units.forEach(unit => {
      if (unit.available === 0) {
        newAlerts.push({
          id: `capacity-${unit.name}`,
          type: 'critical',
          message: `${unit.name} at 100% capacity - No beds available`,
          acknowledged: false
        });
      } else if (unit.occupancyRate >= 90) {
        newAlerts.push({
          id: `capacity-${unit.name}`,
          type: 'warning',
          message: `${unit.name} at ${unit.occupancyRate}% capacity - Only ${unit.available} bed(s) available`,
          acknowledged: false
        });
      }
    });

    // Check ER wait time
    if (cmdData.kpis.erWaitTime > 60) {
      newAlerts.push({
        id: 'er-wait',
        type: 'critical',
        message: `ER wait time exceeds 1 hour: ${cmdData.kpis.erWaitTime} minutes`,
        acknowledged: false
      });
    } else if (cmdData.kpis.erWaitTime > 45) {
      newAlerts.push({
        id: 'er-wait',
        type: 'warning',
        message: `ER wait time elevated: ${cmdData.kpis.erWaitTime} minutes`,
        acknowledged: false
      });
    }

    // Check for patients awaiting admission
    const awaitingAdmission = cmdData.patients.filter(p => !p.inpatientStay && p.role === 'patient');
    if (awaitingAdmission.length > 10) {
      newAlerts.push({
        id: 'admission-queue',
        type: 'warning',
        message: `${awaitingAdmission.length} patients awaiting admission`,
        acknowledged: false
      });
    }

    setAlerts(prev => {
      // Preserve acknowledgment state
      return newAlerts.map(alert => {
        const existing = prev.find(a => a.id === alert.id);
        return existing ? { ...alert, acknowledged: existing.acknowledged } : alert;
      });
    });
  }, []);

  // Calculate unit capacities from real bed data
  const calculateUnitCapacities = useCallback((cmdData: CommandCenterData) => {
    const unitMap = new Map<string, {name: string; total: number; occupied: number; beds: Bed[]}>();
    
    cmdData.rooms.forEach(room => {
      const roomBeds = cmdData.beds.filter(b => b.roomId === room.id);
      const unitName = room.type === 'Operating Theater' ? 'Operating Rooms' : 
                       room.name.includes('ICU') ? 'ICU' :
                       room.name.includes('ED') || room.name.includes('Emergency') ? 'Emergency Department' :
                       room.name.includes('Peds') || room.name.includes('Pediatric') ? 'Pediatrics' :
                       room.name.includes('Maternity') || room.name.includes('OB') ? 'Maternity' :
                       room.name.includes('Isolation') ? 'Isolation Rooms' : 'Medical-Surgical';
      
      if (!unitMap.has(unitName)) {
        unitMap.set(unitName, { name: unitName, total: 0, occupied: 0, beds: [] });
      }
      
      const unit = unitMap.get(unitName)!;
      unit.total += roomBeds.length;
      unit.occupied += roomBeds.filter(b => b.isOccupied).length;
      unit.beds.push(...roomBeds);
    });

    return Array.from(unitMap.values()).map(unit => ({
      ...unit,
      available: unit.total - unit.occupied,
      occupancyRate: unit.total > 0 ? Math.round((unit.occupied / unit.total) * 100) : 0,
      color: unit.name.includes('ICU') ? 'bg-red-500' :
             unit.name.includes('Emergency') ? 'bg-orange-500' :
             unit.name.includes('Pediatric') ? 'bg-purple-500' :
             unit.name.includes('Maternity') ? 'bg-pink-500' :
             unit.name.includes('Isolation') ? 'bg-yellow-500' : 'bg-blue-500'
    }));
  }, []);

  // Get patients by status
  const getPatientsByStatus = useCallback((cmdData: CommandCenterData) => {
    const inpatients = cmdData.patients.filter(p => p.inpatientStay);
    const awaitingAdmission = cmdData.patients.filter(p => !p.inpatientStay && p.role === 'patient');
    
    // Calculate discharge readiness (mock logic - would come from clinical data)
    const readyForDischarge = inpatients.filter(p => {
      const los = p.inpatientStay?.admissionDate ? 
        (new Date().getTime() - new Date(p.inpatientStay.admissionDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
      return los > 3; // Simple heuristic
    });

    return { inpatients, awaitingAdmission, readyForDischarge };
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  }, []);

  const viewPatientDetails = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setPatientDetailsOpen(true);
  }, []);

  const handleBedClick = (bed: Bed) => {
    if (bed.isOccupied) {
        // Future: Show patient details
        addToast(`${bed.patientName} is in bed ${bed.name}, room ${data?.rooms.find(r=>r.id === bed.roomId)?.name}.`, 'info');
    } else {
        setSelectedBed(bed);
        setAdmitModalOpen(true);
    }
  };
  
  const handleAdmit = async (patientId: string, reason: string) => {
      if (!selectedBed) return;
      await api.admitPatient(patientId, selectedBed.id, reason);
      addToast('Patient admitted successfully.', 'success');
      setAdmitModalOpen(false);
      fetchData();
  }

  const handleDischarge = async (patientId: string) => {
      await api.dischargePatient(patientId);
      addToast('Patient discharged successfully.', 'success');
      setDischargeModalOpen(false);
      fetchData();
  }

  // Hospital Capacity View
  const renderCapacityView = () => {
    if (!data) return null;
    
    // Calculate unit capacities from real bed data
    const units = calculateUnitCapacities(data);
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">Hospital Capacity Overview</h2>
            <p className="text-text-secondary mt-1">Real-time bed availability across all units • Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="btn-secondary">
              <Icons.RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map(unit => (
            <div key={unit.name} className="card">
              <div className="card-header">
                <h3 className="card-title">{unit.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${unit.available === 0 ? 'bg-red-100 text-red-700' : unit.available <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {unit.available === 0 ? 'FULL' : unit.available <= 3 ? 'CRITICAL' : 'AVAILABLE'}
                </span>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Total Beds:</span>
                    <span className="text-2xl font-bold text-text-primary">{unit.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Occupied:</span>
                    <span className="text-lg font-semibold text-text-primary">{unit.occupied}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Available:</span>
                    <span className={`text-lg font-semibold ${unit.available === 0 ? 'text-red-600' : 'text-green-600'}`}>{unit.available}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className={`h-full ${unit.color}`} style={{ width: `${unit.occupancyRate}%` }}></div>
                  </div>
                  <p className="text-sm text-text-secondary text-center">{unit.occupancyRate}% Occupancy</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {unacknowledgedAlerts.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Capacity Alerts</h3>
              <span className="text-sm text-text-secondary">{unacknowledgedAlerts.length} unacknowledged</span>
            </div>
            <div className="card-body space-y-3">
              {unacknowledgedAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 border rounded-lg ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200' : 
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-blue-50 border-blue-200'
                }`}>
                  <Icons.AlertTriangleIcon className={`w-5 h-5 mt-0.5 ${
                    alert.type === 'critical' ? 'text-red-600' : 
                    alert.type === 'warning' ? 'text-yellow-600' : 
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      alert.type === 'critical' ? 'text-red-900' : 
                      alert.type === 'warning' ? 'text-yellow-900' : 
                      'text-blue-900'
                    }`}>{alert.message}</p>
                  </div>
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Patient Flow View
  const renderPatientFlowView = () => {
    if (!data) return null;
    
    const { inpatients, awaitingAdmission, readyForDischarge } = getPatientsByStatus(data);
    
    // Filter by search term
    const filteredInpatients = searchTerm ? 
      inpatients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) : inpatients;
    const filteredAwaiting = searchTerm ? 
      awaitingAdmission.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) : awaitingAdmission;
    const filteredReady = searchTerm ? 
      readyForDischarge.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) : readyForDischarge;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">Patient Flow Management</h2>
            <p className="text-text-secondary mt-1">Track patient movement and admission/discharge status • Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Icons.SearchIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <button onClick={fetchData} className="btn-secondary">
              <Icons.RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header bg-blue-50">
              <h3 className="card-title text-blue-900">Awaiting Admission</h3>
              <span className="text-2xl font-bold text-blue-600">{filteredAwaiting.length}</span>
            </div>
            <div className="card-body max-h-96 overflow-y-auto">
              {filteredAwaiting.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No patients awaiting admission</p>
              ) : (
                <div className="space-y-3">
                  {filteredAwaiting.slice(0, 10).map((patient) => (
                    <div 
                      key={patient.id} 
                      className="p-3 bg-background-secondary rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => viewPatientDetails(patient)}
                    >
                      <p className="font-semibold text-text-primary">{patient.name}</p>
                      <p className="text-sm text-text-secondary">MRN: {patient.id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-blue-700 font-medium mt-1">Click for details</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-green-50">
              <h3 className="card-title text-green-900">Ready for Discharge</h3>
              <span className="text-2xl font-bold text-green-600">{filteredReady.length}</span>
            </div>
            <div className="card-body max-h-96 overflow-y-auto">
              {filteredReady.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No patients ready for discharge</p>
              ) : (
                <div className="space-y-3">
                  {filteredReady.slice(0, 10).map((patient) => {
                    const los = patient.inpatientStay?.admissionDate ? 
                      Math.floor((new Date().getTime() - new Date(patient.inpatientStay.admissionDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    return (
                      <div 
                        key={patient.id} 
                        className="p-3 bg-background-secondary rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => viewPatientDetails(patient)}
                      >
                        <p className="font-semibold text-text-primary">{patient.name}</p>
                        <p className="text-sm text-text-secondary">{patient.inpatientStay?.roomNumber || 'N/A'}</p>
                        <p className="text-xs text-green-700 font-medium mt-1">LOS: {los} days</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-purple-50">
              <h3 className="card-title text-purple-900">Current Inpatients</h3>
              <span className="text-2xl font-bold text-purple-600">{filteredInpatients.length}</span>
            </div>
            <div className="card-body max-h-96 overflow-y-auto">
              {filteredInpatients.length === 0 ? (
                <p className="text-center text-text-secondary py-4">No current inpatients</p>
              ) : (
                <div className="space-y-3">
                  {filteredInpatients.slice(0, 10).map((patient) => (
                    <div 
                      key={patient.id} 
                      className="p-3 bg-background-secondary rounded-lg cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => viewPatientDetails(patient)}
                    >
                      <p className="font-semibold text-text-primary">{patient.name}</p>
                      <p className="text-sm text-text-secondary">{patient.inpatientStay?.roomNumber || 'N/A'}</p>
                      <p className="text-xs text-purple-700 font-medium mt-1">Click for details</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Bed Turnaround Status</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Bed</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Room</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.beds.filter(b => !b.isOccupied).slice(0, 10).map(bed => {
                    const room = data.rooms.find(r => r.id === bed.roomId);
                    return (
                      <tr key={bed.id} className="border-b border-border-primary">
                        <td className="py-2 px-3 text-sm text-text-primary">{bed.name}</td>
                        <td className="py-2 px-3 text-sm text-text-secondary">{room?.name || 'N/A'}</td>
                        <td className="py-2 px-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Available</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ER Status Dashboard
  const renderERStatusView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Emergency Department Dashboard</h2>
          <p className="text-text-secondary mt-1">Real-time ER status and patient tracking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={Icons.UsersIcon} title="Current Census" value="22" unit="/25" color="bg-orange-500" />
          <StatCard icon={Icons.ClockIcon} title="Avg Wait Time" value="45" unit="min" color="bg-red-500" />
          <StatCard icon={Icons.ActivityIcon} title="ESI 1-2 (Critical)" value="3" color="bg-red-600" />
          <StatCard icon={Icons.TrendingUpIcon} title="Arrivals (1hr)" value="8" color="bg-blue-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Patients by Triage Level</h3>
            </div>
            <div className="card-body space-y-3">
              {[
                { level: 'ESI 1', desc: 'Resuscitation', count: 1, color: 'bg-red-600' },
                { level: 'ESI 2', desc: 'Emergent', count: 2, color: 'bg-orange-600' },
                { level: 'ESI 3', desc: 'Urgent', count: 10, color: 'bg-yellow-500' },
                { level: 'ESI 4', desc: 'Less Urgent', count: 7, color: 'bg-green-500' },
                { level: 'ESI 5', desc: 'Non-Urgent', count: 2, color: 'bg-blue-500' },
              ].map(triage => (
                <div key={triage.level} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${triage.color}`}></div>
                    <div>
                      <p className="font-semibold text-text-primary">{triage.level}</p>
                      <p className="text-sm text-text-secondary">{triage.desc}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-text-primary">{triage.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Treatment Room Status</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }, (_, i) => {
                  const status = i < 18 ? 'occupied' : i < 22 ? 'available' : 'cleaning';
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold ${
                        status === 'occupied' ? 'bg-red-100 text-red-700' :
                        status === 'available' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-100"></div>
                  <span>Occupied (18)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-100"></div>
                  <span>Available (4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-100"></div>
                  <span>Cleaning (3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ambulance Arrivals</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-text-secondary mb-4">Incoming ambulances and ETA</p>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-red-900">ETA: 5 minutes</p>
                    <p className="text-sm text-red-700">Cardiac arrest - ESI 1</p>
                  </div>
                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">CRITICAL</span>
                </div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-orange-900">ETA: 12 minutes</p>
                    <p className="text-sm text-orange-700">MVA with injuries - ESI 2</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-bold">EMERGENT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Resources View
  const renderResourcesView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Hospital Resources</h2>
          <p className="text-text-secondary mt-1">Staffing, equipment, and resource availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Nursing Staffing Levels</h3>
            </div>
            <div className="card-body space-y-3">
              {[
                { unit: 'ICU', required: 10, current: 9, status: 'understaffed' },
                { unit: 'Med-Surg', required: 15, current: 15, status: 'adequate' },
                { unit: 'Emergency', required: 8, current: 10, status: 'adequate' },
                { unit: 'Pediatrics', required: 6, current: 5, status: 'understaffed' },
              ].map(unit => (
                <div key={unit.unit} className="p-3 bg-background-secondary rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-text-primary">{unit.unit}</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      unit.status === 'understaffed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {unit.status === 'understaffed' ? 'Understaffed' : 'Adequate'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Current: {unit.current}</span>
                    <span className="text-text-secondary">Required: {unit.required}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Critical Equipment</h3>
            </div>
            <div className="card-body space-y-3">
              {[
                { name: 'Ventilators', total: 25, available: 3, inUse: 22 },
                { name: 'Cardiac Monitors', total: 40, available: 8, inUse: 32 },
                { name: 'IV Pumps', total: 60, available: 15, inUse: 45 },
                { name: 'Isolation Equipment', total: 20, available: 7, inUse: 13 },
              ].map(equip => (
                <div key={equip.name} className="p-3 bg-background-secondary rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-text-primary">{equip.name}</p>
                    <span className={`text-lg font-bold ${equip.available < 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {equip.available}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-text-secondary">
                    <span>In Use: {equip.inUse}/{equip.total}</span>
                    <span>Available: {equip.available}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(equip.inUse / equip.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resource Alerts</h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Icons.AlertTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Critical: Ventilator Shortage</p>
                <p className="text-sm text-red-700">Only 3 ventilators available. Consider transfer protocols.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Icons.AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">ICU Nursing Shortage</p>
                <p className="text-sm text-yellow-700">1 nurse short for current patient load.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Department Status View
  const renderDepartmentsView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Department Status</h2>
          <p className="text-text-secondary mt-1">Service availability and wait times across departments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { dept: 'Radiology', waitTime: '25 min', queue: 8, status: 'operational' },
            { dept: 'Laboratory', waitTime: '15 min', queue: 12, status: 'operational' },
            { dept: 'Pharmacy', waitTime: '30 min', queue: 15, status: 'busy' },
            { dept: 'Operating Rooms', waitTime: 'N/A', available: '2/8', status: 'operational' },
            { dept: 'Cardiology', waitTime: '40 min', queue: 5, status: 'busy' },
            { dept: 'Physical Therapy', waitTime: '20 min', queue: 6, status: 'operational' },
          ].map(dept => (
            <div key={dept.dept} className="card">
              <div className="card-header">
                <h3 className="card-title">{dept.dept}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  dept.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {dept.status === 'operational' ? 'Operational' : 'Busy'}
                </span>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Wait Time:</span>
                    <span className="font-semibold text-text-primary">{dept.waitTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{dept.queue ? 'In Queue:' : 'Available:'}</span>
                    <span className="font-semibold text-text-primary">{dept.queue || dept.available}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Operating Room Schedule</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">OR</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Current Case</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Surgeon</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Status</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Est. Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { or: 'OR 1', case: 'Hip Replacement', surgeon: 'Dr. Smith', status: 'In Progress', time: '2:30 PM' },
                    { or: 'OR 2', case: 'Appendectomy', surgeon: 'Dr. Johnson', status: 'In Progress', time: '1:45 PM' },
                    { or: 'OR 3', case: 'Available', surgeon: '-', status: 'Ready', time: '-' },
                    { or: 'OR 4', case: 'Cardiac Bypass', surgeon: 'Dr. Williams', status: 'In Progress', time: '5:00 PM' },
                  ].map((or, idx) => (
                    <tr key={idx} className="border-b border-border-primary">
                      <td className="py-2 px-3 text-sm font-semibold text-text-primary">{or.or}</td>
                      <td className="py-2 px-3 text-sm text-text-secondary">{or.case}</td>
                      <td className="py-2 px-3 text-sm text-text-secondary">{or.surgeon}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          or.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {or.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm text-text-secondary">{or.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeView === 'settings') {
      return <SettingsView user={props.user} />;
    }
    
    if (activeView === 'capacity') {
      return renderCapacityView();
    }
    
    if (activeView === 'patient-flow') {
      return renderPatientFlowView();
    }
    
    if (activeView === 'er-status') {
      return renderERStatusView();
    }
    
    if (activeView === 'resources') {
      return renderResourcesView();
    }
    
    if (activeView === 'departments') {
      return renderDepartmentsView();
    }
    
    if (isLoading || !data) return <FullScreenLoader message="Loading Command Center..." />;
    
    const inpatients = data.patients.filter(p => p.inpatientStay);
    
    return (
        <div className="command-center-page">
            <div className="command-center-header">
                <div className="command-center-header-content">
                    <h2>Hospital Operations Command Center</h2>
                    <p>Real-time overview of facility status and patient flow.</p>
                </div>
                <div className="command-center-actions">
                    <Button onClick={() => setDischargeModalOpen(true)}><Icons.DoorOpenIcon className="w-5 h-5 mr-2" /> Discharge Patient</Button>
                    <Button onClick={() => setAdmitModalOpen(true)}><Icons.BedDoubleIcon className="w-5 h-5 mr-2" /> Admit Patient</Button>
                </div>
            </div>
            
            <div className="command-center-stats-grid">
                <StatCard icon={Icons.BedIcon} title="Bed Occupancy" value={`${data.kpis.bedOccupancy}`} unit="%" color="bg-cyan-500" />
                <StatCard icon={Icons.BedDoubleIcon} title="Admissions (24h)" value={data.kpis.admissionsToday} color="bg-green-500" />
                <StatCard icon={Icons.DoorOpenIcon} title="Discharges (24h)" value={data.kpis.dischargesToday} color="bg-amber-500" />
                <StatCard icon={Icons.ClockIcon} title="Avg. ER Wait" value={data.kpis.erWaitTime} unit="min" color="bg-red-500" />
                <StatCard icon={Icons.CalendarIcon} title="Avg. Length of Stay" value={data.kpis.avgLengthOfStay} unit="days" color="bg-violet-500" />
            </div>

            <div className="command-center-content-grid">
                <div>
                    <BedManagement beds={data.beds} rooms={data.rooms} onBedClick={handleBedClick} />
                </div>
                <div>
                    <ActivityFeed logs={data.activityLogs} />
                </div>
            </div>

            <AdmitPatientModal
                isOpen={isAdmitModalOpen}
                onClose={() => setAdmitModalOpen(false)}
                onAdmit={handleAdmit}
                patients={data.patients.filter(p => !p.inpatientStay)}
                beds={data.beds.filter(b => !b.isOccupied)}
                rooms={data.rooms}
                selectedBedId={selectedBed?.id}
            />
            <DischargePatientModal 
                isOpen={isDischargeModalOpen}
                onClose={() => setDischargeModalOpen(false)}
                onDischarge={handleDischarge}
                inpatients={inpatients}
            />
            <PatientDetailsModal 
                patient={selectedPatient}
                isOpen={isPatientDetailsOpen}
                onClose={() => setPatientDetailsOpen(false)}
                onDischarge={() => {
                  setPatientDetailsOpen(false);
                  setDischargeModalOpen(true);
                }}
            />
        </div>
    );
  };

  const unacknowledgedAlertCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} alertCount={unacknowledgedAlertCount} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Command Center" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default CommandCenterDashboard;
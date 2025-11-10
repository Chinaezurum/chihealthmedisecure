import React, { useState, useEffect, useCallback } from 'react';
import type { User, CommandCenterData, Bed, Room } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
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

const Sidebar: React.FC<{ activeView: 'overview' | 'settings'; setActiveView: React.Dispatch<React.SetStateAction<'overview' | 'settings'>> }> = ({ activeView, setActiveView }) => {
        const navItems = [{ id: 'overview', label: 'Operations Overview', icon: Icons.LayoutDashboardIcon } as const] as const;
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('overview')} className="sidebar-logo-button"><Logo /><h1>Command Center</h1></button>
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
                {logs.slice(0, 10).map(log => (
                    <li key={log.id} className="activity-item">
                        <div className={`activity-icon ${getColor(log.type)}`}>{getIcon(log.type)}</div>
                        <div>
                            <p className="activity-details" dangerouslySetInnerHTML={{ __html: log.details.replace(/(admitted to|discharged from)/, '<strong>$&</strong>') }} />
                            <p className="activity-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<'overview' | 'settings'>('overview');
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmitModalOpen, setAdmitModalOpen] = useState(false);
  const [isDischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      // No setIsLoading(true) here to allow for smooth background refetches
      const commandCenterData = await api.fetchCommandCenterData();
      setData(commandCenterData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      addToast('Failed to load command center data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const renderContent = () => {
    if (activeView === 'settings') {
      return <SettingsView user={props.user} />;
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
        </div>
    );
  };

  return (
    <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Command Center" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default CommandCenterDashboard;
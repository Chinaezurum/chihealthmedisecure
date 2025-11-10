import React, { useMemo } from 'react';
import { User, Appointment, LabTest, Message } from '../../types.ts';
import { 
  CalendarIcon, 
  MessageSquareIcon, 
  FlaskConicalIcon,
  ClockIcon,
  UserIcon,
  ArrowRightIcon,
  ActivityIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from '../../components/icons/index.tsx';

interface HCWDashboardOverviewProps {
    user: User;
    appointments: Appointment[];
    messages: Message[];
    labTests: LabTest[];
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const StatCard: React.FC<{ 
  icon: React.ElementType, 
  title: string, 
  value: string | number, 
  subtitle?: string,
  gradient: string,
  onClick?: () => void
}> = ({ icon: Icon, title, value, subtitle, gradient, onClick }) => (
  <div 
    className="hcw-stat-card"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div className="hcw-stat-icon-wrapper" style={{ background: gradient }}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="hcw-stat-content">
      <p className="hcw-stat-value">{value}</p>
      <p className="hcw-stat-title">{title}</p>
      {subtitle && <p className="hcw-stat-subtitle">{subtitle}</p>}
    </div>
  </div>
);

const WeeklyScheduleChart: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
    const data = useMemo(() => {
        const counts = Array(7).fill(0);
        const labels = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });

        appointments.forEach(appt => {
            const apptDate = new Date(appt.date);
            const today = new Date();
            today.setHours(0,0,0,0);
            const diffDays = Math.floor((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if(diffDays >= 0 && diffDays < 7) {
                counts[diffDays]++;
            }
        });
        return { labels, counts };
    }, [appointments]);

    const maxCount = Math.max(...data.counts, 1);

    return (
        <div className="hcw-chart-card">
          <div className="hcw-chart-header">
            <div className="hcw-chart-header-content">
              <ActivityIcon className="w-5 h-5" />
              <h3 className="hcw-chart-title">Weekly Forecast</h3>
            </div>
            <p className="hcw-chart-subtitle">Next 7 days</p>
          </div>
          <div className="hcw-chart-bars">
            {data.counts.map((count, i) => (
              <div key={i} className="hcw-chart-bar-group">
                <div className="hcw-chart-bar-value" style={{ opacity: count > 0 ? 1 : 0 }}>
                  {count}
                </div>
                <div 
                  className="hcw-chart-bar"
                  style={{ height: `${(count / maxCount) * 100}%`}}
                  title={`${count} appointments on ${data.labels[i]}`}
                ></div>
                <div className="hcw-chart-bar-label">{data.labels[i]}</div>
              </div>
            ))}
          </div>
        </div>
    );
};

const TodaysAppointments: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments
    .filter(a => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="hcw-appointments-card">
      <div className="hcw-appointments-header">
        <div className="hcw-appointments-header-content">
          <CalendarIcon className="w-5 h-5" />
          <h3 className="hcw-appointments-title">Today's Appointments</h3>
        </div>
        <span className="hcw-appointments-count">{todaysAppointments.length}</span>
      </div>
      {todaysAppointments.length > 0 ? (
        <div className="hcw-appointments-list">
          {todaysAppointments.map(appt => (
            <div key={appt.id} className="hcw-appointment-item">
              <div className="hcw-appointment-time">
                <ClockIcon className="w-4 h-4" />
                <span>{formatTime(appt.time)}</span>
              </div>
              <div className="hcw-appointment-details">
                <p className="hcw-appointment-patient">{appt.patientName || appt.patientId}</p>
                <p className="hcw-appointment-specialty">{appt.specialty}</p>
              </div>
              <div className={`hcw-appointment-status hcw-appointment-status-${appt.status.toLowerCase()}`}>
                {appt.status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="hcw-empty-state">
          <CalendarIcon className="w-12 h-12" />
          <p className="hcw-empty-title">No Appointments Today</p>
          <p className="hcw-empty-message">You have a free schedule today</p>
        </div>
      )}
    </div>
  );
};

const PendingLabs: React.FC<{ labTests: LabTest[] }> = ({ labTests }) => {
  const pendingLabs = labTests
    .filter(t => t.status === 'Ordered' || t.status === 'In-progress' || t.status === 'Pending')
    .slice(0, 5);

  return (
    <div className="hcw-labs-card">
      <div className="hcw-labs-header">
        <div className="hcw-labs-header-content">
          <FlaskConicalIcon className="w-5 h-5" />
          <h3 className="hcw-labs-title">Pending Lab Results</h3>
        </div>
        <span className="hcw-labs-count">{pendingLabs.length}</span>
      </div>
      {pendingLabs.length > 0 ? (
        <div className="hcw-labs-list">
          {pendingLabs.map(lab => (
            <div key={lab.id} className="hcw-lab-item">
              <div className="hcw-lab-icon">
                {lab.status === 'In-progress' ? (
                  <ActivityIcon className="w-4 h-4" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4" />
                )}
              </div>
              <div className="hcw-lab-details">
                <p className="hcw-lab-name">{lab.testName}</p>
                <p className="hcw-lab-date">Ordered: {lab.dateOrdered}</p>
              </div>
              <div className={`hcw-lab-status hcw-lab-status-${lab.status.toLowerCase().replace('-', '_')}`}>
                {lab.status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="hcw-empty-state">
          <CheckCircleIcon className="w-12 h-12" />
          <p className="hcw-empty-title">All Clear</p>
          <p className="hcw-empty-message">No pending lab results</p>
        </div>
      )}
    </div>
  );
};

export const HCWDashboardOverview: React.FC<HCWDashboardOverviewProps> = ({ user, appointments, messages, labTests }) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(a => a.date === today);
    const unreadMessages = messages.filter(m => !(m as any).isRead || true).length;
    const pendingLabs = labTests.filter(t => t.status === 'Ordered' || t.status === 'In-progress' || t.status === 'Pending');
    const upcomingAppointments = appointments.filter(a => 
      new Date(`${a.date}T${a.time}`) >= new Date() && 
      a.status !== 'Cancelled' && 
      a.status !== 'Completed'
    ).length;

    const greeting = getGreeting();

    return (
        <div className="hcw-overview-page">
          {/* Hero Section */}
          <div className="hcw-hero-section">
            <div className="hcw-hero-content">
              <div>
                <h1 className="hcw-hero-title">
                  {greeting}, Dr. {user.name.split(' ')[0]}!
                </h1>
                <p className="hcw-hero-subtitle">
                  Here's your clinical dashboard overview for today
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hcw-stats-grid">
            <StatCard 
              icon={CalendarIcon} 
              title="Today's Appointments" 
              value={todaysAppointments.length}
              subtitle={`${upcomingAppointments} upcoming this week`}
              gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            />
            <StatCard 
              icon={MessageSquareIcon} 
              title="Unread Messages" 
              value={unreadMessages}
              subtitle="Require your attention"
              gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            />
            <StatCard 
              icon={FlaskConicalIcon} 
              title="Pending Lab Results" 
              value={pendingLabs.length}
              subtitle="Awaiting results"
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            />
          </div>

          {/* Main Content Grid */}
          <div className="hcw-content-grid">
            {/* Left Column */}
            <div className="hcw-main-column">
              <WeeklyScheduleChart appointments={appointments} />
              <TodaysAppointments appointments={appointments} />
            </div>

            {/* Right Column */}
            <div className="hcw-sidebar-column">
              <PendingLabs labTests={labTests} />
            </div>
          </div>
        </div>
    );
};
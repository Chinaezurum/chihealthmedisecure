import React from 'react';
import { 
  UsersIcon, 
  BuildingIcon, 
  DollarSignIcon, 
  CalendarIcon, 
  BedIcon,
  ActivityIcon,
  TrendingUpIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  ClockIcon
} from '../../components/icons';

interface AdminDashboardOverviewProps {
  staffCount: number;
  patientCount: number;
  appointmentCount: number;
  totalRevenue: number;
}

const StatCard: React.FC<{ 
  icon: React.ElementType, 
  title: string, 
  value: string | number, 
  gradientFrom: string,
  gradientTo: string,
  trend?: { value: number; label: string },
  subtitle?: string
}> = ({ icon: Icon, title, value, gradientFrom, gradientTo, trend, subtitle }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-header">
      <div className="admin-stat-icon-wrapper" style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className="admin-stat-trend">
          <ArrowUpIcon className="w-4 h-4" />
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
    <div className="admin-stat-content">
      <p className="admin-stat-value">{value}</p>
      <p className="admin-stat-title">{title}</p>
      {subtitle && <p className="admin-stat-subtitle">{subtitle}</p>}
      {trend && <p className="admin-stat-trend-label">{trend.label}</p>}
    </div>
  </div>
);

const RevenueChart: React.FC<{ totalRevenue: number }> = ({ totalRevenue }) => {
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const mockData = [
    totalRevenue * 0.4,
    totalRevenue * 0.6,
    totalRevenue * 0.5,
    totalRevenue * 0.8,
    totalRevenue * 0.7,
    totalRevenue,
  ];
  const maxRevenue = Math.max(...mockData, 1);
  const growthRate = ((mockData[mockData.length - 1] - mockData[mockData.length - 2]) / mockData[mockData.length - 2] * 100).toFixed(1);

  return (
    <div className="admin-revenue-card">
      <div className="admin-revenue-header">
        <div>
          <h3 className="admin-revenue-title">Revenue Overview</h3>
          <p className="admin-revenue-subtitle">Last 6 months performance</p>
        </div>
        <div className="admin-revenue-growth">
          <TrendingUpIcon className="w-5 h-5" />
          <div>
            <span className="admin-revenue-growth-value">+{growthRate}%</span>
            <span className="admin-revenue-growth-label">vs last month</span>
          </div>
        </div>
      </div>
      <div className="admin-revenue-chart">
        {mockData.map((revenue, i) => (
          <div key={months[i]} className="admin-revenue-bar-group">
            <div 
              className="admin-revenue-bar"
              style={{ 
                height: `${(revenue / maxRevenue) * 100}%`,
                background: i === mockData.length - 1 
                  ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 100%)'
              }}
              title={`₦${revenue.toLocaleString()}`}
            >
              <div className="admin-revenue-bar-value">₦{(revenue / 1000).toFixed(0)}k</div>
            </div>
            <div className="admin-revenue-bar-label">{months[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityItem: React.FC<{
  icon: React.ElementType,
  iconBg: string,
  iconColor: string,
  title: string,
  description: string,
  time: string
}> = ({ icon: Icon, iconBg, iconColor, title, description, time }) => (
  <div className="admin-activity-item">
    <div className="admin-activity-icon" style={{ background: iconBg, color: iconColor }}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="admin-activity-content">
      <p className="admin-activity-title">{title}</p>
      <p className="admin-activity-description">{description}</p>
      <div className="admin-activity-time">
        <ClockIcon className="w-3 h-3" />
        <span>{time}</span>
      </div>
    </div>
  </div>
);

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = (props) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="admin-overview-page">
      {/* Hero Section */}
      <div className="admin-overview-hero">
        <div className="admin-overview-hero-content">
          <div>
            <h1 className="admin-overview-hero-title">{getGreeting()}, Administrator</h1>
            <p className="admin-overview-hero-subtitle">Here's what's happening across your platform today</p>
          </div>
          <div className="admin-overview-quick-actions">
            <button className="admin-quick-action-btn">
              <ActivityIcon className="w-4 h-4" />
              <span>View Reports</span>
            </button>
            <button className="admin-quick-action-btn admin-quick-action-primary">
              <ArrowRightIcon className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatCard 
          icon={UsersIcon} 
          title="Total Patients" 
          value={props.patientCount.toLocaleString()} 
          gradientFrom="#06b6d4"
          gradientTo="#0891b2"
          trend={{ value: 12.5, label: "vs last month" }}
          subtitle="Active registrations"
        />
        <StatCard 
          icon={UsersIcon} 
          title="Total Staff" 
          value={props.staffCount.toLocaleString()} 
          gradientFrom="#8b5cf6"
          gradientTo="#7c3aed"
          trend={{ value: 5.2, label: "vs last month" }}
          subtitle="Healthcare professionals"
        />
        <StatCard 
          icon={BedIcon} 
          title="Bed Occupancy" 
          value="76%" 
          gradientFrom="#f59e0b"
          gradientTo="#d97706"
          trend={{ value: 3.1, label: "vs last week" }}
          subtitle="Current capacity"
        />
        <StatCard 
          icon={DollarSignIcon} 
          title="Total Revenue" 
          value={`₦${props.totalRevenue.toLocaleString()}`} 
          gradientFrom="#10b981"
          gradientTo="#059669"
          trend={{ value: 18.3, label: "vs last month" }}
          subtitle="This month"
        />
      </div>

      {/* Main Content Grid */}
      <div className="admin-overview-grid">
        {/* Revenue Chart */}
        <div className="admin-overview-main">
          <RevenueChart totalRevenue={props.totalRevenue} />
        </div>

        {/* Recent Activity */}
        <div className="admin-overview-sidebar">
          <div className="admin-activity-card">
            <div className="admin-activity-header">
              <h3 className="admin-activity-title-header">Recent Activity</h3>
              <button className="admin-activity-view-all">
                View All
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="admin-activity-list">
              <ActivityItem
                icon={UsersIcon}
                iconBg="rgba(16, 185, 129, 0.1)"
                iconColor="#10b981"
                title="New Patient Registration"
                description="Amina Bello registered on the platform"
                time="2 hours ago"
              />
              <ActivityItem
                icon={CalendarIcon}
                iconBg="rgba(6, 182, 212, 0.1)"
                iconColor="#06b6d4"
                title="Appointment Booked"
                description="Chinedu Eze scheduled with Dr. Okoro"
                time="4 hours ago"
              />
              <ActivityItem
                icon={UsersIcon}
                iconBg="rgba(139, 92, 246, 0.1)"
                iconColor="#8b5cf6"
                title="New Staff Added"
                description="Dr. Funmi was added to the platform"
                time="6 hours ago"
              />
              <ActivityItem
                icon={BuildingIcon}
                iconBg="rgba(245, 158, 11, 0.1)"
                iconColor="#f59e0b"
                title="Organization Updated"
                description="Lagos General Hospital updated profile"
                time="1 day ago"
              />
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="admin-summary-card">
            <h3 className="admin-summary-title">Platform Summary</h3>
            <div className="admin-summary-stats">
              <div className="admin-summary-stat">
                <CalendarIcon className="w-5 h-5" />
                <div>
                  <p className="admin-summary-value">{props.appointmentCount.toLocaleString()}</p>
                  <p className="admin-summary-label">Appointments</p>
                </div>
              </div>
              <div className="admin-summary-stat">
                <BuildingIcon className="w-5 h-5" />
                <div>
                  <p className="admin-summary-value">12</p>
                  <p className="admin-summary-label">Organizations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
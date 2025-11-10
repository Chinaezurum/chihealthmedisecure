import React, { useState, useEffect } from "react";
import type { User } from "../../types.ts";
import { Logo } from "../../components/common/Logo.tsx";
import * as Icons from "../../components/icons/index.tsx";
import { DashboardHeader } from "../../components/common/DashboardHeader.tsx";
import { DashboardLayout } from "../../components/common/DashboardLayout.tsx";
import { FullScreenLoader } from "../../components/common/FullScreenLoader.tsx";
import { AdminDashboardOverview } from "./AdminDashboardOverview.tsx";
import { StaffManagementView } from "./StaffManagementView.tsx";
import { OrganizationManagementView } from "./OrganizationManagementView.tsx";
import { SubscriptionView } from "./SubscriptionView.tsx";
import { AuditLogView } from "./AuditLogView.tsx";
import { DataManagementView } from "./DataManagementView.tsx";
import { FacilityManagementView } from "./FacilityManagementView.tsx";
import { SettingsView } from "../common/SettingsView.tsx";
import * as api from "../../services/apiService.ts";
import { useToasts } from "../../hooks/useToasts.ts";
import { canAccessFeature } from "../../services/permissionService.ts";

type AdminView =
  | "overview"
  | "staff"
  | "organizations"
  | "subscription"
  | "audit"
  | "data"
  | "facility"
  | "settings";

interface AdminDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const Sidebar: React.FC<{
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  user: User;
}> = ({ activeView, setActiveView, user }) => {
  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: Icons.LayoutDashboardIcon,
      feature: "admin_dashboard",
    },
    {
      id: "staff",
      label: "Staff Management",
      icon: Icons.UsersIcon,
      feature: "admin_dashboard",
    },
    {
      id: "facility",
      label: "Facility Management",
      icon: Icons.BuildingIcon,
      feature: "admin_dashboard",
    },
    {
      id: "organizations",
      label: "Org Hierarchy",
      icon: Icons.BuildingIcon,
      feature: "multi_tenancy",
    },
    {
      id: "subscription",
      label: "Subscription",
      icon: Icons.DollarSignIcon,
      feature: "admin_dashboard",
    },
    {
      id: "data",
      label: "Data Management",
      icon: Icons.DatabaseIcon,
      feature: "data_io",
    },
    {
      id: "audit",
      label: "Audit Log",
      icon: Icons.ClipboardListIcon,
      feature: "audit_log",
    },
  ];

  const NavLink: React.FC<{ item: (typeof navItems)[0] }> = ({ item }) => {
    if (!canAccessFeature(user, item.feature)) return null;
    return (
      <button
        onClick={() => setActiveView(item.id as AdminView)}
        className={`sidebar-link ${activeView === item.id ? "active" : ""}`}
      >
        <item.icon />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <button
        onClick={() => setActiveView("overview")}
        className="sidebar-logo-button"
      >
        <Logo />
        <h1>ChiHealth MediSecure</h1>
      </button>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
      </nav>
      <div>
        <button
          onClick={() => setActiveView("settings")}
          className={`sidebar-link ${
            activeView === "settings" ? "active" : ""
          }`}
        >
          <Icons.SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToasts();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const adminData = await api.fetchAdminData();
      setData(adminData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      addToast("Failed to load administrator data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [props.user.currentOrganization.id]);

  const handleUpdateUser = async (user: User) => {
    await api.updateUser(user);
    addToast("User updated successfully.", "success");
    fetchData();
  };

  const renderContent = () => {
    if (isLoading || !data)
      return <FullScreenLoader message="Loading administrator dashboard..." />;

    switch (activeView) {
      case "overview":
        return (
          <AdminDashboardOverview
            staffCount={data.staff.length}
            patientCount={data.patients.length}
            appointmentCount={data.appointments.length}
            totalRevenue={data.totalRevenue}
          />
        );
      case "staff":
        return (
          <StaffManagementView
            staff={data.staff}
            organizations={data.organizations}
            departments={data.departments}
            onUpdateUser={handleUpdateUser}
            currentUser={props.user}
            onRefresh={fetchData}
          />
        );
      case "organizations":
        return (
          <OrganizationManagementView
            organizations={data.organizations}
            onUpdate={fetchData}
            currentUser={props.user}
          />
        );
      case "subscription":
        return <SubscriptionView />;
      case "audit":
        return <AuditLogView />;
      case "data":
        return <DataManagementView />;
      case "facility":
        return <FacilityManagementView data={data} onUpdate={fetchData} />;
      case "settings":
        return <SettingsView user={props.user} />;
      default:
        return <div>Overview</div>;
    }
  };

  return (
    <DashboardLayout
      onSignOut={props.onSignOut}
      sidebar={
        <Sidebar
          user={props.user}
          activeView={activeView}
          setActiveView={setActiveView}
        />
      }
      header={
        <DashboardHeader
          user={props.user}
          onSignOut={props.onSignOut}
          onSwitchOrganization={props.onSwitchOrganization}
          notifications={data?.notifications || []}
          onMarkNotificationsAsRead={fetchData}
          title="Administrator Dashboard"
          theme={props.theme}
          toggleTheme={props.toggleTheme}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;

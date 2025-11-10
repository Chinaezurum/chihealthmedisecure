import React, { useMemo, useState, useEffect } from "react";
import {
  Patient,
  Appointment,
  Prescription,
  WearableDataPoint,
  Message,
  User,
  CarePlan,
} from "../../types.ts";
import {
  CalendarIcon,
  HeartIcon,
  ActivityIcon,
  BedIcon,
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  UserIcon,
  MessageSquareIcon,
  FileTextIcon,
} from "../../components/icons/index.tsx";
// HealthChart is commented out for now
// import { HealthChart } from "../../components/common/HealthChart.tsx";
// Fix: Add .tsx extension to local module import.
import { PatientView } from "./PatientDashboard.tsx";
import * as geminiService from "../../services/geminiService.ts";
import { MarkdownRenderer } from "../../components/common/MarkdownRenderer.tsx";
import { MiniSymptomChecker } from "../../components/patient/MiniSymptomChecker.tsx";
import { RecentMessages } from "../../components/patient/RecentMessages.tsx";
import { CoachingCorner } from "../../components/patient/CoachingCorner.tsx";

interface DashboardOverviewProps {
  user: Patient;
  appointments: Appointment[];
  prescriptions: Prescription[];
  messages: Message[];
  contacts: User[];
  carePlan?: CarePlan;
  t: (key: string) => string;
  setActiveView: (view: PatientView) => void;
}

const getGreeting = (t: (key: string) => string): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t("goodMorning");
  if (hour < 18) return t("goodAfternoon");
  return t("goodEvening");
};

const AIBriefingCard: React.FC<{ briefing: string; isLoading: boolean }> = ({
  briefing,
  isLoading,
}) => (
  <div className="modern-card ai-briefing-modern">
    <div className="flex items-start gap-4">
      <div className="ai-icon-wrapper">
        <SparklesIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="modern-card-title">AI Daily Briefing</h3>
          <span className="ai-badge">AI</span>
        </div>
        {isLoading ? (
          <div className="ai-insight-loading">
            <div className="ai-insight-loader-bar w-3/4"></div>
            <div className="ai-insight-loader-bar w-1/2"></div>
          </div>
        ) : (
          <div className="ai-briefing-content">
            <MarkdownRenderer content={briefing} />
          </div>
        )}
      </div>
    </div>
  </div>
);

const HealthVitals: React.FC<{
  wearableData: WearableDataPoint[] | undefined;
}> = ({ wearableData }) => {
  const data = wearableData || [];
  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const lastNightData = data.find(
    (d) => new Date(d.timestamp).getDate() === new Date().getDate() - 1
  );

  // Prepare small sparkline data for heart rate & steps (last 7)
  // Commented out until HealthChart is re-enabled
  // const hrPoints = data.slice(-7).map((d) => ({
  //   value: d.heartRate || 0,
  //   label: new Date(d.timestamp).toLocaleDateString(),
  // }));
  // const stepPoints = data.slice(-7).map((d) => ({
  //   value: d.steps || 0,
  //   label: new Date(d.timestamp).toLocaleDateString(),
  // }));

  return (
    <div className="modern-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="modern-card-title">Health Vitals</h3>
        <span className="vitals-badge">Live</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="vital-card vital-card-heart">
          <div className="vital-icon-wrapper">
            <HeartIcon className="w-5 h-5" />
          </div>
          <div className="vital-content">
            <p className="vital-label">Heart Rate</p>
            <p className="vital-value">
              {latestData?.heartRate ?? "--"}
              <span className="vital-unit">bpm</span>
            </p>
            <p className="vital-timestamp">
              {latestData
                ? new Date(latestData.timestamp).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="vital-card vital-card-steps">
          <div className="vital-icon-wrapper">
            <ActivityIcon className="w-5 h-5" />
          </div>
          <div className="vital-content">
            <p className="vital-label">Steps Today</p>
            <p className="vital-value">
              {latestData?.steps?.toLocaleString() ?? "--"}
            </p>
            <p className="vital-timestamp">
              {latestData
                ? new Date(latestData.timestamp).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="vital-card vital-card-sleep">
          <div className="vital-icon-wrapper">
            <BedIcon className="w-5 h-5" />
          </div>
          <div className="vital-content">
            <p className="vital-label">Last Sleep</p>
            <p className="vital-value">
              {lastNightData?.sleepHours ?? "--"}
              <span className="vital-unit">hrs</span>
            </p>
            <p className="vital-timestamp">
              {lastNightData
                ? new Date(lastNightData.timestamp).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = (props) => {
  const [briefing, setBriefing] = useState("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);

  const upcomingAppointment = useMemo(
    () =>
      props.appointments
        .filter(
          (a) =>
            new Date(`${a.date}T${a.time}`) >= new Date() &&
            a.status === "Confirmed"
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0],
    [props.appointments]
  );

  useEffect(() => {
    const fetchBriefing = async () => {
      if (!props.user) return;
      setIsBriefingLoading(true);
      try {
        const activePrescriptions = props.prescriptions.filter(
          (p) => p.status === "Active"
        );
        const response = await geminiService.generateDailyBriefing(
          props.user,
          props.appointments,
          activePrescriptions
        );
        setBriefing(response);
      } catch (e) {
        setBriefing("Could not load AI briefing at this time.");
      } finally {
        setIsBriefingLoading(false);
      }
    };
    fetchBriefing();
  }, [props.user, props.appointments, props.prescriptions]);

  const greeting = getGreeting(props.t);
  const appointmentDateTime = upcomingAppointment
    ? new Date(`${upcomingAppointment.date}T${upcomingAppointment.time}`)
    : null;

  // Calculate quick stats
  const activePrescriptionsCount = props.prescriptions.filter(
    (p) => p.status === "Active"
  ).length;
  const unreadMessagesCount = props.messages.filter(
    (m) => m.recipientId === props.user.id && !(m as any).isRead
  ).length;
  const upcomingAppointmentsCount = props.appointments.filter(
    (a) =>
      new Date(`${a.date}T${a.time}`) >= new Date() &&
      a.status !== "Cancelled" &&
      a.status !== "Completed"
  ).length;

  return (
    <div className="overview-page-redesign">
      {/* Hero Header Section */}
      <div className="overview-hero-section">
        <div className="overview-hero-content">
          <div className="overview-hero-greeting">
            <h1 className="overview-hero-title">
              {greeting}, {props.user.name.split(" ")[0]}!
            </h1>
            <p className="overview-hero-subtitle">
              Here's what's happening with your health today
            </p>
          </div>
          <div className="overview-quick-stats">
            <div
              className="overview-stat-card"
              onClick={() => props.setActiveView("appointments")}
            >
              <div
                className="overview-stat-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                }}
              >
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="overview-stat-content">
                <div className="overview-stat-value">
                  {upcomingAppointmentsCount}
                </div>
                <div className="overview-stat-label">Upcoming</div>
              </div>
            </div>
            <div
              className="overview-stat-card"
              onClick={() => props.setActiveView("prescriptions")}
            >
              <div
                className="overview-stat-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                }}
              >
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div className="overview-stat-content">
                <div className="overview-stat-value">
                  {activePrescriptionsCount}
                </div>
                <div className="overview-stat-label">Active Rx</div>
              </div>
            </div>
            <div
              className="overview-stat-card"
              onClick={() => props.setActiveView("messages")}
            >
              <div
                className="overview-stat-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                <MessageSquareIcon className="w-5 h-5" />
              </div>
              <div className="overview-stat-content">
                <div className="overview-stat-value">{unreadMessagesCount}</div>
                <div className="overview-stat-label">Messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="overview-content-grid">
        {/* Left Column - Primary Content */}
        <div className="overview-primary-column">
          {/* AI Briefing or Care Plan */}
          {props.carePlan ? (
            <CoachingCorner patient={props.user} carePlan={props.carePlan} />
          ) : (
            <AIBriefingCard briefing={briefing} isLoading={isBriefingLoading} />
          )}

          {/* Health Vitals */}
          <HealthVitals wearableData={props.user.wearableData} />

          {/* Mini Symptom Checker */}
          <MiniSymptomChecker setActiveView={props.setActiveView} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="overview-sidebar-column">
          {/* Upcoming Appointment Card */}
          {upcomingAppointment && (
            <div className="overview-appointment-card">
              <div className="overview-appointment-header">
                <div className="overview-appointment-header-icon">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div className="overview-appointment-header-content">
                  <h3 className="overview-appointment-title">
                    Next Appointment
                  </h3>
                  <p className="overview-appointment-date">
                    {new Date(appointmentDateTime!).toLocaleDateString(
                      undefined,
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
              <div className="overview-appointment-body">
                <div className="overview-appointment-time-section">
                  <ClockIcon className="w-5 h-5" />
                  <span className="overview-appointment-time">
                    {appointmentDateTime?.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="overview-appointment-doctor-section">
                  <UserIcon className="w-5 h-5" />
                  <div>
                    <div className="overview-appointment-doctor-name">
                      {upcomingAppointment.doctorName}
                    </div>
                    <div className="overview-appointment-specialty">
                      {upcomingAppointment.specialty}
                    </div>
                  </div>
                </div>
                {upcomingAppointment.consultingRoomName && (
                  <div className="overview-appointment-location">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{upcomingAppointment.consultingRoomName}</span>
                  </div>
                )}
                <button
                  className="overview-appointment-action"
                  onClick={() => props.setActiveView("appointments")}
                >
                  <span>View All Appointments</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Recent Messages */}
          <RecentMessages
            messages={props.messages}
            contacts={props.contacts}
            currentUser={props.user}
            setActiveView={props.setActiveView}
          />
        </div>
      </div>
    </div>
  );
};

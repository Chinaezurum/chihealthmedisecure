import React from "react";

// Generic icon creator to quickly stub out all the necessary icons.
// The paths are placeholders but will make the components valid.
const createIcon =
  (d: string, viewBox = "0 0 24 24") =>
  (props: React.SVGProps<SVGSVGElement>) =>
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox={viewBox}
        stroke="currentColor"
        strokeWidth={2}
        {...props}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
    );

// Dashboard icon - modern grid layout
export const LayoutDashboardIcon = createIcon(
  "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
);
export const CalendarIcon = createIcon(
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
);
export const UsersIcon = createIcon(
  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zM17 8a4 4 0 100-8 4 4 0 000 8z"
);
export const ActivityIcon = createIcon("M3 12h4l2-4 2 8 2-4 4 0");
export const MessageSquareIcon = createIcon(
  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
);
export const PillIcon = createIcon(
  "M12 21a9 9 0 100-18 9 9 0 000 18zM12 21a9 9 0 000-18M12 21a9 9 0 100-18"
);
export const FlaskConicalIcon = createIcon(
  "M10 21h4m-2-4v4M4.5 3L8 3m0 0l2 6.5L14 3m0 0l3.5 0M8 3V2a1 1 0 011-1h6a1 1 0 011 1v1m-10 0l-2 10h16l-2-10"
);
// Settings icon - modern gear/cog
export const SettingsIcon = createIcon(
  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
);
export const VideoIcon = createIcon(
  "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
);
export const BotMessageSquareIcon = createIcon(
  "M12 8V4m0 0h-1m1 0h1m-1 4v.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
);
export const SendIcon = createIcon("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z");
export const MicIcon = createIcon(
  "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4"
);
export const MicOffIcon = createIcon(
  "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4m-4-13l8 8"
);
export const VideoOffIcon = createIcon(
  "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM1 1l22 22"
);
export const ShieldCheckIcon = createIcon(
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"
);
export const SparklesIcon = createIcon(
  "M5 3v4M3 5h4m1 6l-2-2m0 16l2-2m3.5-5.5L12 12m9-7l-4 4m-4-4l-4 4"
);
// Health Assistant Icon - combines chat bubble with medical cross
export const HealthAssistantIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    <path d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
  </svg>
);
export const TargetIcon = createIcon(
  "M12 21a9 9 0 100-18 9 9 0 000 18zm0 0v-6"
);
export const MicroscopeIcon = createIcon(
  "M6 18h8M8 18V6a2 2 0 012-2h4a2 2 0 012 2v12M12 18V6m0 0H8m4 0h4m-4 6h4M8 12h4m-4 6h4m-4-12a2 2 0 100-4 2 2 0 000 4z"
);
export const DietIcon = createIcon(
  "M16 8a6 6 0 01-12 0c0-2.21 1.79-4 4-4s4 1.79 4 4m0 0v1h4v-1h-4zm-4 8a6 6 0 00-6 6h12a6 6 0 00-6-6z"
);
export const RepeatIcon = createIcon(
  "M17 1l4 4-4 4m-4-8H3v8m4 11l-4-4 4-4m4 8h14v-8"
);
export const SunIcon = createIcon(
  "M12 3v1m0 16v1m8-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
);
export const MoonIcon = createIcon(
  "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
);
export const BellIcon = createIcon(
  "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zm-4.27 13a2 2 0 01-3.46 0"
);
export const LogOutIcon = createIcon(
  "M17 16l4-4m0 0l-4-4m4 4H7m6-11v2a3 3 0 003 3h4a3 3 0 003-3V5a3 3 0 00-3-3H7a3 3 0 00-3 3v14a3 3 0 003 3h4a3 3 0 003-3v-2"
);
// Medical Records icon - clipboard with document
export const FolderSearchIcon = createIcon(
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
);
export const CheckCircleIcon = createIcon(
  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
);
export const AlertCircleIcon = createIcon(
  "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
);
export const CheckIcon = createIcon("M5 13l4 4L19 7");
// Alert triangle icon (used for errors/warnings)
export const AlertTriangleIcon = createIcon(
  "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"
);
export const ArrowRightIcon = createIcon("M14 5l7 7m0 0l-7 7m7-7H3");
// Health Metrics icon - activity/heart with pulse line
export const HeartPulseIcon = createIcon(
  "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0zM15 11l-3-3m0 0l-3 3m3-3v8"
);
export const StepIcon = createIcon(
  "M16 12V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v6m0 0v6a2 2 0 002 2h4a2 2 0 002-2v-6"
);
// Better health icons
export const HeartIcon = createIcon(
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
);
// Footprints icon - walking/steps representation
export const FootprintsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M7 8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm0 8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm8-8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm0 8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z" />
    <path d="M9 6h6M9 18h6" />
  </svg>
);
// Sleep icon - crescent moon with stars (better sleep representation)
export const SleepIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <circle cx="18" cy="6" r="1" fill="currentColor" />
    <circle cx="19" cy="9" r="0.5" fill="currentColor" />
  </svg>
);
export const RefreshCwIcon = createIcon(
  "M23 4v6h-6m-1.353 3.647a9 9 0 10-1.802 5.514"
);
export const BuildingIcon = createIcon(
  "M16 14h.01M12 14h.01M8 14h.01M8 10h.01M12 10h.01M16 10h.01M4 22h16v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2zM4 9a2 2 0 012-2h12a2 2 0 012 2v2H4V9z"
);
export const DollarSignIcon = createIcon(
  "M12 12h.01M8 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
);
export const BedIcon = createIcon(
  "M20 9.55V8a2 2 0 00-2-2h-8a2 2 0 00-2 2v1.55a4.002 4.002 0 00-3 3.95V18a2 2 0 002 2h14a2 2 0 002-2v-4.5a4.002 4.002 0 00-3-3.95zM9 8h6v2H9V8z"
);
export const TruckIcon = createIcon(
  "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
);
export const ClockIcon = createIcon(
  "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-14v6l5 3"
);
export const MapPinIcon = createIcon(
  "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM21 10a3 3 0 11-6 0 3 3 0 016 0z"
);
export const UserIcon = createIcon(
  "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
);
export const FileTextIcon = createIcon(
  "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
);
export const LungIcon = createIcon(
  "M12 21c-4 0-7-2-7-5.5 0-2.8 2.1-5 5-5.5V5h4v5.5c2.9.5 5 2.7 5 5.5 0 3.5-3 5.5-7 5.5zM10 6H6v4h4V6zm4 0h4v4h-4V6z"
);
export const UploadCloudIcon = createIcon(
  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m14-7l-5-5-5 5m5-5v12"
);
export const DownloadCloudIcon = createIcon(
  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m14-7l-5 5-5-5m5 5V3"
);
export const LockIcon = createIcon(
  "M8 11V7a4 4 0 1 1 8 0v4M4 11h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V11z"
);
// Key icon used by security UI - clear key shape
export const KeyIcon = createIcon(
  "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
);
// New AI Summary icon: document + star sparkle
export const AiSummaryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    {...props}
  >
    <path d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M13 2v6h6" />
    <path d="M9 12h6M9 16h6" />
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

export const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 48 48"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
    ></path>
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.108-11.182-7.484l-6.57 4.818C9.656 39.663 16.318 44 24 44z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.591 35.013 48 29.826 48 24c0-1.341-.138-2.65-.389-3.917z"
    ></path>
  </svg>
);
export const MicrosoftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="#f3f3f3"
      d="M11.4 21.9L3.1 13.6l8.3-8.3h8.3v8.3l-8.3 8.3zm-7-8.3l7 7 7-7-7-7-7 7z"
    />
    <path fill="#f1511b" d="M2 2h9.5v9.5H2z" />
    <path fill="#80cc28" d="M12.5 2h9.5v9.5h-9.5z" />
    <path fill="#00adef" d="M2 12.5h9.5v9.5H2z" />
    <path fill="#fbbc09" d="M12.5 12.5h9.5v9.5h-9.5z" />
  </svg>
);
export const DatabaseIcon = createIcon(
  "M21 12c0 1.66-4 3-9 3s-9-1.34-9-3c0-1.66 4-3 9-3s9 1.34 9 3zM3 12v3c0 1.66 4 3 9 3s9-1.34 9-3v-3M3 7v3c0 1.66 4 3 9 3s9-1.34 9-3V7M12 21c-5 0-9-1.34-9-3V7c0-1.66 4-3 9-3s9 1.34 9 3v11c0 1.66-4 3-9 3z"
);
export const CreditCardIcon = createIcon("M1 4h22v16H1zM1 10h22");
export const ArchiveIcon = createIcon(
  "M3 3h18v4H3zM3 7v11a2 2 0 002 2h14a2 2 0 002-2V7H3zm8 4h-4v4h8v-4h-4z"
);
export const ClipboardListIcon = createIcon(
  "M9 12h6M9 16h6M9 8h6M9 20h6M7 4h10v2H7z"
);
export const BedDoubleIcon = createIcon(
  "M3 13v6h18v-6a3 3 0 00-3-3h-12a3 3 0 00-3 3zM7 9h10v4H7V9z"
);
export const DoorOpenIcon = createIcon("M3 21h18V3H3v18zm6-9h2v6H9v-6z");
export const TrendingUpIcon = createIcon("M13 7h8m0 0v8m0-8l-8 8-4-4-6 6");
export const ArrowUpIcon = createIcon("M5 15l7-7 7 7");
export const ArrowDownIcon = createIcon("M19 9l-7 7-7-7");

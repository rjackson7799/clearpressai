// Lucide-style minimal SVG icons. Outline, 1.5 stroke.
const Icon = ({ children, size = 16, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >{children}</svg>
);

const IconDashboard = (p) => (<Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>);
const IconClients = (p) => (<Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>);
const IconProjects = (p) => (<Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>);
const IconSettings = (p) => (<Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>);
const IconSearch = (p) => (<Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>);
const IconBell = (p) => (<Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>);
const IconChevron = (p) => (<Icon {...p}><polyline points="9 18 15 12 9 6"/></Icon>);
const IconMore = (p) => (<Icon {...p}><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="19" r="1.4"/></Icon>);
const IconMoreH = (p) => (<Icon {...p}><circle cx="12" cy="12" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></Icon>);
const IconPlus = (p) => (<Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>);
const IconUpload = (p) => (<Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>);
const IconCloud = (p) => (<Icon {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.5-8.75A6.5 6.5 0 0 0 4 13a5 5 0 0 0 5 6h8.5z"/><polyline points="12 14 12 19"/><polyline points="9 16 12 13 15 16"/></Icon>);
const IconFile = (p) => (<Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>);
const IconX = (p) => (<Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>);
const IconPencil = (p) => (<Icon {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></Icon>);
const IconSparkles = (p) => (<Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.5"/></Icon>);
const IconClock = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></Icon>);
const IconInfo = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></Icon>);
const IconCheck = (p) => (<Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>);
const IconHome = (p) => (<Icon {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>);
const IconChevronDown = (p) => (<Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>);
const IconChevronUpDown = (p) => (<Icon {...p}><polyline points="7 15 12 20 17 15"/><polyline points="7 9 12 4 17 9"/></Icon>);
const IconMegaphone = (p) => (<Icon {...p}><path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z"/><path d="M16 8a5 5 0 0 1 0 8"/></Icon>);
const IconArticle = (p) => (<Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></Icon>);
const IconShare = (p) => (<Icon {...p}><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><line x1="8.2" y1="10.8" x2="15.8" y2="6.2"/><line x1="8.2" y1="13.2" x2="15.8" y2="17.8"/></Icon>);
const IconMemo = (p) => (<Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></Icon>);
const IconHelp = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-0.7 0.4-1 0.9-1 1.7v0.5"/><circle cx="12" cy="16.5" r="0.5" fill="currentColor"/></Icon>);
const IconQuote = (p) => (<Icon {...p}><path d="M7 7h4v4H7c0 2 1 3 3 3v2c-3 0-5-2-5-5V8a1 1 0 0 1 1-1z"/><path d="M15 7h4v4h-4c0 2 1 3 3 3v2c-3 0-5-2-5-5V8a1 1 0 0 1 1-1z"/></Icon>);
const IconUser = (p) => (<Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>);
const IconAlert = (p) => (<Icon {...p}><path d="M12 3 2 20h20z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></Icon>);
const IconTrash = (p) => (<Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></Icon>);
const IconGrip = (p) => (<Icon {...p}><circle cx="9" cy="6" r="0.8" fill="currentColor"/><circle cx="15" cy="6" r="0.8" fill="currentColor"/><circle cx="9" cy="12" r="0.8" fill="currentColor"/><circle cx="15" cy="12" r="0.8" fill="currentColor"/><circle cx="9" cy="18" r="0.8" fill="currentColor"/><circle cx="15" cy="18" r="0.8" fill="currentColor"/></Icon>);
const IconArrowRight = (p) => (<Icon {...p}><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></Icon>);
const IconChevronLeft = (p) => (<Icon {...p}><polyline points="15 18 9 12 15 6"/></Icon>);
const IconList = (p) => (<Icon {...p}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="5" cy="6" r="0.8" fill="currentColor"/><circle cx="5" cy="12" r="0.8" fill="currentColor"/><circle cx="5" cy="18" r="0.8" fill="currentColor"/></Icon>);
const IconLink = (p) => (<Icon {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></Icon>);
const IconCopy = (p) => (<Icon {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>);
const IconExternal = (p) => (<Icon {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Icon>);
const IconLock = (p) => (<Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></Icon>);
const IconSave = (p) => (<Icon {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Icon>);
const IconPaperclip = (p) => (<Icon {...p}><path d="M21 11.5L12 20.5a5 5 0 0 1-7-7L13.5 5a3.5 3.5 0 0 1 5 5L10 18.5a2 2 0 0 1-3-3l7-7"/></Icon>);
const IconCheckCircle = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/></Icon>);
const IconMail = (p) => (<Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></Icon>);
const IconArrowLeft = (p) => (<Icon {...p}><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/></Icon>);
const IconGlobe = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0 -18"/></Icon>);

Object.assign(window, {
  Icon, IconDashboard, IconClients, IconProjects, IconSettings, IconSearch,
  IconBell, IconChevron, IconChevronDown, IconChevronUpDown, IconMore, IconMoreH,
  IconPlus, IconUpload, IconCloud, IconFile, IconX, IconPencil, IconSparkles,
  IconClock, IconInfo, IconCheck, IconHome,
  IconMegaphone, IconArticle, IconShare, IconMemo, IconHelp, IconQuote,
  IconUser, IconAlert, IconTrash, IconGrip, IconArrowRight, IconChevronLeft,
  IconList, IconLink, IconCopy, IconExternal, IconLock, IconSave,
  IconPaperclip, IconCheckCircle, IconMail, IconArrowLeft, IconGlobe,
});

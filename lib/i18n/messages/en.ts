import type { Messages } from "@/lib/i18n/types";

export const messages = {
  metadata: {
    title: "Family Money Management",
    description: "A private home for our family budget, accounts, and goals.",
  },
  brand: {
    name: "Family Money",
    monogram: "FM",
    subtitle: "Our shared financial home",
  },
  navigation: {
    dashboard: "Dashboard",
    monthlyPlan: "Monthly plan",
    expenses: "Expenses",
    income: "Income",
    accounts: "Accounts & assets",
    assets: "Assets & gold",
    goals: "Goals",
    investments: "Investments",
    liabilities: "Liabilities",
    transfers: "Transfers",
    recurring: "Recurring",
    netWorth: "Net worth",
    reports: "Reports",
    settings: "Settings",
    add: "Add",
    more: "More",
    comingSoon: "Coming soon",
  },
  shell: {
    familyName: "Our family",
    overview: "Overview",
    currentMonth: "Current month",
    privateWorkspace: "Private workspace",
    signedIn: "Session verified",
    setupMode: "Foundation mode",
    skipToContent: "Skip to content",
    theme: "Change color theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation",
    loading: "Loading dashboard",
    changePassword: "Change password",
    signOutDevice: "Sign out this device",
    signOutEverywhere: "Sign out everywhere",
    roleOwner: "owner",
    roleMember: "member",
  },
  dashboard: {
    eyebrow: "Security foundation · Phase 1B",
    title: "Your private financial home is secured.",
    description:
      "Username login, forced password replacement, family isolation, financial tables, audit history, and row-level security are now in place.",
    statusTitle: "Security readiness",
    statusDescription:
      "Everything here reflects real project readiness—never invented balances or sample transactions.",
    ready: "Ready",
    needsSetup: "Needs setup",
    nextPhase: "Next phase",
    applicationTitle: "Application shell",
    applicationDescription:
      "Responsive navigation, design tokens, mobile layout, and accessible components are in place.",
    supabaseTitle: "Supabase environment",
    supabaseConfigured:
      "Public connection details are configured and server-side session checks are active.",
    supabaseUnconfigured:
      "Add the project URL and publishable key to .env.local to activate session checks.",
    securityTitle: "Household security",
    securityDescription:
      "Owner/member roles, forced first-login password change, family RLS, and audit logging are active.",
    nextTitle: "Next: record the money flow",
    nextDescription:
      "Phase 2A turns the secured foundation into the daily income, expense, account, transfer, and asset workflow.",
    stepDatabase: "Build income and daily expense entry",
    stepHousehold: "Connect accounts, assets, and transfers",
    stepAccess: "Add recurring items and liabilities",
    emptyTitle: "No financial data yet—and that is intentional.",
    emptyDescription:
      "Your first balances, income, and expenses will be entered in Phase 2A—never invented from demo content.",
  },
  auth: {
    eyebrow: "Private household access",
    title: "Welcome home.",
    description: "One secure place for the money decisions you make together.",
    username: "Username or email",
    usernamePlaceholder: "assemkh or your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember this device",
    forgotPassword: "Forgot password?",
    signIn: "Sign in securely",
    pendingTitle: "Secure account access is ready",
    pendingDescription:
      "Sign in with your username or email. A temporary password must be replaced after the first login.",
    configurationTitle: "Connect Supabase first",
    configurationDescription:
      "Copy .env.example to .env.local and add your Supabase project URL and publishable key.",
    backToFoundation: "View foundation status",
  },
  feedback: {
    unexpectedTitle: "We hit an unexpected problem.",
    unexpectedDescription:
      "Your data is safe. Please try again, or return to the dashboard.",
    retry: "Try again",
    notFoundTitle: "This page is not part of your financial home yet.",
    notFoundDescription:
      "The address may be incorrect, or this feature may still be on the roadmap.",
    goHome: "Return to dashboard",
  },
} satisfies Messages;

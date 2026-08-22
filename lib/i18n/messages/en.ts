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
  },
  dashboard: {
    eyebrow: "Foundation · Phase 1A",
    title: "A calmer way to manage money together.",
    description:
      "The private workspace is ready. Real financial activity will begin only after your household database and security policies are installed.",
    statusTitle: "Foundation status",
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
      "Database tables, family isolation, roles, RLS, and owner provisioning belong to Phase 1B.",
    nextTitle: "Next: secure the household",
    nextDescription:
      "Phase 1B turns this polished shell into a private, family-isolated application.",
    stepDatabase: "Create the family-first database schema",
    stepHousehold: "Install RLS and owner/member permissions",
    stepAccess: "Provision username login and forced password change",
    emptyTitle: "No financial data yet—and that is intentional.",
    emptyDescription:
      "Your first balances, income, and expenses will come from your secured household database, not demo content.",
  },
  auth: {
    eyebrow: "Private household access",
    title: "Welcome home.",
    description: "One secure place for the money decisions you make together.",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember this device",
    forgotPassword: "Forgot password?",
    signIn: "Sign in securely",
    pendingTitle: "Secure account setup is next",
    pendingDescription:
      "Username authentication and the bootstrap owner are implemented in Phase 1B. The form stays disabled until that security layer exists.",
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

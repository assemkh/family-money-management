import type { Locale } from "@/lib/i18n/config";

export type SettingsPageCopy = {
  hero: {
    badge: string;
    title: string;
    description: string;
    owner: string;
    fullControl: string;
    viewOnly: string;
    language: string;
    audit: string;
    protected: string;
  };
  navigationLabel: string;
  navigation: {
    family: string;
    categories: string;
    sources: string;
    planning: string;
    health: string;
    dashboard: string;
    rates: string;
    members: string;
    security: string;
  };
  ownerNotice: {
    title: string;
    description: string;
  };
  inventory: {
    activeCategories: string;
    configuredCategories: (count: number) => string;
    activeSources: string;
    sourceDescription: string;
    locale: string;
    localeDescription: string;
  };
  sections: {
    family: SectionCopy;
    categories: SectionCopy;
    sources: SectionCopy;
    planning: SectionCopy;
    health: SectionCopy;
    dashboard: SectionCopy;
    rates: SectionCopy;
    members: SectionCopy;
    security: SectionCopy;
  };
  members: {
    lastSignIn: (date: string) => string;
    noSignIn: string;
    addTitle: string;
    lockedTitle: string;
    lockedDescription: string;
    memberRole: string;
  };
  familyForm: {
    familyName: string;
    baseCurrency: string;
    fixedCurrency: string;
    interfaceLanguage: string;
    timezone: string;
    dateFormat: string;
    save: string;
    saving: string;
  };
  allocationForm: {
    total: string;
    fields: Record<AllocationField, string>;
    save: string;
    saving: string;
  };
  healthForm: {
    fields: Record<HealthField, FieldCopy>;
    save: string;
    saving: string;
  };
  dashboardForm: {
    kpiDensity: string;
    fullCards: string;
    compactCards: string;
    defaultMonth: string;
    currentMonth: string;
    previousMonth: string;
    chartRange: string;
    months: string;
    visibleAreas: string;
    widgets: Record<DashboardWidget, FieldCopy>;
    save: string;
    saving: string;
  };
  exchangeRateForm: {
    inDzd: string;
    currentSince: string;
    noRate: string;
    rate: string;
    effectiveDate: string;
    save: string;
    saving: string;
  };
  securityControls: {
    changePassword: string;
    changePasswordDescription: string;
    revokeOthers: string;
    revokeOthersDescription: string;
    revoking: string;
    signOutEverywhere: string;
    signOutEverywhereDescription: string;
  };
};

type SectionCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

type FieldCopy = {
  label: string;
  description: string;
};

type AllocationField = "essentials" | "personal" | "savings" | "investment" | "reserve";

type HealthField =
  | "positiveSavingRate"
  | "neutralSavingRate"
  | "positivePlanVariancePercent"
  | "warningPlanVariancePercent"
  | "essentialsWarningRatio"
  | "positiveInvestmentRate"
  | "debtWarningRatio"
  | "goalProgressTarget";

type DashboardWidget =
  "showHealth" | "showPlan" | "showBreakdowns" | "showNetWorth" | "showGoals";

const english = {
  hero: {
    badge: "Phase 3B · Household controls",
    title: "Shape the system around your family.",
    description:
      "One calm control room for planning defaults, financial signals, family access, language, and manual valuations.",
    owner: "Owner",
    fullControl: "Full control",
    viewOnly: "View only",
    language: "Language",
    audit: "Audit",
    protected: "Protected",
  },
  navigationLabel: "Settings sections",
  navigation: {
    family: "Family",
    categories: "Categories",
    sources: "Income sources",
    planning: "Planning",
    health: "Health",
    dashboard: "Dashboard",
    rates: "Rates",
    members: "Members",
    security: "Security",
  },
  ownerNotice: {
    title: "Owner approval is required",
    description:
      "You can review family settings, but only the household owner can change configuration or add members.",
  },
  inventory: {
    activeCategories: "Active categories",
    configuredCategories: (count) => `${count} family-configured in total`,
    activeSources: "Active income sources",
    sourceDescription: "Add, assign, reorder, archive, or restore below.",
    locale: "Application locale",
    localeDescription: "RTL-aware shell preferences are stored with the family.",
  },
  sections: {
    family: {
      eyebrow: "Household identity",
      title: "Family Preferences",
      description:
        "The shared name, currency, language, timezone, and date style for this private workspace.",
    },
    categories: {
      eyebrow: "Daily spending structure",
      title: "Category Management",
      description:
        "Add and rename family categories, create one-level parent groups, set their order, or archive them without changing history.",
    },
    sources: {
      eyebrow: "Where income begins",
      title: "Income-Source Management",
      description:
        "Create and assign income sources to a family member, control their display order, and archive unused sources safely.",
    },
    planning: {
      eyebrow: "New-month starting point",
      title: "Planning Defaults",
      description:
        "These values prefill a new month. They never overwrite an active or historical plan.",
    },
    health: {
      eyebrow: "Meaningful signals",
      title: "Financial Health Thresholds",
      description:
        "Choose where dashboard signals become healthy, watchful, or urgent.",
    },
    dashboard: {
      eyebrow: "Your daily financial brief",
      title: "Dashboard Preferences",
      description:
        "Choose the opening month, KPI density, chart range, and which decision areas your family sees.",
    },
    rates: {
      eyebrow: "Manual valuation only",
      title: "Exchange Rates",
      description:
        "Update EUR and USD without a market-data provider. Every DZD valuation uses your latest effective rate.",
    },
    members: {
      eyebrow: "People & access",
      title: "Family Members",
      description:
        "See who can access the shared household and add the second secure account when ready.",
    },
    security: {
      eyebrow: "Personal account protection",
      title: "Security & Sessions",
      description:
        "Change your password, revoke other devices while keeping this one, or sign out everywhere.",
    },
  },
  members: {
    lastSignIn: (date) => `last sign-in ${date}`,
    noSignIn: "no completed sign-in yet",
    addTitle: "Add a secure family member",
    lockedTitle: "Member administration is locked.",
    lockedDescription: "Ask the family owner to add or manage household access.",
    memberRole: "member",
  },
  familyForm: {
    familyName: "Family name",
    baseCurrency: "Base currency",
    fixedCurrency: "Fixed for DZD valuations",
    interfaceLanguage: "Interface language",
    timezone: "Timezone",
    dateFormat: "Date format",
    save: "Save family preferences",
    saving: "Saving…",
  },
  allocationForm: {
    total: "Default allocation total",
    fields: {
      essentials: "Essentials",
      personal: "Personal",
      savings: "Savings",
      investment: "Investments",
      reserve: "Reserve",
    },
    save: "Save planning defaults",
    saving: "Saving…",
  },
  healthForm: {
    fields: {
      positiveSavingRate: {
        label: "Healthy saving rate",
        description: "Green at or above this rate",
      },
      neutralSavingRate: {
        label: "Saving watch level",
        description: "Amber below this rate",
      },
      positivePlanVariancePercent: {
        label: "Aligned plan gap",
        description: "Green at or below this gap",
      },
      warningPlanVariancePercent: {
        label: "Plan warning gap",
        description: "Red above this gap",
      },
      essentialsWarningRatio: {
        label: "Essentials warning",
        description: "Watch when essentials exceed income share",
      },
      positiveInvestmentRate: {
        label: "Healthy investment rate",
        description: "Target invested share of income",
      },
      debtWarningRatio: {
        label: "Debt warning ratio",
        description: "Watch debt payments above income share",
      },
      goalProgressTarget: {
        label: "Goal progress target",
        description: "On-track completion percentage",
      },
    },
    save: "Save health thresholds",
    saving: "Saving…",
  },
  dashboardForm: {
    kpiDensity: "KPI density",
    fullCards: "Full cards",
    compactCards: "Compact cards",
    defaultMonth: "Default month",
    currentMonth: "Current month",
    previousMonth: "Previous month",
    chartRange: "Chart range",
    months: "months",
    visibleAreas: "Visible dashboard areas",
    widgets: {
      showHealth: {
        label: "Financial-health signals",
        description: "Status cards beside the money-flow chart.",
      },
      showPlan: {
        label: "Plan vs actual",
        description: "Monthly allocation targets compared with real activity.",
      },
      showBreakdowns: {
        label: "Breakdown charts",
        description: "Expense and asset-allocation composition.",
      },
      showNetWorth: {
        label: "Net-worth trend",
        description: "Historical snapshot direction.",
      },
      showGoals: {
        label: "Savings goals",
        description: "Shared milestone progress at the bottom of the dashboard.",
      },
    },
    save: "Save dashboard preferences",
    saving: "Saving…",
  },
  exchangeRateForm: {
    inDzd: "in DZD",
    currentSince: "Current since",
    noRate: "No manual rate yet",
    rate: "Rate",
    effectiveDate: "Effective date",
    save: "Save rate",
    saving: "Saving…",
  },
  securityControls: {
    changePassword: "Change password",
    changePasswordDescription: "Replace your current password and keep this session.",
    revokeOthers: "Revoke other sessions",
    revokeOthersDescription:
      "Keep this device signed in and remove every other session.",
    revoking: "Revoking…",
    signOutEverywhere: "Sign out everywhere",
    signOutEverywhereDescription:
      "End this session and every other session for your account.",
  },
} satisfies SettingsPageCopy;

const arabic = {
  hero: {
    badge: "المرحلة 3B · أدوات تحكم العائلة",
    title: "اضبط النظام بما يناسب عائلتك.",
    description:
      "مركز هادئ واحد لإعدادات التخطيط والمؤشرات المالية وصلاحيات العائلة واللغة والتقييمات اليدوية.",
    owner: "المالك",
    fullControl: "تحكم كامل",
    viewOnly: "عرض فقط",
    language: "اللغة",
    audit: "سجل التدقيق",
    protected: "محمي",
  },
  navigationLabel: "أقسام الإعدادات",
  navigation: {
    family: "العائلة",
    categories: "التصنيفات",
    sources: "مصادر الدخل",
    planning: "التخطيط",
    health: "المؤشرات",
    dashboard: "لوحة المتابعة",
    rates: "أسعار الصرف",
    members: "الأعضاء",
    security: "الأمان",
  },
  ownerNotice: {
    title: "يلزم اعتماد مالك العائلة",
    description:
      "يمكنك مراجعة إعدادات العائلة، لكن مالك العائلة وحده يستطيع تغيير الإعدادات أو إضافة أعضاء.",
  },
  inventory: {
    activeCategories: "التصنيفات النشطة",
    configuredCategories: (count) => `${count} تصنيفاً خاصاً بالعائلة إجمالاً`,
    activeSources: "مصادر الدخل النشطة",
    sourceDescription: "يمكنك الإضافة والتعيين والترتيب والأرشفة والاستعادة أدناه.",
    locale: "لغة التطبيق",
    localeDescription: "يُحفظ اتجاه الواجهة المناسب للغة ضمن إعدادات العائلة.",
  },
  sections: {
    family: {
      eyebrow: "هوية العائلة",
      title: "تفضيلات العائلة",
      description:
        "الاسم والعملة واللغة والمنطقة الزمنية وتنسيق التاريخ المشترك لهذه المساحة الخاصة.",
    },
    categories: {
      eyebrow: "هيكلة المصاريف اليومية",
      title: "إدارة التصنيفات",
      description:
        "أضف تصنيفات العائلة وغيّر أسماءها، وأنشئ مجموعات رئيسية، ورتّبها أو أرشفها من دون تغيير السجل التاريخي.",
    },
    sources: {
      eyebrow: "من أين يبدأ الدخل",
      title: "إدارة مصادر الدخل",
      description:
        "أنشئ مصادر الدخل واربطها بأحد أفراد العائلة، وحدد ترتيبها، وأرشف المصادر غير المستخدمة بأمان.",
    },
    planning: {
      eyebrow: "نقطة بداية الشهر الجديد",
      title: "إعدادات التخطيط الافتراضية",
      description:
        "تملأ هذه القيم خطة الشهر الجديد فقط، ولا تستبدل أي خطة حالية أو تاريخية.",
    },
    health: {
      eyebrow: "مؤشرات ذات معنى",
      title: "حدود الصحة المالية",
      description: "حدد متى تصبح مؤشرات لوحة المتابعة جيدة أو تحتاج متابعة أو تدخلاً.",
    },
    dashboard: {
      eyebrow: "ملخصك المالي اليومي",
      title: "تفضيلات لوحة المتابعة",
      description:
        "اختر شهر الافتتاح وكثافة المؤشرات والمدى الزمني والمناطق التي تظهر لعائلتك.",
    },
    rates: {
      eyebrow: "تقييم يدوي فقط",
      title: "أسعار الصرف",
      description:
        "حدّث اليورو والدولار يدوياً. تستخدم كل قيمة بالدينار أحدث سعر صرف فعّال.",
    },
    members: {
      eyebrow: "الأشخاص والصلاحيات",
      title: "أفراد العائلة",
      description:
        "راجع من يمكنه الوصول إلى المساحة المشتركة وأضف الحساب العائلي الآمن الثاني عند الحاجة.",
    },
    security: {
      eyebrow: "حماية الحساب الشخصي",
      title: "الأمان والجلسات",
      description:
        "غيّر كلمة المرور، أو ألغِ جلسات الأجهزة الأخرى مع إبقاء هذا الجهاز، أو سجّل الخروج من كل الأجهزة.",
    },
  },
  members: {
    lastSignIn: (date) => `آخر دخول ${date}`,
    noSignIn: "لم يكتمل تسجيل الدخول بعد",
    addTitle: "إضافة فرد من العائلة بحساب آمن",
    lockedTitle: "إدارة الأعضاء مقفلة.",
    lockedDescription: "اطلب من مالك العائلة إضافة الأعضاء أو إدارة صلاحياتهم.",
    memberRole: "عضو",
  },
  familyForm: {
    familyName: "اسم العائلة",
    baseCurrency: "العملة الأساسية",
    fixedCurrency: "ثابتة للتقييمات بالدينار الجزائري",
    interfaceLanguage: "لغة الواجهة",
    timezone: "المنطقة الزمنية",
    dateFormat: "تنسيق التاريخ",
    save: "حفظ تفضيلات العائلة",
    saving: "جارٍ الحفظ…",
  },
  allocationForm: {
    total: "إجمالي التوزيع الافتراضي",
    fields: {
      essentials: "الأساسيات",
      personal: "المصاريف الشخصية",
      savings: "الادخار",
      investment: "الاستثمارات",
      reserve: "الاحتياطي",
    },
    save: "حفظ إعدادات التخطيط",
    saving: "جارٍ الحفظ…",
  },
  healthForm: {
    fields: {
      positiveSavingRate: {
        label: "معدل الادخار الجيد",
        description: "أخضر عند هذا المعدل أو أعلى",
      },
      neutralSavingRate: {
        label: "مستوى متابعة الادخار",
        description: "كهرماني تحت هذا المعدل",
      },
      positivePlanVariancePercent: {
        label: "فارق الخطة المتوازن",
        description: "أخضر عند هذا الفارق أو أقل",
      },
      warningPlanVariancePercent: {
        label: "فارق تحذير الخطة",
        description: "أحمر فوق هذا الفارق",
      },
      essentialsWarningRatio: {
        label: "تحذير الأساسيات",
        description: "متابعة عندما تتجاوز الأساسيات حصتها من الدخل",
      },
      positiveInvestmentRate: {
        label: "معدل الاستثمار الجيد",
        description: "الحصة المستهدفة للاستثمار من الدخل",
      },
      debtWarningRatio: {
        label: "نسبة تحذير الديون",
        description: "متابعة أقساط الديون عند تجاوز حصتها من الدخل",
      },
      goalProgressTarget: {
        label: "هدف تقدم الادخار",
        description: "نسبة الإنجاز الموافقة للمسار",
      },
    },
    save: "حفظ حدود الصحة المالية",
    saving: "جارٍ الحفظ…",
  },
  dashboardForm: {
    kpiDensity: "كثافة المؤشرات",
    fullCards: "بطاقات كاملة",
    compactCards: "بطاقات مختصرة",
    defaultMonth: "الشهر الافتراضي",
    currentMonth: "الشهر الحالي",
    previousMonth: "الشهر السابق",
    chartRange: "مدى الرسم البياني",
    months: "أشهر",
    visibleAreas: "أقسام لوحة المتابعة الظاهرة",
    widgets: {
      showHealth: {
        label: "مؤشرات الصحة المالية",
        description: "بطاقات الحالة بجانب مخطط التدفق المالي.",
      },
      showPlan: {
        label: "الخطة مقابل الفعلي",
        description: "مقارنة أهداف التوزيع الشهرية بالنشاط الفعلي.",
      },
      showBreakdowns: {
        label: "رسوم التوزيع",
        description: "تركيبة المصاريف وتوزيع الأصول.",
      },
      showNetWorth: {
        label: "اتجاه صافي الثروة",
        description: "اتجاه اللقطات المالية التاريخية.",
      },
      showGoals: {
        label: "أهداف الادخار",
        description: "تقدم الأهداف المشتركة في أسفل لوحة المتابعة.",
      },
    },
    save: "حفظ تفضيلات لوحة المتابعة",
    saving: "جارٍ الحفظ…",
  },
  exchangeRateForm: {
    inDzd: "بالدينار الجزائري",
    currentSince: "ساري منذ",
    noRate: "لم يُدخل سعر يدوي بعد",
    rate: "السعر",
    effectiveDate: "تاريخ السريان",
    save: "حفظ السعر",
    saving: "جارٍ الحفظ…",
  },
  securityControls: {
    changePassword: "تغيير كلمة المرور",
    changePasswordDescription: "استبدل كلمة المرور الحالية مع إبقاء هذه الجلسة مفتوحة.",
    revokeOthers: "إلغاء الجلسات الأخرى",
    revokeOthersDescription: "أبقِ هذا الجهاز مسجلاً للدخول وألغِ كل الجلسات الأخرى.",
    revoking: "جارٍ الإلغاء…",
    signOutEverywhere: "تسجيل الخروج من كل الأجهزة",
    signOutEverywhereDescription: "أنه هذه الجلسة وكل الجلسات الأخرى المرتبطة بحسابك.",
  },
} satisfies SettingsPageCopy;

const copies: Record<Locale, SettingsPageCopy> = {
  ar: arabic,
  en: english,
};

export function getSettingsCopy(locale: Locale) {
  return copies[locale];
}

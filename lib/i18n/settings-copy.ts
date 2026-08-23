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
};

type SectionCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

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
} satisfies SettingsPageCopy;

const copies: Record<Locale, SettingsPageCopy> = {
  ar: arabic,
  en: english,
};

export function getSettingsCopy(locale: Locale) {
  return copies[locale];
}

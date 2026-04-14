export interface SubCategory {
  key: string;
  label: string;
  mode: "speaking" | "messaging" | "email" | "writing";
}

export interface Preset {
  id: string;
  label: string;
  route: string;
  subCategories: SubCategory[];
}

export const PRESETS: Preset[] = [
  {
    id: "work",
    label: "At Work",
    route: "/(app)/work",
    subCategories: [
      { key: "meeting",      label: "In-person",     mode: "speaking"   },
      { key: "video_call",   label: "Video call",    mode: "speaking"   },
      { key: "small_talk",   label: "Small talk",    mode: "speaking"   },
      { key: "presentation", label: "Presentation",  mode: "speaking"   },
      { key: "messenger",    label: "Slack",         mode: "messaging"  },
      { key: "work_email",   label: "Email",         mode: "email"      },
    ],
  },
  {
    id: "academia",
    label: "In Academia",
    route: "/(app)/academia",
    subCategories: [
      { key: "prof_meeting",  label: "Advisor meeting", mode: "speaking" },
      { key: "seminar",       label: "Research talk",   mode: "speaking" },
      { key: "conference_qa", label: "Conference Q&A",  mode: "speaking" },
      { key: "thesis",        label: "Thesis / Paper",  mode: "writing"  },
      { key: "prof_email",    label: "Professor email", mode: "email"    },
    ],
  },
  {
    id: "friends",
    label: "With Friends",
    route: "/(app)/friends",
    subCategories: [
      { key: "in_person",  label: "In person",   mode: "speaking"  },
      { key: "whatsapp",   label: "Direct message", mode: "messaging" },
      { key: "group_chat", label: "Group chat",  mode: "messaging" },
    ],
  },
  {
    id: "todo",
    label: "To-do list",
    route: "/(app)/todo",
    subCategories: [],
  },
];

export const DEFAULT_ENABLED = ["work", "friends", "todo"];

export type SchoolLevel = "1AS" | "2AS" | "3AS";

export type Subject = {
  slug: string;
  name: string;
  ar: string;
  code: string;
  tone: string;
  levels: SchoolLevel[];
};

export const subjects: Subject[] = [
  { slug: "mathematics", name: "mathematics", ar: "الرياضيات", code: "∑", tone: "bg-[#dfe8ff] text-[#355fb5]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "physics", name: "Physical Sciences", ar: "العلوم الفيزيائية", code: "Φ", tone: "bg-[#f3e6dc] text-[#a35424]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "natural-life-sciences", name: "Natural & Life Sciences", ar: "علوم الطبيعة والحياة", code: "⌬", tone: "bg-[#e2eee8] text-[#367250]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "english", name: "English", ar: "الإنجليزية", code: "A", tone: "bg-[#eee5f4] text-[#704e92]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "history", name: "His/geo", ar: "اجتماعيات", code: "H", tone: "bg-[#f1ead8] text-[#876819]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "islamic-sciences", name: "Islamic Sciences", ar: "العلوم الإسلامية", code: "◈", tone: "bg-[#dcebe9] text-[#286d68]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "philo", name: "philo", ar: "فلسفة", code: "⌘", tone: "bg-[#e6e7eb] text-[#4d5565]", levels: ["3AS"] },
  { slug: "french", name: "French", ar: "الفرنسية", code: "FR", tone: "bg-[#e6e7eb] text-[#4d5565]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "arabic", name: "Arabic", ar: "أدب عربي", code: "ض", tone: "bg-[#e6e7eb] text-[#4d5565]", levels: ["1AS", "2AS", "3AS"] },
  { slug: "music", name: "Music", ar: "الموسيقى", code: "♫", tone: "bg-[#f2e4f8] text-[#8a4fa3]", levels: ["1AS", "2AS"] },
  { slug: "drawing", name: "Drawing", ar: "الرسم", code: "✎", tone: "bg-[#f8e5df] text-[#a5543e]", levels: ["1AS", "2AS"] },
];

export const subjectBySlug = (slug: string) => subjects.find((subject) => subject.slug === slug);

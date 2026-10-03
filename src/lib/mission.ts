/**
 * Mission page content — "Our Respected Shaykh's Mission".
 * Source: owner-provided Bengali text (from the islahbd.github.io/Islah
 * mission design) plus its English translation. Both kept verbatim in
 * both languages, like API titles. Only chrome (back link, header)
 * translates via i18n.
 */

export type QuoteColor = 'gold' | 'blue' | 'pink' | 'teal';

export interface MissionQuote {
  color: QuoteColor;
  text: string;
}

export interface MissionSection {
  id: string;
  icon: 'intro' | 'lineage' | 'goal' | 'path' | 'sohbat' | 'tasawwuf' | 'dream' | 'end';
  title: string;
  paragraphs: string[];
  quote?: MissionQuote;
  quoteAfter?: string[];
  bullets?: string[];
  bulletsAfter?: string;
  bullets2?: string[];
}

export const MISSION_HEADER_TITLE = 'লক্ষ্য ও উদ্দেশ্য';
export const MISSION_HEADER_TITLE_EN = 'Goal & Objective';
export const MISSION_TITLE = 'আমাদের শ্রদ্ধেয় শায়খের লক্ষ্য ও উদ্দেশ্য';
export const MISSION_TITLE_EN = "Our Respected Shaykh's Goal & Objective";
export const MISSION_SUBTITLE = 'আল্লাহর মহব্বত, আত্মশুদ্ধি ও মানুষ গড়ার এক মহান। মিশন।';
export const MISSION_SUBTITLE_EN = "A great mission of Allah's love, self-purification and building people.";

export const MISSION_SECTIONS: MissionSection[] = [
  {
    id: 'intro',
    icon: 'intro',
    title: 'ভূমিকা',
    paragraphs: [
      'হাকীমুল উম্মত, মুজাদ্দিদুল মিল্লাত, আরিফ বিল্লাহ হযরত মাওলানা শাহ আশরাফ আলী থানভী রহমতুল্লাহি আলাইহি বলতেন—',
      'পৃথিবীতে দুই প্রকার ওলী। এক প্রকার ওলী হলেন তাঁরা, যাঁরা নিজেরে আল্লাহওয়ালা। আরেক প্রকার হলেন তাঁরা, যাঁরা নিজেরে আল্লাহওয়ালা হওয়ার পাশাপাশি আল্লাহওয়ালা তৈরীর কারিগর।',
      'এই দ্বিতীয় শ্রেণির ওলী হলেন তাঁরা, যাঁদের সোহবতে মানুষের জীবনযাত্রা বদলে যায়, যাঁদের সোহবতে অন্তরের জাগরণ ঘটে, তাঁদের দৃষ্টিতে মানুষ ধীরে ধীরে আল্লাহর প্রিয় বান্দা হওয়ার পথে এগিয়ে যায়।',
      'হযরত থানভী রহমতুল্লাহি আলাইহি নিজেই ছিলেন এমন এক মহান মুর্শিদ—যাঁর জীবন ছিল মানুষ গড়ার এক বিরাট মিশন।',
    ],
    quote: {
      color: 'gold',
      text: '“যদি পীর, বুজুর্গ, সুফি, সাধু ও দরবেশ হতে চাও, তাহলে অন্য কোথাও যাও। হাঁ, যদি মানুষ হতে চাও, তাহলে আল্লাহর ওলীর কাছে আসো।”',
    },
    bullets: [
      'পীর হওয়া নয় — মানুষ হওয়া।',
      'বড় হওয়া নয় — আল্লাহর বান্দা হওয়া।',
      'পরিচিতি অর্জন নয় — নিজেকে সংশোধন করা।',
    ],
  },
  {
    id: 'lineage',
    icon: 'lineage',
    title: 'আল্লাহওয়ালা তৈরীর সেই ধারার এক মহান মুর্শিদ',
    paragraphs: [
      'এই মহান ধারায় একজন উজ্জ্বল নক্ষত্র ছিলেন আরিফ বিল্লাহ হযরত মাওলানা শাহ হাকীম মুহাম্মদ আখতার সাহেব রহমতুল্লাহি আলাইহি।',
      'তিনি নিজে আল্লাহর মহব্বতে নিমগ্ন ছিলেন এবং তাঁর অন্তরের অন্যতম বড় আকাঙ্ক্ষা ছিল—যাঁর সাথে তাঁর সম্পর্ক রয়েছে, তাঁরা যেন তাঁর জীবদ্দশাতেই আল্লাহওয়ালা হয়ে ওঠে।',
    ],
    quote: {
      color: 'blue',
      text: '“হে বুজুর্গ! তোমরা এমন হয়ো না যে, আমার পরে আল্লাহওয়ালা হবে; বরং আমার জীবদ্দশাতেই তোমরা আল্লাহওয়ালা হও, যাতে আমি তোমাদেরকে দেখে আমার চোখ ও মন জুড়াতে পারি।”',
    },
    quoteAfter: [
      'একজন সত্যিকারের মুর্শিদের পরিচয় এখানেই। তিনি মানুষকে নিজের দিকে আকর্ষণ করে রাখতে চান না; বরং আল্লাহর দিকে পৌঁছে দিতে চান।',
      'তিনি চান না তাঁর সাথে সম্পর্ক মানুষের জীবনের শেষ গন্তব্য হোক; বরং সেই সম্পর্কের মাধ্যমে মানুষ যেন আল্লাহর সাথে গভীর সম্পর্ক গড়ে তোলে।',
    ],
  },
  {
    id: 'goal',
    icon: 'goal',
    title: 'আমাদের শ্রদ্ধেয় শায়খের মূল লক্ষ্য',
    paragraphs: [
      'মানুষকে আল্লাহর মহব্বতের পথে নিয়ে যাওয়া।',
      'হযরত ওয়ালা দামাত বারাকাতুহুম ছোটবেলা থেকেই হাকীমুল উম্মত, আরিফ বিল্লাহ হযরত মাওলানা শাহ আব্দুল মতীন সাহেব দামাত বারাকাতুহুমের শিষ্যত্ব, সোহবত ও তারবিয়াতের সৌভাগ্য লাভ করেছেন।',
      'দীর্ঘকাল একজন আল্লাহওয়ালা মুর্শিদের সাহচর্য থেকে তিনি শুধু তত্ত্বগত জ্ঞান অর্জন করেননি; বরং ইসলাহ, তারবিয়াত, সুলুক ও তাসাউফের মাধ্যমে গভীর জ্ঞান, বাস্তব অভিজ্ঞতা ও পবিত্রতা অর্জন করেছেন।',
      'তাঁর অন্তরের আকাঙ্ক্ষা অত্যন্ত সরল, অথচ অত্যন্ত মহান—',
    ],
    bullets: [
      'যে তাঁর সান্নিধ্যে আসবে,',
      'যে তাঁর সোহবতে আসবে,',
      'যে তাঁর বয়ান শুনবে,',
      'যে তাঁর সঙ্গে কিছু সময় কাটাবে,',
      'যে তাঁর সঙ্গে সম্পর্ক রাখবে—',
    ],
    bulletsAfter: 'তার অন্তরে যেন আল্লাহ পাক রব্বুল আলামীনের মহব্বত সৃষ্টি হয়।',
    bullets2: [
      'আল্লাহকে চিনতে শেখে,',
      'আল্লাহকে ভালোবাসতে শেখে,',
      'রাসূলুল্লাহ ﷺ-এর সুন্নতকে ভালোবাসতে শেখে,',
      'শরীয়তের ওপর আমল করতে শেখে,',
      'নিজের নফসের ইসলাহ করতে শেখে,',
      'এবং একজন সুন্দর মানুষ ও পরিপূর্ণ মুমিন হিসেবে নিজেকে গড়ে তুলতে শেখে।',
    ],
  },
  {
    id: 'path',
    icon: 'path',
    title: 'কোনো দল নয় — আল্লাহর পথই মূল লক্ষ্য',
    paragraphs: [
      'মুখ্য বিষয় হলো — কে আল্লাহর দিকে এগিয়ে যাচ্ছে?',
      'হযরত ওয়ালা দামাত বারাকাতুহুমের এই মিশনের মধ্যে কোনো গ্রুপিজম নেই, কোনো দলাদলি নেই, কোনো সার্টিফিকেট নেই, কোনো ফিকরাবাজি নেই। তাঁর লক্ষ্য মানুষকে কোনো বিশেষ গোষ্ঠীর মধ্যে আবদ্ধ করা নয়; বরং মানুষকে আল্লাহর সঙ্গে যুক্ত করা।',
      'আমরা স্পষ্টভাবে দেখেছি—কোনো ব্যক্তি যদি অন্য কারো সাথে সম্পর্ক রাখে, তবুও যদি আল্লাহওয়ালার সোহবতে এসে নিজের ইসলাহের চেষ্টা করে, তাকে দেখেও হযরত ওয়ালা দামাত বারাকাতুহুম বলেন—“সে তো আল্লাহর পথেই চলছে।”',
      'একজন মানুষের অন্তরে যদি আল্লাহর মহব্বত থাকে, শরীয়তের প্রতি অনুরাগ থাকে, সুন্নতের প্রতি ভালোবাসা থাকে এবং নিজের নফসের ইসলাহের চেষ্টা থাকে—তাহলে সে কোন পরিচয়ে চলবে, সেটি মুখ্য বিষয় নয়।',
    ],
  },
  {
    id: 'sohbat',
    icon: 'sohbat',
    title: 'সোহবতের উদ্দেশ্য — মানুষকে মানুষ করা',
    paragraphs: [
      'হযরত ওয়ালা দামাত বারাকাতুহুমের সোহবত, বয়ান ও ইসলাহি মজলিসের উদ্দেশ্য কোনো বিশেষ পরিচয় তৈরি করা নয়; বরং মানুষের অন্তর ও চরিত্র সংশোধন করা। তিনি চান—',
    ],
    bullets: [
      'মানুষ আল্লাহকে ভালোবাসুক',
      'মানুষ রাসূলুল্লাহ ﷺ-কে ভালোবাসুক',
      'মানুষ শরীয়তের ওপর অটল-অবিচল থাকুক',
      'মানুষ সুন্নতের অনুসরণ করুক',
      'মানুষ আখিরাতকে অগ্রাধিকার দিক',
      'নিজের বড়দের কাছ থেকে হক ও দ্বীনের মৌলিক শিক্ষা গ্রহণ করুক',
      'নিজের নফসকে সংশোধন করুক',
      'এবং মানুষের সঙ্গে এমন আচরণ করুক, যাতে তার দ্বারা কোনো বান্দা কষ্ট না পায়।',
    ],
  },
  {
    id: 'tasawwuf',
    icon: 'tasawwuf',
    title: 'তাসাউফের সারকথা — চারটি বাক্য',
    paragraphs: [
      'হযরত ওয়ালা দামাত বারাকাতুহুম তাসাউফের গভীর শিক্ষাকে অত্যন্ত সহজ ভাষায় এভাবে তুলে ধরেন—',
    ],
    quote: {
      color: 'pink',
      text: '“কোনো বান্দা যাতে কষ্ট না পায়। কোনো বান্দার হক যাতে নষ্ট না হয়। আল্লাহ যাতে কষ্ট না পান। আল্লাহর হক যাতে নষ্ট না হয়।”',
    },
    quoteAfter: [
      'তাসাউফের বিশাল শিক্ষা এই চারটি বাক্যের মধ্যে—একদিকে হক্কুল্লাহ (আল্লাহর হক), অন্যদিকে হক্কুল ইবাদ (বান্দার হক)। আল্লাহর হক নষ্ট না করা এবং বান্দার হক নষ্ট না করা—এই দুইয়ের সমন্বয়েই একজন মানুষের চরিত্র পূর্ণতা লাভ করে। তাই তাসাউফ কেবল কিছু আমল, কিছু ওযিফা কিংবা কোনো বাহ্যিক পরিচয়ের নাম নয়।',
    ],
    bullets: [
      'তাসাউফ হলো অন্তরের সংশোধন',
      'তাসাউফ হলো চরিত্রের সৌন্দর্য',
      'তাসাউফ হলো আল্লাহর মহব্বত',
      'তাসাউফ হলো বান্দার হক আদায়',
      'তাসাউফ হলো নফসের পরিশুদ্ধি',
      'তাসাউফ হলো আল্লাহর নৈকট্য লাভের পথে বেঁচে থাকা।',
    ],
  },
  {
    id: 'dream',
    icon: 'dream',
    title: 'আমাদের শায়খের স্বপ্ন',
    paragraphs: [],
    quote: {
      color: 'teal',
      text: '“আল্লাহর এমন একজন বান্দা হতে, যার দ্বারা আল্লাহ সন্তুষ্ট হন এবং যার দ্বারা আল্লাহর কোনো বান্দা কষ্ট না পায়।”',
    },
    quoteAfter: [
      'আমাদের শ্রদ্ধেয় শায়খের স্বপ্ন—তাঁর সোহবতে আসা প্রতিটি মানুষ যেন আল্লাহর মহব্বত লাভ করে।',
      'তাঁর বয়ান শোনা প্রতিটি মানুষ যেন নিজের জীবনের দিকে ফিরে তাকায়, নিজের ভুল সংশোধনের চেষ্টা করে, নামাজের প্রতি যত্নবান হয়, শরীয়তের বিধান মেনে চলে, সুন্নতের প্রতি ভালোবাসা বৃদ্ধি করে, আখিরাতকে সম্মানের সঙ্গে গ্রহণ করে এবং বড়দের কাছ থেকে দ্বীনের মৌলিক শিক্ষা গ্রহণ করে।',
      'এটাই তাঁর মিশন। এটাই তাঁর লক্ষ্য। এটাই তাঁর ইসলাহি খেদমতের প্রাণ।',
    ],
  },
  {
    id: 'end',
    icon: 'end',
    title: 'শেষকথা',
    paragraphs: [
      'আকাবিরে উলামা ও বুজুর্গানে দ্বীনের জীবন ও মিশনের দিকে তাকালে একটি বিষয় অত্যন্ত স্পষ্ট হয়ে ওঠে—',
    ],
    bullets: [
      'তাঁরা মানুষকে নিজের ভক্ত বানাতে আসেননি;',
      'তাঁরা মানুষকে আল্লাহর বান্দা বানাতে এসেছেন;',
      'তাঁরা চাননি মানুষ শুধু তাঁদের নামের সঙ্গে যুক্ত থাকুক; তাঁরা চেয়েছেন মানুষ আল্লাহর সঙ্গে যুক্ত হোক;',
      'তাঁরা চাননি মানুষ শুধু তাঁদের বয়ান শুনুক; তাঁরা চেয়েছেন সেই বয়ানের প্রভাবে মানুষের জীবন বদলে যাক;',
      'তাঁরা চাননি মানুষ শুধু তাঁদের সোহবতের পরিচয় বহন করুক; তাঁরা চেয়েছেন সেই সোহবতের গুণ মানুষের অন্তর, আমল, চরিত্র ও আল্লাহর সঙ্গে সম্পর্কের মধ্যে প্রকাশিত হোক।',
    ],
  },
];

export const MISSION_FINAL_STATEMENT =
  '“মানুষকে আল্লাহর মহব্বতের পথে নিয়ে যাওয়া, শরীয়ত ও সুন্নতের ওপর অটল করা এবং এমন মানুষ হিসেবে গড়ে তোলা—যার দ্বারা আল্লাহর কোনো হক নষ্ট হয় না এবং কোনো বান্দা কষ্ট পায় না।”';

export const MISSION_FINAL_STATEMENT_EN =
  '“To bring people onto the path of Allah\u2019s love, to keep them firm upon Shariah and Sunnah, and to build them into such people — by whom no right of Allah is violated and no servant of Allah is hurt.”';

export const MISSION_FINAL_ECHO = 'এটাই আমাদের শায়খের মিশন। এটাই তাঁর লক্ষ্য। এটাই তাঁর ইসলাহি খেদমতের মূল কথা।';

export const MISSION_FINAL_ECHO_EN =
  'This is our Shaykh\u2019s mission. This is his goal. This is the essence of his Islahi service.';

export const MISSION_DUA =
  'আল্লাহ তাআলা আমাদের শ্রদ্ধেয় শায়খ হযরত মাওলানা শাহ তৈয়্যেব আশরাফ সাহেব দামাত বারাকাতুহুমকে সুস্থতা, দীর্ঘ হায়াত ও অফুরন্ত বরকত দান করুন; তাঁর ইলম, আমল, ইসলাহ ও খেদমতকে কবুল করুন এবং তাঁর সোহবত ও তারবিয়াতের মাধ্যমে আমাদের সবাইকে নিজের মহব্বত, রাসূলুল্লাহ ﷺ-এর সুন্নত এবং শরীয়তের ওপর অটল-অবিচল থাকার তাওফিক দান করুন।';

export const MISSION_DUA_EN =
  'May Allah Ta\u2019ala grant our respected Shaykh, Hazrat Maulana Shah Tayyeb Ashraf Sahib (Damat Barakatuhum), health, long life and abundant blessings; accept his knowledge, deeds, Islah and service; and through his companionship and guidance grant all of us the ability to remain firm upon His love, the Sunnah of Rasulullah ﷺ, and the Shariah.';

/**
 * English translation of the mission page. Same structure and section ids
 * as MISSION_SECTIONS so the view renders identically in both languages.
 */
export const MISSION_SECTIONS_EN: MissionSection[] = [
  {
    id: 'intro',
    icon: 'intro',
    title: 'Introduction',
    paragraphs: [
      'Hakimul Ummat, Mujaddidul Millat, Arif Billah Hazrat Maulana Shah Ashraf Ali Thanvi (Rahmatullahi Alayhi) used to say —',
      'There are two types of Auliya in this world. One type are those who are themselves close to Allah (Allah-walas). The other type are those who, besides being Allah-walas themselves, are makers of Allah-walas.',
      'This second category of Auliya are those in whose company people\u2019s lives change, whose company awakens hearts, and under whose gaze people gradually move toward becoming beloved servants of Allah.',
      'Hazrat Thanvi (Rahmatullahi Alayhi) himself was such a great Murshid — whose life was a vast mission of building people.',
    ],
    quote: {
      color: 'gold',
      text: '\u201CIf you want to become a Pir, Buzurg, Sufi, saint or dervish, go elsewhere. But if you want to become a human being, come to a Wali of Allah.\u201D',
    },
    bullets: [
      'Not to become a Pir — but to become a human being.',
      'Not to become great — but to become a servant of Allah.',
      'Not to gain fame — but to rectify oneself.',
    ],
  },
  {
    id: 'lineage',
    icon: 'lineage',
    title: 'A Great Murshid of That Lineage of Making Allah-walas',
    paragraphs: [
      'A shining star of this great lineage was Arif Billah Hazrat Maulana Shah Hakim Muhammad Akhtar Sahib (Rahmatullahi Alayhi).',
      'He himself was immersed in Allah\u2019s love, and one of his heart\u2019s greatest wishes was — that those connected to him become Allah-walas in his own lifetime.',
    ],
    quote: {
      color: 'blue',
      text: '\u201CO Buzurg! Do not be such that you become Allah-walas after me; rather become Allah-walas in my lifetime, so that seeing you my eyes and heart find comfort.\u201D',
    },
    quoteAfter: [
      'Here lies the mark of a true Murshid. He does not want to keep people attracted to himself; rather he wants to deliver them to Allah.',
      'He does not want his company to be the final destination of people\u2019s lives; rather through that relationship people should build a deep connection with Allah.',
    ],
  },
  {
    id: 'goal',
    icon: 'goal',
    title: 'The Core Goal of Our Respected Shaykh',
    paragraphs: [
      'To bring people onto the path of Allah\u2019s love.',
      'Hazrat Wala (Damat Barakatuhum) has had the fortune of the discipleship, companionship and nurturing of Hakimul Ummat, Arif Billah Hazrat Maulana Shah Abdul Mateen Sahib (Damat Barakatuhum) since childhood.',
      'From long years in the company of an Allah-wala Murshid, he gained not only theoretical knowledge, but deep knowledge, real experience and purity through Islah, Tarbiyah, Suluk and Tasawwuf.',
      'The wish of his heart is extremely simple, yet extremely great —',
    ],
    bullets: [
      'Whoever comes into his presence,',
      'Whoever comes into his company,',
      'Whoever listens to his bayan,',
      'Whoever spends some time with him,',
      'Whoever keeps a connection with him —',
    ],
    bulletsAfter: 'May love for Allah, Lord of the worlds, be created in their heart.',
    bullets2: [
      'Learn to know Allah,',
      'Learn to love Allah,',
      'Learn to love the Sunnah of Rasulullah ﷺ,',
      'Learn to act upon the Shariah,',
      'Learn to rectify their own nafs,',
      'And learn to build themselves into beautiful human beings and complete believers.',
    ],
  },
  {
    id: 'path',
    icon: 'path',
    title: 'No Group — Only the Path of Allah Is the Goal',
    paragraphs: [
      'The key question is — who is moving toward Allah?',
      'In the mission of Hazrat Wala (Damat Barakatuhum) there is no groupism, no factionalism, no certificates, no sectarian politics. His goal is not to confine people within any particular group; rather to connect people with Allah.',
      'We have clearly seen — even if a person keeps ties elsewhere, yet comes into the company of an Allah-wala and strives for his own rectification, Hazrat Wala (Damat Barakatuhum) says of him — \u201CHe is walking on the path of Allah.\u201D',
      'If a person\u2019s heart holds love for Allah, devotion to the Shariah, love for the Sunnah, and striving to rectify their nafs — then under which identity they move is not the point.',
    ],
  },
  {
    id: 'sohbat',
    icon: 'sohbat',
    title: 'The Purpose of Suhbah — Making People Human',
    paragraphs: [
      'The purpose of the Suhbah, bayans and Islahi gatherings of Hazrat Wala (Damat Barakatuhum) is not to create any special identity; rather to rectify people\u2019s hearts and character. He wants that —',
    ],
    bullets: [
      'People love Allah',
      'People love Rasulullah ﷺ',
      'People stay firm and unwavering upon the Shariah',
      'People follow the Sunnah',
      'People give priority to the Hereafter',
      'Learn the foundational teachings of truth and Deen from their elders',
      'Rectify their own nafs',
      'And behave with people in such a way that no servant of Allah is hurt by them.',
    ],
  },
  {
    id: 'tasawwuf',
    icon: 'tasawwuf',
    title: 'The Essence of Tasawwuf — In Four Sentences',
    paragraphs: [
      'Hazrat Wala (Damat Barakatuhum) presents the deep teachings of Tasawwuf in very simple words like this —',
    ],
    quote: {
      color: 'pink',
      text: '\u201CLet no servant be hurt. Let no servant\u2019s right be violated. Let Allah not be displeased. Let no right of Allah be violated.\u201D',
    },
    quoteAfter: [
      'The vast teachings of Tasawwuf lie within these four sentences — on one side Haqqullah (the rights of Allah), on the other Huquq al-Ibad (the rights of servants). A person\u2019s character reaches perfection through the combination of both: not violating Allah\u2019s rights and not violating servants\u2019 rights. So Tasawwuf is not merely the name of some deeds, some wazifas, or some outward identity.',
    ],
    bullets: [
      'Tasawwuf is the rectification of the heart',
      'Tasawwuf is the beauty of character',
      'Tasawwuf is the love of Allah',
      'Tasawwuf is fulfilling the rights of servants',
      'Tasawwuf is the purification of the nafs',
      'Tasawwuf is living a life seeking Allah\u2019s nearness.',
    ],
  },
  {
    id: 'dream',
    icon: 'dream',
    title: 'Our Shaykh\u2019s Dream',
    paragraphs: [],
    quote: {
      color: 'teal',
      text: '\u201CTo become such a servant of Allah — with whom Allah is pleased, and by whom no servant of Allah is hurt.\u201D',
    },
    quoteAfter: [
      'The dream of our respected Shaykh — that every person who comes into his Suhbah attains the love of Allah.',
      'That every person who listens to his bayan looks back at their own life, tries to correct their mistakes, becomes careful about Salah, follows the rulings of Shariah, grows in love for the Sunnah, honors the path of the Hereafter, and learns the foundational teachings of Deen from their elders.',
      'This is his mission. This is his goal. This is the soul of his Islahi service.',
    ],
  },
  {
    id: 'end',
    icon: 'end',
    title: 'Final Words',
    paragraphs: [
      'Looking at the lives and missions of the great Ulama and elders of Deen, one matter becomes crystal clear —',
    ],
    bullets: [
      'They did not come to make people their own followers;',
      'They came to make people servants of Allah;',
      'They did not want people merely attached to their names; they wanted people attached to Allah;',
      'They did not want people merely to listen to their bayans; they wanted those bayans to transform people\u2019s lives;',
      'They did not want people merely to carry the identity of their Suhbah; they wanted the qualities of that Suhbah to show in people\u2019s hearts, deeds, character and their relationship with Allah.',
    ],
  },
];

export const MISSION_AMEEN = 'আমীন ইয়া রব্বাল আলামীন';

export const MISSION_AMEEN_EN = 'Ameen Ya Rabbal Alameen';

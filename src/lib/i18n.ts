import type { AppLang } from '@/store/language-store';

/**
 * Whole-site i18n: every UI chrome string in English + Bangla.
 * Content titles/descriptions from YouTube / IslahBD APIs stay as-is
 * (they are data, not chrome) — everything AROUND them translates.
 * Views/islands read via `t(lang)` + the helpers below.
 */

const dict = {
  en: {
    navHome: 'Home',
    navSearch: 'Search',
    navLibrary: 'Library',
    navBoyan: 'Boyan',
    navHamdNaat: 'Hamd-Naat',
    navShorts: 'Shorts',
    navMore: 'More',
    moreTitle: 'More',
    channels: 'Channels',
    featuresTitle: 'Explore',
    featLiveSub: 'Live broadcast',
    featSearchSub: 'Find in channels',
    featLibrarySub: 'Your playlists',
    featBoyanSub: 'Recorded lectures',
    featHamdSub: 'Hamd & naat',
    featShortsSub: 'Short clips',
    navAmal: 'Amal',
    navDua: 'Dua',
    navCalendar: 'Calendar',
    navWazifa: 'Wazifa',
    navDurood: 'Durood',
    navFamily: 'Family',
    featFamilySub: 'Islah family',
    featAmalSub: 'Daily amal',
    featDuaSub: 'Masnoon duas',
    featCalendarSub: 'Islamic calendar',
    featWazifaSub: 'Wazifa collection',
    featDuroodSub: 'Durood shareef',
    moreSub: 'All sections & Islamic tools',
    comingSoon: 'Coming soon',
    comingSoonSub: 'This section is being prepared and will open here soon.',
    familyWelcomeTop: 'ইসলাহ পরিবারে আপনাকে',
    familyWelcomeHead: 'স্বাগতম',
    familyIntro1: "Tarjuman-e-Akabir Arif'billah Hazrat",
    familyIntro2: 'Maulana Shah Abdul Mateen Bin Hussain',
    familyIntro3: "Sahib's Khalifa",
    familyName: 'MAWLANA TAYEB ASHRAF SAHEB',
    familyDamat: 'Damat Barakatuhum',
    familyLearnMore: 'Learn More',
    familyShowLess: 'Show less',
    familyProfile: "Hazrat's Profile",
    familyIntro: 'Introduction',
    familyLineage: 'Family Background',
    familyEducation: 'Education',
    familyCareer: 'Career',
    familyPresent: 'Current Position & Services',
    familyMissionTitle: "Our Respected Shaykh's Mission",
    familyMissionSub: 'A noble mission of divine love & self-rectification',
    familyApplications: 'Applications',
    familyBayahTitle: "Application for Bay'ah",
    familyBayahSub: 'Apply for spiritual pledge & guidance',
    familyKhanqahTitle: 'Application for Khanqah Stay',
    familyKhanqahSub: 'Apply for spiritual stay & itikaf',
    familyConnect: 'Connect With Us',
    familyIslahBd: 'Islah BD',
    familyMarkaz: 'Markazul Ihsan',
    scholarLine1: "Tarjuman-e-Akabir Arif'billah Hazrat Maulana Shah Abdul Mateen",
    scholarLine2: "Bin Hussain Sahib's Khalifa Hazrat Mawlana",
    scholarTitle: 'TAYEB ASHRAF SAHEB',
    prayerTitle: 'Prayer Times',
    nextPrayerLabel: 'Next Prayer',
    prayerFajr: 'Fajr',
    prayerSunrise: 'Sunrise',
    prayerDhuhr: 'Dhuhr',
    prayerAsr: 'Asr',
    prayerMaghrib: 'Maghrib',
    prayerIsha: 'Isha',
    prayerCurrent: 'Current',
    prayerProhibited: 'Sunrise (prohibited)',
    prayerIshraq: 'Ishraq',
    prayerChasht: 'Chasht',
    tomorrow: 'Tomorrow',
    prayerOffline: 'offline times',
    siteSettings: 'Site Settings',
    siteSettingsSub: 'Glass • Theme • Language',
    liquidGlass: 'Liquid Glass',
    liquidGlassOn: 'iPhone-style frosted look',
    liquidGlassOff: 'Off — Material 3 solid look',
    language: 'Language',
    languageSub: 'Choose app language',
    footer: 'Audio streaming from public YouTube lectures. For listening & learning.',
    searchPlaceholder: 'Search lectures…',
    searchAria: 'Search',
    menuToggleAria: 'Toggle sidebar',
    menuOpenAria: 'Open menu',
    openAppAria: 'Open IslahBD app',
    openAppLabel: 'Open IslahBD',
    filterAll: 'All',
    filterBayans: 'Bayans',
    filterShorts: 'Shorts',
    sortNewest: 'Newest',
    sortPopular: 'Most viewed',
    sortOldest: 'Oldest',
    heroTagline: 'Bayans • Waz • Nasheeds — listen to every lecture as audio',
    liveNow: 'Live now',
    listening: 'Listening',
    live: 'Live',
    lastLive: 'Last live',
    playAll: 'Play all',
    pause: 'Pause',
    play: 'Play',
    shufflePlay: 'Shuffle play',
    showMore: 'Show more',
    loading: 'Loading…',
    endReached: 'You’ve reached the end ✓',
    noLectures: 'No lectures found',
    tryDifferentFilter: 'Try a different filter',
    playing: 'Playing',
    saveToPlaylist: 'Save to playlist',
    serverBusy: 'Server Busy',
    serverBusySub: 'All streaming services are currently unavailable. Please try again in a moment.',
    tryAgain: 'Try Again',
    searchTitle: 'Search',
    searchSub: 'Find bayans, waz and nasheeds from the channel',
    tryDifferentKeywords: 'Try different keywords',
    searchCollection: 'Search the collection',
    typeAbove: 'Type above to begin',
    boyanEyebrow: 'IslahBD',
    boyanTitle: 'Boyan',
    searchBoyanPh: 'Search boyan…',
    boyanLoadFail: 'Couldn’t load Boyan',
    retry: 'Retry',
    noBoyan: 'No boyan found',
    tryKeywordsCategory: 'Try different keywords or category',
    hamdTitle: 'Hamd-Naat',
    searchHamdPh: 'Search hamd-naat…',
    chipAudio: 'Audio',
    chipVideo: 'Video',
    hamdLoadFail: 'Couldn’t load Hamd-Naat',
    noHamd: 'No hamd-naat found',
    tryKeywordsType: 'Try different keywords or type',
    shortsTitle: 'Shorts',
    searchShortsPh: 'Search shorts…',
    shortsLoadFail: 'Couldn’t load Shorts',
    noShorts: 'No shorts found',
    libEyebrow: 'Collection',
    libTitle: 'Your Library',
    fromYoutube: 'From YouTube',
    yourPlaylists: 'Your Playlists',
    newPlaylistPh: 'New playlist name…',
    create: 'Create',
    noPlaylistsTitle: 'No playlists yet',
    recentTitle: 'Recently Played',
    recentSub: 'Your listening history will appear here as you play more lectures.',
    savedTitle: 'Saved Offline',
    savedSub: 'Your playlists are stored on this device and survive reloads.',
    deleteAsk: 'Delete?',
    cancel: 'Cancel',
    deletePlaylist: 'Delete playlist',
    removeFromPlaylist: 'Remove from playlist',
    remove: 'Remove',
    expand: 'Expand',
    collapse: 'Collapse',
    allLectures: 'All lectures',
    untitled: 'Untitled lecture',
    shareViaApps: 'Share via apps',
    shareBtn: 'Share',
    shareAria: 'Share',
    closeShareMenu: 'Close share menu',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    copyFailedMenu: 'Copy failed',
    copyFailed: 'Failed',
    linkCopied: 'Link copied',
    linkCopiedTitle: 'Link copied!',
    copyLinkTitle: 'Copy link',
    openApp: 'Open App',
    npNowPlaying: 'Now playing',
    collapsePlayer: 'Collapse player',
    downloadAudio: 'Download audio',
    stopClose: 'Stop and close player',
    stop: 'Stop',
    liveNoDownload: 'Live streams can’t be downloaded',
    onlyRecordingsDownload: 'Only recordings can be downloaded',
    toAudioOnly: 'Audio only',
    switchToAudio: 'Switch to audio only',
    watchVideo: 'Watch video',
    seek: 'Seek',
    liveBadge: 'LIVE',
    previous: 'Previous',
    next: 'Next',
    unmute: 'Unmute',
    mute: 'Mute',
    volume: 'Volume',
    upNext: 'Up next',
    showQueue: 'Show playback queue',
    closeQueue: 'Close queue',
    plmClose: 'Close',
    plmTitle: 'Save to playlist',
    plmEmpty: 'No playlists yet — create one below.',
    plmNewPh: 'New playlist…',
    plmCreate: 'Create playlist',
    plmDuplicate: 'Already in that playlist',
    plmNotFound: 'Playlist not found',
    moreApps: 'More apps…',
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    themeLabel: 'Theme',
    themeDarkSub: 'Dark luxurious look',
    themeLightSub: 'Light clean look',
    pillDark: 'Dark',
    pillLight: 'Light',
    clearSearch: 'Clear search',
    brandEyebrow: 'IslahBD',
    queueEmpty: 'Queue is empty — play some lectures and they’ll show up here.',
    emptyPlPre: 'Empty playlist — tap ',
    emptyPlPost: ' on any lecture to add tracks.',
    noPlPre: 'Create one above, or tap ',
    noPlPost: ' on any lecture to save it to a playlist',
    loadFailPl: 'Couldn’t load this playlist.',
    emptyPlUnavailable: 'This playlist is empty or unavailable.',
    channelPlFail: 'Couldn’t load channel playlists.',
    noPublicPl: 'No public playlists on this channel yet.',
  },
  bn: {
    navHome: 'হোম',
    navSearch: 'সার্চ',
    navLibrary: 'লাইব্রেরি',
    navBoyan: 'বয়ান',
    navHamdNaat: 'হামদ-নাত',
    navShorts: 'শর্টস',
    navMore: 'আরও',
    moreTitle: 'আরও',
    channels: 'চ্যানেলসমূহ',
    featuresTitle: 'ঘুরে দেখুন',
    featLiveSub: 'লাইভ সম্প্রচার',
    featSearchSub: 'চ্যানেলে খুঁজুন',
    featLibrarySub: 'আপনার প্লেলিস্ট',
    featBoyanSub: 'রেকর্ডেড লেকচার',
    featHamdSub: 'হামদ ও নাত',
    featShortsSub: 'শর্ট ক্লিপ',
    navAmal: 'আমল',
    navDua: 'দোয়া',
    navCalendar: 'ক্যালেন্ডার',
    navWazifa: 'ওজিফা',
    navDurood: 'দরুদ',
    navFamily: 'পরিবার',
    featFamilySub: 'ইসলাহ পরিবার',
    featAmalSub: 'দৈনন্দিন আমল',
    featDuaSub: 'মাসনূন দোয়া',
    featCalendarSub: 'ইসলামিক ক্যালেন্ডার',
    featWazifaSub: 'ওজিফা সংগ্রহ',
    featDuroodSub: 'দরুদ শরীফ',
    moreSub: 'সব বিভাগ ও ইসলামিক টুলস',
    comingSoon: 'শীঘ্রই আসছে',
    comingSoonSub: 'এই বিভাগটি তৈরি হচ্ছে, শীঘ্রই এখানে চালু হবে।',
    familyWelcomeTop: 'ইসলাহ পরিবারে আপনাকে',
    familyWelcomeHead: 'স্বাগতম',
    familyIntro1: 'তারজুমান-এ-আকাবির আরিফবিল্লাহ হযরত',
    familyIntro2: 'মাওলানা শাহ আব্দুল মতিন বিন হুসাইন',
    familyIntro3: 'সাহেবের খলিফা',
    familyName: 'মাওলানা তৈয়্যেব আশরাফ সাহেব',
    familyDamat: 'দামাত বারাকাতুহুম',
    familyLearnMore: 'আরও জানুন',
    familyShowLess: 'কম দেখুন',
    familyProfile: 'হযরতের পরিচিতি',
    familyIntro: 'পরিচিতি',
    familyLineage: 'বংশ পরিচয়',
    familyEducation: 'শিক্ষা জীবন',
    familyCareer: 'কর্ম জীবন',
    familyPresent: 'বর্তমান অবস্থান ও খেদমত',
    familyMissionTitle: 'আমাদের সম্মানিত শায়খের মিশন',
    familyMissionSub: 'আল্লাহর মহব্বত, আত্মশুদ্ধি ও মানুষ গড়ার এক মহান। মিশন।',
    familyApplications: 'আবেদনসমূহ',
    familyBayahTitle: 'বাইআতের আবেদন',
    familyBayahSub: 'আধ্যাত্মিক বাইআত ও দিকনির্দেশনার জন্য আবেদন করুন',
    familyKhanqahTitle: 'খানকায় থাকার আবেদন',
    familyKhanqahSub: 'আধ্যাত্মিক অবস্থান ও ইতিকাফের জন্য আবেদন করুন',
    familyConnect: 'যোগাযোগ করুন',
    familyIslahBd: 'ইসলাহ বিডি',
    familyMarkaz: 'মারকাজুল ইহসান',
    scholarLine1: 'তারজুমান-এ-আকাবির আরিফবিল্লাহ হযরত মাওলানা শাহ আব্দুল মতিন',
    scholarLine2: 'বিন হুসাইন সাহেবের খলিফা হযরত মাওলানা',
    scholarTitle: 'তৈয়্যেব আশরাফ সাহেব',
    prayerTitle: 'নামাজের সময়',
    nextPrayerLabel: 'পরবর্তী নামাজ',
    prayerFajr: 'ফজর',
    prayerSunrise: 'সূর্যোদয়',
    prayerDhuhr: 'যোহর',
    prayerAsr: 'আসর',
    prayerMaghrib: 'মাগরিব',
    prayerIsha: 'এশা',
    prayerCurrent: 'বর্তমান',
    prayerProhibited: 'সূর্যোদয় (নিষিদ্ধ)',
    prayerIshraq: 'ইশরাক',
    prayerChasht: 'চাশত',
    tomorrow: 'আগামীকাল',
    prayerOffline: 'অফলাইন সময়',
    siteSettings: 'সাইট সেটিংস',
    siteSettingsSub: 'গ্লাস • থিম • ভাষা',
    liquidGlass: 'লিকুইড গ্লাস',
    liquidGlassOn: 'আইফোন-স্টাইল ফ্রস্টেড লুক',
    liquidGlassOff: 'বন্ধ — ম্যাটেরিয়াল ৩ সলিড লুক',
    language: 'ভাষা',
    languageSub: 'অ্যাপের ভাষা বেছে নিন',
    footer: 'পাবলিক ইউটিউব লেকচার থেকে অডিও স্ট্রিমিং। শোনা ও শেখার জন্য।',
    searchPlaceholder: 'লেকচার খুঁজুন…',
    searchAria: 'খুঁজুন',
    menuToggleAria: 'সাইডবার দেখান/লুকান',
    menuOpenAria: 'মেনু খুলুন',
    openAppAria: 'IslahBD অ্যাপ খুলুন',
    openAppLabel: 'IslahBD খুলুন',
    filterAll: 'সব',
    filterBayans: 'বয়ান',
    filterShorts: 'শর্টস',
    sortNewest: 'নতুনতম',
    sortPopular: 'সর্বাধিক দেখা',
    sortOldest: 'পুরাতনতম',
    heroTagline: 'বয়ান • ওয়াজ • নাশিদ — প্রতিটি লেকচার অডিও হিসেবে শুনুন',
    liveNow: 'এখন লাইভ',
    listening: 'শুনছেন',
    live: 'লাইভ',
    lastLive: 'শেষ লাইভ',
    playAll: 'সব চালান',
    pause: 'বিরতি',
    play: 'চালান',
    shufflePlay: 'এলোমেলো চালান',
    showMore: 'আরও দেখুন',
    loading: 'লোড হচ্ছে…',
    endReached: 'শেষে পৌঁছে গেছেন ✓',
    noLectures: 'কোনো লেকচার পাওয়া যায়নি',
    tryDifferentFilter: 'অন্য ফিল্টার চেষ্টা করুন',
    playing: 'চলছে',
    saveToPlaylist: 'প্লেলিস্টে সংরক্ষণ',
    serverBusy: 'সার্ভার ব্যস্ত',
    serverBusySub: 'সব স্ট্রিমিং সেবা এখন অনুপলব্ধ। একটু পরে আবার চেষ্টা করুন।',
    tryAgain: 'আবার চেষ্টা করুন',
    searchTitle: 'সার্চ',
    searchSub: 'চ্যানেল থেকে বয়ান, ওয়াজ ও নাশিদ খুঁজুন',
    tryDifferentKeywords: 'অন্য শব্দ দিয়ে চেষ্টা করুন',
    searchCollection: 'সংগ্রহে খুঁজুন',
    typeAbove: 'শুরু করতে উপরে লিখুন',
    boyanEyebrow: 'ইসলাহবিডি',
    boyanTitle: 'বয়ান',
    searchBoyanPh: 'বয়ান খুঁজুন…',
    boyanLoadFail: 'বয়ান লোড করা যায়নি',
    retry: 'পুনরায় চেষ্টা',
    noBoyan: 'কোনো বয়ান পাওয়া যায়নি',
    tryKeywordsCategory: 'অন্য শব্দ বা ক্যাটাগরি চেষ্টা করুন',
    hamdTitle: 'হামদ-নাত',
    searchHamdPh: 'হামদ-নাত খুঁজুন…',
    chipAudio: 'অডিও',
    chipVideo: 'ভিডিও',
    hamdLoadFail: 'হামদ-নাত লোড করা যায়নি',
    noHamd: 'কোনো হামদ-নাত পাওয়া যায়নি',
    tryKeywordsType: 'অন্য শব্দ বা ধরন চেষ্টা করুন',
    shortsTitle: 'শর্টস',
    searchShortsPh: 'শর্টস খুঁজুন…',
    shortsLoadFail: 'শর্টস লোড করা যায়নি',
    noShorts: 'কোনো শর্টস পাওয়া যায়নি',
    libEyebrow: 'সংগ্রহ',
    libTitle: 'আপনার লাইব্রেরি',
    fromYoutube: 'ইউটিউব থেকে',
    yourPlaylists: 'আপনার প্লেলিস্ট',
    newPlaylistPh: 'নতুন প্লেলিস্টের নাম…',
    create: 'তৈরি করুন',
    noPlaylistsTitle: 'এখনো কোনো প্লেলিস্ট নেই',
    recentTitle: 'সম্প্রতি শোনা',
    recentSub: 'আরও লেকচার শুনলে আপনার শোনার ইতিহাস এখানে দেখা যাবে।',
    savedTitle: 'অফলাইনে সংরক্ষিত',
    savedSub: 'আপনার প্লেলিস্ট এই ডিভাইসে সংরক্ষিত থাকে।',
    deleteAsk: 'মুছবেন?',
    cancel: 'বাদ দিন',
    deletePlaylist: 'প্লেলিস্ট মুছুন',
    removeFromPlaylist: 'প্লেলিস্ট থেকে সরান',
    remove: 'সরান',
    expand: 'বড় করুন',
    collapse: 'ছোট করুন',
    allLectures: 'সব লেকচার',
    untitled: 'নামহীন লেকচার',
    shareViaApps: 'অ্যাপ দিয়ে শেয়ার',
    shareBtn: 'শেয়ার',
    shareAria: 'শেয়ার',
    closeShareMenu: 'শেয়ার মেনু বন্ধ করুন',
    copyLink: 'লিংক কপি',
    copied: 'কপি হয়েছে!',
    copyFailedMenu: 'কপি ব্যর্থ',
    copyFailed: 'ব্যর্থ',
    linkCopied: 'লিংক কপি হয়েছে',
    linkCopiedTitle: 'লিংক কপি হয়েছে!',
    copyLinkTitle: 'লিংক কপি করুন',
    openApp: 'অ্যাপ খুলুন',
    npNowPlaying: 'এখন চলছে',
    collapsePlayer: 'প্লেয়ার ছোট করুন',
    downloadAudio: 'অডিও ডাউনলোড',
    stopClose: 'বন্ধ করে প্লেয়ার সরান',
    stop: 'বন্ধ করুন',
    liveNoDownload: 'লাইভ স্ট্রিম ডাউনলোড করা যায় না',
    onlyRecordingsDownload: 'শুধু রেকর্ডিং ডাউনলোড করা যায়',
    toAudioOnly: 'শুধু অডিও',
    switchToAudio: 'শুধু অডিওতে যান',
    watchVideo: 'ভিডিও দেখুন',
    seek: 'সিক',
    liveBadge: 'লাইভ',
    previous: 'আগেরটি',
    next: 'পরেরটি',
    unmute: 'আনমিউট',
    mute: 'মিউট',
    volume: 'ভলিউম',
    upNext: 'এরপর',
    showQueue: 'প্লেয়িং কিউ দেখুন',
    closeQueue: 'কিউ বন্ধ করুন',
    plmClose: 'বন্ধ করুন',
    plmTitle: 'প্লেলিস্টে সংরক্ষণ',
    plmEmpty: 'এখনো কোনো প্লেলিস্ট নেই — নিচে তৈরি করুন।',
    plmNewPh: 'নতুন প্লেলিস্ট…',
    plmCreate: 'প্লেলিস্ট তৈরি করুন',
    plmDuplicate: 'এই প্লেলিস্টে আগেই আছে',
    plmNotFound: 'প্লেলিস্ট পাওয়া যায়নি',
    moreApps: 'আরও অ্যাপ…',
    toDark: 'ডার্ক মোডে যান',
    toLight: 'লাইট মোডে যান',
    darkMode: 'ডার্ক মোড',
    lightMode: 'লাইট মোড',
    themeLabel: 'থিম',
    themeDarkSub: 'ডার্ক প্রিমিয়াম লুক',
    themeLightSub: 'লাইট পরিষ্কার লুক',
    pillDark: 'ডার্ক',
    pillLight: 'লাইট',
    clearSearch: 'মুছুন',
    brandEyebrow: 'ইসলাহবিডি',
    queueEmpty: 'কিউ খালি — কিছু লেকচার চালান, এখানে দেখা যাবে।',
    emptyPlPre: 'খালি প্লেলিস্ট — যেকোনো লেকচারের ',
    emptyPlPost: ' চাপ দিয়ে ট্র্যাক যোগ করুন।',
    noPlPre: 'উপরে একটি তৈরি করুন, অথবা যেকোনো লেকচারের ',
    noPlPost: ' চাপ দিয়ে প্লেলিস্টে সংরক্ষণ করুন',
    loadFailPl: 'এই প্লেলিস্ট লোড করা যায়নি।',
    emptyPlUnavailable: 'এই প্লেলিস্ট খালি বা অনুপলব্ধ।',
    channelPlFail: 'চ্যানেলের প্লেলিস্ট লোড করা যায়নি।',
    noPublicPl: 'এই চ্যানেলে এখনো কোনো পাবলিক প্লেলিস্ট নেই।',
  },
} as const;

export type I18nKey = keyof (typeof dict)['en'];

export function t(lang: AppLang): Record<I18nKey, string> {
  return dict[lang] ?? dict.en;
}

/* ---------- Count / sentence helpers (plural-safe per language) ---------- */

export function videosCount(lang: AppLang, n: number): string {
  return lang === 'bn' ? `${n} ভিডিও` : `${n} videos`;
}

export function resultsCount(lang: AppLang, n: number): string {
  if (lang === 'bn') return `${n}টি ফলাফল`;
  return `${n} result${n === 1 ? '' : 's'}`;
}

export function tracksCount(lang: AppLang, n: number): string {
  if (lang === 'bn') return `${n}টি ট্র্যাক`;
  return `${n} track${n === 1 ? '' : 's'}`;
}

export function playlistsCount(lang: AppLang, n: number): string {
  if (lang === 'bn') return `${n}টি প্লেলিস্ট`;
  return `${n} playlist${n === 1 ? '' : 's'}`;
}

export function ytPlaylistSub(lang: AppLang, n: number): string {
  if (lang === 'bn') return `ইউটিউব প্লেলিস্ট • ${n} ভিডিও`;
  return `YouTube playlist • ${n} video${n === 1 ? '' : 's'}`;
}

export function showingOf(lang: AppLang, shown: number, total: number): string {
  if (lang === 'bn') return `${total}টির মধ্যে ${shown}টি লেকচার দেখানো হচ্ছে`;
  return `Showing ${shown} of ${total} lectures`;
}

export function sortedAcross(lang: AppLang, n: number): string {
  if (lang === 'bn') return `সব ${n}টি ভিডিও জুড়ে সাজানো ✓`;
  return `Sorted across all ${n} videos ✓`;
}

export function loadingSorting(lang: AppLang, n: number): string {
  if (lang === 'bn') return `সঠিক সাজানোর জন্য সব ভিডিও লোড হচ্ছে… ${n}টি এখন পর্যন্ত`;
  return `Loading all videos for accurate sorting… ${n} so far`;
}

export function indexingLabel(lang: AppLang, n: number): string {
  if (lang === 'bn') return `ইনডেক্স হচ্ছে ${n}…`;
  return `indexing ${n}…`;
}

export function lecturesIndexed(lang: AppLang, n: number): string {
  if (lang === 'bn') return `${n}টি লেকচার ইনডেক্সড`;
  return `${n} lectures indexed`;
}

export function noResultsFor(lang: AppLang, q: string): string {
  if (lang === 'bn') return `“${q}”-এর কোনো ফলাফল নেই`;
  return `No results for “${q}”`;
}

export function boyanSub(lang: AppLang, n: number): string {
  if (lang === 'bn') return `${n}টি লেকচার • সরাসরি MP3, ডাউনলোডযোগ্য`;
  return `${n} lecture${n === 1 ? '' : 's'} • direct MP3, downloadable`;
}

export function hamdSub(lang: AppLang, n: number, audio: number, video: number): string {
  if (lang === 'bn') return `${n}টি ট্র্যাক • ${audio} অডিও • ${video} ভিডিও`;
  return `${n} track${n === 1 ? '' : 's'} • ${audio} audio • ${video} video`;
}

export function shortsSub(lang: AppLang, n: number, audio: number, video: number): string {
  if (lang === 'bn') return `${n}টি ক্লিপ • ${audio} অডিও • ${video} ভিডিও`;
  return `${n} clip${n === 1 ? '' : 's'} • ${audio} audio • ${video} video`;
}

export function listenersWatching(lang: AppLang, n: number): string {
  if (lang === 'bn') return `${n} জন দেখছে`;
  return `${n} watching`;
}

export function lastLiveLoc(lang: AppLang, loc: string): string {
  if (lang === 'bn') return `শেষ লাইভ • ${loc}`;
  return `Last live • ${loc}`;
}

export function savedTo(lang: AppLang, name: string): string {
  if (lang === 'bn') return `“${name}”-এ সংরক্ষিত`;
  return `Saved to “${name}”`;
}

export function createdPl(lang: AppLang, name: string): string {
  if (lang === 'bn') return `“${name}” তৈরি হয়েছে`;
  return `Created “${name}”`;
}

export function playName(lang: AppLang, name: string): string {
  if (lang === 'bn') return `${name} চালান`;
  return `Play ${name}`;
}

/* ---------- Number / date formatting ---------- */

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/** "1.2M views" → "1.2M ভিউ" in Bangla. */
export function fmtViews(lang: AppLang, views: number): string {
  if (!views || views <= 0) return '';
  return lang === 'bn' ? `${compact(views)} ভিউ` : `${compact(views)} views`;
}

const BN_UNITS: [RegExp, string][] = [
  [/^(\d+)\s*seconds?\s*ago$/i, '$1 সেকেন্ড আগে'],
  [/^(\d+)\s*minutes?\s*ago$/i, '$1 মিনিট আগে'],
  [/^(\d+)\s*hours?\s*ago$/i, '$1 ঘণ্টা আগে'],
  [/^(\d+)\s*days?\s*ago$/i, '$1 দিন আগে'],
  [/^(\d+)\s*weeks?\s*ago$/i, '$1 সপ্তাহ আগে'],
  [/^(\d+)\s*months?\s*ago$/i, '$1 মাস আগে'],
  [/^(\d+)\s*years?\s*ago$/i, '$1 বছর আগে'],
  [/^streamed\s*(\d+)\s*(\w+)\s*ago$/i, '$1 $2 আগে স্ট্রিমড'],
  [/^premiered\s*(\d+)\s*(\w+)\s*ago$/i, '$1 $2 আগে প্রিমিয়ার'],
];

/**
 * Relative publish label in the active language. InnerTube only gives
 * English labels ("6 days ago") — when Bangla is active they are mapped
 * unit-by-unit; unknown shapes pass through untouched.
 */
export function fmtPublished(lang: AppLang, publishedAt?: string): string {
  if (!publishedAt) return '';
  if (lang !== 'bn') return publishedAt;
  const label = publishedAt.trim();
  for (const [re, out] of BN_UNITS) {
    if (re.test(label)) return label.replace(re, out);
  }
  if (/just now/i.test(label)) return 'এইমাত্র';
  return label;
}

/** Absolute date (watch page) in the active locale. */
export function fmtDate(lang: AppLang, iso: string): string {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (isNaN(time)) return iso;
  try {
    return new Date(time).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

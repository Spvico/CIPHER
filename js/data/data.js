/* CIPHER — static game data (factions, nodes, hardware, software, skills, story, flavour text) */
(function () {
  'use strict';
  const C = window.CIPHER;
  const D = (C.data = {});

  // ---------------------------------------------------------------- economy helpers
  D.MAX_LEVEL = 60;
  D.xpToNext = (lvl) => Math.round(120 + 60 * lvl + 6 * lvl * lvl);
  D.payBase = (tier) => Math.round(220 * Math.pow(1.55, tier - 1));
  D.TIER_LEVEL = [0, 1, 3, 5, 8, 11, 15, 19, 24, 30, 36, 42]; // level required for tier index
  D.MAX_TIER = 11;

  // ---------------------------------------------------------------- factions
  D.FACTIONS = {
    syndicate: { id: 'syndicate', name: 'The Syndicate', short: 'SYN', color: 'var(--m)', hex: '#d96bb0', pay: 1.25, heat: 1.45, desc: 'Organized crime. Pays well, leaves you hot.' },
    meridian: { id: 'meridian', name: 'Meridian Group', short: 'MER', color: 'var(--c)', hex: '#4d9cff', pay: 1.0, heat: 0.75, desc: 'Corporate espionage. Clean money, clean hands.' },
    lumen: { id: 'lumen', name: 'Lumen Collective', short: 'LUM', color: 'var(--g)', hex: '#3fb96b', pay: 0.8, heat: 1.0, repBonus: 1.5, desc: 'Hacktivists. Lower pay, faster rep, they share toys.' },
  };
  D.REP_RANKS = [
    { at: 0, name: 'Stranger' }, { at: 40, name: 'Contact' }, { at: 140, name: 'Trusted' },
    { at: 340, name: 'Partner' }, { at: 700, name: 'Insider' }, { at: 1300, name: 'Legend' },
  ];
  D.repRank = (rep) => { let r = 0; D.REP_RANKS.forEach((x, i) => { if (rep >= x.at) r = i; }); return r; };

  D.FIXERS = {
    syndicate: ['Vex', 'Madame Tse', 'Big O', 'Salvage'],
    meridian: ['A. Holloway', 'Director K', 'Ms. Arden'],
    lumen: ['Pixel', 'Oracle-9', 'Tollbooth'],
  };

  // ---------------------------------------------------------------- minigames metadata
  D.GAMES = {
    bruteforce: { name: 'Bruteforce', icon: '▣', desc: 'Crack the passcode (logic)' },
    logiclock: { name: 'Logic Lock', icon: '◆', desc: 'Satisfy the gate circuit (puzzle)' },
    firewall: { name: 'Firewall Run', icon: '▲', desc: 'Sneak past ICE sentries (stealth)' },
    circuit: { name: 'Power Route', icon: '✚', desc: 'Re-route current (spatial)' },
    handshake: { name: 'Handshake', icon: '♪', desc: 'Sync to the server beat (rhythm)' },
    inject: { name: 'Inject', icon: '▶', desc: 'Type commands under fire (typing)' },
    decrypt: { name: 'Decrypt', icon: '✱', desc: 'Break the cipher (cryptanalysis)' },
    sweep: { name: 'Honeypot Sweep', icon: '●', desc: 'Find the traps (deduction)' },
  };

  // ---------------------------------------------------------------- node types
  D.NODE_TYPES = {
    gateway: { label: 'Firewall Gateway', color: '#4d9cff', games: ['firewall', 'handshake'], shape: 'hex' },
    relay: { label: 'Relay Node', color: '#b8bec6', games: ['circuit', 'sweep', 'firewall'], shape: 'circle' },
    auth: { label: 'Auth Server', color: '#e0a63a', games: ['bruteforce', 'inject'], shape: 'key' },
    database: { label: 'Database', color: '#3fb96b', games: ['sweep', 'decrypt'], shape: 'db' },
    vault: { label: 'Encrypted Vault', color: '#a997f6', games: ['decrypt', 'logiclock'], shape: 'lock' },
    grid: { label: 'Control System', color: '#d96bb0', games: ['circuit', 'logiclock'], shape: 'bolt' },
    comms: { label: 'COMMS / LOGS', color: '#ef5b5b', games: ['inject', 'handshake', 'bruteforce'], shape: 'diamond' },
    core: { label: 'CORE · BLACK ICE', color: '#ef5b5b', games: [], shape: 'star' },
  };

  // ---------------------------------------------------------------- hardware (rig)
  D.HARDWARE = {
    cpu: { name: 'Quantum CPU', max: 6, base: 700, desc: 'Faster cracking: +5% time in every timed minigame per level.', fx: (l) => `+${(l - 1) * 5}% time` },
    ram: { name: 'Buffer RAM', max: 6, base: 600, desc: 'Run loadout capacity: bring more consumables into a breach.', fx: (l) => `${l + 1} loadout slots` },
    net: { name: 'Fiber Uplink', max: 6, base: 800, desc: 'Cuts the ambient trace creeping up while you work (-7% per level).', fx: (l) => `-${(l - 1) * 7}% ambient trace` },
    proxy: { name: 'Proxy Chain', max: 6, base: 900, desc: 'Mistakes add less trace (-6%/lvl) and contracts leave less heat (-7%/lvl).', fx: (l) => `-${(l - 1) * 6}% mistake trace` },
  };
  D.HW_REQ_LEVEL = [0, 0, 2, 4, 7, 12, 20]; // level required to reach hw level index
  D.hwCost = (id, lvl) => Math.round(D.HARDWARE[id].base * Math.pow(2.3, lvl - 1)); // cost to go lvl -> lvl+1

  // ---------------------------------------------------------------- software (minigame tools)
  D.SOFTWARE = {
    hint: { name: 'Oracle.sys', base: 600, desc: 'Reveals useful info or solves a piece of the puzzle.' },
    freeze: { name: 'Chronos.exe', base: 900, desc: 'Freezes time / the threat for several seconds.' },
    shield: { name: 'Aegis.dll', base: 1200, desc: 'Absorbs the next mistake.' },
  };
  D.SW_MAX = 5;
  D.SW_CHARGES = [0, 1, 2, 2, 3, 4];
  D.SW_REQ_LEVEL = [0, 1, 3, 6, 10, 16];
  D.swCost = (id, lvl) => Math.round(D.SOFTWARE[id].base * Math.pow(2.4, lvl)); // cost to go lvl -> lvl+1 (lvl 0 = first purchase)

  // ---------------------------------------------------------------- consumables
  D.ITEMS = {
    scrubber: { name: 'Trace Scrubber', price: 450, req: 1, color: 'var(--g)', desc: 'Instantly removes 20% trace.' },
    decoy: { name: 'Decoy Beacon', price: 320, req: 1, color: 'var(--c)', desc: 'Freezes ambient trace for 30 seconds.' },
    scanner: { name: 'Net Scanner', price: 260, req: 1, color: 'var(--a)', desc: 'Reveals every node, its type and rewards.' },
    overclock: { name: 'Overclock Chip', price: 380, req: 4, color: 'var(--m)', desc: 'Next breach: +30% time and +1 life.' },
    zeroday: { name: 'Zero-Day Exploit', price: 1600, req: 6, color: 'var(--r)', desc: 'Instantly compromises any visible node. No trace.' },
  };
  D.ITEM_ORDER = ['scrubber', 'decoy', 'scanner', 'overclock', 'zeroday'];

  // ---------------------------------------------------------------- loot
  D.LOOT = [
    { cat: 'records', name: 'Customer Records', base: 1.0 }, { cat: 'finance', name: 'Financial Ledgers', base: 1.5 },
    { cat: 'secrets', name: 'Trade Secrets', base: 2.0 }, { cat: 'code', name: 'Source Code', base: 1.7 },
    { cat: 'creds', name: 'Credential Dump', base: 0.8 }, { cat: 'media', name: 'Private Media', base: 0.9 },
    { cat: 'research', name: 'Research Data', base: 2.3 }, { cat: 'crypto', name: 'Wallet Keys', base: 2.8 },
  ];
  D.LOOT_BY_CAT = {}; D.LOOT.forEach((l) => { D.LOOT_BY_CAT[l.cat] = l; });

  // ---------------------------------------------------------------- skills
  D.BRANCHES = {
    breach: { name: 'Breach', color: 'var(--m)', desc: 'Make minigames easier and more rewarding.' },
    ghost: { name: 'Ghost', color: 'var(--c)', desc: 'Stay invisible. Trace and heat control.' },
    broker: { name: 'Broker', color: 'var(--a)', desc: 'Squeeze more credits out of every job.' },
  };
  D.SKILLS = [
    { id: 'overclocker', br: 'breach', name: 'Overclocker', max: 3, req: 0, desc: '+4% time in minigames per rank.' },
    { id: 'second_chance', br: 'breach', name: 'Second Chance', max: 2, req: 3, desc: '+1 life / mistake allowance per rank.' },
    { id: 'deep_focus', br: 'breach', name: 'Deep Focus', max: 3, req: 5, desc: '+6% timing/precision window per rank.' },
    { id: 'toolsmith', br: 'breach', name: 'Toolsmith', max: 2, req: 8, desc: '+1 charge for every program per rank.' },
    { id: 'perfectionist', br: 'breach', name: 'Perfectionist', max: 3, req: 12, desc: 'A and S ranks pay +5% / +8% / +12% XP & credits.' },
    { id: 'low_profile', br: 'ghost', name: 'Low Profile', max: 3, req: 0, desc: '-7% ambient trace per rank.' },
    { id: 'scrub_pro', br: 'ghost', name: 'Scrub Pro', max: 3, req: 3, desc: '-8% trace from mistakes per rank.' },
    { id: 'log_cleaner', br: 'ghost', name: 'Log Cleaner', max: 2, req: 5, desc: '-18% heat gained per rank.' },
    { id: 'clean_exit', br: 'ghost', name: 'Clean Exit', max: 2, req: 8, desc: 'When aborting, keep 50% / 100% of loot and lose no rep.' },
    { id: 'last_gasp', br: 'ghost', name: 'Last Gasp', max: 1, req: 12, desc: 'Once per run, hitting 100% trace dumps it to 55% instead.' },
    { id: 'haggler', br: 'broker', name: 'Haggler', max: 3, req: 0, desc: '-5% shop prices per rank.' },
    { id: 'fence', br: 'broker', name: 'Fence Contacts', max: 3, req: 3, desc: '+7% loot sale value per rank.' },
    { id: 'negotiator', br: 'broker', name: 'Negotiator', max: 3, req: 5, desc: '+4% contract payouts per rank.' },
    { id: 'hoarder', br: 'broker', name: 'Data Hoarder', max: 2, req: 8, desc: '+15% loot value per rank, more loot nodes.' },
    { id: 'networker', br: 'broker', name: 'Networker', max: 2, req: 12, desc: '+20% faction rep per rank.' },
  ];
  D.SKILL_BY_ID = {}; D.SKILLS.forEach((s) => { D.SKILL_BY_ID[s.id] = s; });

  // ---------------------------------------------------------------- targets
  D.ORGS = [
    { n: 'Brew & Byte Café', ind: 'retail', t: [1, 2] }, { n: 'QuickMart Systems', ind: 'retail', t: [1, 3] },
    { n: 'Sable Logistics', ind: 'logistics', t: [1, 5] }, { n: 'Pixelforge Studios', ind: 'tech', t: [1, 5] },
    { n: 'City Records Office', ind: 'gov', t: [1, 4] }, { n: 'Daybreak Media', ind: 'media', t: [1, 4] },
    { n: 'Kestrel Credit Union', ind: 'bank', t: [1, 4] }, { n: 'Halden Savings', ind: 'bank', t: [2, 5] },
    { n: 'NovaGene Labs', ind: 'biotech', t: [2, 6] }, { n: 'Voltaic Grid Co.', ind: 'energy', t: [2, 6] },
    { n: 'ViewCast Network', ind: 'media', t: [2, 6] }, { n: 'Metro Transit Authority', ind: 'gov', t: [2, 6] },
    { n: 'Tidewater Shipping', ind: 'logistics', t: [2, 6] }, { n: 'Golden Mirage Casino', ind: 'casino', t: [2, 7] },
    { n: 'OmniTel', ind: 'tech', t: [2, 7] }, { n: 'Obsidian Trust', ind: 'bank', t: [3, 7] },
    { n: 'VitaCore Genomics', ind: 'biotech', t: [3, 8] }, { n: 'SolarArc Power', ind: 'energy', t: [3, 8] },
    { n: '9th Precinct PD', ind: 'gov', t: [3, 7] }, { n: 'Zenith Cloud', ind: 'tech', t: [3, 9] },
    { n: 'Helix Pharma', ind: 'biotech', t: [4, 9] }, { n: 'Orbital Dynamics', ind: 'defense', t: [4, 10] },
    { n: 'Meridian Bank', ind: 'bank', t: [5, 11] }, { n: 'Aegis Dynamics', ind: 'defense', t: [5, 11] },
    { n: 'Kronos Aerospace', ind: 'defense', t: [6, 12] }, { n: 'Halcyon Fusion', ind: 'energy', t: [6, 12] },
  ];
  D.FILES = {
    retail: ['customer_loyalty.db', 'payment_tokens.csv', 'pos_master.key'], bank: ['ledger_Q3.enc', 'vip_accounts.db', 'wire_templates.xlsx'],
    biotech: ['trial_results.zip', 'compound_X7.pdf', 'patient_cohort.db'], energy: ['grid_topology.dwg', 'fuel_contracts.xlsx', 'scada_creds.vault'],
    media: ['unaired_footage.mp4', 'source_identities.db', 'editorial_memos.zip'], gov: ['sealed_records.pdf', 'budget_slush.xlsx', 'informant_list.db'],
    defense: ['guidance_firmware.bin', 'test_range_logs.enc', 'procurement_graph.db'], casino: ['highroller_list.db', 'rng_seed.key', 'camera_index.csv'],
    tech: ['source_tree.tar', 'user_keys.vault', 'roadmap_2027.pdf'], logistics: ['manifest_black.csv', 'route_override.cfg', 'customs_bribes.xlsx'],
  };
  D.RECORDS = ['incident reports', 'audit trail', 'CCTV archive', 'visitor logs', 'transaction history', 'badge swipes'];
  D.SYSTEMS = ['cooling controller', 'perimeter lasers', 'backup generator', 'payment switch', 'broadcast relay', 'conveyor system', 'door controller'];
  D.PLANTS = ['payroll server', 'badge system', 'update server', 'VPN concentrator', 'mail gateway', 'telemetry hub'];

  D.TITLES = {
    steal: ['Quiet Withdrawal', 'Data Heist', 'Paper Chase', 'Deep Copy', 'The Long Download', 'Smash & Grab (Digital)'],
    wipe: ['Clean Slate', 'Burn Notice', 'Memory Hole', 'Erased', 'Cold Case'],
    sabotage: ['Dead Switch', 'Blackout', 'Broken Arrow', 'Short Circuit', 'Rolling Brownout'],
    plant: ['Trojan Horse', 'Sleeper Cell', 'Back Door', 'Seed Planting', 'Long Con'],
  };

  D.BRIEFS = {
    syndicate: [
      'Listen close. {org} is sitting on something that belongs in our hands. {obj}. Don\'t make me regret this.',
      'Bored rich people at {org} think their network is private. Prove them wrong. {obj}. Keep it quiet or we\'ll both be sorry.',
      'Quick job, fat envelope. {obj} at {org}. The boss wants it by morning. Don\'t get traced.',
    ],
    meridian: [
      'Our client has an interest in {org}. {obj}. We expect discretion and results, in that order.',
      'This is a standard acquisition of information from {org}. {obj}. Payment on verification.',
      'Efficient and clean, please. {obj} — {org}. There is a bonus for finishing without alarms.',
    ],
    lumen: [
      'They\'re hiding things at {org} and the public deserves to know. {obj}. We can\'t pay much, but we\'ll remember it.',
      'The Collective needs a hand: {org} has been burying evidence. {obj}. Stay safe, friend.',
      'Information wants to be free. {obj} from {org}. We\'ll throw in some toys if you do well.',
    ],
  };
  D.DEBRIEF = {
    syndicate: { ok: ['Clean. The boss is pleased. Don\'t get comfortable.', 'Money moved. Good work, kid.', 'You do good work. Keep your head down.'], bad: ['You burned the op. We don\'t forget that.', 'Sloppy. Very sloppy.', 'We lost money on you. Fix that.'] },
    meridian: { ok: ['Payment released. A pleasure doing business.', 'Verified. Our client is satisfied.', 'Excellent. We will remember your reliability.'], bad: ['Disappointing. We have other contractors.', 'Our client is displeased.', 'This reflects poorly on both of us.'] },
    lumen: { ok: ['You\'re a hero, whoever you are. The world needs more like you.', 'Got it! The leak goes live tonight.', 'Thank you. Really. Take a bonus from the donation pool.'], bad: ['It\'s okay. We\'ll find another way. Be careful out there.', 'They locked us out. Stay safe.', 'Not your fault. Next time.'] },
  };

  // ---------------------------------------------------------------- bonus objectives
  D.BONUS = {
    silent: { name: 'Silent', text: 'Finish with trace under 40%', mult: 0.2 },
    fast: { name: 'Fast', text: 'Finish within the par time', mult: 0.15 },
    flawless: { name: 'Flawless', text: 'Never fail a node', mult: 0.12 },
    greedy: { name: 'Greedy', text: 'Breach every loot node', mult: 0.18 },
  };

  // ---------------------------------------------------------------- rivals
  D.RIVALS = ['NULLSET', 'Cr4ckHead', 'vOid_Walker', 'MIDNIGHT.exe', '0xDEADC0DE', 'Sp3ctre', 'glitchwitch', 'RootKitten', 'byte_me', 'Overflow', 'PhantomLimb', 'Zer0Day',
    'LATENCY', 'n1ghtshade', 'H4lcyon', 'static_', 'Cipherpunk99', 'wr3nch', 'Daemonette', 'Kernel_Panic', 'ghostwriter', 'TTL0', 'SQLi_Queen', 'rm_rf', 'packet_rat'];

  // ---------------------------------------------------------------- news
  D.NEWS = [
    'MARKETS: data brokers report record demand for stolen customer records',
    'CITY: Metro Transit says "no evidence" of intrusion, then restarts every server',
    'TECH: OmniTel promises "military-grade" security, again',
    'LOCAL: cafés ban laptops after third router hijack this month',
    'WORLD: Meridian Group announces "predictive safety initiative"',
    'CRIME: underground handles rank shuffle as new talent climbs the boards',
    'SCIENCE: researchers warn that password "hunter2" remains popular',
    'POLITICS: council debates banning anonymous proxies; proxies unavailable for comment',
    'BUSINESS: cyber-insurance premiums triple for second year running',
    'SECURITY: patch Tuesday is now patch every day',
    'WEATHER: heavy static in the sector. Expect packet loss and mild paranoia',
    'MEDIA: Daybreak accused of publishing leaks "too accurately"',
    'GRID: Voltaic Grid blames squirrels for third substation outage',
    'RUMOR: something called CIPHER is watching the whole city',
  ];

  // ---------------------------------------------------------------- achievements (test gets the save state S)
  const A = (id, name, desc, test, reward) => ({ id, name, desc, test, reward: reward || 250 });
  D.ACHIEVEMENTS = [
    A('first_blood', 'First Blood', 'Complete your first contract.', (s) => s.stats.done >= 1),
    A('ten_jobs', 'Regular', 'Complete 10 contracts.', (s) => s.stats.done >= 10),
    A('fifty_jobs', 'Veteran', 'Complete 50 contracts.', (s) => s.stats.done >= 50, 2000),
    A('hundred_jobs', 'Legend of the Wire', 'Complete 100 contracts.', (s) => s.stats.done >= 100, 6000),
    A('ghost_run', 'Ghost', 'Finish a contract with trace under 10%.', (s) => s.stats.bestTrace <= 10 && s.stats.done > 0),
    A('s_rank', 'Showoff', 'Earn an S rank on a node.', (s) => s.stats.rankS >= 1),
    A('s_rank_25', 'Flawless Hands', 'Earn 25 S ranks.', (s) => s.stats.rankS >= 25, 1500),
    A('traced', 'Burned', 'Get traced for the first time.', (s) => s.stats.traced >= 1, 50),
    A('rich', 'Five Figures', 'Hold ¢10,000 at once.', (s) => s.credits >= 10000, 500),
    A('richer', 'Six Figures', 'Hold ¢100,000 at once.', (s) => s.credits >= 100000, 5000),
    A('lvl10', 'Level 10', 'Reach level 10.', (s) => s.level >= 10, 800),
    A('lvl25', 'Level 25', 'Reach level 25.', (s) => s.level >= 25, 3000),
    A('rig_maxed', 'Overbuilt', 'Max out one hardware part.', (s) => Object.values(s.hw).some((l) => l >= 6), 1200),
    A('zero_day', 'Skip the Line', 'Use a Zero-Day exploit.', (s) => s.stats.zerodays >= 1, 200),
    A('all_games', 'Jack of All Trades', 'Win every minigame type at least once.', (s) => Object.keys(D.GAMES).every((g) => ((s.stats.games[g] || {}).wins || 0) > 0), 1000),
    A('mastery', 'Specialist', 'Reach mastery level 5 in any minigame.', (s) => Object.keys(s.mastery).some((g) => D.masteryLevel(s.mastery[g]) >= 5), 800),
    A('story_half', 'Rabbit Hole', 'Complete 4 story missions.', (s) => s.story.done.length >= 4, 1000),
    A('story_end', 'Cipher', 'Finish the story.', (s) => s.story.done.length >= 8, 5000),
    A('heat_90', 'Playing with Fire', 'Reach 90 heat.', (s) => s.stats.maxHeat >= 90, 150),
    A('top10', 'Top Ten', 'Break into the underground top 10.', (s) => s.stats.bestRank > 0 && s.stats.bestRank <= 10, 1500),
    A('no1', 'Number One', 'Become the #1 hacker.', (s) => s.stats.bestRank === 1, 8000),
    A('hoarder', 'Hoarder', 'Hold ¢20,000 worth of unsold loot.', (s) => (s.loot || []).reduce((a, l) => a + l.value, 0) >= 20000, 800),
  ];

  // ---------------------------------------------------------------- mastery
  D.MASTERY_MAX = 10;
  D.masteryNeed = (lvl) => 30 + 25 * lvl;
  D.masteryLevel = (xp) => { let l = 0, x = xp || 0; while (l < D.MASTERY_MAX && x >= D.masteryNeed(l + 1)) { x -= D.masteryNeed(l + 1); l++; } return l; };
  D.masteryProgress = (xp) => { let l = 0, x = xp || 0; while (l < D.MASTERY_MAX && x >= D.masteryNeed(l + 1)) { x -= D.masteryNeed(l + 1); l++; } return l >= D.MASTERY_MAX ? { lvl: l, cur: 1, need: 1 } : { lvl: l, cur: x, need: D.masteryNeed(l + 1) }; };

  // ---------------------------------------------------------------- story (8 missions)
  D.STORY = [
    { id: 's0', title: 'Boot Sequence', faction: 'syndicate', fixer: 'Vex', tier: 1, org: 'Brew & Byte Café', objKind: 'steal', objText: 'Exfiltrate "regulars_wifi_creds.db"', minLevel: 1, after: null, tutorial: true,
      brief: 'Kid. Word is you can type. The café on 5th has a router older than you and a database full of regulars. Get in, grab the creds file, get out. Think of it as an audition.',
      done: { from: 'Vex', subj: 'Not bad', body: 'You didn\'t panic. That puts you ahead of most. I\'ll send more work your way. Spend that cash on gear before you spend it on noodles.' } },
    { id: 's1', title: 'Paper Trail', faction: 'syndicate', fixer: 'Madame Tse', tier: 2, org: 'Kestrel Credit Union', objKind: 'steal', objText: 'Exfiltrate "ledger_Q3.enc"', minLevel: 2, after: 's0',
      brief: 'Kestrel Credit Union launders more than it lends. Their Q3 ledger is encrypted. Break it and bring it to me, and we will both eat well this winter.',
      done: { from: 'Pixel', subj: 'we saw what you did at Kestrel', body: 'hey. you don\'t know us, but LUMEN noticed. the ledger you pulled has names we\'ve been chasing for years. if you ever want work that matters, we have some. also: be careful. someone else was in that network. someone quiet.' } },
    { id: 's2', title: 'Lights Out', faction: 'lumen', fixer: 'Pixel', tier: 3, org: 'Voltaic Grid Co.', objKind: 'sabotage', objText: 'Disable Substation 9\'s controller', minLevel: 3, after: 's1',
      brief: 'The city\'s surveillance mesh runs off Substation 9. Ten minutes of darkness and the cameras go blind, ten minutes our people can move. You break the controller, we do the rest.',
      done: { from: 'Pixel', subj: 'Lights out. You did it.', body: 'the whole east side went dark! cameras dead! thank you. one thing though... when we pulled the camera logs there was a codename on the analytics layer. CIPHER. we don\'t know what it is yet.' } },
    { id: 's3', title: 'Glass House', faction: 'meridian', fixer: 'A. Holloway', tier: 4, org: 'NovaGene Labs', objKind: 'steal', objText: 'Exfiltrate "trial_results.zip"', minLevel: 5, after: 's2',
      brief: 'NovaGene has sealed trial results that contradict their public claims. Our client wants them. A vault, encrypted, three firewalls. I trust that you can handle it.',
      done: { from: 'A. Holloway', subj: 'Payment released', body: 'Impeccable work. As a courtesy: the metadata in those trial results references a predictive analytics layer. It appears to be called CIPHER. Curious that Meridian\'s own logo appears on the data licence. I would stop asking questions, if I were you. But I know you won\'t.' } },
    { id: 's4', title: 'Whisper Network', faction: 'lumen', fixer: 'Oracle-9', tier: 5, org: 'OmniTel', objKind: 'steal', objText: 'Exfiltrate "subscriber_graph.db"', minLevel: 8, after: 's3',
      brief: 'OmniTel hands the city\'s call graph to something called CIPHER, a system that scores every citizen\'s likelihood to commit a crime. We need the graph to prove it. Careful: it learns from every intrusion.',
      done: { from: 'Oracle-9', subj: 'it knows your style', body: 'The graph confirms it. CIPHER scores everyone. It already has you flagged as "high-probability intruder". Whatever you do next, do not repeat yourself. It learns your patterns. Someone else is hunting it too. Handle NULLSET carefully.' } },
    { id: 's5', title: 'The Mirror', faction: 'syndicate', fixer: 'Big O', tier: 6, org: 'Golden Mirage Casino', objKind: 'plant', objText: 'Plant a backdoor in the payroll server', minLevel: 11, after: 's4',
      brief: 'Plant a backdoor in the Mirage\'s payroll server and the Syndicate owns the floor. Word of warning: another handle has been spotted in there. NULLSET. They\'re good. You\'ll want to be better.',
      done: { from: 'NULLSET', subj: 'nice work, ghost', body: 'You were good. Almost as good as me. We want the same thing: the thing under Meridian\'s skyscraper. Bring your best. Aegis Dynamics has the key to its front door. See you on the other side.' } },
    { id: 's6', title: 'Black ICE', faction: 'meridian', fixer: 'Director K', tier: 7, org: 'Aegis Dynamics', objKind: 'steal', objText: 'Exfiltrate "guidance_firmware.bin"', minLevel: 15, after: 's5', boss: 2,
      brief: 'There is a way into the CIPHER core, and Aegis holds the access firmware. It is guarded by Black ICE, intrusion software that kills. Do not be traced. Do not fail. Questions later.',
      done: { from: 'Director K', subj: 'You have the key', body: 'The firmware is genuine. I am sending the core coordinates. Be advised: I have my own reasons to want CIPHER stopped. Seven of my analysts were flagged. None of them were criminals. Finish it.' } },
    { id: 's7', title: 'Cipher', faction: 'lumen', fixer: 'Pixel', tier: 9, org: 'Meridian Cipher Core', objKind: 'steal', objText: 'Break the CIPHER core key', minLevel: 20, after: 's6', boss: 3,
      brief: 'This is it. Everything we have been fighting. The CIPHER core sits under Meridian Tower behind three layers of Black ICE. Break the key, free the city. We\'re all behind you.',
      done: { from: 'Pixel', subj: 'it\'s over. it\'s really over.', body: 'The scores are gone. Every flag, every file. The city is breathing again. The Legend tier contracts have opened up now: everyone knows your name. Keep working. Keep climbing. Thank you. - P' } },
  ];

  D.WELCOME = { from: 'Vex', subj: 'Welcome to the wire', body: 'You\'re in. Open CONTRACTS and take the first job on the STORY tab. It\'s a warm-up: a café network. Breach nodes by clicking them; each breach is a minigame. Mistakes raise TRACE. Hit 100% and you\'re burned. Spend your pay at the RIG and SHOP. Good luck, kid.' };
})();

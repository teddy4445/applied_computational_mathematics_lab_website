(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const BASE_DAY_SECONDS = 24;
  const SUBSTEPS_PER_DAY = 6;
  const MAX_AGENTS = 44;
  const REDUCED_MOTION_AGENTS = 18;
  const GAME_AUDIO_TRACKS = ["assets/game1.mp3", "assets/game2.mp3"];
  const GAME_SOUND_EFFECTS = {
    mobility: "assets/policy-mobility.wav",
    testing: "assets/policy-testing.wav",
    protection: "assets/policy-protection.wav",
    districtSelect: "assets/policy-protection.wav",
    decisionNews: "assets/news.mp3",
    decisionPick: "assets/policy-testing.wav",
    newDay: "assets/new_day.mp3",
    uiButton: "assets/btn.mp3",
    summary: "assets/scenario-finish.wav",
    hospitalAlert: "assets/scenario-finish.wav",
    recovery: "assets/policy-protection.wav"
  };

  const AUDIO = {
    player: null,
    playlist: [],
    trackIndex: 0,
    muted: false,
    playbackStarted: false
  };

  const SFX = {
    pools: new Map(),
    lastTriggeredAt: new Map()
  };

  const BASE_DISTRICTS = [
    { id: "residential", name: "Residential North", typeId: "residential", typeLabel: "Residential", population: 9800, economicWeight: 0.92, x: 224, y: 158, size: 56 },
    { id: "downtown", name: "Downtown Core", typeId: "downtown", typeLabel: "Downtown", population: 8200, economicWeight: 1.35, x: 386, y: 194, size: 60 },
    { id: "transit", name: "Transit Hub", typeId: "transit", typeLabel: "Transit hub", population: 4300, economicWeight: 1.08, x: 584, y: 184, size: 52 },
    { id: "school", name: "School District", typeId: "school", typeLabel: "School zone", population: 6400, economicWeight: 0.78, x: 286, y: 340, size: 54 },
    { id: "market", name: "Market Square", typeId: "market", typeLabel: "Market", population: 6900, economicWeight: 1.1, x: 434, y: 350, size: 54 },
    { id: "industrial", name: "Industrial Zone", typeId: "industrial", typeLabel: "Industrial", population: 7100, economicWeight: 1.2, x: 590, y: 356, size: 58 },
    { id: "riverside", name: "Riverside Park", typeId: "riverside", typeLabel: "Parkland", population: 5600, economicWeight: 0.72, x: 244, y: 476, size: 52 },
    { id: "hospital", name: "Hospital Quarter", typeId: "hospital", typeLabel: "Hospital quarter", population: 5200, economicWeight: 0.96, x: 500, y: 484, size: 56 },
    { id: "old-town", name: "Old Town", typeId: "market", typeLabel: "Mixed-use", population: 6100, economicWeight: 1.05, x: 320, y: 256, size: 50 },
    { id: "university", name: "University Heights", typeId: "school", typeLabel: "Campus", population: 6700, economicWeight: 0.88, x: 360, y: 396, size: 52 },
    { id: "port", name: "Port District", typeId: "industrial", typeLabel: "Port", population: 5900, economicWeight: 1.18, x: 684, y: 392, size: 52 },
    { id: "civic", name: "Civic Center", typeId: "downtown", typeLabel: "Civic", population: 5400, economicWeight: 1.22, x: 560, y: 236, size: 50 },
    { id: "southbank", name: "Garden South", typeId: "residential", typeLabel: "Residential", population: 6000, economicWeight: 0.86, x: 322, y: 456, size: 50 },
    { id: "stadium", name: "Stadium Point", typeId: "transit", typeLabel: "Arena", population: 4800, economicWeight: 1.06, x: 634, y: 450, size: 50 }
  ];

  const BASE_EDGES = [];

  const SCENARIO_NODE_SETS = {
    "balanced-city": ["residential", "downtown", "transit", "school", "market", "industrial", "riverside", "hospital"],
    "dense-downtown": ["residential", "downtown", "transit", "school", "market", "industrial", "riverside", "hospital", "old-town", "civic", "port"],
    "school-cluster": ["residential", "school", "market", "riverside", "hospital", "university"],
    "winter-wave": ["residential", "downtown", "transit", "school", "market", "industrial", "riverside", "hospital", "old-town", "university", "port", "civic", "southbank", "stadium"]
  };

  const SCENARIO_LAYOUTS = {
    "balanced-city": {
      residential: { x: 252, y: 194, size: 56 },
      downtown: { x: 396, y: 174, size: 60 },
      transit: { x: 602, y: 176, size: 52 },
      school: { x: 284, y: 332, size: 54 },
      market: { x: 442, y: 322, size: 54 },
      industrial: { x: 614, y: 334, size: 58 },
      riverside: { x: 250, y: 430, size: 52 },
      hospital: { x: 510, y: 438, size: 56 }
    },
    "dense-downtown": {
      residential: { x: 236, y: 208, size: 52 },
      downtown: { x: 376, y: 156, size: 64 },
      transit: { x: 534, y: 152, size: 54 },
      civic: { x: 666, y: 186, size: 48 },
      "old-town": { x: 270, y: 274, size: 48 },
      school: { x: 530, y: 286, size: 48 },
      market: { x: 404, y: 266, size: 56 },
      industrial: { x: 670, y: 302, size: 56 },
      riverside: { x: 244, y: 402, size: 48 },
      hospital: { x: 438, y: 424, size: 54 },
      port: { x: 636, y: 424, size: 52 }
    },
    "school-cluster": {
      residential: { x: 258, y: 210, size: 58 },
      school: { x: 430, y: 204, size: 60 },
      market: { x: 560, y: 304, size: 52 },
      university: { x: 350, y: 340, size: 54 },
      riverside: { x: 252, y: 426, size: 50 },
      hospital: { x: 498, y: 432, size: 54 }
    },
    "winter-wave": {
      residential: { x: 186, y: 186, size: 48 },
      downtown: { x: 330, y: 152, size: 54 },
      transit: { x: 478, y: 148, size: 54 },
      civic: { x: 620, y: 178, size: 46 },
      "old-town": { x: 246, y: 274, size: 46 },
      school: { x: 380, y: 248, size: 48 },
      market: { x: 524, y: 256, size: 50 },
      industrial: { x: 684, y: 286, size: 50 },
      riverside: { x: 190, y: 390, size: 46 },
      university: { x: 324, y: 384, size: 46 },
      hospital: { x: 458, y: 404, size: 52 },
      southbank: { x: 584, y: 390, size: 46 },
      port: { x: 730, y: 408, size: 48 },
      stadium: { x: 716, y: 214, size: 46 }
    }
  };

  const DISTRICT_MIX = {
    downtown: 1.1,
    residential: 1,
    school: 1.08,
    market: 1.05,
    industrial: 0.96,
    transit: 1.07,
    hospital: 0.92,
    riverside: 0.88
  };

  const DISTRICT_COLORS = {
    downtown: "#1d4ed8",
    residential: "#0ea5e9",
    school: "#f59e0b",
    market: "#f97316",
    industrial: "#475569",
    transit: "#7c3aed",
    hospital: "#ef4444",
    riverside: "#10b981"
  };

  const POLICY_COPY = {
    mobility: [
      { limit: 0.2, text: "Flow still fairly open." },
      { limit: 0.45, text: "Selective travel limits in place." },
      { limit: 0.7, text: "Cross-city trips are heavily reduced." },
      { limit: 1.01, text: "Most movement is near-lockdown." }
    ],
    testing: [
      { limit: 0.2, text: "Case finding is patchy." },
      { limit: 0.45, text: "Some cases are caught quickly." },
      { limit: 0.7, text: "Isolation is noticeably shortening infectious time." },
      { limit: 1.01, text: "Tracing and isolation are running hard." }
    ],
    protection: [
      { limit: 0.2, text: "Protection guidance is light." },
      { limit: 0.45, text: "Masks and distancing are moderately present." },
      { limit: 0.7, text: "Protection is strongly cutting transmission." },
      { limit: 1.01, text: "High compliance is suppressing risky contact." }
    ]
  };

  const SCENARIOS = {
    "balanced-city": {
      label: "Balanced City",
      description: "An eight-neighborhood test bed with commuter traffic, schools, commerce, and hospital services in relative balance.",
      nodeCount: 8,
      connectivityRange: [0.1, 0.3],
      beta: 0.45,
      gamma: 0.085,
      severeRate: 0.078,
      hospitalCapacity: 520,
      dayLimit: 60,
      defaultPolicies: { mobility: 0.22, testing: 0.3, protection: 0.25 },
      seed: [{ districtId: "market", infected: 92 }],
      focusDistrict: "market",
      setup(city) {
        return configureScenarioDistricts(city, "balanced-city");
      },
      events: [
        {
          id: "holiday-weekend",
          startDay: 17,
          duration: 4,
          title: "Holiday weekend",
          body: "A long weekend pulls residents through the market and riverside, boosting leisure movement and a little extra mixing.",
          effects: { mobilityScale: 1.14, transmissionMultiplier: 1.05, economicMultiplier: 1.03 }
        },
        {
          id: "mobile-clinics",
          startDay: 35,
          duration: 5,
          title: "Mobile clinics deployed",
          body: "Temporary neighborhood clinics improve case finding and lift confidence in public services.",
          effects: { testingShift: 0.12, recoveryBoost: 0.02, trustDrift: 1.4 }
        }
      ]
    },
    "dense-downtown": {
      label: "Dense Downtown",
      description: "An eleven-node downtown web with extra mixed-use blocks and civic districts, built for faster cross-city spread.",
      nodeCount: 11,
      connectivityRange: [0.1, 0.3],
      beta: 0.47,
      gamma: 0.084,
      severeRate: 0.08,
      hospitalCapacity: 505,
      dayLimit: 60,
      defaultPolicies: { mobility: 0.28, testing: 0.34, protection: 0.28 },
      seed: [{ districtId: "downtown", infected: 118 }],
      focusDistrict: "downtown",
      setup(city) {
        city = configureScenarioDistricts(city, "dense-downtown");
        city.districts = city.districts.map((district) => {
          if (district.id === "downtown") {
            district.population = 10400;
            district.economicWeight = 1.48;
          }
          if (district.id === "market") {
            district.population = 7600;
            district.economicWeight = 1.18;
          }
          if (district.id === "transit") {
            district.population = 5000;
            district.economicWeight = 1.16;
          }
          if (district.id === "civic") {
            district.population = 6300;
            district.economicWeight = 1.24;
          }
          if (district.id === "port") {
            district.population = 6100;
            district.economicWeight = 1.22;
          }
          return district;
        });
        return city;
      },
      events: [
        {
          id: "commuter-surge",
          startDay: 12,
          duration: 4,
          title: "Commuter surge",
          body: "A downtown conference week brings heavier traffic through transit links and office blocks.",
          effects: { mobilityScale: 1.16, transmissionMultiplier: 1.06, economicMultiplier: 1.04 }
        },
        {
          id: "ventilation-retrofit",
          startDay: 31,
          duration: 6,
          title: "Office ventilation retrofit",
          body: "Rapid building upgrades improve indoor air quality in the densest areas.",
          effects: { recoveryBoost: 0.01, transmissionMultiplier: 0.92, trustDrift: 0.8 }
        }
      ]
    },
    "school-cluster": {
      label: "School Cluster",
      description: "A compact six-node school-focused city where classrooms, households, and campus movement dominate the wave.",
      nodeCount: 6,
      connectivityRange: [0.1, 0.3],
      beta: 0.46,
      gamma: 0.086,
      severeRate: 0.074,
      hospitalCapacity: 540,
      dayLimit: 60,
      defaultPolicies: { mobility: 0.2, testing: 0.32, protection: 0.34 },
      seed: [{ districtId: "school", infected: 108 }],
      focusDistrict: "school",
      setup(city) {
        city = configureScenarioDistricts(city, "school-cluster");
        city.districts = city.districts.map((district) => {
          if (district.id === "school") {
            district.population = 8600;
          }
          if (district.id === "residential") {
            district.population = 10500;
          }
          if (district.id === "university") {
            district.population = 7400;
            district.economicWeight = 0.92;
          }
          return district;
        });
        return city;
      },
      events: [
        {
          id: "school-reopening",
          startDay: 10,
          duration: 5,
          title: "School reopening",
          body: "Full in-person schedules bring extra daytime mixing in the school cluster and nearby homes.",
          effects: { mobilityScale: 1.12, transmissionMultiplier: 1.08, economicMultiplier: 1.02 }
        },
        {
          id: "parent-cohorting",
          startDay: 28,
          duration: 7,
          title: "Parent-led cohorting",
          body: "District families reorganize classes and pickup routines, improving protection and trimming secondary spread.",
          effects: { transmissionMultiplier: 0.91, testingShift: 0.05, trustDrift: 1.2 }
        }
      ]
    },
    "winter-wave": {
      label: "Winter Wave",
      description: "A fourteen-node winter map with more districts, more indoor pressure, and more places for a wave to rebound.",
      nodeCount: 14,
      connectivityRange: [0.1, 0.3],
      beta: 0.49,
      gamma: 0.082,
      severeRate: 0.086,
      hospitalCapacity: 500,
      dayLimit: 60,
      defaultPolicies: { mobility: 0.24, testing: 0.38, protection: 0.4 },
      seed: [{ districtId: "transit", infected: 88 }, { districtId: "market", infected: 54 }],
      focusDistrict: "transit",
      setup(city) {
        city = configureScenarioDistricts(city, "winter-wave");
        city.districts = city.districts.map((district) => {
          if (district.id === "hospital") {
            district.population = 5600;
          }
          if (district.id === "southbank") {
            district.population = 6400;
          }
          if (district.id === "stadium") {
            district.population = 5400;
            district.economicWeight = 1.1;
          }
          return district;
        });
        return city;
      },
      events: [
        {
          id: "cold-snap",
          startDay: 15,
          duration: 6,
          title: "Cold snap",
          body: "Residents spend more time indoors, increasing per-contact risk and keeping some staff home.",
          effects: { transmissionMultiplier: 1.18, economicMultiplier: 0.98 }
        },
        {
          id: "public-fatigue",
          startDay: 34,
          duration: 6,
          title: "Public fatigue",
          body: "Compliance softens after weeks of caution, making protection measures less reliable.",
          effects: { protectionScale: 0.85, trustDrift: -1.6 }
        }
      ]
    }
  };

  const DISTRICT_CRISIS_TEMPLATES = [
    {
      id: "school-absenteeism",
      title: "Absenteeism wave",
      eligibleTypes: ["school"],
      durationRange: [4, 6],
      iconType: "school",
      body(district) {
        return `${district.name} is seeing a spike in absenteeism. Classroom mixing falls, but families scramble, neighborhood routines wobble, and local economic use softens.`;
      },
      effects: {
        economicMultiplier: 0.985,
        trustDrift: -0.18,
        localTransmissionMultiplier: 0.94,
        localMovementScale: 0.84
      }
    },
    {
      id: "transit-worker-shortage",
      title: "Transit worker shortage",
      eligibleTypes: ["transit"],
      durationRange: [4, 7],
      iconType: "transit",
      body(district) {
        return `${district.name} is short on drivers and station staff. Routes run thin, connected roads choke, and the whole city feels the slowdown.`;
      },
      effects: {
        mobilityScale: 0.93,
        economicMultiplier: 0.975,
        trustDrift: -0.26,
        localMovementScale: 0.62
      }
    },
    {
      id: "hospital-staff-burnout",
      title: "Hospital staff burnout",
      eligibleTypes: ["hospital"],
      durationRange: [5, 8],
      iconType: "hospital",
      body(district) {
        return `${district.name} is dealing with staff burnout. Care teams thin out, recoveries slow, and hospital strain can snowball faster than usual.`;
      },
      effects: {
        trustDrift: -0.42,
        localRecoveryShift: -0.03,
        localTransmissionMultiplier: 1.04
      }
    },
    {
      id: "market-supply-delays",
      title: "Supply delay",
      eligibleTypes: ["market", "industrial"],
      durationRange: [4, 6],
      iconType: "market",
      body(district) {
        return `${district.name} is stuck in a supply delay. Shops stay open, but logistics snarl, local trust slips, and commercial flow loses some rhythm.`;
      },
      effects: {
        economicMultiplier: 0.98,
        trustDrift: -0.16,
        localMovementScale: 0.8
      }
    },
    {
      id: "park-crowding",
      title: "Weekend crowding",
      eligibleTypes: ["riverside", "residential", "downtown"],
      durationRange: [3, 5],
      iconType: "festival",
      body(district) {
        return `${district.name} is drawing unexpected crowds. Movement rises, local contacts spike, and public messaging gets harder to enforce.`;
      },
      effects: {
        mobilityScale: 1.05,
        trustDrift: -0.14,
        localTransmissionMultiplier: 1.08,
        localMovementScale: 1.14
      }
    }
  ];

  const WEEKLY_DECISION_LIBRARY = [
    { id: "rapid-clinic-contract", tag: "Health", title: "Rapid clinic contract", summary: "Rent pop-up clinics across the city for one week.", positive: "Testing rises and active cases ease slightly.", negative: "Operating cost dents economic use.", effects: { immediateInfectionScale: 0.97, trustShift: -1, temporary: { duration: 7, testingShift: 0.08, economicMultiplier: 0.98 } } },
    { id: "night-bus-curfew", tag: "Transit", title: "Night bus curfew", summary: "Trim late-night transit routes until the wave cools.", positive: "Cross-city mixing drops quickly.", negative: "Service workers lose mobility and revenue slips.", effects: { mobilityShift: 0.04, temporary: { duration: 7, mobilityScale: 0.92, transmissionMultiplier: 0.97, economicMultiplier: 0.97, trustDrift: -0.18 } } },
    { id: "mask-push", tag: "Health", title: "Mask push", summary: "Flood stations and shops with free high-filtration masks.", positive: "Transmission falls and trust can rise.", negative: "Procurement spend drags the economy a bit.", effects: { protectionShift: 0.05, trustShift: 2, temporary: { duration: 7, protectionScale: 1.08, economicMultiplier: 0.985 } } },
    { id: "merchant-relief", tag: "Economy", title: "Merchant relief", summary: "Cut permit fees and extend fast cash support to small shops.", positive: "Economic use rebounds and trust stabilizes.", negative: "Movement ticks up and spread gets a little more room.", effects: { trustShift: 2, temporary: { duration: 7, economicMultiplier: 1.03, mobilityScale: 1.04, transmissionMultiplier: 1.02 } } },
    { id: "targeted-tracing", tag: "Operations", title: "Targeted tracing sprint", summary: "Concentrate tracing crews on the hottest districts only.", positive: "Testing becomes more efficient for a week.", negative: "Residents outside the hot zone feel ignored.", effects: { trustShift: -1, temporary: { duration: 7, testingShift: 0.07, transmissionMultiplier: 0.98, economicMultiplier: 0.99 } } },
    { id: "remote-school-week", tag: "School", title: "Remote school week", summary: "Move the school system online for one week.", positive: "School-linked spread cools noticeably.", negative: "Parents lose work hours and trust softens.", effects: { immediateInfectionScale: 0.98, trustShift: -2, temporary: { duration: 7, transmissionMultiplier: 0.97, economicMultiplier: 0.975, mobilityScale: 0.95 } } },
    { id: "festival-pass", tag: "Trust", title: "Permit the festival", summary: "Allow a planned public event to go ahead with light safeguards.", positive: "Trust and commerce jump for the week.", negative: "Mixing spikes and containment gets harder.", effects: { trustShift: 4, temporary: { duration: 5, economicMultiplier: 1.04, mobilityScale: 1.08, transmissionMultiplier: 1.08 } } },
    { id: "quiet-weekend", tag: "Health", title: "Quiet weekend advisory", summary: "Push residents to keep the next weekend close to home.", positive: "Mobility and spread both dip.", negative: "Retail and hospitality take a hit.", effects: { trustShift: -1, temporary: { duration: 4, mobilityScale: 0.9, transmissionMultiplier: 0.96, economicMultiplier: 0.97 } } },
    { id: "staff-rest-bonus", tag: "Hospital", title: "Hospital rest bonus", summary: "Fund overtime relief and rest rotations for medical staff.", positive: "Recovery performance improves and hospitals steady.", negative: "Budget stress weakens economic output a little.", effects: { temporary: { duration: 7, recoveryBoost: 0.03, economicMultiplier: 0.985, trustDrift: 0.12 } } },
    { id: "mall-hours-extension", tag: "Economy", title: "Mall hours extension", summary: "Spread shoppers across longer opening hours.", positive: "Commerce improves without a full surge in crowding.", negative: "More staff movement pushes some extra mixing.", effects: { temporary: { duration: 7, economicMultiplier: 1.025, mobilityScale: 1.03, transmissionMultiplier: 1.01 } } },
    { id: "free-test-day", tag: "Health", title: "Free test day", summary: "Run a citywide zero-cost testing day with mobile vans.", positive: "Active infections drop immediately and testing improves.", negative: "Queues and staffing strain the city for a few days.", effects: { immediateInfectionScale: 0.95, temporary: { duration: 5, testingShift: 0.05, economicMultiplier: 0.985 } } },
    { id: "outdoor-dining", tag: "Economy", title: "Outdoor dining lanes", summary: "Open streets to outdoor commerce and temporary patios.", positive: "Economic use improves and trust lifts.", negative: "Movement rises and contact patterns loosen.", effects: { trustShift: 2, temporary: { duration: 7, economicMultiplier: 1.03, mobilityScale: 1.05, transmissionMultiplier: 1.015 } } },
    { id: "isolation-support", tag: "Trust", title: "Isolation support stipends", summary: "Pay residents who isolate after a positive test.", positive: "Testing works better and trust climbs.", negative: "Budget pressure shaves some economic utilization.", effects: { trustShift: 3, temporary: { duration: 7, testingShift: 0.06, transmissionMultiplier: 0.98, economicMultiplier: 0.985 } } },
    { id: "office-reopening", tag: "Economy", title: "Office reopening push", summary: "Encourage firms to bring staff back on-site.", positive: "Economy improves quickly.", negative: "Mobility and spread both rise for the week.", effects: { temporary: { duration: 7, economicMultiplier: 1.04, mobilityScale: 1.08, transmissionMultiplier: 1.05, trustDrift: -0.08 } } },
    { id: "ventilation-retrofit", tag: "Health", title: "Ventilation retrofit grants", summary: "Fast-track filters and fresh-air upgrades in busy buildings.", positive: "Protection becomes more effective citywide.", negative: "Installation friction slows activity for a few days.", effects: { temporary: { duration: 7, protectionScale: 1.1, transmissionMultiplier: 0.97, economicMultiplier: 0.99 } } },
    { id: "sports-weekend", tag: "Trust", title: "Sports weekend greenlight", summary: "Approve a packed sports weekend with crowd limits.", positive: "Trust and commerce pop upward.", negative: "Transit and market mixing intensify.", effects: { trustShift: 3, temporary: { duration: 4, economicMultiplier: 1.035, mobilityScale: 1.07, transmissionMultiplier: 1.05 } } },
    { id: "public-comms-reset", tag: "Trust", title: "Public messaging reset", summary: "Relaunch city messaging with cleaner, simpler guidance.", positive: "Trust rises and protection compliance improves.", negative: "The direct epidemiology effect is modest.", effects: { trustShift: 4, temporary: { duration: 7, protectionScale: 1.06, economicMultiplier: 0.995 } } },
    { id: "inspection-blitz", tag: "Operations", title: "Inspection blitz", summary: "Run aggressive inspections on crowded venues for one week.", positive: "Transmission risk falls and protection improves.", negative: "Business leaders react badly.", effects: { trustShift: -2, temporary: { duration: 7, protectionScale: 1.08, transmissionMultiplier: 0.97, economicMultiplier: 0.98 } } },
    { id: "factory-bubble", tag: "Industry", title: "Factory bubble plan", summary: "Shift industrial crews into tighter cohort schedules.", positive: "Spread drops in high-output districts.", negative: "Output efficiency falls.", effects: { immediateInfectionScale: 0.985, temporary: { duration: 7, transmissionMultiplier: 0.98, economicMultiplier: 0.98 } } },
    { id: "telework-grant", tag: "Economy", title: "Telework grant", summary: "Subsidize remote work kits for offices and service firms.", positive: "Mobility falls while much of the economy stays online.", negative: "Downtown foot traffic and shops suffer.", effects: { temporary: { duration: 7, mobilityScale: 0.9, transmissionMultiplier: 0.96, economicMultiplier: 0.985 } } },
    { id: "neighborhood-wards", tag: "Health", title: "Neighborhood triage wards", summary: "Stand up temporary wards away from the main hospital.", positive: "Hospital strain eases and recoveries improve.", negative: "Cost and staffing strain the broader system.", effects: { temporary: { duration: 7, recoveryBoost: 0.025, economicMultiplier: 0.985, trustDrift: -0.05 } } },
    { id: "commuter-pass-discount", tag: "Transit", title: "Commuter pass discount", summary: "Cheap transit passes to keep the city moving.", positive: "Economic activity rises fast.", negative: "Crowding and imported risk climb.", effects: { temporary: { duration: 7, economicMultiplier: 1.03, mobilityScale: 1.08, transmissionMultiplier: 1.03 } } },
    { id: "household-kit-drop", tag: "Health", title: "Household protection kits", summary: "Deliver masks, tests, and care instructions door-to-door.", positive: "Protection and trust both improve.", negative: "Logistics cost money.", effects: { trustShift: 2, temporary: { duration: 7, protectionScale: 1.07, testingShift: 0.03, economicMultiplier: 0.988 } } },
    { id: "nightlife-crackdown", tag: "Control", title: "Nightlife crackdown", summary: "Shut crowded nightlife venues earlier for one week.", positive: "Spread drops quickly in the busiest hours.", negative: "Trust and hospitality revenue both slide.", effects: { trustShift: -2, temporary: { duration: 7, mobilityScale: 0.93, transmissionMultiplier: 0.96, economicMultiplier: 0.975 } } },
    { id: "student-volunteer-corps", tag: "Trust", title: "Student volunteer corps", summary: "Recruit students for support calls, deliveries, and outreach.", positive: "Trust rises and vulnerable residents cope better.", negative: "The effect is light on hard transmission numbers.", effects: { trustShift: 4, temporary: { duration: 7, economicMultiplier: 0.995, protectionScale: 1.03 } } },
    { id: "rapid-border-checks", tag: "Control", title: "Rapid border checks", summary: "Tighten inbound checks at the busiest entry nodes.", positive: "Imported pressure drops.", negative: "Transit flow and commerce both slow.", effects: { temporary: { duration: 7, mobilityScale: 0.9, transmissionMultiplier: 0.97, economicMultiplier: 0.98, trustDrift: -0.12 } } },
    { id: "city-bonus-pay", tag: "Economy", title: "Essential worker bonus pay", summary: "Boost pay for the most exposed city workers.", positive: "Trust and staffing resilience improve.", negative: "Budget drag dents short-run economic use.", effects: { trustShift: 3, temporary: { duration: 7, economicMultiplier: 0.99, recoveryBoost: 0.015 } } },
    { id: "ward-neighborhood-bubbles", tag: "Health", title: "Neighborhood bubbles", summary: "Ask districts to socialize within small, repeated groups only.", positive: "Local transmission falls for the week.", negative: "Residents feel cabin pressure and trust softens.", effects: { trustShift: -1, temporary: { duration: 7, transmissionMultiplier: 0.965, mobilityScale: 0.95, economicMultiplier: 0.99 } } },
    { id: "retail-promo-week", tag: "Economy", title: "Retail promo week", summary: "Coordinate citywide promotions to pull shoppers back.", positive: "Economic use gets a strong bump.", negative: "Crowding risk rises at the same time.", effects: { temporary: { duration: 7, economicMultiplier: 1.04, mobilityScale: 1.06, transmissionMultiplier: 1.035 } } },
    { id: "precision-mask-order", tag: "Health", title: "Precision mask order", summary: "Mandate masks only on the busiest routes and venues.", positive: "Protection improves without a full city clampdown.", negative: "Partial rules can confuse residents.", effects: { trustShift: -1, temporary: { duration: 7, protectionScale: 1.06, transmissionMultiplier: 0.98, economicMultiplier: 0.995 } } }
  ];

  const STATE = {
    scenarioKey: "balanced-city",
    setupDifficulty: "moderate",
    scenario: null,
    city: null,
    districtIndex: new Map(),
    edgeIndex: new Map(),
    selectedDistrictId: null,
    day: 0,
    dayAccumulator: 0,
    lastFrameTime: 0,
    speedMultiplier: 1,
    paused: false,
    finished: false,
    publicTrust: 78,
    currentMetrics: null,
    currentControls: null,
    runtime: null,
    dynamicEvents: [],
    gameVisible: false,
    latestEvent: null,
    activeEventIds: new Set(),
    dismissedEventIds: new Set(),
    panelState: { district: false, event: false, legend: true },
    eventPanelTimeout: null,
    eventPanelEventId: null,
    summaryOpen: false,
    weeklyDecisionOpen: false,
    currentDecisionWeek: 0,
    currentDecisionOptions: [],
    lastDecisionWeek: 0,
    reducedMotion: false,
    history: null,
    stats: null,
    audioSignals: {
      hospitalAlertArmed: false,
      trackedDay: 0,
      dayStartInfections: 0,
      lastRecoveryCueDay: -1
    },
    agents: [],
    svgRefs: {
      skyGlow: null,
      nightShade: null,
      sun: null,
      moon: null,
      starField: [],
      decorLayer: null,
      roadGlows: new Map(),
      roadFlows: new Map(),
      districtGroups: new Map(),
      districtAuras: new Map(),
      districtPulses: new Map(),
      districtRings: new Map(),
      districtShells: new Map(),
      districtGlosses: new Map(),
      districtLabels: new Map(),
      districtPercents: new Map(),
      districtSubs: new Map(),
      agentDots: []
    }
  };

  const EL = {};

  document.addEventListener("DOMContentLoaded", initGame);

  function initGame() {
    STATE.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cacheElements();
    initAudioController();
    initSoundEffects();
    bindControls();
    bindTooltips();
    markToolsNavActive();
    syncScenarioInputsFromPreset(EL.scenarioSelect.value || STATE.scenarioKey);
    requestAnimationFrame(loop);
  }

  function cacheElements() {
    EL.cityMap = document.getElementById("mayor-city-map");
    EL.scenarioSelect = document.getElementById("scenario-select");
    EL.scenarioCards = Array.from(document.querySelectorAll(".mayor-scenario-card"));
    EL.difficultyButtons = Array.from(document.querySelectorAll(".mayor-difficulty-button"));
    EL.pickerPopulation = document.getElementById("picker-population");
    EL.pickerPopulationValue = document.getElementById("picker-population-value");
    EL.pickerBeta = document.getElementById("picker-beta");
    EL.pickerBetaValue = document.getElementById("picker-beta-value");
    EL.pickerGammaDays = document.getElementById("picker-gamma-days");
    EL.pickerGammaDaysValue = document.getElementById("picker-gamma-days-value");
    EL.pickerDayLimit = document.getElementById("picker-day-limit");
    EL.pickerDayLimitValue = document.getElementById("picker-day-limit-value");
    EL.launchScenarioButton = document.getElementById("launch-scenario-button");
    EL.scenarioPickerSection = document.getElementById("scenario-picker");
    EL.guideSection = document.querySelector(".mayor-guide-section");
    EL.gameShell = document.getElementById("mayor-game-shell");
    EL.scenarioDescription = document.getElementById("scenario-description");
    EL.scenarioBadge = document.getElementById("scenario-badge");
    EL.pauseButton = document.getElementById("pause-button");
    EL.resumeButton = document.getElementById("resume-button");
    EL.resetButton = document.getElementById("reset-button");
    EL.speedButtons = Array.from(document.querySelectorAll(".mayor-speed-button"));
    EL.policyMobility = document.getElementById("policy-mobility");
    EL.policyTesting = document.getElementById("policy-testing");
    EL.policyProtection = document.getElementById("policy-protection");
    EL.policyMobilityValue = document.getElementById("policy-mobility-value");
    EL.policyTestingValue = document.getElementById("policy-testing-value");
    EL.policyProtectionValue = document.getElementById("policy-protection-value");
    EL.policyMobilityCopy = document.getElementById("policy-mobility-copy");
    EL.policyTestingCopy = document.getElementById("policy-testing-copy");
    EL.policyProtectionCopy = document.getElementById("policy-protection-copy");
    EL.heroActive = document.getElementById("hero-active");
    EL.heroRt = document.getElementById("hero-rt");
    EL.heroHospital = document.getElementById("hero-hospital");
    EL.heroEconomy = document.getElementById("hero-economy");
    EL.heroTrust = document.getElementById("hero-trust");
    EL.heroDays = document.getElementById("hero-days");
    EL.heroScore = document.getElementById("hero-score");
    EL.heroStatusPill = document.getElementById("hero-status-pill");
    EL.advisorHealthCopy = document.getElementById("advisor-health-copy");
    EL.advisorEconomyCopy = document.getElementById("advisor-economy-copy");
    EL.advisorTrustCopy = document.getElementById("advisor-trust-copy");
    EL.advisorHealthMeter = document.getElementById("advisor-health-meter");
    EL.advisorEconomyMeter = document.getElementById("advisor-economy-meter");
    EL.advisorTrustMeter = document.getElementById("advisor-trust-meter");
    EL.advisorHealthChart = document.getElementById("advisor-health-chart");
    EL.advisorEconomyChart = document.getElementById("advisor-economy-chart");
    EL.advisorTrustChart = document.getElementById("advisor-trust-chart");
    EL.dayCounter = document.getElementById("day-counter");
    EL.dayLimit = document.getElementById("day-limit");
    EL.districtCard = document.getElementById("district-card");
    EL.districtCardTitle = document.getElementById("district-card-title");
    EL.districtCardClose = document.getElementById("district-card-close");
    EL.eventCard = document.getElementById("event-card");
    EL.legendCard = document.getElementById("legend-card");
    EL.legendCardClose = document.getElementById("legend-card-close");
    EL.districtDetailPanel = document.getElementById("district-detail-panel");
    EL.summaryModal = document.getElementById("summary-modal");
    EL.summaryDismiss = document.getElementById("summary-dismiss");
    EL.summaryPicker = document.getElementById("summary-picker");
    EL.summaryCopy = document.getElementById("summary-copy");
    EL.summaryEdition = document.getElementById("summary-edition");
    EL.summaryGrade = document.getElementById("summary-grade");
    EL.summaryHealth = document.getElementById("summary-health");
    EL.summaryEconomy = document.getElementById("summary-economy");
    EL.summaryHospital = document.getElementById("summary-hospital");
    EL.summaryTrust = document.getElementById("summary-trust");
    EL.summaryScore = document.getElementById("summary-score");
    EL.summaryScoreChart = document.getElementById("summary-score-chart");
    EL.summaryPaperEdition = document.getElementById("summary-paper-edition");
    EL.summaryPaperDate = document.getElementById("summary-paper-date");
    EL.summaryHeadline = document.getElementById("summary-headline");
    EL.summaryDek = document.getElementById("summary-dek");
    EL.summaryLegacyTitle = document.getElementById("summary-legacy-title");
    EL.summaryLegacy = document.getElementById("summary-legacy");
    EL.summaryKeyMoments = document.getElementById("summary-key-moments");
    EL.decisionModal = document.getElementById("decision-modal");
    EL.decisionDayBadge = document.getElementById("decision-day-badge");
    EL.decisionCopy = document.getElementById("decision-copy");
    EL.decisionOptions = document.getElementById("decision-options");
    EL.tooltip = document.getElementById("mayor-tooltip");
    EL.chartActive = document.getElementById("chart-active");
    EL.chartRt = document.getElementById("chart-rt");
    EL.chartHospital = document.getElementById("chart-hospital");
    EL.chartEconomy = document.getElementById("chart-economy");
    EL.chartPolicy = document.getElementById("chart-policy");
    EL.chartActiveLabel = document.getElementById("chart-active-label");
    EL.chartRtLabel = document.getElementById("chart-rt-label");
    EL.chartHospitalLabel = document.getElementById("chart-hospital-label");
    EL.chartEconomyLabel = document.getElementById("chart-economy-label");
    EL.audioToggleButton = document.getElementById("mayor-audio-toggle");
    EL.audioToggleIcon = document.getElementById("mayor-audio-toggle-icon");
    EL.audioToggleLabel = document.getElementById("mayor-audio-toggle-label");
  }

  function bindControls() {
    EL.launchScenarioButton.addEventListener("click", launchScenarioFromPicker);

    EL.scenarioCards.forEach((button) => {
      button.addEventListener("click", () => {
        syncScenarioInputsFromPreset(button.dataset.scenario);
      });
    });

    EL.difficultyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyDifficultyPreset(button.dataset.difficulty);
      });
    });

    [
      EL.pickerPopulation,
      EL.pickerBeta,
      EL.pickerGammaDays,
      EL.pickerDayLimit
    ].forEach((input) => {
      input.addEventListener("input", () => {
        STATE.setupDifficulty = null;
        syncSetupControlDisplays();
        updateDifficultyButtons();
      });
      input.addEventListener("change", () => {
        STATE.setupDifficulty = null;
        syncSetupControlDisplays();
        updateDifficultyButtons();
      });
    });

    EL.pauseButton.addEventListener("click", () => {
      if (!STATE.city || STATE.finished) return;
      playUiButtonSound();
      STATE.paused = true;
      renderHud();
    });

    EL.resumeButton.addEventListener("click", () => {
      if (!STATE.city || STATE.finished) return;
      playUiButtonSound();
      STATE.paused = false;
      renderHud();
    });

    if (EL.resetButton) {
      EL.resetButton.addEventListener("click", () => {
        goToScenarioPicker();
      });
    }

    if (EL.audioToggleButton) {
      EL.audioToggleButton.addEventListener("click", toggleGameAudio);
    }

    EL.districtCardClose.addEventListener("click", () => {
      hideFloatingPanel("district");
    });

    if (EL.eventCard) {
      EL.eventCard.addEventListener("click", (event) => {
        const dismissButton = event.target.closest("[data-event-dismiss]");
        if (!dismissButton) {
          return;
        }
        STATE.dismissedEventIds.add(dismissButton.dataset.eventDismiss);
        playUiButtonSound();
        renderEventCard();
      });
    }

    if (EL.legendCardClose) {
      EL.legendCardClose.addEventListener("click", () => {
        hideFloatingPanel("legend");
      });
    }

    EL.speedButtons.forEach((button) => {
      button.addEventListener("click", () => {
        playUiButtonSound();
        STATE.speedMultiplier = Number(button.dataset.speed);
        if (STATE.city) {
          renderHud();
        }
      });
    });

    [
      { input: EL.policyMobility, key: "mobility" },
      { input: EL.policyTesting, key: "testing" },
      { input: EL.policyProtection, key: "protection" }
    ].forEach(({ input, key }) => {
      input.addEventListener("input", () => {
        if (!STATE.city) return;
        STATE.city.policies[key] = Number(input.value);
        refreshDerivedMetrics();
        if (key === "mobility") {
          playSoundEffect("mobility", {
            volume: 0.12 + STATE.city.policies[key] * 0.08,
            playbackRate: 0.98 + STATE.city.policies[key] * 0.12,
            cooldown: 90
          });
        }
        renderHud();
        renderMapVisuals();
        renderCharts();
      });

      input.addEventListener("change", () => {
        if (!STATE.city) return;
        recordPolicyMarker(key);
        playPolicyChangeSound(key, Number(input.value));
        renderCharts();
      });
    });

    [EL.summaryDismiss].filter(Boolean).forEach((button) => {
      button.addEventListener("click", closeSummaryModal);
    });

    EL.summaryPicker.addEventListener("click", () => {
      closeSummaryModal();
      goToScenarioPicker();
    });

    if (EL.decisionOptions) {
      EL.decisionOptions.addEventListener("click", (event) => {
        const optionButton = event.target.closest("[data-decision-id]");
        if (!optionButton || !STATE.weeklyDecisionOpen) {
          return;
        }
        resolveWeeklyDecision(optionButton.dataset.decisionId);
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && STATE.summaryOpen) {
        closeSummaryModal();
      }
    });
  }

  function initAudioController() {
    AUDIO.playlist = Math.random() < 0.5
      ? [...GAME_AUDIO_TRACKS]
      : [...GAME_AUDIO_TRACKS].reverse();
    AUDIO.trackIndex = 0;
    AUDIO.player = new Audio(AUDIO.playlist[AUDIO.trackIndex]);
    AUDIO.player.preload = "auto";
    AUDIO.player.loop = false;
    AUDIO.player.volume = 0.042;
    AUDIO.player.muted = AUDIO.muted;
    AUDIO.player.addEventListener("ended", playNextGameTrack);
    AUDIO.player.addEventListener("play", syncAudioToggleButton);
    AUDIO.player.addEventListener("pause", syncAudioToggleButton);
    AUDIO.player.addEventListener("volumechange", syncAudioToggleButton);
    syncAudioToggleButton();
  }

  function initSoundEffects() {
    Object.entries(GAME_SOUND_EFFECTS).forEach(([key, src]) => {
      const pool = Array.from({ length: key === "summary" ? 2 : 3 }, () => {
        const player = new Audio(src);
        player.preload = "auto";
        player.volume = key === "summary" ? 0.46 : 0.28;
        return player;
      });
      SFX.pools.set(key, pool);
    });
  }

  function playSoundEffect(key, options = {}) {
    if (AUDIO.muted) {
      return;
    }

    const pool = SFX.pools.get(key);
    if (!pool || !pool.length) {
      return;
    }

    const now = performance.now();
    const cooldown = options.cooldown ?? 90;
    const lastPlayedAt = SFX.lastTriggeredAt.get(key) || 0;
    if (now - lastPlayedAt < cooldown) {
      return;
    }
    SFX.lastTriggeredAt.set(key, now);

    const player = pool.find((item) => item.paused || item.ended) || pool[0];
    try {
      player.pause();
      player.currentTime = 0;
      player.playbackRate = clamp(0.7, options.playbackRate ?? 1, 1.5);
      player.volume = clamp(0.05, options.volume ?? player.volume, 1);
      const playPromise = player.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (error) {
      // Ignore transient media errors and keep the simulation responsive.
    }
  }

  function playPolicyChangeSound(policyKey, value) {
    const profiles = {
      mobility: { volume: 0.18 + value * 0.18, playbackRate: 0.84 + value * 0.18 },
      testing: { volume: 0.16 + value * 0.16, playbackRate: 1 + value * 0.15 },
      protection: { volume: 0.17 + value * 0.17, playbackRate: 0.96 + value * 0.22 }
    };
    playSoundEffect(policyKey, { ...profiles[policyKey], cooldown: 120 });
  }

  function playUiButtonSound() {
    playSoundEffect("uiButton", { volume: 0.28, playbackRate: 1, cooldown: 0 });
  }

  function setCurrentGameTrack() {
    if (!AUDIO.player || !AUDIO.playlist.length) {
      return;
    }
    AUDIO.player.src = AUDIO.playlist[AUDIO.trackIndex];
    AUDIO.player.load();
  }

  function syncAudioToggleButton() {
    if (!EL.audioToggleButton) {
      return;
    }

    const isAudible = Boolean(
      STATE.gameVisible
      && AUDIO.player
      && AUDIO.playbackStarted
      && !AUDIO.player.paused
      && !AUDIO.muted
    );

    EL.audioToggleButton.hidden = !STATE.gameVisible;
    EL.audioToggleButton.classList.toggle("is-muted", !isAudible);
    EL.audioToggleButton.setAttribute("aria-pressed", String(isAudible));
    EL.audioToggleButton.setAttribute("aria-label", isAudible ? "Mute game audio" : "Play game audio");
    EL.audioToggleButton.title = isAudible ? "Mute game audio" : "Play game audio";

    if (EL.audioToggleLabel) {
      EL.audioToggleLabel.textContent = isAudible ? "Mute" : "Play";
    }

    if (EL.audioToggleIcon) {
      EL.audioToggleIcon.innerHTML = isAudible
        ? '<i class="ri-volume-up-line"></i>'
        : '<i class="ri-play-circle-line"></i>';
    }
  }

  function startGameAudioPlayback() {
    if (!AUDIO.player) {
      return;
    }

    AUDIO.playbackStarted = true;
    AUDIO.player.muted = AUDIO.muted;
    const playPromise = AUDIO.player.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        syncAudioToggleButton();
      });
    }

    syncAudioToggleButton();
  }

  function stopGameAudioPlayback({ resetToStart = false } = {}) {
    if (!AUDIO.player) {
      return;
    }

    AUDIO.playbackStarted = false;
    AUDIO.player.pause();
    AUDIO.player.currentTime = 0;

    if (resetToStart) {
      AUDIO.trackIndex = 0;
      setCurrentGameTrack();
    }

    syncAudioToggleButton();
  }

  function playNextGameTrack() {
    if (!AUDIO.player || !AUDIO.playlist.length) {
      return;
    }

    AUDIO.trackIndex = (AUDIO.trackIndex + 1) % AUDIO.playlist.length;
    setCurrentGameTrack();

    const playPromise = AUDIO.player.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        syncAudioToggleButton();
      });
    }
  }

  function toggleGameAudio() {
    if (!AUDIO.player || !STATE.gameVisible) {
      return;
    }

    if (AUDIO.muted || AUDIO.player.paused) {
      AUDIO.muted = false;
      AUDIO.player.muted = false;
      startGameAudioPlayback();
      return;
    }

    AUDIO.muted = true;
    AUDIO.player.muted = true;
    syncAudioToggleButton();
  }

  function bindTooltips() {
    const tooltipTargets = Array.from(document.querySelectorAll("[data-tooltip]"));
    tooltipTargets.forEach((target) => {
      target.addEventListener("mouseenter", (event) => showTooltip(event.currentTarget.dataset.tooltip, event.currentTarget));
      target.addEventListener("focus", (event) => showTooltip(event.currentTarget.dataset.tooltip, event.currentTarget));
      target.addEventListener("mouseleave", hideTooltip);
      target.addEventListener("blur", hideTooltip);
    });
  }

  function markToolsNavActive() {
    document.querySelectorAll('a.nav-link[href="tools.html"]').forEach((link) => {
      link.classList.add("text-primary", "bg-white", "shadow-sm");
    });
  }

  function getFloatingPanel(key) {
    if (key === "district") return EL.districtCard;
    if (key === "event") return EL.eventCard;
    if (key === "legend") return EL.legendCard;
    return null;
  }

  function showFloatingPanel(key) {
    const panel = getFloatingPanel(key);
    if (!panel) return;
    STATE.panelState[key] = true;
    panel.hidden = false;
    panel.classList.remove("is-hidden-panel");
    panel.setAttribute("aria-hidden", "false");
  }

  function hideFloatingPanel(key) {
    const panel = getFloatingPanel(key);
    if (!panel) return;
    if (key === "event") {
      if (STATE.eventPanelTimeout) {
        window.clearTimeout(STATE.eventPanelTimeout);
        STATE.eventPanelTimeout = null;
      }
      panel.classList.remove("is-live-event");
    }
    STATE.panelState[key] = false;
    panel.classList.add("is-hidden-panel");
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
  }

  function resetFloatingPanels() {
    if (STATE.eventPanelTimeout) {
      window.clearTimeout(STATE.eventPanelTimeout);
      STATE.eventPanelTimeout = null;
    }
    [
      { key: "district", visible: false },
      { key: "event", visible: false },
      { key: "legend", visible: true }
    ].forEach(({ key, visible }) => {
      const panel = getFloatingPanel(key);
      if (!panel) return;
      STATE.panelState[key] = visible;
      panel.hidden = !visible;
      panel.classList.toggle("is-hidden-panel", !visible);
      panel.setAttribute("aria-hidden", String(!visible));
    });
    if (EL.eventCard) {
      EL.eventCard.classList.remove("is-live-event");
      EL.eventCard.innerHTML = "";
    }
  }

  function scheduleEventAutoClose() {
    if (!EL.eventCard) return;
    if (STATE.eventPanelTimeout) {
      window.clearTimeout(STATE.eventPanelTimeout);
    }
    EL.eventCard.classList.remove("is-live-event");
    void EL.eventCard.offsetWidth;
    EL.eventCard.classList.add("is-live-event");
    STATE.eventPanelTimeout = window.setTimeout(() => {
      hideFloatingPanel("event");
    }, 24000);
  }

  function applyScenarioTheme(key) {
    if (document.body) {
      document.body.setAttribute("data-mayor-theme", key);
    }
  }

  function setStatusTone(element, tone) {
    if (!element) return;
    element.classList.remove("is-green", "is-yellow", "is-orange", "is-red");
    element.classList.add(`is-${tone}`);
  }

  function clearStatusTone(element) {
    if (!element) return;
    element.classList.remove("is-green", "is-yellow", "is-orange", "is-red");
  }

  function getMetricTone(metric, value) {
    if (metric === "active") {
      if (value < 0.01) return "green";
      if (value < 0.03) return "yellow";
      if (value < 0.06) return "orange";
      return "red";
    }
    if (metric === "spread") {
      if (value < 0.95) return "green";
      if (value < 1.1) return "yellow";
      if (value < 1.35) return "orange";
      return "red";
    }
    if (metric === "hospital") {
      if (value < 60) return "green";
      if (value < 85) return "yellow";
      if (value < 100) return "orange";
      return "red";
    }
    if (metric === "economy") {
      if (value >= 85) return "green";
      if (value >= 70) return "yellow";
      if (value >= 55) return "orange";
      return "red";
    }
    if (metric === "score") {
      if (value >= 80) return "green";
      if (value >= 65) return "yellow";
      if (value >= 50) return "orange";
      return "red";
    }
    if (value >= 78) return "green";
    if (value >= 62) return "yellow";
    if (value >= 45) return "orange";
    return "red";
  }

  function syncScenarioInputsFromPreset(key) {
    const defaults = getScenarioSetupDefaults(key);
    STATE.scenarioKey = key;
    STATE.setupDifficulty = "moderate";
    EL.scenarioSelect.value = key;
    EL.pickerPopulation.value = String(defaults.population);
    EL.pickerBeta.value = defaults.beta.toFixed(2);
    EL.pickerGammaDays.value = String(defaults.gammaDays);
    EL.pickerDayLimit.value = String(defaults.dayLimit);
    EL.scenarioDescription.textContent = SCENARIOS[key].description;
    applyScenarioTheme(key);
    updateScenarioCards(key);
    updateDifficultyButtons();
    syncSetupControlDisplays();
  }

  function updateScenarioCards(selectedKey) {
    EL.scenarioCards.forEach((button) => {
      const isSelected = button.dataset.scenario === selectedKey;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function syncSetupControlDisplays() {
    EL.pickerPopulationValue.textContent = formatFullNumber(Number(EL.pickerPopulation.value));
    EL.pickerBetaValue.textContent = formatDecimal(EL.pickerBeta.value);
    EL.pickerGammaDaysValue.textContent = String(Math.round(Number(EL.pickerGammaDays.value))) + " days";
    EL.pickerDayLimitValue.textContent = String(Math.round(Number(EL.pickerDayLimit.value))) + " days";
  }

  function updateDifficultyButtons() {
    EL.difficultyButtons.forEach((button) => {
      const isActive = button.dataset.difficulty === STATE.setupDifficulty;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function applyDifficultyPreset(level) {
    const defaults = getScenarioSetupDefaults(EL.scenarioSelect.value || STATE.scenarioKey);
    let population = defaults.population;
    let beta = defaults.beta;
    let gammaDays = defaults.gammaDays;
    let dayLimit = defaults.dayLimit;

    if (level === "easy") {
      population = clamp(1000, Math.round((defaults.population * 0.74) / 1000) * 1000, 1000000);
      beta = clamp(0, defaults.beta - 0.08, 1);
      gammaDays = clamp(1, defaults.gammaDays - 4, 90);
      dayLimit = clamp(7, Math.round((defaults.dayLimit - 14) / 7) * 7, 364);
    } else if (level === "hard") {
      population = clamp(1000, Math.round((defaults.population * 1.3) / 1000) * 1000, 1000000);
      beta = clamp(0, defaults.beta + 0.09, 1);
      gammaDays = clamp(1, defaults.gammaDays + 8, 90);
      dayLimit = clamp(7, Math.round((defaults.dayLimit + 28) / 7) * 7, 364);
    }

    EL.pickerPopulation.value = String(population);
    EL.pickerBeta.value = beta.toFixed(2);
    EL.pickerGammaDays.value = String(gammaDays);
    EL.pickerDayLimit.value = String(dayLimit);
    STATE.setupDifficulty = level;
    updateDifficultyButtons();
    syncSetupControlDisplays();
  }

  function getScenarioSetupDefaults(key) {
    const scenario = SCENARIOS[key];
    const city = scenario.setup(createBaseCity());
    const population = city.districts.reduce((sum, district) => sum + district.population, 0);
    return {
      population: clamp(1000, Math.round(population / 1000) * 1000, 1000000),
      beta: clamp(0, scenario.beta, 1),
      gammaDays: clamp(1, Math.round(1 / scenario.gamma), 90),
      dayLimit: clamp(7, Math.round(scenario.dayLimit / 7) * 7, 364)
    };
  }

  function getPickerRuntimeConfig() {
    const defaults = getScenarioSetupDefaults(EL.scenarioSelect.value || STATE.scenarioKey);
    const population = clamp(1000, Math.round(Number(EL.pickerPopulation.value) || defaults.population), 1000000);
    const beta = clamp(0, Number(EL.pickerBeta.value) || defaults.beta, 1);
    const gammaDays = clamp(1, Math.round(Number(EL.pickerGammaDays.value) || defaults.gammaDays), 90);
    const dayLimit = clamp(7, Math.round((Number(EL.pickerDayLimit.value) || defaults.dayLimit) / 7) * 7, 364);

    EL.pickerPopulation.value = String(population);
    EL.pickerBeta.value = beta.toFixed(2);
    EL.pickerGammaDays.value = String(gammaDays);
    EL.pickerDayLimit.value = String(dayLimit);
    syncSetupControlDisplays();

    return {
      population,
      beta,
      gammaDays,
      dayLimit
    };
  }

  function launchScenarioFromPicker() {
    loadScenario(EL.scenarioSelect.value, { runtimeConfig: getPickerRuntimeConfig() });
  }

  function goToScenarioPicker() {
    STATE.gameVisible = false;
    STATE.city = null;
    STATE.currentMetrics = null;
    STATE.currentControls = null;
    STATE.history = null;
    STATE.runtime = null;
    STATE.dynamicEvents = [];
    STATE.agents = [];
    STATE.finished = false;
    STATE.paused = false;
    STATE.summaryOpen = false;
    STATE.weeklyDecisionOpen = false;
    STATE.currentDecisionWeek = 0;
    STATE.currentDecisionOptions = [];
    STATE.lastDecisionWeek = 0;
    STATE.day = 0;
    STATE.dayAccumulator = 0;
    STATE.speedMultiplier = 1;
    STATE.latestEvent = null;
    STATE.activeEventIds = new Set();
    STATE.dismissedEventIds = new Set();
    STATE.eventPanelEventId = null;
    STATE.audioSignals = {
      hospitalAlertArmed: false,
      trackedDay: 0,
      dayStartInfections: 0,
      lastRecoveryCueDay: -1
    };
    stopGameAudioPlayback({ resetToStart: true });
    closeDecisionModal();
    resetFloatingPanels();
    closeSummaryModal();
    EL.gameShell.hidden = true;
    EL.scenarioPickerSection.hidden = false;
    if (EL.guideSection) {
      EL.guideSection.hidden = false;
    }
    syncScenarioInputsFromPreset(EL.scenarioSelect.value || STATE.scenarioKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recordPolicyMarker(policyKey) {
    if (!STATE.history) return;
    const marker = {
      day: STATE.day,
      policyKey,
      value: STATE.city.policies[policyKey]
    };
    const previous = STATE.history.policyMarkers[STATE.history.policyMarkers.length - 1];
    if (previous && previous.day === marker.day && previous.policyKey === marker.policyKey && Math.abs(previous.value - marker.value) < 0.001) {
      return;
    }
    STATE.history.policyMarkers.push(marker);
  }

  function loadScenario(key, options = {}) {
    const preserveSpeed = options.preserveSpeed === true;
    const runtimeConfig = options.runtimeConfig || getPickerRuntimeConfig();
    const scenario = SCENARIOS[key];
    const city = scenario.setup(createBaseCity());
    const basePopulation = city.districts.reduce((sum, district) => sum + district.population, 0);
    const populationScale = runtimeConfig.population / Math.max(basePopulation, 1);
    let remainingPopulation = runtimeConfig.population;

    city.districts = city.districts.map((district, index, districts) => {
      let scaledPopulation;
      if (index === districts.length - 1) {
        scaledPopulation = Math.max(1, remainingPopulation);
      } else {
        const districtsLeft = districts.length - index - 1;
        const minReserve = Math.max(1, districtsLeft);
        scaledPopulation = Math.max(1, Math.round(district.population * populationScale));
        scaledPopulation = Math.min(scaledPopulation, remainingPopulation - minReserve);
      }
      remainingPopulation -= scaledPopulation;
      return { ...district, population: scaledPopulation };
    });

    settleDistrictPositions(city.districts);
    city.edges = buildRandomEdges(city.districts, scenario.connectivityRange);

    const gammaDays = clamp(1, runtimeConfig.gammaDays, 90);

    STATE.scenarioKey = key;
    STATE.scenario = scenario;
    applyScenarioTheme(key);
    STATE.runtime = {
      population: runtimeConfig.population,
      beta: clamp(0, runtimeConfig.beta, 1),
      gammaDays,
      gammaRate: 1 / gammaDays,
      dayLimit: clamp(7, runtimeConfig.dayLimit, 364),
      hospitalCapacity: Math.max(30, Math.round(scenario.hospitalCapacity * populationScale)),
      severeRate: scenario.severeRate,
      baseAgentCount: Math.max(1, Math.ceil(runtimeConfig.population / 10000))
    };
    STATE.day = 0;
    STATE.dayAccumulator = 0;
    STATE.lastFrameTime = 0;
    STATE.finished = false;
    STATE.paused = false;
    STATE.summaryOpen = false;
    STATE.weeklyDecisionOpen = false;
    STATE.currentDecisionWeek = 0;
    STATE.currentDecisionOptions = [];
    STATE.lastDecisionWeek = 0;
    STATE.activeEventIds = new Set();
    STATE.dismissedEventIds = new Set();
    STATE.latestEvent = null;
    STATE.eventPanelEventId = null;
    resetFloatingPanels();
    STATE.publicTrust = 78;
    STATE.history = {
      days: [],
      activeInfections: [],
      spreadRate: [],
      hospitalUtilization: [],
      economyUtilization: [],
      mobilityPolicy: [],
      testingPolicy: [],
      protectionPolicy: [],
      score: [],
      policyMarkers: []
    };
    STATE.stats = {
      peakHospital: 0,
      peakActive: 0,
      sumEconomy: 0,
      sumScore: 0,
      samples: 0,
      cumulativeInfections: 0
    };

    STATE.dynamicEvents = generateRandomCrisisEvents(city, STATE.runtime.dayLimit);
    STATE.audioSignals = {
      hospitalAlertArmed: false,
      trackedDay: 0,
      dayStartInfections: 0,
      lastRecoveryCueDay: -1
    };

    STATE.city = city;
    STATE.city.policies = { mobility: 0, testing: 0, protection: 0 };
    STATE.selectedDistrictId = scenario.focusDistrict;
    STATE.districtIndex = new Map(STATE.city.districts.map((district) => [district.id, district]));
    STATE.edgeIndex = new Map(STATE.city.edges.map((edge) => [edge.id, edge]));

    STATE.city.districts.forEach((district) => {
      district.S = district.population;
      district.I = 0;
      district.R = 0;
      district.incomingFlow = 0;
      district.outgoingFlow = 0;
    });

    scenario.seed.forEach((seed) => {
      const district = STATE.districtIndex.get(seed.districtId);
      if (!district) return;
      const infectedSeed = Math.max(1, Math.round(seed.infected * populationScale));
      const appliedSeed = Math.min(district.S, infectedSeed);
      district.I += appliedSeed;
      district.S = Math.max(0, district.S - appliedSeed);
    });

    if (!preserveSpeed) {
      STATE.speedMultiplier = 1;
    }

    STATE.gameVisible = true;
    EL.gameShell.hidden = false;
    EL.scenarioPickerSection.hidden = true;
    if (EL.guideSection) {
      EL.guideSection.hidden = true;
    }

    EL.scenarioSelect.value = key;
    EL.scenarioDescription.textContent = scenario.description;
    EL.dayLimit.textContent = String(STATE.runtime.dayLimit);
    syncControlInputs();
    refreshDerivedMetrics();
    STATE.currentMetrics = computeMetrics(STATE.city.districts, STATE.currentControls, STATE.publicTrust);
    recordHistory(STATE.currentMetrics);
    STATE.audioSignals.dayStartInfections = STATE.currentMetrics.activeInfections;
    renderMapScaffold();
    renderMapVisuals();
    initAgents();
    renderAgents();
    renderCharts();
    renderHud();
    closeSummaryModal();
    startGameAudioPlayback();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function createBaseCity() {
    return {
      districts: BASE_DISTRICTS.map((district) => ({ ...district })),
      edges: [],
      policies: { mobility: 0.22, testing: 0.3, protection: 0.25 }
    };
  }

  function configureScenarioDistricts(city, key) {
    const districtIds = new Set(SCENARIO_NODE_SETS[key] || []);
    city.districts = city.districts.filter((district) => districtIds.has(district.id));
    city.edges = [];
    return applyDistrictLayout(city, key);
  }

  function applyDistrictLayout(city, layoutKey) {
    const layout = SCENARIO_LAYOUTS[layoutKey];
    if (!layout) {
      return city;
    }
    city.districts = city.districts.map((district) => {
      const patch = layout[district.id];
      return patch ? { ...district, ...patch } : district;
    });
    return city;
  }

  function settleDistrictPositions(districts) {
    const width = 860;
    const height = 540;

    const relaxPositions = () => {
      for (let iteration = 0; iteration < 240; iteration += 1) {
        let moved = false;

        for (let i = 0; i < districts.length; i += 1) {
          for (let j = i + 1; j < districts.length; j += 1) {
            const first = districts[i];
            const second = districts[j];
            const minDistance = first.size + second.size + 10;
            let dx = second.x - first.x;
            let dy = second.y - first.y;
            let distance = Math.hypot(dx, dy);

            if (distance >= minDistance) {
              continue;
            }

            moved = true;
            if (distance < 0.001) {
              const angle = (i + 1) * (j + 2) * 0.73;
              dx = Math.cos(angle);
              dy = Math.sin(angle);
              distance = 1;
            }

            const push = (minDistance - distance) / 2;
            const offsetX = (dx / distance) * push;
            const offsetY = (dy / distance) * push;

            first.x -= offsetX;
            first.y -= offsetY;
            second.x += offsetX;
            second.y += offsetY;
          }
        }

        districts.forEach((district) => {
          district.x = clamp(district.size + 24, district.x, width - district.size - 24);
          district.y = clamp(district.size + 34, district.y, height - district.size - 64);
        });

        if (!moved) {
          break;
        }
      }
    };

    relaxPositions();

    if (hasDistrictOverlap(districts)) {
      const columns = Math.max(2, Math.ceil(Math.sqrt(districts.length * 1.2)));
      const rows = Math.ceil(districts.length / columns);
      const gridLeft = 90;
      const gridTop = 120;
      const gridWidth = width - 180;
      const gridHeight = height - 230;
      const xStep = columns > 1 ? gridWidth / (columns - 1) : 0;
      const yStep = rows > 1 ? gridHeight / (rows - 1) : 0;
      const ordered = districts.slice().sort((left, right) => left.y - right.y || left.x - right.x);

      ordered.forEach((district, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        district.x = gridLeft + column * xStep;
        district.y = gridTop + row * yStep;
      });

      relaxPositions();
    }
  }

  function hasDistrictOverlap(districts) {
    for (let i = 0; i < districts.length; i += 1) {
      for (let j = i + 1; j < districts.length; j += 1) {
        const first = districts[i];
        const second = districts[j];
        const minDistance = first.size + second.size + 10;
        const distance = Math.hypot(second.x - first.x, second.y - first.y);
        if (distance < minDistance) {
          return true;
        }
      }
    }
    return false;
  }

  function buildRandomEdges(districts, connectivityRange = [0.1, 0.3]) {
    if (districts.length < 2) {
      return [];
    }

    const byId = new Map(districts.map((district) => [district.id, district]));
    const possiblePairs = [];
    for (let i = 0; i < districts.length; i += 1) {
      for (let j = i + 1; j < districts.length; j += 1) {
        possiblePairs.push([districts[i].id, districts[j].id]);
      }
    }

    const shuffledPairs = shuffleArray(possiblePairs);
    const minRate = connectivityRange[0] || 0.1;
    const maxRate = connectivityRange[1] || 0.3;
    const targetRate = randomBetween(minRate, maxRate);
    const targetCount = Math.min(possiblePairs.length, Math.max(districts.length - 1, Math.round(possiblePairs.length * targetRate)));
    const chosenPairs = new Map();
    const nodeOrder = shuffleArray(districts.map((district) => district.id));

    for (let index = 1; index < nodeOrder.length; index += 1) {
      const fromId = nodeOrder[index];
      const toId = nodeOrder[Math.floor(Math.random() * index)];
      const pairKey = buildPairKey(fromId, toId);
      chosenPairs.set(pairKey, [fromId, toId]);
    }

    for (const pair of shuffledPairs) {
      if (chosenPairs.size >= targetCount) {
        break;
      }
      const pairKey = buildPairKey(pair[0], pair[1]);
      if (!chosenPairs.has(pairKey)) {
        chosenPairs.set(pairKey, pair);
      }
    }

    const edges = Array.from(chosenPairs.values()).map((pair, index) => createRandomEdge(index + 1, byId.get(pair[0]), byId.get(pair[1])));
    return ensureConnectedGraph(districts, edges);
  }

  function ensureConnectedGraph(districts, edges) {
    const byId = new Map(districts.map((district) => [district.id, district]));
    let nextIndex = edges.length + 1;
    let components = getGraphComponents(districts, edges);

    while (components.length > 1) {
      let bestPair = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let leftIndex = 0; leftIndex < components.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < components.length; rightIndex += 1) {
          for (const leftId of components[leftIndex]) {
            for (const rightId of components[rightIndex]) {
              const left = byId.get(leftId);
              const right = byId.get(rightId);
              const distance = Math.hypot(right.x - left.x, right.y - left.y);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestPair = [left, right];
              }
            }
          }
        }
      }

      if (!bestPair) {
        break;
      }

      edges.push(createRandomEdge(nextIndex, bestPair[0], bestPair[1]));
      nextIndex += 1;
      components = getGraphComponents(districts, edges);
    }

    return edges;
  }

  function getGraphComponents(districts, edges) {
    const adjacency = new Map(districts.map((district) => [district.id, new Set()]));
    edges.forEach((edge) => {
      adjacency.get(edge.from).add(edge.to);
      adjacency.get(edge.to).add(edge.from);
    });

    const visited = new Set();
    const components = [];

    districts.forEach((district) => {
      if (visited.has(district.id)) {
        return;
      }
      const stack = [district.id];
      const component = [];
      visited.add(district.id);

      while (stack.length) {
        const current = stack.pop();
        component.push(current);
        adjacency.get(current).forEach((neighborId) => {
          if (visited.has(neighborId)) {
            return;
          }
          visited.add(neighborId);
          stack.push(neighborId);
        });
      }

      components.push(component);
    });

    return components;
  }

  function createRandomEdge(index, fromDistrict, toDistrict) {
    const dx = toDistrict.x - fromDistrict.x;
    const dy = toDistrict.y - fromDistrict.y;
    const length = Math.max(Math.hypot(dx, dy), 1);
    const normalX = -dy / length;
    const normalY = dx / length;
    const curveScale = clamp(12, length * 0.12, 38) * (Math.random() < 0.5 ? -1 : 1);
    const weightBase = 0.28 + Math.random() * 0.28 + (((fromDistrict.economicWeight + toDistrict.economicWeight) / 2) - 0.85) * 0.24;
    const typeBoost = fromDistrict.typeId === toDistrict.typeId ? 0.08 : 0;
    return {
      id: `edge-${index}`,
      from: fromDistrict.id,
      to: toDistrict.id,
      weight: clamp(0.22, weightBase + typeBoost, 0.98),
      curveX: Number((normalX * curveScale + (Math.random() - 0.5) * 8).toFixed(2)),
      curveY: Number((normalY * curveScale + (Math.random() - 0.5) * 8).toFixed(2))
    };
  }

  function buildPairKey(a, b) {
    return [a, b].sort().join("|");
  }

  function loop(now) {
    if (!STATE.lastFrameTime) {
      STATE.lastFrameTime = now;
    }
    const deltaSeconds = Math.min(0.05, (now - STATE.lastFrameTime) / 1000);
    STATE.lastFrameTime = now;

    if (STATE.gameVisible && STATE.city && !STATE.finished && !STATE.paused) {
      const stepSize = 1 / SUBSTEPS_PER_DAY;
      STATE.dayAccumulator += (deltaSeconds * STATE.speedMultiplier) / BASE_DAY_SECONDS;
      while (STATE.dayAccumulator >= stepSize && !STATE.finished && !STATE.paused) {
        stepSimulation(stepSize);
        STATE.dayAccumulator -= stepSize;
      }
      updateAgents(deltaSeconds);
      renderAgents();
    }

    requestAnimationFrame(loop);
  }

  function stepSimulation(stepSize = 1) {
    if (STATE.day >= STATE.runtime.dayLimit) {
      finishScenario();
      return;
    }

    const previousWholeDay = Math.floor(STATE.day);
    STATE.currentControls = getEffectiveControls(STATE.day);

    const previousDistricts = STATE.city.districts.map((district) => ({ ...district }));
    const previousIndex = new Map(previousDistricts.map((district) => [district.id, district]));
    const hospitalInfo = getHospitalInfo(previousDistricts);
    const nextDistricts = previousDistricts.map((district) => {
      const districtEventEffects = getDistrictEventEffects(STATE.day, district);
      const total = district.S + district.I + district.R;
      const localInfectious = getEffectiveInfectiousCount(district, hospitalInfo);
      const localFraction = localInfectious / Math.max(total, 1);
      let importedPressure = 0;
      let importedWeight = 0;

      getConnectedEdges(district.id).forEach((edge) => {
        const neighborId = edge.from === district.id ? edge.to : edge.from;
        const neighbor = previousIndex.get(neighborId);
        const neighborEventEffects = getDistrictEventEffects(STATE.day, neighbor);
        const neighborTotal = neighbor.S + neighbor.I + neighbor.R;
        const neighborFraction = getEffectiveInfectiousCount(neighbor, hospitalInfo) / Math.max(neighborTotal, 1);
        const travelWeight = edge.weight
          * STATE.currentControls.movementMultiplier
          * Math.min(districtEventEffects.localMovementScale, neighborEventEffects.localMovementScale)
          * (1 - STATE.currentControls.testing * neighborFraction * 0.45);
        importedPressure += travelWeight * neighborFraction;
        importedWeight += travelWeight;
      });

      const importedFraction = importedWeight > 0 ? importedPressure / importedWeight : 0;
      const betaEffective = getEffectiveTransmissionRate(district, STATE.currentControls, districtEventEffects);
      const gammaEffective = getEffectiveRecoveryRate(STATE.currentControls, districtEventEffects);
      const pressure = Math.max(0, (localFraction * (1.1 - STATE.city.policies.mobility * 0.16)) + (importedFraction * 0.82));
      const hospitalizedCount = hospitalInfo.hospitalizedByDistrict.get(district.id) || 0;
      const communityInfectious = Math.max(0, district.I - hospitalizedCount);
      const newInfections = Math.min(district.S, district.S * (1 - Math.exp(-betaEffective * pressure * stepSize)));
      const communityRecoveries = communityInfectious * (1 - Math.exp(-gammaEffective * stepSize));
      const hospitalRecoveries = hospitalizedCount * (1 - Math.exp(-Math.min(gammaEffective * 1.5, 1) * stepSize));
      const recoveries = Math.min(district.I, communityRecoveries + hospitalRecoveries);

      return {
        ...district,
        S: district.S - newInfections,
        I: Math.max(0, district.I + newInfections - recoveries),
        R: district.R + recoveries
      };
    });

    STATE.city.districts = nextDistricts;
    STATE.districtIndex = new Map(STATE.city.districts.map((district) => [district.id, district]));
    updateMobilityStats(STATE.city.districts, STATE.currentControls);

    const metrics = computeMetrics(STATE.city.districts, STATE.currentControls, STATE.publicTrust);
    STATE.publicTrust = updateTrust(metrics, STATE.currentControls, stepSize);
    metrics.publicTrust = STATE.publicTrust;
    STATE.currentMetrics = metrics;

    STATE.day = Math.min(STATE.runtime.dayLimit, Number((STATE.day + stepSize).toFixed(6)));
    handleThresholdAudio(metrics);
    if (Math.floor(STATE.day) > previousWholeDay) {
      handleDayBoundary(Math.floor(STATE.day), metrics);
    }
    recordHistory(metrics);
    renderMapVisuals();
    renderCharts();
    renderHud();

    if (STATE.day >= STATE.runtime.dayLimit - 0.000001) {
      finishScenario();
    }
  }

  function updateMobilityStats(districts, controls) {
    const incoming = new Map(districts.map((district) => [district.id, 0]));
    const outgoing = new Map(districts.map((district) => [district.id, 0]));
    const byId = new Map(districts.map((district) => [district.id, district]));
    const hospitalInfo = getHospitalInfo(districts);

    STATE.city.edges.forEach((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      const edgeScale = getEdgeEventScale(STATE.day, from, to);
      const fromFraction = getEffectiveInfectiousCount(from, hospitalInfo) / Math.max(from.S + from.I + from.R, 1);
      const toFraction = getEffectiveInfectiousCount(to, hospitalInfo) / Math.max(to.S + to.I + to.R, 1);
      const flowAB = from.population * 0.013 * edge.weight * controls.movementMultiplier * edgeScale * (1 - controls.testing * fromFraction * 0.42);
      const flowBA = to.population * 0.013 * edge.weight * controls.movementMultiplier * edgeScale * (1 - controls.testing * toFraction * 0.42);
      outgoing.set(from.id, outgoing.get(from.id) + flowAB);
      incoming.set(to.id, incoming.get(to.id) + flowAB);
      outgoing.set(to.id, outgoing.get(to.id) + flowBA);
      incoming.set(from.id, incoming.get(from.id) + flowBA);
    });

    districts.forEach((district) => {
      district.incomingFlow = incoming.get(district.id);
      district.outgoingFlow = outgoing.get(district.id);
    });
  }

  function refreshDerivedMetrics() {
    if (!STATE.city) {
      return;
    }
    STATE.currentControls = getEffectiveControls(STATE.day);
    updateMobilityStats(STATE.city.districts, STATE.currentControls);
    STATE.currentMetrics = computeMetrics(STATE.city.districts, STATE.currentControls, STATE.publicTrust);
  }

  function getEffectiveControls(dayValue) {
    const modifiers = getEventModifiers(dayValue);
    const testing = clamp(0, STATE.city.policies.testing + modifiers.testingShift, 1);
    const protection = clamp(0, STATE.city.policies.protection * modifiers.protectionScale, 1);
    const movementMultiplier = clamp(0.08, (1 - 0.85 * STATE.city.policies.mobility) * modifiers.mobilityScale, 1.2);

    return {
      testing,
      protection,
      movementMultiplier,
      transmissionMultiplier: modifiers.transmissionMultiplier,
      recoveryBoost: modifiers.recoveryBoost,
      economicMultiplier: modifiers.economicMultiplier,
      trustDrift: modifiers.trustDrift
    };
  }

  function getEventModifiers(dayValue) {
    const modifiers = {
      mobilityScale: 1,
      testingShift: 0,
      protectionScale: 1,
      transmissionMultiplier: 1,
      recoveryBoost: 0,
      economicMultiplier: 1,
      trustDrift: 0
    };

    const activeEvents = getActiveEvents(dayValue);
    activeEvents.forEach((event) => {
      modifiers.mobilityScale *= event.effects.mobilityScale || 1;
      modifiers.testingShift += event.effects.testingShift || 0;
      modifiers.protectionScale *= event.effects.protectionScale || 1;
      modifiers.transmissionMultiplier *= event.effects.transmissionMultiplier || 1;
      modifiers.recoveryBoost += event.effects.recoveryBoost || 0;
      modifiers.economicMultiplier *= event.effects.economicMultiplier || 1;
      modifiers.trustDrift += event.effects.trustDrift || 0;
    });

    return modifiers;
  }

  function getActiveEvents(dayValue) {
    if (!STATE.scenario) {
      return [];
    }
    return [...STATE.scenario.events, ...STATE.dynamicEvents]
      .filter((event) => dayValue >= event.startDay && dayValue < event.startDay + event.duration)
      .sort((left, right) => left.startDay - right.startDay);
  }

  function getDistrictEventEffects(dayValue, district) {
    const modifiers = {
      localTransmissionMultiplier: 1,
      localMovementScale: 1,
      localRecoveryShift: 0
    };

    getActiveEvents(dayValue).forEach((event) => {
      if (!event.districtId || event.districtId !== district.id) {
        return;
      }
      modifiers.localTransmissionMultiplier *= event.effects.localTransmissionMultiplier || 1;
      modifiers.localMovementScale *= event.effects.localMovementScale || 1;
      modifiers.localRecoveryShift += event.effects.localRecoveryShift || 0;
    });

    return modifiers;
  }

  function getEdgeEventScale(dayValue, fromDistrict, toDistrict) {
    const fromEffects = getDistrictEventEffects(dayValue, fromDistrict);
    const toEffects = getDistrictEventEffects(dayValue, toDistrict);
    return Math.min(fromEffects.localMovementScale, toEffects.localMovementScale);
  }

  function generateRandomCrisisEvents(city, dayLimit) {
    const crisisCount = Math.min(5, Math.max(3, Math.floor(dayLimit / 18)));
    const events = [];
    const usedSlots = new Set();

    for (let index = 0; index < crisisCount; index += 1) {
      const template = DISTRICT_CRISIS_TEMPLATES[Math.floor(Math.random() * DISTRICT_CRISIS_TEMPLATES.length)];
      const eligibleDistricts = city.districts.filter((district) => template.eligibleTypes.includes(district.typeId));
      if (!eligibleDistricts.length) {
        continue;
      }

      const district = eligibleDistricts[Math.floor(Math.random() * eligibleDistricts.length)];
      let startDay = 6 + Math.floor(Math.random() * Math.max(3, dayLimit - 12));
      while (usedSlots.has(startDay)) {
        startDay = Math.min(dayLimit - 4, startDay + 3);
      }
      usedSlots.add(startDay);

      const duration = Math.round(randomBetween(template.durationRange[0], template.durationRange[1]));
      events.push({
        id: `crisis-${index + 1}-${template.id}-${district.id}`,
        startDay,
        duration,
        title: `${district.name}: ${template.title}`,
        body: template.body(district),
        districtId: district.id,
        source: "crisis",
        iconType: template.iconType,
        effects: { ...template.effects }
      });
    }

    return events.sort((left, right) => left.startDay - right.startDay);
  }

  function handleThresholdAudio(metrics) {
    if (metrics.hospitalUtilization >= 100 && !STATE.audioSignals.hospitalAlertArmed) {
      playSoundEffect("hospitalAlert", { volume: 0.32, playbackRate: 0.78, cooldown: 0 });
      STATE.audioSignals.hospitalAlertArmed = true;
    } else if (metrics.hospitalUtilization < 96) {
      STATE.audioSignals.hospitalAlertArmed = false;
    }
  }

  function handleDayBoundary(wholeDay, metrics) {
    playSoundEffect("newDay", { volume: 0.044, playbackRate: 1, cooldown: 0 });

    if (metrics.activeInfections < STATE.audioSignals.dayStartInfections * 0.99 && STATE.audioSignals.lastRecoveryCueDay !== wholeDay) {
      playSoundEffect("recovery", { volume: 0.24, playbackRate: 1.16, cooldown: 0 });
      STATE.audioSignals.lastRecoveryCueDay = wholeDay;
    }

    STATE.audioSignals.trackedDay = wholeDay;
    STATE.audioSignals.dayStartInfections = metrics.activeInfections;

    const weekIndex = Math.floor(wholeDay / 7);
    if (wholeDay > 0 && wholeDay % 7 === 0 && weekIndex > STATE.lastDecisionWeek && wholeDay < STATE.runtime.dayLimit) {
      openWeeklyDecisionCard(weekIndex);
    }
  }

  function openWeeklyDecisionCard(weekIndex) {
    STATE.weeklyDecisionOpen = true;
    STATE.currentDecisionWeek = weekIndex;
    STATE.currentDecisionOptions = shuffleArray(WEEKLY_DECISION_LIBRARY).slice(0, 3);
    STATE.paused = true;

    if (EL.decisionDayBadge) {
      EL.decisionDayBadge.textContent = `Week ${weekIndex}`;
    }
    if (EL.decisionCopy) {
      EL.decisionCopy.textContent = "The cabinet wants a quick call before the next week begins. Pick one option and accept the upside and the downside.";
    }

    renderWeeklyDecisionOptions();
    if (EL.decisionModal) {
      EL.decisionModal.hidden = false;
    }
    playSoundEffect("decisionNews", { volume: 0.56, playbackRate: 1, cooldown: 0 });
    renderHud();
  }

  function renderWeeklyDecisionOptions() {
    if (!EL.decisionOptions) {
      return;
    }

    EL.decisionOptions.innerHTML = "";
    STATE.currentDecisionOptions.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mayor-decision-option";
      button.dataset.decisionId = option.id;
      button.innerHTML = `
        <div class="mayor-decision-option-head">
          <div>
            <span class="mayor-decision-option-tag">${option.tag}</span>
            <h3>${option.title}</h3>
          </div>
        </div>
        <p>${option.summary}</p>
        <div class="mayor-decision-impact">
          <div class="mayor-decision-impact-box is-positive">
            <span class="mayor-decision-impact-icon" aria-hidden="true"><i class="ri-arrow-up-circle-fill"></i></span>
            <div class="mayor-decision-impact-copy">
              <strong>Upside</strong>
              <span>${option.positive}</span>
            </div>
          </div>
          <div class="mayor-decision-impact-box is-negative">
            <span class="mayor-decision-impact-icon" aria-hidden="true"><i class="ri-alert-fill"></i></span>
            <div class="mayor-decision-impact-copy">
              <strong>Tradeoff</strong>
              <span>${option.negative}</span>
            </div>
          </div>
        </div>
      `;
      EL.decisionOptions.appendChild(button);
    });
  }

  function resolveWeeklyDecision(decisionId) {
    const choice = STATE.currentDecisionOptions.find((option) => option.id === decisionId);
    if (!choice) {
      return;
    }

    applyDecisionEffects(choice);
    closeDecisionModal();
    STATE.weeklyDecisionOpen = false;
    STATE.lastDecisionWeek = STATE.currentDecisionWeek;
    STATE.currentDecisionOptions = [];
    STATE.paused = false;
    refreshDerivedMetrics();
    renderMapVisuals();
    renderCharts();
    renderHud();
    playSoundEffect("decisionPick", { volume: 0.24, playbackRate: 0.78, cooldown: 0 });
  }

  function closeDecisionModal() {
    if (EL.decisionModal) {
      EL.decisionModal.hidden = true;
    }
  }

  function applyDecisionEffects(choice) {
    const effects = choice.effects || {};
    if (effects.immediateInfectionScale) {
      STATE.city.districts.forEach((district) => {
        const reducedInfections = district.I * (1 - effects.immediateInfectionScale);
        district.I *= effects.immediateInfectionScale;
        district.R += reducedInfections;
      });
    }

    if (typeof effects.trustShift === "number") {
      STATE.publicTrust = clamp(24, STATE.publicTrust + effects.trustShift, 96);
    }

    if (typeof effects.mobilityShift === "number") {
      STATE.city.policies.mobility = clamp(0, STATE.city.policies.mobility + effects.mobilityShift, 1);
    }
    if (typeof effects.testingShift === "number") {
      STATE.city.policies.testing = clamp(0, STATE.city.policies.testing + effects.testingShift, 1);
    }
    if (typeof effects.protectionShift === "number") {
      STATE.city.policies.protection = clamp(0, STATE.city.policies.protection + effects.protectionShift, 1);
    }

    if (effects.temporary) {
      STATE.dynamicEvents.push({
        id: `decision-${choice.id}-${Math.round(STATE.day * 10)}`,
        startDay: STATE.day,
        duration: effects.temporary.duration || 7,
        title: `Cabinet move: ${choice.title}`,
        body: `${choice.summary} ${choice.positive} ${choice.negative}`,
        source: "decision",
        iconType: "decision",
        effects: {
          mobilityScale: effects.temporary.mobilityScale || 1,
          testingShift: effects.temporary.testingShift || 0,
          protectionScale: effects.temporary.protectionScale || 1,
          transmissionMultiplier: effects.temporary.transmissionMultiplier || 1,
          recoveryBoost: effects.temporary.recoveryBoost || 0,
          economicMultiplier: effects.temporary.economicMultiplier || 1,
          trustDrift: effects.temporary.trustDrift || 0
        }
      });
    }

    syncControlInputs();
  }

  function getHospitalInfo(districts) {
    const severeCases = districts.reduce((sum, district) => sum + district.I * STATE.runtime.severeRate, 0);
    const hospitalCoverage = severeCases > 0 ? Math.min(1, STATE.runtime.hospitalCapacity / severeCases) : 1;
    const hospitalizedByDistrict = new Map();

    districts.forEach((district) => {
      hospitalizedByDistrict.set(district.id, Math.min(district.I, district.I * STATE.runtime.severeRate * hospitalCoverage));
    });

    return {
      severeCases,
      hospitalCoverage,
      hospitalizedByDistrict
    };
  }

  function getEffectiveInfectiousCount(district, hospitalInfo) {
    return Math.max(0, district.I - (hospitalInfo.hospitalizedByDistrict.get(district.id) || 0));
  }

  function getEffectiveTransmissionRate(district, controls, districtEventEffects = {}) {
    const contactFactor = DISTRICT_MIX[district.typeId] || 1;
    return STATE.runtime.beta
      * (1 - 0.65 * controls.protection)
      * (1 - 0.18 * STATE.city.policies.mobility)
      * controls.transmissionMultiplier
      * (districtEventEffects.localTransmissionMultiplier || 1)
      * contactFactor;
  }

  function getEffectiveRecoveryRate(controls, districtEventEffects = {}) {
    return clamp(
      0.025,
      (STATE.runtime.gammaRate * (1 + 1.1 * controls.testing))
      + controls.recoveryBoost
      + (districtEventEffects.localRecoveryShift || 0),
      0.6
    );
  }

  function computeMetrics(districts, controls, trustValue) {
    const totalPopulation = districts.reduce((sum, district) => sum + district.population, 0);
    const totalSusceptible = districts.reduce((sum, district) => sum + district.S, 0);
    const totalInfected = districts.reduce((sum, district) => sum + district.I, 0);
    const totalRecovered = districts.reduce((sum, district) => sum + district.R, 0);
    const activeFraction = totalInfected / Math.max(totalPopulation, 1);
    const susceptibleFraction = totalSusceptible / Math.max(totalPopulation, 1);
    const hospitalInfo = getHospitalInfo(districts);
    const hospitalUtilization = (hospitalInfo.severeCases / STATE.runtime.hospitalCapacity) * 100;
    const workforceAvailability = (totalSusceptible + (0.8 * totalInfected) + (0.9 * totalRecovered)) / Math.max(totalPopulation, 1);
    const economyUtilization = clamp(
      18,
      100 * workforceAvailability * (
        1
        - 0.62 * Math.pow(STATE.city.policies.mobility, 1.45)
        - 0.12 * controls.testing
        - 0.09 * controls.protection
        - 0.18 * Math.max(0, hospitalUtilization - 100) / 100
      ) * controls.economicMultiplier,
      100
    );
    const hospitalRecoveryBoost = 1 + (0.5 * STATE.runtime.severeRate * hospitalInfo.hospitalCoverage);
    const recoveryRate = getEffectiveRecoveryRate(controls);
    const transmissionRate = STATE.runtime.beta
      * controls.transmissionMultiplier
      * (1 - 0.65 * controls.protection)
      * (1 - 0.18 * STATE.city.policies.mobility);
    const spreadRate = clamp(
      0.25,
      (transmissionRate
        / (Math.max(recoveryRate, 0.05) * hospitalRecoveryBoost))
        * susceptibleFraction
        * (0.45 + 0.5 * controls.movementMultiplier)
        * 0.58,
      4.5
    );
    const scoreSample = 100 * ((economyUtilization / 200) + (susceptibleFraction / 2));

    const peakHospital = Math.max(STATE.stats.peakHospital, hospitalUtilization);
    const cumulativeInfections = totalPopulation - totalSusceptible;

    return {
      totalPopulation,
      activeInfections: totalInfected,
      susceptible: totalSusceptible,
      susceptibleFraction,
      recovered: totalRecovered,
      cumulativeInfections,
      spreadRate,
      hospitalUtilization,
      economyUtilization,
      publicTrust: trustValue,
      peakHospital,
      activeFraction,
      scoreSample
    };
  }

  function updateTrust(metrics, controls, stepSize = 1) {
    const dailyTrustShift = 0.55 * controls.testing
      + 0.35 * controls.protection
      - 15 * metrics.activeFraction
      - 0.04 * Math.max(0, metrics.hospitalUtilization - 90)
      - 1.7 * Math.max(0, STATE.city.policies.mobility - 0.75) * 2
      + (metrics.economyUtilization > 80 ? 0.35 : -0.2)
      + controls.trustDrift;

    return clamp(24, STATE.publicTrust + (dailyTrustShift * stepSize), 96);
  }

  function recordHistory(metrics) {
    STATE.stats.peakHospital = Math.max(STATE.stats.peakHospital, metrics.hospitalUtilization);
    STATE.stats.peakActive = Math.max(STATE.stats.peakActive, metrics.activeInfections);
    STATE.stats.cumulativeInfections = Math.max(STATE.stats.cumulativeInfections, metrics.cumulativeInfections);
    STATE.stats.sumEconomy += metrics.economyUtilization;
    STATE.stats.sumScore += metrics.scoreSample;
    STATE.stats.samples += 1;

    const runningScore = STATE.stats.sumScore / Math.max(STATE.stats.samples, 1);

    STATE.history.days.push(STATE.day);
    STATE.history.activeInfections.push(metrics.activeInfections);
    STATE.history.spreadRate.push(metrics.spreadRate);
    STATE.history.hospitalUtilization.push(metrics.hospitalUtilization);
    STATE.history.economyUtilization.push(metrics.economyUtilization);
    STATE.history.mobilityPolicy.push(STATE.city.policies.mobility);
    STATE.history.testingPolicy.push(STATE.city.policies.testing);
    STATE.history.protectionPolicy.push(STATE.city.policies.protection);
    STATE.history.score.push(runningScore);
  }

  function renderHud() {
    if (!STATE.city || !STATE.currentMetrics || !STATE.history) {
      return;
    }

    const metrics = STATE.currentMetrics;
    const runningScore = STATE.stats.samples ? STATE.stats.sumScore / STATE.stats.samples : metrics.scoreSample;
    const displayDay = STATE.finished
      ? STATE.runtime.dayLimit
      : Math.min(STATE.runtime.dayLimit, Math.floor(STATE.day) + 1);

    EL.heroActive.textContent = formatCompactNumber(metrics.activeInfections);
    EL.heroRt.textContent = formatDecimal(metrics.spreadRate);
    EL.heroHospital.textContent = `${Math.round(metrics.hospitalUtilization)}%`;
    EL.heroEconomy.textContent = `${Math.round(metrics.economyUtilization)}%`;
    EL.heroTrust.textContent = `${Math.round(STATE.publicTrust)}`;
    EL.heroScore.textContent = `${Math.round(runningScore)}`;
    setStatusTone(EL.heroActive, getMetricTone("active", metrics.activeFraction));
    setStatusTone(EL.heroRt, getMetricTone("spread", metrics.spreadRate));
    setStatusTone(EL.heroHospital, getMetricTone("hospital", metrics.hospitalUtilization));
    setStatusTone(EL.heroEconomy, getMetricTone("economy", metrics.economyUtilization));
    setStatusTone(EL.heroTrust, getMetricTone("trust", STATE.publicTrust));
    clearStatusTone(EL.heroDays);
    setStatusTone(EL.heroScore, getMetricTone("score", runningScore));

    EL.heroStatusPill.textContent = metrics.hospitalUtilization > 100 ? 'Hospital strain' : metrics.spreadRate > 1.15 ? 'Containment race' : 'Response stabilizing';
    EL.heroStatusPill.className = 'mayor-status-pill';
    if (metrics.hospitalUtilization > 100) {
      EL.heroStatusPill.classList.add('is-danger');
    } else if (metrics.spreadRate > 1.15) {
      EL.heroStatusPill.classList.add('is-alert');
    }

    EL.scenarioBadge.textContent = STATE.scenario.label;
    EL.dayCounter.textContent = String(displayDay);
    EL.dayLimit.textContent = String(STATE.runtime.dayLimit);

    EL.policyMobilityValue.textContent = formatDecimal(STATE.city.policies.mobility);
    EL.policyTestingValue.textContent = formatDecimal(STATE.city.policies.testing);
    EL.policyProtectionValue.textContent = formatDecimal(STATE.city.policies.protection);
    EL.policyMobilityCopy.textContent = getPolicyCopy('mobility', STATE.city.policies.mobility);
    EL.policyTestingCopy.textContent = getPolicyCopy('testing', STATE.city.policies.testing);
    EL.policyProtectionCopy.textContent = getPolicyCopy('protection', STATE.city.policies.protection);

    EL.pauseButton.disabled = STATE.paused || STATE.finished || STATE.weeklyDecisionOpen;
    EL.resumeButton.disabled = !STATE.paused || STATE.finished || STATE.weeklyDecisionOpen;
    if (STATE.finished) {
      EL.pauseButton.classList.add('is-secondary');
      EL.resumeButton.classList.add('is-secondary');
    } else {
      EL.pauseButton.classList.toggle('is-secondary', STATE.paused);
      EL.resumeButton.classList.toggle('is-secondary', !STATE.paused);
    }
    EL.speedButtons.forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.speed) === STATE.speedMultiplier);
    });

    EL.chartActiveLabel.textContent = formatCompactNumber(metrics.activeInfections);
    EL.chartRtLabel.textContent = formatDecimal(metrics.spreadRate);
    EL.chartHospitalLabel.textContent = `${Math.round(metrics.hospitalUtilization)}%`;
    EL.chartEconomyLabel.textContent = `${Math.round(metrics.economyUtilization)}%`;

    renderEventCard();
    renderDistrictDetail();
    renderAdvisorDesk(metrics);
  }

  function renderAdvisorDesk(metrics) {
    if (!EL.advisorHealthCopy || !EL.advisorEconomyCopy || !EL.advisorTrustCopy) {
      return;
    }

    const activeCrises = getActiveEvents(STATE.day).filter((event) => event.source === "crisis");
    const liveCrisis = activeCrises[0];

    EL.advisorHealthCopy.textContent = metrics.hospitalUtilization > 100
      ? "Health advisor: hospitals are overloaded now. Buy recovery time immediately or the clinical side will start writing the story for you."
      : metrics.spreadRate > 1.08
        ? "Health advisor: the wave is still expanding. Push testing or protection before the next district turns orange."
        : metrics.activeInfections < STATE.audioSignals.dayStartInfections
          ? "Health advisor: cases are easing today. Hold steady long enough and the city can actually bank the improvement."
          : "Health advisor: transmission is contained for the moment, but the city is still one careless week from a rebound.";

    EL.advisorEconomyCopy.textContent = metrics.economyUtilization < 58
      ? "Economic advisor: storefront energy is thinning out. Even a modest relief action would help stop the drag from compounding."
      : metrics.economyUtilization > 82
        ? "Economic advisor: the city is still moving. Protect that momentum without giving the outbreak cheap openings."
        : "Economic advisor: output is middling. Your next cabinet choice will decide whether this becomes resilience or stagnation.";

    EL.advisorTrustCopy.textContent = liveCrisis
      ? `Civic advisor: ${liveCrisis.title.toLowerCase()} is reshaping the mood. Residents want to see that your response matches the local problem.`
      : STATE.publicTrust < 55
        ? "Civic advisor: trust is brittle. If the next move looks inconsistent, compliance will fade before the numbers do."
        : "Civic advisor: public sentiment is workable. Clear decisions and visible follow-through can still keep people with you.";

    const healthLevel = clamp(
      8,
      100
      - metrics.activeFraction * 1100
      - Math.max(metrics.spreadRate - 1, 0) * 28
      - Math.max(metrics.hospitalUtilization - 80, 0) * 0.55,
      100
    );
    const economyLevel = clamp(8, metrics.economyUtilization, 100);
    const trustLevel = clamp(8, STATE.publicTrust, 100);

    renderAdvisorVisual(
      EL.advisorHealthMeter,
      EL.advisorHealthChart,
      healthLevel,
      [
        clamp(18, 100 - metrics.spreadRate * 26, 96),
        clamp(18, 100 - metrics.hospitalUtilization * 0.52, 96),
        clamp(18, 100 - metrics.activeFraction * 1450, 96),
        clamp(18, 100 - Math.max(metrics.hospitalUtilization - 100, 0) * 1.1, 96),
        clamp(18, healthLevel, 96)
      ]
    );
    renderAdvisorVisual(
      EL.advisorEconomyMeter,
      EL.advisorEconomyChart,
      economyLevel,
      [
        clamp(18, metrics.economyUtilization * 0.72, 96),
        clamp(18, (1 - STATE.city.policies.mobility) * 92, 96),
        clamp(18, (1 - STATE.city.policies.testing * 0.35) * 82, 96),
        clamp(18, (1 - metrics.activeFraction * 7.5) * 86, 96),
        clamp(18, economyLevel, 96)
      ]
    );
    renderAdvisorVisual(
      EL.advisorTrustMeter,
      EL.advisorTrustChart,
      trustLevel,
      [
        clamp(18, STATE.publicTrust * 0.62, 96),
        clamp(18, (1 - Math.max(metrics.spreadRate - 1, 0) * 0.38) * 86, 96),
        clamp(18, (1 - Math.max(100 - metrics.economyUtilization, 0) * 0.008) * 82, 96),
        clamp(18, (1 - activeCrises.length * 0.16) * 84, 96),
        clamp(18, trustLevel, 96)
      ]
    );
  }

  function renderAdvisorVisual(meterEl, chartEl, level, bars) {
    if (meterEl) {
      meterEl.style.width = `${clamp(8, level, 100).toFixed(1)}%`;
    }
    if (!chartEl) {
      return;
    }
    Array.from(chartEl.children).forEach((bar, index) => {
      const value = Array.isArray(bars) ? bars[index] : level;
      bar.style.height = `${clamp(18, value ?? level, 100).toFixed(1)}%`;
    });
  }

  function renderEventCard() {
    if (!EL.eventCard) {
      return;
    }

    const activeEvents = getActiveEvents(STATE.day);
    const activeIds = new Set(activeEvents.map((event) => event.id));
    const startedEvents = activeEvents.filter((event) => !STATE.activeEventIds.has(event.id));
    STATE.activeEventIds = activeIds;

    STATE.dismissedEventIds = new Set(
      [...STATE.dismissedEventIds].filter((eventId) => activeIds.has(eventId))
    );

    if (startedEvents.length) {
      STATE.latestEvent = startedEvents[startedEvents.length - 1];
      STATE.eventPanelEventId = STATE.latestEvent.id;
    } else if (activeEvents.length) {
      STATE.latestEvent = activeEvents[activeEvents.length - 1];
    }

    const visibleEvents = activeEvents.filter((event) => !STATE.dismissedEventIds.has(event.id));
    if (!visibleEvents.length) {
      EL.eventCard.innerHTML = "";
      STATE.eventPanelEventId = null;
      hideFloatingPanel("event");
      return;
    }

    if (!visibleEvents.some((event) => event.id === STATE.eventPanelEventId)) {
      STATE.eventPanelEventId = visibleEvents[visibleEvents.length - 1].id;
    }

    showFloatingPanel("event");
    EL.eventCard.innerHTML = visibleEvents
      .map((event) => buildEventToastMarkup(event, event.id === STATE.eventPanelEventId))
      .join("");
  }

  function buildEventToastMarkup(event, isFeatured = false) {
    const startDay = Math.max(0, Math.round(event.startDay));
    const eventEnd = Math.max(startDay, Math.round(Math.min(STATE.runtime.dayLimit, event.startDay + event.duration)));
    const windowTone = getEventWindowTone(event);
    const sourceLabel = getEventSourceLabel(event);
    const safeTitle = escapeHtml(event.title);
    const safeBody = escapeHtml(buildEventDescription(event));

    return `
      <article class="mayor-event-toast${isFeatured ? " is-live-event" : ""}" data-event-id="${event.id}">
        <div class="mayor-event-toast-head">
          <div class="mayor-event-toast-meta">
            <span class="mayor-event-toast-label"><i class="ri-megaphone-line" aria-hidden="true"></i>${sourceLabel}</span>
            <h4>${safeTitle}</h4>
            <span class="mayor-event-toast-window${windowTone ? ` ${windowTone}` : ""}"><i class="ri-calendar-event-line" aria-hidden="true"></i>Day ${startDay} to ${eventEnd}</span>
          </div>
          <button class="mayor-panel-close" type="button" data-event-dismiss="${event.id}" aria-label="Dismiss city event">${"X"}</button>
        </div>
        <p>${safeBody}</p>
      </article>
    `;
  }

  function getEventWindowTone(event) {
    const transmissionPressure = Math.max(
      event.effects.transmissionMultiplier || 1,
      event.effects.localTransmissionMultiplier || 1
    );
    if (transmissionPressure > 1.05) {
      return "is-danger";
    }
    if (transmissionPressure > 1) {
      return "is-alert";
    }
    return "";
  }

  function getEventSourceLabel(event) {
    if (event.source === "crisis") {
      return "District crisis";
    }
    if (event.source === "decision") {
      return "Cabinet effect";
    }
    return "City event";
  }

  function buildEventDescription(event) {
    const impactSummary = describeEventImpacts(event.effects || {});
    if (!impactSummary) {
      return event.body;
    }
    return `${event.body} Impact: ${impactSummary}`;
  }

  function describeEventImpacts(effects) {
    const impacts = [];

    if (typeof effects.localTransmissionMultiplier === "number") {
      if (effects.localTransmissionMultiplier > 1.01) impacts.push("local transmission rises");
      if (effects.localTransmissionMultiplier < 0.99) impacts.push("local transmission eases");
    }

    if (typeof effects.transmissionMultiplier === "number") {
      if (effects.transmissionMultiplier > 1.01) impacts.push("citywide spread pressure rises");
      if (effects.transmissionMultiplier < 0.99) impacts.push("citywide spread pressure falls");
    }

    if (typeof effects.localMovementScale === "number" && effects.localMovementScale < 0.99) {
      impacts.push("district traffic tightens");
    }

    if (typeof effects.mobilityScale === "number") {
      if (effects.mobilityScale > 1.01) impacts.push("cross-city movement grows");
      if (effects.mobilityScale < 0.99) impacts.push("cross-city movement slows");
    }

    if ((effects.recoveryBoost || 0) > 0 || (effects.localRecoveryShift || 0) > 0) {
      impacts.push("recovery improves");
    }
    if ((effects.recoveryBoost || 0) < 0 || (effects.localRecoveryShift || 0) < 0) {
      impacts.push("recovery slows");
    }

    if (typeof effects.economicMultiplier === "number") {
      if (effects.economicMultiplier > 1.01) impacts.push("economic activity strengthens");
      if (effects.economicMultiplier < 0.99) impacts.push("economic activity softens");
    }

    if (typeof effects.trustDrift === "number") {
      if (effects.trustDrift > 0.05) impacts.push("trust drifts upward");
      if (effects.trustDrift < -0.05) impacts.push("trust drifts downward");
    }

    if (!impacts.length) {
      return "";
    }

    return `${impacts.slice(0, 3).join(", ")}.`;
  }

  function renderDistrictDetail() {
    if (!STATE.city) {
      return;
    }

    const district = STATE.districtIndex.get(STATE.selectedDistrictId) || STATE.city.districts[0];
    const total = district.S + district.I + district.R;
    const infectionRate = district.I / Math.max(total, 1);
    const infectionPercent = infectionRate * 100;
    const mobilityShare = (district.incomingFlow + district.outgoingFlow) / Math.max(district.population, 1);
    const mobilityIntensity = mobilityShare * 100;
    const visualState = getDistrictVisualState(district, infectionRate, mobilityShare);

    if (EL.districtCardTitle) {
      EL.districtCardTitle.textContent = district.name;
    }

    EL.districtDetailPanel.innerHTML = `
      <div class='mayor-detail-compact-chips'>
        <span class='mayor-detail-type'><i class='ri-map-pin-2-line' aria-hidden='true'></i>${district.typeLabel}</span>
        <span class='mayor-detail-chip'><i class='ri-radar-line' aria-hidden='true'></i>${visualState.statusLabel}</span>
      </div>
      <div class='mayor-detail-rows'>
        <div class='mayor-detail-row'><span><i class='ri-group-line' aria-hidden='true'></i>Population</span><strong>${formatCompactNumber(total)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-user-follow-line' aria-hidden='true'></i>Susceptible</span><strong>${formatCompactNumber(district.S)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-virus-line' aria-hidden='true'></i>Infectious</span><strong>${formatCompactNumber(district.I)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-shield-check-line' aria-hidden='true'></i>Recovered</span><strong>${formatCompactNumber(district.R)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-focus-3-line' aria-hidden='true'></i>Local infection</span><strong>${formatPercent(infectionPercent)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-arrow-left-right-line' aria-hidden='true'></i>Incoming mobility</span><strong>${formatCompactNumber(district.incomingFlow)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-route-line' aria-hidden='true'></i>Outgoing mobility</span><strong>${formatCompactNumber(district.outgoingFlow)}</strong></div>
        <div class='mayor-detail-row'><span><i class='ri-road-map-line' aria-hidden='true'></i>Mobility intensity</span><strong>${formatPercent(mobilityIntensity)}</strong></div>
      </div>
    `;
  }
  function renderCharts() {
    if (!STATE.history) {
      return;
    }

    const markers = STATE.history.policyMarkers || [];

    renderLineChart(EL.chartActive, {
      series: [{ name: 'Active', color: '#ef4444', values: STATE.history.activeInfections, fill: true }],
      days: STATE.history.days,
      markers,
      maxValue: Math.max(300, Math.max(...STATE.history.activeInfections, 0) * 1.15)
    });

    renderLineChart(EL.chartRt, {
      series: [{ name: 'R_t', color: '#2563eb', values: STATE.history.spreadRate, fill: true }],
      days: STATE.history.days,
      markers,
      minValue: 0,
      maxValue: Math.max(2.6, Math.max(...STATE.history.spreadRate, 0) * 1.15),
      threshold: 1
    });

    renderLineChart(EL.chartHospital, {
      series: [{ name: 'Hospital', color: '#f97316', values: STATE.history.hospitalUtilization, fill: true }],
      days: STATE.history.days,
      markers,
      minValue: 0,
      maxValue: Math.max(120, Math.max(...STATE.history.hospitalUtilization, 0) * 1.15),
      threshold: 100
    });

    renderLineChart(EL.chartEconomy, {
      series: [{ name: 'Economy', color: '#10b981', values: STATE.history.economyUtilization, fill: true }],
      days: STATE.history.days,
      markers,
      minValue: 0,
      maxValue: 100,
      threshold: 70
    });

    renderLineChart(EL.chartPolicy, {
      series: [
        { name: 'Mobility', color: '#2563eb', values: STATE.history.mobilityPolicy },
        { name: 'Testing', color: '#f97316', values: STATE.history.testingPolicy },
        { name: 'Protection', color: '#10b981', values: STATE.history.protectionPolicy }
      ],
      days: STATE.history.days,
      minValue: 0,
      maxValue: 1,
      endLabels: true
    });
  }
  function renderLineChart(svg, config) {
    if (!svg) {
      return;
    }

    const width = svg.viewBox.baseVal.width || 520;
    const height = svg.viewBox.baseVal.height || 220;
    const padding = { top: 18, right: 26, bottom: 28, left: 46 };
    const days = config.days || [];
    const allValues = config.series.flatMap((series) => series.values);
    const minValue = typeof config.minValue === 'number' ? config.minValue : 0;
    const maxValue = typeof config.maxValue === 'number' ? config.maxValue : Math.max(...allValues, 1);
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const totalDays = STATE.runtime ? STATE.runtime.dayLimit : 1;

    svg.innerHTML = '';

    for (let i = 0; i <= 4; i += 1) {
      const y = padding.top + (innerHeight / 4) * i;
      svg.appendChild(createSvgEl('line', { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: 'chart-grid-line' }));
      const labelValue = maxValue - ((maxValue - minValue) / 4) * i;
      svg.appendChild(createSvgEl('text', { x: 10, y: y + 4, class: 'chart-label' }, formatTick(labelValue, maxValue <= 1.2 ? 2 : maxValue < 5 ? 1 : 0)));
    }

    svg.appendChild(createSvgEl('line', { x1: padding.left, y1: height - padding.bottom, x2: width - padding.right, y2: height - padding.bottom, class: 'chart-axis' }));
    svg.appendChild(createSvgEl('line', { x1: padding.left, y1: padding.top, x2: padding.left, y2: height - padding.bottom, class: 'chart-axis' }));

    [0, Math.floor(totalDays / 2), totalDays].forEach((dayLabel) => {
      const x = padding.left + (dayLabel / Math.max(totalDays, 1)) * innerWidth;
      svg.appendChild(createSvgEl('text', { x, y: height - 6, class: 'chart-label', 'text-anchor': 'middle' }, `Day ${dayLabel}`));
    });

    if (typeof config.threshold === 'number') {
      const thresholdY = scaleY(config.threshold, minValue, maxValue, padding.top, innerHeight);
      svg.appendChild(createSvgEl('line', { x1: padding.left, y1: thresholdY, x2: width - padding.right, y2: thresholdY, class: 'chart-threshold' }));
      svg.appendChild(createSvgEl('text', { x: width - padding.right, y: thresholdY - 6, class: 'chart-label', 'text-anchor': 'end' }, `Target ${formatTick(config.threshold, config.threshold < 3 ? 1 : 0)}`));
    }

    config.series.forEach((series) => {
      const points = series.values.map((value, index) => {
        const x = padding.left + ((days[index] || 0) / Math.max(totalDays, 1)) * innerWidth;
        const y = scaleY(value, minValue, maxValue, padding.top, innerHeight);
        return [x, y];
      });

      if (!points.length) {
        return;
      }

      if (series.fill) {
        const fillPoints = [[points[0][0], height - padding.bottom], ...points, [points[points.length - 1][0], height - padding.bottom]];
        svg.appendChild(createSvgEl('path', { d: pointsToPath(fillPoints), class: 'chart-fill', fill: series.color }));
      }

      svg.appendChild(createSvgEl('path', { d: pointsToPath(points), class: 'chart-line', stroke: series.color }));
      const last = points[points.length - 1];
      svg.appendChild(createSvgEl('circle', { cx: last[0], cy: last[1], r: 4.5, class: 'chart-dot', fill: series.color }));

      if (config.endLabels !== false) {
        svg.appendChild(createSvgEl('text', { x: Math.min(width - 8, last[0] + 8), y: last[1] - 8, class: 'chart-label' }, series.name));
      }
    });

    if (Array.isArray(config.markers) && config.markers.length) {
      const groupedMarkers = new Map();
      config.markers.forEach((marker) => {
        const markerDay = clamp(0, marker.day, totalDays);
        const existing = groupedMarkers.get(markerDay) || [];
        existing.push(marker);
        groupedMarkers.set(markerDay, existing);
      });

      config.markers.forEach((marker) => {
        const markerDay = clamp(0, marker.day, totalDays);
        const dayMarkers = groupedMarkers.get(markerDay) || [marker];
        const offsetIndex = dayMarkers.indexOf(marker);
        const offset = (offsetIndex - (dayMarkers.length - 1) / 2) * 3;
        const x = padding.left + (markerDay / Math.max(totalDays, 1)) * innerWidth + offset;
        svg.appendChild(createSvgEl('line', { x1: x, y1: padding.top, x2: x, y2: height - padding.bottom, class: 'chart-policy-marker' }));
      });
    }
  }
  function renderMiniScoreChart(svg, days, values) {
    if (!svg) {
      return;
    }

    const width = svg.viewBox.baseVal.width || 280;
    const height = svg.viewBox.baseVal.height || 120;
    const padding = { top: 16, right: 12, bottom: 22, left: 28 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const totalDays = STATE.runtime ? Math.max(STATE.runtime.dayLimit, 1) : 1;

    svg.innerHTML = "";
    svg.appendChild(createSvgEl("rect", { x: 0, y: 0, width, height, rx: 18, fill: "rgba(248, 250, 252, 0.28)" }));

    [0, 25, 50, 75, 100].forEach((tick) => {
      const y = scaleY(tick, 0, 100, padding.top, innerHeight);
      svg.appendChild(createSvgEl("line", { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: "chart-grid-line" }));
      svg.appendChild(createSvgEl("text", { x: 2, y: y + 4, class: "chart-label summary-axis-tick" }, String(tick)));
    });

    svg.appendChild(createSvgEl("line", { x1: padding.left, y1: padding.top, x2: padding.left, y2: height - padding.bottom, class: "chart-axis" }));
    svg.appendChild(createSvgEl("line", { x1: padding.left, y1: height - padding.bottom, x2: width - padding.right, y2: height - padding.bottom, class: "chart-axis" }));
    [0, Math.floor(totalDays / 2), totalDays].forEach((dayLabel) => {
      const x = padding.left + (dayLabel / Math.max(totalDays, 1)) * innerWidth;
      svg.appendChild(createSvgEl("text", { x, y: height - 4, class: "chart-label summary-axis-tick", "text-anchor": "middle" }, `D${dayLabel}`));
    });

    const targetY = scaleY(70, 0, 100, padding.top, innerHeight);
    svg.appendChild(createSvgEl("line", { x1: padding.left, y1: targetY, x2: width - padding.right, y2: targetY, class: "chart-threshold" }));
    svg.appendChild(createSvgEl("text", { x: width - padding.right, y: targetY - 4, class: "chart-label summary-axis-note", "text-anchor": "end" }, "Guide 70"));

    if (!Array.isArray(values) || !values.length) {
      svg.appendChild(createSvgEl("text", { x: width / 2, y: height / 2, class: "chart-label summary-axis-note", "text-anchor": "middle" }, "No score history"));
      return;
    }

    const points = values.map((value, index) => {
      const x = padding.left + ((days[index] || 0) / totalDays) * innerWidth;
      const y = scaleY(value, 0, 100, padding.top, innerHeight);
      return [x, y];
    });

    svg.appendChild(createSvgEl("path", { d: pointsToPath(points), class: "chart-line", stroke: "#2563eb" }));

    const last = points[points.length - 1];
    svg.appendChild(createSvgEl("circle", { cx: last[0], cy: last[1], r: 4.5, class: "chart-dot", fill: "#1d4ed8" }));
    svg.appendChild(createSvgEl("text", { x: width - padding.right, y: 12, class: "chart-label summary-axis-note", "text-anchor": "end" }, "Score"));
  }

  function renderMapScaffold() {
    const svg = EL.cityMap;
    svg.innerHTML = "";
    STATE.svgRefs = {
      skyGlow: null,
      nightShade: null,
      sun: null,
      moon: null,
      starField: [],
      decorLayer: null,
      roadGlows: new Map(),
      roadFlows: new Map(),
      districtGroups: new Map(),
      districtAuras: new Map(),
      districtPulses: new Map(),
      districtRings: new Map(),
      districtShells: new Map(),
      districtGlosses: new Map(),
      districtLabels: new Map(),
      districtPercents: new Map(),
      districtSubs: new Map(),
      agentDots: []
    };

    const backdrop = createSvgEl("g");
    backdrop.appendChild(createSvgEl("ellipse", { cx: 136, cy: 426, rx: 98, ry: 60, fill: "rgba(34, 197, 94, 0.10)" }));
    backdrop.appendChild(createSvgEl("ellipse", { cx: 720, cy: 114, rx: 82, ry: 42, fill: "rgba(34, 197, 94, 0.08)" }));
    backdrop.appendChild(createSvgEl("ellipse", { cx: 768, cy: 462, rx: 62, ry: 34, fill: "rgba(148, 163, 184, 0.08)" }));
    svg.appendChild(backdrop);
    STATE.svgRefs.skyGlow = null;
    STATE.svgRefs.nightShade = null;
    STATE.svgRefs.sun = null;
    STATE.svgRefs.moon = null;
    STATE.svgRefs.starField = [];

    const roadLayer = createSvgEl("g");
    STATE.city.edges.forEach((edge) => {
      const pathD = buildEdgePath(edge);
      const glowPath = createSvgEl("path", { d: pathD, class: "mayor-road-glow" });
      roadLayer.appendChild(glowPath);
      roadLayer.appendChild(createSvgEl("path", { d: pathD, class: "mayor-road-base" }));
      const flowPath = createSvgEl("path", { d: pathD, class: "mayor-road-flow" });
      roadLayer.appendChild(flowPath);
      STATE.svgRefs.roadGlows.set(edge.id, glowPath);
      STATE.svgRefs.roadFlows.set(edge.id, flowPath);
    });
    svg.appendChild(roadLayer);

    const districtLayer = createSvgEl("g");
    STATE.city.districts.forEach((district) => {
      const group = createSvgEl("g", { class: "mayor-district-group is-calm", tabindex: "0", role: "button" });
      group.dataset.id = district.id;

      const aura = createSvgEl("circle", {
        cx: district.x,
        cy: district.y,
        r: district.size + 18,
        class: "mayor-district-aura"
      });
      const pulse = createSvgEl("circle", {
        cx: district.x,
        cy: district.y,
        r: district.size + 10,
        class: "mayor-district-pulse"
      });
      const selection = createSvgEl("circle", {
        cx: district.x,
        cy: district.y,
        r: district.size + 16,
        class: "mayor-district-selection"
      });
      const ring = createSvgEl("circle", {
        cx: district.x,
        cy: district.y,
        r: district.size + 10,
        class: "mayor-district-ring"
      });
      const shell = createSvgEl("circle", {
        cx: district.x,
        cy: district.y,
        r: district.size,
        class: "mayor-district-shell"
      });
      const gloss = createSvgEl("ellipse", {
        cx: district.x - district.size * 0.18,
        cy: district.y - district.size * 0.24,
        rx: district.size * 0.5,
        ry: district.size * 0.26,
        class: "mayor-district-gloss"
      });

      const label = createSvgEl("text", { x: district.x, y: district.y + district.size + 36, class: "mayor-district-label" }, district.name);
      const sub = createSvgEl("text", { x: district.x, y: district.y + district.size + 52, class: "mayor-district-sub" }, district.typeLabel);
      const percent = createSvgEl("text", { x: district.x, y: district.y + 6, class: "mayor-district-percent" }, "");
      const icon = createDistrictIcon(district);

      group.appendChild(aura);
      group.appendChild(pulse);
      group.appendChild(selection);
      group.appendChild(ring);
      group.appendChild(shell);
      group.appendChild(gloss);
      group.appendChild(icon);
      group.appendChild(percent);
      group.appendChild(label);
      group.appendChild(sub);
      addDistrictListeners(group, district.id);
      districtLayer.appendChild(group);

      STATE.svgRefs.districtGroups.set(district.id, group);
      STATE.svgRefs.districtAuras.set(district.id, aura);
      STATE.svgRefs.districtPulses.set(district.id, pulse);
      STATE.svgRefs.districtRings.set(district.id, ring);
      STATE.svgRefs.districtShells.set(district.id, shell);
      STATE.svgRefs.districtGlosses.set(district.id, gloss);
      STATE.svgRefs.districtLabels.set(district.id, label);
      STATE.svgRefs.districtPercents.set(district.id, percent);
      STATE.svgRefs.districtSubs.set(district.id, sub);
    });
    svg.appendChild(districtLayer);

    const decorLayer = createSvgEl("g");
    svg.appendChild(decorLayer);
    STATE.svgRefs.decorLayer = decorLayer;

    const agentLayer = createSvgEl("g");
    svg.appendChild(agentLayer);
    STATE.svgRefs.agentLayer = agentLayer;

  }

  function addDistrictListeners(group, districtId) {
    group.addEventListener("click", () => selectDistrict(districtId));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectDistrict(districtId);
      }
    });
    group.addEventListener("mouseenter", (event) => {
      const district = STATE.districtIndex.get(districtId);
      const total = district.S + district.I + district.R;
      const rate = (district.I / Math.max(total, 1)) * 100;
      showTooltip(`${district.name}: ${formatPercent(rate)} infected`, event.currentTarget);
    });
    group.addEventListener("mouseleave", hideTooltip);
    group.addEventListener("focus", (event) => {
      const district = STATE.districtIndex.get(districtId);
      const total = district.S + district.I + district.R;
      const rate = (district.I / Math.max(total, 1)) * 100;
      showTooltip(`${district.name}: ${formatPercent(rate)} infected`, event.currentTarget);
    });
    group.addEventListener("blur", hideTooltip);
  }

  function renderMapVisuals() {
    if (!STATE.city || !STATE.currentControls) {
      return;
    }

    const controls = STATE.currentControls;
    const hospitalInfo = getHospitalInfo(STATE.city.districts);
    STATE.city.edges.forEach((edge) => {
      const glowPath = STATE.svgRefs.roadGlows.get(edge.id);
      const flowPath = STATE.svgRefs.roadFlows.get(edge.id);
      const from = STATE.districtIndex.get(edge.from);
      const to = STATE.districtIndex.get(edge.to);
      const fromTotal = from.S + from.I + from.R;
      const toTotal = to.S + to.I + to.R;
      const infectedMix = (
        (getEffectiveInfectiousCount(from, hospitalInfo) / Math.max(fromTotal, 1))
        + (getEffectiveInfectiousCount(to, hospitalInfo) / Math.max(toTotal, 1))
      ) / 2;
      const trafficIntensity = clamp(0, edge.weight * controls.movementMultiplier * 1.15, 1);
      const contagionIntensity = clamp(0, infectedMix * (2.4 - controls.testing * 0.55), 1);
      const roadStress = clamp(0, (trafficIntensity * 0.55) + (contagionIntensity * 0.8), 1);
      const edgeEventScale = getEdgeEventScale(STATE.day, from, to);
      const strokeWidth = 4.5 + edge.weight * 9 * controls.movementMultiplier + roadStress * 4.2;
      const tint = roadStress > 0.72
        ? "rgba(239, 68, 68, 0.8)"
        : roadStress > 0.44
          ? "rgba(249, 115, 22, 0.75)"
          : "rgba(37, 99, 235, 0.42)";
      const glowTint = roadStress > 0.72
        ? "rgba(239, 68, 68, 0.42)"
        : roadStress > 0.44
          ? "rgba(249, 115, 22, 0.34)"
          : "rgba(14, 165, 233, 0.22)";

      if (glowPath) {
        glowPath.setAttribute("stroke-width", (strokeWidth + 6 + roadStress * 10).toFixed(1));
        glowPath.setAttribute("stroke", glowTint);
        glowPath.setAttribute("opacity", (0.22 + trafficIntensity * 0.38 + roadStress * 0.24).toFixed(2));
        glowPath.style.setProperty("--road-glow-duration", `${clamp(1.1, 3.2 - trafficIntensity * 1.2 - roadStress * 0.9, 3.6).toFixed(2)}s`);
      }

      flowPath.setAttribute("stroke-width", strokeWidth.toFixed(1));
      flowPath.setAttribute("stroke", tint);
      flowPath.setAttribute("opacity", (0.34 + trafficIntensity * 0.48 + roadStress * 0.16).toFixed(2));
      flowPath.style.setProperty("--flow-duration", `${clamp(0.9, 3.3 - trafficIntensity * 1.45 - roadStress * 0.85, 3.4).toFixed(2)}s`);
      flowPath.style.setProperty("--flow-dash", `${(12 + trafficIntensity * 20).toFixed(1)} ${(8 + (1 - roadStress) * 10).toFixed(1)}`);
      flowPath.classList.toggle("is-hot", roadStress > 0.44);
      flowPath.classList.toggle("is-critical", roadStress > 0.72);
      flowPath.classList.toggle("is-closed", edgeEventScale < 0.75);
    });

    STATE.city.districts.forEach((district) => {
      const total = district.S + district.I + district.R;
      const infectionRate = district.I / Math.max(total, 1);
      const mobilityIntensity = (district.incomingFlow + district.outgoingFlow) / Math.max(district.population, 1);
      const visualState = getDistrictVisualState(district, infectionRate, mobilityIntensity);
      const aura = STATE.svgRefs.districtAuras.get(district.id);
      const pulse = STATE.svgRefs.districtPulses.get(district.id);
      const ring = STATE.svgRefs.districtRings.get(district.id);
      const shell = STATE.svgRefs.districtShells.get(district.id);
      const gloss = STATE.svgRefs.districtGlosses.get(district.id);
      const label = STATE.svgRefs.districtLabels.get(district.id);
      const sub = STATE.svgRefs.districtSubs.get(district.id);
      const percentLabel = STATE.svgRefs.districtPercents.get(district.id);
      const group = STATE.svgRefs.districtGroups.get(district.id);

      if (aura) {
        aura.setAttribute("fill", visualState.auraColor);
        aura.setAttribute("r", (district.size + 18 + visualState.pressure * 18 + visualState.hospitalStress * 8).toFixed(1));
        aura.setAttribute("opacity", (0.12 + visualState.pressure * 0.24 + visualState.hospitalStress * 0.18).toFixed(2));
      }

      if (pulse) {
        pulse.setAttribute("stroke", visualState.auraStroke);
        pulse.setAttribute("stroke-width", (4 + visualState.pressure * 10 + visualState.hospitalStress * 4).toFixed(1));
        pulse.setAttribute("r", (district.size + 10 + visualState.pressure * 22 + visualState.hospitalStress * 8).toFixed(1));
        pulse.setAttribute("opacity", (0.18 + visualState.pressure * 0.28).toFixed(2));
      }

      if (ring) {
        ring.setAttribute("stroke", visualState.ringColor);
        ring.setAttribute("stroke-width", (5 + visualState.pressure * 2.4 + visualState.hospitalStress * 1.8).toFixed(1));
      }

      shell.setAttribute("fill", infectionColor(infectionRate));
      shell.setAttribute("stroke", visualState.shellStroke);
      if (gloss) {
        gloss.setAttribute("opacity", (0.2 + (1 - visualState.pressure) * 0.16).toFixed(2));
      }

      if (label) {
        label.setAttribute("fill", visualState.labelColor);
      }

      if (sub) {
        sub.textContent = `${district.typeLabel} - ${visualState.statusLabel}`;
        sub.setAttribute("fill", visualState.subColor);
      }

      percentLabel.textContent = formatPercent(infectionRate * 100);
      applyDistrictVisualClasses(group, visualState);
      group.style.setProperty("--district-pulse-duration", `${visualState.pulseDuration.toFixed(2)}s`);
      group.style.setProperty("--district-lift", `${(visualState.pressure * 2.8).toFixed(2)}px`);
      group.classList.toggle("is-selected", district.id === STATE.selectedDistrictId);
      group.setAttribute("aria-label", `${district.name}. ${formatPercent(infectionRate * 100)} infected. ${visualState.statusLabel} district state. Click for details.`);
    });

    renderMapDecorations();
  }

  function getDistrictVisualState(district, infectionRate, mobilityIntensity) {
    const infectionStress = clamp(0, infectionRate / 0.1, 1);
    const mobilityStress = clamp(0, mobilityIntensity / 0.16, 1);
    const spreadStress = STATE.currentMetrics ? clamp(0, (STATE.currentMetrics.spreadRate - 0.88) / 0.55, 1) : 0;
    const hospitalStress = district.typeId === "hospital" && STATE.currentMetrics
      ? clamp(0, (STATE.currentMetrics.hospitalUtilization - 72) / 40, 1)
      : 0;
    const pressure = clamp(0, (infectionStress * 0.58) + (mobilityStress * 0.2) + (spreadStress * 0.16) + (hospitalStress * 0.34), 1);
    const overload = district.typeId === "hospital" && STATE.currentMetrics && STATE.currentMetrics.hospitalUtilization > 100;

    if (overload) {
      return {
        pressure,
        hospitalStress,
        pulseDuration: 0.92,
        statusLabel: "Overflow",
        auraColor: "rgba(239, 68, 68, 0.34)",
        auraStroke: "rgba(239, 68, 68, 0.82)",
        ringColor: "rgba(254, 202, 202, 0.92)",
        shellStroke: "rgba(255, 255, 255, 0.98)",
        labelColor: "#7f1d1d",
        subColor: "#991b1b",
        className: "is-overloaded"
      };
    }

    if (pressure > 0.68) {
      return {
        pressure,
        hospitalStress,
        pulseDuration: clamp(1, 1.9 - pressure * 0.45, 2),
        statusLabel: "Critical",
        auraColor: "rgba(249, 115, 22, 0.3)",
        auraStroke: "rgba(249, 115, 22, 0.78)",
        ringColor: "rgba(251, 146, 60, 0.9)",
        shellStroke: "rgba(255, 237, 213, 0.92)",
        labelColor: "#9a3412",
        subColor: "#c2410c",
        className: "is-critical"
      };
    }

    if (pressure > 0.38) {
      return {
        pressure,
        hospitalStress,
        pulseDuration: clamp(1.2, 2.4 - pressure * 0.65, 2.5),
        statusLabel: "Strained",
        auraColor: "rgba(250, 204, 21, 0.24)",
        auraStroke: "rgba(250, 204, 21, 0.72)",
        ringColor: "rgba(250, 204, 21, 0.82)",
        shellStroke: "rgba(255, 251, 235, 0.94)",
        labelColor: "#854d0e",
        subColor: "#a16207",
        className: "is-stressed"
      };
    }

    if (pressure > 0.16) {
      return {
        pressure,
        hospitalStress,
        pulseDuration: clamp(1.8, 3 - pressure * 0.7, 3.1),
        statusLabel: "Watching",
        auraColor: "rgba(34, 197, 94, 0.18)",
        auraStroke: "rgba(56, 189, 248, 0.58)",
        ringColor: "rgba(191, 219, 254, 0.92)",
        shellStroke: "rgba(255, 255, 255, 0.96)",
        labelColor: "#0f172a",
        subColor: "#1e3a8a",
        className: "is-watch"
      };
    }

    return {
      pressure,
      hospitalStress,
      pulseDuration: 3.2,
      statusLabel: "Calm",
      auraColor: "rgba(16, 185, 129, 0.14)",
      auraStroke: "rgba(16, 185, 129, 0.46)",
      ringColor: "rgba(255, 255, 255, 0.92)",
      shellStroke: "rgba(255, 255, 255, 0.96)",
      labelColor: "#0f172a",
      subColor: "#2563eb",
      className: "is-calm"
    };
  }

  function applyDistrictVisualClasses(group, visualState) {
    group.classList.remove("is-calm", "is-watch", "is-stressed", "is-critical", "is-overloaded");
    group.classList.add(visualState.className);
  }

  function renderMapDecorations() {
    if (!STATE.svgRefs.decorLayer) {
      return;
    }

    STATE.svgRefs.decorLayer.innerHTML = "";
    const activeEvents = getActiveEvents(STATE.day);

    activeEvents.forEach((event) => {
      const districtId = event.districtId || getEventMapDistrictId(event);
      if (!districtId) {
        return;
      }
      const district = STATE.districtIndex.get(districtId);
      if (!district) {
        return;
      }
      STATE.svgRefs.decorLayer.appendChild(createEventMarker(district, event.iconType || inferEventIconType(event)));
    });

    if (STATE.currentMetrics && STATE.currentMetrics.hospitalUtilization > 100) {
      const hospitalDistrict = STATE.city.districts.find((district) => district.typeId === "hospital");
      if (hospitalDistrict) {
        STATE.svgRefs.decorLayer.appendChild(createHospitalBeacon(hospitalDistrict));
      }
    }

    STATE.city.edges.forEach((edge) => {
      const from = STATE.districtIndex.get(edge.from);
      const to = STATE.districtIndex.get(edge.to);
      if (getEdgeEventScale(STATE.day, from, to) < 0.75) {
        STATE.svgRefs.decorLayer.appendChild(createEdgeBlocker(edge));
      }
    });
  }

  function getEventMapDistrictId(event) {
    const lookup = {
      "holiday-weekend": "market",
      "mobile-clinics": "hospital",
      "commuter-surge": "transit",
      "ventilation-retrofit": "downtown",
      "school-reopening": "school",
      "parent-cohorting": "school",
      "cold-snap": "downtown",
      "public-fatigue": "civic"
    };
    return lookup[event.id] || STATE.scenario.focusDistrict;
  }

  function inferEventIconType(event) {
    if (event.iconType) {
      return event.iconType;
    }
    if (event.id.includes("school")) return "school";
    if (event.id.includes("hospital")) return "hospital";
    if (event.id.includes("transit") || event.id.includes("commuter")) return "transit";
    if (event.id.includes("holiday") || event.id.includes("weekend")) return "festival";
    if (event.id.includes("market")) return "market";
    return "decision";
  }

  function createEventMarker(district, iconType) {
    const group = createSvgEl("g", { class: "mayor-event-marker", transform: `translate(${district.x - 22} ${district.y - district.size - 38})` });
    group.appendChild(createSvgEl("rect", { x: 0, y: 0, width: 44, height: 28, rx: 14, class: "mayor-event-pill" }));
    group.appendChild(createMiniMapIcon(iconType));
    return group;
  }

  function createHospitalBeacon(district) {
    const group = createSvgEl("g", { class: "mayor-hospital-beacon", transform: `translate(${district.x} ${district.y})` });
    group.appendChild(createSvgEl("circle", { cx: 0, cy: 0, r: district.size + 20, class: "mayor-beacon-ring" }));
    group.appendChild(createSvgEl("circle", { cx: 0, cy: 0, r: district.size + 30, class: "mayor-beacon-ring is-outer" }));
    return group;
  }

  function createEdgeBlocker(edge) {
    const midpoint = pointOnEdge(edge, edge.from, edge.to, 0.5);
    const group = createSvgEl("g", { class: "mayor-edge-blocker", transform: `translate(${midpoint.x - 13} ${midpoint.y - 13})` });
    group.appendChild(createSvgEl("rect", { x: 0, y: 0, width: 26, height: 26, rx: 13, class: "mayor-edge-blocker-pill" }));
    group.appendChild(createSvgEl("path", { d: "M 7 7 L 19 19 M 19 7 L 7 19", class: "mayor-edge-blocker-cross" }));
    return group;
  }

  function createMiniMapIcon(iconType) {
    const icon = createSvgEl("g", { class: "mayor-event-icon", transform: "translate(7 5)" });

    if (iconType === "school") {
      icon.appendChild(createSvgEl("rect", { x: 1, y: 4, width: 16, height: 12, rx: 2, fill: "#1d4ed8" }));
      icon.appendChild(createSvgEl("path", { d: "M 1 7 H 17", stroke: "#ffffff", "stroke-width": 2 }));
    } else if (iconType === "hospital") {
      icon.appendChild(createSvgEl("rect", { x: 2, y: 2, width: 14, height: 14, rx: 4, fill: "#ef4444" }));
      icon.appendChild(createSvgEl("rect", { x: 8, y: 5, width: 2, height: 8, fill: "#ffffff" }));
      icon.appendChild(createSvgEl("rect", { x: 5, y: 8, width: 8, height: 2, fill: "#ffffff" }));
    } else if (iconType === "transit") {
      icon.appendChild(createSvgEl("rect", { x: 1, y: 5, width: 16, height: 9, rx: 4, fill: "#2563eb" }));
      icon.appendChild(createSvgEl("circle", { cx: 5, cy: 15, r: 2, fill: "#ffffff" }));
      icon.appendChild(createSvgEl("circle", { cx: 13, cy: 15, r: 2, fill: "#ffffff" }));
    } else if (iconType === "market") {
      icon.appendChild(createSvgEl("rect", { x: 2, y: 7, width: 14, height: 9, rx: 2, fill: "#f97316" }));
      icon.appendChild(createSvgEl("path", { d: "M 2 7 H 16 L 14 3 H 4 Z", fill: "#fde68a" }));
    } else if (iconType === "festival") {
      icon.appendChild(createSvgEl("path", { d: "M 1 4 H 17", stroke: "#1d4ed8", "stroke-width": 2, "stroke-linecap": "round" }));
      icon.appendChild(createSvgEl("path", { d: "M 4 4 L 7 9 L 10 4 L 13 9 L 16 4", fill: "none", stroke: "#f97316", "stroke-width": 2, "stroke-linejoin": "round" }));
    } else {
      icon.appendChild(createSvgEl("circle", { cx: 9, cy: 9, r: 7, fill: "#0f172a" }));
      icon.appendChild(createSvgEl("path", { d: "M 9 4 V 9 L 12 11", stroke: "#ffffff", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }

    return icon;
  }

  function initAgents() {
    const count = Math.max(1, STATE.runtime.baseAgentCount || 1);
    STATE.agents = [];
    STATE.svgRefs.agentDots = [];
    STATE.svgRefs.agentLayer.innerHTML = "";

    for (let index = 0; index < count; index += 1) {
      const circle = createSvgEl("circle", { r: STATE.reducedMotion ? 3.5 : 3.2, class: "mayor-agent-dot is-healthy" });
      STATE.svgRefs.agentLayer.appendChild(circle);
      const agent = createAgent(circle);
      STATE.agents.push(agent);
      STATE.svgRefs.agentDots.push(circle);
    }
  }

  function getDistrictTravelInfectionRate(district) {
    if (!STATE.city || !STATE.runtime) {
      return 0;
    }
    const hospitalInfo = getHospitalInfo(STATE.city.districts);
    const total = district.S + district.I + district.R;
    return getEffectiveInfectiousCount(district, hospitalInfo) / Math.max(total, 1);
  }

  function createAgent(circle) {
    const edge = STATE.city.edges.length ? weightedChoice(STATE.city.edges, (item) => item.weight) : null;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const fromId = edge ? (direction === 1 ? edge.from : edge.to) : STATE.city.districts[0].id;
    const toId = edge ? (direction === 1 ? edge.to : edge.from) : fromId;
    const progress = Math.random();
    const speed = 0.08 + Math.random() * 0.08;
    const origin = STATE.districtIndex.get(fromId);
    const infectionRate = getDistrictTravelInfectionRate(origin);
    return {
      circle,
      edgeId: edge ? edge.id : null,
      fromId,
      toId,
      progress,
      speed,
      infected: Math.random() < clamp(0.02, infectionRate * 1.6, 0.45),
      active: true
    };
  }

  function updateAgents(dt) {
    const controls = STATE.currentControls;
    const desiredAgents = Math.max(0, Math.min(STATE.agents.length, Math.round((STATE.runtime.baseAgentCount || 1) * Math.max(0, 1 - STATE.city.policies.mobility))));

    STATE.agents.forEach((agent, index) => {
      agent.active = index < desiredAgents;
      if (!agent.active || !agent.edgeId) {
        return;
      }

      const routeFactor = agent.infected ? Math.max(0.38, 0.9 - controls.testing * 0.42) : 1;
      agent.progress += dt * agent.speed * (0.55 + controls.movementMultiplier) * routeFactor;
      if (agent.progress >= 1) {
        assignNextRoute(agent, agent.toId);
      }
    });
  }

  function assignNextRoute(agent, fromDistrictId) {
    const edges = getConnectedEdges(fromDistrictId);
    if (!edges.length) {
      agent.edgeId = null;
      agent.fromId = fromDistrictId;
      agent.toId = fromDistrictId;
      agent.progress = 0;
      return;
    }
    const edge = weightedChoice(edges, (item) => item.weight);
    const nextDistrictId = edge.from === fromDistrictId ? edge.to : edge.from;
    const district = STATE.districtIndex.get(fromDistrictId);
    const infectionRate = getDistrictTravelInfectionRate(district);

    agent.edgeId = edge.id;
    agent.fromId = fromDistrictId;
    agent.toId = nextDistrictId;
    agent.progress = 0;
    agent.infected = Math.random() < clamp(0.02, infectionRate * (1.7 - STATE.currentControls.testing * 0.6), 0.55);
  }

  function renderAgents() {
    STATE.agents.forEach((agent) => {
      if (!agent.active) {
        agent.circle.setAttribute("opacity", "0");
        agent.circle.classList.add("is-faded");
        return;
      }

      const edge = STATE.edgeIndex.get(agent.edgeId);
      const point = pointOnEdge(edge, agent.fromId, agent.toId, agent.progress);
      agent.circle.setAttribute("cx", point.x.toFixed(2));
      agent.circle.setAttribute("cy", point.y.toFixed(2));
      agent.circle.setAttribute("opacity", "1");
      agent.circle.classList.toggle("is-infected", agent.infected);
      agent.circle.classList.toggle("is-healthy", !agent.infected);
      agent.circle.classList.remove("is-faded");
    });
  }

  function finishScenario() {
    STATE.finished = true;
    STATE.paused = true;
    renderHud();
    openSummaryModal();
  }

  function openSummaryModal() {
    const summary = buildScenarioSummary();

    if (EL.summaryEdition) {
      EL.summaryEdition.textContent = summary.edition;
    }
    if (EL.summaryGrade) {
      EL.summaryGrade.textContent = summary.grade;
      EL.summaryGrade.className = `mayor-summary-grade ${summary.gradeTone}`;
    }

    EL.summaryCopy.textContent = summary.copy;
    EL.summaryHealth.textContent = `${Math.round(summary.publicHealthScore)}`;
    EL.summaryEconomy.textContent = `${Math.round(summary.economyScore)}`;
    EL.summaryHospital.textContent = `${Math.round(summary.hospitalScore)}`;
    EL.summaryTrust.textContent = `${Math.round(summary.trustScore)}`;
    EL.summaryScore.textContent = `${Math.round(summary.finalScore)}`;

    if (EL.summaryPaperEdition) {
      EL.summaryPaperEdition.textContent = summary.paperEdition;
    }
    if (EL.summaryPaperDate) {
      EL.summaryPaperDate.textContent = summary.paperDate;
    }
    if (EL.summaryHeadline) {
      EL.summaryHeadline.textContent = summary.headline;
    }
    if (EL.summaryDek) {
      EL.summaryDek.textContent = summary.dek;
    }
    if (EL.summaryLegacyTitle) {
      EL.summaryLegacyTitle.textContent = summary.legacyTitle;
    }
    if (EL.summaryLegacy) {
      EL.summaryLegacy.textContent = summary.legacyCopy;
    }

    renderSummaryKeyMoments(summary.keyMoments);
    renderMiniScoreChart(EL.summaryScoreChart, STATE.history.days, STATE.history.score);
    EL.summaryModal.hidden = false;
    EL.summaryDismiss.focus();
    STATE.summaryOpen = true;
    playSoundEffect("summary", { volume: 0.44, playbackRate: 1.03, cooldown: 0 });
  }

  function buildScenarioSummary() {
    const averageEconomy = STATE.stats.samples ? STATE.stats.sumEconomy / STATE.stats.samples : 0;
    const population = STATE.currentMetrics.totalPopulation;
    const cumulativeRate = STATE.stats.cumulativeInfections / Math.max(population, 1);
    const publicHealthScore = clamp(0, 100 - cumulativeRate * 125 - Math.max(0, STATE.stats.peakHospital - 100) * 0.28, 100);
    const economyScore = clamp(0, averageEconomy, 100);
    const hospitalScore = clamp(0, 100 - Math.max(0, STATE.stats.peakHospital - 80) * 0.6, 100);
    const trustScore = clamp(0, Math.round(STATE.publicTrust), 100);
    const finalScore = STATE.stats.samples ? STATE.stats.sumScore / STATE.stats.samples : 0;
    const gradeInfo = getSummaryGradeInfo(finalScore, publicHealthScore, economyScore, hospitalScore, trustScore);
    const dominantPolicy = getDominantPolicyKey();
    const peakInfections = getSeriesPeak(STATE.history.days, STATE.history.activeInfections);
    const peakHospital = getSeriesPeak(STATE.history.days, STATE.history.hospitalUtilization);
    const lowestEconomy = getSeriesLow(STATE.history.days, STATE.history.economyUtilization);
    const containmentMoment = findContainmentMoment(STATE.history.days, STATE.history.spreadRate);
    const legacy = buildLegacyNarrative(dominantPolicy, finalScore, publicHealthScore, economyScore, trustScore);

    return {
      publicHealthScore,
      economyScore,
      hospitalScore,
      trustScore,
      finalScore,
      grade: gradeInfo.grade,
      gradeTone: gradeInfo.toneClass,
      edition: `${STATE.scenario.label} final edition`,
      paperEdition: gradeInfo.paperEdition,
      paperDate: `Day ${STATE.runtime.dayLimit}`,
      copy: gradeInfo.copy,
      headline: buildSummaryHeadline(finalScore, publicHealthScore, economyScore, hospitalScore),
      dek: buildSummaryDek(publicHealthScore, economyScore, trustScore, containmentMoment, peakHospital),
      legacyTitle: legacy.title,
      legacyCopy: legacy.copy,
      keyMoments: buildSummaryKeyMoments(peakInfections, peakHospital, lowestEconomy, containmentMoment)
    };
  }

  function getSummaryGradeInfo(finalScore, publicHealthScore, economyScore, hospitalScore, trustScore) {
    const composite = (finalScore * 0.45)
      + (publicHealthScore * 0.23)
      + (economyScore * 0.15)
      + (hospitalScore * 0.1)
      + (trustScore * 0.07);

    if (composite >= 90) {
      return {
        grade: "A+",
        toneClass: "is-elite",
        paperEdition: "Victory edition",
        copy: "A commanding finish. You kept the outbreak from defining the city, and your strongest choices held together under pressure."
      };
    }
    if (composite >= 82) {
      return {
        grade: "A",
        toneClass: "is-excellent",
        paperEdition: "Late city edition",
        copy: "A strong finish. The city bent, but your response kept health, trust, and motion aligned well enough to finish in the top band."
      };
    }
    if (composite >= 70) {
      return {
        grade: "B",
        toneClass: "is-strong",
        paperEdition: "Evening edition",
        copy: "A credible finish. You found stretches of stability, even if the city still paid a visible price for the outbreak."
      };
    }
    if (composite >= 58) {
      return {
        grade: "C",
        toneClass: "is-steady",
        paperEdition: "Special report",
        copy: "A mixed finish. Some parts of the response worked, but the city never fully escaped the tension between spread and economic drag."
      };
    }
    if (composite >= 45) {
      return {
        grade: "D",
        toneClass: "is-strained",
        paperEdition: "Emergency bulletin",
        copy: "A strained finish. The city stayed standing, but too many days were spent reacting instead of shaping the wave."
      };
    }
    return {
      grade: "F",
      toneClass: "is-crisis",
      paperEdition: "Crisis edition",
      copy: "A rough finish. Too much spread, too much drag, or both kept the city from regaining control before the scenario closed."
    };
  }

  function buildSummaryHeadline(finalScore, publicHealthScore, economyScore, hospitalScore) {
    if (finalScore >= 82 && hospitalScore >= 78) {
      return "Mayor steers the city through the wave";
    }
    if (publicHealthScore >= economyScore + 10) {
      return "Health first strategy slows the outbreak";
    }
    if (economyScore >= publicHealthScore + 10) {
      return "City stays open while hospitals feel the squeeze";
    }
    if (finalScore >= 65) {
      return "City holds the line as pressure begins to ease";
    }
    if (finalScore >= 50) {
      return "Mayor avoids collapse, but scars remain";
    }
    return "Outbreak leaves the city under heavy strain";
  }

  function buildSummaryDek(publicHealthScore, economyScore, trustScore, containmentMoment, peakHospital) {
    const containmentCopy = containmentMoment
      ? `${formatDayLabel(containmentMoment.day)} marked the first durable drop below a spread rate of 1.`
      : "The city never found a fully durable containment phase before the clock ran out.";
    return `${Math.round(publicHealthScore)} health, ${Math.round(economyScore)} economy, and ${Math.round(trustScore)} trust defined the run. Peak hospital pressure reached ${Math.round(peakHospital.value)}%. ${containmentCopy}`;
  }

  function buildLegacyNarrative(dominantPolicy, finalScore, publicHealthScore, economyScore, trustScore) {
    if (finalScore < 50) {
      return {
        title: "Embattled incumbent",
        copy: "History will remember a city that never found enough breathing room. Your administration was forced into visible damage control, with too little margin to build confidence."
      };
    }

    if (dominantPolicy === "mobility") {
      return finalScore >= 75
        ? {
            title: "The iron gate mayor",
            copy: "You were remembered for using movement controls decisively. The city traded comfort for control, and the districts responded to a firm hand."
          }
        : {
            title: "Lockdown balancer",
            copy: "Your instinct was to slow the city down to buy time. It worked in places, but the political and economic bill stayed visible throughout the run."
          };
    }

    if (dominantPolicy === "testing") {
      return publicHealthScore >= 72
        ? {
            title: "Data-driven crisis manager",
            copy: "You leaned on case finding and isolation to keep transmission measurable. The legacy is one of dashboards, tracing, and steady operational pressure."
          }
        : {
            title: "Late-diagnosis reformer",
            copy: "You tried to outlearn the outbreak. The city saw flashes of control, but the system never fully turned information into dominance."
          };
    }

    return trustScore >= 72
      ? {
          title: "Shield builder",
          copy: "Your administration focused on public protection and social buy-in. The legacy is a city that responded through norms, not only through force."
        }
      : {
          title: "Civic persuader",
          copy: "You tried to guide the city with protection measures and public messaging. The approach worked best when trust held, and faltered when it did not."
        };
  }

  function buildSummaryKeyMoments(peakInfections, peakHospital, lowestEconomy, containmentMoment) {
    const moments = [
      {
        title: `${formatDayLabel(peakInfections.day)} - infections crest`,
        body: `Active infections reached ${formatCompactNumber(peakInfections.value)} residents before beginning their sharpest turn.`
      },
      {
        title: `${formatDayLabel(peakHospital.day)} - hospitals tighten`,
        body: `Hospital utilization peaked at ${Math.round(peakHospital.value)}%, setting the most dangerous moment of the run.`
      }
    ];

    if (containmentMoment) {
      moments.push({
        title: `${formatDayLabel(containmentMoment.day)} - containment turns`,
        body: `The spread rate fell to ${formatDecimal(containmentMoment.value)} and finally slipped into a more stable phase.`
      });
    } else {
      moments.push({
        title: `${formatDayLabel(lowestEconomy.day)} - economy bottoms out`,
        body: `Economic utilization hit ${Math.round(lowestEconomy.value)}%, showing the hardest cost of your response mix.`
      });
    }

    return moments;
  }

  function renderSummaryKeyMoments(moments) {
    if (!EL.summaryKeyMoments) {
      return;
    }

    EL.summaryKeyMoments.innerHTML = "";
    moments.forEach((moment) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      const body = document.createElement("span");
      title.textContent = moment.title;
      body.textContent = moment.body;
      item.appendChild(title);
      item.appendChild(body);
      EL.summaryKeyMoments.appendChild(item);
    });
  }

  function getDominantPolicyKey() {
    const policyAverages = [
      ["mobility", averageSeries(STATE.history.mobilityPolicy)],
      ["testing", averageSeries(STATE.history.testingPolicy)],
      ["protection", averageSeries(STATE.history.protectionPolicy)]
    ];
    policyAverages.sort((left, right) => right[1] - left[1]);
    return policyAverages[0][0];
  }

  function averageSeries(values) {
    if (!Array.isArray(values) || !values.length) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function getSeriesPeak(days, values) {
    if (!Array.isArray(values) || !values.length) {
      return { day: 0, value: 0 };
    }
    let bestIndex = 0;
    values.forEach((value, index) => {
      if (value > values[bestIndex]) {
        bestIndex = index;
      }
    });
    return { day: days[bestIndex] || 0, value: values[bestIndex] || 0 };
  }

  function getSeriesLow(days, values) {
    if (!Array.isArray(values) || !values.length) {
      return { day: 0, value: 0 };
    }
    let bestIndex = 0;
    values.forEach((value, index) => {
      if (value < values[bestIndex]) {
        bestIndex = index;
      }
    });
    return { day: days[bestIndex] || 0, value: values[bestIndex] || 0 };
  }

  function findContainmentMoment(days, values) {
    if (!Array.isArray(values) || !values.length) {
      return null;
    }

    let sawExpansion = false;
    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];
      if (value > 1.05) {
        sawExpansion = true;
      }
      if (sawExpansion && value <= 0.98) {
        return { day: days[index] || 0, value };
      }
    }

    return null;
  }

  function formatDayLabel(day) {
    return `Day ${Math.max(1, Math.round(day || 0))}`;
  }

  function closeSummaryModal() {
    EL.summaryModal.hidden = true;
    STATE.summaryOpen = false;
  }

  function syncControlInputs() {
    EL.policyMobility.value = STATE.city.policies.mobility;
    EL.policyTesting.value = STATE.city.policies.testing;
    EL.policyProtection.value = STATE.city.policies.protection;
  }

  function selectDistrict(districtId) {
    STATE.selectedDistrictId = districtId;
    playSoundEffect("districtSelect", { volume: 0.18, playbackRate: 1.24, cooldown: 0 });
    showFloatingPanel("district");
    renderMapVisuals();
    renderDistrictDetail();
  }

  function getConnectedEdges(districtId) {
    return STATE.city.edges.filter((edge) => edge.from === districtId || edge.to === districtId);
  }

  function buildEdgePath(edge) {
    const from = STATE.districtIndex.get(edge.from);
    const to = STATE.districtIndex.get(edge.to);
    const midX = (from.x + to.x) / 2 + edge.curveX;
    const midY = (from.y + to.y) / 2 + edge.curveY;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
  }

  function pointOnEdge(edge, fromId, toId, t) {
    const from = STATE.districtIndex.get(fromId);
    const to = STATE.districtIndex.get(toId);
    const direct = edge.from === fromId && edge.to === toId;
    const controlX = ((from.x + to.x) / 2) + (direct ? edge.curveX : -edge.curveX);
    const controlY = ((from.y + to.y) / 2) + (direct ? edge.curveY : -edge.curveY);
    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * from.x + 2 * oneMinusT * t * controlX + t * t * to.x;
    const y = oneMinusT * oneMinusT * from.y + 2 * oneMinusT * t * controlY + t * t * to.y;
    return { x, y };
  }

  function createDistrictIcon(district) {
    const color = DISTRICT_COLORS[district.typeId] || "#2563eb";
    const group = createSvgEl("g", { class: "mayor-district-icon", transform: `translate(${district.x - 16} ${district.y - 24})` });

    if (district.typeId === "downtown") {
      group.appendChild(createSvgEl("rect", { x: 1, y: 16, width: 8, height: 16, rx: 2, fill: color }));
      group.appendChild(createSvgEl("rect", { x: 11, y: 10, width: 10, height: 22, rx: 2, fill: color }));
      group.appendChild(createSvgEl("rect", { x: 23, y: 14, width: 8, height: 18, rx: 2, fill: color }));
    } else if (district.typeId === "residential") {
      group.appendChild(createSvgEl("path", { d: "M 3 20 L 16 10 L 29 20", stroke: color, "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }));
      group.appendChild(createSvgEl("rect", { x: 7, y: 20, width: 18, height: 12, rx: 2, fill: color }));
    } else if (district.typeId === "school") {
      group.appendChild(createSvgEl("rect", { x: 4, y: 14, width: 24, height: 16, rx: 2, fill: color }));
      group.appendChild(createSvgEl("rect", { x: 15, y: 8, width: 3, height: 9, fill: color }));
      group.appendChild(createSvgEl("path", { d: "M 18 8 L 25 11 L 18 14", fill: "#fde68a" }));
    } else if (district.typeId === "market") {
      group.appendChild(createSvgEl("rect", { x: 5, y: 17, width: 22, height: 13, rx: 3, fill: color }));
      group.appendChild(createSvgEl("path", { d: "M 5 17 H 27 L 24 11 H 8 Z", fill: "#fde68a" }));
    } else if (district.typeId === "industrial") {
      group.appendChild(createSvgEl("rect", { x: 5, y: 19, width: 24, height: 11, rx: 2, fill: color }));
      group.appendChild(createSvgEl("rect", { x: 9, y: 11, width: 5, height: 10, rx: 1, fill: color }));
      group.appendChild(createSvgEl("path", { d: "M 16 19 L 21 14 L 25 19", fill: "#cbd5e1" }));
    } else if (district.typeId === "transit") {
      group.appendChild(createSvgEl("rect", { x: 4, y: 16, width: 24, height: 12, rx: 6, fill: color }));
      group.appendChild(createSvgEl("circle", { cx: 10, cy: 29, r: 3, fill: "#fff" }));
      group.appendChild(createSvgEl("circle", { cx: 22, cy: 29, r: 3, fill: "#fff" }));
    } else if (district.typeId === "hospital") {
      group.appendChild(createSvgEl("rect", { x: 6, y: 14, width: 20, height: 20, rx: 6, fill: color }));
      group.appendChild(createSvgEl("rect", { x: 14, y: 18, width: 4, height: 12, fill: "#fff" }));
      group.appendChild(createSvgEl("rect", { x: 10, y: 22, width: 12, height: 4, fill: "#fff" }));
    } else {
      group.appendChild(createSvgEl("circle", { cx: 12, cy: 24, r: 6, fill: color }));
      group.appendChild(createSvgEl("rect", { x: 11, y: 12, width: 3, height: 10, fill: color }));
      group.appendChild(createSvgEl("path", { d: "M 23 28 C 26 24 29 24 31 28", stroke: "#0ea5e9", "stroke-width": 3, fill: "none", "stroke-linecap": "round" }));
    }

    return group;
  }

  function showTooltip(text, target) {
    if (!text) return;
    EL.tooltip.textContent = text;
    EL.tooltip.hidden = false;
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 12;
    EL.tooltip.style.left = `${x}px`;
    EL.tooltip.style.top = `${y}px`;
    EL.tooltip.style.transform = "translate(-50%, -100%)";
  }

  function hideTooltip() {
    EL.tooltip.hidden = true;
  }

  function shuffleArray(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function weightedChoice(items, weightFn) {
    const total = items.reduce((sum, item) => sum + weightFn(item), 0);
    let threshold = Math.random() * total;
    for (const item of items) {
      threshold -= weightFn(item);
      if (threshold <= 0) {
        return item;
      }
    }
    return items[items.length - 1];
  }

  function getPolicyCopy(policyKey, value) {
    return POLICY_COPY[policyKey].find((entry) => value < entry.limit).text;
  }

  function getTrendLabel(values, labels) {
    if (values.length < 3) {
      return labels.steady;
    }
    const recent = values[values.length - 1];
    const previous = values[values.length - 2];
    if (recent > previous * 1.03) return labels.rising;
    if (recent < previous * 0.97) return labels.falling;
    return labels.steady;
  }

  function infectionColor(rate) {
    if (rate <= 0.01) return "#86efac";
    if (rate <= 0.03) return mixColors("#86efac", "#fde047", rate / 0.03);
    if (rate <= 0.08) return mixColors("#fde047", "#fb923c", (rate - 0.03) / 0.05);
    return mixColors("#fb923c", "#ef4444", Math.min(1, (rate - 0.08) / 0.12));
  }

  function mixColors(startHex, endHex, amount) {
    const start = hexToRgb(startHex);
    const end = hexToRgb(endHex);
    const t = clamp(0, amount, 1);
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function hexToRgb(hex) {
    const safe = hex.replace("#", "");
    return {
      r: parseInt(safe.substring(0, 2), 16),
      g: parseInt(safe.substring(2, 4), 16),
      b: parseInt(safe.substring(4, 6), 16)
    };
  }

  function pointsToPath(points) {
    if (!points.length) return "";
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
  }

  function scaleY(value, minValue, maxValue, top, height) {
    if (maxValue === minValue) {
      return top + height / 2;
    }
    const normalized = (value - minValue) / (maxValue - minValue);
    return top + height - normalized * height;
  }

  function formatCompactNumber(value) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(value));
  }

  function formatFullNumber(value) {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }

  function formatDecimal(value) {
    return Number(value).toFixed(2);
  }

  function formatPercent(value) {
    return `${Number(value).toFixed(value >= 10 ? 0 : 1)}%`;
  }

  function formatTick(value, digits) {
    return Number(value).toFixed(digits);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(min, value, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createSvgEl(tagName, attributes = {}, textContent = "") {
    const element = document.createElementNS(SVG_NS, tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  }
})();




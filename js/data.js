// Seed data: brands, common parts, troubleshooting FAQs, manual lookup links.
// All "buy" links flow through the affiliate helper in utils.js so the
// grillpartsreplacement.com ?ref=zsgtagbs param is always preserved.

export const BRANDS = [
  {
    id: "weber",
    name: "Weber",
    manualSearch: "https://www.weber.com/US/en/service-and-support/owners-manuals/",
    notes:
      "Model + serial usually on a sticker inside the left cart door or on the back of the manifold panel. Genesis II / Spirit II use 8-digit model #.",
    common: ["burner-tube", "flavorizer-bar", "cooking-grate", "igniter-kit", "heat-deflector"],
  },
  {
    id: "napoleon",
    name: "Napoleon",
    manualSearch: "https://www.napoleon.com/en/us/grills/support/manuals",
    notes:
      "Model tag on inside of left cart door. Prestige & Rogue series use sear plates instead of flavorizer bars.",
    common: ["burner-tube", "sear-plate", "cooking-grate", "igniter-kit", "regulator-hose"],
  },
  {
    id: "broilking",
    name: "Broil King",
    manualSearch: "https://www.broilking.com/manuals/",
    notes:
      "Dual-tube burners; check both sides for burn-through. Flav-R-Wave bars are model-specific to Baron/Regal/Imperial families.",
    common: ["burner-tube", "flavorizer-bar", "cooking-grate", "regulator-hose", "igniter-kit"],
  },
  {
    id: "char-broil",
    name: "Char-Broil",
    manualSearch: "https://www.charbroil.com/help/manuals",
    notes: "Model on inside of door or back of cart. TRU-Infrared models use emitter trays instead of bars.",
    common: ["burner-tube", "emitter-tray", "cooking-grate", "igniter-kit", "regulator-hose"],
  },
  {
    id: "traeger",
    name: "Traeger",
    manualSearch: "https://support.traeger.com/hc/en-us",
    notes:
      "Pellet grills — most service issues are auger, hot-rod igniter, induction fan, or controller. Serial inside hopper lid.",
    common: ["hot-rod-igniter", "induction-fan", "auger-motor", "rtd-probe", "controller"],
  },
  {
    id: "pit-boss",
    name: "Pit Boss",
    manualSearch: "https://pitboss-grills.com/pages/manuals",
    notes: "Pellet grills similar to Traeger. Auger jams are the #1 service call.",
    common: ["hot-rod-igniter", "induction-fan", "auger-motor", "rtd-probe", "controller"],
  },
  {
    id: "kamado-joe",
    name: "Kamado Joe",
    manualSearch: "https://www.kamadojoe.com/pages/owners-manual",
    notes:
      "Ceramic — most parts are gaskets, top vents, fire-bowl pieces. Felt gasket replacement is most common service item.",
    common: ["gasket", "top-vent", "fire-bowl", "cooking-grate"],
  },
  {
    id: "big-green-egg",
    name: "Big Green Egg",
    manualSearch: "https://biggreenegg.com/care-and-use/",
    notes: "Sized S/M/L/XL/2XL — parts are size-specific. Check size before ordering gasket or fire ring.",
    common: ["gasket", "fire-ring", "fire-box", "top-vent"],
  },
  {
    id: "blackstone",
    name: "Blackstone",
    manualSearch: "https://blackstoneproducts.com/pages/owners-manuals",
    notes:
      "Flat-tops — most service: regulator/hose, igniter battery, griddle re-seasoning, H-burner replacement.",
    common: ["h-burner", "regulator-hose", "igniter-kit", "griddle-top"],
  },
  {
    id: "lynx",
    name: "Lynx",
    manualSearch: "https://www.lynxgrills.com/customer-care/owners-manuals",
    notes: "Premium built-in. Brass burners — bore them out before replacing if just clogged.",
    common: ["burner-tube", "ceramic-briquette", "cooking-grate", "igniter-kit"],
  },
  {
    id: "dcs",
    name: "DCS (Fisher & Paykel)",
    manualSearch: "https://www.dcsappliances.com/en-us/support/use-and-care",
    notes: "Premium built-in. Ceramic radiant rods break — count and replace as a set.",
    common: ["burner-tube", "ceramic-rod", "cooking-grate", "igniter-kit"],
  },
  {
    id: "twin-eagles",
    name: "Twin Eagles",
    manualSearch: "https://twineaglesgrills.com/support/",
    notes: "Premium built-in. Order via authorized only — confirm part numbers with serial.",
    common: ["burner-tube", "flavorizer-bar", "cooking-grate", "igniter-kit"],
  },
  {
    id: "other",
    name: "Other / Unknown",
    manualSearch: "https://www.google.com/search?q=grill+owners+manual",
    notes: "Use the photo of the rating plate to search the model number manually.",
    common: ["burner-tube", "flavorizer-bar", "cooking-grate", "igniter-kit", "regulator-hose"],
  },
];

// Generic part catalog. `searchTerms` drives the affiliate search query.
// `priceEst` is a typical retail range we quote (the tech can adjust on the estimate).
export const PARTS = [
  {
    id: "burner-tube",
    name: "Burner tube",
    category: "Burners",
    desc:
      "Stainless or cast burner. Replace if you see burn-through, holes near the venturi, or uneven flame.",
    install:
      "1. Shut off gas at tank. 2. Remove grates, bars, heat shields. 3. Lift cotter pin / screw at rear of burner. 4. Slide burner off valve orifice. 5. Inspect orifice for spider webs before installing new burner — clear with a wire if needed.",
    priceEst: [25, 75],
    searchTerms: "burner tube",
  },
  {
    id: "flavorizer-bar",
    name: "Flavorizer / heat tent bar",
    category: "Heat",
    desc:
      "Stainless or porcelain bar that sits above the burner. Replace when warped, rusted through, or wafer-thin.",
    install:
      "Drop-in. Confirm the bar length matches the model — they vary by 1/4\" between Spirit / Genesis / Genesis II.",
    priceEst: [40, 120],
    searchTerms: "flavorizer bar heat tent",
  },
  {
    id: "sear-plate",
    name: "Sear plate (Napoleon)",
    category: "Heat",
    desc: "Napoleon's heat distributor. Stainless v-shape. Replace if pitted or warped.",
    install: "Drop-in over each burner.",
    priceEst: [35, 90],
    searchTerms: "napoleon sear plate",
  },
  {
    id: "cooking-grate",
    name: "Cooking grate",
    category: "Surface",
    desc:
      "Porcelain-coated cast iron, stainless rod, or solid stainless. Match grate count and overall dimensions before ordering.",
    install: "Drop-in. Lift old grate out, wipe rails, set new grate.",
    priceEst: [60, 220],
    searchTerms: "cooking grate cooking grid",
  },
  {
    id: "igniter-kit",
    name: "Igniter kit (battery / piezo / electronic)",
    category: "Ignition",
    desc:
      "Click-style piezo or battery-powered electronic module + electrodes + wires. Confirm battery type (AA vs. AAA vs. 9V) and number of burners.",
    install:
      "1. Disconnect battery. 2. Remove module + buttons + electrodes. 3. Route new wires same path. 4. Confirm 1/8\" gap between electrode tip and burner port. 5. Test before reassembling grates.",
    priceEst: [25, 85],
    searchTerms: "igniter kit electrode",
  },
  {
    id: "regulator-hose",
    name: "Regulator + hose",
    category: "Gas",
    desc:
      "LP regulator with QCC1 fitting. Replace any time the regulator is hissing, frozen, or stuck in bypass after a leak test trip.",
    install:
      "1. Tank off. 2. Hand-tighten QCC1 to tank (no wrench). 3. Connect manifold end. 4. Leak test with soapy water at every joint with tank slowly opened. 5. Reset bypass by opening tank slowly with grill valves CLOSED.",
    priceEst: [25, 60],
    searchTerms: "regulator hose lp QCC1",
  },
  {
    id: "heat-deflector",
    name: "Heat deflector / shield",
    category: "Heat",
    desc: "Larger heat shield under the cooking surface; common on Weber Genesis II.",
    install: "Drop-in over burners; confirm correct shape (Spirit vs Genesis).",
    priceEst: [40, 130],
    searchTerms: "heat deflector heat shield",
  },
  {
    id: "ceramic-briquette",
    name: "Ceramic briquette tray / set",
    category: "Heat",
    desc: "Briquettes that sit above the burner on Lynx / older grills.",
    install: "Lay flat in tray, leave no gaps. Replace whole set.",
    priceEst: [50, 160],
    searchTerms: "ceramic briquette",
  },
  {
    id: "ceramic-rod",
    name: "Ceramic radiant rod (DCS)",
    category: "Heat",
    desc: "Cylindrical ceramic rod above each burner on DCS. Replace whole set if more than one is broken.",
    install: "Slide into stainless cradle above burner.",
    priceEst: [80, 240],
    searchTerms: "DCS ceramic radiant rod",
  },
  {
    id: "emitter-tray",
    name: "TRU-Infrared emitter tray (Char-Broil)",
    category: "Heat",
    desc: "Stainless emitter tray on Char-Broil infrared grills. Replace if warped, rusted through, or perforated.",
    install: "Lift cooking grate, lift old tray, drop in new tray, replace grate.",
    priceEst: [60, 180],
    searchTerms: "char-broil TRU infrared emitter tray",
  },
  {
    id: "h-burner",
    name: "H-burner (Blackstone)",
    category: "Burners",
    desc: "H-shape stainless burner under Blackstone griddle plate.",
    install:
      "Lift griddle top, unscrew burner from frame, swap orifice and venturi alignment with valve, reinstall.",
    priceEst: [25, 70],
    searchTerms: "blackstone h burner",
  },
  {
    id: "griddle-top",
    name: "Griddle top",
    category: "Surface",
    desc: "Cold-rolled steel top for Blackstone or similar. Re-season after install.",
    install:
      "Lift old top, drop in new, wash with mild soap, dry, apply thin coat of oil, heat to smoke point 3x.",
    priceEst: [60, 240],
    searchTerms: "blackstone griddle top replacement",
  },
  {
    id: "hot-rod-igniter",
    name: "Hot rod igniter (pellet)",
    category: "Ignition",
    desc: "Pellet grill igniter rod that lives in the firepot. Replace when grill fails to fire up or shows ER1/Erh.",
    install: "Unscrew from back of firepot, swap, reconnect leads.",
    priceEst: [20, 55],
    searchTerms: "pellet hot rod igniter",
  },
  {
    id: "induction-fan",
    name: "Induction / combustion fan (pellet)",
    category: "Drivetrain",
    desc: "Pellet grill combustion fan. Replace if loud, intermittent, or not spinning at startup.",
    install: "Unbolt from rear, transfer plug, reinstall.",
    priceEst: [40, 95],
    searchTerms: "pellet combustion induction fan",
  },
  {
    id: "auger-motor",
    name: "Auger motor (pellet)",
    category: "Drivetrain",
    desc: "Geared motor that feeds pellets. Replace if grinding, stalling, or not turning when commanded.",
    install: "Unbolt from rear, slide off auger shaft (watch keyway), reinstall.",
    priceEst: [55, 140],
    searchTerms: "pellet auger motor",
  },
  {
    id: "rtd-probe",
    name: "RTD probe (pellet)",
    category: "Sensors",
    desc: "Pit temperature sensor. Replace if temp reads stuck or wildly off.",
    install: "Unscrew from cook chamber wall, route wire to controller, plug in.",
    priceEst: [15, 45],
    searchTerms: "pellet RTD probe",
  },
  {
    id: "controller",
    name: "Controller (pellet)",
    category: "Electronics",
    desc: "Brain of the pellet grill. Confirm pin-out matches before replacing.",
    install: "Disconnect power. Unscrew controller from hopper, unplug each connector (photograph first), reinstall.",
    priceEst: [110, 280],
    searchTerms: "pellet controller",
  },
  {
    id: "gasket",
    name: "Felt gasket (kamado)",
    category: "Seal",
    desc: "High-temp felt gasket on lid/base of ceramic kamado. Replace yearly or when dome no longer seals.",
    install:
      "Scrape old gasket flat, wipe with denatured alcohol, peel and stick new gasket, close lid and let cure 24h before high-heat cook.",
    priceEst: [25, 60],
    searchTerms: "kamado felt gasket",
  },
  {
    id: "top-vent",
    name: "Top vent / daisy wheel (kamado)",
    category: "Airflow",
    desc: "Cast iron top vent. Replace if seized or rusted shut.",
    install: "Slip over top opening; calibrate to closed position.",
    priceEst: [30, 90],
    searchTerms: "kamado top vent daisy wheel",
  },
  {
    id: "fire-bowl",
    name: "Fire bowl (Kamado Joe)",
    category: "Ceramic",
    desc: "Cracked fire bowls are warranty-eligible on KJ but order replacement to fit.",
    install: "Lift out via handles, drop in new bowl.",
    priceEst: [120, 260],
    searchTerms: "kamado joe fire bowl",
  },
  {
    id: "fire-ring",
    name: "Fire ring (Big Green Egg)",
    category: "Ceramic",
    desc: "Confirm Egg size (S/M/L/XL/2XL) before ordering.",
    install: "Lift out, drop in new ring.",
    priceEst: [70, 180],
    searchTerms: "big green egg fire ring",
  },
  {
    id: "fire-box",
    name: "Fire box (Big Green Egg)",
    category: "Ceramic",
    desc: "Confirm Egg size before ordering.",
    install: "Lift out, drop in new box.",
    priceEst: [120, 280],
    searchTerms: "big green egg fire box",
  },
];

export const FAQS = [
  {
    q: "Grill won't light — clicking but no flame",
    tags: ["ignition", "no-flame"],
    fixes: [
      "Confirm tank has gas and is fully open (slow open prevents bypass).",
      "Check for kinked / blocked regulator hose.",
      "Clear orifice with a thin wire — spiders love venturi tubes.",
      "Test ignition: in the dark, look for a strong blue spark at electrode tip; gap should be ~1/8\".",
      "Swap battery; check ground wire on igniter module.",
    ],
    parts: ["igniter-kit", "regulator-hose"],
  },
  {
    q: "Yellow / lazy flames, low heat",
    tags: ["heat", "flame"],
    fixes: [
      "Reset regulator: tank closed, grill valves closed and open for 30s, then slowly open tank.",
      "Inspect burner tubes for burn-through; light passes through pinholes.",
      "Clean venturi screen and orifice.",
      "Verify burner tube is seated on the valve orifice (not just resting beside it).",
    ],
    parts: ["regulator-hose", "burner-tube"],
  },
  {
    q: "Uneven heat across cooking surface",
    tags: ["heat"],
    fixes: [
      "Inspect flavorizer bars / heat tents for warp and rust-through; replace as a set.",
      "Confirm burner ports are open across the full length of each tube.",
      "Check cooking grate for warp; rotate front-to-back if it's solid stainless.",
    ],
    parts: ["flavorizer-bar", "burner-tube", "cooking-grate"],
  },
  {
    q: "Heavy smoke / flare-ups",
    tags: ["safety", "flame"],
    fixes: [
      "Confirm grease tray is in place and not overflowing.",
      "Pull and clean drip pan + grease cup.",
      "Inspect bars / heat shields — pooled grease in pitted bars causes flare.",
      "Bring up to high for 10 min with lid closed to burn off residue (after cleaning).",
    ],
    parts: ["flavorizer-bar"],
  },
  {
    q: "Pellet grill won't start / ErH / ErR",
    tags: ["pellet", "ignition"],
    fixes: [
      "Empty hopper, check for jammed pellet or sawdust at auger.",
      "Vacuum firepot — clear ash from around hot rod.",
      "Verify hot rod glows orange within ~3 min of startup.",
      "Confirm induction fan spins freely and starts at startup.",
      "RTD probe reading at room temp should be within 5°F of actual ambient.",
    ],
    parts: ["hot-rod-igniter", "induction-fan", "rtd-probe", "auger-motor"],
  },
  {
    q: "Pellet grill not holding temp",
    tags: ["pellet", "heat"],
    fixes: [
      "Clean firepot and auger tube; ash buildup chokes combustion.",
      "Switch pellets to a known-dry bag; wet pellets are 80% of temp swings.",
      "Inspect lid gasket — closed lid should pinch a piece of paper.",
      "Reseat / replace RTD probe.",
    ],
    parts: ["rtd-probe", "controller"],
  },
  {
    q: "Kamado not sealing / smoke leaks at lid",
    tags: ["kamado", "seal"],
    fixes: [
      "Inspect felt gasket — replace if flat, glazed, or torn.",
      "Check that lid hinge spring is calibrated (lid should hold itself open at 45°).",
      "Confirm top vent and bottom slide both move freely.",
    ],
    parts: ["gasket", "top-vent"],
  },
  {
    q: "Blackstone won't ignite / weak flame",
    tags: ["griddle", "ignition"],
    fixes: [
      "Replace AA / AAA battery in igniter module.",
      "Bypass-reset the regulator (tank closed, knobs open 30s, then open tank slowly).",
      "Inspect H-burner for grease blockage; brush venturi.",
    ],
    parts: ["igniter-kit", "regulator-hose", "h-burner"],
  },
  {
    q: "Rusty / pitted bars or grates",
    tags: ["surface", "rust"],
    fixes: [
      "Quote replacement when pits are through-and-through or grate flakes off coating.",
      "Light surface rust on cast iron: wire brush, season with high-smoke-point oil.",
    ],
    parts: ["flavorizer-bar", "cooking-grate"],
  },
];

// Default labor / service line items to drop on an estimate.
export const LABOR_PRESETS = [
  { id: "inspect",     name: "On-site inspection",         price: 89  },
  { id: "deep-clean",  name: "Full deep clean & detail",   price: 349 },
  { id: "tune-up",     name: "Tune-up & calibration",      price: 149 },
  { id: "leak-test",   name: "Gas leak test",              price: 49  },
  { id: "haul-away",   name: "Old parts haul-away",        price: 25  },
  { id: "labor-hour",  name: "Repair labor (per hour)",    price: 95  },
  { id: "trip",        name: "Trip fee",                   price: 35  },
];

// Tag classes for problem search
export const TAGS = ["ignition", "flame", "heat", "safety", "pellet", "kamado", "griddle", "seal", "rust", "surface", "no-flame"];

// Affiliate base — every link to grillpartsreplacement.com must include this ref.
export const AFFILIATE = {
  baseUrl: "https://grillpartsreplacement.com",
  ref: "zsgtagbs",
};

import { PrismaClient, type SeasonType, type Residency } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const img = (id: string) => `https://images.unsplash.com/${id}?w=1600&q=75&auto=format&fit=crop`;

// Standard rate grid: peak/low × resident (KES) / non-resident (USD) × group size bands.
function rateGrid(nonResLow: number, resLowKes: number) {
  const bands = [
    { minPax: 1, maxPax: 1, f: 1.6 },
    { minPax: 2, maxPax: 3, f: 1.15 },
    { minPax: 4, maxPax: 6, f: 1 },
    { minPax: 7, maxPax: 99, f: 0.9 },
  ];
  const out: { season: SeasonType; residency: Residency; minPax: number; maxPax: number; pricePerPerson: number; currency: string }[] = [];
  for (const season of ["LOW", "PEAK"] as SeasonType[]) {
    const s = season === "PEAK" ? 1.25 : 1;
    for (const b of bands) {
      out.push({ season, residency: "NON_RESIDENT", minPax: b.minPax, maxPax: b.maxPax, pricePerPerson: Math.round(nonResLow * b.f * s), currency: "USD" });
      out.push({ season, residency: "RESIDENT", minPax: b.minPax, maxPax: b.maxPax, pricePerPerson: Math.round((resLowKes * b.f * s) / 100) * 100, currency: "KES" });
    }
  }
  return out;
}

async function main() {
  // Staff
  await db.user.upsert({
    where: { email: "admin@tours.local" },
    update: {},
    create: { name: "Victor Kiptoo", email: "admin@tours.local", passwordHash: await bcrypt.hash("admin123", 10), role: "ADMIN" },
  });
  await db.user.upsert({
    where: { email: "staff@tours.local" },
    update: {},
    create: {
      name: "Reservations Desk",
      email: "staff@tours.local",
      passwordHash: await bcrypt.hash("staff123", 10),
      role: "STAFF",
      // Front-desk staff: full sales/operations access, but not finance or website editing.
      permissions: ["sales", "operations", "reports"],
    },
  });

  if (await db.tour.count()) {
    console.log("Catalog already seeded — skipping demo data.");
    return;
  }

  // Seasons (month/day recur every year)
  await db.season.createMany({
    data: [
      { name: "Great Migration", type: "PEAK", startDate: new Date("2026-07-01"), endDate: new Date("2026-10-31") },
      { name: "Festive Season", type: "PEAK", startDate: new Date("2026-12-15"), endDate: new Date("2027-01-05") },
      { name: "Easter", type: "PEAK", startDate: new Date("2026-03-28"), endDate: new Date("2026-04-10") },
    ],
  });

  const [wildlife, beach, sports, culture] = await Promise.all(
    [
      { name: "Wildlife Safaris", slug: "wildlife-safaris", description: "Game drives in Kenya's most iconic parks and reserves.", image: img("photo-1516426122078-c23e76319801"), sort: 1 },
      { name: "Beach Getaways", slug: "beach-getaways", description: "White sand, warm Indian Ocean water and Swahili culture.", image: img("photo-1507525428034-b723cf961d3e"), sort: 2 },
      { name: "Sports Tourism", slug: "sports-tourism", description: "Marathons, matches and high-altitude training camps.", image: img("photo-1552674605-db6ffd4facb5"), sort: 3 },
      { name: "Adventure & Culture", slug: "adventure-culture", description: "Hikes, villages and experiences off the beaten path.", image: img("photo-1551632811-561732d1e306"), sort: 4 },
    ].map((c) => db.category.create({ data: c })),
  );

  const addOns = await Promise.all(
    [
      { name: "Private 4x4 Land Cruiser upgrade", type: "CAR_HIRE" as const, price: 150, unit: "PER_DAY" as const, description: "Exclusive pop-up roof Land Cruiser, 7 seats, with your own driver-guide, fuel included." },
      { name: "Self-drive car hire (SUV)", type: "CAR_HIRE" as const, price: 90, unit: "PER_DAY" as const, description: "Toyota Prado or similar, 5 seats, unlimited mileage within Kenya. Fuel not included." },
      { name: "BMW 3-Series self-drive", type: "CAR_HIRE" as const, price: 110, unit: "PER_DAY" as const, description: "Automatic, air-conditioned saloon, 4 seats, comfortable for tarmac-road touring. Fuel not included." },
      { name: "Nairobi → Mara return flight", type: "FLIGHT" as const, price: 480, unit: "PER_PERSON" as const, description: "Safarilink/AirKenya scheduled flight from Wilson Airport." },
      { name: "Nairobi → Mombasa/Diani flight", type: "FLIGHT" as const, price: 160, unit: "PER_PERSON" as const, description: "One-way domestic flight, 20kg luggage." },
      { name: "Luxury tented camp upgrade", type: "ACCOMMODATION_UPGRADE" as const, price: 220, unit: "PER_PERSON_PER_DAY" as const, description: "Spacious en-suite tent with hot shower and private veranda. Buffet breakfast, lunch and dinner included." },
      { name: "Mid-range lodge upgrade", type: "ACCOMMODATION_UPGRADE" as const, price: 90, unit: "PER_PERSON_PER_DAY" as const, description: "Comfortable en-suite room. Buffet breakfast and dinner included; lunch on request." },
      { name: "Hot-air balloon safari", type: "ACTIVITY" as const, price: 490, unit: "PER_PERSON" as const, description: "Sunrise flight over the Mara with champagne bush breakfast." },
      { name: "Airport transfer (JKIA)", type: "OTHER" as const, price: 45, unit: "PER_GROUP" as const, description: "Meet & greet with private transfer to your hotel." },
    ].map((a) => db.addOn.create({ data: a })),
  );
  const pick = (...names: string[]) => ({ connect: addOns.filter((a) => names.some((n) => a.name.startsWith(n))).map((a) => ({ id: a.id })) });

  const standardInc = "Park & conservancy entry fees\nGame drives in a 4x4 safari vehicle\nProfessional English-speaking driver-guide\nAccommodation as per itinerary\nMeals as indicated (B = breakfast, L = lunch, D = dinner)\nBottled drinking water in the vehicle\nAirport / hotel pick-up and drop-off in Nairobi";
  const standardExc = "International flights and visa fees\nTravel insurance\nTips and gratuities\nAlcoholic and soft drinks at lodges\nOptional activities (balloon safari, Maasai village visit)\nPersonal items";

  const tours = [
    {
      slug: "3-day-maasai-mara-safari",
      title: "3-Day Maasai Mara Safari",
      summary: "The classic short safari — big cats, vast plains and, in season, the Great Migration.",
      description: "Journey from Nairobi down the Great Rift Valley to the world-famous Maasai Mara National Reserve. Spend two full days tracking lions, leopards, cheetahs, elephants and buffalo, with sundowners over the savannah.",
      destination: "Maasai Mara, Kenya",
      durationDays: 3,
      coverImage: img("photo-1516426122078-c23e76319801"),
      priceFrom: 520,
      featured: true,
      categoryId: wildlife.id,
      rates: rateGrid(520, 38000),
      addOns: pick("Private 4x4", "BMW", "Nairobi → Mara", "Luxury tented", "Mid-range", "Hot-air", "Airport"),
      images: ["photo-1547471080-7cc2caa01a7e", "photo-1549366021-9f761d450615", "photo-1535941339077-2dd1c7963098"],
      days: [
        { title: "Nairobi → Maasai Mara", description: "Morning pick-up from your Nairobi hotel and drive via the Great Rift Valley viewpoint. Arrive in time for lunch at camp, followed by an afternoon game drive.", accommodation: "Mara Budget Camp", meals: "L, D" },
        { title: "Full day in the Maasai Mara", description: "Full day of game viewing with a picnic lunch by the Mara River — watch for crocodiles, hippos and, from July to October, dramatic river crossings.", accommodation: "Mara Budget Camp", meals: "B, L, D" },
        { title: "Maasai Mara → Nairobi", description: "Early-morning game drive when the predators are most active, breakfast, then drive back to Nairobi arriving late afternoon.", accommodation: null, meals: "B, L" },
      ],
    },
    {
      slug: "5-day-amboseli-tsavo-safari",
      title: "5-Day Amboseli & Tsavo Safari",
      summary: "Elephant herds beneath Mt Kilimanjaro and the red-earth wilderness of Tsavo.",
      description: "Combine Amboseli, famous for its large elephant herds framed by Kilimanjaro, with Tsavo West's volcanic landscapes and Mzima Springs, and Tsavo East's legendary red elephants.",
      destination: "Amboseli & Tsavo, Kenya",
      durationDays: 5,
      coverImage: img("photo-1523805009345-7448845a9e53"),
      priceFrom: 890,
      featured: true,
      categoryId: wildlife.id,
      rates: rateGrid(890, 72000),
      addOns: pick("Private 4x4", "Luxury tented", "Mid-range", "Airport"),
      images: ["photo-1489392191049-fc10c97e64b6", "photo-1504432842672-1a79f78e4084", "photo-1586861203927-800a5acdcc4d"],
      days: [
        { title: "Nairobi → Amboseli", description: "Drive south to Amboseli National Park. Afternoon game drive with views of Kilimanjaro.", accommodation: "Amboseli Sopa Lodge", meals: "L, D" },
        { title: "Amboseli", description: "Full day exploring swamps and plains packed with elephants, wildebeest and flamingos. Visit Observation Hill.", accommodation: "Amboseli Sopa Lodge", meals: "B, L, D" },
        { title: "Amboseli → Tsavo West", description: "Drive to Tsavo West. Visit Mzima Springs for hippos and the Shetani lava flows.", accommodation: "Severin Safari Camp", meals: "B, L, D" },
        { title: "Tsavo East", description: "Game drive in Tsavo East to find the famous red elephants and Lugard Falls.", accommodation: "Voi Wildlife Lodge", meals: "B, L, D" },
        { title: "Tsavo → Nairobi or Mombasa", description: "Morning game drive, then transfer to Nairobi or continue to the coast.", accommodation: null, meals: "B, L" },
      ],
    },
    {
      slug: "diani-beach-getaway",
      title: "4-Night Diani Beach Getaway",
      summary: "Powder-white sand, turquoise water and a dhow trip to Wasini Island.",
      description: "Unwind on one of Africa's best beaches. Includes a full-day Kisite-Mpunguti marine park excursion with snorkelling, dolphin spotting and a Swahili seafood lunch on Wasini Island.",
      destination: "Diani, South Coast Kenya",
      durationDays: 5,
      coverImage: img("photo-1507525428034-b723cf961d3e"),
      priceFrom: 640,
      featured: true,
      categoryId: beach.id,
      rates: rateGrid(640, 48000),
      addOns: pick("Nairobi → Mombasa", "Self-drive", "Airport"),
      images: ["photo-1519046904884-53103b34b206", "photo-1540541338287-41700207dee6", "photo-1566073771259-6a8506099945"],
      days: [
        { title: "Arrive Diani", description: "Transfer from Ukunda airstrip or Mombasa to your beach resort. Afternoon at leisure.", accommodation: "Diani Beach Resort", meals: "D" },
        { title: "Beach day", description: "Relax, swim or try kite-surfing and stand-up paddle boarding.", accommodation: "Diani Beach Resort", meals: "B, D" },
        { title: "Wasini Island dhow trip", description: "Full-day dhow excursion to Kisite marine park — snorkelling, dolphins and a seafood lunch.", accommodation: "Diani Beach Resort", meals: "B, L, D" },
        { title: "Shimba Hills or leisure", description: "Optional visit to Shimba Hills for sable antelope and Sheldrick Falls, or another day on the beach.", accommodation: "Diani Beach Resort", meals: "B, D" },
        { title: "Depart", description: "Breakfast and transfer for your onward journey.", accommodation: null, meals: "B" },
      ],
    },
    {
      slug: "iten-high-altitude-running-camp",
      title: "7-Day Iten High-Altitude Running Camp",
      summary: "Train where champions train — guided runs in the 'Home of Champions' at 2,400m.",
      description: "Experience the Kenyan running culture in Iten. Daily group runs with local pacers, track sessions at the Kamariny stadium, physio, and a visit to a champions' training camp. Ideal for marathon preparation.",
      destination: "Iten, Elgeyo-Marakwet, Kenya",
      durationDays: 7,
      coverImage: img("photo-1552674605-db6ffd4facb5"),
      priceFrom: 780,
      featured: false,
      categoryId: sports.id,
      rates: rateGrid(780, 60000),
      addOns: pick("Self-drive", "Airport"),
      images: ["photo-1459865264687-595d652de67e", "photo-1452626038306-9aae5e071dd3"],
      days: [
        { title: "Nairobi → Eldoret → Iten", description: "Fly to Eldoret and transfer up to Iten. Easy shake-out run and camp orientation.", accommodation: "Kerio View Hotel", meals: "L, D" },
        { title: "Fartlek with local pacers", description: "Famous Tuesday fartlek on dirt roads, afternoon recovery jog and stretching.", accommodation: "Kerio View Hotel", meals: "B, L, D" },
        { title: "Track session", description: "Speed work at Kamariny track, followed by a physio session.", accommodation: "Kerio View Hotel", meals: "B, L, D" },
        { title: "Long run & Kerio Valley", description: "Long run with views over the Kerio Valley escarpment. Afternoon visit to a champions' camp.", accommodation: "Kerio View Hotel", meals: "B, L, D" },
        { title: "Hill repeats", description: "Hill session and optional gym work.", accommodation: "Kerio View Hotel", meals: "B, L, D" },
        { title: "Easy day & culture", description: "Easy run then visit a local farm and school.", accommodation: "Kerio View Hotel", meals: "B, L, D" },
        { title: "Depart", description: "Final easy run and transfer to Eldoret airport.", accommodation: null, meals: "B" },
      ],
    },
    {
      slug: "hells-gate-lake-naivasha-day-trip",
      title: "Hell's Gate & Lake Naivasha Day Trip",
      summary: "Cycle among zebras, hike the gorge and take a boat ride among hippos.",
      description: "A perfect day out from Nairobi: bike through Hell's Gate National Park, hike the Ol Njorowa Gorge, then take a boat ride on Lake Naivasha and a walking safari on Crescent Island.",
      destination: "Naivasha, Kenya",
      durationDays: 1,
      coverImage: img("photo-1551632811-561732d1e306"),
      priceFrom: 140,
      featured: false,
      categoryId: culture.id,
      rates: rateGrid(140, 9500),
      addOns: pick("Private 4x4"),
      images: ["photo-1621414050946-1b936a78491f", "photo-1590523277543-a94d2e4eb00b"],
      days: [
        { title: "Nairobi → Hell's Gate → Naivasha → Nairobi", description: "Early departure, cycling and gorge hike in Hell's Gate, lunch by the lake, boat ride and Crescent Island walk. Return to Nairobi in the evening.", accommodation: null, meals: "L" },
      ],
    },
  ];

  for (const t of tours) {
    const { rates, addOns: ao, images, days, ...data } = t;
    await db.tour.create({
      data: {
        ...data,
        inclusions: standardInc,
        exclusions: standardExc,
        addOns: ao,
        rates: { create: rates },
        images: { create: images.map((id, i) => ({ url: img(id), sort: i })) },
        days: { create: days.map((d, i) => ({ ...d, dayNumber: i + 1 })) },
      },
    });
  }

  // Suppliers
  const [maraCamp, , cruiser] = await Promise.all(
    [
      { name: "Mara Budget Camp", type: "CAMP" as const, contactName: "Reservations", email: "res@marabudget.example", phone: "+254 711 000 001", location: "Talek, Maasai Mara" },
      { name: "Amboseli Sopa Lodge", type: "LODGE" as const, contactName: "Front Office", email: "amboseli@sopa.example", phone: "+254 711 000 002", location: "Amboseli" },
      { name: "Rift 4x4 Fleet", type: "TRANSPORT" as const, contactName: "James Mwangi", email: "fleet@rift4x4.example", phone: "+254 722 000 003", location: "Nairobi" },
      { name: "Kenya Wildlife Service", type: "PARK" as const, email: "tickets@kws.example", location: "Nairobi" },
      { name: "Safarilink Aviation", type: "AIRLINE" as const, email: "sales@safarilink.example", location: "Wilson Airport" },
      { name: "Diani Beach Resort", type: "HOTEL" as const, email: "book@dianiresort.example", location: "Diani" },
    ].map((s) => db.supplier.create({ data: s })),
  );

  // Blog
  await db.blogPost.createMany({
    data: [
      {
        slug: "what-to-pack-for-a-kenyan-safari",
        title: "What to Pack for a Kenyan Safari",
        excerpt: "Neutral colours, layers for chilly mornings and a good pair of binoculars — our complete packing list.",
        coverImage: img("photo-1547471080-7cc2caa01a7e"),
        content:
          "## Clothing\n\nPack neutral colours (khaki, olive, beige) — bright colours can disturb animals and dark blue attracts tsetse flies. Mornings on the plains are cold, so bring a fleece and a light waterproof jacket.\n\n## Essentials\n\n- Binoculars (one pair per person if possible)\n- Sunscreen, sunglasses and a wide-brimmed hat\n- Soft duffel bag — domestic flights limit you to 15kg in soft luggage\n- Camera with spare batteries and memory cards\n- Insect repellent and any prescribed malaria tablets\n\n## Documents\n\nPassport valid for 6 months, eTA (electronic travel authorisation), yellow fever certificate if arriving from an endemic country, and travel insurance details.",
      },
      {
        slug: "best-time-to-see-the-great-migration",
        title: "When Is the Best Time to See the Great Migration?",
        excerpt: "River crossings, calving season and how to plan your Mara trip around the herds.",
        coverImage: img("photo-1535941339077-2dd1c7963098"),
        content:
          "The wildebeest migration reaches the Maasai Mara around **July** and stays until **October**. River crossings on the Mara River are most frequent in August and September.\n\nThis is peak season, so camps fill fast — we recommend booking 6–9 months ahead. Outside these months the Mara is quieter, cheaper and still excellent for big cats.",
      },
      {
        slug: "resident-vs-non-resident-rates-explained",
        title: "Resident vs Non-Resident Rates Explained",
        excerpt: "Why park fees and lodge rates differ for Kenyan residents, and how to qualify.",
        coverImage: img("photo-1523805009345-7448845a9e53"),
        content:
          "Kenyan citizens and holders of valid residence permits pay discounted **resident rates** for park fees and at most lodges, usually quoted in Kenyan shillings. Non-residents pay rates in US dollars.\n\nWhen you inquire, choose your residency status and we will show the correct price. You'll need to present your ID or permit at park gates.",
      },
    ],
  });

  // Demo pipeline record
  const mara = await db.tour.findUniqueOrThrow({ where: { slug: "3-day-maasai-mara-safari" }, include: { rates: true } });
  const customer = await db.customer.create({
    data: { name: "Anna Müller", email: "anna@example.com", phone: "+49 170 0000000", country: "Germany", residency: "NON_RESIDENT" },
  });
  const inquiry = await db.inquiry.create({
    data: {
      ref: "INQ-DEMO-0001",
      tourId: mara.id,
      customerId: customer.id,
      name: customer.name,
      email: customer.email!,
      phone: customer.phone,
      country: "Germany",
      adults: 2,
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-11-12"),
      message: "Honeymoon trip — would love a nice tented camp.",
      estimatedTotal: 1196,
      status: "WON",
    },
  });
  const quote = await db.quote.create({
    data: {
      number: "QT-DEMO-0001",
      customerId: customer.id,
      inquiryId: inquiry.id,
      tourId: mara.id,
      title: "3-Day Maasai Mara Honeymoon Safari",
      startDate: inquiry.startDate,
      endDate: inquiry.endDate,
      adults: 2,
      status: "ACCEPTED",
      validUntil: new Date("2026-10-31"),
      items: {
        create: [
          { description: "Mara Budget Camp — 2 nights, full board (per person)", supplierId: maraCamp.id, quantity: 2, unitCost: 180, unitPrice: 300, sort: 0 },
          { description: "4x4 safari vehicle with driver-guide — 3 days", supplierId: cruiser.id, quantity: 1, unitCost: 450, unitPrice: 520, sort: 1 },
          { description: "Maasai Mara park fees — 2 days (per person)", quantity: 2, unitCost: 200, unitPrice: 200, sort: 2 },
        ],
      },
    },
  });
  const booking = await db.booking.create({
    data: {
      ref: "BK-DEMO-0001",
      customerId: customer.id,
      quoteId: quote.id,
      tourId: mara.id,
      title: quote.title,
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-11-12"),
      adults: 2,
      total: 1520,
      status: "CONFIRMED",
      services: {
        create: [
          { supplierId: maraCamp.id, description: "2 nights full board, 1 double tent", serviceDate: new Date("2026-11-10"), quantity: 2, cost: 360, status: "CONFIRMED", voucherNo: "VCH-DEMO-0001" },
          { supplierId: cruiser.id, description: "4x4 Land Cruiser + driver-guide, 3 days", serviceDate: new Date("2026-11-10"), quantity: 1, cost: 450, status: "REQUESTED", voucherNo: "VCH-DEMO-0002" },
        ],
      },
    },
  });
  await db.invoice.create({
    data: {
      number: "INV-DEMO-0001",
      customerId: customer.id,
      bookingId: booking.id,
      issueDate: new Date("2026-09-20"),
      dueDate: new Date("2026-10-10"),
      status: "PARTIAL",
      items: {
        create: [
          { description: "3-Day Maasai Mara Honeymoon Safari — 2 adults", quantity: 1, unitPrice: 1520, sort: 0 },
        ],
      },
      payments: { create: [{ date: new Date("2026-09-21"), amount: 760, method: "BANK", reference: "TT-889210", notes: "50% deposit" }] },
    },
  });
  await db.inquiry.create({
    data: {
      ref: "INQ-DEMO-0002",
      tourId: (await db.tour.findUniqueOrThrow({ where: { slug: "diani-beach-getaway" } })).id,
      name: "Brian Otieno",
      email: "brian@example.co.ke",
      phone: "+254 722 111 222",
      country: "Kenya",
      residency: "RESIDENT",
      adults: 4,
      children: 2,
      startDate: new Date("2026-12-20"),
      message: "Family holiday over Christmas.",
      estimatedTotal: 312000,
      currency: "KES",
    },
  });

  console.log("Seed complete. Login: admin@tours.local / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

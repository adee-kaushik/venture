export interface QualificationField {
  id: string;
  label: string;
  promptQuestion: string;
  required: boolean;
  type: "text" | "phone" | "select" | "date";
  options?: string[];
}

export interface BusinessTemplate {
  id: "coaching" | "salon" | "clinic" | "cafe";
  name: string;
  tagline: string;
  icon: string;
  accentColor: string;
  knowledgeCategories: string[];
  qualificationQuestions: QualificationField[];
  bookingFlowName: string;
  bookingFields: QualificationField[];
  defaultKnowledge: Array<{
    category: string;
    title: string;
    content: string;
  }>;
  sampleQuestions: string[];
}

export const TEMPLATES: Record<string, BusinessTemplate> = {
  coaching: {
    id: "coaching",
    name: "Coaching Centre / Institute",
    tagline: "Qualify parent inquiries & book free demo classes instantly",
    icon: "GraduationCap",
    accentColor: "indigo",
    knowledgeCategories: [
      "courses",
      "fees",
      "batches",
      "faculty",
      "results",
      "timings",
      "location",
      "faq"
    ],
    qualificationQuestions: [
      {
        id: "studentClass",
        label: "Student's Current Class",
        promptQuestion: "Which class is the student currently studying in?",
        required: true,
        type: "select",
        options: ["Class 9", "Class 10", "Class 11", "Class 12", "Dropper / 12th Pass"]
      },
      {
        id: "targetExam",
        label: "Target Exam",
        promptQuestion: "Which exam are you preparing for (e.g. JEE Main/Advanced, NEET, CBSE Boards, Olympiad)?",
        required: true,
        type: "select",
        options: ["JEE (Main + Advanced)", "NEET (Medical)", "CBSE Boards (Class 9-10)", "CBSE Boards (Class 11-12)"]
      },
      {
        id: "studentName",
        label: "Student / Parent Name",
        promptQuestion: "May I know your good name please?",
        required: true,
        type: "text"
      },
      {
        id: "phone",
        label: "Parent WhatsApp / Contact Number",
        promptQuestion: "Please share your 10-digit phone number so our academic counselor can connect and reserve your seat.",
        required: true,
        type: "phone"
      }
    ],
    bookingFlowName: "Free Demo Class / Diagnostic Test",
    bookingFields: [
      {
        id: "demoSubject",
        label: "Subject for Demo",
        promptQuestion: "Which subject demo would you like to attend?",
        required: true,
        type: "select",
        options: ["Physics", "Chemistry", "Mathematics", "Biology", "Full Science Combo"]
      },
      {
        id: "preferredSlot",
        label: "Preferred Timing",
        promptQuestion: "What day or slot suits you best for the demo?",
        required: true,
        type: "text"
      }
    ],
    defaultKnowledge: [
      {
        category: "courses",
        title: "Offered Programs & Batches",
        content: "We offer two-year integrated foundation batches for Class 11 (JEE/NEET), one-year target batches for Class 12, and intensive crash courses. Class sizes are capped at 35 students per batch for personal attention."
      },
      {
        category: "fees",
        title: "Fee Structure & Installments",
        content: "Class 11 JEE/NEET 2-Year Program: ₹85,000 per year (payable in 3 installments). Class 12 1-Year Program: ₹90,000. Up to 40% merit scholarship is available based on our free diagnostic assessment test."
      },
      {
        category: "faculty",
        title: "Faculty Profiles",
        content: "All Physics, Chemistry, and Math modules are led by senior IIT and NIT alumni with 10+ years of teaching experience. Dr. R.K. Sharma leads Botany/Zoology (15+ years NEET coaching experience)."
      },
      {
        category: "results",
        title: "Recent Results & Selection Track Record",
        content: "In 2025-2026, 42 of our students scored 99+ percentile in JEE Mains, and 28 secured government medical college seats in NEET. Our highest rank was AIR 314 in JEE Advanced."
      },
      {
        category: "timings",
        title: "Centre Timings & Batch Schedule",
        content: "Morning Batch: 8:00 AM - 1:00 PM. Evening Batch: 4:00 PM - 8:30 PM. Doubt counters remain open till 9:00 PM Monday through Saturday. Sunday mock tests run 9:00 AM - 12:00 PM."
      },
      {
        category: "location",
        title: "Address & Campus Location",
        content: "Plot 42, 2nd Floor, Apex Tower, Tonk Road, Lal Kothi, Jaipur, Rajasthan 302015. Landmark: Near Vidhan Sabha circle."
      }
    ],
    sampleQuestions: [
      "Fees kitni hai 11th JEE batch ki?",
      "Can I get a demo class this Saturday?",
      "Faculty kaun hai Physics ke liye?",
      "Do you provide hostel facility or bus transport?",
      "Scholarship test kab hota hai?"
    ]
  },

  salon: {
    id: "salon",
    name: "Luxury Salon & Spa",
    tagline: "Instant service booking, price quotes & no-show reduction",
    icon: "Scissors",
    accentColor: "rose",
    knowledgeCategories: [
      "services",
      "prices",
      "packages",
      "stylists",
      "timings",
      "location",
      "hygiene_policy",
      "faq"
    ],
    qualificationQuestions: [
      {
        id: "serviceWanted",
        label: "Desired Service",
        promptQuestion: "Which service are you interested in today (e.g., Haircut, Keratin, HydraFacial, Bridal Package)?",
        required: true,
        type: "text"
      },
      {
        id: "preferredDayTime",
        label: "Preferred Slot",
        promptQuestion: "Which day and time do you prefer to visit?",
        required: true,
        type: "text"
      },
      {
        id: "customerName",
        label: "Your Name",
        promptQuestion: "May I have your name to hold the appointment slot?",
        required: true,
        type: "text"
      },
      {
        id: "phone",
        label: "Phone Number",
        promptQuestion: "Please provide your phone number so we can send the appointment confirmation details.",
        required: true,
        type: "phone"
      }
    ],
    bookingFlowName: "Appointment Booking",
    bookingFields: [
      {
        id: "stylistPreference",
        label: "Preferred Stylist",
        promptQuestion: "Do you have a specific senior stylist preference?",
        required: false,
        type: "text"
      }
    ],
    defaultKnowledge: [
      {
        category: "services",
        title: "Hair & Skin Menu",
        content: "Hair styling, Kérastase hair spa, Brazilian Keratin Botox treatment, Balayage color, Organic HydraFacials, Bridal & Groom pre-wedding makeovers."
      },
      {
        category: "prices",
        title: "Price Guide",
        content: "Women's Designer Haircut & Blowdry: ₹800. Men's Executive Cut: ₹450. Keratin Smoothing Treatment: starts at ₹3,999 (depending on hair length). HydraFacial Glow: ₹2,499. Bridal Makeup: ₹15,000 onwards."
      },
      {
        category: "packages",
        title: "Current Seasonal Offers",
        content: "Pre-festive combo: Hair Spa + Express Facial + Manicure for ₹1,999 (regular ₹3,200). 15% flat off for weekday appointments (Tue-Thu) before 2:00 PM."
      },
      {
        category: "timings",
        title: "Salon Hours",
        content: "Open Tuesday through Sunday: 10:00 AM to 8:30 PM. Closed on Mondays for deep sanitization."
      },
      {
        category: "location",
        title: "Location & Parking",
        content: "Shop 14, C-Scheme, Ashok Nagar, Near Central Park Gate 2, Jaipur. Dedicated valet parking available."
      }
    ],
    sampleQuestions: [
      "Keratin treatment ka price kitna hai for shoulder length hair?",
      "Can I book an appointment for tomorrow 4 PM?",
      "Do you have weekday discount offers?",
      "Do you take bridal makeup bookings?"
    ]
  },

  clinic: {
    id: "clinic", name: "Clinic", tagline: "Help patients find clinic information and request appointments", icon: "HeartPulse", accentColor: "teal",
    knowledgeCategories: ["services", "timings", "appointments", "location", "faq"],
    qualificationQuestions: [
      { id: "name", label: "Patient name", promptQuestion: "What is your name?", required: true, type: "text" },
      { id: "phone", label: "Contact number", promptQuestion: "Which number can reception call?", required: true, type: "phone" }
    ],
    bookingFlowName: "Clinic appointment",
    bookingFields: [{ id: "date", label: "Preferred date", promptQuestion: "When would you like to visit?", required: true, type: "date" }],
    defaultKnowledge: [
      { category: "services", title: "Reception assistance", content: "This is a sample clinic. Reception can help with appointment requests, visiting hours and location. Consultation fees and doctor availability must be confirmed by reception." },
      { category: "policy", title: "Clinical boundaries", content: "The assistant does not provide diagnoses, prescriptions, treatment recommendations or emergency care. Contact a qualified clinician for medical advice. For emergencies, contact local emergency services immediately." }
    ],
    sampleQuestions: ["What are your opening hours?", "How do I request an appointment?", "Where is the clinic?"]
  },
  cafe: {
    id: "cafe",
    name: "Artisan Cafe & Bakery",
    tagline: "Capture party bookings, catering leads & answer menu queries",
    icon: "Coffee",
    accentColor: "amber",
    knowledgeCategories: [
      "menu",
      "prices",
      "specials",
      "events_parties",
      "timings",
      "location",
      "faq"
    ],
    qualificationQuestions: [
      {
        id: "partySize",
        label: "Party Size / Guests",
        promptQuestion: "How many guests are you expecting?",
        required: true,
        type: "text"
      },
      {
        id: "eventDate",
        label: "Date & Time",
        promptQuestion: "What date and time would you like to reserve?",
        required: true,
        type: "text"
      },
      {
        id: "occasion",
        label: "Occasion",
        promptQuestion: "What occasion are you celebrating (Birthday, Anniversary, Casual Catch-up, Corporate Meeting)?",
        required: false,
        type: "text"
      },
      {
        id: "customerName",
        label: "Name",
        promptQuestion: "May I have your name please?",
        required: true,
        type: "text"
      },
      {
        id: "phone",
        label: "Phone Number",
        promptQuestion: "Please share your phone number to confirm your table reservation.",
        required: true,
        type: "phone"
      }
    ],
    bookingFlowName: "Table / Event Reservation",
    bookingFields: [
      {
        id: "specialRequest",
        label: "Special Requests (Cake/Decor)",
        promptQuestion: "Do you have any dietary preferences or custom cake/decoration requests?",
        required: false,
        type: "text"
      }
    ],
    defaultKnowledge: [
      {
        category: "menu",
        title: "Specialty Coffee & Food",
        content: "Artisan specialty pour-overs, cold brews, sourdough toasts, wood-fired Neapolitan pizzas, handmade pastas, and eggless gourmet desserts."
      },
      {
        category: "prices",
        title: "Menu Pricing Highlights",
        content: "Cappuccino/Flat White: ₹210. Signature Vietnamese Iced Coffee: ₹260. Truffle Mushroom Pizza: ₹495. Avocado Sourdough Toast: ₹360. Average cost for two: ₹800 - ₹1,100."
      },
      {
        category: "events_parties",
        title: "Parties & Private Bookings",
        content: "Rooftop section available for private birthday parties (up to 30 people) with custom customized party food packages starting at ₹650 per head. Custom cake pre-orders required 24 hours in advance."
      },
      {
        category: "timings",
        title: "Opening Hours",
        content: "Open 7 days a week from 8:30 AM to 11:00 PM. Breakfast menu served until 12:30 PM."
      },
      {
        category: "location",
        title: "Address & Ambiance",
        content: "Opposite World Trade Park (WTP), Malviya Nagar, Jaipur. High-speed Wi-Fi, pet-friendly outdoor seating, and work-friendly power outlets."
      }
    ],
    sampleQuestions: [
      "Can we reserve a table for 8 people this Sunday evening?",
      "Do you have vegan and eggless options?",
      "What is the cost for booking the rooftop for a birthday party?",
      "Is the cafe pet friendly and work friendly?"
    ]
  }
};

export function getTemplate(templateType: string): BusinessTemplate {
  return TEMPLATES[templateType] || TEMPLATES.coaching;
}

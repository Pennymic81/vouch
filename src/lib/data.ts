// Sample data used by the UI until the database (step 3) is in place.
// Money and rates are placeholders on purpose — set real values later.

export type MilestoneStatus = "paid" | "awaiting" | "in_qa" | "upcoming" | "unfunded";

export type Milestone = {
  n: number;
  title: string;
  criteria: string[];
  amount: string;
  days: string;
  status: MilestoneStatus;
};

export const samplePlan = {
  id: "support-chatbot",
  title: "Customer support chatbot",
  summary:
    "An AI assistant on your website and WhatsApp that answers delivery, returns and stock questions from your own policies, and hands complex chats to your staff.",
  idea:
    "I run an online furniture store. Customers keep asking the same questions about delivery, returns and stock on WhatsApp and our website. I want a chatbot that answers them using our own policies, and passes harder questions to my staff.",
  budget: "[MIN] – [MAX]",
  weeks: "[X] weeks",
  bestFit: "AI engineer",
  skills: ["RAG / knowledge base", "WhatsApp Business API", "Website chat widget", "Human hand-off", "Analytics"],
  milestones: [
    {
      n: 1,
      title: "Knowledge base & FAQ import",
      criteria: [
        "Your delivery, returns and warranty policies are loaded into the bot",
        "Bot answers 20 agreed test questions correctly from those policies",
      ],
      amount: "[AMOUNT]",
      days: "[X] days",
      status: "paid",
    },
    {
      n: 2,
      title: "Chat widget on your website",
      criteria: ["Widget appears on every page and works on phones", "Matches your brand colors and logo"],
      amount: "[AMOUNT]",
      days: "[X] days",
      status: "paid",
    },
    {
      n: 3,
      title: "WhatsApp + hand-off to staff",
      criteria: [
        "Same answers available on your WhatsApp Business number",
        "Unanswerable questions are passed to a staff inbox with the full chat",
      ],
      amount: "[AMOUNT]",
      days: "[X] days",
      status: "awaiting",
    },
    {
      n: 4,
      title: "Analytics dashboard",
      criteria: ["See top questions, answer rate and hand-offs per week"],
      amount: "[AMOUNT]",
      days: "[X] days",
      status: "unfunded",
    },
  ] as Milestone[],
};

export type Candidate = {
  initials: string;
  first: string;
  name: string;
  role: string;
  where: string;
  available: string;
  why: string[];
  gap: string;
  proof: string[];
};

export const candidates: Candidate[] = [
  {
    initials: "AO",
    first: "Amara",
    name: "Amara Okafor",
    role: "AI engineer · LLM apps & RAG",
    where: "Lagos · GMT+1",
    available: "Available in 3 days",
    why: [
      "Built 3 support chatbots on company documents (RAG)",
      "Shipped a WhatsApp Business API integration",
      "Has built human hand-off to a staff inbox before",
    ],
    gap: "No analytics dashboards yet — milestone 4 may take longer",
    proof: ["Retail FAQ bot — live demo", "WhatsApp order assistant — repo"],
  },
  {
    initials: "DR",
    first: "Daniel",
    name: "Daniel Reyes",
    role: "Full-stack developer · AI integrations",
    where: "Mexico City · GMT−6",
    available: "Available now",
    why: [
      "Built embeddable chat widgets for 2 e-commerce stores",
      "Strong analytics and dashboard work",
      "Integrated an LLM API with a store inventory system",
    ],
    gap: "WhatsApp would be his first — expect extra time on milestone 3",
    proof: ["Store chat widget — live demo", "Sales dashboard — repo"],
  },
  {
    initials: "PN",
    first: "Priya",
    name: "Priya Nair",
    role: "AI product engineer",
    where: "Bengaluru · GMT+5:30",
    available: "Available in 1 week",
    why: [
      "Led a full support-bot build from spec to launch",
      "Covers all 4 milestones, including analytics",
      "Writes clear weekly progress updates",
    ],
    gap: "Less overlap with your working hours",
    proof: ["Helpdesk assistant — case study", "Bot analytics — live demo"],
  },
];

export const invitations = [
  {
    title: "Order-tracking assistant",
    client: "Online grocery store",
    milestones: 3,
    summary:
      "A chatbot that tells customers where their order is, using the store's delivery system, on the website and WhatsApp.",
    why: "WhatsApp + RAG chatbots shipped",
  },
  {
    title: "Internal HR policy bot",
    client: "Logistics company",
    milestones: 2,
    summary:
      "Staff ask questions about leave, payroll dates and benefits; the bot answers from the HR handbook and flags anything it can't answer.",
    why: "Knowledge-base bots shipped",
  },
];

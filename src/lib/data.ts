// Sample plan shown in the landing page preview card.
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

export const CLIENTS = [
  { id: 1, name: "Ibrahim Al-Rashid", nationalId: "1098765432", phone: "+966 50 123 4567", email: "ibrahim@example.com", address: "Riyadh, Saudi Arabia", activeCases: 2, totalFees: 45000, paidFees: 32000, lastActivity: "2025-07-10", status: "active", notes: "High-value client, prefers morning calls." },
  { id: 2, name: "Layla Mustafa", nationalId: "2087654321", phone: "+212 6 12 34 56 78", email: "layla@example.com", address: "Casablanca, Morocco", activeCases: 1, totalFees: 18500, paidFees: 18500, lastActivity: "2025-07-08", status: "active", notes: "" },
  { id: 3, name: "Omar Benali", nationalId: "3076543210", phone: "+213 5 55 66 77 88", email: "omar@example.com", address: "Algiers, Algeria", activeCases: 3, totalFees: 62000, paidFees: 40000, lastActivity: "2025-07-05", status: "active", notes: "Referred by Al-Rashid." },
  { id: 4, name: "Sara El-Mahdi", nationalId: "4065432109", phone: "+20 10 9876 5432", email: "sara@example.com", address: "Cairo, Egypt", activeCases: 0, totalFees: 12000, paidFees: 12000, lastActivity: "2025-06-20", status: "closed", notes: "" },
  { id: 5, name: "Youssef Tazi", nationalId: "5054321098", phone: "+212 6 98 76 54 32", email: "youssef@example.com", address: "Rabat, Morocco", activeCases: 1, totalFees: 28000, paidFees: 14000, lastActivity: "2025-07-11", status: "active", notes: "Commercial dispute, urgent." },
];

export const CASES = [
  { id: 1, caseNumber: "2025-CIV-001", clientId: 1, title: "Al-Rashid Property Dispute", type: "civil", court: "Riyadh Civil Court", judge: "Hon. Khalid Al-Otaibi", status: "active", openDate: "2025-01-15", hearings: 3, nextHearing: "2025-07-18" },
  { id: 2, caseNumber: "2025-COM-012", clientId: 1, title: "Al-Rashid Commercial Contract", type: "commercial", court: "Commercial Court", judge: "Hon. Fatima Zahra", status: "active", openDate: "2025-03-02", hearings: 1, nextHearing: "2025-07-25" },
  { id: 3, caseNumber: "2025-CIV-008", clientId: 2, title: "Mustafa Custody Matter", type: "civil", court: "Family Court Casablanca", judge: "Hon. Rachid Bensouda", status: "active", openDate: "2025-02-10", hearings: 2, nextHearing: "2025-07-20" },
  { id: 4, caseNumber: "2025-CRM-003", clientId: 3, title: "Benali Criminal Defense", type: "criminal", court: "Algiers Criminal Court", judge: "Hon. Moussa Kaci", status: "pending", openDate: "2025-04-05", hearings: 0, nextHearing: "2025-07-30" },
  { id: 5, caseNumber: "2025-COM-020", clientId: 5, title: "Tazi Partnership Dissolution", type: "commercial", court: "Commercial Court Rabat", judge: "Hon. Amal Cherif", status: "urgent", openDate: "2025-06-01", hearings: 1, nextHearing: "2025-07-16" },
];

export const HEARINGS = [
  { id: 1, caseId: 1, title: "Property Dispute — Preliminary Hearing", date: "2025-07-18", time: "10:00", court: "Riyadh Civil Court", status: "upcoming", outcome: "" },
  { id: 2, caseId: 3, title: "Custody Hearing — Session 3", date: "2025-07-20", time: "09:30", court: "Family Court Casablanca", status: "upcoming", outcome: "" },
  { id: 3, caseId: 5, title: "Partnership Dissolution — Urgent", date: "2025-07-16", time: "11:00", court: "Commercial Court Rabat", status: "upcoming", outcome: "" },
  { id: 4, caseId: 2, title: "Commercial Contract Review", date: "2025-07-25", time: "14:00", court: "Commercial Court", status: "upcoming", outcome: "" },
  { id: 5, caseId: 1, title: "Property Dispute — Session 2", date: "2025-07-08", time: "10:00", court: "Riyadh Civil Court", status: "completed", outcome: "Adjourned pending document review." },
];

export const TASKS = [
  { id: 1, title: "Prepare brief for Benali criminal defense", assignee: "Lead Attorney", priority: "high", deadline: "2025-07-15", status: "in-progress", caseId: 4 },
  { id: 2, title: "Review Tazi partnership agreement", assignee: "Associate", priority: "urgent", deadline: "2025-07-14", status: "todo", caseId: 5 },
  { id: 3, title: "File property deed for Al-Rashid", assignee: "Secretary", priority: "normal", deadline: "2025-07-20", status: "todo", caseId: 1 },
  { id: 4, title: "Draft custody agreement for Mustafa", assignee: "Lead Attorney", priority: "high", deadline: "2025-07-18", status: "in-progress", caseId: 3 },
  { id: 5, title: "Collect outstanding fees from Tazi", assignee: "Secretary", priority: "normal", deadline: "2025-07-22", status: "done", caseId: 5 },
  { id: 6, title: "Send court schedule to Al-Rashid", assignee: "Secretary", priority: "low", deadline: "2025-07-25", status: "done", caseId: 1 },
];

export const DOCS = [
  { id: 1, name: "Property_Deed_AlRashid.pdf", type: "pdf", size: "2.4 MB", caseId: 1, clientId: 1, date: "2025-07-01", desc: "Original property deed" },
  { id: 2, name: "Contract_AlRashid_Com.docx", type: "docx", size: "856 KB", caseId: 2, clientId: 1, date: "2025-03-15", desc: "Commercial contract draft" },
  { id: 3, name: "Custody_Agreement_v2.pdf", type: "pdf", size: "1.2 MB", caseId: 3, clientId: 2, date: "2025-05-10", desc: "Second draft custody agreement" },
  { id: 4, name: "Benali_Police_Report.pdf", type: "pdf", size: "540 KB", caseId: 4, clientId: 3, date: "2025-04-08", desc: "Police report copy" },
  { id: 5, name: "Tazi_Partnership_Deed.pdf", type: "pdf", size: "3.1 MB", caseId: 5, clientId: 5, date: "2025-06-05", desc: "Original partnership deed" },
];

export const EXPENSES = [
  { id: 1, clientId: 1, caseId: 1, description: "Court filing fees", amount: 2500, date: "2025-01-20", type: "expense" },
  { id: 2, clientId: 1, caseId: 1, description: "Attorney retainer - Q1", amount: 15000, date: "2025-02-01", type: "payment", status: "paid" },
  { id: 3, clientId: 2, caseId: 3, description: "Full case retainer", amount: 18500, date: "2025-02-15", type: "payment", status: "paid" },
  { id: 4, clientId: 3, caseId: 4, description: "Criminal defense retainer", amount: 25000, date: "2025-04-10", type: "payment", status: "paid" },
  { id: 5, clientId: 5, caseId: 5, description: "Urgent case deposit", amount: 14000, date: "2025-06-05", type: "payment", status: "paid" },
  { id: 6, clientId: 3, caseId: 4, description: "Expert witness fees", amount: 8000, date: "2025-07-01", type: "invoice", status: "outstanding" },
  { id: 7, clientId: 5, caseId: 5, description: "Balance - partnership dissolution", amount: 14000, date: "2025-07-10", type: "invoice", status: "outstanding" },
];

export const ACTIVITIES = [
  { id: 1, clientId: 1, text: "Phone call — discussed next hearing strategy", time: "2 hours ago", type: "call" },
  { id: 2, clientId: 1, text: "Document uploaded: Property_Deed_AlRashid.pdf", time: "1 day ago", type: "doc" },
  { id: 3, clientId: 3, text: "Email sent — hearing schedule confirmed", time: "2 days ago", type: "email" },
  { id: 4, clientId: 5, text: "Note added — urgent attention required", time: "3 days ago", type: "note" },
  { id: 5, clientId: 2, text: "Invoice generated for custody case", time: "4 days ago", type: "invoice" },
];

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  CreditCard,
  Users,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Sparkles,
  UserX,
  Settings,
  Package,
  Headphones,
  Star,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  subcategory?: string;
  priority: string;
  suggestedTitle: string;
  suggestedDescription: string;
  tags: string[];
  color: string;
  slaHours?: number;
  quickTips?: string[];
  requiredFields?: string[];
  commonFollowUps?: string[];
  formFields?: Array<{
    fieldName: string;
    value: any;
    label?: string;
    highlighted?: boolean;
    placeholder?: boolean;
  }>;
  priorityEscalationRules?: {
    criticalIf?: string[];
    highIf?: string[];
    mediumIf?: string[];
    lowIf?: string[];
  };
  automationRules?: {
    autoAssignTo?: string;
    autoTag?: string[];
    autoNotify?: string[];
    slaReminders?: number[];
  };
}

export const TICKET_TEMPLATES: TicketTemplate[] = [
  {
    id: "booking-issue",
    name: "Booking Failed",
    description: "Customer unable to book classes through app or website",
    icon: Calendar,
    category: "Booking & Technology",
    subcategory: "Class Booking",
    priority: "high",
    slaHours: 4,
    suggestedTitle: "Class Booking Issue - Unable to Complete Reservation",
    suggestedDescription: `Customer experienced issues while attempting to book a class.

📱 DEVICE & PLATFORM
• Platform: [iOS/Android/Web]
• App version: [version]
• Device model: [model]

🚫 ERROR DETAILS
• Error message: [exact error text]
• Error code (if shown): [code]
• When did error occur: [specific time]

🔄 BOOKING ATTEMPT
• Class name: [class name]
• Date & time: [date/time]
• Membership type: [type]
• Credits/sessions available: [amount]

⚙️ TROUBLESHOOTING STEPS TRIED
• [Step 1]
• [Step 2]
• [Step 3]

💡 IMPACT
• Was any payment attempted: [yes/no]
• Transaction ID (if failed payment): [id]`,
    tags: ["booking", "technical", "app"],
    color: "from-blue-500 to-cyan-500",
    formFields: [
      { fieldName: "title", value: "Class Booking Issue - Unable to Complete Reservation", highlighted: false },
      { fieldName: "description", value: `Customer experienced issues while attempting to book a class.

📱 DEVICE & PLATFORM
• Platform: [iOS/Android/Web]
• App version: [version]
• Device model: [model]

🚫 ERROR DETAILS
• Error message: [exact error text]
• Error code (if shown): [code]
• When did error occur: [specific time]

🔄 BOOKING ATTEMPT
• Class name: [class name]
• Date & time: [date/time]
• Membership type: [type]
• Credits/sessions available: [amount]

⚙️ TROUBLESHOOTING STEPS TRIED
• [Step 1]
• [Step 2]
• [Step 3]

💡 IMPACT
• Was any payment attempted: [yes/no]
• Transaction ID (if failed payment): [id]`, highlighted: false },
      { fieldName: "priority", value: "high", highlighted: false },
      { fieldName: "source", value: "app", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "className", value: "[CLASS NAME]", highlighted: true, placeholder: true },
      { fieldName: "classDateTime", value: "", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["booking", "technical", "app"], highlighted: false }
    ],
    quickTips: [
      "Ask customer to clear app cache and try again",
      "Confirm their membership is active",
      "Check if they have available credits/sessions",
      "Try from a different device or browser"
    ],
    requiredFields: ["Platform", "Error message", "Class attempted"],
    commonFollowUps: [
      "Can you manually process the booking as a workaround?",
      "Is there a backend issue preventing bookings?",
      "Need to refund any transaction attempts"
    ]
  },
  {
    id: "payment-problem",
    name: "Payment Issue",
    description: "Problems with payment processing or billing",
    icon: CreditCard,
    category: "Booking & Technology",
    subcategory: "Payment Processing",
    priority: "high",
    slaHours: 2,
    suggestedTitle: "Payment Processing Error - Transaction Failed",
    suggestedDescription: `Customer encountered a payment issue during transaction.

💳 PAYMENT DETAILS
• Amount: [amount]
• Currency: [INR/USD/other]
• Payment method: [Card/UPI/Wallet/Other]
• Card type (if card): [Visa/Mastercard/Amex]

❌ ERROR INFORMATION
• Error message: [exact message]
• Error code: [code]
• Transaction ID (if generated): [id]
• When error occurred: [timestamp]

📋 TRANSACTION CONTEXT
• What was being purchased: [membership/class pack/retail]
• Product/package name: [name]
• Billing address matches registered: [yes/no]

🔍 ADDITIONAL INFO
• Has this card been used before: [yes/no]
• Is customer in different location: [yes/no]
• Amount attempted vs expected: [same/different]

✅ RESOLUTION NEEDED
• Refund required: [yes/no]
• Re-attempt payment: [yes/no]`,
    tags: ["payment", "billing", "urgent"],
    color: "from-emerald-500 to-teal-500",
    formFields: [
      { fieldName: "title", value: "Payment Processing Error - Transaction Failed", highlighted: false },
      { fieldName: "description", value: `Customer encountered a payment issue during transaction.

💳 PAYMENT DETAILS
• Amount: [amount]
• Currency: [INR/USD/other]
• Payment method: [Card/UPI/Wallet/Other]
• Card type (if card): [Visa/Mastercard/Amex]

❌ ERROR INFORMATION
• Error message: [exact message]
• Error code: [code]
• Transaction ID (if generated): [id]
• When error occurred: [timestamp]

📋 TRANSACTION CONTEXT
• What was being purchased: [membership/class pack/retail]
• Product/package name: [name]
• Billing address matches registered: [yes/no]

🔍 ADDITIONAL INFO
• Has this card been used before: [yes/no]
• Is customer in different location: [yes/no]
• Amount attempted vs expected: [same/different]

✅ RESOLUTION NEEDED
• Refund required: [yes/no]
• Re-attempt payment: [yes/no]`, highlighted: false },
      { fieldName: "priority", value: "high", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["payment", "billing", "urgent"], highlighted: false }
    ],
    quickTips: [
      "Check payment gateway status",
      "Verify card is not blocked or expired",
      "Confirm billing address matches card",
      "Process manually if gateway is down"
    ],
    requiredFields: ["Amount", "Payment method", "Error message"],
    commonFollowUps: [
      "Refund duplicate/partial charges immediately",
      "Contact payment processor if needed",
      "Send confirmation once resolved"
    ]
  },
  {
    id: "instructor-feedback",
    name: "Instructor Feedback",
    description: "Feedback or concern about instructor performance",
    icon: Star,
    category: "Customer Service",
    subcategory: "Staff Professionalism",
    priority: "medium",
    slaHours: 8,
    suggestedTitle: "Instructor Feedback - [Instructor Name] - [Date]",
    suggestedDescription: `Customer feedback regarding instructor performance.

👤 INSTRUCTOR INFORMATION
• Instructor name: [name]
• Studio location: [studio]
• Class type: [Pilates/Yoga/etc]

📅 CLASS DETAILS
• Class date: [date]
• Class time: [time]
• Class duration: [duration]
• Number of students in class: [approx]

⭐ FEEDBACK TYPE
• Nature: [Positive/Constructive/Complaint]
• Sentiment: [Excellent/Good/Satisfactory/Poor]
• Would they take class again: [yes/no]

📝 SPECIFIC FEEDBACK
• What went well: [details]
• Areas for improvement: [details]
• Safety concerns (if any): [details]
• Professionalism level: [1-5 scale]

💬 CUSTOMER CONTEXT
• Is this first time with instructor: [yes/no]
• Frequency of classes: [1st time/regular/occasional]
• Overall experience rating: [1-5]`,
    tags: ["instructor", "feedback", "class"],
    color: "from-blue-500 to-cyan-500",
    formFields: [
      { fieldName: "title", value: "Instructor Feedback - [Instructor Name] - [Date]", highlighted: false },
      { fieldName: "description", value: `Customer feedback regarding instructor performance.

👤 INSTRUCTOR INFORMATION
• Instructor name: [name]
• Studio location: [studio]
• Class type: [Pilates/Yoga/etc]

📅 CLASS DETAILS
• Class date: [date]
• Class time: [time]
• Class duration: [duration]
• Number of students in class: [approx]

⭐ FEEDBACK TYPE
• Nature: [Positive/Constructive/Complaint]
• Sentiment: [Excellent/Good/Satisfactory/Poor]
• Would they take class again: [yes/no]

📝 SPECIFIC FEEDBACK
• What went well: [details]
• Areas for improvement: [details]
• Safety concerns (if any): [details]
• Professionalism level: [1-5 scale]

💬 CUSTOMER CONTEXT
• Is this first time with instructor: [yes/no]
• Frequency of classes: [1st time/regular/occasional]
• Overall experience rating: [1-5]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "trainerName", value: "[INSTRUCTOR NAME]", highlighted: true, placeholder: true },
      { fieldName: "className", value: "[CLASS TYPE]", highlighted: true, placeholder: true },
      { fieldName: "classDateTime", value: "", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["instructor", "feedback", "class"], highlighted: false }
    ],
    quickTips: [
      "Separate positive feedback (for recognition) from constructive feedback",
      "If serious issue (safety, behavior), escalate immediately",
      "Check if customer has training background",
      "Consider scheduling feedback review with instructor"
    ],
    requiredFields: ["Instructor name", "Class date", "Feedback type"],
    commonFollowUps: [
      "Share feedback with instructor (positive or constructive)",
      "If complaint: schedule manager meeting with instructor",
      "For positive: consider for staff recognition",
      "Offer makeup class if service was subpar"
    ]
  },
  {
    id: "membership-inquiry",
    name: "Membership Query",
    description: "Questions about memberships, packages, or pricing",
    icon: Users,
    category: "Sales & Marketing",
    subcategory: "Trial Class Experience",
    priority: "medium",
    slaHours: 6,
    suggestedTitle: "Membership Inquiry - [Inquiry Type] - [Customer Name]",
    suggestedDescription: `Customer inquiry about membership options and pricing.

👤 CUSTOMER STATUS
• Status: [New/Existing member/Previous member]
• Current membership (if any): [type/duration]
• Expires on (if applicable): [date]

❓ INQUIRY DETAILS
• Main question: [question]
• Related to: [Pricing/Upgrade/Downgrade/Trial/Features]
• Specific package interest: [package name]

🎯 MEMBERSHIP OPTIONS NEEDED
• Session frequency interest: [1/2/3+ per week]
• Class types preferred: [Pilates/Yoga/Mixed]
• Flexibility needed: [Fixed schedule/Flexible]
• Budget range: [approximate]

📍 LOCATION
• Preferred studio: [studio name]
• Secondary options: [studios]
• Flexibility: [Online-only/In-person-only/Both]

🔄 COMPARISON NEEDED
• Comparing our membership to: [competitor/other]
• Key decision factors: [price/schedule/instructors]
• Preferred contact for details: [email/phone/WhatsApp]

💡 CONVERSION DETAILS
• Likely to purchase: [high/medium/low]
• Decision timeline: [today/this week/this month]
• Any concerns or objections: [list]`,
    tags: ["membership", "sales", "inquiry"],
    color: "from-amber-500 to-orange-500",
    formFields: [
      { fieldName: "title", value: "Membership Inquiry - [Inquiry Type] - [Customer Name]", highlighted: false },
      { fieldName: "description", value: `Customer inquiry about membership options and pricing.

👤 CUSTOMER STATUS
• Status: [New/Existing member/Previous member]
• Current membership (if any): [type/duration]
• Expires on (if applicable): [date]

❓ INQUIRY DETAILS
• Main question: [question]
• Related to: [Pricing/Upgrade/Downgrade/Trial/Features]
• Specific package interest: [package name]

🎯 MEMBERSHIP OPTIONS NEEDED
• Session frequency interest: [1/2/3+ per week]
• Class types preferred: [Pilates/Yoga/Mixed]
• Flexibility needed: [Fixed schedule/Flexible]
• Budget range: [approximate]

📍 LOCATION
• Preferred studio: [studio name]
• Secondary options: [studios]
• Flexibility: [Online-only/In-person-only/Both]

🔄 COMPARISON NEEDED
• Comparing our membership to: [competitor/other]
• Key decision factors: [price/schedule/instructors]
• Preferred contact for details: [email/phone/WhatsApp]

💡 CONVERSION DETAILS
• Likely to purchase: [high/medium/low]
• Decision timeline: [today/this week/this month]
• Any concerns or objections: [list]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "email", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["membership", "sales", "inquiry"], highlighted: false }
    ],
    quickTips: [
      "Prepare comparison chart of packages for email",
      "Offer first trial class as incentive",
      "Highlight class schedule that matches their needs",
      "Create urgency with limited-time offers if applicable"
    ],
    requiredFields: ["Inquiry type", "Membership interest", "Contact preference"],
    commonFollowUps: [
      "Send personalized package comparison",
      "Book trial class if interested",
      "Follow up in 24-48 hours if no response",
      "Send special offer after 3 days if no conversion"
    ]
  },
  {
    id: "safety-incident",
    name: "Safety Incident",
    description: "Report an injury or safety concern during class",
    icon: AlertTriangle,
    category: "Health & Safety",
    subcategory: "Injury During Class",
    priority: "critical",
    slaHours: 1,
    suggestedTitle: "⚠️ SAFETY INCIDENT - [Type] - [Studio] - URGENT",
    suggestedDescription: `⚠️ CRITICAL: Safety incident or injury report.

🚨 INCIDENT BASIC INFO
• Type: [Injury/Hazard/Near-miss/Illness]
• Severity: [Minor/Moderate/Severe]
• Date & time: [exact time]
• Location: [studio name & room]

👤 PERSON AFFECTED
• Name: [name]
• Age/demographics: [info]
• Membership status: [active/guest]
• Previous medical conditions: [relevant info]

📋 INCIDENT DESCRIPTION
• What happened: [detailed description]
• Body part/area affected: [if injury]
• How it occurred: [step-by-step]
• Equipment involved (if any): [type]
• Witnesses present: [names/count]

🏥 MEDICAL RESPONSE
• Immediate action taken: [CPR/First aid/Rest/Other]
• Medical professional contacted: [yes/no]
• Ambulance called: [yes/no]
• Hospital visit required: [yes/no]
• Current status: [recovered/ongoing treatment]

📸 DOCUMENTATION
• Photos/evidence: [attached]
• Incident report filed: [yes/no]
• Instructor report available: [yes/no]

⚖️ FOLLOW-UP NEEDED
• Legal/liability concern: [high/medium/low]
• Insurance notification: [required/not required]
• Compensation discussion needed: [yes/no]
• Root cause investigation: [yes/no]`,
    tags: ["safety", "urgent", "incident", "critical"],
    color: "from-red-500 to-rose-500",
    formFields: [
      { fieldName: "title", value: "⚠️ SAFETY INCIDENT - [Type] - [Studio] - URGENT", highlighted: false },
      { fieldName: "description", value: `⚠️ CRITICAL: Safety incident or injury report.

🚨 INCIDENT BASIC INFO
• Type: [Injury/Hazard/Near-miss/Illness]
• Severity: [Minor/Moderate/Severe]
• Date & time: [exact time]
• Location: [studio name & room]

👤 PERSON AFFECTED
• Name: [name]
• Age/demographics: [info]
• Membership status: [active/guest]
• Previous medical conditions: [relevant info]

📋 INCIDENT DESCRIPTION
• What happened: [detailed description]
• Body part/area affected: [if injury]
• How it occurred: [step-by-step]
• Equipment involved (if any): [type]
• Witnesses present: [names/count]

🏥 MEDICAL RESPONSE
• Immediate action taken: [CPR/First aid/Rest/Other]
• Medical professional contacted: [yes/no]
• Ambulance called: [yes/no]
• Hospital visit required: [yes/no]
• Current status: [recovered/ongoing treatment]

📸 DOCUMENTATION
• Photos/evidence: [attached]
• Incident report filed: [yes/no]
• Instructor report available: [yes/no]

⚖️ FOLLOW-UP NEEDED
• Legal/liability concern: [high/medium/low]
• Insurance notification: [required/not required]
• Compensation discussion needed: [yes/no]
• Root cause investigation: [yes/no]`, highlighted: false },
      { fieldName: "priority", value: "critical", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "incidentDateTime", value: "", highlighted: true, placeholder: true, label: "Incident Date & Time" },
      { fieldName: "customerName", value: "[PERSON AFFECTED NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[PERSON EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[PERSON PHONE]", highlighted: true, placeholder: true },
      { fieldName: "className", value: "[CLASS NAME IF APPLICABLE]", highlighted: true, placeholder: true },
      { fieldName: "classDateTime", value: "", highlighted: true, placeholder: true },
      { fieldName: "trainerName", value: "[INSTRUCTOR/TRAINER IF APPLICABLE]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["safety", "urgent", "incident", "critical"], highlighted: false }
    ],
    quickTips: [
      "DO NOT DELAY - This requires immediate action",
      "Document everything in detail including photos",
      "Get written statements from witnesses",
      "Notify insurance and legal team immediately",
      "Check studio safety equipment and protocols"
    ],
    requiredFields: ["Incident type", "Time & location", "Description", "Severity"],
    commonFollowUps: [
      "Complete incident report within 24 hours",
      "Notify insurance provider",
      "Contact person involved to check status",
      "Review studio safety measures",
      "Provide follow-up support/resources if needed"
    ]
  },
  {
    id: "app-technical",
    name: "App Technical Issue",
    description: "Technical problems with mobile app or website",
    icon: Smartphone,
    category: "Booking & Technology",
    subcategory: "App Issues",
    priority: "medium",
    slaHours: 6,
    suggestedTitle: "Technical Issue - [Platform] - [Brief Description]",
    suggestedDescription: `Technical issue or bug reported in app/website.

💻 PLATFORM INFO
• Platform: [iOS/Android/Web]
• App version (if app): [version number]
• Device model: [device type]
• OS version: [version]
• Browser (if web): [browser & version]

🐛 BUG DESCRIPTION
• What is the issue: [detailed description]
• Feature/page affected: [which section]
• When does it happen: [always/sometimes/specific condition]
• First noticed: [date/time]

🔁 REPRODUCIBILITY
• Can you reproduce it: [yes/no]
• Steps to reproduce: [1. 2. 3.]
• Consistently happens: [yes/no]
• Affects all users or just you: [unknown/just you/all users]

📱 IMPACT
• Can user still use app: [yes/partially/no]
• Which features blocked: [list]
• Workaround available: [yes/no - describe]
• Data loss occurred: [yes/no]

📸 EVIDENCE
• Screenshot attached: [yes/no]
• Video/screen recording: [yes/no]
• Error logs if available: [yes/no/attached]
• Time spent on issue: [approx]

🔧 TROUBLESHOOTING DONE
• Cleared cache: [yes/no]
• Restarted app: [yes/no]
• Updated app: [yes/no]
• Tried different network: [yes/no]
• Restarted device: [yes/no]`,
    tags: ["technical", "app", "bug"],
    color: "from-indigo-500 to-blue-500",
    formFields: [
      { fieldName: "title", value: "Technical Issue - [Platform] - [Brief Description]", highlighted: false },
      { fieldName: "description", value: `Technical issue or bug reported in app/website.

💻 PLATFORM INFO
• Platform: [iOS/Android/Web]
• App version (if app): [version number]
• Device model: [device type]
• OS version: [version]
• Browser (if web): [browser & version]

🐛 BUG DESCRIPTION
• What is the issue: [detailed description]
• Feature/page affected: [which section]
• When does it happen: [always/sometimes/specific condition]
• First noticed: [date/time]

🔁 REPRODUCIBILITY
• Can you reproduce it: [yes/no]
• Steps to reproduce: [1. 2. 3.]
• Consistently happens: [yes/no]
• Affects all users or just you: [unknown/just you/all users]

📱 IMPACT
• Can user still use app: [yes/partially/no]
• Which features blocked: [list]
• Workaround available: [yes/no - describe]
• Data loss occurred: [yes/no]

📸 EVIDENCE
• Screenshot attached: [yes/no]
• Video/screen recording: [yes/no]
• Error logs if available: [yes/no/attached]
• Time spent on issue: [approx]

🔧 TROUBLESHOOTING DONE
• Cleared cache: [yes/no]
• Restarted app: [yes/no]
• Updated app: [yes/no]
• Tried different network: [yes/no]
• Restarted device: [yes/no]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "app", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["technical", "app", "bug"], highlighted: false }
    ],
    quickTips: [
      "Ask for screenshots or video to understand the issue better",
      "Determine if it's a widespread issue or user-specific",
      "Check recent app updates or backend changes",
      "Test on different devices/browsers to narrow down cause",
      "Provide temporary workaround while fixing"
    ],
    requiredFields: ["Platform", "Issue description", "Device info"],
    commonFollowUps: [
      "Confirm issue is reproduced on dev team's end",
      "Push emergency fix if critical",
      "Keep customer updated on progress",
      "Request feedback after fix is deployed"
    ]
  },
  {
    id: "class-cancellation",
    name: "Class Cancellation",
    description: "Request or complaint about class cancellation",
    icon: Calendar,
    category: "Booking & Technology",
    subcategory: "Class Booking",
    priority: "medium",
    slaHours: 4,
    suggestedTitle: "Class Cancellation - [Class Name] - [Date]",
    suggestedDescription: `Class cancellation issue or request.

📅 CLASS DETAILS
• Class name: [name]
• Scheduled date: [date]
• Scheduled time: [time]
• Instructor: [name]
• Studio: [location]

🎫 BOOKING INFO
• Customer had reserved: [yes/no]
• Booking status: [confirmed/waitlisted]
• Credits/sessions used if paid: [yes/no]

❓ CANCELLATION TYPE
• Type: [Studio cancelled/Customer requesting/Weather/Other]
• Cancellation notice: [None/Same day/24hrs/48hrs+]
• Reason given: [reason]

💰 REFUND/CREDIT REQUEST
• Requesting refund: [yes/no]
• Requesting credit: [yes/no]
• Amount to be refunded: [amount]
• Already charged customer: [yes/no]

😕 CUSTOMER SENTIMENT
• Sentiment: [Understanding/Frustrated/Angry]
• Frequency of cancellations: [First time/Recurring issue]
• Impact on customer: [Minor inconvenience/Major impact]

📝 RESOLUTION PREFERRED
• Preference: [Refund/Credit/Alternative class/Other]
• Offered alternative class: [which class]
• Customer accepted alternative: [yes/no]`,
    tags: ["cancellation", "booking", "refund"],
    color: "from-slate-500 to-gray-500",
    formFields: [
      { fieldName: "title", value: "Class Cancellation - [Class Name] - [Date]", highlighted: false },
      { fieldName: "description", value: `Class cancellation issue or request.

📅 CLASS DETAILS
• Class name: [name]
• Scheduled date: [date]
• Scheduled time: [time]
• Instructor: [name]
• Studio: [location]

🎫 BOOKING INFO
• Customer had reserved: [yes/no]
• Booking status: [confirmed/waitlisted]
• Credits/sessions used if paid: [yes/no]

❓ CANCELLATION TYPE
• Type: [Studio cancelled/Customer requesting/Weather/Other]
• Cancellation notice: [None/Same day/24hrs/48hrs+]
• Reason given: [reason]

💰 REFUND/CREDIT REQUEST
• Requesting refund: [yes/no]
• Requesting credit: [yes/no]
• Amount to be refunded: [amount]
• Already charged customer: [yes/no]

😕 CUSTOMER SENTIMENT
• Sentiment: [Understanding/Frustrated/Angry]
• Frequency of cancellations: [First time/Recurring issue]
• Impact on customer: [Minor inconvenience/Major impact]

📝 RESOLUTION PREFERRED
• Preference: [Refund/Credit/Alternative class/Other]
• Offered alternative class: [which class]
• Customer accepted alternative: [yes/no]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "phone", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "className", value: "[CLASS NAME]", highlighted: true, placeholder: true },
      { fieldName: "classDateTime", value: "", highlighted: true, placeholder: true },
      { fieldName: "trainerName", value: "[INSTRUCTOR NAME]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["cancellation", "booking", "refund"], highlighted: false }
    ],
    quickTips: [
      "Refund/credit immediately to maintain goodwill",
      "Offer make-up class at different time",
      "If recurring studio cancellations, investigate root cause",
      "Send apology and priority rebooking if your cancellation"
    ],
    requiredFields: ["Class date", "Cancellation type", "Refund needed"],
    commonFollowUps: [
      "Process refund/credit within 24 hours",
      "Help rebook to alternative class",
      "If studio cancelled: offer credit + complimentary class",
      "If customer cancelled early: standard refund policy"
    ]
  },
  {
    id: "front-desk",
    name: "Front Desk Issue",
    description: "Service quality at reception or front desk",
    icon: Headphones,
    category: "Customer Service",
    subcategory: "Front Desk Service",
    priority: "medium",
    slaHours: 8,
    suggestedTitle: "Front Desk Service Feedback - [Studio]",
    suggestedDescription: `Service quality feedback for front desk staff.

🏢 STUDIO & STAFF
• Studio: [location]
• Staff member (if known): [name]
• Time of visit: [date & time]
• Day of week: [day]

🤝 INTERACTION TYPE
• Type: [Check-in/Inquiry/Complaint/Billing/Other]
• Duration of interaction: [approx time]
• Initial greeting: [friendly/neutral/dismissive]

⭐ SERVICE QUALITY
• Overall experience: [Excellent/Good/Average/Poor]
• Staff knowledge: [Expert/Knowledgeable/Average/Poor]
• Wait time: [No wait/Brief/Long/Excessive]
• Problem resolution: [Solved/Partially/Not resolved]

😊 STAFF PROFESSIONALISM
• Friendliness: [1-5 scale]
• Professionalism: [1-5 scale]
• Helpfulness: [1-5 scale]
• Patience: [1-5 scale]

📋 SPECIFIC FEEDBACK
• What went well: [details]
• What could be improved: [details]
• Positive example: [specific action]
• Issue encountered: [issue details]

💬 IMPACT ON EXPERIENCE
• Affected overall visit: [yes/no]
• Likely to return: [yes/no]
• Would refer others: [yes/no]
• Recommendation for staff: [recognition/training/other]`,
    tags: ["service", "front-desk", "feedback"],
    color: "from-cyan-500 to-blue-500",
    formFields: [
      { fieldName: "title", value: "Front Desk Service Feedback - [Studio]", highlighted: false },
      { fieldName: "description", value: `Service quality feedback for front desk staff.

🏢 STUDIO & STAFF
• Studio: [location]
• Staff member (if known): [name]
• Time of visit: [date & time]
• Day of week: [day]

🤝 INTERACTION TYPE
• Type: [Check-in/Inquiry/Complaint/Billing/Other]
• Duration of interaction: [approx time]
• Initial greeting: [friendly/neutral/dismissive]

⭐ SERVICE QUALITY
• Overall experience: [Excellent/Good/Average/Poor]
• Staff knowledge: [Expert/Knowledgeable/Average/Poor]
• Wait time: [No wait/Brief/Long/Excessive]
• Problem resolution: [Solved/Partially/Not resolved]

😊 STAFF PROFESSIONALISM
• Friendliness: [1-5 scale]
• Professionalism: [1-5 scale]
• Helpfulness: [1-5 scale]
• Patience: [1-5 scale]

📋 SPECIFIC FEEDBACK
• What went well: [details]
• What could be improved: [details]
• Positive example: [specific action]
• Issue encountered: [issue details]

💬 IMPACT ON EXPERIENCE
• Affected overall visit: [yes/no]
• Likely to return: [yes/no]
• Would refer others: [yes/no]
• Recommendation for staff: [recognition/training/other]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["service", "front-desk", "feedback"], highlighted: false }
    ],
    quickTips: [
      "Identify if feedback is about specific staff or process",
      "Recognize positive feedback with staff (morale boost)",
      "If complaint: use for training opportunity",
      "Check if issue is systemic or one-time occurrence"
    ],
    requiredFields: ["Studio", "Interaction type", "Service quality rating"],
    commonFollowUps: [
      "Share positive feedback with staff member",
      "If complaint: discuss with manager during next shift",
      "Implement process improvements if systemic",
      "Send thank you to customer for feedback"
    ]
  },
  {
    id: "equipment-issue",
    name: "Equipment Problem",
    description: "Broken, missing, or malfunctioning equipment",
    icon: Settings,
    category: "Health & Safety",
    subcategory: "Equipment Safety",
    priority: "high",
    slaHours: 3,
    suggestedTitle: "Equipment Issue - [Equipment] at [Studio]",
    suggestedDescription: `Equipment damage, malfunction, or safety concern.

🔧 EQUIPMENT DETAILS
• Equipment type: [Reformer/Mat/Wall/Barrel/Other]
• Equipment ID/number: [if available]
• Brand/model: [if known]
• Age of equipment: [approx]

📍 LOCATION
• Studio: [location]
• Studio room: [room number/name]
• Area: [main studio/pilates area/etc]

❌ ISSUE DESCRIPTION
• Issue type: [Broken/Malfunctioning/Missing parts/Unstable/Other]
• Detailed description: [what's wrong]
• When was it noticed: [date & time]
• By whom: [instructor/staff/customer]

⚠️ SAFETY ASSESSMENT
• Safety risk level: [Critical/High/Medium/Low]
• Can equipment be used: [yes/no/with caution]
• Poses injury risk: [yes/no - describe]
• Immediate action taken: [removed/cordoned off/other]

🎓 CLASS IMPACT
• Was it used in a class: [yes/no]
• Which class: [time & instructor]
• Anyone injured: [yes/no - describe]
• Classes affected: [which classes can't run]

📸 DOCUMENTATION
• Photos attached: [yes/no]
• Maintenance log updated: [yes/no]
• Replacement needed: [yes/no]
• Repair estimate: [if known]

⏰ URGENCY
• Can be used immediately: [yes/no]
• Timeline for repair: [urgent/ASAP/can wait]
• Backup equipment available: [yes/no]
• Contingency plan needed: [yes/no]`,
    tags: ["equipment", "maintenance", "safety"],
    color: "from-orange-500 to-red-500",
    formFields: [
      { fieldName: "title", value: "Equipment Issue - [Equipment] at [Studio]", highlighted: false },
      { fieldName: "description", value: `Equipment damage, malfunction, or safety concern.

🔧 EQUIPMENT DETAILS
• Equipment type: [Reformer/Mat/Wall/Barrel/Other]
• Equipment ID/number: [if available]
• Brand/model: [if known]
• Age of equipment: [approx]

📍 LOCATION
• Studio: [location]
• Studio room: [room number/name]
• Area: [main studio/pilates area/etc]

❌ ISSUE DESCRIPTION
• Issue type: [Broken/Malfunctioning/Missing parts/Unstable/Other]
• Detailed description: [what's wrong]
• When was it noticed: [date & time]
• By whom: [instructor/staff/customer]

⚠️ SAFETY ASSESSMENT
• Safety risk level: [Critical/High/Medium/Low]
• Can equipment be used: [yes/no/with caution]
• Poses injury risk: [yes/no - describe]
• Immediate action taken: [removed/cordoned off/other]

🎓 CLASS IMPACT
• Was it used in a class: [yes/no]
• Which class: [time & instructor]
• Anyone injured: [yes/no - describe]
• Classes affected: [which classes can't run]

📸 DOCUMENTATION
• Photos attached: [yes/no]
• Maintenance log updated: [yes/no]
• Replacement needed: [yes/no]
• Repair estimate: [if known]

⏰ URGENCY
• Can be used immediately: [yes/no]
• Timeline for repair: [urgent/ASAP/can wait]
• Backup equipment available: [yes/no]
• Contingency plan needed: [yes/no]`, highlighted: false },
      { fieldName: "priority", value: "high", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "tags", value: ["equipment", "maintenance", "safety"], highlighted: false }
    ],
    quickTips: [
      "Remove broken equipment immediately for safety",
      "Document with photos for maintenance tracking",
      "Check if similar issues on other equipment",
      "Ensure preventative maintenance is scheduled",
      "Notify all instructors of unavailable equipment"
    ],
    requiredFields: ["Equipment type", "Location", "Issue description", "Safety risk"],
    commonFollowUps: [
      "Schedule immediate repair if safety risk",
      "Get maintenance quote and book service",
      "Update class schedule if needed",
      "Verify repair completion with test",
      "Implement preventative maintenance schedule"
    ]
  },
  {
    id: "retail-product",
    name: "Retail/Product Issue",
    description: "Problems with retail purchases or product quality",
    icon: Package,
    category: "Retail Management",
    subcategory: "Product Quality",
    priority: "low",
    slaHours: 24,
    suggestedTitle: "Retail Product Issue - [Product] - [Issue]",
    suggestedDescription: `Product quality or purchase issue report.

🛍️ PRODUCT DETAILS
• Product name: [name]
• Product type: [Apparel/Equipment/Accessories/Other]
• Size/variant: [if applicable]
• SKU/product code: [if available]
• Price paid: [amount]

📅 PURCHASE INFO
• Purchase date: [date]
• Purchase location: [studio/online/other]
• Receipt number: [receipt]
• Payment method: [cash/card/online]

❌ ISSUE DESCRIPTION
• Issue type: [Defective/Wrong size/Wrong color/Damaged/Missing/Quality]
• Detailed description: [what's wrong]
• When noticed: [immediately/after wear/specific use]
• Photos of issue: [attached yes/no]

🔍 QUALITY ASSESSMENT
• Is product unusable: [yes/no]
• Can it be repaired: [yes/no]
• Manufacturing defect: [likely/unsure/no]
• Wear & tear vs defect: [defect/normal wear]

💰 RESOLUTION REQUESTED
• Preference: [Refund/Exchange/Store credit/Other]
• Urgency: [Low/Medium/High]
• Customer's proposed solution: [if any]

📦 RETURN INFO
• Willing to return product: [yes/no]
• Condition of packaging: [original/damaged/discarded]
• Proof of purchase: [receipt/email/other]`,
    tags: ["retail", "product", "refund"],
    color: "from-violet-500 to-purple-500",
    formFields: [
      { fieldName: "title", value: "Retail Product Issue - [Product] - [Issue]", highlighted: false },
      { fieldName: "description", value: `Product quality or purchase issue report.

🛍️ PRODUCT DETAILS
• Product name: [name]
• Product type: [Apparel/Equipment/Accessories/Other]
• Size/variant: [if applicable]
• SKU/product code: [if available]
• Price paid: [amount]

📅 PURCHASE INFO
• Purchase date: [date]
• Purchase location: [studio/online/other]
• Receipt number: [receipt]
• Payment method: [cash/card/online]

❌ ISSUE DESCRIPTION
• Issue type: [Defective/Wrong size/Wrong color/Damaged/Missing/Quality]
• Detailed description: [what's wrong]
• When noticed: [immediately/after wear/specific use]
• Photos of issue: [attached yes/no]

🔍 QUALITY ASSESSMENT
• Is product unusable: [yes/no]
• Can it be repaired: [yes/no]
• Manufacturing defect: [likely/unsure/no]
• Wear & tear vs defect: [defect/normal wear]

💰 RESOLUTION REQUESTED
• Preference: [Refund/Exchange/Store credit/Other]
• Urgency: [Low/Medium/High]
• Customer's proposed solution: [if any]

📦 RETURN INFO
• Willing to return product: [yes/no]
• Condition of packaging: [original/damaged/discarded]
• Proof of purchase: [receipt/email/other]`, highlighted: false },
      { fieldName: "priority", value: "low", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["retail", "product", "refund"], highlighted: false }
    ],
    quickTips: [
      "Verify customer actually purchased from your store",
      "Check if issue is legitimate defect vs normal wear",
      "Process exchanges/refunds quickly for customer satisfaction",
      "Track recurring product quality issues by vendor"
    ],
    requiredFields: ["Product name", "Issue type", "Purchase date"],
    commonFollowUps: [
      "Process exchange/refund within 3-5 business days",
      "Request photo evidence if remote",
      "Follow up with supplier if quality issue",
      "Send thank you and discount for inconvenience"
    ]
  },
  {
    id: "hosted-class",
    name: "Hosted/Influencer Class",
    description: "Log feedback and metrics for hosted classes, influencer sessions, or studio events",
    icon: Star,
    category: "Special Programs",
    subcategory: "Workshop Quality",
    priority: "medium",
    slaHours: 24,
    suggestedTitle: "Hosted Class Report - [Influencer/Partner Name] - [Date]",
    suggestedDescription: `📋 HOSTED/INFLUENCER CLASS REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Event Date: [REQUIRED - Date of hosted class]
• Location: [REQUIRED - Studio/venue]
• Influencer/Partner Name: [REQUIRED]
• Logged By: [REQUIRED - Staff member submitting]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CORE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Class Type: [REQUIRED - e.g., Signature Barre, Reform & Restore]
• Trainer Conducting Class: [REQUIRED]
• Total Attendees: [REQUIRED - Number]
• New Prospects Count: [REQUIRED - New to Physique 57]
• Existing Clients Count: [REQUIRED]
• Conversion Appointments Booked: [REQUIRED - Trials/sales scheduled]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 SALES INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Packages Discussed: [Select all that apply]
  □ Memberships
  □ Class Packages
  □ Privates
  □ Single Classes
  □ Gift Cards
  □ Others

• Key Objections Raised:
[Common hesitations expressed by prospects]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPACT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Influencer Audience Fit: [REQUIRED]
  ○ Strong Fit
  ○ Moderate Fit
  ○ Poor Fit

• Estimated Revenue Potential: [REQUIRED]
  ○ Low (<₹25k)
  ○ Medium (₹25k–₹75k)
  ○ High (>₹75k)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Follow-Up Owner: [REQUIRED]
  ○ Sales
  ○ Marketing
  ○ Client Success
  ○ Management

• Follow-Up Deadline: [Date by which follow-up needed]`,
    tags: ["hosted", "influencer", "event", "marketing", "sales"],
    color: "from-purple-500 to-pink-500",
    formFields: [
      { fieldName: "title", value: "Hosted Class Report - [Influencer/Partner Name] - [Date]", highlighted: false },
      { fieldName: "description", value: `📋 HOSTED/INFLUENCER CLASS REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Event Date: [REQUIRED - Date of hosted class]
• Location: [REQUIRED - Studio/venue]
• Influencer/Partner Name: [REQUIRED]
• Logged By: [REQUIRED - Staff member submitting]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CORE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Class Type: [REQUIRED - e.g., Signature Barre, Reform & Restore]
• Trainer Conducting Class: [REQUIRED]
• Total Attendees: [REQUIRED - Number]
• New Prospects Count: [REQUIRED - New to Physique 57]
• Existing Clients Count: [REQUIRED]
• Conversion Appointments Booked: [REQUIRED - Trials/sales scheduled]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 SALES INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Packages Discussed: [Select all that apply]
  □ Memberships
  □ Class Packages
  □ Privates
  □ Single Classes
  □ Gift Cards
  □ Others

• Key Objections Raised:
[Common hesitations expressed by prospects]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPACT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Influencer Audience Fit: [REQUIRED]
  ○ Strong Fit
  ○ Moderate Fit
  ○ Poor Fit

• Estimated Revenue Potential: [REQUIRED]
  ○ Low (<₹25k)
  ○ Medium (₹25k–₹75k)
  ○ High (>₹75k)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Follow-Up Owner: [REQUIRED]
  ○ Sales
  ○ Marketing
  ○ Client Success
  ○ Management

• Follow-Up Deadline: [Date by which follow-up needed]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "className", value: "[CLASS TYPE]", highlighted: true, placeholder: true },
      { fieldName: "classDateTime", value: "", highlighted: true, placeholder: true },
      { fieldName: "trainerName", value: "[TRAINER CONDUCTING CLASS]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["hosted", "influencer", "event", "marketing", "sales"], highlighted: false }
    ],
    quickTips: [
      "Capture all attendee contact information during sign-in",
      "Take photos/videos for marketing (with consent)",
      "Schedule follow-up calls within 48 hours of event",
      "Track conversion rate to measure ROI of partnership"
    ],
    requiredFields: ["Event Date", "Location", "Influencer Name", "Total Attendees", "New Prospects"],
    commonFollowUps: [
      "Send personalized follow-up email within 24 hours",
      "Book trial classes for interested prospects",
      "Share event photos with influencer for social media",
      "Evaluate partnership effectiveness for future events"
    ]
  },
  {
    id: "studio-amenities",
    name: "Studio Amenities & Facilities",
    description: "Report issues with washrooms, lockers, water, equipment or personnel concerns",
    icon: Settings,
    category: "Health & Safety",
    subcategory: "Equipment Safety",
    priority: "high",
    slaHours: 24,
    suggestedTitle: "Amenities/Facilities Issue - [Category] - [Location]",
    suggestedDescription: `🏢 STUDIO AMENITIES & FACILITIES REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Logged Date & Time: [REQUIRED]
• Location: [REQUIRED - Studio]
• Logged By: [REQUIRED - Staff member]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CORE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Category: [REQUIRED]
  ○ Equipment/Facilities
  ○ Amenities (Washrooms/Lockers/Water)
  ○ Personnel
  ○ Safety Concern

• Specific Area/Asset: [REQUIRED]
[e.g., Locker Room, Barre #2, Water Dispenser]

• Issue Description: [REQUIRED]
[Factual description of what is not working]

• Personnel Involved (if applicable):
[Staff member(s) involved in the issue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPACT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Class(es) Impacted: [Select affected classes]

• Client Impact Observed: [REQUIRED]
  ○ Yes – service disruption
  ○ Yes – safety risk
  ○ No client impact yet

• Immediate Action Taken:
[Temporary fix or action already taken on-site]

• Priority Level: [REQUIRED]
  ○ Low (log only)
  ○ Medium (48hrs)
  ○ High (24hrs)
  ○ Critical (immediate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Department to Notify: [REQUIRED]
  ○ Facilities
  ○ Operations
  ○ Training
  ○ Client Success
  ○ Management

• Follow-Up Required: [REQUIRED]
  ○ Yes
  ○ No

• Follow-Up Deadline: [Target date for resolution]`,
    tags: ["amenities", "facilities", "maintenance", "safety"],
    color: "from-orange-500 to-amber-500",
    formFields: [
      { fieldName: "title", value: "Amenities/Facilities Issue - [Category] - [Location]", highlighted: false },
      { fieldName: "description", value: `🏢 STUDIO AMENITIES & FACILITIES REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Logged Date & Time: [REQUIRED]
• Location: [REQUIRED - Studio]
• Logged By: [REQUIRED - Staff member]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CORE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Category: [REQUIRED]
  ○ Equipment/Facilities
  ○ Amenities (Washrooms/Lockers/Water)
  ○ Personnel
  ○ Safety Concern

• Specific Area/Asset: [REQUIRED]
[e.g., Locker Room, Barre #2, Water Dispenser]

• Issue Description: [REQUIRED]
[Factual description of what is not working]

• Personnel Involved (if applicable):
[Staff member(s) involved in the issue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPACT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Class(es) Impacted: [Select affected classes]

• Client Impact Observed: [REQUIRED]
  ○ Yes – service disruption
  ○ Yes – safety risk
  ○ No client impact yet

• Immediate Action Taken:
[Temporary fix or action already taken on-site]

• Priority Level: [REQUIRED]
  ○ Low (log only)
  ○ Medium (48hrs)
  ○ High (24hrs)
  ○ Critical (immediate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Department to Notify: [REQUIRED]
  ○ Facilities
  ○ Operations
  ○ Training
  ○ Client Success
  ○ Management

• Follow-Up Required: [REQUIRED]
  ○ Yes
  ○ No

• Follow-Up Deadline: [Target date for resolution]`, highlighted: false },
      { fieldName: "priority", value: "high", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "tags", value: ["amenities", "facilities", "maintenance", "safety"], highlighted: false }
    ],
    quickTips: [
      "If safety concern, cordon off area immediately",
      "Document with photos before any temporary fix",
      "Notify all staff of any out-of-service amenities",
      "Post signage for members if public areas affected"
    ],
    requiredFields: ["Issue Logged Date", "Location", "Issue Category", "Specific Area", "Priority Level"],
    commonFollowUps: [
      "Schedule maintenance/repair within SLA timeframe",
      "Update members if extended downtime expected",
      "Verify fix is complete and safe before reopening",
      "Document resolution for maintenance records"
    ]
  },
  {
    id: "studio-repair-maintenance",
    name: "Studio Repair & Maintenance",
    description: "Log equipment repairs, electrical, plumbing, HVAC, structural or IT issues requiring vendor/technician",
    icon: Settings,
    category: "Health & Safety",
    subcategory: "Equipment Safety",
    priority: "high",
    slaHours: 24,
    suggestedTitle: "Repair & Maintenance - [Issue Type] - [Asset] - [Location]",
    suggestedDescription: `🔧 STUDIO REPAIR & MAINTENANCE REQUEST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Logged Date & Time: [REQUIRED]
• Location: [REQUIRED - Studio/site]
• Logged By: [REQUIRED - Staff member]
• Shift During Discovery: [Opening/Mid-day/Closing]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CORE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Type: [REQUIRED]
  ○ Equipment
  ○ Electrical
  ○ Plumbing
  ○ HVAC/AC
  ○ Structural
  ○ Cleanliness/Upkeep
  ○ IT/AV
  ○ Other

• Asset/Equipment Name: [REQUIRED]
[Specific asset or area affected]

• Asset ID/Tag (if any): [Internal identifier]

• Issue Description: [REQUIRED]
[Factual description of problem observed]

• Suspected Cause:
  ○ Wear & tear
  ○ Improper use
  ○ Power/utility issue
  ○ Vendor fault
  ○ Unknown

• Issue First Observed On: [Date first noticed]

• Frequency of Issue:
  ○ First occurrence
  ○ Repeat issue
  ○ Frequent recurring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPACT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Classes Impacted: [List affected classes]

• Class Cancellations Required: [REQUIRED]
  ○ Yes
  ○ No

• Estimated Downtime (Hours): [Expected downtime]

• Client Impact Level: [REQUIRED]
  ○ No impact
  ○ Minor inconvenience
  ○ Class disruption
  ○ Safety risk

• Temporary Action Taken:
[Workaround or safety measure applied]

• Priority Level: [REQUIRED]
  ○ Low (log only)
  ○ Medium (48hrs)
  ○ High (24hrs)
  ○ Critical (immediate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 ROUTING & VENDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Vendor/Technician Required: [REQUIRED]
  ○ Yes
  ○ No

• Preferred Vendor (if known): [Vendor name]
• Vendor Called Date: [When contacted]

• Department to Notify: [REQUIRED]
  ○ Facilities
  ○ Operations
  ○ Management

• Repair Approved By: [Manager name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Estimated Repair Cost (₹): [Before work]
• Actual Repair Cost (₹): [After completion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CLOSURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Resolution Status: [REQUIRED]
  ○ Logged
  ○ In Progress
  ○ Awaiting Vendor
  ○ Resolved
  ○ Deferred

• Actual Resolution Date: [When fully resolved]

• Preventive Action Recommended:
[Steps to avoid recurrence]`,
    tags: ["repair", "maintenance", "vendor", "facilities", "equipment"],
    color: "from-slate-600 to-zinc-700",
    formFields: [
      { fieldName: "title", value: "Repair & Maintenance - [Issue Type] - [Asset] - [Location]", highlighted: false },
      { fieldName: "description", value: `🔧 STUDIO REPAIR & MAINTENANCE REQUEST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 IDENTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Logged Date & Time: [REQUIRED]
• Location: [REQUIRED - Studio/site]
• Logged By: [REQUIRED - Staff member]
• Shift During Discovery: [Opening/Mid-day/Closing]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CORE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Issue Type: [REQUIRED]
  ○ Equipment
  ○ Electrical
  ○ Plumbing
  ○ HVAC/AC
  ○ Structural
  ○ Cleanliness/Upkeep
  ○ IT/AV
  ○ Other

• Asset/Equipment Name: [REQUIRED]
[Specific asset or area affected]

• Asset ID/Tag (if any): [Internal identifier]

• Issue Description: [REQUIRED]
[Factual description of problem observed]

• Suspected Cause:
  ○ Wear & tear
  ○ Improper use
  ○ Power/utility issue
  ○ Vendor fault
  ○ Unknown

• Issue First Observed On: [Date first noticed]

• Frequency of Issue:
  ○ First occurrence
  ○ Repeat issue
  ○ Frequent recurring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPACT ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Classes Impacted: [List affected classes]

• Class Cancellations Required: [REQUIRED]
  ○ Yes
  ○ No

• Estimated Downtime (Hours): [Expected downtime]

• Client Impact Level: [REQUIRED]
  ○ No impact
  ○ Minor inconvenience
  ○ Class disruption
  ○ Safety risk

• Temporary Action Taken:
[Workaround or safety measure applied]

• Priority Level: [REQUIRED]
  ○ Low (log only)
  ○ Medium (48hrs)
  ○ High (24hrs)
  ○ Critical (immediate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 ROUTING & VENDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Vendor/Technician Required: [REQUIRED]
  ○ Yes
  ○ No

• Preferred Vendor (if known): [Vendor name]
• Vendor Called Date: [When contacted]

• Department to Notify: [REQUIRED]
  ○ Facilities
  ○ Operations
  ○ Management

• Repair Approved By: [Manager name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Estimated Repair Cost (₹): [Before work]
• Actual Repair Cost (₹): [After completion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CLOSURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Resolution Status: [REQUIRED]
  ○ Logged
  ○ In Progress
  ○ Awaiting Vendor
  ○ Resolved
  ○ Deferred

• Actual Resolution Date: [When fully resolved]

• Preventive Action Recommended:
[Steps to avoid recurrence]`, highlighted: false },
      { fieldName: "priority", value: "high", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "tags", value: ["repair", "maintenance", "vendor", "facilities", "equipment"], highlighted: false }
    ],
    quickTips: [
      "For safety risks, take equipment out of service immediately",
      "Get multiple vendor quotes for expensive repairs",
      "Track recurring issues to identify replacement needs",
      "Keep maintenance log updated for warranty claims"
    ],
    requiredFields: ["Issue Type", "Asset Name", "Issue Description", "Priority Level", "Resolution Status"],
    commonFollowUps: [
      "Get vendor quote and approval within 24 hours",
      "Update schedule if classes need relocation",
      "Verify repair quality before accepting vendor work",
      "Create preventive maintenance schedule to avoid recurrence"
    ]
  },
  {
    id: "trainer-feedback",
    name: "Trainer Performance Review",
    description: "Comprehensive trainer performance review including metrics, feedback, and development plans",
    icon: Users,
    category: "Customer Service",
    subcategory: "Staff Professionalism",
    priority: "medium",
    slaHours: 48,
    suggestedTitle: "Performance Review - [Trainer Name] - [Review Period]",
    suggestedDescription: `👤 TRAINER PERFORMANCE REVIEW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 REVIEW INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Review Period: [Month/Quarter/Year - REQUIRED]
• Review Date: [Date - REQUIRED]
• Reviewer Name: [Manager/Supervisor - REQUIRED]
• Trainer Name: [Full Name - REQUIRED]
• Primary Studio Location: [Studio - REQUIRED]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Classes Taught: [Number]
• Average Class Attendance: [Number]
• Attendance Growth %: [Percentage vs previous period]
• Average Conversion Rate: [Percentage of trials converted]
• Total Empty Classes: [Number]
• Class Assignment Fulfillment: [Number of assigned vs. taken]
• Workshops/Special Classes Led: [Number]
• Meeting Attendance: [Number attended / Total]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 CLIENT FEEDBACK SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Overall Client Sentiment: [Positive/Neutral/Needs Improvement]
• Key Strengths from Client Feedback:
[What clients consistently praise - be specific]

• Areas for Improvement from Client Feedback:
[What clients suggest could be better - be specific]

• Notable Client Comments:
[Direct quotes or specific feedback examples]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 INTERNAL FEEDBACK & ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Class Delivery & Choreography: [1-5 rating]
[Commentary on sequencing, creativity, flow, modifications]

• Client Connection & Engagement: [1-5 rating]
[Commentary on motivation, energy, empathy, room presence]

• Technical Knowledge & Cueing: [1-5 rating]
[Commentary on form corrections, anatomical understanding, clear instructions]

• Professionalism & Reliability: [1-5 rating]
[Commentary on punctuality, communication, etiquette, policies]

• Command & Leadership: [1-5 rating]
[Commentary on room control, confidence, handling difficult situations]

• Self-Development & Growth: [1-5 rating]
[Commentary on learning initiatives, certifications, feedback receptiveness]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ ACHIEVEMENTS & HIGHLIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Certifications Completed: [List with dates]
• New Skills/Levels Achieved: [What expanded]
• Notable Accomplishments: [Special recognition, milestones]
• Batches Built from Scratch: [New classes launched]
• Additional Responsibilities: [TA roles, training, special projects]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 DEVELOPMENT FOCUS POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority Area 1: [Specific skill/area - REQUIRED]
Action Items:
• [Concrete step 1]
• [Concrete step 2]
• [Concrete step 3]

Priority Area 2: [Specific skill/area]
Action Items:
• [Concrete step 1]
• [Concrete step 2]

Priority Area 3: [Specific skill/area]
Action Items:
• [Concrete step 1]
• [Concrete step 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 GOALS FOR NEXT PERIOD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Professional Development Goals:
• [Goal 1 with target date]
• [Goal 2 with target date]
• [Goal 3 with target date]

Performance Goals:
• [Metric-based goal 1]
• [Metric-based goal 2]

Certification/Training Goals:
• [Specific certification with deadline]
• [Workshop/training planned]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 ADDITIONAL NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Trainer's Self-Assessment Comments: [Optional]
• Trainer's Goals/Requests: [Optional]
• Manager's Additional Observations: [Any context needed]
• Follow-Up Meeting Date: [Schedule 1:1 discussion]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Reviewed with Trainer: [Yes/No - REQUIRED]
• Trainer Acknowledgment: [Date signed]
• Manager Signature: [Date signed]
• Next Review Date: [Scheduled date - REQUIRED]`,
    tags: ["trainer", "performance-review", "feedback", "development", "assessment"],
    color: "from-indigo-500 to-purple-600",
    formFields: [
      { fieldName: "title", value: "Performance Review - [Trainer Name] - [Review Period]", highlighted: false },
      { fieldName: "description", value: `Comprehensive trainer performance review.

REVIEW INFORMATION
• Review Period: [Month/Quarter/Year]
• Trainer Name: [Full Name]
• Primary Studio: [Studio]

PERFORMANCE METRICS
• Total Classes Taught: [Number]
• Avg Attendance: [Number]
• Attendance Growth %: [Percentage]
• Conversion Rate: [Percentage]

CLIENT FEEDBACK SUMMARY
• Overall Sentiment: [Positive/Neutral/Needs Improvement]
• Key Strengths: [Details]
• Areas for Improvement: [Details]

DEVELOPMENT FOCUS POINTS
• Priority Area 1: [Specific skill/area]
• Priority Area 2: [Specific skill/area]

GOALS FOR NEXT PERIOD
• Professional Development: [Goals]
• Performance Targets: [Metrics]
• Certifications: [Plans]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "in-person", highlighted: false },
      { fieldName: "trainerName", value: "[TRAINER NAME]", highlighted: true, placeholder: true },
      { fieldName: "reviewPeriod", value: "[REVIEW PERIOD]", highlighted: true, placeholder: true, label: "Review Period" },
      { fieldName: "className", value: "[PRIMARY CLASS TYPE]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["trainer", "performance-review", "feedback", "development", "assessment"], highlighted: false }
    ],
    quickTips: [
      "Use specific metrics and examples - avoid generic feedback",
      "Balance positive recognition with constructive development areas",
      "Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)",
      "Document achievements for recognition and career progression",
      "Schedule follow-up 1:1 within 48 hours of review",
      "Bulk upload option: Upload Excel/CSV files for automatic processing"
    ],
    requiredFields: ["Trainer Name", "Review Period", "Performance Metrics", "Client Feedback Summary", "Development Focus Points", "Goals"],
    commonFollowUps: [
      "Schedule one-on-one feedback session with trainer within 48h",
      "If positive: recognize in team meeting or send formal recognition",
      "If development areas: create action plan with Training team",
      "Track progress on goals monthly",
      "Upload to trainer's personnel file",
      "Share relevant feedback with scheduling team for class assignments"
    ],
    priorityEscalationRules: {
      highIf: [
        "Performance significantly below standards",
        "Safety or professionalism concerns",
        "Client complaints pattern identified",
        "Trainer requesting immediate support"
      ],
      mediumIf: [
        "Regular periodic review",
        "Minor development areas identified",
        "Standard performance tracking"
      ],
      lowIf: [
        "Exceptional performance recognition",
        "Milestone celebration (anniversary, certification)"
      ]
    },
    automationRules: {
      autoAssignTo: "Training & Development",
      autoTag: ["performance", "review", "trainer-development"],
      autoNotify: ["Training Manager", "Operations Manager", "Trainer"],
      slaReminders: [24, 36]
    }
  },
  {
    id: "membership-freeze-cancel",
    name: "Membership Freeze/Cancellation",
    description: "Request to freeze, pause, or cancel membership",
    icon: UserX,
    category: "Customer Service",
    subcategory: "Membership Management",
    priority: "medium",
    slaHours: 24,
    suggestedTitle: "Membership Change Request - [Customer Name]",
    suggestedDescription: `Customer requesting membership modification.

👤 CUSTOMER DETAILS
• Customer name: [name]
• Membership ID: [ID]
• Current membership type: [type]
• Start date: [date]
• Expiration date: [date]
• Remaining sessions/credits: [amount]

📋 REQUEST TYPE
• Action requested: [Freeze/Pause/Cancel/Downgrade]
• Effective date requested: [date]
• Duration (if freeze): [weeks/months]

💭 REASON FOR REQUEST
• Primary reason: [Moving/Medical/Financial/Schedule/Dissatisfaction/Other]
• Detailed explanation: [details]
• Would they consider alternatives: [yes/no]

💰 FINANCIAL IMPLICATIONS
• Payments remaining: [amount]
• Refund requested: [yes/no/partial]
• Freeze fee applicable: [yes/no - amount]
• Contract terms: [month-to-month/annual/other]

🎯 RETENTION OPPORTUNITY
• Retention offer made: [yes/no - details]
• Customer response to offer: [accepted/declined/considering]
• Win-back probability: [high/medium/low]
• Follow-up scheduled: [date]`,
    tags: ["membership", "cancellation", "freeze", "retention"],
    color: "from-red-400 to-pink-500",
    formFields: [
      { fieldName: "title", value: "Membership Change Request - [Customer Name]", highlighted: false },
      { fieldName: "description", value: `Customer requesting membership modification.

👤 CUSTOMER DETAILS
• Customer name: [name]
• Membership ID: [ID]
• Current membership type: [type]

📋 REQUEST TYPE
• Action requested: [Freeze/Pause/Cancel/Downgrade]
• Effective date requested: [date]

💭 REASON FOR REQUEST
• Primary reason: [Moving/Medical/Financial/Schedule/Dissatisfaction/Other]

🎯 RETENTION OPPORTUNITY
• Retention offer made: [yes/no - details]
• Customer response: [accepted/declined/considering]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "email", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "customerPhone", value: "[CUSTOMER PHONE]", highlighted: true, placeholder: true },
      { fieldName: "customerMembershipId", value: "[MEMBERSHIP ID]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["membership", "cancellation", "freeze", "retention"], highlighted: false }
    ],
    quickTips: [
      "Listen empathetically to understand true reason",
      "Offer freeze option before accepting cancellation",
      "Check if eligible for refund per contract terms",
      "Document retention attempts for future reference",
      "Flag high-value customers for manager follow-up"
    ],
    requiredFields: ["Request type", "Reason", "Effective date", "Retention offer made"],
    commonFollowUps: [
      "Process request within contract terms (usually 30 days)",
      "Send confirmation email with effective dates",
      "If freeze: set reminder to contact before renewal",
      "If cancel: add to win-back campaign after 60 days"
    ],
    priorityEscalationRules: {
      highIf: [
        "VIP or long-term member",
        "Customer threatening social media complaint",
        "High lifetime value customer"
      ],
      mediumIf: [
        "Standard membership change request",
        "Within contract terms"
      ]
    },
    automationRules: {
      autoAssignTo: "Client Success",
      autoTag: ["retention", "membership"],
      autoNotify: ["Sales Manager", "Client Success Lead"],
      slaReminders: [18, 22]
    }
  },
  {
    id: "waitlist-issue",
    name: "Waitlist/Class Full",
    description: "Customer unable to get off waitlist or class always full",
    icon: Users,
    category: "Booking & Technology",
    subcategory: "Class Booking",
    priority: "medium",
    slaHours: 12,
    suggestedTitle: "Waitlist Issue - [Class Name] - [Customer]",
    suggestedDescription: `Customer experiencing waitlist frustration.

📅 CLASS DETAILS
• Class name: [name]
• Preferred day(s): [days]
• Preferred time: [time]
• Instructor preference: [instructor]
• Studio location: [studio]

👤 CUSTOMER CONTEXT
• Customer name: [name]
• Membership type: [type]
• How long trying to book: [duration]
• Frequency of waitlist attempts: [number]
• Previous successful bookings: [yes/no]

🎫 WAITLIST POSITION
• Current waitlist position: [number]
• Typical waitlist length for this class: [number]
• Likelihood of getting in: [high/medium/low]
• Pattern observed: [always full/specific days/specific times]

😔 CUSTOMER SENTIMENT
• Frustration level: [low/medium/high]
• Considering canceling membership: [yes/no]
• Open to alternative classes: [yes/no]
• Willing to try different time/day: [yes/no]

💡 SOLUTIONS OFFERED
• Alternative class suggested: [which class]
• Different time slot offered: [time]
• Priority booking for next opening: [yes/no]
• Added to notification list: [yes/no]`,
    tags: ["waitlist", "booking", "capacity", "class-full"],
    color: "from-yellow-500 to-orange-500",
    formFields: [
      { fieldName: "title", value: "Waitlist Issue - [Class Name] - [Customer]", highlighted: false },
      { fieldName: "description", value: `Customer experiencing waitlist frustration.

📅 CLASS DETAILS
• Class name: [name]
• Preferred day(s): [days]
• Preferred time: [time]

👤 CUSTOMER CONTEXT
• Customer name: [name]
• How long trying to book: [duration]

😔 CUSTOMER SENTIMENT
• Frustration level: [low/medium/high]
• Open to alternative classes: [yes/no]

💡 SOLUTIONS OFFERED
• Alternative class suggested: [which class]
• Different time slot offered: [time]`, highlighted: false },
      { fieldName: "priority", value: "medium", highlighted: false },
      { fieldName: "source", value: "email", highlighted: false },
      { fieldName: "customerName", value: "[CUSTOMER NAME]", highlighted: true, placeholder: true },
      { fieldName: "customerEmail", value: "[CUSTOMER EMAIL]", highlighted: true, placeholder: true },
      { fieldName: "className", value: "[CLASS NAME]", highlighted: true, placeholder: true },
      { fieldName: "tags", value: ["waitlist", "booking", "capacity", "class-full"], highlighted: false }
    ],
    quickTips: [
      "Offer specific alternatives, not just 'try another class'",
      "Check if this class consistently has waitlist issues",
      "Consider adding another session if demand is high",
      "Offer to notify when spot opens",
      "Track waitlist complaints for capacity planning"
    ],
    requiredFields: ["Class name", "Preferred schedule", "Alternative offered"],
    commonFollowUps: [
      "Monitor this class for capacity expansion needs",
      "Set up auto-notification when spot becomes available",
      "Follow up if customer hasn't booked in 2 weeks",
      "Share data with ops team for scheduling decisions"
    ],
    priorityEscalationRules: {
      highIf: [
        "Customer threatening to cancel membership",
        "This is 3rd+ complaint about same class",
        "VIP or long-term member"
      ],
      mediumIf: [
        "Standard waitlist frustration",
        "First-time complaint"
      ]
    },
    automationRules: {
      autoAssignTo: "Operations",
      autoTag: ["waitlist", "capacity-planning"],
      autoNotify: ["Operations Manager", "Scheduling Team"],
      slaReminders: [8, 10]
    }
  },
];

interface TicketTemplatesProps {
  onSelectTemplate: (template: TicketTemplate) => void;
  selectedTemplateId?: string;
}

export function TicketTemplates({ onSelectTemplate, selectedTemplateId }: TicketTemplatesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Quick Start Templates</h3>
          <p className="text-sm text-muted-foreground">Select a template to pre-fill common ticket types with structured guidance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {TICKET_TEMPLATES.map((template, index) => {
            const Icon = template.icon;
            const isSelected = selectedTemplateId === template.id;
            const isHovered = hoveredId === template.id;
            const isExpanded = expandedId === template.id;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "group relative rounded-2xl text-left transition-all duration-300 overflow-hidden",
                  "border border-border/50 hover:border-primary/30",
                  "bg-card/50 hover:bg-card",
                  "hover:shadow-lg hover:shadow-primary/5",
                  isSelected && "ring-2 ring-primary border-primary bg-primary/5",
                  isExpanded && "md:col-span-2"
                )}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Gradient overlay on hover */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br",
                    template.color,
                    (isHovered || isSelected) && "opacity-5"
                  )}
                />

                <div className="relative z-10">
                  {/* Main Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300",
                        "bg-gradient-to-br",
                        template.color,
                        "shadow-lg",
                        isHovered && "scale-110"
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <ChevronRight className={cn(
                            "h-5 w-5 text-muted-foreground transition-all duration-300",
                            isHovered && "translate-x-1 text-primary"
                          )} />
                        )}
                      </div>
                    </div>

                    <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {template.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge 
                        variant={template.priority === "critical" ? "destructive" : template.priority === "high" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {template.priority.toUpperCase()}
                      </Badge>
                      {template.slaHours && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          ⏱️ {template.slaHours}h SLA
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>

                    <motion.button
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                    >
                      {isExpanded ? "Hide Details" : "View Guide"}
                    </motion.button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/30 bg-muted/30 p-4 space-y-4"
                      >
                        {/* Quick Tips */}
                        {template.quickTips && template.quickTips.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                              💡 Quick Tips
                            </h5>
                            <ul className="space-y-1">
                              {template.quickTips.map((tip, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                  <span className="text-primary">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Required Fields */}
                        {template.requiredFields && template.requiredFields.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                              ✅ Required Info
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {template.requiredFields.map((field, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-amber-50">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Common Follow-ups */}
                        {template.commonFollowUps && template.commonFollowUps.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                              🔄 Follow-ups
                            </h5>
                            <ul className="space-y-1">
                              {template.commonFollowUps.map((followUp, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                  <span className="text-primary">→</span>
                                  <span>{followUp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Use Template Button */}
                        <motion.button
                          onClick={() => {
                            onSelectTemplate(template);
                            setExpandedId(null);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "w-full py-2 px-3 rounded-lg font-medium transition-all text-sm",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground"
                          )}
                        >
                          {isSelected ? "✓ Selected" : "Use This Template"}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

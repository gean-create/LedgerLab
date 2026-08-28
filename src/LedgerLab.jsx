import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Landmark, FileText, Receipt,
  BookOpen, GraduationCap, Target, Settings, Plus, Check, X,
  AlertTriangle, ChevronRight, ChevronDown, Trash2, RefreshCw,
  ArrowUpRight, ArrowDownRight, Lightbulb, Eye, Building2, Download, Printer, GitCompare, Users
} from "lucide-react";

/* ============================== CONSTANTS ============================== */

const COMPANIES_INDEX_KEY = "companies-index-v1";
const ACTIVE_COMPANY_KEY = "active-company-v1";
const companyDataKey = (id) => `company-${id}-v1`;

const ACCOUNT_TYPES = {
  asset: { label: "Asset", normal: "debit" },
  liability: { label: "Liability", normal: "credit" },
  equity: { label: "Equity", normal: "credit" },
  income: { label: "Income", normal: "credit" },
  expense: { label: "Expense", normal: "debit" },
};

const DEFAULT_ACCOUNTS = [
  { id: "cash", code: "1000", name: "Cash on Hand", type: "asset", archived: false, isBank: true },
  { id: "bank", code: "1010", name: "Bank Account", type: "asset", archived: false, isBank: true },
  { id: "ar", code: "1100", name: "Accounts Receivable", type: "asset", archived: false },
  { id: "inventory", code: "1200", name: "Inventory", type: "asset", archived: false },
  { id: "equipment", code: "1300", name: "Equipment", type: "asset", archived: false },
  { id: "prepaid", code: "1400", name: "Prepaid Expenses", type: "asset", archived: false },
  { id: "input-tax-credit", code: "1500", name: "Input Tax Credit (VAT/GST Receivable)", type: "asset", archived: false },
  { id: "ap", code: "2000", name: "Accounts Payable", type: "liability", archived: false },
  { id: "creditcard", code: "2010", name: "Credit Card Payable", type: "liability", archived: false },
  { id: "loan", code: "2020", name: "Loans Payable", type: "liability", archived: false },
  { id: "taxpayable", code: "2030", name: "Tax Payable", type: "liability", archived: false },
  { id: "payroll-liab", code: "2040", name: "Payroll Liabilities", type: "liability", archived: false },
  { id: "owner-equity", code: "3000", name: "Owner's Equity", type: "equity", archived: false },
  { id: "owner-drawings", code: "3010", name: "Owner's Drawings", type: "equity", archived: false },
  { id: "retained-earnings", code: "3020", name: "Retained Earnings", type: "equity", archived: false },
  { id: "service-income", code: "4000", name: "Service Income", type: "income", archived: false },
  { id: "consulting-income", code: "4010", name: "Consulting Income", type: "income", archived: false },
  { id: "sales-income", code: "4020", name: "Sales Income", type: "income", archived: false },
  { id: "accommodation-income", code: "4030", name: "Accommodation Income", type: "income", archived: false },
  { id: "campaign-income", code: "4040", name: "Campaign Management Income", type: "income", archived: false },
  { id: "legal-fees-income", code: "4050", name: "Legal Fees Income", type: "income", archived: false },
  { id: "construction-income", code: "4060", name: "Construction Contract Income", type: "income", archived: false },
  { id: "commission-income", code: "4070", name: "Commission Income", type: "income", archived: false },
  { id: "design-income", code: "4080", name: "Design Services Income", type: "income", archived: false },
  { id: "advertising", code: "5000", name: "Advertising", type: "expense", archived: false },
  { id: "software", code: "5010", name: "Software", type: "expense", archived: false },
  { id: "internet", code: "5020", name: "Internet", type: "expense", archived: false },
  { id: "telephone", code: "5030", name: "Telephone", type: "expense", archived: false },
  { id: "rent", code: "5040", name: "Rent", type: "expense", archived: false },
  { id: "utilities", code: "5050", name: "Utilities", type: "expense", archived: false },
  { id: "office-supplies", code: "5060", name: "Office Supplies", type: "expense", archived: false },
  { id: "travel", code: "5070", name: "Travel", type: "expense", archived: false },
  { id: "insurance", code: "5080", name: "Insurance", type: "expense", archived: false },
  { id: "professional-fees", code: "5090", name: "Professional Fees", type: "expense", archived: false },
  { id: "bank-fees", code: "5100", name: "Bank Fees", type: "expense", archived: false },
  { id: "subcontractors", code: "5110", name: "Subcontractors", type: "expense", archived: false },
  { id: "cleaning-supplies", code: "5120", name: "Cleaning Supplies", type: "expense", archived: false },
  { id: "repairs", code: "5130", name: "Repairs & Maintenance", type: "expense", archived: false },
  { id: "platform-fees", code: "5140", name: "Booking Platform Fees", type: "expense", archived: false },
  { id: "contractors", code: "5150", name: "Contractor / Freelancer Costs", type: "expense", archived: false },
  { id: "materials", code: "5160", name: "Construction Materials", type: "expense", archived: false },
  { id: "court-filing-fees", code: "5170", name: "Court & Filing Fees", type: "expense", archived: false },
  { id: "permits", code: "5180", name: "Permits & Licenses", type: "expense", archived: false },
  { id: "wages", code: "5190", name: "Wages & Salaries Expense", type: "expense", archived: false },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "banking", label: "Banking", icon: Landmark },
  { id: "sales", label: "Sales", icon: FileText },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "payroll", label: "Payroll", icon: Users },
  { id: "accounting", label: "Accounting", icon: BookOpen },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "learning", label: "Learning Center", icon: GraduationCap },
  { id: "compare", label: "Platform Comparison", icon: GitCompare },
  { id: "va", label: "VA Practice Center", icon: Target },
  { id: "settings", label: "Settings", icon: Settings },
];

/* ============================== UTILITIES ============================== */

let idCounter = 1;
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const fmt = (n, currency = "PHP") => {
  const val = round2(n || 0);
  try {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(val);
  } catch {
    return `${currency} ${val.toFixed(2)}`;
  }
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// Builds a CSV file from an array of {label, key} columns and row objects, then
// triggers a browser download — simulates the "export to CSV" workflows used
// throughout real accounting software.
function exportCSV(filename, columns, rows) {
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(typeof c.value === "function" ? c.value(r) : r[c.key])).join(",")).join("\n");
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================ ACCOUNTING ENGINE ============================ */

function tryPostEntry(journal, { date, description, reference, lines, note }) {
  const totalDebit = round2(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
  const totalCredit = round2(lines.reduce((s, l) => s + (Number(l.credit) || 0), 0));
  if (totalDebit !== totalCredit) {
    return { error: `Not balanced: total debits ${fmt(totalDebit)} do not equal total credits ${fmt(totalCredit)}.` };
  }
  if (totalDebit === 0) {
    return { error: "Entry has no amounts. Add at least one debit and credit line." };
  }
  const entry = {
    id: uid("je"),
    date,
    description,
    reference: reference || "",
    note: note || "",
    lines: lines.filter((l) => (Number(l.debit) || 0) !== 0 || (Number(l.credit) || 0) !== 0),
    createdAt: new Date().toISOString(),
  };
  return { entry, journal: [...journal, entry] };
}

function accountBalance(accounts, journal, accountId) {
  const acct = accounts.find((a) => a.id === accountId);
  if (!acct) return 0;
  let debit = 0, credit = 0;
  for (const e of journal) {
    for (const l of e.lines) {
      if (l.accountId === accountId) {
        debit += Number(l.debit) || 0;
        credit += Number(l.credit) || 0;
      }
    }
  }
  const normal = ACCOUNT_TYPES[acct.type].normal;
  return round2(normal === "debit" ? debit - credit : credit - debit);
}

function accountLedgerLines(accounts, journal, accountId) {
  const acct = accounts.find((a) => a.id === accountId);
  if (!acct) return [];
  const normal = ACCOUNT_TYPES[acct.type].normal;
  let running = 0;
  const rows = [];
  const sorted = [...journal].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  for (const e of sorted) {
    for (const l of e.lines) {
      if (l.accountId === accountId) {
        const d = Number(l.debit) || 0, c = Number(l.credit) || 0;
        running += normal === "debit" ? d - c : c - d;
        rows.push({ date: e.date, description: e.description, reference: e.reference, debit: d, credit: c, balance: round2(running), entryId: e.id });
      }
    }
  }
  return rows;
}

function sumByType(accounts, journal, type) {
  return accounts.filter((a) => a.type === type && !a.archived).reduce((s, a) => s + accountBalance(accounts, journal, a.id), 0);
}

// Builds { month: 'YYYY-MM', income, expense } for the last `count` calendar
// months (including months with zero activity), used for the dashboard trend chart.
function monthlySeries(accounts, journal, count = 6) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth = Object.fromEntries(months.map((m) => [m, { month: m, income: 0, expense: 0 }]));
  const incomeIds = new Set(accounts.filter((a) => a.type === "income").map((a) => a.id));
  const expenseIds = new Set(accounts.filter((a) => a.type === "expense").map((a) => a.id));
  for (const e of journal) {
    const m = e.date.slice(0, 7);
    if (!byMonth[m]) continue;
    for (const l of e.lines) {
      if (incomeIds.has(l.accountId)) byMonth[m].income += round2((l.credit || 0) - (l.debit || 0));
      if (expenseIds.has(l.accountId)) byMonth[m].expense += round2((l.debit || 0) - (l.credit || 0));
    }
  }
  return months.map((m) => byMonth[m]);
}

/* ============================== SEED DATA ============================== */

// Generic builder — takes a template config and produces a fully-posted
// double-entry company. Used both for the sample companies and for cloning
// a fresh copy of a template when the user resets or adds a company.
function buildCompanySeed(config) {
  const accounts = DEFAULT_ACCOUNTS.map((a) => ({ ...a }));
  let journal = [];

  const post = (entry) => {
    const r = tryPostEntry(journal, entry);
    if (r.error) { console.error(r.error, entry); return; }
    journal = r.journal;
  };

  post({
    date: config.openingDate, reference: "OB-0001", description: "Opening balance — owner investment",
    note: "Bank increased, so Bank is debited. Owner's Equity increased, so it is credited.",
    lines: [{ accountId: "bank", debit: config.openingBalance, credit: 0 }, { accountId: "owner-equity", debit: 0, credit: config.openingBalance }],
  });

  const customers = config.customers.map((c) => ({ id: uid("cust"), ...c }));
  const vendors = config.vendors.map((v) => ({ id: uid("vend"), ...v }));
  let invoices = [];
  let bills = [];
  let bankTx = [];

  const addInvoice = (inv) => {
    const subtotal = inv.lines.reduce((s, l) => s + l.qty * l.price, 0);
    const tax = inv.taxable ? round2(subtotal * 0.12) : 0;
    const total = round2(subtotal + tax);
    const invoice = { ...inv, id: uid("inv"), number: `INV-${1000 + invoices.length + 1}`, subtotal, tax, total, amountPaid: 0, status: "sent" };
    post({
      date: inv.date, reference: invoice.number,
      description: `Invoice ${invoice.number} to ${customers[inv.customerIdx].name}`,
      note: "Accounts Receivable increased because the customer owes us, so AR is debited. Income increased, so it is credited.",
      lines: [
        { accountId: "ar", debit: total, credit: 0 },
        { accountId: inv.incomeAccount, debit: 0, credit: subtotal },
        ...(tax ? [{ accountId: "taxpayable", debit: 0, credit: tax }] : []),
      ],
    });
    invoice.customerId = customers[inv.customerIdx].id;
    invoices.push(invoice);
    return invoice;
  };
  const payInvoice = (inv, amount, date) => {
    post({
      date, reference: inv.number, description: `Payment received for ${inv.number}`,
      note: "Bank increased because cash came in, so Bank is debited. Accounts Receivable decreased, so it is credited.",
      lines: [{ accountId: "bank", debit: amount, credit: 0 }, { accountId: "ar", debit: 0, credit: amount }],
    });
    inv.amountPaid = round2(inv.amountPaid + amount);
    inv.status = inv.amountPaid >= inv.total ? "paid" : "partial";
  };

  for (const def of config.invoiceDefs) {
    const inv = addInvoice(def);
    if (def.payment) payInvoice(inv, def.payment.amount, def.payment.date);
  }

  const addBill = (b) => {
    const taxAmt = b.taxable ? round2(b.amount * 0.12) : 0;
    const total = round2(b.amount + taxAmt);
    const bill = { ...b, id: uid("bill"), number: `BILL-${2000 + bills.length + 1}`, total, amountPaid: 0, creditedAmount: 0, status: "open" };
    post({
      date: b.date, reference: bill.number,
      description: `Bill ${bill.number} from ${vendors[b.vendorIdx].name}`,
      note: taxAmt
        ? "Expense increased for the pre-tax amount, so the expense account is debited. Input Tax Credit (an asset — tax paid that can be reclaimed) is also debited. Accounts Payable increased for the total owed, so it is credited."
        : "Expense increased, so the expense account is debited. Accounts Payable increased because we owe the vendor, so AP is credited.",
      lines: [
        { accountId: b.expenseAccount, debit: b.amount, credit: 0 },
        ...(taxAmt ? [{ accountId: "input-tax-credit", debit: taxAmt, credit: 0 }] : []),
        { accountId: "ap", debit: 0, credit: total },
      ],
    });
    bill.vendorId = vendors[b.vendorIdx].id;
    bills.push(bill);
    return bill;
  };
  const payBill = (bill, amount, date) => {
    post({
      date, reference: bill.number, description: `Payment sent for ${bill.number}`,
      note: "Accounts Payable decreased because we paid the vendor, so AP is debited. Bank decreased, so it is credited.",
      lines: [{ accountId: "ap", debit: amount, credit: 0 }, { accountId: "bank", debit: 0, credit: amount }],
    });
    bill.amountPaid = round2(bill.amountPaid + amount);
    bill.status = bill.amountPaid >= bill.total ? "paid" : "partial";
  };

  for (const def of config.billDefs) {
    const bill = addBill(def);
    if (def.payment) payBill(bill, def.payment.amount, def.payment.date);
  }

  for (const t of config.bankTxDefs) {
    bankTx.push({ id: uid("btx"), status: t.status || "uncategorized", accountId: "bank", ...t });
  }

  const employees = (config.employees || []).map((e) => ({ id: uid("emp"), active: true, ...e }));

  return {
    company: { name: config.name, currency: config.currency, industry: config.industry, country: config.country, templateId: config.templateId },
    accounts, journal, customers, vendors, invoices, bills, bankTx,
    estimates: [], recurringInvoices: [], recurringBills: [],
    employees, payrollRuns: [],
    reconciliations: [], learningProgress: {}, vaChecked: {},
  };
}

const COMPANY_TEMPLATES = [
  {
    templateId: "cleaning",
    name: "NorthStar Cleaning Services", industry: "Cleaning services", country: "Philippines", currency: "PHP",
    openingDate: "2026-01-01", openingBalance: 25000,
    customers: [
      { name: "Maple & Finch Realty", email: "ap@maplefinch.example", phone: "555-0142", address: "Toronto, ON" },
      { name: "Harborview Rentals", email: "billing@harborview.example", phone: "555-0198", address: "Sydney, NSW" },
      { name: "Alonzo Family Dental", email: "office@alonzodental.example", phone: "555-0110", address: "Manila, PH" },
      { name: "Bright Path Preschool", email: "admin@brightpath.example", phone: "555-0177", address: "Austin, TX" },
      { name: "Nolan & Reyes Law", email: "accounts@nolanreyes.example", phone: "555-0133", address: "Vancouver, BC" },
    ],
    vendors: [
      { name: "Google Ads", email: "billing@googleads.example", phone: "", address: "" },
      { name: "Microsoft 365", email: "billing@microsoft.example", phone: "", address: "" },
      { name: "CleanPro Supply Co.", email: "orders@cleanpro.example", phone: "", address: "" },
      { name: "MetroNet Internet", email: "billing@metronet.example", phone: "", address: "" },
      { name: "Reliable Property Maintenance", email: "office@reliablepm.example", phone: "", address: "" },
    ],
    invoiceDefs: [
      { customerIdx: 0, date: "2026-06-05", dueDate: "2026-07-05", incomeAccount: "service-income", taxable: true, lines: [{ description: "Bookkeeping services — May", qty: 1, price: 8000 }] },
      { customerIdx: 2, date: "2026-06-18", dueDate: "2026-07-18", incomeAccount: "consulting-income", taxable: true, lines: [{ description: "QuickBooks setup & training", qty: 1, price: 12000 }] },
      { customerIdx: 1, date: "2026-05-02", dueDate: "2026-06-01", incomeAccount: "service-income", taxable: false, lines: [{ description: "Monthly bookkeeping retainer", qty: 1, price: 6500 }], payment: { amount: 6500, date: "2026-05-20" } },
      { customerIdx: 3, date: "2026-05-10", dueDate: "2026-06-09", incomeAccount: "service-income", taxable: false, lines: [{ description: "Payroll processing — April", qty: 1, price: 4200 }], payment: { amount: 2000, date: "2026-06-01" } },
      { customerIdx: 4, date: "2026-07-01", dueDate: "2026-07-31", incomeAccount: "consulting-income", taxable: true, lines: [{ description: "Trust account reconciliation", qty: 1, price: 9500 }] },
    ],
    billDefs: [
      { vendorIdx: 1, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "software", amount: 1500, taxable: false },
      { vendorIdx: 2, date: "2026-06-10", dueDate: "2026-06-25", expenseAccount: "cleaning-supplies", amount: 3200, taxable: true, payment: { amount: 3584, date: "2026-06-22" } },
      { vendorIdx: 3, date: "2026-06-15", dueDate: "2026-07-15", expenseAccount: "internet", amount: 2100, taxable: false },
      { vendorIdx: 4, date: "2026-05-20", dueDate: "2026-06-04", expenseAccount: "repairs", amount: 5400, taxable: false },
      { vendorIdx: 0, date: "2026-06-20", dueDate: "2026-07-20", expenseAccount: "advertising", amount: 1500, taxable: false },
    ],
    bankTxDefs: [
      { date: "2026-07-02", description: "GOOGLE ADS", amount: -150, suggested: "advertising" },
      { date: "2026-07-03", description: "AWS INTERNET SERVICES", amount: -420, suggested: "software" },
      { date: "2026-07-03", description: "OFFICE DEPOT #221", amount: -85, suggested: "office-supplies" },
      { date: "2026-07-04", description: "STARBUCKS #4512", amount: -12.5, suggested: "travel" },
      { date: "2026-07-05", description: "BANK MONTHLY FEE", amount: -25, suggested: "bank-fees" },
      { date: "2026-07-05", description: "CLIENT DEPOSIT - MAPLE FINCH", amount: 8960, suggested: "service-income" },
      { date: "2026-06-28", description: "GOOGLE ADS", amount: -150, status: "categorized", categorizedAs: "office-supplies", suggested: "advertising", flaggedMistake: true },
      { date: "2026-06-30", description: "VERIZON WIRELESS", amount: -95, suggested: "telephone" },
      { date: "2026-07-01", description: "PROPERTY MGMT - RENT", amount: -1800, suggested: "rent" },
    ],
    employees: [{ name: "Maria Santos — Field Supervisor", grossPay: 1800, withholdingRate: 12 }],
  },
  {
    templateId: "marketing",
    name: "Bright Path Digital Marketing", industry: "Digital marketing agency", country: "United States", currency: "USD",
    openingDate: "2026-01-01", openingBalance: 18000,
    customers: [
      { name: "Sunrise Dental Group", email: "ap@sunrisedental.example", phone: "555-0311", address: "Austin, TX" },
      { name: "Coastline Realty Partners", email: "billing@coastlinerp.example", phone: "555-0288", address: "San Diego, CA" },
      { name: "Fernwood Yoga Studio", email: "hello@fernwoodyoga.example", phone: "555-0244", address: "Denver, CO" },
      { name: "Redgate Law Offices", email: "accounts@redgatelaw.example", phone: "555-0209", address: "Chicago, IL" },
    ],
    vendors: [
      { name: "Meta Ads", email: "billing@meta.example", phone: "", address: "" },
      { name: "Google Workspace", email: "billing@googleworkspace.example", phone: "", address: "" },
      { name: "Canva Pro", email: "billing@canva.example", phone: "", address: "" },
      { name: "Freelance Copywriter — J. Alba", email: "j.alba@freelance.example", phone: "", address: "" },
      { name: "WeWork Downtown", email: "billing@wework.example", phone: "", address: "" },
    ],
    invoiceDefs: [
      { customerIdx: 0, date: "2026-06-01", dueDate: "2026-07-01", incomeAccount: "campaign-income", taxable: false, lines: [{ description: "Social media campaign — June", qty: 1, price: 2200 }], payment: { amount: 2200, date: "2026-06-25" } },
      { customerIdx: 1, date: "2026-06-10", dueDate: "2026-07-10", incomeAccount: "campaign-income", taxable: false, lines: [{ description: "PPC management — June", qty: 1, price: 3100 }] },
      { customerIdx: 2, date: "2026-05-15", dueDate: "2026-06-14", incomeAccount: "consulting-income", taxable: false, lines: [{ description: "Brand strategy session", qty: 1, price: 900 }], payment: { amount: 400, date: "2026-06-02" } },
      { customerIdx: 3, date: "2026-07-02", dueDate: "2026-08-01", incomeAccount: "campaign-income", taxable: false, lines: [{ description: "SEO content package", qty: 1, price: 1800 }] },
    ],
    billDefs: [
      { vendorIdx: 0, date: "2026-06-05", dueDate: "2026-07-05", expenseAccount: "advertising", amount: 4200, taxable: false, payment: { amount: 4200, date: "2026-06-20" } },
      { vendorIdx: 1, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "software", amount: 240, taxable: false },
      { vendorIdx: 2, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "software", amount: 55, taxable: false },
      { vendorIdx: 3, date: "2026-06-18", dueDate: "2026-07-02", expenseAccount: "contractors", amount: 1200, taxable: false },
      { vendorIdx: 4, date: "2026-06-01", dueDate: "2026-06-15", expenseAccount: "rent", amount: 950, taxable: false },
    ],
    bankTxDefs: [
      { date: "2026-07-03", description: "META ADS", amount: -380, suggested: "advertising" },
      { date: "2026-07-04", description: "ADOBE CREATIVE CLOUD", amount: -55, suggested: "software" },
      { date: "2026-07-04", description: "UBER", amount: -22, suggested: "travel" },
      { date: "2026-07-05", description: "WEWORK DOWNTOWN", amount: -950, suggested: "rent" },
      { date: "2026-07-05", description: "CLIENT DEPOSIT - COASTLINE", amount: 3100, suggested: "campaign-income" },
      { date: "2026-06-27", description: "GOOGLE WORKSPACE", amount: -240, status: "categorized", categorizedAs: "internet", suggested: "software", flaggedMistake: true },
      { date: "2026-06-29", description: "BANK MONTHLY FEE", amount: -15, suggested: "bank-fees" },
    ],
    employees: [{ name: "Priya Nandakumar — Social Media Coordinator", grossPay: 2400, withholdingRate: 18 }],
  },
  {
    templateId: "accommodation",
    name: "Harborview Accommodation", industry: "Accommodation / short-term rental", country: "Australia", currency: "AUD",
    openingDate: "2026-01-01", openingBalance: 32000,
    customers: [
      { name: "Airbnb Payouts", email: "payments@airbnb.example", phone: "", address: "" },
      { name: "Booking.com Payouts", email: "payments@booking.example", phone: "", address: "" },
      { name: "Direct Guest — T. Nguyen", email: "t.nguyen@guest.example", phone: "555-0455", address: "" },
      { name: "Corporate Housing — Vantage Ltd", email: "travel@vantage.example", phone: "555-0402", address: "Melbourne, VIC" },
    ],
    vendors: [
      { name: "SparkleClean Turnover Service", email: "office@sparkleclean.example", phone: "", address: "" },
      { name: "Reliable Property Maintenance", email: "office@reliablepm.example", phone: "", address: "" },
      { name: "Origin Energy", email: "billing@originenergy.example", phone: "", address: "" },
      { name: "Guesty Property Software", email: "billing@guesty.example", phone: "", address: "" },
    ],
    invoiceDefs: [
      { customerIdx: 0, date: "2026-06-08", dueDate: "2026-06-15", incomeAccount: "accommodation-income", taxable: false, lines: [{ description: "Bookings payout — 1 week ago", qty: 6, price: 210 }], payment: { amount: 1260, date: "2026-06-16" } },
      { customerIdx: 1, date: "2026-06-20", dueDate: "2026-06-27", incomeAccount: "accommodation-income", taxable: false, lines: [{ description: "Bookings payout", qty: 4, price: 195 }] },
      { customerIdx: 2, date: "2026-07-01", dueDate: "2026-07-08", incomeAccount: "accommodation-income", taxable: true, lines: [{ description: "Direct booking — 5 nights", qty: 5, price: 220 }] },
      { customerIdx: 3, date: "2026-05-12", dueDate: "2026-06-11", incomeAccount: "accommodation-income", taxable: true, lines: [{ description: "Corporate housing — May", qty: 1, price: 4200 }], payment: { amount: 4200, date: "2026-06-05" } },
    ],
    billDefs: [
      { vendorIdx: 0, date: "2026-06-10", dueDate: "2026-06-24", expenseAccount: "cleaning-supplies", amount: 640, taxable: true, payment: { amount: 716.8, date: "2026-06-20" } },
      { vendorIdx: 1, date: "2026-05-25", dueDate: "2026-06-08", expenseAccount: "repairs", amount: 1150, taxable: false },
      { vendorIdx: 2, date: "2026-06-15", dueDate: "2026-07-15", expenseAccount: "utilities", amount: 380, taxable: false },
      { vendorIdx: 3, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "software", amount: 89, taxable: false },
    ],
    bankTxDefs: [
      { date: "2026-07-02", description: "AIRBNB PAYOUT", amount: 1450, suggested: "accommodation-income" },
      { date: "2026-07-03", description: "SPARKLECLEAN TURNOVER", amount: -160, suggested: "cleaning-supplies" },
      { date: "2026-07-04", description: "BUNNINGS WAREHOUSE", amount: -74, suggested: "repairs" },
      { date: "2026-07-05", description: "ORIGIN ENERGY", amount: -145, suggested: "utilities" },
      { date: "2026-06-26", description: "BOOKING.COM COMMISSION", amount: -95, status: "categorized", categorizedAs: "office-supplies", suggested: "platform-fees", flaggedMistake: true },
      { date: "2026-06-30", description: "BANK MONTHLY FEE", amount: -12, suggested: "bank-fees" },
    ],
    employees: [{ name: "Liam O'Connor — Guest Services", grossPay: 2100, withholdingRate: 15 }],
  },
  {
    templateId: "lawfirm",
    name: "Whitmore & Cole Family Law", industry: "Family law firm", country: "Canada", currency: "CAD",
    openingDate: "2026-01-01", openingBalance: 41000,
    customers: [
      { name: "R. Delacroix (Divorce matter)", email: "r.delacroix@client.example", phone: "555-0611", address: "Ottawa, ON" },
      { name: "M. & S. Okafor (Custody matter)", email: "okafor.family@client.example", phone: "555-0654", address: "Ottawa, ON" },
      { name: "T. Whitfield (Estate matter)", email: "t.whitfield@client.example", phone: "555-0678", address: "Kingston, ON" },
      { name: "Larsen Holdings Inc. (Corporate)", email: "legal@larsenholdings.example", phone: "555-0699", address: "Toronto, ON" },
    ],
    vendors: [
      { name: "Ontario Court Filing Office", email: "billing@courtfiling.example", phone: "", address: "" },
      { name: "Clio Legal Software", email: "billing@clio.example", phone: "", address: "" },
      { name: "Bell Business Internet", email: "billing@bell.example", phone: "", address: "" },
      { name: "Downtown Office Tower REIT", email: "billing@downtowntower.example", phone: "", address: "" },
      { name: "LexisNexis Research", email: "billing@lexisnexis.example", phone: "", address: "" },
    ],
    invoiceDefs: [
      { customerIdx: 0, date: "2026-06-03", dueDate: "2026-07-03", incomeAccount: "legal-fees-income", taxable: true, lines: [{ description: "Divorce proceedings — retainer draw down", qty: 8, price: 320 }], payment: { amount: 2764.16, date: "2026-06-28" } },
      { customerIdx: 1, date: "2026-06-14", dueDate: "2026-07-14", incomeAccount: "legal-fees-income", taxable: true, lines: [{ description: "Custody hearing preparation", qty: 12, price: 320 }] },
      { customerIdx: 2, date: "2026-05-20", dueDate: "2026-06-19", incomeAccount: "legal-fees-income", taxable: true, lines: [{ description: "Estate & will filing", qty: 5, price: 300 }], payment: { amount: 1000, date: "2026-06-10" } },
      { customerIdx: 3, date: "2026-07-01", dueDate: "2026-07-31", incomeAccount: "legal-fees-income", taxable: true, lines: [{ description: "Corporate contract review", qty: 6, price: 350 }] },
    ],
    billDefs: [
      { vendorIdx: 0, date: "2026-06-05", dueDate: "2026-06-19", expenseAccount: "court-filing-fees", amount: 450, taxable: false, payment: { amount: 450, date: "2026-06-18" } },
      { vendorIdx: 1, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "software", amount: 320, taxable: true },
      { vendorIdx: 2, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "internet", amount: 145, taxable: false },
      { vendorIdx: 3, date: "2026-06-01", dueDate: "2026-06-15", expenseAccount: "rent", amount: 3800, taxable: false, payment: { amount: 3800, date: "2026-06-14" } },
      { vendorIdx: 4, date: "2026-06-20", dueDate: "2026-07-20", expenseAccount: "professional-fees", amount: 210, taxable: false },
    ],
    bankTxDefs: [
      { date: "2026-07-02", description: "ONTARIO COURT FILING OFFICE", amount: -180, suggested: "court-filing-fees" },
      { date: "2026-07-03", description: "CLIO LEGAL SOFTWARE", amount: -320, suggested: "software" },
      { date: "2026-07-04", description: "BELL BUSINESS INTERNET", amount: -145, suggested: "internet" },
      { date: "2026-07-05", description: "TRUST TRANSFER — DELACROIX", amount: 2764.16, suggested: "legal-fees-income" },
      { date: "2026-06-25", description: "LEXISNEXIS RESEARCH", amount: -210, status: "categorized", categorizedAs: "office-supplies", suggested: "professional-fees", flaggedMistake: true },
      { date: "2026-06-30", description: "BANK MONTHLY FEE", amount: -30, suggested: "bank-fees" },
    ],
    employees: [{ name: "Danielle Fortier — Paralegal", grossPay: 2900, withholdingRate: 20 }],
  },
  {
    templateId: "construction",
    name: "Ironclad Construction Co.", industry: "Construction", country: "Australia", currency: "AUD",
    openingDate: "2026-01-01", openingBalance: 54000,
    customers: [
      { name: "Meridian Property Developers", email: "ap@meridiandev.example", phone: "555-0733", address: "Brisbane, QLD" },
      { name: "City of Ashfield Council", email: "procurement@ashfieldcouncil.example", phone: "555-0755", address: "Ashfield, NSW" },
      { name: "R. & K. Baptiste (Home renovation)", email: "baptiste.family@client.example", phone: "555-0770", address: "Brisbane, QLD" },
      { name: "Northgate Retail Centre", email: "facilities@northgateretail.example", phone: "555-0788", address: "Gold Coast, QLD" },
    ],
    vendors: [
      { name: "BuildRight Materials Supply", email: "orders@buildright.example", phone: "", address: "" },
      { name: "Sunstate Equipment Rental", email: "billing@sunstateequip.example", phone: "", address: "" },
      { name: "Coastal Subcontracting Crew", email: "office@coastalsub.example", phone: "", address: "" },
      { name: "QBCC Licensing Authority", email: "billing@qbcc.example", phone: "", address: "" },
      { name: "Origin Energy — Site Power", email: "billing@originenergy.example", phone: "", address: "" },
    ],
    invoiceDefs: [
      { customerIdx: 0, date: "2026-06-01", dueDate: "2026-07-01", incomeAccount: "construction-income", taxable: true, lines: [{ description: "Foundation works — progress claim 2", qty: 1, price: 28000 }], payment: { amount: 20000, date: "2026-06-20" } },
      { customerIdx: 1, date: "2026-05-15", dueDate: "2026-06-14", incomeAccount: "construction-income", taxable: true, lines: [{ description: "Community centre roofing contract", qty: 1, price: 15500 }] },
      { customerIdx: 2, date: "2026-06-10", dueDate: "2026-07-10", incomeAccount: "construction-income", taxable: true, lines: [{ description: "Kitchen & bathroom renovation", qty: 1, price: 9200 }], payment: { amount: 9200, date: "2026-07-02" } },
      { customerIdx: 3, date: "2026-07-01", dueDate: "2026-07-31", incomeAccount: "construction-income", taxable: true, lines: [{ description: "Retail unit fit-out — stage 1", qty: 1, price: 12800 }] },
    ],
    billDefs: [
      { vendorIdx: 0, date: "2026-06-02", dueDate: "2026-06-16", expenseAccount: "materials", amount: 9800, taxable: true, payment: { amount: 10780, date: "2026-06-15" } },
      { vendorIdx: 1, date: "2026-06-05", dueDate: "2026-06-20", expenseAccount: "repairs", amount: 2200, taxable: true },
      { vendorIdx: 2, date: "2026-06-08", dueDate: "2026-06-22", expenseAccount: "subcontractors", amount: 6400, taxable: false, payment: { amount: 6400, date: "2026-06-21" } },
      { vendorIdx: 3, date: "2026-06-01", dueDate: "2026-07-01", expenseAccount: "permits", amount: 540, taxable: false },
      { vendorIdx: 4, date: "2026-06-15", dueDate: "2026-07-15", expenseAccount: "utilities", amount: 310, taxable: false },
    ],
    bankTxDefs: [
      { date: "2026-07-01", description: "BUILDRIGHT MATERIALS SUPPLY", amount: -4200, suggested: "materials" },
      { date: "2026-07-02", description: "SUNSTATE EQUIPMENT RENTAL", amount: -880, suggested: "repairs" },
      { date: "2026-07-03", description: "COASTAL SUBCONTRACTING CREW", amount: -3100, suggested: "subcontractors" },
      { date: "2026-07-04", description: "PROGRESS CLAIM — MERIDIAN", amount: 20000, suggested: "construction-income" },
      { date: "2026-06-24", description: "QBCC LICENSING AUTHORITY", amount: -540, status: "categorized", categorizedAs: "advertising", suggested: "permits", flaggedMistake: true },
      { date: "2026-06-29", description: "BANK MONTHLY FEE", amount: -22, suggested: "bank-fees" },
    ],
    employees: [{ name: "Jake Whitmore — Site Foreman", grossPay: 3200, withholdingRate: 19 }],
  },
];

function seedState() {
  return buildCompanySeed(COMPANY_TEMPLATES[0]);
}

// Fills in fields that didn't exist in earlier versions of the saved data shape,
// so companies saved before estimates/recurring/multi-bank-account support was
// added keep loading correctly instead of breaking.
function normalizeCompanyData(d) {
  const accounts = (d.accounts || []).map((a) => (a.id === "bank" || a.id === "cash" ? { ...a, isBank: true } : a));
  for (const id of ["input-tax-credit", "wages"]) {
    if (!accounts.find((a) => a.id === id)) {
      const def = DEFAULT_ACCOUNTS.find((a) => a.id === id);
      if (def) accounts.push({ ...def });
    }
  }
  return {
    ...d,
    estimates: d.estimates || [],
    recurringInvoices: d.recurringInvoices || [],
    recurringBills: d.recurringBills || [],
    employees: d.employees || [],
    payrollRuns: d.payrollRuns || [],
    bankTx: (d.bankTx || []).map((t) => ({ accountId: "bank", ...t })),
    accounts,
  };
}

/* ============================== SMALL UI PARTS ============================== */

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-lg border border-slate-200 ${className}`}>{children}</div>;
}

function MetricCard({ label, value, sub, tone = "slate" }) {
  const toneMap = {
    slate: "text-slate-900", teal: "text-teal-700", red: "text-rose-700", amber: "text-amber-700",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-semibold font-mono tabular-nums ${toneMap[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

function Pill({ children, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-100 text-slate-700", teal: "bg-teal-100 text-teal-800",
    red: "bg-rose-100 text-rose-800", amber: "bg-amber-100 text-amber-800", green: "bg-emerald-100 text-emerald-800",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${toneMap[tone]}`}>{children}</span>;
}

function Button({ children, onClick, variant = "secondary", className = "", type = "button", disabled }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-teal-700 text-white hover:bg-teal-800",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 font-serif">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Th({ children, right }) {
  return <th className={`text-xs font-medium text-slate-500 uppercase tracking-wide px-3 py-2 ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, mono }) {
  return <td className={`px-3 py-2 text-sm text-slate-800 ${right ? "text-right" : "text-left"} ${mono ? "font-mono tabular-nums" : ""}`}>{children}</td>;
}

function ExportButton({ filename, columns, rows }) {
  return (
    <Button onClick={() => exportCSV(filename, columns, rows)} disabled={!rows.length}>
      <Download size={13} /> Export CSV
    </Button>
  );
}

function WhyBadge({ note }) {
  const [open, setOpen] = useState(false);
  if (!note) return null;
  return (
    <div className="mt-1">
      <button onClick={() => setOpen(!open)} className="text-xs text-teal-700 hover:underline flex items-center gap-1">
        <Lightbulb size={12} /> Why these accounts?
      </button>
      {open && <p className="text-xs text-slate-500 mt-1 bg-slate-50 border border-slate-200 rounded p-2">{note}</p>}
    </div>
  );
}

/* ============================== APP ============================== */

export default function LedgerLab() {
  const [data, setData] = useState(null);
  const [companiesIndex, setCompaniesIndex] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Bootstrap: load the companies index, seeding the 3 sample companies on first run.
  useEffect(() => {
    (async () => {
      let index = [];
      try {
        const res = await window.storage.get(COMPANIES_INDEX_KEY, false);
        if (res && res.value) index = JSON.parse(res.value);
      } catch { /* no index yet */ }

      if (!index.length) {
        index = [];
        for (const tpl of COMPANY_TEMPLATES) {
          const seed = buildCompanySeed(tpl);
          const id = uid("co");
          index.push({ id, name: seed.company.name, industry: seed.company.industry, country: seed.company.country, templateId: tpl.templateId });
          try { await window.storage.set(companyDataKey(id), JSON.stringify(seed), false); } catch {}
        }
        try { await window.storage.set(COMPANIES_INDEX_KEY, JSON.stringify(index), false); } catch {}
      }

      let activeId = null;
      try {
        const res = await window.storage.get(ACTIVE_COMPANY_KEY, false);
        if (res && res.value) activeId = res.value;
      } catch { /* none set yet */ }
      if (!activeId || !index.find((c) => c.id === activeId)) activeId = index[0].id;

      let companyData = null;
      try {
        const res = await window.storage.get(companyDataKey(activeId), false);
        if (res && res.value) companyData = JSON.parse(res.value);
      } catch { /* fall through to reseed */ }
      if (!companyData) {
        const tpl = COMPANY_TEMPLATES.find((t) => t.templateId === index.find((c) => c.id === activeId)?.templateId) || COMPANY_TEMPLATES[0];
        companyData = buildCompanySeed(tpl);
      }

      setCompaniesIndex(index);
      setActiveCompanyId(activeId);
      setData(normalizeCompanyData(companyData));
      setLoaded(true);
    })();
  }, []);

  // Persist the active company's data whenever it changes.
  useEffect(() => {
    if (!loaded || !data || !activeCompanyId) return;
    const t = setTimeout(() => {
      window.storage.set(companyDataKey(activeCompanyId), JSON.stringify(data), false).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [data, loaded, activeCompanyId]);

  const post = useCallback((entry) => {
    let ok = true, err = null;
    setData((prev) => {
      const r = tryPostEntry(prev.journal, entry);
      if (r.error) { ok = false; err = r.error; return prev; }
      return { ...prev, journal: r.journal };
    });
    return { ok, error: err };
  }, []);

  const switchCompany = async (id) => {
    let companyData = null;
    try {
      const res = await window.storage.get(companyDataKey(id), false);
      if (res && res.value) companyData = JSON.parse(res.value);
    } catch { /* fall through */ }
    if (!companyData) {
      const tpl = COMPANY_TEMPLATES.find((t) => t.templateId === companiesIndex.find((c) => c.id === id)?.templateId) || COMPANY_TEMPLATES[0];
      companyData = buildCompanySeed(tpl);
    }
    setActiveCompanyId(id);
    setData(normalizeCompanyData(companyData));
    setPage("dashboard");
    setShowSwitcher(false);
    try { await window.storage.set(ACTIVE_COMPANY_KEY, id, false); } catch {}
  };

  const addCompanyFromTemplate = async (templateId) => {
    const tpl = COMPANY_TEMPLATES.find((t) => t.templateId === templateId);
    const seed = buildCompanySeed(tpl);
    const id = uid("co");
    const entry = { id, name: seed.company.name, industry: seed.company.industry, country: seed.company.country, templateId };
    const newIndex = [...companiesIndex, entry];
    setCompaniesIndex(newIndex);
    try {
      await window.storage.set(companyDataKey(id), JSON.stringify(seed), false);
      await window.storage.set(COMPANIES_INDEX_KEY, JSON.stringify(newIndex), false);
    } catch {}
    await switchCompany(id);
  };

  const addBlankCompany = async (form) => {
    const seed = {
      company: { name: form.name, currency: form.currency, industry: form.industry, country: form.country, templateId: null },
      accounts: DEFAULT_ACCOUNTS.map((a) => ({ ...a })),
      journal: [], customers: [], vendors: [], invoices: [], bills: [], bankTx: [],
      estimates: [], recurringInvoices: [], recurringBills: [],
      employees: [], payrollRuns: [],
      reconciliations: [], learningProgress: {}, vaChecked: {},
    };
    if (Number(form.openingBalance) > 0) {
      const r = tryPostEntry([], {
        date: todayISO(), reference: "OB-0001", description: "Opening balance — owner investment",
        note: "Bank increased, so Bank is debited. Owner's Equity increased, so it is credited.",
        lines: [{ accountId: "bank", debit: Number(form.openingBalance), credit: 0 }, { accountId: "owner-equity", debit: 0, credit: Number(form.openingBalance) }],
      });
      if (!r.error) seed.journal = r.journal;
    }
    const id = uid("co");
    const entry = { id, name: form.name, industry: form.industry, country: form.country, templateId: null };
    const newIndex = [...companiesIndex, entry];
    setCompaniesIndex(newIndex);
    try {
      await window.storage.set(companyDataKey(id), JSON.stringify(seed), false);
      await window.storage.set(COMPANIES_INDEX_KEY, JSON.stringify(newIndex), false);
    } catch {}
    await switchCompany(id);
  };

  const updateCompanyMeta = async (companyMeta) => {
    const newIndex = companiesIndex.map((c) => (c.id === activeCompanyId ? { ...c, name: companyMeta.name, industry: companyMeta.industry, country: companyMeta.country } : c));
    setCompaniesIndex(newIndex);
    try { await window.storage.set(COMPANIES_INDEX_KEY, JSON.stringify(newIndex), false); } catch {}
  };

  if (!loaded || !data) {
    return <div className="p-8 text-sm text-slate-500">Loading LedgerLab…</div>;
  }

  const resetDemo = async () => {
    const tpl = COMPANY_TEMPLATES.find((t) => t.templateId === data.company.templateId);
    const fresh = tpl ? buildCompanySeed(tpl) : {
      company: data.company,
      accounts: DEFAULT_ACCOUNTS.map((a) => ({ ...a })),
      journal: [], customers: [], vendors: [], invoices: [], bills: [], bankTx: [],
      estimates: [], recurringInvoices: [], recurringBills: [],
      employees: [], payrollRuns: [],
      reconciliations: [], learningProgress: {}, vaChecked: {},
    };
    setData(fresh);
    try { await window.storage.set(companyDataKey(activeCompanyId), JSON.stringify(fresh), false); } catch {}
  };

  return (
    <div className="w-full bg-slate-50 text-slate-900" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-overlay { position: static !important; background: white !important; display: block !important; padding: 0 !important; }
          .print-area { position: static !important; box-shadow: none !important; max-height: none !important; width: auto !important; }
        }
      `}</style>
      <div className="flex no-print" style={{ minHeight: 640 }}>
        <aside className="w-56 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
          <div className="px-4 py-4 border-b border-slate-800">
            <p className="font-serif font-semibold text-white text-lg leading-tight">LedgerLab</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Learn bookkeeping by doing it</p>
          </div>
          <nav className="flex-1 py-2">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition ${
                    active ? "bg-teal-700/90 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon size={16} /> {n.label}
                </button>
              );
            })}
          </nav>
          <button onClick={() => setShowSwitcher(true)} className="px-4 py-3 border-t border-slate-800 text-left hover:bg-slate-800 transition">
            <p className="text-[11px] text-slate-500 flex items-center gap-1"><Building2 size={11} /> Practice company</p>
            <p className="text-xs text-slate-200 font-medium flex items-center gap-1 mt-0.5">{data.company.name} <ChevronDown size={12} /></p>
          </button>
        </aside>

        <main className="flex-1 min-w-0 p-6 overflow-auto">
          {page === "dashboard" && <Dashboard data={data} setData={setData} setPage={setPage} />}
          {page === "banking" && <Banking data={data} setData={setData} post={post} />}
          {page === "sales" && <Sales data={data} setData={setData} post={post} />}
          {page === "expenses" && <Expenses data={data} setData={setData} post={post} />}
          {page === "payroll" && <Payroll data={data} setData={setData} post={post} />}
          {page === "accounting" && <Accounting data={data} setData={setData} post={post} />}
          {page === "reports" && <Reports data={data} />}
          {page === "learning" && <Learning data={data} setData={setData} />}
          {page === "compare" && <PlatformComparison />}
          {page === "va" && <VAPracticeCenter data={data} setData={setData} setPage={setPage} />}
          {page === "settings" && <SettingsPage data={data} setData={setData} resetDemo={resetDemo} onImportData={updateCompanyMeta} />}
        </main>
      </div>

      {showSwitcher && (
        <CompanySwitcher
          companies={companiesIndex}
          activeId={activeCompanyId}
          onSwitch={switchCompany}
          onAddFromTemplate={addCompanyFromTemplate}
          onAddBlank={addBlankCompany}
          onClose={() => setShowSwitcher(false)}
        />
      )}
    </div>
  );
}

function CompanySwitcher({ companies, activeId, onSwitch, onAddFromTemplate, onAddBlank, onClose }) {
  const [mode, setMode] = useState("list"); // list | templates | blank
  const [blankForm, setBlankForm] = useState({ name: "", industry: "", country: "", currency: "PHP", openingBalance: "" });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="p-4 w-[460px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {mode === "list" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Your practice companies</p>
              <Button variant="ghost" onClick={onClose}><X size={15} /></Button>
            </div>
            <div className="space-y-1.5">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSwitch(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${c.id === activeId ? "border-teal-600 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-xs text-slate-500">{c.industry} · {c.country}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="primary" onClick={() => setMode("templates")}><Plus size={14} /> Load a sample company</Button>
              <Button onClick={() => setMode("blank")}><Plus size={14} /> Start a blank company</Button>
            </div>
          </>
        )}

        {mode === "templates" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Load a sample company</p>
              <Button variant="ghost" onClick={() => setMode("list")}><X size={15} /></Button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Instantly loads a fresh, fully pre-populated practice company — a new copy, separate from any you already have.</p>
            <div className="space-y-1.5">
              {COMPANY_TEMPLATES.map((t) => (
                <button key={t.templateId} onClick={() => onAddFromTemplate(t.templateId)} className="w-full text-left px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="block text-xs text-slate-500">{t.industry} · {t.country} · {t.currency}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === "blank" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Start a blank company</p>
              <Button variant="ghost" onClick={() => setMode("list")}><X size={15} /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company name"><input className={inputCls} value={blankForm.name} onChange={(e) => setBlankForm({ ...blankForm, name: e.target.value })} /></Field>
              <Field label="Industry"><input className={inputCls} value={blankForm.industry} onChange={(e) => setBlankForm({ ...blankForm, industry: e.target.value })} /></Field>
              <Field label="Country"><input className={inputCls} value={blankForm.country} onChange={(e) => setBlankForm({ ...blankForm, country: e.target.value })} /></Field>
              <Field label="Currency">
                <select className={inputCls} value={blankForm.currency} onChange={(e) => setBlankForm({ ...blankForm, currency: e.target.value })}>
                  {["PHP", "USD", "AUD", "CAD", "GBP", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Opening bank balance (optional)"><input type="number" className={inputCls} value={blankForm.openingBalance} onChange={(e) => setBlankForm({ ...blankForm, openingBalance: e.target.value })} /></Field>
            </div>
            <p className="text-xs text-slate-500 mt-2">Starts with the standard Chart of Accounts and no customers, vendors, invoices, or bills — you build it from scratch.</p>
            <Button variant="primary" className="mt-3" onClick={() => blankForm.name && onAddBlank(blankForm)}>Create company</Button>
          </>
        )}
      </Card>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function TrendChart({ series, currency }) {
  const max = Math.max(1, ...series.flatMap((s) => [s.income, s.expense]));
  const monthLabel = (m) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, { month: "short" });
  };
  return (
    <div>
      <div className="flex items-end gap-3" style={{ height: 140 }}>
        {series.map((s) => (
          <div key={s.month} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex items-end gap-1 flex-1 w-full justify-center">
              <div
                title={`Income: ${fmt(s.income, currency)}`}
                className="w-3 rounded-t bg-teal-600"
                style={{ height: `${Math.max(2, (s.income / max) * 100)}%` }}
              />
              <div
                title={`Expenses: ${fmt(s.expense, currency)}`}
                className="w-3 rounded-t bg-rose-400"
                style={{ height: `${Math.max(2, (s.expense / max) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{monthLabel(s.month)}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" /> Income</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Expenses</span>
      </div>
    </div>
  );
}

function Dashboard({ data, setPage }) {
  const { accounts, journal, invoices, bills, company } = data;
  const bank = accounts.filter((a) => a.isBank && !a.archived).reduce((s, a) => s + accountBalance(accounts, journal, a.id), 0);
  const ar = accountBalance(accounts, journal, "ar");
  const ap = accountBalance(accounts, journal, "ap");
  const income = sumByType(accounts, journal, "income");
  const expense = sumByType(accounts, journal, "expense");
  const netProfit = round2(income - expense);
  const outstandingInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "void");
  const overdueInvoices = outstandingInvoices.filter((i) => daysBetween(i.dueDate, todayISO()) > 0);
  const billsDue = bills.filter((b) => b.status !== "paid");
  const overdueBills = billsDue.filter((b) => daysBetween(b.dueDate, todayISO()) > 0);
  const series = monthlySeries(accounts, journal, 6);

  const recent = [...journal].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle={`${company.name} · ${company.currency}`} />
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Bank balance" value={fmt(bank, company.currency)} tone="teal" />
        <MetricCard label="Accounts receivable" value={fmt(ar, company.currency)} sub="Money customers owe you" />
        <MetricCard label="Accounts payable" value={fmt(ap, company.currency)} sub="Money you owe vendors" />
        <MetricCard label="Net profit (all time)" value={fmt(netProfit, company.currency)} tone={netProfit >= 0 ? "teal" : "red"} />
      </div>
      <div className="grid grid-cols-4 gap-3 mt-3">
        <MetricCard label="Income" value={fmt(income, company.currency)} />
        <MetricCard label="Expenses" value={fmt(expense, company.currency)} />
        <MetricCard label="Outstanding invoices" value={outstandingInvoices.length} sub={`${overdueInvoices.length} overdue`} tone={overdueInvoices.length ? "amber" : "slate"} />
        <MetricCard label="Bills due" value={billsDue.length} sub={`${overdueBills.length} overdue`} tone={overdueBills.length ? "amber" : "slate"} />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card className="p-4 col-span-2">
          <p className="text-sm font-medium text-slate-700 mb-3">Monthly income vs. expenses</p>
          <TrendChart series={series} currency={company.currency} />
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Where to focus</p>
          <ul className="space-y-2 text-sm">
            {overdueInvoices.length > 0 && (
              <li>
                <button className="text-teal-700 hover:underline flex items-center gap-1" onClick={() => setPage("sales")}>
                  <ArrowUpRight size={14} /> {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? "s" : ""} to follow up
                </button>
              </li>
            )}
            {overdueBills.length > 0 && (
              <li>
                <button className="text-teal-700 hover:underline flex items-center gap-1" onClick={() => setPage("expenses")}>
                  <ArrowDownRight size={14} /> {overdueBills.length} overdue bill{overdueBills.length !== 1 ? "s" : ""} to pay
                </button>
              </li>
            )}
            <li>
              <button className="text-teal-700 hover:underline flex items-center gap-1" onClick={() => setPage("banking")}>
                <Landmark size={14} /> Review your bank feed
              </button>
            </li>
            <li>
              <button className="text-teal-700 hover:underline flex items-center gap-1" onClick={() => setPage("va")}>
                <Target size={14} /> Open VA Practice Center
              </button>
            </li>
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card className="p-4 col-span-2">
          <p className="text-sm font-medium text-slate-700 mb-3">Recent journal activity</p>
          <table className="w-full">
            <thead><tr><Th>Date</Th><Th>Description</Th><Th right>Amount</Th></tr></thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <Td>{e.date}</Td>
                  <Td>{e.description}</Td>
                  <Td right mono>{fmt(e.lines.reduce((s, l) => s + (l.debit || 0), 0), company.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ============================== BANKING ============================== */

function Banking({ data, setData, post }) {
  const { bankTx, accounts, company } = data;
  const bankAccounts = accounts.filter((a) => a.isBank && !a.archived);
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || "bank");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [draft, setDraft] = useState({ date: todayISO(), description: "", amount: "" });
  const [csvText, setCsvText] = useState("");
  const [newAccountForm, setNewAccountForm] = useState({ name: "", openingBalance: "" });

  const activeAccountId = bankAccounts.find((a) => a.id === selectedAccountId) ? selectedAccountId : (bankAccounts[0]?.id || "bank");
  const filteredTx = bankTx.filter((t) => (t.accountId || "bank") === activeAccountId);

  const categorize = (txId, accountId) => {
    const tx = bankTx.find((t) => t.id === txId);
    if (!tx) return;
    const amt = Math.abs(tx.amount);
    const acct = accounts.find((a) => a.id === accountId);
    const bankAcctName = accounts.find((a) => a.id === activeAccountId)?.name || "Bank";
    const isIncome = tx.amount > 0;
    const lines = isIncome
      ? [{ accountId: activeAccountId, debit: amt, credit: 0 }, { accountId, debit: 0, credit: amt }]
      : [{ accountId, debit: amt, credit: 0 }, { accountId: activeAccountId, debit: 0, credit: amt }];
    const result = post({
      date: tx.date, reference: "", description: `Bank: ${tx.description}`,
      note: isIncome
        ? `${bankAcctName} increased, so it is debited. Income increased, so it is credited.`
        : `Expense increased, so ${acct?.name} is debited. ${bankAcctName} decreased, so it is credited.`,
      lines,
    });
    if (!result.ok) { alert(result.error); return; }
    setData((prev) => ({
      ...prev,
      bankTx: prev.bankTx.map((t) => (t.id === txId ? { ...t, status: "categorized", categorizedAs: accountId } : t)),
    }));
  };

  const excludeTx = (txId) => {
    setData((prev) => ({ ...prev, bankTx: prev.bankTx.map((t) => (t.id === txId ? { ...t, status: "excluded" } : t)) }));
  };

  const addTx = () => {
    if (!draft.description || !draft.amount) return;
    setData((prev) => ({
      ...prev,
      bankTx: [{ id: uid("btx"), date: draft.date, description: draft.description, amount: Number(draft.amount), status: "uncategorized", accountId: activeAccountId }, ...prev.bankTx],
    }));
    setDraft({ date: todayISO(), description: "", amount: "" });
    setShowAdd(false);
  };

  const importCsv = () => {
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    const newTx = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 3) continue;
      const [date, description, amount] = parts;
      if (isNaN(Number(amount))) continue;
      newTx.push({ id: uid("btx"), date, description, amount: Number(amount), status: "uncategorized", accountId: activeAccountId });
    }
    if (newTx.length) {
      setData((prev) => ({ ...prev, bankTx: [...newTx, ...prev.bankTx] }));
      setCsvText("");
    }
  };

  const addBankAccount = () => {
    if (!newAccountForm.name) return;
    const id = uid("acct");
    setData((prev) => {
      let journal = prev.journal;
      const opening = Number(newAccountForm.openingBalance) || 0;
      if (opening > 0) {
        const r = tryPostEntry(journal, {
          date: todayISO(), reference: "OB", description: `Opening balance — ${newAccountForm.name}`,
          note: `${newAccountForm.name} increased, so it is debited. Owner's Equity increased, so it is credited.`,
          lines: [{ accountId: id, debit: opening, credit: 0 }, { accountId: "owner-equity", debit: 0, credit: opening }],
        });
        if (!r.error) journal = r.journal;
      }
      const nextCode = String(1020 + prev.accounts.filter((a) => a.isBank).length * 10);
      return {
        ...prev,
        journal,
        accounts: [...prev.accounts, { id, code: nextCode, name: newAccountForm.name, type: "asset", archived: false, isBank: true }],
      };
    });
    setSelectedAccountId(id);
    setNewAccountForm({ name: "", openingBalance: "" });
    setShowAddAccount(false);
  };

  const bankBalance = accountBalance(accounts, data.journal, activeAccountId);
  const openAccounts = accounts.filter((a) => !a.archived && (a.type === "expense" || a.type === "income"));

  return (
    <div>
      <SectionHeader
        title="Banking"
        subtitle={`${accounts.find((a) => a.id === activeAccountId)?.name} balance: ${fmt(bankBalance, company.currency)}`}
        action={
          <div className="flex gap-2">
            <ExportButton
              filename="bank-transactions"
              rows={filteredTx}
              columns={[
                { label: "Date", key: "date" }, { label: "Description", key: "description" }, { label: "Amount", key: "amount" },
                { label: "Status", key: "status" }, { label: "Category", value: (t) => accounts.find((a) => a.id === t.categorizedAs)?.name || "" },
              ]}
            />
            <Button variant="primary" onClick={() => setShowAdd(!showAdd)}><Plus size={14} /> Add transaction</Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500">Account:</span>
        {bankAccounts.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAccountId(a.id)}
            className={`px-3 py-1.5 rounded-md text-sm border transition ${activeAccountId === a.id ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
          >
            {a.name}
          </button>
        ))}
        <Button onClick={() => setShowAddAccount(!showAddAccount)}><Plus size={13} /> Add account</Button>
      </div>

      {showAddAccount && (
        <Card className="p-4 mb-4">
          <p className="text-sm font-medium mb-2">New bank / cash account</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Account name"><input className={inputCls} value={newAccountForm.name} onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })} placeholder="e.g. Savings Account" /></Field>
            <Field label="Opening balance (optional)"><input type="number" className={inputCls} value={newAccountForm.openingBalance} onChange={(e) => setNewAccountForm({ ...newAccountForm, openingBalance: e.target.value })} /></Field>
            <div className="flex items-end gap-2"><Button variant="primary" onClick={addBankAccount}>Create</Button><Button onClick={() => setShowAddAccount(false)}>Cancel</Button></div>
          </div>
        </Card>
      )}

      {showAdd && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-4 gap-3">
            <Field label="Date"><input type="date" className={inputCls} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
            <Field label="Description"><input className={inputCls} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="e.g. OFFICE SUPPLY CO" /></Field>
            <Field label="Amount (+ deposit / − withdrawal)"><input type="number" className={inputCls} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="-150" /></Field>
            <div className="flex items-end"><Button variant="primary" onClick={addTx}>Add</Button></div>
          </div>
        </Card>
      )}

      <Card className="p-4 mb-4">
        <p className="text-sm font-medium text-slate-700 mb-2">Import bank feed (CSV)</p>
        <p className="text-xs text-slate-500 mb-2">Paste rows as: date, description, amount (negative for money out), for the <strong>{accounts.find((a) => a.id === activeAccountId)?.name}</strong> account. Simulates a downloaded bank statement.</p>
        <textarea className={`${inputCls} font-mono`} rows={3} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="2026-07-10, ADOBE CREATIVE CLOUD, -55" />
        <div className="mt-2"><Button onClick={importCsv}>Import rows</Button></div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Date</Th><Th>Description</Th><Th right>Amount</Th><Th>Suggested</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filteredTx.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-100">
                <Td>{tx.date}</Td>
                <Td>{tx.description} {tx.flaggedMistake && <Pill tone="amber">check this</Pill>}</Td>
                <Td right mono>
                  <span className={tx.amount < 0 ? "text-rose-700" : "text-teal-700"}>{fmt(tx.amount, company.currency)}</span>
                </Td>
                <Td>{tx.suggested ? accounts.find((a) => a.id === tx.suggested)?.name : "—"}</Td>
                <Td>
                  {tx.status === "categorized" && <Pill tone="teal">{accounts.find((a) => a.id === tx.categorizedAs)?.name}</Pill>}
                  {tx.status === "uncategorized" && <Pill tone="amber">Needs review</Pill>}
                  {tx.status === "excluded" && <Pill>Excluded</Pill>}
                </Td>
                <Td>
                  {tx.status === "uncategorized" && (
                    <div className="flex items-center gap-1">
                      <select className="border border-slate-300 rounded-md text-xs px-1.5 py-1" defaultValue="" onChange={(e) => e.target.value && categorize(tx.id, e.target.value)}>
                        <option value="" disabled>Categorize as…</option>
                        {openAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      {tx.suggested && <Button variant="ghost" className="!px-1.5 !py-1" onClick={() => categorize(tx.id, tx.suggested)}><Check size={13} /></Button>}
                      <Button variant="ghost" className="!px-1.5 !py-1" onClick={() => excludeTx(tx.id)}><X size={13} /></Button>
                    </div>
                  )}
                  {tx.status === "categorized" && (
                    <select className="border border-slate-300 rounded-md text-xs px-1.5 py-1" value={tx.categorizedAs} onChange={(e) => categorize(tx.id, e.target.value)}>
                      {openAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </Td>
              </tr>
            ))}
            {filteredTx.length === 0 && <tr><Td>No transactions on this account yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================== SALES ============================== */

function Sales({ data, setData, post }) {
  const { customers, invoices, accounts, company, estimates = [], recurringInvoices = [] } = data;
  const bankAccounts = accounts.filter((a) => a.isBank && !a.archived);
  const [tab, setTab] = useState("invoices");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewEstimate, setShowNewEstimate] = useState(false);
  const [showNewRecurring, setShowNewRecurring] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [creditModal, setCreditModal] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  const incomeAccounts = accounts.filter((a) => a.type === "income" && !a.archived);

  const addCustomer = (c) => setData((prev) => ({ ...prev, customers: [...prev.customers, { id: uid("cust"), ...c }] }));

  const postInvoiceFromLines = (form) => {
    const subtotal = form.lines.reduce((s, l) => s + Number(l.qty) * Number(l.price), 0);
    const tax = form.taxable ? round2(subtotal * 0.12) : 0;
    const total = round2(subtotal + tax);
    if (total <= 0) return { error: "Add at least one line item with a price." };
    const number = `INV-${1000 + invoices.length + 1}`;
    const result = post({
      date: form.date, reference: number,
      description: `Invoice ${number} to ${customers.find((c) => c.id === form.customerId)?.name}`,
      note: "Accounts Receivable increased because the customer owes us, so AR is debited. Income increased, so it is credited.",
      lines: [
        { accountId: "ar", debit: total, credit: 0 },
        { accountId: form.incomeAccount, debit: 0, credit: subtotal },
        ...(tax ? [{ accountId: "taxpayable", debit: 0, credit: tax }] : []),
      ],
    });
    if (!result.ok) return { error: result.error };
    return { invoice: { customerId: form.customerId, date: form.date, dueDate: form.dueDate, incomeAccount: form.incomeAccount, taxable: form.taxable, lines: form.lines, id: uid("inv"), number, subtotal, tax, total, amountPaid: 0, creditedAmount: 0, status: "sent" } };
  };

  const createInvoice = (form) => {
    const r = postInvoiceFromLines(form);
    if (r.error) { alert(r.error); return; }
    setData((prev) => ({ ...prev, invoices: [...prev.invoices, r.invoice] }));
    setShowNewInvoice(false);
  };

  const recordPayment = (invId, amount, accountId) => {
    const inv = invoices.find((i) => i.id === invId);
    const remaining = round2(inv.total - inv.amountPaid - (inv.creditedAmount || 0));
    if (amount > remaining + 0.001) { alert(`Payment exceeds outstanding balance of ${fmt(remaining, company.currency)}.`); return; }
    const acctName = accounts.find((a) => a.id === accountId)?.name || "Bank";
    const result = post({
      date: todayISO(), reference: inv.number, description: `Payment received for ${inv.number}`,
      note: `${acctName} increased because cash came in, so it is debited. Accounts Receivable decreased, so it is credited.`,
      lines: [{ accountId, debit: amount, credit: 0 }, { accountId: "ar", debit: 0, credit: amount }],
    });
    if (!result.ok) { alert(result.error); return; }
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => {
        if (i.id !== invId) return i;
        const paid = round2(i.amountPaid + amount);
        return { ...i, amountPaid: paid, status: paid + (i.creditedAmount || 0) >= i.total ? "paid" : "partial" };
      }),
    }));
    setPayModal(null);
  };

  const issueCreditNote = (invId, amount, reason) => {
    const inv = invoices.find((i) => i.id === invId);
    const subtotalPortion = inv.taxable ? round2(amount / 1.12) : amount;
    const taxPortion = round2(amount - subtotalPortion);
    const result = post({
      date: todayISO(), reference: inv.number, description: `Credit note for ${inv.number}${reason ? ` — ${reason}` : ""}`,
      note: "Income decreased because we're crediting the customer, so the income account is debited. Accounts Receivable decreased since they owe less, so it is credited.",
      lines: [
        { accountId: inv.incomeAccount, debit: subtotalPortion, credit: 0 },
        ...(taxPortion ? [{ accountId: "taxpayable", debit: taxPortion, credit: 0 }] : []),
        { accountId: "ar", debit: 0, credit: amount },
      ],
    });
    if (!result.ok) { alert(result.error); return; }
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => {
        if (i.id !== invId) return i;
        const credited = round2((i.creditedAmount || 0) + amount);
        return { ...i, creditedAmount: credited, status: i.amountPaid + credited >= i.total ? "void" : i.status };
      }),
    }));
    setCreditModal(null);
  };

  const addEstimate = (form) => {
    const subtotal = form.lines.reduce((s, l) => s + Number(l.qty) * Number(l.price), 0);
    const tax = form.taxable ? round2(subtotal * 0.12) : 0;
    const total = round2(subtotal + tax);
    if (total <= 0) { alert("Add at least one line item with a price."); return; }
    const number = `EST-${3000 + estimates.length + 1}`;
    setData((prev) => ({
      ...prev,
      estimates: [...(prev.estimates || []), { ...form, id: uid("est"), number, subtotal, tax, total, status: "sent" }],
    }));
    setShowNewEstimate(false);
  };

  const convertEstimate = (estId) => {
    const est = estimates.find((e) => e.id === estId);
    const r = postInvoiceFromLines({ customerId: est.customerId, date: todayISO(), dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(), incomeAccount: est.incomeAccount, taxable: est.taxable, lines: est.lines });
    if (r.error) { alert(r.error); return; }
    setData((prev) => ({
      ...prev,
      invoices: [...prev.invoices, r.invoice],
      estimates: prev.estimates.map((e) => (e.id === estId ? { ...e, status: "invoiced", invoiceId: r.invoice.id } : e)),
    }));
  };

  const setEstimateStatus = (estId, status) => setData((prev) => ({ ...prev, estimates: prev.estimates.map((e) => (e.id === estId ? { ...e, status } : e)) }));

  const addRecurring = (form) => {
    setData((prev) => ({
      ...prev,
      recurringInvoices: [...(prev.recurringInvoices || []), { ...form, id: uid("rec"), active: true }],
    }));
    setShowNewRecurring(false);
  };

  const generateRecurringNow = (recId) => {
    const rec = recurringInvoices.find((r) => r.id === recId);
    const dueDate = (() => { const d = new Date(rec.nextDate); d.setDate(d.getDate() + (Number(rec.dueDays) || 30)); return d.toISOString().slice(0, 10); })();
    const r = postInvoiceFromLines({ customerId: rec.customerId, date: rec.nextDate, dueDate, incomeAccount: rec.incomeAccount, taxable: rec.taxable, lines: rec.lines });
    if (r.error) { alert(r.error); return; }
    const advance = (dateStr, freq) => {
      const d = new Date(dateStr);
      if (freq === "weekly") d.setDate(d.getDate() + 7);
      else if (freq === "biweekly") d.setDate(d.getDate() + 14);
      else d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    };
    setData((prev) => ({
      ...prev,
      invoices: [...prev.invoices, r.invoice],
      recurringInvoices: prev.recurringInvoices.map((rr) => (rr.id === recId ? { ...rr, nextDate: advance(rr.nextDate, rr.frequency) } : rr)),
    }));
  };

  const toggleRecurring = (recId) => setData((prev) => ({ ...prev, recurringInvoices: prev.recurringInvoices.map((r) => (r.id === recId ? { ...r, active: !r.active } : r)) }));
  const deleteRecurring = (recId) => setData((prev) => ({ ...prev, recurringInvoices: prev.recurringInvoices.filter((r) => r.id !== recId) }));

  return (
    <div>
      <SectionHeader
        title="Sales"
        subtitle="Customers, invoices, and receivables"
        action={
          <div className="flex gap-2">
            {tab === "invoices" && (
              <ExportButton
                filename="invoices"
                rows={invoices}
                columns={[
                  { label: "Number", key: "number" }, { label: "Customer", value: (i) => customers.find((c) => c.id === i.customerId)?.name },
                  { label: "Date", key: "date" }, { label: "Due date", key: "dueDate" },
                  { label: "Subtotal", key: "subtotal" }, { label: "Tax", key: "tax" }, { label: "Total", key: "total" },
                  { label: "Paid", key: "amountPaid" }, { label: "Credited", value: (i) => i.creditedAmount || 0 }, { label: "Status", key: "status" },
                ]}
              />
            )}
            <Button onClick={() => setShowNewCustomer(true)}><Plus size={14} /> Customer</Button>
            {tab === "estimates" ? (
              <Button variant="primary" onClick={() => setShowNewEstimate(true)}><Plus size={14} /> Estimate</Button>
            ) : tab === "recurring" ? (
              <Button variant="primary" onClick={() => setShowNewRecurring(true)}><Plus size={14} /> Recurring invoice</Button>
            ) : (
              <Button variant="primary" onClick={() => setShowNewInvoice(true)}><Plus size={14} /> Invoice</Button>
            )}
          </div>
        }
      />
      <div className="flex gap-4 border-b border-slate-200 mb-4 text-sm">
        {[["invoices", "Invoices"], ["estimates", "Estimates"], ["recurring", "Recurring"], ["customers", "Customers"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pb-2 -mb-px ${tab === id ? "border-b-2 border-teal-700 text-teal-800 font-medium" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>

      {showNewCustomer && <NewCustomerForm onSave={(c) => { addCustomer(c); setShowNewCustomer(false); }} onCancel={() => setShowNewCustomer(false)} />}
      {showNewInvoice && (
        <NewInvoiceForm customers={customers} incomeAccounts={incomeAccounts} onSave={createInvoice} onCancel={() => setShowNewInvoice(false)} />
      )}
      {showNewEstimate && (
        <NewInvoiceForm customers={customers} incomeAccounts={incomeAccounts} heading="New estimate" dateLabel="Estimate date" dueLabel="Expiry date" saveLabel="Save estimate" onSave={addEstimate} onCancel={() => setShowNewEstimate(false)} />
      )}
      {showNewRecurring && (
        <NewRecurringInvoiceForm customers={customers} incomeAccounts={incomeAccounts} onSave={addRecurring} onCancel={() => setShowNewRecurring(false)} />
      )}

      {tab === "invoices" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Number</Th><Th>Customer</Th><Th>Date</Th><Th>Due</Th><Th right>Total</Th><Th right>Balance</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {invoices.map((inv) => {
                const balance = round2(inv.total - inv.amountPaid - (inv.creditedAmount || 0));
                const overdue = balance > 0 && daysBetween(inv.dueDate, todayISO()) > 0;
                return (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <Td>{inv.number}</Td>
                    <Td>{customers.find((c) => c.id === inv.customerId)?.name}</Td>
                    <Td>{inv.date}</Td>
                    <Td>{inv.dueDate}</Td>
                    <Td right mono>{fmt(inv.total, company.currency)}</Td>
                    <Td right mono>{fmt(balance, company.currency)}</Td>
                    <Td>
                      <Pill tone={inv.status === "paid" || inv.status === "void" ? "teal" : overdue ? "red" : inv.status === "partial" ? "amber" : "slate"}>
                        {overdue ? "overdue" : inv.status === "void" ? "fully credited" : inv.status}
                      </Pill>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => setPrintInvoice(inv.id)}><Printer size={13} /></Button>
                        {balance > 0.001 && <Button variant="ghost" onClick={() => setPayModal(inv.id)}>Record payment</Button>}
                        {balance > 0.001 && <Button variant="ghost" onClick={() => setCreditModal(inv.id)}>Credit note</Button>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {invoices.length === 0 && <tr><Td>No invoices yet.</Td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "estimates" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Number</Th><Th>Customer</Th><Th>Date</Th><Th>Expiry</Th><Th right>Total</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {estimates.map((est) => (
                <tr key={est.id} className="border-t border-slate-100">
                  <Td>{est.number}</Td>
                  <Td>{customers.find((c) => c.id === est.customerId)?.name}</Td>
                  <Td>{est.date}</Td>
                  <Td>{est.dueDate}</Td>
                  <Td right mono>{fmt(est.total, company.currency)}</Td>
                  <Td><Pill tone={est.status === "accepted" || est.status === "invoiced" ? "teal" : est.status === "declined" ? "red" : "slate"}>{est.status}</Pill></Td>
                  <Td>
                    {est.status !== "invoiced" && est.status !== "declined" && (
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => setEstimateStatus(est.id, "accepted")}>Accept</Button>
                        <Button variant="ghost" onClick={() => setEstimateStatus(est.id, "declined")}>Decline</Button>
                        <Button variant="primary" onClick={() => convertEstimate(est.id)}>Convert to invoice</Button>
                      </div>
                    )}
                    {est.status === "invoiced" && <Pill tone="teal">Invoiced</Pill>}
                  </Td>
                </tr>
              ))}
              {estimates.length === 0 && <tr><Td>No estimates yet — create one to quote a customer before invoicing.</Td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "recurring" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Description</Th><Th>Customer</Th><Th right>Amount</Th><Th>Frequency</Th><Th>Next date</Th><Th>Active</Th><Th></Th></tr></thead>
            <tbody>
              {recurringInvoices.map((r) => {
                const total = round2(r.lines.reduce((s, l) => s + l.qty * l.price, 0) * (r.taxable ? 1.12 : 1));
                const due = r.nextDate <= todayISO();
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <Td>{r.description || r.lines[0]?.description}</Td>
                    <Td>{customers.find((c) => c.id === r.customerId)?.name}</Td>
                    <Td right mono>{fmt(total, company.currency)}</Td>
                    <Td className="capitalize">{r.frequency}</Td>
                    <Td>{r.nextDate} {due && <Pill tone="amber">due</Pill>}</Td>
                    <Td><input type="checkbox" checked={r.active} onChange={() => toggleRecurring(r.id)} /></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="primary" onClick={() => generateRecurringNow(r.id)}>Generate now</Button>
                        <Button variant="ghost" onClick={() => deleteRecurring(r.id)}><Trash2 size={13} /></Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {recurringInvoices.length === 0 && <tr><Td>No recurring invoices set up — good for retainer clients billed the same amount on a schedule.</Td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "customers" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Name</Th><Th>Email</Th><Th right>Total invoiced</Th><Th right>Outstanding</Th></tr></thead>
            <tbody>
              {customers.map((c) => {
                const custInvoices = invoices.filter((i) => i.customerId === c.id);
                const totalInvoiced = custInvoices.reduce((s, i) => s + i.total, 0);
                const outstanding = custInvoices.reduce((s, i) => s + (i.total - i.amountPaid - (i.creditedAmount || 0)), 0);
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <Td>{c.name}</Td>
                    <Td>{c.email}</Td>
                    <Td right mono>{fmt(totalInvoiced, company.currency)}</Td>
                    <Td right mono>{fmt(outstanding, company.currency)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {payModal && (
        <PaymentModal
          title="Record customer payment"
          max={round2(invoices.find((i) => i.id === payModal).total - invoices.find((i) => i.id === payModal).amountPaid - (invoices.find((i) => i.id === payModal).creditedAmount || 0))}
          currency={company.currency}
          bankAccounts={bankAccounts}
          onConfirm={(amt, accountId) => recordPayment(payModal, amt, accountId)}
          onCancel={() => setPayModal(null)}
        />
      )}

      {creditModal && (
        <CreditNoteModal
          title="Issue credit note"
          max={round2(invoices.find((i) => i.id === creditModal).total - invoices.find((i) => i.id === creditModal).amountPaid - (invoices.find((i) => i.id === creditModal).creditedAmount || 0))}
          currency={company.currency}
          onConfirm={(amt, reason) => issueCreditNote(creditModal, amt, reason)}
          onCancel={() => setCreditModal(null)}
        />
      )}

      {printInvoice && (
        <PrintableInvoice
          invoice={invoices.find((i) => i.id === printInvoice)}
          customer={customers.find((c) => c.id === invoices.find((i) => i.id === printInvoice).customerId)}
          company={company}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
}

function PrintableInvoice({ invoice, customer, company, onClose }) {
  return (
    <div className="print-overlay fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="print-area bg-white w-[600px] max-h-[85vh] overflow-auto rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="font-serif font-semibold text-xl">{company.name}</p>
              <p className="text-xs text-slate-500">{company.country}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">INVOICE</p>
              <p className="text-sm text-slate-500">{invoice.number}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm mb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase mb-1">Bill to</p>
              <p className="font-medium">{customer?.name}</p>
              <p className="text-slate-500">{customer?.email}</p>
            </div>
            <div className="text-right">
              <p><span className="text-slate-400">Date: </span>{invoice.date}</p>
              <p><span className="text-slate-400">Due: </span>{invoice.dueDate}</p>
              <p className="mt-1"><Pill tone={invoice.status === "paid" ? "teal" : "amber"}>{invoice.status}</Pill></p>
            </div>
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b border-slate-200"><Th>Description</Th><Th right>Qty</Th><Th right>Price</Th><Th right>Amount</Th></tr></thead>
            <tbody>
              {invoice.lines.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <Td>{l.description}</Td><Td right mono>{l.qty}</Td><Td right mono>{fmt(l.price, company.currency)}</Td>
                  <Td right mono>{fmt(l.qty * l.price, company.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-56 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{fmt(invoice.subtotal, company.currency)}</span></div>
              {invoice.tax > 0 && <div className="flex justify-between"><span>Tax</span><span className="font-mono">{fmt(invoice.tax, company.currency)}</span></div>}
              <div className="flex justify-between font-semibold border-t border-slate-800 pt-1"><span>Total</span><span className="font-mono">{fmt(invoice.total, company.currency)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Paid</span><span className="font-mono">{fmt(invoice.amountPaid, company.currency)}</span></div>
              <div className="flex justify-between font-medium"><span>Balance due</span><span className="font-mono">{fmt(invoice.total - invoice.amountPaid, company.currency)}</span></div>
            </div>
          </div>
        </div>
        <div className="no-print flex gap-2 justify-end p-4 border-t border-slate-200">
          <Button variant="primary" onClick={() => window.print()}><Printer size={13} /> Print / Save as PDF</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function NewCustomerForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "" });
  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">New customer</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email"><input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Address"><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => f.name && onSave(f)}>Save customer</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

function NewInvoiceForm({ customers, incomeAccounts, onSave, onCancel, dateLabel = "Invoice date", dueLabel = "Due date", heading = "New invoice", saveLabel = "Save & send invoice" }) {
  const [f, setF] = useState({
    customerId: customers[0]?.id || "", date: todayISO(), dueDate: todayISO(),
    incomeAccount: incomeAccounts[0]?.id || "", taxable: false,
    lines: [{ description: "", qty: 1, price: "" }],
  });
  const subtotal = f.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
  const tax = f.taxable ? round2(subtotal * 0.12) : 0;

  const updateLine = (i, key, val) => setF({ ...f, lines: f.lines.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)) });

  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">{heading}</p>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Customer">
          <select className={inputCls} value={f.customerId} onChange={(e) => setF({ ...f, customerId: e.target.value })}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Income account">
          <select className={inputCls} value={f.incomeAccount} onChange={(e) => setF({ ...f, incomeAccount: e.target.value })}>
            {incomeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label={dateLabel}><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label={dueLabel}><input type="date" className={inputCls} value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
      </div>

      <div className="mt-3 space-y-2">
        {f.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6"><Field label="Description"><input className={inputCls} value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} /></Field></div>
            <div className="col-span-2"><Field label="Qty"><input type="number" className={inputCls} value={l.qty} onChange={(e) => updateLine(i, "qty", e.target.value)} /></Field></div>
            <div className="col-span-3"><Field label="Price"><input type="number" className={inputCls} value={l.price} onChange={(e) => updateLine(i, "price", e.target.value)} /></Field></div>
            <div className="col-span-1">
              {f.lines.length > 1 && <Button variant="ghost" className="!px-1.5" onClick={() => setF({ ...f, lines: f.lines.filter((_, idx) => idx !== i) })}><Trash2 size={14} /></Button>}
            </div>
          </div>
        ))}
        <Button onClick={() => setF({ ...f, lines: [...f.lines, { description: "", qty: 1, price: "" }] })}><Plus size={13} /> Add line</Button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input type="checkbox" id="tax-inv" checked={f.taxable} onChange={(e) => setF({ ...f, taxable: e.target.checked })} />
        <label htmlFor="tax-inv" className="text-sm text-slate-600">Apply 12% tax</label>
      </div>

      <div className="mt-3 text-sm text-right space-y-0.5">
        <p>Subtotal: <span className="font-mono">{subtotal.toFixed(2)}</span></p>
        {f.taxable && <p>Tax (12%): <span className="font-mono">{tax.toFixed(2)}</span></p>}
        <p className="font-medium">Total: <span className="font-mono">{(subtotal + tax).toFixed(2)}</span></p>
      </div>

      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => onSave(f)}>{saveLabel}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

function NewRecurringInvoiceForm({ customers, incomeAccounts, onSave, onCancel }) {
  const [f, setF] = useState({
    customerId: customers[0]?.id || "", description: "", incomeAccount: incomeAccounts[0]?.id || "",
    taxable: false, frequency: "monthly", nextDate: todayISO(), dueDays: 30,
    lines: [{ description: "", qty: 1, price: "" }],
  });
  const subtotal = f.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
  const tax = f.taxable ? round2(subtotal * 0.12) : 0;
  const updateLine = (i, key, val) => setF({ ...f, lines: f.lines.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)) });

  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">New recurring invoice</p>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Customer">
          <select className={inputCls} value={f.customerId} onChange={(e) => setF({ ...f, customerId: e.target.value })}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Income account">
          <select className={inputCls} value={f.incomeAccount} onChange={(e) => setF({ ...f, incomeAccount: e.target.value })}>
            {incomeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Frequency">
          <select className={inputCls} value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </Field>
        <Field label="First invoice date"><input type="date" className={inputCls} value={f.nextDate} onChange={(e) => setF({ ...f, nextDate: e.target.value })} /></Field>
      </div>
      <div className="mt-3 space-y-2">
        {f.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6"><Field label="Description"><input className={inputCls} value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} /></Field></div>
            <div className="col-span-2"><Field label="Qty"><input type="number" className={inputCls} value={l.qty} onChange={(e) => updateLine(i, "qty", e.target.value)} /></Field></div>
            <div className="col-span-3"><Field label="Price"><input type="number" className={inputCls} value={l.price} onChange={(e) => updateLine(i, "price", e.target.value)} /></Field></div>
            <div className="col-span-1">
              {f.lines.length > 1 && <Button variant="ghost" className="!px-1.5" onClick={() => setF({ ...f, lines: f.lines.filter((_, idx) => idx !== i) })}><Trash2 size={14} /></Button>}
            </div>
          </div>
        ))}
        <Button onClick={() => setF({ ...f, lines: [...f.lines, { description: "", qty: 1, price: "" }] })}><Plus size={13} /> Add line</Button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input type="checkbox" id="tax-rec" checked={f.taxable} onChange={(e) => setF({ ...f, taxable: e.target.checked })} />
        <label htmlFor="tax-rec" className="text-sm text-slate-600">Apply 12% tax</label>
      </div>
      <div className="mt-3 text-sm text-right space-y-0.5">
        <p>Amount per invoice: <span className="font-mono">{(subtotal + tax).toFixed(2)}</span></p>
      </div>
      <p className="text-xs text-slate-500 mt-2">Nothing is created automatically — use the "Generate now" button on each due invoice in the Recurring list, the same way you'd approve a scheduled invoice in real software before it goes out.</p>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => f.lines[0].description && onSave({ ...f, description: f.description || f.lines[0].description })}>Save recurring invoice</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

function PaymentModal({ title, max, currency, bankAccounts, onConfirm, onCancel }) {
  const [amt, setAmt] = useState(max);
  const [accountId, setAccountId] = useState(bankAccounts?.[0]?.id || "bank");
  const [err, setErr] = useState("");
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onCancel}>
      <Card className="p-4 w-80" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium mb-1">{title}</p>
        <p className="text-xs text-slate-500 mb-3">Outstanding balance: {fmt(max, currency)}</p>
        {bankAccounts && bankAccounts.length > 1 && (
          <Field label="Account">
            <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Amount">
          <input type="number" className={inputCls} value={amt} onChange={(e) => { setAmt(e.target.value); setErr(""); }} />
        </Field>
        {err && <p className="text-xs text-rose-600 mt-1">{err}</p>}
        <div className="flex gap-2 mt-3">
          <Button variant="primary" onClick={() => {
            const n = Number(amt);
            if (!n || n <= 0) { setErr("Enter an amount greater than zero."); return; }
            if (n > max + 0.001) { setErr(`Payment exceeds outstanding balance of ${fmt(max, currency)}.`); return; }
            onConfirm(n, accountId);
          }}>Confirm</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}

function CreditNoteModal({ title, max, currency, onConfirm, onCancel }) {
  const [amt, setAmt] = useState(max);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onCancel}>
      <Card className="p-4 w-80" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium mb-1">{title}</p>
        <p className="text-xs text-slate-500 mb-3">Reduces the outstanding balance without moving cash. Maximum: {fmt(max, currency)}</p>
        <Field label="Amount">
          <input type="number" className={inputCls} value={amt} onChange={(e) => { setAmt(e.target.value); setErr(""); }} />
        </Field>
        <Field label="Reason (optional)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. billing dispute, goodwill discount" /></Field>
        {err && <p className="text-xs text-rose-600 mt-1">{err}</p>}
        <div className="flex gap-2 mt-3">
          <Button variant="primary" onClick={() => {
            const n = Number(amt);
            if (!n || n <= 0) { setErr("Enter an amount greater than zero."); return; }
            if (n > max + 0.001) { setErr(`Cannot exceed the outstanding balance of ${fmt(max, currency)}.`); return; }
            onConfirm(n, reason);
          }}>Issue credit</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}

/* ============================== EXPENSES ============================== */

function Expenses({ data, setData, post }) {
  const { vendors, bills, accounts, company, recurringBills = [] } = data;
  const bankAccounts = accounts.filter((a) => a.isBank && !a.archived);
  const [tab, setTab] = useState("bills");
  const [showNewBill, setShowNewBill] = useState(false);
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showNewRecurring, setShowNewRecurring] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [creditModal, setCreditModal] = useState(null);

  const expenseAccounts = accounts.filter((a) => a.type === "expense" && !a.archived);

  const addVendor = (v) => setData((prev) => ({ ...prev, vendors: [...prev.vendors, { id: uid("vend"), ...v }] }));

  const postBillFromForm = (form) => {
    const taxAmt = form.taxable ? round2(Number(form.amount) * 0.12) : 0;
    const total = round2(Number(form.amount) + taxAmt);
    if (!total) return { error: "Enter an amount." };
    const number = `BILL-${2000 + bills.length + 1}`;
    const result = post({
      date: form.date, reference: number,
      description: `Bill ${number} from ${vendors.find((v) => v.id === form.vendorId)?.name}`,
      note: taxAmt
        ? "Expense increased for the pre-tax amount, so the expense account is debited. Input Tax Credit (an asset — tax paid that can be reclaimed) is also debited. Accounts Payable increased for the total owed, so it is credited."
        : "Expense increased, so the expense account is debited. Accounts Payable increased because we owe the vendor, so AP is credited.",
      lines: [
        { accountId: form.expenseAccount, debit: Number(form.amount), credit: 0 },
        ...(taxAmt ? [{ accountId: "input-tax-credit", debit: taxAmt, credit: 0 }] : []),
        { accountId: "ap", debit: 0, credit: total },
      ],
    });
    if (!result.ok) return { error: result.error };
    return { bill: { vendorId: form.vendorId, date: form.date, dueDate: form.dueDate, expenseAccount: form.expenseAccount, amount: form.amount, taxable: form.taxable, id: uid("bill"), number, total, amountPaid: 0, creditedAmount: 0, status: "open" } };
  };

  const createBill = (form) => {
    const r = postBillFromForm(form);
    if (r.error) { alert(r.error); return; }
    setData((prev) => ({ ...prev, bills: [...prev.bills, r.bill] }));
    setShowNewBill(false);
  };

  const payBill = (billId, amount, accountId) => {
    const bill = bills.find((b) => b.id === billId);
    const remaining = round2(bill.total - bill.amountPaid - (bill.creditedAmount || 0));
    if (amount > remaining + 0.001) { alert(`Payment exceeds outstanding balance of ${fmt(remaining, company.currency)}.`); return; }
    const acctName = accounts.find((a) => a.id === accountId)?.name || "Bank";
    const result = post({
      date: todayISO(), reference: bill.number, description: `Payment sent for ${bill.number}`,
      note: `Accounts Payable decreased because we paid the vendor, so AP is debited. ${acctName} decreased, so it is credited.`,
      lines: [{ accountId: "ap", debit: amount, credit: 0 }, { accountId, debit: 0, credit: amount }],
    });
    if (!result.ok) { alert(result.error); return; }
    setData((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => {
        if (b.id !== billId) return b;
        const paid = round2(b.amountPaid + amount);
        return { ...b, amountPaid: paid, status: paid + (b.creditedAmount || 0) >= b.total ? "paid" : "partial" };
      }),
    }));
    setPayModal(null);
  };

  const recordVendorCredit = (billId, amount, reason) => {
    const bill = bills.find((b) => b.id === billId);
    const subtotalPortion = bill.taxable ? round2(amount / 1.12) : amount;
    const taxPortion = round2(amount - subtotalPortion);
    const result = post({
      date: todayISO(), reference: bill.number, description: `Vendor credit for ${bill.number}${reason ? ` — ${reason}` : ""}`,
      note: taxPortion
        ? "Accounts Payable decreased because the vendor reduced what we owe, so AP is debited. The expense account and Input Tax Credit are both credited to reverse the original charge proportionally."
        : "Accounts Payable decreased because the vendor reduced what we owe, so AP is debited. The expense account is credited to reverse the original charge.",
      lines: [
        { accountId: "ap", debit: amount, credit: 0 },
        { accountId: bill.expenseAccount, debit: 0, credit: subtotalPortion },
        ...(taxPortion ? [{ accountId: "input-tax-credit", debit: 0, credit: taxPortion }] : []),
      ],
    });
    if (!result.ok) { alert(result.error); return; }
    setData((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => {
        if (b.id !== billId) return b;
        const credited = round2((b.creditedAmount || 0) + amount);
        return { ...b, creditedAmount: credited, status: b.amountPaid + credited >= b.total ? "void" : b.status };
      }),
    }));
    setCreditModal(null);
  };

  const recordQuickExpense = (form) => {
    const acctName = accounts.find((a) => a.id === form.bankAccount)?.name || "Bank";
    const result = post({
      date: form.date, reference: "", description: `Expense: ${form.description}`,
      note: `Expense increased, so ${accounts.find((a) => a.id === form.account)?.name} is debited. ${acctName} decreased because we paid cash, so it is credited.`,
      lines: [{ accountId: form.account, debit: Number(form.amount), credit: 0 }, { accountId: form.bankAccount, debit: 0, credit: Number(form.amount) }],
    });
    if (!result.ok) { alert(result.error); return; }
    setShowQuickExpense(false);
  };

  const addRecurringBill = (form) => {
    setData((prev) => ({ ...prev, recurringBills: [...(prev.recurringBills || []), { ...form, id: uid("recb"), active: true }] }));
    setShowNewRecurring(false);
  };

  const generateRecurringBillNow = (recId) => {
    const rec = recurringBills.find((r) => r.id === recId);
    const dueDate = (() => { const d = new Date(rec.nextDate); d.setDate(d.getDate() + (Number(rec.dueDays) || 15)); return d.toISOString().slice(0, 10); })();
    const r = postBillFromForm({ vendorId: rec.vendorId, date: rec.nextDate, dueDate, expenseAccount: rec.expenseAccount, amount: rec.amount, taxable: rec.taxable });
    if (r.error) { alert(r.error); return; }
    const advance = (dateStr, freq) => {
      const d = new Date(dateStr);
      if (freq === "weekly") d.setDate(d.getDate() + 7);
      else if (freq === "biweekly") d.setDate(d.getDate() + 14);
      else d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    };
    setData((prev) => ({
      ...prev,
      bills: [...prev.bills, r.bill],
      recurringBills: prev.recurringBills.map((rr) => (rr.id === recId ? { ...rr, nextDate: advance(rr.nextDate, rr.frequency) } : rr)),
    }));
  };

  const toggleRecurringBill = (recId) => setData((prev) => ({ ...prev, recurringBills: prev.recurringBills.map((r) => (r.id === recId ? { ...r, active: !r.active } : r)) }));
  const deleteRecurringBill = (recId) => setData((prev) => ({ ...prev, recurringBills: prev.recurringBills.filter((r) => r.id !== recId) }));

  return (
    <div>
      <SectionHeader
        title="Expenses"
        subtitle="Vendors, bills, and payables"
        action={
          <div className="flex gap-2">
            {tab === "bills" && (
              <ExportButton
                filename="bills"
                rows={bills}
                columns={[
                  { label: "Number", key: "number" }, { label: "Vendor", value: (b) => vendors.find((v) => v.id === b.vendorId)?.name },
                  { label: "Account", value: (b) => accounts.find((a) => a.id === b.expenseAccount)?.name },
                  { label: "Date", key: "date" }, { label: "Due date", key: "dueDate" },
                  { label: "Total", key: "total" }, { label: "Paid", key: "amountPaid" }, { label: "Credited", value: (b) => b.creditedAmount || 0 }, { label: "Status", key: "status" },
                ]}
              />
            )}
            <Button onClick={() => setShowNewVendor(true)}><Plus size={14} /> Vendor</Button>
            <Button onClick={() => setShowQuickExpense(true)}><Plus size={14} /> Cash expense</Button>
            {tab === "recurring" ? (
              <Button variant="primary" onClick={() => setShowNewRecurring(true)}><Plus size={14} /> Recurring bill</Button>
            ) : (
              <Button variant="primary" onClick={() => setShowNewBill(true)}><Plus size={14} /> Bill</Button>
            )}
          </div>
        }
      />
      <div className="flex gap-4 border-b border-slate-200 mb-4 text-sm">
        {[["bills", "Bills"], ["recurring", "Recurring"], ["vendors", "Vendors"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pb-2 -mb-px ${tab === id ? "border-b-2 border-teal-700 text-teal-800 font-medium" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>

      {showNewVendor && <NewVendorForm onSave={(v) => { addVendor(v); setShowNewVendor(false); }} onCancel={() => setShowNewVendor(false)} />}
      {showQuickExpense && <QuickExpenseForm accounts={expenseAccounts} bankAccounts={bankAccounts} onSave={recordQuickExpense} onCancel={() => setShowQuickExpense(false)} />}
      {showNewBill && <NewBillForm vendors={vendors} accounts={expenseAccounts} onSave={createBill} onCancel={() => setShowNewBill(false)} />}
      {showNewRecurring && <NewRecurringBillForm vendors={vendors} accounts={expenseAccounts} onSave={addRecurringBill} onCancel={() => setShowNewRecurring(false)} />}

      {tab === "bills" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Number</Th><Th>Vendor</Th><Th>Account</Th><Th>Due</Th><Th right>Total</Th><Th right>Balance</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {bills.map((b) => {
                const balance = round2(b.total - b.amountPaid - (b.creditedAmount || 0));
                const overdue = balance > 0 && daysBetween(b.dueDate, todayISO()) > 0;
                return (
                  <tr key={b.id} className="border-t border-slate-100">
                    <Td>{b.number}</Td>
                    <Td>{vendors.find((v) => v.id === b.vendorId)?.name}</Td>
                    <Td>{accounts.find((a) => a.id === b.expenseAccount)?.name}</Td>
                    <Td>{b.dueDate}</Td>
                    <Td right mono>{fmt(b.total, company.currency)}</Td>
                    <Td right mono>{fmt(balance, company.currency)}</Td>
                    <Td><Pill tone={b.status === "paid" || b.status === "void" ? "teal" : overdue ? "red" : b.status === "partial" ? "amber" : "slate"}>{overdue ? "overdue" : b.status === "void" ? "fully credited" : b.status}</Pill></Td>
                    <Td>
                      <div className="flex gap-1">
                        {balance > 0.001 && <Button variant="ghost" onClick={() => setPayModal(b.id)}>Pay bill</Button>}
                        {balance > 0.001 && <Button variant="ghost" onClick={() => setCreditModal(b.id)}>Vendor credit</Button>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {bills.length === 0 && <tr><Td>No bills yet.</Td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "recurring" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Vendor</Th><Th>Account</Th><Th right>Amount</Th><Th>Frequency</Th><Th>Next date</Th><Th>Active</Th><Th></Th></tr></thead>
            <tbody>
              {recurringBills.map((r) => {
                const total = round2(Number(r.amount) * (r.taxable ? 1.12 : 1));
                const due = r.nextDate <= todayISO();
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <Td>{vendors.find((v) => v.id === r.vendorId)?.name}</Td>
                    <Td>{accounts.find((a) => a.id === r.expenseAccount)?.name}</Td>
                    <Td right mono>{fmt(total, company.currency)}</Td>
                    <Td className="capitalize">{r.frequency}</Td>
                    <Td>{r.nextDate} {due && <Pill tone="amber">due</Pill>}</Td>
                    <Td><input type="checkbox" checked={r.active} onChange={() => toggleRecurringBill(r.id)} /></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="primary" onClick={() => generateRecurringBillNow(r.id)}>Generate now</Button>
                        <Button variant="ghost" onClick={() => deleteRecurringBill(r.id)}><Trash2 size={13} /></Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {recurringBills.length === 0 && <tr><Td>No recurring bills set up — good for fixed monthly costs like rent or software subscriptions.</Td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "vendors" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><Th>Name</Th><Th>Email</Th><Th right>Total billed</Th><Th right>Outstanding</Th></tr></thead>
            <tbody>
              {vendors.map((v) => {
                const vBills = bills.filter((b) => b.vendorId === v.id);
                const totalBilled = vBills.reduce((s, b) => s + b.total, 0);
                const outstanding = vBills.reduce((s, b) => s + (b.total - b.amountPaid - (b.creditedAmount || 0)), 0);
                return (
                  <tr key={v.id} className="border-t border-slate-100">
                    <Td>{v.name}</Td><Td>{v.email}</Td>
                    <Td right mono>{fmt(totalBilled, company.currency)}</Td>
                    <Td right mono>{fmt(outstanding, company.currency)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {payModal && (
        <PaymentModal
          title="Pay bill"
          max={round2(bills.find((b) => b.id === payModal).total - bills.find((b) => b.id === payModal).amountPaid - (bills.find((b) => b.id === payModal).creditedAmount || 0))}
          currency={company.currency}
          bankAccounts={bankAccounts}
          onConfirm={(amt, accountId) => payBill(payModal, amt, accountId)}
          onCancel={() => setPayModal(null)}
        />
      )}

      {creditModal && (
        <CreditNoteModal
          title="Record vendor credit"
          max={round2(bills.find((b) => b.id === creditModal).total - bills.find((b) => b.id === creditModal).amountPaid - (bills.find((b) => b.id === creditModal).creditedAmount || 0))}
          currency={company.currency}
          onConfirm={(amt, reason) => recordVendorCredit(creditModal, amt, reason)}
          onCancel={() => setCreditModal(null)}
        />
      )}
    </div>
  );
}

function NewVendorForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "" });
  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">New vendor</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email"><input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => f.name && onSave(f)}>Save vendor</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

function QuickExpenseForm({ accounts, bankAccounts, onSave, onCancel }) {
  const [f, setF] = useState({ date: todayISO(), description: "", account: accounts[0]?.id || "", amount: "", bankAccount: bankAccounts?.[0]?.id || "bank" });
  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">Record cash expense (paid directly from bank)</p>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Description"><input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Category">
          <select className={inputCls} value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Amount"><input type="number" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        {bankAccounts && bankAccounts.length > 1 && (
          <Field label="Paid from">
            <select className={inputCls} value={f.bankAccount} onChange={(e) => setF({ ...f, bankAccount: e.target.value })}>
              {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => f.description && f.amount && onSave(f)}>Save expense</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

function NewRecurringBillForm({ vendors, accounts, onSave, onCancel }) {
  const [f, setF] = useState({ vendorId: vendors[0]?.id || "", expenseAccount: accounts[0]?.id || "", amount: "", taxable: false, frequency: "monthly", nextDate: todayISO(), dueDays: 15 });
  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">New recurring bill</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Vendor">
          <select className={inputCls} value={f.vendorId} onChange={(e) => setF({ ...f, vendorId: e.target.value })}>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Expense account">
          <select className={inputCls} value={f.expenseAccount} onChange={(e) => setF({ ...f, expenseAccount: e.target.value })}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Amount"><input type="number" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Frequency">
          <select className={inputCls} value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </Field>
        <Field label="First bill date"><input type="date" className={inputCls} value={f.nextDate} onChange={(e) => setF({ ...f, nextDate: e.target.value })} /></Field>
        <div className="flex items-end gap-2 pb-1.5">
          <input type="checkbox" id="tax-recbill" checked={f.taxable} onChange={(e) => setF({ ...f, taxable: e.target.checked })} />
          <label htmlFor="tax-recbill" className="text-sm text-slate-600">Apply 12% tax</label>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">Use "Generate now" on the Recurring list when each one is due — nothing posts automatically.</p>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => f.amount && onSave(f)}>Save recurring bill</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

function NewBillForm({ vendors, accounts, onSave, onCancel }) {
  const [f, setF] = useState({ vendorId: vendors[0]?.id || "", date: todayISO(), dueDate: todayISO(), expenseAccount: accounts[0]?.id || "", amount: "", taxable: false });
  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-medium mb-3">New bill</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Vendor">
          <select className={inputCls} value={f.vendorId} onChange={(e) => setF({ ...f, vendorId: e.target.value })}>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Expense account">
          <select className={inputCls} value={f.expenseAccount} onChange={(e) => setF({ ...f, expenseAccount: e.target.value })}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Amount"><input type="number" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Bill date"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Due date"><input type="date" className={inputCls} value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
        <div className="flex items-end gap-2 pb-1.5">
          <input type="checkbox" id="tax-bill" checked={f.taxable} onChange={(e) => setF({ ...f, taxable: e.target.checked })} />
          <label htmlFor="tax-bill" className="text-sm text-slate-600">Apply 12% tax</label>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={() => f.amount && onSave(f)}>Save bill</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

/* ============================== ACCOUNTING ============================== */

/* ============================== PAYROLL ============================== */

function Payroll({ data, setData, post }) {
  const { employees = [], payrollRuns = [], accounts, company, journal } = data;
  const bankAccounts = accounts.filter((a) => a.isBank && !a.archived);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", grossPay: "", withholdingRate: 15 });
  const [runDate, setRunDate] = useState(todayISO());
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]?.id || "bank");
  const [remitAmt, setRemitAmt] = useState("");

  const addEmployee = () => {
    if (!empForm.name || !empForm.grossPay) return;
    setData((prev) => ({
      ...prev,
      employees: [...(prev.employees || []), { id: uid("emp"), name: empForm.name, grossPay: Number(empForm.grossPay), withholdingRate: Number(empForm.withholdingRate), active: true }],
    }));
    setEmpForm({ name: "", grossPay: "", withholdingRate: 15 });
    setShowAddEmployee(false);
  };

  const toggleEmployee = (id) => setData((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === id ? { ...e, active: !e.active } : e)) }));

  const runPayroll = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    const gross = emp.grossPay;
    const withholding = round2(gross * emp.withholdingRate / 100);
    const net = round2(gross - withholding);
    const acctName = accounts.find((a) => a.id === selectedBank)?.name || "Bank";
    const result = post({
      date: runDate, reference: "", description: `Payroll — ${emp.name}`,
      note: `Wage expense increased for the gross pay, so it is debited. Payroll Tax Payable increased for the amount withheld, so it is credited. ${acctName} decreased for the net pay actually sent, so it is credited.`,
      lines: [
        { accountId: "wages", debit: gross, credit: 0 },
        { accountId: "payroll-liab", debit: 0, credit: withholding },
        { accountId: selectedBank, debit: 0, credit: net },
      ],
    });
    if (!result.ok) { alert(result.error); return; }
    setData((prev) => ({ ...prev, payrollRuns: [...(prev.payrollRuns || []), { id: uid("pr"), employeeId: empId, date: runDate, gross, withholding, net }] }));
  };

  const payrollTaxBalance = accountBalance(accounts, journal, "payroll-liab");

  const remitTaxes = () => {
    const n = Number(remitAmt);
    if (!n || n <= 0) { alert("Enter an amount greater than zero."); return; }
    if (n > payrollTaxBalance + 0.001) { alert(`Cannot exceed the payroll tax balance of ${fmt(payrollTaxBalance, company.currency)}.`); return; }
    const acctName = accounts.find((a) => a.id === selectedBank)?.name || "Bank";
    const result = post({
      date: todayISO(), reference: "", description: "Remit withheld payroll taxes",
      note: `Payroll Tax Payable decreased because the withheld taxes were paid to the tax authority, so it is debited. ${acctName} decreased, so it is credited.`,
      lines: [{ accountId: "payroll-liab", debit: n, credit: 0 }, { accountId: selectedBank, debit: 0, credit: n }],
    });
    if (!result.ok) { alert(result.error); return; }
    setRemitAmt("");
  };

  return (
    <div>
      <SectionHeader
        title="Payroll"
        subtitle="Employees and payroll runs"
        action={<Button variant="primary" onClick={() => setShowAddEmployee(!showAddEmployee)}><Plus size={14} /> Add employee</Button>}
      />

      <Card className="p-3 mb-4 bg-slate-50 border-slate-200">
        <p className="text-xs text-slate-600">
          This models the bookkeeping mechanics of a payroll run — gross pay, a single withholding rate, and net pay — so you can practice the
          debit/credit pattern. It is not real payroll software: it doesn't use actual tax tables, doesn't split employer-side payroll taxes out
          separately, and isn't a substitute for a compliant payroll system or professional advice for a real business.
        </p>
      </Card>

      {showAddEmployee && (
        <Card className="p-4 mb-4">
          <p className="text-sm font-medium mb-2">New employee</p>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Name"><input className={inputCls} value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} /></Field>
            <Field label="Gross pay per run"><input type="number" className={inputCls} value={empForm.grossPay} onChange={(e) => setEmpForm({ ...empForm, grossPay: e.target.value })} /></Field>
            <Field label="Withholding rate %"><input type="number" className={inputCls} value={empForm.withholdingRate} onChange={(e) => setEmpForm({ ...empForm, withholdingRate: e.target.value })} /></Field>
            <div className="flex items-end"><Button variant="primary" onClick={addEmployee}>Save</Button></div>
          </div>
        </Card>
      )}

      <div className="flex items-end gap-3 mb-4">
        <Field label="Pay date"><input type="date" className={inputCls} value={runDate} onChange={(e) => setRunDate(e.target.value)} /></Field>
        {bankAccounts.length > 1 && (
          <Field label="Pay from account">
            <select className={inputCls} value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
              {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
      </div>

      <Card className="p-0 overflow-hidden mb-4">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Name</Th><Th right>Gross pay</Th><Th right>Withholding %</Th><Th>Active</Th><Th></Th></tr></thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100">
                <Td>{emp.name}</Td>
                <Td right mono>{fmt(emp.grossPay, company.currency)}</Td>
                <Td right mono>{emp.withholdingRate}%</Td>
                <Td><input type="checkbox" checked={emp.active} onChange={() => toggleEmployee(emp.id)} /></Td>
                <Td>{emp.active && <Button variant="primary" onClick={() => runPayroll(emp.id)}>Run payroll</Button>}</Td>
              </tr>
            ))}
            {employees.length === 0 && <tr><Td>No employees yet — add one to practice running payroll.</Td></tr>}
          </tbody>
        </table>
      </Card>

      <Card className="p-4 mb-4">
        <p className="text-sm font-medium mb-1">Remit withheld payroll taxes</p>
        <p className="text-xs text-slate-500 mb-2">Current balance owed to the tax authority: {fmt(payrollTaxBalance, company.currency)}</p>
        <div className="flex items-end gap-2">
          <Field label="Amount"><input type="number" className={inputCls} value={remitAmt} onChange={(e) => setRemitAmt(e.target.value)} /></Field>
          <Button variant="primary" onClick={remitTaxes} disabled={payrollTaxBalance <= 0}>Remit payment</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Date</Th><Th>Employee</Th><Th right>Gross</Th><Th right>Withheld</Th><Th right>Net pay</Th></tr></thead>
          <tbody>
            {[...payrollRuns].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <Td>{r.date}</Td>
                <Td>{employees.find((e) => e.id === r.employeeId)?.name}</Td>
                <Td right mono>{fmt(r.gross, company.currency)}</Td>
                <Td right mono>{fmt(r.withholding, company.currency)}</Td>
                <Td right mono>{fmt(r.net, company.currency)}</Td>
              </tr>
            ))}
            {payrollRuns.length === 0 && <tr><Td>No payroll runs yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Accounting({ data, setData, post }) {
  const [tab, setTab] = useState("coa");
  return (
    <div>
      <SectionHeader title="Accounting" subtitle="Chart of accounts, journal entries, and reconciliation" />
      <div className="flex gap-4 border-b border-slate-200 mb-4 text-sm">
        {[["coa", "Chart of accounts"], ["journal", "Journal entries"], ["recon", "Bank reconciliation"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pb-2 -mb-px ${tab === id ? "border-b-2 border-teal-700 text-teal-800 font-medium" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>
      {tab === "coa" && <ChartOfAccounts data={data} setData={setData} />}
      {tab === "journal" && <JournalEntries data={data} post={post} />}
      {tab === "recon" && <Reconciliation data={data} setData={setData} />}
    </div>
  );
}

function ChartOfAccounts({ data, setData }) {
  const { accounts, journal } = data;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ code: "", name: "", type: "expense" });

  const addAccount = () => {
    if (!f.name || !f.code) return;
    setData((prev) => ({ ...prev, accounts: [...prev.accounts, { id: uid("acct"), code: f.code, name: f.name, type: f.type, archived: false }] }));
    setF({ code: "", name: "", type: "expense" });
    setShowAdd(false);
  };

  const toggleArchive = (id) => setData((prev) => ({ ...prev, accounts: prev.accounts.map((a) => (a.id === id ? { ...a, archived: !a.archived } : a)) }));

  const filtered = accounts.filter((a) => (filter === "all" || a.type === filter) && a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input className={inputCls + " max-w-xs"} placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={inputCls + " max-w-[160px]"} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex-1" />
        <ExportButton
          filename="chart-of-accounts"
          rows={filtered}
          columns={[
            { label: "Code", key: "code" }, { label: "Name", key: "name" }, { label: "Type", value: (a) => ACCOUNT_TYPES[a.type].label },
            { label: "Balance", value: (a) => accountBalance(accounts, journal, a.id) }, { label: "Archived", value: (a) => (a.archived ? "yes" : "no") },
          ]}
        />
        <Button variant="primary" onClick={() => setShowAdd(!showAdd)}><Plus size={14} /> Add account</Button>
      </div>
      {showAdd && (
        <Card className="p-4 mb-3">
          <div className="grid grid-cols-4 gap-3">
            <Field label="Code"><input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
            <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Type">
              <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <div className="flex items-end"><Button variant="primary" onClick={addAccount}>Save</Button></div>
          </div>
        </Card>
      )}
      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Code</Th><Th>Name</Th><Th>Type</Th><Th right>Balance</Th><Th></Th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className={`border-t border-slate-100 ${a.archived ? "opacity-40" : ""}`}>
                <Td mono>{a.code}</Td>
                <Td>{a.name}</Td>
                <Td>{ACCOUNT_TYPES[a.type].label}</Td>
                <Td right mono>{fmt(accountBalance(accounts, journal, a.id), data.company.currency)}</Td>
                <Td><Button variant="ghost" onClick={() => toggleArchive(a.id)}>{a.archived ? "Unarchive" : "Archive"}</Button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function JournalEntries({ data, post }) {
  const { journal, accounts, company } = data;
  const [showNew, setShowNew] = useState(false);
  const [lines, setLines] = useState([{ accountId: accounts[0].id, debit: "", credit: "" }, { accountId: accounts[0].id, debit: "", credit: "" }]);
  const [meta, setMeta] = useState({ date: todayISO(), description: "", reference: "" });
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState(null);

  const totalDebit = round2(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
  const totalCredit = round2(lines.reduce((s, l) => s + (Number(l.credit) || 0), 0));

  const submit = () => {
    const result = post({ date: meta.date, description: meta.description || "Manual journal entry", reference: meta.reference, lines });
    if (!result.ok) { setErr(result.error); return; }
    setShowNew(false);
    setLines([{ accountId: accounts[0].id, debit: "", credit: "" }, { accountId: accounts[0].id, debit: "", credit: "" }]);
    setMeta({ date: todayISO(), description: "", reference: "" });
    setErr("");
  };

  const sorted = [...journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="flex justify-end mb-3"><Button variant="primary" onClick={() => setShowNew(!showNew)}><Plus size={14} /> New journal entry</Button></div>
      {showNew && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="Date"><input type="date" className={inputCls} value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} /></Field>
            <Field label="Description"><input className={inputCls} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></Field>
            <Field label="Reference"><input className={inputCls} value={meta.reference} onChange={(e) => setMeta({ ...meta, reference: e.target.value })} /></Field>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Field label="Account">
                    <select className={inputCls} value={l.accountId} onChange={(e) => setLines(lines.map((x, idx) => (idx === i ? { ...x, accountId: e.target.value } : x)))}>
                      {accounts.filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="col-span-2"><Field label="Debit"><input type="number" className={inputCls} value={l.debit} onChange={(e) => setLines(lines.map((x, idx) => (idx === i ? { ...x, debit: e.target.value, credit: "" } : x)))} /></Field></div>
                <div className="col-span-2"><Field label="Credit"><input type="number" className={inputCls} value={l.credit} onChange={(e) => setLines(lines.map((x, idx) => (idx === i ? { ...x, credit: e.target.value, debit: "" } : x)))} /></Field></div>
                <div className="col-span-1">
                  {lines.length > 2 && <Button variant="ghost" className="!px-1.5" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}><Trash2 size={14} /></Button>}
                </div>
              </div>
            ))}
            <Button onClick={() => setLines([...lines, { accountId: accounts[0].id, debit: "", credit: "" }])}><Plus size={13} /> Add line</Button>
          </div>
          <div className="flex justify-between items-center mt-3 text-sm">
            <div className={`font-mono ${totalDebit === totalCredit ? "text-teal-700" : "text-rose-600"}`}>
              Debits {totalDebit.toFixed(2)} · Credits {totalCredit.toFixed(2)} {totalDebit === totalCredit ? "✓ Balanced" : "— not balanced"}
            </div>
          </div>
          {err && <p className="text-xs text-rose-600 mt-2 flex items-center gap-1"><AlertTriangle size={13} /> {err}</p>}
          <div className="flex gap-2 mt-3">
            <Button variant="primary" onClick={submit}>Post entry</Button>
            <Button onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Date</Th><Th>Reference</Th><Th>Description</Th><Th right>Total</Th><Th></Th></tr></thead>
          <tbody>
            {sorted.map((e) => (
              <React.Fragment key={e.id}>
                <tr className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                  <Td>{e.date}</Td><Td>{e.reference || "—"}</Td><Td>{e.description}</Td>
                  <Td right mono>{fmt(e.lines.reduce((s, l) => s + (l.debit || 0), 0), company.currency)}</Td>
                  <Td>{expanded === e.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</Td>
                </tr>
                {expanded === e.id && (
                  <tr className="bg-slate-50 border-t border-slate-100">
                    <td colSpan={5} className="px-3 py-3">
                      <table className="w-full text-sm">
                        <thead><tr><Th>Account</Th><Th right>Debit</Th><Th right>Credit</Th></tr></thead>
                        <tbody>
                          {e.lines.map((l, i) => (
                            <tr key={i}>
                              <Td>{accounts.find((a) => a.id === l.accountId)?.name}</Td>
                              <Td right mono>{l.debit ? fmt(l.debit, company.currency) : ""}</Td>
                              <Td right mono>{l.credit ? fmt(l.credit, company.currency) : ""}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <WhyBadge note={e.note} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Reconciliation({ data, setData }) {
  const { accounts, journal, company } = data;
  const bankAccounts = accounts.filter((a) => a.isBank && !a.archived);
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id || "bank");
  const [statementDate, setStatementDate] = useState(todayISO());
  const [statementBalance, setStatementBalance] = useState("");
  const [cleared, setCleared] = useState({});

  const activeAccountId = bankAccounts.find((a) => a.id === accountId) ? accountId : (bankAccounts[0]?.id || "bank");
  const rows = accountLedgerLines(accounts, journal, activeAccountId);
  const bookBalance = accountBalance(accounts, journal, activeAccountId);
  const clearedTotal = rows.reduce((s, r, i) => s + (cleared[i] ? (r.debit - r.credit) : 0), 0);
  const uncleared = rows.filter((_, i) => !cleared[i]);
  const diff = statementBalance !== "" ? round2(Number(statementBalance) - round2(clearedTotal)) : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-500">Account:</span>
        {bankAccounts.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAccountId(a.id); setCleared({}); setStatementBalance(""); }}
            className={`px-3 py-1.5 rounded-md text-sm border transition ${activeAccountId === a.id ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
          >
            {a.name}
          </button>
        ))}
      </div>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bank statement date"><input type="date" className={inputCls} value={statementDate} onChange={(e) => setStatementDate(e.target.value)} /></Field>
          <Field label="Statement ending balance"><input type="number" className={inputCls} value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} /></Field>
          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1">Book balance ({accounts.find((a) => a.id === activeAccountId)?.name})</span>
            <p className="font-mono text-sm py-1.5">{fmt(bookBalance, company.currency)}</p>
          </div>
        </div>
        {statementBalance !== "" && (
          <div className="mt-3 p-3 rounded-md" style={{ background: diff === 0 ? "#ECFDF5" : "#FFFBEB" }}>
            <p className={`text-sm font-medium ${diff === 0 ? "text-teal-800" : "text-amber-800"}`}>
              {diff === 0 ? "✓ RECONCILED — cleared transactions match the statement." : `Difference: ${fmt(Math.abs(diff), company.currency)}`}
            </p>
            {diff !== 0 && (
              <p className="text-xs text-amber-700 mt-1">
                Possible reasons: a missing or duplicate transaction, an incorrect amount, an outstanding check that hasn't cleared yet, an unrecorded bank fee, or a transaction categorized to the wrong account. Check each unchecked row below against your statement.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Cleared</Th><Th>Date</Th><Th>Description</Th><Th right>Amount</Th><Th right>Running balance</Th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <Td><input type="checkbox" checked={!!cleared[i]} onChange={(e) => setCleared({ ...cleared, [i]: e.target.checked })} /></Td>
                <Td>{r.date}</Td>
                <Td>{r.description}</Td>
                <Td right mono>{fmt(r.debit - r.credit, company.currency)}</Td>
                <Td right mono>{fmt(r.balance, company.currency)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-slate-500 mt-2">{uncleared.length} transaction{uncleared.length !== 1 ? "s" : ""} not yet marked cleared.</p>
    </div>
  );
}

/* ============================== REPORTS ============================== */

function Reports({ data }) {
  const [tab, setTab] = useState("pl");
  const { accounts, journal, company, invoices, bills } = data;

  const tabs = [
    ["pl", "Profit & Loss"], ["bs", "Balance Sheet"], ["tb", "Trial Balance"],
    ["gl", "General Ledger"], ["ar", "AR Aging"], ["ap", "AP Aging"],
  ];

  return (
    <div>
      <SectionHeader title="Reports" />
      <div className="flex gap-4 border-b border-slate-200 mb-4 text-sm flex-wrap">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pb-2 -mb-px ${tab === id ? "border-b-2 border-teal-700 text-teal-800 font-medium" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>
      {tab === "pl" && <ProfitLoss accounts={accounts} journal={journal} currency={company.currency} />}
      {tab === "bs" && <BalanceSheet accounts={accounts} journal={journal} currency={company.currency} />}
      {tab === "tb" && <TrialBalance accounts={accounts} journal={journal} currency={company.currency} />}
      {tab === "gl" && <GeneralLedger accounts={accounts} journal={journal} currency={company.currency} />}
      {tab === "ar" && <AgingReport rows={invoices} type="invoice" currency={company.currency} />}
      {tab === "ap" && <AgingReport rows={bills} type="bill" currency={company.currency} />}
    </div>
  );
}

function ProfitLoss({ accounts, journal, currency }) {
  const incomeAccts = accounts.filter((a) => a.type === "income" && !a.archived);
  const expenseAccts = accounts.filter((a) => a.type === "expense" && !a.archived);
  const totalIncome = incomeAccts.reduce((s, a) => s + accountBalance(accounts, journal, a.id), 0);
  const totalExpense = expenseAccts.reduce((s, a) => s + accountBalance(accounts, journal, a.id), 0);
  return (
    <Card className="p-5 max-w-2xl">
      <p className="text-sm font-medium text-slate-500 mb-2">Revenue</p>
      {incomeAccts.map((a) => (
        <div key={a.id} className="flex justify-between text-sm py-1"><span>{a.name}</span><span className="font-mono">{fmt(accountBalance(accounts, journal, a.id), currency)}</span></div>
      ))}
      <div className="flex justify-between text-sm font-medium border-t border-slate-200 mt-1 pt-1"><span>Total revenue</span><span className="font-mono">{fmt(totalIncome, currency)}</span></div>

      <p className="text-sm font-medium text-slate-500 mt-4 mb-2">Operating expenses</p>
      {expenseAccts.map((a) => (
        <div key={a.id} className="flex justify-between text-sm py-1"><span>{a.name}</span><span className="font-mono">{fmt(accountBalance(accounts, journal, a.id), currency)}</span></div>
      ))}
      <div className="flex justify-between text-sm font-medium border-t border-slate-200 mt-1 pt-1"><span>Total expenses</span><span className="font-mono">{fmt(totalExpense, currency)}</span></div>

      <div className="flex justify-between text-base font-semibold border-t-2 border-slate-800 mt-3 pt-2">
        <span>Net profit</span><span className="font-mono">{fmt(totalIncome - totalExpense, currency)}</span>
      </div>
    </Card>
  );
}

function BalanceSheet({ accounts, journal, currency }) {
  const groups = (type) => accounts.filter((a) => a.type === type && !a.archived);
  const totalAssets = sumByType(accounts, journal, "asset");
  const totalLiab = sumByType(accounts, journal, "liability");
  const totalEquity = sumByType(accounts, journal, "equity") + sumByType(accounts, journal, "income") - sumByType(accounts, journal, "expense");
  const balanced = Math.abs(round2(totalAssets - (totalLiab + totalEquity))) < 0.01;

  return (
    <Card className="p-5 max-w-2xl">
      <p className="text-sm font-medium text-slate-500 mb-2">Assets</p>
      {groups("asset").map((a) => (
        <div key={a.id} className="flex justify-between text-sm py-1"><span>{a.name}</span><span className="font-mono">{fmt(accountBalance(accounts, journal, a.id), currency)}</span></div>
      ))}
      <div className="flex justify-between text-sm font-medium border-t border-slate-200 mt-1 pt-1"><span>Total assets</span><span className="font-mono">{fmt(totalAssets, currency)}</span></div>

      <p className="text-sm font-medium text-slate-500 mt-4 mb-2">Liabilities</p>
      {groups("liability").map((a) => (
        <div key={a.id} className="flex justify-between text-sm py-1"><span>{a.name}</span><span className="font-mono">{fmt(accountBalance(accounts, journal, a.id), currency)}</span></div>
      ))}
      <div className="flex justify-between text-sm font-medium border-t border-slate-200 mt-1 pt-1"><span>Total liabilities</span><span className="font-mono">{fmt(totalLiab, currency)}</span></div>

      <p className="text-sm font-medium text-slate-500 mt-4 mb-2">Equity</p>
      {groups("equity").map((a) => (
        <div key={a.id} className="flex justify-between text-sm py-1"><span>{a.name}</span><span className="font-mono">{fmt(accountBalance(accounts, journal, a.id), currency)}</span></div>
      ))}
      <div className="flex justify-between text-sm py-1"><span>Net income (current)</span><span className="font-mono">{fmt(sumByType(accounts, journal, "income") - sumByType(accounts, journal, "expense"), currency)}</span></div>
      <div className="flex justify-between text-sm font-medium border-t border-slate-200 mt-1 pt-1"><span>Total equity</span><span className="font-mono">{fmt(totalEquity, currency)}</span></div>

      <div className={`mt-4 p-2 rounded-md text-sm font-medium ${balanced ? "bg-teal-50 text-teal-800" : "bg-rose-50 text-rose-800"}`}>
        {balanced ? "✓ Assets = Liabilities + Equity" : "⚠ Balance sheet does not balance — check for a data entry error."}
      </div>
    </Card>
  );
}

function TrialBalance({ accounts, journal, currency }) {
  const rows = accounts.filter((a) => !a.archived).map((a) => {
    const bal = accountBalance(accounts, journal, a.id);
    const normal = ACCOUNT_TYPES[a.type].normal;
    const debit = normal === "debit" ? Math.max(bal, 0) : Math.max(-bal, 0);
    const credit = normal === "credit" ? Math.max(bal, 0) : Math.max(-bal, 0);
    return { ...a, debit, credit };
  }).filter((r) => r.debit !== 0 || r.credit !== 0);
  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));
  return (
    <Card className="p-0 overflow-hidden max-w-2xl">
      <table className="w-full">
        <thead className="bg-slate-50"><tr><Th>Account</Th><Th right>Debit</Th><Th right>Credit</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <Td>{r.name}</Td>
              <Td right mono>{r.debit ? fmt(r.debit, currency) : ""}</Td>
              <Td right mono>{r.credit ? fmt(r.credit, currency) : ""}</Td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-800 font-medium">
            <Td>Total</Td><Td right mono>{fmt(totalDebit, currency)}</Td><Td right mono>{fmt(totalCredit, currency)}</Td>
          </tr>
        </tbody>
      </table>
      <p className={`text-xs px-3 py-2 ${totalDebit === totalCredit ? "text-teal-700" : "text-rose-600"}`}>
        {totalDebit === totalCredit ? "✓ Trial balance is in balance." : "⚠ Trial balance does not balance."}
      </p>
    </Card>
  );
}

function GeneralLedger({ accounts, journal, currency }) {
  const [accountId, setAccountId] = useState(accounts[0].id);
  const rows = accountLedgerLines(accounts, journal, accountId);
  return (
    <div>
      <div className="flex items-end gap-3 mb-3">
        <Field label="Account">
          <select className={inputCls + " max-w-xs"} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </select>
        </Field>
        <ExportButton
          filename={`ledger-${accounts.find((a) => a.id === accountId)?.name || "account"}`}
          rows={rows}
          columns={[{ label: "Date", key: "date" }, { label: "Description", key: "description" }, { label: "Reference", key: "reference" }, { label: "Debit", key: "debit" }, { label: "Credit", key: "credit" }, { label: "Balance", key: "balance" }]}
        />
      </div>
      <Card className="p-0 overflow-hidden max-w-2xl">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><Th>Date</Th><Th>Description</Th><Th right>Debit</Th><Th right>Credit</Th><Th right>Balance</Th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <Td>{r.date}</Td><Td>{r.description}</Td>
                <Td right mono>{r.debit ? fmt(r.debit, currency) : ""}</Td>
                <Td right mono>{r.credit ? fmt(r.credit, currency) : ""}</Td>
                <Td right mono>{fmt(r.balance, currency)}</Td>
              </tr>
            ))}
            {rows.length === 0 && <tr><Td>No activity yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function AgingReport({ rows, type, currency }) {
  const buckets = ["Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"];
  const bucketOf = (days) => days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
  const open = rows.filter((r) => round2(r.total - r.amountPaid - (r.creditedAmount || 0)) > 0.001);
  const totals = [0, 0, 0, 0, 0];
  const entries = open.map((r) => {
    const balance = round2(r.total - r.amountPaid - (r.creditedAmount || 0));
    const days = daysBetween(r.dueDate, todayISO());
    const b = bucketOf(days);
    totals[b] += balance;
    return { ...r, balance, bucket: b };
  });
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr><Th>{type === "invoice" ? "Invoice" : "Bill"}</Th><Th right>Balance</Th>{buckets.map((b) => <Th key={b} right>{b}</Th>)}</tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-slate-100">
              <Td>{e.number}</Td>
              <Td right mono>{fmt(e.balance, currency)}</Td>
              {buckets.map((_, i) => <Td key={i} right mono>{i === e.bucket ? fmt(e.balance, currency) : ""}</Td>)}
            </tr>
          ))}
          <tr className="border-t-2 border-slate-800 font-medium">
            <Td>Total</Td><Td right mono>{fmt(totals.reduce((s, t) => s + t, 0), currency)}</Td>
            {totals.map((t, i) => <Td key={i} right mono>{fmt(t, currency)}</Td>)}
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

/* ============================== LEARNING CENTER ============================== */

const LESSONS = [
  {
    id: "fundamentals", title: "1. Accounting fundamentals",
    body: "Bookkeeping tracks every transaction so a business always knows what it owns, what it owes, and how it's performing. The foundation is the accounting equation: Assets = Liabilities + Equity. Every transaction you record must keep this equation true.",
    quiz: { q: "If a business buys a $500 laptop with cash, what happens to the accounting equation?", options: ["Assets go up, then down by the same amount — total assets unchanged", "Assets increase and liabilities increase", "Equity decreases permanently"], correct: 0, explain: "Cash (an asset) decreases and Equipment (an asset) increases by the same amount. One asset converts into another, so total assets — and the equation — stay balanced." },
  },
  {
    id: "debits-credits", title: "2. Debits & credits",
    body: "Assets and expenses normally increase with a debit and decrease with a credit. Liabilities, equity, and income normally increase with a credit and decrease with a debit. Every transaction affects at least two accounts, and total debits must always equal total credits.",
    quiz: { q: "A customer pays an invoice by bank transfer. What's the entry?", options: ["Debit Bank, Credit Accounts Receivable", "Debit Accounts Receivable, Credit Bank", "Debit Income, Credit Bank"], correct: 0, explain: "Bank (an asset) increases, so it's debited. Accounts Receivable (an asset) decreases because the customer no longer owes the money, so it's credited." },
  },
  {
    id: "chart-of-accounts", title: "3. The Chart of Accounts",
    body: "The Chart of Accounts is the full list of every account a business uses to record transactions, grouped into five types: Assets, Liabilities, Equity, Income, and Expenses. A well-organized chart makes reports meaningful — every transaction should map to the account that best describes it, and account names should stay specific enough to be useful but general enough that they don't multiply endlessly (e.g. one 'Travel' account, not a new account per trip).",
    quiz: { q: "A business starts renting a second office. Should it create a new account like 'Rent — Second Office'?", options: ["Yes, always create a new account for every new cost", "No — use the existing Rent expense account; the invoicing or memo can note which office", "Only if the business is in Canada"], correct: 1, explain: "Over-splitting the chart of accounts makes reports harder to read without adding real insight. Keep the chart general (Rent) and use descriptions, classes, or locations for finer detail if the software supports it." },
  },
  {
    id: "invoices", title: "4. Invoices & accounts receivable",
    body: "An invoice records a sale before payment arrives. It increases Accounts Receivable and increases Income. When the customer pays, you move the amount out of Accounts Receivable and into Bank.",
    quiz: { q: "You send a $1,000 invoice for services. What's recorded immediately?", options: ["Debit Bank $1,000, Credit Income $1,000", "Debit Accounts Receivable $1,000, Credit Income $1,000", "Nothing — wait until payment arrives"], correct: 1, explain: "Revenue is recorded when it's earned, not when cash arrives (accrual basis). The customer now owes you, so Accounts Receivable is debited." },
  },
  {
    id: "bills", title: "5. Bills & vendor obligations",
    body: "A bill records a purchase from a vendor before you've paid it — the mirror image of an invoice. Entering the bill when you receive it (rather than waiting until payment) increases the correct expense account and increases Accounts Payable, so your books reflect what you owe even before cash leaves the bank.",
    quiz: { q: "You receive a $600 bill from your internet provider, due in 30 days. What happens when you enter it (before paying)?", options: ["Nothing — wait until it's paid", "Debit Internet Expense $600, Credit Accounts Payable $600", "Debit Accounts Payable $600, Credit Bank $600"], correct: 1, explain: "The expense is recorded when it's incurred, not when it's paid. Accounts Payable increases because the business now owes the vendor $600." },
  },
  {
    id: "expenses", title: "6. Recording expenses",
    body: "Not every expense goes through a bill — many are paid directly from the bank (a card swipe, an ATM withdrawal, an auto-debit). Those are recorded as a straight expense: debit the expense account, credit Bank. The important skill is choosing the right expense account so reports stay accurate — a software subscription, a client lunch, and a delivery fee all belong in different accounts even though they're all 'expenses.'",
    quiz: { q: "The owner buys a $40 client lunch on the business debit card. What's the best account?", options: ["Meals & Entertainment (or similar) expense", "Accounts Payable", "Owner's Equity"], correct: 0, explain: "Since it was paid directly from the bank, there's no vendor bill to track — it's a direct expense. It belongs in a Meals/Entertainment-type account, not lumped into something unrelated like Office Supplies." },
  },
  {
    id: "bank-feeds", title: "7. Bank feeds",
    body: "A bank feed is a running list of transactions pulled from the bank, waiting to be turned into proper bookkeeping entries. For each one you decide: accept the suggested category, change it, split it across more than one account, create a rule so future transactions like it categorize automatically, or exclude it (for things like internal transfers that shouldn't hit the P&L twice).",
    quiz: { q: "A $500 transfer from your business savings account to your business checking account shows up in the bank feed. What should you usually do?", options: ["Categorize it as Income", "Categorize it as an Expense", "Exclude it — it's an internal transfer between your own accounts, not income or an expense"], correct: 2, explain: "Moving money between your own accounts doesn't create income or an expense. Categorizing it as either would overstate your revenue or costs — it should be excluded or matched as a transfer instead." },
  },
  {
    id: "reconciliation", title: "8. Bank reconciliation",
    body: "Reconciliation confirms your books match the bank's records. You compare the bank statement's ending balance to your book balance, checking off transactions that have cleared. Any difference points to a missing transaction, a duplicate, an error, or something the bank hasn't processed yet.",
    quiz: { q: "Your book balance is $12,450 and the bank statement shows $12,325. What should you do first?", options: ["Assume the bank made an error and ignore it", "Look for uncleared or missing transactions that explain the $125 gap", "Adjust the book balance to match without investigating"], correct: 1, explain: "A reconciliation difference always has a cause — an outstanding check, a bank fee not yet recorded, a duplicate entry, or a wrong amount. Investigate before adjusting anything." },
  },
  {
    id: "accounts-receivable", title: "9. Managing accounts receivable",
    body: "Accounts Receivable is everything customers currently owe the business. Managing it well means tracking due dates and following up before — not long after — an invoice goes overdue. Say an invoice is dated June 5, 2026 with 30-day terms: its due date is July 5, 2026. If it's still unpaid on July 6, it's officially overdue, and most VAs would send a friendly reminder within a few days of that date rather than waiting weeks. An AR Aging report groups unpaid invoices into Current, 1–30, 31–60, 61–90, and 90+ days overdue, which is how you decide who to follow up with first.",
    quiz: { q: "An invoice was issued on June 5, 2026 with 30-day payment terms. If today is July 20, 2026 and it's still unpaid, which AR Aging bucket does it fall into?", options: ["Current", "1–30 days overdue", "31–60 days overdue"], correct: 1, explain: "The invoice was due July 5, 2026. July 20 is 15 days past that due date, which lands in the 1–30 days overdue bucket." },
  },
  {
    id: "accounts-payable", title: "10. Managing accounts payable",
    body: "Accounts Payable is everything the business currently owes its vendors. Managing it well means knowing what's due and when, so nothing gets paid late (which can damage vendor relationships or trigger fees) and nothing gets paid twice. An AP Aging report — grouping unpaid bills into Current, 1–30, 31–60, 61–90, and 90+ days overdue — is the standard tool for deciding what to pay first.",
    quiz: { q: "Looking at an AP Aging report, which bills usually deserve attention first?", options: ["The newest bills, since they're freshest", "The largest bills regardless of age", "The oldest overdue bills, since they've been outstanding longest"], correct: 2, explain: "Bills that have aged furthest past their due date are the most urgent — they're most likely to already be overdue with a vendor and are more likely to escalate to fees or a damaged relationship the longer they sit." },
  },
  {
    id: "profit-loss", title: "11. Reading a Profit & Loss report",
    body: "A Profit & Loss (P&L), also called an Income Statement, shows performance over a period of time — for example, the month of June 2026 (June 1 to June 30, 2026), or a full fiscal year (January 1 to December 31, 2026). It starts with revenue, subtracts expenses, and lands on net profit. Unlike a Balance Sheet, a P&L always needs a date range, not a single date, because it's measuring activity, not a snapshot.",
    quiz: { q: "A client asks for \"the P&L for June.\" What date range are you actually running the report for?", options: ["June 1, 2026 through June 30, 2026", "A single date: June 30, 2026", "The entire year to date"], correct: 0, explain: "A P&L always covers a period, not a single day. \"For June\" means the full month — June 1 through June 30 — not one snapshot date." },
  },
  {
    id: "balance-sheet", title: "12. Reading a Balance Sheet",
    body: "A Balance Sheet is a snapshot as of one specific date — for example, \"as of June 30, 2026\" — showing everything the business owns (assets), owes (liabilities), and the owner's stake (equity) at that exact moment. This is the key difference from a P&L: a Balance Sheet answers \"what does the business look like right now,\" while a P&L answers \"how did the business perform over a stretch of time.\" The two connect through net profit, which flows from the P&L into equity on the Balance Sheet.",
    quiz: { q: "A client asks for the Balance Sheet \"as of June 30, 2026.\" What does that date represent?", options: ["The first day of the reporting period", "A single point-in-time snapshot — the business's position at the end of that exact day", "The date the report was generated, which could be any time later"], correct: 1, explain: "A Balance Sheet is always tied to one specific date — it shows account balances as they stood at that exact moment, unlike a P&L which covers a range of dates." },
  },
  {
    id: "cash-flow", title: "13. Reading a Cash Flow statement",
    body: "A Cash Flow statement tracks actual cash moving in and out over a period (e.g. July 1–31, 2026), split into Operating (day-to-day business), Investing (buying/selling equipment or assets), and Financing (loans, owner contributions, drawings) activities. This is different from the P&L: a P&L can show a healthy profit for July even if the business is short on cash that month — for example, if a big invoice sent July 28 hasn't been paid yet, it counts as July income on the P&L but hasn't touched the bank account at all.",
    quiz: { q: "A business shows $10,000 net profit on July's P&L, but its bank balance barely grew that month. What's the most likely explanation to check first?", options: ["The P&L must be wrong", "A meaningful amount of that profit is sitting in unpaid invoices (Accounts Receivable) rather than cash in the bank", "Cash Flow statements are always inaccurate"], correct: 1, explain: "Profit on the P&L is recorded when it's earned (accrual basis), not when cash actually arrives. Money tied up in unpaid invoices shows as profit but hasn't hit the bank — which is exactly why a Cash Flow statement exists alongside the P&L." },
  },
  {
    id: "month-end", title: "14. Month-end close",
    body: "Closing the month means every bank transaction is categorized, every invoice and bill reflects reality, the bank account is reconciled, and the reports (P&L, Balance Sheet, Trial Balance) are reviewed for anything that looks wrong before sharing them with the client.",
    quiz: { q: "Which of these should happen before you consider the month closed?", options: ["Only running the P&L report", "Categorizing all bank transactions and reconciling the bank account", "Deleting old invoices to keep things tidy"], correct: 1, explain: "A clean close requires every transaction categorized and the bank reconciled — reports are only as accurate as the data behind them." },
  },
  {
    id: "va-bookkeeping", title: "15. Bookkeeping for Virtual Assistants",
    body: "As a bookkeeping VA, you're usually working inside someone else's system on a recurring schedule — for example, every Monday you review the prior week's bank feed, and by the 5th of each month you close the previous month's books. Sticking to a predictable cadence is what makes a client trust you with their books: they should never have to ask \"is this done yet?\" A typical monthly cycle looks like: week 1–4, categorize transactions as they come in; by the 3rd of the following month, reconcile the bank; by the 5th, send the closed P&L and Balance Sheet.",
    quiz: { q: "A new client doesn't specify a schedule. What's the best first step?", options: ["Wait until they ask for something", "Propose a concrete recurring cadence (e.g. \"I'll reconcile by the 3rd and send reports by the 5th of each month\") so expectations are clear from day one", "Do the bookkeeping whenever there's free time, with no fixed dates"], correct: 1, explain: "Clients trust VAs who set clear, dated expectations. A vague \"I'll get to it\" creates anxiety; a specific commitment (\"reconciled by the 3rd, reports by the 5th\") builds confidence and gives you an accountable deadline." },
  },
  {
    id: "client-communication", title: "16. Client communication",
    body: "Good bookkeeping communication is proactive, specific, and dated. Instead of \"some invoices are overdue,\" say \"three invoices are overdue as of today (July 20, 2026): two from June, one from May.\" Instead of \"I have a question,\" say exactly which transaction and what's unclear — a vague question forces the client to dig through their own records to understand what you're asking. Following up on your own outstanding questions after a few business days (rather than letting them sit for weeks) keeps the books from stalling.",
    quiz: { q: "Which message is more useful to a client?", options: ["\"Some transactions need clarification when you get a chance.\"", "\"The $340 charge on July 12, 2026 from 'JS CONSULTING' — is this a subcontractor payment or a business expense? I need to know by Friday to close June's books on time.\"", "\"I have some questions about the books.\""], correct: 1, explain: "Specific transaction, specific date, specific ask, and a clear deadline. Vague messages create back-and-forth; specific ones get answered quickly because the client immediately knows what's needed and by when." },
  },
  {
    id: "quality-control", title: "17. Bookkeeping quality control",
    body: "Before sending any report to a client, run a quick self-check: does the Trial Balance actually balance? Does the Balance Sheet satisfy Assets = Liabilities + Equity? Is the bank reconciled as of the report date? Are there any transactions still sitting uncategorized? A simple pre-send checklist, done on the same date every month (e.g. always by the 5th), catches most errors before a client ever sees them — which is far better than a client catching the error themselves.",
    quiz: { q: "It's July 5, 2026 and you're about to send June's reports to a client. What should you check first?", options: ["Whether the reports look visually neat", "Whether the Trial Balance balances and the bank is reconciled through June 30, 2026", "Whether the client will be happy with the numbers"], correct: 1, explain: "Quality control means verifying the numbers are structurally correct — a balanced Trial Balance and a bank reconciled through the period-end date — before anything else. A neat-looking report with a real error underneath is still wrong." },
  },
  {
    id: "common-mistakes", title: "18. Common bookkeeping mistakes",
    body: "The same handful of errors show up again and again in real client books: miscategorizing expenses (like an ad platform charge landing in Office Supplies), recording a bank transfer as income or an expense, entering a bill twice, forgetting to record a partial payment, and closing a month without reconciling the bank first. Catching these takes a habit of double-checking, not memorizing every possible mistake.",
    quiz: { q: "A VA notices the same $150 charge appears twice in the books, a week apart, with slightly different memo text. What's the most likely explanation worth checking?", options: ["The vendor definitely charged twice on purpose", "It may be a duplicate entry — once from a bill and once from the bank feed — worth investigating before assuming either is wrong", "It should be ignored since the memo text is different"], correct: 1, explain: "A very common error is recording an expense once when the bill is entered and again when the matching bank transaction is categorized instead of matched to the bill. Always check for duplicates before accepting a transaction at face value." },
  },
];

const UPCOMING_MODULES = [];

function Learning({ data, setData }) {
  const progress = data.learningProgress || {};
  const completedCount = Object.values(progress).filter(Boolean).length;

  const markComplete = (id) => setData((prev) => ({ ...prev, learningProgress: { ...prev.learningProgress, [id]: true } }));

  return (
    <div>
      <SectionHeader title="Learning Center" subtitle={`${completedCount} of ${LESSONS.length} built lessons completed`} />
      <div className="space-y-3">
        {LESSONS.map((l) => <LessonCard key={l.id} lesson={l} done={!!progress[l.id]} onComplete={() => markComplete(l.id)} />)}
      </div>
      {UPCOMING_MODULES.length > 0 && (
        <Card className="p-4 mt-5">
          <p className="text-sm font-medium text-slate-700 mb-2">Coming soon</p>
          <p className="text-xs text-slate-500 mb-2">These modules from the full 18-module curriculum aren't built out yet — ask to have any of them added next.</p>
          <div className="flex flex-wrap gap-1.5">
            {UPCOMING_MODULES.map((m) => <Pill key={m}>{m}</Pill>)}
          </div>
        </Card>
      )}
    </div>
  );
}

function LessonCard({ lesson, done, onComplete }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);

  return (
    <Card className="p-4">
      <button className="w-full flex items-center justify-between text-left" onClick={() => setOpen(!open)}>
        <span className="text-sm font-medium flex items-center gap-2">
          {done && <Check size={14} className="text-teal-600" />} {lesson.title}
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="mt-3">
          <p className="text-sm text-slate-600">{lesson.body}</p>
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-sm font-medium mb-2">{lesson.quiz.q}</p>
            <div className="space-y-1.5">
              {lesson.quiz.options.map((o, i) => (
                <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name={lesson.id} checked={answer === i} onChange={() => { setAnswer(i); setChecked(false); }} /> {o}
                </label>
              ))}
            </div>
            {!checked ? (
              <Button className="mt-2" onClick={() => { if (answer === null) return; setChecked(true); }}>Check answer</Button>
            ) : (
              <div className={`mt-2 text-sm p-2 rounded ${answer === lesson.quiz.correct ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}>
                {answer === lesson.quiz.correct ? "Correct. " : "Not quite. "}{lesson.quiz.explain}
              </div>
            )}
            {answer === null && checked === false && <p className="text-xs text-slate-400 mt-1">Pick an option first.</p>}
          </div>
          {!done && <Button variant="primary" className="mt-3" onClick={onComplete}>Mark lesson complete</Button>}
        </div>
      )}
    </Card>
  );
}

/* ============================== PLATFORM COMPARISON ============================== */

// Describes, at a conceptual/navigational level, how the same accounting task is
// carried out in QuickBooks Online and Xero. Deliberately factual and generic
// (menu paths and workflow order, not screenshots, exact wording, logos, or
// design) — the goal is transferable muscle memory, not a copy of either product.
const TASK_COMPARISONS = [
  {
    id: "invoice", task: "Creating and sending an invoice",
    concept: "Recording a sale to a customer before they've paid, which increases Accounts Receivable and Income immediately (accrual basis).",
    ledgerlab: "Sales → New Invoice → pick customer, add line items, set tax and due date → Save & send.",
    qbo: "Click the + New button (top left) → Invoice, under the Customers column. Fill in customer, product/service lines, and terms, then Save and send.",
    xero: "Business menu → Invoices → New Invoice. Fill in the contact, line items, and due date, then Approve, and optionally Send.",
    tip: "The button labels differ (\"Save and send\" vs \"Approve\"), but the underlying idea is identical everywhere: the invoice isn't real accounting until it's finalized/approved — that's the moment AR and Income actually move.",
  },
  {
    id: "bill", task: "Entering a vendor bill",
    concept: "Recording an expense the moment you're obligated to pay it, not when you actually pay — this increases the expense account and Accounts Payable.",
    ledgerlab: "Expenses → New Bill → pick vendor, category, amount, and due date → Save bill.",
    qbo: "+ New → Bill, under the Vendors column. Choose the vendor, category/account, and amount, then Save and close.",
    xero: "Business menu → Bills to pay → New Bill. Choose the contact, account, and amount, then Approve.",
    tip: "In every platform, entering the bill is a separate step from paying it — that separation is exactly what lets Accounts Payable show what you owe before cash actually leaves the bank.",
  },
  {
    id: "bankfeed", task: "Categorizing a bank feed transaction",
    concept: "Turning a raw bank line item into a real bookkeeping entry by assigning it to the right account (or matching it to an invoice/bill already entered).",
    ledgerlab: "Banking → pick a transaction → choose a category from the dropdown (or accept the system's suggestion) → it posts automatically.",
    qbo: "Banking (or Transactions) tab → Banking feed → For Review tab. Each row lets you confirm the suggested category or change it, then click Confirm (or Match, if it lines up with an existing invoice/bill).",
    xero: "Business menu → Bank accounts → the account tile → Reconcile [X] items. Each line offers a suggested match; you confirm, split, or create a rule, then OK.",
    tip: "Xero's \"Reconcile\" tab actually mixes two ideas we've kept separate in LedgerLab: categorizing new transactions AND the monthly reconciliation. QuickBooks keeps them more separate, closer to how LedgerLab is organized (Banking feed vs. a dedicated Reconcile tool).",
  },
  {
    id: "reconcile", task: "Reconciling the bank account",
    concept: "Confirming your books match the bank's own records for a statement period, transaction by transaction.",
    ledgerlab: "Accounting → Bank Reconciliation → enter the statement date and ending balance, then check off cleared transactions until the difference is zero.",
    qbo: "Accounting menu → Reconcile. Choose the account, enter the statement ending balance and date, then check off each cleared transaction.",
    xero: "Accounting → Bank accounts → the account → Reconcile [X] items, which walks through matching each bank line to the books until the balance you're at agrees with the statement.",
    tip: "All three tools land on the same test: does the checked-off total match the bank statement? If not, the difference is always caused by something specific — never just \"forced\" to match. Never manually override a reconciliation to make it balance without finding the cause; that hides real errors instead of fixing them.",
  },
  {
    id: "coa", task: "Setting up the Chart of Accounts",
    concept: "The master list of every account (Asset/Liability/Equity/Income/Expense) transactions can be coded to.",
    ledgerlab: "Accounting → Chart of Accounts → Add account, choosing a code, name, and type.",
    qbo: "Accounting menu → Chart of Accounts → New. You pick an Account Type and Detail Type (a QuickBooks-specific sub-category system).",
    xero: "Accounting → Advanced → Chart of Accounts → Add Account. You pick an Account Type and, optionally, a Tax Rate default for that account.",
    tip: "QuickBooks' extra \"Detail Type\" layer is the main structural difference — it's a finer sub-classification within each account type, mainly used for report formatting. The five broad account types (Asset, Liability, Equity, Income, Expense) are universal across every platform, including LedgerLab.",
  },
  {
    id: "reports", task: "Running core reports",
    concept: "Turning the transaction history into the three standard financial statements: Profit & Loss, Balance Sheet, and (in full platforms) Statement of Cash Flows.",
    ledgerlab: "Reports → pick a tab (P&L, Balance Sheet, Trial Balance, General Ledger, AR/AP Aging).",
    qbo: "Reports menu, organized into \"Business overview,\" \"Who owes you,\" \"What you owe,\" etc. Profit and Loss and Balance Sheet are the two most-used starting reports.",
    xero: "Accounting → Reports, grouped similarly (\"Profitability,\" \"Financial Position,\" \"Aged receivables/payables\").",
    tip: "All three organize reports around the same handful of core statements — the grouping and naming differ, but if you know what a Profit & Loss and a Balance Sheet tell you conceptually, you can find them anywhere.",
  },
  {
    id: "salestax", task: "Applying sales tax / GST / VAT",
    concept: "Adding a jurisdiction-specific tax rate to a sale so the amount owed to the tax authority is tracked separately from income.",
    ledgerlab: "A single flat 12% educational tax toggle on invoices and bills, posted to a Tax Payable account — deliberately simplified since real rates vary by country and region.",
    qbo: "Uses a rates engine (often \"Automated Sales Tax\" in the US) tied to your business address and the customer's location, applied per line item on an invoice.",
    xero: "Each line item on an invoice/bill has a Tax Rate dropdown (e.g. \"GST on Income,\" \"20% VAT on Expenses\"), configured centrally under Accounting → Advanced → Tax rates.",
    tip: "This is the area where LedgerLab is most simplified on purpose — real tax rules are genuinely complex and jurisdiction-specific, and getting them wrong has real consequences. Treat LedgerLab's tax toggle as a way to practice the bookkeeping mechanics (a tax liability account exists and grows with each taxable sale), not as tax guidance for a real business.",
  },
  {
    id: "journal", task: "Manual journal entries",
    concept: "Directly recording a debit/credit entry that isn't generated automatically by an invoice, bill, or bank transaction — used for corrections, depreciation, accruals, etc.",
    ledgerlab: "Accounting → Journal Entries → New journal entry → add account lines until debits equal credits → Post entry.",
    qbo: "+ New → Journal Entry, under the Other column. Add debit/credit lines; QuickBooks blocks saving if they don't balance.",
    xero: "Accounting → Advanced → Manual Journals → New Journal. Same idea — add lines until debits equal credits, then Post.",
    tip: "Every platform enforces the same non-negotiable rule at this level: total debits must equal total credits, full stop. If you only remember one thing that transfers everywhere, it's this.",
  },
];

function PlatformComparison() {
  const [openId, setOpenId] = useState(TASK_COMPARISONS[0].id);
  return (
    <div>
      <SectionHeader
        title="Platform Comparison"
        subtitle="How the same task looks in LedgerLab, QuickBooks Online, and Xero"
      />
      <Card className="p-3 mb-4 bg-slate-50 border-slate-200">
        <p className="text-xs text-slate-600">
          This describes general navigation and workflow concepts — not screenshots, exact wording, or design from either product — because
          both platforms update their interfaces over time and their exact screens aren't reproduced here. The goal is that the underlying
          accounting concept, which doesn't change, transfers no matter which specific button you're clicking.
        </p>
      </Card>
      <div className="space-y-2">
        {TASK_COMPARISONS.map((t) => (
          <Card key={t.id} className="p-4">
            <button className="w-full flex items-center justify-between text-left" onClick={() => setOpenId(openId === t.id ? null : t.id)}>
              <span className="text-sm font-medium">{t.task}</span>
              {openId === t.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {openId === t.id && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-600">{t.concept}</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                    <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">LedgerLab</p>
                    <p className="text-slate-700">{t.ledgerlab}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">QuickBooks Online</p>
                    <p className="text-slate-700">{t.qbo}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Xero</p>
                    <p className="text-slate-700">{t.xero}</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2">
                  <Lightbulb size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{t.tip}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================== VA PRACTICE CENTER ============================== */

function VAPracticeCenter({ data, setData, setPage }) {
  const { invoices, bills, bankTx, accounts } = data;
  const overdueInvoices = invoices.filter((i) => round2(i.total - i.amountPaid) > 0.001 && daysBetween(i.dueDate, todayISO()) > 0);
  const dueBills = bills.filter((b) => round2(b.total - b.amountPaid) > 0.001 && daysBetween(b.dueDate, todayISO()) > -7);
  const uncategorized = bankTx.filter((t) => t.status === "uncategorized");
  const flagged = bankTx.find((t) => t.flaggedMistake);

  return (
    <div>
      <SectionHeader title="VA Practice Center" subtitle="Realistic client requests, built from your own company data" />

      <div className="grid grid-cols-2 gap-4">
        <ScenarioCard
          title="Scenario 1 — Bank categorization"
          desc={`You received ${uncategorized.length} bank transaction${uncategorized.length !== 1 ? "s" : ""} from your client. Categorize them correctly.`}
          action={() => setPage("banking")}
          actionLabel="Open Banking"
        />
        <ScenarioCard
          title="Scenario 3 — Accounts Receivable"
          desc={`${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? "s are" : " is"} overdue. Decide which customers need a follow-up.`}
          action={() => setPage("sales")}
          actionLabel="Open Sales"
        />
        <ScenarioCard
          title="Scenario 4 — Accounts Payable"
          desc={`${dueBills.length} supplier bill${dueBills.length !== 1 ? "s are" : " is"} due soon. Prepare a payment schedule.`}
          action={() => setPage("expenses")}
          actionLabel="Open Expenses"
        />
        <ScenarioCard
          title="Scenario 6 — Month-end close"
          desc="Complete the client's monthly checklist: categorize the bank feed, reconcile the account, and review the P&L and Balance Sheet."
          action={() => setPage("accounting")}
          actionLabel="Open Accounting"
        />
      </div>

      {flagged && (
        <Card className="p-4 mt-4 border-amber-300">
          <p className="text-sm font-medium flex items-center gap-2"><AlertTriangle size={15} className="text-amber-600" /> Scenario 5 — Expense cleanup</p>
          <p className="text-sm text-slate-600 mt-1">
            One transaction on {flagged.date} — <span className="font-mono">{flagged.description}</span> — was categorized as{" "}
            <strong>{accounts.find((a) => a.id === flagged.categorizedAs)?.name}</strong>. Does that look right to you?
          </p>
          <MistakeChecker tx={flagged} accounts={accounts} setPage={setPage} />
        </Card>
      )}

      <Card className="p-4 mt-4">
        <p className="text-sm font-medium mb-1">Scenario 7 — Client request</p>
        <p className="text-sm text-slate-600">
          The client emails: <em>"Can you check why our profit looks lower this month?"</em> Open Reports → Profit & Loss and compare
          revenue and expenses to a typical month. Look for a large or unusual expense line, a missing invoice, or a bill posted to the wrong account.
        </p>
        <Button className="mt-2" onClick={() => setPage("reports")}>Open Reports</Button>
      </Card>
    </div>
  );
}

function ScenarioCard({ title, desc, action, actionLabel }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-slate-600 mt-1">{desc}</p>
      <Button className="mt-2" onClick={action}>{actionLabel}</Button>
    </Card>
  );
}

function MistakeChecker({ tx, accounts, setPage }) {
  const [showHint, setShowHint] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2">
      <Button onClick={() => setShowHint(!showHint)}><Eye size={13} /> {showHint ? "Hide hint" : "Show hint"}</Button>
      <Button onClick={() => setShowExplain(!showExplain)}><Lightbulb size={13} /> {showExplain ? "Hide explanation" : "Show explanation"}</Button>
      <Button variant="primary" onClick={() => setPage("banking")}>Fix it in Banking</Button>
      {showHint && !showExplain && <span className="text-xs text-slate-500 ml-2">Think about what kind of company spends money with "{tx.description}" — what would that money typically be for?</span>}
      {showExplain && <span className="text-xs text-amber-700 ml-2">Google Ads is a marketing platform, so this is usually Advertising expense, not Office Supplies. Miscategorizing expenses distorts the P&L and can mislead the client about spending patterns.</span>}
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsPage({ data, setData, resetDemo, onImportData }) {
  const [f, setF] = useState(data.company);
  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => {
    setData((prev) => ({ ...prev, company: { ...prev.company, ...f } }));
    if (onImportData) onImportData(f);
  };

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Company profile and data controls" />
      <Card className="p-4 max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Industry"><input className={inputCls} value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} /></Field>
          <Field label="Country"><input className={inputCls} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></Field>
          <Field label="Currency">
            <select className={inputCls} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
              {["PHP", "USD", "AUD", "CAD", "GBP", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Button variant="primary" className="mt-3" onClick={save}>Save changes</Button>
      </Card>

      <Card className="p-4 max-w-lg mt-4">
        <p className="text-sm font-medium mb-1">Backup & restore</p>
        <p className="text-xs text-slate-500 mb-2">Export this company's full data (accounts, transactions, invoices, bills, journal) as a JSON file, or restore from a previously exported file.</p>
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${data.company.name.replace(/\s+/g, "-").toLowerCase()}-backup.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}><Download size={13} /> Export JSON backup</Button>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 cursor-pointer">
            Restore from JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(reader.result);
                  if (!parsed.accounts || !parsed.journal || !parsed.company) { alert("This doesn't look like a LedgerLab backup file."); return; }
                  if (!confirm(`Replace the current company's data with the contents of ${file.name}? This can't be undone.`)) return;
                  setData(normalizeCompanyData(parsed));
                  if (onImportData) onImportData(parsed.company);
                } catch { alert("Couldn't read that file — make sure it's a valid LedgerLab JSON backup."); }
              };
              reader.readAsText(file);
              e.target.value = "";
            }} />
          </label>
        </div>
      </Card>

      <Card className="p-4 max-w-lg mt-4">
        <p className="text-sm font-medium mb-1">Reset practice data</p>
        <p className="text-xs text-slate-500 mb-2">Restores this company to its original demo state. This clears everything you've entered.</p>
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)}><RefreshCw size={13} /> Reset demo data</Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-rose-700">Are you sure? This can't be undone.</span>
            <Button variant="danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>Yes, reset</Button>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

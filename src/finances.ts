import type { AgentFinances, AgentName, ResolvedAction, SimTime } from "./types.js";

/**
 * Process monthly income and expenses. Runs on day 1 of each simulated month (every 30 days).
 * Returns description strings for the agent's perception.
 */
export function processMonthly(agent: AgentName, finances: AgentFinances): string[] {
  const events: string[] = [];

  // Income
  finances.balance += finances.monthly_income;
  events.push(`Salary received: +€${finances.monthly_income}`);

  // Rent
  const rent = finances.new_rent ?? finances.current_rent;
  if (rent > 0) {
    finances.balance -= rent;
    events.push(`Rent paid: -€${rent}`);
  }

  // Random living expenses (groceries, bills, etc.)
  const expenses = 400 + Math.floor(Math.random() * 300);
  finances.balance -= expenses;
  events.push(`Other expenses: -€${expenses}`);

  return events;
}

/**
 * Check agent actions for spending and deduct amounts.
 */
export function processSpending(finances: AgentFinances, actions: ResolvedAction[], location: string): void {
  for (const action of actions) {
    if (action.type !== "do" || !action.text) continue;
    const text = action.text.toLowerCase();

    // Buying at Späti
    if (location === "Späti" && (text.includes("buy") || text.includes("pay"))) {
      const amount = text.includes("groceries") || text.includes("shopping") ? 20 + Math.floor(Math.random() * 20) : 5 + Math.floor(Math.random() * 10);
      finances.balance -= amount;
    }

    // Bar spending
    if (location === "Zum Anker" && (text.includes("beer") || text.includes("order") || text.includes("drink"))) {
      finances.balance -= 4 + Math.floor(Math.random() * 6);
    }
  }
}

/**
 * Build finance perception for the agent. Shown monthly and when contextually relevant.
 */
export function financePerception(finances: AgentFinances, isMonthStart: boolean, monthlyEvents?: string[]): string {
  if (isMonthStart && monthlyEvents) {
    return `(Balance: €${finances.balance}. ${monthlyEvents.join(" ")})`;
  }

  if (finances.balance < 0) {
    return `(Your account is negative: €${finances.balance}.)`;
  }

  if (finances.balance < 500) {
    return `(Your balance is low: €${finances.balance}.)`;
  }

  return "";
}

/**
 * Check if financial context is relevant (for ground truth injection).
 */
export function isFinanceRelevant(perception: string, memory: string): boolean {
  const context = perception + " " + memory;
  const triggers = ["rent", "money", "pay", "afford", "eviction", "premium", "costs", "income", "balance", "account"];
  return triggers.some(t => context.toLowerCase().includes(t));
}

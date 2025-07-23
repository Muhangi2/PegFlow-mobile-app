// Stellar API integration layer (XLM only)
// TODO: Replace stubs with real Stellar integration (use a backend or compatible library for React Native)

export type Currency = 'XLM';

export interface Balance {
  currency: Currency;
  amount: number;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  currency: Currency;
  amount: number;
  date: string;
  counterparty: string;
}

export interface ExchangeRates {
  XLMUSD: number;
}

// Example: fetch XLM balance
export async function getBalances(): Promise<Balance[]> {
  // TODO: Replace with real Stellar integration
  return [
    { currency: 'XLM', amount: 100.25 },
  ];
}

// Example: send XLM
export async function sendAsset(amount: number, to: string): Promise<{ success: boolean; txId?: string; error?: string }> {
  // TODO: Replace with real Stellar integration
  return { success: true, txId: 'mock-tx-id' };
}

// Example: get transaction history (XLM only)
export async function getTransactionHistory(): Promise<Transaction[]> {
  // TODO: Replace with real Stellar integration
  return [
    { id: '1', type: 'send', currency: 'XLM', amount: 10, date: '2024-06-21', counterparty: 'Alice' },
    { id: '2', type: 'receive', currency: 'XLM', amount: 25, date: '2024-06-20', counterparty: 'Bob' },
  ];
}

// Example: fetch real-time exchange rates (stub)
export async function getExchangeRates(): Promise<ExchangeRates> {
  // TODO: Replace with real API call
  return {
    XLMUSD: 0.12,
  };
} 
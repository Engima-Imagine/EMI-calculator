export type PaymentFrequency = 'monthly' | 'fortnightly' | 'weekly';

export interface RepaymentStrategy {
  id: string;
  amount: number;
  frequency: PaymentFrequency;
  lumpSumAmount: number;
  lumpSumMonth: number;
}

export interface LoanInputs {
  principal: number;
  interestRate: number; // annual percentage, e.g., 5.5
  loanTermYears: number;
  extraRepayment: number;
  extraRepaymentFrequency: PaymentFrequency;
  lumpSumAmount: number;
  lumpSumMonth: number;
}

export interface AmortizationRow {
  month: number;
  standardBalance: number;
  acceleratedBalance: number;
  standardTotalInterest: number;
  acceleratedTotalInterest: number;
}

export interface LoanSummary {
  standardMonthlyPayment: number;
  standardTotalInterest: number;
  standardTotalCost: number;
  standardMonths: number;
  
  acceleratedTotalInterest: number;
  acceleratedTotalCost: number;
  acceleratedMonths: number;
  
  interestSaved: number;
  timeSavedMonths: number;
  
  amortizationSchedule: AmortizationRow[];
}

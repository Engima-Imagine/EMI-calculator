import { LoanInputs, LoanSummary, AmortizationRow } from '../types';

export function calculateLoan(inputs: LoanInputs): LoanSummary {
  const { principal, interestRate, loanTermYears, extraRepayment, extraRepaymentFrequency, lumpSumAmount, lumpSumMonth } = inputs;

  // Convert everything to monthly for standard comparison basis
  // In a more complex app, we'd handle exact compounding frequencies.
  // For simplicity and common understanding, we'll map extra payments to a monthly equivalent for the monthly amortization schedule.
  
  const annualRate = interestRate / 100;
  const monthlyRate = annualRate / 12;
  const totalMonths = loanTermYears * 12;

  // Standard Monthly Repayment
  let standardMonthlyPayment = 0;
  if (monthlyRate > 0) {
    standardMonthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else {
    standardMonthlyPayment = principal / totalMonths;
  }

  // Normalize extra payment to monthly
  let monthlyExtra = 0;
  if (extraRepaymentFrequency === 'monthly') {
    monthlyExtra = extraRepayment;
  } else if (extraRepaymentFrequency === 'fortnightly') {
    monthlyExtra = (extraRepayment * 26) / 12;
  } else if (extraRepaymentFrequency === 'weekly') {
    monthlyExtra = (extraRepayment * 52) / 12;
  }

  const acceleratedMonthlyPayment = standardMonthlyPayment + monthlyExtra;

  const schedule: AmortizationRow[] = [];
  
  let standardBalance = principal;
  let acceleratedBalance = principal;
  
  let standardTotalInterest = 0;
  let acceleratedTotalInterest = 0;
  
  let standardMonthsCount = 0;
  let acceleratedMonthsCount = 0;

  // Generate schedule up to the max standard term (or until both paid off)
  for (let month = 0; month <= totalMonths + 1; month++) {
    // Record start of month (month 0 is initial state)
    schedule.push({
      month,
      standardBalance: Math.max(0, standardBalance),
      acceleratedBalance: Math.max(0, acceleratedBalance),
      standardTotalInterest,
      acceleratedTotalInterest,
    });

    if (standardBalance <= 0 && acceleratedBalance <= 0) {
      break; // Both paid off
    }

    // Process Standard
    if (standardBalance > 0) {
      const interestForMonth = standardBalance * monthlyRate;
      standardTotalInterest += interestForMonth;
      
      let principalPortion = standardMonthlyPayment - interestForMonth;
      if (standardBalance < principalPortion) {
        principalPortion = standardBalance; // Last payment
      }
      standardBalance -= principalPortion;
      standardMonthsCount++;
    }

    // Process Accelerated
    if (acceleratedBalance > 0) {
      const interestForMonth = acceleratedBalance * monthlyRate;
      acceleratedTotalInterest += interestForMonth;
      
      let principalPortion = acceleratedMonthlyPayment - interestForMonth;
      
      // Apply lump sum in the specified month
      if (month === lumpSumMonth) {
        principalPortion += lumpSumAmount;
      }

      if (acceleratedBalance < principalPortion) {
        principalPortion = acceleratedBalance; // Last payment
      }
      acceleratedBalance -= principalPortion;
      acceleratedMonthsCount++;
    }
  }

  return {
    standardMonthlyPayment,
    standardTotalInterest,
    standardTotalCost: principal + standardTotalInterest,
    standardMonths: standardMonthsCount,
    
    acceleratedTotalInterest,
    acceleratedTotalCost: principal + acceleratedTotalInterest,
    acceleratedMonths: acceleratedMonthsCount,
    
    interestSaved: standardTotalInterest - acceleratedTotalInterest,
    timeSavedMonths: standardMonthsCount - acceleratedMonthsCount,
    
    amortizationSchedule: schedule,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) return `${remainingMonths}mo`;
  if (remainingMonths === 0) return `${years}yr`;
  return `${years}yr ${remainingMonths}mo`;
}

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Home, 
  PiggyBank, 
  Clock, 
  TrendingDown, 
  IndianRupee,
  Bookmark,
  Trash2,
  Plus,
  Table,
  X,
  Moon,
  Sun,
  Target,
  Flag,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

import { LoanInputs, PaymentFrequency, RepaymentStrategy } from './types';
import { calculateLoan, formatCurrency, formatMonths } from './lib/calculator';
import { cn } from './lib/utils';

export default function App() {
  const [inputs, setInputs] = useState<LoanInputs>({
    principal: 5000000,
    interestRate: 6.5,
    loanTermYears: 30,
    extraRepayment: 5000,
    extraRepaymentFrequency: 'monthly',
    lumpSumAmount: 100000,
    lumpSumMonth: 12,
  });

  const [savedStrategies, setSavedStrategies] = useState<RepaymentStrategy[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMilestonesOnChart, setShowMilestonesOnChart] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const summary = useMemo(() => calculateLoan(inputs), [inputs]);

  // Key Financial Milestones
  const milestones = useMemo(() => {
    const halfPrincipalTarget = inputs.principal / 2;
    
    // First month where accelerated balance <= 50% of principal
    const halfAccRow = summary.amortizationSchedule.find(r => r.acceleratedBalance <= halfPrincipalTarget && r.month > 0);
    const halfAccMonth = halfAccRow ? halfAccRow.month : null;
    const halfAccBalance = halfAccRow ? halfAccRow.acceleratedBalance : halfPrincipalTarget;

    // First month where standard balance <= 50% of principal
    const halfStdRow = summary.amortizationSchedule.find(r => r.standardBalance <= halfPrincipalTarget && r.month > 0);
    const halfStdMonth = halfStdRow ? halfStdRow.month : null;

    // Payoff months
    const payoffAccMonth = summary.acceleratedMonths;
    const payoffStdMonth = summary.standardMonths;

    // Lump sum check
    const hasLumpSum = inputs.lumpSumAmount > 0 && inputs.lumpSumMonth > 0 && inputs.lumpSumMonth <= summary.acceleratedMonths;

    const halfTimeSaved = (halfStdMonth !== null && halfAccMonth !== null) ? Math.max(0, halfStdMonth - halfAccMonth) : 0;

    return {
      halfPrincipalTarget,
      halfAccMonth,
      halfAccBalance,
      halfStdMonth,
      payoffAccMonth,
      payoffStdMonth,
      hasLumpSum,
      lumpSumMonth: inputs.lumpSumMonth,
      lumpSumAmount: inputs.lumpSumAmount,
      halfTimeSaved,
    };
  }, [inputs, summary]);

  // Prepare chart data including milestone months
  const chartData = useMemo(() => {
    const milestoneMonthSet = new Set<number>();
    milestoneMonthSet.add(0);
    if (milestones.halfAccMonth !== null) milestoneMonthSet.add(milestones.halfAccMonth);
    if (milestones.halfStdMonth !== null) milestoneMonthSet.add(milestones.halfStdMonth);
    milestoneMonthSet.add(milestones.payoffAccMonth);
    milestoneMonthSet.add(milestones.payoffStdMonth);
    if (milestones.hasLumpSum) milestoneMonthSet.add(milestones.lumpSumMonth);
    if (summary.amortizationSchedule.length > 0) {
      milestoneMonthSet.add(summary.amortizationSchedule[summary.amortizationSchedule.length - 1].month);
    }

    const filtered = summary.amortizationSchedule.filter((row, index) => {
      return index % 12 === 0 || milestoneMonthSet.has(row.month);
    });

    return filtered.sort((a, b) => a.month - b.month);
  }, [summary.amortizationSchedule, milestones]);

  const handleSaveStrategy = () => {
    if (savedStrategies.length >= 3) return;
    const newStrategy: RepaymentStrategy = {
      id: crypto.randomUUID(),
      amount: inputs.extraRepayment,
      frequency: inputs.extraRepaymentFrequency,
      lumpSumAmount: inputs.lumpSumAmount,
      lumpSumMonth: inputs.lumpSumMonth,
    };
    setSavedStrategies(prev => [...prev, newStrategy]);
  };

  const handleApplyStrategy = (strategy: RepaymentStrategy) => {
    setInputs(prev => ({
      ...prev,
      extraRepayment: strategy.amount,
      extraRepaymentFrequency: strategy.frequency,
      lumpSumAmount: strategy.lumpSumAmount,
      lumpSumMonth: strategy.lumpSumMonth,
    }));
  };

  const handleDeleteStrategy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedStrategies(prev => prev.filter(s => s.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setInputs(prev => ({
      ...prev,
      [name]: name === 'extraRepaymentFrequency' 
        ? value 
        : Number(value)
    }));
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-900 dark:selection:text-blue-100 pb-12 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 sticky top-0 z-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-[0_2px_10px_-3px_rgba(37,99,235,0.5)] transition-colors duration-300">
              <Home className="w-5 h-5" />
            </div>
            <h1 className="font-semibold text-xl tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
              Repayment Monitor
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors duration-300"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none border border-black/5 dark:border-white/5 p-8 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-8 text-slate-800 dark:text-slate-200 transition-colors duration-300">
                <Calculator className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h2 className="font-semibold text-xl">Loan Details</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="principal" className="block text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors duration-300">
                      Loan Amount
                    </label>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors duration-300">{formatCurrency(inputs.principal)}</span>
                  </div>
                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors duration-300" />
                    </div>
                    <input
                      type="number"
                      id="principal"
                      name="principal"
                      min="0"
                      value={inputs.principal || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-9 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 sm:text-sm bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      placeholder="5000000"
                    />
                  </div>
                  <input 
                    type="range" 
                    name="principal" 
                    min="100000" 
                    max="50000000" 
                    step="100000"
                    value={inputs.principal || 0} 
                    onChange={handleInputChange} 
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-colors duration-300" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="interestRate" className="block text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors duration-300">
                      Interest Rate (%)
                    </label>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors duration-300">{inputs.interestRate}%</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    id="interestRate"
                    name="interestRate"
                    value={inputs.interestRate || ''}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 mb-2 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 sm:text-sm bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    placeholder="6.5"
                  />
                  <input 
                    type="range" 
                    name="interestRate" 
                    min="1" 
                    max="15" 
                    step="0.1"
                    value={inputs.interestRate || 0} 
                    onChange={handleInputChange} 
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-colors duration-300" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="loanTermYears" className="block text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors duration-300">
                      Loan Term (Years)
                    </label>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors duration-300">{inputs.loanTermYears} yrs</span>
                  </div>
                  <input
                    type="number"
                    id="loanTermYears"
                    name="loanTermYears"
                    min="1"
                    max="50"
                    value={inputs.loanTermYears || ''}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 mb-2 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 sm:text-sm bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    placeholder="30"
                  />
                  <input 
                    type="range" 
                    name="loanTermYears" 
                    min="5" 
                    max="40" 
                    step="1"
                    value={inputs.loanTermYears || 0} 
                    onChange={handleInputChange} 
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-colors duration-300" 
                  />
                </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-4 transition-colors duration-300">Extra Repayments</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="extraRepayment" className="block text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors duration-300">
                          Recurring Amount
                        </label>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors duration-300">{formatCurrency(inputs.extraRepayment)}</span>
                      </div>
                      <div className="relative mb-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors duration-300" />
                        </div>
                        <input
                          type="number"
                          id="extraRepayment"
                          name="extraRepayment"
                          min="0"
                          value={inputs.extraRepayment || ''}
                          onChange={handleInputChange}
                          className="block w-full pl-9 pr-3 py-3 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 sm:text-sm bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 transition-all hover:border-emerald-300 dark:hover:border-emerald-800/50"
                          placeholder="5000"
                        />
                      </div>
                      <input 
                        type="range" 
                        name="extraRepayment" 
                        min="0" 
                        max="100000" 
                        step="1000"
                        value={inputs.extraRepayment || 0} 
                        onChange={handleInputChange} 
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-400 transition-colors duration-300" 
                      />
                    </div>

                    <div>
                      <label htmlFor="extraRepaymentFrequency" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors duration-300">
                        Recurring Frequency
                      </label>
                      <select
                        id="extraRepaymentFrequency"
                        name="extraRepaymentFrequency"
                        value={inputs.extraRepaymentFrequency}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 sm:text-sm bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 transition-all hover:border-emerald-300 dark:hover:border-emerald-800/50"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label htmlFor="lumpSumAmount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors duration-300">
                          Lump Sum
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <IndianRupee className="h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors duration-300" />
                          </div>
                          <input
                            type="number"
                            id="lumpSumAmount"
                            name="lumpSumAmount"
                            value={inputs.lumpSumAmount || ''}
                            onChange={handleInputChange}
                            className="block w-full pl-9 pr-3 py-3 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 sm:text-sm bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 transition-all hover:border-emerald-300 dark:hover:border-emerald-800/50"
                            placeholder="100000"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="lumpSumMonth" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors duration-300">
                          Paid in Month
                        </label>
                        <input
                          type="number"
                          id="lumpSumMonth"
                          name="lumpSumMonth"
                          value={inputs.lumpSumMonth || ''}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 sm:text-sm bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 transition-all hover:border-emerald-300 dark:hover:border-emerald-800/50"
                          placeholder="12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Saved Strategies UI */}
                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors duration-300">Saved Strategies</h3>
                      <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full transition-colors duration-300">{savedStrategies.length}/3</span>
                    </div>
                    
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {savedStrategies.map(strategy => (
                          <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            key={strategy.id}
                            onClick={() => handleApplyStrategy(strategy)}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-2xl border text-sm transition-all text-left mb-2",
                              inputs.extraRepayment === strategy.amount && inputs.extraRepaymentFrequency === strategy.frequency && inputs.lumpSumAmount === strategy.lumpSumAmount && inputs.lumpSumMonth === strategy.lumpSumMonth
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Bookmark className={cn("w-4 h-4 shrink-0 transition-colors duration-300", inputs.extraRepayment === strategy.amount && inputs.extraRepaymentFrequency === strategy.frequency && inputs.lumpSumAmount === strategy.lumpSumAmount && inputs.lumpSumMonth === strategy.lumpSumMonth ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")} />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {formatCurrency(strategy.amount)} / {strategy.frequency.replace('ly', '')}
                                </span>
                                {strategy.lumpSumAmount > 0 && (
                                  <span className="text-xs opacity-75">
                                    + {formatCurrency(strategy.lumpSumAmount)} at mo {strategy.lumpSumMonth}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div 
                              onClick={(e) => handleDeleteStrategy(strategy.id, e)}
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                              title="Delete strategy"
                            >
                              <Trash2 className="w-4 h-4" />
                            </div>
                          </motion.button>
                        ))}
                      </AnimatePresence>

                      {savedStrategies.length < 3 && (
                        <motion.button
                          layout
                          onClick={handleSaveStrategy}
                          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all mt-2 hover:shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Save Current Strategy
                        </motion.button>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* Main Content / Results */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none border border-black/5 dark:border-white/5 p-8 transition-colors duration-300">
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 transition-colors duration-300">Standard Plan</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 transition-colors duration-300">Monthly Repayment</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-300">{formatCurrency(summary.standardMonthlyPayment)}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 transition-colors duration-300">Total Interest</p>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300 transition-colors duration-300">{formatCurrency(summary.standardTotalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 transition-colors duration-300">Payoff Time</p>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300 transition-colors duration-300">{formatMonths(summary.standardMonths)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.5)] border border-slate-800 dark:border-slate-800 p-8 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 dark:bg-emerald-400/15 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6 relative z-10 transition-colors duration-300">With Extra Repayments</h3>
                <div className="space-y-6 relative z-10">
                  <div>
                    <p className="text-sm text-slate-400 mb-1 transition-colors duration-300">Effective Monthly</p>
                    <p className="text-2xl font-semibold text-white transition-colors duration-300">
                      {formatCurrency(summary.standardMonthlyPayment + 
                        (inputs.extraRepaymentFrequency === 'monthly' ? inputs.extraRepayment : 
                         inputs.extraRepaymentFrequency === 'fortnightly' ? (inputs.extraRepayment * 26) / 12 : 
                         (inputs.extraRepayment * 52) / 12))}
                    </p>
                    {inputs.lumpSumAmount > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">
                        + {formatCurrency(inputs.lumpSumAmount)} at month {inputs.lumpSumMonth}
                      </p>
                    )}
                  </div>
                  <div className="pt-6 border-t border-slate-800/80 dark:border-slate-700/80 transition-colors duration-300">
                    <p className="text-sm text-slate-400 mb-1 transition-colors duration-300">Total Interest</p>
                    <p className="text-lg font-medium text-emerald-400 transition-colors duration-300">{formatCurrency(summary.acceleratedTotalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1 transition-colors duration-300">Payoff Time</p>
                    <p className="text-lg font-medium text-blue-400 transition-colors duration-300">{formatMonths(summary.acceleratedMonths)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600 rounded-3xl shadow-[0_4px_20px_-8px_rgba(16,185,129,0.4)] dark:shadow-none border border-emerald-400/20 dark:border-emerald-300/20 p-8 text-white relative overflow-hidden group transition-colors duration-300">
                <div className="absolute -right-6 -top-6 text-emerald-500/20 dark:text-emerald-400/20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
                  <PiggyBank className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-emerald-100 dark:text-emerald-50 mb-3 transition-colors duration-300">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-semibold text-xs tracking-widest uppercase">Interest Saved</span>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold tracking-tight">
                    {formatCurrency(summary.interestSaved)}
                  </div>
                  <p className="mt-3 text-sm text-emerald-100/90 font-medium transition-colors duration-300">
                    By making extra repayments
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-3xl shadow-[0_4px_20px_-8px_rgba(245,158,11,0.4)] dark:shadow-none border border-amber-400/20 dark:border-amber-300/20 p-8 text-white relative overflow-hidden group transition-colors duration-300">
                <div className="absolute -right-6 -top-6 text-amber-900/10 dark:text-amber-900/20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
                  <Clock className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-50 dark:text-amber-50 mb-3 transition-colors duration-300">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold text-xs tracking-widest uppercase">Time Saved</span>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold tracking-tight">
                    {formatMonths(summary.timeSavedMonths)}
                  </div>
                  <p className="mt-3 text-sm text-amber-100/90 font-medium transition-colors duration-300">
                    Shorn off your loan term
                  </p>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-none border border-black/5 dark:border-white/5 p-8 transition-colors duration-300">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors duration-300">
                    Balance Trajectory & Key Milestones
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">
                    Visualizing principal paydown, 50% threshold, and debt freedom dates.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setShowMilestonesOnChart(prev => !prev)}
                    className={cn(
                      "px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5",
                      showMilestonesOnChart 
                        ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50" 
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    {showMilestonesOnChart ? 'Milestones Visible' : 'Show Milestones'}
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
                  >
                    <Table className="w-4 h-4" />
                    View Schedule
                  </button>
                </div>
              </div>

              {/* Milestone Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {/* 50% Principal Milestone */}
                <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      50% Principal Halved
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                      Milestone 1
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {milestones.halfAccMonth !== null ? formatMonths(milestones.halfAccMonth) : 'N/A'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Balance: {formatCurrency(milestones.halfPrincipalTarget)}
                    {milestones.halfTimeSaved > 0 && (
                      <span className="block text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                        ⚡ Reached {formatMonths(milestones.halfTimeSaved)} faster
                      </span>
                    )}
                  </p>
                </div>

                {/* Debt-Free Milestone */}
                <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                      <Flag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      100% Debt-Free
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      Goal
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatMonths(milestones.payoffAccMonth)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Full loan freedom
                    {summary.timeSavedMonths > 0 && (
                      <span className="block text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                        🎉 Saves {formatMonths(summary.timeSavedMonths)} of payments
                      </span>
                    )}
                  </p>
                </div>

                {/* Standard Baseline Term */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Standard Baseline
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                      Base
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatMonths(milestones.payoffStdMonth)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Original {inputs.loanTermYears}-year payoff
                    <span className="block text-slate-500 dark:text-slate-400 mt-0.5">
                      Interest: {formatCurrency(summary.standardTotalInterest)}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 25, right: 30, left: 20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAccelerated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => `Yr ${Math.round(value / 12)}`}
                      stroke="#94a3b8"
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value >= 100000 ? (value / 100000) + 'L' : (value / 1000) + 'k'}`}
                      stroke="#94a3b8"
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => {
                        const month = Number(label);
                        const yr = Math.floor(month / 12);
                        const mo = month % 12;
                        let labelStr = yr > 0 ? `Year ${yr}${mo > 0 ? ` Month ${mo}` : ''}` : `Month ${mo}`;
                        if (month === milestones.halfAccMonth) {
                          labelStr += ' • 🎯 50% Principal Halved';
                        } else if (month === milestones.payoffAccMonth) {
                          labelStr += ' • 🏁 Loan Fully Paid Off';
                        } else if (milestones.hasLumpSum && month === milestones.lumpSumMonth) {
                          labelStr += ' • 💰 Lump Sum Applied';
                        }
                        return labelStr;
                      }}
                      contentStyle={{ 
                        borderRadius: '14px', 
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', 
                        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.2)',
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        color: isDarkMode ? '#f8fafc' : '#0f172a',
                        padding: '10px 14px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="standardBalance" 
                      name="Standard Balance"
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorStandard)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="acceleratedBalance" 
                      name="With Extra Repayments"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAccelerated)" 
                    />

                    {/* Milestone 1: 50% Principal Halved */}
                    {showMilestonesOnChart && milestones.halfAccMonth !== null && (
                      <ReferenceLine 
                        x={milestones.halfAccMonth} 
                        stroke={isDarkMode ? '#fbbf24' : '#f59e0b'} 
                        strokeDasharray="4 4" 
                        strokeWidth={2}
                        label={{
                          value: `🎯 50% Halved (${formatMonths(milestones.halfAccMonth)})`,
                          position: 'top',
                          fill: isDarkMode ? '#fbbf24' : '#b45309',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      />
                    )}
                    {showMilestonesOnChart && milestones.halfAccMonth !== null && (
                      <ReferenceDot
                        x={milestones.halfAccMonth}
                        y={milestones.halfAccBalance}
                        r={5}
                        fill={isDarkMode ? '#fbbf24' : '#f59e0b'}
                        stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={2}
                      />
                    )}

                    {/* Milestone 2: Fully Paid Off */}
                    {showMilestonesOnChart && (
                      <ReferenceLine 
                        x={milestones.payoffAccMonth} 
                        stroke={isDarkMode ? '#34d399' : '#10b981'} 
                        strokeDasharray="4 4" 
                        strokeWidth={2}
                        label={{
                          value: `🏁 Debt-Free (${formatMonths(milestones.payoffAccMonth)})`,
                          position: 'top',
                          fill: isDarkMode ? '#34d399' : '#047857',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      />
                    )}
                    {showMilestonesOnChart && (
                      <ReferenceDot
                        x={milestones.payoffAccMonth}
                        y={0}
                        r={6}
                        fill={isDarkMode ? '#34d399' : '#10b981'}
                        stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={2}
                      />
                    )}

                    {/* Optional: Lump Sum Point */}
                    {showMilestonesOnChart && milestones.hasLumpSum && (
                      <ReferenceLine 
                        x={milestones.lumpSumMonth} 
                        stroke={isDarkMode ? '#60a5fa' : '#3b82f6'} 
                        strokeDasharray="3 3" 
                        strokeWidth={1.5}
                        label={{
                          value: `💰 Lump Sum (+${formatCurrency(milestones.lumpSumAmount)})`,
                          position: 'insideTopLeft',
                          fill: isDarkMode ? '#93c5fd' : '#2563eb',
                          fontSize: 10,
                          fontWeight: 500
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Amortization Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-colors duration-300"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 border border-black/5 dark:border-white/5"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors duration-300">Annual Amortization Schedule</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">Year-by-year breakdown of your loan balance.</p>
                </div>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto p-6">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold p-4 rounded-l-xl border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">Year</th>
                      <th className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold p-4 text-right border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">Standard Balance</th>
                      <th className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold p-4 text-right border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">Accelerated Balance</th>
                      <th className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold p-4 text-right border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">Standard Interest Paid</th>
                      <th className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold p-4 text-right rounded-r-xl border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">Accelerated Interest Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.amortizationSchedule
                      .filter((row, i) => row.month % 12 === 0 || i === summary.amortizationSchedule.length - 1)
                      .map((row, index, arr) => {
                        // Avoid duplicate rows if the last month happens to be a multiple of 12
                        if (index > 0 && row.month === arr[index - 1].month) return null;
                        const isHalfRow = milestones.halfAccMonth !== null && row.month <= milestones.halfAccMonth && (arr[index + 1]?.month ?? 9999) > milestones.halfAccMonth;
                        const isPayoffRow = row.month >= milestones.payoffAccMonth && (index === 0 || (arr[index - 1]?.month ?? 0) < milestones.payoffAccMonth);

                        return (
                          <tr key={row.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 border-b border-slate-50 dark:border-slate-800/50 text-slate-900 dark:text-slate-300 font-medium transition-colors duration-300">
                              <div className="flex items-center gap-2">
                                <span>{row.month === 0 ? 'Start' : `Year ${Math.round(row.month / 12)}`}</span>
                                {row.month > 0 && isHalfRow && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> 50% Halved
                                  </span>
                                )}
                                {isPayoffRow && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                    <Flag className="w-3 h-3" /> Debt-Free
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 border-b border-slate-50 dark:border-slate-800/50 text-slate-700 dark:text-slate-400 text-right tabular-nums transition-colors duration-300">
                              {row.standardBalance > 0 ? formatCurrency(row.standardBalance) : <span className="text-emerald-500 dark:text-emerald-400 font-medium">Paid Off</span>}
                            </td>
                            <td className="p-4 border-b border-slate-50 dark:border-slate-800/50 text-slate-700 dark:text-slate-400 text-right tabular-nums transition-colors duration-300">
                              {row.acceleratedBalance > 0 ? formatCurrency(row.acceleratedBalance) : <span className="text-emerald-500 dark:text-emerald-400 font-medium">Paid Off</span>}
                            </td>
                            <td className="p-4 border-b border-slate-50 dark:border-slate-800/50 text-slate-500 dark:text-slate-500 text-right tabular-nums transition-colors duration-300">
                              {formatCurrency(row.standardTotalInterest)}
                            </td>
                            <td className="p-4 border-b border-slate-50 dark:border-slate-800/50 text-slate-500 dark:text-slate-500 text-right tabular-nums transition-colors duration-300">
                              {formatCurrency(row.acceleratedTotalInterest)}
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

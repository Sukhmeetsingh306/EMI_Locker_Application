// app/(dashboard)/emis/create/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createEmi } from '@/src/features/emis/api';
import apiClient from '@/src/lib/api-client';
import { Plus, X, ArrowLeft, User, FileText, Calendar, DollarSign, Loader2, Settings, Percent } from 'lucide-react';

export default function CreateEmiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');
  
  const [form, setForm] = useState({
    userId: userIdFromQuery || '',
    principalAmount: '',
    interestPercentage: '0', // Default 10%
    totalAmount: '',
    description: '',
    paymentScheduleType: '', // Default to empty - user must choose
    startDate: '',
    dueDates: [1], // Default to 1st of month
  });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [scheduleMode, setScheduleMode] = useState('equal'); // 'equal' or 'custom'
  const [customSchedule, setCustomSchedule] = useState([]);
  const startDateInputRef = useRef(null);

  useEffect(() => {
    // Fetch users for dropdown
    (async () => {
      try {
        const res = await apiClient.get('/users');
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload) ? payload : payload.data || [];
        setUsers(list);
      } catch (err) {
        console.error('fetch users for emi', err);
      }
    })();
  }, []);

  // Update userId if it comes from query params
  useEffect(() => {
    if (userIdFromQuery) {
      setForm((prev) => ({ ...prev, userId: userIdFromQuery }));
    }
  }, [userIdFromQuery]);

  // Update custom schedule dates when start date changes
  useEffect(() => {
    if (form.startDate && customSchedule.length > 0) {
      const startDate = new Date(form.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      setCustomSchedule(prevSchedule => {
        const updatedSchedule = prevSchedule.map(item => {
          if (item.dueDate) {
            const dueDate = new Date(item.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            // If due date is before start date, update it to start date
            if (dueDate < startDate) {
              const newDueDateStr = startDate.toISOString().split('T')[0];
              
              return {
                ...item,
                dueDate: newDueDateStr,
                dueDay: startDate.getDate(),
              };
            }
          }
          return item;
        });
        
        // Only return updated schedule if there were changes
        const hasChanges = updatedSchedule.some((item, index) => {
          const original = prevSchedule[index];
          return item.dueDate !== original.dueDate;
        });
        
        return hasChanges ? updatedSchedule : prevSchedule;
      });
    }
  }, [form.startDate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Handle principal amount change - calculate total
    if (name === 'principalAmount') {
      const principal = parseFloat(value) || 0;
      const interestPercent = parseFloat(form.interestPercentage) || 0;
      const total = principal * (1 + interestPercent / 100);
      setForm((s) => ({ 
        ...s, 
        principalAmount: value,
        totalAmount: principal > 0 ? total.toFixed(2) : ''
      }));
    }
    // Handle interest percentage change - calculate total
    else if (name === 'interestPercentage') {
      const principal = parseFloat(form.principalAmount) || 0;
      const interestPercent = parseFloat(value) || 0;
      const total = principal * (1 + interestPercent / 100);
      setForm((s) => ({ 
        ...s, 
        interestPercentage: value,
        totalAmount: principal > 0 ? total.toFixed(2) : ''
      }));
    }
    // Handle total amount change - calculate principal (reverse calculation)
    else if (name === 'totalAmount') {
      const total = parseFloat(value) || 0;
      const interestPercent = parseFloat(form.interestPercentage) || 0;
      if (interestPercent > 0 && total > 0) {
        const principal = total / (1 + interestPercent / 100);
        setForm((s) => ({ 
          ...s, 
          totalAmount: value,
          principalAmount: principal.toFixed(2)
        }));
      } else {
        setForm((s) => ({ ...s, [name]: value }));
      }
    }
    // Handle start date change - will trigger useEffect to update custom schedule
    else if (name === 'startDate') {
      setForm((s) => ({ ...s, [name]: value }));
    }
    else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  const handleAddDueDate = () => {
    if (form.dueDates.length >= 31) {
      alert('Maximum 31 due dates allowed');
      return;
    }
    setForm((prev) => ({
      ...prev,
      dueDates: [...prev.dueDates, 1],
    }));
  };

  const handleRemoveDueDate = (index) => {
    if (form.dueDates.length <= 1) {
      alert('At least one due date is required');
      return;
    }
    setForm((prev) => ({
      ...prev,
      dueDates: prev.dueDates.filter((_, i) => i !== index),
    }));
  };

  const handleDueDateChange = (index, value) => {
    const day = parseInt(value);
    if (day < 1 || day > 31) return;
    setForm((prev) => {
      const newDueDates = [...prev.dueDates];
      newDueDates[index] = day;
      return { ...prev, dueDates: newDueDates };
    });
  };

  // Generate payment schedule preview for equal installments
  const generateEqualSchedulePreview = () => {
    if (!form.startDate || !form.totalAmount || form.dueDates.length === 0) {
      return [];
    }

    const start = new Date(form.startDate);
    start.setHours(0, 0, 0, 0); // Reset time to compare dates only
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    const months = parseInt(form.paymentScheduleType);
    const preview = [];
    let installmentNumber = 1;

    const totalInstallments = months * form.dueDates.length;
    const equalAmount = form.totalAmount / totalInstallments;

    // Determine starting month offset
    // If all due dates in the start month are before or equal to start date, start from next month
    let startingMonthOffset = 0;
    
    // Check all due dates in the start month
    const startMonthDueDates = form.dueDates.map(dueDay => {
      const testDate = new Date(start.getFullYear(), start.getMonth(), dueDay);
      if (testDate.getDate() !== dueDay) {
        testDate.setDate(0); // Last day of month if day doesn't exist
      }
      testDate.setHours(0, 0, 0, 0);
      return testDate;
    });
    
    // If all due dates in start month are before or equal to start date, start from next month
    const allDueDatesBeforeStart = startMonthDueDates.every(dueDate => dueDate <= start);
    if (allDueDatesBeforeStart && startMonthDueDates.length > 0) {
      startingMonthOffset = 1;
    }

    for (let monthOffset = startingMonthOffset; monthOffset < months + startingMonthOffset; monthOffset++) {
      for (const dueDay of form.dueDates) {
        const installmentDate = new Date(start.getFullYear(), start.getMonth() + monthOffset, dueDay);
        if (installmentDate.getDate() !== dueDay) {
          installmentDate.setDate(0); // Last day of month if day doesn't exist
        }
        
        // Set time to midnight for comparison
        installmentDate.setHours(0, 0, 0, 0);
        
        // Skip dates that are before or equal to start date
        // Only include dates that are after the start date
        if (installmentDate <= start) {
          continue;
        }
        
        preview.push({
          installmentNumber: installmentNumber++,
          amount: equalAmount,
          percentage: (equalAmount / form.totalAmount) * 100,
          dueDay,
          dueDate: installmentDate,
          month: installmentDate.getMonth() + 1,
          year: installmentDate.getFullYear(),
        });
      }
    }

    return preview;
  };

  // Add new custom schedule item
  const handleAddCustomScheduleItem = () => {
    // Calculate a default date that's after start date (1 day after if start date exists)
    let defaultDueDate = '';
    if (form.startDate) {
      const startDate = new Date(form.startDate);
      startDate.setDate(startDate.getDate() + 1); // Add 1 day to ensure it's after start date
      defaultDueDate = startDate.toISOString().split('T')[0];
    }
    
    const newItem = {
      installmentNumber: customSchedule.length + 1,
      dueDate: defaultDueDate,
      dueDay: defaultDueDate ? new Date(defaultDueDate).getDate() : (form.dueDates[0] || 1),
      amount: '',
    };
    setCustomSchedule([...customSchedule, newItem]);
  };

  // Handle custom schedule changes
  const handleCustomScheduleChange = (index, field, value) => {
    // Validate due date is on or after start date
    if (field === 'dueDate' && value && form.startDate) {
      const startDate = new Date(form.startDate);
      startDate.setHours(0, 0, 0, 0);
      const dueDate = new Date(value);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < startDate) {
        alert(`Due date must be on or after the start date (${form.startDate}). Please select a date on or after ${form.startDate}.`);
        return;
      }
    }

    const updated = [...customSchedule];
    updated[index] = { ...updated[index], [field]: value };

    // Update dueDay if dueDate changes
    if (field === 'dueDate' && value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        updated[index].dueDay = date.getDate();
      }
    }

    setCustomSchedule(updated);
  };

  // Distribute remaining amount equally among empty installments
  const distributeRemaining = () => {
    if (customSchedule.length === 0) {
      alert('Please add installments first.');
      return;
    }
    
    const totalAmount = parseFloat(form.totalAmount) || 0;
    if (totalAmount <= 0) {
      alert('Please enter a total amount first.');
      return;
    }

    const usedAmount = customSchedule.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    const remainingAmount = totalAmount - usedAmount;
    
    if (remainingAmount <= 0) {
      alert('All amount has been allocated. No remaining amount to distribute.');
      return;
    }

    // Find items without amount
    const itemsWithoutAmount = customSchedule.filter(item => !item.amount || parseFloat(item.amount) === 0);
    
    if (itemsWithoutAmount.length === 0) {
      alert('All installments have amounts. Please clear some amounts to distribute remaining.');
      return;
    }

    const amountPerItem = remainingAmount / itemsWithoutAmount.length;
    
    const newSchedule = customSchedule.map(item => {
      if (!item.amount || parseFloat(item.amount) === 0) {
        return {
          ...item,
          amount: amountPerItem.toFixed(2),
        };
      }
      return item;
    });
    
    setCustomSchedule(newSchedule);
  };

  const handleRemoveCustomScheduleItem = (index) => {
    setCustomSchedule(customSchedule.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      installmentNumber: idx + 1,
    })));
  };

  const schedulePreview = scheduleMode === 'equal' ? generateEqualSchedulePreview() : customSchedule;
  const totalPreview = schedulePreview.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Validate required fields
      if (!form.userId) {
        alert('Please select a user');
        setSaving(false);
        return;
      }
      
      // Validate all required fields
      if (!form.userId || form.userId === '') {
        alert('Please select a user');
        setSaving(false);
        return;
      }
      if (!form.principalAmount || form.principalAmount === '' || parseFloat(form.principalAmount) <= 0) {
        alert('Please enter a valid principal amount');
        setSaving(false);
        return;
      }
      if (form.interestPercentage === '' || form.interestPercentage === undefined || form.interestPercentage === null) {
        alert('Please enter interest/markup percentage');
        setSaving(false);
        return;
      }
      if (!form.totalAmount || form.totalAmount === '' || parseFloat(form.totalAmount) <= 0) {
        alert('Please enter a valid total amount');
        setSaving(false);
        return;
      }
      if (!form.description || form.description.trim() === '') {
        alert('Please enter a description');
        setSaving(false);
        return;
      }
      // Payment duration is only required for equal installments mode
      // Not required for custom schedule mode
      if (scheduleMode === 'equal' && (!form.paymentScheduleType || form.paymentScheduleType === '')) {
        alert('Please select payment duration');
        setSaving(false);
        return;
      }
      if (!form.startDate || form.startDate === '') {
        alert('Please select a start date');
        setSaving(false);
        return;
      }

      // Validate that total amount matches calculation (allow small rounding differences)
      const principal = parseFloat(form.principalAmount) || 0;
      const interestPercent = parseFloat(form.interestPercentage) || 0;
      const calculatedTotal = principal * (1 + interestPercent / 100);
      const enteredTotal = parseFloat(form.totalAmount) || 0;
      
      // Use calculated total if there's a significant difference (allow small rounding differences)
      const finalTotalAmount = Math.abs(calculatedTotal - enteredTotal) > 0.01 
        ? calculatedTotal 
        : enteredTotal;

      // Due dates are only required for equal installments mode
      // For custom schedule, dates are in paymentSchedule items
      if (scheduleMode === 'equal') {
        if (!form.dueDates || form.dueDates.length === 0) {
          alert('Please add at least one due date');
          setSaving(false);
          return;
        }

        // Validate due dates
        for (const day of form.dueDates) {
          if (day < 1 || day > 31) {
            alert('Due dates must be between 1 and 31');
            setSaving(false);
            return;
          }
        }
      }

      // Build payment schedule if custom
      let paymentSchedule = null;
      if (scheduleMode === 'custom') {
        // Validate that at least one installment is added
        if (customSchedule.length === 0) {
          alert('Please add at least one installment to the custom schedule');
          setSaving(false);
          return;
        }
        // Validate custom schedule
        if (customSchedule.some(item => !item.dueDate && !item.dueDay)) {
          alert('Please provide a due date for all installments');
          setSaving(false);
          return;
        }

        // Validate that all due dates are on or after start date
        if (form.startDate) {
          const startDate = new Date(form.startDate);
          startDate.setHours(0, 0, 0, 0);
          
          const invalidDates = customSchedule.filter(item => {
            if (item.dueDate) {
              const dueDate = new Date(item.dueDate);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate < startDate;
            }
            return false;
          });
          
          if (invalidDates.length > 0) {
            alert(`All due dates must be on or after the start date (${form.startDate}). Please update the dates for installments: ${invalidDates.map((_, idx) => `#${invalidDates[idx].installmentNumber}`).join(', ')}`);
            setSaving(false);
            return;
          }
        }

        // Validate that all installments have amounts
        if (customSchedule.some(item => !item.amount || parseFloat(item.amount) <= 0)) {
          alert('Please enter a valid amount for all installments');
          setSaving(false);
          return;
        }

        // Calculate total of custom schedule amounts
        const customScheduleTotal = customSchedule.reduce((sum, item) => {
          return sum + (parseFloat(item.amount) || 0);
        }, 0);

        // Validate that custom schedule total equals the total amount (allow small rounding differences)
        const difference = Math.abs(customScheduleTotal - finalTotalAmount);
        if (difference > 0.01) {
          alert(`The sum of all installment amounts (₹${customScheduleTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) must equal the total amount (₹${finalTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Please adjust the amounts.`);
          setSaving(false);
          return;
        }

        paymentSchedule = customSchedule.map((item) => {
          const scheduleItem = {
            amount: item.amount ? parseFloat(item.amount) : null,
          };

          if (item.dueDate) {
            scheduleItem.dueDate = item.dueDate;
          } else if (item.dueDay) {
            scheduleItem.dueDay = parseInt(item.dueDay);
          }

          return scheduleItem;
        }).filter(item => item.amount !== null && item.amount > 0);
      }
      
      // Create payload with proper type conversion
      // Convert to strings first to handle edge cases
      const principalAmountStr = String(form.principalAmount || '').trim();
      const interestPercentageStr = String(form.interestPercentage || '0').trim();
      
      // Validate strings are not empty before parsing
      if (!principalAmountStr || principalAmountStr === '') {
        alert('Please enter a principal amount');
        setSaving(false);
        return;
      }
      
      const principalAmount = parseFloat(principalAmountStr);
      const interestPercentage = parseFloat(interestPercentageStr);
      const totalAmount = finalTotalAmount;
      
      // Final validation of numeric values
      if (isNaN(principalAmount) || !isFinite(principalAmount) || principalAmount <= 0) {
        alert(`Please enter a valid principal amount. Current value: "${form.principalAmount}"`);
        setSaving(false);
        return;
      }
      if (isNaN(interestPercentage) || !isFinite(interestPercentage) || interestPercentage < 0) {
        alert(`Please enter a valid interest percentage. Current value: "${form.interestPercentage}"`);
        setSaving(false);
        return;
      }
      if (isNaN(totalAmount) || !isFinite(totalAmount) || totalAmount <= 0) {
        alert(`Please enter a valid total amount. Current value: "${form.totalAmount}"`);
        setSaving(false);
        return;
      }
      
      // Determine paymentScheduleType
      // For custom schedule, paymentScheduleType is not required
      // For equal installments, it's required
      let finalPaymentScheduleType = null;
      if (scheduleMode === 'equal') {
        finalPaymentScheduleType = form.paymentScheduleType;
        if (!finalPaymentScheduleType || finalPaymentScheduleType === '') {
          alert('Please select payment duration');
          setSaving(false);
          return;
        }
      }
      // For custom schedule, we don't need paymentScheduleType
      
      const payload = {
        userId: String(form.userId || '').trim(),
        principalAmount: Number(principalAmount.toFixed(2)), // Ensure it's a proper number
        interestPercentage: Number(interestPercentage.toFixed(2)), // Ensure it's a proper number
        totalAmount: Number(totalAmount.toFixed(2)), // Ensure it's a proper number
        description: String(form.description || '').trim(),
        startDate: String(form.startDate || '').trim(),
        // For custom schedule, dueDates can be empty array since dates are in paymentSchedule
        // For equal installments, dueDates are required
        dueDates: scheduleMode === 'custom' 
          ? [] 
          : form.dueDates.map(d => parseInt(d)).filter(d => !isNaN(d) && d >= 1 && d <= 31),
        // Always include paymentSchedule when in custom mode (even if empty)
        // This helps backend distinguish between equal installments and custom schedule modes
        ...(scheduleMode === 'custom' && { paymentSchedule: paymentSchedule || [] }),
      };
      
      // Only include paymentScheduleType for equal installments mode
      if (scheduleMode === 'equal' && finalPaymentScheduleType) {
        payload.paymentScheduleType = finalPaymentScheduleType;
      }
      
      // // Explicitly delete paymentScheduleType for custom mode to ensure it's not sent
      if (scheduleMode === 'custom' && payload.paymentScheduleType) {
        delete payload.paymentScheduleType;
      }

      // Final check that all required fields are present
      if (!payload.userId || payload.userId === '') {
        alert('Please select a user');
        setSaving(false);
        return;
      }
      if (!payload.principalAmount || isNaN(payload.principalAmount) || payload.principalAmount <= 0) {
        alert('Please enter a valid principal amount');
        setSaving(false);
        return;
      }
      if (payload.interestPercentage === undefined || isNaN(payload.interestPercentage) || payload.interestPercentage < 0) {
        alert('Please enter a valid interest percentage');
        setSaving(false);
        return;
      }
      if (!payload.totalAmount || isNaN(payload.totalAmount) || payload.totalAmount <= 0) {
        alert('Please enter a valid total amount');
        setSaving(false);
        return;
      }
      if (!payload.description || payload.description.trim() === '') {
        alert('Please enter a description');
        setSaving(false);
        return;
      }
      // Payment duration is only required for equal installments mode
      if (scheduleMode === 'equal' && (!payload.paymentScheduleType || payload.paymentScheduleType === '')) {
        alert('Please select payment duration');
        setSaving(false);
        return;
      }
      if (!payload.startDate || payload.startDate === '') {
        alert('Please select a start date');
        setSaving(false);
        return;
      }
      // Due dates are only required for equal installments mode
      if (scheduleMode === 'equal' && (!payload.dueDates || payload.dueDates.length === 0)) {
        alert('Please add at least one due date');
        setSaving(false);
        return;
      }
      
      await createEmi(payload);
      router.push('/emis');
    } catch (err) {
      console.error('create emi', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Create EMI failed';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = users.find(u => u._id === form.userId);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to EMIs
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Create New EMI</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Fill in the details below to create a new EMI plan
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Select User</h2>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              User <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select 
                name="userId" 
                value={form.userId} 
                onChange={onChange} 
                required 
                disabled={saving || !!userIdFromQuery}
                className="w-full px-4 py-3 pl-11 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option value={u._id} key={u._id}>
                    {u.fullName || u.name} — {u.mobile} {u.email ? `(${u.email})` : ''}
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* EMI Details Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">EMI Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* First Row: Principal, Interest, Total */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Principal Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                <input 
                  name="principalAmount" 
                  type="number"
                  step="0.01"
                  value={form.principalAmount} 
                  onChange={onChange} 
                  required 
                  placeholder="0.00"
                  disabled={saving}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Interest/Markup Percentage <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">%</span>
                <input 
                  name="interestPercentage" 
                  type="number"
                  step="0.01"
                  value={form.interestPercentage} 
                  onChange={onChange} 
                  required 
                  placeholder="10.00"
                  disabled={saving}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                <input 
                  name="totalAmount" 
                  type="number"
                  step="0.01"
                  value={form.totalAmount} 
                  readOnly
                  required 
                  placeholder="0.00"
                  disabled={saving}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-sm font-semibold text-emerald-900 dark:text-emerald-100 outline-none cursor-not-allowed"
                />
              </div>
              {form.principalAmount && form.interestPercentage && form.totalAmount && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ₹{parseFloat(form.principalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + ({form.interestPercentage}% × ₹{parseFloat(form.principalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) = ₹{parseFloat(form.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Auto-calculated: Principal + (Principal × Interest%)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Second Row: Start Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div 
                className="relative cursor-pointer"
                onClick={(e) => {
                  if (!saving && startDateInputRef.current) {
                    e.preventDefault();
                    startDateInputRef.current.focus();
                    if (startDateInputRef.current.showPicker) {
                      startDateInputRef.current.showPicker();
                    } else {
                      startDateInputRef.current.click();
                    }
                  }
                }}
              >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                <input 
                  ref={startDateInputRef}
                  name="startDate" 
                  type="date" 
                  value={form.startDate} 
                  onChange={onChange} 
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={saving}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Third Row: Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                required
                placeholder="Enter EMI description (e.g., Rice bag of 5 kg, Sugar bag of 10 kg, etc.)"
                disabled={saving}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Schedule Mode Selection */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Payment Schedule
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScheduleMode('equal')}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scheduleMode === 'equal'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                Equal Installments
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('custom')}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scheduleMode === 'custom'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                Custom Schedule
              </button>
            </div>
          </div>

          {scheduleMode === 'equal' ? (
            <>
              {/* Due Dates Card for Equal Mode */}
              <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 shadow-sm">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-zinc-900 dark:text-white">
                        Due Dates Per Month <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Specify which days of the month payments are due
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDueDate}
                    disabled={saving || form.dueDates.length >= 31}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="h-4 w-4" />
                    Add Date
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {form.dueDates.map((day, index) => (
                    <div key={index} className="group flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={day}
                          onChange={(e) => handleDueDateChange(index, e.target.value)}
                          disabled={saving}
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white disabled:opacity-50"
                        />
                      </div>
                      {form.dueDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDueDate(index)}
                          disabled={saving}
                          className="p-2.5 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/50 dark:hover:to-rose-900/50 text-red-600 dark:text-red-400 transition-all duration-200 group-hover:scale-105 hover:shadow-md hover:shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove date"
                        >
                          <X className="h-4 w-4 font-bold" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview for Equal Mode */}
              {form.startDate && form.totalAmount && form.dueDates.length > 0 && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        Payment Duration <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select 
                          name="paymentScheduleType" 
                          value={form.paymentScheduleType} 
                          onChange={onChange} 
                          required
                          disabled={saving}
                          className="w-full px-4 py-3 pl-11 pr-10 rounded-xl border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                        >
                          <option value="">Choose duration...</option>
                          <option value="1">1 Month</option>
                          <option value="3">3 Months</option>
                          <option value="6">6 Months</option>
                          <option value="9">9 Months</option>
                          <option value="12">12 Months</option>
                          <option value="18">18 Months</option>
                        </select>
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {form.paymentScheduleType && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-emerald-200 dark:border-emerald-800">
                        <div className="p-4 rounded-lg bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Total Installments</p>
                          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{schedulePreview.length}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Each Installment</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{(totalPreview / schedulePreview.length).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            ₹{totalPreview.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                            {form.paymentScheduleType} {form.paymentScheduleType === '1' ? 'Month' : 'Months'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Custom Schedule Mode */}
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                      Custom Payment Schedule
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Use "Distribute" to automatically split the remaining amount equally.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={distributeRemaining}
                      disabled={saving || customSchedule.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
                      title="Distribute remaining amount equally among empty installments"
                    >
                      <Percent className="h-4 w-4" />
                      Distribute
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomScheduleItem}
                      disabled={saving || !form.startDate}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="h-4 w-4" />
                      Add Installment
                    </button>
                  </div>
                </div>

                {/* Summary Card */}
                {customSchedule.length > 0 && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Total Installments</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{customSchedule.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Allocated Amount</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{totalPreview.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                          ₹{parseFloat(form.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                     
                      </div>
                    </div>
                  </div>
                )}

                {/* Installments List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {customSchedule.map((item, index) => (
                    <div key={index} className="group p-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-base">#{item.installmentNumber}</span>
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Installment #{item.installmentNumber}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Due Date <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                            <input
                              type="date"
                              value={item.dueDate || ''}
                              onChange={(e) => handleCustomScheduleChange(index, 'dueDate', e.target.value)}
                              min={form.startDate || ''}
                              className="w-full pl-9 pr-2 py-2 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Amount (₹) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount || ''}
                              onChange={(e) => handleCustomScheduleChange(index, 'amount', e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-2 py-2 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomScheduleItem(index)}
                            className="relative w-full h-[36px] rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/50 dark:hover:to-rose-900/50 text-red-600 dark:text-red-400 transition-all duration-200 group-hover:scale-105 hover:shadow-md hover:shadow-red-500/20 active:scale-95"
                            title="Remove installment"
                          >
                            <X className="h-4 w-4 mx-auto font-bold" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {customSchedule.length === 0 && (
                  <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                      <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                      No Installments Added
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                      Start creating your custom payment schedule by adding installments. Each installment can have a different amount and due date.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddCustomScheduleItem}
                      disabled={saving || !form.startDate}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Installment
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <button 
          type="submit" 
          disabled={saving} 
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create EMI'
          )}
        </button>
      </form>
    </div>
  );
}

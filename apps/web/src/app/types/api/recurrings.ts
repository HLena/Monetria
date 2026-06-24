export type RecurringType = 'Income' | 'Expense' | 'Transfer'
export type RecurringAmountType = 'Fixed' | 'Estimated' | 'VariableFree'
export type RecurringFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Yearly'

export interface Recurring {
  name: string
  type: RecurringType
  accountId: string
  toAccountId?: string
  categoryId?: string
  amountType: RecurringAmountType
  amount?: number
  estimatedAmount?: number
  frequency: RecurringFrequency
  startDate: string        // 'YYYY-MM-DD'
  endDate?: string         // 'YYYY-MM-DD'
  notes?: string
}
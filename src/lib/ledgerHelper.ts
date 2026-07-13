import connectToDatabase from '@/lib/db';
import LedgerAccount from '@/models/LedgerAccount';
import LedgerTransaction from '@/models/LedgerTransaction';

/**
 * Seed primary ledger accounts if they do not exist
 */
export async function seedLedgerAccounts() {
  await connectToDatabase();

  const accounts: { name: string; code: 'CASH' | 'BANK' | 'AR' | 'AP'; type: 'asset' | 'liability' }[] = [
    { name: 'Cash', code: 'CASH', type: 'asset' },
    { name: 'Bank', code: 'BANK', type: 'asset' },
    { name: 'Accounts Receivable', code: 'AR', type: 'asset' },
    { name: 'Accounts Payable', code: 'AP', type: 'liability' },
  ];

  for (const acc of accounts) {
    const exists = await LedgerAccount.findOne({ code: acc.code });
    if (!exists) {
      await LedgerAccount.create({
        name: acc.name,
        code: acc.code,
        type: acc.type,
        openingBalance: 0,
        currentBalance: 0,
      });
    }
  }
}

/**
 * Log a transaction to the ledger
 */
export async function logLedgerTransaction(
  accountCode: 'CASH' | 'BANK' | 'AR' | 'AP',
  type: 'debit' | 'credit',
  amount: number,
  description: string,
  reference?: string,
  date: Date = new Date()
) {
  await connectToDatabase();
  await seedLedgerAccounts();

  // Find account
  const account = await LedgerAccount.findOne({ code: accountCode });
  if (!account) {
    throw new Error(`Ledger account not found with code: ${accountCode}`);
  }

  // Calculate balanceAfter
  // For assets: debit increases, credit decreases
  // For liabilities: credit increases, debit decreases
  const change = account.type === 'liability'
    ? (type === 'credit' ? amount : -amount)
    : (type === 'debit' ? amount : -amount);
  const balanceAfter = account.currentBalance + change;

  // Create transaction
  const transaction = new LedgerTransaction({
    account: account._id,
    date,
    description,
    type,
    amount,
    reference,
    balanceAfter,
  });

  await transaction.save();

  // Update current account balance
  account.currentBalance = balanceAfter;
  await account.save();

  return transaction;
}

/**
 * Recalculate ledger balance for an account
 */
export async function recalculateLedgerBalance(accountCode: 'CASH' | 'BANK' | 'AR' | 'AP') {
  await connectToDatabase();
  const account = await LedgerAccount.findOne({ code: accountCode });
  if (!account) return;

  const transactions = await LedgerTransaction.find({ account: account._id }).sort({ date: 1, createdAt: 1 });

  let runningBalance = account.openingBalance || 0;

  for (const tx of transactions) {
    const change = account.type === 'liability'
      ? (tx.type === 'credit' ? tx.amount : -tx.amount)
      : (tx.type === 'debit' ? tx.amount : -tx.amount);
    runningBalance += change;
    tx.balanceAfter = runningBalance;
    await tx.save();
  }

  account.currentBalance = runningBalance;
  await account.save();
}

/**
 * Log order payment to the ledger
 */
export async function logOrderPaymentToLedger(order: any) {
  try {
    await connectToDatabase();
    
    // Determine account code based on paymentMethod
    // Online -> BANK, others (COD, Manual) -> CASH
    const accountCode = order.paymentMethod === 'Online' ? 'BANK' : 'CASH';
    
    const amount = order.totalAmount || 0;
    const orderIdStr = order._id.toString();
    const shortId = orderIdStr.slice(-8).toUpperCase();
    
    const description = `Customer payment received for Order #${shortId}`;
    const reference = `ORDER-${shortId}`;
    
    // Ensure idempotency: check if transaction with this reference already exists
    const exists = await LedgerTransaction.findOne({ reference });
    if (exists) {
      console.log(`[Ledger] Entry already exists for order reference: ${reference}`);
      return;
    }
    
    await logLedgerTransaction(
      accountCode,
      'debit', // Debit increases Cash or Bank
      amount,
      description,
      reference,
      order.createdAt ? new Date(order.createdAt) : new Date()
    );
    console.log(`[Ledger] Logged payment for Order #${shortId} to ${accountCode} successfully.`);
  } catch (error) {
    console.error('[Ledger] Error logging order payment to ledger:', error);
  }
}

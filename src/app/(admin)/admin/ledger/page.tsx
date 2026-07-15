'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Plus,
  Search,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Wallet,
  Landmark,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination';

export default function AccountsLedgerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [journalSearchTerm, setJournalSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  // Editing Opening Balance state
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);
  const [updatingOpening, setUpdatingOpening] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [journalSearchTerm, dateFilter.from, dateFilter.to]);

  // Manual Transaction Dialog state
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [entryType, setEntryType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [accountCode, setAccountCode] = useState<'CASH' | 'BANK'>('CASH');
  const [fromAccountCode, setFromAccountCode] = useState<'CASH' | 'BANK'>('CASH');
  const [toAccountCode, setToAccountCode] = useState<'CASH' | 'BANK'>('BANK');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [creatingTx, setCreatingTx] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/ledger/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ledger/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      toast.error('Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setUpdatingOpening(true);
      const res = await fetch('/api/admin/ledger/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingAccount.code,
          openingBalance: newOpeningBalance,
        }),
      });

      if (!res.ok) throw new Error('Failed to update opening balance');
      toast.success(`${editingAccount.name} opening balance updated!`);
      setEditingAccount(null);
      fetchAccounts();
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to update opening balance');
    } finally {
      setUpdatingOpening(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      toast.error('Amount must be positive and description is required');
      return;
    }

    try {
      setCreatingTx(true);
      const payload = {
        entryType,
        amount,
        description,
        date,
        accountCode: entryType !== 'transfer' ? accountCode : undefined,
        fromAccountCode: entryType === 'transfer' ? fromAccountCode : undefined,
        toAccountCode: entryType === 'transfer' ? toAccountCode : undefined,
      };

      const res = await fetch('/api/admin/ledger/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Transaction logging failed');
      }

      toast.success('Ledger entry recorded successfully!');
      setIsTxOpen(false);
      resetTxForm();
      fetchAccounts();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log transaction');
    } finally {
      setCreatingTx(false);
    }
  };

  const resetTxForm = () => {
    setEntryType('deposit');
    setAccountCode('CASH');
    setFromAccountCode('CASH');
    setToAccountCode('BANK');
    setAmount(0);
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const filteredTransactions = transactions.filter((tx) => {
    const term = journalSearchTerm.toLowerCase();
    const name = tx.account?.name?.toLowerCase() || '';
    const desc = tx.description?.toLowerCase() || '';
    const ref = tx.reference?.toLowerCase() || '';
    const matchesSearch = name.includes(term) || desc.includes(term) || ref.includes(term);

    let matchesDate = true;
    if (dateFilter.from) {
      matchesDate = matchesDate && new Date(tx.date) >= new Date(dateFilter.from + 'T00:00:00');
    }
    if (dateFilter.to) {
      matchesDate = matchesDate && new Date(tx.date) <= new Date(dateFilter.to + 'T23:59:59');
    }

    return matchesSearch && matchesDate;
  });

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts Ledger</h2>
          <p className="text-muted-foreground text-sm">
            Manage cash & bank opening balances, record manual entries, and track account receivables.
          </p>
        </div>
        <Button onClick={() => setIsTxOpen(true)} className="w-full md:w-auto bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> New Journal Entry
        </Button>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const isCash = acc.code === 'CASH';
          const isBank = acc.code === 'BANK';

          return (
            <Card key={acc._id} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {acc.name}
                </CardTitle>
                {isCash ? (
                  <Wallet className="h-5 w-5 text-primary" />
                ) : isBank ? (
                  <Landmark className="h-5 w-5 text-primary" />
                ) : (
                  <DollarSign className="h-5 w-5 text-primary" />
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold tracking-tight">${Math.round(acc.currentBalance)}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>Opening: ${Math.round(acc.openingBalance || 0)}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setEditingAccount(acc);
                      setNewOpeningBalance(acc.openingBalance || 0);
                    }}
                    className="h-6 px-2 hover:bg-muted"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transactions Journal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Transaction Journal</CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description or reference..."
                  className="pl-8"
                  value={journalSearchTerm}
                  onChange={(e) => setJournalSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border text-sm">
                <Input
                  type="date"
                  className="h-8 w-36 border-none bg-transparent focus-visible:ring-0"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  className="h-8 w-36 border-none bg-transparent focus-visible:ring-0"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              {(dateFilter.from || dateFilter.to || journalSearchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilter({ from: '', to: '' });
                    setJournalSearchTerm('');
                  }}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <Plus className="h-10 w-10 mb-2 stroke-1" />
              <p>No journal entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount ($)</TableHead>
                    <TableHead className="text-right">Running Balance ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{tx.account?.name}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p>{tx.description}</p>
                          {tx.reference && (
                            <span className="text-xs text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                              Ref: {tx.reference}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.type === 'debit' ? 'default' : 'outline'}
                          className={tx.type === 'debit' ? 'bg-primary/20 text-primary hover:bg-primary/20 border-transparent' : ''}
                        >
                          {tx.type === 'debit' ? 'Debit (+)' : 'Credit (-)'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">${Math.round(tx.amount)}</TableCell>
                      <TableCell className="text-right font-semibold">${Math.round(tx.balanceAfter)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="py-4 border-t bg-background px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Opening Balance Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => { if (!open) setEditingAccount(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Opening Balance — {editingAccount?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateOpeningBalance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openingBal">Opening Balance ($)</Label>
              <Input
                id="openingBal"
                type="number"
                value={newOpeningBalance}
                onChange={(e) => setNewOpeningBalance(parseFloat(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Note: Changing the opening balance will recalculate the entire ledger running balance.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingAccount(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingOpening} className="bg-primary text-primary-foreground">
                {updatingOpening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Balance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Transaction Dialog */}
      <Dialog open={isTxOpen} onOpenChange={(open) => { setIsTxOpen(open); if(!open) resetTxForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txType">Entry Type</Label>
              <Select
                value={entryType}
                onValueChange={(val: any) => setEntryType(val)}
              >
                <SelectTrigger id="txType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit (Cash In / Credit to Bank)</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal (Cash Out / Expense)</SelectItem>
                  <SelectItem value="transfer">Transfer (Cash to Bank / Bank to Cash)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {entryType === 'transfer' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromAcc">From Account</Label>
                  <Select
                    value={fromAccountCode}
                    onValueChange={(val: any) => {
                      setFromAccountCode(val);
                      if (val === toAccountCode) {
                        setToAccountCode(val === 'CASH' ? 'BANK' : 'CASH');
                      }
                    }}
                  >
                    <SelectTrigger id="fromAcc">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toAcc">To Account</Label>
                  <Select
                    value={toAccountCode}
                    onValueChange={(val: any) => {
                      setToAccountCode(val);
                      if (val === fromAccountCode) {
                        setFromAccountCode(val === 'CASH' ? 'BANK' : 'CASH');
                      }
                    }}
                  >
                    <SelectTrigger id="toAcc">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="accCode">Target Account</Label>
                <Select
                  value={accountCode}
                  onValueChange={(val: any) => setAccountCode(val)}
                >
                  <SelectTrigger id="accCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash Account</SelectItem>
                    <SelectItem value="BANK">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="txAmount">Amount ($)</Label>
                <Input
                  id="txAmount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="txDate">Transaction Date</Label>
                <Input
                  id="txDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txDesc">Description / Remarks</Label>
              <Input
                id="txDesc"
                placeholder="e.g. Received cash payment or petty cash deposit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTxOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingTx} className="bg-primary text-primary-foreground">
                {creatingTx && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

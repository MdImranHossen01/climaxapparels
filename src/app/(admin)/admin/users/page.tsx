'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Loader2, 
  User as UserIcon, 
  Eye, 
  ShieldAlert, 
  Calendar,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  UserCog,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import Image from 'next/image';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  phone?: string;
  addresses?: any[];
  createdAt: string;
  lastActive?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1')));

  const [users, setUsers] = useState<UserData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === 'super_admin';

  const fetchUsers = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const pageFromParams = Math.max(1, parseInt(searchParams.get('page') || '1'));
    if (pageFromParams !== currentPage) {
      setCurrentPage(pageFromParams);
    }
  }, [searchParams]);

  const openUserDetails = (user: UserData) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const result = await Swal.fire({
      title: 'Change User Role?',
      text: `Are you sure you want to change this user's role to ${newRole}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb', // blue-600
      cancelButtonColor: '#64748b', // slate-500
      confirmButtonText: 'Yes, change it!',
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl font-bold px-6 py-3',
        cancelButton: 'rounded-xl font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Error updating user role');
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;

    setIsAssigning(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });

      if (response.ok) {
        toast.success(`Successfully assigned Admin role to ${adminEmail}`);
        setAdminEmail('');
        setIsAssignAdminOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to assign admin');
      }
    } catch (error) {
      toast.error('Error assigning admin');
    } finally {
      setIsAssigning(false);
    }
  };
 
  const handleDeleteUser = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // red-500
      cancelButtonColor: '#64748b', // slate-500
      confirmButtonText: 'Yes, delete permanently!',
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl font-bold px-6 py-3',
        cancelButton: 'rounded-xl font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success(`User "${userName}" deleted successfully`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  return (
    <div className="flex flex-col gap-6 px-0 py-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Users Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage and view all registered customers and staff.</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Button 
              onClick={() => setIsAssignAdminOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-6 h-11 shadow-lg shadow-blue-200 border-none transition-all hover:scale-105 active:scale-95"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Assign Admin
            </Button>
          )}
          <div className="bg-primary/10 px-5 py-2.5 rounded-full border border-primary/20">
            <span className="text-primary font-bold text-sm">{totalCount} Total Users</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Orders</TableHead>
              <TableHead className="font-bold">Role</TableHead>
              <TableHead className="font-bold">Joined</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium">Loading user data...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <p className="text-muted-foreground">No users found.</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    {user.image && user.image !== '' ? (
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border">
                        <Image 
                          src={user.image} 
                          alt={user.name} 
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <UserIcon className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => openUserDetails(user)}
                      className="font-semibold text-slate-900 hover:text-primary transition-colors text-left"
                    >
                      {user.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{user.totalOrders} Orders</span>
                      <span className="text-[10px] text-muted-foreground font-medium">৳{user.totalSpent.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'outline'}
                      className={`
                        capitalize px-3 py-0.5 rounded-full font-bold text-[10px] tracking-wider
                        ${user.role === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      `}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1.5">User Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openUserDetails(user)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1.5">Management</DropdownMenuLabel>
                          
                          {user.role === 'user' ? (
                            <DropdownMenuItem 
                              onClick={() => handleUpdateRole(user._id, 'admin')}
                              className="cursor-pointer text-blue-600 font-bold"
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleUpdateRole(user._id, 'user')}
                              className="cursor-pointer text-slate-600 font-bold"
                            >
                              <UserCog className="mr-2 h-4 w-4" /> Make User
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive cursor-pointer font-medium">
                            <ShieldAlert className="mr-2 h-4 w-4" /> Suspend User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="text-destructive cursor-pointer font-bold bg-red-50 hover:bg-red-100 mt-1"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="py-6 border-t bg-white px-6">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={(page) => {
                setCurrentPage(page);
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', page.toString());
                router.push(`?${params.toString()}`);
              }}
            />
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-2">
              User Profile
              <Badge className="bg-primary/10 text-primary border-none">{selectedUser?.role}</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="flex flex-col gap-6 pt-4">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-primary/10 flex items-center justify-center">
                  {selectedUser.image ? (
                    <Image 
                      src={selectedUser.image} 
                      alt={selectedUser.name} 
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="text-center md:text-left space-y-1">
                  <h2 className="font-black text-2xl tracking-tight text-slate-900">{selectedUser.name}</h2>
                  <p className="text-muted-foreground font-medium">{selectedUser.email}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary border-none font-bold">{selectedUser.role}</Badge>
                    <Badge variant="outline" className="font-bold">ID: {selectedUser._id.slice(-6).toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-2xl border bg-white hover:border-primary/30 transition-colors">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Phone Number</p>
                        <p className="text-sm font-bold text-slate-700">{selectedUser.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl border bg-white hover:border-primary/30 transition-colors">
                      <div className="p-2.5 bg-emerald-50 rounded-xl">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Shipping Address</p>
                        <p className="text-sm font-bold text-slate-700 leading-snug">
                          {selectedUser.addresses && selectedUser.addresses.length > 0 
                            ? `${selectedUser.addresses[0].street || ''}, ${selectedUser.addresses[0].city || ''}, ${selectedUser.addresses[0].state || ''}`
                            : 'No address saved yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Order Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center text-center">
                      <ShoppingBag className="h-6 w-6 text-orange-500 mb-2" />
                      <span className="text-2xl font-black text-orange-600">{selectedUser.totalOrders}</span>
                      <span className="text-[10px] font-bold uppercase text-orange-400">Total Orders</span>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center text-center">
                      <CreditCard className="h-6 w-6 text-primary mb-2" />
                      <span className="text-xl font-black text-primary">৳{selectedUser.totalSpent.toLocaleString()}</span>
                      <span className="text-[10px] font-bold uppercase text-primary/60">Total Spent</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">LAST VISIT</span>
                      <span className="font-black text-slate-700">
                        {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">LAST ORDER</span>
                      <span className="font-black text-slate-700">
                        {selectedUser.lastOrderDate ? new Date(selectedUser.lastOrderDate).toLocaleDateString() : 'No orders'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full h-14 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 group">
                  VIEW FULL ORDER HISTORY
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Admin Modal */}
      <Dialog open={isAssignAdminOpen} onOpenChange={setIsAssignAdminOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
            
            <DialogHeader className="relative z-10">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white">Assign Admin Access</DialogTitle>
              <p className="text-blue-100 text-sm font-medium mt-1">Grant administrative privileges to a user by email.</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleAssignAdmin} className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-700"
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mt-2">
                <div className="h-4 w-4 rounded-full bg-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-bold leading-normal">
                  NOTE: When this user logs in with Google using this email, they will automatically be granted Admin status.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setIsAssignAdminOpen(false)}
                className="flex-1 h-14 rounded-2xl font-bold border-2 hover:bg-slate-50"
              >
                CANCEL
              </Button>
              <Button 
                type="submit" 
                disabled={isAssigning}
                className="flex-[2] h-14 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 border-none group"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    CONFIRM ASSIGN
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <UsersContent />
    </Suspense>
  );
}


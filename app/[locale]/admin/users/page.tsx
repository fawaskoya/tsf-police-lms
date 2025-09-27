'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserRole, UserStatus } from '@prisma/client';
import { Plus, MoreHorizontal, Edit, Trash2, Download, Upload, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type User = {
  id: string;
  qid: string | null;
  badgeNo: string | null;
  rank: string | null;
  unit: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  locale: string;
  status: UserStatus;
  createdAt: string;
};

export default function UsersPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'badgeNo',
      header: t('users.badgeNumber'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('badgeNo') || '-'}</div>
      ),
    },
    {
      accessorKey: 'firstName',
      header: t('users.firstName'),
      cell: ({ row }) => (
        <div>
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: t('users.email'),
    },
    {
      accessorKey: 'role',
      header: t('users.role'),
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole;
        const roleLabels = {
          SUPER_ADMIN: t('users.superAdmin'),
          ADMIN: t('users.admin'),
          INSTRUCTOR: t('users.instructor'),
          COMMANDER: t('users.commander'),
          TRAINEE: t('users.trainee'),
        };
        return (
          <Badge variant={getRoleBadgeVariant(role)}>
            {roleLabels[role]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'unit',
      header: t('users.unit'),
      cell: ({ row }) => <div>{row.getValue('unit') || '-'}</div>,
    },
    {
      accessorKey: 'rank',
      header: t('users.rank'),
      cell: ({ row }) => <div>{row.getValue('rank') || '-'}</div>,
    },
    {
      accessorKey: 'status',
      header: t('users.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as UserStatus;
        const statusLabels = {
          ACTIVE: t('users.active'),
          INACTIVE: t('users.inactive'),
          SUSPENDED: t('users.suspended'),
        };
        return (
          <Badge variant={status === 'ACTIVE' ? 'success' : 'destructive'}>
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('users.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                Copy user ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this user?')) {
                    try {
                      const response = await fetch(`/api/users/${user.id}`, {
                        method: 'DELETE',
                      });

                      if (response.ok) {
                        refetch();
                        toast.success('User deleted successfully');
                      } else {
                        const errorData = await response.json();
                        toast.error(errorData.error?.message || 'Failed to delete user');
                      }
                    } catch (error) {
                      toast.error('Failed to delete user');
                    }
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      case 'INSTRUCTOR':
        return 'accent';
      case 'COMMANDER':
        return 'secondary';
      case 'TRAINEE':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('users.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {t('users.importUsers')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('users.importUsers')}</DialogTitle>
                <DialogDescription>
                  Import users from CSV or JSON data
                </DialogDescription>
              </DialogHeader>
              <ImportForm onSuccess={() => setIsImportDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('users.exportUsers')}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('users.newUser')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('users.newUser')}</DialogTitle>
                <DialogDescription>
                  Create a new user account
                </DialogDescription>
              </DialogHeader>
              <UserForm
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  refetch();
                  toast.success('User created successfully');
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={usersData?.users || []}
            searchKey="firstName"
            searchPlaceholder="Search users..."
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.editUser')}</DialogTitle>
              <DialogDescription>
                Edit user information
              </DialogDescription>
            </DialogHeader>
            <UserForm
              user={selectedUser}
              onSuccess={() => {
                setSelectedUser(null);
                refetch();
                toast.success('User updated successfully');
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function UserForm({
  user,
  onSuccess,
}: {
  user?: User;
  onSuccess: () => void;
}) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'TRAINEE' as UserRole,
    unit: user?.unit || '',
    rank: user?.rank || '',
    badgeNo: user?.badgeNo || '',
    qid: user?.qid || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(user ? `/api/users/${user.id}` : '/api/users', {
        method: user ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('users.firstName')}</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('users.lastName')}</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('users.email')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t('users.role')}</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRAINEE">{t('users.trainee')}</SelectItem>
            <SelectItem value="INSTRUCTOR">{t('users.instructor')}</SelectItem>
            <SelectItem value="COMMANDER">{t('users.commander')}</SelectItem>
            <SelectItem value="ADMIN">{t('users.admin')}</SelectItem>
            <SelectItem value="SUPER_ADMIN">{t('users.superAdmin')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">{t('users.unit')}</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rank">{t('users.rank')}</Label>
          <Input
            id="rank"
            value={formData.rank}
            onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="badgeNo">Badge Number</Label>
          <Input
            id="badgeNo"
            value={formData.badgeNo}
            onChange={(e) => setFormData({ ...formData, badgeNo: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qid">QID</Label>
          <Input
            id="qid"
            value={formData.qid}
            onChange={(e) => setFormData({ ...formData, qid: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('users.phone')}</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : user ? t('common.save') : t('common.create')}
      </Button>
    </form>
  );
}

function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const [results, setResults] = useState<any>(null);

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const users = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const user: any = {};
        headers.forEach((header, index) => {
          user[header] = values[index] || undefined;
        });
        users.push(user);
      }
    }
    return users;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);

    try {
      let users = [];

      if (importType === 'csv') {
        users = parseCSV(importData);
      } else {
        users = JSON.parse(importData);
      }

      if (!Array.isArray(users) || users.length === 0) {
        toast.error('No valid users found in the import data');
        return;
      }

      // Transform CSV headers to match API schema
      const transformedUsers = users.map((user: any) => ({
        firstName: user.firstName || user['First Name'] || '',
        lastName: user.lastName || user['Last Name'] || '',
        email: user.email || user['Email'] || '',
        phone: user.phone || user['Phone'] || '',
        role: user.role || user['Role'] || 'TRAINEE',
        unit: user.unit || user['Unit'] || '',
        rank: user.rank || user['Rank'] || '',
        badgeNo: user.badgeNo || user['Badge Number'] || '',
        qid: user.qid || user['QID'] || '',
        locale: user.locale || 'ar',
      }));

      const response = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedUsers),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        if (data.results.successful > 0) {
          toast.success(`Successfully imported ${data.results.successful} users`);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
        if (data.results.failed > 0) {
          toast.warning(`${data.results.failed} users failed to import`);
        }
      } else {
        toast.error(data.error?.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse or import data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Import Format</Label>
        <Select value={importType} onValueChange={(value: 'csv' | 'json') => setImportType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV Format</SelectItem>
            <SelectItem value="json">JSON Format</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Data</Label>
        <Textarea
          placeholder={
            importType === 'csv'
              ? 'firstName,lastName,email,role,unit,rank,badgeNo,qid\nJohn,Doe,john@example.com,TRAINEE,Patrol,Sergeant,12345,12345678901'
              : '[\n  {\n    "firstName": "John",\n    "lastName": "Doe",\n    "email": "john@example.com",\n    "role": "TRAINEE",\n    "unit": "Patrol",\n    "rank": "Sergeant"\n  }\n]'
          }
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} onClick={handleSubmit}>
        {isLoading ? 'Importing...' : 'Import Users'}
      </Button>

      {results && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Import Results</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Successful:</span>
              <span className="text-green-600 font-medium">{results.successful}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-red-600 font-medium">{results.failed}</span>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-red-600 mb-2">Errors:</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {results.errors.map((error: any, index: number) => (
                  <div key={index} className="text-xs text-red-600">
                    Row {error.row}: {error.email} - {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.created && results.created.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-green-600 mb-2">Created Users:</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {results.created.map((user: any, index: number) => (
                  <div key={index} className="text-xs text-green-600">
                    {user.name} ({user.email})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

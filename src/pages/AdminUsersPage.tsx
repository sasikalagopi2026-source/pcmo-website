import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRow = { id: string; email: string; display_name?: string; role: string; status: string; company?: string; member_number?: string; created_at: string };

const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => api<UserRow[]>("/api/admin/users") });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserRow> }) => api(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  return <DashboardLayout><div className="max-w-7xl space-y-6"><h1 className="font-heading text-2xl font-bold">Users</h1><div className="overflow-x-auto rounded-xl border border-border bg-card"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Member ID</TableHead><TableHead>Company</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{users.data?.map((user) => <TableRow key={user.id}><TableCell>{user.display_name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.member_number}</TableCell><TableCell>{user.company}</TableCell><TableCell><select value={user.role} onChange={(event) => update.mutate({ id: user.id, data: { role: event.target.value } })} className="rounded border border-border bg-background p-1"><option value="student">Student</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></TableCell><TableCell><select value={user.status} onChange={(event) => update.mutate({ id: user.id, data: { status: event.target.value } })} className="rounded border border-border bg-background p-1"><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select></TableCell><TableCell>{user.created_at}</TableCell></TableRow>)}</TableBody></Table></div></div></DashboardLayout>;
};

export default AdminUsersPage;

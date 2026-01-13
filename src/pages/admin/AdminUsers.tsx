import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    getUsers,
    updateUser,
    deleteUser,
    toggleUserStatus,
    toggleUserSuspension,
    User
} from '@/services/userService';
import { Report } from '@/services/reportService';
import { UserReportsDialog } from '@/components/admin/UserReportsDialog';
import {
    Search,
    Users,
    Shield,
    ShieldCheck,
    User as UserIcon,
    Mail,
    Phone,
    Loader2,
    AlertCircle,
    Ban,
    CheckCircle,
    Edit2,
    Trash2,
    History as HistoryIcon,
    UserX,
    UserCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
export default function AdminUsers() {
    const { t, resolvedLanguage } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Filter dependency for query
    const filters = { role: roleFilter, searchQuery };

    const {
        data: users = [],
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['admin', 'users', filters],
        queryFn: () => getUsers(filters),
    });

    const [isProcessing, setIsProcessing] = useState(false);

    // State for Edit Dialog
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });

    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // History dialog state
    const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Dummy state for report detail (not fully used here, but needed for Dialog layout if we navigate)
    // Actually, AdminUsers doesn't have a report detail dialog, so we might just open the report in a new tab 
    // or just show the history.
    // For now, let's just show history.

    // No need for separate useEffect for search debouncing as query key handles it
    // However, for typical debouncing experience we might want useDebounce, but here simple query key update is fine 
    // or we can add debouncing to setSearchQuery if needed, but keeping it simple as per original behavior.

    // ... rest of the component handlers ...

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const success = await updateUser(userId, { role: newRole });
            if (success) {
                toast.success(t('user_role_updated'));
                refetch();
            } else {
                toast.error(t('err_updating_role'));
            }
        } catch (error) {
            toast.error(t('err_updating_role'));
        }
    };

    const handleToggleStatus = async (userId: string, isActive: boolean) => {
        try {
            const success = await toggleUserStatus(userId, isActive);
            if (success) {
                toast.success(isActive ? t('user_status_disabled') : t('user_status_enabled'));
                refetch();
            } else {
                toast.error(t('err_updating_status'));
            }
        } catch (error) {
            toast.error(t('err_updating_status'));
        }
    };

    const handleToggleSuspension = async (userId: string, isSuspended: boolean) => {
        try {
            const success = await toggleUserSuspension(userId, isSuspended);
            if (success) {
                toast.success(isSuspended ? t('user_status_unsuspended_msg') : t('user_status_suspended_msg'));
                refetch();
            } else {
                toast.error(t('err_updating_status'));
            }
        } catch (error) {
            toast.error(t('err_updating_status'));
        }
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            password: '',
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setIsProcessing(true);
        try {
            const updateData: any = { ...editFormData };
            if (!updateData.password) {
                delete updateData.password;
            }
            const success = await updateUser(editingUser.id, updateData);
            if (success) {
                toast.success(t('user_update_success'));
                setIsEditDialogOpen(false);
                refetch();
            } else {
                toast.error(t('err_action_failed'));
            }
        } catch (error) {
            toast.error(t('err_connection'));
        } finally {
            setIsProcessing(false);
        }
    };

    const openDeleteDialog = (user: User) => {
        setDeletingUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        setIsProcessing(true);
        try {
            const success = await deleteUser(deletingUser.id);
            if (success) {
                toast.success(t('user_delete_success'));
                setIsDeleteDialogOpen(false);
                refetch();
            } else {
                toast.error(t('err_action_failed'));
            }
        } catch (error) {
            toast.error(t('err_connection'));
        } finally {
            setIsProcessing(false);
        }
    };

    const openUserHistory = (user: User) => {
        setHistoryUser({ id: user.id, name: user.name });
        setIsHistoryOpen(true);
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, { variant: 'default' | 'destructive' | 'success' | 'secondary', icon: any, label: string }> = {
            admin: { variant: 'destructive', icon: ShieldCheck, label: t('user_role_admin') },
            moderator: { variant: 'default', icon: Shield, label: t('user_role_moderator') },
            user: { variant: 'secondary', icon: UserIcon, label: t('user_role_user') },
        };
        const { variant, icon: Icon, label } = variants[role] || variants.user;
        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        );
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">{t('mgmt_users_title')}</h1>
                <p className="text-muted-foreground mt-1">{t('mgmt_users_subtitle')}</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{users.length}</p>
                            <p className="text-sm text-muted-foreground">{t('total_users_count')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
                            <p className="text-sm text-muted-foreground">{t('user_active_count')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                            <p className="text-sm text-muted-foreground">{t('user_admin_count')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", resolvedLanguage === 'ar' ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t('search_users_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={cn(resolvedLanguage === 'ar' ? "pr-10" : "pl-10")}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full md:w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('filter_all_roles')}</SelectItem>
                                <SelectItem value="admin">{t('user_role_admin')}</SelectItem>
                                <SelectItem value="moderator">{t('user_role_moderator')}</SelectItem>
                                <SelectItem value="user">{t('user_role_user')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 pl-4">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-20">
                            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t('no_users_found')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_user')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_contact')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_permission')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_status')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {t('user_join_date').replace('{date}', new Date(user.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US'))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                                        {user.email}
                                                    </p>
                                                    {user.phone && (
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {user.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="p-4">
                                                {!user.is_active ? (
                                                    <Badge variant="destructive">
                                                        {t('user_status_inactive')}
                                                    </Badge>
                                                ) : user.is_suspended ? (
                                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                                                        {t('user_status_suspended')}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="success">
                                                        {t('user_status_active')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={user.role}
                                                        onValueChange={(value) => handleRoleChange(user.id, value)}
                                                    >
                                                        <SelectTrigger className="w-24 h-8 text-[10px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="admin">{t('user_role_admin')}</SelectItem>
                                                            <SelectItem value="moderator">{t('user_role_moderator')}</SelectItem>
                                                            <SelectItem value="user">{t('user_role_user')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => openEditDialog(user)}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('user_edit_tooltip')}</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                                    className={`h-8 w-8 ${user.is_active ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-success hover:text-success/80 hover:bg-success/10'}`}
                                                                >
                                                                    {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{user.is_active ? t('user_status_disable_tooltip') : t('user_status_enable_tooltip')}</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleToggleSuspension(user.id, user.is_suspended || false)}
                                                                    className={`h-8 w-8 ${!user.is_suspended ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-success hover:text-success/80 hover:bg-success/10'}`}
                                                                >
                                                                    {user.is_suspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{user.is_suspended ? t('user_status_unsuspend_tooltip') : t('user_status_suspend_tooltip')}</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                                    onClick={() => openUserHistory(user)}
                                                                >
                                                                    <HistoryIcon className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('view_user_reports_btn')}</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => openDeleteDialog(user)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('user_delete_tooltip')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('user_edit_title')}</DialogTitle>
                        <DialogDescription>
                            {t('user_edit_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('user_full_name')}</Label>
                            <Input
                                id="name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('email_label')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('phone_label')}</Label>
                            <Input
                                id="phone"
                                value={editFormData.phone}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                placeholder={t('user_phone_example')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('user_new_pwd_label')}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={editFormData.password}
                                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                placeholder={t('user_pwd_placeholder')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t('cancel_btn')}</Button>
                        <Button onClick={handleUpdateUser} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className={cn("h-4 w-4 animate-spin", resolvedLanguage === 'ar' ? "ml-2" : "mr-2")} /> : null}
                            {t('save_changes_btn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('user_delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('user_delete_confirm_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={cn("gap-2", resolvedLanguage === 'ar' ? "flex-row-reverse" : "flex-row")}>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className={cn("h-4 w-4 animate-spin", resolvedLanguage === 'ar' ? "ml-2" : "mr-2")} /> : null}
                            {t('user_delete_btn')}
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>{t('cancel_btn')}</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <UserReportsDialog
                userId={historyUser?.id || null}
                userName={historyUser?.name || null}
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                onViewDetails={(report) => {
                    // In AdminUsers, we don't have a report details dialog yet.
                    // For now, let's just navigate to the report page or a specific admin report view.
                    window.open(`/reports/${report.id}`, '_blank');
                }}
            />
        </AdminLayout>
    );
}

import { Contact } from '@/types/contact';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Edit, Trash2, Power, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';

interface ContactsListProps {
    contacts: Contact[];
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    onToggleStatus: (contact: Contact) => void;
}

export function ContactsList({ contacts, onEdit, onDelete, onToggleStatus }: ContactsListProps) {
    const { t } = useLanguage();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (contactToDelete) {
            onDelete(contactToDelete);
            setContactToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    if (contacts.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card/50">
                <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>{t('no_contacts_found') || 'No contacts found'}</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">{t('name_label') || 'Name'}</TableHead>
                            <TableHead className="text-right">{t('contact_methods_title') || 'Contact Info'}</TableHead>
                            <TableHead className="text-right hidden md:table-cell">{t('note_label') || 'Note'}</TableHead>
                            <TableHead className="text-center">{t('status_label') || 'Status'}</TableHead>
                            <TableHead className="text-center">{t('actions') || 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.full_name}</TableCell>
                                <TableCell dir="ltr">{contact.phone}</TableCell>
                                <TableCell className="hidden md:table-cell">{contact.email || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={contact.is_active ? 'default' : 'secondary'}>
                                        {contact.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('actions') || 'Actions'}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onEdit(contact)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                {t('edit') || 'Edit'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onToggleStatus(contact)}>
                                                <Power className="mr-2 h-4 w-4" />
                                                {contact.is_active ? (t('deactivate') || 'Deactivate') : (t('active') || 'Activate')}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleDeleteClick(contact)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t('delete') || 'Delete'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure') || 'Are you sure?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_contact_confirmation') || 'This action cannot be undone. This will permanently delete the contact.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel') || 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t('delete') || 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

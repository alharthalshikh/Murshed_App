import { sql } from '@/lib/db';
import { Contact, CreateContactDTO, UpdateContactDTO } from '@/types/contact';

// --- New Multi-Contact System ---

// Get all contacts
export async function getAllContacts(): Promise<Contact[]> {
    try {
        const result = await sql`
            SELECT * FROM contacts 
            ORDER BY created_at ASC
        `;
        return result as Contact[];
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
}

// Get only active contacts (for public display)
export async function getActiveContacts(): Promise<Contact[]> {
    try {
        const result = await sql`
            SELECT * FROM contacts 
            WHERE is_active = true
            ORDER BY created_at ASC
        `;
        return result as Contact[];
    } catch (error) {
        console.error('Error fetching active contacts:', error);
        return [];
    }
}

// Add new contact
export async function addContact(contact: CreateContactDTO): Promise<Contact | null> {
    try {
        const [newContact] = await sql`
            INSERT INTO contacts (
                full_name, phone, email, note, 
                avatar_url, facebook_url, instagram_url, youtube_url, whatsapp_group_url
            )
            VALUES (
                ${contact.full_name}, ${contact.phone}, ${contact.email || null}, ${contact.note || null},
                ${contact.avatar_url || null}, ${contact.facebook_url || null}, ${contact.instagram_url || null}, ${contact.youtube_url || null}, ${contact.whatsapp_group_url || null}
            )
            RETURNING *
        `;
        return newContact as Contact;
    } catch (error) {
        console.error('Error adding contact:', error);
        return null;
    }
}

// Update contact info
export async function updateContact(id: string, updates: UpdateContactDTO): Promise<Contact | null> {
    try {
        const [updatedContact] = await sql`
            UPDATE contacts 
            SET 
                full_name = COALESCE(${updates.full_name}, full_name),
                phone = COALESCE(${updates.phone}, phone),
                email = COALESCE(${updates.email}, email),
                note = COALESCE(${updates.note}, note),
                is_active = COALESCE(${updates.is_active}, is_active),
                avatar_url = COALESCE(${updates.avatar_url}, avatar_url),
                facebook_url = COALESCE(${updates.facebook_url}, facebook_url),
                instagram_url = COALESCE(${updates.instagram_url}, instagram_url),
                youtube_url = COALESCE(${updates.youtube_url}, youtube_url),
                whatsapp_group_url = COALESCE(${updates.whatsapp_group_url}, whatsapp_group_url),
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return updatedContact as Contact;
    } catch (error) {
        console.error('Error updating contact:', error);
        return null;
    }
}

// Toggle contact status
export async function toggleContactStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
        await sql`
            UPDATE contacts 
            SET is_active = ${isActive}, updated_at = NOW()
            WHERE id = ${id}
        `;
        return true;
    } catch (error) {
        console.error('Error toggling contact status:', error);
        return false;
    }
}

// Delete contact
export async function deleteContact(id: string): Promise<boolean> {
    try {
        await sql`
            DELETE FROM contacts WHERE id = ${id}
        `;
        return true;
    } catch (error) {
        console.error('Error deleting contact:', error);
        return false;
    }
}

// --- Legacy / General Settings System ---

export interface ContactInfo {
    admin_name?: string;
    admin_avatar?: string;
    whatsapp_number?: string;
    facebook_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    whatsapp_group_url?: string;
    snapchat_url?: string;
}

export async function getContactInfo(): Promise<ContactInfo> {
    try {
        const result = await sql`
            SELECT key, value FROM system_settings 
            WHERE key IN ('admin_name', 'admin_avatar', 'whatsapp_number', 'facebook_url', 'instagram_url', 'youtube_url', 'whatsapp_group_url', 'snapchat_url')
        `;

        const info: any = {};
        result.forEach((row: any) => {
            info[row.key] = row.value;
        });

        return info as ContactInfo;
    } catch (error) {
        console.error('Error fetching contact info:', error);
        return {};
    }
}

export async function updateContactInfo(info: ContactInfo): Promise<boolean> {
    try {
        const promises = Object.entries(info).map(([key, value]) => {
            if (value === undefined) return Promise.resolve();
            return sql`
                INSERT INTO system_settings (key, value, updated_at)
                VALUES (${key}, ${value}, NOW())
                ON CONFLICT (key) 
                DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            `;
        });

        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error('Error updating contact info:', error);
        return false;
    }
}

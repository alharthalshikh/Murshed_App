export interface Contact {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    note?: string;
    avatar_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    whatsapp_group_url?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateContactDTO {
    full_name: string;
    phone: string;
    email?: string;
    note?: string;
    avatar_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    whatsapp_group_url?: string;
}

export interface UpdateContactDTO extends Partial<CreateContactDTO> {
    is_active?: boolean;
}

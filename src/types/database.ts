export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          role: "commissioner" | "admin" | "commercial";
          status: "active" | "inactive" | "pending";
          avatar_url: string | null;
          city: string | null;
          department: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          role?: "commissioner" | "admin" | "commercial";
          status?: "active" | "inactive" | "pending";
          avatar_url?: string | null;
          city?: string | null;
          department?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          role?: "commissioner" | "admin" | "commercial";
          status?: "active" | "inactive" | "pending";
          avatar_url?: string | null;
          city?: string | null;
          department?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      offers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          offer_type: "domaines_villages" | "colis_coteau";
          default_commission_rate: number;
          is_active: boolean;
          color: string | null;
          icon_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          offer_type: "domaines_villages" | "colis_coteau";
          default_commission_rate?: number;
          is_active?: boolean;
          color?: string | null;
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          offer_type?: "domaines_villages" | "colis_coteau";
          default_commission_rate?: number;
          is_active?: boolean;
          color?: string | null;
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      campaigns: {
        Row: {
          id: string;
          offer_id: string;
          name: string;
          description: string | null;
          season: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "draft" | "active" | "closed" | "archived";
          shop_base_url: string | null;
          catalog_url: string | null;
          image_url: string | null;
          commission_rate_override: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          name: string;
          description?: string | null;
          season?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "draft" | "active" | "closed" | "archived";
          shop_base_url?: string | null;
          catalog_url?: string | null;
          image_url?: string | null;
          commission_rate_override?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string;
          name?: string;
          description?: string | null;
          season?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "draft" | "active" | "closed" | "archived";
          shop_base_url?: string | null;
          catalog_url?: string | null;
          image_url?: string | null;
          commission_rate_override?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      message_templates: {
        Row: {
          id: string;
          campaign_id: string;
          step: "initial" | "reminder_1" | "reminder_2" | "final";
          title: string;
          content: string;
          suggested_delay_days: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          step: "initial" | "reminder_1" | "reminder_2" | "final";
          title: string;
          content: string;
          suggested_delay_days?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          step?: "initial" | "reminder_1" | "reminder_2" | "final";
          title?: string;
          content?: string;
          suggested_delay_days?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_templates_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      commissioner_campaigns: {
        Row: {
          id: string;
          commissioner_id: string;
          campaign_id: string;
          personal_shop_url: string | null;
          status: "active" | "paused" | "completed";
          activated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          commissioner_id: string;
          campaign_id: string;
          personal_shop_url?: string | null;
          status?: "active" | "paused" | "completed";
          activated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          commissioner_id?: string;
          campaign_id?: string;
          personal_shop_url?: string | null;
          status?: "active" | "paused" | "completed";
          activated_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commissioner_campaigns_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commissioner_campaigns_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          commissioner_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          commissioner_id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          commissioner_id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_groups: {
        Row: {
          id: string;
          commissioner_id: string;
          campaign_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          commissioner_id: string;
          campaign_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          commissioner_id?: string;
          campaign_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_groups_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_groups_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          contact_id: string;
          status: "pending" | "invited" | "clicked" | "ordered" | "to_remind" | "declined";
          added_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          contact_id: string;
          status?: "pending" | "invited" | "clicked" | "ordered" | "to_remind" | "declined";
          added_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          contact_id?: string;
          status?: "pending" | "invited" | "clicked" | "ordered" | "to_remind" | "declined";
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "contact_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          commissioner_id: string;
          contact_id: string;
          campaign_id: string;
          group_id: string | null;
          message_type: "initial" | "reminder_1" | "reminder_2" | "final" | "custom";
          content: string;
          status: "prepared" | "sent" | "failed";
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          commissioner_id: string;
          contact_id: string;
          campaign_id: string;
          group_id?: string | null;
          message_type: "initial" | "reminder_1" | "reminder_2" | "final" | "custom";
          content: string;
          status?: "prepared" | "sent" | "failed";
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          commissioner_id?: string;
          contact_id?: string;
          campaign_id?: string;
          group_id?: string | null;
          message_type?: "initial" | "reminder_1" | "reminder_2" | "final" | "custom";
          content?: string;
          status?: "prepared" | "sent" | "failed";
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "contact_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          campaign_id: string;
          commissioner_id: string;
          contact_id: string | null;
          external_order_id: string | null;
          customer_name: string;
          customer_email: string | null;
          amount: number;
          status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
          order_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          commissioner_id: string;
          contact_id?: string | null;
          external_order_id?: string | null;
          customer_name: string;
          customer_email?: string | null;
          amount: number;
          status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
          order_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          commissioner_id?: string;
          contact_id?: string | null;
          external_order_id?: string | null;
          customer_name?: string;
          customer_email?: string | null;
          amount?: number;
          status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
          order_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      commissions: {
        Row: {
          id: string;
          commissioner_id: string;
          campaign_id: string;
          order_id: string | null;
          amount: number;
          rate: number;
          status: "estimated" | "validated" | "paid";
          estimated_at: string;
          validated_at: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          commissioner_id: string;
          campaign_id: string;
          order_id?: string | null;
          amount: number;
          rate: number;
          status?: "estimated" | "validated" | "paid";
          estimated_at?: string;
          validated_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          commissioner_id?: string;
          campaign_id?: string;
          order_id?: string | null;
          amount?: number;
          rate?: number;
          status?: "estimated" | "validated" | "paid";
          estimated_at?: string;
          validated_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commissions_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commissions_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commissions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_tiers: {
        Row: {
          id: string;
          campaign_id: string | null;
          amount_threshold: number;
          label: string;
          message: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          amount_threshold: number;
          label: string;
          message?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          amount_threshold?: number;
          label?: string;
          message?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commission_tiers_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      events_log: {
        Row: {
          id: string;
          event_type: string;
          commissioner_id: string | null;
          campaign_id: string | null;
          contact_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          commissioner_id?: string | null;
          campaign_id?: string | null;
          contact_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          commissioner_id?: string | null;
          campaign_id?: string | null;
          contact_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_log_commissioner_id_fkey";
            columns: ["commissioner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_log_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_log_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      profile_role: "commissioner" | "admin" | "commercial";
      profile_status: "active" | "inactive" | "pending";
      offer_type: "domaines_villages" | "colis_coteau";
      campaign_status: "draft" | "active" | "closed" | "archived";
      message_step: "initial" | "reminder_1" | "reminder_2" | "final";
      commissioner_campaign_status: "active" | "paused" | "completed";
      group_member_status: "pending" | "invited" | "clicked" | "ordered" | "to_remind" | "declined";
      message_type: "initial" | "reminder_1" | "reminder_2" | "final" | "custom";
      message_status: "prepared" | "sent" | "failed";
      order_status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
      commission_status: "estimated" | "validated" | "paid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

// ---------------------------------------------------------------------------
// Convenience type aliases
// ---------------------------------------------------------------------------

// Row types (what you get back from a SELECT)
export type Profile = PublicSchema["Tables"]["profiles"]["Row"];
export type Offer = PublicSchema["Tables"]["offers"]["Row"];
export type Campaign = PublicSchema["Tables"]["campaigns"]["Row"];
export type MessageTemplate = PublicSchema["Tables"]["message_templates"]["Row"];
export type CommissionerCampaign = PublicSchema["Tables"]["commissioner_campaigns"]["Row"];
export type Contact = PublicSchema["Tables"]["contacts"]["Row"];
export type ContactGroup = PublicSchema["Tables"]["contact_groups"]["Row"];
export type GroupMember = PublicSchema["Tables"]["group_members"]["Row"];
export type Message = PublicSchema["Tables"]["messages"]["Row"];
export type Order = PublicSchema["Tables"]["orders"]["Row"];
export type Commission = PublicSchema["Tables"]["commissions"]["Row"];
export type CommissionTier = PublicSchema["Tables"]["commission_tiers"]["Row"];
export type EventLog = PublicSchema["Tables"]["events_log"]["Row"];
export type AppSetting = PublicSchema["Tables"]["app_settings"]["Row"];

// Insert types (what you pass to an INSERT)
export type ProfileInsert = PublicSchema["Tables"]["profiles"]["Insert"];
export type OfferInsert = PublicSchema["Tables"]["offers"]["Insert"];
export type CampaignInsert = PublicSchema["Tables"]["campaigns"]["Insert"];
export type MessageTemplateInsert = PublicSchema["Tables"]["message_templates"]["Insert"];
export type CommissionerCampaignInsert = PublicSchema["Tables"]["commissioner_campaigns"]["Insert"];
export type ContactInsert = PublicSchema["Tables"]["contacts"]["Insert"];
export type ContactGroupInsert = PublicSchema["Tables"]["contact_groups"]["Insert"];
export type GroupMemberInsert = PublicSchema["Tables"]["group_members"]["Insert"];
export type MessageInsert = PublicSchema["Tables"]["messages"]["Insert"];
export type OrderInsert = PublicSchema["Tables"]["orders"]["Insert"];
export type CommissionInsert = PublicSchema["Tables"]["commissions"]["Insert"];
export type CommissionTierInsert = PublicSchema["Tables"]["commission_tiers"]["Insert"];
export type EventLogInsert = PublicSchema["Tables"]["events_log"]["Insert"];
export type AppSettingInsert = PublicSchema["Tables"]["app_settings"]["Insert"];

// Update types (what you pass to an UPDATE)
export type ProfileUpdate = PublicSchema["Tables"]["profiles"]["Update"];
export type OfferUpdate = PublicSchema["Tables"]["offers"]["Update"];
export type CampaignUpdate = PublicSchema["Tables"]["campaigns"]["Update"];
export type MessageTemplateUpdate = PublicSchema["Tables"]["message_templates"]["Update"];
export type CommissionerCampaignUpdate = PublicSchema["Tables"]["commissioner_campaigns"]["Update"];
export type ContactUpdate = PublicSchema["Tables"]["contacts"]["Update"];
export type ContactGroupUpdate = PublicSchema["Tables"]["contact_groups"]["Update"];
export type GroupMemberUpdate = PublicSchema["Tables"]["group_members"]["Update"];
export type MessageUpdate = PublicSchema["Tables"]["messages"]["Update"];
export type OrderUpdate = PublicSchema["Tables"]["orders"]["Update"];
export type CommissionUpdate = PublicSchema["Tables"]["commissions"]["Update"];
export type CommissionTierUpdate = PublicSchema["Tables"]["commission_tiers"]["Update"];
export type EventLogUpdate = PublicSchema["Tables"]["events_log"]["Update"];
export type AppSettingUpdate = PublicSchema["Tables"]["app_settings"]["Update"];

// ---------------------------------------------------------------------------
// Enum convenience types
// ---------------------------------------------------------------------------

export type ProfileRole = PublicSchema["Enums"]["profile_role"];
export type ProfileStatus = PublicSchema["Enums"]["profile_status"];
export type OfferType = PublicSchema["Enums"]["offer_type"];
export type CampaignStatus = PublicSchema["Enums"]["campaign_status"];
export type MessageStep = PublicSchema["Enums"]["message_step"];
export type CommissionerCampaignStatus = PublicSchema["Enums"]["commissioner_campaign_status"];
export type GroupMemberStatus = PublicSchema["Enums"]["group_member_status"];
export type MessageType = PublicSchema["Enums"]["message_type"];
export type MessageStatus = PublicSchema["Enums"]["message_status"];
export type OrderStatus = PublicSchema["Enums"]["order_status"];
export type CommissionStatus = PublicSchema["Enums"]["commission_status"];

// ---------------------------------------------------------------------------
// Helper: extract table names
// ---------------------------------------------------------------------------

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

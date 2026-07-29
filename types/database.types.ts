// Hand-written Supabase database types, mirroring supabase/migrations/*.sql.
//
// The Supabase CLI's `gen types typescript` was not runnable in this
// environment (no live project linked yet), so this file is maintained by
// hand in the same shape the CLI would produce. When the project is linked,
// this can be regenerated with:
//   supabase gen types typescript --project-id <id> > types/database.types.ts
// and this header comment removed.
//
// Keep in sync with supabase/migrations/0002_tables.sql whenever the schema
// changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BusinessStatus = 'draft' | 'pending' | 'published' | 'suspended'
export type BusinessImageKind = 'logo' | 'cover' | 'gallery'
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          location: string | null
          website: string | null
          socials: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          website?: string | null
          socials?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          website?: string | null
          socials?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          website: string | null
          address: string | null
          city: string | null
          province: string | null
          lat: number | null
          lng: number | null
          hours: Json
          socials: Json
          status: BusinessStatus
          avg_rating: number
          review_count: number
          view_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          lat?: number | null
          lng?: number | null
          hours?: Json
          socials?: Json
          status?: BusinessStatus
          avg_rating?: number
          review_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          lat?: number | null
          lng?: number | null
          hours?: Json
          socials?: Json
          status?: BusinessStatus
          avg_rating?: number
          review_count?: number
          view_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'businesses_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      business_categories: {
        Row: {
          business_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          business_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_categories_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_categories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      business_images: {
        Row: {
          id: string
          business_id: string
          url: string
          kind: BusinessImageKind
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          url: string
          kind: BusinessImageKind
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          url?: string
          kind?: BusinessImageKind
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_images_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          business_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      favourites: {
        Row: {
          user_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          business_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favourites_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favourites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          business_id: string
          tier: string
          status: SubscriptionStatus
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          tier: string
          status?: SubscriptionStatus
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          tier?: string
          status?: SubscriptionStatus
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          business_id: string
          subscription_id: string | null
          paynow_reference: string | null
          poll_url: string | null
          amount: number
          status: PaymentStatus
          raw_response: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          subscription_id?: string | null
          paynow_reference?: string | null
          poll_url?: string | null
          amount: number
          status?: PaymentStatus
          raw_response?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          subscription_id?: string | null
          paynow_reference?: string | null
          poll_url?: string | null
          amount?: number
          status?: PaymentStatus
          raw_response?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payments_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_subscription_id_fkey'
            columns: ['subscription_id']
            isOneToOne: false
            referencedRelation: 'subscriptions'
            referencedColumns: ['id']
          },
        ]
      }
      business_views: {
        Row: {
          id: string
          business_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          business_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'business_views_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_views_viewer_id_fkey'
            columns: ['viewer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

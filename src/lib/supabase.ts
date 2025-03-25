import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          name: string;
          status: "draft" | "sent" | "completed";
          created_by: string;
          created_at: string;
          file_path: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: "draft" | "sent" | "completed";
          created_by: string;
          created_at?: string;
          file_path: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: "draft" | "sent" | "completed";
          created_by?: string;
          created_at?: string;
          file_path?: string;
          updated_at?: string;
        };
      };
      form_fields: {
        Row: {
          id: string;
          document_id: string;
          field_type: "signature" | "text" | "date";
          x_position: number;
          y_position: number;
          width: number;
          height: number;
          page: number;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          field_type: "signature" | "text" | "date";
          x_position: number;
          y_position: number;
          width: number;
          height: number;
          page: number;
          assigned_to?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          field_type?: "signature" | "text" | "date";
          x_position?: number;
          y_position?: number;
          width?: number;
          height?: number;
          page?: number;
          assigned_to?: string | null;
          created_at?: string;
        };
      };
      signatures: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_path: string;
          created_at: string;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          file_path: string;
          created_at?: string;
          is_default?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          file_path?: string;
          created_at?: string;
          is_default?: boolean;
        };
      };
    };
  };
};

// Client-side Supabase client
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be defined");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be defined");
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}; 
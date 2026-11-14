export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      comment_reactions: {
        Row: {
          comment_id: string;
          created_at: string;
          emoji: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          emoji: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          emoji?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          attachment_kind: string | null;
          attachment_url: string | null;
          author_id: string;
          body: string | null;
          created_at: string;
          id: string;
          parent_id: string | null;
          thread_id: string;
        };
        Insert: {
          attachment_kind?: string | null;
          attachment_url?: string | null;
          author_id: string;
          body?: string | null;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          thread_id: string;
        };
        Update: {
          attachment_kind?: string | null;
          attachment_url?: string | null;
          author_id?: string;
          body?: string | null;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_id_thread_id_fkey";
            columns: ["parent_id", "thread_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id", "thread_id"];
          },
          {
            foreignKeyName: "comments_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      // Matches supabase/migrations/20261114160000_guide_harness.sql, applied to the live database and checked against its generated types.
      // Regenerate the whole file with `supabase gen types` when the schema changes again.
      contributions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          minutes: number;
          occurred_on: string;
          title: string;
          user_id: string;
          verification: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          minutes: number;
          occurred_on: string;
          title: string;
          user_id: string;
          verification?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          minutes?: number;
          occurred_on?: string;
          title?: string;
          user_id?: string;
          verification?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contributions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // Matches supabase/migrations/20261114160000_guide_harness.sql, applied to the live database and checked against its generated types.
      // Regenerate the whole file with `supabase gen types` when the schema changes again.
      evidence_claims: {
        Row: {
          caveat: string | null;
          claim: string;
          created_at: string;
          fts: unknown;
          id: string;
          population: string | null;
          source_name: string;
          source_url: string | null;
          strength: string;
          verified_at: string | null;
          year: number | null;
        };
        Insert: {
          caveat?: string | null;
          claim: string;
          created_at?: string;
          fts?: never;
          id?: string;
          population?: string | null;
          source_name: string;
          source_url?: string | null;
          strength: string;
          verified_at?: string | null;
          year?: number | null;
        };
        Update: {
          caveat?: string | null;
          claim?: string;
          created_at?: string;
          fts?: never;
          id?: string;
          population?: string | null;
          source_name?: string;
          source_url?: string | null;
          strength?: string;
          verified_at?: string | null;
          year?: number | null;
        };
        Relationships: [];
      };
      // Matches supabase/migrations/20261114180000_guide_conversations.sql, written by hand before it is applied.
      guide_conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guide_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // Matches supabase/migrations/20261114160000_guide_harness.sql, applied to the live database and checked against its generated types.
      // Regenerate the whole file with `supabase gen types` when the schema changes again.
      guide_events: {
        Row: {
          created_at: string;
          detail: Json | null;
          id: string;
          kind: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          detail?: Json | null;
          id?: string;
          kind: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          detail?: Json | null;
          id?: string;
          kind?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guide_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // Matches supabase/migrations/20261114160000_guide_harness.sql, applied to the live database and checked against its generated types.
      // Regenerate the whole file with `supabase gen types` when the schema changes again.
      guide_messages: {
        Row: {
          content: string;
          conversation_id: string | null;
          created_at: string;
          id: string;
          intent: string | null;
          role: string;
          user_id: string;
        };
        Insert: {
          content: string;
          conversation_id?: string | null;
          created_at?: string;
          id?: string;
          intent?: string | null;
          role: string;
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string | null;
          created_at?: string;
          id?: string;
          intent?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guide_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "guide_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guide_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          color: string;
          created_at: string;
          description: string | null;
          id: string;
          is_demo: boolean;
          is_private: boolean;
          name: string;
          owner_id: string;
          slug: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_demo?: boolean;
          is_private?: boolean;
          name: string;
          owner_id: string;
          slug: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_demo?: boolean;
          is_private?: boolean;
          name?: string;
          owner_id?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_color: string;
          created_at: string;
          display_name: string | null;
          id: string;
          is_demo: boolean;
          username: string;
        };
        Insert: {
          avatar_color?: string;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_demo?: boolean;
          username: string;
        };
        Update: {
          avatar_color?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_demo?: boolean;
          username?: string;
        };
        Relationships: [];
      };
      thread_votes: {
        Row: {
          created_at: string;
          thread_id: string;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          thread_id: string;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          thread_id?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "thread_votes_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "thread_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      threads: {
        Row: {
          author_id: string;
          body: string | null;
          created_at: string;
          group_id: string;
          id: string;
          image_path: string | null;
          title: string;
        };
        Insert: {
          author_id: string;
          body?: string | null;
          created_at?: string;
          group_id: string;
          id?: string;
          image_path?: string | null;
          title: string;
        };
        Update: {
          author_id?: string;
          body?: string | null;
          created_at?: string;
          group_id?: string;
          id?: string;
          image_path?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "threads_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "threads_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          effort: string;
          group_id: string;
          id: string;
          is_open: boolean;
          minutes: number;
          place: string;
          reply_within_hours: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          effort: string;
          group_id: string;
          id?: string;
          is_open?: boolean;
          minutes: number;
          place?: string;
          reply_within_hours?: number;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          effort?: string;
          group_id?: string;
          id?: string;
          is_open?: boolean;
          minutes?: number;
          place?: string;
          reply_within_hours?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      task_completions: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          task_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          task_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_completions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      thank_yous: {
        Row: {
          body: string | null;
          completion_id: string;
          created_at: string;
          from_user_id: string;
          id: string;
          kind: string;
        };
        Insert: {
          body?: string | null;
          completion_id: string;
          created_at?: string;
          from_user_id: string;
          id?: string;
          kind: string;
        };
        Update: {
          body?: string | null;
          completion_id?: string;
          created_at?: string;
          from_user_id?: string;
          id?: string;
          kind?: string;
        };
        Relationships: [
          {
            foreignKeyName: "thank_yous_completion_id_fkey";
            columns: ["completion_id"];
            isOneToOne: true;
            referencedRelation: "task_completions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "thank_yous_from_user_id_fkey";
            columns: ["from_user_id"];
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
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

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
      accounts: {
        Row: {
          alias: string | null;
          created_at: string;
          household_id: string;
          id: string;
          naam: string;
          rekeningnummer: string;
          saldo: number;
          updated_at: string;
        };
        Insert: {
          alias?: string | null;
          created_at?: string;
          household_id: string;
          id?: string;
          naam: string;
          rekeningnummer: string;
          saldo?: number;
          updated_at?: string;
        };
        Update: {
          alias?: string | null;
          created_at?: string;
          household_id?: string;
          id?: string;
          naam?: string;
          rekeningnummer?: string;
          saldo?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };

      budget_categories: {
        Row: {
          allocated_amount: number;
          budget_id: string;
          id: string;
          subcategory_id: string | null;
        };
        Insert: {
          allocated_amount?: number;
          budget_id: string;
          id?: string;
          subcategory_id?: string | null;
        };
        Update: {
          allocated_amount?: number;
          budget_id?: string;
          id?: string;
          subcategory_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_categories_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "subcategories";
            referencedColumns: ["id"];
          }
        ];
      };

      budgets: {
        Row: {
          bedrag: number;
          created_at: string;
          household_id: string;
          id: string;
          naam: string;
          richting: string;
          rollover: boolean;
          type: string;
          updated_at: string;
        };
        Insert: {
          bedrag: number;
          created_at?: string;
          household_id: string;
          id?: string;
          naam: string;
          richting?: string;
          rollover?: boolean;
          type?: string;
          updated_at?: string;
        };
        Update: {
          bedrag?: number;
          created_at?: string;
          household_id?: string;
          id?: string;
          naam?: string;
          richting?: string;
          rollover?: boolean;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };

      categories: {
        Row: {
          created_at: string;
          household_id: string;
          icoon: string;
          id: string;
          kleur: string;
          naam: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          icoon?: string;
          id?: string;
          kleur?: string;
          naam: string;
          type?: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          icoon?: string;
          id?: string;
          kleur?: string;
          naam?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };

      household_members: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      households: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          household_id: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          household_id?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          household_id?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      subcategories: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          naam: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          naam: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          naam?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };

      transactions: {
        Row: {
          account_id: string | null;
          alias_tegenrekening: string | null;
          bedrag: number;
          category_id: string | null;
          created_at: string;
          datum: string;
          household_id: string;
          iban_tegenrekening: string | null;
          id: string;
          notitie: string | null;
          omschrijving: string;
          subcategory_id: string | null;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          alias_tegenrekening?: string | null;
          bedrag: number;
          category_id?: string | null;
          created_at?: string;
          datum?: string;
          household_id: string;
          iban_tegenrekening?: string | null;
          id?: string;
          notitie?: string | null;
          omschrijving: string;
          subcategory_id?: string | null;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          alias_tegenrekening?: string | null;
          bedrag?: number;
          category_id?: string | null;
          created_at?: string;
          datum?: string;
          household_id?: string;
          iban_tegenrekening?: string | null;
          id?: string;
          notitie?: string | null;
          omschrijving?: string;
          subcategory_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "subcategories";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      get_household_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_household_member: {
        Args: { hid: string };
        Returns: boolean;
      };
      is_household_owner: {
        Args: { hid: string };
        Returns: boolean;
      };
      user_household_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

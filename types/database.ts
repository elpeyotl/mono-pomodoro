// Supabase Database Types
// Diese Typen definieren die Struktur der Supabase-Tabellen

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          subtasks: Subtask[]
          is_completed: boolean
          pomodoro_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          subtasks?: Subtask[]
          is_completed?: boolean
          pomodoro_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          subtasks?: Subtask[]
          is_completed?: boolean
          pomodoro_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface Subtask {
  id: string
  title: string
  is_completed: boolean
}

// Helper type for task rows
export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

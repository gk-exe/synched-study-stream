export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          mood: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          position: number
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          position?: number
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "learning_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_catalog: {
        Row: {
          base_theme_id: string
          created_at: string
          description: string | null
          id: string
          is_starter: boolean
          metadata: Json
          name: string
          rarity: string
          slug: string
          species: string
          unlock_cost: number
          updated_at: string
        }
        Insert: {
          base_theme_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_starter?: boolean
          metadata?: Json
          name: string
          rarity?: string
          slug: string
          species?: string
          unlock_cost?: number
          updated_at?: string
        }
        Update: {
          base_theme_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_starter?: boolean
          metadata?: Json
          name?: string
          rarity?: string
          slug?: string
          species?: string
          unlock_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      companion_concepts: {
        Row: {
          adopted_at: string | null
          adopted_companion_id: string | null
          created_at: string
          error: string | null
          generated_asset_path: string | null
          id: string
          inspiration_paths: string[]
          name: string | null
          palette: Json
          preview_url: string | null
          prompt: string | null
          reference_path: string | null
          status: string
          style: string
          updated_at: string
          user_id: string
          variations: Json
        }
        Insert: {
          adopted_at?: string | null
          adopted_companion_id?: string | null
          created_at?: string
          error?: string | null
          generated_asset_path?: string | null
          id?: string
          inspiration_paths?: string[]
          name?: string | null
          palette?: Json
          preview_url?: string | null
          prompt?: string | null
          reference_path?: string | null
          status?: string
          style?: string
          updated_at?: string
          user_id: string
          variations?: Json
        }
        Update: {
          adopted_at?: string | null
          adopted_companion_id?: string | null
          created_at?: string
          error?: string | null
          generated_asset_path?: string | null
          id?: string
          inspiration_paths?: string[]
          name?: string | null
          palette?: Json
          preview_url?: string | null
          prompt?: string | null
          reference_path?: string | null
          status?: string
          style?: string
          updated_at?: string
          user_id?: string
          variations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "companion_concepts_adopted_companion_id_fkey"
            columns: ["adopted_companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_inventory: {
        Row: {
          acquired_at: string
          acquired_via: string
          equipped_on: string | null
          id: string
          is_equipped: boolean
          item_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          acquired_via?: string
          equipped_on?: string | null
          id?: string
          is_equipped?: boolean
          item_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          acquired_via?: string
          equipped_on?: string | null
          id?: string
          is_equipped?: boolean
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_inventory_equipped_on_fkey"
            columns: ["equipped_on"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "companion_items"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_items: {
        Row: {
          cost_coins: number
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          preview: Json
          rarity: string
          slug: string
          unlock_rule: Json
        }
        Insert: {
          cost_coins?: number
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          name: string
          preview?: Json
          rarity?: string
          slug: string
          unlock_rule?: Json
        }
        Update: {
          cost_coins?: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          preview?: Json
          rarity?: string
          slug?: string
          unlock_rule?: Json
        }
        Relationships: []
      }
      companion_milestones: {
        Row: {
          acknowledged: boolean
          companion_id: string | null
          created_at: string
          id: string
          kind: string
          reward: Json
          threshold: number | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          companion_id?: string | null
          created_at?: string
          id?: string
          kind: string
          reward?: Json
          threshold?: number | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          companion_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          reward?: Json
          threshold?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_milestones_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_reactions: {
        Row: {
          companion_id: string | null
          created_at: string
          id: string
          intensity: number
          message: string | null
          metadata: Json
          mood: string
          style: string
          trigger: string
          user_id: string
        }
        Insert: {
          companion_id?: string | null
          created_at?: string
          id?: string
          intensity?: number
          message?: string | null
          metadata?: Json
          mood: string
          style?: string
          trigger: string
          user_id: string
        }
        Update: {
          companion_id?: string | null
          created_at?: string
          id?: string
          intensity?: number
          message?: string | null
          metadata?: Json
          mood?: string
          style?: string
          trigger?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_reactions_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      companions: {
        Row: {
          catalog_id: string
          created_at: string
          customization: Json
          experience: number
          experience_to_next: number
          id: string
          is_active: boolean
          last_interacted_at: string | null
          level: number
          mood: string
          nickname: string | null
          unlocked_via: string
          updated_at: string
          user_id: string
        }
        Insert: {
          catalog_id: string
          created_at?: string
          customization?: Json
          experience?: number
          experience_to_next?: number
          id?: string
          is_active?: boolean
          last_interacted_at?: string | null
          level?: number
          mood?: string
          nickname?: string | null
          unlocked_via?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          customization?: Json
          experience?: number
          experience_to_next?: number
          id?: string
          is_active?: boolean
          last_interacted_at?: string | null
          level?: number
          mood?: string
          nickname?: string | null
          unlocked_via?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companions_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "companion_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_goals: {
        Row: {
          created_at: string
          done: boolean
          id: string
          label: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          label: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          label?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          source: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          due_at: string
          ease: number
          front: string
          id: string
          interval_days: number
          last_reviewed_at: string | null
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          due_at?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          due_at?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          created_at: string
          id: string
          mood: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdfs: {
        Row: {
          created_at: string
          filename: string
          id: string
          page_count: number | null
          processing_status: string
          size_bytes: number
          storage_path: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          page_count?: number | null
          processing_status?: string
          size_bytes?: number
          storage_path: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          page_count?: number | null
          processing_status?: string
          size_bytes?: number
          storage_path?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          exam_type: string | null
          full_name: string | null
          id: string
          onboarded: boolean
          study_goals: string[] | null
          study_style: string | null
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          exam_type?: string | null
          full_name?: string | null
          id: string
          onboarded?: boolean
          study_goals?: string[] | null
          study_style?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          exam_type?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          study_goals?: string[] | null
          study_style?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          answer: string
          choices: Json
          created_at: string
          explanation: string | null
          id: string
          position: number
          prompt: string
          quiz_id: string
          user_id: string
        }
        Insert: {
          answer: string
          choices?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          position?: number
          prompt: string
          quiz_id: string
          user_id: string
        }
        Update: {
          answer?: string
          choices?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          position?: number
          prompt?: string
          quiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          quiz_id: string
          score: number
          started_at: string
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number
          started_at?: string
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          started_at?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          source: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_explanations: {
        Row: {
          content: string
          created_at: string
          favorite: boolean
          folder: string | null
          id: string
          source_question: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          favorite?: boolean
          folder?: string | null
          id?: string
          source_question?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          favorite?: boolean
          folder?: string | null
          id?: string
          source_question?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration_seconds: number
          id: string
          mode: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_seconds: number
          id?: string
          mode: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          mode?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subtopics: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          chapter_id: string | null
          created_at: string
          difficulty: number
          id: string
          mastery: number
          name: string
          position: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          difficulty?: number
          id?: string
          mastery?: number
          name: string
          position?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          difficulty?: number
          id?: string
          mastery?: number
          name?: string
          position?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_attachments: {
        Row: {
          created_at: string
          id: string
          kind: string
          metadata: Json
          ocr_text: string | null
          processing_status: string
          session_id: string
          source_url: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          ocr_text?: string | null
          processing_status?: string
          session_id: string
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          ocr_text?: string | null
          processing_status?: string
          session_id?: string
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_attachments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          session_id: string | null
          subject_id: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          session_id?: string | null
          subject_id?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          session_id?: string | null
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_explanations: {
        Row: {
          correction: string | null
          created_at: string
          examples: Json
          formula: string | null
          id: string
          is_saved: boolean
          kind: string
          mistake: string | null
          saved_explanation_id: string | null
          session_id: string | null
          steps: Json
          summary: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          correction?: string | null
          created_at?: string
          examples?: Json
          formula?: string | null
          id?: string
          is_saved?: boolean
          kind: string
          mistake?: string | null
          saved_explanation_id?: string | null
          session_id?: string | null
          steps?: Json
          summary?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          correction?: string | null
          created_at?: string
          examples?: Json
          formula?: string | null
          id?: string
          is_saved?: boolean
          kind?: string
          mistake?: string | null
          saved_explanation_id?: string | null
          session_id?: string | null
          steps?: Json
          summary?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_explanations_saved_explanation_id_fkey"
            columns: ["saved_explanation_id"]
            isOneToOne: false
            referencedRelation: "saved_explanations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_explanations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_explanations_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_memory: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: string
          last_seen_at: string
          updated_at: string
          user_id: string
          value: Json
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          kind: string
          last_seen_at?: string
          updated_at?: string
          user_id: string
          value?: Json
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: string
          last_seen_at?: string
          updated_at?: string
          user_id?: string
          value?: Json
          weight?: number
        }
        Relationships: []
      }
      tutor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          metadata: Json
          role: string
          session_id: string
          step_index: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          role: string
          session_id: string
          step_index?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          role?: string
          session_id?: string
          step_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty: number
          flow: string
          id: string
          last_message_at: string | null
          progress: Json
          question: string | null
          status: string
          subject_id: string | null
          subtopic_id: string | null
          tags: string[]
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty?: number
          flow?: string
          id?: string
          last_message_at?: string | null
          progress?: Json
          question?: string | null
          status?: string
          subject_id?: string | null
          subtopic_id?: string | null
          tags?: string[]
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty?: number
          flow?: string
          id?: string
          last_message_at?: string | null
          progress?: Json
          question?: string | null
          status?: string
          subject_id?: string | null
          subtopic_id?: string | null
          tags?: string[]
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_sessions_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          coins: number
          companion_theme: string
          completed_today: number
          created_at: string
          current_task: string | null
          cycle_count: number
          last_break_date: string | null
          last_completed_date: string | null
          long_breaks_today: number
          momentum_score: number
          streak: number
          total_focus_sessions: number
          unlocked_features: string[]
          unlocked_themes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          companion_theme?: string
          completed_today?: number
          created_at?: string
          current_task?: string | null
          cycle_count?: number
          last_break_date?: string | null
          last_completed_date?: string | null
          long_breaks_today?: number
          momentum_score?: number
          streak?: number
          total_focus_sessions?: number
          unlocked_features?: string[]
          unlocked_themes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          companion_theme?: string
          completed_today?: number
          created_at?: string
          current_task?: string | null
          cycle_count?: number
          last_break_date?: string | null
          last_completed_date?: string | null
          long_breaks_today?: number
          momentum_score?: number
          streak?: number
          total_focus_sessions?: number
          unlocked_features?: string[]
          unlocked_themes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

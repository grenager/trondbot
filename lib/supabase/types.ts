export type ReferralStatus = "pending" | "completed";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  invite_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  status: ReferralStatus;
  grace_credits_granted: number;
  full_credits_granted: number;
  created_at: string;
  completed_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          credits?: number;
          invite_code: string;
          referred_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          credits?: number;
          invite_code?: string;
          referred_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: Referral;
        Insert: {
          id?: string;
          referrer_id: string;
          referee_id?: string | null;
          status?: ReferralStatus;
          grace_credits_granted?: number;
          full_credits_granted?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          referrer_id?: string;
          referee_id?: string | null;
          status?: ReferralStatus;
          grace_credits_granted?: number;
          full_credits_granted?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_referral_credits: {
        Args: { amount: number };
        Returns: number;
      };
      create_referral_invite: {
        Args: Record<string, never>;
        Returns: {
          invite_code: string;
          credits: number;
          grace_credits: number;
        }[];
      };
      redeem_referral: {
        Args: { ref_code: string };
        Returns: boolean;
      };
      spend_message_credit: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

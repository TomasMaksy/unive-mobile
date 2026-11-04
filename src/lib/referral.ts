import { apiFetch } from '@/lib/api';

/**
 * Your Unive invite: give & get, the same as the website's. A friend who
 * subscribes through your link gets a free month, and so do you
 * (src/features/user_referral in unive-v2).
 */
export type ReferralInvite = {
  referralCode: string;
  inviteUrl: string;
  /** Friends who subscribed through your link. */
  timesRedeemed: number;
  unseenRedemptions: number;
  /** Free months waiting until you subscribe. */
  pendingRewardMonths: number;
};

export function fetchReferralInvite() {
  return apiFetch<ReferralInvite>('/api/mobile/referral');
}

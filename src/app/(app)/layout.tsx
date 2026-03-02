import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // --- Auth check -----------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --- Fetch commission data for the header gauge ---------------------------
  // Get total commissions earned by this commissioner
  const { data: commissionRows } = await supabase
    .from('commissions')
    .select('amount')
    .eq('commissioner_id', user.id);

  const totalCommission = (commissionRows ?? []).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  // Get the next commission tier the user hasn't reached yet
  const { data: nextTier } = await supabase
    .from('commission_tiers')
    .select('amount_threshold, label')
    .gt('amount_threshold', totalCommission)
    .order('amount_threshold', { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextTierAmount = nextTier?.amount_threshold ?? totalCommission;

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      <Header
        showGauge
        currentAmount={totalCommission}
        nextTierAmount={nextTierAmount}
      />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

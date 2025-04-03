import LeagueLeaderTable from '@/components/leagueLeaderTable';
import Teams from '@/components/teams';
import Image from 'next/image';

export default function Home() {
  return (
    <main className='flex min-h-96 flex-col items-center p-24'>
      <div className='rounded-3xl border border-white p-5'>
        <h1 className='text-2xl'>League Leaders</h1>
      </div>
      <Teams />
    </main>
  );
}

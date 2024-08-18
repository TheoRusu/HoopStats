'use client';
import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { teamClient } from '@/apollo-client';
import LeagueLeaderTable from './leagueLeaderTable';

const TEAMS_QUERY = gql`
  query {
    teams {
      id
      abbreviation
    }
  }
`;

const Teams = () => {
  const {
    loading: teamsLoading,
    error: teamsError,
    data: teamsData,
  } = useQuery(TEAMS_QUERY, { client: teamClient });

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-16 md:gap-50'>
      <LeagueLeaderTable
        names={['Stephen Curry', 'Luka Doncic']}
        title='Points'
      />
      <LeagueLeaderTable
        names={['Stephen Curry', 'Luka Doncic']}
        title='Assists'
      />
      <LeagueLeaderTable
        names={['Stephen Curry', 'Luka Doncic']}
        title='Rebounds'
      />
    </div>
  );
};

export default Teams;

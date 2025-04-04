import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import { RESTDataSource } from '@apollo/datasource-rest';
import { chromium } from 'playwright';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';

class BallDontLieAPI extends RESTDataSource {
  override baseURL = 'https://api.balldontlie.io/v1/';

  async getTeams(): Promise<Team[]> {
    const response = await this.get('teams', {
      headers: {
        Authorization: `${process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY}`,
      },
    });
    return response.data;
  }

  async getPlayers(): Promise<Player[]> {
    let allPlayers: Player[] = [];
    let cursor: string | undefined = undefined;
    const per_page = '100'; // Set your desired page size

    do {
      const response: ApiResponse = await this.get('players', {
        headers: {
          Authorization: `${process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY}`,
        },
        params: {
          cursor,
          per_page,
          'team_ids[]': ['28'],
        },
      });

      allPlayers = allPlayers.concat(response.data);
      cursor = response.meta.next_cursor;
    } while (cursor !== undefined);

    return allPlayers;
  }

  async getSeasonAverages(player_ids: string[]): Promise<SeasonAverages[]> {
    const formattedPlayerIds = player_ids
      .map((id) => `player_ids[]=${id}`)
      .join('&');
    const response = await this.get(`season_averages?${formattedPlayerIds}`, {
      headers: {
        Authorization: `${process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY}`,
      },
      params: {
        season: '2023',
      },
    });
    return response.data;
  }
}

interface ApiResponse {
  data: Player[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}

interface Team {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number;
  draft_round: number;
  draft_number: number;
  team: Team;
}

interface SeasonAverages {
  pts: number;
  ast: number;
  turnover: number;
  pf: number;
  fga: number;
  fgm: number;
  fta: number;
  ftm: number;
  fg3a: number;
  fg3m: number;
  reb: number;
  oreb: number;
  dreb: number;
  stl: number;
  blk: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  min: string;
  games_played: number;
  player_id: number;
  season: number;
}

const typeDefs = gql`
  type Team {
    id: Int
    conference: String
    division: String
    city: String
    name: String
    full_name: String
    abbreviation: String
  }

  type Player {
    id: Int
    first_name: String
    last_name: String
    position: String
    height: String
    weight: String
    jersey_number: String
    college: String
    country: String
    draft_year: Int
    draft_round: Int
    draft_number: Int
    team: Team
  }

  type SeasonAverage {
    pts: Float
    ast: Float
    turnover: Float
    pf: Float
    fga: Float
    fgm: Float
    fta: Float
    ftm: Float
    fg3a: Float
    fg3m: Float
    reb: Float
    oreb: Float
    dreb: Float
    stl: Float
    blk: Float
    fg_pct: Float
    fg3_pct: Float
    ft_pct: Float
    min: String
    games_played: Int
    player_id: Int
    season: Int
  }

  type PlayerStats {
    name: String
    team: String
    age: Int
    gamesPlayed: Int
    wins: Int
    losses: Int
    minutes: Float
    points: Float
    fieldGoalsMade: Float
    fieldGoalsAttempted: Float
    fieldGoalPercentage: Float
    threePointersMade: Float
    threePointersAttempted: Float
    threePointPercentage: Float
    freeThrowsMade: Float
    freeThrowsAttempted: Float
    freeThrowPercentage: Float
    offensiveRebounds: Float
    defensiveRebounds: Float
    totalRebounds: Float
    assists: Float
    turnovers: Float
    steals: Float
    blocks: Float
    personalFouls: Float
    fantasyPoints: Float
    doubleDoubles: Float
    tripleDoubles: Float
    plusMinus: Float
  }

  type Query {
    teams: [Team]
    players: [Player]
    seasonAverages: [SeasonAverage]
    playerStats: [PlayerStats]
  }
`;

const resolvers = {
  Query: {
    teams: async (_, __, { dataSources }) => {
      return dataSources.ballDontLieAPI.getTeams();
    },
    players: async (_, __, { dataSources }) => {
      return dataSources.ballDontLieAPI.getPlayers();
    },
    seasonAverages: async (_, __, { dataSources }) => {
      return dataSources.ballDontLieAPI.getSeasonAverages([
        '17896055',
        '3547269',
        '203507',
      ]);
    },
    playerStats: async () => {
      try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.81',
        });
        const page = await context.newPage();
        await page.goto(
          'https://www.nba.com/stats/players/traditional?SeasonType=Regular+Season'
        );

        const statNames = [
          'name',
          'team',
          'age',
          'gamesPlayed',
          'wins',
          'losses',
          'minutes',
          'points',
          'fieldGoalsMade',
          'fieldGoalsAttempted',
          'fieldGoalPercentage',
          'threePointersMade',
          'threePointersAttempted',
          'threePointPercentage',
          'freeThrowsMade',
          'freeThrowsAttempted',
          'freeThrowPercentage',
          'offensiveRebounds',
          'defensiveRebounds',
          'totalRebounds',
          'assists',
          'turnovers',
          'steals',
          'blocks',
          'personalFouls',
          'fantasyPoints',
          'doubleDoubles',
          'tripleDoubles',
          'plusMinus',
        ];

        const csvWriter = createObjectCsvWriter({
          path: 'playerStats.csv',
          header: statNames.map((name) => ({ id: name, title: name })),
        });

        const allPlayerStats = [];

        let hasNextPage = true;

        while (hasNextPage) {
          const pageStats = await page.$$eval(
            '.Crom_body__UYOcU tr',
            (rows, statNames) => {
              return Array.from(rows).map((row) => {
                const cells = row.querySelectorAll('td');
                return statNames.reduce((acc, stat, index) => {
                  acc[stat] = cells[index + 1]?.textContent?.trim() || '';
                  return acc;
                }, {} as Record<string, string>);
              });
            },
            statNames
          ); // Passing statNames as an argument to $$eval

          allPlayerStats.push(...pageStats);

          // Check if there is a next page button and if it is enabled
          const nextPageButton = await page.$(
            'button.Pagination_button__sqGoH[title="Next Page Button"]'
          );
          if (nextPageButton) {
            const isDisabled = await nextPageButton.evaluate((button) =>
              button.hasAttribute('disabled')
            );
            if (!isDisabled) {
              await nextPageButton.click();
              await page.waitForTimeout(2000); // Adjust timeout as needed for the page to load
            } else {
              hasNextPage = false;
            }
          } else {
            hasNextPage = false;
          }
        }

        await csvWriter.writeRecords(allPlayerStats);

        await browser.close();
        return allPlayerStats;
      } catch (error) {
        console.error('Error during scraping:', error.message);
        console.error(error.stack);
        throw new Error('An error occurred during scraping.');
      }
    },
  },
};

interface ContextValue {
  dataSources: {
    ballDontLieAPI: BallDontLieAPI;
  };
}

const server = new ApolloServer<ContextValue>({
  resolvers,
  typeDefs,
});

export default startServerAndCreateNextHandler(server, {
  context: async () => {
    const { cache } = server;
    return {
      dataSources: {
        ballDontLieAPI: new BallDontLieAPI({ cache }),
      },
    };
  },
});

import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import { chromium } from 'playwright';
import { createObjectCsvWriter } from 'csv-writer';
import { NextRequest, NextResponse } from 'next/server';

const typeDefs = gql`
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
    playerStats: [PlayerStats]
  }
`;

const resolvers = {
  Query: {
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
      } catch (error: any) {
        console.error('Error during scraping:', error.message);
        console.error(error.stack);
        throw new Error('An error occurred during scraping.');
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export async function POST(request: NextRequest) {
  const response = await handler(request);
  return response;
}

export async function GET(request: NextRequest) {
  const response = await handler(request);
  return response;
}

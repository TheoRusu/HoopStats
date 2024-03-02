import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import { RESTDataSource } from '@apollo/datasource-rest';

class HoopStatsAPI extends RESTDataSource {
  override baseURL = 'https://api.balldontlie.io/v1/';

  async getTeams(): Promise<Team[]> {
    const response = await this.get('teams', {
      headers: {
        Authorization: `${process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY}`,
      },
    });
    return response.data;
  }
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

const resolvers = {
  Query: {
    teams: async (_, __, { dataSources }) => {
      return dataSources.hoopStatsAPI.getTeams();
    },
  },
};

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

  type Query {
    teams: [Team]
  }
`;

interface ContextValue {
  dataSources: {
    hoopStatsAPI: HoopStatsAPI;
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
        hoopStatsAPI: new HoopStatsAPI({ cache }),
      },
    };
  },
});

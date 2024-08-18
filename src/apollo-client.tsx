import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const createAuthLink = (uri: string) => {
  const httpLink = createHttpLink({
    useGETForQueries: true,
    uri,
  });

  const authLink = setContext((_, { headers }) => {
    const apiKey = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY;
    return {
      headers: {
        ...headers,
        Authorization: apiKey,
      },
    };
  });

  return authLink.concat(httpLink);
};

export const teamClient = new ApolloClient({
  link: createAuthLink('https://api.balldontlie.io/v1/teams'),
  cache: new InMemoryCache(),
});

import { defineConfig } from 'orval'

export default defineConfig({
  friday: {
    input: {
      target: 'http://localhost:8000/openapi.json',
    },
    output: {
      target: 'src/api/generated/fridayApi.ts',
      schemas: 'src/api/generated/schemas',
      client: 'react-query',
      mode: 'tags-split',
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'default',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})

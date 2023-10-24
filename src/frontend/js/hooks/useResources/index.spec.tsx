import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';
import queryString from 'query-string';
import { factory } from 'utils/test/factories/factories';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';
import { SessionProvider, useSession } from 'contexts/SessionContext';
import { Maybe } from 'types/utils';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { ResourcesQuery, useResource, useResources, UseResourcesProps } from './index';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

interface Todo {
  id: string;
  name: string;
}
interface TodoQuery extends ResourcesQuery {
  name?: string;
}

export const TodoFactory = factory<Todo>(() => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(Math.ceil(Math.random() * 3)),
}));

const API = {
  todos: {
    get: async (filters?: TodoQuery): Promise<Todo[]> => {
      let url = 'https://example.com/api/todos';
      const { id, ...restFilters } = filters || {};
      const queryParameters = queryString.stringify(restFilters);
      if (id) {
        url = `${url}/${id}`;
      }
      if (queryParameters) {
        url = `${url}?${queryParameters}`;
      }
      return fetch(url).then((response) => response.json());
    },
    update: async (payload: Todo) => {
      return fetch(`https://example.com/api/todos/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }).then((response) => response.json());
    },
  },
};

const Wrapper = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={createTestQueryClient({ user: true })}>
      <IntlProvider locale="en">
        <SessionProvider>{children}</SessionProvider>
      </IntlProvider>
    </QueryClientProvider>
  );
};

describe('useResources (omniscient)', () => {
  const props: UseResourcesProps<Todo, TodoQuery> = {
    queryKey: ['todos'],
    apiInterface: () => API.todos,
    omniscient: true,
    omniscientFiltering: (data, filters) => {
      return data.filter((todo) => {
        if (filters.name) {
          return todo.name.startsWith(filters.name);
        }
        return true;
      });
    },
  };

  const useTodos = useResources(props);
  const useTodo = useResource(props);

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('loads todos', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    const responseDeferred = new Deferred();
    fetchMock.get('https://example.com/api/todos', responseDeferred.promise);

    const { result } = renderHook(() => useTodos(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.states.isPending).toBe(true));
    expect(result.current.states.fetching).toBe(true);
    expect(result.current.items).toEqual([]);

    responseDeferred.resolve(todos);

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(result.current.states.fetching).toBe(false);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(todos));
  });

  it('loads todos with filtering', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    const todosToFind = [todos[2], todos[3]];
    todosToFind.forEach((todo) => {
      todo.name = 'Find me ' + todo.name;
    });
    const responseDeferred = new Deferred();
    fetchMock.get('https://example.com/api/todos', responseDeferred.promise);

    const { result, rerender } = renderHook((filters?: TodoQuery) => useTodos(filters), {
      wrapper: Wrapper,
    });

    // Loads without filters the first time.
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.fetching).toBe(true);
    expect(result.current.items).toEqual([]);

    responseDeferred.resolve(todos);

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(result.current.states.fetching).toBe(false);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(todos));

    // Filter todos with name starting with "Find me".
    rerender({ name: 'Find me' });
    await waitFor(() =>
      expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(todosToFind)),
    );

    // Changing filter to something that will give an empty result to verify that filtering is
    // updated.
    rerender({ name: '$^^``sd' });
    await waitFor(() => expect(result.current.items.length).toBe(0));
  });

  it('invalidates after mutation', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    const todo = todos[0];

    const mutatedTodos = [{ ...todo, name: 'My super new task' }, ...todos.slice(1)];
    const responseDeferred = new Deferred();
    fetchMock.get('https://example.com/api/todos', todos);
    fetchMock.put('https://example.com/api/todos/' + todo.id, responseDeferred.promise);

    expect(fetchMock.called('https://example.com/api/todos')).toBe(false);
    const { result } = renderHook(() => useTodos(), {
      wrapper: Wrapper,
    });

    // The get method is not deferred so everything is loaded synchronously.
    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(result.current.states.fetching).toBe(false);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(todos));
    expect(fetchMock.called('https://example.com/api/todos')).toBe(true);

    // Trigger a mutation.
    result.current.methods.update({ ...todo, name: 'My super new task' });

    // As the mutation is deferred, the state is still pending.
    await waitFor(() => expect(result.current.states.isPending).toBe(true));
    expect(result.current.states.updating).toBe(true);

    // Update the get mock to return the mutated todos.
    fetchMock.get('https://example.com/api/todos', mutatedTodos, { overwriteRoutes: true });
    responseDeferred.resolve(true);

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(result.current.states.updating).toBe(false);
    // The items are updated. Confirming that the mutation was triggered a new get request.
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(mutatedTodos));
  });

  it('loads a specific todo', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    const responseDeferred = new Deferred();
    fetchMock.get('https://example.com/api/todos', responseDeferred.promise);

    const expectedTodo = pickRandomlyFromArray(todos);
    const { result } = renderHook(() => useTodo(expectedTodo.id), {
      wrapper: Wrapper,
    });

    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.fetching).toBe(true);
    expect(result.current.item).toBe(undefined);

    responseDeferred.resolve(todos);

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(result.current.states.fetching).toBe(false);
    expect(JSON.stringify(result.current.item)).toBe(JSON.stringify(expectedTodo));
  });

  it('waits for id to be defined before fetching', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    fetchMock.get('https://example.com/api/todos', todos);

    const expectedTodo = pickRandomlyFromArray(todos);
    const { result, rerender } = renderHook(
      (initialProps: Maybe<string>) => useTodo(initialProps),
      {
        wrapper: Wrapper,
      },
    );

    expect(result.current.states.isPending).toBe(true);
    expect(result.current.item).toBe(undefined);
    expect(fetchMock.called('https://example.com/api/todos')).toBe(false);

    rerender(expectedTodo.id);

    await waitFor(() =>
      expect(JSON.stringify(result.current.item)).toBe(JSON.stringify(expectedTodo)),
    );
    expect(fetchMock.lastUrl()).toBe('https://example.com/api/todos');
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.fetching).toBe(false);
  });

  it('fails to load a specific todo', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    const responseDeferred = new Deferred();
    fetchMock.get('https://example.com/api/todos', responseDeferred.promise);

    const { result } = renderHook(() => useTodo('-1'), {
      wrapper: Wrapper,
    });

    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.fetching).toBe(true);
    expect(result.current.item).toBe(undefined);
    expect(result.current.states.error).toBe(undefined);

    responseDeferred.resolve(todos);

    await waitFor(() => expect(result.current.states.error).toBe('Cannot find the resource.'));
    expect(result.current.item).toBe(undefined);
  });

  it('waits for id to be defined before returning data even if the data is already in cache', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    fetchMock.get('https://example.com/api/todos', todos);

    const expectedTodo = pickRandomlyFromArray(todos);
    const { result, rerender } = renderHook(
      (initialProps: Maybe<string>) => useTodo(initialProps),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => expect(result.current.states.isPending).toBe(true));
    expect(result.current.item).toBe(undefined);
    expect(fetchMock.called('https://example.com/api/todos')).toBe(false);

    rerender(expectedTodo.id);

    await waitFor(() => expect(result.current.item).toEqual(expectedTodo));
    expect(fetchMock.lastUrl()).toBe('https://example.com/api/todos');
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.fetching).toBe(false);

    rerender(undefined);
    await waitFor(() => expect(result.current.item).toBe(undefined));
  });
});

describe('useResource (omniscient) with session', () => {
  const props: UseResourcesProps<Todo, TodoQuery> = {
    queryKey: ['todos'],
    apiInterface: () => API.todos,
    session: true,
    omniscient: true,
    omniscientFiltering: (data, filters) => {
      return data.filter((todo) => {
        if (filters.name) {
          return todo.name.startsWith(filters.name);
        }
        return true;
      });
    },
  };

  const useTodos = useResources(props);

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://demo.endpoint/logout', HttpStatusCode.OK);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('re-fetches todos on user logout', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    fetchMock.get('https://example.com/api/todos', todos);

    const LogoutComponent = () => {
      const session = useSession();
      return <button onClick={session.destroy}>Logout</button>;
    };

    const { result } = renderHook(() => useTodos(), {
      wrapper: (wrapperProps: PropsWithChildren) => {
        return Wrapper({
          children: (
            <>
              <LogoutComponent />
              {wrapperProps.children}
            </>
          ),
        });
      },
    });

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    await waitFor(() => expect(result.current.items.length).toBe(5));

    const button = screen.getByRole('button', { name: 'Logout' });
    await act(async () => {
      fireEvent.click(button);
    });

    // isPending true means that the query is disabled, because no user is in session.
    await waitFor(() => expect(result.current.states.isPending).toBe(true));
    // Expect data to be cleared.
    await waitFor(() => expect(result.current.items.length).toBe(0));
  });
});

describe('useResource (non-omniscient)', () => {
  const props: UseResourcesProps<Todo, TodoQuery> = {
    queryKey: ['todos'],
    apiInterface: () => API.todos,
  };

  const useTodos = useResources(props);
  const useTodo = useResource(props);

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('triggers a new requests each time the filters change', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    fetchMock.get('https://example.com/api/todos', todos);
    fetchMock.get('https://example.com/api/todos?name=e', todos);
    fetchMock.get('https://example.com/api/todos?name=ef', todos);

    expect(fetchMock.called('https://example.com/api/todos')).toBe(false);
    expect(fetchMock.called('https://example.com/api/todos?name=e')).toBe(false);
    expect(fetchMock.called('https://example.com/api/todos?name=ef')).toBe(false);

    const { result, rerender } = renderHook((initialProps?: TodoQuery) => useTodos(initialProps), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(fetchMock.called('https://example.com/api/todos')).toBe(true);
    expect(fetchMock.called('https://example.com/api/todos?name=e')).toBe(false);
    expect(fetchMock.called('https://example.com/api/todos?name=ef')).toBe(false);

    rerender({ name: 'e' });
    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(fetchMock.called('https://example.com/api/todos')).toBe(true);
    expect(fetchMock.called('https://example.com/api/todos?name=e')).toBe(true);
    expect(fetchMock.called('https://example.com/api/todos?name=ef')).toBe(false);

    rerender({ name: 'ef' });
    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(fetchMock.called('https://example.com/api/todos')).toBe(true);
    expect(fetchMock.called('https://example.com/api/todos?name=e')).toBe(true);
    expect(fetchMock.called('https://example.com/api/todos?name=ef')).toBe(true);
  });

  it('handles API errors', async () => {
    const responseDeferred = new Deferred();
    fetchMock.get('https://example.com/api/todos', responseDeferred.promise);

    const { result } = renderHook(() => useTodos(), {
      wrapper: Wrapper,
    });

    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.fetching).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(result.current.items).toEqual([]);

    responseDeferred.reject({
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Bad request',
    });

    await waitFor(() => expect(result.current.states.isPending).toBe(false));
    expect(result.current.states.fetching).toBe(false);
    expect(result.current.states.error).toEqual(
      'An error occurred while fetching resources. Please retry later.',
    );
    expect(result.current.items).toEqual([]);
  });

  it('retrieves a todo through provided filters', async () => {
    const todo: Todo = TodoFactory().one();
    const responseDeferred = new Deferred();
    fetchMock.get(
      `https://example.com/api/todos/${todo.id}?name=${todo.name}`,
      responseDeferred.promise,
    );

    const { result } = renderHook(() => useTodo(todo.id, { name: todo.name }), {
      wrapper: Wrapper,
    });

    expect(result.current.states.fetching).toBe(true);
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.item).toBeUndefined();

    responseDeferred.resolve(todo);

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
    });
    expect(fetchMock.called(`https://example.com/api/todos/${todo.id}?name=${todo.name}`)).toBe(
      true,
    );
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.item).toStrictEqual(todo);
  });

  it('handles PaginatedResponse', async () => {
    const todos: Todo[] = TodoFactory().many(5);
    const responseDeferred = new Deferred();
    fetchMock.get(`https://example.com/api/todos`, responseDeferred.promise);

    const { result } = renderHook(() => useTodos(), {
      wrapper: Wrapper,
    });

    expect(result.current.states.fetching).toBe(true);
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.items).toEqual([]);

    responseDeferred.resolve({
      results: todos,
      next: 'next',
      previous: 'prev',
      count: todos.length,
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
    });
    expect(result.current.items).toStrictEqual(todos);
    expect(result.current.meta).toStrictEqual({
      pagination: {
        next: 'next',
        previous: 'prev',
        count: todos.length,
      },
    });
  });
});

function pickRandomlyFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

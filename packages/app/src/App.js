import React, { useState, useEffect, useContext } from 'react';
import { Router, Link, navigate } from '@reach/router';
import useFauna from './useFauna';
import useNetlifyIdentity from 'hooks/useNetlifyIdentity';
import { FaunaCtx, UserCtx } from 'contexts';

import Spinner from './components/Spinner';
import InputArea from './components/InputArea';
import TodoItem from './components/TodoItem';
import './login.css';

const NotFound = () => <div>Sorry, nothing here.</div>;

function Login() {
  const { user, doLogin, doLogout } = useContext(UserCtx);
  var actionForm = (
    <span>
      <button onClick={doLogin}>Login or Sign Up</button>
    </span>
  );
  return (
    <div className="Login">
      {user ? <button onClick={doLogout}>Logout</button> : actionForm}
    </div>
  );
}

function List(props) {
  const {
    fetchList,
    isLoading,
    client,
    addTodo,
    toggle,
    destroy,
    load,
    save
  } = useContext(FaunaCtx);
  const [state, setState] = useState(null);
  const { listId } = props;
  useEffect(
    () =>
      client &&
      void fetchList(listId)
        .then(setState)
        .catch(err => console.log({ err }) || setState({ err })),
    [client]
  );
  const [editing, setEditing] = useState(null);
  const edit = todo => () => setEditing(todo.ref);

  console.log({ state });
  return isLoading || !state || !state.list ? (
    <Spinner />
  ) : (
    <div>
      <div className="listNav">
        <label>List: {state.list.data.title}</label>
        <button onClick={() => navigate('/')}>back to all lists</button>
      </div>
      <ul className="todo-list">
        {state.err ? (
          <div>{JSON.stringify(state.err, null, 2)} </div>
        ) : (
          state.todos.map(todo => {
            const handle = fn => () => load(fn(todo, listId).then(setState));
            return (
              <TodoItem
                key={todo.ref.value.id}
                todo={todo.data}
                onToggle={handle(toggle)}
                onDestroy={handle(destroy)}
                onEdit={edit(todo)}
                editing={editing === todo.ref}
                onSave={val => handle(save(val))()}
                onCancel={console.log}
                // onCancel={this.cancel.bind(this)}
              />
            );
          })
        )}
      </ul>
      <InputArea
        onSubmit={title =>
          load(addTodo(state.list, listId)(title).then(setState))
        }
        placeholder="Add a new item to your list."
      />
    </div>
  );
}
function AllLists() {
  const { lists, isLoading, addList } = useContext(FaunaCtx);
  return (
    <div>
      <div className="listNav">
        <label>Choose a list.</label>
      </div>
      <section className="main">
        {isLoading ? (
          <Spinner />
        ) : (
          <ul className="todo-list">
            {lists.map(({ data, ref }) => {
              console.log('list', data, ref);
              return (
                <li key={ref.value.id}>
                  {/* <label onClick={() => alert('go')}>{data.title}</label> */}
                  <label>
                    <Link to={`/list/${ref.value.id}`}>{data.title}</Link>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <InputArea
        onSubmit={addList}
        placeholder="Create a new list or choose from above."
      />
    </div>
  );
}

const Wrapper = props => props.children;

export default function App(props) {
  const fauna = useFauna();
  const { load, onAuthChange, getServerLists } = fauna;
  const identity = useNetlifyIdentity(faunadb_token => {
    onAuthChange(faunadb_token).then(_client => {
      load(getServerLists(_client));
    });
  });

  return (
    <FaunaCtx.Provider value={fauna}>
      <UserCtx.Provider value={identity}>
        <div>
          <header className="header">
            <Login />
            <Router>
              <AllLists path="/" />
              <Wrapper path="list">
                <List path=":listId" />
                <List path=":listId/active" />
                <List path=":listId/completed" />
                <NotFound default />
              </Wrapper>
              <NotFound default />
            </Router>
          </header>
          <footer className="footer">footer</footer>
        </div>
      </UserCtx.Provider>
    </FaunaCtx.Provider>
  );
}

import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
// import Main from './components/Main/Main';
// import Room from './components/Room/Room'
import styled from 'styled-components';
import MainCopy from './components/Main/MainCopy';
import RoomCopy from './components/Room/RoomCopy';

function App() {
  return (
    <BrowserRouter>
      <AppContainer>
        <Switch>
          
          <Route exact path="/" component={MainCopy} />
          {/* <Route exact path="/room/:roomId" component={Room} /> */}
          <Route exact path="/room/:roomId" component={RoomCopy} />
        </Switch>
      </AppContainer>
    </BrowserRouter>
  );
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  font-size: calc(8px + 2vmin);
  /* color: white; */
  /* background-color: #454552; */
  text-align: center;
`;

export default App;

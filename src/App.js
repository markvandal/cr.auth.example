import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import { toBase64 } from '@cosmjs/encoding'

import logo from './logo.svg'
import './App.css'
import { Result } from "./Result";


const toSign = Math.random()
const requestedKeys = [
  'mb.citizen.self.firstname',
  'mb.citizen.self.personalnumberX',
  'mb.citizen.self.personalnumber',
]


function App() {
  let url = new URL('auth.client', 'http://localhost:19006/')
  url.searchParams.set('toSign', toSign)
  url.searchParams.set('metaId', 0);
  requestedKeys.forEach(key => url.searchParams.append('record', key))
  url.searchParams.set(
    'backUrl',
    toBase64(Buffer.from(
      `${new URL('metaid.back', 'http://localhost:3000/')}`
    ))
  )

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/metaid.back">
            <Result {...{requestedKeys}}/>
          </Route>
          <Route path="/">
            <header className="App-header">
              <a
                href={url}
                target="_blank">
                <img src={logo} className="App-logo" alt="logo" />
              </a>
            </header>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}



export default App

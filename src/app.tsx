import React from "react";
import avatar from "./assets/avatar.jpg";
import "./app.css";

export default class App extends React.Component {
  render() {
    return (
      <div className="app" role="main">
        <header className="app-header">
          <img src={avatar} className="app-logo rounded-full" alt="logo" />
          <p>
            Now I'm gonna edit <code>src/app.tsx</code>...
          </p>
          <a
            className="app-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sasha is learning React
          </a>
        </header>
      </div>
    );
  }
}

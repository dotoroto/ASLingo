// src/App.jsx
import { Auth0Provider } from "@auth0/auth0-react";
import Login from "./components/Login";

function App() {
  return (
    <Auth0Provider
      domain="dev-0rs44np0zj70rnwz.us.auth0.com"
      clientId="oSvrqa2TRwe4SBy58IehjFQbHfuMDTEE"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <Login />
    </Auth0Provider>
  );
}

export default App;

import { useAuth0 } from "@auth0/auth0-react";
import "./App.css";

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="app">
      <h1>ASLingo</h1>

      {!isAuthenticated ? (
        <>
          <button onClick={() => loginWithRedirect()}>Log In</button>
          <button
            onClick={() =>
              loginWithRedirect({
                authorizationParams: {
                  screen_hint: "signup",
                },
              })
            }
          >
            Sign Up
          </button>
        </>
      ) : (
        <>
          <p>Welcome, {user?.name}!</p>
          <img src={user?.picture} alt={user?.name} style={{ borderRadius: "50px" }} />
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Log Out
          </button>
        </>
      )}
    </div>
  );
}

export default App;

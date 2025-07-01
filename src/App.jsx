import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext"; // pastikan path sesuai

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;

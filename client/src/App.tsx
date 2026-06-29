import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Users from '@/pages/Users';
import TicketDetails from '@/pages/TicketDetails';
import ProtectedRoute from '@/components/ProtectedRoute';

axios.defaults.withCredentials = true;

const queryClientInstance = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<Users />} />
            <Route path="/tickets/:id" element={<TicketDetails />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import InternLogin from './components/InternLogin';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/intern-login" element={<InternLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/intern-dashboard" element={<InternDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import RepresentativeDashboard from './pages/RepresentativeDashboard';
import InterviewForm from './pages/InterviewForm';
import AptitudeForm from './pages/AptitudeForm';
import AssessmentForm from './pages/AssessmentForm';
import TrainingForm from './pages/TrainingForm';
import StudentDetailReport from './pages/StudentDetailReport';
import UnderMaintenance from './pages/UnderMaintenance';

function LoginGate() {
  const hasMaintenancePass = sessionStorage.getItem('maintenancePass') === 'true';

  if (!hasMaintenancePass) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UnderMaintenance />} />
        <Route path="/login" element={<LoginGate />} />
        <Route path="/admin-login" element={<UnderMaintenance />} />
        <Route path="/intern-login" element={<UnderMaintenance />} />
        <Route path="/representative-login" element={<UnderMaintenance />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/intern-dashboard" element={<InternDashboard />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/representative-dashboard" element={<RepresentativeDashboard />} />
        <Route path="/trainer/student/:studentId/interviews" element={<InterviewForm />} />
        <Route path="/trainer/student/:studentId/aptitude" element={<AptitudeForm />} />
        <Route path="/trainer/student/:studentId/assessments" element={<AssessmentForm />} />
        <Route path="/trainer/student/:studentId/training" element={<TrainingForm />} />
        <Route path="/admin/student/:studentId/report" element={<StudentDetailReport />} />
      </Routes>
    </Router>
  );
}

export default App;

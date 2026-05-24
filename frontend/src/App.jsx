import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import InternLogin from './components/InternLogin';
import RepresentativeLogin from './components/RepresentativeLogin';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import RepresentativeDashboard from './pages/RepresentativeDashboard';
import InterviewForm from './pages/InterviewForm';
import AptitudeForm from './pages/AptitudeForm';
import AssessmentForm from './pages/AssessmentForm';
import TrainingForm from './pages/TrainingForm';
import StudentDetailReport from './pages/StudentDetailReport';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/intern-login" element={<InternLogin />} />
        <Route path="/representative-login" element={<RepresentativeLogin />} />
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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import RepresentativeDashboard from './pages/RepresentativeDashboard';
import InterviewForm from './pages/InterviewForm';
import AptitudeForm from './pages/AptitudeForm';
import AssessmentForm from './pages/AssessmentForm';
import TrainingForm from './pages/TrainingForm';
import StudentDetailReport from './pages/StudentDetailReport';
import VerifyIdentity from './pages/VerifyIdentity';
import MaintenancePage from './pages/MaintenancePage';

function App() {
  return (
    <MaintenancePage />
  );
}

export default App;

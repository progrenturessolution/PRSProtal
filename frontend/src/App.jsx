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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<Login />} />
        <Route path="/intern-login" element={<Login />} />
        <Route path="/representative-login" element={<Login />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intern-dashboard"
          element={
            <ProtectedRoute allowedRole="intern">
              <InternDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer-dashboard"
          element={
            <ProtectedRoute allowedRole="trainer">
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/intern/reports"
          element={
            <ProtectedRoute allowedRole="intern">
              <StudentDetailReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/representative-dashboard"
          element={
            <ProtectedRoute allowedRole="representative">
              <RepresentativeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/student/:studentId/interviews"
          element={
            <ProtectedRoute allowedRole="trainer">
              <InterviewForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/student/:studentId/aptitude"
          element={
            <ProtectedRoute allowedRole="trainer">
              <AptitudeForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/student/:studentId/assessments"
          element={
            <ProtectedRoute allowedRole="trainer">
              <AssessmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/student/:studentId/training"
          element={
            <ProtectedRoute allowedRole="trainer">
              <TrainingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/student/:studentId/report"
          element={
            <ProtectedRoute allowedRole="admin">
              <StudentDetailReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

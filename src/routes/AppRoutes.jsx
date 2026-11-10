import { useAuthContext } from '../context/AuthContext';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HomePage';
import SetupPage from '../pages/SetupPage';
import WritePage from '../pages/WritePage';
import ComparisonPage from '../pages/ComparisonPage';
import RewritePage from '../pages/RewritePage';
import CompletionPage from '../pages/CompletionPage';
import HistoryPage from '../pages/HistoryPage';
import GrowthDashboardPage from '../pages/GrowthDashboardPage';
import MyPage from '../pages/MyPage';

function Protected({ children }) {
  const { user } = useAuthContext();
  return user ? children : <Navigate to="/login" replace />;
}
function Guest({ children }) {
  const { user } = useAuthContext();
  return user ? <Navigate to="/" replace /> : children;
}
const secured = (element) => <Protected>{element}</Protected>;
export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <AuthPage />
          </Guest>
        }
      />
      <Route
        path="/signup"
        element={
          <Guest>
            <AuthPage />
          </Guest>
        }
      />
      <Route path="/" element={<HomePage />} />
      <Route path="/setup" element={secured(<SetupPage />)} />
      <Route path="/writing" element={secured(<WritePage />)} />
      <Route path="/analysis" element={secured(<ComparisonPage />)} />
      <Route path="/rewrite" element={secured(<RewritePage />)} />
      <Route path="/completion" element={secured(<CompletionPage />)} />
      <Route
        path="/completion/:recordId"
        element={secured(<CompletionPage />)}
      />
      <Route path="/history" element={secured(<HistoryPage />)} />
      <Route path="/dashboard" element={secured(<GrowthDashboardPage />)} />
      <Route path="/mypage" element={secured(<MyPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

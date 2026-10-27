import { Routes, Route, Navigate } from 'react-router-dom';
import { PRICE_PAGE } from './lib/publicNav';
import { PAGES } from './routes';

// The public website: homepage and keyword pages. Login, register and the dashboard live in the frontend/ app.
// The router comes from main.jsx in the browser and from prerender.jsx at build time.
export default function App() {
  return (
    <Routes>
      {PAGES.map(({ path, Component }) => <Route key={path} path={path} element={<Component />} />)}
      {/* Short address for the price page */}
      <Route path="/pricing" element={<Navigate to={PRICE_PAGE} replace />} />
      {/* Unknown links go to the homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

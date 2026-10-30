import { BrowserRouter, Route, Routes } from 'react-router';
import { TabBar } from './design/components/TabBar';
import { UpdateBanner } from './design/components/UpdateBanner';
import { AnalyticsScreen } from './features/analytics/AnalyticsScreen';
import { ExercisesScreen } from './features/exercises/ExercisesScreen';
import { HistoryScreen } from './features/history/HistoryScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { WorkoutScreen } from './features/workout/WorkoutScreen';

/** The app: five tabs, each a route. */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkoutScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/exercises" element={<ExercisesScreen />} />
        <Route path="/analytics" element={<AnalyticsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
      <UpdateBanner />
      <TabBar />
    </BrowserRouter>
  );
}

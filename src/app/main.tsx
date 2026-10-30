import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyAppearance, savedAppearance } from './appearance/appearance';
import { startOfflineSupport } from './data/appUpdate';
import { requestPersistentStorage } from './data/persistentStorage';
import './design/global.css';

applyAppearance(savedAppearance());
void requestPersistentStorage();
startOfflineSupport();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
// Dynamic loading lets malformed research records produce a readable error screen.
const root = createRoot(document.getElementById('root')!);
import('./App')
  .then(({ default: App }) =>
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    ),
  )
  .catch((error) =>
    root.render(
      <main className="error-page">
        <h1>Research data needs attention</h1>
        <p>Check the referenced data file, then reload.</p>
        <pre>{String(error)}</pre>
      </main>,
    ),
  );

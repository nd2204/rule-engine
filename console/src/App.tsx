import { X } from 'lucide-react';
import { Lamp } from './components/Lamp';
import { ShellNav } from './components/ShellNav';
import { useRoute } from './router';
import { DecisionTableScreen } from './screens/decision-table/DecisionTableScreen';
import { DecisionsScreen } from './screens/decisions/DecisionsScreen';
import { DecisionsProvider, ToastProvider, useToasts } from './state';

function Toasts() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.tone !== 'info' && <Lamp state={t.tone} size="sm" />}
          <span className="toast__msg">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                t.action!.run();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" className="toast__close" aria-label="Đóng thông báo" onClick={() => dismiss(t.id)}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Shell() {
  const route = useRoute();
  return (
    <div className="app">
      <a className="skip" href="#main">
        Bỏ qua tới nội dung
      </a>
      <ShellNav route={route} />
      <main id="main" className="main">
        {route.name === 'home' ? <DecisionsScreen /> : <DecisionTableScreen route={route} />}
      </main>
      <Toasts />
    </div>
  );
}

export function App() {
  return (
    <DecisionsProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </DecisionsProvider>
  );
}

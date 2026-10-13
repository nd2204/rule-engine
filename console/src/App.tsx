import { X } from 'lucide-react';
import { Lamp } from './components/Lamp';
import { ShellNav } from './components/ShellNav';
import { useRoute } from './router';
import { DecisionTableScreen } from './screens/decision-table/DecisionTableScreen';
import { DecisionsScreen } from './screens/decisions/DecisionsScreen';
import { MonitorScreen } from './screens/monitor/MonitorScreen';
import { ReplayScreen } from './screens/replay/ReplayScreen';
import { DecisionsProvider, ToastProvider, useToasts } from './state';

function Toasts() {
  const { toasts, dismiss, setPaused } = useToasts();
  return (
    <div
      className="toasts"
      role="status"
      aria-live="polite"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
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
        {route.name === 'home' ? (
          <DecisionsScreen />
        ) : route.name === 'monitor' ? (
          <MonitorScreen />
        ) : route.name === 'replay' ? (
          <ReplayScreen />
        ) : (
          <DecisionTableScreen route={route} />
        )}
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

import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ style = {} }) {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} title={dark ? 'Switch to Light' : 'Switch to Dark'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 8,
        border: '1.5px solid var(--border)',
        background: 'var(--hover)', cursor: 'pointer', flexShrink: 0,
        color: 'var(--text)', transition: 'all 0.15s',
        ...style
      }}>
      {dark ? (
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71M17.66 17.66l.71.71M6.34 6.34l.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z"/>
        </svg>
      ) : (
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      )}
    </button>
  );
}

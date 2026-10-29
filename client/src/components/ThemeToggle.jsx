import { useLounge } from '../LoungeContext.jsx';
import Icon from './Icon.jsx';

export default function ThemeToggle() {
  const { theme, setTheme } = useLounge();
  const next = theme === 'dark' ? 'light' : 'dark';
  return <button className="theme-toggle" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
    <Icon name={next === 'light' ? 'sun' : 'moon'} /><span>{next === 'light' ? 'Light' : 'Dark'} mode</span>
  </button>;
}

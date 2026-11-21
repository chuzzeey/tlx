import { useRegisterActions } from 'kbar';
import { useTheme } from '@/store/ThemeContext';

const useThemeSwitching = () => {
  const { theme, toggle } = useTheme();

  const setMode = (mode: 'light' | 'dark') => {
    if (theme !== mode) toggle();
  };

  const themeActions = [
    {
      id: 'toggleDarkLight',
      name: 'Toggle Dark/Light Mode',
      shortcut: ['d', 'd'],
      section: 'Theme',
      perform: toggle
    },
    {
      id: 'setLightTheme',
      name: 'Set Light Theme',
      section: 'Theme',
      perform: () => setMode('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Set Dark Theme',
      section: 'Theme',
      perform: () => setMode('dark')
    }
  ];

  useRegisterActions(themeActions, [theme, toggle]);
};

export default useThemeSwitching;

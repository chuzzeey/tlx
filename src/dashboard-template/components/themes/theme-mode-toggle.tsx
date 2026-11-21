'use client';

import { Icons } from '@dashboard/components/icons';
import { useTheme } from '@/store/ThemeContext';
import * as React from 'react';

import { Button } from '@dashboard/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@dashboard/components/ui/tooltip';
import { Kbd } from '@dashboard/components/ui/kbd';
import { startThemeTransition } from '@dashboard/lib/theme-transition';

export function ThemeModeToggle() {
  const { theme, toggle } = useTheme();

  const handleThemeToggle = React.useCallback(
    (e?: React.MouseEvent) => {
      // Circular reveal from the click point (falls back to center for the
      // keyboard shortcut, which passes no event).
      startThemeTransition(toggle, e);
    },
    [toggle]
  );

  // Cmd/Ctrl+Shift+D toggles the theme; kbar separately handles the 'D D' sequence
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'd' || !e.shiftKey || !(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      handleThemeToggle();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleThemeToggle]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='group/toggle text-muted-foreground hover:text-foreground'
            onClick={handleThemeToggle}
          />
        }
      >
        <Icons.brightness />
        <span className='sr-only'>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</span>
      </TooltipTrigger>
      <TooltipContent>
        Toggle theme <Kbd>⌘⇧D</Kbd> <Kbd>D D</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

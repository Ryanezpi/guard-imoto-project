import { useTheme } from '@/context/ThemeContext';
import NavButton from '@/components/ui/NavButton';
import { useEffect, useState } from 'react';

declare global {
  var __toggleProfileEdit: (() => void) | undefined;
  var __isProfileEditing: boolean | undefined;
}

export function HeaderEditButton() {
  const { theme } = useTheme();
  const titleColor = theme === 'light' ? '#000' : '#fff';
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globalThis.__isProfileEditing !== undefined) {
        setIsEditing(globalThis.__isProfileEditing);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <NavButton
      route={{ action: () => globalThis.__toggleProfileEdit?.() }} // special action instead of navigation
      iconName={isEditing ? 'save' : 'edit'}
      color={titleColor}
    />
  );
}

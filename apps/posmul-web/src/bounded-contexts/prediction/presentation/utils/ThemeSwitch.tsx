"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Gamepad2, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';

type ThemeSwitchProps = {
  variant?: 'dropdown' | 'toggle' | 'buttons';
  showLabel?: boolean;
};

const themeIcons = {
  light: Sun,
  dark: Moon,
  gameMode: Gamepad2,
  system: Monitor
} as const;

const themeLabels = {
  light: '라이트 모드',
  dark: '다크 모드',
  gameMode: '게임 모드',
  system: '시스템 설정'
} as const;

const themeDescriptions = {
  light: '밝고 깔끔한 인터페이스',
  dark: '눈이 편한 어두운 테마',
  gameMode: '몰입도 높은 게임 테마',
  system: '시스템 설정에 따라 자동'
} as const;

// Simple toggle component
const ToggleVariant = ({ showLabel }: { showLabel: boolean }) => {
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`
        flex items-center space-x-2 p-2 rounded-lg border transition-colors duration-200
        ${currentTheme === 'light'
          ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          : currentTheme === 'dark'
            ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
            : 'bg-black/20 border-white/20 text-white hover:bg-black/30 backdrop-blur'
        }
      `}
    >
      <motion.div
        animate={{ rotate: currentTheme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {currentTheme === 'light' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.div>
      {showLabel && (
        <span className="text-sm font-medium">
          {currentTheme === 'light' ? '라이트' : '다크'}
        </span>
      )}
    </motion.button>
  );
};

// Button group component
const ButtonsVariant = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
      {availableThemes.filter(theme => theme !== 'system').map((theme) => {
        const Icon = themeIcons[theme];
        return (
          <motion.button
            key={theme}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme)}
            className={`
              flex items-center justify-center p-2 rounded-md transition-colors duration-200
              ${currentTheme === theme
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }
            `}
            title={themeLabels[theme]}
          >
            <Icon className="w-4 h-4" />
          </motion.button>
        );
      })}
    </div>
  );
};

// Dropdown component
const DropdownVariant = ({ showLabel }: { showLabel: boolean }) => {
  const { currentTheme, setTheme, systemPreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentIcon = themeIcons[currentTheme === 'system' ? systemPreference : currentTheme];
  const CurrentIcon = currentIcon;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-200
          ${currentTheme === 'light'
            ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            : currentTheme === 'dark'
              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
              : 'bg-black/20 border-white/20 text-white hover:bg-black/30 backdrop-blur'
          }
        `}
      >
        <div className="flex items-center space-x-2">
          <CurrentIcon className="w-4 h-4" />
          {showLabel && (
            <span className="text-sm font-medium">
              {themeLabels[currentTheme]}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`
                absolute right-0 mt-2 w-64 rounded-xl shadow-lg border z-50
                ${currentTheme === 'light'
                  ? 'bg-white border-gray-200'
                  : currentTheme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-black/80 border-white/20 backdrop-blur-xl'
                }
              `}
            >
              <div className="p-2">
                <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${
                  currentTheme === 'light' ? 'text-gray-500'
                  : currentTheme === 'dark' ? 'text-gray-400'
                  : 'text-gray-300'
                }`}>
                  테마 선택
                </div>

                {(['light', 'dark', 'gameMode'] as const).map((theme) => {
                  const Icon = themeIcons[theme];
                  const isActive = currentTheme === theme;

                  return (
                    <motion.button
                      key={theme}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTheme(theme);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors duration-150
                        ${isActive
                          ? currentTheme === 'light'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : currentTheme === 'dark'
                              ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          : currentTheme === 'light'
                            ? 'hover:bg-gray-50 text-gray-700'
                            : currentTheme === 'dark'
                              ? 'hover:bg-gray-700 text-gray-200'
                              : 'hover:bg-white/10 text-gray-200'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{themeLabels[theme]}</div>
                        <div className={`text-xs ${
                          isActive
                            ? currentTheme === 'light' ? 'text-blue-600'
                              : 'text-blue-400'
                            : currentTheme === 'light' ? 'text-gray-500'
                              : currentTheme === 'dark' ? 'text-gray-400'
                              : 'text-gray-300'
                        }`}>
                          {themeDescriptions[theme]}
                        </div>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ThemeSwitch = ({
  variant = 'dropdown',
  showLabel = true
}: ThemeSwitchProps) => {
  if (variant === 'toggle') {
    return <ToggleVariant showLabel={showLabel} />;
  }

  if (variant === 'buttons') {
    return <ButtonsVariant />;
  }

  return <DropdownVariant showLabel={showLabel} />;
};

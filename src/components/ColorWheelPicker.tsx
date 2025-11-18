/**
 * ColorWheelPicker - Main component for the color wheel spinner
 * Manages wheel state, animations, and user interactions
 */

import { Accessor, Component, createEffect, createSignal, Setter, onCleanup } from 'solid-js';
import { FaSolidGear } from 'solid-icons/fa'
import { ImArrowLeft } from 'solid-icons/im'
import { cubicOut } from 'eases';
import { useSearchParams } from "@solidjs/router";
import { OptionForm } from './OptionForm';
import { Toast, ToastMessage } from './Toast';
import { ConfettiExplosion } from 'solid-confetti-explosion';
import { RiSystemCloseFill } from 'solid-icons/ri';
import { FaSolidQuestion } from 'solid-icons/fa'
import { WHEEL_CONFIG } from '../constants/wheelConfig';
import { sanitizePageTitle } from '../utils/validation';
import {
  generateConicGradient,
  getColorByIndex,
  applyWheelRotation,
  calculateSelectedOptionIndex,
  getDOMElement,
  setDocumentTitle
} from '../utils/helpers';

interface ColorWheelPickerProps {
  pageTitle: Accessor<string>,
  setPageTitle: Setter<string>
}

export const Colors = WHEEL_CONFIG.COLORS;

interface ColorBoardProps {
  radius: number,
  options: Accessor<string[]>
}

/**
 * ColorWheelBoard - Renders the color wheel visualization
 * Generates conic gradient background and labels for each option
 */
const ColorWheelBoard: Component<ColorBoardProps> = (props: ColorBoardProps) => {
  const { options, radius } = props
  const [conicGradient, setConicGradient] = createSignal("")

  createEffect(() => {
    setConicGradient(generateConicGradient(options()));
  });

  return (<div
    id="color-wheel"
    class="aspect-square h-[300px] sm:h-[400px] md:h-[500px] rounded-full border-4 border-gray-600 transform origin-center shadow-lg"
    style={{ background: conicGradient() }}
  >
    {options() ? options().map((option: string, index) => {
      const sectorDeg = 360 / options().length
      const segmentAngle = sectorDeg * (index + 1);
      const segmentOffset = radius * WHEEL_CONFIG.SECTOR_LABEL_OFFSET_RATIO;

      return (
        <div key={`segment-${index}`}>
          {/* Responsive sector lines: 150px mobile, 200px tablet, 250px desktop */}
          <div
            class="absolute top-1/2 left-1/2 h-0 border-t-[2px] border-gray-600 m-0 p-0"
            style={{
              width: '150px',
              transform: `translate(-50%, -50%) rotate(${segmentAngle - 90}deg) translate(75px)`,
            }}
          >
            &nbsp;
          </div>
          <div
            class="absolute top-1/2 left-1/2 h-0 border-t-[2px] border-gray-600 m-0 p-0 hidden sm:block md:hidden"
            style={{
              width: '200px',
              transform: `translate(-50%, -50%) rotate(${segmentAngle - 90}deg) translate(100px)`,
            }}
          >
            &nbsp;
          </div>
          <div
            class="absolute top-1/2 left-1/2 h-0 border-t-[2px] border-gray-600 m-0 p-0 hidden md:block"
            style={{
              width: '250px',
              transform: `translate(-50%, -50%) rotate(${segmentAngle - 90}deg) translate(125px)`,
            }}
          >
            &nbsp;
          </div>
          <div
            class={`absolute top-1/2 left-1/2 w-200 rounded-full`}
            style={{
              transform: `translate(-50%, -50%) rotate(${segmentAngle - 90 - (sectorDeg / 2)}deg) translate(${segmentOffset}px)`,
            }}
          >
            <div class="w-full h-1/2 flex items-center justify-center rounded-full">
              <span class={`text-gray-800 font-semibold truncate w-40 text-sm md:text-base drop-shadow-md`} title={option}>
                {option}
              </span>
            </div>
          </div>
        </div>
      );
    }) : ""
    }
  </div>
  )
}

/**
 * ColorWheelPicker - Main color wheel component
 * Handles wheel rendering, spinning logic, state management, and user interactions
 */
export const ColorWheelPicker: Component<ColorWheelPickerProps> = (props: ColorWheelPickerProps) => {
  const { pageTitle, setPageTitle } = props

  // Wheel data and state
  const [optionsList, setOptionsList] = createSignal([] as string[]);
  const [currentRotation, setCurrentRotation] = createSignal(0);
  const [isSpinning, setIsSpinning] = createSignal(false);
  const [winnerList, setWinnerList] = createSignal([] as string[]);

  // Selection state
  const [selectedOption, setSelectedOption] = createSignal<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = createSignal<number | null>(null);

  // UI state
  const [showSettings, setShowSettings] = createSignal(false);
  const [showConfetti, setShowConfetti] = createSignal(false);
  const [showHelp, setShowHelp] = createSignal(false);
  const [showHistory, setShowHistory] = createSignal(false);
  const [toasts, setToasts] = createSignal<ToastMessage[]>([]);

  // URL params for state persistence
  const [urlParams, setUrlParams] = useSearchParams();

  /**
   * Add a toast notification
   */
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, message, type, duration };
    setToasts([...toasts(), newToast]);
  };

  /**
   * Remove a toast notification
   */
  const removeToast = (id: string) => {
    setToasts(toasts().filter(t => t.id !== id));
  };

  /**
   * Delete option at given index and update URL
   */
  const handleDeleteOption = (e: Event, index: number) => {
    const newList = optionsList().filter((_, i) => i !== index);
    setOptionsList(newList);
    setUrlParams({ labels: newList.join(",") });
  };

  /**
   * Load options from URL parameters
   */
  createEffect(() => {
    const urlLabels = urlParams.labels && urlParams.labels.split(",");
    if (urlLabels && urlLabels.length > 0) {
      setOptionsList(urlLabels);
    }
  });

  /**
   * Load title from URL parameters with sanitization (XSS prevention)
   */
  createEffect(() => {
    const urlTitle = urlParams.title;
    if (urlTitle && typeof urlTitle === 'string') {
      const sanitized = sanitizePageTitle(urlTitle);
      setPageTitle(sanitized);
      setDocumentTitle(sanitized);
    }
  });

  createEffect(() => {
    if (optionsList().length == 0) {
      setShowSettings(true)
    }
  })

  /**
   * Handle animated spin of the wheel
   * Calculates random spin duration/rotations, animates smoothly, and selects winner
   */
  const handleAnimatedSpin = () => {
    if (isSpinning() || optionsList().length === 0) return;

    const minSpin = WHEEL_CONFIG.MIN_SPIN_ROTATIONS;
    const maxSpin = WHEEL_CONFIG.MAX_SPIN_ROTATIONS;
    const minTime = WHEEL_CONFIG.MIN_SPIN_DURATION_MS;
    const maxTime = WHEEL_CONFIG.MAX_SPIN_DURATION_MS;

    const spinAngle = Math.floor((Math.random() * (maxSpin - minSpin) + minSpin) * 360);
    const spinDuration = Math.floor(Math.random() * (maxTime - minTime) + minTime);
    const startRotation = currentRotation();
    const endRotation = (startRotation + spinAngle) % 360;

    setIsSpinning(true);
    const startTime = Date.now();
    let animationFrameId: number;

    const animateSpin = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed < spinDuration) {
        const progress = cubicOut(elapsed / spinDuration);
        const currentRotationValue = startRotation + progress * spinAngle;

        // Apply rotation to wheel
        const wheelElement = getDOMElement('color-wheel');
        if (wheelElement) {
          applyWheelRotation(wheelElement, currentRotationValue);
        }

        animationFrameId = requestAnimationFrame(animateSpin);
      } else {
        // Animation complete - determine selected option
        const selectedIndex = calculateSelectedOptionIndex(endRotation, optionsList().length);
        const selectedOptionLabel = optionsList()[selectedIndex] || null;

        setSelectedOption(selectedOptionLabel);
        setSelectedOptionIndex(selectedIndex);
        setCurrentRotation(endRotation);

        // Update winner list
        if (selectedOptionLabel) {
          const updatedWinners = [selectedOptionLabel, ...winnerList()].slice(
            0,
            WHEEL_CONFIG.HISTORY_MAX_ITEMS
          );
          setWinnerList(updatedWinners);
        }

        setIsSpinning(false);
        setShowConfetti(true);

        // Clean up confetti after delay
        const confettiTimer = setTimeout(() => {
          setShowConfetti(false);
        }, WHEEL_CONFIG.CONFETTI_DURATION_MS);

        onCleanup(() => {
          clearTimeout(confettiTimer);
          cancelAnimationFrame(animationFrameId);
        });
      }
    };

    animationFrameId = requestAnimationFrame(animateSpin);
  };

  return (
    <div class="flex flex-col min-h-screen">
      {/* Toast Notifications */}
      <Toast toasts={toasts()} removeToast={removeToast} />

      {/* Header */}
      <header class="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 shadow-md">
        <div class="flex justify-between items-center max-w-7xl mx-auto">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🎡</span>
            <h1 class="text-2xl md:text-3xl font-bold">Random Color Wheel</h1>
          </div>
          <div class="flex gap-2">
            <button
              aria-label="Open help dialog"
              onclick={() => {
                setShowHelp(true);
              }}
              class="border-2 rounded-lg p-2 bg-white fill-green-500 border-white hover:bg-gray-100 transition-colors hidden sm:flex"
              title="Help"
            >
              <FaSolidQuestion aria-hidden="true" size="24px" />
            </button>
            <button
              class="border-2 rounded-lg fill-white border-white p-2 bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2"
              aria-label="Configure color wheel settings"
              title="Configure color wheel"
              onclick={() => {
                setShowSettings(true);
              }}
            >
              <FaSolidGear size="24px" aria-hidden="true" />
              <span class="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
        <div class="relative m-5 flex flex-col items-center gap-6">
          {/* Color Wheel with Arrow */}
          <div class="relative">
            <div class="relative inline-block overflow-hidden">
              <ColorWheelBoard options={optionsList} radius={WHEEL_CONFIG.RADIUS} />
            </div>
            <ImArrowLeft
              class="absolute -right-6 sm:-right-6 top-1/2 fill-red-500 stroke-yellow-400 stroke-1"
              style={{ transform: "translate(0, -50%)" }}
              size="40px"
              aria-hidden="true"
            />
          </div>
          {/* Spin Button - Large and Prominent */}
          <button
            onClick={() => {
              if (!isSpinning()) {
                handleAnimatedSpin();
              }
            }}
            disabled={isSpinning() || optionsList().length === 0}
            aria-label="Spin the wheel to select a random option"
            aria-busy={isSpinning()}
            class="mt-8 px-8 py-4 md:px-10 md:py-5 text-lg md:text-2xl font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-h-[56px] md:min-h-[64px] shadow-lg"
          >
            {isSpinning() ? 'Spinning...' : 'Spin the Wheel'}
          </button>

          {/* Selected Option Display */}
          {selectedOption() && !isSpinning() && (
            <div class="flex flex-col sm:flex-row mt-6 gap-4 items-center justify-center" role="status" aria-live="polite" aria-label={`Selected option: ${selectedOption()}`}>
              <div class="text-center sm:text-left">
                <p class="text-sm text-gray-600 uppercase tracking-wide">Selected:</p>
                <h2 class="text-2xl md:text-3xl font-bold text-gray-800">{selectedOption()}</h2>
              </div>
              {optionsList().includes(selectedOption()!) && (
                <button
                  aria-label={`Remove ${selectedOption()} from the wheel`}
                  title={`Remove ${selectedOption()}`}
                  onClick={(e) => {
                    handleDeleteOption(e, selectedOptionIndex()!);
                  }}
                  class="flex items-center gap-2 border-2 border-red-400 rounded-lg px-4 py-2 text-white bg-red-400 hover:bg-red-500 hover:border-red-500 transition-colors font-semibold"
                >
                  <RiSystemCloseFill size="18px" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal with Backdrop */}
      {showSettings() && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
            aria-hidden="true"
          />
          {/* Modal */}
          <div
            id="option-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            class="fixed w-[90vw] max-w-md top-1/2 left-1/2 p-6 border-2 border-gray-200 shadow-2xl rounded-xl bg-white -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto"
          >
            <OptionForm
              setOptionsList={setOptionsList}
              optionsList={optionsList}
              setShowSettings={setShowSettings}
              urlParams={urlParams}
              setUrlParams={setUrlParams}
              pageTitle={pageTitle}
              setPageTitle={setPageTitle}
              addToast={addToast}
            />
          </div>
        </>
      )}

      {/* History Toggle Button - On Desktop Side, On Mobile Bottom */}
      {winnerList().length > 0 && !showHistory() && (
        <button
          onClick={() => setShowHistory(true)}
          class="fixed bottom-4 left-4 sm:bottom-auto sm:top-24 sm:left-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors z-30 shadow-lg"
          aria-label={`Open selection history (${winnerList().length} items)`}
        >
          📋 History ({winnerList().length})
        </button>
      )}

      {/* History Modal - Fullscreen on Mobile, Sidebar on Desktop */}
      {showHistory() && (
        <>
          {/* Mobile Backdrop */}
          <div
            class="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm sm:hidden"
            onClick={() => setShowHistory(false)}
            aria-hidden="true"
          />

          {/* History Drawer/Modal */}
          <div
            class="fixed bottom-0 left-0 right-0 sm:top-24 sm:bottom-auto sm:left-4 sm:right-auto sm:w-80 max-h-[70vh] sm:max-h-96 p-4 rounded-t-xl sm:rounded-xl bg-white border-2 border-gray-200 shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 id="history-title" class="text-lg font-bold text-gray-800">Selection History</h2>
              <button
                aria-label="Close history"
                class="bg-red-400 hover:bg-red-500 text-white border-2 border-red-400 hover:border-red-500 rounded-lg p-1 transition-colors"
                onclick={() => {
                  setShowHistory(false);
                }}
              >
                <RiSystemCloseFill size="20px" aria-hidden="true" />
              </button>
            </div>

            <p class="text-xs text-gray-500 mb-3">Last {Math.min(winnerList().length, WHEEL_CONFIG.HISTORY_MAX_ITEMS)} selections</p>

            <ul
              class="list-decimal list-inside space-y-1 flex-1 overflow-y-auto text-sm pr-2"
              aria-label="Last selected winners"
            >
              {winnerList().map((winner) => (
                <li class="truncate text-gray-700" title={winner}>
                  {winner}
                </li>
              ))}
            </ul>

            <button
              aria-label="Clear history list"
              class="mt-4 w-full px-4 py-2 rounded-lg border-2 border-red-400 bg-red-400 text-white text-sm font-semibold hover:bg-red-500 hover:border-red-500 transition-colors"
              onClick={() => {
                setWinnerList([]);
                setShowHistory(false);
              }}
            >
              Clear History
            </button>
          </div>
        </>
      )}

      {/* Confetti Animation */}
      {showConfetti() && (
        <div id="confetti" class="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none z-30">
          <div class="flex">
            <ConfettiExplosion
              duration={WHEEL_CONFIG.CONFETTI_DURATION_MS}
              stageWidth={WHEEL_CONFIG.CONFETTI_STAGE_WIDTH}
            />
            <ConfettiExplosion
              duration={WHEEL_CONFIG.CONFETTI_DURATION_MS - 1000}
              force={WHEEL_CONFIG.CONFETTI_FORCE}
              stageWidth={WHEEL_CONFIG.CONFETTI_STAGE_WIDTH}
            />
          </div>
        </div>
      )}

      {/* Help Modal with Backdrop */}
      {showHelp() && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
            aria-hidden="true"
          />
          {/* Modal */}
          <div
            id="help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            class="fixed w-[90vw] max-w-lg top-1/2 right-auto left-1/2 p-6 border-2 border-gray-200 rounded-xl shadow-2xl bg-white -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 id="help-title" class="text-2xl font-bold text-gray-800">
                Help & Information
              </h2>
              <button
                aria-label="Close help dialog"
                class="bg-red-400 hover:bg-red-500 text-white border-2 border-red-400 hover:border-red-500 rounded-lg p-1 transition-colors"
                onclick={() => {
                  setShowHelp(false);
                }}
              >
                <RiSystemCloseFill size="24px" aria-hidden="true" />
              </button>
            </div>
            <hr class="mb-4" />
            <div class="space-y-4 text-gray-700">
              <div>
                <h3 class="font-semibold text-lg text-gray-800 mb-2">How It Works</h3>
                <p class="text-sm">
                  This color wheel was designed for teachers and classrooms. Configure your wheel by adding options, then spin to make random selections.
                </p>
              </div>
              <div>
                <h3 class="font-semibold text-lg text-gray-800 mb-2">Bookmarking</h3>
                <p class="text-sm">
                  After configuring your wheel, you can <strong>bookmark</strong> it in your browser. Your settings will be saved in the URL and restored when you open the bookmark later.
                </p>
              </div>
              <div>
                <h3 class="font-semibold text-lg text-gray-800 mb-2">Removing Options</h3>
                <p class="text-sm">
                  Click the <strong>Remove</strong> button after a selection to remove that option from the wheel. The option will be restored if you reload your bookmark.
                </p>
              </div>
              <div>
                <h3 class="font-semibold text-lg text-gray-800 mb-2">Privacy</h3>
                <p class="text-sm">
                  This application is ad-free and respects your privacy. No settings are stored on our servers—everything stays in your browser URL.
                </p>
              </div>
              <div class="pt-2">
                <p class="text-sm text-gray-600">
                  If you enjoy using this tool and want to support development, consider{' '}
                  <a
                    class="text-blue-500 hover:text-blue-700 font-semibold underline"
                    href="https://www.buymeacoffee.com/sslidss"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    buying the developer a coffee!
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

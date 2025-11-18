/**
 * OptionForm - Configuration modal for wheel options and settings
 * Allows adding/removing options, setting title, and resetting configuration
 */

import { Accessor, Component, createSignal, Setter } from "solid-js";
import { RiSystemCloseFill, RiSystemDeleteBin5Line } from "solid-icons/ri";
import { Colors } from "./ColorWheelPicker";
import { NavigateOptions, Params, SetParams } from "@solidjs/router";
import { FaSolidPlus } from "solid-icons/fa";
import { WHEEL_CONFIG } from "../constants/wheelConfig";
import {
  sanitizeOptionLabel,
  validateOptionLabel,
  sanitizePageTitle,
  validatePageTitle,
  parseCommaSeparatedLabels,
  canAddMoreOptions
} from "../utils/validation";
import { getColorByIndex } from "../utils/helpers";

interface OptionFormProps {
  optionsList: Accessor<string[]>;
  setOptionsList: Setter<string[]>;
  setShowSettings: Setter<boolean>;
  urlParams: Params;
  setUrlParams: (
    params: SetParams,
    options?: Partial<NavigateOptions<unknown>> | undefined
  ) => void;
  pageTitle: Accessor<string>;
  setPageTitle: Setter<string>;
  addToast?: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

export const OptionForm: Component<OptionFormProps> = (
  props: OptionFormProps
) => {
  const {
    optionsList,
    setOptionsList,
    urlParams,
    setUrlParams,
    setShowSettings,
    pageTitle,
    setPageTitle,
    addToast,
  } = props;

  const [addLabel, setAddLabel] = createSignal("");
  const [addLabelError, setAddLabelError] = createSignal<string | null>(null);
  const [titleError, setTitleError] = createSignal<string | null>(null);

  /**
   * Handle adding single or multiple comma-separated options
   */
  const handleAddOption = (e: Event) => {
    setAddLabelError(null);

    const input = addLabel().trim();
    if (!input) {
      setAddLabelError("Please enter an option");
      return;
    }

    // Check if input contains commas (batch add)
    if (input.includes(",")) {
      const labels = parseCommaSeparatedLabels(input);
      const validLabels = labels.filter((label) => {
        const validation = validateOptionLabel(label, optionsList());
        return validation.isValid;
      });

      if (validLabels.length === 0) {
        setAddLabelError("No valid options to add");
        return;
      }

      const newList = [...optionsList(), ...validLabels];
      if (newList.length > WHEEL_CONFIG.MAX_OPTIONS) {
        setAddLabelError(
          `Maximum ${WHEEL_CONFIG.MAX_OPTIONS} options allowed. Only added ${
            WHEEL_CONFIG.MAX_OPTIONS - optionsList().length
          } options.`
        );
        setOptionsList(newList.slice(0, WHEEL_CONFIG.MAX_OPTIONS));
        setUrlParams({
          labels: newList.slice(0, WHEEL_CONFIG.MAX_OPTIONS).join(","),
        });
      } else {
        setOptionsList(newList);
        setUrlParams({ labels: newList.join(",") });
      }
    } else {
      // Single option
      const sanitized = sanitizeOptionLabel(input);
      const validation = validateOptionLabel(sanitized, optionsList());

      if (!validation.isValid) {
        setAddLabelError(validation.error || "Invalid option");
        return;
      }

      if (!canAddMoreOptions(optionsList().length)) {
        setAddLabelError(
          `Maximum ${WHEEL_CONFIG.MAX_OPTIONS} options allowed`
        );
        return;
      }

      const newList = [...optionsList(), sanitized];
      setOptionsList(newList);
      setUrlParams({ labels: newList.join(",") });
      addToast?.(`Added "${sanitized}" to wheel`, 'success', 2000);
    }

    setAddLabel("");
  };

  /**
   * Handle deleting option at index
   */
  const handleDeleteOption = (_e: Event, index: number) => {
    const deletedOption = optionsList()[index];
    const newList = optionsList().filter((_, i) => i !== index);
    setOptionsList(newList);
    setUrlParams({ labels: newList.join(",") });
    addToast?.(`Removed "${deletedOption}" from wheel`, 'info', 2000);
  };

  /**
   * Handle title change with validation
   */
  const handleTitleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const input = target.value;
    const sanitized = sanitizePageTitle(input);

    const validation = validatePageTitle(sanitized);
    if (!validation.isValid) {
      setTitleError(validation.error || "Invalid title");
    } else {
      setTitleError(null);
    }

    setPageTitle(sanitized);
    setUrlParams({ ...urlParams, title: sanitized });
    document.title = sanitized;
  };

  return (
    <div id="option-form" class="space-y-6">
      {/* Header */}
      <div class="flex justify-between items-center">
        <h2 id="settings-title" class="text-2xl font-bold text-gray-800">
          Configure Wheel
        </h2>
        <button
          aria-label="Close configuration dialog"
          class="bg-red-400 hover:bg-red-500 text-white border-2 border-red-400 hover:border-red-500 rounded-lg p-1 transition-colors"
          onclick={() => {
            setShowSettings(false);
          }}
        >
          <RiSystemCloseFill size="24px" aria-hidden="true" />
        </button>
      </div>
      <hr class="border-gray-200" />

      {/* Title Input Section */}
      <div class="space-y-2">
        <label htmlFor="titleInput" class="block text-sm font-semibold text-gray-700">
          Wheel Title
        </label>
        <input
          type="text"
          id="titleInput"
          name="titleInput"
          maxlength={WHEEL_CONFIG.MAX_TITLE_LENGTH}
          aria-describedby="title-help"
          aria-invalid={!!titleError()}
          placeholder="e.g., Class Seating Chart"
          class={`border-2 rounded-lg w-full px-3 py-2 text-base transition-colors ${
            titleError()
              ? "border-red-500 bg-red-50 focus:outline-none focus:border-red-600"
              : "border-gray-300 bg-white focus:outline-none focus:border-blue-500 focus:bg-blue-50"
          }`}
          value={pageTitle()}
          onInput={handleTitleChange}
        />
        {titleError() && (
          <p id="title-help" class="text-red-500 text-xs font-medium" role="alert">
            {titleError()}
          </p>
        )}
        <p class="text-xs text-gray-500">
          {pageTitle().length}/{WHEEL_CONFIG.MAX_TITLE_LENGTH} characters
        </p>
      </div>

      {/* Add Option Input Section */}
      {canAddMoreOptions(optionsList().length) && (
        <div class="space-y-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <label htmlFor="labelInput" class="block text-sm font-semibold text-gray-700">
            Add Options to Wheel
          </label>
          <input
            type="text"
            id="labelInput"
            name="labelInput"
            maxlength={WHEEL_CONFIG.MAX_OPTION_LENGTH}
            placeholder="Enter option name (or comma-separated for batch)"
            aria-describedby="label-help"
            aria-invalid={!!addLabelError()}
            class={`border-2 rounded-lg w-full px-3 py-2 text-base transition-colors ${
              addLabelError()
                ? "border-red-500 bg-red-50 focus:outline-none focus:border-red-600"
                : "border-gray-300 bg-white focus:outline-none focus:border-blue-500"
            }`}
            onInput={(e) => {
              setAddLabel(e.currentTarget.value);
              setAddLabelError(null);
            }}
            onKeyPress={(e) => {
              if (["Enter", "NumpadEnter"].includes(e.code)) {
                e.preventDefault();
                handleAddOption(e);
              }
            }}
            value={addLabel()}
          />
          {addLabelError() && (
            <p
              id="label-help"
              class="text-red-500 text-xs font-medium"
              role="alert"
            >
              {addLabelError()}
            </p>
          )}
          <button
            aria-label="Add new option to wheel"
            onClick={handleAddOption}
            class="w-full flex items-center justify-center gap-2 border-2 transition-colors border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600 text-white rounded-lg p-2 font-semibold"
          >
            <FaSolidPlus size="18px" aria-hidden="true" />
            Add Option
          </button>
          <p class="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <strong>Tip:</strong> Use commas to add multiple at once: <code class="bg-white px-1 rounded">Alice, Bob, Charlie</code>
          </p>
        </div>
      )}

      {/* Options List Section */}
      {optionsList().length > 0 && (
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-700">Options ({optionsList().length}/{WHEEL_CONFIG.MAX_OPTIONS})</h3>
          <div class="max-h-64 overflow-y-auto space-y-2 pr-2">
            {optionsList().map((option: string, index: number) => (
              <div
                key={`option-${index}`}
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div
                  class="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0"
                  style={{
                    background: getColorByIndex(index),
                  }}
                  aria-label={`Color for ${option}`}
                ></div>
                <span class="flex-1 text-sm font-medium text-gray-700 truncate" title={option}>
                  {option}
                </span>
                <button
                  aria-label={`Delete option ${option}`}
                  onClick={(e) => {
                    handleDeleteOption(e, index);
                  }}
                  class="flex-shrink-0 inline-flex items-center border-2 transition-colors border-red-400 bg-red-400 hover:bg-red-500 hover:border-red-500 text-white rounded-lg p-1.5"
                  title="Delete option"
                >
                  <RiSystemDeleteBin5Line size="16px" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {optionsList().length === 0 && (
        <div class="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200 text-center">
          <p class="text-gray-700 font-medium mb-2">No options added yet</p>
          <p class="text-sm text-gray-600">Add at least one option to start spinning the wheel!</p>
        </div>
      )}

      {/* Footer with Reset Button */}
      <div class="pt-4 border-t border-gray-200 flex justify-between">
        <p class="text-xs text-gray-500">
          Max {WHEEL_CONFIG.MAX_OPTION_LENGTH} characters per option
        </p>
        <button
          aria-label="Reset all settings to defaults"
          class="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 transition-colors text-sm font-semibold"
          onclick={() => {
            setOptionsList([]);
            setUrlParams({ labels: "", title: null });
            setAddLabel("");
            setAddLabelError(null);
            setTitleError(null);
            setPageTitle("Random Color Wheel Picker");
            document.title = "Random Color Wheel Picker";
          }}
        >
          Reset All
        </button>
      </div>
    </div>
  );
};

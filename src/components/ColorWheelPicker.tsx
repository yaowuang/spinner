// src/ColorWheelPicker.tsx
import { Accessor, Component, createEffect, createSignal, Setter } from 'solid-js';
import { FaSolidGear } from 'solid-icons/fa'
import { ImArrowLeft } from 'solid-icons/im'
import { cubicOut } from 'eases'; // Importing the Bézier curve easing function
import { useSearchParams } from "@solidjs/router";
import { OptionForm } from './OptionForm';
import { ConfettiExplosion } from 'solid-confetti-explosion';
import { RiSystemCloseFill } from 'solid-icons/ri';
import { FaSolidQuestion } from 'solid-icons/fa'

interface ColorWheelPickerProps {
  pageTitle: Accessor<string>,
  setPageTitle: Setter<string>
}

export const Colors = {
  red: "#ee7777",
  green: "#80e080",
  blue: "#7777ee",
  cyan: "#88dddd",
  magenta: "#dd88dd",
  yellow: "#dddd88",
  orange: "#eea577",
};

interface ColorBoardProps {
  radius: number,
  options: Accessor<string[]>
}

const ColorWheelBoard: Component<ColorBoardProps> = (props: ColorBoardProps) => {
  const { options, radius } = props
  const [conicGradient, setConicGradient] = createSignal("")

  createEffect(() => {
    const sectorDeg = 360 / options().length
    setConicGradient(options().length > 0 ? `conic-gradient(
      ${options().map((_option, index) => {
      const startAngle = (sectorDeg * index) % 360;
      const endAngle = (startAngle + sectorDeg) % 360;

      const ColorSize = Object.keys(Colors).length
      const val: string = `${Colors[Object.keys(Colors)[index % ColorSize] as keyof typeof Colors]} ${startAngle}deg ${endAngle}deg`;
      return val
    }).join(', ')}
    )` : "white");
  });

  return (<div
    id="color-wheel"
    class={`aspect-square h-[500px] rounded-full border-4 border-gray-500 transform origin-center`}
    style={{ background: conicGradient() }}
  >
    {options() ? options().map((option: string, index) => {
      const sectorDeg = 360 / options().length
      const segmentAngle = sectorDeg * (index + 1);
      const segmentOffset = radius * .8; // Offset from the center of the circle to the segment
      // const bgColor = sectorColors[index];

      return (
        //add border line
        <div>
          <div
            class="absolute top-1/2 left-1/2 w-[250px] h-0 border-t-[2px] border-gray-500 m-0 p-0"
            style={{
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
              <span class={`text-black truncate w-40`} title={option}>
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

export const ColorWheelPicker: Component<ColorWheelPickerProps> = (props: ColorWheelPickerProps) => {
  const { pageTitle, setPageTitle } = props
  const [optionsList, setOptionsList] = createSignal([] as string[]);
  const radius = 200; // adjust the radius based on your preference
  const [currentRotation, setCurrentRotation] = createSignal(0);

  const [selectedOption, setSelectedOption] = createSignal<string | null>(null);
  const [selectedOptionIndex, SetSelectedOptionIndex] = createSignal<number | null>(null);
  const [isSpinning, setIsSpinning] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [urlParams, setUrlParams] = useSearchParams();
  const [winnerList, setWinnerList] = createSignal([] as string[])
  const [showConfetti, setShowConfetti] = createSignal(false)
  const [showHelp, setShowHelp] = createSignal(false);

  const handleDeleteOption = (e: Event, index: number) => {
    var newList = optionsList()
    newList.splice(index,1)
    setOptionsList([...newList])
    const labelParams = newList.join(",") 
    setUrlParams({ labels: labelParams})
}

  createEffect(() => {
    const urlLabels = urlParams.labels && urlParams.labels.split(",")
    if (urlLabels) {
      setOptionsList(urlLabels)
    }
  })

  createEffect(() => {
    const urlTitle = urlParams.title
    if (urlTitle) {
      setPageTitle(urlTitle)
      document.title = (urlTitle)
    }
  })

  createEffect(() => {
    if (optionsList().length == 0) {
      setShowSettings(true)
    }
  })

  const handleAnimatedSpin = () => {
    console.log(showConfetti())
    if (isSpinning()) return; // Prevent multiple spins before the animation completes

    const minSpin = 5;
    const maxSpin = 10;
    const minTime = 2;
    const maxTime = 6;
    const spinAngle = Math.floor((Math.random() * (maxSpin - minSpin) + minSpin) * 360);
    const spinDuration = Math.floor((Math.random() * (maxTime - minTime) + minTime) * 1000); // Duration of the spinning animation in milliseconds
    const startRotation = currentRotation(); // Start from the current rotation
    const endRotation = (startRotation + spinAngle) % 360;

    setIsSpinning(true);

    const startTime = Date.now();

    const animateSpin = async () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed < spinDuration) {
        const progress = cubicOut(elapsed / spinDuration);
        const currentRotationValue = startRotation + progress * spinAngle;

        // Apply the rotation to the color wheel
        document.getElementById('color-wheel')!.style.transform = `rotate(-${currentRotationValue}deg)`;

        // Continue the animation
        requestAnimationFrame(animateSpin);
      } else {
        // Animation is complete, determine the selected option
        const sectorDeg = 360 / optionsList().length;
        const selectedRotation = endRotation + 90;
        const normalizedRotation = selectedRotation >= 0 ? selectedRotation : 360 + (selectedRotation % 360);
        const sectorIndex = Math.floor(normalizedRotation / sectorDeg) % optionsList().length;
        const selectedOptionLabel = optionsList()[sectorIndex] || null;
        setSelectedOption(selectedOptionLabel);
        SetSelectedOptionIndex(sectorIndex)
        setWinnerList([selectedOptionLabel!, ...winnerList()].splice(0, 35));

        // Update the current rotation to the new accumulated rotation
        setCurrentRotation(endRotation);
        setIsSpinning(false);
        setShowConfetti(true);
        await setTimeout(() => { setShowConfetti(false) }, 3000)
      }
    };

    // Start the animation loop
    requestAnimationFrame(animateSpin);
  };

  return (
    <div class="grid place-items-center w-4/5">
      <div class="relative m-5">
        {/* Color Wheel */}
        <ColorWheelBoard options={optionsList} radius={radius} />
        <ImArrowLeft
          class="absolute -right-4 top-1/2 fill-red-500 stroke-yellow-400 stroke-1"
          style={{ transform: "translate(0, -50%)" }}
          size="40px"
        />
        <div class="absolute right-0 top-0 border-2 rounded-md fill-white border-blue-500 p-1 bg-blue-500 hover:border-blue-700 hover:bg-blue-700" title="configure color wheel">
          <FaSolidGear
            size="40px"
            onclick={() => {
              setShowSettings(true);
            }}
          />
        </div>
      </div>
      <div class="grid justify-center place-items-center" title="Spin the Wheel">
        {/* Spin Button */}
        <button
          onClick={() => {
            if (!isSpinning()) {
              handleAnimatedSpin();
            }
          }}
          class="mt-4 px-4 py-3 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-700 transition-colors align-center"
        >
          Spin the Wheel
        </button>
        {/* Selected Option */}
        {
        selectedOption() && !isSpinning() &&
          (
          <div class="flex mt-4">
            <h2 class="text-xl font-bold">Selection: {selectedOption()}</h2>
            <div class="grid align-middle px-2">
              {
                optionsList().includes(selectedOption()!) &&
        
            <button
              title={`remove ${selectedOption()}`}
              onClick={(e) => {
                handleDeleteOption(e, selectedOptionIndex()!)
              }}
            >
              <div class="flex border-2 border-red-400 align-middle rounded-md pr-1 text-white bg-red-400 hover:bg-red-700 hover:border-red-700">
              <div class="grid place-items-center p-0"><RiSystemCloseFill size="20px"/></div>Remove</div>
            </button>}
            </div>
          </div>

        )}

      </div>

      <div
        id="option-form"
        class="fixed w-[400px] top-20 left-1/2 p-4 border shadow-lg rounded-md bg-white -ml-[200px]"
        hidden={!showSettings()}
      >
        <OptionForm
          setOptionsList={setOptionsList}
          optionsList={optionsList}
          setShowSettings={setShowSettings}
          urlParams={urlParams}
          setUrlParams={setUrlParams}
          pageTitle={pageTitle}
          setPageTitle={setPageTitle}
        />
      </div>
      {winnerList().length > 0 && <div class="absolute top-10 left-10 border-2 w-[200px] p-2 rounded-md bg-white shadow-lg">
        <p class="text-lg">History (Last 35)</p>
        <hr />
        <ul class={`list-decimal list-inside ${(winnerList().length > 25) ? "text-xs": "text-sm"}`}>
          {winnerList().map((winner) => {
            return (<li class="truncate" title={winner}>{winner}</li>)
          })}
        </ul>
        <hr />
        <div class="flex justify-end" title="Clear history list">
          <button
            class="my-2 px-2 rounded-md border-2 border-blue-500 bg-blue-500 text-white hover:bg-blue-700  hover:border-blue-700"
            onClick={(e) => {
              setWinnerList([])
            }}
          >
            Clear
          </button>
        </div>
      </div>}
      <div id="confetti" class="absolute top-0 left-0 h-full w-full overflow-hidden" hidden={!showConfetti()}>{showConfetti() && (<div class="flex"><ConfettiExplosion duration={3000} stageWidth={3200} /><ConfettiExplosion duration={2000} force={0.3} stageWidth={3200} /></div>)}</div>
      { showHelp() ?
      <div id="help" class="absolute top-10 right-10 border-2 rounded-md shadow-lg w-[250px] p-4 bg-white">
        <div class="grid grid-cols-2 w-full">
        <h2 class="text-lg">Help</h2>
        <div class="pb-2 flex justify-end">
                <RiSystemCloseFill
                    size="18px"
                    class="bg-red-400 hover:bg-red-700 text-white border-red-400 hover:border-red-700 border-2 rounded-md"
                    onclick={() => {
                        setShowHelp(false);
                    }}
                />
            </div>
        </div>
        <hr />
        <div class="text-sm">
        <p class="text-sm">This color wheel was designed with teachers and classrooms in mind. After configuring your color wheel, you can bookmark it. No settings are saved on our server. Opening the bookmark will open this page with the settings at the time of bookmarking.</p>
        <p>If you want the option to win once, the <i>Remove</i> button will remove the option from the wheel. Reloading the bookmark will restore all removed options.</p>
        <p>Since this is expected to be used in classrooms, this application will stay ad free, and no data will be collected by our servers other than visits counts. If you enjoy using this and support its ideals, you can show your support by <a class="text-blue-500 hover:text-blue-700" href="https://www.buymeacoffee.com/sslidss">buying the developer a coffee!</a></p>
        </div>
      </div> : <div class="absolute top-10 right-10">
        <button
        onclick={() => {
          setShowHelp(true);
        }}
        title="Help"
      >
        <div class="border-2 rounded-md p-2 bg-green-500 fill-white border-green-500 hover:border-green-700 hover:bg-green-700">
          <FaSolidQuestion /></div></button></div>
    }
    </div>
  );
};

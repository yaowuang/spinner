// src/ColorWheelPicker.tsx
import { Accessor, Component, createEffect, createSignal, Setter } from 'solid-js';
import { FaSolidGear } from 'solid-icons/fa'
import { ImArrowLeft } from 'solid-icons/im'
import { cubicOut } from 'eases'; // Importing the Bézier curve easing function
import { useSearchParams } from "@solidjs/router";
import { OptionForm } from './OptionForm';
import { ConfettiExplosion } from 'solid-confetti-explosion';
import { RiSystemCloseFill } from 'solid-icons/ri';

interface ColorWheelPickerProps {
  pageTitle: Accessor<string>,
  setPageTitle: Setter<string>
}

export const Colors = {
  red: "#ee7777",
  green: "#77ee77",
  blue: "#7777ee",
  cyan: "#77eeee",
  magenta: "#ee77ee",
  yellow: "#eeee77",
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
              <span class={`text-black`}>
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
  const totalOptions = optionsList().length;
  const anglePerOption = 360 / totalOptions;
  const [currentRotation, setCurrentRotation] = createSignal(0);

  const [selectedOption, setSelectedOption] = createSignal<string | null>(null);
  const [selectedOptionIndex, SetSelectedOptionIndex] = createSignal<number | null>(null);
  const [isSpinning, setIsSpinning] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [urlParams, setUrlParams] = useSearchParams();
  const [winnerList, setWinnerList] = createSignal([] as string[])
  const [showConfetti, setShowConfetti] = createSignal(false)

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
        <div class="absolute right-0 top-0">
          <FaSolidGear
            class={"fill-blue-500 hover:fill-blue-700"}
            size="40px"
            onclick={() => {
              setShowSettings(true);
            }}
          />
        </div>
      </div>
      <div class="grid justify-center place-items-center">
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
        {selectedOption() && !isSpinning() && (
          <div class="flex mt-4">
            <h2 class="text-xl font-bold">Selection: {selectedOption()}</h2>
            <div class="grid align-middle px-2">
              {optionsList().includes(selectedOption()!) &&
        
            <button
              title={`remove ${selectedOption()}`}
              onClick={(e) => {
                handleDeleteOption(e, selectedOptionIndex()!)
              }}
            >
              <RiSystemCloseFill size="20px" class="border-2 transition-colors border-red-500 bg-red-500 hover:bg-red-700 hover:border-red-700 text-white rounded-lg" />
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
      {winnerList().length > 0 && <div class="absolute top-10 left-10 border-2 w-[200px] p-2 rounded-md">
        <p class="text-lg">History (Last 35)</p>
        <hr />
        <ul class={`list-decimal list-inside ${(winnerList().length > 25) ? "text-xs": "text-sm"}`}>
          {winnerList().map((winner) => {
            return (<li>{winner}</li>)
          })}
        </ul>
        <hr />
        <div class="flex justify-end">
          <button
            class="my-2 px-2 rounded-md border-2 border-blue-500 hover:bg-blue-500 text-blue-500 hover:text-white"
            onClick={(e) => {
              setWinnerList([])
            }}
          >
            Clear
          </button>
        </div>
      </div>}
      <div id="confetti" class="absolute top-0 left-0 h-[600px] w-full" hidden={!showConfetti()}>{showConfetti() && (<div class="flex"><ConfettiExplosion duration={3000} stageWidth={3200} /><ConfettiExplosion duration={2000} force={0.3} stageWidth={3200} /></div>)}</div>
    </div>
  );
};

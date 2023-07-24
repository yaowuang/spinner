import { Accessor, Component, createEffect, createSignal, Setter } from "solid-js";
import { RiSystemCloseFill, RiSystemDeleteBin5Line } from 'solid-icons/ri'
import { Colors, OptionType } from "./ColorWheelPicker";
import { NavigateOptions, Params, SetParams } from "@solidjs/router";
import { FaSolidPlus } from 'solid-icons/fa'

interface OptionFormProps {
    optionsList: Accessor<OptionType[]>;
    setOptionsList: Setter<OptionType[]>;
    setShowSettings: Setter<boolean>;
    urlParams: Params,
    setUrlParams: (params: SetParams, options?: Partial<NavigateOptions<unknown>> | undefined) => void
    pageTitle: Accessor<string>,
    setPageTitle: Setter<string>
}



export const OptionForm: Component<OptionFormProps> = (props: OptionFormProps) => {
    const { optionsList, setOptionsList, urlParams, setUrlParams, setShowSettings, pageTitle, setPageTitle } = props;
    const [addLabel, setAddLabel] = createSignal("");

    const handleAddOption = (e: Event) => {
        if (addLabel()) {
            const entry: OptionType = {
                label: addLabel(),
            };
            const labelParams = (urlParams.labels ? (urlParams.labels + ",") : "") + addLabel();
            setOptionsList([...optionsList(), entry]);
            setUrlParams({ labels: labelParams })
            setAddLabel("");
        }
    };

    const handleDeleteOption = (e: Event, index: number) => {
        var newList = optionsList()
        newList.splice(index,1)
        setOptionsList([...newList])
        const labelParams = newList.map((item) => { return item.label}).join(",") 
        setUrlParams({ labels: labelParams})
    }

    return (
        <div id="grid option-form">
            <div class="pb-2 flex justify-end">
                <RiSystemCloseFill
                    size="18px"
                    class="bg-red-400 hover:bg-red-700"
                    style={{
                        border: "1px solid black",
                        "border-radius": "4px",
                    }}
                    onclick={() => {
                        setShowSettings(false);
                    }}
                />
            </div>
            <div class="flex justify-end my-2">
                <button
                    class="px-4 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-700 transition-colors align-center"
                    onclick={() => {
                        setOptionsList([]);
                        setUrlParams({ labels: "", title: null});
                        setAddLabel("")
                        setPageTitle("Random Color Wheel Picker")
                        document.title = "Random Color Wheel Picker"
                    }}
                >
                    Reset
                </button>
            </div>
            <div>
            <div>
                    <p>Title</p>
                    <input
                        type="text"
                        id="titleInput"
                        name="titleInput"
                        class="border-2 rounded-md w-full mb-2" 
                        value={pageTitle()}
                        onChange={(e)=>{
                            setPageTitle(e.target.value)
                            setUrlParams({...urlParams, title: e.target.value})
                            document.title = e.target.value
                        }}
                    />

                </div>
            </div>
            <div class="h-[400px] overflow-y-scroll">

                <table class="table-auto border w-full">
                    <thead>
                        <tr class="h-12">
                            <th>label</th>
                            <th>color</th>
                        </tr>
                    </thead>
                    <tbody>
                        {optionsList() ?
                            optionsList().map((option: OptionType, index: number) => {
                                return (
                                    <tr class="h-8">
                                        <td class="px-4">{option.label}</td>
                                        <td><div class="w-full h-6 rounded-md border-2" style={{ background: Colors[Object.keys(Colors)[index % Object.keys(Colors).length] as keyof typeof Colors] || "transparent" }}></div></td>
                                        <td><div class="grid align-middle"><button
                                        onClick={(e) => {
                                            handleDeleteOption(e, index)
                                        }}
                                        ><RiSystemDeleteBin5Line size="24px" class="mx-2 border-2 transition-colors border-red-500 bg-red-500 hover:bg-red-700 hover:border-red-700 text-white rounded-md" /></button></div></td>
                                    </tr>
                                );
                            }) : ""}
                        <tr>
                            <td>
                                <input
                                    type="text"
                                    id="labelInput"
                                    name="labelInput"
                                    class="border-2 rounded-md w-full"
                                    onchange={(e) => {
                                        setAddLabel(e.target.value);
                                    }}
                                    onkeypress={(e) => {
                                        if (["Enter", "NumpadEnter"].includes(e.code)) {
                                            setAddLabel(e.currentTarget.value)
                                            handleAddOption(e)
                                        }
                                    }}
                                    value={addLabel()}
                                />
                            </td>
                            <td><div class="w-full h-6 rounded-md border-2" style={{ background: Colors[Object.keys(Colors)[optionsList().length % Object.keys(Colors).length] as keyof typeof Colors] || "transparent" }}></div></td>
                            <td>
                                <div class="grid align-middle">
                                <button onClick={handleAddOption}><FaSolidPlus
                                 size="24px" class="mx-2 border-2 border-green-500 bg-green-500 transition-colors hover:bg-green-700 hover:border-green-700 fill-white rounded-md items-center" 
                                    /></button>
                                    </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
            </div>
            <p class="text-sm text-gray-500">Note: You can add more than 1 at a time by using commas to separate values. eg: 1,2,3,4,5</p>
        </div>
    );
};
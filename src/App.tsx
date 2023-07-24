import { Router, } from '@solidjs/router';
import { Component, createSignal } from 'solid-js';
import { ColorWheelPicker } from './components/ColorWheelPicker';

const App: Component = () => {


	const [pageTitle, setPageTitle] = createSignal("Random Color Wheel Picker")
		return (
			<Router>
			<div class="grid place-items-center h-[600px] mt-4">
				<p class="text-center text-xl">{pageTitle()}</p>
				<ColorWheelPicker pageTitle={pageTitle} setPageTitle={setPageTitle} /> 
			</div>
			</Router>
		    );
};

export default App;

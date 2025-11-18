/**
 * App - Root application component
 * Sets up routing, analytics, and main layout
 */

import { Router } from '@solidjs/router';
import { Component, createSignal } from 'solid-js';
import { ColorWheelPicker } from './components/ColorWheelPicker';
import { inject } from '@vercel/analytics';

/**
 * Root component for the Color Wheel Picker application
 * Initializes Vercel Analytics and manages page-level state
 */
const App: Component = () => {
  // Initialize analytics
  inject();

  // Page title state - used for dynamic title updates
  const [pageTitle, setPageTitle] = createSignal('Random Color Wheel Picker');

  return (
    <Router>
      <ColorWheelPicker pageTitle={pageTitle} setPageTitle={setPageTitle} />
    </Router>
  );
};

export default App;

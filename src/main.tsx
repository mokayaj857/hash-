
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './Components/Home';
import Hero from './Components/Hero';
import Nav from './Components/Nav';
import Header from './Components/Header';
import './index.css';
const router = createBrowserRouter([
  {
    path: "hero",
    element: <Hero />,
  },
  {
    path: "nav",
    element: <Nav />,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "header",
    element: <Header />,
  },
]);
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}

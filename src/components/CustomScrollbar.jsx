// components/CustomScrollbar.jsx
import { useEffect } from 'react';

const CustomScrollbar = () => {
  useEffect(() => {
    // Add custom scrollbar styles to the document
    const style = document.createElement('style');
    style.innerHTML = `
      /* Thin and Beautiful Scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      /* Track */
      ::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 10px;
      }

      /* Handle */
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #cbd5e1, #94a3b8);
        border-radius: 10px;
        transition: all 0.3s ease;
      }

      /* Handle on hover */
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #94a3b8, #64748b);
      }

      /* Handle on active */
      ::-webkit-scrollbar-thumb:active {
        background: linear-gradient(135deg, #64748b, #475569);
      }

      /* Corner */
      ::-webkit-scrollbar-corner {
        background: transparent;
      }

      /* Firefox support */
      * {
        scrollbar-width: thin;
        scrollbar-color: #94a3b8 transparent;
      }

      /* For dark mode support */
      .dark ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #475569, #334155);
      }

      .dark ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #334155, #1e293b);
      }

      .dark * {
        scrollbar-color: #475569 transparent;
      }

      /* Custom scrollbar for specific elements */
      .scrollbar-thin::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      .scrollbar-extra-thin::-webkit-scrollbar {
        width: 3px;
        height: 3px;
      }

      .scrollbar-gradient::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      }

      .scrollbar-gradient:hover::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
      }

      .scrollbar-primary::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }

      .scrollbar-success::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      .scrollbar-warning::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .scrollbar-danger::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      /* Hide scrollbar but keep functionality */
      .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .scrollbar-hidden::-webkit-scrollbar {
        display: none;
      }

      /* Smooth scrolling for all elements */
      * {
        scroll-behavior: smooth;
      }

      /* Custom scrollbar container with gradient effect */
      .scrollbar-container {
        position: relative;
        overflow: auto;
      }

      .scrollbar-container::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 10px;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(0,0,0,0.02));
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .scrollbar-container:hover::after {
        opacity: 1;
      }

      /* Sidebar specific scrollbar */
      .sidebar-scrollbar::-webkit-scrollbar {
        width: 4px;
      }

      .sidebar-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #94a3b8, #64748b);
        border-radius: 4px;
      }

      .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #64748b, #475569);
      }

      /* Hide scrollbar when not hovering on sidebar */
      .sidebar-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
      }

      .sidebar-scrollbar:hover {
        scrollbar-color: #94a3b8 transparent;
      }

      .sidebar-scrollbar::-webkit-scrollbar-thumb {
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
        opacity: 1;
      }
    `;

    document.head.appendChild(style);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default CustomScrollbar;
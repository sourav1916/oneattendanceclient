// components/CustomScrollbar.jsx
import { useEffect } from 'react';

const CustomScrollbar = () => {
  useEffect(() => {
    // Detect if mobile - apply different styles
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const style = document.createElement('style');
    style.innerHTML = `
      /* Base scrollbar styles - works everywhere */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }

      /* Dark mode */
      .dark ::-webkit-scrollbar-thumb {
        background: #475569;
      }

      .dark * {
        scrollbar-color: #475569 transparent;
      }

      /* Mobile optimizations - NO gradients, simpler */
      @media (max-width: 768px) {
        ::-webkit-scrollbar {
          width: 4px; /* Slightly smaller on mobile */
        }
        
        ::-webkit-scrollbar-thumb {
          background: #94a3b8; /* Solid color instead of gradient */
          border-radius: 4px;
        }
        
        /* Remove hover effects on mobile (they cause jank) */
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Ensure smooth touch scrolling */
        .overflow-y-auto, 
        [class*="scrollbar-"] {
          -webkit-overflow-scrolling: touch !important;
          scroll-behavior: smooth;
        }
      }

      /* Desktop - keep gradients and effects */
      @media (min-width: 769px) {
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          transition: all 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8, #64748b);
        }

        /* Smooth scrolling for desktop */
        * {
          scroll-behavior: smooth;
        }
      }

      /* Utility classes - simplified */
      .scrollbar-thin::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      .scrollbar-primary::-webkit-scrollbar-thumb {
        background: #3b82f6;
      }

      .scrollbar-success::-webkit-scrollbar-thumb {
        background: #10b981;
      }

      .scrollbar-warning::-webkit-scrollbar-thumb {
        background: #f59e0b;
      }

      .scrollbar-danger::-webkit-scrollbar-thumb {
        background: #ef4444;
      }

      /* Hide scrollbar option */
      .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .scrollbar-hidden::-webkit-scrollbar {
        display: none;
      }
      
      /* Remove gradient container effect - it causes repaints */
      /* .scrollbar-container styles removed */
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default CustomScrollbar;
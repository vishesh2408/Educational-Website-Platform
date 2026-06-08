// import React from 'react';
// import { X } from 'lucide-react'; // Assuming Lucide is installed and used across components

// const Modal = ({ show, title, message, onClose }) => {
//   if (!show) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h3 className="modal-title">{title}</h3>
//           <button onClick={onClose} className="modal-close-button">
//             <X size={24} />
//           </button>
//         </div>
//         <p className="modal-message">{message}</p>
//         <div className="modal-footer">
//           <button onClick={onClose} className="modal-close-action-button">
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Modal;






import React from 'react';
import { X, CheckCircle } from 'lucide-react'; // Added CheckCircle for success animation

/**
 * A professional, responsive, and interactive modal component using Tailwind CSS.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.show - A boolean to control the visibility of the modal.
 * @param {string} props.title - The title to display in the modal header.
 * @param {string} props.message - The main message or content of the modal.
 * @param {Function} props.onClose - The function to call when the modal is closed.
 * @param {boolean} [props.isSuccess=false] - A boolean to show the success animation.
 */
const Modal = ({ show, title, message, onClose, isSuccess = false }) => {
  // If 'show' is false, the component renders nothing.
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg p-6 bg-white/5 border border-white/10 backdrop-blur rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
        
        {/* Modal Header: Displays the title and a close button. */}
        {/* The 'flex' and 'justify-between' classes align the title and button. */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            {/* Success Animation: Conditionally render the green checkmark icon. */}
            {isSuccess && (
              <CheckCircle size={24} className="text-green-400 animate-pulse" />
            )}
            <h3 className="text-xl font-bold text-white">
              {title}
            </h3>
          </div>
          {/* Close Button: A visually appealing button with hover effects. */}
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#167468]"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Body: Displays the main message. */}
        <p className="mt-4 text-gray-200 whitespace-pre-line">
          {message}
        </p>

        {/* Modal Footer: Contains the action button. */}
        {/* It is aligned to the right and provides top margin. */}
        <div className="flex justify-end pt-4 mt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 border border-white/10 text-gray-200 rounded-2xl font-semibold hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#167468]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

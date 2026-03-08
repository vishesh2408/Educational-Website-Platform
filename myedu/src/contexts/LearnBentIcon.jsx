import React from 'react';

/**
 * LearnBentIcon Component
 * A high-fidelity reproduction of the graduation cap brand mark.
 * Features a triple-stop linear gradient (Purple -> Indigo -> Teal).
 * @param {number} size - The width and height of the icon (default: 32)
 * @param {string} className - Optional Tailwind or CSS classes
 */
const LearnBentIcon = ({ size = 32, className = "" }) => {
    const gradientId = "learnBentBrandGradient";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} select-none`}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#A855F7" /> {/* Purple 500 */}
                    <stop offset="50%" stopColor="#6366F1" /> {/* Indigo 500 */}
                    <stop offset="100%" stopColor="#14B8A6" /> {/* Teal 500 */}
                </linearGradient>
            </defs>

            {/* Brand Squircle Background */}
            <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />

            {/* Graduation Cap (Mortarboard) Silhouette */}
            {/* Top Diamond / Board */}
            <path
                d="M6 14L16 9L26 14L16 19L6 14Z"
                fill="white"
            />

            {/* Cap Base / Skullcap */}
            <path
                d="M10 16V19.5C10 19.5 10 22 16 22C22 22 22 19.5 22 19.5V16"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Tassel */}
            <path
                d="M26 14V19"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default LearnBentIcon;

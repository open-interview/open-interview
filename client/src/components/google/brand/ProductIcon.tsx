import React from 'react';

interface ProductIconProps {
  size?: number | string;
  className?: string;
  ariaLabel?: string;
  color?: string;
}

const ProductIcon: React.FC<ProductIconProps> = ({
  size = 40,
  className = '',
  ariaLabel = 'Google product icon',
  color = '#4285F4'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <title>Google Product Icon</title>
      <desc>Generic Google product icon with customizable color</desc>
      <rect x="4" y="4" width="32" height="32" rx="8" fill={color} />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fontFamily="Product Sans, Arial, sans-serif"
        fontSize="18"
        fontWeight="700"
        fill="white"
      >
        G
      </text>
    </svg>
  );
};

export default ProductIcon;

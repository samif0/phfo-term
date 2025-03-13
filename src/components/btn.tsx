import React from 'react';
import './components.css';

type ButtonProps = {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  textColor?: string;
};

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
}) => {
  const buttonClasses = `
    mono-button 
    mono-button--${variant} 
    mono-button--${size}
    mono-button--textColor
    ${disabled ? 'mono-button--disabled' : ''}
    ${className}
  `;

  return (
    <button 
      className={buttonClasses} 
      onClick={onClick} 
      disabled={disabled}
      aria-disabled={disabled}
    >
      {icon && iconPosition === 'left' && <span className="mono-button__icon mono-button__icon--left">{icon}</span>}
      <span className="mono-button__text">{text}</span>
      {icon && iconPosition === 'right' && <span className="mono-button__icon mono-button__icon--right">{icon}</span>}
    </button>
  );
};

export default Button;
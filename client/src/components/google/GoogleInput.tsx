import {
  InputHTMLAttributes,
  useId,
  useState,
  forwardRef,
  useRef,
  useEffect,
} from "react";
import "./GoogleInput.css";

interface GoogleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: boolean;
}

export const GoogleInput = forwardRef<HTMLInputElement, GoogleInputProps>(
  (
    {
      label,
      helperText,
      error = false,
      className = "",
      value: controlledValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setHasValue(controlledValue.toString().length > 0);
      }
    }, [controlledValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className={`google-input-wrapper ${className}`}>
        <div
          className={`google-input-container ${
            focused ? "google-input-container--focused" : ""
          } ${error ? "google-input-container--error" : ""} ${
            hasValue || focused ? "google-input-container--has-value" : ""
          }`}
        >
          <label htmlFor={id} className="google-input-label">
            {label}
          </label>
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={id}
            className="google-input"
            value={controlledValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleInputChange}
            {...props}
          />
          <div className="google-input-ink-bar" />
        </div>
        {(helperText || error) && (
          <span
            className={`google-input-helper-text ${
              error ? "google-input-helper-text--error" : ""
            }`}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

GoogleInput.displayName = "GoogleInput";
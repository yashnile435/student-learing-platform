
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../styles/Auth.css';

const PasswordInput = ({
    label,
    value,
    onChange,
    className = "form-input",
    ...rest
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <div className="password-wrapper">
                <input
                    type={showPassword ? "text" : "password"}
                    className={className}
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
                <button
                    type="button"
                    className="password-toggle-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;

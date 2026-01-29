
import React from 'react';
import '../styles/ProgressBar.css'; // We will create this css file

const ProgressBar = ({ percentage, color = '#4caf50', height = '8px', showLabel = true }) => {
    // Clamp percentage between 0 and 100
    const constrainedPercentage = Math.min(Math.max(percentage, 0), 100);

    return (
        <div className="progress-container">
            <div className="progress-track" style={{ height }}>
                <div 
                    className="progress-fill" 
                    style={{ 
                        width: `${constrainedPercentage}%`, 
                        backgroundColor: color,
                        height: '100%'
                    }}
                ></div>
            </div>
            {showLabel && (
                <div className="progress-label">
                    {constrainedPercentage}% Complete
                </div>
            )}
        </div>
    );
};

export default ProgressBar;

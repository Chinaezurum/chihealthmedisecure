// Minimal test component to verify React is working
import React from 'react';

const AppTest: React.FC = () => {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#fff',
      color: '#000',
      minHeight: '100vh',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <h1>React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default AppTest;


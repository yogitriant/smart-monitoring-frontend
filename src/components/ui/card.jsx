// src/components/ui/card.jsx
export function Card({ children, className }) {
    return <div className={`bg-white shadow p-4 rounded ${className}`}>{children}</div>;
  }
  
  export function CardContent({ children, className }) {
    return <div className={className}>{children}</div>;
  }
  
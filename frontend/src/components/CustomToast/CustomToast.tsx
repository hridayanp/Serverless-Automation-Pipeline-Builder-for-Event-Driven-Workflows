import { useEffect } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
const TOAST_LIMIT = 1;

const CustomToast = () => {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible) // Only consider visible toasts
      .filter((_, i) => i >= TOAST_LIMIT) // Is toast index over limit?
      .forEach((t) => toast.remove(t.id)); // Dismiss – Use toast.remove(t.id) for no exit animation
  }, [toasts]);

  return (
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#1a2c20',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '400px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        },
        success: {
          style: {
            background: '#2d4b37',
            color: '#ffffff',
            border: '2px solid #ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#2d4b37',
          },
        },
        error: {
          style: {
            background: '#c84b31',
            color: '#ffffff',
            border: '2px solid #ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#c84b31',
          },
        },
      }}
    />
  );
};

export default CustomToast;

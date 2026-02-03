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
      gutter={0}
      toastOptions={{
        // Define default options
        className: 'toaster',
        duration: 2000,
        // Default options for specific types
        icon: '',
        style: {
          padding: '10px',
          textAlign: 'center',
        },

        success: {
          style: {
            background: '#377E62',
            color: '#fff',
            fontSize: '14px',
          },
        },
        error: {
          style: {
            background: '#C73C23',
            color: '#fff',
            fontSize: '14px',
          },
        },
      }}
    />
  );
};

export default CustomToast;

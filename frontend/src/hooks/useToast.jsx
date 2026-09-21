import toast from "react-hot-toast";

export const ToastProvider = ({ children }) => {
  return children;
};

export function useToast() {
  return {
    toast,
    success: (msg, opts) => toast.success(msg, opts),
    error: (msg, opts) => toast.error(msg, opts),
    loading: (msg, opts) => toast.loading(msg, opts),
    dismiss: (id) => toast.dismiss(id),
  };
}

export { toast };
export default toast;

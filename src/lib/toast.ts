// import { toast as sonnerToast } from "sonner";

// // Custom toast with pixelated styling
// export const toast = {
//   success: (message: string, options?: any) => {
//     return sonnerToast.success(message, {
//       duration: 3000,
//       className: "pixel-toast pixel-toast-success",
//       ...options,
//     });
//   },
  
//   error: (message: string, options?: any) => {
//     return sonnerToast.error(message, {
//       duration: 4000,
//       className: "pixel-toast pixel-toast-error",
//       ...options,
//     });
//   },
  
//   info: (message: string, options?: any) => {
//     return sonnerToast.info(message, {
//       duration: 3000,
//       className: "pixel-toast pixel-toast-info",
//       ...options,
//     });
//   },
  
//   warning: (message: string, options?: any) => {
//     return sonnerToast.warning(message, {
//       duration: 3500,
//       className: "pixel-toast pixel-toast-warning",
//       ...options,
//     });
//   },
// };
import { toast as sonnerToast, type ExternalToast } from "sonner";

// Custom pixel-toast options that extend Sonner's type
type PixelToastOptions = Omit<ExternalToast, "className"> & {
  className?: string;
};

export const toast = {
  success: (message: string, options?: PixelToastOptions) => {
    return sonnerToast.success(message, {
      duration: 3000,
      className: "pixel-toast pixel-toast-success",
      ...options,
    });
  },

  error: (message: string, options?: PixelToastOptions) => {
    return sonnerToast.error(message, {
      duration: 4000,
      className: "pixel-toast pixel-toast-error",
      ...options,
    });
  },

  info: (message: string, options?: PixelToastOptions) => {
    return sonnerToast.info(message, {
      duration: 3000,
      className: "pixel-toast pixel-toast-info",
      ...options,
    });
  },

  warning: (message: string, options?: PixelToastOptions) => {
    return sonnerToast.warning(message, {
      duration: 3500,
      className: "pixel-toast pixel-toast-warning",
      ...options,
    });
  },
};

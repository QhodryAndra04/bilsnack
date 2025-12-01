import Swal from 'sweetalert2';

// Base styling untuk SweetAlert yang konsisten dengan theme aplikasi
const swalCustom = Swal.mixin({
  customClass: {
    popup: 'rounded-xl',
    confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg mx-1',
    cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg mx-1',
    denyButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg mx-1',
  },
  buttonsStyling: false,
});

// Toast notification (muncul di pojok)
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// Success alert
export const showSuccess = (title, text = '') => {
  return swalCustom.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonText: 'OK'
  });
};

// Error alert
export const showError = (title, text = '') => {
  return swalCustom.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonText: 'OK'
  });
};

// Warning alert
export const showWarning = (title, text = '') => {
  return swalCustom.fire({
    icon: 'warning',
    title: title,
    text: text,
    confirmButtonText: 'OK'
  });
};

// Info alert
export const showInfo = (title, text = '') => {
  return swalCustom.fire({
    icon: 'info',
    title: title,
    text: text,
    confirmButtonText: 'OK'
  });
};

// Confirmation dialog (Yes/No)
export const showConfirm = (title, text = '', confirmText = 'Ya', cancelText = 'Batal') => {
  return swalCustom.fire({
    icon: 'question',
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
};

// Delete confirmation
export const showDeleteConfirm = (itemName = 'item') => {
  return swalCustom.fire({
    icon: 'warning',
    title: 'Hapus ' + itemName + '?',
    text: 'Data yang dihapus tidak dapat dikembalikan!',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-xl',
      confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg mx-1',
      cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg mx-1',
    },
  });
};

// Loading alert
export const showLoading = (title = 'Memproses...') => {
  return Swal.fire({
    title: title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close loading
export const closeLoading = () => {
  Swal.close();
};

// Input dialog
export const showInput = (title, inputPlaceholder = '', inputType = 'text') => {
  return swalCustom.fire({
    title: title,
    input: inputType,
    inputPlaceholder: inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Field tidak boleh kosong!';
      }
    }
  });
};

// Toast success
export const toastSuccess = (message) => {
  return Toast.fire({
    icon: 'success',
    title: message
  });
};

// Toast error
export const toastError = (message) => {
  return Toast.fire({
    icon: 'error',
    title: message
  });
};

// Toast info
export const toastInfo = (message) => {
  return Toast.fire({
    icon: 'info',
    title: message
  });
};

// Toast warning
export const toastWarning = (message) => {
  return Toast.fire({
    icon: 'warning',
    title: message
  });
};

export default swalCustom;

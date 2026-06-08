import * as React from "react"
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react"
import { Button } from "./button"

export type DialogType = 'confirm' | 'alert' | 'error' | 'success';

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  type?: DialogType;
  onConfirm?: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function CustomDialog({
  isOpen,
  title,
  message,
  type = 'alert',
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Batal",
  isLoading = false
}: CustomDialogProps) {
  if (!isOpen) return null;

  let Icon = Info;
  let iconBgColor = "bg-blue-50 ring-blue-50/50";
  let iconColor = "text-blue-500";
  let confirmBtnClass = "bg-blue-600 hover:bg-blue-700 text-white";

  if (type === 'error') {
    Icon = AlertTriangle;
    iconBgColor = "bg-red-50 ring-red-50/50";
    iconColor = "text-red-500";
    confirmBtnClass = "bg-red-500 hover:bg-red-600 shadow-red-500/20";
  } else if (type === 'confirm') {
    Icon = AlertTriangle;
    iconBgColor = "bg-amber-50 ring-amber-50/50";
    iconColor = "text-amber-500";
    confirmBtnClass = "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20";
  } else if (type === 'success') {
    Icon = CheckCircle2;
    iconBgColor = "bg-green-50 ring-green-50/50";
    iconColor = "text-green-500";
    confirmBtnClass = "bg-green-600 hover:bg-green-700 text-white";
  }

  // Determine if it's a two-button dialog
  const isConfirm = type === 'confirm' && onConfirm !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="relative p-6">
          <div className="absolute right-4 top-4">
            <button 
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ring-8 ${iconBgColor}`}>
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <div className="text-gray-500 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
              {message}
            </div>

            <div className="flex w-full gap-3 mt-2">
              {isConfirm ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 font-medium border-gray-200 hover:bg-gray-50"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button 
                    className={`flex-1 rounded-xl h-12 font-medium shadow-md ${confirmBtnClass}`}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? "Memproses..." : confirmText}
                  </Button>
                </>
              ) : (
                <Button 
                  className={`w-full rounded-xl h-12 font-medium shadow-md ${confirmBtnClass}`}
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    else onCancel();
                  }}
                  disabled={isLoading}
                >
                  {confirmText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

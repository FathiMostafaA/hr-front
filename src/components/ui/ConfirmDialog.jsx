import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed? This action may be permanent.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isLoading = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-w-md"
        >
            <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-red-900">{title}</p>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;

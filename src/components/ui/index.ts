// src/components/ui/index.ts
// Export all UI components for easy importing

// Base components
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { TextArea } from './TextArea';
export type { TextAreaProps } from './TextArea';

export { Label } from './Label';
export type { LabelProps } from './Label';

export { Badge, badgeVariants } from './Badge';
export type { BadgeProps } from './Badge';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { RadioGroup, RadioGroupItem } from './RadioGroup';
export type { RadioGroupProps, RadioGroupItemProps } from './RadioGroup';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

// Layout components
export { Separator } from './Separator';
export type { SeparatorProps } from './Separator';

export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from './Tabs';

// Feedback components
export { Alert, AlertTitle, AlertDescription } from './Alert';
export type { AlertProps, AlertTitleProps, AlertDescriptionProps } from './Alert';

export { Progress } from './Progress';
export type { ProgressProps } from './Progress';

export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

export { ToastProvider, useToast, toast } from './Toast';
export type { ToastMessage, ToastType } from './Toast';

// Overlay components
export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  // Aliases for Dialog naming
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './Modal';
export type { ModalProps, ModalContentProps } from './Modal';

// Display components
export { Avatar, AvatarImage, AvatarFallback } from './Avatar';
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps } from './Avatar';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

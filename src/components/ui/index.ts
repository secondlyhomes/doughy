// src/components/ui/index.ts
// Export all UI components for easy importing

// Base components
export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';

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

export { ScrollArea } from './ScrollArea';
export type { ScrollAreaProps } from './ScrollArea';

export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './Collapsible';
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps } from './Collapsible';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps } from './Accordion';

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

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './AlertDialog';
export type {
  AlertDialogProps,
  AlertDialogContentProps,
  AlertDialogHeaderProps,
  AlertDialogFooterProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
  AlertDialogActionProps,
  AlertDialogCancelProps,
} from './AlertDialog';

export { Popover, PopoverTrigger, PopoverContent } from './Popover';
export type { PopoverProps, PopoverTriggerProps, PopoverContentProps } from './Popover';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from './DropdownMenu';
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuLabelProps,
  DropdownMenuGroupProps,
} from './DropdownMenu';

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './Tooltip';
export type { TooltipProps, TooltipProviderProps, TooltipTriggerProps, TooltipContentProps } from './Tooltip';

// Display components
export { Avatar, AvatarImage, AvatarFallback } from './Avatar';
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps } from './Avatar';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Table, TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
export type { TableProps, TableColumn } from './Table';

export { Carousel, CarouselItem } from './Carousel';
export type { CarouselProps, CarouselItemProps } from './Carousel';

// Navigation components
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './Breadcrumb';
export type {
  BreadcrumbProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbSeparatorProps,
  BreadcrumbEllipsisProps,
} from './Breadcrumb';

export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

// Date/Time components
export { Calendar } from './Calendar';
export type { CalendarProps, MarkedDateStyle } from './Calendar';

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

// File/Media components
export { FileUpload } from './FileUpload';
export type { FileUploadProps } from './FileUpload';

export { ImagePicker } from './ImagePickerComponent';
export type { ImagePickerProps } from './ImagePickerComponent';

// Input components
export { OTPInput } from './OTPInput';
export type { OTPInputProps } from './OTPInput';

export { AddressAutocomplete } from './AddressAutocomplete';
export type { AddressAutocompleteProps, AddressValue } from './AddressAutocomplete';

// Bottom Sheet
export { BottomSheet, BottomSheetSection } from './BottomSheet';
export type { BottomSheetProps, BottomSheetSectionProps } from './BottomSheet';

// Screen Header
export { ScreenHeader } from './ScreenHeader';
export type { ScreenHeaderProps } from './ScreenHeader';

// Glass components
export { GlassView, GlassBackdrop, isLiquidGlassSupported } from './GlassView';
export type { GlassViewProps, GlassBackdropProps } from './GlassView';

// Navigation components
export { FloatingGlassTabBar } from './FloatingGlassTabBar';
export type { FloatingGlassTabBarProps } from './FloatingGlassTabBar';

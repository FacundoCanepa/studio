import { cn } from '@/lib/utils';

interface AdSlotProps {
  className?: string;
}

export const AdSlot = ({ className }: AdSlotProps) => {
  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg border-2 border-dashed bg-secondary/50",
      className
    )}>
      <span className="text-sm text-muted-foreground">Ad Placeholder</span>
    </div>
  );
};

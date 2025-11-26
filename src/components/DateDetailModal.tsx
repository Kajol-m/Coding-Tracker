import { X } from "lucide-react";
import { PixelButton } from "./ui/pixel-button";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import type { DailyData, QuestionData } from "@/types/tracker";
import { toast } from "@/lib/toast";

interface DateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  data: DailyData | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const DateDetailModal = ({ isOpen, onClose, date, data, onEdit, onDelete }: DateDetailModalProps) => {
  if (!isOpen) return null;

  const canEdit = isToday(date) || !isBefore(startOfDay(date), startOfDay(new Date()));
  const isPast = isBefore(startOfDay(date), startOfDay(new Date())) && !isToday(date);

  const handleDelete = () => {
    toast.warning("Are you sure you want to delete this entry? This will remove all questions and the star for this day.", {
      duration: 0, // Don't auto-dismiss
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await onDelete();
            onClose(); // Close modal only after successful delete
          } catch (error) {
            // Error handling is done in the parent component
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-accent text-accent-foreground";
      case "planned": return "bg-secondary text-secondary-foreground";
      case "not-done": return "bg-destructive/20 text-destructive";
      default: return "bg-card text-card-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return "Done";
      case "planned": return "Planned";
      case "not-done": return "Not Done";
      default: return "?";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background pixel-border-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 relative">
          <h2 className="text-sm font-pixel">
            {format(date, "MMMM d, yyyy")}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 hover:scale-110 transition-transform"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!data ? (
          <div className="text-center py-8">
            <p className="text-[10px] text-muted-foreground mb-4">
              {isPast ? "No coding logged for this day" : "Nothing planned yet"}
            </p>
            {canEdit && (
              <PixelButton variant="accent" onClick={onEdit}>
                {isPast ? "Log Past Entry" : "Add Plan"}
              </PixelButton>
            )}
          </div>
        ) : (
          <>
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-pixel pixel-border-sm mb-4 ${getStatusColor(data.status)}`}>
              <span>{getStatusIcon(data.status)}</span>
            </div>

            {/* Questions with Languages */}
            <div className="mb-4">
              <h3 className="text-[10px] font-pixel mb-2 text-muted-foreground">
                Questions ({data.questions.length}):
              </h3>
              <ul className="space-y-2">
                {data.questions.map((question, i) => (
                  <li key={i} className="bg-card pixel-border-sm px-3 py-2 text-[10px]">
                    <div className="mb-1">
                      <span>{i + 1}. {question.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {question.languages.map((lang) => (
                        <span
                          key={lang}
                          className="bg-primary text-primary-foreground px-1.5 py-0.5 text-[7px] font-pixel pixel-border-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-between">
              <PixelButton variant="outline" onClick={handleDelete} className="border-destructive text-destructive hover:bg-destructive/10">
                Delete Entry
              </PixelButton>
              {canEdit && (
                <PixelButton variant="accent" onClick={onEdit}>
                  Edit Entry
                </PixelButton>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import { X, Star as StarIcon } from "lucide-react";
import { PixelButton } from "./ui/pixel-button";
import { format } from "date-fns";
import type { Star } from "@/types/tracker";

interface StarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  star: Star | null;
}

export const StarDetailModal = ({ isOpen, onClose, star }: StarDetailModalProps) => {
  if (!isOpen || !star) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background pixel-border-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-pixel">Coding Details</h2>
          <button
            onClick={onClose}
            className="hover:scale-110 transition-transform"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Star Content */}
        <div className="space-y-4">
          {/* Date */}
          <div>
            <h3 className="text-[10px] font-pixel mb-2 text-muted-foreground">
              Date Earned:
            </h3>
            <div className="bg-primary text-primary-foreground px-3 py-2 text-[10px] pixel-border-sm inline-block">
              {format(new Date(star.date), "MMMM d, yyyy")}
            </div>
          </div>

          {/* Questions */}
          <div>
            <h3 className="text-[10px] font-pixel mb-2 text-muted-foreground">
              Questions Solved:
            </h3>
            {star.questions ? (
              <ul className="space-y-2">
                {star.questions.map((question, i) => (
                  <li key={i} className="bg-card pixel-border-sm px-3 py-2 text-[10px]">
                    <div className="flex justify-between items-start gap-2">
                      <span className="flex-1">{i + 1}. {question}</span>
                      <div className="flex flex-wrap gap-1">
                        {star.languages.map((lang) => (
                          <span
                            key={lang}
                            className="bg-accent text-accent-foreground px-1.5 py-0.5 text-[7px] font-pixel pixel-border-sm"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-card pixel-border-sm px-3 py-2 text-[10px]">
                {star.question}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <PixelButton variant="accent" onClick={onClose}>
            Close
          </PixelButton>
        </div>
      </div>
    </div>
  );
};

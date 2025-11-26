import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { PixelButton } from "./ui/pixel-button";
import { format } from "date-fns";
import type { QuestionData } from "@/types/tracker";
import { toast } from "@/lib/toast";

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  onSave: (data: { questions: QuestionData[]; status: string }) => void;
  initialData?: { questions: QuestionData[]; status: string };
}

const POPULAR_LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C",
  "C#",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "Dart",
];

export const AddEntryModal = ({
  isOpen,
  onClose,
  date,
  onSave,
  initialData,
}: AddEntryModalProps) => {
  type StatusType = "done" | "planned" | "not-done";

  const [questions, setQuestions] = useState<QuestionData[]>(() => 
    initialData?.questions && initialData.questions.length > 0 
      ? initialData.questions 
      : [{ text: "", languages: [] }]
  );
  
  const [status, setStatus] = useState<StatusType>(() => 
    initialData?.status ? (initialData.status as StatusType) : "planned"
  );



  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: "", languages: [] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const toggleLanguage = (questionIndex: number, lang: string) => {
    const newQuestions = [...questions];
    const languages = newQuestions[questionIndex].languages;

    if (languages.includes(lang)) {
      newQuestions[questionIndex].languages = languages.filter(
        (l) => l !== lang
      );
    } else {
      newQuestions[questionIndex].languages = [...languages, lang];
    }

    setQuestions(newQuestions);
  };

  const handleSubmit = () => {
    const validQuestions = questions.filter((q) => q.text.trim() !== "");
    if (validQuestions.length === 0) {
      toast.error("Please add at least one question!");
      return;
    }

    const allHaveLanguages = validQuestions.every(
      (q) => q.languages.length > 0
    );
    if (!allHaveLanguages) {
      toast.error("Please select at least one language for each question!");
      return;
    }

    onSave({
      questions: validQuestions,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background pixel-border-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-pixel">{format(date, "MMMM d, yyyy")}</h2>
          <button
            onClick={onClose}
            className="hover:scale-110 transition-transform"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Questions */}
        <div className="mb-6">
          <label className="block text-[10px] font-pixel mb-3">
            Questions Solved:
          </label>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="p-3 bg-card pixel-border-sm">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) =>
                      handleQuestionChange(index, e.target.value)
                    }
                    placeholder={`Question ${index + 1}`}
                    className="flex-1 bg-input border-2 border-border px-3 py-2 text-[10px] font-pixel focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {questions.length > 1 && (
                    <PixelButton
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </PixelButton>
                  )}
                </div>

                {/* Languages for this question */}
                <div>
                  <label className="block text-[8px] font-pixel mb-2 text-muted-foreground">
                    Languages for Question {index + 1}:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(index, lang)}
                        className={`
                          px-2 py-1 text-[7px] font-pixel pixel-border-sm
                          transition-all hover:scale-105
                          ${
                            question.languages.includes(lang)
                              ? "bg-accent text-accent-foreground"
                              : "bg-background text-foreground"
                          }
                        `}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <PixelButton
            variant="secondary"
            size="sm"
            onClick={handleAddQuestion}
            className="mt-3"
          >
            <Plus className="w-3 h-3" />
            Add Question
          </PixelButton>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-[10px] font-pixel mb-3">Status:</label>
          <div className="flex gap-2">
            {["done", "planned", "not-done"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s as StatusType)}
                className={`
                  flex-1 px-4 py-2 text-[10px] font-pixel pixel-border-sm
                  transition-all hover:scale-105
                  ${
                    status === s
                      ? s === "done"
                        ? "bg-accent text-accent-foreground"
                        : s === "planned"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-destructive/20 text-destructive"
                      : "bg-card text-card-foreground"
                  }
                `}
              >
                {s === "done"
                  ? "✓ Done"
                  : s === "planned"
                  ? "◷ Planned"
                  : "✗ Not Done"}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <PixelButton variant="outline" onClick={onClose}>
            Cancel
          </PixelButton>
          <PixelButton variant="accent" onClick={handleSubmit}>
            Save Entry
          </PixelButton>
        </div>
      </div>
    </div>
  );
};

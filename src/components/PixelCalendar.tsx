import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from "date-fns";

interface PixelCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  dailyData: Record<string, { status: string }>;
}

export const PixelCalendar = ({ selectedDate, onDateSelect, dailyData }: PixelCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const data = dailyData[dateStr];
    if (!data) return null;
    return data.status;
  };

  const getDayColor = (date: Date) => {
    const today = startOfDay(new Date());
    const isPast = isBefore(startOfDay(date), today);
    const isCurrent = isToday(date);

    if (isCurrent) {
      return "bg-[hsl(280,60%,70%)] text-[hsl(48,100%,70%)] pixel-border-sm md:pixel-border";
    }
    
    if (isPast) {
      return "bg-[#fff0b3] text-[hsl(280,60%,50%)] pixel-border-sm md:pixel-border";
    }
    
    // Future dates - lighter pink text
    return "bg-primary/40 text-[hsl(340,80%,65%)] pixel-border-sm md:pixel-border hover:bg-primary/60";
  };

  const hasStars = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return !!dailyData[dateStr];
  };

  const getStarColor = (date: Date) => {
    const today = startOfDay(new Date());
    const isPast = isBefore(startOfDay(date), today);
    const isCurrent = isToday(date);

    if (isCurrent) {
      return "text-[hsl(48,100%,70%)]"; // Yellow for current date
    }
    
    if (isPast) {
      return "text-accent"; // Yellow for past dates
    }
    
    return "text-accent"; // Yellow for future dates with stars
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = monthStart.getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="bg-card pixel-border-lg p-4 md:p-6 lg:p-8 w-full max-w-sm md:max-w-md lg:max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8">
        <button
          onClick={previousMonth}
          className="p-2 md:p-3 hover:bg-accent/20 pixel-border transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
        </button>
        
        <h2 className="text-sm md:text-base lg:text-xl font-pixel text-primary text-center">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 md:p-3 hover:bg-accent/20 pixel-border transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 md:gap-3 mb-4 md:mb-6">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs md:text-sm text-muted-foreground font-pixel font-bold">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {daysInMonth.map((date) => {
          const isCurrent = isToday(date);
          const hasStar = hasStars(date);
          
          return (
            <button
              key={date.toString()}
              onClick={() => onDateSelect(date)}
              className={`
                aspect-square flex items-center justify-center text-xs md:text-sm font-pixel
                hover:scale-110 transition-transform relative min-h-[32px] md:min-h-[40px] lg:min-h-[48px]
                ${getDayColor(date)}
                ${selectedDate && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") 
                  ? "ring-2 md:ring-4 ring-accent" 
                  : ""}
              `}
            >
              <span className="relative">
                {format(date, "d")}
                {hasStar && (
                  <Star 
                    className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 md:w-2 md:h-2 ${getStarColor(date)}`}
                    fill="currentColor"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

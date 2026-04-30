import { AlertTriangle } from "lucide-react";

export const DataPersistenceBanner = () => {
  return (
    <div className="sticky top-16 z-30 bg-secondary/15 border-b border-secondary/30 backdrop-blur-md">
      <div className="container-narrow flex items-start gap-2.5 py-2.5 px-4 md:px-6">
        <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-xs md:text-sm text-foreground/80 leading-snug">
          <span className="font-medium text-foreground">Important:</span> Your data is not saved automatically.
          Please complete your work without exiting the page and download your CSV before leaving.
        </p>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useDosage } from '@/contexts/DosageContext';
import { formatCountdown, getRiskBorderClass, getRiskColorClass } from '@/utils/dosageUtils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RiskLevel } from '@/types/types';
import { AlertTriangle, Check } from 'lucide-react';

const DosageButton: React.FC = () => {
  const { 
    addDosage, 
    riskLevel, 
    timeRemaining, 
    activeSession, 
    settings 
  } = useDosage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [dosageAmount, setDosageAmount] = useState(settings.defaultDosage.toString());
  const [dosageNote, setDosageNote] = useState('');

  const handleButtonClick = () => {
    if (riskLevel === 'safe') {
      setIsDialogOpen(true);
    } else {
      setIsWarningOpen(true);
    }
  };

  const handleConfirmDosage = () => {
    addDosage(parseFloat(dosageAmount) || settings.defaultDosage, dosageNote);
    setDosageAmount(settings.defaultDosage.toString());
    setDosageNote('');
    setIsDialogOpen(false);
  };

  const handleOverrideDosage = () => {
    setIsWarningOpen(false);
    setIsDialogOpen(true);
  };

  // Utility function to determine the button label
  const getButtonLabel = (): string => {
    if (!activeSession) return 'Start Session';
    if (timeRemaining <= 0) return 'Safe to Dose';
    return formatCountdown(timeRemaining);
  };

  // Get the CSS classes for different risk levels
  const getRiskClasses = (level: RiskLevel): string => {
    if (level === 'safe') return 'bg-safe/10 text-safe';
    if (level === 'warning') return 'bg-warning/10 text-warning';
    return 'bg-danger/10 text-danger';
  };

  // Get icon for warning dialog
  const WarningIcon = () => {
    if (riskLevel === 'warning') {
      return <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" strokeWidth={1.5} />;
    } else {
      return <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" strokeWidth={1.5} />;
    }
  };

  return (
    <>
      <div className="w-full flex flex-col items-center justify-center py-6">
        <div className="text-center mb-4">
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getRiskClasses(riskLevel)}`}>
            {riskLevel === 'safe' ? 'Safe to dose' : (
              riskLevel === 'warning' ? 'Caution Period' : 'Unsafe Period'
            )}
          </div>
        </div>
        
        <button
          onClick={handleButtonClick}
          className={`relative w-48 h-48 rounded-full flex items-center justify-center text-2xl font-semibold button-active
            ${getRiskBorderClass(riskLevel)} border-4 glass-panel ${getRiskColorClass(riskLevel)}`}
        >
          {activeSession && timeRemaining > 0 && (
            <div className={`absolute inset-0 rounded-full ${getRiskBorderClass(riskLevel)} opacity-40`}
                 style={{
                   transform: `scale(${1 - (timeRemaining / (settings.safeInterval * 60 * 1000))})`,
                   transition: 'transform 1s linear'
                 }}
            />
          )}
          
          {/* Pulsing animation for safe status */}
          {riskLevel === 'safe' && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-safe opacity-40 animate-pulse-ring" />
              <div className="absolute -inset-1 rounded-full border-2 border-safe opacity-20 animate-pulse-ring" 
                   style={{ animationDelay: '0.4s' }} />
            </>
          )}
          
          <span className="scale-in">
            {getButtonLabel()}
          </span>
        </button>
        
        <div className="text-center mt-4 scale-in">
          <span className="text-sm text-muted-foreground">
            {activeSession
              ? 'Tap to log a new intake'
              : 'Tap to start tracking'}
          </span>
        </div>
      </div>

      {/* Dosage input dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle>Log Intake</DialogTitle>
            <DialogDescription>
              Enter the amount and any notes about this dose.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dosage-amount">Amount (ml)</Label>
              <Input
                id="dosage-amount"
                type="number"
                step="0.1"
                min="0.1"
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dosage-note">Notes (optional)</Label>
              <Textarea
                id="dosage-note"
                value={dosageNote}
                onChange={(e) => setDosageNote(e.target.value)}
                placeholder="Any additional details..."
                className="min-h-20"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDosage} className="bg-primary hover:bg-primary/90">
              <Check className="mr-2 h-4 w-4" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <WarningIcon />
            <DialogTitle className="text-center text-xl">
              {riskLevel === 'warning' ? 'Caution: Approaching Safe Window' : 'Warning: Unsafe Timing'}
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              {riskLevel === 'warning'
                ? `It's recommended to wait ${formatCountdown(timeRemaining)} longer before your next dose.`
                : `It's unsafe to dose now. Please wait ${formatCountdown(timeRemaining)} for a safe window.`}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsWarningOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleOverrideDosage} 
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Override & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DosageButton;
